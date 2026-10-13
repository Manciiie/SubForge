'use strict';
// Synchronisation automatique : décalage et vitesse retrouvés sur un faux film dont on connaît la réponse.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const synchro = require('../src/main/services/synchro');
const formats = require('../src/main/services/formats');

const FFMPEG = path.join(__dirname, '..', 'vendor', process.platform === 'win32' ? 'win' : 'linux', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

// Générateur pseudo-aléatoire reproductible.
function hasard(graine) { let x = graine; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }

// Répliques « vraies » (dans le temps du film) : 1 à 4 s de parole, 0,5 à 6 s de silence.
function repliquesVraies(dureeS, graine = 7) {
  const h = hasard(graine);
  const r = [];
  let t = 2000;
  while (t < dureeS * 1000 - 5000) {
    const d = 1000 + h() * 3000;
    r.push({ debut: t, fin: t + d });
    t += d + 500 + h() * 5500;
  }
  return r;
}

// Énergies par trame de 20 ms : bruit de fond + « voix » pendant les répliques (+ musique forte par moments).
function energiesPour(repliques, dureeS, graine = 3) {
  const h = hasard(graine);
  const n = Math.round(dureeS * 1000 / synchro.TRAME_MS);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) e[i] = 2 + h() * 0.8 + (Math.floor(i / 1500) % 7 === 3 ? 1.5 : 0); // passages musicaux
  for (const r of repliques) {
    for (let i = Math.floor(r.debut / synchro.TRAME_MS); i < Math.min(n, r.fin / synchro.TRAME_MS); i++) if (h() > 0.25) e[i] = 4 + h();
  }
  return e;
}

test('décalage retrouvé (+3,2 s et −41,7 s), déjà synchronisé, trop peu de répliques', async () => {
  const vraies = repliquesVraies(1200);
  const e = energiesPour(vraies, 1200);
  for (const decalage of [3200, -41700]) {
    const sous = vraies.map((r) => ({ debut: r.debut - decalage, fin: r.fin - decalage }));
    const r = await synchro.trouverDecalage(e, sous);
    assert.equal(r.applique, true, JSON.stringify(r));
    assert.equal(r.vitesse, 1);
    assert.ok(Math.abs(r.decalageMs - decalage) <= 40, `${r.decalageMs} au lieu de ${decalage}`);
  }
  const deja = await synchro.trouverDecalage(e, vraies);
  assert.equal(deja.applique, false);
  assert.equal(deja.raison, 'deja');
  assert.equal((await synchro.trouverDecalage(e, vraies.slice(0, 10))).raison, 'trop-peu');
});

test('vitesse retrouvée : sous-titre d\'une version 25 i/s sur un film à 23,976 i/s', async () => {
  const vraies = repliquesVraies(2400, 11);
  const e = energiesPour(vraies, 2400, 5);
  const k = 25 / 23.976;
  const sous = vraies.map((r) => ({ debut: (r.debut - 1500) / k, fin: (r.fin - 1500) / k }));
  const r = await synchro.trouverDecalage(e, sous);
  assert.equal(r.applique, true, JSON.stringify(r));
  assert.ok(Math.abs(r.vitesse - k) < 1e-9, `vitesse ${r.vitesse}`);
  const t = synchro.transformation(r);
  for (const [i, v] of [[0, vraies[0]], [200, vraies[200]]]) assert.ok(Math.abs(t(sous[i].debut) - v.debut) <= 60, `réplique ${i} : ${t(sous[i].debut)} / ${v.debut}`);
  assert.equal(synchro.libelleVitesse(r.vitesse), '25 → 23,976 i/s');
});

test('sous-titre sans rapport avec le son → incertain, rien appliqué', async () => {
  const e = energiesPour(repliquesVraies(1200, 21), 1200, 9);
  const autres = repliquesVraies(1200, 99);
  const r = await synchro.trouverDecalage(e, autres);
  assert.equal(r.applique, false, JSON.stringify(r));
  assert.equal(r.raison, 'incertain');
});

test('vrai son décodé par ffmpeg : film de 3 min, « voix » décalée de 2,5 s', async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-synchro-'));
  const vraies = repliquesVraies(180, 4);
  // Son : bruit faible + bruit fort (dans la bande de la voix) pendant les répliques.
  const h = hasard(1);
  const pcm = Buffer.alloc(180 * 8000 * 2);
  let k = 0;
  for (let i = 0; i < 180 * 8000; i++) {
    const t = i / 8;
    while (k < vraies.length && vraies[k].fin < t) k += 1;
    const voix = k < vraies.length && vraies[k].debut <= t && t <= vraies[k].fin;
    pcm.writeInt16LE(Math.round((h() * 2 - 1) * (voix ? 9000 : 500)), i * 2);
  }
  fs.writeFileSync(path.join(d, 'son.pcm'), pcm);
  const film = path.join(d, 'Film.mkv');
  execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x36:d=180:r=5',
    '-f', 's16le', '-ar', '8000', '-ac', '1', '-i', path.join(d, 'son.pcm'), '-c:v', 'mpeg4', '-c:a', 'pcm_s16le', '-shortest', film]);
  const avancement = [];
  const energies = await synchro.analyserSon(FFMPEG, film, { dureeMs: 180000, surAvancement: (x) => avancement.push(x) });
  assert.ok(Math.abs(energies.length - 9000) < 100, `${energies.length} trames`);
  assert.ok(avancement.length > 3 && avancement.at(-1) > 0.9);
  // Sous-titre décalé de 2,5 s, recalé puis réécrit.
  const srt = vraies.map((r, i) => `${i + 1}\n${formats.depuisMs(r.debut - 2500)} --> ${formats.depuisMs(r.fin - 2500)}\nLigne ${i}\n`).join('\n');
  const doc = formats.analyser(srt, 'srt');
  const r = await synchro.trouverDecalage(energies, formats.lireMinutages(doc));
  assert.equal(r.applique, true, JSON.stringify(r));
  assert.ok(Math.abs(r.decalageMs - 2500) <= 60, `${r.decalageMs}`);
  formats.appliquerMinutages(doc, synchro.transformation(r));
  const t = formats.lireMinutages(doc);
  assert.ok(Math.abs(t[5].debut - vraies[5].debut) <= 60);
  // Vidéo sans son.
  const muet = path.join(d, 'Muet.mkv');
  execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x36:d=2', '-c:v', 'mpeg4', muet]);
  await assert.rejects(synchro.analyserSon(FFMPEG, muet), /pas de piste son/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('FFT : aller-retour exact', () => {
  const re = Float64Array.from({ length: 16 }, (_, i) => Math.sin(i) + i % 3);
  const im = new Float64Array(16);
  const avant = Float64Array.from(re);
  synchro.fft(re, im);
  synchro.fft(re, im, true);
  for (let i = 0; i < 16; i++) assert.ok(Math.abs(re[i] / 16 - avant[i]) < 1e-9);
});
