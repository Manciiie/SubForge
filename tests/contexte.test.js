'use strict';
// Contexte du film (TMDB) : reconnaissance, détails, cache, choix manuel, texte envoyé aux moteurs.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { creerContexte, texteContexte, formeJeton } = require('../src/main/services/contexte');
const { fauxTmdb, JETON_TEST, CLE_TEST } = require('./e2e/faux-tmdb');

const silencieux = { avertissement() {}, erreur() {}, info() {} };

async function preparer(jeton = JETON_TEST) {
  const s = await fauxTmdb();
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-ctx-'));
  let j = jeton;
  const c = creerContexte({ fetch, lireJeton: () => j, fichierCache: path.join(d, 'cache.json'), urlTest: s.url, journal: silencieux });
  return { s, d, c, changerJeton: (x) => { j = x; } };
}

test('forme du jeton : jeton v4 (en-tête) ou clé v3 (paramètre)', () => {
  assert.equal(formeJeton(JETON_TEST), 'bearer');
  assert.equal(formeJeton(CLE_TEST), 'cle');
  assert.equal(formeJeton('nimporte quoi'), null);
  assert.equal(formeJeton(''), null);
});

test('film reconnu d\'après le nom du fichier : personnages + genre, texte nettoyé, cache', async () => {
  const { s, d, c } = await preparer();
  const r = await c.pour('/films/The.Witch.Part.1.The.Subversion.2018.Korean.1080p.BluRay.x265.mkv');
  assert.equal(r.etat, 'trouve');
  assert.equal(r.contexte.titre, 'The Witch: Part 1. The Subversion');
  assert.equal(r.contexte.annee, 2018);
  assert.ok(!/\u0007/.test(r.contexte.resume), 'caractère de contrôle retiré');
  assert.deepEqual(r.contexte.personnages.map((p) => [p.personnage, p.genre]), [['Ja-yoon', 'female'], ['Dr. Baek', 'female'], ['Nobleman', 'male'], ['Mr. Choi', 'male'], ['Myung-hee', null]]);
  assert.ok(s.requetes.every((q) => q.auth === `Bearer ${JETON_TEST}` && !q.params.api_key), 'jeton dans l\'en-tête, jamais dans l\'adresse');
  const avant = s.requetes.length;
  await c.pour('/films/The.Witch.Part.1.The.Subversion.2018.Korean.1080p.BluRay.x265.fr.srt');
  assert.equal(s.requetes.length, avant + 1, 'détails repris du cache (seule la recherche est refaite)');
  const t = texteContexte(r.contexte);
  assert.match(t, /^Film "The Witch: Part 1\. The Subversion" \(2018\)\. Synopsis: A girl who escaped/);
  assert.match(t, /Characters: Ja-yoon \(female\), Dr\. Baek \(female\), Nobleman \(male\), Mr\. Choi \(male\), Myung-hee\./);
  s.close();
  fs.rmSync(d, { recursive: true, force: true });
});

test('série + épisode : invités de l\'épisode en tête ; épisode inconnu → série seule', async () => {
  const { s, d, c } = await preparer(CLE_TEST);
  const r = await c.pour('/series/Serie.S01E02.1080p.mkv');
  assert.equal(r.etat, 'trouve');
  assert.deepEqual(r.contexte.episode, { saison: 1, episode: 2, titre: 'The Visitor', resume: 'A stranger arrives in town.' });
  assert.deepEqual(r.contexte.personnages.map((p) => p.personnage), ['The Visitor', 'Detective Park', 'Sergeant Lee']);
  assert.match(texteContexte(r.contexte), /^TV series "Serie" \(2020\), season 1 episode 2 "The Visitor"\. Synopsis: A stranger arrives/);
  assert.ok(s.requetes.every((q) => q.params.api_key === CLE_TEST && !q.auth), 'clé v3 en paramètre');
  const r2 = await c.pour('/series/Serie.S01E09.mkv');
  assert.equal(r2.contexte.episode, null);
  assert.deepEqual(r2.contexte.personnages.map((p) => p.personnage), ['Detective Park', 'Sergeant Lee']);
  s.close();
  fs.rmSync(d, { recursive: true, force: true });
});

test('non reconnu → choix manuel mémorisé pour le dossier ; « sans contexte » respecté', async () => {
  const { s, d, c } = await preparer();
  const inconnu = await c.pour('/films/Witch.1999.mkv');
  assert.deepEqual(inconnu, { etat: 'inconnu', recherche: 'Witch' });
  const choix = await c.chercher('The Witch');
  assert.deepEqual(choix.map((x) => [x.type, x.id, x.annee]), [['film', 1001, 2018], ['film', 1002, 2015]], 'personnes écartées');
  c.choisir('/films/Witch.1999.mkv', { type: 'film', id: 1002 });
  assert.equal((await c.pour('/films/Witch.1999.fr.srt')).contexte.titre, 'The Witch', 'même titre, même dossier : même choix');
  c.choisir('/series/Serie.S01E02.mkv', null);
  assert.deepEqual(await c.pour('/series/Serie.S01E03.mkv'), { etat: 'aucun' });
  // Relu depuis le disque.
  const c2 = creerContexte({ fetch, lireJeton: () => JETON_TEST, fichierCache: path.join(d, 'cache.json'), urlTest: s.url, journal: silencieux });
  assert.deepEqual(await c2.pour('/series/Serie.S01E05.mkv'), { etat: 'aucun' });
  s.close();
  fs.rmSync(d, { recursive: true, force: true });
});

test('jeton refusé, absent, mal formé, TMDB injoignable : messages clairs', async () => {
  const { s, d, c, changerJeton } = await preparer('eyJx.eyJy.zzz');
  await assert.rejects(c.tester(), /TMDB refuse le jeton/);
  changerJeton('');
  await assert.rejects(c.tester(), /Aucun jeton TMDB/);
  changerJeton('abc');
  await assert.rejects(c.tester(), /n'a pas la bonne forme/);
  s.close();
  const c2 = creerContexte({ fetch, lireJeton: () => JETON_TEST, fichierCache: path.join(d, 'c2.json'), urlTest: 'http://127.0.0.1:1/3', journal: silencieux });
  await assert.rejects(c2.tester(), /injoignable/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('texte du contexte : coupé à la longueur demandée', () => {
  const t = texteContexte({ type: 'film', titre: 'X', annee: 2000, resume: 'a'.repeat(3000), personnages: [] }, 300);
  assert.equal(t.length, 300);
});
