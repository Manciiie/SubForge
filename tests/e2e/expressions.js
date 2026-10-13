'use strict';
// Expressions traduites par leur sens, dans l'interface réelle (faux Ollama) :
//   1. Écran Expressions : liste intégrée affichée, « Tester une phrase ».
//   2. Expression perso ajoutée (joker + formes au choix), retrouvée dans la liste.
//   3. Traduction d'un .srt : le sens des expressions part avec les répliques ; bilan sur la carte.
//   4. Liste intégrée désactivée → plus d'aide pour « break a leg ».

const fs = require('fs');
const path = require('path');
const { fauxOllama, utiliserFauxOllama } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  await p.pause(300);

  // --- 1. Écran + test ---------------------------------------------------------------------
  await p.ecran('expressions');
  await p.attendre('#ex-integrees-table .table-glossaire__ligne:nth-child(3)', 5000);
  p.verifier(/Expressions anglaises courantes \(110 sur 110 utilisées\)/.test(await p.texte('#ex-integrees-titre')), 'liste intégrée : 110 expressions');
  await p.saisir('#ex-test', 'Break a leg tonight, and don’t spill the beans!');
  await p.clic('#ex-tester');
  await p.pause(400);
  const test1 = await p.texte('#ex-test-resultat');
  p.verifier(/« Break a leg » → « Merde ! »/.test(test1) && /« spill the beans » → « vendre la mèche »/.test(test1), `test d'une phrase (${test1})`);

  // --- 2. Expression perso -------------------------------------------------------------------
  await p.saisir('#ex-expression', 'make|made * day');
  await p.saisir('#ex-sens', 'rendre quelqu\'un très heureux');
  await p.saisir('#ex-equivalent', 'illuminer la journée');
  await p.choisir('#ex-source', 'en');
  await p.clic('#ex-enregistrer');
  await p.attendre('#ex-table .table-glossaire__ligne:nth-child(2)', 5000);
  p.verifier(/make\|made \* day/.test(await p.texte('#ex-table')) && /Anglais → toutes/.test(await p.texte('#ex-table')), 'expression perso dans la liste');
  await p.saisir('#ex-test', 'You made my whole day.');
  await p.clic('#ex-tester');
  await p.pause(400);
  p.verifier(/« made my whole day » → « illuminer la journée »/.test(await p.texte('#ex-test-resultat')), 'expression perso reconnue (joker + forme)');
  await p.capture('e2e-expressions');

  // --- 3. Traduction -------------------------------------------------------------------------
  await p.ecran('traduire');
  const srt = path.join(p.dossierTemp, 'Spectacle.en.srt');
  fs.writeFileSync(srt, [
    '1\n00:00:01,000 --> 00:00:02,000\nBreak a leg tonight!\n',
    '2\n00:00:03,000 --> 00:00:04,000\nYou made my whole day.\n',
    '3\n00:00:05,000 --> 00:00:06,000\nWhere are the keys?\n',
  ].join('\n'));
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  const demande = serveur.demandes.join('\n');
  p.verifier(/line \d: "Break a leg" is an idiom meaning "good luck[^"]*" \(natural French equivalent: "Merde !"\)/.test(demande), 'sens de « break a leg » envoyé à l\'IA locale');
  p.verifier(/"made my whole day" is an idiom meaning "rendre quelqu'un très heureux" \(natural French equivalent: "illuminer la journée"\)/.test(demande), 'expression perso envoyée');
  p.verifier(!/Where are the keys\?" is an idiom/.test(demande), 'réplique ordinaire sans aide');
  const carte = await p.texte('.carte-fichier');
  p.verifier(/2 expressions traduites par le sens : (break a leg, make\|made \* day|make\|made \* day, break a leg)/.test(carte), `bilan sur la carte (${carte.slice(0, 220)})`);
  await p.capture('e2e-expressions-bilan');

  // --- 4. Liste intégrée désactivée ----------------------------------------------------------
  await p.ecran('expressions');
  await p.clic('#ex-integrees-actives');
  await p.pause(400);
  await p.saisir('#ex-test', 'Break a leg!');
  await p.clic('#ex-tester');
  await p.pause(400);
  p.verifier(/Aucune expression reconnue/.test(await p.texte('#ex-test-resultat')), 'liste intégrée désactivée : plus d\'aide');
  serveur.close();
};
