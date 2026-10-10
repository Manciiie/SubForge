'use strict';
// Saison entière : parcours des dossiers et choix de ce qu'il faut traduire.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const d = require('../src/main/services/dossiers');

function arbre(fichiers) {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-saison-'));
  for (const f of fichiers) {
    const c = path.join(racine, f);
    fs.mkdirSync(path.dirname(c), { recursive: true });
    fs.writeFileSync(c, 'x');
  }
  return racine;
}

test('saison : tri naturel, déjà traduits ignorés, vidéo remplacée par son sous-titre, sous-dossiers', () => {
  const r = arbre([
    'Saison 1/Show.S01E10.mkv',
    'Saison 1/Show.S01E2.mkv',
    'Saison 1/Show.S01E2.fr.srt',          // déjà traduit
    'Saison 1/Show.S01E1.mkv',
    'Saison 1/Show.S01E1.en.srt',          // à traduire à la place de la vidéo
    'Saison 1/Show.S01E1.es.srt',
    'Saison 1/Bonus/Making-of.mkv',        // sous-dossier : pris
    'Saison 1/Sample/Show.sample.mkv',     // dossier « Sample » : ignoré
    'Saison 1/.cache/x.mkv',               // caché : ignoré
    'Saison 1/notes.txt',                  // pas un film
  ]);
  const { fichiers, bilan } = d.explorer([path.join(r, 'Saison 1')], { cible: 'fr', source: 'auto' });
  assert.deepEqual(fichiers.map((f) => path.relative(r, f).replace(/\\/g, '/')), [
    'Saison 1/Bonus/Making-of.mkv',
    'Saison 1/Show.S01E1.en.srt',
    'Saison 1/Show.S01E10.mkv',
  ]);
  assert.equal(bilan.dejaTraduits, 1);
  assert.equal(bilan.videosRemplacees, 1);
  assert.equal(bilan.ignoresSysteme, 2);
  assert.equal(bilan.tronque, false);
  fs.rmSync(r, { recursive: true, force: true });
});

test('saison : langue source préférée, « fre » / « fra » reconnus comme déjà traduits', () => {
  const r = arbre(['A.mkv', 'A.en.srt', 'A.es.srt', 'B.mkv', 'B.fre.srt', 'C.mkv', 'C.fra.forced.srt']);
  const { fichiers, bilan } = d.explorer([r], { cible: 'fr', source: 'es' });
  assert.deepEqual(fichiers.map((f) => path.basename(f)), ['A.es.srt']);
  assert.equal(bilan.dejaTraduits, 2);
  fs.rmSync(r, { recursive: true, force: true });
});

test('saison : limite de fichiers, dossier vide, fichier déposé directement gardé, chemin disparu compté', () => {
  const r = arbre(Array.from({ length: 30 }, (_, i) => `E${i}.mkv`));
  const t = d.explorer([r], { cible: 'fr', fichiersMax: 10 });
  assert.equal(t.fichiers.length, 10);
  assert.equal(t.bilan.tronque, true);
  const vide = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-vide-'));
  assert.deepEqual(d.explorer([vide], { cible: 'fr' }).fichiers, []);
  // Un fichier déposé seul n'est jamais filtré, même s'il est déjà dans la langue cible.
  const direct = path.join(r, 'E0.fr.srt');
  fs.writeFileSync(direct, 'x');
  const x = d.explorer([direct, path.join(r, 'disparu.mkv')], { cible: 'fr' });
  assert.deepEqual(x.fichiers, [direct]);
  assert.equal(x.bilan.introuvables, 1);
  fs.rmSync(r, { recursive: true, force: true });
  fs.rmSync(vide, { recursive: true, force: true });
});

test('saison : lien symbolique vers un dossier parent jamais suivi (pas de boucle)', { skip: process.platform === 'win32' && 'liens réservés à l\'administrateur' }, () => {
  const r = arbre(['S1/E1.mkv']);
  fs.symlinkSync(r, path.join(r, 'S1', 'boucle'));
  const { fichiers, bilan } = d.explorer([r], { cible: 'fr' });
  assert.equal(fichiers.length, 1);
  assert.equal(bilan.liens, 1);
  fs.rmSync(r, { recursive: true, force: true });
});

test('saison : dossier illisible compté, le reste continue', { skip: (process.getuid?.() === 0 || process.platform === 'win32') && 'droits non testables en administrateur' }, () => {
  const r = arbre(['ok/E1.mkv', 'interdit/E2.mkv']);
  fs.chmodSync(path.join(r, 'interdit'), 0o000);
  const { fichiers, bilan } = d.explorer([r], { cible: 'fr' });
  assert.equal(fichiers.length, 1);
  assert.equal(bilan.interdits, 1);
  fs.chmodSync(path.join(r, 'interdit'), 0o755);
  fs.rmSync(r, { recursive: true, force: true });
});
