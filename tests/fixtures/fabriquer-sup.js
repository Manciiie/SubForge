#!/usr/bin/env node
'use strict';
// Fabrique tests/fixtures/blu-ray.en.sup (sous-titres Blu-ray de test, en image) : texte rendu par
// l'ffmpeg du système (filtre drawtext, police DejaVu), puis encodé en PGS. À relancer seulement
// pour changer les répliques ; le fichier produit est versionné.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { encoderSup } = require('../outils/pgs-encodeur');

const REPLIQUES = [
  { debut: 1000, fin: 3500, lignes: ['Where are you going tonight?'] },
  { debut: 4000, fin: 7000, lignes: ["I told you, I'm meeting", 'the others at the harbour.'] },
  { debut: 7500, fin: 9500, lignes: ['- Are you coming with us?', '- Not tonight.'] },
  { debut: 10000, fin: 12000, lignes: ['Winter is coming, my friend.'] },
];
const POLICE = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-sup-'));

function rendreLigne(texte) {
  const f = path.join(tmp, 'ligne.txt');
  fs.writeFileSync(f, texte);
  const largeur = 1100;
  const hauteur = 70;
  const brut = execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=black@0.0:s=${largeur}x${hauteur},format=rgba`,
    '-vf', `drawtext=fontfile=${POLICE}:textfile=${f}:fontcolor=white:fontsize=48:borderw=4:bordercolor=black:x=(w-tw)/2:y=(h-th)/2`,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 64 * 1024 * 1024 });
  return { rgba: brut, largeur, hauteur };
}

const repliques = REPLIQUES.map((r) => {
  const lignes = r.lignes.map(rendreLigne);
  const largeur = lignes[0].largeur;
  const hauteur = lignes.reduce((n, l) => n + l.hauteur, 0);
  return { debut: r.debut, fin: r.fin, largeur, hauteur, rgba: Buffer.concat(lignes.map((l) => l.rgba)) };
});
const sortie = path.join(__dirname, 'blu-ray.en.sup');
fs.writeFileSync(sortie, encoderSup(repliques));
fs.writeFileSync(path.join(__dirname, 'blu-ray.en.attendu.json'), JSON.stringify(REPLIQUES, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${sortie} : ${fs.statSync(sortie).size} octets, ${REPLIQUES.length} répliques`);
