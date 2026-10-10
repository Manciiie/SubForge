'use strict';
// Glossaire : noms propres à ne jamais traduire et termes à traduire toujours pareil.
// Chaque terme trouvé devient un marqueur <g n="k"/> que les moteurs laissent en place ;
// il est remplacé après traduction par la valeur choisie. Fonctionne donc avec DeepL comme avec l'IA locale.
// Module sans Electron : testé par tests/glossaire.test.js.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VERSION_FORMAT = 1;
const MAX_ENTREES = 5000;
const RE_MARQUEUR_G = /<g\s+n="(\d+)"\s*\/>/g;
const RE_MARQUEUR_X = /<x\s+n="\d+"\s*\/>/g;

class ErreurGlossaire extends Error {
  constructor(m) { super(m); this.name = 'ErreurGlossaire'; }
}

function echapperRegex(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function nettoyerEntree(e) {
  const terme = String(e.terme ?? '').replace(/\s+/g, ' ').trim();
  const traduction = String(e.traduction ?? '').replace(/\s+/g, ' ').trim();
  if (!terme) throw new ErreurGlossaire('Le terme est vide.');
  if (terme.length > 120 || traduction.length > 120) throw new ErreurGlossaire('Terme trop long (120 caractères au plus).');
  if (/[<>{}]/.test(terme + traduction)) throw new ErreurGlossaire('Les caractères < > { } ne sont pas autorisés dans le glossaire.');
  return {
    id: typeof e.id === 'string' && /^[a-z0-9]{8,32}$/.test(e.id) ? e.id : crypto.randomBytes(8).toString('hex'),
    terme,
    traduction,
    cible: typeof e.cible === 'string' && e.cible ? e.cible : '*',
    casse: Boolean(e.casse),
  };
}

function creerGlossaire({ fichier, journal = console }) {
  let entrees = null;

  function charger() {
    if (entrees) return entrees;
    entrees = [];
    let brut;
    try {
      brut = fs.readFileSync(fichier, 'utf8');
    } catch (e) {
      if (e.code !== 'ENOENT') journal.erreur('[glossaire] lecture impossible :', e.message);
      return entrees;
    }
    try {
      const o = JSON.parse(brut);
      if (!Array.isArray(o.entrees)) throw new Error('format inconnu');
      for (const e of o.entrees.slice(0, MAX_ENTREES)) {
        try { entrees.push(nettoyerEntree(e)); } catch (err) { journal.avertissement('[glossaire] entrée ignorée :', err.message); }
      }
    } catch (e) {
      // Fichier abîmé : on le met de côté au lieu de l'écraser, et on le dit.
      const sauvegarde = `${fichier}.corrompu-${Date.now()}`;
      try { fs.renameSync(fichier, sauvegarde); } catch (err) { journal.erreur('[glossaire] sauvegarde du fichier abîmé impossible :', err.message); }
      journal.erreur(`[glossaire] fichier illisible (${e.message}), mis de côté sous ${path.basename(sauvegarde)}`);
      entrees.erreurChargement = `Le glossaire était abîmé : il a été mis de côté (${path.basename(sauvegarde)}) et un glossaire vide a été créé.`;
    }
    return entrees;
  }

  function sauvegarder() {
    const tmp = `${fichier}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(fichier), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify({ versionFormat: VERSION_FORMAT, entrees: entrees.map(({ id, terme, traduction, cible, casse }) => ({ id, terme, traduction, cible, casse })) }, null, 2), 'utf8');
    fs.renameSync(tmp, fichier);
  }

  function lister() {
    const l = charger();
    return { entrees: l.map((e) => ({ ...e })), avertissement: l.erreurChargement || null };
  }

  function enregistrer(entree) {
    const l = charger();
    const e = nettoyerEntree(entree);
    const doublon = l.find((x) => x.id !== e.id && x.terme.toLowerCase() === e.terme.toLowerCase() && x.cible === e.cible);
    if (doublon) throw new ErreurGlossaire(`« ${e.terme} » est déjà dans le glossaire.`);
    const i = l.findIndex((x) => x.id === e.id);
    if (i >= 0) l[i] = e;
    else {
      if (l.length >= MAX_ENTREES) throw new ErreurGlossaire(`Glossaire plein (${MAX_ENTREES} termes au plus).`);
      l.push(e);
    }
    sauvegarder();
    return e;
  }

  function supprimer(id) {
    const l = charger();
    const i = l.findIndex((x) => x.id === id);
    if (i < 0) throw new ErreurGlossaire('Terme introuvable (déjà supprimé ?).');
    l.splice(i, 1);
    sauvegarder();
    return true;
  }

  // Import d'un .csv / .txt : « terme;traduction[;langue] » (ou tabulation / virgule), une ligne par terme.
  function importer(texte, codesLangues) {
    const l = charger();
    let ajoutes = 0;
    const ignores = [];
    const lignes = texte.replace(/^﻿/, '').split(/\r?\n/);
    lignes.forEach((ligne, n) => {
      if (!ligne.trim() || ligne.trim().startsWith('#')) return;
      const sep = ligne.includes(';') ? ';' : ligne.includes('\t') ? '\t' : ',';
      const [terme, traduction = '', langue = ''] = ligne.split(sep).map((x) => x.trim().replace(/^"(.*)"$/, '$1'));
      if (n === 0 && /^(terme|term|source)$/i.test(terme)) return; // ligne d'en-tête
      const cible = langue && codesLangues.includes(langue) ? langue : '*';
      try {
        const e = nettoyerEntree({ terme, traduction, cible });
        if (l.some((x) => x.terme.toLowerCase() === e.terme.toLowerCase() && x.cible === e.cible)) { ignores.push(`ligne ${n + 1} : « ${e.terme} » déjà présent`); return; }
        if (l.length >= MAX_ENTREES) { ignores.push(`ligne ${n + 1} : glossaire plein`); return; }
        l.push(e);
        ajoutes += 1;
      } catch (err) {
        ignores.push(`ligne ${n + 1} : ${err.message}`);
      }
    });
    if (ajoutes) sauvegarder();
    return { ajoutes, ignores: ignores.length, details: ignores.slice(0, 20) };
  }

  // Prépare la recherche pour une langue cible : regex unique, termes les plus longs d'abord.
  function pour(cible) {
    const actives = charger().filter((e) => e.cible === '*' || e.cible === cible);
    if (!actives.length) return null;
    actives.sort((a, b) => b.terme.length - a.terme.length);
    // Mot entier : pas de lettre ni de chiffre juste avant ou après (lettres accentuées comprises).
    const motifs = actives.map((e) => `(${echapperRegex(e.terme).replace(/ /g, '\\s+')})`);
    const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${motifs.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
    return { re, actives };
  }

  return { lister, enregistrer, supprimer, importer, pour, MAX_ENTREES };
}

// Remplace les termes du glossaire d'un segment par des marqueurs <g n="k"/> (hors marqueurs <x/>).
// Renvoie { texte, valeurs } ; valeurs[k] = ce qui remplacera le marqueur k après traduction.
function appliquer(segment, prepare) {
  if (!prepare) return { texte: segment, valeurs: [] };
  const valeurs = [];
  const morceaux = segment.split(/(<x\s+n="\d+"\s*\/>)/);
  const texte = morceaux.map((m) => {
    if (RE_MARQUEUR_X.test(m)) { RE_MARQUEUR_X.lastIndex = 0; return m; }
    return m.replace(prepare.re, (...args) => {
      const trouve = args[0];
      const groupes = args.slice(1, 1 + prepare.actives.length);
      const i = groupes.findIndex((g) => g !== undefined);
      const e = prepare.actives[i];
      if (!e) return trouve;
      if (e.casse && trouve !== e.terme) return trouve;
      valeurs.push(e.traduction || trouve);
      return `<g n="${valeurs.length - 1}"/>`;
    });
  }).join('');
  return { texte, valeurs };
}

// Remet les valeurs du glossaire à la place des marqueurs. Renvoie aussi le nombre de termes perdus
// par le moteur, pour que la réplique soit signalée « à vérifier » au lieu de perdre un nom en silence.
function restituer(traduction, valeurs) {
  if (!valeurs.length) return { texte: traduction, perdus: 0 };
  const vus = new Set();
  const texte = traduction.replace(RE_MARQUEUR_G, (_m, k) => {
    const i = Number(k);
    if (valeurs[i] === undefined) return '';
    vus.add(i);
    return valeurs[i];
  }).replace(/<\/?g\b[^>]*>/g, '');
  return { texte, perdus: valeurs.length - vus.size };
}

module.exports = { creerGlossaire, appliquer, restituer, ErreurGlossaire, nettoyerEntree };
