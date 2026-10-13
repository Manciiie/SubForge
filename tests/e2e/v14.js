'use strict';
// Version 1.4, dans l'interface réelle (faux Ollama) :
//   1. Tu ou vous : réglage présent, grisé pour une langue sans forme polie ; « tu » imposé envoyé.
//   2. Relecture IA : une correction tu/vous appliquée, un doute signalé ; bilan, fichier, aperçu.
//   3. Synchronisation : Film.en.srt décalé de 2,5 s posé à côté de Film.mkv → recalé, piste ajoutée au film.

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
  await p.pause(300);

  // --- 1. Tu ou vous ----------------------------------------------------------------------
  p.verifier((await p.eval('document.getElementById("opt-registre").value')) === 'auto', 'tu/vous : automatique par défaut');
  p.verifier((await p.eval('document.getElementById("opt-relecture").checked')) && (await p.eval('document.getElementById("opt-synchro").checked')), 'relecture et synchronisation cochées par défaut');
  await p.choisir('#opt-cible', 'en');
  await p.pause(300);
  p.verifier(await p.eval('document.getElementById("opt-registre").disabled'), 'tu/vous grisé pour l\'anglais');
  await p.choisir('#opt-cible', 'fr');
  await p.pause(300);
  p.verifier(!(await p.eval('document.getElementById("opt-registre").disabled')), 'tu/vous disponible pour le français');
  await p.choisir('#opt-registre', 'tu');
  await p.pause(300);

  // --- 2. Relecture -----------------------------------------------------------------------
  serveur.relire = (lignes) => ({
    corrections: lignes.filter((l) => /Are you coming/.test(l.original)).map((l) => ({ line: l.line, text: 'Tu viens ?', type: 'address', reason: 'tutoiement imposé' })),
    doubts: lignes.filter((l) => /Who is she/.test(l.original)).map((l) => ({ line: l.line, reason: 'genre du personnage à vérifier' })),
  });
  const srt = path.join(p.dossierTemp, 'Scene.en.srt');
  fs.writeFileSync(srt, '1\n00:00:01,000 --> 00:00:02,000\nAre you coming?\n\n2\n00:00:02,500 --> 00:00:03,500\nWho is she?\n\n3\n00:00:04,000 --> 00:00:05,000\nLet us go.\n');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([srt])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 20000);
  p.verifier(serveur.relectures.length === 1 && /formal form \(/.test(serveur.relectures[0].systeme) && /informal form \("tu"\)/.test(serveur.relectures[0].systeme), 'relecture demandée avec la règle « tu »');
  const carte = await p.texte('.carte-fichier');
  p.verifier(/Relecture IA : 1 réplique corrigée, dont 1 tu\/vous, 1 à vérifier \(1 scène\)/.test(carte), `bilan de relecture (${carte.slice(0, 260)})`);
  const sortie = fs.readFileSync(path.join(p.dossierTemp, 'Scene.fr.srt'), 'utf8');
  p.verifier(/Tu viens \?/.test(sortie) && /\[fr\] Who is she\?/.test(sortie), 'correction écrite dans le fichier');
  await p.eval('[...document.querySelectorAll(".carte-fichier .btn")].find((b) => b.textContent === "Aperçu").click()');
  await p.attendre('#apercu:not([hidden])', 5000);
  const apercu = await p.texte('#apercu');
  p.verifier(/Corrigée : tutoiement imposé/.test(apercu) && /À vérifier : genre du personnage à vérifier/.test(apercu), 'aperçu : corrections et doutes marqués');
  await p.clic('#apercu-filtre');
  await p.pause(300);
  p.verifier((await p.eval('document.querySelectorAll("#apercu-table .apercu__ligne:not(.apercu__ligne--entete)").length')) === 2, 'filtre : seulement les 2 répliques relues');
  await p.capture('e2e-v14-relecture');
  serveur.relire = null;

  // --- 3. Synchronisation ------------------------------------------------------------------
  const d = path.join(p.dossierTemp, 'Film');
  fs.mkdirSync(d);
  const h = hasard(4);
  const vraies = [];
  for (let t = 2000; t < 175000;) { const du = 1000 + h() * 3000; vraies.push([t, t + du]); t += du + 500 + h() * 5500; }
  const pcm = Buffer.alloc(180 * 8000 * 2);
  let k = 0;
  for (let i = 0; i < 180 * 8000; i++) {
    const t = i / 8;
    while (k < vraies.length && vraies[k][1] < t) k += 1;
    const voix = k < vraies.length && vraies[k][0] <= t && t <= vraies[k][1];
    pcm.writeInt16LE(Math.round((h() * 2 - 1) * (voix ? 9000 : 500)), i * 2);
  }
  fs.writeFileSync(path.join(p.dossierTemp, 'son.pcm'), pcm);
  const film = path.join(d, 'Film.mkv');
  execFileSync(ffmpeg(), ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x36:d=180:r=5',
    '-f', 's16le', '-ar', '8000', '-ac', '1', '-i', path.join(p.dossierTemp, 'son.pcm'), '-c:v', 'mpeg4', '-c:a', 'pcm_s16le', '-shortest', film]);
  fs.writeFileSync(path.join(d, 'Film.en.srt'), vraies.map(([a, b], i) => `${i + 1}\n${temps(a - 2500)} --> ${temps(b - 2500)}\nLine number ${i}\n`).join('\n'));
  await p.clic('#btn-vider');
  await p.eval(`window.__subforgeAjouter(${JSON.stringify([path.join(d, 'Film.en.srt')])})`);
  await p.attendre('.carte-fichier[data-etat="pret"]', 10000);
  await p.clic('#btn-traduire');
  await p.attendre('.carte-fichier[data-etat="termine"]', 60000);
  const carte3 = await p.texte('.carte-fichier');
  p.verifier(/Recalé sur le son de Film\.mkv : \+2,5 s\./.test(carte3), `bilan de synchronisation (${carte3.slice(0, 260)})`);
  p.verifier(JSON.stringify(fs.readdirSync(d).sort()) === JSON.stringify(['Film.FR.mkv', 'Film.en.srt', 'Film.mkv']), `un seul fichier ajouté : le film avec la piste (${fs.readdirSync(d).join(', ')})`);
  const piste = execFileSync(ffmpeg(), ['-loglevel', 'error', '-i', path.join(d, 'Film.FR.mkv'), '-map', '0:s:0', '-f', 'srt', '-'], { encoding: 'utf8' });
  // La 2e réplique (la 1re, avant 0 dans le fichier décalé, y avait été ramenée à 0).
  const deuxieme = [...piste.matchAll(/(\d\d):(\d\d):(\d\d),(\d{3}) -->/g)][1];
  const debut = deuxieme ? ((Number(deuxieme[1]) * 60 + Number(deuxieme[2])) * 60 + Number(deuxieme[3])) * 1000 + Number(deuxieme[4]) : -1;
  p.verifier(Math.abs(debut - vraies[1][0]) <= 60 && /\[fr\] Line number 1/.test(piste), `piste du film recalée (2e réplique à ${debut} ms, attendu ${Math.round(vraies[1][0])})`);
  await p.capture('e2e-v14-synchro');
  serveur.close();
};
