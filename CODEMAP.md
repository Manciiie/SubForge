# CODEMAP — SubForge

> Généré par `codemap.py` v3 : **ne pas modifier à la main**. Régénérer après chaque modification du code.
> Format : `nom` suivi du numéro de ligne → lire seulement les lignes utiles (Read avec offset).

**83 fichiers · 11954 lignes** · 82 js · 1 html

## Liens entre fichiers

- IPC `app:infos` : traité `src/main/ipc.js:45`, autorisé `src/main/preload.js:10`
- IPC `app:ouvrirJournaux` : traité `src/main/ipc.js:80`, autorisé `src/main/preload.js:12`
- IPC `app:ouvrirLien` : traité `src/main/ipc.js:75`, autorisé `src/main/preload.js:11`
- IPC `contexte:chercher` : traité `src/main/services/traduction.js:618`, autorisé `src/main/preload.js:50`
- IPC `contexte:choisir` : traité `src/main/services/traduction.js:619`, autorisé `src/main/preload.js:51`
- IPC `contexte:enregistrer` : traité `src/main/services/traduction.js:600`, autorisé `src/main/preload.js:47`
- IPC `contexte:etat` : traité `src/main/services/traduction.js:599`, autorisé `src/main/preload.js:46`
- IPC `contexte:pour` : traité `src/main/services/traduction.js:611`, autorisé `src/main/preload.js:49`
- IPC `contexte:tester` : traité `src/main/services/traduction.js:606`, autorisé `src/main/preload.js:48`
- IPC `diagnostic:copierRapport` : traité `src/main/ipc.js:83`, autorisé `src/main/preload.js:13`
- IPC `enligne:automatique` : traité `src/main/services/traduction.js:703`, autorisé `src/main/preload.js:66`
- IPC `enligne:chercher` : traité `src/main/services/traduction.js:664`, autorisé `src/main/preload.js:64`
- IPC `enligne:enregistrer` : traité `src/main/services/traduction.js:635`, autorisé `src/main/preload.js:62`
- IPC `enligne:etat` : traité `src/main/services/traduction.js:628`, autorisé `src/main/preload.js:61`
- IPC `enligne:telecharger` : traité `src/main/services/traduction.js:686`, autorisé `src/main/preload.js:65`
- IPC `enligne:tester` : traité `src/main/services/traduction.js:658`, autorisé `src/main/preload.js:63`
- IPC `expressions:enregistrer` : traité `src/main/services/traduction.js:544`, autorisé `src/main/preload.js:53`
- IPC `expressions:lister` : traité `src/main/services/traduction.js:543`, autorisé `src/main/preload.js:52`
- IPC `expressions:regler` : traité `src/main/services/traduction.js:556`, autorisé `src/main/preload.js:55`
- IPC `expressions:supprimer` : traité `src/main/services/traduction.js:555`, autorisé `src/main/preload.js:54`
- IPC `expressions:tester` : traité `src/main/services/traduction.js:564`, autorisé `src/main/preload.js:56`
- IPC `fenetre:action` : traité `src/main/ipc.js:121`, autorisé `src/main/preload.js:19`
- IPC `fichiers:choisir` : traité `src/main/ipc.js:103`, autorisé `src/main/preload.js:18`
- IPC `glossaire:enregistrer` : traité `src/main/services/traduction.js:572`, autorisé `src/main/preload.js:58`
- IPC `glossaire:importer` : traité `src/main/services/traduction.js:583`, autorisé `src/main/preload.js:60`
- IPC `glossaire:lister` : traité `src/main/services/traduction.js:571`, autorisé `src/main/preload.js:57`
- IPC `glossaire:supprimer` : traité `src/main/services/traduction.js:582`, autorisé `src/main/preload.js:59`
- IPC `maj:etat` : traité `src/main/mises-a-jour.js:134`, autorisé `src/main/preload.js:20`
- IPC `maj:ignorer` : traité `src/main/mises-a-jour.js:153`, autorisé `src/main/preload.js:24`
- IPC `maj:installer` : traité `src/main/mises-a-jour.js:145`, autorisé `src/main/preload.js:23`
- IPC `maj:telecharger` : traité `src/main/mises-a-jour.js:138`, autorisé `src/main/preload.js:22`
- IPC `maj:verifier` : traité `src/main/mises-a-jour.js:136`, autorisé `src/main/preload.js:21`
- IPC `memoire:etat` : traité `src/main/services/traduction.js:534`, autorisé `src/main/preload.js:44`
- IPC `memoire:vider` : traité `src/main/services/traduction.js:535`, autorisé `src/main/preload.js:45`
- IPC `moteurs:annulerMesure` : traité `src/main/services/traduction.js:790`, autorisé `src/main/preload.js:43`
- IPC `moteurs:enregistrerCleDeepl` : traité `src/main/services/traduction.js:719`, autorisé `src/main/preload.js:36`
- IPC `moteurs:etat` : traité `src/main/services/traduction.js:717`, autorisé `src/main/preload.js:35`
- IPC `moteurs:mesurerOllama` : traité `src/main/services/traduction.js:763`, autorisé `src/main/preload.js:41`
- IPC `moteurs:modelesOllama` : traité `src/main/services/traduction.js:734`, autorisé `src/main/preload.js:39`
- IPC `moteurs:prechauffer` : traité `src/main/services/traduction.js:745`, autorisé `src/main/preload.js:42`
- IPC `moteurs:supprimerCleDeepl` : traité `src/main/services/traduction.js:730`, autorisé `src/main/preload.js:37`
- IPC `moteurs:testerDeepl` : traité `src/main/services/traduction.js:732`, autorisé `src/main/preload.js:38`
- IPC `moteurs:testerOllama` : traité `src/main/services/traduction.js:736`, autorisé `src/main/preload.js:40`
- IPC `parametres:lire` : traité `src/main/ipc.js:53`, autorisé `src/main/preload.js:14`
- IPC `parametres:modifier` : traité `src/main/ipc.js:55`, autorisé `src/main/preload.js:15`
- IPC `secret:enregistrer` : traité `src/main/ipc.js:70`, autorisé `src/main/preload.js:16`
- IPC `secret:existe` : traité `src/main/ipc.js:73`, autorisé `src/main/preload.js:17`
- IPC `traduction:analyser` : traité `src/main/services/traduction.js:465`, autorisé `src/main/preload.js:30`
- IPC `traduction:annuler` : traité `src/main/services/traduction.js:517`, autorisé `src/main/preload.js:32`
- IPC `traduction:apercu` : traité `src/main/services/traduction.js:524`, autorisé `src/main/preload.js:33`
- IPC `traduction:choisirDossierSortie` : traité `src/main/services/traduction.js:449`, autorisé `src/main/preload.js:28`
- IPC `traduction:explorer` : traité `src/main/services/traduction.js:457`, autorisé `src/main/preload.js:29`
- IPC `traduction:lancer` : traité `src/main/services/traduction.js:474`, autorisé `src/main/preload.js:31`
- IPC `traduction:langues` : traité `src/main/services/traduction.js:398`, autorisé `src/main/preload.js:25`
- IPC `traduction:modifierReglages` : traité `src/main/services/traduction.js:402`, autorisé `src/main/preload.js:27`
- IPC `traduction:montrer` : traité `src/main/services/traduction.js:527`, autorisé `src/main/preload.js:34`
- IPC `traduction:reglages` : traité `src/main/services/traduction.js:400`, autorisé `src/main/preload.js:26`

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

### src/main/preload.js — preload · 169 l.
- IPC : canaux appelés : `app:infos` 85, `app:ouvrirLien` 86, `app:ouvrirJournaux` 87, `diagnostic:copierRapport` 88, `parametres:lire` 90, `parametres:modifier` 91, `secret:enregistrer` 94, `secret:existe` 95, `fichiers:choisir` 98, `fenetre:action` 102, `traduction:langues` 104, `traduction:reglages` 105, `traduction:modifierReglages` 106, `traduction:choisirDossierSortie` 107, `traduction:explorer` 108, `traduction:analyser` 109, `traduction:lancer` 110, `traduction:annuler` 111, `traduction:apercu` 112, `traduction:montrer` 113, `memoire:etat` 117, `memoire:vider` 118, `contexte:etat` 121, `contexte:enregistrer` 122, `contexte:tester` 123, `contexte:pour` 124, `contexte:chercher` 125, `contexte:choisir` 126, `expressions:lister` 129, `expressions:enregistrer` 130, `expressions:supprimer` 131, `expressions:regler` 132, `expressions:tester` 133, `glossaire:lister` 136, `glossaire:enregistrer` 137, `glossaire:supprimer` 138, `glossaire:importer` 139, `enligne:etat` 142, `enligne:enregistrer` 143, `enligne:tester` 144, `enligne:chercher` 145, `enligne:telecharger` 146, `enligne:automatique` 147, `moteurs:etat` 150, `moteurs:enregistrerCleDeepl` 151, `moteurs:supprimerCleDeepl` 152, `moteurs:testerDeepl` 153, `moteurs:modelesOllama` 154, `moteurs:testerOllama` 155, `moteurs:mesurerOllama` 156, `moteurs:prechauffer` 157, `moteurs:annulerMesure` 158, `maj:etat` 162, `maj:verifier` 163, `maj:telecharger` 164, `maj:installer` 165, `maj:ignorer` 166
- IPC : liste blanche : `app:infos` 10, `app:ouvrirLien` 11, `app:ouvrirJournaux` 12, `diagnostic:copierRapport` 13, `parametres:lire` 14, `parametres:modifier` 15, `secret:enregistrer` 16, `secret:existe` 17, `fichiers:choisir` 18, `fenetre:action` 19, `maj:etat` 20, `maj:verifier` 21, `maj:telecharger` 22, `maj:installer` 23, `maj:ignorer` 24, `traduction:langues` 25, `traduction:reglages` 26, `traduction:modifierReglages` 27, `traduction:choisirDossierSortie` 28, `traduction:explorer` 29, `traduction:analyser` 30, `traduction:lancer` 31, `traduction:annuler` 32, `traduction:apercu` 33, `traduction:montrer` 34, `moteurs:etat` 35, `moteurs:enregistrerCleDeepl` 36, `moteurs:supprimerCleDeepl` 37, `moteurs:testerDeepl` 38, `moteurs:modelesOllama` 39, `moteurs:testerOllama` 40, `moteurs:mesurerOllama` 41, `moteurs:prechauffer` 42, `moteurs:annulerMesure` 43, `memoire:etat` 44, `memoire:vider` 45, `contexte:etat` 46, `contexte:enregistrer` 47, `contexte:tester` 48, `contexte:pour` 49, `contexte:chercher` 50, `contexte:choisir` 51, `expressions:lister` 52, `expressions:enregistrer` 53, `expressions:supprimer` 54, `expressions:regler` 55, `expressions:tester` 56, `glossaire:lister` 57, `glossaire:enregistrer` 58, `glossaire:supprimer` 59, `glossaire:importer` 60, `enligne:etat` 61, `enligne:enregistrer` 62, `enligne:tester` 63, `enligne:chercher` 64, `enligne:telecharger` 65, `enligne:automatique` 66
- IPC : événements autorisés : `maj:changement` 70, `traduction:progression` 70, `moteurs:mesure` 70
- API exposée à l'interface : `forge.infos → app:infos` 85, `forge.ouvrirLien → app:ouvrirLien` 86, `forge.ouvrirJournaux → app:ouvrirJournaux` 87, `forge.copierRapport → diagnostic:copierRapport` 88, `forge.parametres.lire → parametres:lire` 90, `forge.parametres.modifier → parametres:modifier` 91, `forge.secrets.enregistrer → secret:enregistrer` 94, `forge.secrets.existe → secret:existe` 95, `forge.fichiers.choisir → fichiers:choisir` 98, `forge.fichiers.cheminDe` 100, `forge.fenetre → fenetre:action` 102, `forge.traduction.langues → traduction:langues` 104, `forge.traduction.reglages → traduction:reglages` 105, `forge.traduction.modifierReglages → traduction:modifierReglages` 106, `forge.traduction.choisirDossierSortie → traduction:choisirDossierSortie` 107, `forge.traduction.explorer → traduction:explorer` 108, `forge.traduction.analyser → traduction:analyser` 109, `forge.traduction.lancer → traduction:lancer` 110, `forge.traduction.annuler → traduction:annuler` 111, `forge.traduction.apercu → traduction:apercu` 112, `forge.traduction.montrer → traduction:montrer` 113, `forge.traduction.surProgression → traduction:progression` 114, `forge.memoire.etat → memoire:etat` 117, `forge.memoire.vider → memoire:vider` 118, `forge.contexte.etat → contexte:etat` 121, `forge.contexte.enregistrer → contexte:enregistrer` 122, `forge.contexte.tester → contexte:tester` 123, `forge.contexte.pour → contexte:pour` 124, `forge.contexte.chercher → contexte:chercher` 125, `forge.contexte.choisir → contexte:choisir` 126, `forge.expressions.lister → expressions:lister` 129, `forge.expressions.enregistrer → expressions:enregistrer` 130, `forge.expressions.supprimer → expressions:supprimer` 131, `forge.expressions.regler → expressions:regler` 132, `forge.expressions.tester → expressions:tester` 133, `forge.glossaire.lister → glossaire:lister` 136, `forge.glossaire.enregistrer → glossaire:enregistrer` 137, `forge.glossaire.supprimer → glossaire:supprimer` 138, `forge.glossaire.importer → glossaire:importer` 139, `forge.enLigne.etat → enligne:etat` 142, `forge.enLigne.enregistrer → enligne:enregistrer` 143, `forge.enLigne.tester → enligne:tester` 144, `forge.enLigne.chercher → enligne:chercher` 145, `forge.enLigne.telecharger → enligne:telecharger` 146, `forge.enLigne.automatique → enligne:automatique` 147, `forge.moteurs.etat → moteurs:etat` 150, `forge.moteurs.enregistrerCleDeepl → moteurs:enregistrerCleDeepl` 151, `forge.moteurs.supprimerCleDeepl → moteurs:supprimerCleDeepl` 152, `forge.moteurs.testerDeepl → moteurs:testerDeepl` 153, `forge.moteurs.modelesOllama → moteurs:modelesOllama` 154, `forge.moteurs.testerOllama → moteurs:testerOllama` 155, `forge.moteurs.mesurerOllama → moteurs:mesurerOllama` 156, `forge.moteurs.prechauffer → moteurs:prechauffer` 157, `forge.moteurs.annulerMesure → moteurs:annulerMesure` 158, `forge.moteurs.surMesure → moteurs:mesure` 159, `forge.majs.etat → maj:etat` 162, `forge.majs.verifier → maj:verifier` 163, `forge.majs.telecharger → maj:telecharger` 164, `forge.majs.installer → maj:installer` 165, `forge.majs.ignorer → maj:ignorer` 166, `forge.majs.surChangement → maj:changement` 167
- fonctions : `ecouter(evenement, rappel)` 72, `relais(_event, donnees)` 74, `appeler(canal, ...args)` 79
- paquets : `electron`

### src/main/securite.js — processus principal · 185 l.
- classes : `ErreurSecurite` 7, `LimitesDecompression` 48
- fonctions : `cheminSousDossier(base, relatif)` 18, `verifierEntreeArchive(dossierDestination, entree)` 39, `validerArguments(schema, args)` 79, `validerValeur(regle, valeur, nom)` 87, `urlExterneAutorisee(url)` 132, `argumentsCommande(args)` 144, `masquerSecrets(texte, secretsConnus = [])` 163
- méthodes : `constructor(message)` 8, `constructor({ tailleMax = 20 * 1024 ** 3, fichiersMax = 200000, ratio…)` 49, `ajouter({ tailleDecompressee, tailleCompressee })` 58
- exporte : `ErreurSecurite` 176, `cheminSousDossier` 176, `verifierEntreeArchive` 176, `LimitesDecompression` 176, `validerArguments` 176, `urlExterneAutorisee` 176, `argumentsCommande` 176, `masquerSecrets` 176
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

### src/main/services/limite.js — processus principal · 43 l.
- fonctions : `creerLimite(n)` 5, `enParallele(elements, n, f)` 30, `ouvrier()` 33
- méthodes : `prendre(tache)` 11
- exporte : `creerLimite` 43, `enParallele` 43

### src/main/services/memoire.js — processus principal · 168 l.
- fonctions : `creerMemoire({ fichier, journal = console })` 13, `cle({ moteur, variante = '', source = 'auto', cible }, segment)` 18, `analyser(texte, etat = { map: new Map()` 24, `installer(etat)` 46, `charger()` 54, `precharger()` 72, `compacter()` 96, `chercher(contexte, segments)` 110, `ajouter(contexte, paires)` 123, `etat()` 151, `vider()` 159
- exporte : `creerMemoire` 168, `MAX_ENTREES` 168
- paquets : `crypto`, `fs`, `path`

### src/main/services/moteurs.js — processus principal · 506 l.
- classes : `ErreurMoteur` 9
- fonctions : `pause(ms, signal)` 18, `jetons(t)` 27, `erreurAnnulation()` 33, `signalAvecDelai(signal, ms)` 35, `lireJson(reponse)` 40, `normaliser(t)` 52, `nombreMots(t)` 53, `nonTraduit(original, traduction)` 54, `formesAdresse(cible)` 64, `consigneRegistre(registre, cible)` 66, `texteAides(aides, vers)` 76, `mauvaiseEcriture(original, traduction, cible)` 85, `versXml(texte)` 89, `echapper(t)` 98, `depuisXml(t)` 99, `adresseOllamaValide(url)` 104, `normaliserAdresse(url)` 115, `creerMoteurs({ fetch, lireCleDeepl, urlDeeplTest = null, journal = con…)` 121, `baseDeepl(cle)` 123, `appelDeepl(chemin, { methode = 'GET', corps = null, signal } = {})` 128, `usageDeepl()` 165, `traduireDeepl(segments, { source, cible, formalite = 'defaut', registre…)` 174, `appelOllama(adresse, chemin, { corps = null, signal, delai = 15000 }…)` 209, `modelesOllama(adresse)` 235, `consigne(source, cible, registre = 'auto', contexteFilm = '')` 244, `demande(segments, contexte, cible, aides = [])` 261, `extraireObjet(contenu)` 273, `lotOllama(segments, { adresse, modele, source, cible, registre, con…)` 285, `traduireOllama(segments, { adresse, modele, source, cible, registre, con…)` 316, `traiter(indices, taille, essai = 0)` 321, `demander()` 328, `promptRelecture(lignes, { source, cible, registre = 'auto', contexteFilm…)` 366, `relireScene(lignes, { adresse, modele, source, cible, registre = 'aut…)` 382, `numero(v)` 398, `texteCourt(v, max)` 399, `tailleContexte({ lots = [], aidesLots = [], scenes = [], options = {} })` 411, `noterCharge(adresse, modele, numCtx, garderCharge)` 431, `prechauffer({ adresse, modele, garderCharge = true })` 435, `decharger({ sauf = null } = {})` 445, `modeleCharge()` 457, `traduireTout(segments, options, surAvancement = ()` 461
- méthodes : `constructor(message, { definitive = true } = {})` 10
- exporte : `CTX_STANDARD` 506, `CTX_GRAND` 506, `jetons` 506, `creerMoteurs` 506, `ErreurMoteur` 506, `adresseOllamaValide` 506, `normaliserAdresse` 506, `versXml` 506, `depuisXml` 506, `nonTraduit` 506, `nombreMots` 506, `formesAdresse` 506
- importe : `./langues`, `./limite`

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

### src/main/services/pipeline.js — processus principal · 316 l.
- fonctions : `erreurAnnulation()` 16, `verifierTraduit(originaux, traductions, options)` 22, `traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null…)` 38, `traductionSegment(i)` 98, `marquerPret(u)` 129, `scenes(doc, positions, preparations)` 204, `marqueursDe(t)` 222, `correctionValable(original, actuelle, correction, valeurs)` 226, `demarrerRelecture({ liste, segments, textes, indexUnique, traductionSegment…)` 235, `surAnnulation()` 249, `lancer(k)` 254
- méthodes : `segmentPret(i)` 275, `lancerPretes()` 281, `abandonner()` 282, `terminer({ traductions, valeursGlossaire, notes })` 287
- exporte : `traduireDocument` 316, `scenes` 316, `correctionValable` 316
- importe : `./formats`, `./glossaire`, `./langues`, `./moteurs`, `./expressions`, `./limite`

### src/main/services/synchro.js — processus principal · 196 l.
- fonctions : `pause()` 21, `analyserSon(binaire, film, { signal, surAvancement = ()` 24, `parole(energies)` 67, `signalSousTitres(minutages, vitesse, longueur)` 79, `fft(re, im, inverse = false)` 95, `norme(s)` 126, `trouverDecalage(energies, minutages, { signal } = {})` 130, `valeur(lag)` 160, `transformation({ vitesse, decalageMs })` 187, `libelleVitesse(v)` 190
- exporte : `analyserSon` 196, `parole` 196, `trouverDecalage` 196, `transformation` 196, `libelleVitesse` 196, `fft` 196, `TRAME_MS` 196, `REPLIQUES_MIN` 196
- importe : `./video`

### src/main/services/traduction.js — processus principal · 812 l.
- IPC : canaux traités : `traduction:langues` 398, `traduction:reglages` 400, `traduction:modifierReglages` 402, `traduction:choisirDossierSortie` 449, `traduction:explorer` 457, `traduction:analyser` 465, `traduction:lancer` 474, `traduction:annuler` 517, `traduction:apercu` 524, `traduction:montrer` 527, `memoire:etat` 534, `memoire:vider` 535, `expressions:lister` 543, `expressions:enregistrer` 544, `expressions:supprimer` 555, `expressions:regler` 556, `expressions:tester` 564, `glossaire:lister` 571, `glossaire:enregistrer` 572, `glossaire:supprimer` 582, `glossaire:importer` 583, `contexte:etat` 599, `contexte:enregistrer` 600, `contexte:tester` 606, `contexte:pour` 611, `contexte:chercher` 618, `contexte:choisir` 619, `enligne:etat` 628, `enligne:enregistrer` 635, `enligne:tester` 658, `enligne:chercher` 664, `enligne:telecharger` 686, `enligne:automatique` 703, `moteurs:etat` 717, `moteurs:enregistrerCleDeepl` 719, `moteurs:supprimerCleDeepl` 730, `moteurs:testerDeepl` 732, `moteurs:modelesOllama` 734, `moteurs:testerOllama` 736, `moteurs:prechauffer` 745, `moteurs:mesurerOllama` 763, `moteurs:annulerMesure` 790
- fonctions : `reglages()` 48, `envoyer(evenement)` 58, `langueDuNom(chemin)` 65, `sourceOuAnglais()` 71, `analyserUn(chemin)` 76, `traduireElement(el, options, signal)` 109, `rapporter(etat, extra = {})` 110, `relaisAnnulation()` 115, `publier()` 167, `calculerSynchro(minutages, film, signal, surPct)` 301, `integrerAuFilm(film, sousTitre, options, signal, surAvancement)` 326, `libre(()` 331, `go(n)` 333, `enregistrer({ racineApp })` 353, `resumeContexte(c)` 608, `videoExistante(chemin)` 660, `ecrireTelecharge(film, contenu, ext, l)` 672, `etape(texte)` 769, `fermer()` 808
- exporte : `enregistrer` 812, `fermer` 812
- importe : `../ipc`, `../securite`, `../parametres`, `../journal`, `./formats`, `./video`, `./langues`, `./moteurs`, `./memoire`, `./glossaire`, `./expressions`, `./pipeline`, `./dossiers`, `./pgs`, `./ocr`, `./synchro`, `./limite`, `./contexte`, `./enligne`
- paquets : `electron`, `fs`, `os`, `path`

### src/main/services/video.js — processus principal · 184 l.
- fonctions : `cheminFfmpeg({ empaquete, resourcesPath, racineApp })` 21, `estVideo(chemin)` 27, `executer(binaire, args, { delai = 60000, signal, sortieMax = 4 * 1…)` 31, `terminer(fonction)` 42, `surAnnulation()` 43, `analyserFlux(texteFfmpeg)` 60, `listerPistes(binaire, chemin, { signal } = {})` 92, `estPgs(piste)` 103, `extrairePiste(binaire, chemin, piste, { signal } = {})` 105, `lireDuree(texteFfmpeg)` 127, `integrerPiste(binaire, film, sousTitre, { sortie, langueIso3 = 'und', t…)` 135, `toutArreter()` 179
- exporte : `integrerPiste` 184, `lireDuree` 184, `estPgs` 184, `EXTENSIONS_VIDEO` 184, `cheminFfmpeg` 184, `estVideo` 184, `analyserFlux` 184, `listerPistes` 184, `extrairePiste` 184, `toutArreter` 184, `executer` 184
- importe : `../securite`, `./langues`
- paquets : `child_process`, `fs`, `os`, `path`

### src/renderer/index.html — interface · 493 l.
- écrans / sections : `traduire` 24, `glossaire` 25, `expressions` 26, `moteurs` 27, `parametres` 29, `a-propos` 30, `ecran-traduire` 35, `ecran-glossaire` 126, `ecran-expressions` 166, `ecran-moteurs` 228, `ecran-parametres` 369, `ecran-a-propos` 409
- scripts : `js/ui.js`, `js/app.js`, `js/traduire.js`, `js/moteurs.js`, `js/glossaire.js`, `js/expressions.js`, `js/contexte.js`, `js/enligne.js`, `js/maj.js`
- styles : `styles/theme.css`, `styles/app.css`

### src/renderer/js/app.js — interface · 59 l.
- API Electron utilisée : `forge.fenetre` 8, `forge.parametres.lire` 13, `forge.parametres.modifier` 28, `forge.ouvrirJournaux` 39, `forge.copierRapport` 42, `forge.infos` 48
- fonctions : `enregistrer(partiel)` 26

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

### src/renderer/js/moteurs.js — interface · 188 l.
- API Electron utilisée : `forge.ouvrirLien` 66, `forge.ouvrirLien` 129, `forge.memoire.etat` 158, `forge.memoire.vider` 178
- fonctions : `nombre(n)` 11, `rafraichir()` 13, `afficherQuota(u)` 29, `chargerModeles({ silencieux = false } = {})` 70, `basculerSiUtile()` 100, `s(ms)` 142, `majMemoire()` 156

### src/renderer/js/traduire.js — interface · 576 l.
- API Electron utilisée : `forge.moteurs.etat` 82, `forge.moteurs.prechauffer` 179, `forge.contexte.pour` 192, `forge.fichiers.cheminDe` 230, `forge.fichiers.choisir` 236, `forge.fichiers.choisir` 241, `forge.enLigne.etat` 430, `forge.enLigne.automatique` 455
- fonctions : `appliquerReglages(r)` 34, `modifier(o)` 52, `majRegistre()` 64, `majAvertissement()` 77, `choisirPiste(pistes)` 102, `parmi(l)` 105, `appliquerInfo(e, info)` 109, `ajouter(chemins)` 127, `prechaufferModele()` 177, `chargerContexte(e)` 188, `ligneContexte(e)` 199, `changer(libelle)` 202, `description(e)` 254, `libellePiste(p)` 266, `dessiner(e)` 275, `sec(ms)` 332, `aRetraduire(e)` 391, `chercherEnLigne(e)` 396, `majFile()` 408, `afficherApercu(e)` 538

### src/renderer/js/ui.js — interface · 43 l.
- fonctions : `el(tag, attributs = {}, enfants = [])` 6, `notifier(message, type = 'info', duree = 4000)` 18, `erreur(e)` 25, `appliquerTheme(theme, accent)` 30, `afficherEcran(nom)` 37

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

### tests/e2e/outils.js — tests · 90 l.
- fonctions : `fauxOllama()` 12, `lignesDemandees(contenu)` 68, `ffmpeg()` 74, `utiliserFauxOllama(p, serveur)` 79
- exporte : `fauxOllama` 90, `ffmpeg` 90, `utiliserFauxOllama` 90, `lignesDemandees` 90, `RACINE` 90
- paquets : `http`, `path`

### tests/e2e/saison.js — tests · 58 l.
- fonctions : `film(chemin, srt)` 13
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/traduction.js — tests · 127 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

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

### tests/e2e/v17.js — tests · 59 l.
- importe : `./outils`
- paquets : `fs`, `path`

### tests/enligne.test.js — tests · 203 l.
- fonctions : `serveur(options = {})` 16, `json(code, o)` 25, `film(nom, taille = 300000)` 63, `ecrire(cheminFilm, contenu, ext, langue)` 70, `attendu(()` 86, `r(o)` 169
- importe : `../src/main/services/enligne`
- paquets : `node:test`, `node:assert/strict`, `http`, `fs`, `os`, `path`, `crypto`

### tests/expressions.test.js — tests · 143 l.
- fonctions : `nouveau()` 20, `textes(t, p)` 24, `serveur(gerer)` 89, `json(res, code, o)` 99
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

### tests/ia-locale-memoire.test.js — tests · 96 l.
- importe : `../src/main/services/memoire`, `../src/main/services/moteurs`, `../src/main/services/pipeline`, `../src/main/services/formats`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/moteurs.test.js — tests · 141 l.
- fonctions : `serveur(gestion)` 10, `json(res, code, o, entetes = {})` 20
- importe : `../src/main/services/moteurs`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `http`

### tests/ocr.test.js — tests · 114 l.
- fonctions : `rectangle(l, h)` 18, `mots(t)` 80
- importe : `../src/main/services/pgs`, `../src/main/services/ocr`, `./outils/pgs-encodeur`
- paquets : `node:test`, `node:assert/strict`, `fs`, `path`

### tests/outils/pgs-encodeur.js — tests · 80 l.
- fonctions : `segment(type, pts, donnees)` 5, `rle(indices, largeur, hauteur)` 15, `quantifier(rgba, largeur, hauteur)` 37, `encoderSup(repliques, { video = [1920, 1080] } = {})` 49
- exporte : `encoderSup` 80, `rle` 80

### tests/parallele.test.js — tests · 138 l.
- fonctions : `attendre(ms)` 14, `ollamaLent()` 29, `srt(n, ecartMs = 1000)` 78
- méthodes : `traduireTout(segments, o)` 85, `relire(lignes)` 96, `traduireTout(segments, o)` 112
- importe : `../src/main/services/limite`, `../src/main/services/moteurs`, `../src/main/services/pipeline`, `../src/main/services/formats`, `./e2e/outils`
- paquets : `node:test`, `node:assert/strict`, `http`

### tests/relecture.test.js — tests · 159 l.
- fonctions : `srt(repliques)` 17, `serveur(gerer)` 71, `json(res, o)` 81
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

### tests/video.test.js — tests · 146 l.
- importe : `../src/main/services/video`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `x.mkv`
