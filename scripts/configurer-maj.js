#!/usr/bin/env node
'use strict';
// Prépare src/main/maj-config.json avant chaque build : dépôt des installeurs + jeton en lecture seule.
//
// Le jeton est pris, dans l'ordre :
//   1. la variable d'environnement FORGE_MAJ_JETON (premier build, ou changement de jeton) ;
//   2. le maj-config.json déjà présent dans le projet (donc dans le dépôt GitHub).
// Il est rangé ENCODÉ (voir src/main/maj-outils.js) : le fichier est versionné avec le code pour
// qu'une mise à jour faite plus tard, dans une autre conversation, le retrouve depuis le dépôt.
// Sans jeton, le build continue mais l'application affichera « Mises à jour non configurées ».

const fs = require('fs');
const path = require('path');
const { encoderJeton, decoderJeton } = require('../src/main/maj-outils');

const RACINE = path.resolve(__dirname, '..');
const FICHIER = path.join(RACINE, 'src', 'main', 'maj-config.json');
const pkg = JSON.parse(fs.readFileSync(path.join(RACINE, 'package.json'), 'utf8'));
const publication = [].concat(pkg.build?.publish || []).find((p) => p && p.provider === 'github');

if (!publication || /__MAJ_/.test(`${publication.owner}${publication.repo}`)) {
  console.error('✗ Dépôt des installeurs non renseigné dans package.json (build.publish : owner / repo).');
  process.exit(1);
}

let ancien = {};
try { ancien = JSON.parse(fs.readFileSync(FICHIER, 'utf8')); } catch { /* silence-ok: premier build, pas encore de fichier */ }
if (ancien.jeton) {
  console.error('✗ maj-config.json contient un jeton EN CLAIR (ancien format) : relancer avec FORGE_MAJ_JETON pour le réencoder.');
  delete ancien.jeton;
}

const jeton = (process.env.FORGE_MAJ_JETON || (ancien.jetonCode ? decoderJeton(ancien.jetonCode) : '')).trim();

if (jeton && !/^(github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{30,})$/.test(jeton)) {
  console.error('✗ Le jeton ne ressemble pas à un jeton GitHub (github_pat_… ou ghp_…).');
  process.exit(1);
}
if (jeton.startsWith('ghp_')) {
  console.warn('⚠ Jeton « classique » (ghp_) : il donne accès à TOUS les dépôts du compte, code compris.');
  console.warn('  Utiliser un jeton « fine-grained » limité aux dépôts -releases, en lecture seule.');
}

const config = { proprietaire: publication.owner, depot: publication.repo, jetonCode: jeton ? encoderJeton(jeton) : null };
fs.writeFileSync(FICHIER, `${JSON.stringify(config, null, 2)}\n`);

if (jeton) {
  console.log(`✓ Mises à jour : ${publication.owner}/${publication.repo} (jeton ${jeton.slice(0, 15)}…).`);
} else {
  console.warn('⚠ AUCUN JETON : cette version ne pourra pas se mettre à jour toute seule.');
  console.warn('  Définir FORGE_MAJ_JETON puis relancer le build.');
}
