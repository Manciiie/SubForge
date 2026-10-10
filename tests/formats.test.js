'use strict';
// Formats de sous-titres : lecture, réécriture à l'identique, balises, découpage, nom de sortie.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const f = require('../src/main/services/formats');

const SRT = '1\r\n00:00:01,000 --> 00:00:03,500\r\n<i>Hello there,</i>\r\n<i>my friend.</i>\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\n- Are you OK?\r\n- I\'m <b>fine</b>.\r\n\r\n3\r\n00:00:07,000 --> 00:00:08,000\r\n♪ ♪\r\n\r\n';

const ASS = `[Script Info]
Title: Test
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,Bob,0,0,0,,{\\an8}Hello, how are you?\\NI missed you, Bob.
Dialogue: 0,0:00:04.00,0:00:05.00,Default,,0,0,0,,{\\i1}Whatever{\\i0}, man.
Dialogue: 0,0:00:06.00,0:00:07.00,Default,,0,0,0,,{\\p1}m 0 0 l 100 0 100 100{\\p0}
Comment: 0,0:00:06.00,0:00:07.00,Default,,0,0,0,,Note pour moi
`;

const VTT = 'WEBVTT\n\nNOTE une note\n\n1\n00:01.000 --> 00:03.000 align:start\n<v Bob>Hello world</v>\n\n00:00:04.000 --> 00:00:05.000\nBye!\n';

// Faux traducteur : met le texte en majuscules et garde les marqueurs.
const traduire = (segments) => segments.map((s) => s.replace(/(^|>)([^<]*)/g, (_m, a, b) => a + b.toUpperCase()));

function traduireDoc(doc) {
  for (const r of doc.repliques) {
    if (r.dessin) continue;
    const p = f.preparerReplique(r.texte, doc.format);
    r.texte = p.recomposer(traduire(p.segments));
  }
  return doc;
}

test('SRT : relu puis réécrit sans traduction = identique', () => {
  const doc = f.analyser(SRT, 'srt');
  assert.equal(doc.repliques.length, 3);
  assert.equal(f.serialiser(doc), SRT.replace(/\r\n\r\n$/, '\r\n'));
});

test('SRT : italiques gardés, lignes réunies puis recoupées, dialogue ligne à ligne, symboles intacts', () => {
  const doc = traduireDoc(f.analyser(SRT, 'srt'));
  assert.equal(doc.repliques[0].texte, '<i>HELLO THERE,\nMY FRIEND.</i>');
  assert.equal(doc.repliques[1].texte, '- ARE YOU OK?\n- I\'M <b>FINE</b>.');
  assert.equal(doc.repliques[2].texte, '♪ ♪');
  assert.equal(doc.repliques[0].minutage, '00:00:01,000 --> 00:00:03,500');
});

test('ASS : styles, minutages, positions et dessins conservés ; \\N restitué', () => {
  const doc = traduireDoc(f.analyser(ASS, 'ass'));
  const sortie = f.serialiser(doc).replace(/\r\n/g, '\n');
  assert.ok(sortie.includes('Style: Default,Arial,20'));
  assert.ok(sortie.includes('Dialogue: 0,0:00:01.00,0:00:03.00,Default,Bob,0,0,0,,{\\an8}HELLO, HOW ARE YOU?\\NI MISSED YOU, BOB.'));
  assert.ok(sortie.includes('{\\i1}WHATEVER{\\i0}, MAN.'));
  assert.ok(sortie.includes('{\\p1}m 0 0 l 100 0 100 100{\\p0}'));
  assert.ok(sortie.includes('Comment: 0,0:00:06.00,0:00:07.00,Default,,0,0,0,,Note pour moi'));
});

test('ASS → SRT : minutages convertis, italique converti, balises ASS retirées, dessins exclus', () => {
  const doc = traduireDoc(f.analyser(ASS, 'ass'));
  f.preparerConversionAss(doc);
  const srt = f.versSrt(doc);
  assert.equal(srt.repliques.length, 2);
  assert.equal(srt.repliques[0].minutage, '00:00:01,000 --> 00:00:03,000');
  assert.equal(srt.repliques[0].texte, 'HELLO, HOW ARE YOU?\nI MISSED YOU, BOB.');
  assert.equal(srt.repliques[1].texte, '<i>WHATEVER</i>, MAN.');
});

test('VTT : en-tête, NOTE et réglages conservés', () => {
  const doc = traduireDoc(f.analyser(VTT, 'vtt'));
  const sortie = f.serialiser(doc).replace(/\r\n/g, '\n');
  assert.ok(sortie.startsWith('WEBVTT\n\nNOTE une note\n\n1\n00:01.000 --> 00:03.000 align:start\n<v Bob>HELLO WORLD</v>'));
  assert.ok(sortie.includes('00:00:04.000 --> 00:00:05.000\nBYE!'));
  const srt = f.versSrt(doc);
  assert.equal(srt.repliques[0].minutage, '00:00:01,000 --> 00:00:03,000');
  assert.equal(srt.repliques[0].texte, 'HELLO WORLD');
});

test('encodage : Windows-1252 et UTF-16 décodés correctement', () => {
  const latin = Buffer.from([0x45, 0x74, 0xe9, 0x20, 0xe0, 0x20, 0x50, 0x61, 0x72, 0x69, 0x73]); // « Eté à Paris »
  assert.deepEqual(f.decoder(latin), { texte: 'Eté à Paris', encodage: 'Windows-1252' });
  const u16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Ça va', 'utf16le')]);
  assert.equal(f.decoder(u16).texte, 'Ça va');
  assert.equal(f.decoder(Buffer.from('﻿bonjour', 'utf8')).texte, 'bonjour');
});

test('marqueurs perdus par le moteur : texte rendu sans balises internes (jamais de balise orpheline)', () => {
  const p = f.preparerReplique('Je suis <i>vraiment</i> content', 'srt');
  assert.equal(p.segments[0], 'Je suis <x n="0"/>vraiment<x n="1"/> content');
  assert.equal(p.recomposer(['I am <x n="0"/>really<x n="1"/> happy']), 'I am <i>really</i> happy');
  assert.equal(p.recomposer(['I am <x n="0"/>really happy']), 'I am really happy');
  assert.equal(p.recomposer(['I am <x n="7"/>really happy']), 'I am really happy');
});

test('recoupage : deux lignes équilibrées, une ligne trop longue est coupée en deux', () => {
  assert.equal(f.recouper('Bonjour tout le monde, comment allez-vous ce soir ?', 2), 'Bonjour tout le monde,\ncomment allez-vous ce soir ?');
  assert.equal(f.recouper('Court.', 1), 'Court.');
  assert.ok(f.recouper('Une phrase vraiment beaucoup trop longue pour tenir sur une seule ligne', 1).includes('\n'));
});

test('nom de sortie : langue remplacée, drapeaux gardés, jamais d\'écrasement', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-noms-'));
  assert.equal(f.nomSortie(path.join(d, 'Film.en.srt'), 'fr', '.srt'), path.join(d, 'Film.fr.srt'));
  assert.equal(f.nomSortie(path.join(d, 'Film.2019.eng.forced.srt'), 'fr', '.srt'), path.join(d, 'Film.2019.fr.forced.srt'));
  assert.equal(f.nomSortie(path.join(d, 'Mon film (2020).mkv'), 'fr', '.srt'), path.join(d, 'Mon film (2020).fr.srt'));
  fs.writeFileSync(path.join(d, 'Film.fr.srt'), 'existant');
  assert.equal(f.nomSortie(path.join(d, 'Film.en.srt'), 'fr', '.srt'), path.join(d, 'Film.fr (2).srt'));
  fs.rmSync(d, { recursive: true, force: true });
});

test('écriture : atomique, BOM en SRT, refuse d\'écraser, aucun fichier temporaire laissé', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-ecr-'));
  const doc = f.analyser(SRT, 'srt');
  const c = path.join(d, 'Film.fr.srt');
  f.ecrireFichier(c, doc);
  const b = fs.readFileSync(c);
  assert.deepEqual([...b.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.throws(() => f.ecrireFichier(c, doc), /existe déjà/);
  assert.equal(fs.readFileSync(c).length, b.length);
  assert.deepEqual(fs.readdirSync(d), ['Film.fr.srt']);
  fs.rmSync(d, { recursive: true, force: true });
});

test('fichiers refusés : vide, mal formé, trop gros, format inconnu', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-refus-'));
  fs.writeFileSync(path.join(d, 'vide.srt'), '');
  assert.throws(() => f.lireFichier(path.join(d, 'vide.srt')), /Aucune réplique/);
  fs.writeFileSync(path.join(d, 'x.vtt'), 'pas un vtt');
  assert.throws(() => f.lireFichier(path.join(d, 'x.vtt')), /WEBVTT/);
  fs.writeFileSync(path.join(d, 'x.txt'), 'texte');
  assert.throws(() => f.lireFichier(path.join(d, 'x.txt')), /non pris en charge/);
  const gros = path.join(d, 'gros.srt');
  fs.writeFileSync(gros, Buffer.alloc(f.TAILLE_MAX + 1, 0x41));
  assert.throws(() => f.lireFichier(gros), /trop gros/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('SRT mal formé (pas de ligne vide entre répliques, espaces) : lu quand même', () => {
  const t = '1\n00:00:01,000 --> 00:00:02,000\nUn\n2\n00:00:03,000 --> 00:00:04,000\nDeux\n\n\n\n3\n00:00:05.000 --> 00:00:06.000\nTrois';
  const doc = f.analyser(t, 'srt');
  assert.deepEqual(doc.repliques.map((r) => r.texte), ['Un', 'Deux', 'Trois']);
});
