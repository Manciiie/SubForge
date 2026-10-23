'use strict';
// Écran « Traduire » : dépôt de fichiers, choix des pistes, options, file de traduction, aperçu.
// Tout texte passe par textContent (UI.el) : les noms de fichiers et sous-titres ne sont jamais du HTML.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {}; // fonctions partagées entre écrans
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const T = window.forge.traduction;

  const elements = new Map(); // id → { id, chemin, nom, info, piste, etat, carte }
  let compteur = 0;
  let enCours = false;
  let rechercheAuto = false;   // recherche en ligne pour toute la saison en cours
  let arretRecherche = false;
  let langues = [];

  // --- Options ---------------------------------------------------------------------
  const selSource = $('opt-source');
  const selCible = $('opt-cible');
  const selMoteur = $('opt-moteur');
  const selFormat = $('opt-format');
  const libDossier = $('opt-dossier');

  langues = await T.langues();
  selSource.append(el('option', { value: 'auto', texte: 'Détection automatique' }));
  for (const l of langues) {
    selSource.append(el('option', { value: l.code, texte: l.nom }));
    selCible.append(el('option', { value: l.code, texte: l.nom }));
  }

  let reglages = await T.reglages();
  function appliquerReglages(r) {
    reglages = r;
    selSource.value = r.traduction.source;
    selCible.value = r.traduction.cible;
    selMoteur.value = r.traduction.moteur;
    selFormat.value = r.traduction.formatSortie;
    $('opt-resultat').value = r.traduction.resultatFilm || 'film';
    $('opt-registre').value = r.traduction.registre || 'auto';
    $('opt-relecture').checked = r.traduction.relecture !== false;
    $('opt-synchro').checked = r.traduction.synchro !== false;
    majRegistre();
    const d = r.traduction.dossierSortie;
    libDossier.textContent = d || 'À côté du film';
    libDossier.title = d || '';
    $('btn-dossier-defaut').hidden = !d;
    majAvertissement();
  }

  async function modifier(o) {
    try { appliquerReglages(await T.modifierReglages(o)); } catch (e) { erreur(e); appliquerReglages(reglages); }
  }
  selSource.addEventListener('change', () => modifier({ source: selSource.value }));
  selCible.addEventListener('change', () => modifier({ cible: selCible.value }));
  selMoteur.addEventListener('change', () => modifier({ moteur: selMoteur.value }));
  selFormat.addEventListener('change', () => modifier({ formatSortie: selFormat.value }));
  $('opt-resultat').addEventListener('change', () => modifier({ resultatFilm: $('opt-resultat').value }));
  $('opt-registre').addEventListener('change', () => modifier({ registre: $('opt-registre').value }));
  $('opt-relecture').addEventListener('change', () => modifier({ relecture: $('opt-relecture').checked }));
  $('opt-synchro').addEventListener('change', () => modifier({ synchro: $('opt-synchro').checked }));
  // Tu / vous : seulement pour les langues qui ont une forme polie.
  function majRegistre() {
    const avec = ['fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru'].includes(String(selCible.value).split('-')[0]);
    $('opt-registre').disabled = !avec || enCours;
    $('opt-registre').title = avec ? '' : 'Cette langue n\'a pas de tutoiement ni de vouvoiement.';
  }
  $('btn-dossier').addEventListener('click', async () => {
    try {
      const d = await T.choisirDossierSortie();
      if (d) await modifier({ dossierSortie: d });
    } catch (e) { erreur(e); }
  });
  $('btn-dossier-defaut').addEventListener('click', () => modifier({ viderDossierSortie: true }));

  async function majAvertissement() {
    const zone = $('avertissement-moteur');
    const cible = langues.find((l) => l.code === selCible.value);
    let texte = '';
    if (selMoteur.value === 'deepl') {
      const etat = await window.forge.moteurs.etat().catch(() => null);
      if (etat && !etat.cleDeepl) texte = 'Aucune clé DeepL enregistrée : ajoutez-la dans l\'écran Moteurs.';
      else if (cible && !cible.deepl) texte = `DeepL ne traduit pas vers ${cible.nom} : choisissez l'IA locale.`;
      else texte = 'Le texte des sous-titres est envoyé à DeepL pour être traduit.';
    } else if (!reglages.ollama.modele) {
      texte = 'Aucun modèle d\'IA locale choisi : réglez-le dans l\'écran Moteurs.';
    } else {
      texte = `IA locale : ${reglages.ollama.modele} — rien ne quitte ce PC.`;
    }
    zone.textContent = texte;
  }
  window.SubForge.rafraichirOptions = async () => appliquerReglages(await T.reglages());
  appliquerReglages(reglages);

  // --- Ajout de fichiers --------------------------------------------------------------
  const zone = $('zone-depot');
  const liste = $('liste-fichiers');

  // Piste par défaut : texte dans la langue source, sinon texte complet (pas « forcés »),
  // sinon piste image lisible par OCR (Blu-ray), sinon rien.
  function choisirPiste(pistes) {
    const textes = pistes.filter((p) => p.format);
    const images = pistes.filter((p) => !p.format && p.ocr);
    const parmi = (l) => l.find((p) => p.langue === selSource.value && !p.forces) || l.find((p) => !p.forces) || l[0];
    return (textes.length ? parmi(textes) : null) || (images.length ? parmi(images) : null) || null;
  }

  function appliquerInfo(e, info) {
    e.info = info;
    e.message = null;
    if (info.type === 'erreur') { e.etat = 'erreur'; e.message = info.erreur; return; }
    if (info.type === 'video') {
      const choix = choisirPiste(info.pistes);
      e.piste = choix ? choix.indice : null;
      e.etat = choix ? 'pret' : 'sans-piste';
      if (!choix) {
        e.message = info.pistes.length
          ? 'Seulement des sous-titres en image que SubForge ne sait pas lire (DVD / langue sans OCR). Cherchez-les en ligne.'
          : 'Aucune piste de sous-titres dans cette vidéo : cherchez-les en ligne.';
      }
      return;
    }
    e.etat = 'pret';
  }

  async function ajouter(chemins) {
    if (!chemins.length) return;
    let exploration;
    try {
      exploration = await T.explorer(chemins);
    } catch (err) { erreur(err); return; }
    const b = exploration.bilan;
    if (b.dossiers) {
      const morceaux = [`${exploration.fichiers.length} fichier(s) ajouté(s)`];
      if (b.dejaTraduits) morceaux.push(`${b.dejaTraduits} déjà traduit(s), ignoré(s)`);
      if (b.videosRemplacees) morceaux.push(`${b.videosRemplacees} vidéo(s) remplacée(s) par leur sous-titre`);
      if (b.interdits) morceaux.push(`${b.interdits} dossier(s) illisible(s)`);
      if (b.tronque) morceaux.push('limite de 1 000 fichiers atteinte');
      if (!exploration.fichiers.length) notifier(b.dejaTraduits ? `Tout est déjà traduit dans ce dossier (${b.dejaTraduits} épisode(s)).` : 'Aucun film ni sous-titre dans ce dossier.', 'alerte', 7000);
      else notifier(morceaux.join(' · '), b.interdits || b.tronque ? 'alerte' : 'succes', 8000);
    }
    if (b.introuvables) notifier(`${b.introuvables} élément(s) introuvable(s) (déplacé(s) ou supprimé(s)).`, 'alerte');
    const nouveaux = exploration.fichiers.filter((c) => ![...elements.values()].some((e) => e.chemin === c));
    if (!nouveaux.length) return;
    const ids = nouveaux.map((c) => {
      const id = `f${++compteur}`;
      const e = { id, chemin: c, nom: c.split(/[\\/]/).pop(), info: null, piste: null, etat: 'analyse' };
      elements.set(id, e);
      dessiner(e);
      return id;
    });
    majFile();
    // Analyse par paquets de 4 : les cartes se remplissent au fur et à mesure (saison de 24 épisodes).
    for (let k = 0; k < nouveaux.length; k += 4) {
      const paquet = nouveaux.slice(k, k + 4);
      let infos;
      try {
        infos = await T.analyser(paquet);
      } catch (err) {
        infos = paquet.map((c) => ({ chemin: c, nom: c, type: 'erreur', erreur: err.message.replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '') }));
      }
      infos.forEach((info, i) => {
        const e = elements.get(ids[k + i]);
        if (!e) return;
        appliquerInfo(e, info);
        dessiner(e);
        chargerContexte(e);
      });
      majFile();
      prechaufferModele();
    }
  }

  // Modèle d'IA locale chargé à l'avance dès que des fichiers attendent (1.7) : une fois par session.
  let prechauffage = null;
  function prechaufferModele() {
    if (prechauffage) return;
    prechauffage = window.forge.moteurs.prechauffer()
      .then((r) => { if (!r.charge) prechauffage = null; }) // pas chargé (IA non utilisée, erreur) : on réessaiera
      .catch(() => { prechauffage = null; }); // silence-ok: simple anticipation, l'erreur réelle apparaîtra à la traduction
  }
  window.SubForge.prechaufferModele = () => { prechauffage = null; prechaufferModele(); };

  // Contexte du film (TMDB), chargé en arrière-plan, un fichier après l'autre (les épisodes suivants
  // d'une série viennent du cache).
  let fileContexte = Promise.resolve();
  function chargerContexte(e) {
    if (e.info?.type === 'erreur') return;
    fileContexte = fileContexte.then(async () => {
      if (!elements.has(e.id)) return;
      try { e.contexte = await window.forge.contexte.pour(e.chemin); } catch (err) { e.contexte = { etat: 'erreur', message: err.message }; }
      if (elements.has(e.id)) dessiner(e);
    });
    return fileContexte;
  }
  window.SubForge.rafraichirContextes = () => { for (const e of elements.values()) chargerContexte(e); };

  function ligneContexte(e) {
    const c = e.contexte;
    if (!c || c.etat === 'desactive' || e.etat === 'analyse') return null;
    const changer = (libelle) => {
      const b = el('button', {
        classe: 'btn btn--petit btn--lien', texte: libelle,
        onclick: () => window.SubForge.choisirFilm({ chemin: e.chemin, nom: e.nom, recherche: c.recherche || c.titre || '' }),
      });
      b.disabled = enCours;
      return b;
    };
    if (c.etat === 'trouve') {
      const genre = { female: 'femme', male: 'homme', 'non-binary': 'non binaire' };
      const quoi = c.type === 'serie'
        ? `Série : ${c.titre}${c.annee ? ` (${c.annee})` : ''}${c.episode ? ` · S${String(c.episode.saison).padStart(2, '0')}E${String(c.episode.episode).padStart(2, '0')}${c.episode.titre ? ` « ${c.episode.titre} »` : ''}` : ''}`
        : `Film : ${c.titre}${c.annee ? ` (${c.annee})` : ''}`;
      const liste = c.personnages.map((p) => `${p.personnage}${p.genre ? ` (${genre[p.genre] || p.genre})` : ''}`).join('\n');
      return el('div', { classe: 'ligne-contexte' }, [
        el('span', { classe: 'discret', texte: `${quoi} · ${c.personnages.length} personnage${c.personnages.length > 1 ? 's' : ''}`, title: liste || 'Aucun personnage connu' }),
        changer('Changer…'),
      ]);
    }
    if (c.etat === 'inconnu') return el('div', { classe: 'ligne-contexte' }, [el('span', { classe: 'discret', texte: 'Film non reconnu sur TMDB.' }), changer('Choisir le film…')]);
    if (c.etat === 'aucun') return el('div', { classe: 'ligne-contexte' }, [el('span', { classe: 'discret', texte: 'Sans contexte de film.' }), changer('Choisir le film…')]);
    return el('div', { classe: 'ligne-contexte' }, [el('span', { classe: 'discret', texte: `Contexte du film indisponible : ${c.message}` })]);
  }

  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('survol'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, () => zone.classList.remove('survol')));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    ajouter([...e.dataTransfer.files].map((f) => window.forge.fichiers.cheminDe(f)).filter(Boolean));
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
  $('btn-choisir-dossier').addEventListener('click', async () => {
    try {
      ajouter(await window.forge.fichiers.choisir({ titre: 'Choisir le dossier d\'une saison (sous-dossiers compris)', dossier: true }));
    } catch (e) { erreur(e); }
  });
  $('btn-choisir').addEventListener('click', async () => {
    try {
      ajouter(await window.forge.fichiers.choisir({
        titre: 'Choisir des films ou des sous-titres', multiple: true,
        extensions: 'srt,ass,ssa,vtt,sup,mkv,mp4,m4v,avi,mov,webm,ts,m2ts,wmv',
      }));
    } catch (e) { erreur(e); }
  });

  // --- Cartes -----------------------------------------------------------------------
  const LIBELLES = {
    analyse: 'Analyse…', recherche: 'Recherche en ligne…', integration: 'Ajout au film…', synchro: 'Synchronisation…', relecture: 'Relecture IA…', pret: 'Prêt', 'sans-piste': 'Pas de sous-titres', ocr: 'Lecture des images…', attente: 'En attente', extraction: 'Extraction de la piste…',
    traduction: 'Traduction…', ecriture: 'Enregistrement…', termine: 'Traduit', erreur: 'Erreur', annule: 'Annulé',
  };

  function description(e) {
    const i = e.info;
    const dossier = e.chemin.split(/[\\/]/).slice(-2, -1)[0];
    const lieu = dossier ? `dossier « ${dossier} »` : null;
    if (!i || i.type === 'erreur') return lieu || '';
    if (i.type === 'soustitre') {
      return [i.format.toUpperCase(), `${i.repliques.toLocaleString('fr-FR')} répliques`, i.nomLangue, i.encodage, lieu].filter(Boolean).join(' · ');
    }
    if (i.type === 'sup') return [`Sous-titres Blu-ray (image) · ${i.repliques.toLocaleString('fr-FR')} images`, i.nomLangue, lieu].filter(Boolean).join(' · ');
    return [`Vidéo · ${i.pistes.length} piste(s) de sous-titres`, lieu].filter(Boolean).join(' · ');
  }

  function libellePiste(p) {
    const morceaux = [p.nomLangue, p.description];
    if (p.titre) morceaux.push(`« ${p.titre} »`);
    if (p.forces) morceaux.push('forcés');
    if (p.malentendants) morceaux.push('malentendants');
    if (!p.format) morceaux.push(p.ocr ? 'image : lue par OCR' : 'non traduisible');
    return morceaux.join(' · ');
  }

  function dessiner(e) {
    const carte = e.carte || el('li', { classe: 'carte-fichier' });
    e.carte = carte;
    carte.dataset.etat = e.etat;
    const entete = el('div', { classe: 'carte-fichier__haut' }, [
      el('div', { classe: 'carte-fichier__noms' }, [
        el('strong', { classe: 'carte-fichier__nom', texte: e.nom, title: e.chemin }),
        el('span', { classe: 'discret', texte: description(e) }),
      ]),
      el('span', { classe: `pastille pastille--${e.etat}`, texte: LIBELLES[e.etat] || e.etat }),
    ]);
    const corps = [entete];
    const contexte = ligneContexte(e);
    if (contexte) corps.push(contexte);

    if (e.info?.type === 'video' && e.info.pistes.length) {
      const sel = el('select', { classe: 'select-piste', 'aria-label': 'Piste de sous-titres à traduire' });
      for (const p of e.info.pistes) {
        const o = el('option', { value: String(p.indice), texte: libellePiste(p) });
        if (!p.format && !p.ocr) o.disabled = true;
        sel.append(o);
      }
      if (e.piste !== null) sel.value = String(e.piste);
      sel.disabled = enCours;
      sel.addEventListener('change', () => { e.piste = Number(sel.value); if (e.etat === 'termine') { e.etat = 'pret'; dessiner(e); } majFile(); });
      corps.push(el('label', { classe: 'ligne-piste' }, ['Piste ', sel]));
    }

    if (['traduction', 'extraction', 'ecriture', 'ocr', 'integration', 'synchro', 'relecture'].includes(e.etat)) {
      const pct = e.total ? Math.round((100 * (e.fait || 0)) / e.total) : 0;
      const barre = el('div', { classe: 'barre-progression' }, [el('span')]);
      barre.firstChild.style.width = `${e.etat === 'ecriture' ? 100 : pct}%`;
      corps.push(barre);
      if (e.etat === 'synchro') corps.push(el('span', { classe: 'discret', texte: `Écoute du son du film pour recaler les sous-titres : ${e.fait || 0} %` }));
      else if (e.etat === 'relecture') corps.push(el('span', { classe: 'discret', texte: `Relecture par l'IA : scène ${Math.min((e.fait || 0) + 1, e.total || 1)} sur ${e.total || 1}` }));
      else if (e.etat === 'integration') corps.push(el('span', { classe: 'discret', texte: `Copie du film avec la piste traduite : ${e.fait || 0} %` }));
      else if (e.total) corps.push(el('span', { classe: 'discret', texte: `${(e.fait || 0).toLocaleString('fr-FR')} / ${e.total.toLocaleString('fr-FR')} ${e.etat === 'ocr' ? 'images lues (OCR)' : 'répliques'}` }));
      // Travaux menés en parallèle (1.6) : relecture et écoute du son pendant la traduction.
      if (e.etat === 'traduction' && e.relu?.total) corps.push(el('span', { classe: 'discret', texte: `Relecture en parallèle : ${e.relu.fait} / ${e.relu.total} scènes` }));
      if (['traduction', 'relecture'].includes(e.etat) && e.synchroPct !== null && e.synchroPct !== undefined) corps.push(el('span', { classe: 'discret', texte: `Synchronisation en parallèle : ${e.synchroPct} %` }));
    }
    if (e.message && ['erreur', 'annule', 'sans-piste'].includes(e.etat)) corps.push(el('p', { classe: 'carte-fichier__message', texte: e.message }));
    if (e.etat === 'termine' && e.bilan) {
      const b = e.bilan;
      if (b.ocr) {
        const o = b.ocr;
        corps.push(el('span', { classe: 'discret', texte: `OCR : ${o.lues.toLocaleString('fr-FR')} images lues sur ${o.images.toLocaleString('fr-FR')} → ${o.fichier}` }));
        if (o.douteuses || o.illisibles) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: [o.douteuses ? `${o.douteuses} réplique(s) lue(s) avec peu de certitude` : '', o.illisibles ? `${o.illisibles} image(s) illisible(s) ou vide(s)` : ''].filter(Boolean).join(' · ') + ` : relisez ${o.fichier} si besoin.` }));
      }
      const morceaux = [];
      if (b.repris) morceaux.push(`${b.repris.toLocaleString('fr-FR')} réplique${b.repris > 1 ? 's' : ''} reprise${b.repris > 1 ? 's' : ''} de la mémoire`);
      if (b.caracteresEconomises && reglages.traduction.moteur === 'deepl') morceaux.push(`${b.caracteresEconomises.toLocaleString('fr-FR')} caractères DeepL économisés`);
      if (b.envoyes) morceaux.push(`${b.envoyes.toLocaleString('fr-FR')} phrase${b.envoyes > 1 ? 's' : ''} envoyée${b.envoyes > 1 ? 's' : ''} au moteur`);
      if (morceaux.length) corps.push(el('span', { classe: 'discret', texte: morceaux.join(' · ') }));
      if (b.contexte?.erreur) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Traduit sans le contexte du film (${b.contexte.erreur}).` }));
      if (b.synchro) {
        const sy = b.synchro;
        const sec = (ms) => `${ms > 0 ? '+' : '−'}${(Math.abs(ms) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`;
        if (sy.erreur) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Synchronisation impossible (${sy.erreur}) : minutages d'origine gardés.` }));
        else if (sy.raison === 'recale') corps.push(el('span', { classe: 'discret', texte: `Recalé sur le son de ${sy.film} : ${sec(sy.decalageMs)}${sy.vitesse ? `, vitesse ${sy.vitesse}` : ''}.` }));
        else if (sy.raison === 'deja') corps.push(el('span', { classe: 'discret', texte: `Déjà synchronisé avec ${sy.film}.` }));
        else if (sy.raison === 'incertain') corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Synchronisation incertaine avec ${sy.film} : minutages d'origine gardés.` }));
      }
      if (b.relecture) {
        const rl = b.relecture;
        if (rl.indisponible) corps.push(el('span', { classe: 'discret', texte: 'Relecture IA non faite : aucun modèle d\'IA locale choisi (écran Moteurs).' }));
        else {
          const morceauxR = [`${rl.corrigees} réplique${rl.corrigees > 1 ? 's' : ''} corrigée${rl.corrigees > 1 ? 's' : ''}`];
          if (rl.tuVous) morceauxR.push(`dont ${rl.tuVous} tu/vous`);
          if (rl.doutes) morceauxR.push(`${rl.doutes} à vérifier`);
          corps.push(el('span', { classe: 'discret', texte: `Relecture IA : ${morceauxR.join(', ')} (${rl.scenes} scène${rl.scenes > 1 ? 's' : ''}).` }));
          if (rl.erreur) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Relecture interrompue (${rl.erreur}) : le reste est gardé tel que traduit.` }));
        }
      }
      if (b.expressions?.length) {
        const n = b.expressions.length;
        corps.push(el('span', { classe: 'discret', texte: `${n} expression${n > 1 ? 's' : ''} traduite${n > 1 ? 's' : ''} par le sens : ${b.expressions.slice(0, 6).join(', ')}${n > 6 ? '…' : ''}` }));
      }
      if (b.aVerifier) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `${b.aVerifier} réplique${b.aVerifier > 1 ? 's' : ''} à vérifier : le moteur a perdu un terme du glossaire.` }));
      if (b.integration?.fichier && !b.integration.seul) {
        corps.push(el('div', { classe: 'carte-fichier__actions' }, [
          el('span', { classe: 'discret', texte: `Film avec la piste traduite → ${b.integration.nom}` }),
          el('span', { classe: 'espace' }),
          el('button', { classe: 'btn btn--petit', texte: 'Voir le film', onclick: () => T.montrer(b.integration.fichier).catch(erreur) }),
        ]));
      }
      if (b.integration?.seul) corps.push(el('span', { classe: 'discret', texte: 'Film avec la piste traduite : choisissez-la dans votre lecteur (menu Sous-titres).' }));
      if (b.integration?.erreur) {
        corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Ajout au film impossible : ${b.integration.erreur}. La traduction est enregistrée à part${b.integration.secours ? ` (${b.integration.secours})` : ''}.` }));
      }
      if (b.erreurMemoire) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Mémoire de traduction non enregistrée (${b.erreurMemoire}) : la traduction, elle, est bien écrite.` }));
    }
    if (e.etat === 'termine') {
      corps.push(el('div', { classe: 'carte-fichier__actions' }, [
        el('span', { classe: 'discret', texte: `→ ${e.nomSortie}` }),
        el('span', { classe: 'espace' }),
        el('button', { classe: 'btn btn--petit', texte: 'Aperçu', onclick: () => afficherApercu(e) }),
        el('button', { classe: 'btn btn--petit', texte: 'Ouvrir le dossier', onclick: () => T.montrer(e.sortie).catch(erreur) }),
      ]));
    } else if (!enCours && !rechercheAuto) {
      const actions = [el('span', { classe: 'espace' })];
      if (e.info?.type === 'video') {
        actions.push(el('button', {
          classe: `btn btn--petit${e.etat === 'sans-piste' ? ' btn--principal' : ''}`,
          texte: 'Chercher en ligne',
          onclick: () => chercherEnLigne(e),
        }));
      }
      actions.push(el('button', { classe: 'btn btn--petit btn--lien', texte: 'Retirer', onclick: () => { elements.delete(e.id); carte.remove(); majFile(); } }));
      corps.push(el('div', { classe: 'carte-fichier__actions' }, actions));
    }
    carte.replaceChildren(...corps);
    if (!carte.isConnected) liste.append(carte);
  }

  // Fichiers à (re)traduire : prêts, en erreur ou annulés — jamais ceux déjà traduits.
  function aRetraduire(e) {
    return ['pret', 'erreur', 'annule'].includes(e.etat) && (['soustitre', 'sup'].includes(e.info?.type) || (e.info?.type === 'video' && e.piste !== null));
  }

  // Sous-titres trouvés en ligne : enregistrés à côté du film puis ajoutés à la file.
  function chercherEnLigne(e) {
    window.SubForge.chercherEnLigne?.({
      chemin: e.chemin,
      nom: e.nom,
      langue: selSource.value !== 'auto' ? selSource.value : 'en',
      surTelechargement: async (fichier) => {
        if (e.etat === 'sans-piste') { elements.delete(e.id); e.carte?.remove(); }
        await ajouter([fichier]);
      },
    });
  }

  function majFile() {
    $('file').hidden = elements.size === 0;
    const prets = [...elements.values()].filter(aRetraduire);
    zone.classList.toggle('compacte', elements.size > 0);
    $('file-titre').textContent = `${elements.size} fichier${elements.size > 1 ? 's' : ''}`;
    $('btn-traduire').disabled = enCours || prets.length === 0 || [...elements.values()].some((e) => e.etat === 'analyse');
    $('btn-traduire').hidden = enCours;
    const sansPiste = [...elements.values()].filter((e) => e.etat === 'sans-piste').length;
    const auto = $('btn-enligne-auto');
    auto.hidden = enCours || (!rechercheAuto && sansPiste === 0);
    auto.textContent = rechercheAuto ? 'Arrêter la recherche' : `Chercher en ligne (${sansPiste} sans sous-titres)`;
    auto.classList.toggle('btn--principal', !rechercheAuto && sansPiste > 0 && sansPiste === elements.size);
    if (rechercheAuto) { $('btn-traduire').disabled = true; $('btn-vider').hidden = true; }
    $('btn-annuler').hidden = !enCours;
    $('btn-vider').hidden = enCours;
    for (const s of [selSource, selCible, selMoteur, selFormat, $('opt-resultat'), $('opt-relecture'), $('opt-synchro'), $('btn-dossier'), $('btn-dossier-defaut')]) s.disabled = enCours;
    majRegistre();
  }

  // Saison entière : sous-titres cherchés et téléchargés automatiquement pour chaque vidéo qui n'en a pas.
  $('btn-enligne-auto').addEventListener('click', async () => {
    if (rechercheAuto) { arretRecherche = true; $('btn-enligne-auto').disabled = true; return; }
    const etat = await window.forge.enLigne.etat();
    if (!etat.cle) {
      notifier('Ajoutez d\'abord une clé d\'API OpenSubtitles (gratuite) dans l\'écran Moteurs.', 'alerte', 7000);
      window.UI.afficherEcran('moteurs');
      return;
    }
    const cibles = [...elements.values()].filter((e) => e.etat === 'sans-piste');
    if (!cibles.length) return;
    const langue = selSource.value !== 'auto' && etat.langues.includes(selSource.value) ? selSource.value : 'en';
    rechercheAuto = true;
    arretRecherche = false;
    const bilan = { telecharges: 0, incertains: 0, erreurs: 0, quota: null };
    elements.forEach(dessiner); // boutons des cartes masqués pendant la recherche
    majFile();
    try {
      for (let i = 0; i < cibles.length; i++) {
        if (arretRecherche || bilan.quota) break;
        const e = cibles[i];
        if (!elements.has(e.id)) continue; // retirée entre-temps
        e.etat = 'recherche';
        e.message = null;
        dessiner(e);
        $('file-titre').textContent = `Recherche en ligne : ${i + 1} / ${cibles.length}`;
        let r;
        try {
          r = await window.forge.enLigne.automatique(e.chemin, langue);
        } catch (err) {
          r = { statut: 'erreur', raison: err.message.replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '') };
        }
        if (r.statut === 'telecharge') {
          bilan.telecharges += 1;
          elements.delete(e.id);
          e.carte?.remove();
          await ajouter([r.fichier]);
        } else {
          e.etat = 'sans-piste';
          e.message = r.statut === 'incertain' ? `Recherche en ligne : ${r.raison}.` : r.raison;
          if (r.statut === 'incertain') bilan.incertains += 1;
          else if (r.statut === 'quota') bilan.quota = r.raison;
          else bilan.erreurs += 1;
          dessiner(e);
        }
        if (i < cibles.length - 1) await new Promise((ok) => setTimeout(ok, 400)); // rythme de l'API
      }
    } finally {
      rechercheAuto = false;
      $('btn-enligne-auto').disabled = false;
      elements.forEach(dessiner);
      majFile();
    }
    const restants = cibles.length - bilan.telecharges - bilan.incertains - bilan.erreurs;
    const morceaux = [`${bilan.telecharges} sous-titre(s) téléchargé(s) sur ${cibles.length}`];
    if (bilan.incertains) morceaux.push(`${bilan.incertains} à choisir à la main`);
    if (bilan.erreurs) morceaux.push(`${bilan.erreurs} erreur(s)`);
    if (bilan.quota) morceaux.push(`arrêt : quota du jour atteint (${restants} non cherchée(s))`);
    else if (arretRecherche && restants) morceaux.push(`arrêtée par vous (${restants} non cherchée(s))`);
    notifier(morceaux.join(' · '), bilan.telecharges === cibles.length ? 'succes' : 'alerte', 10000);
  });

  $('btn-vider').addEventListener('click', () => { elements.clear(); liste.replaceChildren(); $('apercu').hidden = true; majFile(); });

  // --- Lancement ----------------------------------------------------------------------
  $('btn-traduire').addEventListener('click', async () => {
    const aTraduire = [...elements.values()].filter(aRetraduire);
    if (!aTraduire.length) return;
    if (selMoteur.value === 'deepl') await window.SubForge.basculerSiUtile?.();
    try {
      enCours = true;
      aTraduire.forEach((e) => { e.etat = 'attente'; e.message = null; e.fait = 0; e.total = 0; });
      elements.forEach(dessiner);
      majFile();
      await T.lancer(aTraduire.map((e) => (e.info.type === 'video' ? { id: e.id, chemin: e.chemin, piste: e.piste } : { id: e.id, chemin: e.chemin })));
    } catch (err) {
      enCours = false;
      aTraduire.forEach((e) => { e.etat = 'pret'; });
      elements.forEach(dessiner);
      majFile();
      erreur(err);
    }
  });

  $('btn-annuler').addEventListener('click', () => T.annuler().catch(erreur));

  T.surProgression((ev) => {
    if (ev.etat === 'fin') {
      enCours = false;
      elements.forEach(dessiner);
      majFile();
      const faits = [...elements.values()].filter((e) => e.etat === 'termine').length;
      const rates = [...elements.values()].filter((e) => e.etat === 'erreur').length;
      if (faits && !rates) notifier(`Traduction terminée : ${faits} fichier${faits > 1 ? 's' : ''} enregistré${faits > 1 ? 's' : ''}.`, 'succes', 6000);
      else if (rates) notifier(`${rates} fichier${rates > 1 ? 's' : ''} en erreur : voir le message sur la carte.`, 'erreur', 7000);
      return;
    }
    const e = elements.get(ev.id);
    if (!e) return;
    e.etat = ev.etat;
    if (ev.fait !== undefined) e.fait = ev.fait;
    if (ev.total !== undefined) e.total = ev.total;
    if (ev.message !== undefined) e.message = ev.message;
    e.relu = ev.relu ?? null;
    e.synchroPct = ev.synchroPct ?? null;
    if (ev.sortie) { e.sortie = ev.sortie; e.nomSortie = ev.nomSortie; }
    if (ev.bilan) e.bilan = ev.bilan;
    dessiner(e);
  });

  // --- Aperçu ------------------------------------------------------------------------
  async function afficherApercu(e) {
    try {
      const r = await T.apercu(e.id);
      if (!r) return;
      $('apercu-titre').textContent = `Aperçu — ${e.nomSortie}`;
      const lignes = [el('div', { classe: 'apercu__ligne apercu__ligne--entete', role: 'row' }, [
        el('span', { texte: 'Temps' }), el('span', { texte: 'Original' }), el('span', { texte: 'Traduction' }),
      ])];
      const notees = r.paires.filter((p) => p.note).length;
      $('apercu-filtre-zone').hidden = notees === 0;
      const seulement = notees > 0 && $('apercu-filtre').checked;
      for (const p of r.paires) {
        if (seulement && !p.note) continue;
        const traduit = el('span', { texte: p.traduit });
        if (p.note) traduit.append(el('span', { classe: `apercu__note apercu__note--${p.note.type}`, texte: `${p.note.type === 'corrige' ? 'Corrigée' : 'À vérifier'} : ${p.note.raison}` }));
        lignes.push(el('div', { classe: `apercu__ligne${p.note ? ` apercu__ligne--${p.note.type}` : ''}`, role: 'row' }, [
          el('span', { classe: 'apercu__temps', texte: String(p.debut).replace(/[,.]\d+$/, '') }),
          el('span', { texte: p.original }),
          traduit,
        ]));
      }
      $('apercu-table').replaceChildren(...lignes);
      const premieres = r.paires.filter((p) => !p.numero || p.numero <= 400).length;
      $('apercu-note').textContent = [
        r.total > premieres ? `${premieres} premières répliques sur ${r.total.toLocaleString('fr-FR')}${notees ? ', plus toutes celles relues' : ''}.` : '',
        notees ? `${notees} réplique${notees > 1 ? 's' : ''} relue${notees > 1 ? 's' : ''} par l'IA (en couleur).` : '',
      ].filter(Boolean).join(' ');
      apercuCourant = e;
      $('apercu').hidden = false;
      $('apercu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { erreur(err); }
  }
  let apercuCourant = null;
  $('apercu-filtre').addEventListener('change', () => { if (apercuCourant) afficherApercu(apercuCourant); });
  $('btn-fermer-apercu').addEventListener('click', () => { $('apercu').hidden = true; });

  // Pour les tests de bout en bout : ajouter des fichiers sans boîte de dialogue.
  window.__subforgeAjouter = ajouter;
})());
