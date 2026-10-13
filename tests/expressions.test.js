'use strict';
// Expressions traduites par leur sens : reconnaissance, réglages, enregistrement, envoi aux moteurs.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { creerExpressions, trouver } = require('../src/main/services/expressions');
const { INTEGREES } = require('../src/main/services/expressions-integrees');
const { creerMoteurs } = require('../src/main/services/moteurs');
const { creerMemoire } = require('../src/main/services/memoire');
const { traduireDocument } = require('../src/main/services/pipeline');
const formats = require('../src/main/services/formats');
const { lignesDemandees } = require('./e2e/outils');

const silencieux = { avertissement() {}, erreur() {}, info() {} };
const CODES = ['fr', 'en', 'es', 'de'];
const nouveau = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-ex-'));
  return { d, x: creerExpressions({ fichier: path.join(d, 'expressions.json'), codesLangues: CODES, journal: silencieux }) };
};
const textes = (t, p) => trouver(t, p).map((a) => a.texte);

test('liste intégrée : motifs valides, formes conjuguées, apostrophes courbes, marqueurs ignorés', () => {
  for (const i of INTEGREES) assert.doesNotThrow(() => new RegExp(i.motif, 'iu'), i.id);
  assert.equal(new Set(INTEGREES.map((i) => i.id)).size, INTEGREES.length, 'identifiants uniques');
  const { x } = nouveau();
  const p = x.pour({ source: 'en', cible: 'fr' });
  assert.deepEqual(textes('Break a leg!', p), ['Break a leg']);
  assert.deepEqual(textes('He spilled the beans.', p), ['spilled the beans']);
  assert.deepEqual(textes('Who spilt the beans?', p), ['spilt the beans']);
  assert.deepEqual(textes('You’re toast, buddy.', p), ['\'re toast']);
  assert.deepEqual(textes('He <x n="0"/>kicked the bucket<x n="1"/> last week.', p), ['kicked the bucket']);
  assert.deepEqual(textes('Why are you here?', p), [], 'phrase ordinaire : rien');
  assert.deepEqual(textes('The breakfast was great.', p), [], 'pas de faux positif dans un mot plus long');
  assert.equal(trouver('Break a leg!', p)[0].equivalent, 'Merde !');
  assert.equal(trouver('Break a leg!', x.pour({ source: 'en', cible: 'es' }))[0].equivalent, '', 'autre langue : le moteur part du sens');
  assert.equal(x.pour({ source: 'es', cible: 'fr' }), null, 'langue d\'origine non anglaise : liste intégrée inactive');
  assert.ok(x.pour({ source: 'auto', cible: 'fr' }), 'détection automatique : liste intégrée active');
});

test('expressions perso : joker, formes au choix, priorité sur l\'intégrée, langues, refus', () => {
  const { d, x } = nouveau();
  x.enregistrer({ expression: 'make|made * day', sens: 'make someone very happy', equivalent: 'illuminer la journée', source: 'en', cible: 'fr' });
  x.enregistrer({ expression: 'break a leg', sens: '', equivalent: 'Bonne chance !', source: '*', cible: 'fr' });
  x.enregistrer({ expression: 'qué onda', sens: 'what\'s up', equivalent: '', source: 'es', cible: '*' });
  const p = x.pour({ source: 'en', cible: 'fr' });
  assert.deepEqual(textes('You made my whole day.', p), ['made my whole day']);
  assert.deepEqual(textes('That will make your day', p), ['make your day']);
  assert.deepEqual(textes('make day', p), [], 'le joker exige au moins un mot');
  assert.equal(trouver('Break a leg!', p)[0].equivalent, 'Bonne chance !', 'la perso l\'emporte sur l\'intégrée');
  assert.equal(trouver('Break a leg!', p).length, 1, 'pas de doublon perso + intégrée');
  assert.deepEqual(textes('¿Qué onda, güey?', p), [], 'expression espagnole : pas pour une source anglaise');
  assert.deepEqual(textes('¿Qué onda, güey?', x.pour({ source: 'es', cible: 'de' })), ['Qué onda']);
  assert.throws(() => x.enregistrer({ expression: 'make|made * day', sens: 'x', source: 'en', cible: 'fr' }), /déjà dans vos expressions/);
  assert.throws(() => x.enregistrer({ expression: '', sens: 'x' }), /vide/);
  assert.throws(() => x.enregistrer({ expression: '* day', sens: 'x' }), /joker/);
  assert.throws(() => x.enregistrer({ expression: 'a', sens: 'x' }), /trop courte/);
  assert.throws(() => x.enregistrer({ expression: 'hello <b>', sens: 'x' }), /pas autorisés/);
  assert.throws(() => x.enregistrer({ expression: 'hello there' }), /sens .* ou l'équivalent/);
  // Relu depuis le disque.
  const x2 = creerExpressions({ fichier: path.join(d, 'expressions.json'), codesLangues: CODES, journal: silencieux });
  assert.equal(x2.lister().entrees.length, 3);
  fs.rmSync(d, { recursive: true, force: true });
});

test('liste intégrée désactivable (entière ou une par une) ; fichier abîmé mis de côté', () => {
  const { d, x } = nouveau();
  x.regler({ id: 'i2', active: false });
  let p = x.pour({ source: 'en', cible: 'fr' });
  assert.deepEqual(textes('He spilled the beans', p), []);
  assert.deepEqual(textes('Break a leg', p), ['Break a leg']);
  x.regler({ integrees: false });
  assert.equal(x.pour({ source: 'en', cible: 'fr' }), null);
  assert.throws(() => x.regler({ id: 'zzz', active: true }), /inconnue/);
  const l = x.lister();
  assert.equal(l.integreesActives, false);
  assert.equal(l.integrees.find((i) => i.id === 'i2').active, false);
  fs.writeFileSync(path.join(d, 'expressions.json'), '{ abîmé');
  const x3 = creerExpressions({ fichier: path.join(d, 'expressions.json'), codesLangues: CODES, journal: silencieux });
  assert.match(x3.lister().avertissement, /abîmée/);
  assert.ok(x3.pour({ source: 'en', cible: 'fr' }), 'liste intégrée toujours là');
  assert.ok(fs.readdirSync(d).some((f) => f.includes('corrompu')));
  fs.rmSync(d, { recursive: true, force: true });
});

function serveur(gerer) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let corps = '';
      req.on('data', (c) => { corps += c; });
      req.on('end', () => gerer(req, res, corps ? JSON.parse(corps) : null));
    });
    s.listen(0, '127.0.0.1', () => ok({ s, url: `http://127.0.0.1:${s.address().port}` }));
  });
}
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

test('moteurs : l\'aide part dans la demande de l\'IA locale et dans le contexte DeepL (jamais dans le texte)', async () => {
  const demandes = [];
  const { s, url } = await serveur((req, res, corps) => {
    if (req.url.startsWith('/v2/')) { demandes.push(corps); return json(res, 200, { translations: corps.text.map((t) => ({ text: `FR:${t}` })) }); }
    demandes.push(corps);
    const sortie = {};
    for (const [k, v] of Object.entries(lignesDemandees(corps.messages[1].content))) sortie[k] = `[fr] ${v}`;
    return json(res, 200, { message: { content: JSON.stringify(sortie) } });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => 'cle-de-test-suffisamment-longue', urlDeeplTest: url, journal: silencieux });
  const aide = [{ texte: 'Break a leg', expression: 'break a leg', sens: 'good luck', equivalent: 'Merde !' }];
  await m.traduireTout(['Break a leg!', 'See you.'], { moteur: 'ollama', adresse: url, modele: 'x', source: 'en', cible: 'fr', aides: [aide, []] });
  const contenu = demandes[0].messages[1].content;
  assert.match(contenu, /line 1: "Break a leg" is an idiom meaning "good luck" \(natural French equivalent: "Merde !"\)/);
  assert.doesNotMatch(contenu, /line 2:/);
  assert.match(demandes[0].messages[0].content, /idioms, slang, sayings and wordplay/);
  await m.traduireTout(['Break a leg!'], { moteur: 'deepl', source: 'en', cible: 'fr', aides: [aide] });
  assert.match(demandes[1].context, /"Break a leg" is an idiom meaning "good luck"/);
  assert.deepEqual(demandes[1].text, ['Break a leg!']);
  s.close();
});

test('pipeline : bilan des expressions ; mémoire sans aide → retraduit avec l\'aide', async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-ex-'));
  const memoire = creerMemoire({ fichier: path.join(d, 'm.jsonl'), journal: silencieux });
  const { x } = nouveau();
  const options = { moteur: 'ollama', modele: 'm', source: 'en', cible: 'fr', memoire: true };
  memoire.ajouter({ moteur: 'ollama', variante: 'modele:m', source: 'en', cible: 'fr' }, [['Break a leg tonight!', 'Casse-toi une jambe ce soir !']]);
  const recus = [];
  const moteurs = { async traduireTout(segments, o) { recus.push({ segments, aides: o.aides }); return segments.map((t) => `[fr] ${t}`); } };
  const doc = formats.analyser('1\n00:00:01,000 --> 00:00:02,000\nBreak a leg tonight!\n\n2\n00:00:03,000 --> 00:00:04,000\nThanks a lot.\n', 'srt');
  const b = await traduireDocument(doc, { moteurs, memoire, expressionsPreparees: x.pour({ source: 'en', cible: 'fr' }), options });
  assert.deepEqual(recus[0].segments, ['Break a leg tonight!', 'Thanks a lot.'], 'traduction littérale gardée en mémoire ignorée');
  assert.equal(recus[0].aides[0][0].expression, 'break a leg');
  assert.deepEqual(recus[0].aides[1], []);
  assert.deepEqual(b.expressions, ['break a leg']);
  // Deuxième passage : repris de la mémoire (avec la même aide).
  const doc2 = formats.analyser('1\n00:00:01,000 --> 00:00:02,000\nBreak a leg tonight!\n', 'srt');
  const b2 = await traduireDocument(doc2, { moteurs, memoire, expressionsPreparees: x.pour({ source: 'en', cible: 'fr' }), options });
  assert.equal(b2.repris, 1);
  assert.equal(doc2.repliques[0].texte, '[fr] Break a leg tonight!');
  fs.rmSync(d, { recursive: true, force: true });
});
