# PROGRESS — SubForge

> La mémoire entre les sessions. Lu en premier, mis à jour à la fin de chaque session et avant chaque livraison.
> Garder court : 5 dernières sessions en détail, les plus anciennes résumées en une ligne.

## 📍 État actuel
- **Version livrée** : 1.2.2 (2026-10-12)
- **Dépôt** : `Manciiie/SubForge` — dernier envoi : version 1.2.2 (2026-10-12)
- **Testé sur Windows réel** : non (PC non joignable) ; `ffmpeg.exe` 7.1 vérifié sous wine
- **Version en cours** : 1.2.2
- **Prochaine tâche** : — mises à jour automatiques toujours inactives (dépôt -releases + jeton à créer)
- **Ce qui marche** : tout le périmètre 1.0 + glossaire, mémoire, saison, OCR Blu-ray (version compilée comprise), recherche en ligne (faux serveur), ffmpeg 7
- **Fragile / non vérifié** : vrais DeepL / Ollama / OpenSubtitles jamais appelés depuis la session ; OCR testé sur un .sup fabriqué (police DejaVu), pas sur un vrai Blu-ray ; mises à jour automatiques inactives (pas de jeton)

## 🚧 Questions pour moi
- Doublage IA (voix) : niveau 1, 2 ou 3 ? (proposé le 2026-10-11, recommandé : 2)

## 🐞 Bugs connus
| ID | Description (ce que je fais → ce qui se passe) | Gravité | Version | Statut |
|---|---|---|---|---|

Gravité : 🔴 crash / perte de données · 🟠 fonction cassée · 🟡 gênant · ⚪ cosmétique

## 💡 Idées (hors périmètre, à trier)
-

---

## 📓 Journal des sessions

### 2026-10-12 — Version 1.2.2
- **Retour d'usage** : piste française choisie dans le Lecteur Windows → rien ne s'affiche (film d'origine en ASS).
- **Cause** : le Lecteur multimédia / Films et TV n'affichent pas les pistes ASS d'un MKV.
- **Fait** : piste ajoutée au film toujours convertie en SRT (`formats.versSrt`) ; fichier séparé inchangé.
- **Vérifié** : e2e v12 étendu (film ASS → piste fre subrip, texte et minutage) ; minutage vérifié sur film à début non nul.

### 2026-10-12 — Version 1.2.1
- **Retour d'usage** : « la traduction s'est ajoutée à part au lieu d'être générée avec le film ».
- **Fait** : résultat d'une vidéo = un seul fichier `Film.FR.mkv` par défaut (sous-titre temporaire, supprimé après l'ajout ; recopié à côté si l'ajout échoue) ; choix « Résultat (vidéos) » à 3 valeurs (remplace la case `integrer`, ancien réglage ignoré) ; saison : `Episode.FR.mkv` = déjà traduit.
- **Vérifié** : 81 tests, 7 scénarios e2e (dont v12 étendu), CODEMAP 0 point.

### 2026-10-11 — Version 1.2.0
- **Retours d'usage** : modèle Ollama « téléchargé » mais absent d'Ollama (`ollama list` vide) ; moteur resté sur DeepL sans clé ; « Error: » dans les messages ; demande de fusionner .ass et .mkv.
- **Fait** : T201 (ajouter au film), T202 (IA locale simple).
- **Vérifié** : 80 tests, 7 scénarios e2e, scan 0 bloquant.

### 2026-10-10 — Version 1.1.0
- **Fait** : squelette rattrapé (5→7) ; ffmpeg 7.1 ; mémoire de traduction ; glossaire ; saison entière ; OCR Blu-ray ; recherche OpenSubtitles ; installeur 1.1.0.
- **Vérifié** : 76 tests, scan 0 bloquant, CODEMAP 0 point d'attention, 5 scénarios e2e (4 sur la version compilée), 5 scénarios de mise à jour, fuses.
- **Corrigé en route** : OCR cassé dans la version compilée (variantes du moteur exclues) → test d'empaquetage ajouté ; erreur Tesseract (chaîne) affichée sans message → normalisée.
- **Pas vérifié** : Windows réel, services réels.
- **Prochaine étape** : envoi GitHub + publication + livraison dès que les dépôts existent.

### 2026-10-07 — Création
- **Fait** : projet généré, cadrage, modules T001 à T004, installeur Windows 1.0.0 compilé.
- **Vérifié** : 53 tests, scan 0 bloquant, lancement dev + empaqueté, scénario e2e complet (dev, empaqueté, avec faux DeepL), 5 scénarios de mise à jour, fuses.
- **Pas vérifié** : Windows réel, vrais services DeepL/Ollama.
- **Prochaine étape** : dépôts `Manciiie/SubForge` et `SubForge-releases` à créer par moi, puis envoi, publication, livraison.

---

## 🗄️ Historique résumé
-
