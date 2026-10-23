'use strict';
// Version 1.6, dans l'interface réelle (faux Ollama lent) :
//   1. Moteurs : « Demandes simultanées » (2 par défaut) ; « Mesurer sur ce PC » règle la valeur.
//   2. Film + sous-titre décalé : la synchronisation et la relecture avancent pendant la traduction ;
//      résultat identique (recalé de +2,5 s, Film.FR.mkv).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fauxOllama, utiliserFauxOllama, ffmpeg } = require('./outils');

function hasard(graine) { let x = graine; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
const temps = (ms) => { const v = Math.max(0, Math.round(ms)); const d2 = (n) => String(n).padStart(2, '0'); return `${d2(Math.floor(v / 3600000))}:${d2(Math.floor(v / 60000) % 60)}:${d2(Math.floor(v / 1000) % 60)},${String(v % 1000).padStart(3, '0')}`; };

module.exports = async (p) => {
  const serveur = await fauxOllama();
  await utiliserFauxOllama(p, serveur);
  await p.choisir('#opt-source', 'en');
  await p.choisir('#opt-cible', 'fr');

  // --- 1. Demandes simultanées --------------------------------------------------------------
  await p.ecran('moteurs');
  p.verifier((await p.eval('document.getElementById("ollama-parallele").value')) === '2', 'demandes simultanées : 2 par défaut');
  await p.clic('#btn-ollama-mesurer');
  for (let i = 0; i < 100 && !/40 répliques/.test(await p.texte('#ollama-mesure')); i++) await p.pause(150);
  const mesure = await p.texte('#ollama-mesure');
  const conseil = /réglé sur (\d)/.exec(mesure)?.[1];
  p.verifier(Boolean(conseil) && (await p.eval('document.getElementById("ollama-parallele").value')) === conseil, `mesure faite et appliquée (${mesure})`);
  await p.eval('document.getElementById("ollama-parallele").scrollIntoView({ block: "center" })');
  await p.pause(200);
  await p.capture('e2e-v16-mesure');
  await p.choisir('#ollama-parallele', '2');
  await p.pause(300);

  // --- 2. Synchronisation + relecture en parallèle -------------------------------------------
  await p.ecran('traduire');
  const d = path.join(p.dossierTemp, 'Film');
  fs.mkdirSync(d);
  const h = hasard(8);
  const vraies = [];
  for (let t = 2000; t < 590000;) { const du = 1000 + h() * 3000; vraies.push([t, t + du]); t += du + 500 + h() * 5500; }
  const pcm = Buffer.alloc(600 * 8000 * 2);
  let k = 0;
  for (let i = 0; i < 600 * 8000; i++) {
    const t = i / 8;
    while (k < vraies.length && vraies[k][1] < t) k += 1;
    pcm.writeInt16LE(Math.round((h() * 2 - 1) * (k < vraies.length && vraies[k][0] <= t ? 9000 : 500)), i * 2);
  }
  fs.writeFileSync(path.join(p.dossierTemp, 'son.pcm'), pcm);
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x36:d=600:r=2',
    '-f', 's16le', '-ar', '8000', '-ac', '1', '-i', path.join(p.dossierTemp, 'son.pcm'), '-c:v', 'mpeg4', '-c:a', 'pcm_s16le', '-shortest', path.join(d, 'Film.mkv')]);
  // « LENT » : le faux Ollama met 0,7 s par demande → la traduction dure quelques secondes.
  fs.writeFileSync(path.join(d, 'Film.en.srt'), vraies.map(([a, b], i) => `${i + 1}\n${temps(a - 2500)} --> ${temps(b - 2500)}\nLENT line number ${i}\n`).join('\n'));
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.join(d, 'Film.en.srt')])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  let vuSynchro = false;
  let vuRelecture = false;
  let capture = false;
  for (let i = 0; i < 600; i++) {
    const etat = await p.eval('document.querySelector(".carte-fichier").dataset.etat');
    const texte = await p.texte('.carte-fichier');
    if (etat === 'traduction' && /Synchronisation en parallèle : \d+ %/.test(texte)) vuSynchro = true;
    if (etat === 'traduction' && /Relecture en parallèle : \d+ \/ \d+ scènes/.test(texte)) vuRelecture = true;
    if (!capture && etat === 'traduction' && /Synchronisation en parallèle/.test(texte) && /Relecture en parallèle/.test(texte)) {
      await p.eval('document.querySelector(".carte-fichier").scrollIntoView({ block: "center" })');
      await p.capture('e2e-v16-parallele');
      capture = true;
    }
    if (etat === 'termine' || etat === 'erreur') break;
    await p.pause(50);
  }
  p.verifier(vuSynchro, 'synchronisation affichée pendant la traduction');
  p.verifier(vuRelecture, 'relecture affichée pendant la traduction');
  await p.attendre('.carte-fichier[data-etat="termine"]', 60000);
  const carte = await p.texte('.carte-fichier');
  p.verifier(/Recalé sur le son de Film\.mkv : \+2,5 s\./.test(carte), `synchronisation appliquée (${carte.slice(0, 200)})`);
  p.verifier(fs.existsSync(path.join(d, 'Film.FR.mkv')), 'film avec la piste créé');
  const piste = execFileSync(ffmpeg(), ['-loglevel', 'error', '-i', path.join(d, 'Film.FR.mkv'), '-map', '0:s:0', '-f', 'srt', '-'], { encoding: 'utf8' });
  const deuxieme = [...piste.matchAll(/(\d\d):(\d\d):(\d\d),(\d{3}) -->/g)][1];
  const debut = ((Number(deuxieme[1]) * 60 + Number(deuxieme[2])) * 60 + Number(deuxieme[3])) * 1000 + Number(deuxieme[4]);
  p.verifier(Math.abs(debut - vraies[1][0]) <= 60, `piste recalée (${debut} ms, attendu ${Math.round(vraies[1][0])})`);
  serveur.close();
};
