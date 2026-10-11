'use strict';
// Version 1.2, dans l'interface réelle (faux Ollama) :
//   1. IA locale : adresse du faux Ollama saisie → modèle unique choisi tout seul, moteur basculé
//      sur l'IA locale (pas de clé DeepL), sans rien sélectionner à la main.
//   2. Messages d'erreur sans « Error: ».
//   3. Résultat par défaut (1.2.1) : un seul fichier, Film.FR.mkv avec la piste traduite, aucun
//      sous-titre séparé ; original intact. Puis « film + fichier » : les deux.

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
  p.verifier((await p.eval('document.getElementById("opt-resultat").value')) === 'film', 'par défaut : film avec la piste traduite');
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
  const carte = await p.texte('.carte-fichier');
  p.verifier(/→ The Witch Part 1 \(2018\)\.FR\.mkv/.test(carte) && /choisissez-la dans votre lecteur/.test(carte), `carte : résultat = le film (${carte.slice(0, 200)})`);
  p.verifier(JSON.stringify(fs.readdirSync(d).sort()) === JSON.stringify(['The Witch Part 1 (2018).FR.mkv', 'The Witch Part 1 (2018).mkv']), `aucun fichier de sous-titres séparé, aucun .part (${fs.readdirSync(d).join(', ')})`);
  await p.capture('e2e-v12-integration');

  // --- 4. Film + fichier séparé ----------------------------------------------------------
  await p.choisir('#opt-resultat', 'film-et-fichier');
  await p.pause(300);
  const d2 = path.join(p.dossierTemp, 'Films2');
  fs.mkdirSync(d2);
  const mkv2 = path.join(d2, 'Autre.mkv');
  fs.copyFileSync(mkv, mkv2);
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([mkv2])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 15000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  p.verifier(fs.existsSync(path.join(d2, 'Autre.FR.mkv')) && fs.existsSync(path.join(d2, 'Autre.fr.srt')), 'film + fichier : Autre.FR.mkv et Autre.fr.srt');
  p.verifier(/Film avec la piste traduite → Autre\.FR\.mkv/.test(await p.texte('.carte-fichier')), 'carte : lien vers le film');

  // --- 5. Film dont la piste est en ASS : la piste ajoutée est en SRT (lecteur Windows) -----
  await p.choisir('#opt-resultat', 'film');
  await p.pause(300);
  const d3 = path.join(p.dossierTemp, 'Films3');
  fs.mkdirSync(d3);
  const mkv3 = path.join(d3, 'Anime.mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=3', '-i', srt,
    '-map', '0', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'ass', '-metadata:s:s:0', 'language=eng', mkv3]);
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([mkv3])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 15000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  const copie3 = path.join(d3, 'Anime.FR.mkv');
  let desc3 = '';
  try { execFileSync(ffmpeg(), ['-hide_banner', '-nostdin', '-i', copie3], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { desc3 = String(e.stderr); }
  p.verifier(/\(fre\): Subtitle: subrip.*\(default\)/.test(desc3), `piste ASS d'origine → piste française en SRT (${(desc3.match(/Subtitle:.*/g) || []).join(' | ')})`);
  const texte3 = execFileSync(ffmpeg(), ['-loglevel', 'error', '-i', copie3, '-map', '0:s:1', '-f', 'srt', '-'], { encoding: 'utf8' });
  p.verifier(/00:00:00,500 --> 00:00:01,500/.test(texte3) && /\[fr\] Hello there/.test(texte3), `texte et minutage de la piste française (${texte3.trim().replace(/\s+/g, ' ')})`);
  p.verifier(JSON.stringify(fs.readdirSync(d3).sort()) === JSON.stringify(['Anime.FR.mkv', 'Anime.mkv']), `toujours un seul fichier (${fs.readdirSync(d3).join(', ')})`);

  // --- 6. Modèle qui recopie au lieu de traduire : message clair, aucun film « traduit » en anglais ---
  serveur.recopier = true;
  const d4 = path.join(p.dossierTemp, 'Films4');
  fs.mkdirSync(d4);
  const srt4 = path.join(p.dossierTemp, 'p4.srt');
  fs.writeFileSync(srt4, Array.from({ length: 12 }, (_, i) => `${i + 1}\n00:00:0${Math.floor(i / 5)},${String((i % 5) * 200).padStart(3, '0')} --> 00:00:0${Math.floor(i / 5)},${String((i % 5) * 200 + 150).padStart(3, '0')}\nThey are Americans number ${i}\n`).join('\n'));
  const mkv4 = path.join(d4, 'Witch.mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=3', '-i', srt4,
    '-map', '0', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'srt', '-metadata:s:s:0', 'language=eng', mkv4]);
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([mkv4])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 15000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="erreur"]', 60000);
  const carte4 = await p.texte('.carte-fichier');
  p.verifier(/renvoie les répliques sans les traduire|Traduction ratée/.test(carte4), `carte : message clair (${carte4.slice(0, 260)})`);
  p.verifier(JSON.stringify(fs.readdirSync(d4)) === JSON.stringify(['Witch.mkv']), `aucun film ni sous-titre « traduit » créé (${fs.readdirSync(d4).join(', ')})`);
  await p.capture('e2e-v12-recopie');
  serveur.recopier = false;
  serveur.close();
};
