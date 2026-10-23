'use strict';
// SubForge : la clé DeepL reste au coffre (jamais en clair sur le disque, au journal ni vers l'interface).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CLE = 'f63c02c5-f056-4e9a-91a3-5d1c3e8b7a42:fx';

// Faux safeStorage : chiffrement réversible mais jamais en clair (DPAPI sous Windows).
const faux = {
  isEncryptionAvailable: () => true,
  encryptString: (t) => Buffer.from(Buffer.from(t, 'utf8').map((o) => o ^ 0x5a)),
  decryptString: (b) => Buffer.from(b.map((o) => o ^ 0x5a)).toString('utf8'),
};

test('clé DeepL : chiffrée sur le disque, absente de parametres.json et des journaux', () => {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-coffre-'));
  const journal = require('../../src/main/journal');
  journal.initialiser(path.join(dossier, 'logs'));
  const parametres = require('../../src/main/parametres');
  parametres.initialiser(dossier, faux);
  parametres.enregistrerSecret('cle_deepl', CLE);
  assert.equal(parametres.secretExiste('cle_deepl'), true);
  assert.equal(parametres.lireSecret('cle_deepl'), CLE);
  journal.info(`Appel DeepL avec ${CLE}`);
  journal.erreur(new Error(`Authorization: DeepL-Auth-Key ${CLE}`));
  const tout = fs.readdirSync(dossier, { recursive: true })
    .map((f) => path.join(dossier, f)).filter((f) => fs.statSync(f).isFile())
    .map((f) => fs.readFileSync(f).toString('latin1')).join('\n');
  assert.ok(!tout.includes(CLE), 'la clé apparaît en clair sur le disque');
  assert.ok(!tout.includes('f63c02c5'), 'un morceau de la clé apparaît en clair');
  parametres.enregistrerSecret('cle_deepl', '');
  assert.equal(parametres.secretExiste('cle_deepl'), false);
  fs.rmSync(dossier, { recursive: true, force: true });
});

test('clés DeepL / OpenSubtitles / TMDB et mot de passe : aucun canal ne les renvoie à l\'interface', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'main', 'services', 'traduction.js'), 'utf8');
  const lignes = src.split('\n').filter((l) => /lireSecret\(/.test(l));
  assert.equal(lignes.length, 3, 'lireSecret ne sert qu\'à fournir les secrets aux modules réseau');
  assert.match(lignes[0], /lireCleDeepl: \(\) => parametres\.lireSecret\(SECRET_DEEPL\)/);
  assert.match(lignes[1], /lireJeton: \(\) => parametres\.lireSecret\(SECRET_TMDB\)/);
  assert.match(lignes[2], /lireSecrets: \(\) => \(\{ cle: parametres\.lireSecret\(SECRET_OS_CLE\), motDePasse: parametres\.lireSecret\(SECRET_OS_MDP\) \}\)/);
  const moteurs = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'main', 'services', 'moteurs.js'), 'utf8');
  assert.ok(!/\?[a-z_]*auth_key=/i.test(moteurs), 'clé passée dans une URL');
});

test('TMDB : adresse de test ignorée une fois installé, jeton jamais journalisé, pas de redirection suivie', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'main', 'services', 'traduction.js'), 'utf8');
  assert.match(src, /!app\.isPackaged && process\.env\.SUBFORGE_TMDB_URL_TEST/);
  const ctx = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'main', 'services', 'contexte.js'), 'utf8');
  assert.match(ctx, /redirect: 'error'/);
  assert.ok(!/journal\.[a-z?.]+\([^)]*(url|jeton)/i.test(ctx), 'adresse ou jeton dans le journal');
  assert.match(ctx, /const API = 'https:\/\/api\.themoviedb\.org\/3'/);
});

test('URL DeepL de test ignorée dans la version installée', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'main', 'services', 'traduction.js'), 'utf8');
  assert.match(src, /!app\.isPackaged && process\.env\.SUBFORGE_DEEPL_URL_TEST/);
});
