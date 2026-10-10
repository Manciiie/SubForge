#!/usr/bin/env node
'use strict';
// Place ffmpeg dans vendor/<plateforme>/ avant de compiler ou de lancer en développement (D-004).
// Source : paquets npm @ffmpeg-installer/* (registre npm), empreinte SHA-512 vérifiée contre la
// valeur figée ci-dessous : un paquet modifié est refusé.
//
//   node scripts/preparer-ffmpeg.js            -> win + plateforme courante
//   node scripts/preparer-ffmpeg.js win linux  -> plateformes choisies

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const PAQUETS = {
  win: { spec: '@ffmpeg-installer/win32-x64@4.1.0', fichier: 'ffmpeg.exe',
    integrite: 'sha512-Drt5u2vzDnIONf4ZEkKtFlbvwj6rI3kxw1Ck9fpudmtgaZIHD4ucsWB2lCZBXRxJgXR+2IMSti+4rtM4C4rXgg==' },
  linux: { spec: '@ffmpeg-installer/linux-x64@4.1.0', fichier: 'ffmpeg',
    integrite: 'sha512-Y5BWhGLU/WpQjOArNIgXD3z5mxxdV8c41C+U15nsE5yF8tVcdCGet5zPs5Zy3Ta6bU7haGpIzryutqCGQA/W8A==' },
};

const demandes = process.argv.slice(2).length ? process.argv.slice(2) : [...new Set(['win', process.platform === 'win32' ? 'win' : 'linux'])];

for (const plateforme of demandes) {
  const p = PAQUETS[plateforme];
  if (!p) { console.error(`Plateforme inconnue : ${plateforme}`); process.exit(1); }
  const destination = path.join(RACINE, 'vendor', plateforme, p.fichier);
  const marqueur = `${destination}.integrite`;
  if (fs.existsSync(destination) && fs.existsSync(marqueur) && fs.readFileSync(marqueur, 'utf8') === p.integrite) {
    console.log(`ffmpeg ${plateforme} : déjà en place.`);
    continue;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-ffmpeg-'));
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['pack', p.spec, '--pack-destination', tmp, '--silent'], { stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' });
    const archive = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'));
    const contenu = fs.readFileSync(path.join(tmp, archive));
    const integrite = `sha512-${crypto.createHash('sha512').update(contenu).digest('base64')}`;
    if (integrite !== p.integrite) throw new Error(`Empreinte inattendue pour ${p.spec} : paquet refusé.`);
    execFileSync('tar', ['-xzf', path.join(tmp, archive), '-C', tmp]);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(tmp, 'package', p.fichier), destination);
    fs.chmodSync(destination, 0o755);
    fs.writeFileSync(marqueur, p.integrite);
    console.log(`ffmpeg ${plateforme} : installé (${(fs.statSync(destination).size / 1e6).toFixed(1)} Mo, empreinte vérifiée).`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
