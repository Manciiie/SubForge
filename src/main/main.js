'use strict';

const { app, BrowserWindow, dialog, session, safeStorage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const journal = require('./journal');
const parametres = require('./parametres');
const { enregistrerCanauxDeBase } = require('./ipc');
const { urlExterneAutorisee } = require('./securite');

const MODE_TEST = process.env.FORGE_TEST_LANCEMENT === '1';
const EST_DEV = !app.isPackaged;

// --- Avant « ready » ---------------------------------------------------------

journal.initialiser(path.join(app.getPath('userData'), 'logs'));

// L'option « Désactiver l'accélération matérielle » doit être lue avant ready.
try {
  const brut = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'parametres.json'), 'utf8'));
  if (brut.accelerationMaterielle === false) app.disableHardwareAcceleration();
} catch { /* silence-ok: premier lancement ; un fichier corrompu est signalé par parametres.js */ }

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

process.on('uncaughtException', (e) => signalerErreur('Erreur inattendue', e));
process.on('unhandledRejection', (e) => signalerErreur('Erreur inattendue (promesse)', e));

function signalerErreur(titre, e) {
  journal.erreur(titre, e);
  if (MODE_TEST) { console.error('FORGE_ERREUR', e); app.exit(1); return; }
  if (app.isReady()) {
    dialog.showErrorBox(titre, `${e?.message || e}\n\nLe détail est enregistré dans le journal :\n${path.join(app.getPath('userData'), 'logs')}`);
  }
}

// Durcissement appliqué à TOUTE page créée par l'application.
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (ev, url) => {
    if (url !== contents.getURL()) ev.preventDefault();
  });
  contents.on('will-attach-webview', (ev) => ev.preventDefault());
  contents.setWindowOpenHandler(({ url }) => {
    if (urlExterneAutorisee(url)) require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
});

// --- Fenêtre -------------------------------------------------------------------

let fenetre = null;

function creerFenetre() {
  const p = parametres.lire();
  fenetre = new BrowserWindow({
    width: p.fenetre.largeur,
    height: p.fenetre.hauteur,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: p.theme === 'clair' ? '#f5f6fa' : '#14151b',
    icon: path.join(__dirname, '..', '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: EST_DEV,
      spellcheck: false,
    },
  });

  if (p.fenetre.maximisee) fenetre.maximize();

  // Filet de sécurité : la fenêtre s'affiche même si ready-to-show n'arrive jamais
  // (cause du bug « l'app installée n'ouvre aucune fenêtre »).
  const filet = setTimeout(() => { if (fenetre && !fenetre.isVisible()) fenetre.show(); }, 3000);
  fenetre.once('ready-to-show', () => { clearTimeout(filet); fenetre.show(); });

  fenetre.webContents.on('render-process-gone', (_e, details) => {
    journal.erreur('Le moteur d\'affichage s\'est arrêté :', details);
    if (!MODE_TEST && details.reason !== 'clean-exit') fenetre.reload();
  });

  fenetre.on('close', () => {
    const b = fenetre.getNormalBounds();
    parametres.modifier({ fenetre: { largeur: b.width, hauteur: b.height, maximisee: fenetre.isMaximized() } });
  });
  fenetre.on('closed', () => { fenetre = null; });

  if (MODE_TEST) brancherTestLancement(fenetre);

  fenetre.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

// Utilisé par scripts/verifier-lancement.js : l'app signale qu'elle a démarré
// sans erreur console, puis se ferme toute seule.
function brancherTestLancement(f) {
  const erreurs = [];
  // Electron récent : (event) avec event.level/message ; ancien : (event, level, message).
  f.webContents.on('console-message', (ev, ancienNiveau, ancienMessage) => {
    const niveau = ev?.level ?? ancienNiveau;
    if (niveau === 'error' || niveau === 3) erreurs.push(ev?.message ?? ancienMessage);
  });
  f.webContents.on('did-fail-load', (_e, code, desc) => { console.error('FORGE_ERREUR chargement', code, desc); app.exit(1); });
  f.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      const ok = await f.webContents.executeJavaScript('window.__forgePret === true').catch(() => false);
      if (!ok) erreurs.push('Le renderer n\'a pas signalé window.__forgePret = true');
      if (erreurs.length) { console.error('FORGE_ERREUR', JSON.stringify(erreurs)); app.exit(1); }
      else { console.log('FORGE_PRET'); app.exit(0); }
    }, 1500);
  });
}

// --- Cycle de vie --------------------------------------------------------------

app.on('second-instance', () => {
  if (!fenetre) return;
  if (fenetre.isMinimized()) fenetre.restore();
  fenetre.show();
  fenetre.focus();
});

app.whenReady().then(() => {
  parametres.initialiser(app.getPath('userData'), safeStorage);
  journal.info(`Démarrage de ${app.getName()} ${app.getVersion()}`);

  // Permissions refusées par défaut (caméra, micro, notifications, géolocalisation…).
  // Ajouter ici uniquement ce dont l'application a réellement besoin.
  const PERMISSIONS_AUTORISEES = new Set([]);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, rappel) => rappel(PERMISSIONS_AUTORISEES.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => PERMISSIONS_AUTORISEES.has(permission));

  if (!EST_DEV) Menu.setApplicationMenu(null);

  enregistrerCanauxDeBase();
  require('./services/traduction').enregistrer({ racineApp: path.join(__dirname, '..', '..') });

  creerFenetre();
  require('./mises-a-jour').demarrer(fenetre);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) creerFenetre(); });
}).catch((e) => signalerErreur('Échec du démarrage', e));

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
