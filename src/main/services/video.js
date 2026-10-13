'use strict';
// Pistes de sous-titres des vidéos, via le ffmpeg livré avec l'application (D-004).
// Toujours spawn sans shell, chemin absolu du binaire, délai maximum, processus tués à l'annulation.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { argumentsCommande } = require('../securite');
const { depuisIso3 } = require('./langues');

const EXTENSIONS_VIDEO = new Set(['.mkv', '.mp4', '.m4v', '.avi', '.mov', '.webm', '.ts', '.m2ts', '.wmv', '.ogm']);
const CODECS_TEXTE = { subrip: 'srt', srt: 'srt', mov_text: 'srt', webvtt: 'srt', text: 'srt', ass: 'ass', ssa: 'ass' };
const CODECS_IMAGE = {
  hdmv_pgs_subtitle: 'PGS (image)', dvd_subtitle: 'VobSub (image)', dvb_subtitle: 'DVB (image)',
  xsub: 'XSUB (image)', dvb_teletext: 'Télétexte',
};

const processus = new Set();

function cheminFfmpeg({ empaquete, resourcesPath, racineApp }) {
  const nom = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const dossier = process.platform === 'win32' ? 'win' : 'linux';
  return empaquete ? path.join(resourcesPath, 'bin', nom) : path.join(racineApp, 'vendor', dossier, nom);
}

function estVideo(chemin) {
  return EXTENSIONS_VIDEO.has(path.extname(chemin).toLowerCase());
}

function executer(binaire, args, { delai = 60000, signal, sortieMax = 4 * 1024 * 1024, surSortie = null, surDonnees = null } = {}) {
  return new Promise((ok, ko) => {
    if (!path.isAbsolute(binaire) || !fs.existsSync(binaire)) {
      ko(new Error('ffmpeg est introuvable dans le dossier de l\'application : réinstallez SubForge.'));
      return;
    }
    const p = spawn(binaire, argumentsCommande(args), { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    processus.add(p);
    let erreurs = '';
    let sortie = '';
    let fini = false;
    const terminer = (fonction) => { if (fini) return; fini = true; clearTimeout(minuteur); processus.delete(p); signal?.removeEventListener('abort', surAnnulation); fonction(); };
    const surAnnulation = () => { p.kill(); terminer(() => ko(Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' }))); };
    const minuteur = setTimeout(() => { p.kill(); terminer(() => ko(new Error('ffmpeg ne répond plus (délai dépassé).'))); }, delai);
    signal?.addEventListener('abort', surAnnulation, { once: true });
    if (signal?.aborted) surAnnulation();
    p.stdout.on('data', (d) => {
      if (surDonnees) surDonnees(d); // données brutes (son PCM)
      else if (surSortie) surSortie(String(d));
      else if (sortie.length < sortieMax) sortie += d;
    });
    p.stderr.on('data', (d) => { if (erreurs.length < sortieMax) erreurs += d; });
    p.on('error', (e) => terminer(() => ko(new Error(`Impossible de lancer ffmpeg : ${e.message}`))));
    p.on('close', (code) => terminer(() => ok({ code, sortie, erreurs })));
  });
}

// `ffmpeg -i fichier` sans sortie : ffmpeg décrit les flux sur stderr puis se plaint
// qu'aucune sortie n'est donnée (code 1). C'est voulu : on évite de livrer ffprobe (+80 Mo).
function analyserFlux(texteFfmpeg) {
  const pistes = [];
  const lignes = texteFfmpeg.split(/\r?\n/);
  let indiceSousTitre = -1;
  for (let i = 0; i < lignes.length; i++) {
    const m = /^\s*Stream #\d+:(\d+)(?:\[0x[0-9a-f]+\])?(?:\(([a-zA-Z]{2,3})\))?[^:]*:\s*Subtitle:\s*([a-z0-9_]+)(.*)$/i.exec(lignes[i]);
    if (!m) continue;
    indiceSousTitre += 1;
    let titre = '';
    for (let j = i + 1; j < lignes.length && /^\s{4,}/.test(lignes[j]) && !/Stream #/.test(lignes[j]); j++) {
      const t = /^\s*title\s*:\s*(.*)$/i.exec(lignes[j]);
      if (t) { titre = t[1].trim().slice(0, 200); break; }
    }
    const codec = m[3].toLowerCase();
    const l = depuisIso3(m[2]);
    pistes.push({
      flux: Number(m[1]),
      indice: indiceSousTitre,
      langue: l?.code || null,
      nomLangue: l?.nom || (m[2] && m[2].toLowerCase() !== 'und' ? m[2].toLowerCase() : 'Langue inconnue'),
      codec,
      format: CODECS_TEXTE[codec] || null,
      description: CODECS_TEXTE[codec] ? (codec === 'mov_text' ? 'Texte MP4' : codec === 'subrip' ? 'SubRip' : codec.toUpperCase()) : (CODECS_IMAGE[codec] || codec),
      titre,
      parDefaut: /\(default\)/.test(m[4]),
      forces: /\(forced\)/.test(m[4]) || /forc/i.test(titre),
      malentendants: /\(hearing impaired\)/.test(m[4]) || /\bsdh\b|malentendant/i.test(titre),
    });
  }
  return pistes;
}

async function listerPistes(binaire, chemin, { signal } = {}) {
  const r = await executer(binaire, ['-hide_banner', '-nostdin', '-i', chemin], { delai: 30000, signal });
  if (/No such file|Permission denied/i.test(r.erreurs)) throw new Error('Vidéo inaccessible (fichier déplacé ou droits insuffisants).');
  if (/Invalid data found|could not find codec parameters|moov atom not found/i.test(r.erreurs) && !/Stream #/.test(r.erreurs)) {
    throw new Error('Vidéo illisible ou abîmée.');
  }
  return analyserFlux(r.erreurs);
}

// Extrait la piste n° `indice` (parmi les sous-titres) dans un dossier temporaire privé.
// Piste Blu-ray (PGS) : recopiée telle quelle en .sup, pour l'OCR.
const estPgs = (piste) => piste.codec === 'hdmv_pgs_subtitle';

async function extrairePiste(binaire, chemin, piste, { signal } = {}) {
  if (!piste.format && !estPgs(piste)) throw new Error('Sous-titres en image de DVD (VobSub) ou de TNT (DVB) : pas encore lisibles par SubForge.');
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-'));
  const sortie = path.join(dossier, `piste.${estPgs(piste) ? 'sup' : piste.format}`);
  const codec = estPgs(piste) || piste.format === 'ass' ? ['-c:s', 'copy'] : ['-c:s', 'srt'];
  const format = estPgs(piste) ? ['-f', 'sup'] : [];
  try {
    const r = await executer(binaire, [
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
      '-i', chemin, '-map', `0:s:${piste.indice}`, ...codec, ...format, sortie,
    ], { delai: 10 * 60000, signal });
    if (r.code !== 0 || !fs.existsSync(sortie) || fs.statSync(sortie).size === 0) {
      throw new Error(`Extraction de la piste impossible${r.erreurs ? ` : ${r.erreurs.trim().split(/\r?\n/).pop().slice(0, 200)}` : '.'}`);
    }
    return { fichier: sortie, nettoyer: () => fs.rmSync(dossier, { recursive: true, force: true }) };
  } catch (e) {
    fs.rmSync(dossier, { recursive: true, force: true });
    throw e;
  }
}

// Durée totale lue dans la description de ffmpeg (« Duration: 01:52:13.40 »), en secondes.
function lireDuree(texteFfmpeg) {
  const m = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(texteFfmpeg);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

// Copie du film avec la piste de sous-titres traduite en plus (MKV, sans réencoder : -c copy).
// Toutes les pistes d'origine sont gardées (pistes de données exceptées), la nouvelle est nommée,
// marquée dans sa langue et cochée par défaut. Écriture dans un .part puis renommage ; l'original n'est jamais ouvert en écriture.
async function integrerPiste(binaire, film, sousTitre, { sortie, langueIso3 = 'und', titre = '', signal, surAvancement = () => {} } = {}) {
  const description = await executer(binaire, ['-hide_banner', '-nostdin', '-i', film], { delai: 30000, signal });
  const pistes = analyserFlux(description.erreurs);
  const duree = lireDuree(description.erreurs);
  const n = pistes.length; // la nouvelle piste sera la n-ième piste de sous-titres
  // Le texte MP4 (mov_text) n'existe pas en MKV : converti en SRT ; les autres pistes sont copiées telles quelles.
  const conversions = pistes.filter((p) => p.codec === 'mov_text').flatMap((p) => [`-c:s:${p.indice}`, 'srt']);
  const temporaire = `${sortie}.part`;
  const args = [
    '-hide_banner', '-nostdin', '-y', '-loglevel', 'error', '-nostats', '-progress', 'pipe:1',
    '-i', film, '-i', sousTitre,
    '-map', '0', '-map', '-0:d?', '-map', '1:s:0',
    '-c', 'copy', ...conversions,
    '-disposition:s', '0', `-disposition:s:${n}`, 'default',
    `-metadata:s:s:${n}`, `language=${langueIso3}`, `-metadata:s:s:${n}`, `title=${titre}`,
    '-f', 'matroska', temporaire,
  ];
  let tampon = '';
  try {
    const r = await executer(binaire, args, {
      delai: 4 * 3600 * 1000, signal,
      surSortie: (morceau) => {
        tampon += morceau;
        const lignes = tampon.split('\n');
        tampon = lignes.pop();
        for (const l of lignes) {
          const m = /^out_time_(?:us|ms)=(\d+)/.exec(l.trim());
          if (m && duree) surAvancement(Math.min(1, Number(m[1]) / 1e6 / duree));
        }
      },
    });
    if (r.code !== 0 || !fs.existsSync(temporaire) || fs.statSync(temporaire).size === 0) {
      throw new Error(`ffmpeg n'a pas pu créer la copie${r.erreurs ? ` : ${r.erreurs.trim().split(/\r?\n/).pop().slice(0, 200)}` : '.'}`);
    }
    if (fs.existsSync(sortie)) throw new Error('Le fichier de sortie existe déjà.');
    fs.renameSync(temporaire, sortie);
    surAvancement(1);
    return { sortie, pistes: n + 1 };
  } catch (e) {
    try { fs.rmSync(temporaire, { force: true }); } catch { /* silence-ok: nettoyage du .part, l'erreur d'origine est relancée */ }
    throw e;
  }
}

function toutArreter() {
  for (const p of processus) { try { p.kill(); } catch { /* silence-ok: processus déjà terminé */ } }
  processus.clear();
}

module.exports = { integrerPiste, lireDuree, estPgs, EXTENSIONS_VIDEO, cheminFfmpeg, estVideo, analyserFlux, listerPistes, extrairePiste, toutArreter, executer };
