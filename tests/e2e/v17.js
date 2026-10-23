'use strict';
// Version 1.7, dans l'interface réelle (faux Ollama) :
//   1. « Garder le modèle chargé » coché par défaut ; des fichiers ajoutés → modèle chargé à l'avance
//      (prompt vide, taille standard, keep_alive -1), une seule fois.
//   2. Traduction + relecture : toutes les demandes avec la même taille et keep_alive -1.
//   3. Case décochée → le modèle gardé est libéré (keep_alive 0).

const fs = require('fs');
const path = require('path');
const { fauxOllama, utiliserFauxOllama } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  await p.ecran('moteurs');
  p.verifier(await p.eval('document.getElementById("ollama-garder").checked'), '« Garder le modèle chargé » coché par défaut');
  await p.ecran('traduire');

  // --- 1. Préchargement -----------------------------------------------------------------------
  const srt = path.join(p.dossierTemp, 'Episode.en.srt');
  fs.writeFileSync(srt, Array.from({ length: 30 }, (_, i) => `${i + 1}\n00:00:${String(i).padStart(2, '0')},000 --> 00:00:${String(i).padStart(2, '0')},800\nLine number ${i}\n`).join('\n'));
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  for (let i = 0; i < 40 && !serveur.generes.length; i++) await p.pause(100);
  const g = serveur.generes[0];
  p.verifier(g && g.prompt === '' && g.keep_alive === -1 && g.options?.num_ctx === 4096, `modèle chargé à l'avance (${JSON.stringify(g)})`);
  const srt2 = path.join(p.dossierTemp, 'Episode2.en.srt');
  fs.copyFileSync(srt, srt2);
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt2])})`);
  await p.pause(800);
  p.verifier(serveur.generes.length === 1, 'pas de second chargement');

  // --- 2. Même taille partout --------------------------------------------------------------------
  await p.clic('#btn-traduire');
  for (let i = 0; i < 200 && (await p.eval('document.querySelectorAll(".carte-fichier[data-etat=termine]").length')) < 2; i++) await p.pause(100);
  p.verifier(serveur.options.length >= 4 && serveur.options.every((o) => o.num_ctx === 4096 && o.keep_alive === -1), `traduction et relecture : taille 4 096, modèle gardé (${serveur.options.length} demandes)`);
  p.verifier(serveur.relectures.length >= 2, 'relecture faite');

  // --- 3. Libération ------------------------------------------------------------------------------
  await p.ecran('moteurs');
  await p.clic('#ollama-garder');
  for (let i = 0; i < 30 && serveur.generes.length < 2; i++) await p.pause(100);
  p.verifier(JSON.stringify(serveur.generes[1]) === JSON.stringify({ model: 'faux-modele:1b', keep_alive: 0 }), `modèle libéré quand la case est décochée (${JSON.stringify(serveur.generes[1])})`);
  await p.eval('document.getElementById("ollama-garder").scrollIntoView({ block: "center" })');
  await p.capture('e2e-v17-moteurs');

  // --- 4. Fermeture de SubForge : le modèle gardé chargé est libéré ---------------------------------
  await p.clic('#ollama-garder');
  await p.pause(300);
  await p.eval('window.SubForge.prechaufferModele()');
  for (let i = 0; i < 30 && serveur.generes.length < 3; i++) await p.pause(100);
  p.verifier(serveur.generes[2]?.keep_alive === -1, 'rechargé quand la case est recochée');
  try { await p.eval('setTimeout(() => window.close(), 50), true'); } catch { /* silence-ok: la fenêtre se ferme, la connexion de pilotage tombe (attendu) */ }
  for (let i = 0; i < 40 && serveur.generes.length < 4; i++) await p.pause(100);
  p.verifier(serveur.generes[3]?.keep_alive === 0, `modèle libéré à la fermeture de SubForge (${JSON.stringify(serveur.generes[3])})`);
  serveur.close();
};
