# Journal des modifications

## 1.2.2 — 2026-10-12
### Corrections
- Sous-titres français invisibles dans le Lecteur multimédia de Windows / Films et TV quand le
  film d'origine avait des sous-titres ASS : la piste ajoutée au film est maintenant toujours en
  SRT, lue par tous les lecteurs (italique, gras et souligné gardés). Le format ASS reste
  disponible pour le fichier séparé.

## 1.2.1 — 2026-10-12
### Changements
- Traduire un film donne maintenant **un seul fichier** : le film avec la piste traduite
  (Film.FR.mkv), sans fichier de sous-titres séparé à côté. C'est le réglage par défaut.
- La case « Ajouter au film » devient un choix « Résultat (vidéos) » : film avec la piste
  traduite / film + fichier de sous-titres / fichier de sous-titres seul.
- Si l'ajout au film échoue (disque plein…), la traduction est enregistrée à part : rien n'est perdu.
- Saison : un épisode qui a déjà son « Episode.FR.mkv » est reconnu comme déjà traduit, et ce
  fichier n'est pas repris comme un nouvel épisode.

## 1.2.0 — 2026-10-11
### Nouveautés
- Ajouter au film : une case dans Traduire crée une copie du film (Film.FR.mkv) qui contient la
  piste traduite, nommée « Français » et choisie par défaut, à côté des pistes d'origine. Sans
  réencoder (une à deux minutes, aucune perte de qualité) ; le film d'origine n'est pas modifié ;
  les MP4 et autres formats donnent aussi une copie .mkv ; place disque vérifiée avant ; Annuler.

### Améliorations (IA locale)
- Sans clé DeepL, SubForge passe tout seul sur l'IA locale dès qu'un modèle Ollama est prêt.
- Le modèle Ollama est choisi automatiquement quand il n'y en a qu'un.
- La liste des modèles se met à jour à chaque ouverture de l'écran Moteurs.
- Message clair quand Ollama n'a aucun modèle, avec la commande à taper.

### Corrections
- Les messages d'erreur ne commencent plus par « Error: ».

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
- Recherche en ligne automatique pour toute une saison : un bouton « Chercher en ligne (N sans
  sous-titres) » télécharge seul les sous-titres sûrs (empreinte identique, même saison et même
  épisode, ou même titre pour un film), jamais une traduction automatique ; les cas douteux restent
  à choisir à la main ; arrêt possible, arrêt propre si le quota du jour est atteint, bilan final.
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
