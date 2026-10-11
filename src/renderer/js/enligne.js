'use strict';
// Sous-titres en ligne : réglages OpenSubtitles (écran Moteurs) et fenêtre « Chercher en ligne » d'une vidéo.
// La clé et le mot de passe ne reviennent jamais dans l'interface : seulement « enregistré » ou non.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {};
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const E = window.forge.enLigne;
  const nettoyer = (e) => (e?.message || String(e)).replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');

  const langues = await window.forge.traduction.langues();
  let etat = await E.etat();

  // --- Réglages (écran Moteurs) ---------------------------------------------------------
  function dessinerReglages() {
    $('os-cle-presente').hidden = !etat.cle;
    $('os-cle-saisie').hidden = etat.cle;
    $('os-utilisateur').value = etat.utilisateur || '';
    $('os-mdp').placeholder = etat.motDePasse ? 'Mot de passe enregistré' : 'Mot de passe';
    $('os-statut').textContent = etat.cle
      ? (etat.utilisateur && etat.motDePasse ? `Compte « ${etat.utilisateur} » enregistré.` : 'Sans compte : quelques téléchargements par jour.')
      : 'Aucune clé : la recherche en ligne est désactivée.';
  }
  async function rafraichir() { etat = await E.etat(); dessinerReglages(); }

  $('btn-os-enregistrer-cle').addEventListener('click', async () => {
    const v = $('os-cle').value.trim();
    if (!v) { notifier('Collez d\'abord votre clé d\'API OpenSubtitles.', 'alerte'); return; }
    try { await E.enregistrer({ cle: v }); $('os-cle').value = ''; await rafraichir(); notifier('Clé OpenSubtitles enregistrée.', 'succes'); } catch (e) { erreur(e); }
  });
  $('btn-os-remplacer').addEventListener('click', () => { $('os-cle-presente').hidden = true; $('os-cle-saisie').hidden = false; $('os-cle').focus(); });
  $('btn-os-supprimer').addEventListener('click', async () => {
    if (!window.confirm('Supprimer la clé d\'API OpenSubtitles enregistrée ?')) return;
    try { await E.enregistrer({ cle: '' }); await rafraichir(); notifier('Clé OpenSubtitles supprimée.', 'succes'); } catch (e) { erreur(e); }
  });
  $('btn-os-compte').addEventListener('click', async () => {
    const o = { utilisateur: $('os-utilisateur').value.trim() };
    if ($('os-mdp').value) o.motDePasse = $('os-mdp').value;
    if (!o.utilisateur) o.motDePasse = '';
    try { await E.enregistrer(o); $('os-mdp').value = ''; await rafraichir(); notifier(o.utilisateur ? 'Compte OpenSubtitles enregistré.' : 'Compte OpenSubtitles retiré.', 'succes'); } catch (e) { erreur(e); }
  });
  $('btn-os-tester').addEventListener('click', async () => {
    const b = $('btn-os-tester');
    b.disabled = true;
    $('os-statut').textContent = 'Test en cours…';
    try {
      const r = await E.tester();
      $('os-statut').textContent = r.connecte
        ? `Connecté : ${r.quota ?? '?'} téléchargements autorisés par jour.`
        : 'Clé valide (sans compte : téléchargements limités).';
    } catch (e) { $('os-statut').textContent = nettoyer(e); } finally { b.disabled = false; }
  });
  $('btn-os-site').addEventListener('click', () => window.forge.ouvrirLien('https://www.opensubtitles.com/fr/consumers'));
  dessinerReglages();

  // --- Fenêtre « Chercher en ligne » ------------------------------------------------------
  const fenetre = $('os-fenetre');
  for (const code of etat.langues) {
    const l = langues.find((x) => x.code === code);
    if (l) $('os-langue').append(el('option', { value: l.code, texte: l.nom }));
  }
  let courant = null; // { chemin, nom, surTelechargement }
  let recherche = 0;
  let telechargement = false;

  async function chercher() {
    if (!courant) return;
    const n = ++recherche;
    $('os-resultats').replaceChildren();
    $('os-etat').textContent = 'Recherche sur OpenSubtitles…';
    $('btn-os-chercher').disabled = true;
    try {
      const r = await E.chercher(courant.chemin, $('os-langue').value);
      if (n !== recherche) return; // une recherche plus récente a été lancée
      const nomLangue = $('os-langue').selectedOptions[0]?.textContent || '';
      const base = [r.recherche.titre && `« ${r.recherche.titre} »`, r.recherche.annee, r.recherche.saison !== undefined && `saison ${r.recherche.saison}, épisode ${r.recherche.episode}`].filter(Boolean).join(' · ');
      if (!r.resultats.length) {
        $('os-etat').textContent = `Rien trouvé pour ce film en ${nomLangue.toLowerCase()}${base ? ` (${base})` : ''}. Essayez une autre langue : SubForge traduira ensuite.`;
        return;
      }
      $('os-etat').textContent = `${r.resultats.length} résultat(s)${base ? ` pour ${base}` : ''}${r.recherche.empreinte ? '' : ' (recherche par nom seulement)'}.`;
      $('os-resultats').replaceChildren(...r.resultats.map((x) => {
        const badges = [];
        if (x.exact) badges.push(el('span', { classe: 'badge badge--exact', texte: 'Correspond exactement à ce fichier' }));
        if (x.traductionAuto) badges.push(el('span', { classe: 'badge badge--auto', texte: 'Traduction automatique' }));
        if (x.malentendants) badges.push(el('span', { classe: 'badge', texte: 'Malentendants' }));
        if (x.plusieursCd) badges.push(el('span', { classe: 'badge', texte: 'Plusieurs CD' }));
        const bouton = el('button', { classe: `btn btn--petit${x.exact ? ' btn--principal' : ''}`, texte: 'Télécharger' });
        bouton.addEventListener('click', () => telecharger(x, bouton));
        return el('div', { classe: 'os-resultat' }, [
          el('div', { classe: 'os-resultat__texte' }, [
            el('span', { classe: 'os-resultat__nom', texte: x.version || x.nomFichier, title: x.nomFichier }),
            el('span', { classe: 'discret' }, [...badges, `${x.telechargements.toLocaleString('fr-FR')} téléchargements`]),
          ]),
          bouton,
        ]);
      }));
    } catch (e) {
      if (n === recherche) $('os-etat').textContent = nettoyer(e);
    } finally {
      if (n === recherche) $('btn-os-chercher').disabled = false;
    }
  }

  async function telecharger(x, bouton) {
    if (telechargement) return; // double-clic : un seul téléchargement
    telechargement = true;
    for (const b of $('os-resultats').querySelectorAll('button')) b.disabled = true;
    bouton.textContent = 'Téléchargement…';
    try {
      const r = await E.telecharger(courant.chemin, x.fileId, $('os-langue').value);
      const nom = r.fichier.split(/[\\/]/).pop();
      $('os-quota').textContent = r.restants !== null ? `${r.restants} téléchargement(s) restant(s) aujourd'hui` : '';
      notifier(`Sous-titres téléchargés : ${nom}`, 'succes', 6000);
      const fin = courant.surTelechargement;
      fermer();
      await fin?.(r.fichier);
    } catch (e) {
      erreur(e);
      bouton.textContent = 'Télécharger';
      for (const b of $('os-resultats').querySelectorAll('button')) b.disabled = false;
    } finally {
      telechargement = false;
    }
  }

  function fermer() { fenetre.hidden = true; courant = null; recherche += 1; }

  // Ouvert depuis la carte d'une vidéo (écran Traduire).
  window.SubForge.chercherEnLigne = async ({ chemin, nom, langue, surTelechargement }) => {
    await rafraichir();
    if (!etat.cle) {
      notifier('Ajoutez d\'abord une clé d\'API OpenSubtitles (gratuite) dans l\'écran Moteurs.', 'alerte', 7000);
      window.UI.afficherEcran('moteurs');
      $('os-cle').focus();
      return;
    }
    courant = { chemin, nom, surTelechargement };
    $('os-titre').textContent = 'Sous-titres en ligne';
    $('os-sous-titre').textContent = nom;
    $('os-quota').textContent = '';
    $('os-langue').value = etat.langues.includes(langue) ? langue : 'en';
    fenetre.hidden = false;
    chercher();
  };

  $('btn-os-chercher').addEventListener('click', chercher);
  $('os-langue').addEventListener('change', chercher);
  $('btn-os-fermer').addEventListener('click', fermer);
  fenetre.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
})());
