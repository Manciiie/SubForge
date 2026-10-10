'use strict';
// Décodage des sous-titres Blu-ray (PGS, fichiers .sup) : segments PCS / WDS / PDS / ODS / END,
// palettes YCbCr + transparence, images compressées en RLE. Chaque réplique devient une image
// « texte noir sur fond blanc » prête pour l'OCR (format PGM, lu directement par Tesseract).
// Sans Electron : testé par tests/pgs.test.js.

const TAILLE_MAX = 200 * 1024 * 1024; // une piste PGS d'un film fait 20 à 60 Mo
const COTE_MAX = 4096;
const MARGE = 16;

class ErreurPgs extends Error {
  constructor(m) { super(m); this.name = 'ErreurPgs'; }
}

// Décompression RLE d'un objet (largeur × hauteur) → indices de palette.
function decoderRle(donnees, largeur, hauteur) {
  const pixels = new Uint8Array(largeur * hauteur);
  let i = 0;
  let x = 0;
  let y = 0;
  const poser = (couleur, n) => {
    const fin = Math.min(n, largeur - x);
    if (y < hauteur && fin > 0) pixels.fill(couleur, y * largeur + x, y * largeur + x + fin);
    x += n;
  };
  while (i < donnees.length && y < hauteur) {
    const b = donnees[i++];
    if (b !== 0) { poser(b, 1); continue; }
    const f = donnees[i++];
    if (f === undefined) break;
    if (f === 0) { x = 0; y += 1; continue; } // fin de ligne
    const long = (f & 0x40) !== 0;
    const n = long ? ((f & 0x3f) << 8) | donnees[i++] : f & 0x3f;
    const couleur = (f & 0x80) !== 0 ? donnees[i++] : 0;
    poser(couleur, n);
  }
  return pixels;
}

// Lecture complète d'un .sup. Les segments abîmés sont comptés, jamais bloquants.
function lireSup(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new ErreurPgs('Données PGS invalides.');
  if (buffer.length > TAILLE_MAX) throw new ErreurPgs('Piste de sous-titres image trop grosse (plus de 200 Mo).');
  if (buffer.length < 13 || buffer.toString('latin1', 0, 2) !== 'PG') throw new ErreurPgs('Ce fichier n\'est pas un sous-titre Blu-ray (.sup) valide.');

  const palettes = new Map();   // id → Array(256) de { y, a }
  const objets = new Map();     // id → { largeur, hauteur, morceaux: [Buffer], attendu }
  let composition = null;       // dernier PCS : { pts, objets: [{ id, x, y }] }
  let videoL = 1920;
  let videoH = 1080;
  const evenements = [];        // { pts, image|null }
  let abimes = 0;
  let p = 0;

  while (p + 13 <= buffer.length) {
    if (buffer[p] !== 0x50 || buffer[p + 1] !== 0x47) {
      // Resynchronisation sur le prochain « PG » (fichier tronqué ou abîmé).
      abimes += 1;
      const suivant = buffer.indexOf('PG', p + 1, 'latin1');
      if (suivant < 0) break;
      p = suivant;
      continue;
    }
    const pts = buffer.readUInt32BE(p + 2);
    const type = buffer[p + 10];
    const taille = buffer.readUInt16BE(p + 11);
    const debut = p + 13;
    const fin = debut + taille;
    if (fin > buffer.length) { abimes += 1; break; }
    const s = buffer.subarray(debut, fin);
    p = fin;
    try {
      if (type === 0x16) { // PCS : composition
        videoL = s.readUInt16BE(0) || videoL;
        videoH = s.readUInt16BE(2) || videoH;
        const etat = s[7];
        const nb = s[10];
        const liste = [];
        let q = 11;
        for (let k = 0; k < nb; k++) {
          const id = s.readUInt16BE(q);
          const recadre = (s[q + 3] & 0x80) !== 0;
          liste.push({ id, x: s.readUInt16BE(q + 4), y: s.readUInt16BE(q + 6) });
          q += recadre ? 16 : 8;
        }
        if (etat & 0x80) objets.clear(); // début d'époque : les anciens objets ne servent plus
        composition = { pts, objets: liste };
      } else if (type === 0x14) { // PDS : palette
        const id = s[0];
        const pal = palettes.get(id) || Array.from({ length: 256 }, () => ({ y: 0, a: 0 }));
        for (let q = 2; q + 5 <= s.length; q += 5) pal[s[q]] = { y: s[q + 1], a: s[q + 4] };
        palettes.set(id, pal);
        if (composition) composition.palette = id;
      } else if (type === 0x15) { // ODS : objet (image), parfois en plusieurs morceaux
        const id = s.readUInt16BE(0);
        const seq = s[3];
        if (seq & 0x80) {
          const largeur = s.readUInt16BE(7);
          const hauteur = s.readUInt16BE(9);
          if (!largeur || !hauteur || largeur > COTE_MAX || hauteur > COTE_MAX) throw new ErreurPgs('dimensions d\'image invalides');
          objets.set(id, { largeur, hauteur, morceaux: [s.subarray(11)] });
        } else {
          const o = objets.get(id);
          if (!o) throw new ErreurPgs('suite d\'image sans début');
          o.morceaux.push(s.subarray(4));
        }
      } else if (type === 0x80) { // END : fin du jeu d'affichage
        if (!composition) continue;
        if (!composition.objets.length) { evenements.push({ pts: composition.pts, image: null }); continue; }
        const pal = palettes.get(composition.palette ?? 0) || palettes.values().next().value;
        const image = pal ? composer(composition.objets, objets, pal) : null;
        if (!image) abimes += 1;
        evenements.push({ pts: composition.pts, image });
      }
      // 0x17 (WDS, fenêtres) : sans intérêt pour l'OCR.
    } catch {
      abimes += 1; // segment illisible compté dans le bilan (« X images illisibles »)
    }
  }

  // Une réplique commence à un jeu d'affichage avec image et finit au jeu suivant.
  const repliques = [];
  for (let k = 0; k < evenements.length; k++) {
    const e = evenements[k];
    if (!e.image) continue;
    const suivant = evenements[k + 1];
    const fin = suivant ? suivant.pts : e.pts + 3 * 90000;
    if (fin <= e.pts) continue;
    // Fondu ou simple mise à jour de palette : même image affichée de nouveau → une seule réplique prolongée.
    const derniere = repliques[repliques.length - 1];
    if (derniere && Math.abs(derniere.fin - e.pts / 90) < 1 && memeImage(derniere.image, e.image)) { derniere.fin = fin / 90; continue; }
    repliques.push({ debut: e.pts / 90, fin: fin / 90, image: e.image });
  }
  return { largeurVideo: videoL, hauteurVideo: videoH, repliques, abimes };
}

// Assemble les objets d'une composition en une seule image d'encre (0 = encre, 255 = fond).
function composer(liste, objets, palette) {
  const parts = [];
  for (const { id, x, y } of liste) {
    const o = objets.get(id);
    if (!o) continue;
    const rle = Buffer.concat(o.morceaux);
    parts.push({ x, y, largeur: o.largeur, hauteur: o.hauteur, pixels: decoderRle(rle, o.largeur, o.hauteur) });
  }
  if (!parts.length) return null;
  const x0 = Math.min(...parts.map((q) => q.x));
  const y0 = Math.min(...parts.map((q) => q.y));
  const x1 = Math.max(...parts.map((q) => q.x + q.largeur));
  const y1 = Math.max(...parts.map((q) => q.y + q.hauteur));
  const L = x1 - x0;
  const H = y1 - y0;
  if (L > COTE_MAX || H > COTE_MAX) return null;

  // Seuil : parmi les pixels opaques, le texte est la partie claire, le contour la partie sombre.
  let ymin = 255;
  let ymax = 0;
  for (const q of parts) {
    for (const c of q.pixels) {
      const e = palette[c];
      if (e.a >= 128) { if (e.y < ymin) ymin = e.y; if (e.y > ymax) ymax = e.y; }
    }
  }
  if (ymax < ymin) return null; // image entièrement transparente
  const contraste = ymax - ymin >= 40;
  const seuil = (ymin + ymax) / 2;

  const largeur = L + 2 * MARGE;
  const hauteur = H + 2 * MARGE;
  const gris = new Uint8Array(largeur * hauteur).fill(255);
  let encre = 0;
  for (const q of parts) {
    for (let j = 0; j < q.hauteur; j++) {
      for (let i = 0; i < q.largeur; i++) {
        const e = palette[q.pixels[j * q.largeur + i]];
        if (e.a < 128) continue;
        if (contraste && e.y < seuil) continue;
        gris[(q.y - y0 + j + MARGE) * largeur + (q.x - x0 + i + MARGE)] = 0;
        encre += 1;
      }
    }
  }
  if (!encre) return null;
  return recadrer({ largeur, hauteur, gris, x: x0, y: y0 });
}

// Recadre sur l'encre (+ marge) : image plus petite = OCR plus rapide.
function recadrer(img) {
  let gx = img.largeur; let gy = img.hauteur; let dx = -1; let dy = -1;
  for (let j = 0; j < img.hauteur; j++) {
    for (let i = 0; i < img.largeur; i++) {
      if (img.gris[j * img.largeur + i] === 0) { if (i < gx) gx = i; if (i > dx) dx = i; if (j < gy) gy = j; if (j > dy) dy = j; }
    }
  }
  const x0 = Math.max(0, gx - MARGE); const y0 = Math.max(0, gy - MARGE);
  const x1 = Math.min(img.largeur, dx + 1 + MARGE); const y1 = Math.min(img.hauteur, dy + 1 + MARGE);
  const largeur = x1 - x0; const hauteur = y1 - y0;
  const gris = new Uint8Array(largeur * hauteur);
  for (let j = 0; j < hauteur; j++) gris.set(img.gris.subarray((y0 + j) * img.largeur + x0, (y0 + j) * img.largeur + x1), j * largeur);
  return { largeur, hauteur, gris, x: img.x + x0 - MARGE, y: img.y + y0 - MARGE };
}

// Comptage rapide (sans décoder les images) : nombre de répliques affichées, pour l'analyse.
function compter(buffer) {
  if (buffer.length < 13 || buffer.toString('latin1', 0, 2) !== 'PG') throw new ErreurPgs('Ce fichier n\'est pas un sous-titre Blu-ray (.sup) valide.');
  let n = 0;
  let p = 0;
  while (p + 13 <= buffer.length && buffer[p] === 0x50 && buffer[p + 1] === 0x47) {
    const taille = buffer.readUInt16BE(p + 11);
    if (buffer[p + 10] === 0x16 && p + 13 + 11 <= buffer.length && buffer[p + 13 + 10] > 0) n += 1;
    p += 13 + taille;
  }
  return n;
}

function memeImage(a, b) {
  return a.largeur === b.largeur && a.hauteur === b.hauteur && Buffer.from(a.gris).equals(Buffer.from(b.gris));
}

function versPgm(image) {
  return Buffer.concat([Buffer.from(`P5\n${image.largeur} ${image.hauteur}\n255\n`, 'latin1'), Buffer.from(image.gris)]);
}

module.exports = { compter, lireSup, decoderRle, versPgm, ErreurPgs, TAILLE_MAX };
