'use strict';
// Optimisations 1.8 : saisons à la chaîne (T801) et relecture ciblée (T802).

const test = require('node:test');
const assert = require('node:assert/strict');
const { aLaChaine } = require('../src/main/services/limite');
const { traduireDocument, scenesARisque } = require('../src/main/services/pipeline');
const formats = require('../src/main/services/formats');

const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

test('à la chaîne : préparation et finalisation pendant la traduction, une traduction à la fois', async () => {
  const journal = [];
  let traductions = 0;
  let maxTraductions = 0;
  let finalisations = 0;
  let maxFinalisations = 0;
  const travail = (n) => ({
    async preparer() { journal.push(`P${n}+`); await attendre(100); journal.push(`P${n}-`); },
    async traduire() { traductions += 1; maxTraductions = Math.max(maxTraductions, traductions); journal.push(`T${n}+`); await attendre(100); journal.push(`T${n}-`); traductions -= 1; },
    async finaliser() { finalisations += 1; maxFinalisations = Math.max(maxFinalisations, finalisations); journal.push(`F${n}+`); await attendre(100); journal.push(`F${n}-`); finalisations -= 1; },
  });
  const debut = Date.now();
  await aLaChaine([1, 2, 3, 4].map(travail));
  const duree = Date.now() - debut;
  assert.equal(maxTraductions, 1);
  assert.equal(maxFinalisations, 1);
  assert.ok(duree < 800, `4 épisodes : ${duree} ms (1 200 ms un par un)`);
  // Pendant T2 : P3 et F1 tournent.
  const i = journal.indexOf('T2+');
  assert.ok(journal.indexOf('P3+') < journal.indexOf('T2-') && journal.indexOf('P3-') > i, `P3 pendant T2 : ${journal.join(' ')}`);
  assert.ok(journal.indexOf('F1+') < journal.indexOf('T2-') && journal.indexOf('F1-') > i, `F1 pendant T2 : ${journal.join(' ')}`);
  // Ordre de chaque épisode respecté.
  for (const n of [1, 2, 3, 4]) assert.ok(journal.indexOf(`P${n}-`) < journal.indexOf(`T${n}+`) && journal.indexOf(`T${n}-`) < journal.indexOf(`F${n}+`));
});

test('à la chaîne : un épisode en erreur n\'arrête pas les suivants', async () => {
  const faits = [];
  const travail = (n) => {
    let rate = false;
    return {
      async preparer() { if (n === 2) rate = true; },
      async traduire() { if (!rate) faits.push(`T${n}`); },
      async finaliser() { if (!rate) faits.push(`F${n}`); },
    };
  };
  await aLaChaine([1, 2, 3].map(travail));
  assert.deepEqual(faits.sort(), ['F1', 'F3', 'T1', 'T3']);
  await aLaChaine([]);
});

const ctx = (segments) => ({ segments, textes: segments, indexUnique: new Map(segments.map((t, i) => [t, i])), aides: segments.map(() => []) });

test('relecture ciblée : scènes à risque reconnues', () => {
  const s = ['Yes.', 'Thank you so much.', 'Look at the sky.', 'Where is Ja-yoon?', 'I love it', 'when it rains.', 'She left.', 'I\'m ready.', 'Run!', 'Break a leg!'];
  const c = ctx(s);
  c.aides[9] = [{ expression: 'break a leg' }];
  const liste = [[0], [1], [2], [3], [4, 5], [6], [7], [8], [9]].map((sc) => sc.map((segment) => ({ segment })));
  const r = scenesARisque(liste, { ...c, options: { source: 'en', personnages: ['Ja-yoon', 'Dr. Baek'] } });
  // « Yes. » « Thank you » « Look at the sky » « Run! » : sans risque ; nom, phrase coupée, she, I'm, expression : à relire.
  assert.deepEqual(r, [false, false, false, true, true, true, true, false, true]);
  // Langue d'origine autre que l'anglais : tout est relu.
  const es = ['Hola.', 'Gracias.', 'Vamos.'];
  assert.deepEqual(scenesARisque(es.map((_, i) => [{ segment: i }]), { ...ctx(es), options: { source: 'auto' } }), [true, true, true]);
  assert.deepEqual(scenesARisque([[{ segment: 0 }]], { ...ctx(['Hello.']), options: { source: 'es' } }), [true]);
});

test('relecture ciblée : seules les scènes à risque partent, bilan et progression justes', async () => {
  // 4 scènes séparées par 10 s : 2 sans risque, 2 à risque.
  const lignes = ['Yes.', 'Where are you going?', 'Look at the sky.', 'She is late.'];
  const doc = formats.analyser(lignes.map((t, i) => `${i + 1}\n${formats.depuisMs(i * 10000)} --> ${formats.depuisMs(i * 10000 + 900)}\n${t}\n`).join('\n'), 'srt');
  const relues = [];
  const avancement = [];
  const b = await traduireDocument(doc, {
    moteurs: { async traduireTout(segments) { return segments.map((t) => `[fr] ${t}`); } },
    relecture: { ciblee: true, async relire(l) { relues.push(l[0].original); return { corrections: [], doutes: [] }; }, surAvancement: (f, t) => avancement.push([f, t]) },
    options: { moteur: 'deepl', source: 'en', cible: 'fr' },
  });
  assert.deepEqual(relues.sort(), ['She is late.', 'Where are you going?']);
  assert.equal(b.relecture.scenes, 4);
  assert.equal(b.relecture.sansRisque, 2);
  assert.equal(b.relecture.sautees, 0);
  assert.deepEqual(avancement.at(-1), [2, 2]);
});
