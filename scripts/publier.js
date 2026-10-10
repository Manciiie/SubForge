#!/usr/bin/env node
'use strict';
// Publie la version compilée sur le dépôt GitHub des installeurs (<Nom>-releases) : les copies
// déjà installées la proposeront à leur prochain démarrage.
//
//   node scripts/publier.js              -> exe + .blockmap + latest.yml de dist/, release v<version>
//   node scripts/publier.js --brouillon  -> laissée en brouillon (invisible pour les applications)
//
// Prérequis : le code de cette version est déjà poussé sur Manciiie/<Nom> (règle absolue), et
// le dépôt <Nom>-releases est ajouté à la session avec un accès en écriture.
// Uniquement l'API REST via `gh api` : GraphQL (gh release list/view…) est refusé depuis les
// sessions Claude. Variable FORGE_GH : autre exécutable gh (tests).

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RACINE = path.resolve(__dirname, '..');
const GH = process.env.FORGE_GH || 'gh';
const pkg = JSON.parse(fs.readFileSync(path.join(RACINE, 'package.json'), 'utf8'));
const version = pkg.version;
const nom = pkg.build?.productName || pkg.productName;
const pub = [].concat(pkg.build?.publish || []).find((p) => p && p.provider === 'github');
const BROUILLON = process.argv.includes('--brouillon');

function arreter(message) { console.error(`✗ ${message}`); process.exit(1); }
if (!pub || /__MAJ_/.test(`${pub.owner}${pub.repo}`)) arreter('Pas de dépôt des installeurs dans package.json (build.publish).');
const depot = `${pub.owner}/${pub.repo}`;
const tag = `v${version}`;

function api(args, options = {}) {
  try {
    const sortie = execFileSync(GH, ['api', ...args], { cwd: RACINE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, ...options });
    return sortie.trim() ? JSON.parse(sortie) : {};
  } catch (e) {
    const texte = `${e.stdout || ''}${e.stderr || ''}`;
    const err = new Error(texte.split('\n').find(Boolean) || e.message);
    err.statut = Number((texte.match(/HTTP (\d{3})/) || [])[1]) || null;
    throw err;
  }
}

// --- 1. Fichiers et cohérence ------------------------------------------------------
const dist = path.join(RACINE, 'dist');
const exe = path.join(dist, `${nom}-Setup-${version}.exe`);
const blockmap = `${exe}.blockmap`;
const latest = path.join(dist, 'latest.yml');
for (const f of [exe, blockmap, latest]) {
  if (!fs.existsSync(f)) arreter(`Fichier manquant : ${path.relative(RACINE, f)}. Lancer d'abord « npm run build ».`);
}
if (fs.statSync(exe).size < 20 * 1024 * 1024) arreter('Installeur anormalement petit : build incomplet.');
const yml = fs.readFileSync(latest, 'utf8');
const versionYml = (yml.match(/^version:\s*(.+)$/m) || [])[1]?.trim();
if (versionYml !== version) arreter(`latest.yml annonce la version ${versionYml}, package.json la ${version}.`);
const sha512 = crypto.createHash('sha512').update(fs.readFileSync(exe)).digest('base64');
if (!yml.includes(sha512)) arreter('L\'empreinte SHA-512 de latest.yml ne correspond pas à l\'installeur : refaire le build.');

let config = {};
try { config = JSON.parse(fs.readFileSync(path.join(RACINE, 'src', 'main', 'maj-config.json'), 'utf8')); } catch { /* silence-ok: absent, refusé juste en dessous sans --sans-jeton */ }
if (!config.jetonCode && !process.argv.includes('--sans-jeton')) {
  arreter('Version compilée SANS jeton de mise à jour : une fois installée, elle ne pourrait plus se mettre à jour. Refaire le build avec FORGE_MAJ_JETON (ou --sans-jeton pour publier quand même).');
}

// Règle absolue : le code de cette version doit être sur GitHub avant toute publication.
try {
  const local = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: RACINE, encoding: 'utf8' }).trim();
  const distant = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], { cwd: RACINE, encoding: 'utf8' }).split('\t')[0];
  const propre = execFileSync('git', ['status', '--porcelain', '--', 'src', 'package.json', 'CHANGELOG.md'], { cwd: RACINE, encoding: 'utf8' }).trim() === '';
  if (local !== distant || !propre) arreter('Le code de cette version n\'est pas (entièrement) sur GitHub : lancer d\'abord bash scripts/pousser-github.sh "chore: version …".');
} catch {
  arreter('Projet non relié à son dépôt GitHub : pousser le code avant de publier (règle absolue).');
}

// --- 2. Dépôt des installeurs ----------------------------------------------------------
let infoDepot;
try { infoDepot = api([`repos/${depot}`]); } catch (e) {
  arreter(`Dépôt ${depot} inaccessible (${e.message}). Il doit exister et être ajouté à la session en écriture.`);
}
if (!infoDepot.private) console.warn(`⚠ ${depot} est PUBLIC : les installeurs sont téléchargeables par tout le monde.`);
if (!infoDepot.size) {
  // Un dépôt vide n'a pas de branche sur laquelle poser le tag : on crée un README.
  const contenu = Buffer.from(`# ${nom} — installeurs\n\nVersions publiées de ${nom} pour les mises à jour automatiques. Le code source n'est pas ici.\n`).toString('base64');
  try {
    api(['-X', 'PUT', `repos/${depot}/contents/README.md`, '-f', 'message=Initialisation', '-f', `content=${contenu}`]);
    console.log('Dépôt vide : README créé.');
  } catch (e) {
    if (e.statut !== 422) throw e; // 422 : le fichier existe déjà
  }
}
try {
  api([`repos/${depot}/releases/tags/${tag}`]);
  arreter(`La version ${tag} est déjà publiée sur ${depot}. Incrémenter la version avant de publier.`);
} catch (e) {
  if (e.statut !== 404) throw e;
}

// --- 3. Notes de version : section du CHANGELOG -------------------------------------
let notes = `${nom} ${version}`;
try {
  const changelog = fs.readFileSync(path.join(RACINE, 'CHANGELOG.md'), 'utf8');
  const debut = changelog.search(new RegExp(`^## \\[?${version.replace(/\./g, '\\.')}\\b`, 'm'));
  if (debut >= 0) {
    const reste = changelog.slice(debut);
    const fin = reste.slice(3).search(/^## /m);
    notes = (fin >= 0 ? reste.slice(0, fin + 3) : reste).replace(/^## .*\n/, '').trim();
  } else {
    console.warn(`⚠ Pas de section « ## ${version} » dans CHANGELOG.md : notes de version minimales.`);
  }
} catch { /* silence-ok: pas de CHANGELOG, notes minimales */ }

// --- 4. Brouillon -> fichiers -> publication -------------------------------------------
// Créée en brouillon d'abord : les applications ne voient jamais une version sans latest.yml.
const corps = path.join(os.tmpdir(), `release-${process.pid}.json`);
fs.writeFileSync(corps, JSON.stringify({ tag_name: tag, name: `${nom} ${version}`, body: notes, draft: true, prerelease: false }));
const release = api(['-X', 'POST', `repos/${depot}/releases`, '--input', corps]);
fs.unlinkSync(corps);

for (const fichier of [exe, blockmap, latest]) {
  const nomFichier = path.basename(fichier);
  const url = `https://uploads.github.com/repos/${depot}/releases/${release.id}/assets?name=${encodeURIComponent(nomFichier)}`;
  process.stdout.write(`  envoi de ${nomFichier} (${(fs.statSync(fichier).size / 1024 / 1024).toFixed(1)} Mo)… `);
  api(['-X', 'POST', url, '-H', 'Content-Type: application/octet-stream', '--input', fichier]);
  console.log('ok');
}

const recus = api([`repos/${depot}/releases/${release.id}/assets`]);
for (const fichier of [exe, blockmap, latest]) {
  const a = recus.find((x) => x.name === path.basename(fichier));
  if (!a || a.size !== fs.statSync(fichier).size) arreter(`Fichier mal reçu par GitHub : ${path.basename(fichier)} (la release reste en brouillon).`);
}

if (!BROUILLON) api(['-X', 'PATCH', `repos/${depot}/releases/${release.id}`, '-F', 'draft=false']);
console.log(`✓ ${nom} ${version} publié sur ${depot}${BROUILLON ? ' (brouillon)' : ''}.`);
console.log(BROUILLON
  ? '  Brouillon : les applications ne le verront qu\'une fois publié.'
  : '  Les copies installées le proposeront à leur prochain démarrage.');
