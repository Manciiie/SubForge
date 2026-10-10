'use strict';
// Écran « Traduire » + écran « Moteurs » : canaux IPC et file de traduction.
// Le travail (lecture, ffmpeg, réseau) se fait ici, dans le processus principal, jamais dans l'interface.

const { app, net, shell, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { canal } = require('../ipc');
const { ErreurSecurite } = require('../securite');
const parametres = require('../parametres');
const journal = require('../journal');
const formats = require('./formats');
const video = require('./video');
const langues = require('./langues');
const { creerMoteurs, adresseOllamaValide, normaliserAdresse } = require('./moteurs');

const SECRET_DEEPL = 'cle_deepl';
const CODES = langues.codes();

let moteurs = null;
let binaireFfmpeg = null;
let tache = null;              // { controleur, expediteur }
const resultats = new Map();   // id d'élément → { paires, sortie }
const sortiesProduites = new Set();

function reglages() {
  const p = parametres.lire();
  return {
    traduction: { source: 'auto', cible: 'fr', moteur: 'deepl', formatSortie: 'identique', dossierSortie: null, ...(p.traduction || {}) },
    deepl: { formalite: 'defaut', ...(p.deepl || {}) },
    ollama: { adresse: 'http://127.0.0.1:11434', modele: '', ...(p.ollama || {}) },
  };
}

function envoyer(evenement) {
  const e = tache?.expediteur;
  if (e && !e.isDestroyed()) e.send('traduction:progression', evenement);
}

// --- Analyse des fichiers déposés ---------------------------------------------------

async function analyserUn(chemin) {
  const base = { chemin, nom: path.basename(chemin) };
  try {
    const stat = fs.statSync(chemin);
    if (!stat.isFile()) throw new Error('Ce n\'est pas un fichier.');
    if (formats.formatDepuisChemin(chemin)) {
      const doc = formats.lireFichier(chemin);
      const indice = /\.([a-z]{2,3}(?:-[A-Za-z]{2,4})?)\.(srt|ass|ssa|vtt)$/i.exec(chemin);
      const l = indice ? langues.depuisIso3(indice[1]) : null;
      return { ...base, type: 'soustitre', format: doc.format, encodage: doc.encodage, repliques: doc.repliques.length, langue: l?.code || null, nomLangue: l?.nom || null };
    }
    if (video.estVideo(chemin)) {
      const pistes = await video.listerPistes(binaireFfmpeg, chemin);
      return { ...base, type: 'video', taille: stat.size, pistes };
    }
    throw new Error('Type de fichier non pris en charge : sous-titres (SRT, ASS, SSA, VTT) ou vidéo (MKV, MP4, AVI…).');
  } catch (e) {
    return { ...base, type: 'erreur', erreur: e.message };
  }
}

// --- Traduction d'un élément --------------------------------------------------------

async function traduireElement(el, options, signal) {
  const rapporter = (etat, extra = {}) => envoyer({ id: el.id, etat, ...extra });
  let extraction = null;
  try {
    let fichier = el.chemin;
    if (video.estVideo(el.chemin)) {
      rapporter('extraction', { message: 'Extraction de la piste…' });
      const pistes = await video.listerPistes(binaireFfmpeg, el.chemin, { signal });
      const piste = pistes.find((p) => p.indice === el.piste);
      if (!piste) throw new Error('Piste de sous-titres introuvable dans cette vidéo.');
      extraction = await video.extrairePiste(binaireFfmpeg, el.chemin, piste, { signal });
      fichier = extraction.fichier;
    }

    const doc = formats.lireFichier(fichier);
    formats.preparerConversionAss(doc);
    const original = doc.repliques.map((r) => formats.texteVisible(r.texte));

    // Segments à traduire, réplique par réplique.
    const preparations = doc.repliques.map((r) => (r.dessin ? null : formats.preparerReplique(r.texte, doc.format)));
    const segments = [];
    const positions = preparations.map((p) => {
      if (!p) return null;
      const debut = segments.length;
      segments.push(...p.segments);
      return debut;
    });
    if (segments.length === 0) throw new Error('Aucun texte à traduire dans ces sous-titres.');

    rapporter('traduction', { fait: 0, total: segments.length, message: 'Traduction…' });
    const traductions = await moteurs.traduireTout(segments, { ...options, signal }, (fait, total) => rapporter('traduction', { fait, total }));
    if (signal.aborted) throw Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });

    doc.repliques.forEach((r, i) => {
      const p = preparations[i];
      if (!p || p.segments.length === 0) return;
      r.texte = p.recomposer(traductions.slice(positions[i], positions[i] + p.segments.length));
    });

    rapporter('ecriture', { message: 'Enregistrement…' });
    const docSortie = options.formatSortie === 'srt' ? formats.versSrt(doc) : doc;
    const ext = docSortie.format === 'ass' ? (path.extname(fichier).toLowerCase() === '.ssa' ? '.ssa' : '.ass') : `.${docSortie.format}`;
    const dossier = options.dossierSortie || path.dirname(el.chemin);
    const cible = formats.nomSortie(el.chemin, langues.suffixe(options.cible), ext, dossier);
    formats.ecrireFichier(cible, docSortie);
    sortiesProduites.add(cible);

    const paires = doc.repliques.slice(0, 400).map((r, i) => ({ debut: r.debut, original: original[i], traduit: formats.texteVisible(r.texte) }));
    resultats.set(el.id, { paires, sortie: cible, total: doc.repliques.length });
    journal.info(`Traduit : ${path.basename(el.chemin)} → ${path.basename(cible)} (${segments.length} segments, ${options.moteur})`);
    rapporter('termine', { sortie: cible, nomSortie: path.basename(cible), repliques: doc.repliques.length });
  } catch (e) {
    if (e.name === 'AbortError' || signal.aborted) {
      rapporter('annule', { message: 'Annulé.' });
    } else {
      journal.avertissement(`Échec pour ${path.basename(el.chemin)} :`, e.message);
      rapporter('erreur', { message: e.message });
    }
  } finally {
    extraction?.nettoyer();
  }
}

// --- Canaux -------------------------------------------------------------------------

function enregistrer({ racineApp }) {
  binaireFfmpeg = video.cheminFfmpeg({ empaquete: app.isPackaged, resourcesPath: process.resourcesPath, racineApp });
  // Adresse DeepL de test (faux serveur) : jamais prise en compte dans la version installée.
  const urlTest = !app.isPackaged && process.env.SUBFORGE_DEEPL_URL_TEST ? process.env.SUBFORGE_DEEPL_URL_TEST : null;
  moteurs = creerMoteurs({ fetch: (u, o) => net.fetch(u, o), lireCleDeepl: () => parametres.lireSecret(SECRET_DEEPL), urlDeeplTest: urlTest, journal });

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
    },
  }], (_e, o) => {
    const r = reglages();
    for (const c of ['source', 'cible', 'moteur', 'formatSortie']) if (o[c] !== undefined) r.traduction[c] = o[c];
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
    parametres.modifier(r);
    return reglages();
  });

  canal('traduction:choisirDossierSortie', [], async (event) => {
    const res = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: 'Dossier où enregistrer les sous-titres traduits', properties: ['openDirectory', 'createDirectory'],
    });
    return res.canceled ? null : res.filePaths[0];
  });

  canal('traduction:analyser', [{ type: 'liste', max: 200, element: { type: 'chemin', max: 4096 } }], async (_e, chemins) => {
    const sortie = [];
    for (const c of chemins) {
      if (!path.isAbsolute(c)) { sortie.push({ chemin: c, nom: c, type: 'erreur', erreur: 'Chemin invalide.' }); continue; }
      sortie.push(await analyserUn(c));
    }
    return sortie;
  });

  canal('traduction:lancer', [{
    type: 'liste', max: 200,
    element: { type: 'objet', champs: { id: { type: 'string', max: 64 }, chemin: { type: 'chemin', max: 4096 }, piste: { type: 'number', min: 0, max: 999, optionnel: true } } },
  }], async (event, elements) => {
    if (tache) throw new Error('Une traduction est déjà en cours.');
    const r = reglages();
    const options = {
      moteur: r.traduction.moteur,
      source: r.traduction.source,
      cible: r.traduction.cible,
      formatSortie: r.traduction.formatSortie,
      dossierSortie: r.traduction.dossierSortie && fs.existsSync(r.traduction.dossierSortie) ? r.traduction.dossierSortie : null,
      formalite: r.deepl.formalite,
      adresse: r.ollama.adresse,
      modele: r.ollama.modele,
    };
    if (options.source !== 'auto' && options.source === options.cible) throw new Error('La langue source et la langue cible sont identiques.');
    if (options.moteur === 'deepl' && !parametres.secretExiste(SECRET_DEEPL)) throw new Error('Aucune clé DeepL : ajoutez-la dans l\'écran Moteurs, ou choisissez l\'IA locale.');
    if (options.moteur === 'deepl' && !langues.langue(options.cible)?.deeplCible) throw new Error('DeepL ne propose pas cette langue cible : choisissez l\'IA locale.');
    if (options.moteur === 'ollama' && !options.modele) throw new Error('Choisissez d\'abord un modèle d\'IA locale dans l\'écran Moteurs.');
    for (const el of elements) if (!path.isAbsolute(el.chemin)) throw new ErreurSecurite('Chemin invalide.');

    tache = { controleur: new AbortController(), expediteur: event.sender };
    const { signal } = tache.controleur;
    (async () => {
      for (const el of elements) {
        if (signal.aborted) { envoyer({ id: el.id, etat: 'annule', message: 'Annulé.' }); continue; }
        await traduireElement(el, options, signal);
      }
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
}

module.exports = { enregistrer };
