'use strict';
// Écran « Moteurs » : clé DeepL (jamais réaffichée), ton, quota ; adresse et modèle de l'IA locale.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {}; // fonctions partagées entre écrans
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const M = window.forge.moteurs;
  const T = window.forge.traduction;
  const nombre = (n) => Number(n).toLocaleString('fr-FR');

  async function rafraichir() {
    const etat = await M.etat();
    $('deepl-cle-presente').hidden = !etat.cleDeepl;
    $('deepl-cle-saisie').hidden = etat.cleDeepl;
    $('deepl-formalite').value = etat.deepl.formalite;
    $('ollama-adresse').value = etat.ollama.adresse;
    if (etat.ollama.modele && ![...$('ollama-modele').options].some((o) => o.value === etat.ollama.modele)) {
      $('ollama-modele').append(el('option', { value: etat.ollama.modele, texte: etat.ollama.modele }));
    }
    $('ollama-modele').value = etat.ollama.modele || '';
    $('ollama-parallele').value = String(etat.ollama.parallele || 2);
    $('ollama-garder').checked = etat.ollama.garderCharge !== false;
    await window.SubForge.rafraichirOptions?.();
    return etat;
  }

  function afficherQuota(u) {
    const pct = u.limite ? Math.min(100, (100 * u.utilises) / u.limite) : 0;
    $('deepl-quota').textContent = `Offre ${u.offre} : ${nombre(u.utilises)} / ${nombre(u.limite)} caractères utilisés ce mois-ci (${nombre(Math.max(0, u.limite - u.utilises))} restants).`;
    const barre = $('deepl-barre-quota');
    barre.hidden = false;
    barre.firstChild.style.width = `${pct}%`;
  }

  // --- DeepL ---
  $('btn-deepl-enregistrer').addEventListener('click', async () => {
    const champ = $('deepl-cle');
    if (!champ.value.trim()) { notifier('Collez d\'abord votre clé DeepL.', 'alerte'); return; }
    const bouton = $('btn-deepl-enregistrer');
    bouton.disabled = true;
    try {
      const r = await M.enregistrerCleDeepl(champ.value);
      champ.value = '';
      await rafraichir();
      if (r.usage) { afficherQuota(r.usage); notifier('Clé DeepL enregistrée et vérifiée.', 'succes'); } else notifier(`Clé enregistrée, mais : ${r.avertissement}`, 'alerte', 8000);
    } catch (e) { erreur(e); } finally { bouton.disabled = false; }
  });
  $('deepl-cle').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-deepl-enregistrer').click(); });
  $('btn-deepl-remplacer').addEventListener('click', () => {
    $('deepl-cle-presente').hidden = true;
    $('deepl-cle-saisie').hidden = false;
    $('deepl-cle').focus();
  });
  $('btn-deepl-supprimer').addEventListener('click', async () => {
    if (!window.confirm('Supprimer la clé DeepL enregistrée ?')) return;
    try { await M.supprimerCleDeepl(); $('deepl-barre-quota').hidden = true; $('deepl-quota').textContent = 'Quota : —'; await rafraichir(); notifier('Clé DeepL supprimée.', 'succes'); } catch (e) { erreur(e); }
  });
  $('btn-deepl-tester').addEventListener('click', async () => {
    const b = $('btn-deepl-tester');
    b.disabled = true;
    try { afficherQuota(await M.testerDeepl()); notifier('DeepL répond correctement.', 'succes'); } catch (e) { erreur(e); } finally { b.disabled = false; }
  });
  $('deepl-formalite').addEventListener('change', () => T.modifierReglages({ formalite: $('deepl-formalite').value }).catch(erreur));
  $('btn-deepl-site').addEventListener('click', () => window.forge.ouvrirLien('https://www.deepl.com/pro-api'));

  // --- Ollama ---
  // Liste des modèles d'Ollama. Un seul modèle (ou le modèle choisi a disparu) → choisi automatiquement.
  async function chargerModeles({ silencieux = false } = {}) {
    const statut = $('ollama-statut');
    statut.textContent = 'Recherche des modèles…';
    try {
      const modeles = await M.modelesOllama($('ollama-adresse').value);
      const sel = $('ollama-modele');
      const etat = await M.etat();
      const actuel = etat.ollama.modele || sel.value;
      sel.replaceChildren(el('option', { value: '', texte: '— Aucun —' }), ...modeles.map((m) => el('option', {
        value: m.nom, texte: m.taille ? `${m.nom} (${(m.taille / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go)` : m.nom,
      })));
      let choisi = modeles.some((m) => m.nom === actuel) ? actuel : '';
      if (!choisi && modeles.length && (modeles.length === 1 || actuel)) choisi = modeles[0].nom;
      sel.value = choisi;
      if (choisi !== (etat.ollama.modele || '')) {
        await T.modifierReglages({ modeleOllama: choisi });
        if (choisi) notifier(`Modèle d'IA locale choisi : ${choisi}.`, 'succes');
      }
      statut.textContent = modeles.length
        ? `Ollama répond : ${modeles.length} modèle(s) installé(s).`
        : 'Ollama répond, mais aucun modèle n\'est installé. Dans l\'invite de commandes Windows, tapez : ollama pull qwen2.5:7b — puis « Actualiser la liste ».';
      await basculerSiUtile();
    } catch (e) {
      const message = (e?.message || String(e)).replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');
      statut.textContent = silencieux ? `IA locale non détectée : ${message}` : message;
    }
    await window.SubForge.rafraichirOptions?.();
  }

  // Sans clé DeepL, avec un modèle d'IA locale prêt : le moteur passe tout seul sur l'IA locale.
  async function basculerSiUtile() {
    const etat = await M.etat();
    if (etat.traduction.moteur === 'deepl' && !etat.cleDeepl && etat.ollama.modele) {
      await T.modifierReglages({ moteur: 'ollama' });
      await window.SubForge.rafraichirOptions?.();
      notifier(`Pas de clé DeepL : SubForge utilise l'IA locale (${etat.ollama.modele}).`, 'info', 7000);
      return true;
    }
    return false;
  }
  window.SubForge.basculerSiUtile = basculerSiUtile;
  window.SubForge.chargerModeles = chargerModeles;

  $('ollama-adresse').addEventListener('change', async () => {
    try { await T.modifierReglages({ adresseOllama: $('ollama-adresse').value }); await chargerModeles(); } catch (e) { erreur(e); await rafraichir(); }
  });
  $('ollama-modele').addEventListener('change', async () => {
    try { await T.modifierReglages({ modeleOllama: $('ollama-modele').value }); await basculerSiUtile(); await window.SubForge.rafraichirOptions?.(); } catch (e) { erreur(e); }
  });
  $('btn-ollama-actualiser').addEventListener('click', () => chargerModeles());
  $('btn-ollama-tester').addEventListener('click', async () => {
    const b = $('btn-ollama-tester');
    b.disabled = true;
    $('ollama-statut').textContent = 'Test en cours (le premier chargement du modèle peut prendre une minute)…';
    try {
      const r = await M.testerOllama();
      $('ollama-statut').textContent = `« Good morning, how are you? » → « ${r.exemple} »`;
    } catch (e) { erreur(e); $('ollama-statut').textContent = ''; } finally { b.disabled = false; }
  });
  $('btn-ollama-site').addEventListener('click', () => window.forge.ouvrirLien('https://ollama.com/download'));

  // --- Demandes simultanées (1.6) ---
  $('ollama-garder').addEventListener('change', () => T.modifierReglages({ garderChargeOllama: $('ollama-garder').checked }).catch(erreur));
  $('ollama-parallele').addEventListener('change', () => T.modifierReglages({ paralleleOllama: Number($('ollama-parallele').value) }).catch(erreur));
  M.surMesure((texte) => { $('ollama-mesure').textContent = texte; });
  $('btn-ollama-mesurer').addEventListener('click', async () => {
    const b = $('btn-ollama-mesurer');
    b.disabled = true;
    $('btn-ollama-annuler-mesure').hidden = false;
    $('ollama-mesure').textContent = 'Mesure en cours (une à trois minutes)…';
    try {
      const r = await M.mesurerOllama();
      const s = (ms) => `${(ms / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
      $('ollama-mesure').textContent = `40 répliques : ${s(r.t1)} avec 1 demande, ${s(r.t2)} avec 2 demandes à la fois → réglé sur ${r.conseil}${r.conseil === 2 ? ` (${Math.round((1 - r.t2 / r.t1) * 100)} % plus rapide)` : ' (pas plus rapide en parallèle sur ce PC)'}.`;
      $('ollama-parallele').value = String(r.conseil);
    } catch (e) {
      const m = (e?.message || String(e)).replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');
      $('ollama-mesure').textContent = /annulée/i.test(m) ? 'Mesure annulée.' : m;
    } finally {
      b.disabled = false;
      $('btn-ollama-annuler-mesure').hidden = true;
    }
  });
  $('btn-ollama-annuler-mesure').addEventListener('click', () => M.annulerMesure().catch(erreur));

  // --- Mémoire de traduction ---
  async function majMemoire() {
    try {
      const m = await window.forge.memoire.etat();
      $('memoire-active').checked = m.active;
      const mo = (m.taille / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
      if (m.chargement && m.taille) {
        // Préchargement en cours (1.7) : on repasse dans une seconde.
        $('memoire-etat').textContent = `Mémoire de ${mo} Mo : lecture en cours…`;
        $('btn-memoire-vider').disabled = true;
        setTimeout(majMemoire, 1000);
        return;
      }
      $('memoire-etat').textContent = m.entrees ? `${nombre(m.entrees)} répliques en mémoire (${mo} Mo)` : 'Mémoire vide';
      $('btn-memoire-vider').disabled = !m.entrees;
    } catch (e) { erreur(e); $('memoire-etat').textContent = 'État de la mémoire illisible.'; }
  }
  $('memoire-active').addEventListener('change', async () => {
    try { await T.modifierReglages({ memoire: $('memoire-active').checked }); } catch (e) { erreur(e); }
    majMemoire();
  });
  $('btn-memoire-vider').addEventListener('click', async () => {
    if (!window.confirm('Vider la mémoire de traduction ? Les répliques déjà traduites seront à nouveau envoyées au moteur.')) return;
    try { await window.forge.memoire.vider(); notifier('Mémoire de traduction vidée.', 'succes'); } catch (e) { erreur(e); }
    majMemoire();
  });
  window.SubForge.majMemoire = majMemoire;
  document.querySelector('.nav-item[data-ecran="moteurs"]').addEventListener('click', () => { majMemoire(); chargerModeles(); });

  await rafraichir();
  await majMemoire();
  // Détection discrète au démarrage, sans bloquer l'affichage.
  chargerModeles({ silencieux: true });
})());
