'use strict';
// Cohérence entre la liste blanche du preload et les canaux déclarés côté principal,
// et absence de canaux « fourre-tout » dangereux.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const MAIN = path.join(__dirname, '..', '..', 'src', 'main');

function lireTous(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dossier, e.name);
    return e.isDirectory() ? lireTous(p) : e.name.endsWith('.js') ? [fs.readFileSync(p, 'utf8')] : [];
  }).join('\n');
}

const preload = fs.readFileSync(path.join(MAIN, 'preload.js'), 'utf8');
const listePreload = [...preload.match(/const CANAUX = \[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const codePrincipal = lireTous(MAIN).replace(preload, '');
const declares = [...codePrincipal.matchAll(/\bcanal\(\s*'([^']+)'/g)].map((m) => m[1]);

test('chaque canal du preload est déclaré (avec schéma) côté principal', () => {
  for (const c of listePreload) assert.ok(declares.includes(c), `Canal « ${c} » absent de ipc.js / services`);
});

test('chaque canal déclaré est exposé par le preload', () => {
  for (const c of declares) assert.ok(listePreload.includes(c), `Canal « ${c} » déclaré mais pas dans la liste du preload`);
});

test('aucun ipcMain.handle/on direct en dehors de ipc.js (tout passe par la validation)', () => {
  const fichiers = fs.readdirSync(MAIN, { recursive: true }).filter((f) => f.endsWith('.js') && path.basename(f) !== 'ipc.js');
  for (const f of fichiers) {
    const t = fs.readFileSync(path.join(MAIN, f), 'utf8');
    assert.ok(!/ipcMain\.(handle|on)\s*\(/.test(t), `${f} enregistre un canal sans passer par canal()`);
  }
});

test('pas de canal générique d\'exécution ou de lecture libre', () => {
  for (const c of declares) {
    // Un canal précis (« renommage:executer ») est acceptable ; un canal qui exécute ou lit
    // n'importe quoi (« systeme:exec », « fichiers:lire ») ne l'est pas.
    const [module, action] = c.split(':');
    const moduleGenerique = /^(app|systeme|system|shell|fs|fichiers?|os|node|cmd)$/i.test(module);
    const actionGenerique = /^(exec|executer|commande|cmd|shell|eval|run|lire|ecrire|supprimer|readFile|writeFile|unlink|rm)$/i.test(action || '');
    assert.ok(!(moduleGenerique && actionGenerique), `Canal trop générique : ${c}`);
    assert.ok(/^[a-z][a-zA-Z0-9-]*:[a-zA-Z][a-zA-Z0-9-]*$/.test(c), `Nom de canal attendu « module:action » : ${c}`);
  }
});

test('le preload n\'expose pas ipcRenderer ni require', () => {
  assert.ok(!/exposeInMainWorld\([^)]*\bipcRenderer\b\s*[,)]/.test(preload));
  assert.ok(!/ipcRenderer\s*:\s*ipcRenderer|\bipcRenderer\s*[,}]\s*\)/.test(preload.split('exposeInMainWorld')[1] || ''));
  assert.ok(!/require\s*:/.test(preload));
});
