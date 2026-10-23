'use strict';
// Conseiller d'IA locale (1.10, T1001/T1002) : carte, verdicts, réglages d'Ollama, think:false.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const C = require('../src/main/services/conseils-ia');
const { creerMoteurs } = require('../src/main/services/moteurs');
const { lignesDemandees } = require('./e2e/outils');

const silencieux = { avertissement() {}, erreur() {}, info() {} };
const GO = 1e9;

test('carte : nvidia-smi, puis table d\'après le nom, puis mémoire indiquée à la main', async () => {
  const appels = [];
  const executer = async (b, a) => { appels.push([b, a]); return { code: 0, sortie: 'NVIDIA GeForce RTX 4060 Laptop GPU, 8188\n' }; };
  const r = await C.detecterCarte({ plateforme: 'win32', executer, existe: (p) => p.endsWith('System32\\nvidia-smi.exe') });
  assert.deepEqual(r, { nom: 'NVIDIA GeForce RTX 4060 Laptop GPU', vramGo: 8, source: 'nvidia-smi' });
  assert.equal(appels[0][0], 'C:\\Windows\\System32\\nvidia-smi.exe');
  assert.deepEqual(appels[0][1], ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits']);
  // nvidia-smi en erreur → table.
  const panne = async () => { throw new Error('ENOENT'); };
  assert.deepEqual(await C.detecterCarte({ plateforme: 'win32', executer: panne, existe: () => true, infoGpu: 'NVIDIA GeForce RTX 4060 Laptop GPU' }), { nom: 'NVIDIA GeForce RTX 4060 Laptop GPU', vramGo: 8, source: 'table' });
  assert.deepEqual(await C.detecterCarte({ plateforme: 'win32', executer: panne, existe: () => false, infoGpu: 'Intel UHD', vramManuelle: 6 }), { nom: 'Intel UHD', vramGo: 6, source: 'manuel' });
  assert.deepEqual(await C.detecterCarte({ plateforme: 'darwin', executer: panne, existe: () => false, infoGpu: 'Apple M2' }), { nom: 'Apple M2', vramGo: null, source: null });
  assert.equal(C.vramDepuisNom('RTX 3060 Laptop'), 6);
  assert.equal(C.vramDepuisNom('RTX 3060'), 12);
});

test('verdicts sur 8 Go : trop gros, version rapide, réflexion, bon ; conseil qwen2.5:7b', () => {
  const modeles = [
    { nom: 'qwen2.5:14b-instruct-q8_0', taille: 15.7 * GO, quantification: 'Q8_0' },
    { nom: 'qwen2.5:7b-instruct-q8_0', taille: 8.1 * GO, quantification: 'Q8_0' },
    { nom: 'llama3.1:8b-instruct-q6_K', taille: 6.6 * GO, quantification: 'Q6_K' },
    { nom: 'qwen3:8b', taille: 5.2 * GO, quantification: 'Q4_K_M', reflexion: true },
    { nom: 'gemma2:9b', taille: 5.4 * GO, quantification: 'Q4_0' },
    { nom: 'aya-expanse:8b', taille: 5.1 * GO, quantification: 'Q4_K_M' },
  ];
  const { verdicts, recommandation } = C.evaluer({ modeles, vramGo: 8, parallele: 2 });
  const v = Object.fromEntries(verdicts.map((x) => [x.nom, x]));
  assert.equal(v['qwen2.5:14b-instruct-q8_0'].verdict, 'trop-gros');
  assert.equal(v['qwen2.5:14b-instruct-q8_0'].commande, 'ollama pull qwen2.5:14b');
  assert.equal(v['qwen2.5:7b-instruct-q8_0'].verdict, 'trop-gros', '8,1 Go > 8 Go');
  assert.equal(v['llama3.1:8b-instruct-q6_K'].verdict, 'version-rapide');
  assert.match(v['llama3.1:8b-instruct-q6_K'].texte, /20 à 40 %/);
  assert.equal(v['llama3.1:8b-instruct-q6_K'].commande, 'ollama pull llama3.1:8b');
  assert.equal(v['qwen3:8b'].verdict, 'reflexion');
  assert.equal(v['gemma2:9b'].verdict, 'bon');
  assert.equal(v['aya-expanse:8b'].verdict, 'bon');
  assert.match(v['qwen2.5:14b-instruct-q8_0'].texte, /15,7 Go pour 8 Go/);
  assert.deepEqual(recommandation, { nom: 'qwen2.5:7b', go: 4.7, pourquoi: C.CONSEILLES[1].pourquoi, commande: 'ollama pull qwen2.5:7b', installe: false });
  // Modèle qui tient tout juste (7,2 Go, marge 1,5 Go) → « juste ».
  assert.equal(C.evaluer({ modeles: [{ nom: 'x:7b', taille: 7.2 * GO, quantification: 'Q4_K_M' }], vramGo: 8, parallele: 2 }).verdicts[0].verdict, 'juste');
  // Autres cartes.
  assert.equal(C.evaluer({ modeles: [], vramGo: 4 }).recommandation.nom, 'qwen2.5:3b');
  assert.equal(C.evaluer({ modeles: [], vramGo: 12 }).recommandation.nom, 'qwen2.5:14b');
  assert.equal(C.evaluer({ modeles: [], vramGo: 24 }).recommandation.nom, 'mistral-small:24b');
  assert.equal(C.evaluer({ modeles: [{ nom: 'qwen2.5:7b', taille: 4.7 * GO }], vramGo: 8 }).recommandation.installe, true);
  // Carte inconnue : verdicts sans « trop gros », pas de conseil.
  const inconnu = C.evaluer({ modeles: [{ nom: 'big:70b', taille: 40 * GO, quantification: 'Q4_K_M' }], vramGo: null });
  assert.equal(inconnu.verdicts[0].verdict, 'bon');
  assert.equal(inconnu.recommandation, null);
  assert.equal(C.versionLegere('qwen2.5:7b-instruct-q8_0'), 'qwen2.5:7b');
  assert.equal(C.versionLegere('mistral:7b-instruct-fp16'), 'mistral:7b');
  assert.equal(C.versionLegere('qwen2.5:7b'), null);
});

// Faux registre Windows : reg.exe / setx.exe.
function fauxWindows(initial = {}) {
  const hkcu = { ...initial.hkcu };
  const hklm = { ...initial.hklm };
  const appels = [];
  const executer = async (binaire, args) => {
    appels.push([binaire, args]);
    if (binaire === 'C:\\Windows\\System32\\reg.exe' && args[0] === 'query') {
      const base = args[1] === 'HKCU\\Environment' ? hkcu : hklm;
      const v = base[args[3]];
      return v === undefined ? { code: 1, sortie: '', erreurs: 'ERREUR : le système n\'a pas trouvé la clé ou la valeur spécifiée.' } : { code: 0, sortie: `\r\n${args[1]}\r\n    ${args[3]}    REG_SZ    ${v}\r\n\r\n` };
    }
    if (binaire === 'C:\\Windows\\System32\\reg.exe' && args[0] === 'delete') { delete hkcu[args[3]]; return { code: 0, sortie: 'L\'opération a réussi.' }; }
    if (binaire === 'C:\\Windows\\System32\\setx.exe') { hkcu[args[0]] = args[1]; return { code: 0, sortie: 'Opération réussie : la valeur spécifiée a été enregistrée.' }; }
    throw new Error(`commande inattendue ${binaire}`);
  };
  return { executer, appels, hkcu, hklm };
}

test('réglages Ollama : lecture du registre, activation (3 setx fixes), retour comme avant', async () => {
  const w = fauxWindows({ hkcu: { OLLAMA_NUM_PARALLEL: '1' }, hklm: { OLLAMA_FLASH_ATTENTION: '0' } });
  const base = { plateforme: 'win32', executer: w.executer, racineWindows: 'C:\\Windows', parallele: 2 };
  const etat = await C.lireReglages(base);
  assert.deepEqual(etat.OLLAMA_FLASH_ATTENTION, { utilisateur: null, systeme: '0', effectif: '0', conseille: '1', ok: false });
  assert.deepEqual(etat.OLLAMA_NUM_PARALLEL, { utilisateur: '1', systeme: null, effectif: '1', conseille: '2', ok: false });
  assert.equal(etat.OLLAMA_KV_CACHE_TYPE.effectif, null);
  w.appels.length = 0;
  const anciennes = await C.activerReglages({ ...base, etatActuel: etat });
  assert.deepEqual(w.appels, [
    ['C:\\Windows\\System32\\setx.exe', ['OLLAMA_FLASH_ATTENTION', '1']],
    ['C:\\Windows\\System32\\setx.exe', ['OLLAMA_KV_CACHE_TYPE', 'q8_0']],
    ['C:\\Windows\\System32\\setx.exe', ['OLLAMA_NUM_PARALLEL', '2']],
  ]);
  assert.deepEqual(anciennes, { OLLAMA_FLASH_ATTENTION: null, OLLAMA_KV_CACHE_TYPE: null, OLLAMA_NUM_PARALLEL: '1' });
  const apres = await C.lireReglages(base);
  assert.ok(Object.values(apres).every((e) => e.ok), 'les 3 réglages actifs (variable utilisateur prioritaire)');
  // Déjà bon : aucun setx.
  w.appels.length = 0;
  await C.activerReglages({ ...base, etatActuel: apres });
  assert.equal(w.appels.length, 0);
  // Remettre comme avant.
  w.appels.length = 0;
  await C.retablirReglages({ ...base, anciennes });
  assert.deepEqual(w.appels, [
    ['C:\\Windows\\System32\\reg.exe', ['delete', 'HKCU\\Environment', '/v', 'OLLAMA_FLASH_ATTENTION', '/f']],
    ['C:\\Windows\\System32\\reg.exe', ['delete', 'HKCU\\Environment', '/v', 'OLLAMA_KV_CACHE_TYPE', '/f']],
    ['C:\\Windows\\System32\\setx.exe', ['OLLAMA_NUM_PARALLEL', '1']],
  ]);
  assert.deepEqual(w.hkcu, { OLLAMA_NUM_PARALLEL: '1' });
  // Parallèle hors bornes → ramené entre 1 et 4.
  assert.equal(C.valeursConseillees(9).OLLAMA_NUM_PARALLEL, '4');
  assert.equal(C.valeursConseillees(0).OLLAMA_NUM_PARALLEL, '2');
});

test('réglages Ollama hors Windows : lecture de l\'environnement, pas d\'activation, instructions', async () => {
  const jamais = async () => { throw new Error('aucune commande hors Windows'); };
  const etat = await C.lireReglages({ plateforme: 'linux', executer: jamais, env: { OLLAMA_FLASH_ATTENTION: '1' }, parallele: 3 });
  assert.equal(etat.OLLAMA_FLASH_ATTENTION.ok, true);
  assert.equal(etat.OLLAMA_NUM_PARALLEL.conseille, '3');
  await assert.rejects(C.activerReglages({ plateforme: 'linux', executer: jamais }), /seulement sous Windows/);
  await assert.rejects(C.retablirReglages({ plateforme: 'linux', executer: jamais, anciennes: {} }), /hors Windows/);
  const i = C.instructions(3);
  assert.deepEqual(i.windows, ['setx OLLAMA_FLASH_ATTENTION 1', 'setx OLLAMA_KV_CACHE_TYPE q8_0', 'setx OLLAMA_NUM_PARALLEL 3']);
  assert.ok(i.linux.includes('Environment="OLLAMA_NUM_PARALLEL=3"'));
  // setx refusé → message clair.
  const refus = async (b) => (b.endsWith('setx.exe') ? { code: 1, erreurs: 'Accès refusé.' } : { code: 1 });
  await assert.rejects(C.activerReglages({ plateforme: 'win32', executer: refus, etatActuel: {} }), /Windows a refusé d'enregistrer OLLAMA_FLASH_ATTENTION \(Accès refusé\.\)/);
});

test('modèle qui réfléchit : think:false envoyé (capacité « thinking » ou famille connue), pas pour les autres', async () => {
  const demandes = [];
  const shows = [];
  const s = http.createServer((req, res) => {
    let corps = '';
    req.on('data', (c) => { corps += c; });
    req.on('end', () => {
      const o = JSON.parse(corps || '{}');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.url === '/api/show') {
        shows.push(o.model);
        if (o.model === 'ancien:8b' || o.model === 'qwen3:8b') { res.end('{}'); return; } // vieil Ollama : pas de capacités → déduit du nom
        res.end(JSON.stringify({ capabilities: o.model === 'penseur:8b' ? ['completion', 'thinking'] : ['completion'] }));
        return;
      }
      demandes.push(o);
      if (/proofreader/.test(o.messages[0].content)) { res.end('{"message":{"content":"{\\"corrections\\":[],\\"doubts\\":[]}"}}'); return; }
      const sortie = {};
      for (const [k, v] of Object.entries(lignesDemandees(o.messages[1].content))) sortie[k] = `[fr] ${v}`;
      res.end(JSON.stringify({ message: { content: JSON.stringify(sortie) } }));
    });
  });
  await new Promise((ok) => s.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${s.address().port}`;
  try {
    const m = creerMoteurs({ fetch, lireCleDeepl: () => null, journal: silencieux });
    const o = { moteur: 'ollama', adresse: url, cible: 'fr' };
    await m.traduireTout(['Hello'], { ...o, modele: 'penseur:8b' });
    await m.traduireTout(['Hello again'], { ...o, modele: 'penseur:8b' });
    await m.relireScene([{ n: 0, original: 'Hi', traduction: 'Salut' }], { adresse: url, modele: 'penseur:8b', cible: 'fr' });
    await m.traduireTout(['Hello'], { ...o, modele: 'simple:7b' });
    await m.traduireTout(['Hello'], { ...o, modele: 'qwen3:8b' });
    await m.traduireTout(['Hello'], { ...o, modele: 'ancien:8b' });
    assert.deepEqual(demandes.map((d) => [d.model, d.think]), [
      ['penseur:8b', false], ['penseur:8b', false], ['penseur:8b', false], ['simple:7b', undefined], ['qwen3:8b', false], ['ancien:8b', undefined],
    ]);
    assert.equal(shows.filter((x) => x === 'penseur:8b').length, 1, 'capacités demandées une seule fois par modèle');
  } finally { s.close(); }
});
