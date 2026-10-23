'use strict';
// Version 1.9, dans l'interface réelle (faux Ollama). Lancer avec une « corbeille » de test :
//   SUBFORGE_CORBEILLE_TEST=/tmp/corbeille node scripts/piloter.js tests/e2e/v19.js
//   1. Lots adaptés : 100 répliques courtes → 3 demandes de traduction (40 + 40 + 20).
//   2. « Film d'origine avec la piste » : Film.mp4 → Film.mkv avec la piste, original à la corbeille.
//   3. Film déjà traduit par SubForge : « Déjà traduit », pas retraduit sans le demander.
//   4. Film.mkv déjà présent à côté d'Autre.mp4… : les deux sont gardés, la carte le dit.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, utiliserFauxOllama, ffmpeg } = require('./outils');

module.exports = async (p) => {
  const corbeille = process.env.SUBFORGE_CORBEILLE_TEST;
  if (!corbeille) throw new Error('Lancer avec SUBFORGE_CORBEILLE_TEST (voir l\'en-tête du fichier).');
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');
  await p.eval('document.getElementById("opt-relecture").checked && document.getElementById("opt-relecture").click()');
  await p.pause(300);

  // --- 1. Lots adaptés ------------------------------------------------------------------------
  await p.ecran('moteurs');
  p.verifier(await p.eval('document.getElementById("ollama-lots").checked'), 'lots adaptés cochés par défaut');
  await p.ecran('traduire');
  await p.choisir('#opt-resultat', 'fichier');
  const srt = path.join(p.dossierTemp, 'Court.en.srt');
  fs.writeFileSync(srt, Array.from({ length: 100 }, (_, i) => `${i + 1}\n${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00,000 --> 00:${String(i % 60).padStart(2, '0')}:00,900\nWhere are you going tonight? ${i}\n`).join('\n').replace(/^(\d+\n)(\d\d):(\d\d):00/gm, '$100:$2:$3'));
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  p.verifier(serveur.demandes.length === 3, `3 demandes au lieu de 5 (${serveur.demandes.length})`);
  p.verifier(/\[fr\] Where are you going tonight\? 99/.test(fs.readFileSync(path.join(p.dossierTemp, 'Court.fr.srt'), 'utf8')), 'tout traduit');
  await p.clic('#btn-vider');

  // --- 2. Remplacer le film d'origine ------------------------------------------------------------
  const d = path.join(p.dossierTemp, 'Films');
  fs.mkdirSync(d);
  const piste = path.join(p.dossierTemp, 'piste.srt');
  fs.writeFileSync(piste, '1\n00:00:00,500 --> 00:00:01,500\nHello there\n\n2\n00:00:02,000 --> 00:00:03,000\nGood night\n');
  const fabriquer = (nom) => execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=4', '-f', 'lavfi', '-i', 'sine=d=4',
    '-i', piste, '-map', '0', '-map', '1', '-map', '2', '-c:v', 'mpeg4', '-c:a', 'aac', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', path.join(d, nom)]);
  fabriquer('Film.mp4');
  await p.eval('window.confirm = () => true'); // la vraie fenêtre de confirmation bloquerait le pilotage
  await p.choisir('#opt-resultat', 'remplacer');
  await p.pause(300);
  p.verifier((await p.eval('document.getElementById("opt-resultat").value')) === 'remplacer', 'option « film d\'origine » choisie');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.join(d, 'Film.mp4')])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  p.verifier(JSON.stringify(fs.readdirSync(d)) === JSON.stringify(['Film.mkv']), `un seul film, en MKV (${fs.readdirSync(d).join(', ')})`);
  p.verifier(fs.existsSync(path.join(corbeille, 'Film.mp4')), 'original à la corbeille');
  const desc = (() => { try { execFileSync(ffmpeg(), ['-hide_banner', '-nostdin', '-i', path.join(d, 'Film.mkv')], { stdio: ['ignore', 'pipe', 'pipe'] }); return ''; } catch (e) { return String(e.stderr); } })();
  p.verifier(/\(fre\): Subtitle: subrip/.test(desc) && /SUBFORGE\s*: 1/i.test(desc) && /Audio:/.test(desc), 'film complet avec la piste française marquée');
  const carte = await p.texte('.carte-fichier');
  p.verifier(/Piste ajoutée au film d'origine \(devenu Film\.mkv\) ; l'ancienne version est dans la corbeille\./.test(carte), `bilan (${carte.slice(0, 260)})`);
  await p.capture('e2e-v19-remplace');

  // --- 3. Déjà traduit --------------------------------------------------------------------------
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.join(d, 'Film.mkv')])})`);
  await p.attendre('.carte-fichier[data-etat="deja"]', 10000);
  p.verifier(/Ce film contient déjà la piste « Français » ajoutée par SubForge/.test(await p.texte('.carte-fichier')), 'carte « Déjà traduit »');
  p.verifier(await p.eval('document.getElementById("btn-traduire").disabled'), 'rien à traduire');
  await p.capture('e2e-v19-deja');
  await p.eval('[...document.querySelectorAll(".carte-fichier .btn")].find((b) => b.textContent === "Retraduire quand même").click()');
  await p.pause(200);
  p.verifier((await p.eval('document.querySelector(".carte-fichier").dataset.etat')) === 'pret' && !(await p.eval('document.getElementById("btn-traduire").disabled')), '« Retraduire quand même » possible');
  p.verifier(/Anglais/.test(await p.eval('document.querySelector(".select-piste").selectedOptions[0].textContent')), 'piste d\'origine (anglaise) choisie, pas la piste ajoutée');

  // --- 3 bis. MKV remplacé sous le même nom ---------------------------------------------------------
  await p.clic('#btn-vider');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:d=4', '-i', piste,
    '-map', '0', '-map', '1', '-c:v', 'mpeg4', '-c:s', 'srt', '-metadata:s:s:0', 'language=eng', path.join(d, 'Serie.mkv')]);
  const tailleAvant = fs.statSync(path.join(d, 'Serie.mkv')).size;
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.join(d, 'Serie.mkv')])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  p.verifier(fs.existsSync(path.join(corbeille, 'Serie.mkv')) && fs.statSync(path.join(corbeille, 'Serie.mkv')).size === tailleAvant, 'original MKV à la corbeille, intact');
  p.verifier(fs.statSync(path.join(d, 'Serie.mkv')).size > tailleAvant && !fs.readdirSync(d).some((f) => /en-cours|\.part$/.test(f)), 'Serie.mkv remplacé, aucun fichier temporaire restant');
  p.verifier(/Piste ajoutée au film d'origine ; l'ancienne version est dans la corbeille\./.test(await p.texte('.carte-fichier')), 'bilan (même nom)');

  // --- 4. Conflit de nom ---------------------------------------------------------------------------
  await p.clic('#btn-vider');
  fabriquer('Autre.mp4');
  fs.writeFileSync(path.join(d, 'Autre.mkv'), 'un autre fichier, à ne pas écraser');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.join(d, 'Autre.mp4')])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 30000);
  p.verifier(fs.existsSync(path.join(d, 'Autre.mp4')) && fs.readFileSync(path.join(d, 'Autre.mkv'), 'utf8').startsWith('un autre fichier') && fs.existsSync(path.join(d, 'Autre.FR.mkv')), `conflit : tout est gardé (${fs.readdirSync(d).join(', ')})`);
  p.verifier(/Remplacement non fait : film d'origine gardé \(« Autre\.mkv » existe déjà\)/.test(await p.texte('.carte-fichier')), 'la carte explique pourquoi');
  serveur.close();
};
