'use strict';
// Version 1.8, dans l'interface réelle (faux Ollama lent) :
//   1. Saison de 3 épisodes vidéo : l'épisode suivant est préparé pendant la traduction du précédent,
//      et le précédent est enregistré et ajouté à sa vidéo pendant la traduction du suivant.
//   2. Relecture ciblée : seules les scènes à risque sont relues ; bilan « sans risque sautées ».

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, utiliserFauxOllama, ffmpeg } = require('./outils');

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  p.verifier(!(await p.eval('document.getElementById("opt-relecture-ciblee").checked')), 'relecture ciblée décochée par défaut');
  await p.clic('#opt-relecture-ciblee');
  await p.pause(300);

  const d = path.join(p.dossierTemp, 'Saison 1');
  fs.mkdirSync(d);
  // 3 scènes par épisode (10 s d'écart) : « Yes. » et « Look at the sky. » sans risque, « Where are you? » à relire.
  // « LENT » : le faux Ollama met 0,7 s par demande.
  // Texte différent par épisode : sinon la mémoire de traduction sert les épisodes 2 et 3 instantanément.
  for (const n of [1, 2, 3]) {
    const srt = path.join(p.dossierTemp, `ep${n}.srt`);
    fs.writeFileSync(srt, `1\n00:00:00,500 --> 00:00:01,500\nLENT Yes ${n}.\n\n2\n00:00:12,000 --> 00:00:13,000\nLENT Where are you ${n}?\n\n3\n00:00:25,000 --> 00:00:26,000\nLENT Look at the sky ${n}.\n`);
    execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=30:r=5', '-i', srt,
      '-map', '0', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'srt', '-metadata:s:s:0', 'language=eng', path.join(d, `Serie.S01E0${n}.mkv`)]);
  }
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([d])})`);
  for (let i = 0; i < 100 && (await p.eval('document.querySelectorAll(".carte-fichier[data-etat=pret]").length')) < 3; i++) await p.pause(100);
  await p.clic('#btn-traduire');

  // Observation des cartes pendant le travail.
  let prepareEnAvance = false;
  let finiPendantSuivant = false;
  let capture = false;
  for (let i = 0; i < 600; i++) {
    const etats = await p.eval('[...document.querySelectorAll(".carte-fichier")].map((c) => c.dataset.etat)');
    if (etats[0] === 'traduction' && etats[1] === 'attente') prepareEnAvance = true;
    if (['integration', 'ecriture', 'termine'].includes(etats[0]) && ['traduction', 'relecture'].includes(etats[1])) finiPendantSuivant = true;
    if (!capture && ['traduction', 'relecture'].includes(etats[1]) && etats[0] !== 'traduction') { await p.capture('e2e-v18-chaine'); capture = true; }
    if (etats.every((x) => ['termine', 'erreur', 'annule'].includes(x))) break;
    await p.pause(50);
  }
  p.verifier(prepareEnAvance, 'épisode 2 préparé pendant la traduction de l\'épisode 1');
  p.verifier(finiPendantSuivant, 'épisode 1 enregistré et ajouté à sa vidéo pendant la traduction de l\'épisode 2');
  const fichiers = fs.readdirSync(d).sort();
  p.verifier(JSON.stringify(fichiers) === JSON.stringify(['Serie.S01E01.FR.mkv', 'Serie.S01E01.mkv', 'Serie.S01E02.FR.mkv', 'Serie.S01E02.mkv', 'Serie.S01E03.FR.mkv', 'Serie.S01E03.mkv']), `3 épisodes avec leur piste (${fichiers.join(', ')})`);

  // Relecture ciblée.
  const relues = serveur.relectures.map((r) => r.lignes.map((l) => l.original).join(' | '));
  p.verifier(relues.length === 3 && relues.every((x) => /^LENT Where are you \d\?$/.test(x)), `seule la scène à risque est relue (${relues.join(' ; ')})`);
  const carte = await p.texte('.carte-fichier');
  p.verifier(/1 scène relue, 2 sans risque sautées/.test(carte), `bilan de la relecture ciblée (${carte.slice(0, 260)})`);
  serveur.close();
};
