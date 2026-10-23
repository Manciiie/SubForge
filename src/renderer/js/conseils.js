'use strict';
// Conseiller d'IA locale (1.10) : carte graphique, verdict sur les modèles installés, modèle conseillé,
// réglages d'Ollama. Rien n'est téléchargé ni modifié sans un clic de l'utilisateur.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {};
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const K = window.forge.conseils;
  const goFr = (n) => `${Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go`;
  const SOURCES = { 'nvidia-smi': 'mesurée', table: 'd\'après le modèle de carte', manuel: 'indiquée par vous' };

  const copier = (texte) => K.copier(texte).then(() => notifier('Commande copiée : collez-la dans l\'invite de commandes Windows.', 'succes')).catch(erreur);
  const boutonCopier = (texte) => el('button', { classe: 'btn btn--petit', texte: 'Copier la commande', onclick: () => copier(texte) });

  function dessiner(r) {
    const c = r.carte;
    $('conseils-carte').textContent = c.vramGo
      ? `Carte graphique : ${c.nom || 'non nommée'} — ${c.vramGo} Go de mémoire vidéo (${SOURCES[c.source] || 'estimée'}).`
      : `Carte graphique : ${c.nom || 'non détectée'} — indiquez sa mémoire vidéo :`;
    $('conseils-vram-zone').hidden = Boolean(c.vramGo && c.source !== 'manuel');
    if (c.source === 'manuel') $('conseils-vram').value = String(c.vramGo);

    // Modèle conseillé.
    const reco = r.recommandation;
    if (!reco) {
      $('conseils-reco').replaceChildren(el('span', { classe: 'discret', texte: 'Indiquez la mémoire vidéo de la carte pour obtenir un conseil.' }));
    } else if (reco.installe) {
      const utiliser = el('button', { classe: 'btn btn--petit', texte: r.modeleChoisi === reco.nom ? 'Déjà utilisé' : 'Utiliser ce modèle' });
      utiliser.disabled = r.modeleChoisi === reco.nom;
      utiliser.addEventListener('click', async () => {
        try { await window.forge.traduction.modifierReglages({ modeleOllama: reco.nom }); await window.SubForge.chargerModeles?.(); notifier(`Modèle choisi : ${reco.nom}.`, 'succes'); analyser(); } catch (e) { erreur(e); }
      });
      $('conseils-reco').replaceChildren(el('strong', { texte: reco.nom }), el('span', { classe: 'discret', texte: `(${goFr(reco.go)}) — ${reco.pourquoi}. Déjà installé.` }), el('span', { classe: 'espace' }), utiliser);
    } else {
      $('conseils-reco').replaceChildren(
        el('strong', { texte: reco.nom }), el('span', { classe: 'discret', texte: `(${goFr(reco.go)}) — ${reco.pourquoi}.` }),
        el('span', { classe: 'code', texte: reco.commande }), boutonCopier(reco.commande),
        el('span', { classe: 'discret', texte: 'Ensuite : « Actualiser la liste », puis « Mesurer sur ce PC ».' }),
      );
    }

    // Modèles installés.
    const lignes = [el('div', { classe: 'table-glossaire__ligne table-glossaire__ligne--entete', role: 'row' }, ['Modèle', 'Taille', 'Avis', ''].map((t) => el('span', { texte: t })))];
    for (const v of r.verdicts) {
      lignes.push(el('div', { classe: 'table-glossaire__ligne', role: 'row' }, [
        el('span', { classe: 'table-glossaire__terme', texte: `${v.nom}${v.nom === r.modeleChoisi ? '  (utilisé)' : ''}` }),
        el('span', { classe: 'discret', texte: goFr(v.go) }),
        el('span', { classe: `verdict--${v.verdict}`, texte: v.texte }),
        v.commande ? boutonCopier(v.commande) : el('span'),
      ]));
    }
    if (!r.verdicts.length) lignes.push(el('p', { classe: 'discret', texte: r.erreurOllama ? `Ollama ne répond pas (${r.erreurOllama}) : conseil d'après la carte seule.` : 'Aucun modèle installé dans Ollama.' }));
    $('conseils-modeles').replaceChildren(...lignes);

    // Réglages d'Ollama.
    const NOMS = { OLLAMA_FLASH_ATTENTION: 'Flash attention', OLLAMA_KV_CACHE_TYPE: 'Mémoire de travail compressée', OLLAMA_NUM_PARALLEL: 'Demandes simultanées' };
    const reglages = Object.entries(r.reglages);
    const lignesR = [el('div', { classe: 'table-glossaire__ligne table-glossaire__ligne--entete', role: 'row' }, ['Réglage', 'Conseillé', 'État', ''].map((t) => el('span', { texte: t })))];
    for (const [nom, e] of reglages) {
      const etat = e.ok ? 'actif' : e.effectif === null ? 'absent' : `autre valeur : ${e.effectif}${e.systeme !== null && e.utilisateur === null ? ' (réglée pour tout le PC)' : ''}`;
      lignesR.push(el('div', { classe: 'table-glossaire__ligne', role: 'row' }, [
        el('span', { classe: 'table-glossaire__terme', texte: NOMS[nom] || nom, title: nom }),
        el('span', { classe: 'code', texte: e.conseille }),
        el('span', { classe: e.ok ? 'verdict--bon' : 'verdict--juste', texte: etat }),
        el('span'),
      ]));
    }
    $('conseils-reglages').replaceChildren(...lignesR);
    const tousOk = reglages.every(([, e]) => e.ok);
    const windows = r.plateforme === 'win32';
    $('btn-conseils-activer').hidden = !windows || tousOk;
    $('btn-conseils-retablir').hidden = !windows || !r.anciennes;
    $('conseils-reglages-note').textContent = tousOk
      ? 'Tout est réglé. Si vous venez de les activer : redémarrez Ollama (icône près de l\'horloge → Quit, puis relancez-le).'
      : windows ? '« Activer pour moi » les enregistre pour votre compte Windows (sans droits administrateur).' : 'À faire à la main sur ce système :';
    $('conseils-instructions').hidden = windows || tousOk;
    $('conseils-instructions').textContent = r.instructions.linux.join('\n');
    $('conseils-resultat').hidden = false;
  }

  async function analyser() {
    const b = $('btn-conseils-analyser');
    b.disabled = true;
    $('conseils-carte').textContent = 'Analyse en cours…';
    try { dessiner(await K.analyser()); } catch (e) { erreur(e); $('conseils-carte').textContent = 'Analyse impossible : voir le message.'; } finally { b.disabled = false; }
  }

  $('btn-conseils-analyser').addEventListener('click', analyser);
  $('conseils-vram').addEventListener('change', async () => {
    const go = Number($('conseils-vram').value);
    if (!go) return;
    try { await K.vram(go); analyser(); } catch (e) { erreur(e); }
  });
  $('btn-conseils-activer').addEventListener('click', async () => {
    try {
      await K.activerReglages();
      notifier('Réglages enregistrés : redémarrez Ollama pour qu\'ils s\'appliquent (icône près de l\'horloge → Quit, puis relancez-le).', 'succes', 9000);
      analyser();
    } catch (e) { erreur(e); }
  });
  $('btn-conseils-retablir').addEventListener('click', async () => {
    try { await K.retablirReglages(); notifier('Réglages d\'Ollama remis comme avant (au prochain démarrage d\'Ollama).', 'succes', 7000); analyser(); } catch (e) { erreur(e); }
  });
})());
