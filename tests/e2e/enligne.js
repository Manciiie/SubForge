'use strict';
// Sous-titres en ligne, dans l'interface réelle (faux OpenSubtitles lancé à part, voir faux-opensubtitles.js) :
//   1. Vidéo sans aucune piste → carte « Pas de sous-titres », bouton « Chercher en ligne » mis en avant.
//   2. Sans clé → envoyé sur l'écran Moteurs ; clé enregistrée (jamais réaffichée).
//   3. Recherche → résultat exact en premier ; Télécharger → Film.en.srt à côté du film, ajouté à la file, traduit.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, ffmpeg, utiliserFauxOllama } = require('./outils');

module.exports = async (p) => {
  if (!process.env.SUBFORGE_OS_URL_TEST) throw new Error('Lancer avec SUBFORGE_OS_URL_TEST (voir l\'en-tête du fichier).');
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');

  const d = path.join(p.dossierTemp, 'Films');
  fs.mkdirSync(d);
  const mkv = path.join(d, 'Vacances.2019.1080p.mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=320x180:d=6', '-c:v', 'mpeg4', '-q:v', '2', mkv]);

  await p.eval(`window.__subforgeAjouter(${JSON.stringify([mkv])})`);
  await p.attendre('.carte-fichier[data-etat="sans-piste"]', 15000);
  p.verifier(/cherchez-les en ligne/.test(await p.texte('.carte-fichier')), 'vidéo sans sous-titres : message clair');
  await p.capture('e2e-enligne-sans-piste');

  // Sans clé : redirigé vers Moteurs.
  await p.eval('[...document.querySelectorAll(".carte-fichier .btn")].find((b) => b.textContent === "Chercher en ligne").click()');
  await p.pause(500);
  p.verifier(await p.eval('document.getElementById("ecran-moteurs").classList.contains("actif")'), 'sans clé : écran Moteurs ouvert');
  await p.saisir('#os-cle', 'abcdefghijklmnopqrstuvwxyz012345');
  await p.clic('#btn-os-enregistrer-cle');
  await p.attendre('#os-cle-presente:not([hidden])', 5000);
  p.verifier(!(await p.eval('document.body.innerText')).includes('abcdefghijklmnop'), 'clé jamais réaffichée');
  await p.clic('#btn-os-tester');
  for (let i = 0; i < 30 && /Test en cours/.test(await p.texte('#os-statut')); i++) await p.pause(150);
  p.verifier(/Clé valide/.test(await p.texte('#os-statut')), 'test de la clé : « Clé valide »');
  await p.capture('e2e-enligne-moteurs');

  // Recherche puis téléchargement.
  await p.ecran('traduire');
  await p.eval('[...document.querySelectorAll(".carte-fichier .btn")].find((b) => b.textContent === "Chercher en ligne").click()');
  await p.attendre('#os-fenetre:not([hidden]) .os-resultat', 10000);
  p.verifier(/Correspond exactement/.test(await p.texte('.os-resultat')), 'résultat exact (empreinte) en premier');
  p.verifier(/« Vacances » · 2019/.test(await p.texte('#os-etat')), 'titre et année tirés du nom du fichier');
  await p.capture('e2e-enligne-resultats');
  await p.choisir('#os-langue', 'de');
  for (let i = 0; i < 30 && !/Rien trouvé/.test(await p.texte('#os-etat')); i++) await p.pause(150);
  p.verifier(/Rien trouvé pour ce film en allemand/.test(await p.texte('#os-etat')), 'aucun résultat : « Rien trouvé »');
  await p.choisir('#os-langue', 'en');
  await p.attendre('#os-fenetre:not([hidden]) .os-resultat', 10000);
  await p.clic('.os-resultat .btn');
  await p.attendre('#os-fenetre[hidden]', 10000);
  const srt = path.join(d, 'Vacances.2019.1080p.en.srt');
  p.verifier(fs.existsSync(srt) && /We found it online/.test(fs.readFileSync(srt, 'utf8')), 'sous-titre écrit à côté du film : Film.en.srt');
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  const noms = await p.eval('[...document.querySelectorAll(".carte-fichier__nom")].map((n) => n.textContent)');
  p.verifier(noms.length === 1 && noms[0] === 'Vacances.2019.1080p.en.srt', 'la carte vidéo est remplacée par le sous-titre téléchargé');
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  p.verifier(/\[fr\] We found it online\./.test(fs.readFileSync(path.join(d, 'Vacances.2019.1080p.fr.srt'), 'utf8')), 'puis traduit : Film.fr.srt');
  await p.capture('e2e-enligne-termine');
  serveur.close();
};
