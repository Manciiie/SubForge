'use strict';
// Journal fichier avec rotation et masquage des secrets.

const fs = require('fs');
const path = require('path');
const { masquerSecrets } = require('./securite');

const TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo par fichier
const NB_ARCHIVES = 3;

let dossier = null;
const secretsConnus = new Set();

function initialiser(dossierJournaux) {
  dossier = dossierJournaux;
  fs.mkdirSync(dossier, { recursive: true });
}

// Déclarer chaque secret chargé (clé API, mot de passe) pour qu'il soit masqué.
function declarerSecret(valeur) {
  if (valeur) secretsConnus.add(String(valeur));
}

function fichierCourant() {
  return path.join(dossier, 'app.log');
}

function rotation() {
  const f = fichierCourant();
  try {
    if (fs.statSync(f).size < TAILLE_MAX) return;
  } catch {
    return;
  }
  for (let i = NB_ARCHIVES - 1; i >= 1; i--) {
    const src = path.join(dossier, `app.${i}.log`);
    if (fs.existsSync(src)) fs.renameSync(src, path.join(dossier, `app.${i + 1}.log`));
  }
  fs.renameSync(f, path.join(dossier, 'app.1.log'));
}

function ecrire(niveau, ...morceaux) {
  const texte = morceaux
    .map((m) => (m instanceof Error ? `${m.message}\n${m.stack}` : typeof m === 'string' ? m : JSON.stringify(m)))
    .join(' ');
  const ligne = `${new Date().toISOString()} [${niveau}] ${masquerSecrets(texte, [...secretsConnus])}\n`;
  if (niveau === 'ERREUR') process.stderr.write(ligne); else process.stdout.write(ligne);
  if (!dossier) return;
  try {
    rotation();
    fs.appendFileSync(fichierCourant(), ligne, 'utf8');
  } catch {
    // silence-ok: un journal qui échoue ne doit jamais faire tomber l'application.
  }
}

module.exports = {
  initialiser,
  declarerSecret,
  dossier: () => dossier,
  secretsConnus: () => [...secretsConnus],
  info: (...m) => ecrire('INFO', ...m),
  avertissement: (...m) => ecrire('AVERT', ...m),
  erreur: (...m) => ecrire('ERREUR', ...m),
};
