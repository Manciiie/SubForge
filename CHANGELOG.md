# Journal des modifications

## 1.10.0 — 2026-10-23
### Optimisations
- Moteurs → « Conseils pour votre carte graphique » : SubForge lit la carte (mémoire vidéo), donne un
  avis sur chaque modèle installé (bon choix, trop gros pour la carte, version plus rapide disponible,
  modèle qui « réfléchit ») et conseille le modèle le plus adapté, avec la commande `ollama pull` à
  copier. Pour une carte de 8 Go : qwen2.5:7b.
- Les modèles qui « réfléchissent » avant de répondre (qwen3, deepseek-r1…) traduisent et relisent
  maintenant sans cette réflexion : beaucoup plus rapide, même résultat pour des sous-titres.
- Réglages d'Ollama en un clic (Windows) : flash attention, mémoire de travail compressée (q8_0) et
  nombre de demandes simultanées accordé à SubForge. « Remettre comme avant » annule. À appliquer en
  redémarrant Ollama.

## 1.9.0 — 2026-10-23
### Optimisations
- IA locale : lots adaptés à la longueur des répliques — jusqu'à 40 répliques courtes par demande au
  lieu de 20, moins pour les longues (case dans Moteurs, cochée par défaut). « Mesurer sur ce PC »
  compare maintenant 1 ou 2 demandes à la fois avec des lots de 20 ou adaptés, et garde le plus rapide.
- Nouveau choix dans « Résultat (vidéos) » : « Film d'origine avec la piste ». La version avec la
  piste traduite remplace l'original, qui part à la corbeille de Windows (récupérable) — plus de
  film en double. La nouvelle version est vérifiée avant ; rien n'est jamais écrasé.
- Un film déjà traduit par SubForge est reconnu (« Déjà traduit ») et n'est retraduit que si vous
  le demandez.

## 1.8.0 — 2026-10-23
### Optimisations
- Saisons à la chaîne : pendant qu'un épisode se traduit, le suivant se prépare (extraction de la
  piste, lecture des images, écoute du son, contexte) et le précédent s'enregistre et s'ajoute à
  sa vidéo. Les traductions restent une à la fois. Gain : 20 à 40 % sur une saison entière.
- Relecture ciblée (case sous « Relecture IA », décochée par défaut) : l'IA ne relit que les scènes
  où une erreur est plausible (pronoms et accords, personnages, expressions, phrases coupées) et
  saute les autres (« Yes. », « Thank you. »). Le bilan dit combien ont été sautées.

## 1.7.0 — 2026-10-23
### Optimisations
- IA locale : chaque fichier réserve la mémoire de travail dont il a besoin (le plus souvent la
  moitié d'avant) ; la même taille sert à la traduction et à la relecture, pour ne jamais
  recharger le modèle en cours de route. Ollama peut ainsi traiter plus de demandes à la fois.
- Modèle gardé chargé tant que SubForge est ouvert (case dans Moteurs, cochée par défaut) : il est
  chargé dès que des fichiers attendent, sans attendre le clic sur « Traduire », et libéré à la
  fermeture de SubForge pour rendre la carte graphique aux autres logiciels.
- Mémoire de traduction lue en arrière-plan à l'ouverture : le premier fichier ne l'attend plus et
  la fenêtre ne se fige jamais pendant cette lecture.

## 1.6.0 — 2026-10-23
### Optimisations
- La synchronisation sur le son du film se fait pendant la traduction, plus avant : 1 à 3 minutes
  gagnées par film de 2 h.
- L'IA locale reçoit plusieurs demandes à la fois (traduction et relecture) : nouveau réglage
  « Demandes simultanées » dans Moteurs (2 par défaut), avec un bouton « Mesurer sur ce PC » qui
  compare 1 et 2 demandes sur 40 répliques et garde la plus rapide.
- La relecture IA commence dès qu'une scène est traduite, sans attendre la fin du film.
- La carte du fichier montre ce qui avance en même temps (« Relecture en parallèle : 3 / 12
  scènes », « Synchronisation en parallèle : 45 % »).

## 1.5.0 — 2026-10-23
### Nouveauté
- Contexte du film : SubForge reconnaît le film ou l'épisode d'après le nom du fichier et récupère
  sur TMDB son résumé et ses personnages, avec leur genre. Le moteur (DeepL ou IA locale) et la
  relecture IA s'en servent pour les accords (« elle est partie »), les noms et le tu/vous.
  - Écran Moteurs : jeton TMDB gratuit (chiffré par Windows), test, case pour l'activer.
  - Carte du fichier : « Film : titre (année) · N personnages » (la liste au survol), avec
    « Changer… » ; film non reconnu → « Choisir le film… » ouvre une recherche TMDB. Le choix vaut
    pour tous les épisodes du même titre dans le dossier ; « Traduire sans contexte » possible.
  - Seuls le titre et l'année lus dans le nom du fichier sont envoyés à TMDB.

## 1.4.0 — 2026-10-14
### Nouveautés
- Relecture par l'IA : après la traduction, l'IA locale relit le film scène par scène et corrige
  contresens, genre des personnages, noms, tu/vous, phrases coupées sur deux sous-titres. Chaque
  correction est contrôlée avant d'être gardée ; les doutes sont signalés. Marche aussi quand DeepL
  traduit, dès qu'un modèle Ollama est choisi. L'aperçu montre en couleur les répliques corrigées
  et à vérifier, avec la raison, et peut n'afficher qu'elles.
- Synchronisation automatique : un sous-titre posé à côté de son film (ou téléchargé) est recalé
  sur le son du film avant d'être traduit — décalage jusqu'à 5 minutes et différence de vitesse
  (23,976 / 24 / 25 images par seconde). Rien n'est touché si la correspondance n'est pas nette.
- Tu ou vous constant : Automatique (cohérent), Toujours « tu » ou Toujours « vous », pour le
  français, l'allemand, l'espagnol, l'italien, le portugais, le néerlandais, le polonais et le russe.

### Changement
- Un sous-titre posé à côté de sa vidéo (Film.en.srt + Film.mkv) donne maintenant lui aussi le film
  avec la piste traduite (Film.FR.mkv), selon le réglage « Résultat (vidéos) ».

## 1.3.0 — 2026-10-13
### Nouveautés
- Expressions traduites par leur sens : idiomes, argot et tournures toutes faites ne sont plus
  traduits mot à mot (« Break a leg! » → « Merde ! », pas « Casse-toi une jambe ! »).
  - 110 expressions anglaises courantes intégrées (formes conjuguées reconnues : spill / spilled /
    spilling the beans), avec leur sens et un équivalent français ; pour une autre langue
    d'arrivée, le moteur part du sens.
  - Vos propres expressions, dans n'importe quelle langue : sens, équivalent voulu, langues ;
    joker `*` (un à trois mots) et formes au choix (`make|made * day`).
  - Nouvel écran « Expressions » : tester une phrase, gérer vos expressions, activer ou désactiver
    la liste intégrée (en entier ou une par une).
  - Fonctionne avec DeepL (le sens passe dans le contexte, non facturé) et avec l'IA locale ; la
    carte du fichier indique les expressions adaptées.
  - L'IA locale reçoit aussi une consigne générale : argot, dictons et jeux de mots traduits par
    une tournure naturelle de même sens et même ton.

## 1.2.3 — 2026-10-12
### Corrections
- IA locale : la piste « Français » pouvait contenir le texte anglais d'origine. Certains modèles
  Ollama recopiaient la demande au lieu de la traduire, et SubForge l'acceptait. Désormais :
  - la demande est envoyée sous une forme que le modèle ne peut plus recopier telle quelle ;
  - une réplique renvoyée sans traduction (ou écrite dans une autre langue, comme du chinois) est
    redemandée ;
  - si le modèle ne traduit vraiment pas, SubForge s'arrête avec un message clair (et conseille un
    autre modèle) au lieu de créer un film avec une piste « Français » en anglais ;
  - les fausses traductions déjà gardées dans la mémoire de traduction sont ignorées et refaites.

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
