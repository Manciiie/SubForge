# CODEMAP — SubForge

> Généré par `codemap.py` v3 : **ne pas modifier à la main**. Régénérer après chaque modification du code.
> Format : `nom` suivi du numéro de ligne → lire seulement les lignes utiles (Read avec offset).

**69 fichiers · 9394 lignes** · 68 js · 1 html

## Liens entre fichiers

- IPC `app:infos` : traité `src/main/ipc.js:45`, autorisé `src/main/preload.js:10`
- IPC `app:ouvrirJournaux` : traité `src/main/ipc.js:80`, autorisé `src/main/preload.js:12`
- IPC `app:ouvrirLien` : traité `src/main/ipc.js:75`, autorisé `src/main/preload.js:11`
- IPC `diagnostic:copierRapport` : traité `src/main/ipc.js:83`, autorisé `src/main/preload.js:13`
- IPC `enligne:automatique` : traité `src/main/services/traduction.js:538`, autorisé `src/main/preload.js:57`
- IPC `enligne:chercher` : traité `src/main/services/traduction.js:499`, autorisé `src/main/preload.js:55`
- IPC `enligne:enregistrer` : traité `src/main/services/traduction.js:470`, autorisé `src/main/preload.js:53`
- IPC `enligne:etat` : traité `src/main/services/traduction.js:463`, autorisé `src/main/preload.js:52`
- IPC `enligne:telecharger` : traité `src/main/services/traduction.js:521`, autorisé `src/main/preload.js:56`
- IPC `enligne:tester` : traité `src/main/services/traduction.js:493`, autorisé `src/main/preload.js:54`
- IPC `expressions:enregistrer` : traité `src/main/services/traduction.js:408`, autorisé `src/main/preload.js:44`
- IPC `expressions:lister` : traité `src/main/services/traduction.js:407`, autorisé `src/main/preload.js:43`
- IPC `expressions:regler` : traité `src/main/services/traduction.js:420`, autorisé `src/main/preload.js:46`
- IPC `expressions:supprimer` : traité `src/main/services/traduction.js:419`, autorisé `src/main/preload.js:45`
- IPC `expressions:tester` : traité `src/main/services/traduction.js:428`, autorisé `src/main/preload.js:47`
- IPC `fenetre:action` : traité `src/main/ipc.js:121`, autorisé `src/main/preload.js:19`
- IPC `fichiers:choisir` : traité `src/main/ipc.js:103`, autorisé `src/main/preload.js:18`
- IPC `glossaire:enregistrer` : traité `src/main/services/traduction.js:436`, autorisé `src/main/preload.js:49`
- IPC `glossaire:importer` : traité `src/main/services/traduction.js:447`, autorisé `src/main/preload.js:51`
- IPC `glossaire:lister` : traité `src/main/services/traduction.js:435`, autorisé `src/main/preload.js:48`
- IPC `glossaire:supprimer` : traité `src/main/services/traduction.js:446`, autorisé `src/main/preload.js:50`
- IPC `maj:etat` : traité `src/main/mises-a-jour.js:134`, autorisé `src/main/preload.js:20`
- IPC `maj:ignorer` : traité `src/main/mises-a-jour.js:153`, autorisé `src/main/preload.js:24`
- IPC `maj:installer` : traité `src/main/mises-a-jour.js:145`, autorisé `src/main/preload.js:23`
- IPC `maj:telecharger` : traité `src/main/mises-a-jour.js:138`, autorisé `src/main/preload.js:22`
- IPC `maj:verifier` : traité `src/main/mises-a-jour.js:136`, autorisé `src/main/preload.js:21`
- IPC `memoire:etat` : traité `src/main/services/traduction.js:398`, autorisé `src/main/preload.js:41`
- IPC `memoire:vider` : traité `src/main/services/traduction.js:399`, autorisé `src/main/preload.js:42`
- IPC `moteurs:enregistrerCleDeepl` : traité `src/main/services/traduction.js:554`, autorisé `src/main/preload.js:36`
- IPC `moteurs:etat` : traité `src/main/services/traduction.js:552`, autorisé `src/main/preload.js:35`
- IPC `moteurs:modelesOllama` : traité `src/main/services/traduction.js:569`, autorisé `src/main/preload.js:39`
- IPC `moteurs:supprimerCleDeepl` : traité `src/main/services/traduction.js:565`, autorisé `src/main/preload.js:37`
- IPC `moteurs:testerDeepl` : traité `src/main/services/traduction.js:567`, autorisé `src/main/preload.js:38`
- IPC `moteurs:testerOllama` : traité `src/main/services/traduction.js:571`, autorisé `src/main/preload.js:40`
- IPC `parametres:lire` : traité `src/main/ipc.js:53`, autorisé `src/main/preload.js:14`
- IPC `parametres:modifier` : traité `src/main/ipc.js:55`, autorisé `src/main/preload.js:15`
- IPC `secret:enregistrer` : traité `src/main/ipc.js:70`, autorisé `src/main/preload.js:16`
- IPC `secret:existe` : traité `src/main/ipc.js:73`, autorisé `src/main/preload.js:17`
- IPC `traduction:analyser` : traité `src/main/services/traduction.js:335`, autorisé `src/main/preload.js:30`
- IPC `traduction:annuler` : traité `src/main/services/traduction.js:381`, autorisé `src/main/preload.js:32`
- IPC `traduction:apercu` : traité `src/main/services/traduction.js:388`, autorisé `src/main/preload.js:33`
- IPC `traduction:choisirDossierSortie` : traité `src/main/services/traduction.js:319`, autorisé `src/main/preload.js:28`
- IPC `traduction:explorer` : traité `src/main/services/traduction.js:327`, autorisé `src/main/preload.js:29`
- IPC `traduction:lancer` : traité `src/main/services/traduction.js:344`, autorisé `src/main/preload.js:31`
- IPC `traduction:langues` : traité `src/main/services/traduction.js:281`, autorisé `src/main/preload.js:25`
- IPC `traduction:modifierReglages` : traité `src/main/services/traduction.js:285`, autorisé `src/main/preload.js:27`
- IPC `traduction:montrer` : traité `src/main/services/traduction.js:391`, autorisé `src/main/preload.js:34`
- IPC `traduction:reglages` : traité `src/main/services/traduction.js:283`, autorisé `src/main/preload.js:26`

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

### src/main/services/dossiers.js — processus principal · 134 l.
- fonctions : `triNaturel(a, b)` 17, `parcourir(racine, { profondeurMax = 6, fichiersMax = 1000 } = {})` 19, `visiter(dossier, profondeur)` 22, `decomposer(chemin)` 54, `memeLangue(a, b)` 68, `selectionner(fichiers, { cible, source = 'auto' })` 71, `explorer(chemins, { cible, source, fichiersMax = 1000 })` 108
- exporte : `parcourir` 134, `selectionner` 134, `explorer` 134, `decomposer` 134, `EXT_SOUSTITRES` 134, `EXT_VIDEO` 134, `langue` 134
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

### src/main/services/formats.js — processus principal · 413 l.
- classes : `ErreurFormat` 12
- fonctions : `decoder(buffer)` 18, `formatDepuisChemin(chemin)` 36, `lireFichier(chemin)` 40, `analyser(texte, format)` 52, `analyserSrt(t)` 69, `ecrireSrt(doc)` 96, `analyserVtt(t)` 104, `ecrireVtt(doc)` 124, `analyserAss(t)` 134, `ecrireAss(doc)` 169, `serialiser(doc)` 177, `versSrt(doc)` 187, `balisesSrt(texte)` 206, `tempsSrt(t)` 216, `preparerConversionAss(doc)` 225, `regexBalises(format)` 250, `decouperBalises(texte, format)` 259, `preparerReplique(texteBrut, format)` 273, `restaurerMarqueurs(texte, balises)` 326, `recouper(texte, nbLignes, longueurMax = 46)` 336, `texteVisible(texte)` 365, `nomSortie(cheminSource, codeCible, extension, dossierSortie = null)` 376, `ecrireFichier(chemin, doc)` 394
- méthodes : `constructor(message)` 13
- exporte : `TAILLE_MAX` 409, `EXTENSIONS` 409, `ErreurFormat` 409, `decoder` 409, `formatDepuisChemin` 409, `lireFichier` 409, `analyser` 409, `serialiser` 409, `versSrt` 409, `preparerConversionAss` 409, `preparerReplique` 409, `restaurerMarqueurs` 409, `recouper` 409, `texteVisible` 409, `nomSortie` 409, `ecrireFichier` 409
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

### src/main/services/moteurs.js — processus principal · 360 l.
- classes : `ErreurMoteur` 8
- fonctions : `pause(ms, signal)` 17, `erreurAnnulation()` 21, `signalAvecDelai(signal, ms)` 23, `lireJson(reponse)` 28, `normaliser(t)` 40, `nombreMots(t)` 41, `nonTraduit(original, traduction)` 42, `texteAides(aides, vers)` 49, `mauvaiseEcriture(original, traduction, cible)` 58, `versXml(texte)` 62, `echapper(t)` 71, `depuisXml(t)` 72, `adresseOllamaValide(url)` 77, `normaliserAdresse(url)` 88, `creerMoteurs({ fetch, lireCleDeepl, urlDeeplTest = null, journal = con…)` 94, `baseDeepl(cle)` 96, `appelDeepl(chemin, { methode = 'GET', corps = null, signal } = {})` 101, `usageDeepl()` 138, `traduireDeepl(segments, { source, cible, formalite = 'defaut', contexte…)` 147, `appelOllama(adresse, chemin, { corps = null, signal, delai = 15000 }…)` 176, `modelesOllama(adresse)` 202, `consigne(source, cible)` 211, `demande(segments, contexte, cible, aides = [])` 226, `extraireObjet(contenu)` 238, `lotOllama(segments, { adresse, modele, source, cible, contexte, aid…)` 250, `traduireOllama(segments, { adresse, modele, source, cible, contexte = []…)` 280, `traiter(indices, taille, essai = 0)` 285, `traduireTout(segments, options, surAvancement = ()` 326
- méthodes : `constructor(message, { definitive = true } = {})` 9
- exporte : `creerMoteurs` 360, `ErreurMoteur` 360, `adresseOllamaValide` 360, `normaliserAdresse` 360, `versXml` 360, `depuisXml` 360, `nonTraduit` 360, `nombreMots` 360
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

### src/main/services/pipeline.js — processus principal · 139 l.
- fonctions : `erreurAnnulation()` 15, `verifierTraduit(originaux, traductions, options)` 21, `traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null…)` 37
- exporte : `traduireDocument` 139
- importe : `./formats`, `./glossaire`, `./langues`, `./moteurs`, `./expressions`

### src/main/services/traduction.js — processus principal · 579 l.
- IPC : canaux traités : `traduction:langues` 281, `traduction:reglages` 283, `traduction:modifierReglages` 285, `traduction:choisirDossierSortie` 319, `traduction:explorer` 327, `traduction:analyser` 335, `traduction:lancer` 344, `traduction:annuler` 381, `traduction:apercu` 388, `traduction:montrer` 391, `memoire:etat` 398, `memoire:vider` 399, `expressions:lister` 407, `expressions:enregistrer` 408, `expressions:supprimer` 419, `expressions:regler` 420, `expressions:tester` 428, `glossaire:lister` 435, `glossaire:enregistrer` 436, `glossaire:supprimer` 446, `glossaire:importer` 447, `enligne:etat` 463, `enligne:enregistrer` 470, `enligne:tester` 493, `enligne:chercher` 499, `enligne:telecharger` 521, `enligne:automatique` 538, `moteurs:etat` 552, `moteurs:enregistrerCleDeepl` 554, `moteurs:supprimerCleDeepl` 565, `moteurs:testerDeepl` 567, `moteurs:modelesOllama` 569, `moteurs:testerOllama` 571
- fonctions : `reglages()` 43, `envoyer(evenement)` 53, `langueDuNom(chemin)` 60, `sourceOuAnglais()` 66, `analyserUn(chemin)` 71, `traduireElement(el, options, signal)` 104, `rapporter(etat, extra = {})` 105, `integrerAuFilm(film, sousTitre, options, signal, surAvancement)` 225, `libre(()` 230, `go(n)` 232, `enregistrer({ racineApp })` 252, `videoExistante(chemin)` 495, `ecrireTelecharge(film, contenu, ext, l)` 507
- exporte : `enregistrer` 579
- importe : `../ipc`, `../securite`, `../parametres`, `../journal`, `./formats`, `./video`, `./langues`, `./moteurs`, `./memoire`, `./glossaire`, `./expressions`, `./pipeline`, `./dossiers`, `./pgs`, `./ocr`, `./enligne`
- paquets : `electron`, `fs`, `os`, `path`

### src/main/services/video.js — processus principal · 180 l.
- fonctions : `cheminFfmpeg({ empaquete, resourcesPath, racineApp })` 21, `estVideo(chemin)` 27, `executer(binaire, args, { delai = 60000, signal, sortieMax = 4 * 1…)` 31, `terminer(fonction)` 42, `surAnnulation()` 43, `analyserFlux(texteFfmpeg)` 56, `listerPistes(binaire, chemin, { signal } = {})` 88, `estPgs(piste)` 99, `extrairePiste(binaire, chemin, piste, { signal } = {})` 101, `lireDuree(texteFfmpeg)` 123, `integrerPiste(binaire, film, sousTitre, { sortie, langueIso3 = 'und', t…)` 131, `toutArreter()` 175
- exporte : `integrerPiste` 180, `lireDuree` 180, `estPgs` 180, `EXTENSIONS_VIDEO` 180, `cheminFfmpeg` 180, `estVideo` 180, `analyserFlux` 180, `listerPistes` 180, `extrairePiste` 180, `toutArreter` 180, `executer` 180
- importe : `../securite`, `./langues`
- paquets : `child_process`, `fs`, `os`, `path`

### src/renderer/index.html — interface · 421 l.
- écrans / sections : `traduire` 24, `glossaire` 25, `expressions` 26, `moteurs` 27, `parametres` 29, `a-propos` 30, `ecran-traduire` 35, `ecran-glossaire` 113, `ecran-expressions` 153, `ecran-moteurs` 215, `ecran-parametres` 316, `ecran-a-propos` 356
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

### src/renderer/js/traduire.js — interface · 467 l.
- API Electron utilisée : `forge.moteurs.etat` 69, `forge.fichiers.cheminDe` 164, `forge.fichiers.choisir` 170, `forge.fichiers.choisir` 175, `forge.enLigne.etat` 336, `forge.enLigne.automatique` 361
- fonctions : `appliquerReglages(r)` 34, `modifier(o)` 48, `majAvertissement()` 64, `choisirPiste(pistes)` 89, `parmi(l)` 92, `appliquerInfo(e, info)` 96, `ajouter(chemins)` 114, `description(e)` 188, `libellePiste(p)` 200, `dessiner(e)` 209, `aRetraduire(e)` 298, `chercherEnLigne(e)` 303, `majFile()` 315, `afficherApercu(e)` 442

### src/renderer/js/ui.js — interface · 43 l.
- fonctions : `el(tag, attributs = {}, enfants = [])` 6, `notifier(message, type = 'info', duree = 4000)` 18, `erreur(e)` 25, `appliquerTheme(theme, accent)` 30, `afficherEcran(nom)` 37

### tests/dossiers.test.js — tests · 97 l.
- fonctions : `arbre(fichiers)` 11
- importe : `../src/main/services/dossiers`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/e2e/blu-ray.js — tests · 52 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/enligne-saison.js — tests · 54 l.
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

### tests/e2e/outils.js — tests · 66 l.
- fonctions : `fauxOllama()` 11, `lignesDemandees(contenu)` 44, `ffmpeg()` 50, `utiliserFauxOllama(p, serveur)` 55
- exporte : `fauxOllama` 66, `ffmpeg` 66, `utiliserFauxOllama` 66, `lignesDemandees` 66, `RACINE` 66
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

### tests/video.test.js — tests · 146 l.
- importe : `../src/main/services/video`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `x.mkv`
