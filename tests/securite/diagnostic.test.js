'use strict';
// Le rapport « Signaler un problème » ne doit jamais contenir de secret ni le nom de session,
// et ne lit que la fin des journaux.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { construireRapport, dernieresLignes, NB_LIGNES } = require('../../src/main/diagnostic');

function dossierJournaux(lignesApp, lignesArchive = []) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-diag-'));
  fs.writeFileSync(path.join(d, 'app.log'), lignesApp.map((l) => `${l}\n`).join(''));
  if (lignesArchive.length) fs.writeFileSync(path.join(d, 'app.1.log'), lignesArchive.map((l) => `${l}\n`).join(''));
  return d;
}

test('ne garde que les dernières lignes du journal', () => {
  const d = dossierJournaux(Array.from({ length: 500 }, (_, i) => `ligne ${i}`));
  const l = dernieresLignes(d);
  assert.equal(l.length, NB_LIGNES);
  assert.equal(l.at(-1), 'ligne 499');
});

test('complète avec le journal archivé après une rotation', () => {
  const d = dossierJournaux(['récent 1', 'récent 2'], ['ancien 1', 'ancien 2']);
  assert.deepEqual(dernieresLignes(d), ['ancien 1', 'ancien 2', 'récent 1', 'récent 2']);
});

test('dossier de journaux absent : rapport vide, pas de plantage', () => {
  assert.deepEqual(dernieresLignes(path.join(os.tmpdir(), 'inexistant-forge-diag')), []);
});

test('masque les secrets connus et le dossier personnel', () => {
  const secret = 'cle-api-tres-secrete-123';
  const perso = 'C:\\Users\\Thomas';
  const rapport = construireRapport({
    nom: 'TestForge',
    version: '1.2.3',
    squelette: 2,
    systeme: 'win32 10.0.22631 x64',
    parametres: { theme: 'sombre' },
    lignes: [`Connexion avec ${secret}`, `Ouverture de ${perso}\\Documents\\archive.zip`, 'Authorization: Bearer abcdef0123456789abcdef'],
    dossierPerso: perso,
    secrets: [secret],
  });
  assert.ok(!rapport.includes(secret), 'secret connu présent dans le rapport');
  assert.ok(!rapport.includes('Thomas'), 'nom de session présent dans le rapport');
  assert.ok(!rapport.includes('abcdef0123456789abcdef'), 'jeton Bearer présent dans le rapport');
  assert.ok(rapport.includes('%USERPROFILE%\\Documents\\archive.zip'));
  assert.ok(rapport.includes('TestForge 1.2.3'));
});
