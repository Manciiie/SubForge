'use strict';
// Encodeur PGS minimal, pour fabriquer des sous-titres Blu-ray de test (le décodeur, lui, est dans src/).
// Image d'entrée : RGBA (texte clair, contour sombre, fond transparent), comme sur un vrai Blu-ray.

function segment(type, pts, donnees) {
  const t = Buffer.alloc(13);
  t.write('PG', 0, 'latin1');
  t.writeUInt32BE(pts >>> 0, 2);
  t.writeUInt32BE(0, 6);
  t[10] = type;
  t.writeUInt16BE(donnees.length, 11);
  return Buffer.concat([t, donnees]);
}

function rle(indices, largeur, hauteur) {
  const sortie = [];
  for (let y = 0; y < hauteur; y++) {
    let x = 0;
    while (x < largeur) {
      const c = indices[y * largeur + x];
      let n = 1;
      while (x + n < largeur && indices[y * largeur + x + n] === c && n < 16383) n += 1;
      if (c === 0) {
        if (n < 64) sortie.push(0, n); else sortie.push(0, 0x40 | (n >> 8), n & 0xff);
      } else if (n < 3) {
        for (let k = 0; k < n; k++) sortie.push(c);
      } else if (n < 64) sortie.push(0, 0x80 | n, c);
      else sortie.push(0, 0xc0 | (n >> 8), n & 0xff, c);
      x += n;
    }
    sortie.push(0, 0);
  }
  return Buffer.from(sortie);
}

// 9 niveaux : 0 transparent, 1..8 gris opaques.
function quantifier(rgba, largeur, hauteur) {
  const idx = new Uint8Array(largeur * hauteur);
  for (let i = 0; i < largeur * hauteur; i++) {
    const a = rgba[i * 4 + 3];
    if (a < 96) continue;
    const l = (rgba[i * 4] * 299 + rgba[i * 4 + 1] * 587 + rgba[i * 4 + 2] * 114) / 1000;
    idx[i] = 1 + Math.round((l / 255) * 7);
  }
  return idx;
}

// repliques : [{ debut (ms), fin (ms), rgba, largeur, hauteur }] → Buffer .sup
function encoderSup(repliques, { video = [1920, 1080] } = {}) {
  const morceaux = [];
  let numero = 0;
  for (const r of repliques) {
    const ptsD = Math.round(r.debut * 90);
    const ptsF = Math.round(r.fin * 90);
    const x = Math.round((video[0] - r.largeur) / 2);
    const y = video[1] - r.hauteur - 60;
    const pcs = Buffer.alloc(19);
    pcs.writeUInt16BE(video[0], 0); pcs.writeUInt16BE(video[1], 2); pcs[4] = 0x10;
    pcs.writeUInt16BE(numero++, 5); pcs[7] = 0x80; pcs[8] = 0; pcs[9] = 0; pcs[10] = 1;
    pcs.writeUInt16BE(0, 11); pcs[13] = 0; pcs[14] = 0; pcs.writeUInt16BE(x, 15); pcs.writeUInt16BE(y, 17);
    const wds = Buffer.alloc(10);
    wds[0] = 1; wds[1] = 0; wds.writeUInt16BE(x, 2); wds.writeUInt16BE(y, 4); wds.writeUInt16BE(r.largeur, 6); wds.writeUInt16BE(r.hauteur, 8);
    const pal = [0, 0];
    for (let k = 1; k <= 8; k++) pal.push(k, 16 + Math.round(((k - 1) / 7) * 219), 128, 128, 255);
    const donnees = rle(quantifier(r.rgba, r.largeur, r.hauteur), r.largeur, r.hauteur);
    const ods = Buffer.alloc(11);
    ods.writeUInt16BE(0, 0); ods[2] = 0; ods[3] = 0xc0;
    const l = donnees.length + 4;
    ods[4] = (l >> 16) & 0xff; ods[5] = (l >> 8) & 0xff; ods[6] = l & 0xff;
    ods.writeUInt16BE(r.largeur, 7); ods.writeUInt16BE(r.hauteur, 9);
    morceaux.push(segment(0x16, ptsD, pcs), segment(0x17, ptsD, wds), segment(0x14, ptsD, Buffer.from(pal)),
      segment(0x15, ptsD, Buffer.concat([ods, donnees])), segment(0x80, ptsD, Buffer.alloc(0)));
    const fin = Buffer.alloc(11);
    fin.writeUInt16BE(video[0], 0); fin.writeUInt16BE(video[1], 2); fin[4] = 0x10; fin.writeUInt16BE(numero++, 5);
    morceaux.push(segment(0x16, ptsF, fin), segment(0x17, ptsF, wds), segment(0x80, ptsF, Buffer.alloc(0)));
  }
  return Buffer.concat(morceaux);
}

module.exports = { encoderSup, rle };
