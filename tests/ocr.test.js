'use strict';
// Sous-titres Blu-ray : décodage PGS, nettoyage OCR, et OCR réel (Tesseract) sur un .sup de test.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const pgs = require('../src/main/services/pgs');
const { creerOcr, nettoyer, versSrt } = require('../src/main/services/ocr');
const { encoderSup } = require('./outils/pgs-encodeur');

const SUP = path.join(__dirname, 'fixtures', 'blu-ray.en.sup');
const ATTENDU = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'blu-ray.en.attendu.json'), 'utf8'));
const TESSDATA = path.join(__dirname, '..', 'vendor', 'tessdata');
const silencieux = { avertissement() {}, erreur() {}, info() {} };

// Image RGBA simple : rectangle clair entouré de sombre sur fond transparent.
function rectangle(l, h) {
  const rgba = Buffer.alloc(l * h * 4);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < l - 2; x++) {
      const bord = y < 4 || y >= h - 4 || x < 4 || x >= l - 4;
      const i = (y * l + x) * 4;
      rgba.fill(bord ? 0 : 255, i, i + 3); rgba[i + 3] = 255;
    }
  }
  return rgba;
}

test('PGS : minutages exacts, contour retiré, une image par réplique', () => {
  const r = pgs.lireSup(fs.readFileSync(SUP));
  assert.equal(r.abimes, 0);
  assert.deepEqual(r.repliques.map((x) => [x.debut, x.fin]), ATTENDU.map((x) => [x.debut, x.fin]));
  for (const x of r.repliques) {
    const encre = x.image.gris.filter((v) => v === 0).length;
    assert.ok(encre > 500 && encre < x.image.gris.length / 2, 'texte présent, fond blanc dominant');
  }
});

test('PGS : RLE aller-retour, longues séries, objet plus large que la vidéo refusé', () => {
  const l = 300; const h = 3;
  const idx = new Uint8Array(l * h);
  idx.fill(5, 0, 200); idx.fill(1, 300, 302); idx.fill(0, 302, 600); idx.fill(7, 600, 900);
  const { rle } = require('./outils/pgs-encodeur');
  assert.deepEqual(pgs.decoderRle(rle(idx, l, h), l, h), idx);
  assert.throws(() => pgs.lireSup(Buffer.from('pas un sup')), /pas un sous-titre Blu-ray/);
});

test('PGS : fichier tronqué ou abîmé → répliques lisibles gardées, dégâts comptés', () => {
  const brut = fs.readFileSync(SUP);
  const tronque = pgs.lireSup(brut.subarray(0, Math.floor(brut.length * 0.6)));
  assert.ok(tronque.repliques.length >= 2 && tronque.repliques.length < 4);
  assert.ok(tronque.abimes >= 1);
  const abime = Buffer.from(brut);
  abime.fill(0x41, 3000, 3200); // un morceau écrasé au milieu
  const r = pgs.lireSup(abime);
  assert.ok(r.repliques.length >= 3, 'les autres répliques sont gardées');
});

test('PGS : même image réaffichée (fondu) → une seule réplique prolongée', () => {
  const img = { debut: 1000, fin: 2000, largeur: 40, hauteur: 20, rgba: rectangle(40, 20) };
  const sup = encoderSup([img, { ...img, debut: 2000, fin: 3000 }, { ...img, debut: 5000, fin: 6000 }]);
  const r = pgs.lireSup(sup);
  assert.deepEqual(r.repliques.map((x) => [x.debut, x.fin]), [[1000, 3000], [5000, 6000]]);
});

test('nettoyage OCR : | → I, tirets de dialogue, espaces, ponctuation française', () => {
  assert.equal(nettoyer('| told you, l\'m here .\n\n', 'en'), 'I told you, I\'m here.');
  assert.equal(nettoyer('—Are you coming?\n-Not tonight.', 'en'), '- Are you coming?\n- Not tonight.');
  assert.equal(nettoyer('Tu viens ?', 'fr'), 'Tu viens ?');
});

test('OCR réel (Tesseract) : texte relu à ≥ 90 % de mots justes, SRT construit', { timeout: 180000 }, async () => {
  const ocr = creerOcr({ dossierLangues: TESSDATA, journal: silencieux, travailleurs: 2 });
  assert.equal(ocr.disponible('en'), true);
  assert.equal(ocr.disponible('ja'), false);
  const r = pgs.lireSup(fs.readFileSync(SUP));
  const avancement = [];
  const textes = await ocr.lire(r.repliques.map((x) => x.image), { langue: 'en', surAvancement: (a, b) => avancement.push([a, b]) });
  const mots = (t) => t.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean);
  let justes = 0; let total = 0;
  ATTENDU.forEach((a, i) => {
    const attendus = mots(a.lignes.join(' '));
    const lus = mots(textes[i].texte);
    total += attendus.length;
    justes += attendus.filter((m) => lus.includes(m)).length;
  });
  assert.ok(justes / total >= 0.9, `${justes}/${total} mots justes : ${JSON.stringify(textes.map((t) => t.texte))}`);
  assert.equal(textes[2].texte.split('\n').length, 2, 'les deux lignes du dialogue sont gardées');
  assert.ok(textes[2].texte.startsWith('- '), 'tiret de dialogue');
  assert.deepEqual(avancement.at(-1), [4, 4]);
  const doc = versSrt(r.repliques, textes);
  assert.equal(doc.repliques.length, 4);
  assert.equal(doc.repliques[1].minutage, '00:00:04,000 --> 00:00:07,000');
});

test('OCR : langue sans données → message clair ; annulation → arrêt', { timeout: 120000 }, async () => {
  const ocr = creerOcr({ dossierLangues: TESSDATA, journal: silencieux, travailleurs: 1 });
  await assert.rejects(ocr.lire([], { langue: 'ja' }), /non disponible pour cette langue/);
  const r = pgs.lireSup(fs.readFileSync(SUP));
  const c = new AbortController();
  const images = Array.from({ length: 40 }, (_, i) => r.repliques[i % 4].image);
  setTimeout(() => c.abort(), 1500);
  await assert.rejects(ocr.lire(images, { langue: 'en', signal: c.signal }), /annulée/);
});
