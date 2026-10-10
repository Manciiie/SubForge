'use strict';

(async () => {
  const { notifier, erreur, appliquerTheme, afficherEcran } = window.UI;

  // --- Barre de titre et navigation -----------------------------------------
  document.querySelectorAll('.btn-fenetre').forEach((b) =>
    b.addEventListener('click', () => window.forge.fenetre(b.dataset.action)));
  document.querySelectorAll('.nav-item').forEach((b) =>
    b.addEventListener('click', () => afficherEcran(b.dataset.ecran)));

  // --- Paramètres -------------------------------------------------------------
  let p = await window.forge.parametres.lire();
  appliquerTheme(p.theme, p.accent);

  const champTheme = document.getElementById('param-theme');
  const champAccent = document.getElementById('param-accent');
  const champAcceleration = document.getElementById('param-acceleration');
  champTheme.value = p.theme;
  champAccent.value = p.accent;
  champAcceleration.checked = p.accelerationMaterielle;
  const champMaj = document.getElementById('param-maj-demarrage');
  champMaj.checked = p.verifierMajAuDemarrage;
  champMaj.addEventListener('change', () => enregistrer({ verifierMajAuDemarrage: champMaj.checked }));

  async function enregistrer(partiel) {
    try {
      p = await window.forge.parametres.modifier(partiel);
      appliquerTheme(p.theme, p.accent);
    } catch (e) { erreur(e); }
  }
  champTheme.addEventListener('change', () => enregistrer({ theme: champTheme.value }));
  champAccent.addEventListener('change', () => enregistrer({ accent: champAccent.value }));
  champAcceleration.addEventListener('change', async () => {
    await enregistrer({ accelerationMaterielle: champAcceleration.checked });
    notifier('Redémarrez l\'application pour appliquer ce changement.', 'alerte');
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => appliquerTheme(p.theme, p.accent));
  document.getElementById('btn-journaux').addEventListener('click', () => window.forge.ouvrirJournaux());
  document.getElementById('btn-rapport').addEventListener('click', async () => {
    try {
      await window.forge.copierRapport();
      notifier('Rapport copié. Collez-le dans la conversation avec Claude et décrivez ce qui s\'est passé.', 'succes', 7000);
    } catch (e) { erreur(e); }
  });

  // --- À propos ----------------------------------------------------------------
  const infos = await window.forge.infos();
  document.getElementById('apropos-nom').textContent = infos.nom;
  document.getElementById('apropos-version').textContent = infos.version;
  document.getElementById('apropos-changelog').textContent = infos.changelog || 'Aucun journal des modifications.';

  // Signal utilisé par le test de lancement automatique (une fois les écrans des modules prêts).
  await Promise.all(window.__modules || []);
  window.__forgePret = true;
})().catch((e) => {
  console.error(e);
  window.UI?.erreur(e);
});
