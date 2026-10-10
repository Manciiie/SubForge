'use strict';
// Saison entière, dans l'interface réelle : un dossier « Saison 1 » glissé d'un bloc (faux Ollama).
//   E01 : MKV avec piste SRT  → traduit
//   E02 : MKV + E02.fr.srt    → déjà traduit, ignoré
//   E03 : MKV + E03.en.srt    → le .srt est traduit, pas la vidéo
//   Bonus/Making-of.mkv       → sous-dossier, traduit

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, ffmpeg, utiliserFauxOllama } = require('./outils');

function film(chemin, srt) {
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x48:d=2', '-i', srt,
    '-map', '0:v', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'srt', '-metadata:s:s:0', 'language=eng', chemin]);
}

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');

  const s = path.join(p.dossierTemp, 'Ma Série', 'Saison 1');
  fs.mkdirSync(path.join(s, 'Bonus'), { recursive: true });
  const piste = path.join(p.dossierTemp, 'piste.srt');
  fs.writeFileSync(piste, '1\n00:00:00,200 --> 00:00:01,500\nPrevious episode\n');
  for (const n of ['01', '02', '03']) film(path.join(s, `Serie.S01E${n}.mkv`), piste);
  film(path.join(s, 'Bonus', 'Making-of.mkv'), piste);
  fs.writeFileSync(path.join(s, 'Serie.S01E02.fr.srt'), '1\n00:00:00,200 --> 00:00:01,500\nDéjà traduit\n');
  fs.writeFileSync(path.join(s, 'Serie.S01E03.en.srt'), '1\n00:00:00,200 --> 00:00:01,500\nExternal subtitle\n');

  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.dirname(s)])})`);
  await p.attendre('.carte-fichier:nth-child(3)', 15000);
  for (let i = 0; i < 50 && (await p.eval('document.querySelectorAll(".carte-fichier[data-etat=analyse]").length')); i++) await p.pause(200);
  const noms = await p.eval('[...document.querySelectorAll(".carte-fichier__nom")].map((n) => n.textContent)');
  p.verifier(JSON.stringify(noms) === JSON.stringify(['Making-of.mkv', 'Serie.S01E01.mkv', 'Serie.S01E03.en.srt']), `saison : 3 fichiers retenus dans l'ordre (${noms.join(', ')})`);
  p.verifier(/déjà traduit/.test(await p.texte('#notifications')) && /remplacée/.test(await p.texte('#notifications')), 'bilan affiché : déjà traduit et vidéo remplacée');
  await p.capture('e2e-saison-file');

  await p.clic('#btn-traduire');
  for (let i = 0; i < 100 && (await p.eval('document.querySelectorAll(".carte-fichier[data-etat=termine]").length')) < 3; i++) await p.pause(200);
  p.verifier(fs.existsSync(path.join(s, 'Serie.S01E01.fr.srt')), 'E01 traduit depuis la piste du MKV');
  p.verifier(/\[fr\] External subtitle/.test(fs.readFileSync(path.join(s, 'Serie.S01E03.fr.srt'), 'utf8')), 'E03 traduit depuis son .srt externe');
  p.verifier(fs.readFileSync(path.join(s, 'Serie.S01E02.fr.srt'), 'utf8').includes('Déjà traduit'), 'E02 intact (déjà traduit)');
  p.verifier(fs.existsSync(path.join(s, 'Bonus', 'Making-of.fr.srt')), 'sous-dossier traduit');
  await p.capture('e2e-saison-termine');

  // Le même dossier glissé une deuxième fois : tout est déjà traduit.
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.dirname(s)])})`);
  await p.pause(600);
  p.verifier(/Tout est déjà traduit/.test(await p.texte('#notifications')), 'deuxième passage : « Tout est déjà traduit »');
  p.verifier((await p.eval('document.querySelectorAll(".carte-fichier").length')) === 0, 'aucune carte ajoutée');

  serveur.close();
};
