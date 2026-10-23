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

module.exports = { creerLimite, enParallele };
