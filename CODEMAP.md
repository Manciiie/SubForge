# CODEMAP — SubForge

> Généré par `codemap.py` v3 : **ne pas modifier à la main**. Régénérer après chaque modification du code.
> Format : `nom` suivi du numéro de ligne → lire seulement les lignes utiles (Read avec offset).

**73 fichiers · 10337 lignes** · 72 js · 1 html

## Liens entre fichiers

- IPC `app:infos` : traité `src/main/ipc.js:45`, autorisé `src/main/preload.js:10`
- IPC `app:ouvrirJournaux` : traité `src/main/ipc.js:80`, autorisé `src/main/preload.js:12`
- IPC `app:ouvrirLien` : traité `src/main/ipc.js:75`, autorisé `src/main/preload.js:11`
- IPC `diagnostic:copierRapport` : traité `src/main/ipc.js:83`, autorisé `src/main/preload.js:13`
- IPC `enligne:automatique` : traité `src/main/services/traduction.js:591`, autorisé `src/main/preload.js:57`
- IPC `enligne:chercher` : traité `src/main/services/traduction.js:552`, autorisé `src/main/preload.js:55`
- IPC `enligne:enregistrer` : traité `src/main/services/traduction.js:523`, autorisé `src/main/preload.js:53`
- IPC `enligne:etat` : traité `src/main/services/traduction.js:516`, autorisé `src/main/preload.js:52`
- IPC `enligne:telecharger` : traité `src/main/services/traduction.js:574`, autorisé `src/main/preload.js:56`
- IPC `enligne:tester` : traité `src/main/services/traduction.js:546`, autorisé `src/main/preload.js:54`
- IPC `expressions:enregistrer` : traité `src/main/services/traduction.js:461`, autorisé `src/main/preload.js:44`
- IPC `expressions:lister` : traité `src/main/services/traduction.js:460`, autorisé `src/main/preload.js:43`
- IPC `expressions:regler` : traité `src/main/services/traduction.js:473`, autorisé `src/main/preload.js:46`
- IPC `expressions:supprimer` : traité `src/main/services/traduction.js:472`, autorisé `src/main/preload.js:45`
- IPC `expressions:tester` : traité `src/main/services/traduction.js:481`, autorisé `src/main/preload.js:47`
- IPC `fenetre:action` : traité `src/main/ipc.js:121`, autorisé `src/main/preload.js:19`
- IPC `fichiers:choisir` : traité `src/main/ipc.js:103`, autorisé `src/main/preload.js:18`
- IPC `glossaire:enregistrer` : traité `src/main/services/traduction.js:489`, autorisé `src/main/preload.js:49`
- IPC `glossaire:importer` : traité `src/main/services/traduction.js:500`, autorisé `src/main/preload.js:51`
- IPC `glossaire:lister` : traité `src/main/services/traduction.js:488`, autorisé `src/main/preload.js:48`
- IPC `glossaire:supprimer` : traité `src/main/services/traduction.js:499`, autorisé `src/main/preload.js:50`
- IPC `maj:etat` : traité `src/main/mises-a-jour.js:134`, autorisé `src/main/preload.js:20`
- IPC `maj:ignorer` : traité `src/main/mises-a-jour.js:153`, autorisé `src/main/preload.js:24`
- IPC `maj:installer` : traité `src/main/mises-a-jour.js:145`, autorisé `src/main/preload.js:23`
- IPC `maj:telecharger` : traité `src/main/mises-a-jour.js:138`, autorisé `src/main/preload.js:22`
- IPC `maj:verifier` : traité `src/main/mises-a-jour.js:136`, autorisé `src/main/preload.js:21`
- IPC `memoire:etat` : traité `src/main/services/traduction.js:451`, autorisé `src/main/preload.js:41`
- IPC `memoire:vider` : traité `src/main/services/traduction.js:452`, autorisé `src/main/preload.js:42`
- IPC `moteurs:enregistrerCleDeepl` : traité `src/main/services/traduction.js:607`, autorisé `src/main/preload.js:36`
- IPC `moteurs:etat` : traité `src/main/services/traduction.js:605`, autorisé `src/main/preload.js:35`
- IPC `moteurs:modelesOllama` : traité `src/main/services/traduction.js:622`, autorisé `src/main/preload.js:39`
- IPC `moteurs:supprimerCleDeepl` : traité `src/main/services/traduction.js:618`, autorisé `src/main/preload.js:37`
- IPC `moteurs:testerDeepl` : traité `src/main/services/traduction.js:620`, autorisé `src/main/preload.js:38`
- IPC `moteurs:testerOllama` : traité `src/main/services/traduction.js:624`, autorisé `src/main/preload.js:40`
- IPC `parametres:lire` : traité `src/main/ipc.js:53`, autorisé `src/main/preload.js:14`
- IPC `parametres:modifier` : traité `src/main/ipc.js:55`, autorisé `src/main/preload.js:15`
- IPC `secret:enregistrer` : traité `src/main/ipc.js:70`, autorisé `src/main/preload.js:16`
- IPC `secret:existe` : traité `src/main/ipc.js:73`, autorisé `src/main/preload.js:17`
- IPC `traduction:analyser` : traité `src/main/services/traduction.js:385`, autorisé `src/main/preload.js:30`
- IPC `traduction:annuler` : traité `src/main/services/traduction.js:434`, autorisé `src/main/preload.js:32`
- IPC `traduction:apercu` : traité `src/main/services/traduction.js:441`, autorisé `src/main/preload.js:33`
- IPC `traduction:choisirDossierSortie` : traité `src/main/services/traduction.js:369`, autorisé `src/main/preload.js:28`
- IPC `traduction:explorer` : traité `src/main/services/traduction.js:377`, autorisé `src/main/preload.js:29`
- IPC `traduction:lancer` : traité `src/main/services/traduction.js:394`, autorisé `src/main/preload.js:31`
- IPC `traduction:langues` : traité `src/main/services/traduction.js:328`, autorisé `src/main/preload.js:25`
- IPC `traduction:modifierReglages` : traité `src/main/services/traduction.js:332`, autorisé `src/main/preload.js:27`
- IPC `traduction:montrer` : traité `src/main/services/traduction.js:444`, autorisé `src/main/preload.js:34`
- IPC `traduction:reglages` : traité `src/main/services/traduction.js:330`, autorisé `src/main/preload.js:26`

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

### src/main/main.js — processus principal · 153 l.
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

### src/main/preload.js — preload · 148 l.
- IPC : canaux appelés : `app:infos` 76, `app:ouvrirLien` 77, `app:ouvrirJournaux` 78, `diagnostic:copierRapport` 79, `parametres:lire` 81, `parametres:modifier` 82, `secret:enregistrer` 85, `secret:existe` 86, `fichiers:choisir` 89, `fenetre:action` 93, `traduction:langues` 95, `traduction:reglages` 96, `traduction:modifierReglages` 97, `traduction:choisirDossierSortie` 98, `traduction:explorer` 99, `traduction:analyser` 100, `traduction:lancer` 101, `traduction:annuler` 102, `traduction:apercu` 103, `traduction:montrer` 104, `memoire:etat` 108, `memoire:vider` 109, `expressions:lister` 112, `expressions:enregistrer` 113, `expressions:supprimer` 114, `expressions:regler` 115, `expressions:tester` 116, `glossaire:lister` 119, `glossaire:enregistrer` 120, `glossaire:supprimer` 121, `glossaire:importer` 122, `enligne:etat` 125, `enligne:enregistrer` 126, `enligne:tester` 127, `enligne:chercher` 128, `enligne:telecharger` 129, `enligne:automatique` 130, `moteurs:etat` 133, `moteurs:enregistrerCleDeepl` 134, `moteurs:supprimerCleDeepl` 135, `moteurs:testerDeepl` 136, `moteurs:modelesOllama` 137, `moteurs:testerOllama` 138, `maj:etat` 141, `maj:verifier` 142, `maj:telecharger` 143, `maj:installer` 144, `maj:ignorer` 145
- IPC : liste blanche : `app:infos` 10, `app:ouvrirLien` 11, `app:ouvrirJournaux` 12, `diagnostic:copierRapport` 13, `parametres:lire` 14, `parametres:modifier` 15, `secret:enregistrer` 16, `secret:existe` 17, `fichiers:choisir` 18, `fenetre:action` 19, `maj:etat` 20, `maj:verifier` 21, `maj:telecharger` 22, `maj:installer` 23, `maj:ignorer` 24, `traduction:langues` 25, `traduction:reglages` 26, `traduction:modifierReglages` 27, `traduction:choisirDossierSortie` 28, `traduction:explorer` 29, `traduction:analyser` 30, `traduction:lancer` 31, `traduction:annuler` 32, `traduction:apercu` 33, `traduction:montrer` 34, `moteurs:etat` 35, `moteurs:enregistrerCleDeepl` 36, `moteurs:supprimerCleDeepl` 37, `moteurs:testerDeepl` 38, `moteurs:modelesOllama` 39, `moteurs:testerOllama` 40, `memoire:etat` 41, `memoire:vider` 42, `expressions:lister` 43, `expressions:enregistrer` 44, `expressions:supprimer` 45, `expressions:regler` 46, `expressions:tester` 47, `glossaire:lister` 48, `glossaire:enregistrer` 49, `glossaire:supprimer` 50, `glossaire:importer` 51, `enligne:etat` 52, `enligne:enregistrer` 53, `enligne:tester` 54, `enligne:chercher` 55, `enligne:telecharger` 56, `enligne:automatique` 57
- IPC : événements autorisés : `maj:changement` 61, `traduction:progression` 61
- API exposée à l'interface : `forge.infos → app:infos` 76, `forge.ouvrirLien → app:ouvrirLien` 77, `forge.ouvrirJournaux → app:ouvrirJournaux` 78, `forge.copierRapport → diagnostic:copierRapport` 79, `forge.parametres.lire → parametres:lire` 81, `forge.parametres.modifier → parametres:modifier` 82, `forge.secrets.enregistrer → secret:enregistrer` 85, `forge.secrets.existe → secret:existe` 86, `forge.fichiers.choisir → fichiers:choisir` 89, `forge.fichiers.cheminDe` 91, `forge.fenetre → fenetre:action` 93, `forge.traduction.langues → traduction:langues` 95, `forge.traduction.reglages → traduction:reglages` 96, `forge.traduction.modifierReglages → traduction:modifierReglages` 97, `forge.traduction.choisirDossierSortie → traduction:choisirDossierSortie` 98, `forge.traduction.explorer → traduction:explorer` 99, `forge.traduction.analyser → traduction:analyser` 100, `forge.traduction.lancer → traduction:lancer` 101, `forge.traduction.annuler → traduction:annuler` 102, `forge.traduction.apercu → traduction:apercu` 103, `forge.traduction.montrer → traduction:montrer` 104, `forge.traduction.surProgression → traduction:progression` 105, `forge.memoire.etat → memoire:etat` 108, `forge.memoire.vider → memoire:vider` 109, `forge.expressions.lister → expressions:lister` 112, `forge.expressions.enregistrer → expressions:enregistrer` 113, `forge.expressions.supprimer → expressions:supprimer` 114, `forge.expressions.regler → expressions:regler` 115, `forge.expressions.tester → expressions:tester` 116, `forge.glossaire.lister → glossaire:lister` 119, `forge.glossaire.enregistrer → glossaire:enregistrer` 120, `forge.glossaire.supprimer → glossaire:supprimer` 121, `forge.glossaire.importer → glossaire:importer` 122, `forge.enLigne.etat → enligne:etat` 125, `forge.enLigne.enregistrer → enligne:enregistrer` 126, `forge.enLigne.tester → enligne:tester` 127, `forge.enLigne.chercher → enligne:chercher` 128, `forge.enLigne.telecharger → enligne:telecharger` 129, `forge.enLigne.automatique → enligne:automatique` 130, `forge.moteurs.etat → moteurs:etat` 133, `forge.moteurs.enregistrerCleDeepl → moteurs:enregistrerCleDeepl` 134, `forge.moteurs.supprimerCleDeepl → moteurs:supprimerCleDeepl` 135, `forge.moteurs.testerDeepl → moteurs:testerDeepl` 136, `forge.moteurs.modelesOllama → moteurs:modelesOllama` 137, `forge.moteurs.testerOllama → moteurs:testerOllama` 138, `forge.majs.etat → maj:etat` 141, `forge.majs.verifier → maj:verifier` 142, `forge.majs.telecharger → maj:telecharger` 143, `forge.majs.installer → maj:installer` 144, `forge.majs.ignorer → maj:ignorer` 145, `forge.majs.surChangement → maj:changement` 146
- fonctions : `ecouter(evenement, rappel)` 63, `relais(_event, donnees)` 65, `appeler(canal, ...args)` 70
- paquets : `electron`

### src/main/securite.js — processus principal · 185 l.
- classes : `ErreurSecurite` 7, `LimitesDecompression` 48
- fonctions : `cheminSousDossier(base, relatif)` 18, `verifierEntreeArchive(dossierDestination, entree)` 39, `validerArguments(schema, args)` 79, `validerValeur(regle, valeur, nom)` 87, `urlExterneAutorisee(url)` 132, `argumentsCommande(args)` 144, `masquerSecrets(texte, secretsConnus = [])` 163
- méthodes : `constructor(message)` 8, `constructor({ tailleMax = 20 * 1024 ** 3, fichiersMax = 200000, ratio…)` 49, `ajouter({ tailleDecompressee, tailleCompressee })` 58
- exporte : `ErreurSecurite` 176, `cheminSousDossier` 176, `verifierEntreeArchive` 176, `LimitesDecompression` 176, `validerArguments` 176, `urlExterneAutorisee` 176, `argumentsCommande` 176, `masquerSecrets` 176
- paquets : `path`

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

### src/main/services/memoire.js — processus principal · 123 l.
- fonctions : `creerMemoire({ fichier, journal = console })` 13, `cle({ moteur, variante = '', source = 'auto', cible }, segment)` 18, `charger()` 22, `compacter()` 51, `chercher(contexte, segments)` 65, `ajouter(contexte, paires)` 78, `etat()` 105, `vider()` 114
- exporte : `creerMemoire` 123, `MAX_ENTREES` 123
- paquets : `crypto`, `fs`, `path`

### src/main/services/moteurs.js — processus principal · 419 l.
- classes : `ErreurMoteur` 8
- fonctions : `pause(ms, signal)` 17, `erreurAnnulation()` 21, `signalAvecDelai(signal, ms)` 23, `lireJson(reponse)` 28, `normaliser(t)` 40, `nombreMots(t)` 41, `nonTraduit(original, traduction)` 42, `formesAdresse(cible)` 52, `consigneRegistre(registre, cible)` 54, `texteAides(aides, vers)` 64, `mauvaiseEcriture(original, traduction, cible)` 73, `versXml(texte)` 77, `echapper(t)` 86, `depuisXml(t)` 87, `adresseOllamaValide(url)` 92, `normaliserAdresse(url)` 103, `creerMoteurs({ fetch, lireCleDeepl, urlDeeplTest = null, journal = con…)` 109, `baseDeepl(cle)` 111, `appelDeepl(chemin, { methode = 'GET', corps = null, signal } = {})` 116, `usageDeepl()` 153, `traduireDeepl(segments, { source, cible, formalite = 'defaut', registre…)` 162, `appelOllama(adresse, chemin, { corps = null, signal, delai = 15000 }…)` 194, `modelesOllama(adresse)` 220, `consigne(source, cible, registre = 'auto')` 229, `demande(segments, contexte, cible, aides = [])` 245, `extraireObjet(contenu)` 257, `lotOllama(segments, { adresse, modele, source, cible, registre, con…)` 269, `traduireOllama(segments, { adresse, modele, source, cible, registre, con…)` 299, `traiter(indices, taille, essai = 0)` 304, `relireScene(lignes, { adresse, modele, source, cible, registre = 'aut…)` 348, `numero(v)` 373, `texteCourt(v, max)` 374, `traduireTout(segments, options, surAvancement = ()` 385
- méthodes : `constructor(message, { definitive = true } = {})` 9
- exporte : `creerMoteurs` 419, `ErreurMoteur` 419, `adresseOllamaValide` 419, `normaliserAdresse` 419, `versXml` 419, `depuisXml` 419, `nonTraduit` 419, `nombreMots` 419, `formesAdresse` 419
- importe : `./langues`

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

### src/main/services/pipeline.js — processus principal · 225 l.
- fonctions : `erreurAnnulation()` 15, `verifierTraduit(originaux, traductions, options)` 21, `traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null…)` 37, `scenes(doc, positions, preparations)` 158, `marqueursDe(t)` 176, `correctionValable(original, actuelle, correction, valeurs)` 180, `relireDocument({ doc, segments, positions, preparations, traductions, va…)` 188
- exporte : `traduireDocument` 225, `scenes` 225, `correctionValable` 225
- importe : `./formats`, `./glossaire`, `./langues`, `./moteurs`, `./expressions`

### src/main/services/synchro.js — processus principal · 196 l.
- fonctions : `pause()` 21, `analyserSon(binaire, film, { signal, surAvancement = ()` 24, `parole(energies)` 67, `signalSousTitres(minutages, vitesse, longueur)` 79, `fft(re, im, inverse = false)` 95, `norme(s)` 126, `trouverDecalage(energies, minutages, { signal } = {})` 130, `valeur(lag)` 160, `transformation({ vitesse, decalageMs })` 187, `libelleVitesse(v)` 190
- exporte : `analyserSon` 196, `parole` 196, `trouverDecalage` 196, `transformation` 196, `libelleVitesse` 196, `fft` 196, `TRAME_MS` 196, `REPLIQUES_MIN` 196
- importe : `./video`

### src/main/services/traduction.js — processus principal · 632 l.
- IPC : canaux traités : `traduction:langues` 328, `traduction:reglages` 330, `traduction:modifierReglages` 332, `traduction:choisirDossierSortie` 369, `traduction:explorer` 377, `traduction:analyser` 385, `traduction:lancer` 394, `traduction:annuler` 434, `traduction:apercu` 441, `traduction:montrer` 444, `memoire:etat` 451, `memoire:vider` 452, `expressions:lister` 460, `expressions:enregistrer` 461, `expressions:supprimer` 472, `expressions:regler` 473, `expressions:tester` 481, `glossaire:lister` 488, `glossaire:enregistrer` 489, `glossaire:supprimer` 499, `glossaire:importer` 500, `enligne:etat` 516, `enligne:enregistrer` 523, `enligne:tester` 546, `enligne:chercher` 552, `enligne:telecharger` 574, `enligne:automatique` 591, `moteurs:etat` 605, `moteurs:enregistrerCleDeepl` 607, `moteurs:supprimerCleDeepl` 618, `moteurs:testerDeepl` 620, `moteurs:modelesOllama` 622, `moteurs:testerOllama` 624
- fonctions : `reglages()` 44, `envoyer(evenement)` 54, `langueDuNom(chemin)` 61, `sourceOuAnglais()` 67, `analyserUn(chemin)` 72, `traduireElement(el, options, signal)` 105, `rapporter(etat, extra = {})` 106, `synchroniser(doc, film, signal, rapporter)` 249, `integrerAuFilm(film, sousTitre, options, signal, surAvancement)` 272, `libre(()` 277, `go(n)` 279, `enregistrer({ racineApp })` 299, `videoExistante(chemin)` 548, `ecrireTelecharge(film, contenu, ext, l)` 560
- exporte : `enregistrer` 632
- importe : `../ipc`, `../securite`, `../parametres`, `../journal`, `./formats`, `./video`, `./langues`, `./moteurs`, `./memoire`, `./glossaire`, `./expressions`, `./pipeline`, `./dossiers`, `./pgs`, `./ocr`, `./synchro`, `./enligne`
- paquets : `electron`, `fs`, `os`, `path`

### src/main/services/video.js — processus principal · 184 l.
- fonctions : `cheminFfmpeg({ empaquete, resourcesPath, racineApp })` 21, `estVideo(chemin)` 27, `executer(binaire, args, { delai = 60000, signal, sortieMax = 4 * 1…)` 31, `terminer(fonction)` 42, `surAnnulation()` 43, `analyserFlux(texteFfmpeg)` 60, `listerPistes(binaire, chemin, { signal } = {})` 92, `estPgs(piste)` 103, `extrairePiste(binaire, chemin, piste, { signal } = {})` 105, `lireDuree(texteFfmpeg)` 127, `integrerPiste(binaire, film, sousTitre, { sortie, langueIso3 = 'und', t…)` 135, `toutArreter()` 179
- exporte : `integrerPiste` 184, `lireDuree` 184, `estPgs` 184, `EXTENSIONS_VIDEO` 184, `cheminFfmpeg` 184, `estVideo` 184, `analyserFlux` 184, `listerPistes` 184, `extrairePiste` 184, `toutArreter` 184, `executer` 184
- importe : `../securite`, `./langues`
- paquets : `child_process`, `fs`, `os`, `path`

### src/renderer/index.html — interface · 434 l.
- écrans / sections : `traduire` 24, `glossaire` 25, `expressions` 26, `moteurs` 27, `parametres` 29, `a-propos` 30, `ecran-traduire` 35, `ecran-glossaire` 126, `ecran-expressions` 166, `ecran-moteurs` 228, `ecran-parametres` 329, `ecran-a-propos` 369
- scripts : `js/ui.js`, `js/app.js`, `js/traduire.js`, `js/moteurs.js`, `js/glossaire.js`, `js/expressions.js`, `js/enligne.js`, `js/maj.js`
- styles : `styles/theme.css`, `styles/app.css`

### src/renderer/js/app.js — interface · 59 l.
- API Electron utilisée : `forge.fenetre` 8, `forge.parametres.lire` 13, `forge.parametres.modifier` 28, `forge.ouvrirJournaux` 39, `forge.copierRapport` 42, `forge.infos` 48
- fonctions : `enregistrer(partiel)` 26

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

### src/renderer/js/moteurs.js — interface · 155 l.
- API Electron utilisée : `forge.ouvrirLien` 64, `forge.ouvrirLien` 127, `forge.memoire.etat` 132, `forge.memoire.vider` 145
- fonctions : `nombre(n)` 11, `rafraichir()` 13, `afficherQuota(u)` 27, `chargerModeles({ silencieux = false } = {})` 68, `basculerSiUtile()` 98, `majMemoire()` 130

### src/renderer/js/traduire.js — interface · 515 l.
- API Electron utilisée : `forge.moteurs.etat` 82, `forge.fichiers.cheminDe` 177, `forge.fichiers.choisir` 183, `forge.fichiers.choisir` 188, `forge.enLigne.etat` 371, `forge.enLigne.automatique` 396
- fonctions : `appliquerReglages(r)` 34, `modifier(o)` 52, `majRegistre()` 64, `majAvertissement()` 77, `choisirPiste(pistes)` 102, `parmi(l)` 105, `appliquerInfo(e, info)` 109, `ajouter(chemins)` 127, `description(e)` 201, `libellePiste(p)` 213, `dessiner(e)` 222, `sec(ms)` 273, `aRetraduire(e)` 332, `chercherEnLigne(e)` 337, `majFile()` 349, `afficherApercu(e)` 477

### src/renderer/js/ui.js — interface · 43 l.
- fonctions : `el(tag, attributs = {}, enfants = [])` 6, `notifier(message, type = 'info', duree = 4000)` 18, `erreur(e)` 25, `appliquerTheme(theme, accent)` 30, `afficherEcran(nom)` 37

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

### tests/e2e/glossaire-memoire.js — tests · 85 l.
- importe : `./outils`
- paquets : `fs`, `path`

### tests/e2e/outils.js — tests · 78 l.
- fonctions : `fauxOllama()` 12, `lignesDemandees(contenu)` 56, `ffmpeg()` 62, `utiliserFauxOllama(p, serveur)` 67
- exporte : `fauxOllama` 78, `ffmpeg` 78, `utiliserFauxOllama` 78, `lignesDemandees` 78, `RACINE` 78
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

### tests/relecture.test.js — tests · 137 l.
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

### tests/securite/subforge.test.js — tests · 53 l.
- importe : `../../src/main/journal`, `../../src/main/parametres`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/synchro.test.js — tests · 124 l.
- fonctions : `hasard(graine)` 16, `repliquesVraies(dureeS, graine = 7)` 19, `energiesPour(repliques, dureeS, graine = 3)` 32
- importe : `../src/main/services/synchro`, `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `child_process`

### tests/video.test.js — tests · 146 l.
- importe : `../src/main/services/video`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `x.mkv`
