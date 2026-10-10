'use strict';
// Pistes vidéo avec le vrai ffmpeg livré (vendor/) : un MKV fabriqué pour l'occasion, avec un nom piégé.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const video = require('../src/main/services/video');

const FFMPEG = video.cheminFfmpeg({ empaquete: false, racineApp: path.join(__dirname, '..') });
const disponible = fs.existsSync(FFMPEG) && process.platform !== 'win32';

test('analyse de la sortie de ffmpeg : langues, codecs, forcés, image non traduisible', () => {
  const texte = `Input #0, matroska,webm, from 'x.mkv':
    Stream #0:0: Video: h264
    Stream #0:2(eng): Subtitle: subrip (default) (forced)
    Metadata:
      title           : Forced
    Stream #0:3(fre): Subtitle: ass
    Metadata:
      title           : Français complet
    Stream #0:4(eng): Subtitle: hdmv_pgs_subtitle, 1920x1080
    Stream #0:5[0x1200](und): Subtitle: mov_text (tx3g / 0x67337874), 0 kb/s (hearing impaired)`;
  const p = video.analyserFlux(texte);
  assert.equal(p.length, 4);
  assert.deepEqual(p.map((x) => x.indice), [0, 1, 2, 3]);
  assert.equal(p[0].langue, 'en');
  assert.ok(p[0].forces && p[0].parDefaut);
  assert.equal(p[1].nomLangue, 'Français');
  assert.equal(p[1].titre, 'Français complet');
  assert.equal(p[1].format, 'ass');
  assert.equal(p[2].format, null);
  assert.match(p[2].description, /PGS/);
  assert.equal(p[3].format, 'srt');
  assert.equal(p[3].nomLangue, 'Langue inconnue');
  assert.ok(p[3].malentendants);
});

test('vrai MKV au nom piégé : pistes listées, extraction SRT et ASS, aucune commande injectée', { skip: !disponible && 'ffmpeg absent (node scripts/preparer-ffmpeg.js)' }, async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-video-'));
  const temoin = path.join(d, 'PIRATE');
  const temoinCourant = path.join(process.cwd(), 'PIRATE');
  const srt = path.join(d, 'a.srt');
  fs.writeFileSync(srt, '1\n00:00:00,500 --> 00:00:01,500\nHello world\n\n2\n00:00:02,000 --> 00:00:03,000\n<i>Bye</i>\n');
  const ass = path.join(d, 'a.ass');
  const mkv = path.join(d, 'film "; touch PIRATE; echo " & del x | $(id) `id`.mkv');
  await video.executer(FFMPEG, ['-loglevel', 'error', '-y', '-i', srt, ass]);
  const r = await video.executer(FFMPEG, [
    '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x48:d=3', '-i', srt, '-i', ass,
    '-map', '0:v', '-map', '1', '-map', '2', '-c:v', 'mpeg4', '-c:s:0', 'srt', '-c:s:1', 'ass',
    '-metadata:s:s:0', 'language=eng', '-metadata:s:s:1', 'language=spa', '-metadata:s:s:1', 'title=Complet', mkv,
  ]);
  assert.equal(r.code, 0, r.erreurs);

  const pistes = await video.listerPistes(FFMPEG, mkv);
  assert.equal(pistes.length, 2);
  assert.equal(pistes[0].langue, 'en');
  assert.equal(pistes[1].langue, 'es');
  assert.equal(pistes[1].titre, 'Complet');

  const e1 = await video.extrairePiste(FFMPEG, mkv, pistes[0]);
  assert.match(fs.readFileSync(e1.fichier, 'utf8'), /Hello world/);
  e1.nettoyer();
  assert.equal(fs.existsSync(e1.fichier), false);
  const e2 = await video.extrairePiste(FFMPEG, mkv, pistes[1]);
  assert.match(fs.readFileSync(e2.fichier, 'utf8'), /\[Events\][\s\S]*Hello world/);
  e2.nettoyer();

  assert.equal(fs.existsSync(temoin) || fs.existsSync(temoinCourant), false, 'le nom de fichier a été interprété comme une commande');
  await assert.rejects(video.extrairePiste(FFMPEG, mkv, { ...pistes[0], format: null }), /image/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('annulation : ffmpeg est tué et le dossier temporaire supprimé', { skip: !disponible && 'ffmpeg absent' }, async () => {
  const c = new AbortController();
  const p = video.executer(FFMPEG, ['-f', 'lavfi', '-i', 'anullsrc', '-f', 'null', '-'], { signal: c.signal });
  setTimeout(() => c.abort(), 300);
  await assert.rejects(p, /annulée/);
});

test('binaire absent ou relatif refusé', async () => {
  await assert.rejects(video.executer('ffmpeg', ['-version']), /introuvable/);
  await assert.rejects(video.executer(path.join(os.tmpdir(), 'nexistepas', 'ffmpeg'), ['-version']), /introuvable/);
});
