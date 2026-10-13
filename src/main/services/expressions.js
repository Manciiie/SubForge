'use strict';
// Expressions traduites par leur sens : idiomes, argot, tournures toutes faites.
// Contrairement au glossaire (mot remplacé par une valeur fixe), une expression n'est pas remplacée :
// le moteur reçoit son sens (et l'équivalent souhaité) et la reformule naturellement dans la langue
// d'arrivée, en accordant la phrase. Liste intégrée (anglais) + expressions personnelles.
// Module sans Electron : testé par tests/expressions.test.js.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { INTEGREES } = require('./expressions-integrees');

const VERSION_FORMAT = 1;
const MAX_ENTREES = 2000;
const MAX_PAR_REPLIQUE = 5;
const RE_MARQUEUR = /<[xg]\s+n="\d+"\s*\/>/g;

class ErreurExpression extends Error {
  constructor(m) { super(m); this.name = 'ErreurExpression'; }
}

const echapper = (t) => t.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
const apostrophes = (t) => String(t).replace(/[\u2019\u2018\u02bc]/g, '\'');

// Expression saisie → motif : espaces souples, apostrophe droite ou courbe, « * » = 1 à 3 mots
// quelconques, « make|made » = l'une ou l'autre forme.
function motifPerso(expression) {
  const mot = (m) => {
    const formes = m.split('|').filter(Boolean).map((f) => echapper(f).replace(/'/g, '[\'’]'));
    return formes.length > 1 ? `(?:${formes.join('|')})` : formes[0] || '';
  };
  const morceaux = apostrophes(expression).split('*').map((m) => m.trim().split(/\s+/).filter(Boolean).map(mot).join('\\s+'));
  return morceaux.join('\\s+(?:[\\p{L}\\p{N}\'’-]+\\s+){0,2}[\\p{L}\\p{N}\'’-]+\\s+');
}

function compiler(motif) {
  // Limite de mot avant (sauf si le motif commence par une apostrophe : « you're toast ») et après.
  return new RegExp(`(?:(?<![\\p{L}\\p{N}])|(?='))(?:${motif})(?![\\p{L}\\p{N}])`, 'iu');
}

function nettoyerEntree(e, codes) {
  const propre = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max + 1);
  const expression = propre(e.expression, 120);
  const sens = propre(e.sens, 200);
  const equivalent = propre(e.equivalent, 120);
  if (!expression) throw new ErreurExpression('L\'expression est vide.');
  if (expression.length > 120 || equivalent.length > 120) throw new ErreurExpression('Expression trop longue (120 caractères au plus).');
  if (sens.length > 200) throw new ErreurExpression('Sens trop long (200 caractères au plus).');
  if (/[<>{}]/.test(expression + sens + equivalent)) throw new ErreurExpression('Les caractères < > { } ne sont pas autorisés.');
  if (expression.replace(/[\s*]/g, '').length < 2) throw new ErreurExpression('Expression trop courte : au moins deux lettres en plus du joker *.');
  if (/^\*|\*$/.test(expression.trim())) throw new ErreurExpression('Le joker * ne peut être qu\'au milieu de l\'expression (ex. « make * day »).');
  if (!sens && !equivalent) throw new ErreurExpression('Indiquez le sens de l\'expression, ou l\'équivalent voulu (ou les deux).');
  const langue = (v) => (typeof v === 'string' && (v === '*' || codes.includes(v)) ? v : '*');
  return {
    id: typeof e.id === 'string' && /^[a-z0-9]{8,32}$/.test(e.id) ? e.id : crypto.randomBytes(8).toString('hex'),
    expression, sens, equivalent, source: langue(e.source), cible: langue(e.cible),
  };
}

function creerExpressions({ fichier, codesLangues = [], journal = console }) {
  let etat = null; // { integrees: bool, desactivees: Set, entrees: [] , erreurChargement }

  function charger() {
    if (etat) return etat;
    etat = { integrees: true, desactivees: new Set(), entrees: [], erreurChargement: null };
    let brut;
    try {
      brut = fs.readFileSync(fichier, 'utf8');
    } catch (e) {
      if (e.code !== 'ENOENT') journal.erreur('[expressions] lecture impossible :', e.message);
      return etat;
    }
    try {
      const o = JSON.parse(brut);
      if (!o || !Array.isArray(o.entrees)) throw new Error('format inconnu');
      etat.integrees = o.integrees !== false;
      etat.desactivees = new Set(Array.isArray(o.desactivees) ? o.desactivees.filter((x) => typeof x === 'string') : []);
      for (const e of o.entrees.slice(0, MAX_ENTREES)) {
        try { etat.entrees.push(nettoyerEntree(e, codesLangues)); } catch (err) { journal.avertissement('[expressions] entrée ignorée :', err.message); }
      }
    } catch (e) {
      const sauvegarde = `${fichier}.corrompu-${Date.now()}`;
      try { fs.renameSync(fichier, sauvegarde); } catch (err) { journal.erreur('[expressions] sauvegarde du fichier abîmé impossible :', err.message); }
      journal.erreur(`[expressions] fichier illisible (${e.message}), mis de côté sous ${path.basename(sauvegarde)}`);
      etat.erreurChargement = `La liste d'expressions était abîmée : elle a été mise de côté (${path.basename(sauvegarde)}). La liste intégrée reste disponible.`;
    }
    return etat;
  }

  function sauvegarder() {
    const tmp = `${fichier}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(fichier), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify({
      versionFormat: VERSION_FORMAT,
      integrees: etat.integrees,
      desactivees: [...etat.desactivees],
      entrees: etat.entrees,
    }, null, 2), 'utf8');
    fs.renameSync(tmp, fichier);
  }

  function lister() {
    const s = charger();
    return {
      integreesActives: s.integrees,
      integrees: INTEGREES.map((x) => ({ id: x.id, expression: x.expression, sens: x.sens, equivalent: x.equivalents.fr || '', source: x.source, active: !s.desactivees.has(x.id) })),
      entrees: s.entrees.map((e) => ({ ...e })),
      avertissement: s.erreurChargement,
    };
  }

  function enregistrer(entree) {
    const s = charger();
    const e = nettoyerEntree(entree, codesLangues);
    const meme = (x) => x.id !== e.id && x.expression.toLowerCase() === e.expression.toLowerCase() && x.source === e.source && x.cible === e.cible;
    if (s.entrees.some(meme)) throw new ErreurExpression(`« ${e.expression} » est déjà dans vos expressions.`);
    const i = s.entrees.findIndex((x) => x.id === e.id);
    if (i >= 0) s.entrees[i] = e;
    else {
      if (s.entrees.length >= MAX_ENTREES) throw new ErreurExpression(`Liste pleine (${MAX_ENTREES} expressions au plus).`);
      s.entrees.push(e);
    }
    sauvegarder();
    return e;
  }

  function supprimer(id) {
    const s = charger();
    const i = s.entrees.findIndex((x) => x.id === id);
    if (i < 0) throw new ErreurExpression('Expression introuvable (déjà supprimée ?).');
    s.entrees.splice(i, 1);
    sauvegarder();
    return true;
  }

  // Liste intégrée : tout activer/désactiver, ou une expression précise.
  function regler({ integrees, id, active }) {
    const s = charger();
    if (typeof integrees === 'boolean') s.integrees = integrees;
    if (typeof id === 'string') {
      if (!INTEGREES.some((x) => x.id === id)) throw new ErreurExpression('Expression intégrée inconnue.');
      if (active) s.desactivees.delete(id); else s.desactivees.add(id);
    }
    sauvegarder();
    return lister();
  }

  // Expressions utiles pour une traduction : perso de ces langues + intégrées si la langue d'origine
  // est l'anglais (ou détectée automatiquement). Les perso passent en premier (priorité).
  function pour({ source = 'auto', cible }) {
    const s = charger();
    const regles = [];
    for (const e of s.entrees) {
      if (e.cible !== '*' && e.cible !== cible) continue;
      if (e.source !== '*' && source !== 'auto' && e.source !== source) continue;
      regles.push({ re: compiler(motifPerso(e.expression)), cle: e.expression.toLowerCase(), expression: e.expression, sens: e.sens, equivalent: e.equivalent, perso: true });
    }
    if (s.integrees && (source === 'auto' || source === 'en' || source.startsWith('en-'))) {
      const dejaPerso = new Set(regles.map((r) => r.cle));
      for (const x of INTEGREES) {
        if (s.desactivees.has(x.id) || dejaPerso.has(x.expression.toLowerCase())) continue;
        regles.push({ re: compiler(x.motif.replace(/'/g, '[\'’]')), cle: x.expression.toLowerCase(), expression: x.expression, sens: x.sens, equivalent: x.equivalents[String(cible).split('-')[0]] || '', perso: false });
      }
    }
    return regles.length ? { regles } : null;
  }

  return { lister, enregistrer, supprimer, regler, pour, MAX_ENTREES };
}

// Expressions trouvées dans un texte : [{ texte (tel qu'écrit), expression, sens, equivalent }].
function trouver(texte, prepare) {
  if (!prepare) return [];
  const propre = apostrophes(String(texte).replace(RE_MARQUEUR, ' '));
  const trouvees = [];
  const vues = new Set();
  for (const r of prepare.regles) {
    if (trouvees.length >= MAX_PAR_REPLIQUE) break;
    if (vues.has(r.cle)) continue;
    const m = r.re.exec(propre);
    if (!m) continue;
    vues.add(r.cle);
    trouvees.push({ texte: m[0].trim(), expression: r.expression, sens: r.sens, equivalent: r.equivalent });
  }
  return trouvees;
}

// Signature stable des aides d'une réplique (pour la clé de la mémoire de traduction).
function signature(aides) {
  return aides.map((a) => `${a.expression}=${a.equivalent}|${a.sens}`).sort().join(';');
}

module.exports = { creerExpressions, trouver, signature, ErreurExpression, MAX_PAR_REPLIQUE };
