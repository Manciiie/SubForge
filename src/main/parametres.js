'use strict';
// Paramètres (JSON lisible) + coffre à secrets chiffré par Windows (safeStorage / DPAPI).

const fs = require('fs');
const path = require('path');
const journal = require('./journal');

const VERSION_FORMAT = 1;

const DEFAUTS = {
  versionFormat: VERSION_FORMAT,
  theme: 'sombre',          // 'sombre' | 'clair' | 'systeme'
  accent: '#2bb8a6',
  accelerationMaterielle: true,
  verifierMajAuDemarrage: true,
  versionIgnoree: null,
  fenetre: { largeur: 1200, hauteur: 780, maximisee: false },
};

let fichierParametres;
let fichierSecrets;
let safeStorage;
let valeurs = structuredClone(DEFAUTS);

// Écriture atomique : fichier temporaire puis renommage, pour ne jamais
// laisser un fichier à moitié écrit si le PC s'éteint pendant la sauvegarde.
function ecrireAtomique(fichier, contenu) {
  const tmp = `${fichier}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contenu, 'utf8');
  fs.renameSync(tmp, fichier);
}

function migrer(brut) {
  const v = { ...structuredClone(DEFAUTS), ...brut };
  // Ajouter ici les migrations : if ((brut.versionFormat ?? 0) < 2) { ... }
  v.versionFormat = VERSION_FORMAT;
  return v;
}

function initialiser(dossierDonnees, moduleSafeStorage) {
  fichierParametres = path.join(dossierDonnees, 'parametres.json');
  fichierSecrets = path.join(dossierDonnees, 'secrets.dat');
  safeStorage = moduleSafeStorage;
  try {
    valeurs = migrer(JSON.parse(fs.readFileSync(fichierParametres, 'utf8')));
  } catch (e) {
    if (e.code !== 'ENOENT') journal.avertissement('Paramètres illisibles, valeurs par défaut utilisées :', e);
    valeurs = structuredClone(DEFAUTS);
  }
  sauvegarder();
}

function sauvegarder() {
  try {
    ecrireAtomique(fichierParametres, JSON.stringify(valeurs, null, 2));
  } catch (e) {
    journal.erreur('Impossible d\'enregistrer les paramètres :', e);
  }
}

function lire() {
  return structuredClone(valeurs);
}

function modifier(partiel) {
  valeurs = { ...valeurs, ...partiel };
  sauvegarder();
  return lire();
}

// --- Secrets ----------------------------------------------------------------

function lireCoffre() {
  try {
    const chiffre = fs.readFileSync(fichierSecrets);
    return JSON.parse(safeStorage.decryptString(chiffre));
  } catch {
    return {};
  }
}

function enregistrerSecret(nom, valeur) {
  if (!safeStorage || !safeStorage.isEncryptionAvailable()) {
    throw new Error('Le chiffrement Windows n\'est pas disponible : secret non enregistré.');
  }
  const coffre = lireCoffre();
  if (valeur) coffre[nom] = valeur; else delete coffre[nom];
  const tmp = `${fichierSecrets}.tmp`;
  fs.writeFileSync(tmp, safeStorage.encryptString(JSON.stringify(coffre)));
  fs.renameSync(tmp, fichierSecrets);
  journal.declarerSecret(valeur);
}

function lireSecret(nom) {
  const v = lireCoffre()[nom];
  journal.declarerSecret(v);
  return v;
}

// L'interface ne reçoit jamais la valeur d'un secret, seulement s'il existe.
function secretExiste(nom) {
  return Boolean(lireCoffre()[nom]);
}

module.exports = { initialiser, lire, modifier, enregistrerSecret, lireSecret, secretExiste, ecrireAtomique };
