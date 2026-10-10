'use strict';
// Sous-titres en ligne : API REST d'OpenSubtitles.com. Recherche par empreinte du film (exacte) et par
// titre / saison / épisode tirés du nom du fichier, puis téléchargement à côté du film.
// Fabrique sans Electron (fetch, secrets injectés) : testée avec un faux serveur (tests/enligne.test.js).
// La clé d'API et le mot de passe restent dans le processus principal : jamais renvoyés à l'interface.

const fs = require('fs');
const path = require('path');

const API = 'https://api.opensubtitles.com/api/v1';
const TAILLE_MAX = 20 * 1024 * 1024;
const REPONSE_MAX = 4 * 1024 * 1024;

// Langues de SubForge → codes OpenSubtitles.
const CODES_OS = {
  en: 'en', 'en-GB': 'en', fr: 'fr', es: 'es', de: 'de', it: 'it', pt: 'pt-PT', 'pt-BR': 'pt-BR', nl: 'nl', pl: 'pl',
  ru: 'ru', uk: 'uk', ja: 'ja', zh: 'zh-CN', 'zh-Hant': 'zh-TW', ko: 'ko', ar: 'ar', tr: 'tr', sv: 'sv', da: 'da',
  fi: 'fi', nb: 'no', cs: 'cs', el: 'el', hu: 'hu', ro: 'ro', bg: 'bg', sk: 'sk', sl: 'sl', et: 'et', lv: 'lv',
  lt: 'lt', id: 'id', he: 'he', vi: 'vi', th: 'th', hi: 'hi',
};

class ErreurEnLigne extends Error {
  constructor(m) { super(m); this.name = 'ErreurEnLigne'; }
}

// Empreinte OpenSubtitles : taille + somme des mots de 64 bits des 64 premiers et 64 derniers Ko.
function empreinte(chemin) {
  const taille = fs.statSync(chemin).size;
  if (taille < 131072) return null; // trop petit : recherche par nom seulement
  const fd = fs.openSync(chemin, 'r');
  try {
    const bloc = Buffer.alloc(65536);
    let somme = BigInt(taille);
    for (const position of [0, taille - 65536]) {
      fs.readSync(fd, bloc, 0, 65536, position);
      for (let i = 0; i < 65536; i += 8) somme += bloc.readBigUInt64LE(i);
    }
    return BigInt.asUintN(64, somme).toString(16).padStart(16, '0');
  } finally {
    fs.closeSync(fd);
  }
}

const ETIQUETTES = /\b(2160p|1080p|720p|480p|4k|uhd|hdr|bluray|blu-ray|brrip|bdrip|webrip|web-dl|web|hdtv|dvdrip|remux|x264|x265|h264|h265|hevc|aac|ac3|dts|multi|truefrench|french|vostfr|proper|repack|extended|unrated)\b/i;

// « The.Office.S02E05.720p.mkv » → { titre: 'The Office', saison: 2, episode: 5 } ; « Heat.1995.1080p » → { titre: 'Heat', annee: 1995 }
function lireNom(chemin) {
  let nom = path.basename(chemin, path.extname(chemin)).replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
  const r = {};
  const ep = /\bS(\d{1,2})\s?E(\d{1,3})\b|\b(\d{1,2})x(\d{2})\b/i.exec(nom);
  if (ep) {
    r.saison = Number(ep[1] ?? ep[3]);
    r.episode = Number(ep[2] ?? ep[4]);
    nom = nom.slice(0, ep.index);
  }
  const an = /(?:^|\s|\()((?:19|20)\d{2})(?:\)|\s|$)/.exec(nom);
  if (an && an.index > 0) { r.annee = Number(an[1]); nom = nom.slice(0, an.index); }
  const etiquette = ETIQUETTES.exec(nom);
  if (etiquette && etiquette.index > 0) nom = nom.slice(0, etiquette.index);
  r.titre = nom.replace(/[[(][^\])]*[\])]/g, ' ').replace(/\s+-\s*$/, '').replace(/\s+/g, ' ').trim();
  return r;
}

const normaliser = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/^(the|le|la|les) /, '').trim();

// Choix sans intervention : empreinte identique, ou même saison + épisode, ou même titre (+ année) pour un film.
// Jamais une traduction automatique ni un sous-titre en plusieurs CD. Sinon : null (à choisir à la main).
function choisirAutomatiquement(recherche, resultats) {
  const candidats = resultats.filter((r) => !r.traductionAuto && !r.plusieursCd);
  const exact = candidats.find((r) => r.exact);
  if (exact) return { resultat: exact, raison: 'empreinte identique au fichier' };
  if (recherche.saison !== undefined) {
    const ep = candidats.find((r) => r.saison === recherche.saison && r.episode === recherche.episode);
    return ep ? { resultat: ep, raison: `saison ${recherche.saison}, épisode ${recherche.episode}` } : null;
  }
  const titre = normaliser(recherche.titre);
  if (!titre) return null;
  const film = candidats.find((r) => r.saison === null && (normaliser(r.titre) === titre)
    && (!recherche.annee || !r.annee || r.annee === recherche.annee));
  return film ? { resultat: film, raison: `même titre${film.annee ? ` (${film.annee})` : ''}` } : null;
}

function creerEnLigne({ fetch, lireSecrets, utilisateur = () => '', version = '1.0.0', urlTest = null, journal = console }) {
  let jeton = null; // { valeur, base, expire, quota }

  const enTetes = (cle, avecJeton) => {
    const h = { 'Api-Key': cle, 'User-Agent': `SubForge v${version}`, Accept: 'application/json', 'Content-Type': 'application/json' };
    if (avecJeton && jeton) h.Authorization = `Bearer ${jeton.valeur}`;
    return h;
  };

  // Adresse renvoyée par la connexion (ex. vip-api.opensubtitles.com) : acceptée seulement chez OpenSubtitles.
  function baseDepuis(hote) {
    if (urlTest) return urlTest;
    if (typeof hote === 'string' && /^[a-z0-9.-]+\.opensubtitles\.com$/i.test(hote)) return `https://${hote}/api/v1`;
    return API;
  }

  async function appel(chemin, { methode = 'GET', corps = null, avecJeton = true, signal } = {}) {
    const { cle } = lireSecrets();
    if (!cle) throw new ErreurEnLigne('Aucune clé d\'API OpenSubtitles : ajoutez-la dans l\'écran Moteurs (elle est gratuite).');
    const base = avecJeton && jeton ? jeton.base : (urlTest || API);
    let r;
    try {
      r = await fetch(`${base}${chemin}`, {
        method: methode,
        headers: enTetes(cle, avecJeton),
        body: corps ? JSON.stringify(corps) : undefined,
        redirect: 'follow',
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
      });
    } catch (e) {
      if (signal?.aborted) throw Object.assign(new Error('Recherche annulée.'), { name: 'AbortError' });
      if (e.name === 'TimeoutError') throw new ErreurEnLigne('OpenSubtitles met trop de temps à répondre : réessayez plus tard.');
      throw new ErreurEnLigne('OpenSubtitles est injoignable : vérifiez la connexion à Internet.');
    }
    const texte = await r.text();
    if (texte.length > REPONSE_MAX) throw new ErreurEnLigne('Réponse d\'OpenSubtitles anormalement grosse : ignorée.');
    let d = null;
    try { d = texte ? JSON.parse(texte) : {}; } catch { d = null; } // réponse non JSON : traitée juste en dessous selon le code
    if (r.ok && d) return d;
    const detail = String(d?.message || d?.errors?.[0] || '').slice(0, 200);
    if (r.status === 401 || r.status === 403) throw new ErreurEnLigne(`OpenSubtitles refuse la clé d'API ou le compte${detail ? ` (${detail})` : ''} : vérifiez-les dans l'écran Moteurs.`);
    if (r.status === 406) throw Object.assign(new ErreurEnLigne(`Quota de téléchargements du jour atteint${d?.reset_time ? ` (de nouveau possible dans ${d.reset_time})` : ''}. Un compte OpenSubtitles gratuit en donne davantage.`), { quota: true });
    if (r.status === 429) throw new ErreurEnLigne('Trop de demandes à OpenSubtitles : patientez quelques secondes puis réessayez.');
    if (r.status >= 500) throw new ErreurEnLigne('OpenSubtitles a un problème en ce moment : réessayez plus tard.');
    if (!d) throw new ErreurEnLigne('Réponse illisible d\'OpenSubtitles.');
    throw new ErreurEnLigne(`OpenSubtitles a refusé la demande (code ${r.status})${detail ? ` : ${detail}` : ''}.`);
  }

  async function connecter({ forcer = false } = {}) {
    const { motDePasse } = lireSecrets();
    const nom = utilisateur();
    if (!nom || !motDePasse) { jeton = null; return null; }
    if (jeton && !forcer && jeton.expire > Date.now()) return jeton;
    const d = await appel('/login', { methode: 'POST', corps: { username: nom, password: motDePasse }, avecJeton: false });
    if (typeof d.token !== 'string' || !d.token) throw new ErreurEnLigne('Connexion à OpenSubtitles impossible (réponse sans jeton).');
    jeton = { valeur: d.token, base: baseDepuis(d.base_url), expire: Date.now() + 20 * 3600 * 1000, quota: d.user?.allowed_downloads ?? null };
    journal.info?.('[en ligne] connecté à OpenSubtitles');
    return jeton;
  }

  async function tester() {
    const j = await connecter({ forcer: true });
    if (j) return { connecte: true, quota: j.quota };
    await appel('/infos/formats', { avecJeton: false });
    return { connecte: false, quota: null };
  }

  async function chercher(chemin, { langue, signal } = {}) {
    const code = CODES_OS[langue];
    if (!code) throw new ErreurEnLigne('Langue non proposée par OpenSubtitles.');
    await connecter();
    const nom = lireNom(chemin);
    const hash = empreinte(chemin);
    const params = { languages: code };
    if (hash) params.moviehash = hash;
    if (nom.titre) params.query = nom.titre.toLowerCase();
    if (nom.annee) params.year = String(nom.annee);
    if (nom.saison !== undefined) { params.season_number = String(nom.saison); params.episode_number = String(nom.episode); }
    if (!params.moviehash && !params.query) throw new ErreurEnLigne('Impossible de deviner le titre du film à partir du nom du fichier.');
    // L'API demande des paramètres triés par ordre alphabétique (sinon elle redirige).
    const qs = Object.keys(params).sort().map((k) => `${k}=${encodeURIComponent(params[k])}`).join('&');
    const d = await appel(`/subtitles?${qs}`, { signal });
    const items = Array.isArray(d.data) ? d.data : [];
    const resultats = [];
    for (const it of items.slice(0, 60)) {
      const a = it?.attributes || {};
      const f = Array.isArray(a.files) ? a.files[0] : null;
      if (!f || !Number.isInteger(f.file_id)) continue;
      resultats.push({
        fileId: f.file_id,
        nomFichier: String(f.file_name || a.release || '').slice(0, 200),
        version: String(a.release || '').slice(0, 200),
        langue: String(a.language || '').slice(0, 10),
        telechargements: Number(a.download_count) || 0,
        exact: a.moviehash_match === true,
        malentendants: a.hearing_impaired === true,
        traductionAuto: a.machine_translated === true || a.ai_translated === true,
        titre: String(a.feature_details?.title || a.feature_details?.movie_name || '').slice(0, 200),
        annee: Number(a.feature_details?.year) || null,
        serie: String(a.feature_details?.parent_title || '').slice(0, 200),
        saison: Number.isInteger(a.feature_details?.season_number) ? a.feature_details.season_number : null,
        episode: Number.isInteger(a.feature_details?.episode_number) ? a.feature_details.episode_number : null,
        plusieursCd: (a.files?.length || 0) > 1,
      });
    }
    resultats.sort((x, y) => (y.exact - x.exact) || (x.traductionAuto - y.traductionAuto) || (y.telechargements - x.telechargements));
    return { recherche: { ...nom, empreinte: Boolean(hash), langue: code }, resultats: resultats.slice(0, 30) };
  }

  // Télécharge le fichier choisi et l'écrit à côté du film. Renvoie le chemin écrit et le quota restant.
  async function telecharger(cheminFilm, fileId, { langue, ecrire, signal } = {}) {
    await connecter();
    const d = await appel('/download', { methode: 'POST', corps: { file_id: fileId }, signal });
    let lien;
    try { lien = new URL(String(d.link || '')); } catch { throw new ErreurEnLigne('Lien de téléchargement invalide.'); }
    const hoteOk = urlTest ? lien.origin === new URL(urlTest).origin : (lien.protocol === 'https:' && /(^|\.)opensubtitles\.(com|org)$/i.test(lien.hostname));
    if (!hoteOk) throw new ErreurEnLigne('Lien de téléchargement refusé (il ne mène pas chez OpenSubtitles).');
    let r;
    try {
      r = await fetch(lien.href, { headers: { 'User-Agent': `SubForge v${version}` }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000) });
    } catch (e) {
      if (signal?.aborted) throw Object.assign(new Error('Téléchargement annulé.'), { name: 'AbortError' });
      throw new ErreurEnLigne('Téléchargement du sous-titre impossible : vérifiez la connexion à Internet.');
    }
    if (!r.ok) throw new ErreurEnLigne(`Téléchargement du sous-titre refusé (code ${r.status}).`);
    const longueur = Number(r.headers.get?.('content-length')) || 0;
    if (longueur > TAILLE_MAX) throw new ErreurEnLigne('Fichier reçu trop gros pour un sous-titre : refusé.');
    const contenu = Buffer.from(await r.arrayBuffer());
    if (contenu.length > TAILLE_MAX) throw new ErreurEnLigne('Fichier reçu trop gros pour un sous-titre : refusé.');
    if (contenu.length === 0) throw new ErreurEnLigne('Fichier reçu vide.');
    if (contenu[0] === 0x1f && contenu[1] === 0x8b) throw new ErreurEnLigne('Fichier reçu compressé : format non pris en charge.');
    if (contenu[0] === 0x50 && contenu[1] === 0x4b) throw new ErreurEnLigne('Fichier reçu dans une archive zip : format non pris en charge.');
    const ext = (/\.(srt|ass|ssa|vtt)$/i.exec(String(d.file_name || ''))?.[0] || '.srt').toLowerCase();
    const fichier = ecrire(cheminFilm, contenu, ext, langue); // validation du contenu + écriture atomique (appelant)
    return { fichier, restants: Number.isFinite(d.remaining) ? d.remaining : null, reinitialisation: d.reset_time || null };
  }

  // Saison entière : recherche puis téléchargement seulement si le choix est sûr (voir choisirAutomatiquement).
  async function automatique(cheminFilm, { langue, ecrire, signal } = {}) {
    const { recherche, resultats } = await chercher(cheminFilm, { langue, signal });
    const choix = choisirAutomatiquement(recherche, resultats);
    if (!choix) {
      return { statut: 'incertain', raison: resultats.length ? `${resultats.length} résultat(s), aucun sûr : choisissez à la main` : 'aucun résultat dans cette langue' };
    }
    const t = await telecharger(cheminFilm, choix.resultat.fileId, { langue, ecrire, signal });
    return { statut: 'telecharge', raison: choix.raison, ...t };
  }

  function deconnecter() { jeton = null; }

  return { tester, chercher, telecharger, automatique, deconnecter, lireNom };
}

module.exports = { creerEnLigne, choisirAutomatiquement, empreinte, lireNom, CODES_OS, ErreurEnLigne };
