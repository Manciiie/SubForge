'use strict';
// Recherche en ligne automatique pour toute une saison (faux OpenSubtitles lancé à part, voir faux-opensubtitles.js) :
// 3 épisodes sans sous-titres → E01 et E03 téléchargés automatiquement (même saison / épisode),
// E02 laissé « à choisir à la main » (aucun résultat sûr), la traduction automatique n'est jamais prise.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, ffmpeg, utiliserFauxOllama } = require('./outils');

module.exports = async (p) => {
  if (!process.env.SUBFORGE_OS_URL_TEST) throw new Error('Lancer avec SUBFORGE_OS_URL_TEST (voir faux-opensubtitles.js).');
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');

  // Clé OpenSubtitles.
  await p.ecran('moteurs');
  await p.saisir('#os-cle', 'abcdefghijklmnopqrstuvwxyz012345');
  await p.clic('#btn-os-enregistrer-cle');
  await p.attendre('#os-cle-presente:not([hidden])', 5000);
  await p.ecran('traduire');

  const d = path.join(p.dossierTemp, 'Serie', 'Saison 1');
  fs.mkdirSync(d, { recursive: true });
  for (const n of ['01', '02', '03']) {
    execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=2', '-c:v', 'mpeg4', path.join(d, `Serie.S01E${n}.mkv`)]);
  }
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.dirname(d)])})`);
  for (let i = 0; i < 50 && (await p.eval('document.querySelectorAll(".carte-fichier[data-etat=sans-piste]").length')) < 3; i++) await p.pause(200);
  const bouton = await p.texte('#btn-enligne-auto');
  p.verifier(/Chercher en ligne \(3 sans sous-titres\)/.test(bouton), `bouton proposé : « ${bouton} »`);
  await p.capture('e2e-enligne-saison-avant');

  await p.clic('#btn-enligne-auto');
  await p.pause(300);
  p.verifier(/Arrêter la recherche/.test(await p.texte('#btn-enligne-auto')), 'pendant la recherche : bouton « Arrêter la recherche »');
  for (let i = 0; i < 100 && !(/Chercher en ligne|^$/.test(await p.texte('#btn-enligne-auto')) && (await p.eval('document.getElementById("btn-enligne-auto").hidden || !/Arrêter/.test(document.getElementById("btn-enligne-auto").textContent)'))); i++) await p.pause(200);
  await p.pause(800);
  p.verifier(fs.existsSync(path.join(d, 'Serie.S01E01.en.srt')) && /Episode subtitle 8001/.test(fs.readFileSync(path.join(d, 'Serie.S01E01.en.srt'), 'utf8')), 'E01 : sous-titre du bon épisode téléchargé');
  p.verifier(/8003/.test(fs.readFileSync(path.join(d, 'Serie.S01E03.en.srt'), 'utf8')), 'E03 : sous-titre du bon épisode téléchargé (jamais la traduction automatique)');
  p.verifier(!fs.existsSync(path.join(d, 'Serie.S01E02.en.srt')), 'E02 : rien téléchargé (aucun résultat sûr)');
  const noms = await p.eval('[...document.querySelectorAll(".carte-fichier")].map((c) => c.querySelector(".carte-fichier__nom").textContent + "|" + c.dataset.etat)');
  p.verifier(noms.includes('Serie.S01E02.mkv|sans-piste') && noms.includes('Serie.S01E01.en.srt|pret') && noms.includes('Serie.S01E03.en.srt|pret'), `file : ${noms.join(', ')}`);
  p.verifier(/aucun sûr : choisissez à la main/.test(await p.eval('[...document.querySelectorAll(".carte-fichier")].find((c) => c.textContent.includes("E02")).textContent')), 'E02 : raison affichée');
  p.verifier(/2 sous-titre\(s\) téléchargé\(s\) sur 3 · 1 à choisir à la main/.test(await p.texte('#notifications')), 'bilan final affiché');
  await p.capture('e2e-enligne-saison-apres');

  await p.clic('#btn-traduire');
  for (let i = 0; i < 100 && (await p.eval('document.querySelectorAll(".carte-fichier[data-etat=termine]").length')) < 2; i++) await p.pause(200);
  p.verifier(fs.existsSync(path.join(d, 'Serie.S01E01.fr.srt')) && fs.existsSync(path.join(d, 'Serie.S01E03.fr.srt')), 'puis traduits : E01 et E03 en français');
  serveur.close();
};
