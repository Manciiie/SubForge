'use strict';
// Outils partagés par les scénarios de bout en bout (pas un scénario).

const http = require('http');
const path = require('path');

const RACINE = path.resolve(__dirname, '..', '..');

// Faux Ollama : « traduit » en préfixant [fr], garde les marqueurs, compte les lignes reçues.
// Une ligne contenant LENT ralentit la réponse (pour tester l'annulation).
function fauxOllama() {
  return new Promise((ok) => {
    const recues = [];
    const s = http.createServer((req, res) => {
      let corps = '';
      req.on('data', (d) => { corps += d; });
      req.on('end', () => {
        if (req.url === '/api/tags') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ models: [{ name: 'faux-modele:1b', size: 1.2e9 }] }));
          return;
        }
        const msg = JSON.parse(corps);
        const lignes = lignesDemandees(msg.messages[1].content);
        const sortie = {};
        for (const [k, v] of Object.entries(lignes)) { sortie[k] = s.recopier ? v : `[fr] ${v}`; recues.push(v); } // s.recopier : imite un modèle qui ne traduit pas
        const lent = Object.values(lignes).some((v) => v.includes('LENT'));
        setTimeout(() => {
          if (res.destroyed) return;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: { role: 'assistant', content: JSON.stringify(sortie) } }));
        }, lent ? 700 : 20);
      });
    });
    s.recues = recues;
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

// Répliques demandées au modèle : « 1. "texte" », une par ligne (format de moteurs.js).
function lignesDemandees(contenu) {
  const lignes = {};
  for (const m of contenu.matchAll(/^(\d+)\. (".*")$/gm)) lignes[m[1]] = JSON.parse(m[2]);
  return lignes;
}

function ffmpeg() {
  return path.join(RACINE, 'vendor', process.platform === 'win32' ? 'win' : 'linux', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
}

// Règle l'IA locale sur le faux serveur depuis l'écran Moteurs, puis revient sur Traduire en mode Ollama.
async function utiliserFauxOllama(p, serveur) {
  await p.ecran('moteurs');
  await p.saisir('#ollama-adresse', `http://127.0.0.1:${serveur.address().port}`);
  await p.clic('#btn-ollama-actualiser');
  for (let i = 0; i < 30 && !(await p.eval('[...document.querySelectorAll("#ollama-modele option")].some((o) => o.value === "faux-modele:1b")')); i++) await p.pause(150);
  await p.choisir('#ollama-modele', 'faux-modele:1b');
  await p.pause(300);
  await p.ecran('traduire');
  await p.choisir('#opt-moteur', 'ollama');
}

module.exports = { fauxOllama, ffmpeg, utiliserFauxOllama, lignesDemandees, RACINE };
