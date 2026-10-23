'use strict';
// Preload en mode sandbox : seul un ensemble réduit de modules est disponible.
// L'interface ne reçoit jamais ipcRenderer, seulement des fonctions précises.

const { contextBridge, ipcRenderer, webUtils } = require('electron');

// Liste blanche : doit correspondre aux canaux déclarés dans ipc.js
// (vérifié par tests/securite/ipc.test.js).
const CANAUX = [
  'app:infos',
  'app:ouvrirLien',
  'app:ouvrirJournaux',
  'diagnostic:copierRapport',
  'parametres:lire',
  'parametres:modifier',
  'secret:enregistrer',
  'secret:existe',
  'fichiers:choisir',
  'fenetre:action',
  'maj:etat',
  'maj:verifier',
  'maj:telecharger',
  'maj:installer',
  'maj:ignorer',
  'traduction:langues',
  'traduction:reglages',
  'traduction:modifierReglages',
  'traduction:choisirDossierSortie',
  'traduction:explorer',
  'traduction:analyser',
  'traduction:lancer',
  'traduction:annuler',
  'traduction:apercu',
  'traduction:montrer',
  'moteurs:etat',
  'moteurs:enregistrerCleDeepl',
  'moteurs:supprimerCleDeepl',
  'moteurs:testerDeepl',
  'moteurs:modelesOllama',
  'moteurs:testerOllama',
  'moteurs:mesurerOllama',
  'moteurs:prechauffer',
  'moteurs:annulerMesure',
  'memoire:etat',
  'memoire:vider',
  'conseils:analyser',
  'conseils:vram',
  'conseils:activerReglages',
  'conseils:retablirReglages',
  'conseils:copier',
  'contexte:etat',
  'contexte:enregistrer',
  'contexte:tester',
  'contexte:pour',
  'contexte:chercher',
  'contexte:choisir',
  'expressions:lister',
  'expressions:enregistrer',
  'expressions:supprimer',
  'expressions:regler',
  'expressions:tester',
  'glossaire:lister',
  'glossaire:enregistrer',
  'glossaire:supprimer',
  'glossaire:importer',
  'enligne:etat',
  'enligne:enregistrer',
  'enligne:tester',
  'enligne:chercher',
  'enligne:telecharger',
  'enligne:automatique',
];

// Événements envoyés par le processus principal vers l'interface (lecture seule).
const EVENEMENTS = ['maj:changement', 'traduction:progression', 'moteurs:mesure'];

function ecouter(evenement, rappel) {
  if (!EVENEMENTS.includes(evenement) || typeof rappel !== 'function') return () => {};
  const relais = (_event, donnees) => rappel(donnees);
  ipcRenderer.on(evenement, relais);
  return () => ipcRenderer.removeListener(evenement, relais); // désabonnement : pas de fuite d'écouteurs
}

function appeler(canal, ...args) {
  if (!CANAUX.includes(canal)) return Promise.reject(new Error(`Canal non autorisé : ${canal}`));
  return ipcRenderer.invoke(canal, ...args);
}

contextBridge.exposeInMainWorld('forge', {
  infos: () => appeler('app:infos'),
  ouvrirLien: (url) => appeler('app:ouvrirLien', url),
  ouvrirJournaux: () => appeler('app:ouvrirJournaux'),
  copierRapport: () => appeler('diagnostic:copierRapport'),
  parametres: {
    lire: () => appeler('parametres:lire'),
    modifier: (partiel) => appeler('parametres:modifier', partiel),
  },
  secrets: {
    enregistrer: (nom, valeur) => appeler('secret:enregistrer', nom, valeur),
    existe: (nom) => appeler('secret:existe', nom),
  },
  fichiers: {
    choisir: (options = {}) => appeler('fichiers:choisir', options),
    // Chemin réel d'un fichier glissé-déposé (File.path n'existe plus en sandbox).
    cheminDe: (fichier) => webUtils.getPathForFile(fichier),
  },
  fenetre: (action) => appeler('fenetre:action', action),
  traduction: {
    langues: () => appeler('traduction:langues'),
    reglages: () => appeler('traduction:reglages'),
    modifierReglages: (o) => appeler('traduction:modifierReglages', o),
    choisirDossierSortie: () => appeler('traduction:choisirDossierSortie'),
    explorer: (chemins) => appeler('traduction:explorer', chemins),
    analyser: (chemins) => appeler('traduction:analyser', chemins),
    lancer: (elements) => appeler('traduction:lancer', elements),
    annuler: () => appeler('traduction:annuler'),
    apercu: (id) => appeler('traduction:apercu', id),
    montrer: (chemin) => appeler('traduction:montrer', chemin),
    surProgression: (rappel) => ecouter('traduction:progression', rappel),
  },
  memoire: {
    etat: () => appeler('memoire:etat'),
    vider: () => appeler('memoire:vider'),
  },
  conseils: {
    analyser: () => appeler('conseils:analyser'),
    vram: (go) => appeler('conseils:vram', go),
    activerReglages: () => appeler('conseils:activerReglages'),
    retablirReglages: () => appeler('conseils:retablirReglages'),
    copier: (texte) => appeler('conseils:copier', texte),
  },
  contexte: {
    etat: () => appeler('contexte:etat'),
    enregistrer: (jeton) => appeler('contexte:enregistrer', jeton),
    tester: () => appeler('contexte:tester'),
    pour: (chemin) => appeler('contexte:pour', chemin),
    chercher: (texte) => appeler('contexte:chercher', texte),
    choisir: (chemin, ref) => appeler('contexte:choisir', chemin, ref),
  },
  expressions: {
    lister: () => appeler('expressions:lister'),
    enregistrer: (entree) => appeler('expressions:enregistrer', entree),
    supprimer: (id) => appeler('expressions:supprimer', id),
    regler: (o) => appeler('expressions:regler', o),
    tester: (texte, source, cible) => appeler('expressions:tester', texte, source, cible),
  },
  glossaire: {
    lister: () => appeler('glossaire:lister'),
    enregistrer: (entree) => appeler('glossaire:enregistrer', entree),
    supprimer: (id) => appeler('glossaire:supprimer', id),
    importer: () => appeler('glossaire:importer'),
  },
  enLigne: {
    etat: () => appeler('enligne:etat'),
    enregistrer: (o) => appeler('enligne:enregistrer', o),
    tester: () => appeler('enligne:tester'),
    chercher: (chemin, langue) => appeler('enligne:chercher', chemin, langue),
    telecharger: (chemin, fileId, langue) => appeler('enligne:telecharger', chemin, fileId, langue),
    automatique: (chemin, langue) => appeler('enligne:automatique', chemin, langue),
  },
  moteurs: {
    etat: () => appeler('moteurs:etat'),
    enregistrerCleDeepl: (cle) => appeler('moteurs:enregistrerCleDeepl', cle),
    supprimerCleDeepl: () => appeler('moteurs:supprimerCleDeepl'),
    testerDeepl: () => appeler('moteurs:testerDeepl'),
    modelesOllama: (adresse) => appeler('moteurs:modelesOllama', adresse),
    testerOllama: () => appeler('moteurs:testerOllama'),
    mesurerOllama: () => appeler('moteurs:mesurerOllama'),
    prechauffer: () => appeler('moteurs:prechauffer'),
    annulerMesure: () => appeler('moteurs:annulerMesure'),
    surMesure: (rappel) => ecouter('moteurs:mesure', rappel),
  },
  majs: {
    etat: () => appeler('maj:etat'),
    verifier: () => appeler('maj:verifier'),
    telecharger: () => appeler('maj:telecharger'),
    installer: () => appeler('maj:installer'),
    ignorer: () => appeler('maj:ignorer'),
    surChangement: (rappel) => ecouter('maj:changement', rappel),
  },
});
