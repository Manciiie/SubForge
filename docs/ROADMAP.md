# ROADMAP — SubForge

> Une version = un lot de modules ou d'améliorations, chacun avec sa fiche dans `tasks/`.
> La liste numérotée d'améliorations proposée à chaque livraison devient la version suivante.

**Version en cours** : 1.0.0

---

## 1.0.0 — Fonctions essentielles `[~]` (livraison en attente du dépôt GitHub)
**Résultat** : installeur qui marche du premier coup, modules essentiels solides.
| ID | Tâche | Statut |
|---|---|---|
| v1.0-T000 | Projet généré depuis le squelette, lancement vérifié | [x] |
| v1.0-T001 | Module : formats SRT / ASS / VTT (lecture, écriture, encodage, balises) | [x] |
| v1.0-T002 | Module : pistes de sous-titres des vidéos (ffprobe / ffmpeg livrés) | [x] |
| v1.0-T003 | Module : moteurs DeepL + IA locale Ollama, écran « Moteurs » | [x] |
| v1.0-T004 | Module : écran « Traduire » (file, langues, progression, Annuler, aperçu) | [x] |
| v1.0-T099 | Vérifications complètes + livraison | [ ] |

---

## Proposé pour la suite (pas encore validé)
Reprendre ici la liste numérotée envoyée avec la dernière livraison.
1. Remettre la piste traduite dans une copie du film (MKV avec la nouvelle piste, sans ré-encoder)
2. Éditeur de répliques : corriger une traduction à la main avant d'enregistrer
3. Glossaire : noms propres et termes à ne jamais traduire ou à traduire toujours pareil
4. Reconnaissance de texte (OCR) des sous-titres en image PGS/VobSub des Blu-ray
5. Mémoire de traduction : ne jamais repayer DeepL pour une réplique déjà traduite
6. Traduire tout un dossier (séries : saison entière en un clic, avec sous-dossiers)
7. Recherche automatique de sous-titres originaux en ligne quand le film n'en a pas
8. ffmpeg plus récent (7.x) pour les conteneurs exotiques

---

## Historique
| Version | Date | Contenu |
|---|---|---|
| 1.0.0 | 2026-10-07 | SRT/ASS/VTT, pistes MKV/MP4, DeepL + Ollama, file, Annuler, aperçu |

**Statuts** : `[ ]` à faire · `[~]` en cours · `[x]` fait · `[-]` abandonné · `[!]` bloqué
