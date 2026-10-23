'use strict';
// Optimisations 1.6 : demandes simultanées à l'IA locale (T602), relecture pendant la traduction (T603).

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { creerLimite, enParallele } = require('../src/main/services/limite');
const { creerMoteurs } = require('../src/main/services/moteurs');
const { traduireDocument } = require('../src/main/services/pipeline');
const formats = require('../src/main/services/formats');
const { lignesDemandees } = require('./e2e/outils');

const silencieux = { avertissement() {}, erreur() {}, info() {} };
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

test('limiteur : jamais plus de N en même temps ; enParallele s\'arrête au premier échec', async () => {
  const l = creerLimite(2);
  let enCours = 0;
  let max = 0;
  await Promise.all(Array.from({ length: 8 }, () => l.prendre(async () => { enCours += 1; max = Math.max(max, enCours); await attendre(10); enCours -= 1; })));
  assert.equal(max, 2);
  assert.equal(l.maxAtteint, 2);
  const vus = [];
  await assert.rejects(enParallele([1, 2, 3, 4, 5, 6], 2, async (x) => { vus.push(x); await attendre(5); if (x === 2) throw new Error('boum'); }), /boum/);
  assert.ok(vus.length < 6, `arrêt après l'échec (${vus})`);
});

// Faux Ollama lent (150 ms par demande) qui note combien de demandes il traite en même temps.
function ollamaLent() {
  return new Promise((ok) => {
    const etat = { enCours: 0, max: 0, demandes: [] };
    const s = http.createServer((req, res) => {
      let corps = '';
      req.on('data', (c) => { corps += c; });
      req.on('end', async () => {
        const msg = JSON.parse(corps);
        etat.enCours += 1; etat.max = Math.max(etat.max, etat.enCours);
        etat.demandes.push(msg.messages[1].content);
        await attendre(150);
        etat.enCours -= 1;
        const sortie = {};
        for (const [k, v] of Object.entries(lignesDemandees(msg.messages[1].content))) sortie[k] = `[fr] ${v}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: { content: JSON.stringify(sortie) } }));
      });
    });
    s.listen(0, '127.0.0.1', () => ok({ s, etat, url: `http://127.0.0.1:${s.address().port}` }));
  });
}

test('IA locale : 2 demandes simultanées ≈ 2 fois plus rapide, ordre gardé, contexte d\'origine pour les lots parallèles', async (t) => {
  const { s, etat, url } = await ollamaLent();
  t.after(() => s.close());
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  const segments = Array.from({ length: 160 }, (_, i) => `Line number ${i}`); // 8 lots de 20
  // Lots fixes de 20 : ce test mesure le parallélisme seul (les lots adaptés ont leur propre test).
  const o = { moteur: 'ollama', adresse: url, modele: 'm', cible: 'fr', lotsAdaptes: false };
  let debut = Date.now();
  const r1 = await m.traduireTout(segments, { ...o, parallele: 1, limite: creerLimite(1) });
  const t1 = Date.now() - debut;
  assert.equal(etat.max, 1);
  etat.max = 0;
  etat.demandes.length = 0;
  debut = Date.now();
  const lots = [];
  const r2 = await m.traduireTout(segments, { ...o, parallele: 2, limite: creerLimite(2), surLot: (i, t) => lots.push([i, t.length]) });
  const t2 = Date.now() - debut;
  assert.equal(etat.max, 2, 'jamais plus de 2 demandes à la fois');
  assert.deepEqual(r2, r1);
  assert.ok(r2.every((x, i) => x === `[fr] Line number ${i}`));
  assert.ok(t2 < t1 * 0.65, `2 demandes : ${t2} ms contre ${t1} ms`);
  assert.deepEqual(lots.map(([, n]) => n), [20, 20, 20, 20, 20, 20, 20, 20]);
  // Le 2e lot part en même temps que le 1er : son contexte vient des répliques d'origine.
  const deuxieme = etat.demandes.find((d) => d.includes('1. "Line number 20"'));
  assert.match(deuxieme, /context only \(do not translate them\):\n- "Line number 17"\n- "Line number 18"\n- "Line number 19"/, 'contexte d\'origine');
  assert.ok(!etat.demandes.some((d) => d.includes('undefined')), 'jamais de contexte vide');
});

const srt = (n, ecartMs = 1000) => formats.analyser(Array.from({ length: n }, (_, i) => `${i + 1}\n${formats.depuisMs(i * ecartMs)} --> ${formats.depuisMs(i * ecartMs + 800)}\nLine ${i}\n`).join('\n'), 'srt');

test('relecture pendant la traduction : la 1re scène part avant la fin, bilan identique', async () => {
  // 3 scènes (séparées par plus de 6 s de silence), traduites en 3 lots de 100 ms.
  const doc = formats.analyser([0, 1, 20, 21, 40, 41].map((s, i) => `${i + 1}\n${formats.depuisMs(s * 1000)} --> ${formats.depuisMs(s * 1000 + 800)}\nLine ${i}\n`).join('\n'), 'srt');
  let finTraduction = null;
  const moteurs = {
    async traduireTout(segments, o) {
      for (let i = 0; i < segments.length; i += 2) {
        await attendre(100);
        o.surLot(i, segments.slice(i, i + 2).map((t) => `[fr] ${t}`));
      }
      finTraduction = Date.now();
      return segments.map((t) => `[fr] ${t}`);
    },
  };
  const departs = [];
  const relecture = {
    async relire(lignes) {
      departs.push(Date.now());
      return { corrections: [{ n: lignes[0].n, texte: `${lignes[0].traduction} !`, type: 'other', raison: 'ponctuation' }], doutes: [] };
    },
  };
  const b = await traduireDocument(doc, { moteurs, relecture, options: { moteur: 'ollama', modele: 'm', cible: 'fr', parallele: 2 } });
  assert.equal(departs.length, 3);
  assert.ok(departs[0] < finTraduction - 150, 'la première scène est relue pendant la traduction');
  assert.deepEqual({ scenes: b.relecture.scenes, corrigees: b.relecture.corrigees, sautees: b.relecture.sautees }, { scenes: 3, corrigees: 3, sautees: 0 });
  assert.equal(doc.repliques[0].texte, '[fr] Line 0 !');
  assert.equal(doc.repliques[2].texte, '[fr] Line 2 !');
});

test('traduction ratée pendant que des relectures tournent : relectures arrêtées, erreur rendue', async () => {
  const doc = srt(30, 10000); // une scène par réplique
  const moteurs = {
    async traduireTout(segments, o) {
      o.surLot(0, segments.slice(0, 10).map((t) => `[fr] ${t}`));
      await attendre(50);
      throw new Error('L\'IA locale ne répond pas');
    },
  };
  let annulees = 0;
  const relecture = {
    relire: (lignes, signal) => new Promise((ok, ko) => {
      const t = setTimeout(() => ok({ corrections: [], doutes: [] }), 2000);
      signal.addEventListener('abort', () => { clearTimeout(t); annulees += 1; ko(Object.assign(new Error('annulée'), { name: 'AbortError' })); });
    }),
  };
  const debut = Date.now();
  await assert.rejects(traduireDocument(doc, { moteurs, relecture, options: { moteur: 'ollama', modele: 'm', cible: 'fr', parallele: 2 } }), /ne répond pas/);
  assert.ok(Date.now() - debut < 1000, 'pas d\'attente des relectures');
  assert.equal(annulees, 2, 'les 2 relectures en cours ont été arrêtées');
});

test('moteur sans retour par lot : toutes les scènes relues à la fin', async () => {
  const doc = srt(5, 10000);
  const moteurs = { async traduireTout(segments) { return segments.map((t) => `[fr] ${t}`); } };
  let n = 0;
  const b = await traduireDocument(doc, { moteurs, relecture: { async relire() { n += 1; return { corrections: [], doutes: [] }; } }, options: { moteur: 'deepl', cible: 'fr' } });
  assert.equal(n, 5);
  assert.equal(b.relecture.scenes, 5);
});
