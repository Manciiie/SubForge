'use strict';
// Écran « Traduire » + écran « Moteurs » : canaux IPC et file de traduction.
// Le travail (lecture, ffmpeg, réseau) se fait ici, dans le processus principal, jamais dans l'interface.

const { app, net, shell, dialog, BrowserWindow, clipboard } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { canal } = require('../ipc');
const { ErreurSecurite } = require('../securite');
const parametres = require('../parametres');
const journal = require('../journal');
const formats = require('./formats');
const video = require('./video');
const langues = require('./langues');
const { creerMoteurs, adresseOllamaValide, normaliserAdresse } = require('./moteurs');
const { creerMemoire } = require('./memoire');
const { creerGlossaire } = require('./glossaire');
const { creerExpressions, trouver: trouverExpressions } = require('./expressions');
const { traduireDocument } = require('./pipeline');
const dossiers = require('./dossiers');
const pgs = require('./pgs');
const { creerOcr, versSrt: ocrVersSrt } = require('./ocr');
const synchro = require('./synchro');
const { creerLimite, aLaChaine } = require('./limite');
const { creerContexte, texteContexte, formeJeton } = require('./contexte');
const conseils = require('./conseils-ia');
const { argumentsCommande } = require('../securite');
const { creerEnLigne, CODES_OS } = require('./enligne');

const SECRET_DEEPL = 'cle_deepl';
const SECRET_OS_CLE = 'cle_opensubtitles';
const SECRET_OS_MDP = 'mdp_opensubtitles';
const SECRET_TMDB = 'jeton_tmdb';
const CODES = langues.codes();

let moteurs = null;
let memoire = null;
let ocr = null;
let enLigne = null;
let contexteFilms = null;
const telechargementsEnCours = new Set();
let glossaire = null;
let expressions = null;
let binaireFfmpeg = null;
let tache = null;              // { controleur, expediteur }
const resultats = new Map();   // id d'élément → { paires, sortie }
const sortiesProduites = new Set();

function reglages() {
  const p = parametres.lire();
  return {
    traduction: { source: 'auto', cible: 'fr', moteur: 'deepl', formatSortie: 'identique', dossierSortie: null, memoire: true, resultatFilm: 'film', synchro: true, relecture: true, relectureCiblee: false, registre: 'auto', contexte: true, ...(p.traduction || {}) },
    deepl: { formalite: 'defaut', ...(p.deepl || {}) },
    ollama: { adresse: 'http://127.0.0.1:11434', modele: '', parallele: 2, garderCharge: true, lotsAdaptes: true, ...(p.ollama || {}) },
    enligne: { utilisateur: '', ...(p.enligne || {}) },
  };
}

function envoyer(evenement) {
  const e = tache?.expediteur;
  if (e && !e.isDestroyed()) e.send('traduction:progression', evenement);
}

// --- Analyse des fichiers déposés ---------------------------------------------------

function langueDuNom(chemin) {
  const indice = /\.([a-z]{2,3}(?:-[A-Za-z]{2,4})?)\.(srt|ass|ssa|vtt|sup)$/i.exec(chemin);
  return indice ? langues.depuisIso3(indice[1]) : null;
}

// Langue à lire par OCR quand la piste ne la précise pas : la langue source choisie, sinon l'anglais.
function sourceOuAnglais() {
  const s = reglages().traduction.source;
  return s && s !== 'auto' ? s : 'en';
}

async function analyserUn(chemin) {
  const base = { chemin, nom: path.basename(chemin) };
  try {
    const stat = fs.statSync(chemin);
    if (!stat.isFile()) throw new Error('Ce n\'est pas un fichier.');
    if (formats.formatDepuisChemin(chemin)) {
      const doc = formats.lireFichier(chemin);
      const l = langueDuNom(chemin);
      return { ...base, type: 'soustitre', format: doc.format, encodage: doc.encodage, repliques: doc.repliques.length, langue: l?.code || null, nomLangue: l?.nom || null };
    }
    if (path.extname(chemin).toLowerCase() === '.sup') {
      if (stat.size > pgs.TAILLE_MAX) throw new Error('Fichier .sup trop gros (plus de 200 Mo).');
      const repliques = pgs.compter(fs.readFileSync(chemin));
      if (!repliques) throw new Error('Aucune réplique dans ce fichier .sup.');
      const l = langueDuNom(chemin);
      const langueOcr = l?.code || sourceOuAnglais();
      if (!ocr.disponible(langueOcr)) throw new Error(`Lecture des sous-titres en image non disponible pour ${langues.langue(langueOcr)?.nom || langueOcr}.`);
      return { ...base, type: 'sup', repliques, langue: l?.code || null, nomLangue: l?.nom || null };
    }
    if (video.estVideo(chemin)) {
      const pistes = await video.listerPistes(binaireFfmpeg, chemin);
      // Piste Blu-ray (image) : utilisable si l'OCR connaît sa langue.
      for (const p of pistes) p.ocr = video.estPgs(p) && ocr.disponible(p.langue || sourceOuAnglais());
      return { ...base, type: 'video', taille: stat.size, pistes };
    }
    throw new Error('Type de fichier non pris en charge : sous-titres (SRT, ASS, SSA, VTT, SUP) ou vidéo (MKV, MP4, AVI…).');
  } catch (e) {
    return { ...base, type: 'erreur', erreur: e.message };
  }
}

// --- Traduction d'un élément --------------------------------------------------------

// Un fichier de la file, en trois étapes (1.8) : préparer (extraction, OCR, lecture, contexte, écoute
// du son lancée), traduire (moteur + relecture), finaliser (minutages, écriture, ajout au film). Dans
// une saison, l'étape « préparer » du fichier suivant et « finaliser » du précédent tournent pendant
// la traduction du fichier en cours (voir enchainer()). Une erreur arrête ce fichier seulement.
function creerTravail(el, optionsBase, signal) {
  const rapporter = (etat, extra = {}) => envoyer({ id: el.id, etat, ...extra });
  let options = { ...optionsBase };
  let extraction = null;
  let dossierPiste = null; // dossier temporaire du sous-titre quand il ne va que dans le film
  // Arrête l'analyse du son si ce fichier échoue ou si tout est annulé.
  const synchroSignal = new AbortController();
  const relaisAnnulation = () => synchroSignal.abort();
  signal.addEventListener('abort', relaisAnnulation, { once: true });
  let fini = false;
  let fichier = el.chemin;
  let sup = null;
  let doc = null;
  let bilanOcr = null;
  let estFilm = false;
  let filmAssocie = null;
  let synchroPromesse = null;
  let bilanContexte = null;
  let original = null;
  let bilan = null;

  // Progression de la carte : préparation, traduction, relecture et synchronisation peuvent avancer en
  // même temps (1.6, 1.8).
  const progression = { phase: 'preparation', trad: { fait: 0, total: 0 }, relu: null, tradFinie: false, synchroPct: null, attenteSynchro: false };
  const synchroAffichee = () => (progression.synchroPct !== null && progression.synchroPct < 100 ? progression.synchroPct : null);
  const publier = () => {
    if (fini) return;
    if (progression.phase === 'attente') {
      rapporter('attente', { message: 'Préparé : attend son tour.', synchroPct: synchroAffichee() });
    } else if (progression.phase !== 'traduction') {
      // Préparation ou finalisation : l'étape en cours a déjà envoyé son propre état.
    } else if (!progression.tradFinie) {
      rapporter('traduction', { ...progression.trad, relu: progression.relu, synchroPct: synchroAffichee() });
    } else if (progression.relu && progression.relu.fait < progression.relu.total) {
      rapporter('relecture', { ...progression.relu, message: 'Relecture par l\'IA…', synchroPct: synchroAffichee() });
    }
  };

  function echouer(e) {
    if (fini) return;
    fini = true;
    if (e.name === 'AbortError' || signal.aborted) {
      rapporter('annule', { message: 'Annulé.' });
    } else {
      // Certaines bibliothèques (Tesseract) rejettent avec une simple chaîne : message toujours renseigné.
      const message = (e instanceof Error ? e.message : String(e ?? '')) || 'Erreur inconnue (voir le journal).';
      journal.erreur(`[traduction] échec pour ${path.basename(el.chemin)} :`, e);
      rapporter('erreur', { message });
    }
    nettoyer();
  }

  function nettoyer() {
    synchroSignal.abort();
    signal.removeEventListener('abort', relaisAnnulation);
    extraction?.nettoyer();
    extraction = null;
    if (dossierPiste) {
      try { fs.rmSync(dossierPiste, { recursive: true, force: true }); } catch (e) { journal.erreur('[traduction] dossier temporaire non supprimé :', e); }
      dossierPiste = null;
    }
  }

  // Étape 1 : préparer.
  async function preparer() {
    if (fini) return;
    try {
      if (signal.aborted) throw Object.assign(new Error('Annulé.'), { name: 'AbortError' });
      sup = path.extname(el.chemin).toLowerCase() === '.sup' ? el.chemin : null;
      let langueOcr = sup ? langueDuNom(el.chemin)?.code : null;
      if (video.estVideo(el.chemin)) {
        rapporter('extraction', { message: 'Extraction de la piste…' });
        const pistes = await video.listerPistes(binaireFfmpeg, el.chemin, { signal });
        const piste = pistes.find((p) => p.indice === el.piste);
        if (!piste) throw new Error('Piste de sous-titres introuvable dans cette vidéo.');
        extraction = await video.extrairePiste(binaireFfmpeg, el.chemin, piste, { signal });
        fichier = extraction.fichier;
        if (video.estPgs(piste)) { sup = fichier; langueOcr = piste.langue; }
      }

      if (sup) {
        // Blu-ray : images → texte (OCR), enregistré à côté du film, puis traduit comme un sous-titre normal.
        langueOcr = langueOcr || sourceOuAnglais();
        const lu = pgs.lireSup(fs.readFileSync(sup));
        if (!lu.repliques.length) throw new Error('Aucune image lisible dans ces sous-titres Blu-ray.');
        rapporter('ocr', { fait: 0, total: lu.repliques.length, message: 'Lecture des images (OCR)…' });
        const textes = await ocr.lire(lu.repliques.map((r) => r.image), {
          langue: langueOcr, signal, surAvancement: (fait, total) => rapporter('ocr', { fait, total }),
        });
        doc = ocrVersSrt(lu.repliques, textes);
        if (!doc.repliques.length) throw new Error('Aucun texte n\'a pu être lu dans ces images.');
        const dossierOcr = options.dossierSortie || path.dirname(el.chemin);
        const fichierOcr = formats.nomSortie(el.chemin, langues.suffixe(langueOcr), '.srt', dossierOcr);
        formats.ecrireFichier(fichierOcr, doc);
        sortiesProduites.add(fichierOcr);
        bilanOcr = {
          images: lu.repliques.length,
          lues: doc.repliques.length,
          douteuses: textes.filter((x) => x.texte && x.confiance < 60).length,
          illisibles: lu.abimes + (lu.repliques.length - doc.repliques.length),
          fichier: path.basename(fichierOcr),
        };
        journal.info(`[ocr] ${path.basename(el.chemin)} : ${bilanOcr.lues}/${bilanOcr.images} images lues → ${bilanOcr.fichier}`);
        if (options.source === 'auto') options = { ...options, source: langueOcr };
      } else {
        doc = formats.lireFichier(fichier);
      }
      formats.preparerConversionAss(doc);

      // Sous-titre externe : vidéo d'origine à côté (recalage sur son son, puis ajout de la piste).
      estFilm = video.estVideo(el.chemin);
      filmAssocie = !estFilm && !sup && (options.synchro || options.resultatFilm !== 'fichier') ? dossiers.videoAssociee(el.chemin) : null;
      // Synchronisation (T601) : le son du film est analysé pendant la suite ; les minutages sont
      // appliqués à la finalisation, avant l'écriture.
      if (filmAssocie && options.synchro) {
        progression.synchroPct = 0;
        synchroPromesse = calculerSynchro(formats.lireMinutages(doc), filmAssocie, synchroSignal.signal, (pct) => { progression.synchroPct = pct; publier(); });
        synchroPromesse.catch(() => {}); // silence-ok: le résultat (ou l'erreur) est attendu à la finalisation
      }

      original = doc.repliques.map((r) => formats.texteVisible(r.texte));

      // Contexte du film (T501) : titre, résumé, personnages et genre, pour le moteur et la relecture.
      if (options.contexte) {
        try {
          const c = await contexteFilms.pour(el.chemin, { signal });
          if (c.etat === 'trouve') {
            options = { ...options, contexteFilm: texteContexte(c.contexte), personnages: c.contexte.personnages.map((x) => x.personnage) };
            bilanContexte = { titre: c.contexte.titre, annee: c.contexte.annee, personnages: c.contexte.personnages.length, episode: c.contexte.episode };
          }
        } catch (e) {
          if (e.name === 'AbortError' || signal.aborted) throw e;
          journal.avertissement(`[contexte] ${path.basename(el.chemin)} : ${e.message}`);
          bilanContexte = { erreur: e.message };
        }
      }
      progression.phase = 'attente';
      publier();
    } catch (e) {
      echouer(e);
    }
  }

  // Étape 2 : traduire (moteur + relecture).
  async function traduire() {
    if (fini) return;
    try {
      if (signal.aborted) throw Object.assign(new Error('Annulé.'), { name: 'AbortError' });
      progression.phase = 'traduction';
      rapporter('traduction', { fait: 0, total: 0, message: 'Traduction…', synchroPct: synchroAffichee() });
      bilan = await traduireDocument(doc, {
        moteurs, memoire, glossairePrepare: glossaire.pour(options.cible), expressionsPreparees: expressions.pour({ source: options.source, cible: options.cible }), options, signal,
        surAvancement: (fait, total) => { progression.trad = { fait, total }; if (fait >= total) progression.tradFinie = true; publier(); },
        // Relecture par l'IA locale (T402), avec DeepL comme avec l'IA locale, dès qu'un modèle est choisi.
        relecture: options.relecture && options.modele ? {
          relire: (lignes, sig, extra = {}) => moteurs.relireScene(lignes, { ...options, ...extra, signal: sig || signal }),
          surAvancement: (fait, total) => { progression.relu = { fait, total }; publier(); },
          ciblee: options.relectureCiblee === true,
        } : null,
      });
      progression.tradFinie = true;
      progression.phase = 'finalisation';
      if (options.relecture && !options.modele) bilan.relecture = { indisponible: true };
      if (bilan.relecture) journal.info(`[relecture] ${path.basename(el.chemin)} : ${JSON.stringify(bilan.relecture)}`);
      rapporter('ecriture', { message: 'En attente de l\'enregistrement…', synchroPct: synchroAffichee() });
    } catch (e) {
      echouer(e);
    }
  }

  // Étape 3 : finaliser (minutages recalés, écriture, ajout au film).
  async function finaliser() {
    if (fini) return;
    try {
      if (signal.aborted) throw Object.assign(new Error('Annulé.'), { name: 'AbortError' });
      let bilanSynchro = null;
      if (synchroPromesse) {
        if (progression.synchroPct !== null && progression.synchroPct < 100) {
          rapporter('synchro', { fait: progression.synchroPct || 0, total: 100, message: 'Synchronisation sur le son du film…' });
        }
        progression.phase = 'synchro';
        const finSynchro = (pct) => rapporter('synchro', { fait: pct, total: 100, message: 'Synchronisation sur le son du film…' });
        const attente = setInterval(() => { if (progression.synchroPct !== null && progression.synchroPct < 100) finSynchro(progression.synchroPct); }, 500);
        let sy;
        try { sy = await synchroPromesse; } finally { clearInterval(attente); }
        bilanSynchro = sy.bilan;
        if (sy.recalage) bilanSynchro.retirees = formats.appliquerMinutages(doc, synchro.transformation(sy.recalage));
      }
      const notes = bilan.notes;
      delete bilan.notes;

      rapporter('ecriture', { message: 'Enregistrement…' });
      const docSortie = options.formatSortie === 'srt' ? formats.versSrt(doc) : doc;
      const ext = docSortie.format === 'ass' ? (path.extname(fichier).toLowerCase() === '.ssa' ? '.ssa' : '.ass') : `.${docSortie.format}`;
      const dossier = options.dossierSortie || path.dirname(el.chemin);
      const filmCible = estFilm ? el.chemin : filmAssocie;
      const mode = filmCible ? options.resultatFilm : 'fichier';
      // « Film seul » : le sous-titre traduit ne passe que par un dossier temporaire, puis va dans le film.
      const cibleAcote = formats.nomSortie(el.chemin, langues.suffixe(options.cible), ext, dossier);
      let cible = cibleAcote;
      const filmSeul = mode === 'film' || mode === 'remplacer'; // pas de sous-titre séparé à côté
      if (filmSeul) {
        dossierPiste = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-piste-'));
        cible = path.join(dossierPiste, path.basename(cibleAcote));
      }
      formats.ecrireFichier(cible, docSortie);
      if (!filmSeul) sortiesProduites.add(cible);

      // Aperçu : les 400 premières répliques, plus toutes celles corrigées ou signalées par la relecture.
      const paires = [];
      doc.repliques.forEach((r, i) => {
        if (i >= 400 && !notes.has(i)) return;
        if (paires.length >= 1500) return;
        paires.push({ numero: i + 1, debut: r.debut, original: original[i], traduit: formats.texteVisible(r.texte), note: notes.get(i) || null });
      });
      journal.info(`Traduit : ${path.basename(el.chemin)} → ${path.basename(cibleAcote)} (${bilan.segments} segments, ${bilan.envoyes} envoyés, ${bilan.repris} repris de la mémoire, ${options.moteur})`);

      // Film avec la piste traduite. Un échec ici ne perd jamais la traduction : elle est alors
      // enregistrée à côté du film comme un sous-titre normal.
      let integration = null;
      let sortie = cible;
      if (mode !== 'fichier') {
        // La piste ajoutée au film est toujours en SRT : le Lecteur multimédia de Windows et
        // Films et TV n'affichent pas les pistes ASS d'un MKV (VLC, lui, lit les deux).
        let piste = cible;
        if (docSortie.format !== 'srt') {
          if (!dossierPiste) dossierPiste = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-piste-'));
          piste = path.join(dossierPiste, 'piste-film.srt');
          formats.ecrireFichier(piste, formats.versSrt(doc));
        }
        integration = await integrerAuFilm(filmCible, piste, options, signal, (part) => rapporter('integration', { fait: Math.round(part * 100), total: 100, message: 'Ajout de la piste au film…' }));
        if (filmSeul) {
          if (integration.fichier) {
            sortie = integration.fichier;
            integration.seul = true;
          } else {
            fs.copyFileSync(cible, cibleAcote, fs.constants.COPYFILE_EXCL);
            sortiesProduites.add(cibleAcote);
            sortie = cibleAcote;
            integration.secours = path.basename(cibleAcote);
          }
        }
      }
      resultats.set(el.id, { paires, sortie, total: doc.repliques.length });
      fini = true;
      rapporter('termine', { sortie, nomSortie: path.basename(sortie), repliques: doc.repliques.length, bilan: { ...bilan, ocr: bilanOcr, integration, synchro: bilanSynchro, contexte: bilanContexte } });
      nettoyer();
    } catch (e) {
      echouer(e);
    }
  }

  return { preparer, traduire, finaliser };
}

// File de traduction (1.8, « saisons à la chaîne ») : voir limite.aLaChaine.
function enchainer(elements, options, signal) {
  return aLaChaine(elements.map((el) => creerTravail(el, options, signal)));
}

// Calcule le recalage des minutages sur le son du film, sans toucher au document (T601 : tourne
// pendant la traduction). Ne fait jamais échouer la traduction : renvoie { bilan, recalage }.
async function calculerSynchro(minutages, film, signal, surPct) {
  try {
    surPct(0);
    const description = await video.executer(binaireFfmpeg, ['-hide_banner', '-nostdin', '-i', film], { signal, delai: 60000 });
    const duree = video.lireDuree(description.erreurs);
    const energies = await synchro.analyserSon(binaireFfmpeg, film, {
      signal, dureeMs: duree ? duree * 1000 : null,
      surAvancement: (part) => surPct(Math.round(part * 90)),
    });
    surPct(92);
    const r = await synchro.trouverDecalage(energies, minutages, { signal });
    surPct(100);
    journal.info(`[synchro] ${path.basename(film)} : ${r.raison}${r.applique ? ` (décalage ${r.decalageMs} ms, vitesse ${r.vitesse.toFixed(5)}, netteté ${r.nettete.toFixed(1)})` : r.nettete ? ` (netteté ${r.nettete.toFixed(1)})` : ''}`);
    return {
      bilan: { film: path.basename(film), raison: r.raison, decalageMs: r.decalageMs, vitesse: synchro.libelleVitesse(r.vitesse ?? 1) },
      recalage: r.applique ? r : null,
    };
  } catch (e) {
    if (e.name === 'AbortError' || signal.aborted) throw e;
    journal.erreur(`[synchro] ${path.basename(film)} :`, e);
    return { bilan: { film: path.basename(film), erreur: e.message }, recalage: null };
  }
}

// Film.FR.mkv à côté du film (ou dans le dossier de sortie). Renvoie { fichier, nom } ou { erreur }.
async function integrerAuFilm(film, sousTitre, options, signal, surAvancement) {
  const l = langues.langue(options.cible);
  const remplacer = options.resultatFilm === 'remplacer';
  // Remplacement (1.9) : la nouvelle version s'écrit à côté de l'original, quel que soit le dossier de sortie.
  const dossier = remplacer ? path.dirname(film) : (options.dossierSortie || path.dirname(film));
  let enCours = null;
  try {
    const taille = fs.statSync(film).size;
    const libre = (() => { const s = fs.statfsSync(dossier); return Number(s.bavail) * Number(s.bsize); })();
    if (libre < taille * 1.02 + 50 * 1024 * 1024) {
      const go = (n) => `${(n / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go`;
      throw new Error(`pas assez de place sur le disque (il faut ${go(taille)}, il reste ${go(libre)})`);
    }
    const copieNommee = () => formats.nomSortie(film, langues.suffixe(options.cible).toUpperCase(), '.mkv', dossier);
    const base = path.basename(film, path.extname(film));
    const sortie = remplacer ? path.join(dossier, `${base}.subforge-en-cours.mkv`) : copieNommee();
    if (remplacer) fs.rmSync(sortie, { force: true }); // reste d'un essai interrompu : à nous
    enCours = remplacer ? sortie : null;
    surAvancement(0);
    await video.integrerPiste(binaireFfmpeg, film, sousTitre, {
      sortie, langueIso3: l?.iso3?.[0] || 'und', titre: l?.nom || options.cible, signal, surAvancement,
    });
    if (!remplacer) {
      sortiesProduites.add(sortie);
      journal.info(`[intégration] ${path.basename(film)} → ${path.basename(sortie)}`);
      return { fichier: sortie, nom: path.basename(sortie) };
    }

    // Remplacement : vérifier la nouvelle version, envoyer l'original à la corbeille, prendre sa place.
    const v = await video.verifierCopie(binaireFfmpeg, film, sortie, { signal });
    if (!v.ok) throw new Error(`nouvelle version incomplète (${v.raison}) : le film d'origine est gardé`);
    const finale = path.join(dossier, `${base}.mkv`);
    const garderLesDeux = (raison) => {
      const copie = copieNommee();
      fs.renameSync(sortie, copie);
      enCours = null;
      sortiesProduites.add(copie);
      journal.avertissement(`[intégration] ${path.basename(film)} : original gardé (${raison}) → ${path.basename(copie)}`);
      return { fichier: copie, nom: path.basename(copie), avertissement: `film d'origine gardé (${raison}) : la version avec la piste est à côté` };
    };
    if (finale !== film && fs.existsSync(finale)) return garderLesDeux(`« ${path.basename(finale)} » existe déjà`);
    try {
      await mettreALaCorbeille(film);
    } catch (e) {
      return garderLesDeux(`corbeille impossible : ${e.message}`);
    }
    fs.renameSync(sortie, finale);
    enCours = null;
    sortiesProduites.add(finale);
    journal.info(`[intégration] ${path.basename(film)} remplacé par la version avec la piste (original à la corbeille) → ${path.basename(finale)}`);
    return { fichier: finale, nom: path.basename(finale), remplace: true, ancien: path.basename(film) };
  } catch (e) {
    if (enCours) {
      try { fs.rmSync(enCours, { force: true }); } catch (err) { journal.erreur('[intégration] fichier en cours non supprimé :', err); }
    }
    if (e.name === 'AbortError' || signal.aborted) throw e;
    journal.erreur(`[intégration] ${path.basename(film)} :`, e);
    return { erreur: e.message };
  }
}

// Corbeille de Windows (récupérable). Dossier de test à la place, seulement hors version installée.
function mettreALaCorbeille(chemin) {
  const test = !app.isPackaged && process.env.SUBFORGE_CORBEILLE_TEST;
  if (test) {
    fs.mkdirSync(test, { recursive: true });
    fs.renameSync(chemin, path.join(test, path.basename(chemin)));
    return Promise.resolve();
  }
  return shell.trashItem(chemin);
}

// --- Canaux -------------------------------------------------------------------------

function enregistrer({ racineApp }) {
  binaireFfmpeg = video.cheminFfmpeg({ empaquete: app.isPackaged, resourcesPath: process.resourcesPath, racineApp });
  // Adresse DeepL de test (faux serveur) : jamais prise en compte dans la version installée.
  const urlTest = !app.isPackaged && process.env.SUBFORGE_DEEPL_URL_TEST ? process.env.SUBFORGE_DEEPL_URL_TEST : null;
  moteurs = creerMoteurs({ fetch: (u, o) => net.fetch(u, o), lireCleDeepl: () => parametres.lireSecret(SECRET_DEEPL), urlDeeplTest: urlTest, journal });

  const donnees = app.getPath('userData');
  memoire = creerMemoire({ fichier: path.join(donnees, 'memoire-traduction.jsonl'), journal });
  // Mémoire de traduction lue en arrière-plan juste après l'ouverture (1.7).
  setTimeout(() => {
    const debut = Date.now();
    memoire.precharger()
      .then((fait) => { if (fait) journal.info(`[mémoire] préchargée en ${Date.now() - debut} ms (${memoire.etat().entrees} répliques)`); })
      .catch((e) => journal.erreur('[mémoire] préchargement :', e));
  }, 1500);
  glossaire = creerGlossaire({ fichier: path.join(donnees, 'glossaire.json'), journal });
  expressions = creerExpressions({ fichier: path.join(donnees, 'expressions.json'), codesLangues: CODES, journal });
  // OCR : données de langue hors de app.asar, travailleur Tesseract dans app.asar.unpacked (fichiers réels).
  const dossierLangues = app.isPackaged ? path.join(process.resourcesPath, 'tessdata') : path.join(racineApp, 'vendor', 'tessdata');
  const cheminTravailleur = app.isPackaged
    ? require.resolve('tesseract.js/src/worker-script/node/index.js').replace(/app\.asar([\\/])/, 'app.asar.unpacked$1')
    : null;
  ocr = creerOcr({ dossierLangues, cheminTravailleur, journal });
  // Adresse OpenSubtitles de test (faux serveur) : jamais prise en compte dans la version installée.
  const urlOsTest = !app.isPackaged && process.env.SUBFORGE_OS_URL_TEST ? process.env.SUBFORGE_OS_URL_TEST : null;
  // Adresse TMDB de test (faux serveur) : jamais prise en compte dans la version installée.
  const urlTmdbTest = !app.isPackaged && process.env.SUBFORGE_TMDB_URL_TEST ? process.env.SUBFORGE_TMDB_URL_TEST : null;
  contexteFilms = creerContexte({
    fetch: (u, o) => net.fetch(u, o),
    lireJeton: () => parametres.lireSecret(SECRET_TMDB),
    fichierCache: path.join(donnees, 'contexte-films.json'),
    urlTest: urlTmdbTest,
    journal,
  });
  enLigne = creerEnLigne({
    fetch: (u, o) => net.fetch(u, o),
    lireSecrets: () => ({ cle: parametres.lireSecret(SECRET_OS_CLE), motDePasse: parametres.lireSecret(SECRET_OS_MDP) }),
    utilisateur: () => reglages().enligne.utilisateur,
    version: app.getVersion(),
    urlTest: urlOsTest,
    journal,
  });

  app.on('before-quit', () => { tache?.controleur.abort(); video.toutArreter(); });

  canal('traduction:langues', [], () => langues.LANGUES.map((l) => ({ code: l.code, nom: l.nom, deepl: Boolean(l.deeplCible) })));

  canal('traduction:reglages', [], () => reglages());

  canal('traduction:modifierReglages', [{
    type: 'objet',
    champs: {
      source: { type: 'enum', valeurs: ['auto', ...CODES], optionnel: true },
      cible: { type: 'enum', valeurs: CODES, optionnel: true },
      moteur: { type: 'enum', valeurs: ['deepl', 'ollama'], optionnel: true },
      formatSortie: { type: 'enum', valeurs: ['identique', 'srt'], optionnel: true },
      dossierSortie: { type: 'chemin', max: 4096, optionnel: true },
      viderDossierSortie: { type: 'boolean', optionnel: true },
      formalite: { type: 'enum', valeurs: ['defaut', 'formel', 'informel'], optionnel: true },
      adresseOllama: { type: 'string', max: 300, optionnel: true },
      modeleOllama: { type: 'string', max: 200, optionnel: true },
      paralleleOllama: { type: 'enum', valeurs: [1, 2, 3, 4], optionnel: true },
      garderChargeOllama: { type: 'boolean', optionnel: true },
      lotsAdaptesOllama: { type: 'boolean', optionnel: true },
      memoire: { type: 'boolean', optionnel: true },
      resultatFilm: { type: 'enum', valeurs: ['film', 'film-et-fichier', 'fichier', 'remplacer'], optionnel: true },
      synchro: { type: 'boolean', optionnel: true },
      relecture: { type: 'boolean', optionnel: true },
      registre: { type: 'enum', valeurs: ['auto', 'tu', 'vous'], optionnel: true },
      contexte: { type: 'boolean', optionnel: true },
      relectureCiblee: { type: 'boolean', optionnel: true },
    },
  }], (_e, o) => {
    const r = reglages();
    for (const c of ['source', 'cible', 'moteur', 'formatSortie', 'memoire', 'resultatFilm', 'synchro', 'relecture', 'registre', 'contexte', 'relectureCiblee']) if (o[c] !== undefined) r.traduction[c] = o[c];
    if (o.viderDossierSortie) r.traduction.dossierSortie = null;
    if (o.dossierSortie !== undefined && o.dossierSortie !== null) {
      if (!path.isAbsolute(o.dossierSortie) || !fs.existsSync(o.dossierSortie)) throw new ErreurSecurite('Dossier de sortie introuvable.');
      r.traduction.dossierSortie = o.dossierSortie;
    }
    if (o.formalite !== undefined) r.deepl.formalite = o.formalite;
    if (o.adresseOllama !== undefined) {
      const a = normaliserAdresse(o.adresseOllama);
      if (!adresseOllamaValide(a)) throw new ErreurSecurite('Adresse refusée : http:// seulement vers ce PC ou le réseau local, sinon https://.'); // securite-ok: Ollama tourne sur ce PC, HTTP limité au local (adresseOllamaValide)
      r.ollama.adresse = a;
    }
    if (o.modeleOllama !== undefined) r.ollama.modele = o.modeleOllama;
    if (o.paralleleOllama !== undefined) r.ollama.parallele = o.paralleleOllama;
    if (o.garderChargeOllama !== undefined) r.ollama.garderCharge = o.garderChargeOllama;
    if (o.lotsAdaptesOllama !== undefined) r.ollama.lotsAdaptes = o.lotsAdaptesOllama;
    // Modèle changé (ou plus gardé chargé) : celui que SubForge gardait en mémoire est libéré.
    if (o.modeleOllama !== undefined || o.adresseOllama !== undefined || o.garderChargeOllama === false) {
      const garder = o.garderChargeOllama === false ? null : r.ollama.modele;
      moteurs.decharger({ sauf: garder }).catch((e) => journal.avertissement('[ollama] déchargement :', e.message));
    }
    parametres.modifier(r);
    return reglages();
  });

  canal('traduction:choisirDossierSortie', [], async (event) => {
    const res = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: 'Dossier où enregistrer les sous-titres traduits', properties: ['openDirectory', 'createDirectory'],
    });
    return res.canceled ? null : res.filePaths[0];
  });

  // Fichiers et dossiers déposés → liste des fichiers à analyser (saison entière : sous-dossiers compris).
  canal('traduction:explorer', [{ type: 'liste', max: 200, element: { type: 'chemin', max: 4096 } }], (_e, chemins) => {
    if (chemins.some((c) => !path.isAbsolute(c))) throw new ErreurSecurite('Chemin invalide.');
    const r = reglages();
    const res = dossiers.explorer(chemins, { cible: r.traduction.cible, source: r.traduction.source });
    if (res.bilan.interdits || res.bilan.tronque) journal.avertissement('[saison] bilan du parcours :', JSON.stringify(res.bilan));
    return res;
  });

  canal('traduction:analyser', [{ type: 'liste', max: 1000, element: { type: 'chemin', max: 4096 } }], async (_e, chemins) => {
    const sortie = [];
    for (const c of chemins) {
      if (!path.isAbsolute(c)) { sortie.push({ chemin: c, nom: c, type: 'erreur', erreur: 'Chemin invalide.' }); continue; }
      sortie.push(await analyserUn(c));
    }
    return sortie;
  });

  canal('traduction:lancer', [{
    type: 'liste', max: 1000,
    element: { type: 'objet', champs: { id: { type: 'string', max: 64 }, chemin: { type: 'chemin', max: 4096 }, piste: { type: 'number', min: 0, max: 999, optionnel: true } } },
  }], async (event, elements) => {
    if (tache) throw new Error('Une traduction est déjà en cours.');
    const r = reglages();
    const options = {
      moteur: r.traduction.moteur,
      source: r.traduction.source,
      cible: r.traduction.cible,
      formatSortie: r.traduction.formatSortie,
      resultatFilm: ['film', 'film-et-fichier', 'fichier', 'remplacer'].includes(r.traduction.resultatFilm) ? r.traduction.resultatFilm : 'film',
      synchro: r.traduction.synchro !== false,
      relecture: r.traduction.relecture !== false,
      registre: ['auto', 'tu', 'vous'].includes(r.traduction.registre) ? r.traduction.registre : 'auto',
      relectureCiblee: r.traduction.relectureCiblee === true,
      contexte: r.traduction.contexte !== false && parametres.secretExiste(SECRET_TMDB),
      dossierSortie: r.traduction.dossierSortie && fs.existsSync(r.traduction.dossierSortie) ? r.traduction.dossierSortie : null,
      formalite: r.deepl.formalite,
      memoire: r.traduction.memoire,
      adresse: r.ollama.adresse,
      modele: r.ollama.modele,
      parallele: [1, 2, 3, 4].includes(r.ollama.parallele) ? r.ollama.parallele : 2,
      garderCharge: r.ollama.garderCharge !== false,
      lotsAdaptes: r.ollama.lotsAdaptes !== false,
    };
    if (options.source !== 'auto' && options.source === options.cible) throw new Error('La langue source et la langue cible sont identiques.');
    if (options.moteur === 'deepl' && !parametres.secretExiste(SECRET_DEEPL)) throw new Error('Aucune clé DeepL : ajoutez-la dans l\'écran Moteurs, ou choisissez l\'IA locale.');
    if (options.moteur === 'deepl' && !langues.langue(options.cible)?.deeplCible) throw new Error('DeepL ne propose pas cette langue cible : choisissez l\'IA locale.');
    if (options.moteur === 'ollama' && !options.modele) throw new Error('Choisissez d\'abord un modèle d\'IA locale dans l\'écran Moteurs.');
    for (const el of elements) if (!path.isAbsolute(el.chemin)) throw new ErreurSecurite('Chemin invalide.');

    tache = { controleur: new AbortController(), expediteur: event.sender };
    const { signal } = tache.controleur;
    (async () => {
      await enchainer(elements, options, signal);
      envoyer({ etat: 'fin' });
      tache = null;
    })().catch((e) => { journal.erreur('File de traduction :', e); envoyer({ etat: 'fin' }); tache = null; });
    return true;
  });

  canal('traduction:annuler', [], () => {
    if (!tache) return false;
    tache.controleur.abort();
    video.toutArreter();
    return true;
  });

  canal('traduction:apercu', [{ type: 'string', max: 64 }], (_e, id) => resultats.get(id) || null);

  // Ouvre l'Explorateur sur un fichier produit par SubForge (et seulement ceux-là).
  canal('traduction:montrer', [{ type: 'chemin', max: 4096 }], (_e, chemin) => {
    if (!sortiesProduites.has(chemin)) throw new ErreurSecurite('Fichier inconnu.');
    shell.showItemInFolder(chemin);
    return true;
  });

  // --- Mémoire de traduction ---
  canal('memoire:etat', [], () => ({ active: reglages().traduction.memoire, ...memoire.etat() }));
  canal('memoire:vider', [], () => {
    if (tache) throw new Error('Impossible pendant une traduction : attendez la fin ou annulez.');
    memoire.vider();
    journal.info('Mémoire de traduction vidée.');
    return memoire.etat();
  });

  // --- Expressions (traduites par leur sens) ---
  canal('expressions:lister', [], () => expressions.lister());
  canal('expressions:enregistrer', [{
    type: 'objet',
    champs: {
      id: { type: 'string', max: 32, optionnel: true },
      expression: { type: 'string', max: 200 },
      sens: { type: 'string', max: 300 },
      equivalent: { type: 'string', max: 200 },
      source: { type: 'enum', valeurs: ['*', ...CODES] },
      cible: { type: 'enum', valeurs: ['*', ...CODES] },
    },
  }], (_e, entree) => expressions.enregistrer(entree));
  canal('expressions:supprimer', [{ type: 'string', max: 32 }], (_e, id) => expressions.supprimer(id));
  canal('expressions:regler', [{
    type: 'objet',
    champs: {
      integrees: { type: 'boolean', optionnel: true },
      id: { type: 'string', max: 16, optionnel: true },
      active: { type: 'boolean', optionnel: true },
    },
  }], (_e, o) => expressions.regler(o));
  canal('expressions:tester', [
    { type: 'string', max: 1000 },
    { type: 'enum', valeurs: ['auto', ...CODES] },
    { type: 'enum', valeurs: CODES },
  ], (_e, texte, source, cible) => trouverExpressions(texte, expressions.pour({ source, cible })));

  // --- Glossaire ---
  canal('glossaire:lister', [], () => glossaire.lister());
  canal('glossaire:enregistrer', [{
    type: 'objet',
    champs: {
      id: { type: 'string', max: 32, optionnel: true },
      terme: { type: 'string', max: 200 },
      traduction: { type: 'string', max: 200 },
      cible: { type: 'enum', valeurs: ['*', ...CODES] },
      casse: { type: 'boolean' },
    },
  }], (_e, entree) => glossaire.enregistrer(entree));
  canal('glossaire:supprimer', [{ type: 'string', max: 32 }], (_e, id) => glossaire.supprimer(id));
  canal('glossaire:importer', [], async (event) => {
    const res = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: 'Importer un glossaire (une ligne par terme : terme;traduction)',
      properties: ['openFile'],
      filters: [{ name: 'Texte ou CSV', extensions: ['csv', 'txt', 'tsv'] }],
    });
    if (res.canceled) return null;
    const f = res.filePaths[0];
    if (fs.statSync(f).size > 2 * 1024 * 1024) throw new Error('Fichier trop gros pour un glossaire (2 Mo au plus).');
    const { texte } = formats.decoder(fs.readFileSync(f));
    const bilan = glossaire.importer(texte, CODES);
    journal.info(`Glossaire importé depuis ${path.basename(f)} : ${bilan.ajoutes} ajoutés, ${bilan.ignores} ignorés`);
    return bilan;
  });

  // --- Contexte du film (TMDB) ---
  canal('contexte:etat', [], () => ({ jeton: parametres.secretExiste(SECRET_TMDB), actif: reglages().traduction.contexte !== false }));
  canal('contexte:enregistrer', [{ type: 'string', max: 1000 }], (_e, jeton) => {
    const j = jeton.trim();
    if (j && !formeJeton(j)) throw new Error('Ce jeton ne ressemble pas à un jeton TMDB : collez le « Jeton d\'accès en lecture à l\'API » (très long, commence par eyJ) ou la « Clé d\'API » (32 caractères).');
    parametres.enregistrerSecret(SECRET_TMDB, j);
    return true;
  });
  canal('contexte:tester', [], () => contexteFilms.tester());
  // Résumé pour la carte : jamais le jeton, seulement ce que TMDB a renvoyé (nettoyé).
  const resumeContexte = (c) => (c.etat === 'trouve'
    ? { etat: 'trouve', titre: c.contexte.titre, annee: c.contexte.annee, type: c.contexte.type, episode: c.contexte.episode, personnages: c.contexte.personnages }
    : c);
  canal('contexte:pour', [{ type: 'chemin', max: 4096 }], async (_e, chemin) => {
    if (!parametres.secretExiste(SECRET_TMDB) || reglages().traduction.contexte === false) return { etat: 'desactive' };
    try { return resumeContexte(await contexteFilms.pour(chemin)); } catch (e) {
      journal.avertissement(`[contexte] ${path.basename(chemin)} : ${e.message}`);
      return { etat: 'erreur', message: e.message };
    }
  });
  canal('contexte:chercher', [{ type: 'string', max: 300 }], (_e, texte) => contexteFilms.chercher(texte));
  canal('contexte:choisir', [
    { type: 'chemin', max: 4096 },
    { type: 'objet', optionnel: true, champs: { type: { type: 'enum', valeurs: ['film', 'serie'] }, id: { type: 'number', min: 1, max: 1e10 } } },
  ], async (_e, chemin, ref) => {
    contexteFilms.choisir(chemin, ref || null);
    return resumeContexte(await contexteFilms.pour(chemin));
  });

  // --- Sous-titres en ligne (OpenSubtitles) ---
  canal('enligne:etat', [], () => ({
    cle: parametres.secretExiste(SECRET_OS_CLE),
    motDePasse: parametres.secretExiste(SECRET_OS_MDP),
    utilisateur: reglages().enligne.utilisateur,
    langues: Object.keys(CODES_OS),
  }));

  canal('enligne:enregistrer', [{
    type: 'objet',
    champs: {
      cle: { type: 'string', max: 200, optionnel: true },
      utilisateur: { type: 'string', max: 100, optionnel: true },
      motDePasse: { type: 'string', max: 200, optionnel: true },
    },
  }], (_e, o) => {
    if (o.cle !== undefined) {
      const c = o.cle.trim();
      if (c && !/^[A-Za-z0-9]{16,64}$/.test(c)) throw new Error('Cette clé ne ressemble pas à une clé d\'API OpenSubtitles (lettres et chiffres, 32 caractères en général).');
      parametres.enregistrerSecret(SECRET_OS_CLE, c);
    }
    if (o.utilisateur !== undefined) {
      const r = reglages();
      r.enligne.utilisateur = o.utilisateur.trim();
      parametres.modifier({ enligne: r.enligne });
    }
    if (o.motDePasse !== undefined) parametres.enregistrerSecret(SECRET_OS_MDP, o.motDePasse);
    enLigne.deconnecter();
    return true;
  });

  canal('enligne:tester', [], () => enLigne.tester());

  const videoExistante = (chemin) => {
    if (!path.isAbsolute(chemin) || !video.estVideo(chemin) || !fs.existsSync(chemin)) throw new ErreurSecurite('Choisissez une vidéo existante.');
  };

  canal('enligne:chercher', [{ type: 'chemin', max: 4096 }, { type: 'enum', valeurs: Object.keys(CODES_OS) }], async (_e, chemin, langue) => {
    videoExistante(chemin);
    const r = await enLigne.chercher(chemin, { langue });
    journal.info(`[en ligne] ${path.basename(chemin)} : ${r.resultats.length} résultat(s) (${r.recherche.langue})`);
    return r;
  });

  // Le fichier reçu doit être un vrai sous-titre lisible ; il est réécrit en UTF-8, sans jamais rien écraser.
  const ecrireTelecharge = (film, contenu, ext, l) => {
    const format = formats.formatDepuisChemin(`x${ext}`);
    let doc;
    try {
      doc = formats.analyser(formats.decoder(contenu).texte, format);
    } catch (e) {
      throw new Error(`Le fichier reçu n'est pas un sous-titre lisible (${e.message}).`);
    }
    const cible = formats.nomSortie(film, langues.suffixe(l), ext, path.dirname(film));
    formats.ecrireFichier(cible, doc);
    sortiesProduites.add(cible);
    return cible;
  };

  canal('enligne:telecharger', [{ type: 'chemin', max: 4096 }, { type: 'number', min: 1, max: 1e12 }, { type: 'enum', valeurs: Object.keys(CODES_OS) }], async (_e, chemin, fileId, langue) => {
    videoExistante(chemin);
    if (telechargementsEnCours.has(fileId)) throw new Error('Téléchargement déjà en cours.');
    telechargementsEnCours.add(fileId);
    try {
      const r = await enLigne.telecharger(chemin, fileId, {
        langue,
        ecrire: ecrireTelecharge,
      });
      journal.info(`[en ligne] téléchargé : ${path.basename(r.fichier)} (${r.restants ?? '?'} restants aujourd'hui)`);
      return r;
    } finally {
      telechargementsEnCours.delete(fileId);
    }
  });

  // Saison entière : une vidéo à la fois (l'interface enchaîne et peut arrêter entre deux).
  canal('enligne:automatique', [{ type: 'chemin', max: 4096 }, { type: 'enum', valeurs: Object.keys(CODES_OS) }], async (_e, chemin, langue) => {
    videoExistante(chemin);
    try {
      const r = await enLigne.automatique(chemin, { langue, ecrire: ecrireTelecharge });
      journal.info(`[en ligne auto] ${path.basename(chemin)} : ${r.statut} (${r.raison})`);
      return r;
    } catch (e) {
      if (e.quota) return { statut: 'quota', raison: e.message };
      journal.avertissement(`[en ligne auto] ${path.basename(chemin)} :`, e.message);
      return { statut: 'erreur', raison: e.message };
    }
  });

  // --- Moteurs ---
  canal('moteurs:etat', [], () => ({ cleDeepl: parametres.secretExiste(SECRET_DEEPL), ...reglages() }));

  canal('moteurs:enregistrerCleDeepl', [{ type: 'string', max: 200 }], async (_e, cle) => {
    const c = cle.trim();
    if (!/^[A-Za-z0-9-]{20,}(:fx)?$/.test(c)) throw new Error('Cette clé ne ressemble pas à une clé DeepL (format attendu : xxxxxxxx-xxxx-…:fx).');
    parametres.enregistrerSecret(SECRET_DEEPL, c);
    try {
      return { ok: true, usage: await moteurs.usageDeepl() };
    } catch (e) {
      return { ok: true, avertissement: e.message };
    }
  });

  canal('moteurs:supprimerCleDeepl', [], () => { parametres.enregistrerSecret(SECRET_DEEPL, ''); return true; });

  canal('moteurs:testerDeepl', [], () => moteurs.usageDeepl());

  canal('moteurs:modelesOllama', [{ type: 'string', max: 300 }], (_e, adresse) => moteurs.modelesOllama(adresse));

  canal('moteurs:testerOllama', [], async () => {
    const r = reglages();
    if (!r.ollama.modele) throw new Error('Choisissez d\'abord un modèle.');
    const [t] = await moteurs.traduireOllama(['Good morning, how are you?'], { adresse: r.ollama.adresse, modele: r.ollama.modele, source: 'en', cible: 'fr' });
    return { exemple: String(t).slice(0, 300) };
  });

  // --- Conseiller d'IA locale (1.10) ---
  // Commandes système : binaire absolu, sans shell, 10 s au plus, jamais de texte venu de l'interface.
  const executerSysteme = (binaire, args) => new Promise((ok) => {
    if (!path.isAbsolute(binaire)) { ok({ code: -1, sortie: '', erreurs: 'chemin non absolu' }); return; }
    execFile(binaire, argumentsCommande(args), { shell: false, windowsHide: true, timeout: 10000, maxBuffer: 256 * 1024 }, (err, sortie, erreurs) => {
      ok({ code: err ? (typeof err.code === 'number' ? err.code : -1) : 0, sortie: String(sortie || ''), erreurs: String(erreurs || err?.message || '') });
    });
  });
  const racineWindows = () => (process.env.SystemRoot && path.win32.isAbsolute(process.env.SystemRoot) ? process.env.SystemRoot : 'C:\\Windows');
  async function nomCarte() {
    try {
      const info = await app.getGPUInfo('complete');
      const actif = (info.gpuDevice || []).find((g) => g.active) || (info.gpuDevice || [])[0];
      if (actif?.deviceString) return String(actif.deviceString);
      const rendu = String(info.auxAttributes?.glRenderer || '');
      return /(?:NVIDIA|AMD|Radeon|Intel)[^,()]*?(?=\s+Direct3D|\/PCIe|,|\)|$)/i.exec(rendu)?.[0]?.trim() || null;
    } catch (e) {
      journal.avertissement('[conseils] carte graphique non lue :', e.message);
      return null;
    }
  }

  canal('conseils:analyser', [], async () => {
    const r = reglages();
    const carte = await conseils.detecterCarte({
      executer: executerSysteme, existe: (f) => fs.existsSync(f), infoGpu: await nomCarte(), vramManuelle: r.ollama.vramGo || null,
    });
    let modeles = [];
    let erreurOllama = null;
    try { modeles = await moteurs.detailsModeles(r.ollama.adresse); } catch (e) { erreurOllama = e.message; }
    const avis = conseils.evaluer({ modeles, vramGo: carte.vramGo, parallele: r.ollama.parallele || 2 });
    const etat = await conseils.lireReglages({ executer: executerSysteme, racineWindows: racineWindows(), parallele: r.ollama.parallele || 2 });
    return {
      carte, ...avis, erreurOllama, modeleChoisi: r.ollama.modele || null,
      reglages: etat, plateforme: process.platform, instructions: conseils.instructions(r.ollama.parallele || 2),
      anciennes: Boolean(r.ollama.anciennesVariables),
    };
  });
  canal('conseils:vram', [{ type: 'number', min: 2, max: 96 }], (_e, go) => {
    const r = reglages();
    r.ollama.vramGo = Math.round(go);
    parametres.modifier({ ollama: r.ollama });
    return true;
  });
  canal('conseils:activerReglages', [], async () => {
    const r = reglages();
    const parallele = r.ollama.parallele || 2;
    const etatActuel = await conseils.lireReglages({ executer: executerSysteme, racineWindows: racineWindows(), parallele });
    const anciennes = await conseils.activerReglages({ executer: executerSysteme, racineWindows: racineWindows(), parallele, etatActuel });
    if (!r.ollama.anciennesVariables) { r.ollama.anciennesVariables = anciennes; parametres.modifier({ ollama: r.ollama }); }
    journal.info(`[conseils] réglages d'Ollama enregistrés pour l'utilisateur (avant : ${JSON.stringify(anciennes)})`);
    return conseils.lireReglages({ executer: executerSysteme, racineWindows: racineWindows(), parallele });
  });
  canal('conseils:retablirReglages', [], async () => {
    const r = reglages();
    if (!r.ollama.anciennesVariables) throw new Error('Rien à rétablir : SubForge n\'a pas modifié ces réglages.');
    await conseils.retablirReglages({ executer: executerSysteme, racineWindows: racineWindows(), anciennes: r.ollama.anciennesVariables });
    delete r.ollama.anciennesVariables;
    parametres.modifier({ ollama: r.ollama });
    journal.info('[conseils] réglages d\'Ollama rétablis');
    return conseils.lireReglages({ executer: executerSysteme, racineWindows: racineWindows(), parallele: r.ollama.parallele || 2 });
  });
  // Copie d'une commande proposée par SubForge (forme vérifiée : ollama pull / setx).
  canal('conseils:copier', [{ type: 'string', max: 300 }], (_e, texte) => {
    if (!/^(ollama pull [\w.:/-]{1,80}|setx OLLAMA_[A-Z_]{3,30} [\w.]{1,10})$/.test(texte)) throw new ErreurSecurite('Texte non copiable.');
    clipboard.writeText(texte);
    return true;
  });

  // Préchargement du modèle (1.7) : demandé par l'écran Traduire quand des fichiers attendent et
  // que l'IA locale servira (traduction ou relecture). Une seule fois tant que le modèle reste chargé.
  canal('moteurs:prechauffer', [], async () => {
    const r = reglages();
    const sert = r.traduction.moteur === 'ollama' || r.traduction.relecture !== false;
    if (!r.ollama.modele || !sert || r.ollama.garderCharge === false) return { charge: false };
    if (moteurs.modeleCharge() === r.ollama.modele) return { charge: true, deja: true };
    try {
      const debut = Date.now();
      await moteurs.prechauffer({ adresse: r.ollama.adresse, modele: r.ollama.modele, garderCharge: true });
      journal.info(`[ollama] ${r.ollama.modele} chargé à l'avance (${Date.now() - debut} ms)`);
      return { charge: true };
    } catch (e) {
      journal.avertissement(`[ollama] préchargement impossible : ${e.message}`);
      return { charge: false, erreur: e.message };
    }
  });

  // Mesure sur ce PC (T602) : 40 répliques d'exemple avec 1 puis 2 demandes simultanées.
  let mesure = null;
  canal('moteurs:mesurerOllama', [], async (event) => {
    const r = reglages();
    if (!r.ollama.modele) throw new Error('Choisissez d\'abord un modèle d\'IA locale.');
    if (mesure) throw new Error('Une mesure est déjà en cours.');
    if (tache) throw new Error('Une traduction est en cours : mesurez une fois qu\'elle est finie.');
    mesure = new AbortController();
    const etape = (texte) => { if (!event.sender.isDestroyed()) event.sender.send('moteurs:mesure', texte); };
    try {
      const o = { moteur: 'ollama', adresse: r.ollama.adresse, modele: r.ollama.modele, source: 'en', cible: 'fr', garderCharge: r.ollama.garderCharge !== false, signal: mesure.signal };
      etape('Chargement du modèle…');
      await moteurs.traduireOllama(['Hello.'], o);
      // 4 réglages comparés sur 60 répliques : 1 ou 2 demandes à la fois, lots fixes (20) ou adaptés (1.9).
      const phrases = PHRASES_MESURE.concat(PHRASES_MESURE.slice(0, 20).map((x) => `${x} Right?`));
      const essais = [];
      for (const [n, adaptes] of [[1, false], [2, false], [1, true], [2, true]]) {
        etape(`Mesure : ${n} demande${n > 1 ? 's' : ''} à la fois, lots ${adaptes ? 'adaptés' : 'de 20'}… (${essais.length + 1}/4)`);
        const debut = Date.now();
        await moteurs.traduireTout(phrases.map((x) => `${x} (${essais.length})`), { ...o, parallele: n, limite: creerLimite(n), lotsAdaptes: adaptes });
        essais.push({ parallele: n, lotsAdaptes: adaptes, ms: Date.now() - debut });
      }
      const meilleur = essais.reduce((a, b) => (b.ms < a.ms * 0.95 ? b : a));
      r.ollama.parallele = meilleur.parallele;
      r.ollama.lotsAdaptes = meilleur.lotsAdaptes;
      parametres.modifier({ ollama: r.ollama });
      journal.info(`[mesure] ${r.ollama.modele} : ${essais.map((e) => `${e.parallele}×${e.lotsAdaptes ? 'adaptés' : '20'} ${e.ms} ms`).join(', ')} → ${meilleur.parallele}×${meilleur.lotsAdaptes ? 'adaptés' : '20'}`);
      return { essais, conseil: meilleur.parallele, lotsAdaptes: meilleur.lotsAdaptes };
    } finally {
      mesure = null;
    }
  });
  canal('moteurs:annulerMesure', [], () => { mesure?.abort(); return true; });
}

// 40 répliques d'exemple pour la mesure (dialogue courant, longueurs variées).
const PHRASES_MESURE = [
  'Where were you last night?', 'I told you not to call me here.', 'We need to leave before sunrise.', 'Is anyone there?',
  'You have no idea what you are talking about.', 'Give me the keys, now.', 'I am sorry, I did not mean that.', 'How long have you known?',
  'The train leaves at six.', 'Stop! Put your hands where I can see them.', 'She never came back.', 'Why would he lie to us?',
  'Let us get out of here.', 'Do you trust me?', 'It was an accident, I swear.', 'Take care of yourself.',
  'Nobody leaves this room.', 'I will be right back.', 'What happened to your face?', 'We were friends once.',
  'Call the doctor, quickly!', 'That is not what I asked.', 'You look tired.', 'They are coming for us.',
  'I can explain everything.', 'Keep your voice down.', 'This is my house.', 'Thank you for coming.',
  'I have been waiting for hours.', 'Do not touch that.', 'He is not who you think he is.', 'Everything will be fine.',
  'Open the door.', 'I lost my job today.', 'Are you hungry?', 'Just tell me the truth.',
  'We should have stayed home.', 'Where is the money?', 'Good night, sweetheart.', 'See you tomorrow.',
];

// Fermeture de SubForge : le modèle gardé chargé est libéré (carte graphique rendue aux autres logiciels).
function fermer() {
  return moteurs ? moteurs.decharger() : Promise.resolve(false);
}

module.exports = { enregistrer, fermer };
