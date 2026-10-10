'use strict';
// Rapport de problème : version, système, paramètres et dernières lignes du journal,
// prêt à coller dans la conversation qui maintient le logiciel.
// Fonctions pures (pas d'electron ici) pour être testées dans tests/securite/diagnostic.test.js.

const fs = require('fs');
const path = require('path');
const { masquerSecrets } = require('./securite');

const NB_LIGNES = 200;
const TAILLE_MAX_LECTURE = 512 * 1024; // on ne lit que la fin des journaux

function finDeFichier(fichier) {
  try {
    const taille = fs.statSync(fichier).size;
    const debut = Math.max(0, taille - TAILLE_MAX_LECTURE);
    const fd = fs.openSync(fichier, 'r');
    const tampon = Buffer.alloc(taille - debut);
    fs.readSync(fd, tampon, 0, tampon.length, debut);
    fs.closeSync(fd);
    const lignes = tampon.toString('utf8').split('\n');
    if (debut > 0) lignes.shift(); // première ligne probablement coupée
    return lignes.filter((l) => l.trim());
  } catch {
    return [];
  }
}

// Dernières lignes : app.log, complété par app.1.log si le journal vient de tourner.
function dernieresLignes(dossierJournaux, n = NB_LIGNES) {
  let lignes = finDeFichier(path.join(dossierJournaux, 'app.log'));
  if (lignes.length < n) lignes = [...finDeFichier(path.join(dossierJournaux, 'app.1.log')), ...lignes];
  return lignes.slice(-n);
}

// Remplace le dossier personnel par %USERPROFILE% pour ne pas exposer le nom de session.
function anonymiserChemins(texte, dossierPerso) {
  if (!dossierPerso) return texte;
  const variantes = [dossierPerso, dossierPerso.replace(/\\/g, '/'), dossierPerso.replace(/\\/g, '\\\\')];
  return variantes.reduce((t, v) => t.split(v).join('%USERPROFILE%'), texte);
}

function construireRapport({ nom, version, squelette, systeme, parametres, lignes, dossierPerso, secrets = [] }) {
  const texte = [
    `=== Rapport de problème — ${nom} ${version} ===`,
    `Date : ${new Date().toISOString()}`,
    `Squelette forge-app : ${squelette ?? 'inconnu'}`,
    `Système : ${systeme}`,
    '',
    'Ce que je faisais / ce qui s\'est passé : (à compléter)',
    '',
    '--- Paramètres ---',
    JSON.stringify(parametres ?? {}, null, 2),
    '',
    `--- Journal (${lignes.length} dernières lignes) ---`,
    ...lignes,
    '=== Fin du rapport ===',
  ].join('\n');
  return anonymiserChemins(masquerSecrets(texte, secrets), dossierPerso);
}

module.exports = { construireRapport, dernieresLignes, anonymiserChemins, NB_LIGNES };
