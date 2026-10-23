'use strict';
// Version 1.5 — contexte du film (TMDB), dans l'interface réelle. Lancer avec le faux TMDB :
//   node tests/e2e/faux-tmdb.js 9557 &
//   SUBFORGE_TMDB_URL_TEST=http://127.0.0.1:9557/3 node scripts/piloter.js tests/e2e/v15.js
//   1. Écran Moteurs : jeton enregistré (jamais réaffiché), test.
//   2. Film reconnu d'après le nom : titre, personnages au survol ; contexte envoyé à l'IA locale.
//   3. Film non reconnu → « Choisir le film… » → recherche → choix → carte mise à jour.

const fs = require('fs');
const path = require('path');
const { fauxOllama, utiliserFauxOllama } = require('./outils');
const { JETON_TEST } = require('./faux-tmdb');

module.exports = async (p) => {
  if (!process.env.SUBFORGE_TMDB_URL_TEST) throw new Error('Lancer avec SUBFORGE_TMDB_URL_TEST (voir l\'en-tête du fichier).');
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');

  // --- 1. Jeton ----------------------------------------------------------------------------
  await p.ecran('moteurs');
  p.verifier(/Aucun jeton/.test(await p.texte('#tmdb-statut')), 'au départ : aucun jeton');
  await p.saisir('#tmdb-jeton', 'pas un jeton');
  await p.clic('#btn-tmdb-enregistrer');
  await p.pause(300);
  p.verifier(/ne ressemble pas à un jeton TMDB/.test(await p.texte('#notifications')), 'jeton mal formé refusé');
  await p.saisir('#tmdb-jeton', JETON_TEST);
  await p.clic('#btn-tmdb-enregistrer');
  await p.pause(400);
  p.verifier(!(await p.eval('document.getElementById("tmdb-presente").hidden')) && (await p.eval('document.getElementById("tmdb-jeton").value')) === '', 'jeton enregistré, champ vidé');
  p.verifier(!(await p.eval('document.body.innerText')).includes(JETON_TEST), 'jeton jamais réaffiché');
  await p.clic('#btn-tmdb-tester');
  await p.pause(600);
  p.verifier(/TMDB accepte le jeton/.test(await p.texte('#tmdb-statut')), 'test du jeton');
  await p.capture('e2e-v15-moteurs');

  // --- 2. Film reconnu ---------------------------------------------------------------------
  await p.ecran('traduire');
  const d = path.join(p.dossierTemp, 'Films');
  fs.mkdirSync(d);
  const srt = '1\n00:00:01,000 --> 00:00:02,000\nShe left without a word.\n\n2\n00:00:03,000 --> 00:00:04,000\nWhere is she?\n';
  const film1 = path.join(d, 'The.Witch.Part.1.The.Subversion.2018.1080p.en.srt');
  fs.writeFileSync(film1, srt);
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([film1])})`);
  await p.attendre('.carte-fichier .ligne-contexte', 10000);
  const ligne = await p.texte('.carte-fichier .ligne-contexte');
  p.verifier(/Film : The Witch: Part 1\. The Subversion \(2018\) · 5 personnages/.test(ligne), `film reconnu (${ligne})`);
  const survol = await p.eval('document.querySelector(".ligne-contexte .discret").title');
  p.verifier(/Ja-yoon \(femme\)/.test(survol) && /Mr\. Choi \(homme\)/.test(survol), 'personnages et genre au survol');
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  p.verifier(serveur.systemes.some((x) => /About the film .*The Witch: Part 1\. The Subversion.*Ja-yoon \(female\)/.test(x)), 'contexte envoyé à l\'IA locale');
  p.verifier(serveur.relectures.some((x) => /Ja-yoon \(female\)/.test(x.systeme)), 'contexte envoyé à la relecture');
  await p.capture('e2e-v15-reconnu');

  // --- 3. Choix manuel -----------------------------------------------------------------------
  await p.clic('#btn-vider');
  const film2 = path.join(d, 'Witch.1999.en.srt');
  fs.writeFileSync(film2, srt);
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([film2])})`);
  await p.attendre('.carte-fichier .ligne-contexte', 10000);
  p.verifier(/Film non reconnu sur TMDB/.test(await p.texte('.carte-fichier .ligne-contexte')), 'film non reconnu');
  await p.eval('[...document.querySelectorAll(".ligne-contexte .btn")].find((b) => b.textContent === "Choisir le film…").click()');
  await p.attendre('#ctx-fenetre:not([hidden]) .os-resultat', 5000);
  p.verifier((await p.eval('document.getElementById("ctx-recherche").value')) === 'Witch', 'recherche préremplie avec le titre lu');
  await p.capture('e2e-v15-choix');
  await p.eval('[...document.querySelectorAll("#ctx-resultats .os-resultat")].find((r) => r.textContent.includes("(2015)")).querySelector("button").click()');
  await p.attendre('#ctx-fenetre[hidden]', 5000);
  for (let i = 0; i < 30 && !/Film : The Witch \(2015\)/.test(await p.texte('.carte-fichier .ligne-contexte')); i++) await p.pause(150);
  p.verifier(/Film : The Witch \(2015\)/.test(await p.texte('.carte-fichier .ligne-contexte')), 'choix appliqué à la carte');
  serveur.close();
};
