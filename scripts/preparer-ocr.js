#!/usr/bin/env node
'use strict';
// Copie les données de langue de l'OCR (Tesseract « best_int », compressées) dans vendor/tessdata/,
// livré avec l'app (extraResources → resources/tessdata). Source : paquets npm @tesseract.js-data/*
// (devDependencies, empreintes vérifiées par npm via package-lock.json).

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const LANGUES = ['eng', 'fra', 'spa', 'deu', 'ita', 'por', 'nld'];
const destination = path.join(RACINE, 'vendor', 'tessdata');
fs.mkdirSync(destination, { recursive: true });
let copies = 0;
for (const l of LANGUES) {
  const source = path.join(RACINE, 'node_modules', '@tesseract.js-data', l, '4.0.0_best_int', `${l}.traineddata.gz`);
  if (!fs.existsSync(source)) { console.error(`Données OCR manquantes pour ${l} : lancez npm install.`); process.exit(1); }
  const cible = path.join(destination, `${l}.traineddata.gz`);
  if (fs.existsSync(cible) && fs.statSync(cible).size === fs.statSync(source).size) continue;
  fs.copyFileSync(source, cible);
  copies += 1;
}
const total = LANGUES.reduce((n, l) => n + fs.statSync(path.join(destination, `${l}.traineddata.gz`)).size, 0);
console.log(`Données OCR : ${LANGUES.length} langues en place${copies ? ` (${copies} copiée(s))` : ''}, ${(total / 1e6).toFixed(1)} Mo.`);
