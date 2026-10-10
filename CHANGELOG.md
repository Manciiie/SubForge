# Journal des modifications

## 1.1.0 — 2026-10-10
### Nouveautés
- Glossaire (nouvel écran) : noms propres à ne jamais traduire et termes à traduire toujours
  pareil, pour DeepL comme pour l'IA locale ; recherche, modification, import d'un fichier
  terme;traduction;langue. Une réplique où le moteur a perdu un terme est signalée « à vérifier ».
- Mémoire de traduction : une réplique déjà traduite est reprise au lieu d'être renvoyée au
  moteur (DeepL n'est jamais repayé) ; les répliques identiques d'un fichier (« Oui. ») ne partent
  qu'une fois ; bilan sur chaque fichier (« 312 répliques reprises · 9 800 caractères DeepL
  économisés ») ; activer ou vider dans Moteurs.
- Saison entière : glissez (ou choisissez) le dossier d'une série, sous-dossiers compris ;
  épisodes triés dans l'ordre, déjà traduits ignorés, sous-titre externe préféré à la vidéo, bilan.
- Sous-titres Blu-ray (image) : les pistes PGS et les fichiers .sup sont lus par OCR, hors
  ligne (anglais, français, espagnol, allemand, italien, portugais, néerlandais) ; le texte lu est
  enregistré à côté du film (Film.en.srt) puis traduit.
- Sous-titres en ligne : bouton « Chercher en ligne » sur les vidéos (mis en avant quand elles
  n'ont aucun sous-titre) ; recherche sur OpenSubtitles par empreinte du fichier puis titre /
  saison / épisode ; le sous-titre choisi est enregistré à côté du film puis ajouté à la file.
  Clé d'API gratuite et compte facultatif dans Moteurs.
- ffmpeg 7.1 (au lieu de 4.1) : formats vidéo récents et inhabituels mieux lus.

### Améliorations
- Dossier d'origine affiché sur chaque carte ; analyse des fichiers par paquets (les cartes se
  remplissent au fur et à mesure) ; état « Pas de sous-titres » distinct d'une erreur.

### Sécurité
- Clé et mot de passe OpenSubtitles chiffrés par Windows, jamais réaffichés ni journalisés ; lien
  de téléchargement accepté seulement chez OpenSubtitles ; fichier reçu vérifié (taille, archive,
  vrai sous-titre) puis réécrit en UTF-8.
- Parcours de dossiers sans suivre les liens ni les jonctions (pas de boucle), 1 000 fichiers au plus.
- ffmpeg et données OCR vérifiés par empreinte au moment de la compilation.
- Squelette forge-app 7 : carte du code, aucune erreur avalée sans le dire.

## 1.0.0 — 2026-10-07
### Nouveautés
- Première version de SubForge : traduction des sous-titres d'un film, sans toucher à la vidéo.
- Formats SRT, ASS/SSA et WebVTT : minutages, styles, positions et italiques conservés ;
  encodage détecté (UTF-8, UTF-16, Windows-1252) ; option « Toujours SRT ».
- Films MKV, MP4, AVI, MOV, WebM… : pistes de sous-titres listées (langue, titre, forcés,
  malentendants) et traduites directement (ffmpeg intégré, rien à installer).
- Deux moteurs : DeepL (clé chiffrée par Windows, quota affiché, ton formel/familier) et IA
  locale hors ligne via Ollama (liste des modèles installés, test).
- Plusieurs fichiers à la fois, progression, Annuler, aperçu original/traduction, nom de sortie
  reconnu par les lecteurs (Film.fr.srt), jamais d'écrasement.

### Sécurité
- Application isolée (sandbox, liste blanche des échanges internes, politique de contenu stricte).
- Exécutable verrouillé (Electron fuses).
- ffmpeg lancé sans shell (un nom de fichier piégé n'exécute rien), empreinte du binaire vérifiée.
- Clé DeepL jamais affichée, jamais écrite en clair ni dans les journaux.
