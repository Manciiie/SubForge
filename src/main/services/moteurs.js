'use strict';
// Moteurs de traduction : DeepL (API officielle) et IA locale (Ollama).
// Fabrique sans Electron (fetch, clé et adresses injectés) : testable avec de faux serveurs.
// La clé DeepL reste dans le processus principal : jamais renvoyée à l'interface ni écrite au journal.

const { langue } = require('./langues');
const { enParallele } = require('./limite');

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

// Réponse « traduite » identique à l'original (le modèle a recopié au lieu de traduire).
// Seules les répliques d'au moins deux mots comptent : « Ja-yoon ! » ou « OK. » restent souvent tels quels.
const normaliser = (t) => String(t || '').replace(RE_MARQUEUR, ' ').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const nombreMots = (t) => normaliser(t).split(' ').filter((m) => /\p{L}{2,}/u.test(m)).length;
function nonTraduit(original, traduction) {
  return nombreMots(original) >= 2 && normaliser(original) === normaliser(traduction);
}
// Réponse dans une autre écriture (ex. chinois au lieu de français) : refusée.
const RE_ASIE = /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]/u;
// Tutoiement / vouvoiement (T401) : langues qui distinguent une forme familière et une forme polie.
const FORMES_ADRESSE = {
  fr: ['tu', 'vous'], de: ['du', 'Sie'], es: ['tú', 'usted'], it: ['tu', 'Lei'], pt: ['tu/você', 'o senhor/a senhora'],
  nl: ['jij', 'u'], pl: ['ty', 'Pan/Pani'], ru: ['ты', 'вы'],
};
const formesAdresse = (cible) => FORMES_ADRESSE[String(cible).split('-')[0]] || null;

function consigneRegistre(registre, cible) {
  const f = formesAdresse(cible);
  if (!f) return null;
  if (registre === 'tu') return `When a single person is addressed, always use the informal form ("${f[0]}"); use the plural only when several people are addressed.`;
  if (registre === 'vous') return `Always address people with the formal form ("${f[1]}").`;
  return `Choose the informal ("${f[0]}") or formal ("${f[1]}") form of address from the relationship between the characters, and keep the same choice every time the same character speaks to the same person.`;
}

// Aides « expressions » (expressions.js) → texte lu par le moteur. Le moteur juge si l'expression est
// bien employée au sens figuré dans la réplique.
function texteAides(aides, vers) {
  return aides.map((a) => {
    const parts = [`"${a.texte}"`];
    if (a.sens) parts.push(`is an idiom meaning "${a.sens}"`);
    else parts.push('is an idiom');
    if (a.equivalent) parts.push(`(natural ${vers} equivalent: "${a.equivalent}")`);
    return `${parts.join(' ')}.`;
  }).join(' ');
}
function mauvaiseEcriture(original, traduction, cible) {
  return !['zh', 'ja', 'ko'].includes(String(cible).split('-')[0]) && RE_ASIE.test(traduction) && !RE_ASIE.test(original);
}

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

  async function traduireDeepl(segments, { source, cible, formalite = 'defaut', registre = 'auto', contexte = '', contexteFilm = '', aides = null, signal }) {
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
    // Tu / vous imposé (T401) ; sinon le ton choisi dans Moteurs. « prefer_* » est ignoré sans erreur
    // par DeepL pour les langues sans forme polie.
    const ton = registre === 'tu' ? 'informel' : registre === 'vous' ? 'formel' : formalite;
    if (ton === 'formel') corps.formality = 'prefer_more';
    if (ton === 'informel') corps.formality = 'prefer_less';
    // Expressions : leur sens va dans le contexte (lu par DeepL, jamais traduit ni facturé).
    const lesAides = (aides || []).flat().filter(Boolean);
    const vers = langue(cible)?.anglais || cible;
    const noteAides = lesAides.length ? `Translate idioms by their meaning, not word for word: ${texteAides(lesAides, vers)}` : '';
    // Contexte : film (≤ 600 caractères), répliques précédentes, sens des expressions ; 2 000 au total.
    const film = contexteFilm ? contexteFilm.slice(0, 600) : '';
    const place = Math.max(200, 2000 - film.length - Math.min(1000, noteAides.length));
    const leContexte = [film, contexte.slice(-place), noteAides.slice(0, 1000)].filter(Boolean).join('\n');
    if (leContexte) corps.context = leContexte;
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

  function consigne(source, cible, registre = 'auto', contexteFilm = '') {
    const de = source && source !== 'auto' ? langue(source)?.anglais : null;
    const vers = langue(cible)?.anglais || cible;
    return [
      `You are a professional film subtitle translator. You translate subtitle lines ${de ? `from ${de} ` : ''}into ${vers}.`,
      `Every translation MUST be written in ${vers}. Never copy the original text unchanged.`,
      'Answer ONLY with a JSON object mapping each line number to its translation, for example {"1": "...", "2": "..."}. Same numbers, no extra keys, no comments.',
      'Keep every marker like <x n="0"/> or <g n="0"/> exactly as written, at the matching place in the sentence. A <g/> marker stands for a name or a fixed term: treat it as a noun.',
      'Write natural spoken dialogue, as short as the original. Keep names unchanged. Never merge or split lines. Never leave a line empty.',
      `Translate idioms, slang, sayings and wordplay by a natural ${vers} expression with the same meaning and tone, never word for word.`,
      consigneRegistre(registre, cible),
      contexteFilm ? `About the film (for gender agreement, names and forms of address; never translate this note): ${contexteFilm}` : null,
    ].filter(Boolean).join('\n');
  }

  // Demande en texte simple (une ligne numérotée par réplique, en chaîne JSON) : un objet JSON en
  // entrée était parfois recopié tel quel par les petits modèles, donc renvoyé sans traduction.
  function demande(segments, contexte, cible, aides = []) {
    const vers = langue(cible)?.anglais || cible;
    const parties = [];
    if (contexte.length) parties.push('Previous lines, for context only (do not translate them):', ...contexte.map((c) => `- ${JSON.stringify(c)}`), '');
    parties.push(`Translate these ${segments.length} subtitle line(s) into ${vers}:`);
    segments.forEach((t, i) => parties.push(`${i + 1}. ${JSON.stringify(t)}`));
    const notes = segments.map((_, i) => (aides[i]?.length ? `- line ${i + 1}: ${texteAides(aides[i], vers)}` : null)).filter(Boolean);
    if (notes.length) parties.push('', 'Idioms in these lines (translate them by their meaning if used figuratively here):', ...notes);
    parties.push('', `Answer with the JSON object of the ${vers} translations only.`);
    return parties.join('\n');
  }

  function extraireObjet(contenu) {
    const t = String(contenu || '').replace(/<think>[\s\S]*?<\/think>/g, '');
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try {
      const o = JSON.parse(t.slice(a, b + 1));
      if (o && typeof o === 'object' && o.translations && typeof o.translations === 'object') return o.translations;
      return o;
    } catch { return null; } // silence-ok: réponse illisible = répliques redemandées par l'appelant
  }

  async function lotOllama(segments, { adresse, modele, source, cible, registre, contexteFilm, contexte, aides = [], signal }) {
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
          { role: 'system', content: consigne(source, cible, registre, contexteFilm) },
          { role: 'user', content: demande(segments, contexte, cible, aides) },
        ],
      },
    });
    const objet = extraireObjet(d?.message?.content);
    return segments.map((s, i) => {
      const v = objet?.[String(i + 1)];
      if (typeof v !== 'string' || v.trim() === '') return null;
      // Recopiée sans traduction ou écrite dans une autre langue : redemandée, gardée en dernier recours.
      if (nonTraduit(s, v) || mauvaiseEcriture(s, v, cible)) return { brouillon: v, recopie: true };
      // Un marqueur oublié = un nom ou une mise en forme perdus : réponse refusée, la réplique est redemandée.
      const attendus = (s.match(RE_MARQUEUR) || []).map((m) => m.replace(/\s+/g, ' ')).sort().join();
      const recus = (v.match(RE_MARQUEUR) || []).map((m) => m.replace(/\s+/g, ' ')).sort().join();
      return attendus === recus ? v : { brouillon: v };
    });
  }

  // Lots de 20 ; ce qui manque dans la réponse est redemandé en lots plus petits, puis un par un.
  async function traduireOllama(segments, { adresse, modele, source, cible, registre, contexteFilm, contexte = [], aides = null, limite = null, signal }) {
    if (!modele) throw new ErreurMoteur('Aucun modèle d\'IA locale choisi : choisissez-en un dans l\'écran Moteurs.');
    const resultats = new Array(segments.length).fill(null);
    const brouillons = new Map(); // réponses imparfaites (marqueur perdu, recopiée) : gardées en dernier recours
    let recopiees = 0; // répliques que le modèle refuse de traduire même une par une
    async function traiter(indices, taille, essai = 0) {
      for (let k = 0; k < indices.length; k += taille) {
        if (signal?.aborted) throw erreurAnnulation();
        const lot = indices.slice(k, k + taille);
        const ctx = contexte.concat(lot[0] > 0 ? resultats.slice(Math.max(0, lot[0] - 4), lot[0]).filter(Boolean) : []).slice(-4);
        let reponses;
        try {
          const demander = () => lotOllama(lot.map((i) => segments[i]), { adresse, modele, source, cible, registre, contexteFilm, contexte: ctx, aides: lot.map((i) => aides?.[i] || []), signal });
          reponses = await (limite ? limite.prendre(demander) : demander());
        } catch (e) {
          if (e.definitive !== false) throw e;
          reponses = lot.map(() => null);
        }
        const manquants = [];
        lot.forEach((i, j) => {
          const r = reponses[j];
          if (typeof r === 'string') resultats[i] = r;
          else { if (r?.brouillon) brouillons.set(i, { texte: r.brouillon, recopie: r.recopie === true }); manquants.push(i); }
        });
        if (manquants.length) {
          if (taille > 1) await traiter(manquants, Math.max(1, Math.floor(taille / 3)));
          else if (essai < 2) await traiter(manquants, 1, essai + 1);
          else {
            // Dernier recours : la réponse sans tous ses marqueurs (la réplique sera signalée « à vérifier »).
            for (const i of manquants) {
              if (!brouillons.has(i)) throw new ErreurMoteur('L\'IA locale n\'arrive pas à traduire certaines répliques : essayez un autre modèle.');
              const b = brouillons.get(i);
              if (b.recopie && ++recopiees >= 8) {
                throw new ErreurMoteur(`Le modèle d'IA locale « ${modele} » renvoie les répliques sans les traduire. Choisissez un autre modèle dans l'écran Moteurs (conseillé : qwen2.5:7b, à installer avec : ollama pull qwen2.5:7b).`);
              }
              resultats[i] = b.texte;
            }
          }
        }
      }
    }
    await traiter(segments.map((_, i) => i), 20);
    return resultats;
  }

  // ------------------------------------------------------------------ Relecture (T402)
  // Une scène : [{ n, original, traduction }]. Renvoie { corrections: [{ n, texte, type, raison }],
  // doutes: [{ n, raison }] } ; les numéros inconnus sont ignorés, la validation fine est faite par
  // le pipeline. Réponse illisible → { illisible: true }.
  const TYPES_RELECTURE = new Set(['meaning', 'gender', 'name', 'address', 'split', 'idiom', 'other']);
  async function relireScene(lignes, { adresse, modele, source, cible, registre = 'auto', contexteFilm = '', signal }) {
    if (!modele) throw new ErreurMoteur('Aucun modèle d\'IA locale choisi pour la relecture.');
    const de = source && source !== 'auto' ? langue(source)?.anglais : 'the original language';
    const vers = langue(cible)?.anglais || cible;
    const regle = consigneRegistre(registre, cible);
    const systeme = [
      `You are a professional film subtitle proofreader. You receive one scene: each numbered line gives the original (${de}) and its ${vers} translation.`,
      'Fix only real problems in the translations: meaning errors or omissions; wrong gender or number agreement (a character keeps the same gender); names written differently; a sentence split over two subtitles whose halves do not connect; idioms translated word for word.',
      regle ? `Form of address: ${regle} Within the scene, the same speaker must use the same form with the same person; a plural form addressed to several people is correct.` : null,
      contexteFilm ? `About the film (use the characters' genders for agreement): ${contexteFilm}` : null,
      'Do not touch lines that are fine. Keep the tone, the length and every marker like <x n="0"/> exactly as written.',
      `Answer ONLY with JSON: {"corrections": [{"line": 3, "text": "corrected ${vers} translation", "type": "meaning|gender|name|address|split|idiom|other", "reason": "short reason in French"}], "doubts": [{"line": 5, "reason": "short reason in French"}]}. Use empty lists if everything is fine.`,
    ].filter(Boolean).join('\n');
    const corps = lignes.map((l, i) => `${i + 1}. original: ${JSON.stringify(l.original)}\n   translation: ${JSON.stringify(l.traduction)}`).join('\n');
    const d = await appelOllama(adresse, '/api/chat', {
      signal,
      delai: 300000,
      corps: {
        model: modele, stream: false, format: 'json', keep_alive: '10m',
        options: { temperature: 0.1, num_ctx: 8192 },
        messages: [{ role: 'system', content: systeme }, { role: 'user', content: `Scene (${lignes.length} lines):\n${corps}` }],
      },
    });
    const brut = String(d?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '');
    let o;
    try { o = JSON.parse(brut.slice(brut.indexOf('{'), brut.lastIndexOf('}') + 1)); } catch { return { illisible: true, corrections: [], doutes: [] }; } // silence-ok: scène sautée, comptée dans le bilan
    const numero = (v) => { const k = Number(v); return Number.isInteger(k) && k >= 1 && k <= lignes.length ? lignes[k - 1].n : null; };
    const texteCourt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const corrections = (Array.isArray(o?.corrections) ? o.corrections : []).map((c) => ({
      n: numero(c?.line), texte: typeof c?.text === 'string' ? c.text.trim() : '',
      type: TYPES_RELECTURE.has(c?.type) ? c.type : 'other', raison: texteCourt(c?.reason, 160),
    })).filter((c) => c.n !== null && c.texte);
    const doutes = (Array.isArray(o?.doubts) ? o.doubts : []).map((x) => ({ n: numero(x?.line), raison: texteCourt(x?.reason, 160) })).filter((x) => x.n !== null);
    return { corrections, doutes };
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
        const t = await traduireDeepl(segments.slice(i, fin), { ...options, contexte, aides: options.aides?.slice(i, fin) });
        t.forEach((v, j) => { sortie[i + j] = v; });
        options.surLot?.(i, t);
        i = fin;
        surAvancement(i, segments.length);
      }
      return sortie;
    }
    if (options.moteur === 'ollama') {
      // Lots de 20, jusqu'à N en même temps (T602). Un lot dont les précédents ne sont pas encore traduits
      // reçoit comme contexte les répliques d'origine qui le précèdent.
      const pas = 20;
      const debuts = [];
      for (let i = 0; i < segments.length; i += pas) debuts.push(i);
      let faits = 0;
      await enParallele(debuts, Math.max(1, Math.min(4, options.parallele || 1)), async (i) => {
        if (options.signal?.aborted) throw erreurAnnulation();
        // Array.from : les cases encore vides du tableau sont de vrais « undefined » (every() les sauterait).
        const precedents = Array.from(sortie.slice(Math.max(0, i - 3), i));
        const contexte = precedents.every((t) => typeof t === 'string') ? precedents : segments.slice(Math.max(0, i - 3), i);
        const t = await traduireOllama(segments.slice(i, i + pas), { ...options, contexte, aides: options.aides?.slice(i, i + pas) });
        t.forEach((v, j) => { sortie[i + j] = v; });
        faits += t.length;
        surAvancement(faits, segments.length);
        options.surLot?.(i, t);
      });
      return sortie;
    }
    throw new ErreurMoteur('Moteur de traduction inconnu.');
  }

  return { usageDeepl, traduireDeepl, modelesOllama, traduireOllama, traduireTout, relireScene };
}

module.exports = { creerMoteurs, ErreurMoteur, adresseOllamaValide, normaliserAdresse, versXml, depuisXml, nonTraduit, nombreMots, formesAdresse };
