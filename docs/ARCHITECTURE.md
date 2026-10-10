# ARCHITECTURE — SubForge

> Le **comment**. Mis à jour à chaque module ou canal IPC ajouté.

## 1. Vue d'ensemble
```
Interface (renderer, sandbox)  ──preload / canaux IPC validés──>  Processus principal
  src/renderer/                                                   src/main/
  écrans, UI.el, textContent                                      services/<module>.js
                                                                  → fichiers, système, binaires
```
L'interface n'a jamais accès direct au disque ni à Node : tout passe par une liste blanche
de canaux (`canal()` dans `src/main/ipc.js`) dont les arguments sont validés (`securite.js`).

## 2. Arborescence
```
src/main/
  main.js          fenêtre, instance unique, filet anti « fenêtre qui ne s'ouvre pas »
  ipc.js           déclaration des canaux (canal())
  securite.js      validation des arguments, chemins, protections
  parametres.js    paramètres + coffre à secrets (DPAPI), migrations versionFormat
  journal.js       journaux avec rotation, secrets masqués
  diagnostic.js    rapport « Signaler un problème » (canal diagnostic:copierRapport)
  preload.js       API exposée à l'interface
  services/        un fichier par module
src/renderer/
  index.html       structure + navigation latérale
  js/app.js        navigation, paramètres, à propos
  js/traduire.js   écran Traduire (file, options, progression, aperçu)
  js/moteurs.js    écran Moteurs (DeepL, Ollama, mémoire)
  js/glossaire.js  écran Glossaire
  js/enligne.js    réglages OpenSubtitles + fenêtre « Chercher en ligne »
  js/ui.js         UI.el et composants
  styles/          theme.css (accent, sombre/clair), app.css
tests/securite/    tests de sécurité et cohérence IPC
tests/e2e/         scénarios piloter.js, un par module
scripts/           scan-securite, verifier-lancement, piloter, livrer, fuses, verifier-windows.ps1,
                   pousser-github.sh
docs/              mémoire du projet (non embarquée dans l'exe)
```

## 3. Modules
| Module | Service | Canaux IPC | Écran | Protections particulières |
|---|---|---|---|---|
| Paramètres | `parametres.js` | (squelette) | Paramètres | coffre à secrets |
| Diagnostic | `diagnostic.js` | `diagnostic:copierRapport` | Paramètres › Dépannage | secrets et dossier perso masqués |
| Formats | `services/formats.js` (pur) | — | — | taille max 20 Mo, écriture atomique sans écrasement, balises jamais orphelines |
| Langues | `services/langues.js` | `traduction:langues` | — | — |
| Pistes vidéo | `services/video.js` | (via `traduction:analyser` / `lancer`) | carte du fichier | `spawn` sans shell, binaire absolu, délai, kill à l'annulation/fermeture |
| Moteurs | `services/moteurs.js` (pur, `fetch` injecté) | `moteurs:etat`, `moteurs:enregistrerCleDeepl`, `moteurs:supprimerCleDeepl`, `moteurs:testerDeepl`, `moteurs:modelesOllama`, `moteurs:testerOllama` | Moteurs | clé au coffre jamais renvoyée, HTTP local seulement, réponses bornées |
| Traitement d'un document | `services/pipeline.js` (pur) | — | — | glossaire → dédoublonnage → mémoire → moteur → restitution |
| Mémoire | `services/memoire.js` (pur) | `memoire:etat`, `memoire:vider` | Moteurs | JSONL, ajout en fin, compactage atomique, plafond 300 000 |
| Glossaire | `services/glossaire.js` (pur) | `glossaire:lister`, `glossaire:enregistrer`, `glossaire:supprimer`, `glossaire:importer` | Glossaire | `< > { }` refusés, fichier abîmé mis de côté |
| Saison | `services/dossiers.js` (pur) | `traduction:explorer` | Traduire | liens / jonctions non suivis, 1 000 fichiers, profondeur 6 |
| Blu-ray (PGS) | `services/pgs.js` (pur) | (via `traduction:lancer`) | carte du fichier | 200 Mo max, images ≤ 4096 px, segments abîmés comptés |
| OCR | `services/ocr.js` (tesseract.js, threads) | (via `traduction:lancer`) | carte du fichier | données livrées, aucun téléchargement, annulation |
| En ligne | `services/enligne.js` (pur, `fetch` injecté) | `enligne:etat`, `enligne:enregistrer`, `enligne:tester`, `enligne:chercher`, `enligne:telecharger` | Moteurs + fenêtre | secrets au coffre, lien vérifié, contenu vérifié, URL de test ignorée en version installée |
| Traduction | `services/traduction.js` | `traduction:reglages`, `traduction:modifierReglages`, `traduction:choisirDossierSortie`, `traduction:analyser`, `traduction:lancer`, `traduction:annuler`, `traduction:apercu`, `traduction:montrer` ; événement `traduction:progression` | Traduire | `montrer` limité aux fichiers produits, URL DeepL de test ignorée en version installée |

## 4. Flux de l'action principale
1. Dépôt de fichiers dans l'écran Traduire → `traduction:analyser` (format, encodage, nombre de
   répliques ; pour une vidéo, `ffmpeg -i` liste les pistes de sous-titres).
2. « Traduire tout » → `traduction:lancer` : file traitée dans le processus principal, un fichier
   après l'autre (vidéo : piste extraite par ffmpeg dans un dossier temporaire privé).
3. `formats.preparerReplique` découpe chaque réplique en segments (balises → marqueurs `<x n/>`,
   dialogue ligne à ligne) → `moteurs.traduireTout` (DeepL par lots de 50, Ollama par lots de 20)
   → `recomposer` remet balises et retours à la ligne → `ecrireFichier` (temporaire + renommage).
4. Progression par l'événement `traduction:progression` ; Annuler = `AbortController` + ffmpeg tué.

## 5. Stockage
- **Paramètres** : `%APPDATA%\SubForge\` (format versionné, migrations dans `parametres.js`)
- **Secrets** : coffre chiffré Windows
- **Journaux** : `%APPDATA%\SubForge\logs`
- **Données propres au logiciel** : réglages `traduction`, `deepl`, `ollama` dans `parametres.json` ;
  clé DeepL au coffre sous le nom `cle_deepl`. Sorties : à côté de la source (`Film.fr.srt`) ou
  dans le dossier choisi.

## 6. Binaires externes
| Binaire | Rôle | Appel | Source |
|---|---|---|---|
| `ffmpeg.exe` 7.1 | lister / extraire les pistes (texte, et PGS en `.sup`) | `spawn` sans shell, chemin `resources/bin/` | wheel PyPI `imageio-ffmpeg 0.6.0`, SHA-256 figé (`scripts/preparer-ffmpeg.js`, D-007) |
| tesseract.js 7 (WASM) | OCR des sous-titres Blu-ray | threads de travail Node, dépaqueté d'app.asar | npm + données `resources/tessdata` (`scripts/preparer-ocr.js`, D-008) |
