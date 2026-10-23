'use strict';
// Limiteur : au plus N tâches en même temps (demandes simultanées à l'IA locale, T602). Les suivantes
// attendent leur tour, dans l'ordre d'arrivée. Sans Electron : testé par tests/parallele.test.js.

function creerLimite(n) {
  let libres = Math.max(1, Math.floor(n) || 1);
  const attente = [];
  let enCours = 0;
  let maxAtteint = 0;
  return {
    async prendre(tache) {
      if (libres > 0) libres -= 1;
      else await new Promise((ok) => attente.push(ok));
      enCours += 1;
      maxAtteint = Math.max(maxAtteint, enCours);
      try {
        return await tache();
      } finally {
        enCours -= 1;
        const suivant = attente.shift();
        if (suivant) suivant(); else libres += 1;
      }
    },
    get maxAtteint() { return maxAtteint; },
  };
}

// Exécute f sur chaque élément avec au plus n en même temps ; au premier échec, plus rien ne démarre
// et l'erreur est relancée une fois les tâches déjà parties terminées.
async function enParallele(elements, n, f) {
  let prochain = 0;
  let echec = null;
  async function ouvrier() {
    while (!echec && prochain < elements.length) {
      const i = prochain++;
      try { await f(elements[i], i); } catch (e) { if (!echec) echec = e; }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, elements.length)) }, ouvrier));
  if (echec) throw echec;
}

// File « à la chaîne » (1.8) : chaque travail a trois étapes, preparer → traduire → finaliser.
// Pendant que le travail N traduit, le N+1 se prépare et le N−1 se finalise. Les traductions se font
// une à la fois, les finalisations aussi. Les étapes ne rejettent jamais (elles gèrent leurs erreurs).
async function aLaChaine(travaux) {
  let finalisations = Promise.resolve();
  let preparation = travaux.length ? travaux[0].preparer() : null;
  for (let i = 0; i < travaux.length; i++) {
    await preparation;
    preparation = i + 1 < travaux.length ? travaux[i + 1].preparer() : null;
    await travaux[i].traduire();
    const t = travaux[i];
    finalisations = finalisations.then(() => t.finaliser());
  }
  await preparation;
  await finalisations;
}

module.exports = { creerLimite, enParallele, aLaChaine };
