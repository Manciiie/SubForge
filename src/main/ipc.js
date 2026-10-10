'use strict';
// Liste blanche des canaux IPC. Chaque canal déclare le schéma de ses arguments ;
// tout appel non conforme ou venant d'une autre page est refusé.
// Pour un nouveau module : ajouter ses canaux avec `canal(nom, schema, fonction)`.

const { ipcMain, BrowserWindow, dialog, shell, app, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const diagnostic = require('./diagnostic');
const { validerArguments, urlExterneAutorisee, ErreurSecurite } = require('./securite');
const parametres = require('./parametres');
const journal = require('./journal');

const CANAUX = new Map();

function expediteurAutorise(event) {
  const url = event.senderFrame?.url || '';
  return url.startsWith('file://') && url.includes('/src/renderer/');
}

function canal(nom, schema, fonction) {
  if (CANAUX.has(nom)) throw new Error(`Canal IPC déjà déclaré : ${nom}`);
  CANAUX.set(nom, schema);
  ipcMain.handle(nom, async (event, ...args) => {
    if (!expediteurAutorise(event)) {
      journal.avertissement(`IPC refusé (expéditeur inconnu) sur ${nom}`);
      throw new ErreurSecurite('Appel refusé.');
    }
    try {
      validerArguments(schema, args);
    } catch (e) {
      journal.avertissement(`IPC refusé sur ${nom} :`, e.message);
      throw e;
    }
    return fonction(event, ...args);
  });
}

function fenetreDe(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function enregistrerCanauxDeBase() {
  canal('app:infos', [], () => {
    let changelog = '';
    try {
      changelog = fs.readFileSync(path.join(app.getAppPath(), 'CHANGELOG.md'), 'utf8');
    } catch { /* silence-ok: absent en développement */ }
    return { nom: app.getName(), version: app.getVersion(), changelog };
  });

  canal('parametres:lire', [], () => parametres.lire());

  canal('parametres:modifier', [{
    type: 'objet',
    champs: {
      theme: { type: 'enum', valeurs: ['sombre', 'clair', 'systeme'], optionnel: true },
      accent: { type: 'string', max: 9, optionnel: true },
      accelerationMaterielle: { type: 'boolean', optionnel: true },
      verifierMajAuDemarrage: { type: 'boolean', optionnel: true },
    },
  }], (_e, partiel) => {
    if (partiel.accent !== undefined && !/^#[0-9a-fA-F]{6}$/.test(partiel.accent)) {
      throw new ErreurSecurite('Couleur d\'accent invalide.');
    }
    return parametres.modifier(partiel);
  });

  canal('secret:enregistrer', [{ type: 'string', max: 64 }, { type: 'string', max: 4096 }],
    (_e, nom, valeur) => { parametres.enregistrerSecret(nom, valeur); return true; });

  canal('secret:existe', [{ type: 'string', max: 64 }], (_e, nom) => parametres.secretExiste(nom));

  canal('app:ouvrirLien', [{ type: 'string', max: 2048 }], (_e, url) => {
    if (!urlExterneAutorisee(url)) throw new ErreurSecurite('Seuls les liens https sont autorisés.');
    return shell.openExternal(url);
  });

  canal('app:ouvrirJournaux', [], () => shell.openPath(path.join(app.getPath('userData'), 'logs')));

  // « Signaler un problème » : rapport copié dans le presse-papiers, à coller dans la conversation.
  canal('diagnostic:copierRapport', [], () => {
    let squelette = null;
    try {
      squelette = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf8')).forgeSquelette ?? null;
    } catch { /* silence-ok: version du squelette inconnue, rapport quand même */ }
    const rapport = diagnostic.construireRapport({
      nom: app.getName(),
      version: app.getVersion(),
      squelette,
      systeme: `${process.platform} ${process.getSystemVersion?.() || os.release()} ${process.arch} · Electron ${process.versions.electron} · langue ${app.getLocale()}`,
      parametres: parametres.lire(),
      lignes: diagnostic.dernieresLignes(journal.dossier() || path.join(app.getPath('userData'), 'logs')),
      dossierPerso: os.homedir(),
      secrets: journal.secretsConnus(),
    });
    clipboard.writeText(rapport);
    journal.info('Rapport de problème copié dans le presse-papiers.');
    return { lignes: rapport.split('\n').length };
  });

  canal('fichiers:choisir', [{
    type: 'objet',
    champs: {
      titre: { type: 'string', max: 200, optionnel: true },
      multiple: { type: 'boolean', optionnel: true },
      dossier: { type: 'boolean', optionnel: true },
      extensions: { type: 'string', max: 200, optionnel: true }, // ex. "zip,rar,7z"
    },
  }], async (event, o) => {
    const proprietes = [o.dossier ? 'openDirectory' : 'openFile'];
    if (o.multiple) proprietes.push('multiSelections');
    const filtres = o.extensions
      ? [{ name: 'Fichiers pris en charge', extensions: o.extensions.split(',').map((x) => x.trim()) }]
      : [];
    const r = await dialog.showOpenDialog(fenetreDe(event), { title: o.titre, properties: proprietes, filters: filtres });
    return r.canceled ? [] : r.filePaths;
  });

  canal('fenetre:action', [{ type: 'enum', valeurs: ['reduire', 'agrandir', 'fermer'] }], (event, action) => {
    const f = fenetreDe(event);
    if (!f) return;
    if (action === 'reduire') f.minimize();
    else if (action === 'agrandir') (f.isMaximized() ? f.unmaximize() : f.maximize());
    else f.close();
  });
}

module.exports = { canal, enregistrerCanauxDeBase, canauxDeclares: () => [...CANAUX.keys()] };
