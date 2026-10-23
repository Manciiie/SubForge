'use strict';
// Contexte du film (TMDB) : réglages (écran Moteurs) et fenêtre « Quel film ? » ouverte depuis une carte.
// Le jeton ne revient jamais dans l'interface : seulement « enregistré » ou non.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {};
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const C = window.forge.contexte;
  const nettoyer = (e) => (e?.message || String(e)).replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');

  // --- Réglages (écran Moteurs) ---------------------------------------------------------
  let etat = await C.etat();
  function dessinerReglages() {
    $('tmdb-presente').hidden = !etat.jeton;
    $('tmdb-saisie').hidden = etat.jeton;
    $('tmdb-actif').checked = etat.actif;
    $('tmdb-actif').disabled = !etat.jeton;
    $('tmdb-statut').textContent = etat.jeton ? (etat.actif ? 'Contexte du film utilisé.' : 'Contexte du film désactivé.') : 'Aucun jeton : les films ne sont pas reconnus.';
  }
  async function rafraichir() { etat = await C.etat(); dessinerReglages(); window.SubForge.rafraichirContextes?.(); }

  $('btn-tmdb-enregistrer').addEventListener('click', async () => {
    const v = $('tmdb-jeton').value.trim();
    if (!v) { notifier('Collez d\'abord votre jeton TMDB.', 'alerte'); return; }
    try { await C.enregistrer(v); $('tmdb-jeton').value = ''; await rafraichir(); notifier('Jeton TMDB enregistré.', 'succes'); } catch (e) { erreur(e); }
  });
  $('tmdb-jeton').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-tmdb-enregistrer').click(); });
  $('btn-tmdb-remplacer').addEventListener('click', () => { $('tmdb-presente').hidden = true; $('tmdb-saisie').hidden = false; $('tmdb-jeton').focus(); });
  $('btn-tmdb-supprimer').addEventListener('click', async () => {
    if (!window.confirm('Supprimer le jeton TMDB enregistré ?')) return;
    try { await C.enregistrer(''); await rafraichir(); notifier('Jeton TMDB supprimé.', 'succes'); } catch (e) { erreur(e); }
  });
  $('tmdb-actif').addEventListener('change', async () => {
    try { await window.forge.traduction.modifierReglages({ contexte: $('tmdb-actif').checked }); await rafraichir(); } catch (e) { erreur(e); }
  });
  $('btn-tmdb-tester').addEventListener('click', async () => {
    const b = $('btn-tmdb-tester');
    b.disabled = true;
    $('tmdb-statut').textContent = 'Test en cours…';
    try { await C.tester(); $('tmdb-statut').textContent = 'TMDB accepte le jeton.'; } catch (e) { $('tmdb-statut').textContent = nettoyer(e); } finally { b.disabled = false; }
  });
  $('btn-tmdb-site').addEventListener('click', () => window.forge.ouvrirLien('https://www.themoviedb.org/settings/api'));
  dessinerReglages();

  // --- Fenêtre « Quel film ? » -------------------------------------------------------------
  const fenetre = $('ctx-fenetre');
  let courant = null; // { chemin }
  let recherche = 0;

  async function chercher() {
    const texte = $('ctx-recherche').value.trim();
    if (!texte) return;
    const n = ++recherche;
    $('ctx-resultats').replaceChildren();
    $('ctx-etat').textContent = 'Recherche sur TMDB…';
    try {
      const r = await C.chercher(texte);
      if (n !== recherche) return;
      if (!r.length) { $('ctx-etat').textContent = 'Rien trouvé : essayez le titre original ou un autre mot du titre.'; return; }
      $('ctx-etat').textContent = `${r.length} résultat(s).`;
      $('ctx-resultats').replaceChildren(...r.map((x) => {
        const bouton = el('button', { classe: 'btn btn--petit', texte: 'Choisir' });
        bouton.addEventListener('click', () => choisir({ type: x.type, id: x.id }));
        return el('div', { classe: 'os-resultat' }, [
          el('div', { classe: 'os-resultat__texte' }, [
            el('span', { classe: 'os-resultat__nom', texte: `${x.titre}${x.annee ? ` (${x.annee})` : ''}`, title: x.original }),
            el('span', { classe: 'discret' }, [el('span', { classe: 'badge', texte: x.type === 'film' ? 'Film' : 'Série' }), x.resume || '']),
          ]),
          bouton,
        ]);
      }));
    } catch (e) {
      if (n === recherche) $('ctx-etat').textContent = nettoyer(e);
    }
  }

  async function choisir(ref) {
    if (!courant) return;
    try {
      const r = await C.choisir(courant.chemin, ref);
      fermer();
      notifier(ref ? (r.etat === 'trouve' ? `Film choisi : ${r.titre}.` : 'Choix enregistré.') : 'Traduction sans contexte de film pour ce titre.', 'succes');
      window.SubForge.rafraichirContextes?.();
    } catch (e) { erreur(e); }
  }

  function fermer() { fenetre.hidden = true; courant = null; recherche += 1; }

  window.SubForge.choisirFilm = ({ chemin, nom, recherche: texte }) => {
    courant = { chemin };
    $('ctx-sous-titre').textContent = `${nom} — le choix vaut pour tous les fichiers de ce titre dans ce dossier.`;
    $('ctx-recherche').value = texte || '';
    $('ctx-resultats').replaceChildren();
    $('ctx-etat').textContent = '';
    fenetre.hidden = false;
    $('ctx-recherche').focus();
    if (texte) chercher();
  };

  $('btn-ctx-chercher').addEventListener('click', chercher);
  $('ctx-recherche').addEventListener('keydown', (e) => { if (e.key === 'Enter') chercher(); });
  $('btn-ctx-aucun').addEventListener('click', () => choisir(null));
  $('btn-ctx-fermer').addEventListener('click', fermer);
  fenetre.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
})());
