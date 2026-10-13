# ROADMAP — SubForge

> Une version = un lot de modules ou d'améliorations, chacun avec sa fiche dans `tasks/`.
> La liste numérotée d'améliorations proposée à chaque livraison devient la version suivante.

**Version en cours** : 1.4.0

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

## 1.1.0 — Glossaire, mémoire, saisons, OCR Blu-ray, recherche en ligne, ffmpeg 7 `[x]`
**Résultat** : demandés le 2026-10-10 (points 3 à 8 de la liste proposée).
| ID | Tâche | Statut |
|---|---|---|
| v1.1-T100 | Rattrapage du squelette 5 → 7 (CODEMAP, cas limites, pas d'échec silencieux) | [x] |
| v1.1-T101 | ffmpeg 7.1 (source PyPI imageio-ffmpeg, empreinte figée) | [x] |
| v1.1-T102 | Mémoire de traduction | [x] |
| v1.1-T103 | Glossaire (écran Glossaire) | [x] |
| v1.1-T104 | Saison entière : dossiers et sous-dossiers | [x] |
| v1.1-T105 | OCR des sous-titres Blu-ray (PGS) | [x] |
| v1.1-T106 | Recherche de sous-titres en ligne (OpenSubtitles) | [x] |
| v1.1-T107 | Recherche en ligne automatique pour toute une saison | [x] |
| v1.1-T199 | Vérifications complètes + livraison | [x] |

---

## 1.2.0 — Piste traduite dans le film, IA locale plus simple `[x]`
**Résultat** : demandés le 2026-10-11 (point 1 de la liste + retours d'usage avec Ollama).
| ID | Tâche | Statut |
|---|---|---|
| v1.2-T201 | Ajouter la piste traduite au film (copie MKV, sans réencoder) | [x] |
| v1.2-T202 | IA locale : bascule automatique, modèle choisi seul, messages clairs | [x] |
| v1.2-T299 | Vérifications complètes + livraison | [x] |

---

## 1.3.0 — Expressions traduites par leur sens `[x]`
**Résultat** : demandé le 2026-10-13 (« interpréter certains mots ou groupes de mots, adaptés à la langue »).
| ID | Tâche | Statut |
|---|---|---|
| v1.3-T301 | Expressions (idiomes, argot) : liste intégrée anglaise + expressions perso, sens envoyé au moteur | [x] |

---

## 1.4.0 — Relecture IA, synchronisation, tu/vous constant `[x]`
**Résultat** : demandés le 2026-10-14 (points 1, 2 et 5 de la liste proposée).
| ID | Tâche | Statut |
|---|---|---|
| v1.4-T401 | Tutoiement ou vouvoiement constant | [x] |
| v1.4-T402 | Relecture par l'IA (scène par scène) | [x] |
| v1.4-T403 | Synchronisation automatique sur le son du film | [x] |

---

## Proposé pour la suite (pas encore validé)
Reprendre ici la liste numérotée envoyée avec la dernière livraison.
2. Éditeur de répliques : corriger une traduction (ou un texte lu par OCR) à la main avant d'enregistrer
3. OCR des sous-titres de DVD (VobSub) et de TNT (DVB)
4. Glossaire par série : un glossaire différent selon le dossier
5. Vérifier la longueur des lignes traduites (lisibilité : 42 caractères par ligne, vitesse de lecture)


---

## Historique
| Version | Date | Contenu |
|---|---|---|
| 1.0.0 | 2026-10-07 | SRT/ASS/VTT, pistes MKV/MP4, DeepL + Ollama, file, Annuler, aperçu (jamais livrée) |
| 1.2.0 | 2026-10-11 | Piste traduite ajoutée au film (MKV), IA locale sans manipulation |
| 1.4.0 | 2026-10-14 | Relecture IA, synchronisation sur le son, tu/vous constant |
| 1.3.0 | 2026-10-13 | Expressions traduites par leur sens (écran Expressions) ; 1.2.1–1.2.3 : un seul fichier film, piste SRT, IA locale qui recopiait |
| 1.1.0 | 2026-10-10 | Glossaire, mémoire, saison, OCR Blu-ray, OpenSubtitles (film + saison auto), ffmpeg 7.1 |

**Statuts** : `[ ]` à faire · `[~]` en cours · `[x]` fait · `[-]` abandonné · `[!]` bloqué
