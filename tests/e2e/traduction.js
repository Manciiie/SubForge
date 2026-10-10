'use strict';
// Scénario de bout en bout, dans l'interface réelle (node scripts/piloter.js tests/e2e/traduction.js [--exe …]).
// Un faux Ollama tourne dans ce processus : marche aussi sur la version compilée, sans réseau ni GPU.
//   1. Moteurs : adresse du faux Ollama, modèle choisi, test.
//   2. Traduire : un SRT (Windows-1252, italiques, dialogue) + un vrai MKV (piste SRT + piste ASS).
//   3. Vérifie les fichiers écrits sur le disque, l'aperçu, puis l'annulation (aucun fichier partiel).
//   4. Si SUBFORGE_DEEPL_URL_TEST est défini (développement) : clé DeepL enregistrée puis masquée.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, ffmpeg } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  const adresse = `http://127.0.0.1:${serveur.address().port}`;
  const d = path.join(p.dossierTemp, 'Mes films à moi');
  fs.mkdirSync(d);

  // --- Fichiers d'exemple -------------------------------------------------------------
  const srt = path.join(d, 'Le Film (2021).en.srt');
  const contenu = '1\r\n00:00:01,000 --> 00:00:03,000\r\n<i>Where are you going,</i>\r\n<i>my dear?</i>\r\n\r\n'
    + '2\r\n00:00:04,000 --> 00:00:06,000\r\n- To the café.\r\n- Again?\r\n\r\n3\r\n00:00:07,000 --> 00:00:08,000\r\n* * *\r\n';
  fs.writeFileSync(srt, Buffer.from(contenu, 'latin1')); // « café » en Windows-1252

  const pisteSrt = path.join(p.dossierTemp, 'p.srt');
  const pisteAss = path.join(p.dossierTemp, 'p.ass');
  fs.writeFileSync(pisteSrt, '1\n00:00:00,500 --> 00:00:01,500\nHello from the movie\n\n2\n00:00:01,600 --> 00:00:02,500\nSee you\n');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-i', pisteSrt, pisteAss]);
  const mkv = path.join(d, 'Vacances.2019.mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x48:d=3', '-i', pisteSrt, '-i', pisteAss,
    '-map', '0:v', '-map', '1', '-map', '2', '-c:v', 'mpeg4', '-c:s:0', 'srt', '-c:s:1', 'ass',
    '-metadata:s:s:0', 'language=eng', '-metadata:s:s:0', 'title=Forced', '-disposition:s:0', 'forced',
    '-metadata:s:s:1', 'language=eng', '-metadata:s:s:1', 'title=Full', mkv]);
  const tailleMkv = fs.statSync(mkv).size;

  const lent = path.join(d, 'Long.en.srt');
  fs.writeFileSync(lent, Array.from({ length: 400 }, (_, i) => `${i + 1}\n00:00:${String(i % 60).padStart(2, '0')},000 --> 00:00:${String(i % 60).padStart(2, '0')},900\nLENT ligne ${i}\n`).join('\n'));

  // --- 1. Moteurs ------------------------------------------------------------------
  await p.ecran('moteurs');
  await p.saisir('#ollama-adresse', adresse);
  await p.clic('#btn-ollama-actualiser');
  for (let i = 0; i < 30 && !(await p.eval('[...document.querySelectorAll("#ollama-modele option")].some((o) => o.value === "faux-modele:1b")')); i++) await p.pause(150);
  await p.choisir('#ollama-modele', 'faux-modele:1b');
  await p.clic('#btn-ollama-tester');
  for (let i = 0; i < 30 && !/Good morning/.test(await p.texte('#ollama-statut')); i++) await p.pause(150);
  p.verifier(/\[fr\] Good morning/.test(await p.texte('#ollama-statut')), 'test de l\'IA locale : réponse affichée');

  if (process.env.SUBFORGE_DEEPL_URL_TEST) {
    await p.saisir('#deepl-cle', 'f63c02c5-f056-4e9a-91a3-5d1c3e8b7a42:fx');
    await p.clic('#btn-deepl-enregistrer');
    await p.attendre('#deepl-cle-presente:not([hidden])', 8000);
    p.verifier(await p.eval('document.getElementById("deepl-cle").value === ""'), 'clé DeepL : champ vidé après enregistrement');
    p.verifier(!(await p.eval('document.body.innerText')).includes('f63c02c5'), 'clé DeepL : jamais réaffichée');
    p.verifier(/500/.test(await p.texte('#deepl-quota')), 'quota DeepL affiché');
  }
  await p.capture('e2e-moteurs');

  // --- 2. Traduire -----------------------------------------------------------------
  await p.ecran('traduire');
  await p.choisir('#opt-moteur', 'ollama');
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt, mkv])})`);
  await p.attendre('.carte-fichier[data-etat="pret"] + .carte-fichier[data-etat="pret"]', 15000);
  const options = await p.eval('[...document.querySelectorAll(".select-piste option")].map((o) => o.textContent)');
  p.verifier(options.length === 2 && /Forced/.test(options[0]) && /forcés/.test(options[0]), 'MKV : deux pistes listées, la piste « forcés » signalée');
  p.verifier(await p.eval('document.querySelector(".select-piste").value === "1"'), 'MKV : la piste complète est choisie par défaut');
  await p.capture('e2e-file');

  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"] + .carte-fichier[data-etat="termine"]', 20000);
  const sortieSrt = path.join(d, 'Le Film (2021).fr.srt');
  const sortieMkv = path.join(d, 'Vacances.2019.fr.ass');
  p.verifier(fs.existsSync(sortieSrt), 'SRT traduit écrit à côté de l\'original');
  const t = fs.readFileSync(sortieSrt, 'utf8');
  p.verifier(t.startsWith('﻿1\r\n00:00:01,000 --> 00:00:03,000\r\n<i>[fr]'), 'SRT : minutage, numéro et italique conservés');
  p.verifier(t.includes('- [fr] To the café.\r\n- [fr] Again?'), 'SRT : Windows-1252 relu, dialogue traduit ligne par ligne');
  p.verifier(t.includes('\r\n* * *\r\n'), 'SRT : réplique sans texte (symboles) laissée telle quelle');
  p.verifier(fs.existsSync(sortieMkv) && /Dialogue:.*\[fr\] Hello from the movie/.test(fs.readFileSync(sortieMkv, 'utf8')), 'MKV : piste ASS extraite et traduite en .ass');
  p.verifier(fs.statSync(mkv).size === tailleMkv, 'MKV : vidéo d\'origine intacte');
  await p.capture('e2e-termine');

  await p.clic('.carte-fichier .btn--petit');
  await p.attendre('#apercu:not([hidden]) .apercu__ligne:nth-child(3)');
  p.verifier(/Where are you going/.test(await p.texte('#apercu-table')) && /\[fr\]/.test(await p.texte('#apercu-table')), 'aperçu : original et traduction côte à côte');
  await p.capture('e2e-apercu');

  // --- 3. Annulation -----------------------------------------------------------------
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([lent])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="traduction"]', 10000);
  await p.pause(400);
  await p.capture('e2e-en-cours');
  await p.clic('#btn-annuler');
  await p.attendre('.carte-fichier[data-etat="annule"]', 10000);
  await p.attendre('#btn-traduire:not([hidden])', 5000);
  p.verifier(fs.readdirSync(d).filter((f) => f.startsWith('Long.')).join() === 'Long.en.srt', 'annulation : aucun fichier partiel laissé');

  // Relance : fichier existant jamais écrasé.
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('.carte-fichier[data-etat="annule"] .btn--lien');
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  p.verifier(fs.existsSync(path.join(d, 'Le Film (2021).fr (2).srt')), 'deuxième traduction : « (2) » ajouté, l\'existant n\'est pas écrasé');

  // --- 4. DeepL (développement uniquement, faux serveur) --------------------------------
  if (process.env.SUBFORGE_DEEPL_URL_TEST) {
    await p.clic('#btn-vider');
    await p.choisir('#opt-moteur', 'deepl');
    await p.choisir('#opt-cible', 'es');
    await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
    await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
    await p.clic('#btn-traduire');
    await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
    const es = fs.readFileSync(path.join(d, 'Le Film (2021).es.srt'), 'utf8');
    p.verifier(es.includes('<i>[ES] Where are you going, my dear?</i>') || es.includes('<i>[ES] Where are you'), 'DeepL : SRT traduit en espagnol, italique conservé');
  }

  serveur.closeAllConnections?.();
  serveur.close();
};
