'use strict';
// Écran « Expressions » : expressions personnelles (ajout, modification, suppression, recherche),
// liste intégrée d'expressions anglaises (activable en entier ou une par une), test d'une phrase.

window.__modules = window.__modules || [];
window.SubForge = window.SubForge || {};
window.__modules.push((async () => {
  const { el, notifier, erreur } = window.UI;
  const $ = (id) => document.getElementById(id);
  const X = window.forge.expressions;

  const langues = await window.forge.traduction.langues();
  const nomLangue = (code) => (code === '*' ? 'Toutes' : langues.find((l) => l.code === code)?.nom || code);
  const court = (code) => (code === '*' ? 'toutes' : nomLangue(code).replace(/ \(.*\)$/, ''));
  for (const l of langues) {
    $('ex-source').append(el('option', { value: l.code, texte: l.nom }));
    $('ex-cible').append(el('option', { value: l.code, texte: l.nom }));
  }

  let donnees = { integreesActives: true, integrees: [], entrees: [] };
  let enEdition = null;

  function viderFormulaire() {
    enEdition = null;
    for (const id of ['ex-expression', 'ex-sens', 'ex-equivalent']) $(id).value = '';
    $('ex-source').value = '*';
    $('ex-cible').value = '*';
    $('ex-enregistrer').textContent = 'Ajouter';
    $('ex-titre-form').textContent = 'Ajouter une expression';
    $('ex-annuler').hidden = true;
  }

  const entete = (colonnes) => el('div', { classe: 'table-glossaire__ligne table-glossaire__ligne--entete', role: 'row' }, colonnes.map((c) => el('span', { texte: c })));
  const correspond = (filtre, ...champs) => !filtre || champs.some((c) => String(c || '').toLowerCase().includes(filtre));

  function dessinerPerso() {
    const filtre = $('ex-recherche').value.trim().toLowerCase();
    const visibles = donnees.entrees
      .filter((e) => correspond(filtre, e.expression, e.sens, e.equivalent))
      .sort((a, b) => a.expression.localeCompare(b.expression, 'fr', { sensitivity: 'base' }));
    const n = donnees.entrees.length;
    $('ex-compte').textContent = n ? `Vos expressions (${n.toLocaleString('fr-FR')})` : 'Vos expressions';
    $('ex-vide').hidden = n > 0;
    const lignes = n ? [entete(['Expression', 'Sens', 'Équivalent', 'Langues', ''])] : [];
    for (const e of visibles.slice(0, 500)) {
      lignes.push(el('div', { classe: 'table-glossaire__ligne', role: 'row' }, [
        el('span', { classe: 'table-glossaire__terme', texte: e.expression }),
        e.sens ? el('span', { texte: e.sens }) : el('span', { classe: 'discret', texte: '—' }),
        e.equivalent ? el('span', { texte: e.equivalent }) : el('span', { classe: 'discret', texte: 'au choix du moteur' }),
        el('span', { classe: 'discret', texte: `${court(e.source)} → ${court(e.cible)}` }),
        el('span', { classe: 'table-glossaire__actions' }, [
          el('button', { classe: 'btn btn--petit', texte: 'Modifier', onclick: () => modifier(e) }),
          el('button', { classe: 'btn btn--petit btn--lien', texte: 'Supprimer', onclick: () => supprimer(e) }),
        ]),
      ]));
    }
    if (n && !visibles.length) lignes.push(el('p', { classe: 'discret', texte: 'Aucune expression ne correspond à la recherche.' }));
    $('ex-table').replaceChildren(...lignes);
  }

  function dessinerIntegrees() {
    const filtre = $('ex-integrees-recherche').value.trim().toLowerCase();
    const actives = donnees.integrees.filter((x) => x.active).length;
    $('ex-integrees-actives').checked = donnees.integreesActives;
    $('ex-integrees-titre').textContent = `Expressions anglaises courantes (${actives} sur ${donnees.integrees.length} utilisées)`;
    const table = $('ex-integrees-table');
    table.classList.toggle('desactive', !donnees.integreesActives);
    const lignes = [entete(['Expression', 'Sens', 'En français', 'Utilisée', ''])];
    for (const x of donnees.integrees.filter((i) => correspond(filtre, i.expression, i.sens, i.equivalent))) {
      const caseActive = el('input', { type: 'checkbox', 'aria-label': `Utiliser « ${x.expression} »` });
      caseActive.checked = x.active;
      caseActive.disabled = !donnees.integreesActives;
      caseActive.addEventListener('change', () => regler({ id: x.id, active: caseActive.checked }));
      lignes.push(el('div', { classe: 'table-glossaire__ligne', role: 'row' }, [
        el('span', { classe: 'table-glossaire__terme', texte: x.expression }),
        el('span', { classe: 'discret', texte: x.sens }),
        el('span', { texte: x.equivalent }),
        el('span', {}, [caseActive]),
        el('span'),
      ]));
    }
    table.replaceChildren(...lignes);
  }

  async function charger() {
    try {
      donnees = await X.lister();
      $('ex-avertissement').textContent = donnees.avertissement || '';
    } catch (e) {
      erreur(e);
      $('ex-avertissement').textContent = 'Liste d\'expressions illisible : voir le journal (Paramètres → Dépannage).';
    }
    dessinerPerso();
    dessinerIntegrees();
  }

  async function regler(o) {
    try { donnees = await X.regler(o); } catch (e) { erreur(e); }
    dessinerIntegrees();
  }

  function modifier(e) {
    enEdition = e.id;
    $('ex-expression').value = e.expression;
    $('ex-sens').value = e.sens;
    $('ex-equivalent').value = e.equivalent;
    $('ex-source').value = e.source;
    $('ex-cible').value = e.cible;
    $('ex-enregistrer').textContent = 'Enregistrer';
    $('ex-titre-form').textContent = `Modifier « ${e.expression} »`;
    $('ex-annuler').hidden = false;
    $('ex-expression').focus();
  }

  async function supprimer(e) {
    if (!window.confirm(`Supprimer l'expression « ${e.expression} » ?`)) return;
    try { await X.supprimer(e.id); if (enEdition === e.id) viderFormulaire(); await charger(); } catch (err) { erreur(err); }
  }

  let occupe = false;
  $('ex-enregistrer').addEventListener('click', async () => {
    if (occupe) return; // double-clic : un seul enregistrement
    const expression = $('ex-expression').value.trim();
    if (!expression) { notifier('Saisissez d\'abord l\'expression.', 'alerte'); $('ex-expression').focus(); return; }
    if (!$('ex-sens').value.trim() && !$('ex-equivalent').value.trim()) { notifier('Indiquez le sens de l\'expression, ou l\'équivalent voulu.', 'alerte'); $('ex-sens').focus(); return; }
    occupe = true;
    try {
      const e = {
        expression, sens: $('ex-sens').value.trim(), equivalent: $('ex-equivalent').value.trim(),
        source: $('ex-source').value, cible: $('ex-cible').value,
      };
      if (enEdition) e.id = enEdition;
      await X.enregistrer(e);
      notifier(enEdition ? `« ${expression} » modifiée.` : `« ${expression} » ajoutée.`, 'succes');
      viderFormulaire();
      await charger();
    } catch (err) { erreur(err); } finally { occupe = false; }
  });
  for (const id of ['ex-expression', 'ex-sens', 'ex-equivalent']) $(id).addEventListener('keydown', (ev) => { if (ev.key === 'Enter') $('ex-enregistrer').click(); });
  $('ex-annuler').addEventListener('click', viderFormulaire);
  $('ex-recherche').addEventListener('input', dessinerPerso);
  $('ex-integrees-recherche').addEventListener('input', dessinerIntegrees);
  $('ex-integrees-actives').addEventListener('change', () => regler({ integrees: $('ex-integrees-actives').checked }));

  // Test : avec les langues choisies dans l'écran Traduire.
  async function tester() {
    const texte = $('ex-test').value.trim();
    const zone = $('ex-test-resultat');
    if (!texte) { zone.textContent = ''; return; }
    try {
      const r = (await window.forge.traduction.reglages()).traduction;
      const trouvees = await X.tester(texte, r.source, r.cible);
      if (!trouvees.length) {
        zone.replaceChildren(`Aucune expression reconnue (de ${court(r.source === 'auto' ? '*' : r.source).replace('toutes', 'détection automatique')} vers ${court(r.cible)}) : la phrase sera traduite normalement.`);
        return;
      }
      zone.replaceChildren(...trouvees.map((a) => el('span', { classe: 'aide-expression', texte: `« ${a.texte} » → ${a.equivalent ? `« ${a.equivalent} »` : 'tournure choisie par le moteur'}${a.sens ? ` (sens : ${a.sens})` : ''}` })));
    } catch (e) { erreur(e); }
  }
  $('ex-tester').addEventListener('click', tester);
  $('ex-test').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') tester(); });

  document.querySelector('.nav-item[data-ecran="expressions"]').addEventListener('click', charger);
  await charger();
})());
