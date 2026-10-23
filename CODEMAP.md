# CODEMAP — SubForge

> Généré par `codemap.py` v3 : **ne pas modifier à la main**. Régénérer après chaque modification du code.
> Format : `nom` suivi du numéro de ligne → lire seulement les lignes utiles (Read avec offset).

**90 fichiers · 13247 lignes** · 89 js · 1 html

## Liens entre fichiers

- IPC `app:infos` : traité `src/main/ipc.js:45`, autorisé `src/main/preload.js:10`
- IPC `app:ouvrirJournaux` : traité `src/main/ipc.js:80`, autorisé `src/main/preload.js:12`
- IPC `app:ouvrirLien` : traité `src/main/ipc.js:75`, autorisé `src/main/preload.js:11`
- IPC `conseils:activerReglages` : traité `src/main/services/traduction.js:913`, autorisé `src/main/preload.js:48`
- IPC `conseils:analyser` : traité `src/main/services/traduction.js:891`, autorisé `src/main/preload.js:46`
- IPC `conseils:copier` : traité `src/main/services/traduction.js:932`, autorisé `src/main/preload.js:50`
- IPC `conseils:retablirReglages` : traité `src/main/services/traduction.js:922`, autorisé `src/main/preload.js:49`
- IPC `conseils:vram` : traité `src/main/services/traduction.js:907`, autorisé `src/main/preload.js:47`
- IPC `contexte:chercher` : traité `src/main/services/traduction.js:744`, autorisé `src/main/preload.js:55`
- IPC `contexte:choisir` : traité `src/main/services/traduction.js:745`, autorisé `src/main/preload.js:56`
- IPC `contexte:enregistrer` : traité `src/main/services/traduction.js:726`, autorisé `src/main/preload.js:52`
- IPC `contexte:etat` : traité `src/main/services/traduction.js:725`, autorisé `src/main/preload.js:51`
- IPC `contexte:pour` : traité `src/main/services/traduction.js:737`, autorisé `src/main/preload.js:54`
- IPC `contexte:tester` : traité `src/main/services/traduction.js:732`, autorisé `src/main/preload.js:53`
- IPC `diagnostic:copierRapport` : traité `src/main/ipc.js:83`, autorisé `src/main/preload.js:13`
- IPC `enligne:automatique` : traité `src/main/services/traduction.js:829`, autorisé `src/main/preload.js:71`
- IPC `enligne:chercher` : traité `src/main/services/traduction.js:790`, autorisé `src/main/preload.js:69`
- IPC `enligne:enregistrer` : traité `src/main/services/traduction.js:761`, autorisé `src/main/preload.js:67`
- IPC `enligne:etat` : traité `src/main/services/traduction.js:754`, autorisé `src/main/preload.js:66`
- IPC `enligne:telecharger` : traité `src/main/services/traduction.js:812`, autorisé `src/main/preload.js:70`
- IPC `enligne:tester` : traité `src/main/services/traduction.js:784`, autorisé `src/main/preload.js:68`
- IPC `expressions:enregistrer` : traité `src/main/services/traduction.js:670`, autorisé `src/main/preload.js:58`
- IPC `expressions:lister` : traité `src/main/services/traduction.js:669`, autorisé `src/main/preload.js:57`
- IPC `expressions:regler` : traité `src/main/services/traduction.js:682`, autorisé `src/main/preload.js:60`
- IPC `expressions:supprimer` : traité `src/main/services/traduction.js:681`, autorisé `src/main/preload.js:59`
- IPC `expressions:tester` : traité `src/main/services/traduction.js:690`, autorisé `src/main/preload.js:61`
- IPC `fenetre:action` : traité `src/main/ipc.js:121`, autorisé `src/main/preload.js:19`
- IPC `fichiers:choisir` : traité `src/main/ipc.js:103`, autorisé `src/main/preload.js:18`
- IPC `glossaire:enregistrer` : traité `src/main/services/traduction.js:698`, autorisé `src/main/preload.js:63`
- IPC `glossaire:importer` : traité `src/main/services/traduction.js:709`, autorisé `src/main/preload.js:65`
- IPC `glossaire:lister` : traité `src/main/services/traduction.js:697`, autorisé `src/main/preload.js:62`
- IPC `glossaire:supprimer` : traité `src/main/services/traduction.js:708`, autorisé `src/main/preload.js:64`
- IPC `maj:etat` : traité `src/main/mises-a-jour.js:134`, autorisé `src/main/preload.js:20`
- IPC `maj:ignorer` : traité `src/main/mises-a-jour.js:153`, autorisé `src/main/preload.js:24`
- IPC `maj:installer` : traité `src/main/mises-a-jour.js:145`, autorisé `src/main/preload.js:23`
- IPC `maj:telecharger` : traité `src/main/mises-a-jour.js:138`, autorisé `src/main/preload.js:22`
- IPC `maj:verifier` : traité `src/main/mises-a-jour.js:136`, autorisé `src/main/preload.js:21`
- IPC `memoire:etat` : traité `src/main/services/traduction.js:660`, autorisé `src/main/preload.js:44`
- IPC `memoire:vider` : traité `src/main/services/traduction.js:661`, autorisé `src/main/preload.js:45`
- IPC `moteurs:annulerMesure` : traité `src/main/services/traduction.js:988`, autorisé `src/main/preload.js:43`
- IPC `moteurs:enregistrerCleDeepl` : traité `src/main/services/traduction.js:845`, autorisé `src/main/preload.js:36`
- IPC `moteurs:etat` : traité `src/main/services/traduction.js:843`, autorisé `src/main/preload.js:35`
- IPC `moteurs:mesurerOllama` : traité `src/main/services/traduction.js:958`, autorisé `src/main/preload.js:41`
- IPC `moteurs:modelesOllama` : traité `src/main/services/traduction.js:860`, autorisé `src/main/preload.js:39`
- IPC `moteurs:prechauffer` : traité `src/main/services/traduction.js:940`, autorisé `src/main/preload.js:42`
- IPC `moteurs:supprimerCleDeepl` : traité `src/main/services/traduction.js:856`, autorisé `src/main/preload.js:37`
- IPC `moteurs:testerDeepl` : traité `src/main/services/traduction.js:858`, autorisé `src/main/preload.js:38`
- IPC `moteurs:testerOllama` : traité `src/main/services/traduction.js:862`, autorisé `src/main/preload.js:40`
- IPC `parametres:lire` : traité `src/main/ipc.js:53`, autorisé `src/main/preload.js:14`
- IPC `parametres:modifier` : traité `src/main/ipc.js:55`, autorisé `src/main/preload.js:15`
- IPC `secret:enregistrer` : traité `src/main/ipc.js:70`, autorisé `src/main/preload.js:16`
- IPC `secret:existe` : traité `src/main/ipc.js:73`, autorisé `src/main/preload.js:17`
- IPC `traduction:analyser` : traité `src/main/services/traduction.js:592`, autorisé `src/main/preload.js:30`
- IPC `traduction:annuler` : traité `src/main/services/traduction.js:643`, autorisé `src/main/preload.js:32`
- IPC `traduction:apercu` : traité `src/main/services/traduction.js:650`, autorisé `src/main/preload.js:33`
- IPC `traduction:choisirDossierSortie` : traité `src/main/services/traduction.js:576`, autorisé `src/main/preload.js:28`
- IPC `traduction:explorer` : traité `src/main/services/traduction.js:584`, autorisé `src/main/preload.js:29`
- IPC `traduction:lancer` : traité `src/main/services/traduction.js:601`, autorisé `src/main/preload.js:31`
- IPC `traduction:langues` : traité `src/main/services/traduction.js:522`, autorisé `src/main/preload.js:25`
- IPC `traduction:modifierReglages` : traité `src/main/services/traduction.js:526`, autorisé `src/main/preload.js:27`
- IPC `traduction:montrer` : traité `src/main/services/traduction.js:653`, autorisé `src/main/preload.js:34`
- IPC `traduction:reglages` : traité `src/main/services/traduction.js:524`, autorisé `src/main/preload.js:26`

## Fichiers

### scripts/configurer-maj.js — outil · 52 l.
- importe : `../src/main/maj-outils`
- paquets : `fs`, `path`

### scripts/fuses.js — outil · 40 l.
- paquets : `path`, `fs`, `@electron/fuses`

### scripts/livrer.js — outil · 131 l.
- fonctions : `sha256(fichier)` 24
- paquets : `fs`, `path`, `crypto`, `child_process`

### scripts/piloter.js — outil · 158 l.
- API Electron utilisée : `forge.parametres.modifier` 137
- fonctions : `val(o)` 25, `pause(ms)` 49, `getJson(url)` 50, `connecter()` 52, `principal()` 64, `cdp(method, params = {})` 76, `evalJs(code)` 84, `q(sel)` 89, `scenarioParDefaut(p)` 134, `fin(code)` 149
- méthodes : `attendre(sel, ms = 5000)` 94, `clic(sel)` 102, `saisir(sel, texte)` 103, `choisir(sel, valeur)` 108, `ecran(nom)` 110, `capture(nom)` 111, `verifier(condition, message)` 117
- paquets : `child_process`, `http`, `fs`, `os`, `path`

### scripts/preparer-ffmpeg.js — outil · 90 l.
- fonctions : `extraireDuZip(zip, nomEntree)` 36
- paquets : `child_process`, `crypto`, `fs`, `os`, `path`, `zlib`

### scripts/preparer-ocr.js — outil · 24 l.
- paquets : `fs`, `path`

### scripts/publier.js — outil · 138 l.
- fonctions : `arreter(message)` 28, `api(args, options = {})` 33
- paquets : `fs`, `os`, `path`, `crypto`, `child_process`

### scripts/scan-securite.js — outil · 209 l.
- fonctions : `fichiers(dossier, exts)` 23, `rel(p)` 32, `lireCsv(texte)` 155, `titre(t, l)` 202
- paquets : `fs`, `path`, `child_process`

### scripts/tester-maj.js — tests · 112 l.
- fonctions : `yml(version, empreinte)` 31, `suite()` 58, `portFerme()` 72, `lancer(mode, port, portHorsLigne)` 78, `nettoyer()` 96
- paquets : `http`, `crypto`, `fs`, `os`, `path`, `child_process`

### scripts/tester-maj.scenario.js — tests · 88 l.
- API Electron utilisée : `forge.majs.etat` 16, `forge.majs.etat` 49, `forge.parametres.lire` 85
- fonctions : `visible(p)` 4, `attendreVisible(p, ms = 20000)` 6, `attendreEtat(p, etats, ms = 60000)` 12

### scripts/verifier-lancement.js — outil · 68 l.
- fonctions : `terminer(ok, message)` 59
- paquets : `child_process`, `path`, `fs`, `os`

### src/main/diagnostic.js — processus principal · 62 l.
- fonctions : `finDeFichier(fichier)` 13, `dernieresLignes(dossierJournaux, n = NB_LIGNES)` 30, `anonymiserChemins(texte, dossierPerso)` 37, `construireRapport({ nom, version, squelette, systeme, parametres, lignes, d…)` 43
- exporte : `construireRapport` 62, `dernieresLignes` 62, `anonymiserChemins` 62, `NB_LIGNES` 62
- importe : `./securite`
- paquets : `fs`, `path`

### src/main/ipc.js — processus principal · 130 l.
- IPC : canaux traités : `app:infos` 45, `parametres:lire` 53, `parametres:modifier` 55, `secret:enregistrer` 70, `secret:existe` 73, `app:ouvrirLien` 75, `app:ouvrirJournaux` 80, `diagnostic:copierRapport` 83, `fichiers:choisir` 103, `fenetre:action` 121
- fonctions : `expediteurAutorise(event)` 17, `canal(nom, schema, fonction)` 22, `fenetreDe(event)` 40, `enregistrerCanauxDeBase()` 44
- exporte : `canal` 130, `enregistrerCanauxDeBase` 130, `canauxDeclares` 130
- importe : `./diagnostic`, `./securite`, `./parametres`, `./journal`
- paquets : `electron`, `path`, `fs`, `os`

### src/main/journal.js — processus principal · 65 l.
- fonctions : `initialiser(dossierJournaux)` 14, `declarerSecret(valeur)` 20, `fichierCourant()` 24, `rotation()` 28, `ecrire(niveau, ...morceaux)` 42
- exporte : `initialiser` 57, `declarerSecret` 57, `dossier` 57, `secretsConnus` 57, `info` 57, `avertissement` 57, `erreur` 57
- importe : `./securite`
- paquets : `fs`, `path`

### src/main/main.js — processus principal · 164 l.
- fonctions : `signalerErreur(titre, e)` 32, `creerFenetre()` 56, `brancherTestLancement(f)` 105
- importe : `./journal`, `./parametres`, `./ipc`, `./securite`, `./services/traduction`, `./mises-a-jour`
- paquets : `electron`, `path`, `fs`

### src/main/maj-outils.js — processus principal · 43 l.
- fonctions : `notesEnTexte(notes)` 5, `messageErreur(e)` 20, `encoderJeton(jeton)` 36, `decoderJeton(code)` 39
- exporte : `notesEnTexte` 43, `messageErreur` 43, `encoderJeton` 43, `decoderJeton` 43

### src/main/mises-a-jour.js — processus principal · 174 l.
- IPC : canaux traités : `maj:etat` 134, `maj:verifier` 136, `maj:telecharger` 138, `maj:installer` 145, `maj:ignorer` 153
- IPC : envoyé à l'interface : `maj:changement` 30
- fonctions : `diffuser(nouvelEtat)` 27, `lireConfig()` 34, `configurer()` 46, `verifier(manuel)` 117, `enregistrerCanaux()` 133, `demarrer(fenetre)` 161, `lancer()` 169
- exporte : `demarrer` 174
- importe : `./journal`, `./parametres`, `./ipc`, `./maj-outils`
- paquets : `electron`, `fs`, `path`, `electron-updater`

### src/main/parametres.js — processus principal · 105 l.
- fonctions : `ecrireAtomique(fichier, contenu)` 27, `migrer(brut)` 33, `initialiser(dossierDonnees, moduleSafeStorage)` 40, `sauvegarder()` 53, `lire()` 61, `modifier(partiel)` 65, `lireCoffre()` 73, `enregistrerSecret(nom, valeur)` 82, `lireSecret(nom)` 94, `secretExiste(nom)` 101
- exporte : `initialiser` 105, `lire` 105, `modifier` 105, `enregistrerSecret` 105, `lireSecret` 105, `secretExiste` 105, `ecrireAtomique` 105
- importe : `./journal`
- paquets : `fs`, `path`

### src/main/preload.js — preload · 181 l.
- IPC : canaux appelés : `app:infos` 90, `app:ouvrirLien` 91, `app:ouvrirJournaux` 92, `diagnostic:copierRapport` 93, `parametres:lire` 95, `parametres:modifier` 96, `secret:enregistrer` 99, `secret:existe` 100, `fichiers:choisir` 103, `fenetre:action` 107, `traduction:langues` 109, `traduction:reglages` 110, `traduction:modifierReglages` 111, `traduction:choisirDossierSortie` 112, `traduction:explorer` 113, `traduction:analyser` 114, `traduction:lancer` 115, `traduction:annuler` 116, `traduction:apercu` 117, `traduction:montrer` 118, `memoire:etat` 122, `memoire:vider` 123, `conseils:analyser` 126, `conseils:vram` 127, `conseils:activerReglages` 128, `conseils:retablirReglages` 129, `conseils:copier` 130, `contexte:etat` 133, `contexte:enregistrer` 134, `contexte:tester` 135, `contexte:pour` 136, `contexte:chercher` 137, `contexte:choisir` 138, `expressions:lister` 141, `expressions:enregistrer` 142, `expressions:supprimer` 143, `expressions:regler` 144, `expressions:tester` 145, `glossaire:lister` 148, `glossaire:enregistrer` 149, `glossaire:supprimer` 150, `glossaire:importer` 151, `enligne:etat` 154, `enligne:enregistrer` 155, `enligne:tester` 156, `enligne:chercher` 157, `enligne:telecharger` 158, `enligne:automatique` 159, `moteurs:etat` 162, `moteurs:enregistrerCleDeepl` 163, `moteurs:supprimerCleDeepl` 164, `moteurs:testerDeepl` 165, `moteurs:modelesOllama` 166, `moteurs:testerOllama` 167, `moteurs:mesurerOllama` 168, `moteurs:prechauffer` 169, `moteurs:annulerMesure` 170, `maj:etat` 174, `maj:verifier` 175, `maj:telecharger` 176, `maj:installer` 177, `maj:ignorer` 178
- IPC : liste blanche : `app:infos` 10, `app:ouvrirLien` 11, `app:ouvrirJournaux` 12, `diagnostic:copierRapport` 13, `parametres:lire` 14, `parametres:modifier` 15, `secret:enregistrer` 16, `secret:existe` 17, `fichiers:choisir` 18, `fenetre:action` 19, `maj:etat` 20, `maj:verifier` 21, `maj:telecharger` 22, `maj:installer` 23, `maj:ignorer` 24, `traduction:langues` 25, `traduction:reglages` 26, `traduction:modifierReglages` 27, `traduction:choisirDossierSortie` 28, `traduction:explorer` 29, `traduction:analyser` 30, `traduction:lancer` 31, `traduction:annuler` 32, `traduction:apercu` 33, `traduction:montrer` 34, `moteurs:etat` 35, `moteurs:enregistrerCleDeepl` 36, `moteurs:supprimerCleDeepl` 37, `moteurs:testerDeepl` 38, `moteurs:modelesOllama` 39, `moteurs:testerOllama` 40, `moteurs:mesurerOllama` 41, `moteurs:prechauffer` 42, `moteurs:annulerMesure` 43, `memoire:etat` 44, `memoire:vider` 45, `conseils:analyser` 46, `conseils:vram` 47, `conseils:activerReglages` 48, `conseils:retablirReglages` 49, `conseils:copier` 50, `contexte:etat` 51, `contexte:enregistrer` 52, `contexte:tester` 53, `contexte:pour` 54, `contexte:chercher` 55, `contexte:choisir` 56, `expressions:lister` 57, `expressions:enregistrer` 58, `expressions:supprimer` 59, `expressions:regler` 60, `expressions:tester` 61, `glossaire:lister` 62, `glossaire:enregistrer` 63, `glossaire:supprimer` 64, `glossaire:importer` 65, `enligne:etat` 66, `enligne:enregistrer` 67, `enligne:tester` 68, `enligne:chercher` 69, `enligne:telecharger` 70, `enligne:automatique` 71
- IPC : événements autorisés : `maj:changement` 75, `traduction:progression` 75, `moteurs:mesure` 75
- API exposée à l'interface : `forge.infos → app:infos` 90, `forge.ouvrirLien → app:ouvrirLien` 91, `forge.ouvrirJournaux → app:ouvrirJournaux` 92, `forge.copierRapport → diagnostic:copierRapport` 93, `forge.parametres.lire → parametres:lire` 95, `forge.parametres.modifier → parametres:modifier` 96, `forge.secrets.enregistrer → secret:enregistrer` 99, `forge.secrets.existe → secret:existe` 100, `forge.fichiers.choisir → fichiers:choisir` 103, `forge.fichiers.cheminDe` 105, `forge.fenetre → fenetre:action` 107, `forge.traduction.langues → traduction:langues` 109, `forge.traduction.reglages → traduction:reglages` 110, `forge.traduction.modifierReglages → traduction:modifierReglages` 111, `forge.traduction.choisirDossierSortie → traduction:choisirDossierSortie` 112, `forge.traduction.explorer → traduction:explorer` 113, `forge.traduction.analyser → traduction:analyser` 114, `forge.traduction.lancer → traduction:lancer` 115, `forge.traduction.annuler → traduction:annuler` 116, `forge.traduction.apercu → traduction:apercu` 117, `forge.traduction.montrer → traduction:montrer` 118, `forge.traduction.surProgression → traduction:progression` 119, `forge.memoire.etat → memoire:etat` 122, `forge.memoire.vider → memoire:vider` 123, `forge.conseils.analyser → conseils:analyser` 126, `forge.conseils.vram → conseils:vram` 127, `forge.conseils.activerReglages → conseils:activerReglages` 128, `forge.conseils.retablirReglages → conseils:retablirReglages` 129, `forge.conseils.copier → conseils:copier` 130, `forge.contexte.etat → contexte:etat` 133, `forge.contexte.enregistrer → contexte:enregistrer` 134, `forge.contexte.tester → contexte:tester` 135, `forge.contexte.pour → contexte:pour` 136, `forge.contexte.chercher → contexte:chercher` 137, `forge.contexte.choisir → contexte:choisir` 138, `forge.expressions.lister → expressions:lister` 141, `forge.expressions.enregistrer → expressions:enregistrer` 142, `forge.expressions.supprimer → expressions:supprimer` 143, `forge.expressions.regler → expressions:regler` 144, `forge.expressions.tester → expressions:tester` 145, `forge.glossaire.lister → glossaire:lister` 148, `forge.glossaire.enregistrer → glossaire:enregistrer` 149, `forge.glossaire.supprimer → glossaire:supprimer` 150, `forge.glossaire.importer → glossaire:importer` 151, `forge.enLigne.etat → enligne:etat` 154, `forge.enLigne.enregistrer → enligne:enregistrer` 155, `forge.enLigne.tester → enligne:tester` 156, `forge.enLigne.chercher → enligne:chercher` 157, `forge.enLigne.telecharger → enligne:telecharger` 158, `forge.enLigne.automatique → enligne:automatique` 159, `forge.moteurs.etat → moteurs:etat` 162, `forge.moteurs.enregistrerCleDeepl → moteurs:enregistrerCleDeepl` 163, `forge.moteurs.supprimerCleDeepl → moteurs:supprimerCleDeepl` 164, `forge.moteurs.testerDeepl → moteurs:testerDeepl` 165, `forge.moteurs.modelesOllama → moteurs:modelesOllama` 166, `forge.moteurs.testerOllama → moteurs:testerOllama` 167, `forge.moteurs.mesurerOllama → moteurs:mesurerOllama` 168, `forge.moteurs.prechauffer → moteurs:prechauffer` 169, `forge.moteurs.annulerMesure → moteurs:annulerMesure` 170, `forge.moteurs.surMesure → moteurs:mesure` 171, `forge.majs.etat → maj:etat` 174, `forge.majs.verifier → maj:verifier` 175, `forge.majs.telecharger → maj:telecharger` 176, `forge.majs.installer → maj:installer` 177, `forge.majs.ignorer → maj:ignorer` 178, `forge.majs.surChangement → maj:changement` 179
- fonctions : `ecouter(evenement, rappel)` 77, `relais(_event, donnees)` 79, `appeler(canal, ...args)` 84
- paquets : `electron`

### src/main/securite.js — processus principal · 185 l.
- classes : `ErreurSecurite` 7, `LimitesDecompression` 48
- fonctions : `cheminSousDossier(base, relatif)` 18, `verifierEntreeArchive(dossierDestination, entree)` 39, `validerArguments(schema, args)` 79, `validerValeur(regle, valeur, nom)` 87, `urlExterneAutorisee(url)` 132, `argumentsCommande(args)` 144, `masquerSecrets(texte, secretsConnus = [])` 163
- méthodes : `constructor(message)` 8, `constructor({ tailleMax = 20 * 1024 ** 3, fichiersMax = 200000, ratio…)` 49, `ajouter({ tailleDecompressee, tailleCompressee })` 58
- exporte : `ErreurSecurite` 176, `cheminSousDossier` 176, `verifierEntreeArchive` 176, `LimitesDecompression` 176, `validerArguments` 176, `urlExterneAutorisee` 176, `argumentsCommande` 176, `masquerSecrets` 176
- paquets : `path`

### src/main/services/conseils-ia.js — processus principal · 184 l.
- fonctions : `vramDepuisNom(nom)` 18, `detecterCarte({ plateforme = process.platform, executer, existe, infoGp…)` 26, `margeGo(parallele)` 55, `versionLegere(nom)` 58, `goFr(n)` 63, `lourdeQuantification(q)` 64, `evaluer({ modeles = [], vramGo = null, parallele = 2 })` 67, `valeursConseillees(parallele)` 105, `REG(racine)` 108, `SETX(racine)` 109, `lireRegistre(executer, racine, cle, nom)` 114, `lireReglages({ plateforme = process.platform, executer, env = process.…)` 124, `activerReglages({ plateforme = process.platform, executer, racineWindows…)` 144, `retablirReglages({ plateforme = process.platform, executer, racineWindows…)` 160, `instructions(parallele = 2)` 173
- exporte : `detecterCarte` 181, `evaluer` 181, `versionLegere` 181, `vramDepuisNom` 181, `lireReglages` 181, `activerReglages` 181, `retablirReglages` 181, `instructions` 181, `valeursConseillees` 181, `NOMS_REGLAGES` 181, `RE_REFLEXION` 181, `CONSEILLES` 181
- paquets : `path`

### src/main/services/contexte.js — processus principal · 231 l.
- classes : `ErreurContexte` 18
- fonctions : `normaliser(s)` 22, `propre(s, max)` 25, `anneeDe(date)` 26, `formeJeton(jeton)` 30, `creerContexte({ fetch, lireJeton, fichierCache, urlTest = null, journal…)` 37, `chargerCache()` 40, `sauverCache()` 52, `appel(chemin, parametres = {}, { signal } = {})` 63, `tester()` 96, `chercher(texte, { signal } = {})` 102, `reconnaitre(lu, { signal } = {})` 121, `details(ref, lu, { signal } = {})` 138, `cleChoix(chemin, lu)` 177, `pour(chemin, { signal } = {})` 180, `choisir(chemin, ref)` 196, `personnages(liste)` 205, `texteContexte(c, max = 1500)` 219
- méthodes : `constructor(m, { refuse = false } = {})` 19
- exporte : `creerContexte` 231, `texteContexte` 231, `formeJeton` 231, `ErreurContexte` 231
- importe : `./enligne`
- paquets : `fs`, `path`

### src/main/services/dossiers.js — processus principal · 148 l.
- fonctions : `triNaturel(a, b)` 17, `parcourir(racine, { profondeurMax = 6, fichiersMax = 1000 } = {})` 19, `visiter(dossier, profondeur)` 22, `decomposer(chemin)` 54, `memeLangue(a, b)` 68, `selectionner(fichiers, { cible, source = 'auto' })` 71, `explorer(chemins, { cible, source, fichiersMax = 1000 })` 108, `videoAssociee(cheminSousTitre)` 136
- exporte : `parcourir` 148, `selectionner` 148, `explorer` 148, `decomposer` 148, `videoAssociee` 148, `EXT_SOUSTITRES` 148, `EXT_VIDEO` 148, `langue` 148
- importe : `./langues`
- paquets : `fs`, `path`

### src/main/services/enligne.js — processus principal · 237 l.
- NUI : callbacks envoyés au Lua : `api` 96
- classes : `ErreurEnLigne` 22
- fonctions : `empreinte(chemin)` 27, `lireNom(chemin)` 47, `normaliser(s)` 64, `choisirAutomatiquement(recherche, resultats)` 69, `creerEnLigne({ fetch, lireSecrets, utilisateur = ()` 84, `enTetes(cle, avecJeton)` 87, `baseDepuis(hote)` 94, `appel(chemin, { methode = 'GET', corps = null, avecJeton = true…)` 100, `connecter({ forcer = false } = {})` 132, `tester()` 144, `chercher(chemin, { langue, signal } = {})` 151, `telecharger(cheminFilm, fileId, { langue, ecrire, signal } = {})` 194, `automatique(cheminFilm, { langue, ecrire, signal } = {})` 222, `deconnecter()` 232
- méthodes : `constructor(m)` 23
- exporte : `creerEnLigne` 237, `choisirAutomatiquement` 237, `empreinte` 237, `lireNom` 237, `CODES_OS` 237, `ErreurEnLigne` 237
- paquets : `fs`, `path`

### src/main/services/expressions-integrees.js — processus principal · 176 l.
- exporte : `INTEGREES` 176

### src/main/services/expressions.js — processus principal · 193 l.
- classes : `ErreurExpression` 18
- fonctions : `echapper(t)` 22, `apostrophes(t)` 23, `motifPerso(expression)` 27, `mot(m)` 28, `compiler(motif)` 36, `nettoyerEntree(e, codes)` 41, `propre(v, max)` 42, `langue(v)` 53, `creerExpressions({ fichier, codesLangues = [], journal = console })` 60, `charger()` 63, `sauvegarder()` 90, `lister()` 102, `enregistrer(entree)` 112, `meme(x)` 115, `supprimer(id)` 127, `regler({ integrees, id, active })` 137, `pour({ source = 'auto', cible })` 150, `trouver(texte, prepare)` 172, `signature(aides)` 189
- méthodes : `constructor(m)` 19
- exporte : `creerExpressions` 193, `trouver` 193, `signature` 193, `ErreurExpression` 193, `MAX_PAR_REPLIQUE` 193
- importe : `./expressions-integrees`
- paquets : `crypto`, `fs`, `path`

### src/main/services/formats.js — processus principal · 515 l.
- classes : `ErreurFormat` 12
- fonctions : `decoder(buffer)` 18, `formatDepuisChemin(chemin)` 36, `lireFichier(chemin)` 40, `analyser(texte, format)` 52, `analyserSrt(t)` 69, `ecrireSrt(doc)` 96, `analyserVtt(t)` 104, `ecrireVtt(doc)` 124, `analyserAss(t)` 134, `ecrireAss(doc)` 169, `serialiser(doc)` 177, `versSrt(doc)` 187, `balisesSrt(texte)` 206, `tempsSrt(t)` 216, `versMs(t)` 226, `depuisMs(ms, style)` 232, `d2(n)` 238, `colonnesAss(doc)` 244, `lireMinutages(doc)` 257, `appliquerMinutages(doc, transformer)` 280, `preparerConversionAss(doc)` 326, `regexBalises(format)` 351, `decouperBalises(texte, format)` 360, `preparerReplique(texteBrut, format)` 374, `restaurerMarqueurs(texte, balises)` 427, `recouper(texte, nbLignes, longueurMax = 46)` 437, `texteVisible(texte)` 466, `nomSortie(cheminSource, codeCible, extension, dossierSortie = null)` 477, `ecrireFichier(chemin, doc)` 495
- méthodes : `constructor(message)` 13
- exporte : `TAILLE_MAX` 510, `EXTENSIONS` 510, `ErreurFormat` 510, `decoder` 510, `formatDepuisChemin` 510, `lireFichier` 510, `analyser` 510, `serialiser` 510, `versSrt` 510, `preparerConversionAss` 510, `preparerReplique` 510, `restaurerMarqueurs` 510, `recouper` 510, `texteVisible` 510, `nomSortie` 510, `ecrireFichier` 510, `versMs` 510, `depuisMs` 510, `lireMinutages` 510, `appliquerMinutages` 510
- paquets : `fs`, `path`

### src/main/services/glossaire.js — processus principal · 178 l.
- classes : `ErreurGlossaire` 16
- fonctions : `echapperRegex(t)` 20, `nettoyerEntree(e)` 22, `creerGlossaire({ fichier, journal = console })` 37, `charger()` 40, `sauvegarder()` 66, `lister()` 73, `enregistrer(entree)` 78, `supprimer(id)` 93, `importer(texte, codesLangues)` 103, `pour(cible)` 129, `appliquer(segment, prepare)` 144, `restituer(traduction, valeurs)` 166
- méthodes : `constructor(m)` 17
- exporte : `creerGlossaire` 178, `appliquer` 178, `restituer` 178, `ErreurGlossaire` 178, `nettoyerEntree` 178
- paquets : `crypto`, `fs`, `path`

### src/main/services/langues.js — processus principal · 64 l.
- fonctions : `langue(code)` 48, `depuisIso3(code)` 53, `suffixe(code)` 59
- exporte : `LANGUES` 64, `langue` 64, `depuisIso3` 64, `suffixe` 64, `codes` 64

### src/main/services/limite.js — processus principal · 60 l.
- fonctions : `creerLimite(n)` 5, `enParallele(elements, n, f)` 30, `ouvrier()` 33, `aLaChaine(travaux)` 46
- méthodes : `prendre(tache)` 11
- exporte : `creerLimite` 60, `enParallele` 60, `aLaChaine` 60

### src/main/services/memoire.js — processus principal · 168 l.
- fonctions : `creerMemoire({ fichier, journal = console })` 13, `cle({ moteur, variante = '', source = 'auto', cible }, segment)` 18, `analyser(texte, etat = { map: new Map()` 24, `installer(etat)` 46, `charger()` 54, `precharger()` 72, `compacter()` 96, `chercher(contexte, segments)` 110, `ajouter(contexte, paires)` 123, `etat()` 151, `vider()` 159
- exporte : `creerMemoire` 168, `MAX_ENTREES` 168
- paquets : `crypto`, `fs`, `path`

### src/main/services/moteurs.js — processus principal · 578 l.
- classes : `ErreurMoteur` 10
- fonctions : `pause(ms, signal)` 19, `jetons(t)` 28, `erreurAnnulation()` 34, `signalAvecDelai(signal, ms)` 36, `lireJson(reponse)` 41, `normaliser(t)` 53, `nombreMots(t)` 54, `nonTraduit(original, traduction)` 55, `formesAdresse(cible)` 65, `consigneRegistre(registre, cible)` 67, `texteAides(aides, vers)` 77, `mauvaiseEcriture(original, traduction, cible)` 86, `versXml(texte)` 90, `echapper(t)` 99, `depuisXml(t)` 100, `adresseOllamaValide(url)` 105, `normaliserAdresse(url)` 116, `creerMoteurs({ fetch, lireCleDeepl, urlDeeplTest = null, journal = con…)` 122, `baseDeepl(cle)` 124, `appelDeepl(chemin, { methode = 'GET', corps = null, signal } = {})` 129, `usageDeepl()` 166, `traduireDeepl(segments, { source, cible, formalite = 'defaut', registre…)` 175, `appelOllama(adresse, chemin, { corps = null, signal, delai = 15000 }…)` 210, `modelesOllama(adresse)` 236, `reflechit(adresse, modele)` 248, `detailsModeles(adresse)` 261, `consigne(source, cible, registre = 'auto', contexteFilm = '')` 278, `demande(segments, contexte, cible, aides = [])` 295, `extraireObjet(contenu)` 307, `lotOllama(segments, { adresse, modele, source, cible, registre, con…)` 319, `traduireOllama(segments, { adresse, modele, source, cible, registre, con…)` 352, `traiter(indices, taille, essai = 0)` 357, `demander()` 364, `promptRelecture(lignes, { source, cible, registre = 'auto', contexteFilm…)` 402, `relireScene(lignes, { adresse, modele, source, cible, registre = 'aut…)` 418, `numero(v)` 435, `texteCourt(v, max)` 436, `planifierLots(segments, { aides = [], adaptes = true, ...options } = {})` 451, `cout(i)` 460, `besoinLot(lot, aidesLot, { source, cible, registre = 'auto', contex…)` 484, `tailleContexte({ lots = [], aidesLots = [], scenes = [], options = {} })` 490, `noterCharge(adresse, modele, numCtx, garderCharge)` 505, `prechauffer({ adresse, modele, garderCharge = true })` 509, `decharger({ sauf = null } = {})` 519, `modeleCharge()` 531, `traduireTout(segments, options, surAvancement = ()` 535
- méthodes : `constructor(message, { definitive = true } = {})` 11
- exporte : `CTX_STANDARD` 578, `CTX_GRAND` 578, `jetons` 578, `creerMoteurs` 578, `ErreurMoteur` 578, `adresseOllamaValide` 578, `normaliserAdresse` 578, `versXml` 578, `depuisXml` 578, `nonTraduit` 578, `nombreMots` 578, `formesAdresse` 578
- importe : `./langues`, `./limite`, `./conseils-ia`

### src/main/services/ocr.js — processus principal · 102 l.
- fonctions : `erreurAnnulation()` 14, `nettoyer(texte, langue)` 19, `creerOcr({ dossierLangues, cheminTravailleur = null, journal = con…)` 31, `disponible(langue)` 32, `lire(images, { langue, signal, surAvancement = ()` 38, `arreter()` 47, `versSrt(repliques, textes)` 86, `temps(ms)` 87
- exporte : `creerOcr` 102, `nettoyer` 102, `versSrt` 102, `LANGUES_OCR` 102
- importe : `./pgs`
- paquets : `fs`, `os`, `path`, `tesseract.js`

### src/main/services/pgs.js — processus principal · 224 l.
- classes : `ErreurPgs` 11
- fonctions : `decoderRle(donnees, largeur, hauteur)` 16, `poser(couleur, n)` 21, `lireSup(buffer)` 41, `composer(liste, objets, palette)` 138, `recadrer(img)` 188, `compter(buffer)` 204, `memeImage(a, b)` 216, `versPgm(image)` 220
- méthodes : `constructor(m)` 12
- exporte : `compter` 224, `lireSup` 224, `decoderRle` 224, `versPgm` 224, `ErreurPgs` 224, `TAILLE_MAX` 224

### src/main/services/pipeline.js — processus principal · 364 l.
- fonctions : `erreurAnnulation()` 16, `verifierTraduit(originaux, traductions, options)` 22, `traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null…)` 38, `traductionSegment(i)` 98, `marquerPret(u)` 138, `scenes(doc, positions, preparations)` 214, `marqueursDe(t)` 232, `correctionValable(original, actuelle, correction, valeurs)` 236, `scenesARisque(liste, { segments, textes, indexUnique, aides, options })` 255, `sansMarqueurs(t)` 256, `demarrerRelecture({ liste, aRelire = null, segments, textes, indexUnique, t…)` 279, `surAnnulation()` 293, `lancer(k)` 299
- méthodes : `segmentPret(i)` 321, `lancerPretes()` 327, `abandonner()` 328, `terminer({ traductions, valeursGlossaire, notes })` 333
- exporte : `traduireDocument` 364, `scenes` 364, `correctionValable` 364, `scenesARisque` 364
- importe : `./formats`, `./glossaire`, `./langues`, `./moteurs`, `./expressions`, `./limite`

### src/main/services/synchro.js — processus principal · 196 l.
- fonctions : `pause()` 21, `analyserSon(binaire, film, { signal, surAvancement = ()` 24, `parole(energies)` 67, `signalSousTitres(minutages, vitesse, longueur)` 79, `fft(re, im, inverse = false)` 95, `norme(s)` 126, `trouverDecalage(energies, minutages, { signal } = {})` 130, `valeur(lag)` 160, `transformation({ vitesse, decalageMs })` 187, `libelleVitesse(v)` 190
- exporte : `analyserSon` 196, `parole` 196, `trouverDecalage` 196, `transformation` 196, `libelleVitesse` 196, `fft` 196, `TRAME_MS` 196, `REPLIQUES_MIN` 196
- importe : `./video`

### src/main/services/traduction.js — processus principal · 1010 l.
- IPC : canaux traités : `traduction:langues` 522, `traduction:reglages` 524, `traduction:modifierReglages` 526, `traduction:choisirDossierSortie` 576, `traduction:explorer` 584, `traduction:analyser` 592, `traduction:lancer` 601, `traduction:annuler` 643, `traduction:apercu` 650, `traduction:montrer` 653, `memoire:etat` 660, `memoire:vider` 661, `expressions:lister` 669, `expressions:enregistrer` 670, `expressions:supprimer` 681, `expressions:regler` 682, `expressions:tester` 690, `glossaire:lister` 697, `glossaire:enregistrer` 698, `glossaire:supprimer` 708, `glossaire:importer` 709, `contexte:etat` 725, `contexte:enregistrer` 726, `contexte:tester` 732, `contexte:pour` 737, `contexte:chercher` 744, `contexte:choisir` 745, `enligne:etat` 754, `enligne:enregistrer` 761, `enligne:tester` 784, `enligne:chercher` 790, `enligne:telecharger` 812, `enligne:automatique` 829, `moteurs:etat` 843, `moteurs:enregistrerCleDeepl` 845, `moteurs:supprimerCleDeepl` 856, `moteurs:testerDeepl` 858, `moteurs:modelesOllama` 860, `moteurs:testerOllama` 862, `conseils:analyser` 891, `conseils:vram` 907, `conseils:activerReglages` 913, `conseils:retablirReglages` 922, `conseils:copier` 932, `moteurs:prechauffer` 940, `moteurs:mesurerOllama` 958, `moteurs:annulerMesure` 988
- fonctions : `reglages()` 51, `envoyer(evenement)` 61, `langueDuNom(chemin)` 68, `sourceOuAnglais()` 74, `analyserUn(chemin)` 79, `creerTravail(el, optionsBase, signal)` 116, `rapporter(etat, extra = {})` 117, `relaisAnnulation()` 123, `synchroAffichee()` 140, `publier()` 141, `echouer(e)` 154, `nettoyer()` 168, `preparer()` 180, `traduire()` 260, `finaliser()` 287, `finSynchro(pct)` 297, `enchainer(elements, options, signal)` 372, `calculerSynchro(minutages, film, signal, surPct)` 378, `integrerAuFilm(film, sousTitre, options, signal, surAvancement)` 403, `libre(()` 411, `go(n)` 413, `copieNommee()` 416, `garderLesDeux(raison)` 435, `mettreALaCorbeille(chemin)` 465, `enregistrer({ racineApp })` 477, `resumeContexte(c)` 734, `videoExistante(chemin)` 786, `ecrireTelecharge(film, contenu, ext, l)` 798, `executerSysteme(binaire, args)` 871, `racineWindows()` 877, `nomCarte()` 878, `etape(texte)` 964, `fermer()` 1006
- exporte : `enregistrer` 1010, `fermer` 1010
- importe : `../ipc`, `../securite`, `../parametres`, `../journal`, `./formats`, `./video`, `./langues`, `./moteurs`, `./memoire`, `./glossaire`, `./expressions`, `./pipeline`, `./dossiers`, `./pgs`, `./ocr`, `./synchro`, `./limite`, `./contexte`, `./conseils-ia`, `./enligne`
- paquets : `electron`, `child_process`, `fs`, `os`, `path`

### src/main/services/video.js — processus principal · 203 l.
- fonctions : `cheminFfmpeg({ empaquete, resourcesPath, racineApp })` 21, `estVideo(chemin)` 27, `executer(binaire, args, { delai = 60000, signal, sortieMax = 4 * 1…)` 31, `terminer(fonction)` 42, `surAnnulation()` 43, `analyserFlux(texteFfmpeg)` 60, `listerPistes(binaire, chemin, { signal } = {})` 95, `estPgs(piste)` 106, `extrairePiste(binaire, chemin, piste, { signal } = {})` 108, `lireDuree(texteFfmpeg)` 130, `integrerPiste(binaire, film, sousTitre, { sortie, langueIso3 = 'und', t…)` 138, `toutArreter()` 182, `verifierCopie(binaire, original, copie, { signal } = {})` 189, `decrire(f)` 190
- exporte : `verifierCopie` 203, `integrerPiste` 203, `lireDuree` 203, `estPgs` 203, `EXTENSIONS_VIDEO` 203, `cheminFfmpeg` 203, `estVideo` 203, `analyserFlux` 203, `listerPistes` 203, `extrairePiste` 203, `toutArreter` 203, `executer` 203
- importe : `../securite`, `./langues`
- paquets : `child_process`, `fs`, `os`, `path`

### src/renderer/index.html — interface · 529 l.
- écrans / sections : `traduire` 24, `glossaire` 25, `expressions` 26, `moteurs` 27, `parametres` 29, `a-propos` 30, `ecran-traduire` 35, `ecran-glossaire` 128, `ecran-expressions` 168, `ecran-moteurs` 230, `ecran-parametres` 404, `ecran-a-propos` 444
- scripts : `js/ui.js`, `js/app.js`, `js/traduire.js`, `js/moteurs.js`, `js/glossaire.js`, `js/expressions.js`, `js/contexte.js`, `js/conseils.js`, `js/enligne.js`, `js/maj.js`
- styles : `styles/theme.css`, `styles/app.css`

### src/renderer/js/app.js — interface · 59 l.
- API Electron utilisée : `forge.fenetre` 8, `forge.parametres.lire` 13, `forge.parametres.modifier` 28, `forge.ouvrirJournaux` 39, `forge.copierRapport` 42, `forge.infos` 48
- fonctions : `enregistrer(partiel)` 26

### src/renderer/js/conseils.js — interface · 106 l.
- API Electron utilisée : `forge.traduction.modifierReglages` 33
- fonctions : `goFr(n)` 11, `copier(texte)` 14, `boutonCopier(texte)` 15, `dessiner(r)` 17, `analyser()` 83

### src/renderer/js/contexte.js — interface · 107 l.
- API Electron utilisée : `forge.traduction.modifierReglages` 36, `forge.ouvrirLien` 44
- fonctions : `nettoyer(e)` 11, `dessinerReglages()` 15, `rafraichir()` 22, `chercher()` 52, `choisir(ref)` 79, `fermer()` 89

### src/renderer/js/enligne.js — interface · 153 l.
- API Electron utilisée : `forge.traduction.langues` 13, `forge.ouvrirLien` 55
- fonctions : `nettoyer(e)` 11, `dessinerReglages()` 17, `rafraichir()` 26, `chercher()` 68, `telecharger(x, bouton)` 107, `fermer()` 129

### src/renderer/js/expressions.js — interface · 165 l.
- API Electron utilisée : `forge.traduction.langues` 12, `forge.traduction.reglages` 151
- fonctions : `nomLangue(code)` 13, `court(code)` 14, `viderFormulaire()` 23, `entete(colonnes)` 33, `correspond(filtre, ...champs)` 34, `dessinerPerso()` 36, `dessinerIntegrees()` 61, `charger()` 85, `regler(o)` 97, `modifier(e)` 102, `supprimer(e)` 115, `tester()` 146

### src/renderer/js/glossaire.js — interface · 116 l.
- API Electron utilisée : `forge.traduction.langues` 11
- fonctions : `nomLangue(code)` 12, `viderFormulaire()` 18, `dessiner()` 29, `charger()` 58, `modifier(e)` 70, `supprimer(e)` 82

### src/renderer/js/maj.js — interface · 115 l.
- API Electron utilisée : `forge.majs.telecharger` 99, `forge.majs.installer` 100, `forge.majs.ignorer` 103, `forge.majs.verifier` 108, `forge.majs.surChangement` 110, `forge.majs.etat` 111
- fonctions : `mo(o)` 12, `dateFr(d)` 13, `ouvrir()` 17, `fermer()` 18, `boutons({ telecharger = false, installer = false, plusTard = true…)` 20, `afficher(e)` 28

### src/renderer/js/moteurs.js — interface · 194 l.
- API Electron utilisée : `forge.ouvrirLien` 67, `forge.ouvrirLien` 130, `forge.memoire.etat` 164, `forge.memoire.vider` 184
- fonctions : `nombre(n)` 11, `rafraichir()` 13, `afficherQuota(u)` 30, `chargerModeles({ silencieux = false } = {})` 71, `basculerSiUtile()` 101, `s(ms)` 144, `majMemoire()` 162

### src/renderer/js/traduire.js — interface · 612 l.
- API Electron utilisée : `forge.moteurs.etat` 95, `forge.moteurs.prechauffer` 199, `forge.contexte.pour` 212, `forge.fichiers.cheminDe` 250, `forge.fichiers.choisir` 256, `forge.fichiers.choisir` 261, `forge.enLigne.etat` 466, `forge.enLigne.automatique` 491
- fonctions : `appliquerReglages(r)` 34, `modifier(o)` 54, `majRegistre()` 77, `majAvertissement()` 90, `choisirPiste(pistes)` 115, `parmi(l)` 118, `appliquerInfo(e, info)` 122, `ajouter(chemins)` 147, `prechaufferModele()` 197, `chargerContexte(e)` 208, `ligneContexte(e)` 219, `changer(libelle)` 222, `description(e)` 274, `libellePiste(p)` 286, `dessiner(e)` 295, `sec(ms)` 358, `aRetraduire(e)` 426, `chercherEnLigne(e)` 431, `majFile()` 443, `afficherApercu(e)` 574

### src/renderer/js/ui.js — interface · 43 l.
- fonctions : `el(tag, attributs = {}, enfants = [])` 6, `notifier(message, type = 'info', duree = 4000)` 18, `erreur(e)` 25, `appliquerTheme(theme, accent)` 30, `afficherEcran(nom)` 37

### tests/chaine.test.js — tests · 84 l.
- fonctions : `attendre(ms)` 10, `travail(n)` 18, `travail(n)` 39, `ctx(segments)` 52
- méthodes : `preparer()` 19, `traduire()` 20, `finaliser()` 21, `preparer()` 42, `traduire()` 43, `finaliser()` 44
- importe : `../src/main/services/limite`, `../src/main/services/pipeline`, `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`

### tests/conseils-ia.test.js — tests · 175 l.
- fonctions : `executer(b, a)` 16, `panne()` 22, `fauxWindows(initial = {})` 69, `executer(binaire, args)` 73, `jamais()` 123, `refus(b)` 133
- importe : `../src/main/services/conseils-ia`, `../src/main/services/moteurs`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `http`

### tests/contexte.test.js — tests · 96 l.
- fonctions : `preparer(jeton = JETON_TEST)` 14
- importe : `../src/main/services/contexte`, `./e2e/faux-tmdb`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/dossiers.test.js — tests · 97 l.
- fonctions : `arbre(fichiers)` 11
- importe : `../src/main/services/dossiers`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/e2e/blu-ray.js — tests · 52 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/enligne-saison.js — tests · 55 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/enligne.js — tests · 67 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/expressions.js — tests · 72 l.
- importe : `./outils`
- paquets : `fs`, `path`

### tests/e2e/faux-deepl.js — tests · 18 l.
- paquets : `http`

### tests/e2e/faux-opensubtitles.js — tests · 44 l.
- fonctions : `json(code, o)` 14
- paquets : `http`

### tests/e2e/faux-tmdb.js — tests · 58 l.
- fonctions : `fauxTmdb(port = 0)` 20, `json(code, o)` 26, `film(f)` 31, `serie(x)` 32, `correspond(t)` 33
- exporte : `fauxTmdb` 57, `JETON_TEST` 57, `CLE_TEST` 57
- paquets : `http`

### tests/e2e/glossaire-memoire.js — tests · 85 l.
- importe : `./outils`
- paquets : `fs`, `path`

### tests/e2e/outils.js — tests · 97 l.
- fonctions : `fauxOllama()` 12, `lignesDemandees(contenu)` 75, `ffmpeg()` 81, `utiliserFauxOllama(p, serveur)` 86
- exporte : `fauxOllama` 97, `ffmpeg` 97, `utiliserFauxOllama` 97, `lignesDemandees` 97, `RACINE` 97
- paquets : `http`, `path`

### tests/e2e/saison.js — tests · 58 l.
- fonctions : `film(chemin, srt)` 13
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/traduction.js — tests · 127 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/v110.js — tests · 77 l.
- fonctions : `ligne(nom)` 40
- importe : `./outils`
- paquets : `fs`, `path`

### tests/e2e/v12.js — tests · 116 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/v14.js — tests · 94 l.
- fonctions : `hasard(graine)` 12, `temps(ms)` 13
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/v15.js — tests · 73 l.
- importe : `./outils`, `./faux-tmdb`
- paquets : `fs`, `path`

### tests/e2e/v16.js — tests · 84 l.
- fonctions : `hasard(graine)` 12, `temps(ms)` 13
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/v17.js — tests · 60 l.
- importe : `./outils`
- paquets : `fs`, `path`

### tests/e2e/v18.js — tests · 59 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/v19.js — tests · 99 l.
- fonctions : `fabriquer(nom)` 44, `desc(()` 57
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/enligne.test.js — tests · 203 l.
- fonctions : `serveur(options = {})` 16, `json(code, o)` 25, `film(nom, taille = 300000)` 63, `ecrire(cheminFilm, contenu, ext, langue)` 70, `attendu(()` 86, `r(o)` 169
- importe : `../src/main/services/enligne`
- paquets : `node:test`, `node:assert/strict`, `http`, `fs`, `os`, `path`, `crypto`

### tests/expressions.test.js — tests · 146 l.
- fonctions : `nouveau()` 20, `textes(t, p)` 24, `serveur(gerer)` 89, `json(res, code, o)` 102
- importe : `../src/main/services/expressions`, `../src/main/services/expressions-integrees`, `../src/main/services/moteurs`, `../src/main/services/memoire`, `../src/main/services/pipeline`, `../src/main/services/formats`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `http`

### tests/fixtures/fabriquer-sup.js — tests · 43 l.
- fonctions : `rendreLigne(texte)` 22
- importe : `../outils/pgs-encodeur`
- paquets : `child_process`, `fs`, `os`, `path`

### tests/formats.test.js — tests · 150 l.
- fonctions : `traduire(segments)` 32, `traduireDoc(doc)` 34
- importe : `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/glossaire-memoire.test.js — tests · 176 l.
- fonctions : `dossier()` 15, `fauxMoteur()` 18, `lire()` 158
- importe : `../src/main/services/glossaire`, `../src/main/services/memoire`, `../src/main/services/pipeline`, `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/ia-locale-memoire.test.js — tests · 116 l.
- importe : `../src/main/services/memoire`, `../src/main/services/moteurs`, `../src/main/services/pipeline`, `../src/main/services/formats`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/moteurs.test.js — tests · 144 l.
- fonctions : `serveur(gestion)` 10, `json(res, code, o, entetes = {})` 23
- importe : `../src/main/services/moteurs`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `http`

### tests/ocr.test.js — tests · 114 l.
- fonctions : `rectangle(l, h)` 18, `mots(t)` 80
- importe : `../src/main/services/pgs`, `../src/main/services/ocr`, `./outils/pgs-encodeur`
- paquets : `node:test`, `node:assert/strict`, `fs`, `path`

### tests/outils/pgs-encodeur.js — tests · 80 l.
- fonctions : `segment(type, pts, donnees)` 5, `rle(indices, largeur, hauteur)` 15, `quantifier(rgba, largeur, hauteur)` 37, `encoderSup(repliques, { video = [1920, 1080] } = {})` 49
- exporte : `encoderSup` 80, `rle` 80

### tests/parallele.test.js — tests · 140 l.
- fonctions : `attendre(ms)` 14, `ollamaLent()` 29, `srt(n, ecartMs = 1000)` 80
- méthodes : `traduireTout(segments, o)` 87, `relire(lignes)` 98, `traduireTout(segments, o)` 114
- importe : `../src/main/services/limite`, `../src/main/services/moteurs`, `../src/main/services/pipeline`, `../src/main/services/formats`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `http`

### tests/relecture.test.js — tests · 162 l.
- fonctions : `srt(repliques)` 17, `serveur(gerer)` 71, `json(res, o)` 84
- méthodes : `relire(lignes)` 45, `surAvancement()` 58
- importe : `../src/main/services/pipeline`, `../src/main/services/moteurs`, `../src/main/services/memoire`, `../src/main/services/formats`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `http`

### tests/securite/diagnostic.test.js — tests · 53 l.
- fonctions : `dossierJournaux(lignesApp, lignesArchive = [])` 12
- importe : `../../src/main/diagnostic`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/securite/ipc.test.js — tests · 56 l.
- fonctions : `lireTous(dossier)` 12
- paquets : `node:test`, `node:assert/strict`, `fs`, `path`

### tests/securite/maj.test.js — tests · 76 l.
- importe : `../../src/main/maj-outils`, `../../src/main/securite`
- paquets : `node:test`, `node:assert/strict`, `fs`, `path`

### tests/securite/securite.test.js — tests · 133 l.
- importe : `../../src/main/securite`, `../../src/main/journal`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `child_process`

### tests/securite/subforge.test.js — tests · 63 l.
- importe : `../../src/main/journal`, `../../src/main/parametres`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/synchro.test.js — tests · 124 l.
- fonctions : `hasard(graine)` 16, `repliquesVraies(dureeS, graine = 7)` 19, `energiesPour(repliques, dureeS, graine = 3)` 32
- importe : `../src/main/services/synchro`, `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `child_process`

### tests/video.test.js — tests · 172 l.
- importe : `../src/main/services/video`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `child_process`, `x.mkv`
