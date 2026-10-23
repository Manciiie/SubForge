'use strict';
// Conseiller d'IA locale (1.10, D-015) : carte graphique, verdict sur les modèles installés, modèle
// conseillé, et réglages d'Ollama (variables d'environnement de Windows).
// Sans Electron ni accès direct au système : les commandes sont passées par `executer` (execFile sans
// shell, binaire absolu), ce qui permet de tout tester sous Linux avec de fausses commandes.

const path = require('path');

// --- Carte graphique -------------------------------------------------------------------------------
// Mémoire vidéo des cartes les plus courantes (Go), quand nvidia-smi n'est pas là.
const TABLE_CARTES = [
  [/rtx\s*4090/i, 24], [/rtx\s*4080/i, 16], [/rtx\s*4070\s*ti\s*super/i, 16], [/rtx\s*4070.*laptop/i, 8], [/rtx\s*4070/i, 12],
  [/rtx\s*4060\s*ti/i, 8], [/rtx\s*4060/i, 8], [/rtx\s*4050/i, 6],
  [/rtx\s*3090/i, 24], [/rtx\s*3080.*laptop/i, 8], [/rtx\s*3080/i, 10], [/rtx\s*3070/i, 8], [/rtx\s*3060.*laptop/i, 6], [/rtx\s*3060/i, 12], [/rtx\s*3050/i, 4],
  [/rtx\s*5090/i, 32], [/rtx\s*5080/i, 16], [/rtx\s*5070\s*ti/i, 16], [/rtx\s*5070/i, 12], [/rtx\s*5060/i, 8],
  [/gtx\s*1660/i, 6], [/gtx\s*1650/i, 4], [/gtx\s*1080\s*ti/i, 11], [/gtx\s*1080/i, 8], [/gtx\s*1070/i, 8], [/gtx\s*1060/i, 6],
];
const vramDepuisNom = (nom) => TABLE_CARTES.find(([re]) => re.test(String(nom || '')))?.[1] ?? null;

const CHEMINS_NVIDIA_SMI = {
  win32: ['C:\\Windows\\System32\\nvidia-smi.exe', 'C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe'],
  linux: ['/usr/bin/nvidia-smi'],
};

// { nom, vramGo, source: 'nvidia-smi' | 'table' | 'manuel' | null }
async function detecterCarte({ plateforme = process.platform, executer, existe, infoGpu = null, vramManuelle = null }) {
  for (const binaire of CHEMINS_NVIDIA_SMI[plateforme] || []) {
    if (!existe(binaire)) continue;
    try {
      const r = await executer(binaire, ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits']);
      const m = /^\s*([^,\n]{2,100}),\s*(\d{3,6})\s*$/m.exec(r.sortie || '');
      if (r.code === 0 && m) return { nom: m[1].trim(), vramGo: Math.round(Number(m[2]) / 1024), source: 'nvidia-smi' };
    } catch { /* silence-ok: nvidia-smi absent ou en erreur, on passe aux autres sources */ }
  }
  const nom = String(infoGpu || '').slice(0, 120) || null;
  if (vramManuelle) return { nom, vramGo: vramManuelle, source: 'manuel' };
  const table = vramDepuisNom(nom);
  return { nom, vramGo: table, source: table ? 'table' : null };
}

// --- Modèles ----------------------------------------------------------------------------------------
// Modèles conseillés pour traduire (multilingues, tag par défaut d'Ollama = quantification q4_K_M),
// du plus léger au plus lourd. Taille en Go (téléchargement ≈ mémoire vidéo utilisée par le modèle).
const CONSEILLES = [
  { nom: 'qwen2.5:3b', go: 1.9, pourquoi: 'petit modèle multilingue, correct pour les cartes de 4 Go' },
  { nom: 'qwen2.5:7b', go: 4.7, pourquoi: 'très bon compromis vitesse / qualité en traduction pour 8 Go' },
  { nom: 'aya-expanse:8b', go: 5.1, pourquoi: 'spécialisé dans la traduction (23 langues), un peu plus lourd' },
  { nom: 'qwen2.5:14b', go: 9.0, pourquoi: 'meilleure qualité, pour 12 Go et plus' },
  { nom: 'mistral-small:24b', go: 14.0, pourquoi: 'qualité proche de DeepL, pour 16 Go et plus' },
];
// Familles qui « réfléchissent » avant de répondre (si Ollama ne le dit pas lui-même).
const RE_REFLEXION = /^(qwen3|deepseek-r1|qwq|magistral|phi4-reasoning|gpt-oss|cogito)/i;

// Place nécessaire en plus du modèle : mémoire de travail (4 096 par demande) + marge.
const margeGo = (parallele) => 0.8 + 0.35 * Math.max(1, parallele || 1);

// Nom conseillé pour une version plus légère du même modèle : « qwen2.5:7b-instruct-q8_0 » → « qwen2.5:7b ».
function versionLegere(nom) {
  const [base, tag = 'latest'] = String(nom).split(':');
  const court = tag.replace(/-(?:instruct|chat|it|text)?-?(?:q\d[\w]*|fp16|f16|bf16)$/i, '').replace(/-(?:instruct|chat)$/i, '');
  return court && court !== tag ? `${base}:${court}` : null;
}
const goFr = (n) => `${Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go`;
const lourdeQuantification = (q) => /^(q8|q6|q5|fp16|f16|bf16)/i.test(String(q || ''));

// Verdict sur chaque modèle installé et modèle conseillé pour la carte.
function evaluer({ modeles = [], vramGo = null, parallele = 2 }) {
  const place = vramGo ? vramGo - margeGo(parallele) : null;
  const verdicts = modeles.map((m) => {
    const go = m.taille / 1e9;
    const v = { nom: m.nom, go: Math.round(go * 10) / 10, quantification: m.quantification || null, parametres: m.parametres || null, reflexion: Boolean(m.reflexion) };
    const legere = lourdeQuantification(m.quantification) ? versionLegere(m.nom) : null;
    if (place !== null && go > vramGo) {
      return {
        ...v, verdict: 'trop-gros',
        texte: `Trop gros pour la carte (${goFr(v.go)} pour ${vramGo} Go) : une partie tourne sur le processeur, très lent.${legere ? ' Sa version q4_K_M, elle, tient dans la carte.' : ''}`,
        ...(legere ? { commande: `ollama pull ${legere}` } : {}),
      };
    }
    if (legere) {
      const gain = /^(q8|fp16|f16|bf16)/i.test(m.quantification) ? 'environ deux fois plus vite' : '20 à 40 % plus vite';
      return { ...v, verdict: 'version-rapide', texte: `Version ${m.quantification} : la version q4_K_M va ${gain}, pour une qualité très proche.`, commande: `ollama pull ${legere}` };
    }
    if (place !== null && go > place) {
      return { ...v, verdict: 'juste', texte: `Tient tout juste dans la carte : réglez « Demandes simultanées » sur 1 (ou prenez un modèle plus petit).` };
    }
    if (v.reflexion) {
      return { ...v, verdict: 'reflexion', texte: 'Modèle qui « réfléchit » avant de répondre : SubForge coupe cette réflexion pour traduire (beaucoup plus rapide).' };
    }
    return { ...v, verdict: 'bon', texte: 'Bon choix pour cette carte.' };
  });
  let recommandation = null;
  if (place !== null) {
    const possibles = CONSEILLES.filter((c) => c.go <= place);
    // Pour 8 Go, le compromis qwen2.5:7b plutôt que le plus gros qui rentre.
    const choix = possibles.find((c) => c.nom === 'qwen2.5:7b' && vramGo <= 10) || possibles.at(-1) || CONSEILLES[0];
    const installe = modeles.find((m) => m.nom === choix.nom || m.nom === `${choix.nom}-instruct-q4_K_M`);
    recommandation = { nom: choix.nom, go: choix.go, pourquoi: choix.pourquoi, commande: `ollama pull ${choix.nom}`, installe: Boolean(installe) };
  }
  return { verdicts, recommandation };
}

// --- Réglages d'Ollama (variables d'environnement) ----------------------------------------------------
const NOMS_REGLAGES = ['OLLAMA_FLASH_ATTENTION', 'OLLAMA_KV_CACHE_TYPE', 'OLLAMA_NUM_PARALLEL'];
const valeursConseillees = (parallele) => ({ OLLAMA_FLASH_ATTENTION: '1', OLLAMA_KV_CACHE_TYPE: 'q8_0', OLLAMA_NUM_PARALLEL: String(Math.max(1, Math.min(4, parallele || 2))) });
const VALEURS_PERMISES = { OLLAMA_FLASH_ATTENTION: ['1'], OLLAMA_KV_CACHE_TYPE: ['q8_0'], OLLAMA_NUM_PARALLEL: ['1', '2', '3', '4'] };

const REG = (racine) => path.win32.join(racine || 'C:\\Windows', 'System32', 'reg.exe');
const SETX = (racine) => path.win32.join(racine || 'C:\\Windows', 'System32', 'setx.exe');
const CLE_UTILISATEUR = 'HKCU\\Environment';
const CLE_SYSTEME = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment';

// « reg query <clé> /v NOM » → valeur ou null.
async function lireRegistre(executer, racine, cle, nom) {
  try {
    const r = await executer(REG(racine), ['query', cle, '/v', nom]);
    if (r.code !== 0) return null;
    const m = new RegExp(`^\\s*${nom}\\s+REG_(?:EXPAND_)?SZ\\s+(.*)$`, 'mi').exec(r.sortie || '');
    return m ? m[1].trim() : null;
  } catch { return null; } // silence-ok: variable absente = null
}

// { NOM: { utilisateur, systeme, effectif, conseille, ok } }
async function lireReglages({ plateforme = process.platform, executer, env = process.env, racineWindows, parallele = 2 }) {
  const conseil = valeursConseillees(parallele);
  const etat = {};
  for (const nom of NOMS_REGLAGES) {
    let utilisateur = null;
    let systeme = null;
    if (plateforme === 'win32') {
      utilisateur = await lireRegistre(executer, racineWindows, CLE_UTILISATEUR, nom);
      systeme = await lireRegistre(executer, racineWindows, CLE_SYSTEME, nom);
    } else {
      utilisateur = env[nom] ?? null;
    }
    const effectif = utilisateur ?? systeme; // Windows : la variable utilisateur l'emporte
    etat[nom] = { utilisateur, systeme, effectif, conseille: conseil[nom], ok: effectif === conseil[nom] };
  }
  return etat;
}

// Windows : setx pour l'utilisateur (sans droits administrateur). Renvoie les anciennes valeurs
// utilisateur, pour « Remettre comme avant ».
async function activerReglages({ plateforme = process.platform, executer, racineWindows, parallele = 2, etatActuel }) {
  if (plateforme !== 'win32') throw new Error('Réglage automatique possible seulement sous Windows : suivez les instructions affichées.');
  const conseil = valeursConseillees(parallele);
  const anciennes = {};
  for (const nom of NOMS_REGLAGES) {
    const valeur = conseil[nom];
    if (!VALEURS_PERMISES[nom].includes(valeur)) throw new Error(`Valeur refusée pour ${nom}.`);
    anciennes[nom] = etatActuel?.[nom]?.utilisateur ?? null;
    if (etatActuel?.[nom]?.utilisateur === valeur) continue;
    const r = await executer(SETX(racineWindows), [nom, valeur]);
    if (r.code !== 0) throw new Error(`Windows a refusé d'enregistrer ${nom} (${String(r.erreurs || r.sortie || '').trim().slice(0, 160) || `code ${r.code}`}).`);
  }
  return anciennes;
}

// Rétablit les variables utilisateur d'avant (suppression si elles n'existaient pas).
async function retablirReglages({ plateforme = process.platform, executer, racineWindows, anciennes }) {
  if (plateforme !== 'win32') throw new Error('Rien à rétablir hors Windows.');
  for (const nom of NOMS_REGLAGES) {
    if (!Object.prototype.hasOwnProperty.call(anciennes || {}, nom)) continue;
    const ancienne = anciennes[nom];
    const r = ancienne === null
      ? await executer(REG(racineWindows), ['delete', CLE_UTILISATEUR, '/v', nom, '/f'])
      : await executer(SETX(racineWindows), [nom, String(ancienne).slice(0, 100)]);
    if (r.code !== 0 && ancienne !== null) throw new Error(`Windows a refusé de rétablir ${nom}.`);
  }
}

// Instructions à copier (hors Windows, ou pour faire à la main).
function instructions(parallele = 2) {
  const c = valeursConseillees(parallele);
  return {
    windows: NOMS_REGLAGES.map((n) => `setx ${n} ${c[n]}`),
    linux: ['sudo systemctl edit ollama.service', '[Service]', ...NOMS_REGLAGES.map((n) => `Environment="${n}=${c[n]}"`), 'sudo systemctl restart ollama'],
  };
}

module.exports = {
  detecterCarte, evaluer, versionLegere, vramDepuisNom, lireReglages, activerReglages, retablirReglages, instructions,
  valeursConseillees, NOMS_REGLAGES, RE_REFLEXION, CONSEILLES,
};
