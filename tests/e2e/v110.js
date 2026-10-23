'use strict';
// Version 1.10, dans l'interface réelle (faux Ollama) :
//   1. Conseils : carte inconnue → choix « 8 Go » ; verdicts (trop gros, version rapide, réflexion, bon) ;
//      modèle conseillé qwen2.5:7b avec sa commande ; copie de la commande dans le presse-papiers.
//   2. Réglages d'Ollama : hors Windows, état lu depuis l'environnement, instructions affichées, pas de bouton.
//   3. Modèle qui réfléchit : la traduction et la relecture envoient think: false.

const fs = require('fs');
const path = require('path');
const { fauxOllama, utiliserFauxOllama } = require('./outils');

const GO = 1e9;
module.exports = async (p) => {
  const serveur = await fauxOllama();
  serveur.modeles = [
    { name: 'faux-modele:1b', size: 1.2 * GO, details: { family: 'qwen2', parameter_size: '1B', quantization_level: 'Q4_K_M' } },
    { name: 'qwen2.5:14b-instruct-q8_0', size: 15.7 * GO, details: { quantization_level: 'Q8_0' } },
    { name: 'llama3.1:8b-instruct-q6_K', size: 6.6 * GO, details: { quantization_level: 'Q6_K' } },
    { name: 'qwen3:8b', size: 5.2 * GO, details: { quantization_level: 'Q4_K_M' } },
    { name: 'nomic-embed-text:latest', size: 0.3 * GO },
  ];
  serveur.reflexion = (m) => /^(qwen3|faux-modele)/.test(m);
  await utiliserFauxOllama(p, serveur);

  // --- 1. Conseils ------------------------------------------------------------------------------
  await p.ecran('moteurs');
  await p.clic('#btn-conseils-analyser');
  await p.attendre('#conseils-resultat:not([hidden])', 15000);
  const carte = await p.texte('#conseils-carte');
  const vramVisible = await p.eval('!document.getElementById("conseils-vram-zone").hidden');
  p.verifier(vramVisible || /\d+ Go de mémoire vidéo/.test(carte), `carte lue ou mémoire à indiquer (${carte})`);
  p.verifier(!(await p.eval('document.getElementById("conseils-modeles").textContent.includes("nomic-embed")')), 'modèles d\'« embedding » ignorés');
  if (vramVisible) {
    await p.choisir('#conseils-vram', '8');
    for (let i = 0; i < 40 && !/8 Go de mémoire vidéo \(indiquée par vous\)/.test(await p.texte('#conseils-carte')); i++) await p.pause(150);
  }
  const carte2 = await p.texte('#conseils-carte');
  p.verifier(/8 Go de mémoire vidéo/.test(carte2), `8 Go pris en compte (${carte2})`);
  const lignes = await p.eval('[...document.querySelectorAll("#conseils-modeles .table-glossaire__ligne:not(.table-glossaire__ligne--entete)")].map((l) => l.textContent)');
  const ligne = (nom) => lignes.find((l) => l.startsWith(nom)) || '';
  p.verifier(/Trop gros pour la carte \(15,7 Go pour 8 Go\).*q4_K_M.*Copier la commande/.test(ligne('qwen2.5:14b')), `14b q8 trop gros (${ligne('qwen2.5:14b')})`);
  p.verifier(/la version q4_K_M va 20 à 40 % plus vite/.test(ligne('llama3.1')), `llama q6 : version rapide (${ligne('llama3.1')})`);
  p.verifier(/réfléchit.*coupe cette réflexion/.test(ligne('qwen3:8b')), `qwen3 : réflexion (${ligne('qwen3:8b')})`);
  p.verifier(/faux-modele:1b {2}\(utilisé\)/.test(ligne('faux-modele')), `modèle utilisé signalé (${ligne('faux-modele')})`);
  const reco = await p.texte('#conseils-reco');
  p.verifier(/qwen2\.5:7b.*4,7 Go.*ollama pull qwen2\.5:7b/.test(reco), `conseil qwen2.5:7b (${reco})`);
  await p.eval('document.querySelector("#conseils-reco button").click()');
  await p.pause(500);
  const notif = await p.eval('document.body.textContent.includes("Commande copiée")');
  p.verifier(notif, 'commande copiée (message affiché)');

  // --- 2. Réglages d'Ollama (hors Windows ici) ----------------------------------------------------------
  const reglages = await p.texte('#conseils-reglages');
  p.verifier(/Flash attention.*Mémoire de travail compressée.*q8_0.*Demandes simultanées/.test(reglages), `3 réglages listés (${reglages})`);
  p.verifier(await p.eval('document.getElementById("btn-conseils-activer").hidden && document.getElementById("btn-conseils-retablir").hidden'), 'pas de bouton hors Windows');
  const instr = await p.texte('#conseils-instructions');
  p.verifier(/Environment="OLLAMA_FLASH_ATTENTION=1"/.test(instr) && /OLLAMA_KV_CACHE_TYPE=q8_0/.test(instr) && /OLLAMA_NUM_PARALLEL=2/.test(instr), `instructions (${instr})`);
  await p.capture('e2e-v110-conseils');

  // --- 3. think: false pour un modèle qui réfléchit ----------------------------------------------------
  await p.ecran('traduire');
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  await p.choisir('#opt-resultat', 'fichier');
  await p.eval('document.getElementById("opt-relecture").checked || document.getElementById("opt-relecture").click()');
  const srt = path.join(p.dossierTemp, 'Pense.en.srt');
  fs.writeFileSync(srt, '1\n00:00:01,000 --> 00:00:02,000\nHello there\n\n2\n00:00:03,000 --> 00:00:04,000\nGood night\n');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  const envois = serveur.options.filter((o) => o.model === 'faux-modele:1b');
  p.verifier(envois.length >= 2 && envois.every((o) => o.think === false), `think:false à chaque demande (${JSON.stringify(envois)})`);
  p.verifier(serveur.relectures.length >= 1, 'relecture faite (avec think:false)');
  p.verifier(/\[fr\] Hello there/.test(fs.readFileSync(path.join(p.dossierTemp, 'Pense.fr.srt'), 'utf8')), 'traduit');
  serveur.close();
};
