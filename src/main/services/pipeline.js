'use strict';
// Traduction d'un document de sous-titres déjà lu : découpage en segments, glossaire, mémoire,
// envoi au moteur des seuls textes nouveaux (chaque texte identique une seule fois), recomposition.
// Sans Electron : testé par tests/pipeline.test.js.

const formats = require('./formats');
const glossaire = require('./glossaire');
const { langue } = require('./langues');
const { nonTraduit, nombreMots } = require('./moteurs');
const expressions = require('./expressions');
const { creerLimite } = require('./limite');

const RE_MARQUEURS = /<[xg]\s+n="\d+"\s*\/>/g;
const A_TRADUIRE = /\p{L}/u;

function erreurAnnulation() {
  return Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });
}

// Garde-fou : une piste « traduite » restée en grande partie dans sa langue d'origine n'est jamais
// enregistrée comme traduction (aucun fichier écrit, message clair à la place).
function verifierTraduit(originaux, traductions, options) {
  let phrases = 0;
  let recopiees = 0;
  originaux.forEach((o, i) => {
    if (nombreMots(o) < 2) return;
    phrases += 1;
    if (nonTraduit(o, traductions[i])) recopiees += 1;
  });
  if (recopiees < 5 || recopiees < phrases * 0.25) return;
  const nomCible = langue(options.cible)?.nom?.toLowerCase() || options.cible;
  const conseil = options.moteur === 'ollama'
    ? `Le modèle d'IA locale « ${options.modele} » ne traduit pas correctement : choisissez-en un autre dans l'écran Moteurs (conseillé : qwen2.5:7b).`
    : 'Vérifiez la langue de départ choisie.';
  throw new Error(`Traduction ratée : ${recopiees} répliques sur ${phrases} sont restées telles quelles. ${conseil} Si ces sous-titres sont déjà en ${nomCible}, il n'y a rien à traduire.`);
}

async function traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null, expressionsPreparees = null, relecture = null, options, signal, surAvancement = () => {} }) {
  // 1. Segments, réplique par réplique (balises → marqueurs <x/>).
  const preparations = doc.repliques.map((r) => (r.dessin ? null : formats.preparerReplique(r.texte, doc.format)));
  const segments = [];
  const positions = preparations.map((p) => {
    if (!p) return null;
    const debut = segments.length;
    segments.push(...p.segments);
    return debut;
  });
  if (segments.length === 0) throw new Error('Aucun texte à traduire dans ces sous-titres.');

  // 2. Glossaire : termes → marqueurs <g/>.
  const avecGlossaire = segments.map((s) => glossaire.appliquer(s, glossairePrepare));
  const textes = avecGlossaire.map((g) => g.texte);

  // 3. Textes réellement à traduire, sans doublon (« Oui. » répété 40 fois = envoyé une fois).
  const uniques = [];
  const indexUnique = new Map();
  textes.forEach((t) => {
    if (!A_TRADUIRE.test(t.replace(RE_MARQUEURS, ''))) return; // que des noms du glossaire / symboles
    if (!indexUnique.has(t)) { indexUnique.set(t, uniques.length); uniques.push(t); }
  });

  // 3 bis. Expressions (idiomes, argot) : leur sens accompagne la réplique jusqu'au moteur. La clé de
  // mémoire en tient compte : une réplique traduite autrefois sans cette aide est retraduite avec.
  const aides = uniques.map((u) => expressions.trouver(u, expressionsPreparees));
  const clesMemoire = uniques.map((u, i) => (aides[i].length ? `${u}\u0001${expressions.signature(aides[i])}` : u));
  const expressionsVues = [...new Set(aides.flat().map((a) => a.expression))];

  // 4. Mémoire de traduction.
  const contexteMemoire = {
    moteur: options.moteur,
    // Le tu / vous imposé change la traduction : il fait partie de la clé (« auto » garde l'ancienne clé).
    variante: (options.moteur === 'deepl' ? `ton:${options.formalite || 'defaut'}` : `modele:${options.modele || ''}`)
      + (options.registre === 'tu' || options.registre === 'vous' ? `|reg:${options.registre}` : ''),
    source: options.source || 'auto',
    cible: options.cible,
  };
  const traduitsUniques = new Array(uniques.length).fill(null);
  let aEnvoyer = uniques.map((_, i) => i);
  let repris = 0;
  let caracteresEconomises = 0;
  if (memoire && options.memoire !== false && uniques.length) {
    const { trouves, manquants } = memoire.chercher(contexteMemoire, clesMemoire);
    // Une « traduction » mémorisée identique à l'original (IA locale qui avait recopié) est ignorée.
    const aRefaire = [];
    for (const [i, t] of trouves) {
      if (nonTraduit(uniques[i], t)) { aRefaire.push(i); continue; }
      traduitsUniques[i] = t;
      caracteresEconomises += uniques[i].replace(RE_MARQUEURS, '').length;
    }
    repris = trouves.size - aRefaire.length;
    aEnvoyer = manquants.concat(aRefaire).sort((a, b) => a - b);
  }

  // 5. Relecture préparée avant la traduction (T603) : chaque scène part en relecture dès que toutes
  //    ses répliques sont traduites ; un limiteur commun borne les demandes simultanées à l'IA (T602).
  const limite = creerLimite(Math.max(1, Math.min(4, options.parallele || 1)));
  const valeursGlossaire = avecGlossaire.map((g) => g.valeurs);
  const traductionSegment = (i) => {
    const u = indexUnique.get(textes[i]);
    const brut = u === undefined ? textes[i] : (traduitsUniques[u] ?? textes[i]);
    return glossaire.restituer(brut, valeursGlossaire[i]);
  };
  const segmentsDuUnique = new Map();
  textes.forEach((t, i) => {
    const u = indexUnique.get(t);
    if (u === undefined) return;
    if (!segmentsDuUnique.has(u)) segmentsDuUnique.set(u, []);
    segmentsDuUnique.get(u).push(i);
  });
  const listeScenes = relecture ? scenes(doc, positions, preparations) : [];
  // Mémoire de travail de l'IA locale (1.7) : une seule taille pour tout le fichier (traduction et
  // relecture), sinon Ollama rechargerait le modèle à chaque changement.
  let numCtx = null;
  if (moteurs.tailleContexte && (options.moteur === 'ollama' || relecture)) {
    const lots = [];
    const aidesLots = [];
    if (options.moteur === 'ollama') {
      for (let i = 0; i < aEnvoyer.length; i += 20) {
        lots.push(aEnvoyer.slice(i, i + 20).map((u) => uniques[u]));
        aidesLots.push(aEnvoyer.slice(i, i + 20).map((u) => aides[u]));
      }
    }
    numCtx = moteurs.tailleContexte({ lots, aidesLots, scenes: listeScenes.map((sc) => sc.map(({ segment }) => ({ original: segments[segment] }))), options });
  }
  // Relecture ciblée (1.8) : seules les scènes où une erreur est plausible sont relues.
  const aRelire = relecture?.ciblee
    ? scenesARisque(listeScenes, { segments, textes, indexUnique, aides, options })
    : null;
  const relecteur = relecture
    ? demarrerRelecture({ liste: listeScenes, aRelire, segments, textes, indexUnique, traductionSegment, relecture, limite, numCtx, signal })
    : null;
  const pret = new Array(uniques.length).fill(false);
  const marquerPret = (u) => {
    if (pret[u]) return;
    pret[u] = true;
    for (const i of segmentsDuUnique.get(u) || []) relecteur?.segmentPret(i);
  };
  traduitsUniques.forEach((t, u) => { if (t !== null) marquerPret(u); });
  relecteur?.lancerPretes();

  // 6. Moteur, pour les seuls textes nouveaux.
  const total = uniques.length;
  surAvancement(repris, total);
  let caracteresEnvoyes = 0;
  let erreurMemoire = null;
  try {
    if (aEnvoyer.length) {
      if (signal?.aborted) throw erreurAnnulation();
      const envoyes = aEnvoyer.map((i) => uniques[i]);
      caracteresEnvoyes = envoyes.reduce((n, t) => n + t.replace(RE_MARQUEURS, '').length, 0);
      const resultats = await moteurs.traduireTout(envoyes, {
        ...options, aides: aEnvoyer.map((i) => aides[i]), limite, numCtx, signal,
        // Lot traduit : ses répliques sont prêtes pour la relecture.
        surLot: (debut, lot) => lot.forEach((t, j) => { const u = aEnvoyer[debut + j]; traduitsUniques[u] = t; marquerPret(u); }),
      }, (fait) => surAvancement(repris + fait, total));
      if (signal?.aborted) throw erreurAnnulation();
      resultats.forEach((t, j) => { traduitsUniques[aEnvoyer[j]] = t; marquerPret(aEnvoyer[j]); });
      verifierTraduit(uniques, traduitsUniques, options);
      if (memoire && options.memoire !== false) {
        const paires = aEnvoyer.map((i, j) => [clesMemoire[i], resultats[j], uniques[i]]).filter(([, t, o]) => !nonTraduit(o, t)).map(([k, t]) => [k, t]);
        const r = memoire.ajouter(contexteMemoire, paires);
        if (!r.ok) erreurMemoire = r.erreur;
      }
    }
  } catch (e) {
    // Traduction ratée ou annulée : les relectures déjà parties sont arrêtées avant de rendre la main.
    if (relecteur) await relecteur.abandonner();
    throw e;
  }

  // 7. Glossaire restitué ; corrections de la relecture appliquées avant la recomposition.
  let aVerifier = 0;
  const traductions = textes.map((_, i) => {
    const { texte, perdus } = traductionSegment(i);
    if (perdus) aVerifier += 1;
    return texte;
  });
  const notes = new Map(); // indice de réplique → { type: 'corrige' | 'doute', raison }
  const bilanRelecture = relecteur ? await relecteur.terminer({ traductions, valeursGlossaire, notes }) : null;

  doc.repliques.forEach((r, i) => {
    const p = preparations[i];
    if (!p || p.segments.length === 0) return;
    r.texte = p.recomposer(traductions.slice(positions[i], positions[i] + p.segments.length));
  });

  return {
    segments: segments.length,
    uniques: uniques.length,
    repris,
    envoyes: aEnvoyer.length,
    caracteresEnvoyes,
    caracteresEconomises,
    aVerifier,
    erreurMemoire,
    expressions: expressionsVues,
    relecture: bilanRelecture,
    numCtx,
    notes,
  };
}

// --- Relecture ------------------------------------------------------------------------
const SILENCE_SCENE_MS = 6000;
const LIGNES_PAR_SCENE = 40;

// Scènes : suites de répliques séparées par moins de 6 s de silence, 40 segments au plus.
function scenes(doc, positions, preparations) {
  const temps = formats.lireMinutages(doc);
  const liste = [];
  let courante = [];
  let finPrecedente = null;
  doc.repliques.forEach((r, i) => {
    const p = preparations[i];
    if (!p || !p.segments.length) return;
    const t = temps[i];
    const coupure = t && finPrecedente !== null && t.debut - finPrecedente > SILENCE_SCENE_MS;
    if (courante.length && (coupure || courante.length + p.segments.length > LIGNES_PAR_SCENE)) { liste.push(courante); courante = []; }
    p.segments.forEach((_, k) => courante.push({ segment: positions[i] + k, replique: i }));
    if (t) finPrecedente = t.fin;
  });
  if (courante.length) liste.push(courante);
  return liste;
}

const marqueursDe = (t) => (String(t).match(RE_MARQUEURS) || []).map((m) => m.replace(/\s+/g, ' ')).sort().join();

// Une correction n'est gardée que si elle ne casse rien : marqueurs de mise en forme intacts, termes
// du glossaire présents, pas vide, pas recopiée de l'original, longueur raisonnable.
function correctionValable(original, actuelle, correction, valeurs) {
  if (!correction || correction === actuelle) return false;
  if (marqueursDe(original) !== marqueursDe(correction)) return false;
  if (valeurs.some((v) => v && actuelle.includes(v) && !correction.includes(v))) return false;
  if (nonTraduit(original, correction)) return false;
  return correction.length <= Math.max(actuelle.length, 20) * 2.5;
}

// --- Relecture ciblée (1.8) -------------------------------------------------------------
// Une scène vaut d'être relue si une erreur y est plausible : pronoms et accords (he/she/you, « I'm »),
// personnage nommé, expression toute faite, phrase coupée sur deux sous-titres. Analyse faite sur
// l'anglais seulement : pour une autre langue d'origine, toutes les scènes sont relues.
const RE_RISQUE_EN = /\b(?:he|she|him|her|his|hers|himself|herself|you|your|yours|yourself|yourselves|y'all|they|them|their|i'm|i am|i was|i've been|i'll be|we're|we are|we were|guy|guys|girl|boy|man|woman|lady|sir|ma'am|mister|miss)\b/i;
// Formules figées sans accord ni tutoiement à choisir (« Thank you » → « Merci »).
const FORMULES_SANS_RISQUE = /\b(?:thank you(?: (?:so|very) much)?|thank you all|see you(?: later| soon| tomorrow)?|bless you|you know|mind your own business)\b/gi;
const MOTS_ANGLAIS = /\b(?:the|and|is|are|to|you|of|it|that|what|this|i|a|not|we|have|do)\b/i;
const TITRES = new Set(['dr', 'mr', 'mrs', 'ms', 'miss', 'sir', 'the', 'young', 'old', 'detective', 'officer', 'sergeant', 'captain', 'doctor', 'professor']);
const ponctuationFinale = /[.!?…"»”)\]♪-]\s*$/;

function scenesARisque(liste, { segments, textes, indexUnique, aides, options }) {
  const sansMarqueurs = (t) => String(t).replace(RE_MARQUEURS, ' ');
  const source = options.source || 'auto';
  let anglais = source === 'en' || source.startsWith('en-');
  if (source === 'auto') {
    const echantillon = segments.slice(0, 400);
    anglais = echantillon.length > 0 && echantillon.filter((t) => MOTS_ANGLAIS.test(sansMarqueurs(t))).length / echantillon.length > 0.3;
  }
  if (!anglais) return liste.map(() => true);
  const noms = new Set((options.personnages || [])
    .flatMap((n) => String(n).toLowerCase().split(/[^\p{L}'-]+/u))
    .filter((m) => m.length >= 3 && !TITRES.has(m)));
  const reNoms = noms.size ? new RegExp(`(?<![\\p{L}])(?:${[...noms].map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}])`, 'iu') : null;
  return liste.map((scene) => scene.some(({ segment }, j) => {
    const t = sansMarqueurs(segments[segment]).trim();
    if (RE_RISQUE_EN.test(t.replace(FORMULES_SANS_RISQUE, ' '))) return true;
    if (reNoms && reNoms.test(t)) return true;
    const u = indexUnique.get(textes[segment]);
    if (u !== undefined && aides[u]?.length) return true;
    return j < scene.length - 1 && t && !ponctuationFinale.test(t); // phrase coupée sur deux sous-titres
  }));
}

// Relecture progressive : scenes[k] part dès que tous ses segments traduisibles sont prêts.
function demarrerRelecture({ liste, aRelire = null, segments, textes, indexUnique, traductionSegment, relecture, limite, numCtx, signal }) {
  const sceneDe = new Map();
  const attente = liste.map((sc, k) => {
    let n = 0;
    for (const { segment } of sc) {
      sceneDe.set(segment, k);
      if (indexUnique.has(textes[segment])) n += 1; // les segments sans texte à traduire sont prêts d'office
    }
    return n;
  });
  const lancees = new Array(liste.length).fill(false);
  const resultats = new Array(liste.length).fill(null); // { lignes, r } une fois relue
  const promesses = [];
  const interne = new AbortController();
  const surAnnulation = () => interne.abort();
  signal?.addEventListener('abort', surAnnulation, { once: true });
  let arret = null; // message de la première erreur (IA arrêtée…) : plus rien ne démarre
  let faites = 0;
  const aFaire = aRelire ? aRelire.filter(Boolean).length : liste.length;

  function lancer(k) {
    if (lancees[k]) return;
    lancees[k] = true;
    if (aRelire && !aRelire[k]) return; // scène sans risque : pas relue
    promesses.push((async () => {
      try {
        const r = await limite.prendre(async () => {
          if (arret || interne.signal.aborted) return null;
          // Texte lu au moment du départ : la scène est complète, il ne changera plus.
          const lignes = liste[k].map(({ segment }) => ({ n: segment, original: segments[segment], traduction: traductionSegment(segment).texte }));
          return { lignes, r: await relecture.relire(lignes, interne.signal, { numCtx }) };
        });
        if (r) resultats[k] = r;
      } catch (e) {
        if (!(e.name === 'AbortError' || interne.signal.aborted) && !arret) arret = e.message;
      }
      faites += 1;
      relecture.surAvancement?.(faites, aFaire);
    })());
  }

  return {
    segmentPret(i) {
      const k = sceneDe.get(i);
      if (k === undefined || lancees[k]) return;
      attente[k] -= 1;
      if (attente[k] <= 0) lancer(k);
    },
    lancerPretes() { attente.forEach((n, k) => { if (n <= 0) lancer(k); }); },
    async abandonner() {
      interne.abort();
      await Promise.allSettled(promesses);
      signal?.removeEventListener('abort', surAnnulation);
    },
    async terminer({ traductions, valeursGlossaire, notes }) {
      attente.forEach((_, k) => lancer(k)); // filet de sécurité : toute scène restante part maintenant
      await Promise.all(promesses);
      signal?.removeEventListener('abort', surAnnulation);
      if (signal?.aborted) throw erreurAnnulation();
      const bilan = { scenes: liste.length, corrigees: 0, refusees: 0, doutes: 0, tuVous: 0, sautees: 0, erreur: arret };
      if (aRelire) bilan.sansRisque = aRelire.filter((x) => !x).length;
      resultats.forEach((res, k) => {
        if (aRelire && !aRelire[k]) return;
        if (!res || res.r.illisible) { bilan.sautees += 1; return; }
        const repliqueDe = new Map(liste[k].map((x) => [x.segment, x.replique]));
        for (const c of res.r.corrections) {
          if (!repliqueDe.has(c.n)) continue;
          if (!correctionValable(segments[c.n], traductions[c.n], c.texte, valeursGlossaire[c.n] || [])) { bilan.refusees += 1; continue; }
          traductions[c.n] = c.texte;
          bilan.corrigees += 1;
          if (c.type === 'address') bilan.tuVous += 1;
          notes.set(repliqueDe.get(c.n), { type: 'corrige', raison: c.raison || 'corrigée à la relecture' });
        }
        for (const d of res.r.doutes) {
          const i = repliqueDe.get(d.n);
          if (i === undefined || notes.has(i)) continue;
          notes.set(i, { type: 'doute', raison: d.raison || 'à vérifier' });
          bilan.doutes += 1;
        }
      });
      return bilan;
    },
  };
}

module.exports = { traduireDocument, scenes, correctionValable, scenesARisque };
