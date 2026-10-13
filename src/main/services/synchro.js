'use strict';
// Synchronisation automatique d'un sous-titre sur le son du film (D-010).
// 1. Le son du film est décodé par ffmpeg (mono 8 kHz, bande de la voix 200–3 000 Hz) et réduit à
//    une énergie par trame de 20 ms ; une trame est « parlée » si son énergie dépasse la médiane.
// 2. Les sous-titres donnent un second signal : 1 quand une réplique est affichée.
// 3. Pour chaque vitesse possible (1, 23,976↔24↔25 i/s), la corrélation des deux signaux (par FFT)
//    donne le meilleur décalage. Appliqué seulement si le pic est net.
// Calcul pur testé par tests/synchro.test.js ; seul analyserSon() lance ffmpeg.

const video = require('./video');

const TRAME_MS = 20;
const ECHANTILLONS_PAR_TRAME = 8000 * TRAME_MS / 1000; // 160 à 8 kHz
const DECALAGE_MAX_MS = 5 * 60 * 1000;
const VITESSES = [1, 25 / 23.976, 23.976 / 25, 24 / 23.976, 23.976 / 24, 25 / 24, 24 / 25];
const SEUIL_NETTETE = 7;      // pic de corrélation : au moins 7 écarts-types au-dessus du bruit
const SEUIL_CORRELATION = 0.08;
const DECALAGE_NEGLIGEABLE_MS = 150;
const REPLIQUES_MIN = 20;

const pause = () => new Promise((ok) => setImmediate(ok)); // laisse respirer le processus principal

// --- Son du film → énergie par trame --------------------------------------------------------
async function analyserSon(binaire, film, { signal, surAvancement = () => {}, dureeMs = null } = {}) {
  const energies = [];
  let reste = Buffer.alloc(0);
  let lus = 0;
  let dernierPct = -1;
  const r = await video.executer(binaire, [
    '-nostdin', '-hide_banner', '-v', 'error', '-i', film,
    '-map', '0:a:0', '-vn', '-sn', '-dn', '-ac', '1', '-ar', '8000',
    '-af', 'highpass=f=200,lowpass=f=3000', '-f', 's16le', '-',
  ], {
    signal,
    delai: 45 * 60 * 1000,
    surDonnees: (bloc) => {
      let donnees = reste.length ? Buffer.concat([reste, bloc]) : bloc;
      const octetsTrame = ECHANTILLONS_PAR_TRAME * 2;
      const n = Math.floor(donnees.length / octetsTrame);
      for (let t = 0; t < n; t++) {
        let somme = 0;
        const base = t * octetsTrame;
        for (let k = 0; k < octetsTrame; k += 2) { const v = donnees.readInt16LE(base + k); somme += v * v; }
        energies.push(Math.log10(1 + somme / ECHANTILLONS_PAR_TRAME));
      }
      reste = donnees.subarray(n * octetsTrame);
      donnees = null;
      lus += bloc.length;
      if (dureeMs) {
        const pct = Math.min(99, Math.floor((lus / 16) / dureeMs * 100)); // 16 octets par ms à 8 kHz
        if (pct !== dernierPct) { dernierPct = pct; surAvancement(pct / 100); }
      }
    },
  });
  if (r.code !== 0 && !energies.length) {
    if (/matches no streams|does not contain any stream|Stream map '0:a:0'/i.test(r.erreurs)) {
      const e = new Error('ce film n\'a pas de piste son');
      e.sansSon = true;
      throw e;
    }
    throw new Error(`lecture du son impossible (${r.erreurs.trim().split('\n').pop() || `code ${r.code}`})`);
  }
  return Float32Array.from(energies);
}

// Trames « parlées » : énergie au-dessus de la médiane. Renvoie un signal centré (moyenne nulle).
function parole(energies) {
  const tri = Float32Array.from(energies).sort();
  const seuil = tri[Math.floor(tri.length * 0.5)] || 0;
  const s = new Float64Array(energies.length);
  let somme = 0;
  for (let i = 0; i < energies.length; i++) { s[i] = energies[i] > seuil ? 1 : 0; somme += s[i]; }
  const moyenne = somme / (energies.length || 1);
  for (let i = 0; i < s.length; i++) s[i] -= moyenne;
  return s;
}

// Signal des sous-titres (1 pendant qu'une réplique est affichée), après transformation x → x·vitesse.
function signalSousTitres(minutages, vitesse, longueur) {
  const s = new Float64Array(longueur);
  for (const m of minutages) {
    if (!m) continue;
    const d = Math.max(0, Math.floor((m.debut * vitesse) / TRAME_MS));
    const f = Math.min(longueur, Math.ceil((m.fin * vitesse) / TRAME_MS));
    for (let i = d; i < f; i++) s[i] = 1;
  }
  let somme = 0;
  for (let i = 0; i < s.length; i++) somme += s[i];
  const moyenne = somme / (s.length || 1);
  for (let i = 0; i < s.length; i++) s[i] -= moyenne;
  return s;
}

// FFT complexe en place (radix 2, itérative). inverse = true → transformée inverse non normalisée.
function fft(re, im, inverse = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let longueur = 2; longueur <= n; longueur <<= 1) {
    const angle = (2 * Math.PI / longueur) * (inverse ? 1 : -1);
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    const moitie = longueur >> 1;
    for (let i = 0; i < n; i += longueur) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < moitie; k++) {
        const a = i + k;
        const b = a + moitie;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

const norme = (s) => Math.sqrt(s.reduce((n, v) => n + v * v, 0)) || 1;

// Meilleur décalage pour des minutages (ms) face au signal de parole. Calcul découpé (pauses) pour ne
// pas figer l'application. Renvoie { vitesse, decalageMs, nettete, correlation, applique, raison }.
async function trouverDecalage(energies, minutages, { signal } = {}) {
  const utiles = minutages.filter(Boolean);
  if (utiles.length < REPLIQUES_MIN) return { applique: false, raison: 'trop-peu' };
  const a = parole(energies);
  const lagMax = Math.round(DECALAGE_MAX_MS / TRAME_MS);
  const finSous = Math.max(...utiles.map((m) => m.fin)) * Math.max(...VITESSES);
  const longueur = Math.max(a.length, Math.ceil(finSous / TRAME_MS) + 1);
  let n = 1;
  while (n < longueur + lagMax) n <<= 1;
  const aRe = new Float64Array(n); aRe.set(a);
  const aIm = new Float64Array(n);
  fft(aRe, aIm);
  const normeA = norme(a);
  await pause();

  let meilleur = null;
  for (const vitesse of VITESSES) {
    if (signal?.aborted) throw Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });
    const s = signalSousTitres(utiles, vitesse, longueur);
    const normeS = norme(s);
    const re = new Float64Array(n); re.set(s);
    const im = new Float64Array(n);
    fft(re, im);
    // corr = IFFT(A · conj(S)) : corr[lag] = Σ a[t + lag] · s[t]
    for (let k = 0; k < n; k++) {
      const r = aRe[k] * re[k] + aIm[k] * im[k];
      const i = aIm[k] * re[k] - aRe[k] * im[k];
      re[k] = r; im[k] = i;
    }
    fft(re, im, true);
    const valeur = (lag) => re[(lag + n) % n] / n / (normeA * normeS);
    let pic = -Infinity;
    let lagPic = 0;
    let somme = 0;
    let somme2 = 0;
    let compte = 0;
    for (let lag = -lagMax; lag <= lagMax; lag++) {
      const v = valeur(lag);
      somme += v; somme2 += v * v; compte += 1;
      if (v > pic) { pic = v; lagPic = lag; }
    }
    const moyenne = somme / compte;
    const ecart = Math.sqrt(Math.max(1e-12, somme2 / compte - moyenne * moyenne));
    const nettete = (pic - moyenne) / ecart;
    if (!meilleur || nettete > meilleur.nettete) {
      meilleur = { vitesse, decalageMs: lagPic * TRAME_MS, nettete, correlation: pic };
    }
    await pause();
  }

  const net = meilleur.nettete >= SEUIL_NETTETE && meilleur.correlation >= SEUIL_CORRELATION;
  if (!net) return { ...meilleur, applique: false, raison: 'incertain' };
  if (meilleur.vitesse === 1 && Math.abs(meilleur.decalageMs) < DECALAGE_NEGLIGEABLE_MS) return { ...meilleur, applique: false, raison: 'deja' };
  return { ...meilleur, applique: true, raison: 'recale' };
}

// x (ms dans le sous-titre) → temps dans le film.
const transformation = ({ vitesse, decalageMs }) => (x) => x * vitesse + decalageMs;

// « 25 → 23,976 i/s » pour le bilan.
function libelleVitesse(v) {
  const paires = [[25 / 23.976, '25 → 23,976 i/s'], [23.976 / 25, '23,976 → 25 i/s'], [24 / 23.976, '24 → 23,976 i/s'],
    [23.976 / 24, '23,976 → 24 i/s'], [25 / 24, '25 → 24 i/s'], [24 / 25, '24 → 25 i/s']];
  return paires.find(([x]) => Math.abs(x - v) < 1e-6)?.[1] || null;
}

module.exports = { analyserSon, parole, trouverDecalage, transformation, libelleVitesse, fft, TRAME_MS, REPLIQUES_MIN };
