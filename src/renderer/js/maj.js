'use strict';
// Interface des mises à jour : fenêtre « Mise à jour disponible » + carte dans Paramètres.
// Rien n'est téléchargé sans un clic sur « Télécharger et installer ».

(async () => {
  const { notifier } = window.UI;
  const $ = (id) => document.getElementById(id);
  const fenetre = $('maj-fenetre');
  const statut = $('maj-statut');
  const boutonVerifier = $('btn-maj-verifier');

  const mo = (o) => `${(o / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
  const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

  let fenetreFermeeParUtilisateur = false;

  function ouvrir() { fenetre.hidden = false; }
  function fermer() { fenetre.hidden = true; fenetreFermeeParUtilisateur = true; }

  function boutons({ telecharger = false, installer = false, plusTard = true, ignorer = false, texteplusTard = 'Plus tard' }) {
    $('maj-telecharger').hidden = !telecharger;
    $('maj-installer').hidden = !installer;
    $('maj-plus-tard').hidden = !plusTard;
    $('maj-plus-tard').textContent = texteplusTard;
    $('maj-ignorer').hidden = !ignorer;
  }

  function afficher(e) {
    // Carte Paramètres
    const libelles = {
      inactif: `Version ${e.versionActuelle || ''}`,
      'non-configure': e.message || 'Mises à jour non configurées dans cette version.',
      verification: 'Recherche de mises à jour…',
      'a-jour': `Version ${e.versionActuelle} — vous avez la dernière version.`,
      ignoree: `Version ${e.version} disponible (ignorée).`,
      disponible: `Version ${e.version} disponible.`,
      telechargement: `Téléchargement de la version ${e.version}… ${e.pourcent ?? 0} %`,
      pret: `Version ${e.version} prête : elle sera installée à la fermeture.`,
      erreur: e.message || 'Erreur de mise à jour.',
    };
    statut.textContent = libelles[e.etat] || '';
    boutonVerifier.disabled = ['verification', 'telechargement'].includes(e.etat);

    // Fenêtre
    $('maj-erreur').hidden = true;
    $('maj-progression').hidden = true;
    switch (e.etat) {
      case 'disponible':
        fenetreFermeeParUtilisateur = false;
        $('maj-titre').textContent = 'Mise à jour disponible';
        $('maj-resume').textContent = [
          `Version ${e.version} (vous avez la ${e.versionActuelle})`,
          e.date ? `publiée le ${dateFr(e.date)}` : '',
          e.taille ? mo(e.taille) : '',
        ].filter(Boolean).join(' · ');
        $('maj-notes').textContent = e.notes || '';
        boutons({ telecharger: true, ignorer: true });
        ouvrir();
        break;
      case 'telechargement':
        $('maj-titre').textContent = 'Téléchargement de la mise à jour';
        $('maj-progression').hidden = false;
        $('maj-barre').style.width = `${e.pourcent || 0}%`;
        $('maj-progression-texte').textContent = e.total
          ? `${mo(e.transfere)} / ${mo(e.total)}${e.vitesse ? ` · ${mo(e.vitesse)}/s` : ''}`
          : 'Préparation…';
        boutons({ texteplusTard: 'Continuer en arrière-plan' });
        if (!fenetreFermeeParUtilisateur) ouvrir();
        break;
      case 'pret':
        $('maj-titre').textContent = 'Mise à jour prête';
        $('maj-resume').textContent = `La version ${e.version} est téléchargée et vérifiée.`;
        $('maj-notes').textContent = '';
        boutons({ installer: true, texteplusTard: 'À la fermeture' });
        ouvrir();
        break;
      case 'erreur':
        if (e.manuel) {
          $('maj-titre').textContent = 'Mise à jour impossible';
          $('maj-resume').textContent = '';
          $('maj-notes').textContent = '';
          $('maj-erreur').textContent = e.message;
          $('maj-erreur').hidden = false;
          boutons({ texteplusTard: 'Fermer' });
          ouvrir();
        }
        break;
      case 'a-jour':
        if (e.manuel) notifier(`Vous avez la dernière version (${e.versionActuelle}).`, 'succes');
        break;
      case 'non-configure':
        if (e.manuel) notifier(e.message, 'alerte', 6000);
        break;
      default:
        break;
    }
  }

  $('maj-telecharger').addEventListener('click', () => window.forge.majs.telecharger().catch((e) => window.UI.erreur(e)));
  $('maj-installer').addEventListener('click', () => window.forge.majs.installer().catch((e) => window.UI.erreur(e)));
  $('maj-plus-tard').addEventListener('click', fermer);
  $('maj-ignorer').addEventListener('click', async () => {
    await window.forge.majs.ignorer().catch((e) => window.UI.erreur(e));
    fermer();
    notifier('Cette version ne sera plus proposée au démarrage.', 'info');
  });
  fenetre.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fermer(); });
  boutonVerifier.addEventListener('click', () => window.forge.majs.verifier().catch((e) => window.UI.erreur(e)));

  window.forge.majs.surChangement(afficher);
  afficher(await window.forge.majs.etat());
})().catch((e) => {
  console.error(e);
  window.UI?.erreur(e);
});
