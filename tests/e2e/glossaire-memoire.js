'use strict';
// Glossaire et mémoire de traduction, dans l'interface réelle (faux Ollama).
//   1. Glossaire : ajout de deux termes, modification, recherche.
//   2. Traduction : noms gardés, terme traduit comme demandé.
//   3. Retraduction : 0 ligne envoyée au moteur, bilan « reprises de la mémoire ».
//   4. Vider la mémoire : retraduction renvoyée au moteur.

const fs = require('fs');
const path = require('path');
const { fauxOllama, utiliserFauxOllama } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');

  // --- 1. Glossaire ----------------------------------------------------------------
  await p.ecran('glossaire');
  p.verifier(await p.eval('!document.getElementById("gl-vide").hidden'), 'glossaire vide : message d\'aide affiché');
  await p.saisir('#gl-terme', 'Jon Snow');
  await p.clic('#gl-enregistrer');
  await p.saisir('#gl-terme', "Night's Watch");
  await p.saisir('#gl-traduction', 'Garde Nuit');
  await p.clic('#gl-enregistrer');
  await p.attendre('.table-glossaire__ligne:nth-child(3)');
  // Modification : « Garde Nuit » → « Garde de Nuit ».
  await p.eval('[...document.querySelectorAll(".table-glossaire__ligne")].find((l) => l.textContent.includes("Night")).querySelector(".btn").click()');
  p.verifier((await p.eval('document.getElementById("gl-terme").value')) === "Night's Watch", 'modification : formulaire prérempli');
  await p.saisir('#gl-traduction', 'Garde de Nuit');
  await p.clic('#gl-enregistrer');
  await p.pause(300);
  p.verifier(/Garde de Nuit/.test(await p.texte('#gl-table')) && !/Garde Nuit/.test(await p.texte('#gl-table')), 'terme modifié dans la liste');
  await p.saisir('#gl-recherche', 'snow');
  p.verifier((await p.eval('document.querySelectorAll(".table-glossaire__ligne").length')) === 2, 'recherche : un seul terme affiché');
  await p.saisir('#gl-recherche', '');
  await p.capture('e2e-glossaire');

  // --- 2. Traduction avec glossaire ----------------------------------------------------
  const d = path.join(p.dossierTemp, 'Série');
  fs.mkdirSync(d);
  const srt = path.join(d, 'Episode.en.srt');
  fs.writeFileSync(srt, '1\n00:00:01,000 --> 00:00:03,000\nJon Snow joined the Night\'s Watch.\n\n2\n00:00:04,000 --> 00:00:05,000\nYes.\n\n3\n00:00:06,000 --> 00:00:07,000\nYes.\n');
  await p.ecran('traduire');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  const sortie = fs.readFileSync(path.join(d, 'Episode.fr.srt'), 'utf8');
  p.verifier(sortie.includes('[fr] Jon Snow joined the Garde de Nuit.'), 'glossaire : nom gardé, terme traduit comme demandé');
  p.verifier(serveur.recues.filter((l) => l === 'Yes.').length === 1, '« Yes. » répété : envoyé une seule fois');
  p.verifier(serveur.recues.every((l) => !l.includes('Jon Snow')), 'le nom n\'est jamais envoyé au moteur');

  // --- 3. Retraduction : tout vient de la mémoire ----------------------------------------
  const avant = serveur.recues.length;
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  p.verifier(serveur.recues.length === avant, 'retraduction : aucune ligne envoyée au moteur');
  p.verifier(/2 répliques reprises de la mémoire/.test(await p.texte('.carte-fichier')), 'bilan : « 2 répliques reprises de la mémoire »');
  p.verifier(fs.readFileSync(path.join(d, 'Episode.fr (2).srt'), 'utf8') === sortie, 'retraduction identique');
  await p.capture('e2e-memoire-bilan');

  // --- 4. Vider la mémoire ---------------------------------------------------------------
  await p.ecran('moteurs');
  await p.pause(300);
  p.verifier(/2 répliques en mémoire/.test(await p.texte('#memoire-etat')), 'Moteurs : « 2 répliques en mémoire »');
  await p.eval('window.confirm = () => true');
  await p.clic('#btn-memoire-vider');
  await p.pause(400);
  p.verifier(/Mémoire vide/.test(await p.texte('#memoire-etat')), 'mémoire vidée');
  await p.capture('e2e-memoire-moteurs');
  await p.ecran('traduire');
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  p.verifier(serveur.recues.length === avant + 2, 'après vidage : de nouveau envoyé au moteur');

  serveur.closeAllConnections?.();
  serveur.close();
};
