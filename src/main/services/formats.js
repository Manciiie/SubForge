'use strict';
// Lecture / écriture des sous-titres SRT, ASS/SSA et WebVTT, sans dépendance.
// Seul le texte des répliques change : minutages, numéros, styles et en-têtes sont recopiés tels quels.
// Module pur (pas d'Electron) : testé par tests/formats.test.js.

const fs = require('fs');
const path = require('path');

const TAILLE_MAX = 20 * 1024 * 1024; // un sous-titre de 20 Mo, c'est déjà ~200 000 répliques
const EXTENSIONS = { '.srt': 'srt', '.ass': 'ass', '.ssa': 'ass', '.vtt': 'vtt' };

class ErreurFormat extends Error {
  constructor(message) { super(message); this.name = 'ErreurFormat'; }
}

// --- Encodage ----------------------------------------------------------------

function decoder(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return { texte: buffer.subarray(3).toString('utf8'), encodage: 'UTF-8 (BOM)' };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { texte: new TextDecoder('utf-16le').decode(buffer.subarray(2)), encodage: 'UTF-16 LE' };
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return { texte: new TextDecoder('utf-16be').decode(buffer.subarray(2)), encodage: 'UTF-16 BE' };
  }
  try {
    return { texte: new TextDecoder('utf-8', { fatal: true }).decode(buffer), encodage: 'UTF-8' };
  } catch {
    // Vieux sous-titres européens : presque toujours Windows-1252 (Latin-1 étendu).
    return { texte: new TextDecoder('windows-1252').decode(buffer), encodage: 'Windows-1252' };
  }
}

function formatDepuisChemin(chemin) {
  return EXTENSIONS[path.extname(chemin).toLowerCase()] || null;
}

function lireFichier(chemin) {
  const format = formatDepuisChemin(chemin);
  if (!format) throw new ErreurFormat('Format de sous-titres non pris en charge (SRT, ASS, SSA ou VTT).');
  const stat = fs.statSync(chemin);
  if (!stat.isFile()) throw new ErreurFormat('Ce n\'est pas un fichier.');
  if (stat.size > TAILLE_MAX) throw new ErreurFormat('Fichier de sous-titres trop gros (plus de 20 Mo).');
  const { texte, encodage } = decoder(fs.readFileSync(chemin));
  const doc = analyser(texte, format);
  doc.encodage = encodage;
  return doc;
}

function analyser(texte, format) {
  const eol = /\r\n/.test(texte) ? '\r\n' : '\n';
  const t = texte.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  let doc;
  if (format === 'srt') doc = analyserSrt(t);
  else if (format === 'vtt') doc = analyserVtt(t);
  else if (format === 'ass') doc = analyserAss(t);
  else throw new ErreurFormat('Format inconnu.');
  doc.eol = eol;
  if (doc.repliques.length === 0) throw new ErreurFormat('Aucune réplique trouvée dans ce fichier (vide ou mal formé).');
  return doc;
}

// --- SRT -----------------------------------------------------------------------

const RE_TEMPS_SRT = /^\s*(\d{1,3}:\d{1,2}:\d{1,2}[,.]\d{1,3})\s*-->\s*(\d{1,3}:\d{1,2}:\d{1,2}[,.]\d{1,3})(.*)$/;

function analyserSrt(t) {
  const lignes = t.split('\n');
  const repliques = [];
  let i = 0;
  while (i < lignes.length) {
    // Une réplique : (numéro) puis ligne de minutage puis texte jusqu'à une ligne vide.
    let indice = null;
    if (/^\s*\d+\s*$/.test(lignes[i]) && RE_TEMPS_SRT.test(lignes[i + 1] || '')) {
      indice = lignes[i].trim();
      i += 1;
    }
    const m = RE_TEMPS_SRT.exec(lignes[i] || '');
    if (!m) { i += 1; continue; }
    const minutage = lignes[i].trim();
    i += 1;
    const texte = [];
    while (i < lignes.length && lignes[i].trim() !== '') {
      // Fichier mal formé sans ligne vide entre deux répliques : on s'arrête au numéro suivant.
      if (/^\s*\d+\s*$/.test(lignes[i]) && RE_TEMPS_SRT.test(lignes[i + 1] || '')) break;
      texte.push(lignes[i]);
      i += 1;
    }
    repliques.push({ indice, minutage, debut: m[1], texte: texte.join('\n') });
  }
  return { format: 'srt', repliques };
}

function ecrireSrt(doc) {
  return doc.repliques.map((r, n) => `${r.indice ?? n + 1}\n${r.minutage}\n${r.texte}\n`).join('\n');
}

// --- WebVTT -------------------------------------------------------------------

const RE_TEMPS_VTT = /^\s*((?:\d{1,3}:)?\d{1,2}:\d{1,2}\.\d{1,3})\s*-->\s*((?:\d{1,3}:)?\d{1,2}:\d{1,2}\.\d{1,3})(.*)$/;

function analyserVtt(t) {
  const blocs = t.split(/\n{2,}/);
  if (!/^WEBVTT/.test(blocs[0] || '')) throw new ErreurFormat('Fichier VTT invalide : l\'en-tête WEBVTT manque.');
  const elements = [{ type: 'brut', texte: blocs[0] }];
  const repliques = [];
  for (const bloc of blocs.slice(1)) {
    if (bloc.trim() === '') continue;
    const lignes = bloc.split('\n');
    let k = 0;
    let identifiant = null;
    if (!RE_TEMPS_VTT.test(lignes[0]) && RE_TEMPS_VTT.test(lignes[1] || '')) { identifiant = lignes[0]; k = 1; }
    const m = RE_TEMPS_VTT.exec(lignes[k] || '');
    if (!m || /^(NOTE|STYLE|REGION)\b/.test(lignes[0])) { elements.push({ type: 'brut', texte: bloc }); continue; }
    const r = { identifiant, minutage: lignes[k], debut: m[1], texte: lignes.slice(k + 1).join('\n') };
    repliques.push(r);
    elements.push({ type: 'replique', r });
  }
  return { format: 'vtt', elements, repliques };
}

function ecrireVtt(doc) {
  return doc.elements.map((e) => {
    if (e.type === 'brut') return e.texte;
    const r = e.r;
    return [r.identifiant, r.minutage, r.texte].filter((x) => x !== null && x !== undefined).join('\n');
  }).join('\n\n') + '\n';
}

// --- ASS / SSA ----------------------------------------------------------------

function analyserAss(t) {
  const lignes = t.split('\n');
  const repliques = [];
  let section = '';
  let colonnes = null;
  lignes.forEach((ligne, n) => {
    const s = /^\s*\[([^\]]+)\]\s*$/.exec(ligne);
    if (s) { section = s[1].toLowerCase(); return; }
    if (section !== 'events') return;
    const f = /^\s*Format\s*:(.*)$/i.exec(ligne);
    if (f) { colonnes = f[1].split(',').map((c) => c.trim().toLowerCase()); return; }
    const d = /^(\s*Dialogue\s*:\s*)(.*)$/i.exec(ligne);
    if (!d) return;
    const nbColonnes = colonnes ? colonnes.length : 10;
    const champs = [];
    let reste = d[2];
    for (let c = 0; c < nbColonnes - 1; c++) {
      const v = reste.indexOf(',');
      if (v < 0) return; // ligne Dialogue tronquée : laissée telle quelle
      champs.push(reste.slice(0, v));
      reste = reste.slice(v + 1);
    }
    const idxDebut = colonnes ? Math.max(0, colonnes.indexOf('start')) : 1;
    repliques.push({
      ligne: n,
      prefixe: d[1] + champs.join(',') + ',',
      debut: (champs[idxDebut] || '').trim(),
      // \N et \n sont des retours à la ligne ASS, \h une espace insécable.
      texte: reste.replace(/\\[Nn]/g, '\n').replace(/\\h/g, ' '),
      dessin: /\{[^}]*\\p[1-9]/.test(reste), // mode dessin : des coordonnées, pas du texte
    });
  });
  return { format: 'ass', lignes, repliques };
}

function ecrireAss(doc) {
  const lignes = [...doc.lignes];
  for (const r of doc.repliques) lignes[r.ligne] = r.prefixe + r.texte.replace(/\n/g, '\\N').replace(/ /g, '\\h');
  return lignes.join('\n');
}

// --- Écriture -------------------------------------------------------------------

function serialiser(doc) {
  let corps;
  if (doc.format === 'srt') corps = ecrireSrt(doc);
  else if (doc.format === 'vtt') corps = ecrireVtt(doc);
  else corps = ecrireAss(doc);
  if (!corps.endsWith('\n')) corps += '\n';
  return corps.replace(/\n/g, doc.eol || '\r\n');
}

// Conversion vers SRT (option « Toujours SRT »). Le texte doit déjà être sans balises ASS.
function versSrt(doc) {
  if (doc.format === 'srt') return doc;
  const repliques = doc.repliques.filter((r) => !r.dessin).map((r, n) => {
    if (doc.format === 'vtt') {
      const m = RE_TEMPS_VTT.exec(r.minutage);
      return { indice: String(n + 1), minutage: `${tempsSrt(m[1])} --> ${tempsSrt(m[2])}`, texte: balisesSrt(r.texte) };
    }
    // ASS : italique/gras/souligné convertis, le reste (positions, couleurs, effets) n'existe pas en SRT.
    const texte = r.texte
      .replace(/\{[^}]*\\([ibu])1[^}]*\}/g, '<$1>')
      .replace(/\{[^}]*\\([ibu])0[^}]*\}/g, '</$1>')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\u00a0/g, ' ');
    return { indice: String(n + 1), minutage: r.minutageSrt, texte: balisesSrt(texte) };
  });
  return { format: 'srt', repliques, eol: '\r\n' };
}

// Ne garde que les balises comprises par tous les lecteurs SRT, et referme celles laissées ouvertes.
function balisesSrt(texte) {
  let t = texte.replace(/<(?!\/?[ibu]>)[^>]*>/g, '');
  for (const b of ['i', 'b', 'u']) {
    const ouvertes = (t.match(new RegExp(`<${b}>`, 'g')) || []).length;
    const fermees = (t.match(new RegExp(`</${b}>`, 'g')) || []).length;
    if (ouvertes > fermees) t += `</${b}>`.repeat(ouvertes - fermees);
  }
  return t;
}

function tempsSrt(t) {
  const p = t.split(':');
  if (p.length === 2) p.unshift('0');
  const [h, m, s] = p;
  const [sec, ms = '0'] = s.split(/[.,]/);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${ms.padEnd(3, '0').slice(0, 3)}`;
}

// --- Minutages en millisecondes (synchronisation) -----------------------------
// « 0:01:02.50 », « 00:01:02,500 », « 01:02.500 » → ms. null si illisible.
function versMs(t) {
  const m = /^\s*(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})\s*$/.exec(String(t || ''));
  if (!m) return null;
  const frac = Number(m[4].padEnd(3, '0').slice(0, 3));
  return ((Number(m[1] || 0) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + frac;
}
function depuisMs(ms, style) {
  const v = Math.max(0, Math.round(ms));
  const h = Math.floor(v / 3600000);
  const mn = Math.floor((v % 3600000) / 60000);
  const sec = Math.floor((v % 60000) / 1000);
  const mil = v % 1000;
  const d2 = (n) => String(n).padStart(2, '0');
  if (style === 'ass') return `${h}:${d2(mn)}:${d2(sec)}.${d2(Math.floor(mil / 10))}`;
  if (style === 'vtt') return `${d2(h)}:${d2(mn)}:${d2(sec)}.${String(mil).padStart(3, '0')}`;
  return `${d2(h)}:${d2(mn)}:${d2(sec)},${String(mil).padStart(3, '0')}`;
}

function colonnesAss(doc) {
  let colonnes = null;
  let section = '';
  doc.lignes.forEach((ligne) => {
    const s = /^\s*\[([^\]]+)\]\s*$/.exec(ligne);
    if (s) section = s[1].toLowerCase();
    const f = /^\s*Format\s*:(.*)$/i.exec(ligne);
    if (f && section === 'events') colonnes = f[1].split(',').map((c) => c.trim().toLowerCase());
  });
  return { iD: colonnes ? colonnes.indexOf('start') : 1, iF: colonnes ? colonnes.indexOf('end') : 2 };
}

// [{ debut, fin }] en ms pour chaque réplique (null si minutage illisible).
function lireMinutages(doc) {
  if (doc.format === 'ass') {
    const { iD, iF } = colonnesAss(doc);
    return doc.repliques.map((r) => {
      const champs = r.prefixe.replace(/^\s*Dialogue\s*:\s*/i, '').split(',');
      const debut = versMs(champs[iD]);
      const fin = versMs(champs[iF]);
      return debut === null || fin === null ? null : { debut, fin };
    });
  }
  const re = doc.format === 'vtt' ? RE_TEMPS_VTT : RE_TEMPS_SRT;
  return doc.repliques.map((r) => {
    const m = re.exec(r.minutage || '');
    if (!m) return null;
    const debut = versMs(m[1]);
    const fin = versMs(m[2]);
    return debut === null || fin === null ? null : { debut, fin };
  });
}

// Applique une transformation de temps (ms → ms) à toutes les répliques, en gardant le reste de la
// ligne de minutage (positions SRT, réglages VTT, autres champs ASS). Les répliques qui finissent
// avant 0 sont retirées (ASS : ramenées à une durée nulle). Renvoie le nombre de répliques concernées.
function appliquerMinutages(doc, transformer) {
  const temps = lireMinutages(doc);
  if (doc.format === 'ass') {
    // ASS : une réplique passée avant 0 garde sa ligne (les numéros de ligne restent valables) mais
    // dure 0 s, donc ne s'affiche jamais.
    const { iD, iF } = colonnesAss(doc);
    let retirees = 0;
    doc.repliques.forEach((r, i) => {
      const t = temps[i];
      if (!t) return;
      let d = transformer(t.debut);
      let f = transformer(t.fin);
      if (f <= 0) { d = 0; f = 0; retirees += 1; }
      const m = /^(\s*Dialogue\s*:\s*)(.*)$/i.exec(r.prefixe);
      const champs = m[2].split(',');
      champs[iD] = depuisMs(d, 'ass');
      champs[iF] = depuisMs(f, 'ass');
      r.prefixe = `${m[1]}${champs.join(',')}`;
      r.debut = champs[iD];
    });
    preparerConversionAss(doc);
    return retirees;
  }
  const garder = new Array(doc.repliques.length).fill(true);
  const re = doc.format === 'vtt' ? RE_TEMPS_VTT : RE_TEMPS_SRT;
  const style = doc.format === 'vtt' ? 'vtt' : 'srt';
  doc.repliques.forEach((r, i) => {
    const t = temps[i];
    if (!t) return;
    const d = transformer(t.debut);
    const f = transformer(t.fin);
    if (f <= 0) { garder[i] = false; return; }
    const m = re.exec(r.minutage);
    r.minutage = `${depuisMs(d, style)} --> ${depuisMs(f, style)}${m[3] || ''}`;
    r.debut = depuisMs(d, style);
  });
  const retirees = doc.repliques.length - garder.filter(Boolean).length;
  if (retirees) {
    if (doc.format === 'vtt') doc.elements = doc.elements.filter((e) => e.type !== 'replique' || garder[doc.repliques.indexOf(e.r)]);
    doc.repliques = doc.repliques.filter((_, i) => garder[i]);
    if (doc.format === 'srt') doc.repliques.forEach((r, n) => { if (r.indice !== null) r.indice = String(n + 1); });
  }
  return retirees;
}

// Minutages ASS (H:MM:SS.cc) → SRT, calculés à l'analyse pour l'option « Toujours SRT ».
function preparerConversionAss(doc) {
  if (doc.format !== 'ass') return;
  let colonnes = null;
  let section = '';
  doc.lignes.forEach((ligne) => {
    const s = /^\s*\[([^\]]+)\]\s*$/.exec(ligne);
    if (s) section = s[1].toLowerCase();
    const f = /^\s*Format\s*:(.*)$/i.exec(ligne);
    if (f && section === 'events') colonnes = f[1].split(',').map((c) => c.trim().toLowerCase());
  });
  const iD = colonnes ? colonnes.indexOf('start') : 1;
  const iF = colonnes ? colonnes.indexOf('end') : 2;
  for (const r of doc.repliques) {
    const champs = r.prefixe.replace(/^\s*Dialogue\s*:\s*/i, '').split(',');
    r.minutageSrt = `${tempsSrt(champs[iD].trim())} --> ${tempsSrt(champs[iF].trim())}`;
  }
}

// --- Préparation des segments à traduire --------------------------------------
// Une réplique devient un ou plusieurs segments de texte « propres » :
//   - balises de début et de fin gardées de côté ;
//   - répliques de dialogue (« - Salut\n- Ça va ? ») traduites ligne par ligne ;
//   - sinon lignes réunies en une phrase, puis recoupées sur le même nombre de lignes ;
//   - balises internes remplacées par des marqueurs <x n="k"/>, restitués après traduction.

function regexBalises(format) {
  if (format === 'ass') return /\{[^}]*\}/g;
  if (format === 'vtt') return /<\/?[a-zA-Z][^>]*>|<\d{1,2}:\d{2}[^>]*>/g;
  return /<\/?[a-zA-Z][^>]*>|\{\\[^}]*\}/g;
}

const RE_MARQUEUR = /<x\s+n="(\d+)"\s*\/>/g;
const A_TRADUIRE = /\p{L}/u; // au moins une lettre : sinon (♪, ..., chiffres) rien à traduire

function decouperBalises(texte, format) {
  // Sépare le texte en morceaux { balise } / { texte }.
  const re = regexBalises(format);
  const morceaux = [];
  let dernier = 0;
  for (const m of texte.matchAll(re)) {
    if (m.index > dernier) morceaux.push({ texte: texte.slice(dernier, m.index) });
    morceaux.push({ balise: m[0] });
    dernier = m.index + m[0].length;
  }
  if (dernier < texte.length) morceaux.push({ texte: texte.slice(dernier) });
  return morceaux;
}

function preparerReplique(texteBrut, format) {
  // Une balise fermée en fin de ligne puis rouverte au début de la suivante (<i>…</i>\n<i>…</i>)
  // ne sert qu'à la mise en page : on la retire avant de réunir les lignes.
  let texte = texteBrut.replace(/<\/(\w+)>([ \t]*)\n([ \t]*)<\1>/g, '\n');
  const morceaux = decouperBalises(texte, format);
  let tete = '';
  while (morceaux.length && (morceaux[0].balise || morceaux[0].texte.trim() === '')) {
    const m = morceaux.shift();
    tete += m.balise ?? m.texte;
  }
  let queue = '';
  while (morceaux.length && (morceaux[morceaux.length - 1].balise || morceaux[morceaux.length - 1].texte.trim() === '')) {
    const m = morceaux.pop();
    queue = (m.balise ?? m.texte) + queue;
  }
  texte = morceaux.map((m) => m.balise ?? m.texte).join('');
  if (!A_TRADUIRE.test(texte.replace(regexBalises(format), ''))) {
    return { segments: [], recomposer: () => texteBrut };
  }
  const lignes = texte.split('\n');
  const tiret = /^(\s*(?:\{[^}]*\}|<[^>]+>)*\s*)([-–—]\s*)/;
  const dialogue = lignes.length >= 2 && lignes.every((l) => tiret.test(l));
  const blocs = dialogue
    ? lignes.map((l) => { const m = tiret.exec(l); return { avant: m[0], texte: l.slice(m[0].length), nbLignes: 1 }; })
    : [{ avant: '', texte: lignes.map((l) => l.trim()).join(' ').replace(/\s{2,}/g, ' '), nbLignes: lignes.length }];

  const segments = [];
  const restaurations = [];
  for (const b of blocs) {
    const balises = [];
    const source = decouperBalises(b.texte, format).map((m) => {
      if (m.balise === undefined) return m.texte;
      balises.push(m.balise);
      return `<x n="${balises.length - 1}"/>`;
    }).join('');
    if (!A_TRADUIRE.test(source.replace(RE_MARQUEUR, ''))) {
      restaurations.push(() => b.avant + b.texte);
      continue;
    }
    const n = segments.length;
    segments.push(source);
    restaurations.push((traductions) => {
      let t = restaurerMarqueurs(String(traductions[n] ?? source), balises);
      t = t.replace(/\s*\n\s*/g, ' ').trim();
      return b.avant + recouper(t, b.nbLignes);
    });
  }
  return {
    segments,
    recomposer: (traductions) => tete + restaurations.map((f) => f(traductions)).join('\n') + queue,
  };
}

function restaurerMarqueurs(texte, balises) {
  const vus = new Set([...texte.matchAll(RE_MARQUEUR)].map((m) => Number(m[1])));
  const complet = balises.every((_, i) => vus.has(i));
  // Une balise ouvrante sans sa fermante mettrait tout le reste du film en italique :
  // si le moteur en a perdu une, on rend le texte sans balises internes plutôt que de casser l'affichage.
  return texte.replace(RE_MARQUEUR, (_m, k) => (complet && balises[Number(k)] !== undefined ? balises[Number(k)] : ''))
    .replace(/<\/?x\b[^>]*>/g, '');
}

// Recoupe une phrase sur `nbLignes` lignes équilibrées (sous-titres : 2 lignes maximum en général).
function recouper(texte, nbLignes, longueurMax = 46) {
  let n = Math.max(1, Math.min(nbLignes, 3));
  const longueurVisible = texte.replace(/<[^>]+>|\{[^}]*\}/g, '').length;
  if (n === 1 && longueurVisible > longueurMax + 6) n = 2;
  if (n === 1) return texte;
  const mots = texte.split(' ');
  if (mots.length < n) return texte;
  const lignes = [];
  let reste = mots;
  for (let k = n; k > 1; k--) {
    const total = reste.join(' ').length;
    const cible = total / k;
    let meilleur = 1;
    let meilleurScore = Infinity;
    for (let c = 1; c < reste.length; c++) {
      const gauche = reste.slice(0, c).join(' ');
      // Couper de préférence après une ponctuation.
      const bonus = /[,.;:!?…]$/.test(reste[c - 1]) ? 6 : 0;
      const score = Math.abs(gauche.length - cible) - bonus;
      if (score < meilleurScore) { meilleurScore = score; meilleur = c; }
    }
    lignes.push(reste.slice(0, meilleur).join(' '));
    reste = reste.slice(meilleur);
  }
  lignes.push(reste.join(' '));
  return lignes.join('\n');
}

// Texte affichable (aperçu) : sans balises.
function texteVisible(texte) {
  return texte.replace(/<[^>]+>|\{[^}]*\}/g, '').replace(/ /g, ' ');
}

// --- Nom de sortie -----------------------------------------------------------------

const CODES_LANGUE = new Set(('fr fre fra en eng es spa de ger deu it ita pt por br nl dut nld pl pol ru rus uk ukr ja jpn zh chi zho '
  + 'ko kor ar ara tr tur sv swe da dan fi fin nb no nor nob cs cze ces el gre ell hu hun ro rum ron bg bul sk slo slk sl slv '
  + 'et est lv lav lt lit id ind he heb vi vie th tha hi hin vf vo vost vostfr french english spanish german italian').split(' '));
const DRAPEAUX = new Set(['forced', 'force', 'forces', 'sdh', 'cc', 'hi']);

function nomSortie(cheminSource, codeCible, extension, dossierSortie = null) {
  const dossier = dossierSortie || path.dirname(cheminSource);
  const parties = path.basename(cheminSource, path.extname(cheminSource)).split('.');
  const drapeaux = [];
  while (parties.length > 1) {
    const d = parties[parties.length - 1].toLowerCase();
    if (DRAPEAUX.has(d)) drapeaux.unshift(parties.pop());
    else if (CODES_LANGUE.has(d) || /^[a-z]{2}-[a-z]{2,4}$/i.test(d)) parties.pop();
    else break;
  }
  const base = [parties.join('.'), codeCible, ...drapeaux].join('.');
  let candidat = path.join(dossier, `${base}${extension}`);
  for (let n = 2; fs.existsSync(candidat); n++) candidat = path.join(dossier, `${base} (${n})${extension}`);
  return candidat;
}

// Écriture atomique : fichier temporaire dans le même dossier puis renommage.
// BOM UTF-8 en SRT : les vieux lecteurs Windows (et certaines TV) devinent mal l'encodage sans lui.
function ecrireFichier(chemin, doc) {
  const contenu = serialiser(doc);
  const bom = doc.format === 'srt' ? '﻿' : '';
  const tmp = `${chemin}.${process.pid}.part`;
  try {
    fs.writeFileSync(tmp, bom + contenu, { encoding: 'utf8', flag: 'wx' });
    if (fs.existsSync(chemin)) throw new ErreurFormat('Le fichier de sortie existe déjà.');
    fs.renameSync(tmp, chemin);
  } catch (e) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* silence-ok: nettoyage du temporaire, l'erreur d'origine est relancée juste après */ }
    throw e;
  }
  return chemin;
}

module.exports = {
  TAILLE_MAX, EXTENSIONS, ErreurFormat,
  decoder, formatDepuisChemin, lireFichier, analyser, serialiser, versSrt, preparerConversionAss,
  preparerReplique, restaurerMarqueurs, recouper, texteVisible, nomSortie, ecrireFichier,
  versMs, depuisMs, lireMinutages, appliquerMinutages,
};
