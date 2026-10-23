'use strict';
// Mémoire de traduction : une réplique déjà traduite (même moteur, même réglage, mêmes langues,
// même texte préparé) est reprise au lieu d'être renvoyée au moteur — DeepL n'est jamais repayé.
// Fichier JSONL : une ligne {k, t} par entrée, ajoutée en fin de fichier ; compactage atomique.
// Module sans Electron : testé par tests/memoire.test.js.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MAX_ENTREES = 300000;

function creerMemoire({ fichier, journal = console }) {
  let entrees = null;       // Map clé → traduction (ordre d'insertion = ancienneté)
  let lignesFichier = 0;
  let ecritureEnPanne = false;

  function cle({ moteur, variante = '', source = 'auto', cible }, segment) {
    return crypto.createHash('sha256').update(`${moteur}\u0001${variante}\u0001${source}\u0001${cible}\u0001${segment}`).digest('base64url').slice(0, 32);
  }

  // Lecture du fichier JSONL → Map (les lignes les plus récentes l'emportent). Avance de `position` à
  // la fin de la tranche (au plus `max` lignes) sans découper tout le texte d'un coup.
  function analyser(texte, etat = { map: new Map(), lignes: 0, abimees: 0, position: 0 }, max = Infinity) {
    let n = 0;
    while (etat.position < texte.length && n < max) {
      let fin = texte.indexOf('\n', etat.position);
      if (fin < 0) fin = texte.length;
      const ligne = texte.slice(etat.position, fin);
      etat.position = fin + 1;
      if (!ligne) continue;
      n += 1;
      etat.lignes += 1;
      try {
        const o = JSON.parse(ligne);
        if (typeof o.k !== 'string' || typeof o.t !== 'string') throw new Error('entrée invalide');
        etat.map.delete(o.k);
        etat.map.set(o.k, o.t);
      } catch {
        etat.abimees += 1; // compté et journalisé à l'installation
      }
    }
    return etat;
  }

  function installer(etat) {
    entrees = etat.map;
    lignesFichier = etat.lignes;
    if (etat.abimees) journal.avertissement(`[mémoire] ${etat.abimees} ligne(s) abîmée(s) ignorée(s) dans ${path.basename(fichier)}`);
    while (entrees.size > MAX_ENTREES) entrees.delete(entrees.keys().next().value);
    if (lignesFichier > entrees.size * 1.5 + 1000) compacter();
  }

  function charger() {
    if (entrees) return;
    let texte;
    try {
      texte = fs.readFileSync(fichier, 'utf8');
    } catch (e) {
      entrees = new Map();
      lignesFichier = 0;
      if (e.code !== 'ENOENT') journal.erreur('[mémoire] lecture impossible, mémoire vide pour cette session :', e.message);
      return;
    }
    installer(analyser(texte));
  }

  // Préchargement à l'ouverture de SubForge (1.7) : lecture asynchrone, analyse par tranches de
  // 5 000 lignes avec une pause entre chaque, pour ne jamais figer l'application. Si une traduction
  // a besoin de la mémoire avant la fin, charger() la lit tout de suite et le préchargement s'efface.
  let prechargement = null;
  function precharger() {
    if (entrees) return Promise.resolve(false);
    if (prechargement) return prechargement;
    prechargement = (async () => {
      let texte;
      try {
        texte = await fs.promises.readFile(fichier, 'utf8');
      } catch (e) {
        if (e.code !== 'ENOENT') journal.erreur('[mémoire] préchargement impossible :', e.message);
        return false;
      }
      const etat = { map: new Map(), lignes: 0, abimees: 0, position: 0 };
      while (etat.position < texte.length) {
        if (entrees) return false; // déjà lue par une traduction pressée
        analyser(texte, etat, 5000);
        await new Promise((ok) => setImmediate(ok));
      }
      if (entrees) return false;
      installer(etat);
      return true;
    })();
    return prechargement;
  }

  function compacter() {
    const tmp = `${fichier}.${process.pid}.tmp`;
    try {
      fs.mkdirSync(path.dirname(fichier), { recursive: true });
      fs.writeFileSync(tmp, [...entrees].map(([k, t]) => JSON.stringify({ k, t })).join('\n') + (entrees.size ? '\n' : ''), 'utf8');
      fs.renameSync(tmp, fichier);
      lignesFichier = entrees.size;
    } catch (e) {
      try { fs.rmSync(tmp, { force: true }); } catch { /* silence-ok: nettoyage, l'erreur d'origine est journalisée juste après */ }
      journal.erreur('[mémoire] compactage impossible :', e.message);
    }
  }

  // Renvoie { trouves: Map(index → traduction), manquants: [index] } pour une liste de segments.
  function chercher(contexte, segments) {
    charger();
    const trouves = new Map();
    const manquants = [];
    segments.forEach((s, i) => {
      const t = entrees.get(cle(contexte, s));
      if (t !== undefined) trouves.set(i, t); else manquants.push(i);
    });
    return { trouves, manquants };
  }

  // Ajoute des paires (segment, traduction). Une erreur d'écriture ne bloque jamais la traduction :
  // elle est journalisée et renvoyée pour être annoncée dans le bilan.
  function ajouter(contexte, paires) {
    charger();
    const lignes = [];
    for (const [segment, traduction] of paires) {
      if (typeof traduction !== 'string' || traduction.trim() === '') continue;
      const k = cle(contexte, segment);
      if (entrees.get(k) === traduction) continue;
      entrees.delete(k);
      entrees.set(k, traduction);
      lignes.push(JSON.stringify({ k, t: traduction }));
    }
    while (entrees.size > MAX_ENTREES) entrees.delete(entrees.keys().next().value);
    if (!lignes.length) return { ok: true };
    try {
      fs.mkdirSync(path.dirname(fichier), { recursive: true });
      fs.appendFileSync(fichier, lignes.join('\n') + '\n', 'utf8');
      lignesFichier += lignes.length;
      ecritureEnPanne = false;
      if (lignesFichier > entrees.size * 1.5 + 1000) compacter();
      return { ok: true };
    } catch (e) {
      if (!ecritureEnPanne) journal.erreur('[mémoire] écriture impossible (disque plein ou droits ?) :', e.message);
      ecritureEnPanne = true;
      return { ok: false, erreur: e.message };
    }
  }

  // Sans forcer la lecture complète : pendant le préchargement, le nombre de répliques n'est pas encore connu.
  function etat() {
    let taille = 0;
    try { taille = fs.statSync(fichier).size; } catch (e) {
      if (e.code !== 'ENOENT') journal.avertissement('[mémoire] taille illisible :', e.message);
    }
    return { entrees: entrees ? entrees.size : null, taille, chargement: !entrees };
  }

  function vider() {
    entrees = new Map();
    lignesFichier = 0;
    fs.rmSync(fichier, { force: true });
  }

  return { chercher, ajouter, etat, vider, cle, precharger };
}

module.exports = { creerMemoire, MAX_ENTREES };
