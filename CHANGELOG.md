# Journal des modifications

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
  reconnu par les lecteurs (`Film.fr.srt`), jamais d'écrasement.

### Sécurité
- Application isolée (sandbox, liste blanche des échanges internes, politique de contenu stricte).
- Exécutable verrouillé (Electron fuses).
- ffmpeg lancé sans shell (un nom de fichier piégé n'exécute rien), empreinte du binaire vérifiée.
- Clé DeepL jamais affichée, jamais écrite en clair ni dans les journaux.
