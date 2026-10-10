'use strict';
// Saison entière : parcours d'un dossier (et de ses sous-dossiers) puis choix de ce qu'il faut traduire.
//  - une vidéo qui a déjà un sous-titre texte à côté → on traduit le sous-titre, pas la vidéo ;
//  - un épisode qui a déjà un sous-titre dans la langue cible → ignoré (« déjà traduit ») ;
//  - dossiers cachés / système, liens symboliques et jonctions → jamais parcourus (pas de boucle).
// Sans Electron : testé par tests/dossiers.test.js.

const fs = require('fs');
const path = require('path');
const { depuisIso3, langue } = require('./langues');

const EXT_SOUSTITRES = new Set(['.srt', '.ass', '.ssa', '.vtt', '.sup']);
const EXT_VIDEO = new Set(['.mkv', '.mp4', '.m4v', '.avi', '.mov', '.webm', '.ts', '.m2ts', '.wmv', '.ogm']);
const DOSSIERS_SYSTEME = new Set(['$recycle.bin', 'system volume information', 'recycler', '@eadir', 'node_modules', 'sample', 'samples', 'extras', 'featurettes']);
const DRAPEAUX = new Set(['forced', 'force', 'forces', 'sdh', 'cc', 'hi']);

const triNaturel = (a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });

function parcourir(racine, { profondeurMax = 6, fichiersMax = 1000 } = {}) {
  const fichiers = [];
  const bilan = { dossiers: 0, ignoresSysteme: 0, interdits: 0, liens: 0, tronque: false };
  function visiter(dossier, profondeur) {
    if (bilan.tronque) return;
    let contenu;
    try {
      contenu = fs.readdirSync(dossier, { withFileTypes: true });
    } catch (e) {
      bilan.interdits += 1; // annoncé dans le bilan (« 1 dossier illisible »)
      return;
    }
    bilan.dossiers += 1;
    contenu.sort((a, b) => triNaturel(a.name, b.name));
    for (const d of contenu) {
      if (bilan.tronque) return;
      const chemin = path.join(dossier, d.name);
      if (d.isSymbolicLink()) { bilan.liens += 1; continue; }
      if (d.isDirectory()) {
        if (d.name.startsWith('.') || DOSSIERS_SYSTEME.has(d.name.toLowerCase())) { bilan.ignoresSysteme += 1; continue; }
        if (profondeur < profondeurMax) visiter(chemin, profondeur + 1);
        continue;
      }
      if (!d.isFile()) continue;
      const ext = path.extname(d.name).toLowerCase();
      if (!EXT_SOUSTITRES.has(ext) && !EXT_VIDEO.has(ext)) continue;
      if (fichiers.length >= fichiersMax) { bilan.tronque = true; return; }
      fichiers.push(chemin);
    }
  }
  visiter(racine, 0);
  return { fichiers, bilan };
}

// « Episode.2019.en.forced.srt » → { base: "Episode.2019", langue: "en" }
function decomposer(chemin) {
  const ext = path.extname(chemin).toLowerCase();
  const parties = path.basename(chemin, path.extname(chemin)).split('.');
  let code = null;
  while (parties.length > 1) {
    const d = parties[parties.length - 1].toLowerCase();
    if (DRAPEAUX.has(d)) { parties.pop(); continue; }
    const l = depuisIso3(d) || (/^[a-z]{2}-[a-z]{2,4}$/i.test(d) ? depuisIso3(d.slice(0, 2)) : null);
    if (l && !code) { code = l.code; parties.pop(); continue; }
    break;
  }
  return { base: path.join(path.dirname(chemin), parties.join('.')).toLowerCase(), ext, langue: code };
}

const memeLangue = (a, b) => Boolean(a && b && (a === b || a.split('-')[0] === b.split('-')[0]));

// Choisit, épisode par épisode, quoi traduire. `source` sert à préférer le bon sous-titre quand il y en a plusieurs.
function selectionner(fichiers, { cible, source = 'auto' }) {
  const groupes = new Map();
  for (const f of fichiers) {
    const d = decomposer(f);
    if (!groupes.has(d.base)) groupes.set(d.base, []);
    groupes.get(d.base).push({ chemin: f, ...d });
  }
  const garder = [];
  const bilan = { dejaTraduits: 0, videosRemplacees: 0 };
  for (const membres of groupes.values()) {
    const sousTitres = membres.filter((m) => EXT_SOUSTITRES.has(m.ext));
    const videos = membres.filter((m) => EXT_VIDEO.has(m.ext));
    if (sousTitres.some((s) => memeLangue(s.langue, cible))) { bilan.dejaTraduits += 1; continue; }
    // Un sous-titre image (.sup) ne remplace une vidéo que s'il n'y a pas de sous-titre texte.
    const textes = sousTitres.filter((s) => s.ext !== '.sup');
    const candidats = textes.length ? textes : sousTitres;
    if (candidats.length) {
      const prefere = candidats.find((s) => source !== 'auto' && memeLangue(s.langue, source))
        || candidats.find((s) => !s.langue)
        || candidats.find((s) => s.langue === 'en')
        || candidats[0];
      garder.push(prefere.chemin);
      bilan.videosRemplacees += videos.length;
      continue;
    }
    garder.push(...videos.map((v) => v.chemin));
  }
  garder.sort(triNaturel);
  return { fichiers: garder, bilan };
}

// Point d'entrée : chemins déposés (fichiers et/ou dossiers) → fichiers à analyser + bilan.
// Les fichiers déposés un par un sont toujours gardés tels quels ; seuls les dossiers sont triés.
function explorer(chemins, { cible, source, fichiersMax = 1000 }) {
  const directs = [];
  const total = { dossiers: 0, trouves: 0, dejaTraduits: 0, videosRemplacees: 0, ignoresSysteme: 0, interdits: 0, liens: 0, tronque: false, introuvables: 0 };
  const dansDossiers = [];
  for (const c of chemins) {
    let stat;
    try { stat = fs.lstatSync(c); } catch (e) { total.introuvables += 1; continue; } // annoncé dans le bilan
    if (stat.isSymbolicLink()) { total.liens += 1; continue; }
    if (stat.isDirectory()) {
      const r = parcourir(c, { fichiersMax: fichiersMax - dansDossiers.length });
      dansDossiers.push(...r.fichiers);
      for (const k of ['dossiers', 'ignoresSysteme', 'interdits', 'liens']) total[k] += r.bilan[k];
      total.tronque = total.tronque || r.bilan.tronque;
    } else if (stat.isFile()) {
      directs.push(c);
    }
  }
  total.trouves = dansDossiers.length;
  const s = selectionner(dansDossiers, { cible, source });
  total.dejaTraduits = s.bilan.dejaTraduits;
  total.videosRemplacees = s.bilan.videosRemplacees;
  const vus = new Set();
  const fichiers = [...directs, ...s.fichiers].filter((f) => (vus.has(f) ? false : vus.add(f)));
  return { fichiers, bilan: total };
}

module.exports = { parcourir, selectionner, explorer, decomposer, EXT_SOUSTITRES, EXT_VIDEO, langue };
