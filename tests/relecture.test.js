'use strict';
// Relecture par l'IA (T402) et tutoiement / vouvoiement (T401).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { traduireDocument, scenes, correctionValable } = require('../src/main/services/pipeline');
const { creerMoteurs } = require('../src/main/services/moteurs');
const { creerMemoire } = require('../src/main/services/memoire');
const formats = require('../src/main/services/formats');
const { lignesDemandees } = require('./e2e/outils');

const silencieux = { avertissement() {}, erreur() {}, info() {} };
const srt = (repliques) => formats.analyser(repliques.map(([d, f, t], i) => `${i + 1}\n${formats.depuisMs(d)} --> ${formats.depuisMs(f)}\n${t}\n`).join('\n'), 'srt');
const fauxMoteur = { async traduireTout(segments) { return segments.map((t) => `[fr] ${t}`); } };

test('scènes : coupées après 6 s de silence et à 40 lignes', () => {
  const lignes = [];
  for (let i = 0; i < 50; i++) lignes.push([i * 2000, i * 2000 + 1500, `Line ${i}`]);
  lignes.push([200000, 201000, 'Much later']);
  const doc = srt(lignes);
  const preparations = doc.repliques.map((r) => formats.preparerReplique(r.texte, 'srt'));
  let k = 0;
  const positions = preparations.map((p) => { const d = k; k += p.segments.length; return d; });
  const s = scenes(doc, positions, preparations);
  assert.deepEqual(s.map((x) => x.length), [40, 10, 1]);
});

test('correction contrôlée : marqueur perdu, glossaire perdu, recopie, trop longue → refusée', () => {
  assert.equal(correctionValable('Hello <x n="0"/>you<x n="1"/>', 'Salut <x n="0"/>toi<x n="1"/>', 'Bonjour <x n="0"/>vous<x n="1"/>', []), true);
  assert.equal(correctionValable('Hello <x n="0"/>you<x n="1"/>', 'Salut <x n="0"/>toi<x n="1"/>', 'Bonjour vous', []), false);
  assert.equal(correctionValable('Jon is here', 'Jon est là', 'Il est là', ['Jon']), false);
  assert.equal(correctionValable('Where are you going?', 'Où vas-tu ?', 'Where are you going?', []), false);
  assert.equal(correctionValable('Hi', 'Salut', 'x'.repeat(200), []), false);
  assert.equal(correctionValable('Hi there', 'Salut', 'Salut', []), false, 'identique : rien à faire');
});

test('relecture : corrections appliquées, mauvaises refusées, doutes notés ; IA coupée en route → traduction gardée', async () => {
  const doc = srt([[1000, 2000, 'You are late.'], [2500, 3500, '<i>Sorry</i> sir.'], [4000, 5000, 'Who is she?'], [20000, 21000, 'Later.']]);
  const appels = [];
  const relecture = {
    async relire(lignes) {
      appels.push(lignes);
      if (appels.length === 1) {
        return {
          corrections: [
            { n: lignes[0].n, texte: '[fr] Tu es en retard.', type: 'address', raison: 'tu comme dans la suite de la scène' },
            { n: lignes[1].n, texte: 'Désolé monsieur.', type: 'other', raison: 'marqueurs perdus' },
          ],
          doutes: [{ n: lignes[2].n, raison: 'genre du personnage ?' }],
        };
      }
      throw new Error('L\'IA locale ne répond pas');
    },
    surAvancement() {},
  };
  const b = await traduireDocument(doc, { moteurs: fauxMoteur, relecture, options: { moteur: 'ollama', modele: 'm', cible: 'fr' } });
  assert.equal(appels.length, 2);
  assert.equal(appels[0][1].original, 'Sorry<x n="0"/> sir.');
  assert.deepEqual(b.relecture, { scenes: 2, corrigees: 1, refusees: 1, doutes: 1, tuVous: 1, sautees: 1, erreur: 'L\'IA locale ne répond pas' });
  assert.equal(doc.repliques[0].texte, '[fr] Tu es en retard.');
  assert.equal(doc.repliques[1].texte, '<i>[fr] Sorry</i> sir.', 'correction qui perd la mise en forme refusée');
  assert.equal(doc.repliques[3].texte, '[fr] Later.');
  assert.deepEqual(b.notes.get(0), { type: 'corrige', raison: 'tu comme dans la suite de la scène' });
  assert.deepEqual(b.notes.get(2), { type: 'doute', raison: 'genre du personnage ?' });
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
const json = (res, o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

test('relireScene (IA locale) : consigne tu/vous, numéros ramenés aux segments, réponse illisible', async () => {
  const demandes = [];
  let reponse = { corrections: [{ line: 2, text: 'Tu viens ?', type: 'address', reason: 'tutoiement' }, { line: 9, text: 'x' }], doubts: [{ line: 1, reason: 'sens ?' }] };
  const { s, url } = await serveur((req, res, corps) => {
    demandes.push(corps);
    json(res, { message: { content: typeof reponse === 'string' ? reponse : JSON.stringify(reponse) } });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
  const lignes = [{ n: 10, original: 'Hello.', traduction: 'Bonjour.' }, { n: 11, original: 'Are you coming?', traduction: 'Vous venez ?' }];
  const r = await m.relireScene(lignes, { adresse: url, modele: 'm', source: 'en', cible: 'fr', registre: 'auto' });
  assert.deepEqual(r, { corrections: [{ n: 11, texte: 'Tu viens ?', type: 'address', raison: 'tutoiement' }], doutes: [{ n: 10, raison: 'sens ?' }] });
  assert.match(demandes[0].messages[0].content, /proofreader/);
  assert.match(demandes[0].messages[0].content, /informal \("tu"\) or formal \("vous"\)/);
  assert.match(demandes[0].messages[1].content, /2\. original: "Are you coming\?"\n {3}translation: "Vous venez \?"/);
  reponse = 'pas du JSON';
  assert.deepEqual(await m.relireScene(lignes, { adresse: url, modele: 'm', cible: 'fr' }), { illisible: true, corrections: [], doutes: [] });
  // Anglais en arrivée : pas de règle tu/vous.
  reponse = { corrections: [], doubts: [] };
  await m.relireScene(lignes, { adresse: url, modele: 'm', cible: 'en' });
  assert.doesNotMatch(demandes.at(-1).messages[0].content, /Form of address/);
  s.close();
});

test('tu / vous imposé : DeepL formality, consigne de l\'IA locale, clé de mémoire distincte', async () => {
  const demandes = [];
  const { s, url } = await serveur((req, res, corps) => {
    demandes.push(corps);
    if (req.url.startsWith('/v2/')) return json(res, { translations: corps.text.map((t) => ({ text: `FR:${t}` })) });
    const sortie = {};
    for (const [k, v] of Object.entries(lignesDemandees(corps.messages[1].content))) sortie[k] = `[fr] ${v}`;
    return json(res, { message: { content: JSON.stringify(sortie) } });
  });
  const m = creerMoteurs({ fetch, lireCleDeepl: () => 'cle-de-test-suffisamment-longue', urlDeeplTest: url, journal: silencieux });
  await m.traduireTout(['Hi there'], { moteur: 'deepl', cible: 'fr', formalite: 'formel', registre: 'tu' });
  assert.equal(demandes[0].formality, 'prefer_less');
  await m.traduireTout(['Hi there'], { moteur: 'deepl', cible: 'fr', formalite: 'formel', registre: 'auto' });
  assert.equal(demandes[1].formality, 'prefer_more', 'automatique : le ton choisi dans Moteurs');
  await m.traduireTout(['Hi there'], { moteur: 'ollama', adresse: url, modele: 'm', cible: 'fr', registre: 'vous' });
  assert.match(demandes[2].messages[0].content, /Always address people with the formal form \("vous"\)/);
  await m.traduireTout(['Hi there'], { moteur: 'ollama', adresse: url, modele: 'm', cible: 'de', registre: 'tu' });
  assert.match(demandes[3].messages[0].content, /informal form \("du"\)/);
  s.close();

  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-reg-'));
  const memoire = creerMemoire({ fichier: path.join(d, 'm.jsonl'), journal: silencieux });
  const recus = [];
  const moteur = { async traduireTout(segments) { recus.push(...segments); return segments.map((t) => `[fr] ${t}`); } };
  const o = { moteur: 'ollama', modele: 'm', cible: 'fr', memoire: true };
  await traduireDocument(srt([[0, 1000, 'Are you coming?']]), { moteurs: moteur, memoire, options: { ...o, registre: 'auto' } });
  await traduireDocument(srt([[0, 1000, 'Are you coming?']]), { moteurs: moteur, memoire, options: { ...o, registre: 'auto' } });
  assert.equal(recus.length, 1, 'automatique : repris de la mémoire');
  await traduireDocument(srt([[0, 1000, 'Are you coming?']]), { moteurs: moteur, memoire, options: { ...o, registre: 'tu' } });
  assert.equal(recus.length, 2, '« tu » imposé : pas repris d\'une traduction faite sans');
  fs.rmSync(d, { recursive: true, force: true });
});
