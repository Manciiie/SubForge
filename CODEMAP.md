# CODEMAP — SubForge

> Généré par `codemap.py` v3 : **ne pas modifier à la main**. Régénérer après chaque modification du code.
> Format : `nom` suivi du numéro de ligne → lire seulement les lignes utiles (Read avec offset).

**50 fichiers · 6303 lignes** · 49 js · 1 html

## Liens entre fichiers

- IPC `app:infos` : traité `src/main/ipc.js:45`, autorisé `src/main/preload.js:10`
- IPC `app:ouvrirJournaux` : traité `src/main/ipc.js:80`, autorisé `src/main/preload.js:12`
- IPC `app:ouvrirLien` : traité `src/main/ipc.js:75`, autorisé `src/main/preload.js:11`
- IPC `diagnostic:copierRapport` : traité `src/main/ipc.js:83`, autorisé `src/main/preload.js:13`
- IPC `fenetre:action` : traité `src/main/ipc.js:121`, autorisé `src/main/preload.js:19`
- IPC `fichiers:choisir` : traité `src/main/ipc.js:103`, autorisé `src/main/preload.js:18`
- IPC `glossaire:enregistrer` : traité `src/main/services/traduction.js:258`, autorisé `src/main/preload.js:44`
- IPC `glossaire:importer` : traité `src/main/services/traduction.js:269`, autorisé `src/main/preload.js:46`
- IPC `glossaire:lister` : traité `src/main/services/traduction.js:257`, autorisé `src/main/preload.js:43`
- IPC `glossaire:supprimer` : traité `src/main/services/traduction.js:268`, autorisé `src/main/preload.js:45`
- IPC `maj:etat` : traité `src/main/mises-a-jour.js:134`, autorisé `src/main/preload.js:20`
- IPC `maj:ignorer` : traité `src/main/mises-a-jour.js:153`, autorisé `src/main/preload.js:24`
- IPC `maj:installer` : traité `src/main/mises-a-jour.js:145`, autorisé `src/main/preload.js:23`
- IPC `maj:telecharger` : traité `src/main/mises-a-jour.js:138`, autorisé `src/main/preload.js:22`
- IPC `maj:verifier` : traité `src/main/mises-a-jour.js:136`, autorisé `src/main/preload.js:21`
- IPC `memoire:etat` : traité `src/main/services/traduction.js:248`, autorisé `src/main/preload.js:41`
- IPC `memoire:vider` : traité `src/main/services/traduction.js:249`, autorisé `src/main/preload.js:42`
- IPC `moteurs:enregistrerCleDeepl` : traité `src/main/services/traduction.js:287`, autorisé `src/main/preload.js:36`
- IPC `moteurs:etat` : traité `src/main/services/traduction.js:285`, autorisé `src/main/preload.js:35`
- IPC `moteurs:modelesOllama` : traité `src/main/services/traduction.js:302`, autorisé `src/main/preload.js:39`
- IPC `moteurs:supprimerCleDeepl` : traité `src/main/services/traduction.js:298`, autorisé `src/main/preload.js:37`
- IPC `moteurs:testerDeepl` : traité `src/main/services/traduction.js:300`, autorisé `src/main/preload.js:38`
- IPC `moteurs:testerOllama` : traité `src/main/services/traduction.js:304`, autorisé `src/main/preload.js:40`
- IPC `parametres:lire` : traité `src/main/ipc.js:53`, autorisé `src/main/preload.js:14`
- IPC `parametres:modifier` : traité `src/main/ipc.js:55`, autorisé `src/main/preload.js:15`
- IPC `secret:enregistrer` : traité `src/main/ipc.js:70`, autorisé `src/main/preload.js:16`
- IPC `secret:existe` : traité `src/main/ipc.js:73`, autorisé `src/main/preload.js:17`
- IPC `traduction:analyser` : traité `src/main/services/traduction.js:186`, autorisé `src/main/preload.js:30`
- IPC `traduction:annuler` : traité `src/main/services/traduction.js:231`, autorisé `src/main/preload.js:32`
- IPC `traduction:apercu` : traité `src/main/services/traduction.js:238`, autorisé `src/main/preload.js:33`
- IPC `traduction:choisirDossierSortie` : traité `src/main/services/traduction.js:170`, autorisé `src/main/preload.js:28`
- IPC `traduction:explorer` : traité `src/main/services/traduction.js:178`, autorisé `src/main/preload.js:29`
- IPC `traduction:lancer` : traité `src/main/services/traduction.js:195`, autorisé `src/main/preload.js:31`
- IPC `traduction:langues` : traité `src/main/services/traduction.js:133`, autorisé `src/main/preload.js:25`
- IPC `traduction:modifierReglages` : traité `src/main/services/traduction.js:137`, autorisé `src/main/preload.js:27`
- IPC `traduction:montrer` : traité `src/main/services/traduction.js:241`, autorisé `src/main/preload.js:34`
- IPC `traduction:reglages` : traité `src/main/services/traduction.js:135`, autorisé `src/main/preload.js:26`

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

### src/main/preload.js — preload · 122 l.
- IPC : canaux appelés : `app:infos` 65, `app:ouvrirLien` 66, `app:ouvrirJournaux` 67, `diagnostic:copierRapport` 68, `parametres:lire` 70, `parametres:modifier` 71, `secret:enregistrer` 74, `secret:existe` 75, `fichiers:choisir` 78, `fenetre:action` 82, `traduction:langues` 84, `traduction:reglages` 85, `traduction:modifierReglages` 86, `traduction:choisirDossierSortie` 87, `traduction:explorer` 88, `traduction:analyser` 89, `traduction:lancer` 90, `traduction:annuler` 91, `traduction:apercu` 92, `traduction:montrer` 93, `memoire:etat` 97, `memoire:vider` 98, `glossaire:lister` 101, `glossaire:enregistrer` 102, `glossaire:supprimer` 103, `glossaire:importer` 104, `moteurs:etat` 107, `moteurs:enregistrerCleDeepl` 108, `moteurs:supprimerCleDeepl` 109, `moteurs:testerDeepl` 110, `moteurs:modelesOllama` 111, `moteurs:testerOllama` 112, `maj:etat` 115, `maj:verifier` 116, `maj:telecharger` 117, `maj:installer` 118, `maj:ignorer` 119
- IPC : liste blanche : `app:infos` 10, `app:ouvrirLien` 11, `app:ouvrirJournaux` 12, `diagnostic:copierRapport` 13, `parametres:lire` 14, `parametres:modifier` 15, `secret:enregistrer` 16, `secret:existe` 17, `fichiers:choisir` 18, `fenetre:action` 19, `maj:etat` 20, `maj:verifier` 21, `maj:telecharger` 22, `maj:installer` 23, `maj:ignorer` 24, `traduction:langues` 25, `traduction:reglages` 26, `traduction:modifierReglages` 27, `traduction:choisirDossierSortie` 28, `traduction:explorer` 29, `traduction:analyser` 30, `traduction:lancer` 31, `traduction:annuler` 32, `traduction:apercu` 33, `traduction:montrer` 34, `moteurs:etat` 35, `moteurs:enregistrerCleDeepl` 36, `moteurs:supprimerCleDeepl` 37, `moteurs:testerDeepl` 38, `moteurs:modelesOllama` 39, `moteurs:testerOllama` 40, `memoire:etat` 41, `memoire:vider` 42, `glossaire:lister` 43, `glossaire:enregistrer` 44, `glossaire:supprimer` 45, `glossaire:importer` 46
- IPC : événements autorisés : `maj:changement` 50, `traduction:progression` 50
- API exposée à l'interface : `forge.infos → app:infos` 65, `forge.ouvrirLien → app:ouvrirLien` 66, `forge.ouvrirJournaux → app:ouvrirJournaux` 67, `forge.copierRapport → diagnostic:copierRapport` 68, `forge.parametres.lire → parametres:lire` 70, `forge.parametres.modifier → parametres:modifier` 71, `forge.secrets.enregistrer → secret:enregistrer` 74, `forge.secrets.existe → secret:existe` 75, `forge.fichiers.choisir → fichiers:choisir` 78, `forge.fichiers.cheminDe` 80, `forge.fenetre → fenetre:action` 82, `forge.traduction.langues → traduction:langues` 84, `forge.traduction.reglages → traduction:reglages` 85, `forge.traduction.modifierReglages → traduction:modifierReglages` 86, `forge.traduction.choisirDossierSortie → traduction:choisirDossierSortie` 87, `forge.traduction.explorer → traduction:explorer` 88, `forge.traduction.analyser → traduction:analyser` 89, `forge.traduction.lancer → traduction:lancer` 90, `forge.traduction.annuler → traduction:annuler` 91, `forge.traduction.apercu → traduction:apercu` 92, `forge.traduction.montrer → traduction:montrer` 93, `forge.traduction.surProgression → traduction:progression` 94, `forge.memoire.etat → memoire:etat` 97, `forge.memoire.vider → memoire:vider` 98, `forge.glossaire.lister → glossaire:lister` 101, `forge.glossaire.enregistrer → glossaire:enregistrer` 102, `forge.glossaire.supprimer → glossaire:supprimer` 103, `forge.glossaire.importer → glossaire:importer` 104, `forge.moteurs.etat → moteurs:etat` 107, `forge.moteurs.enregistrerCleDeepl → moteurs:enregistrerCleDeepl` 108, `forge.moteurs.supprimerCleDeepl → moteurs:supprimerCleDeepl` 109, `forge.moteurs.testerDeepl → moteurs:testerDeepl` 110, `forge.moteurs.modelesOllama → moteurs:modelesOllama` 111, `forge.moteurs.testerOllama → moteurs:testerOllama` 112, `forge.majs.etat → maj:etat` 115, `forge.majs.verifier → maj:verifier` 116, `forge.majs.telecharger → maj:telecharger` 117, `forge.majs.installer → maj:installer` 118, `forge.majs.ignorer → maj:ignorer` 119, `forge.majs.surChangement → maj:changement` 120
- fonctions : `ecouter(evenement, rappel)` 52, `relais(_event, donnees)` 54, `appeler(canal, ...args)` 59
- paquets : `electron`

### src/main/securite.js — processus principal · 185 l.
- classes : `ErreurSecurite` 7, `LimitesDecompression` 48
- fonctions : `cheminSousDossier(base, relatif)` 18, `verifierEntreeArchive(dossierDestination, entree)` 39, `validerArguments(schema, args)` 79, `validerValeur(regle, valeur, nom)` 87, `urlExterneAutorisee(url)` 132, `argumentsCommande(args)` 144, `masquerSecrets(texte, secretsConnus = [])` 163
- méthodes : `constructor(message)` 8, `constructor({ tailleMax = 20 * 1024 ** 3, fichiersMax = 200000, ratio…)` 49, `ajouter({ tailleDecompressee, tailleCompressee })` 58
- exporte : `ErreurSecurite` 176, `cheminSousDossier` 176, `verifierEntreeArchive` 176, `LimitesDecompression` 176, `validerArguments` 176, `urlExterneAutorisee` 176, `argumentsCommande` 176, `masquerSecrets` 176
- paquets : `path`

### src/main/services/dossiers.js — processus principal · 130 l.
- fonctions : `triNaturel(a, b)` 17, `parcourir(racine, { profondeurMax = 6, fichiersMax = 1000 } = {})` 19, `visiter(dossier, profondeur)` 22, `decomposer(chemin)` 54, `memeLangue(a, b)` 68, `selectionner(fichiers, { cible, source = 'auto' })` 71, `explorer(chemins, { cible, source, fichiersMax = 1000 })` 104
- exporte : `parcourir` 130, `selectionner` 130, `explorer` 130, `decomposer` 130, `EXT_SOUSTITRES` 130, `EXT_VIDEO` 130, `langue` 130
- importe : `./langues`
- paquets : `fs`, `path`

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

### src/main/services/moteurs.js — processus principal · 312 l.
- classes : `ErreurMoteur` 8
- fonctions : `pause(ms, signal)` 17, `erreurAnnulation()` 21, `signalAvecDelai(signal, ms)` 23, `lireJson(reponse)` 28, `versXml(texte)` 38, `echapper(t)` 47, `depuisXml(t)` 48, `adresseOllamaValide(url)` 53, `normaliserAdresse(url)` 64, `creerMoteurs({ fetch, lireCleDeepl, urlDeeplTest = null, journal = con…)` 70, `baseDeepl(cle)` 72, `appelDeepl(chemin, { methode = 'GET', corps = null, signal } = {})` 77, `usageDeepl()` 114, `traduireDeepl(segments, { source, cible, formalite = 'defaut', contexte…)` 123, `appelOllama(adresse, chemin, { corps = null, signal, delai = 15000 }…)` 147, `modelesOllama(adresse)` 173, `consigne(source, cible)` 182, `extraireObjet(contenu)` 194, `lotOllama(segments, { adresse, modele, source, cible, contexte, sig…)` 207, `traduireOllama(segments, { adresse, modele, source, cible, contexte = []…)` 237, `traiter(indices, taille, essai = 0)` 241, `traduireTout(segments, options, surAvancement = ()` 278
- méthodes : `constructor(message, { definitive = true } = {})` 9
- exporte : `creerMoteurs` 312, `ErreurMoteur` 312, `adresseOllamaValide` 312, `normaliserAdresse` 312, `versXml` 312, `depuisXml` 312
- importe : `./langues`
- paquets : `lines`

### src/main/services/pipeline.js — processus principal · 103 l.
- fonctions : `erreurAnnulation()` 12, `traduireDocument(doc, { moteurs, memoire = null, glossairePrepare = null…)` 16
- exporte : `traduireDocument` 103
- importe : `./formats`, `./glossaire`

### src/main/services/traduction.js — processus principal · 312 l.
- IPC : canaux traités : `traduction:langues` 133, `traduction:reglages` 135, `traduction:modifierReglages` 137, `traduction:choisirDossierSortie` 170, `traduction:explorer` 178, `traduction:analyser` 186, `traduction:lancer` 195, `traduction:annuler` 231, `traduction:apercu` 238, `traduction:montrer` 241, `memoire:etat` 248, `memoire:vider` 249, `glossaire:lister` 257, `glossaire:enregistrer` 258, `glossaire:supprimer` 268, `glossaire:importer` 269, `moteurs:etat` 285, `moteurs:enregistrerCleDeepl` 287, `moteurs:supprimerCleDeepl` 298, `moteurs:testerDeepl` 300, `moteurs:modelesOllama` 302, `moteurs:testerOllama` 304
- fonctions : `reglages()` 32, `envoyer(evenement)` 41, `analyserUn(chemin)` 48, `traduireElement(el, options, signal)` 71, `rapporter(etat, extra = {})` 72, `enregistrer({ racineApp })` 121
- exporte : `enregistrer` 312
- importe : `../ipc`, `../securite`, `../parametres`, `../journal`, `./formats`, `./video`, `./langues`, `./moteurs`, `./memoire`, `./glossaire`, `./pipeline`, `./dossiers`
- paquets : `electron`, `fs`, `path`

### src/main/services/video.js — processus principal · 122 l.
- fonctions : `cheminFfmpeg({ empaquete, resourcesPath, racineApp })` 21, `estVideo(chemin)` 27, `executer(binaire, args, { delai = 60000, signal, sortieMax = 4 * 1…)` 31, `terminer(fonction)` 42, `surAnnulation()` 43, `analyserFlux(texteFfmpeg)` 56, `listerPistes(binaire, chemin, { signal } = {})` 88, `extrairePiste(binaire, chemin, piste, { signal } = {})` 98, `toutArreter()` 117
- exporte : `EXTENSIONS_VIDEO` 122, `cheminFfmpeg` 122, `estVideo` 122, `analyserFlux` 122, `listerPistes` 122, `extrairePiste` 122, `toutArreter` 122, `executer` 122
- importe : `../securite`, `./langues`
- paquets : `child_process`, `fs`, `os`, `path`

### src/renderer/index.html — interface · 296 l.
- écrans / sections : `traduire` 24, `glossaire` 25, `moteurs` 26, `parametres` 28, `a-propos` 29, `ecran-traduire` 34, `ecran-glossaire` 104, `ecran-moteurs` 144, `ecran-parametres` 214, `ecran-a-propos` 254
- scripts : `js/ui.js`, `js/app.js`, `js/traduire.js`, `js/moteurs.js`, `js/glossaire.js`, `js/maj.js`
- styles : `styles/theme.css`, `styles/app.css`

### src/renderer/js/app.js — interface · 59 l.
- API Electron utilisée : `forge.fenetre` 8, `forge.parametres.lire` 13, `forge.parametres.modifier` 28, `forge.ouvrirJournaux` 39, `forge.copierRapport` 42, `forge.infos` 48
- fonctions : `enregistrer(partiel)` 26

### src/renderer/js/glossaire.js — interface · 116 l.
- API Electron utilisée : `forge.traduction.langues` 11
- fonctions : `nomLangue(code)` 12, `viderFormulaire()` 18, `dessiner()` 29, `charger()` 58, `modifier(e)` 70, `supprimer(e)` 82

### src/renderer/js/maj.js — interface · 115 l.
- API Electron utilisée : `forge.majs.telecharger` 99, `forge.majs.installer` 100, `forge.majs.ignorer` 103, `forge.majs.verifier` 108, `forge.majs.surChangement` 110, `forge.majs.etat` 111
- fonctions : `mo(o)` 12, `dateFr(d)` 13, `ouvrir()` 17, `fermer()` 18, `boutons({ telecharger = false, installer = false, plusTard = true…)` 20, `afficher(e)` 28

### src/renderer/js/moteurs.js — interface · 128 l.
- API Electron utilisée : `forge.ouvrirLien` 64, `forge.ouvrirLien` 100, `forge.memoire.etat` 105, `forge.memoire.vider` 118
- fonctions : `nombre(n)` 11, `rafraichir()` 13, `afficherQuota(u)` 27, `chargerModeles({ silencieux = false } = {})` 67, `majMemoire()` 103

### src/renderer/js/traduire.js — interface · 354 l.
- API Electron utilisée : `forge.moteurs.etat` 65, `forge.fichiers.cheminDe` 160, `forge.fichiers.choisir` 166, `forge.fichiers.choisir` 171
- fonctions : `appliquerReglages(r)` 32, `modifier(o)` 45, `majAvertissement()` 60, `choisirPiste(pistes)` 85, `parmi(l)` 88, `appliquerInfo(e, info)` 92, `ajouter(chemins)` 110, `description(e)` 184, `libellePiste(p)` 196, `dessiner(e)` 205, `aRetraduire(e)` 267, `majFile()` 271, `afficherApercu(e)` 329

### src/renderer/js/ui.js — interface · 43 l.
- fonctions : `el(tag, attributs = {}, enfants = [])` 6, `notifier(message, type = 'info', duree = 4000)` 18, `erreur(e)` 25, `appliquerTheme(theme, accent)` 30, `afficherEcran(nom)` 37

### tests/dossiers.test.js — tests · 89 l.
- fonctions : `arbre(fichiers)` 11
- importe : `../src/main/services/dossiers`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/e2e/faux-deepl.js — tests · 18 l.
- paquets : `http`

### tests/e2e/glossaire-memoire.js — tests · 85 l.
- importe : `./outils`
- paquets : `fs`, `path`

### tests/e2e/outils.js — tests · 56 l.
- fonctions : `fauxOllama()` 11, `ffmpeg()` 40, `utiliserFauxOllama(p, serveur)` 45
- exporte : `fauxOllama` 56, `ffmpeg` 56, `utiliserFauxOllama` 56, `RACINE` 56
- paquets : `http`, `path`

### tests/e2e/saison.js — tests · 57 l.
- fonctions : `film(chemin, srt)` 13
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/e2e/traduction.js — tests · 126 l.
- importe : `./outils`
- paquets : `fs`, `path`, `child_process`

### tests/formats.test.js — tests · 150 l.
- fonctions : `traduire(segments)` 32, `traduireDoc(doc)` 34
- importe : `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/glossaire-memoire.test.js — tests · 152 l.
- fonctions : `dossier()` 15, `fauxMoteur()` 18
- importe : `../src/main/services/glossaire`, `../src/main/services/memoire`, `../src/main/services/pipeline`, `../src/main/services/formats`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/moteurs.test.js — tests · 112 l.
- fonctions : `serveur(gestion)` 9, `json(res, code, o, entetes = {})` 19
- importe : `../src/main/services/moteurs`
- paquets : `node:test`, `node:assert/strict`, `http`

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

### tests/securite/subforge.test.js — tests · 52 l.
- importe : `../../src/main/journal`, `../../src/main/parametres`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`

### tests/video.test.js — tests · 95 l.
- importe : `../src/main/services/video`
- paquets : `node:test`, `node:assert/strict`, `fs`, `os`, `path`, `x.mkv`
