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
        infos = paquet.map((c) => ({ chemin: c, nom: c, type: 'erreur', erreur: err.message.replace(/^Error invoking remote method '[^']+': (\w+Error: )?/, '') }));
      }
      infos.forEach((info, i) => {
        const e = elements.get(ids[k + i]);
        if (!e) return;
        appliquerInfo(e, info);
        dessiner(e);
      });
      majFile();
    }
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
        extensions: 'srt,ass,ssa,vtt,mkv,mp4,m4v,avi,mov,webm,ts,m2ts,wmv',
      }));
    } catch (e) { erreur(e); }
  });

  // --- Cartes -----------------------------------------------------------------------
  const LIBELLES = {
    analyse: 'Analyse…', pret: 'Prêt', 'sans-piste': 'Pas de sous-titres', attente: 'En attente', extraction: 'Extraction de la piste…',
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

    if (['traduction', 'extraction', 'ecriture'].includes(e.etat)) {
      const pct = e.total ? Math.round((100 * (e.fait || 0)) / e.total) : 0;
      const barre = el('div', { classe: 'barre-progression' }, [el('span')]);
      barre.firstChild.style.width = `${e.etat === 'ecriture' ? 100 : pct}%`;
      corps.push(barre);
      if (e.total) corps.push(el('span', { classe: 'discret', texte: `${e.fait || 0} / ${e.total} segments` }));
    }
    if (e.message && ['erreur', 'annule', 'sans-piste'].includes(e.etat)) corps.push(el('p', { classe: 'carte-fichier__message', texte: e.message }));
    if (e.etat === 'termine' && e.bilan) {
      const b = e.bilan;
      const morceaux = [];
      if (b.repris) morceaux.push(`${b.repris.toLocaleString('fr-FR')} réplique${b.repris > 1 ? 's' : ''} reprise${b.repris > 1 ? 's' : ''} de la mémoire`);
      if (b.caracteresEconomises && reglages.traduction.moteur === 'deepl') morceaux.push(`${b.caracteresEconomises.toLocaleString('fr-FR')} caractères DeepL économisés`);
      if (b.envoyes) morceaux.push(`${b.envoyes.toLocaleString('fr-FR')} envoyée${b.envoyes > 1 ? 's' : ''} au moteur`);
      if (morceaux.length) corps.push(el('span', { classe: 'discret', texte: morceaux.join(' · ') }));
      if (b.aVerifier) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `${b.aVerifier} réplique${b.aVerifier > 1 ? 's' : ''} à vérifier : le moteur a perdu un terme du glossaire.` }));
      if (b.erreurMemoire) corps.push(el('p', { classe: 'carte-fichier__message carte-fichier__message--alerte', texte: `Mémoire de traduction non enregistrée (${b.erreurMemoire}) : la traduction, elle, est bien écrite.` }));
    }
    if (e.etat === 'termine') {
      corps.push(el('div', { classe: 'carte-fichier__actions' }, [
        el('span', { classe: 'discret', texte: `→ ${e.nomSortie}` }),
        el('span', { classe: 'espace' }),
        el('button', { classe: 'btn btn--petit', texte: 'Aperçu', onclick: () => afficherApercu(e) }),
        el('button', { classe: 'btn btn--petit', texte: 'Ouvrir le dossier', onclick: () => T.montrer(e.sortie).catch(erreur) }),
      ]));
    } else if (!enCours) {
      corps.push(el('div', { classe: 'carte-fichier__actions' }, [
        el('span', { classe: 'espace' }),
        el('button', { classe: 'btn btn--petit btn--lien', texte: 'Retirer', onclick: () => { elements.delete(e.id); carte.remove(); majFile(); } }),
      ]));
    }
    carte.replaceChildren(...corps);
    if (!carte.isConnected) liste.append(carte);
  }

  // Fichiers à (re)traduire : prêts, en erreur ou annulés — jamais ceux déjà traduits.
  function aRetraduire(e) {
    return ['pret', 'erreur', 'annule'].includes(e.etat) && (e.info?.type === 'soustitre' || (e.info?.type === 'video' && e.piste !== null));
  }

  function majFile() {
    $('file').hidden = elements.size === 0;
    const prets = [...elements.values()].filter(aRetraduire);
    zone.classList.toggle('compacte', elements.size > 0);
    $('file-titre').textContent = `${elements.size} fichier${elements.size > 1 ? 's' : ''}`;
    $('btn-traduire').disabled = enCours || prets.length === 0 || [...elements.values()].some((e) => e.etat === 'analyse');
    $('btn-traduire').hidden = enCours;
    $('btn-annuler').hidden = !enCours;
    $('btn-vider').hidden = enCours;
    for (const s of [selSource, selCible, selMoteur, selFormat, $('btn-dossier'), $('btn-dossier-defaut')]) s.disabled = enCours;
  }

  $('btn-vider').addEventListener('click', () => { elements.clear(); liste.replaceChildren(); $('apercu').hidden = true; majFile(); });

  // --- Lancement ----------------------------------------------------------------------
  $('btn-traduire').addEventListener('click', async () => {
    const aTraduire = [...elements.values()].filter(aRetraduire);
    if (!aTraduire.length) return;
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
      for (const p of r.paires) {
        lignes.push(el('div', { classe: 'apercu__ligne', role: 'row' }, [
          el('span', { classe: 'apercu__temps', texte: String(p.debut).replace(/[,.]\d+$/, '') }),
          el('span', { texte: p.original }),
          el('span', { texte: p.traduit }),
        ]));
      }
      $('apercu-table').replaceChildren(...lignes);
      $('apercu-note').textContent = r.total > r.paires.length ? `${r.paires.length} premières répliques sur ${r.total.toLocaleString('fr-FR')}.` : '';
      $('apercu').hidden = false;
      $('apercu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { erreur(err); }
  }
  $('btn-fermer-apercu').addEventListener('click', () => { $('apercu').hidden = true; });

  // Pour les tests de bout en bout : ajouter des fichiers sans boîte de dialogue.
  window.__subforgeAjouter = ajouter;
})());
