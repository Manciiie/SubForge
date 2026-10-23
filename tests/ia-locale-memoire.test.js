'use strict';
// Optimisations 1.7 : mémoire de travail de l'IA par fichier, modèle gardé chargé, mémoire de
// traduction préchargée sans figer l'application.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { creerMemoire } = require('../src/main/services/memoire');
const { creerMoteurs, CTX_STANDARD, CTX_GRAND } = require('../src/main/services/moteurs');
const { traduireDocument } = require('../src/main/services/pipeline');
const formats = require('../src/main/services/formats');
const { fauxOllama } = require('./e2e/outils');

const silencieux = { avertissement() {}, erreur() {}, info() {} };

test('mémoire de traduction préchargée par morceaux : jamais plus de 100 ms sans rendre la main', async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-mem-'));
  const fichier = path.join(d, 'm.jsonl');
  const lignes = [];
  for (let i = 0; i < 200000; i++) lignes.push(JSON.stringify({ k: `cle${i}`.padEnd(32, 'x'), t: `Traduction numéro ${i}, assez longue pour peser.` }));
  fs.writeFileSync(fichier, `${lignes.join('\n')}\n{abîmée\n`);
  const avertissements = [];
  const m = creerMemoire({ fichier, journal: { ...silencieux, avertissement: (...a) => avertissements.push(a.join(' ')) } });
  assert.deepEqual(m.etat(), { entrees: null, taille: fs.statSync(fichier).size, chargement: true }, 'état sans forcer la lecture');
  let dernier = Date.now();
  let pireTrou = 0;
  const minuteur = setInterval(() => { const t = Date.now(); pireTrou = Math.max(pireTrou, t - dernier); dernier = t; }, 2);
  const debut = Date.now();
  assert.equal(await m.precharger(), true);
  clearInterval(minuteur);
  const duree = Date.now() - debut;
  assert.ok(pireTrou < 100, `l'application reste réactive (pire attente ${pireTrou} ms, préchargement ${duree} ms)`);
  assert.equal(m.etat().entrees, 200000);
  assert.ok(avertissements.some((a) => /1 ligne\(s\) abîmée/.test(a)));
  // Une traduction pressée pendant le préchargement : lecture immédiate, le préchargement s'efface.
  const m2 = creerMemoire({ fichier, journal: silencieux });
  const p = m2.precharger();
  m2.chercher({ moteur: 'deepl', cible: 'fr' }, ['x']);
  assert.equal(await p, false);
  assert.equal(m2.etat().entrees, 200000);
  assert.equal(await m2.precharger(), false, 'rien à refaire');
  fs.rmSync(d, { recursive: true, force: true });
});

test('taille de la mémoire de travail : 4 096 pour un film ordinaire, 8 192 pour des répliques très longues', () => {
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  const options = { source: 'en', cible: 'fr', registre: 'auto', contexteFilm: 'Film "X" (2018). Synopsis: '.padEnd(700, 'a') };
  const court = Array.from({ length: 20 }, (_, i) => `This is an ordinary subtitle line number ${i}.`);
  assert.equal(m.tailleContexte({ lots: [court], scenes: [court.concat(court).map((t) => ({ original: t }))], options }), CTX_STANDARD);
  const long = Array.from({ length: 20 }, () => 'A very long line of dialogue that goes on and on. '.repeat(8));
  assert.equal(m.tailleContexte({ lots: [long], options }), CTX_GRAND);
  const sceneLongue = Array.from({ length: 40 }, () => ({ original: 'A fairly long line of dialogue in a busy scene. '.repeat(3) }));
  assert.equal(m.tailleContexte({ scenes: [sceneLongue], options }), CTX_GRAND);
  assert.equal(m.tailleContexte({ options }), CTX_STANDARD, 'rien à envoyer');
});

test('même taille pour la traduction et la relecture d\'un fichier ; modèle gardé chargé (keep_alive -1)', async (t) => {
  const s = await fauxOllama();
  t.after(() => s.close());
  const adresse = `http://127.0.0.1:${s.address().port}`;
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  const doc = formats.analyser(Array.from({ length: 30 }, (_, i) => `${i + 1}\n${formats.depuisMs(i * 2000)} --> ${formats.depuisMs(i * 2000 + 1500)}\nLine ${i}\n`).join('\n'), 'srt');
  const options = { moteur: 'ollama', adresse, modele: 'faux-modele:1b', source: 'en', cible: 'fr', parallele: 2, garderCharge: true };
  const b = await traduireDocument(doc, {
    moteurs: m, options,
    relecture: { relire: (lignes, sig, extra) => m.relireScene(lignes, { ...options, ...extra, signal: sig }) },
  });
  assert.equal(b.numCtx, CTX_STANDARD);
  assert.ok(s.options.length >= 2, 'traduction + relecture');
  assert.ok(s.options.every((o) => o.num_ctx === CTX_STANDARD && o.keep_alive === -1), JSON.stringify(s.options));
  assert.equal(m.modeleCharge(), 'faux-modele:1b');
  // Sans « garder chargé » : Ollama décharge après 10 minutes comme avant.
  s.options.length = 0;
  await m.traduireTout(['Hello there'], { ...options, garderCharge: false });
  assert.equal(s.options[0].keep_alive, '10m');
});

test('préchauffage (prompt vide, même taille) et libération à la fermeture ou au changement de modèle', async () => {
  const s = await fauxOllama();
  const adresse = `http://127.0.0.1:${s.address().port}`;
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  assert.equal(await m.decharger(), false, 'rien de chargé : rien à libérer');
  assert.equal(await m.prechauffer({ adresse, modele: 'faux-modele:1b' }), true);
  assert.deepEqual(s.generes[0], { model: 'faux-modele:1b', prompt: '', stream: false, keep_alive: -1, options: { num_ctx: CTX_STANDARD } });
  assert.equal(await m.decharger({ sauf: 'faux-modele:1b' }), false, 'même modèle : gardé');
  assert.equal(await m.decharger(), true);
  assert.deepEqual(s.generes[1], { model: 'faux-modele:1b', keep_alive: 0 });
  assert.equal(m.modeleCharge(), null);
  // Ollama déjà arrêté à la fermeture : pas d'erreur.
  await m.prechauffer({ adresse, modele: 'faux-modele:1b' });
  s.close();
  await new Promise((ok) => setTimeout(ok, 50));
  assert.equal(await m.decharger(), false);
});

test('lots adaptés : 40 répliques courtes par demande, moins pour les longues, tout traduit dans l\'ordre', async (t) => {
  const s = await fauxOllama();
  t.after(() => s.close());
  const adresse = `http://127.0.0.1:${s.address().port}`;
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  const o = { source: 'en', cible: 'fr', registre: 'auto' };
  const courtes = Array.from({ length: 100 }, (_, i) => `Where are you going tonight? ${i}`);
  const longues = Array.from({ length: 100 }, (_, i) => `${'A very long line of dialogue that goes on and on, with many words in it. '.repeat(2)}${i}`);
  assert.deepEqual(m.planifierLots(courtes, o).map(([a, b]) => b - a), [40, 40, 20]);
  const tailles = m.planifierLots(longues, o).map(([a, b]) => b - a);
  assert.ok(tailles.slice(0, -1).every((n) => n < 40 && n >= 10), `répliques longues : lots plus petits (${tailles})`); // le dernier lot prend le reste
  assert.deepEqual(m.planifierLots(courtes, { ...o, adaptes: false }).map(([a, b]) => b - a), [20, 20, 20, 20, 20]);
  // Chaque lot prévu tient dans la mémoire de travail standard (réponse comprise).
  for (const [a, b] of m.planifierLots(longues, o)) assert.equal(m.tailleContexte({ lots: [longues.slice(a, b)], options: o }), CTX_STANDARD);
  // Traduction réelle : 3 demandes au lieu de 5, résultat identique et dans l'ordre.
  const r = await m.traduireTout(courtes, { moteur: 'ollama', adresse, modele: 'faux-modele:1b', ...o, parallele: 2 });
  assert.equal(s.demandes.length, 3);
  assert.ok(r.every((x, i) => x === `[fr] ${courtes[i]}`));
});
