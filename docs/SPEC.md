# SPEC — SubForge

> Le **quoi** et le **pourquoi** (le **comment** est dans `ARCHITECTURE.md`).
> Rempli au cadrage, complété à chaque nouvelle version.

**Créé le** : 2026-10-07 · **Équivalent de** : Subtitle Edit (« Traduire automatiquement »), sans la lourdeur

## 1. En une phrase
SubForge traduit les sous-titres d'un film d'une langue à une autre — fichier `.srt`, `.ass`,
`.vtt` ou piste de sous-titres intégrée à la vidéo — sans toucher à la vidéo, en gardant le
minutage et la mise en forme, et range le résultat à côté du film sous un nom que les lecteurs
reconnaissent tout seuls (`Film.fr.srt`).

## 2. Pourquoi pas le logiciel existant
Subtitle Edit fait tout mais l'écran de traduction est caché, en anglais, et il faut d'abord
extraire la piste soi-même. Les sites en ligne limitent la taille, mettent des pubs et envoient le
fichier on ne sait où. Je veux : glisser le film ou le sous-titre, choisir la langue, cliquer.

## 3. Modules

| Module | Ce qu'il fait | Version | Fiche |
|---|---|---|---|
| Formats | Lire/écrire SRT, ASS/SSA, WebVTT ; encodage détecté ; balises protégées | 1.0.0 | `tasks/v1.0-T001.md` |
| Pistes vidéo | Lister et extraire les pistes texte d'un MKV/MP4/AVI/MOV/WebM (ffmpeg livré) | 1.0.0 | `tasks/v1.0-T002.md` |
| Moteurs | DeepL (clé API) et IA locale hors ligne (Ollama) ; écran « Moteurs » | 1.0.0 | `tasks/v1.0-T003.md` |
| Traduction | Écran principal : dépôt, choix des langues, file d'attente, progression, Annuler, aperçu | 1.0.0 | `tasks/v1.0-T004.md` |

### Comportements attendus
- Je glisse `Film.en.srt` → choisi « Anglais → Français », DeepL → `Film.fr.srt` apparaît à côté,
  mêmes minutages, mêmes numéros, italiques conservés.
- Je glisse `Film.mkv` → SubForge liste ses pistes (« Anglais · SubRip · Forcés », « Anglais · PGS
  (image) — non traduisible ») ; je choisis une piste texte → `Film.fr.srt` à côté du film.
  La vidéo n'est jamais modifiée.
- `.ass` traduit reste un `.ass` (styles, positions, karaoké `{\…}` gardés) sauf si je choisis
  « Toujours SRT ».
- Le fichier de sortie n'écrase jamais rien : `Film.fr (2).srt` si `Film.fr.srt` existe.
- Erreurs : clé DeepL refusée → « Clé DeepL refusée : vérifiez-la dans Moteurs. » ; quota épuisé →
  « Quota DeepL du mois épuisé » ; Ollama arrêté → « L'IA locale ne répond pas : lancez Ollama » ;
  piste image → « Sous-titres en image (PGS/VobSub) : pas de texte à traduire ».
- Annuler arrête la traduction en cours sans laisser de fichier à moitié écrit.

## 4. Hors périmètre
- Modifier ou ré-encoder la vidéo, incruster les sous-titres (v1.0).
- Reconnaissance de texte (OCR) des sous-titres en image PGS/VobSub.
- Transcription de l'audio (c'est VoxForge).
- Synchronisation / décalage des minutages.

## 5. Exigences
- **Fichiers manipulés** : sous-titres jusqu'à 20 Mo (refus au-delà), vidéos de toute taille
  (seul ffmpeg les lit, en flux). Écriture atomique (fichier temporaire puis renommage).
- **Actions sur le système** : lance `ffmpeg`/`ffprobe` livrés avec l'app (`spawn` sans shell,
  délai max, tués à l'annulation et à la fermeture). Aucune suppression de fichier utilisateur.
- **Réseau** : DeepL (`api-free.deepl.com` / `api.deepl.com`, HTTPS, clé dans le coffre DPAPI,
  jamais renvoyée à l'interface) ; Ollama local (`http://127.0.0.1:11434` par défaut, HTTP accepté
  uniquement en local/réseau privé). Le texte des sous-titres part chez DeepL : l'écran le dit.
- **Performance** : démarrage < 2 s, interface jamais figée, un film (~1 500 répliques) traduit
  en moins d'une minute avec DeepL.

## 6. Questions ouvertes
- (aucune)
