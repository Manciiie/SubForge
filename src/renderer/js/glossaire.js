'use strict';
// Écran « Glossaire » : ajouter, modifier, supprimer, rechercher, importer des termes.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {};
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const G = window.forge.glossaire;

  const langues = await window.forge.traduction.langues();
  const nomLangue = (code) => (code === '*' ? 'Toutes' : langues.find((l) => l.code === code)?.nom || code);
  for (const l of langues) $('gl-cible').append(el('option', { value: l.code, texte: l.nom }));

  let entrees = [];
  let enEdition = null; // id du terme modifié

  function viderFormulaire() {
    enEdition = null;
    $('gl-terme').value = '';
    $('gl-traduction').value = '';
    $('gl-cible').value = '*';
    $('gl-casse').checked = false;
    $('gl-enregistrer').textContent = 'Ajouter';
    $('glossaire-titre-form').textContent = 'Ajouter un terme';
    $('gl-annuler').hidden = true;
  }

  function dessiner() {
    const filtre = $('gl-recherche').value.trim().toLowerCase();
    const visibles = entrees
      .filter((e) => !filtre || e.terme.toLowerCase().includes(filtre) || e.traduction.toLowerCase().includes(filtre))
      .sort((a, b) => a.terme.localeCompare(b.terme, 'fr', { sensitivity: 'base' }));
    $('gl-compte').textContent = entrees.length ? `${entrees.length.toLocaleString('fr-FR')} terme${entrees.length > 1 ? 's' : ''}` : 'Termes';
    $('gl-vide').hidden = entrees.length > 0;
    const lignes = [];
    if (entrees.length) {
      lignes.push(el('div', { classe: 'table-glossaire__ligne table-glossaire__ligne--entete', role: 'row' }, [
        el('span', { texte: 'Terme' }), el('span', { texte: 'Traduction' }), el('span', { texte: 'Langue' }), el('span'),
      ]));
    }
    for (const e of visibles.slice(0, 500)) {
      lignes.push(el('div', { classe: 'table-glossaire__ligne', role: 'row' }, [
        el('span', { classe: 'table-glossaire__terme', texte: e.terme + (e.casse ? '  (casse)' : '') }),
        e.traduction ? el('span', { texte: e.traduction }) : el('span', { classe: 'discret', texte: 'ne pas traduire' }),
        el('span', { classe: 'discret', texte: nomLangue(e.cible) }),
        el('span', { classe: 'table-glossaire__actions' }, [
          el('button', { classe: 'btn btn--petit', texte: 'Modifier', onclick: () => modifier(e) }),
          el('button', { classe: 'btn btn--petit btn--lien', texte: 'Supprimer', onclick: () => supprimer(e) }),
        ]),
      ]));
    }
    if (visibles.length > 500) lignes.push(el('p', { classe: 'discret', texte: `… et ${visibles.length - 500} autres : affinez la recherche.` }));
    if (entrees.length && !visibles.length) lignes.push(el('p', { classe: 'discret', texte: 'Aucun terme ne correspond à la recherche.' }));
    $('gl-table').replaceChildren(...lignes);
  }

  async function charger() {
    try {
      const r = await G.lister();
      entrees = r.entrees;
      $('glossaire-avertissement').textContent = r.avertissement || '';
    } catch (e) {
      erreur(e);
      $('glossaire-avertissement').textContent = 'Glossaire illisible : voir le journal (Paramètres → Dépannage).';
    }
    dessiner();
  }

  function modifier(e) {
    enEdition = e.id;
    $('gl-terme').value = e.terme;
    $('gl-traduction').value = e.traduction;
    $('gl-cible').value = e.cible;
    $('gl-casse').checked = e.casse;
    $('gl-enregistrer').textContent = 'Enregistrer';
    $('glossaire-titre-form').textContent = `Modifier « ${e.terme} »`;
    $('gl-annuler').hidden = false;
    $('gl-terme').focus();
  }

  async function supprimer(e) {
    if (!window.confirm(`Supprimer « ${e.terme} » du glossaire ?`)) return;
    try { await G.supprimer(e.id); if (enEdition === e.id) viderFormulaire(); await charger(); } catch (err) { erreur(err); }
  }

  let occupe = false;
  $('gl-enregistrer').addEventListener('click', async () => {
    if (occupe) return; // double-clic : un seul enregistrement
    const terme = $('gl-terme').value.trim();
    if (!terme) { notifier('Saisissez d\'abord le terme.', 'alerte'); $('gl-terme').focus(); return; }
    occupe = true;
    try {
      const e = { terme, traduction: $('gl-traduction').value.trim(), cible: $('gl-cible').value, casse: $('gl-casse').checked };
      if (enEdition) e.id = enEdition;
      await G.enregistrer(e);
      notifier(enEdition ? `« ${terme} » modifié.` : `« ${terme} » ajouté au glossaire.`, 'succes');
      viderFormulaire();
      await charger();
    } catch (err) { erreur(err); } finally { occupe = false; }
  });
  for (const id of ['gl-terme', 'gl-traduction']) $(id).addEventListener('keydown', (ev) => { if (ev.key === 'Enter') $('gl-enregistrer').click(); });
  $('gl-annuler').addEventListener('click', viderFormulaire);
  $('gl-recherche').addEventListener('input', dessiner);
  $('gl-importer').addEventListener('click', async () => {
    try {
      const b = await G.importer();
      if (!b) return;
      const message = `${b.ajoutes} terme${b.ajoutes > 1 ? 's' : ''} ajouté${b.ajoutes > 1 ? 's' : ''}${b.ignores ? `, ${b.ignores} ligne${b.ignores > 1 ? 's' : ''} ignorée${b.ignores > 1 ? 's' : ''} (${b.details.slice(0, 3).join(' ; ')}${b.ignores > 3 ? '…' : ''})` : ''}.`;
      notifier(message, b.ignores ? 'alerte' : 'succes', 9000);
      await charger();
    } catch (e) { erreur(e); }
  });

  await charger();
})());
