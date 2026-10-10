'use strict';
// Moteurs de traduction : DeepL (API officielle) et IA locale (Ollama).
// Fabrique sans Electron (fetch, clé et adresses injectés) : testable avec de faux serveurs.
// La clé DeepL reste dans le processus principal : jamais renvoyée à l'interface ni écrite au journal.

const { langue } = require('./langues');

class ErreurMoteur extends Error {
  constructor(message, { definitive = true } = {}) {
    super(message);
    this.name = 'ErreurMoteur';
    this.definitive = definitive; // false = le lot peut être réessayé
  }
}

const TAILLE_REPONSE_MAX = 8 * 1024 * 1024;
const pause = (ms, signal) => new Promise((ok, ko) => {
  const t = setTimeout(ok, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); ko(erreurAnnulation()); }, { once: true });
});
const erreurAnnulation = () => Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });

function signalAvecDelai(signal, ms) {
  const delai = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, delai]) : delai;
}

async function lireJson(reponse) {
  const texte = await reponse.text();
  if (texte.length > TAILLE_REPONSE_MAX) throw new ErreurMoteur('Réponse du moteur anormalement grosse : ignorée.');
  try { return JSON.parse(texte); } catch { throw new ErreurMoteur('Réponse illisible du moteur de traduction.', { definitive: false }); }
}

// --- Échappement XML (DeepL avec tag_handling=xml) -------------------------------

const RE_MARQUEUR = /<[xg]\s+n="\d+"\s*\/>/g; // <x/> : balise de mise en forme, <g/> : terme du glossaire

function versXml(texte) {
  let sortie = '';
  let dernier = 0;
  for (const m of texte.matchAll(RE_MARQUEUR)) {
    sortie += echapper(texte.slice(dernier, m.index)) + m[0];
    dernier = m.index + m[0].length;
  }
  return sortie + echapper(texte.slice(dernier));
}
function echapper(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function depuisXml(t) { return t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'').replace(/&amp;/g, '&'); }

// --- Adresse Ollama ---------------------------------------------------------------

// HTTP en clair seulement vers ce PC ou le réseau local ; ailleurs, HTTPS obligatoire.
function adresseOllamaValide(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.username || u.password || u.search || u.hash) return false;
  if (u.protocol === 'https:') return true;
  if (u.protocol !== 'http:') return false;
  const h = u.hostname.replace(/^\[|\]$/g, '');
  return h === 'localhost' || h === '::1' || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /\.local$/i.test(h);
}

function normaliserAdresse(url) {
  return String(url).trim().replace(/\/+$/, '');
}

// --- Fabrique ----------------------------------------------------------------------

function creerMoteurs({ fetch, lireCleDeepl, urlDeeplTest = null, journal = console }) {
  // ------------------------------------------------------------------ DeepL
  function baseDeepl(cle) {
    if (urlDeeplTest) return urlDeeplTest;
    return cle.trim().endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  }

  async function appelDeepl(chemin, { methode = 'GET', corps = null, signal } = {}) {
    const cle = lireCleDeepl();
    if (!cle) throw new ErreurMoteur('Aucune clé DeepL : ajoutez-la dans l\'écran Moteurs.');
    let tentative = 0;
    for (;;) {
      let r;
      try {
        r = await fetch(`${baseDeepl(cle)}${chemin}`, {
          method: methode,
          headers: { Authorization: `DeepL-Auth-Key ${cle.trim()}`, 'Content-Type': 'application/json', 'User-Agent': 'SubForge' },
          body: corps ? JSON.stringify(corps) : undefined,
          signal: signalAvecDelai(signal, 60000),
        });
      } catch (e) {
        if (signal?.aborted) throw erreurAnnulation();
        if (tentative++ < 2) { await pause(1500 * tentative, signal); continue; }
        throw new ErreurMoteur(`DeepL injoignable (connexion Internet ?) : ${e.cause?.code || e.message}`);
      }
      if (r.ok) return lireJson(r);
      if (r.status === 403 || r.status === 401) throw new ErreurMoteur('Clé DeepL refusée : vérifiez-la dans l\'écran Moteurs.');
      if (r.status === 456) throw new ErreurMoteur('Quota DeepL du mois épuisé : attendez le mois prochain ou utilisez l\'IA locale.');
      if (r.status === 413) throw new ErreurMoteur('Lot trop gros pour DeepL.', { definitive: false });
      if ([429, 500, 502, 503, 504, 529].includes(r.status) && tentative < 4) {
        tentative += 1;
        const attente = Number(r.headers.get?.('retry-after')) * 1000 || 1000 * 2 ** tentative;
        journal.avertissement?.(`DeepL ${r.status}, nouvel essai dans ${attente} ms`);
        await pause(Math.min(attente, 30000), signal);
        continue;
      }
      if (r.status === 400) {
        const d = await r.json().catch(() => ({}));
        throw new ErreurMoteur(`DeepL a refusé la demande : ${String(d.message || 'paramètre invalide').slice(0, 200)}`);
      }
      throw new ErreurMoteur(`DeepL a répondu une erreur (code ${r.status}).`);
    }
  }

  async function usageDeepl() {
    const d = await appelDeepl('/v2/usage');
    return {
      utilises: Number(d.character_count) || 0,
      limite: Number(d.character_limit) || 0,
      offre: lireCleDeepl()?.trim().endsWith(':fx') ? 'gratuite' : 'pro',
    };
  }

  async function traduireDeepl(segments, { source, cible, formalite = 'defaut', contexte = '', signal }) {
    const lc = langue(cible);
    if (!lc?.deeplCible) throw new ErreurMoteur(`DeepL ne traduit pas vers ${lc?.nom || cible} : choisissez l'IA locale.`);
    const ls = source && source !== 'auto' ? langue(source) : null;
    if (ls && !ls.deeplSource) throw new ErreurMoteur(`DeepL ne traduit pas depuis ${ls.nom} : choisissez « Détection automatique » ou l'IA locale.`);
    const corps = {
      text: segments.map(versXml),
      target_lang: lc.deeplCible,
      tag_handling: 'xml',
      split_sentences: 'nonewlines',
      preserve_formatting: true,
    };
    if (ls) corps.source_lang = ls.deeplSource;
    if (formalite === 'formel') corps.formality = 'prefer_more';
    if (formalite === 'informel') corps.formality = 'prefer_less';
    if (contexte) corps.context = contexte.slice(-2000);
    const d = await appelDeepl('/v2/translate', { methode: 'POST', corps, signal });
    if (!Array.isArray(d.translations) || d.translations.length !== segments.length) {
      throw new ErreurMoteur('Réponse DeepL incomplète.', { definitive: false });
    }
    return d.translations.map((t) => depuisXml(String(t.text ?? '')));
  }

  // ------------------------------------------------------------------ Ollama
  async function appelOllama(adresse, chemin, { corps = null, signal, delai = 15000 } = {}) {
    const base = normaliserAdresse(adresse);
    if (!adresseOllamaValide(base)) {
      throw new ErreurMoteur('Adresse de l\'IA locale refusée : http:// seulement vers ce PC ou le réseau local, sinon https://.'); // securite-ok: message d'aide, HTTP limité à ce PC / réseau local (adresseOllamaValide)
    }
    let r;
    try {
      r = await fetch(`${base}${chemin}`, {
        method: corps ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: corps ? JSON.stringify(corps) : undefined,
        signal: signalAvecDelai(signal, delai),
      });
    } catch (e) {
      if (signal?.aborted) throw erreurAnnulation();
      if (e.name === 'TimeoutError') throw new ErreurMoteur('L\'IA locale met trop de temps à répondre (modèle trop gros pour la carte graphique ?).', { definitive: false });
      throw new ErreurMoteur('L\'IA locale ne répond pas : lancez Ollama (icône près de l\'horloge) puis réessayez.');
    }
    if (r.status === 404) {
      const d = await r.json().catch(() => ({}));
      throw new ErreurMoteur(/model/i.test(d.error || '') ? 'Modèle introuvable dans Ollama : choisissez-en un autre dans l\'écran Moteurs.' : 'Ollama ne reconnaît pas cette adresse.');
    }
    if (!r.ok) throw new ErreurMoteur(`L'IA locale a répondu une erreur (code ${r.status}).`, { definitive: r.status < 500 });
    return lireJson(r);
  }

  async function modelesOllama(adresse) {
    const d = await appelOllama(adresse, '/api/tags');
    const modeles = Array.isArray(d.models) ? d.models : [];
    return modeles
      .filter((m) => typeof m?.name === 'string' && !/embed/i.test(m.name))
      .slice(0, 200)
      .map((m) => ({ nom: m.name.slice(0, 200), taille: Number(m.size) || 0 }));
  }

  function consigne(source, cible) {
    const de = source && source !== 'auto' ? langue(source)?.anglais : null;
    const vers = langue(cible)?.anglais || cible;
    return [
      `You are a professional film subtitle translator. Translate each subtitle line ${de ? `from ${de} ` : ''}into ${vers}.`,
      'The input is JSON: "context" holds the previous lines (for reference only, do not translate them) and "lines" maps ids to the text to translate.',
      'Answer ONLY with a JSON object mapping every id from "lines" to its translation. Same ids, no extra keys, no comments.',
      'Keep every marker like <x n="0"/> or <g n="0"/> exactly as written, at the matching place in the sentence. A <g/> marker stands for a name or a fixed term: treat it as a noun.',
      'Write natural spoken dialogue, as short as the original. Keep names unchanged. Never merge or split lines. Never leave a line empty.',
    ].join('\n');
  }

  function extraireObjet(contenu) {
    const t = String(contenu || '').replace(/<think>[\s\S]*?<\/think>/g, '');
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try {
      const o = JSON.parse(t.slice(a, b + 1));
      if (o && typeof o === 'object' && o.lines && typeof o.lines === 'object') return o.lines;
      if (o && typeof o === 'object' && o.translations && typeof o.translations === 'object') return o.translations;
      return o;
    } catch { return null; }
  }

  async function lotOllama(segments, { adresse, modele, source, cible, contexte, signal }) {
    const lignes = {};
    segments.forEach((s, i) => { lignes[String(i + 1)] = s; });
    const d = await appelOllama(adresse, '/api/chat', {
      signal,
      delai: 300000, // premier chargement du modèle en mémoire vidéo : peut être long
      corps: {
        model: modele,
        stream: false,
        format: 'json',
        keep_alive: '10m',
        options: { temperature: 0.2, num_ctx: 8192 },
        messages: [
          { role: 'system', content: consigne(source, cible) },
          { role: 'user', content: JSON.stringify({ context: contexte, lines: lignes }) },
        ],
      },
    });
    const objet = extraireObjet(d?.message?.content);
    return segments.map((s, i) => {
      const v = objet?.[String(i + 1)];
      if (typeof v !== 'string' || v.trim() === '') return null;
      // Un marqueur oublié = un nom ou une mise en forme perdus : réponse refusée, la réplique est redemandée.
      const attendus = (s.match(RE_MARQUEUR) || []).map((m) => m.replace(/\s+/g, ' ')).sort().join();
      const recus = (v.match(RE_MARQUEUR) || []).map((m) => m.replace(/\s+/g, ' ')).sort().join();
      return attendus === recus ? v : { brouillon: v };
    });
  }

  // Lots de 20 ; ce qui manque dans la réponse est redemandé en lots plus petits, puis un par un.
  async function traduireOllama(segments, { adresse, modele, source, cible, contexte = [], signal }) {
    if (!modele) throw new ErreurMoteur('Aucun modèle d\'IA locale choisi : choisissez-en un dans l\'écran Moteurs.');
    const resultats = new Array(segments.length).fill(null);
    const brouillons = new Map(); // réponses où un marqueur manquait : gardées en dernier recours
    async function traiter(indices, taille, essai = 0) {
      for (let k = 0; k < indices.length; k += taille) {
        if (signal?.aborted) throw erreurAnnulation();
        const lot = indices.slice(k, k + taille);
        const ctx = contexte.concat(lot[0] > 0 ? resultats.slice(Math.max(0, lot[0] - 4), lot[0]).filter(Boolean) : []).slice(-4);
        let reponses;
        try {
          reponses = await lotOllama(lot.map((i) => segments[i]), { adresse, modele, source, cible, contexte: ctx, signal });
        } catch (e) {
          if (e.definitive !== false) throw e;
          reponses = lot.map(() => null);
        }
        const manquants = [];
        lot.forEach((i, j) => {
          const r = reponses[j];
          if (typeof r === 'string') resultats[i] = r;
          else { if (r?.brouillon) brouillons.set(i, r.brouillon); manquants.push(i); }
        });
        if (manquants.length) {
          if (taille > 1) await traiter(manquants, Math.max(1, Math.floor(taille / 3)));
          else if (essai < 2) await traiter(manquants, 1, essai + 1);
          else {
            // Dernier recours : la réponse sans tous ses marqueurs (la réplique sera signalée « à vérifier »).
            for (const i of manquants) {
              if (!brouillons.has(i)) throw new ErreurMoteur('L\'IA locale n\'arrive pas à traduire certaines répliques : essayez un autre modèle.');
              resultats[i] = brouillons.get(i);
            }
          }
        }
      }
    }
    await traiter(segments.map((_, i) => i), 20);
    return resultats;
  }

  // ------------------------------------------------------------------ Commun
  // Traduit tous les segments d'un fichier, par lots, en signalant l'avancement.
  async function traduireTout(segments, options, surAvancement = () => {}) {
    const sortie = new Array(segments.length);
    if (options.moteur === 'deepl') {
      let i = 0;
      while (i < segments.length) {
        // Lots de 50 textes au plus (limite DeepL), ~30 Ko pour rester loin de la limite de taille.
        let fin = i;
        let taille = 0;
        while (fin < segments.length && fin - i < 50 && taille + segments[fin].length < 30000) { taille += segments[fin].length; fin += 1; }
        if (fin === i) fin = i + 1;
        const contexte = segments.slice(Math.max(0, i - 3), i).join('\n');
        const t = await traduireDeepl(segments.slice(i, fin), { ...options, contexte });
        t.forEach((v, j) => { sortie[i + j] = v; });
        i = fin;
        surAvancement(i, segments.length);
      }
      return sortie;
    }
    if (options.moteur === 'ollama') {
      const pas = 20; // un lot à la fois : la progression avance à chaque réponse du modèle
      for (let i = 0; i < segments.length; i += pas) {
        const contexte = sortie.slice(Math.max(0, i - 3), i).filter(Boolean);
        const t = await traduireOllama(segments.slice(i, i + pas), { ...options, contexte });
        t.forEach((v, j) => { sortie[i + j] = v; });
        surAvancement(Math.min(i + pas, segments.length), segments.length);
      }
      return sortie;
    }
    throw new ErreurMoteur('Moteur de traduction inconnu.');
  }

  return { usageDeepl, traduireDeepl, modelesOllama, traduireOllama, traduireTout };
}

module.exports = { creerMoteurs, ErreurMoteur, adresseOllamaValide, normaliserAdresse, versXml, depuisXml };
