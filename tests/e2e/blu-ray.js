'use strict';
// Sous-titres Blu-ray (image) dans l'interface réelle, OCR réel (Tesseract) + faux Ollama :
//   1. MKV avec une piste PGS anglaise → piste « lue par OCR » choisie, Film.en.srt (OCR) puis Film.fr.srt.
//   2. Fichier .sup déposé seul → même traitement.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, ffmpeg, utiliserFauxOllama, RACINE } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'auto');
  await p.choisir('#opt-cible', 'fr');

  const d = path.join(p.dossierTemp, 'Blu-ray');
  fs.mkdirSync(d);
  const sup = path.join(RACINE, 'tests', 'fixtures', 'blu-ray.en.sup');
  const mkv = path.join(d, 'Le Grand Film (2024).mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-copyts', '-f', 'lavfi', '-i', 'color=c=black:s=320x180:d=13', '-i', sup,
    '-map', '0:v', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'copy', '-metadata:s:s:0', 'language=eng', mkv]);

  await p.eval(`window.__subforgeAjouter(${JSON.stringify([mkv])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 15000);
  const piste = await p.eval('document.querySelector(".select-piste").selectedOptions[0].textContent');
  p.verifier(/PGS/.test(piste) && /lue par OCR/.test(piste), `piste Blu-ray proposée : « ${piste} »`);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="ocr"], .carte-fichier[data-etat="traduction"], .carte-fichier[data-etat="termine"]', 20000);
  await p.capture('e2e-blu-ray-ocr');
  await p.attendre('.carte-fichier[data-etat="termine"]', 120000);
  const ocr = fs.readFileSync(path.join(d, 'Le Grand Film (2024).en.srt'), 'utf8');
  p.verifier(/00:00:04,000 --> 00:00:07,000/.test(ocr) && /meeting/i.test(ocr) && /harbour/i.test(ocr), 'texte lu par OCR enregistré : Film.en.srt (minutages exacts)');
  const fr = fs.readFileSync(path.join(d, 'Le Grand Film (2024).fr.srt'), 'utf8');
  p.verifier(/\[fr\] Where are you going tonight\?/.test(fr), 'traduction faite à partir du texte lu : Film.fr.srt');
  p.verifier(/OCR : 4 images lues sur 4/.test(await p.texte('.carte-fichier')), 'bilan OCR affiché sur la carte');
  await p.capture('e2e-blu-ray-termine');

  // .sup déposé seul.
  const supSeul = path.join(d, 'Autre.en.sup');
  fs.copyFileSync(sup, supSeul);
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([supSeul])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 15000);
  p.verifier(/Blu-ray \(image\) · 4 images/.test(await p.texte('.carte-fichier')), '.sup reconnu : « Sous-titres Blu-ray (image) · 4 images »');
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 120000);
  p.verifier(fs.existsSync(path.join(d, 'Autre.en.srt')) && fs.existsSync(path.join(d, 'Autre.fr.srt')), '.sup : texte lu puis traduit');

  serveur.close();
};
