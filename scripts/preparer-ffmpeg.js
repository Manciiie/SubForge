#!/usr/bin/env node
'use strict';
// Place ffmpeg dans vendor/<plateforme>/ avant de compiler ou de lancer en développement (D-004, D-007).
// Source : ffmpeg 7.1 (Windows) / 7.0.2 (Linux, développement) embarqués dans les « wheels » PyPI du projet
// imageio-ffmpeg 0.6.0. Empreinte SHA-256 du fichier téléchargé figée ci-dessous : un fichier modifié est refusé.
// (Les versions récentes ne sont pas publiées sur npm, et GitHub n'est pas joignable depuis l'environnement de build.)
//
//   node scripts/preparer-ffmpeg.js            -> win + plateforme courante
//   node scripts/preparer-ffmpeg.js win linux  -> plateformes choisies

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const RACINE = path.resolve(__dirname, '..');
const BASE = 'https://files.pythonhosted.org/packages';
const PAQUETS = {
  win: {
    url: `${BASE}/2c/c6/fa760e12a2483469e2bf5058c5faff664acf66cadb4df2ad6205b016a73d/imageio_ffmpeg-0.6.0-py3-none-win_amd64.whl`,
    sha256: '02fa47c83703c37df6bfe4896aab339013f62bf02c5ebf2dce6da56af04ffc0a',
    entree: 'imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe',
    fichier: 'ffmpeg.exe',
  },
  linux: {
    url: `${BASE}/a0/2d/43c8522a2038e9d0e7dbdf3a61195ecc31ca576fb1527a528c877e87d973/imageio_ffmpeg-0.6.0-py3-none-manylinux2014_x86_64.whl`,
    sha256: 'c7e46fcec401dd990405049d2e2f475e2b397779df2519b544b8aab515195282',
    entree: 'imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2',
    fichier: 'ffmpeg',
  },
};

// Lecture d'une entrée d'un zip (wheel) sans dépendance : répertoire central puis inflate.
function extraireDuZip(zip, nomEntree) {
  let fin = zip.length - 22;
  while (fin >= 0 && zip.readUInt32LE(fin) !== 0x06054b50) fin -= 1;
  if (fin < 0) throw new Error('Archive zip invalide.');
  const nb = zip.readUInt16LE(fin + 10);
  let p = zip.readUInt32LE(fin + 16);
  for (let i = 0; i < nb; i++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('Répertoire du zip invalide.');
    const methode = zip.readUInt16LE(p + 10);
    const taille = zip.readUInt32LE(p + 20);
    const lNom = zip.readUInt16LE(p + 28);
    const lExtra = zip.readUInt16LE(p + 30);
    const lCom = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nom = zip.toString('utf8', p + 46, p + 46 + lNom);
    if (nom === nomEntree) {
      const debut = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const donnees = zip.subarray(debut, debut + taille);
      if (methode === 0) return Buffer.from(donnees);
      if (methode === 8) return zlib.inflateRawSync(donnees);
      throw new Error(`Méthode de compression ${methode} non prise en charge.`);
    }
    p += 46 + lNom + lExtra + lCom;
  }
  throw new Error(`${nomEntree} absent de l'archive.`);
}

const demandes = process.argv.slice(2).length ? process.argv.slice(2) : [...new Set(['win', process.platform === 'win32' ? 'win' : 'linux'])];

for (const plateforme of demandes) {
  const p = PAQUETS[plateforme];
  if (!p) { console.error(`Plateforme inconnue : ${plateforme}`); process.exit(1); }
  const destination = path.join(RACINE, 'vendor', plateforme, p.fichier);
  const marqueur = `${destination}.integrite`;
  if (fs.existsSync(destination) && fs.existsSync(marqueur) && fs.readFileSync(marqueur, 'utf8') === p.sha256) {
    console.log(`ffmpeg ${plateforme} : déjà en place.`);
    continue;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-ffmpeg-'));
  try {
    const archive = path.join(tmp, 'ffmpeg.whl');
    // curl est présent sur Windows 10+ et Linux, et respecte le proxy de l'environnement.
    execFileSync('curl', ['-sSfL', '--retry', '3', '-o', archive, p.url], { stdio: ['ignore', 'inherit', 'inherit'] });
    const contenu = fs.readFileSync(archive);
    const empreinte = crypto.createHash('sha256').update(contenu).digest('hex');
    if (empreinte !== p.sha256) throw new Error(`Empreinte inattendue pour ${path.basename(p.url)} : fichier refusé.`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, extraireDuZip(contenu, p.entree));
    fs.chmodSync(destination, 0o755);
    fs.writeFileSync(marqueur, p.sha256);
    console.log(`ffmpeg ${plateforme} : installé (${(fs.statSync(destination).size / 1e6).toFixed(1)} Mo, empreinte vérifiée).`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
