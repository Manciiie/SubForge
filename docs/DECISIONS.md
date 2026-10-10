# DÉCISIONS — SubForge

> Les choix déjà faits. On ne les remet pas en cause sans le proposer explicitement.
> Toute nouvelle dépendance, binaire ou changement d'approche = une nouvelle entrée.

| ID | Décision | Date | Statut |
|---|---|---|---|
| D-001 | Electron + JS sans framework, squelette forge-app | 2026-10-07 | ✅ |
| D-002 | Livraison : installeur NSIS non signé ; code sur dépôt GitHub privé (obligatoire) + zip de sauvegarde | 2026-10-07 | ✅ |
| D-003 | Mises à jour automatiques : electron-updater, dépôt privé `Manciiie/SubForge-releases`, jeton en lecture seule | 2026-10-07 | ✅ |
| D-004 | ffmpeg livré dans `vendor/win` (paquet npm @ffmpeg-installer, empreinte figée, copié au build) ; pas de ffprobe | 2026-10-07 | ✅ |
| D-005 | Deux moteurs : DeepL (API officielle) et Ollama (IA locale) ; pas de service « gratuit » non officiel | 2026-10-07 | ✅ |
| D-007 | ffmpeg 7.1 depuis la wheel PyPI `imageio-ffmpeg 0.6.0` (SHA-256 figé), remplace le paquet npm 4.1 | 2026-10-10 | ✅ |
| D-008 | OCR des sous-titres Blu-ray : décodeur PGS maison + tesseract.js 7 (WASM, Apache-2.0) dans des threads, données « best_int » de 7 langues livrées | 2026-10-10 | ✅ |
| D-006 | Analyse/écriture des formats de sous-titres codées maison, sans dépendance | 2026-10-07 | ✅ |

---

## D-001 — Stack
- **Contexte** : logiciel Windows perso, interface en français, livré en .exe.
- **Décision** : Electron + JavaScript sans framework, à partir du squelette forge-app
  (sandbox, CSP, IPC en liste blanche, fuses, coffre à secrets, thèmes).
- **Conséquences** : exe d'environ 80 Mo ; calcul lourd (vidéo, audio, émulation) délégué
  à un binaire natif ou un `utilityProcess`, jamais à l'interface.

## D-002 — Livraison
- **Décision** : installeur NSIS x64 non signé (SmartScreen préviendra), `SHA256.txt`,
  découpage en parties si trop gros, zip source conservé pour les mises à jour.
- **Code** : dépôt privé `Manciiie/SubForge`, obligatoire, source de vérité ; un commit par tâche,
  un commit `chore: version <version>` par livraison. Le zip source reste livré en sauvegarde.
- **Conséquences** : chaque mise à jour repart du dépôt ; le zip ne sert qu'à un import ou un secours.

## D-003 — Mises à jour automatiques
- **Décision** : `electron-updater`. Vérification à chaque démarrage, **demande avant de
  télécharger**, SHA-512 vérifié, installation au redémarrage ou à la fermeture.
- **Où** : release GitHub `v<version>` sur le dépôt privé `Manciiie/SubForge-releases`
  (installeurs seulement, pas de code), lu avec un jeton *fine-grained* en lecture seule rangé
  encodé dans `src/main/maj-config.json` (versionné). Publication : `npm run publier`.
- **Conséquences** : une version qui n'augmente pas n'est jamais proposée ; le jeton est
  extractible de l'exe, d'où ses droits minimaux ; jeton expiré = réinstallation manuelle.

## D-004 — ffmpeg livré
- **Contexte** : lire les pistes de sous-titres d'un MKV/MP4 demande ffprobe + ffmpeg.
- **Options** : A) demander d'installer ffmpeg (− je ne veux rien installer) ; B) les livrer
  avec l'app (+ marche du premier coup, − ~70 Mo de plus).
- **Décision** : B. `ffmpeg.exe` vient du paquet npm `@ffmpeg-installer/win32-x64@4.1.0`, téléchargé
  et vérifié (SHA-512 figé) par `scripts/preparer-ffmpeg.js` dans `vendor/win/` (ignoré par git),
  livré via `extraResources` → `resources/bin/`. Pas de ffprobe (+80 Mo) : les pistes sont lues
  dans la description que `ffmpeg -i` écrit. En développement Linux : `linux-x64`.
- **Conséquences** : appel par chemin absolu, `spawn` sans shell, délai max, tués à l'annulation.

## D-005 — Moteurs de traduction
- **Décision** : DeepL (meilleure qualité, clé gratuite 500 000 caractères/mois, clé au coffre
  DPAPI) et Ollama (hors ligne sur la RTX 4060, aucun texte ne quitte le PC). Pas de
  « Google gratuit » non officiel : fragile et contraire aux conditions d'utilisation.
- **Conséquences** : DeepL exige une clé ; Ollama doit être installé et un modèle téléchargé
  (`ollama pull …`), l'écran Moteurs l'explique.

## D-007 — ffmpeg 7.1
- **Contexte** : ffmpeg 4.1 (2018) ne lit pas certains conteneurs récents ; la 1.1 décode aussi les
  sous-titres Blu-ray (PGS) et a besoin du multiplexeur `sup`.
- **Options** : npm (aucun paquet fiable avec un ffmpeg 7 complet : soit téléchargement depuis
  GitHub au moment de l'installation, bloqué dans l'environnement de build, soit version minimale
  sans sous-titres, soit auteur inconnu publié depuis 2 jours) ; GitHub (bloqué) ; PyPI
  `imageio-ffmpeg` (projet imageio, très utilisé, embarque ffmpeg 7.1 GPL statique pour Windows).
- **Décision** : PyPI `imageio-ffmpeg 0.6.0`, empreintes SHA-256 de PyPI figées dans
  `scripts/preparer-ffmpeg.js`, extraction du binaire sans dépendance.
- **Conséquences** : +23 Mo dans l'installeur ; le script D-004 change de source, pas d'usage.

## D-008 — OCR des sous-titres Blu-ray
- **Contexte** : les Blu-ray ont des sous-titres en image (PGS) : pas de texte à traduire.
- **Options** : OCR de Windows (sans téléchargement mais dépend des packs de langue installés,
  intestable ici) ; Tesseract natif (binaire + DLL à livrer) ; tesseract.js (WASM, testable partout).
- **Décision** : décodage PGS écrit maison (`pgs.js`, testé) ; OCR `tesseract.js` 7.0.0 dans ses
  threads de travail (jamais dans l'interface) ; données `@tesseract.js-data/*` « best_int »
  (anglais, français, espagnol, allemand, italien, portugais, néerlandais : 13 Mo) copiées par
  `scripts/preparer-ocr.js` dans `resources/tessdata` ; `tesseract.js` et ses dépendances dépaquetés
  d'app.asar (`asarUnpack`) pour que le thread de travail lise de vrais fichiers.
- **Conséquences** : environ +35 Mo ; DVD (VobSub) et TNT (DVB) pas encore lus ; les langues non
  livrées affichent « OCR non disponible ».

## D-006 — Formats sans dépendance
- **Décision** : analyseurs SRT/ASS/VTT écrits dans `src/main/services/formats.js` (quelques
  centaines de lignes, testés) plutôt qu'une bibliothèque : contrôle total sur la préservation
  des balises et des styles ASS, rien à auditer.

---

## Modèle
### D-XXX — [Titre]
- **Date** :
- **Statut** : ✅ Acceptée / 🔄 Remplacée par D-XXX / ❌ Rejetée
- **Contexte** :
- **Options** : (A : + / − · B : + / −)
- **Décision** :
- **Conséquences** :
