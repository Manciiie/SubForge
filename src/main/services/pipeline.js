'use strict';
// Traduction d'un document de sous-titres déjà lu : découpage en segments, glossaire, mémoire,
// envoi au moteur des seuls textes nouveaux (chaque texte identique une seule fois), recomposition.
// Sans Electron : testé par tests/pipeline.test.js.

const formats = require('./formats');
const glossaire = require('./glossaire');

const RE_MARQUEURS = /<[xg]\s+n="\d+"\s*\/>/g;
const A_TRADUIRE = /\p{L}/u;

function erreurAnnulation() {
  return Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });
}

async function traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null, options, signal, surAvancement = () => {} }) {
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

  // 4. Mémoire de traduction.
  const contexteMemoire = {
    moteur: options.moteur,
    variante: options.moteur === 'deepl' ? `ton:${options.formalite || 'defaut'}` : `modele:${options.modele || ''}`,
    source: options.source || 'auto',
    cible: options.cible,
  };
  const traduitsUniques = new Array(uniques.length).fill(null);
  let aEnvoyer = uniques.map((_, i) => i);
  let repris = 0;
  let caracteresEconomises = 0;
  if (memoire && options.memoire !== false && uniques.length) {
    const { trouves, manquants } = memoire.chercher(contexteMemoire, uniques);
    for (const [i, t] of trouves) { traduitsUniques[i] = t; caracteresEconomises += uniques[i].replace(RE_MARQUEURS, '').length; }
    repris = trouves.size;
    aEnvoyer = manquants;
  }

  // 5. Moteur, pour les seuls textes nouveaux.
  const total = uniques.length;
  surAvancement(repris, total);
  let caracteresEnvoyes = 0;
  let erreurMemoire = null;
  if (aEnvoyer.length) {
    if (signal?.aborted) throw erreurAnnulation();
    const envoyes = aEnvoyer.map((i) => uniques[i]);
    caracteresEnvoyes = envoyes.reduce((n, t) => n + t.replace(RE_MARQUEURS, '').length, 0);
    const resultats = await moteurs.traduireTout(envoyes, { ...options, signal }, (fait) => surAvancement(repris + fait, total));
    if (signal?.aborted) throw erreurAnnulation();
    resultats.forEach((t, j) => { traduitsUniques[aEnvoyer[j]] = t; });
    if (memoire && options.memoire !== false) {
      const r = memoire.ajouter(contexteMemoire, aEnvoyer.map((i, j) => [uniques[i], resultats[j]]));
      if (!r.ok) erreurMemoire = r.erreur;
    }
  }

  // 6. Glossaire restitué, puis répliques recomposées.
  let aVerifier = 0;
  const traductions = textes.map((t, i) => {
    const u = indexUnique.get(t);
    const brut = u === undefined ? t : (traduitsUniques[u] ?? t);
    const { texte, perdus } = glossaire.restituer(brut, avecGlossaire[i].valeurs);
    if (perdus) aVerifier += 1;
    return texte;
  });
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
  };
}

module.exports = { traduireDocument };
