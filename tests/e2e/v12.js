'use strict';
// Version 1.2, dans l'interface réelle (faux Ollama) :
//   1. IA locale : adresse du faux Ollama saisie → modèle unique choisi tout seul, moteur basculé
//      sur l'IA locale (pas de clé DeepL), sans rien sélectionner à la main.
//   2. Messages d'erreur sans « Error: ».
//   3. « Ajouter au film » : Film.FR.mkv créé avec la piste traduite (par défaut), original intact.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, ffmpeg } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  p.verifier((await p.eval('document.getElementById("opt-moteur").value')) === 'deepl', 'au départ : moteur DeepL (réglage par défaut)');

  // --- 1. IA locale sans manipulation ---------------------------------------------------
  await p.ecran('moteurs');
  await p.saisir('#ollama-adresse', `http://127.0.0.1:${serveur.address().port}`);
  for (let i = 0; i < 40 && (await p.eval('document.getElementById("opt-moteur").value')) !== 'ollama'; i++) await p.pause(150);
  p.verifier((await p.eval('document.getElementById("ollama-modele").value')) === 'faux-modele:1b', 'modèle unique choisi automatiquement');
  p.verifier((await p.eval('document.getElementById("opt-moteur").value')) === 'ollama', 'moteur basculé sur l\'IA locale (pas de clé DeepL)');
  p.verifier(/Pas de clé DeepL : SubForge utilise l'IA locale/.test(await p.texte('#notifications')), 'notification de la bascule');
  await p.capture('e2e-v12-moteurs');

  // --- 2. Erreurs sans « Error: » --------------------------------------------------------
  await p.eval('window.UI.erreur(new Error("Error invoking remote method \'x\': Error: Message de test"))');
  const notes = await p.eval('[...document.querySelectorAll(".notification")].map((n) => n.textContent)');
  p.verifier(notes.includes('Message de test'), 'message affiché sans « Error: »');

  // --- 3. Ajouter au film ---------------------------------------------------------------
  await p.ecran('traduire');
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  await p.eval('(document.getElementById("opt-integrer").checked = true, document.getElementById("opt-integrer").dispatchEvent(new Event("change")))');
  await p.pause(300);
  const d = path.join(p.dossierTemp, 'Films');
  fs.mkdirSync(d);
  const srt = path.join(p.dossierTemp, 'p.srt');
  fs.writeFileSync(srt, '1\n00:00:00,500 --> 00:00:01,500\nHello there\n');
  const mkv = path.join(d, 'The Witch Part 1 (2018).mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=3', '-i', srt,
    '-map', '0', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'srt', '-metadata:s:s:0', 'language=eng', mkv]);
  const avant = fs.readFileSync(mkv);
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([mkv])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 15000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  const copie = path.join(d, 'The Witch Part 1 (2018).FR.mkv');
  p.verifier(fs.existsSync(copie), 'copie créée : Film.FR.mkv');
  p.verifier(fs.readFileSync(mkv).equals(avant), 'film d\'origine intact');
  let desc = '';
  try { execFileSync(ffmpeg(), ['-hide_banner', '-nostdin', '-i', copie], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { desc = String(e.stderr); }
  p.verifier(/Subtitle: subrip.*\n[\s\S]*\(fre\): Subtitle: subrip.*\(default\)/.test(desc) && /title\s*: Français/.test(desc), 'la copie contient la piste anglaise + la piste française nommée, par défaut');
  p.verifier(/Film avec la piste traduite → The Witch Part 1 \(2018\)\.FR\.mkv/.test(await p.texte('.carte-fichier')), 'carte : lien vers la copie');
  p.verifier(fs.existsSync(path.join(d, 'The Witch Part 1 (2018).fr.srt')), 'le sous-titre traduit est aussi gardé à côté');
  p.verifier(fs.readdirSync(d).every((f) => !f.endsWith('.part')), 'aucun fichier .part restant');
  await p.capture('e2e-v12-integration');
  serveur.close();
};
