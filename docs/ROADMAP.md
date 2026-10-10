# ROADMAP — SubForge

> Une version = un lot de modules ou d'améliorations, chacun avec sa fiche dans `tasks/`.
> La liste numérotée d'améliorations proposée à chaque livraison devient la version suivante.

**Version en cours** : 1.1.0

---

## 1.0.0 — Fonctions essentielles `[x]` (compilée, jamais livrée : dépôt GitHub absent ; remplacée par la 1.1.0)
**Résultat** : installeur qui marche du premier coup, modules essentiels solides.
| ID | Tâche | Statut |
|---|---|---|
| v1.0-T000 | Projet généré depuis le squelette, lancement vérifié | [x] |
| v1.0-T001 | Module : formats SRT / ASS / VTT (lecture, écriture, encodage, balises) | [x] |
| v1.0-T002 | Module : pistes de sous-titres des vidéos (ffprobe / ffmpeg livrés) | [x] |
| v1.0-T003 | Module : moteurs DeepL + IA locale Ollama, écran « Moteurs » | [x] |
| v1.0-T004 | Module : écran « Traduire » (file, langues, progression, Annuler, aperçu) | [x] |
| v1.0-T099 | Vérifications complètes + livraison | [-] fusionnée dans v1.1-T199 |

---

## 1.1.0 — Glossaire, mémoire, saisons, OCR Blu-ray, recherche en ligne, ffmpeg 7 `[~]`
**Résultat** : demandés le 2026-10-10 (points 3 à 8 de la liste proposée).
| ID | Tâche | Statut |
|---|---|---|
| v1.1-T100 | Rattrapage du squelette 5 → 7 (CODEMAP, cas limites, pas d'échec silencieux) | [x] |
| v1.1-T101 | ffmpeg 7.1 (source PyPI imageio-ffmpeg, empreinte figée) | [x] |
| v1.1-T102 | Mémoire de traduction | [x] |
| v1.1-T103 | Glossaire (écran Glossaire) | [x] |
| v1.1-T104 | Saison entière : dossiers et sous-dossiers | [x] |
| v1.1-T105 | OCR des sous-titres Blu-ray (PGS) | [x] |
| v1.1-T106 | Recherche de sous-titres en ligne (OpenSubtitles) | [ ] |
| v1.1-T199 | Vérifications complètes + livraison | [ ] |

---

## Proposé pour la suite (pas encore validé)
Reprendre ici la liste numérotée envoyée avec la dernière livraison.
1. Remettre la piste traduite dans une copie du film (MKV avec la nouvelle piste, sans ré-encoder)
2. Éditeur de répliques : corriger une traduction à la main avant d'enregistrer
(3 à 8 : pris dans la 1.1.0)

---

## Historique
| Version | Date | Contenu |
|---|---|---|
| 1.0.0 | 2026-10-07 | SRT/ASS/VTT, pistes MKV/MP4, DeepL + Ollama, file, Annuler, aperçu |

**Statuts** : `[ ]` à faire · `[~]` en cours · `[x]` fait · `[-]` abandonné · `[!]` bloqué
