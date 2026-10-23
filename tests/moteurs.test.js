'use strict';
// Moteurs de traduction contre de faux serveurs DeepL et Ollama (format officiel des réponses).

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { creerMoteurs, adresseOllamaValide, versXml, depuisXml } = require('../src/main/services/moteurs');
const { lignesDemandees } = require('./e2e/outils');

function serveur(gestion) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let corps = '';
      req.on('data', (d) => { corps += d; });
      req.on('end', () => {
        if (req.url === '/api/show') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"capabilities":["completion"]}'); return; } // capacités du modèle (1.10)
        gestion(req, res, corps ? JSON.parse(corps) : null);
      });
    });
    s.listen(0, '127.0.0.1', () => ok({ s, url: `http://127.0.0.1:${s.address().port}` }));
  });
}
const json = (res, code, o, entetes = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', ...entetes }); res.end(JSON.stringify(o)); };
const silencieux = { avertissement() {}, info() {} };

test('DeepL : lots de 50 maximum, XML échappé, clé dans l\'en-tête (jamais dans l\'URL), quota', async () => {
  const appels = [];
  const { s, url } = await serveur((req, res, corps) => {
    appels.push({ url: req.url, auth: req.headers.authorization, corps });
    if (req.url === '/v2/usage') return json(res, 200, { character_count: 1200, character_limit: 500000 });
    return json(res, 200, { translations: corps.text.map((t) => ({ text: `FR:${t}`, detected_source_language: 'EN' })) });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => 'abcd1234-abcd-1234-abcd-123456789012:fx', urlDeeplTest: url, journal: silencieux });
  const segments = Array.from({ length: 120 }, (_, i) => `Line ${i} & <x n="0"/>tag<x n="1"/> < 3`);
  const avancement = [];
  const r = await m.traduireTout(segments, { moteur: 'deepl', source: 'en', cible: 'fr' }, (a, b) => avancement.push([a, b]));
  assert.equal(r.length, 120);
  assert.equal(r[5], 'FR:Line 5 & <x n="0"/>tag<x n="1"/> < 3');
  const traductions = appels.filter((a) => a.url === '/v2/translate');
  assert.deepEqual(traductions.map((a) => a.corps.text.length), [50, 50, 20]);
  assert.equal(traductions[0].corps.text[0], 'Line 0 &amp; <x n="0"/>tag<x n="1"/> &lt; 3');
  assert.equal(traductions[0].corps.target_lang, 'FR');
  assert.equal(traductions[0].corps.source_lang, 'EN');
  assert.equal(traductions[0].corps.tag_handling, 'xml');
  assert.ok(traductions.every((a) => a.auth === 'DeepL-Auth-Key abcd1234-abcd-1234-abcd-123456789012:fx' && !a.url.includes('abcd1234')));
  assert.deepEqual(avancement.at(-1), [120, 120]);
  assert.deepEqual(await m.usageDeepl(), { utilises: 1200, limite: 500000, offre: 'gratuite' });
  s.close();
});

test('DeepL : erreurs traduites en français (clé refusée, quota), réessai sur 429', async () => {
  let n = 0;
  let mode = 403;
  const { s, url } = await serveur((req, res, corps) => {
    if (mode === 429 && n++ < 2) return json(res, 429, { message: 'Too many requests' }, { 'Retry-After': '0' });
    if (mode === 429) return json(res, 200, { translations: corps.text.map((t) => ({ text: t })) });
    return json(res, mode, { message: 'x' });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => 'cle-de-test-suffisamment-longue', urlDeeplTest: url, journal: silencieux });
  await assert.rejects(m.traduireDeepl(['a'], { cible: 'fr' }), /Clé DeepL refusée/);
  mode = 456;
  await assert.rejects(m.traduireDeepl(['a'], { cible: 'fr' }), /Quota DeepL du mois épuisé/);
  mode = 429;
  assert.deepEqual(await m.traduireDeepl(['a'], { cible: 'fr' }), ['a']);
  await assert.rejects(m.traduireDeepl(['a'], { cible: 'he' }), /DeepL ne traduit pas vers Hébreu/);
  const sansCle = creerMoteurs({ fetch, lireCleDeepl: () => undefined, urlDeeplTest: url, journal: silencieux });
  await assert.rejects(sansCle.usageDeepl(), /Aucune clé DeepL/);
  s.close();
});

test('Ollama : lots JSON numérotés, réponses incomplètes redemandées, jamais de réplique vide', async () => {
  const requetes = [];
  let premiere = true;
  const { s, url } = await serveur((req, res, corps) => {
    if (req.url === '/api/tags') return json(res, 200, { models: [{ name: 'qwen2.5:7b', size: 4.7e9 }, { name: 'nomic-embed-text', size: 3e8 }] });
    requetes.push(corps);
    const entree = lignesDemandees(corps.messages[1].content);
    const sortie = {};
    for (const [k, v] of Object.entries(entree)) sortie[k] = `[fr] ${v}`;
    if (premiere) { premiere = false; delete sortie['3']; sortie['2'] = ''; } // le modèle « oublie » des lignes
    return json(res, 200, { message: { role: 'assistant', content: `<think>hmm</think>\n${JSON.stringify(sortie)}` } });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  assert.deepEqual(await m.modelesOllama(url), [{ nom: 'qwen2.5:7b', taille: 4.7e9 }]);
  const segments = Array.from({ length: 25 }, (_, i) => `ligne ${i}`);
  const r = await m.traduireTout(segments, { moteur: 'ollama', adresse: url, modele: 'qwen2.5:7b', source: 'en', cible: 'fr' });
  assert.equal(r.length, 25);
  assert.ok(r.every((t, i) => t === `[fr] ligne ${i}`), JSON.stringify(r));
  assert.equal(requetes[0].format, 'json');
  assert.equal(requetes[0].model, 'qwen2.5:7b');
  assert.match(requetes[0].messages[0].content, /into French/);
  s.close();
});

test('Ollama : réplique recopiée sans traduction → redemandée ; modèle qui recopie tout → message clair', async () => {
  let mode = 'une-fois';
  const vues = new Map();
  const { s, url } = await serveur((req, res, corps) => {
    assert.ok(!corps.messages[1].content.trim().startsWith('{'), 'la demande n\'est plus un objet JSON recopiable');
    const entree = lignesDemandees(corps.messages[1].content);
    const sortie = {};
    for (const [k, v] of Object.entries(entree)) {
      const n = (vues.get(v) || 0) + 1;
      vues.set(v, n);
      if (mode === 'toujours' || (mode === 'une-fois' && n === 1)) sortie[k] = v; // recopie
      else if (mode === 'chinois' && n === 1) sortie[k] = '为什么？';
      else sortie[k] = `[fr] ${v}`;
    }
    return json(res, 200, { message: { role: 'assistant', content: JSON.stringify(sortie) } });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  const o = { moteur: 'ollama', adresse: url, modele: 'petit:1b', source: 'en', cible: 'fr' };
  const segments = ['Why are you here?', 'They are Americans,', 'Ja-yoon!', 'Go home now.'];
  assert.deepEqual(await m.traduireTout(segments, o), segments.map((t) => `[fr] ${t}`));
  mode = 'chinois'; vues.clear();
  assert.deepEqual(await m.traduireTout(['Why is that?'], o), ['[fr] Why is that?']);
  mode = 'toujours'; vues.clear();
  const film = Array.from({ length: 20 }, (_, i) => `This is line number ${i}`);
  await assert.rejects(m.traduireTout(film, o), /« petit:1b » renvoie les répliques sans les traduire/);
  s.close();
});

test('Ollama : arrêté → message clair ; adresses publiques en HTTP refusées', async () => {
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  await assert.rejects(m.modelesOllama('http://127.0.0.1:1'), /ne répond pas/);
  await assert.rejects(m.modelesOllama('http://example.com:11434'), /Adresse de l'IA locale refusée/);
  for (const ok of ['http://127.0.0.1:11434', 'http://localhost:11434', 'http://192.168.1.20:11434', 'http://10.0.0.5:11434', 'https://ia.exemple.fr']) assert.ok(adresseOllamaValide(ok), ok);
  for (const ko of ['http://8.8.8.8:11434', 'file:///etc/passwd', 'http://user:pass@127.0.0.1:11434', 'javascript:alert(1)', 'ftp://127.0.0.1']) assert.ok(!adresseOllamaValide(ko), ko);
});

test('annulation : la traduction s\'arrête et ne renvoie rien', async () => {
  const { s, url } = await serveur(() => { /* ne répond jamais */ });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => 'cle-de-test-suffisamment-longue', urlDeeplTest: url, journal: silencieux });
  const c = new AbortController();
  setTimeout(() => c.abort(), 200);
  await assert.rejects(m.traduireTout(['a', 'b'], { moteur: 'deepl', cible: 'fr', signal: c.signal }), /annulée/);
  s.closeAllConnections();
  s.close();
});

test('XML : aller-retour sans perte', () => {
  const t = 'Tom & Jerry <x n="0"/>"hi"<x n="1"/> 1 < 2 > 0';
  assert.equal(depuisXml(versXml(t)), t);
});
