'use strict';
// Petits utilitaires d'interface. Tout texte passe par textContent :
// jamais d'innerHTML avec des données venant d'un fichier, d'un réseau ou de l'utilisateur.

window.UI = (() => {
  function el(tag, attributs = {}, enfants = []) {
    const n = document.createElement(tag);
    for (const [cle, valeur] of Object.entries(attributs)) {
      if (cle === 'texte') n.textContent = valeur;
      else if (cle === 'classe') n.className = valeur;
      else if (cle.startsWith('on') && typeof valeur === 'function') n.addEventListener(cle.slice(2), valeur);
      else n.setAttribute(cle, valeur);
    }
    for (const e of [].concat(enfants)) n.append(e instanceof Node ? e : document.createTextNode(String(e)));
    return n;
  }

  function notifier(message, type = 'info', duree = 4000) {
    const zone = document.getElementById('notifications');
    const n = el('div', { classe: `notification notification--${type}`, role: 'status', texte: message });
    zone.append(n);
    setTimeout(() => n.remove(), duree);
  }

  function erreur(e) {
    const message = (e && e.message ? e.message : String(e)).replace(/^Error invoking remote method '[^']+': (\w+Error: )?/, '');
    notifier(message, 'erreur', 6000);
  }

  function appliquerTheme(theme, accent) {
    const sombreSysteme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectif = theme === 'systeme' ? (sombreSysteme ? 'sombre' : 'clair') : theme;
    document.documentElement.dataset.theme = effectif;
    if (accent) document.documentElement.style.setProperty('--accent', accent);
  }

  function afficherEcran(nom) {
    document.querySelectorAll('.ecran').forEach((s) => s.classList.toggle('actif', s.id === `ecran-${nom}`));
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('actif', b.dataset.ecran === nom));
  }

  return { el, notifier, erreur, appliquerTheme, afficherEcran };
})();
