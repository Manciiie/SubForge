'use strict';
// Contexte du film (T501, D-012) : TMDB donne le titre, le résumé et les personnages (avec leur genre)
// du film ou de l'épisode reconnu d'après le nom du fichier. Ce contexte, en anglais et court, aide
// le moteur et la relecture : accords, noms, tutoiement. Le jeton reste dans le coffre et n'apparaît
// jamais dans une adresse journalisée.
// Sans Electron : testé par tests/contexte.test.js (faux fetch).

const fs = require('fs');
const path = require('path');
const { lireNom } = require('./enligne');

const API = 'https://api.themoviedb.org/3';
const REPONSE_MAX = 2 * 1024 * 1024;
const DELAI_MS = 10000;
const CACHE_JOURS = 30;
const PERSONNAGES_MAX = 20;

class ErreurContexte extends Error {
  constructor(m, { refuse = false } = {}) { super(m); this.name = 'ErreurContexte'; this.refuse = refuse; }
}

const normaliser = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/^(the|le|la|les) /, '').trim();
// Texte venu d'Internet : sans caractères de contrôle, sans retours à la ligne multiples, coupé.
const propre = (s, max) => String(s || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const anneeDe = (date) => (/^\d{4}/.test(String(date || '')) ? Number(String(date).slice(0, 4)) : null);
const GENRES = { 1: 'female', 2: 'male', 3: 'non-binary' };

// Jeton v4 (« Jeton d'accès en lecture », JWT) → en-tête ; clé v3 (32 caractères hexadécimaux) → paramètre.
function formeJeton(jeton) {
  const j = String(jeton || '').trim();
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(j)) return 'bearer';
  if (/^[a-f0-9]{32}$/i.test(j)) return 'cle';
  return null;
}

function creerContexte({ fetch, lireJeton, fichierCache, urlTest = null, journal = console }) {
  let cache = null; // { choix: { cle: ref | null }, details: { refCle: { date, contexte } } }

  function chargerCache() {
    if (cache) return cache;
    cache = { choix: {}, details: {} };
    try {
      const o = JSON.parse(fs.readFileSync(fichierCache, 'utf8'));
      if (o && typeof o.choix === 'object') cache.choix = o.choix;
      if (o && typeof o.details === 'object') cache.details = o.details;
    } catch (e) {
      if (e.code !== 'ENOENT') journal.avertissement?.('[contexte] cache illisible, recréé :', e.message);
    }
    return cache;
  }
  function sauverCache() {
    try {
      const tmp = `${fichierCache}.${process.pid}.tmp`;
      fs.mkdirSync(path.dirname(fichierCache), { recursive: true });
      fs.writeFileSync(tmp, JSON.stringify(cache), 'utf8');
      fs.renameSync(tmp, fichierCache);
    } catch (e) {
      journal.erreur?.('[contexte] cache non enregistré :', e.message); // simple cache : on continue
    }
  }

  async function appel(chemin, parametres = {}, { signal } = {}) {
    const jeton = lireJeton();
    const forme = formeJeton(jeton);
    if (!jeton) throw new ErreurContexte('Aucun jeton TMDB : ajoutez-le dans l\'écran Moteurs (il est gratuit).');
    if (!forme) throw new ErreurContexte('Le jeton TMDB enregistré n\'a pas la bonne forme : remplacez-le dans l\'écran Moteurs.', { refuse: true });
    const url = new URL(`${urlTest || API}${chemin}`);
    for (const [k, v] of Object.entries(parametres)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    const enTetes = { Accept: 'application/json' };
    if (forme === 'bearer') enTetes.Authorization = `Bearer ${jeton.trim()}`;
    else url.searchParams.set('api_key', jeton.trim());
    let r;
    try {
      r = await fetch(url.toString(), {
        headers: enTetes,
        redirect: 'error',
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(DELAI_MS)]) : AbortSignal.timeout(DELAI_MS),
      });
    } catch (e) {
      if (signal?.aborted) throw Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });
      if (e.name === 'TimeoutError') throw new ErreurContexte('TMDB met trop de temps à répondre.');
      throw new ErreurContexte('TMDB est injoignable : vérifiez la connexion à Internet.');
    }
    const texte = await r.text();
    if (texte.length > REPONSE_MAX) throw new ErreurContexte('Réponse de TMDB anormalement grosse : ignorée.');
    let d = null;
    try { d = JSON.parse(texte); } catch { d = null; } // silence-ok: réponse non JSON traitée juste en dessous
    if (r.ok && d) return d;
    if (r.status === 401) throw new ErreurContexte('TMDB refuse le jeton : vérifiez-le dans l\'écran Moteurs.', { refuse: true });
    if (r.status === 404) throw new ErreurContexte('Introuvable sur TMDB.');
    if (r.status === 429) throw new ErreurContexte('Trop de demandes à TMDB : réessayez dans quelques secondes.');
    throw new ErreurContexte(`TMDB a refusé la demande (code ${r.status}).`);
  }

  async function tester() {
    await appel('/authentication');
    return true;
  }

  // Recherche libre (fenêtre « Choisir le film ») : films et séries mêlés, titres en français.
  async function chercher(texte, { signal } = {}) {
    const lu = lireNom(`${texte}.mkv`);
    const requete = lu.titre || String(texte).trim();
    if (!requete) return [];
    const d = await appel('/search/multi', { query: requete, language: 'fr-FR', include_adult: 'false' }, { signal });
    return (Array.isArray(d.results) ? d.results : [])
      .filter((x) => x && (x.media_type === 'movie' || x.media_type === 'tv') && Number.isInteger(x.id))
      .slice(0, 15)
      .map((x) => ({
        type: x.media_type === 'movie' ? 'film' : 'serie',
        id: x.id,
        titre: propre(x.title || x.name, 200),
        original: propre(x.original_title || x.original_name, 200),
        annee: anneeDe(x.release_date || x.first_air_date),
        resume: propre(x.overview, 300),
      }));
  }

  // Reconnaissance automatique : titre identique (original ou traduit), année à ±1 an près si connue.
  async function reconnaitre(lu, { signal } = {}) {
    if (!lu.titre || lu.titre.length < 2) return null;
    const serie = lu.saison !== undefined;
    const d = await appel(serie ? '/search/tv' : '/search/movie', {
      query: lu.titre, language: 'en-US', include_adult: 'false',
      ...(serie ? {} : { year: lu.annee }),
    }, { signal });
    const cible = normaliser(lu.titre);
    const resultats = Array.isArray(d.results) ? d.results : [];
    const bon = resultats.find((x) => {
      const titres = [x.title, x.original_title, x.name, x.original_name].map(normaliser);
      const an = anneeDe(x.release_date || x.first_air_date);
      return titres.includes(cible) && (!lu.annee || !an || Math.abs(an - lu.annee) <= 1);
    });
    return bon && Number.isInteger(bon.id) ? { type: serie ? 'serie' : 'film', id: bon.id } : null;
  }

  async function details(ref, lu, { signal } = {}) {
    const cle = `${ref.type}:${ref.id}${ref.type === 'serie' && lu.saison !== undefined ? `:${lu.saison}:${lu.episode}` : ''}`;
    const c = chargerCache();
    const deja = c.details[cle];
    if (deja && Date.now() - deja.date < CACHE_JOURS * 86400000) return deja.contexte;
    let contexte;
    if (ref.type === 'film') {
      const d = await appel(`/movie/${ref.id}`, { language: 'en-US', append_to_response: 'credits' }, { signal });
      contexte = {
        type: 'film', id: ref.id, titre: propre(d.title, 200), annee: anneeDe(d.release_date), resume: propre(d.overview, 700),
        personnages: personnages((d.credits?.cast || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map((x) => ({ personnage: x.character, acteur: x.name, genre: x.gender }))),
      };
    } else {
      const d = await appel(`/tv/${ref.id}`, { language: 'en-US', append_to_response: 'aggregate_credits' }, { signal });
      let episode = null;
      let invites = [];
      if (lu.saison !== undefined) {
        try {
          const e = await appel(`/tv/${ref.id}/season/${lu.saison}/episode/${lu.episode}`, { language: 'en-US' }, { signal });
          episode = { saison: lu.saison, episode: lu.episode, titre: propre(e.name, 200), resume: propre(e.overview, 500) };
          invites = (e.guest_stars || []).map((x) => ({ personnage: x.character, acteur: x.name, genre: x.gender }));
        } catch (err) {
          if (err.name === 'AbortError') throw err;
          journal.avertissement?.(`[contexte] épisode S${lu.saison}E${lu.episode} introuvable : contexte de la série seule`);
        }
      }
      const reguliers = (d.aggregate_credits?.cast || []).slice().sort((a, b) => (b.total_episode_count || 0) - (a.total_episode_count || 0))
        .map((x) => ({ personnage: (x.roles || []).slice().sort((a, b) => (b.episode_count || 0) - (a.episode_count || 0))[0]?.character, acteur: x.name, genre: x.gender }));
      contexte = {
        type: 'serie', id: ref.id, titre: propre(d.name, 200), annee: anneeDe(d.first_air_date), resume: propre(d.overview, 500),
        episode, personnages: personnages([...invites, ...reguliers]),
      };
    }
    c.details[cle] = { date: Date.now(), contexte };
    sauverCache();
    return contexte;
  }

  // Clé du choix : même dossier + même titre lu → tous les épisodes d'une série suivent.
  const cleChoix = (chemin, lu) => `${path.dirname(chemin).toLowerCase()}|${normaliser(lu.titre)}`;

  // Contexte d'un fichier : { etat: 'trouve', contexte } | { etat: 'inconnu', recherche } | { etat: 'aucun' } (choisi « sans contexte »).
  async function pour(chemin, { signal } = {}) {
    const lu = lireNom(chemin);
    const c = chargerCache();
    const cle = cleChoix(chemin, lu);
    let ref;
    if (Object.prototype.hasOwnProperty.call(c.choix, cle)) {
      ref = c.choix[cle];
      if (ref === null) return { etat: 'aucun' };
    } else {
      ref = await reconnaitre(lu, { signal });
      if (!ref) return { etat: 'inconnu', recherche: lu.titre || path.basename(chemin, path.extname(chemin)) };
    }
    return { etat: 'trouve', contexte: await details(ref, lu, { signal }) };
  }

  // Choix manuel (ou null = sans contexte), mémorisé pour le dossier.
  function choisir(chemin, ref) {
    const c = chargerCache();
    c.choix[cleChoix(chemin, lireNom(chemin))] = ref ? { type: ref.type, id: ref.id } : null;
    sauverCache();
  }

  return { tester, chercher, pour, choisir };
}

function personnages(liste) {
  const vus = new Set();
  const sortie = [];
  for (const x of liste) {
    const nom = propre(String(x.personnage || '').replace(/\s*\((?:voice|uncredited)\)\s*/gi, ' '), 80);
    if (!nom || vus.has(nom.toLowerCase())) continue;
    vus.add(nom.toLowerCase());
    sortie.push({ personnage: nom, acteur: propre(x.acteur, 80), genre: GENRES[x.genre] || null });
    if (sortie.length >= PERSONNAGES_MAX) break;
  }
  return sortie;
}

// Texte envoyé aux moteurs (anglais, ≤ max caractères).
function texteContexte(c, max = 1500) {
  if (!c) return '';
  const tete = c.type === 'serie'
    ? `TV series "${c.titre}"${c.annee ? ` (${c.annee})` : ''}${c.episode ? `, season ${c.episode.saison} episode ${c.episode.episode}${c.episode.titre ? ` "${c.episode.titre}"` : ''}` : ''}.`
    : `Film "${c.titre}"${c.annee ? ` (${c.annee})` : ''}.`;
  const resume = c.episode?.resume || c.resume;
  const perso = c.personnages.map((p) => `${p.personnage}${p.genre ? ` (${p.genre})` : ''}`).join(', ');
  let t = [tete, resume ? `Synopsis: ${resume}` : '', perso ? `Characters: ${perso}.` : ''].filter(Boolean).join(' ');
  if (t.length > max) t = `${t.slice(0, max - 1)}…`;
  return t;
}

module.exports = { creerContexte, texteContexte, formeJeton, ErreurContexte };
