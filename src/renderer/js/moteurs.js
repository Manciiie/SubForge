'use strict';
// Écran « Moteurs » : clé DeepL (jamais réaffichée), ton, quota ; adresse et modèle de l'IA locale.

window.__modules = window.__modules || [];
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
    await window.SubForge?.rafraichirOptions();
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
  async function chargerModeles({ silencieux = false } = {}) {
    const statut = $('ollama-statut');
    statut.textContent = 'Recherche des modèles…';
    try {
      const modeles = await M.modelesOllama($('ollama-adresse').value);
      const sel = $('ollama-modele');
      const actuel = sel.value;
      sel.replaceChildren(el('option', { value: '', texte: '— Aucun —' }), ...modeles.map((m) => el('option', {
        value: m.nom, texte: m.taille ? `${m.nom} (${(m.taille / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go)` : m.nom,
      })));
      if (modeles.some((m) => m.nom === actuel)) sel.value = actuel;
      statut.textContent = modeles.length ? `Ollama répond : ${modeles.length} modèle(s) installé(s).` : 'Ollama répond, mais aucun modèle n\'est installé (ollama pull …).';
    } catch (e) {
      statut.textContent = silencieux ? 'IA locale non détectée.' : e.message.replace(/^Error invoking remote method '[^']+': (\w+Error: )?/, '');
    }
  }

  $('ollama-adresse').addEventListener('change', async () => {
    try { await T.modifierReglages({ adresseOllama: $('ollama-adresse').value }); await chargerModeles(); } catch (e) { erreur(e); await rafraichir(); }
  });
  $('ollama-modele').addEventListener('change', async () => {
    try { await T.modifierReglages({ modeleOllama: $('ollama-modele').value }); await window.SubForge?.rafraichirOptions(); } catch (e) { erreur(e); }
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

  await rafraichir();
  // Détection discrète au démarrage, sans bloquer l'affichage.
  chargerModeles({ silencieux: true });
})());
