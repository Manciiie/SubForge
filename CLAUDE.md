# CLAUDE.md — SubForge

> Lu au début de chaque session de travail sur ce logiciel. Court : règles + **quoi lire et quand**.
> Code et mémoire (`docs/`) vivent sur le dépôt GitHub privé `Manciiie/SubForge` (obligatoire) ;
> le zip source livré avec chaque version n'est qu'une sauvegarde.

## Le logiciel
- **Quoi** : SubForge — Traducteur de sous-titres de films
- **Pour qui** : usage perso sur mon PC Windows. Je ne compile pas et je ne lance aucun script :
  je reçois un installeur `.exe` qui doit marcher du premier coup.
- **Stack** : Electron + JavaScript sans framework (voir `docs/DECISIONS.md`).
- **Langue** : tout en français — interface, erreurs, installeur, commentaires.

## 📚 Quoi lire, et quand
| Situation | Lire |
|---|---|
| **Début de chaque session** | `CODEMAP.md` (carte du code), puis `docs/PROGRESS.md` (version, état, prochaine tâche, bugs connus) |
| Avant d'ouvrir un fichier de code | Le chercher dans `CODEMAP.md` et ne lire que les lignes utiles (Read avec offset/limit) |
| Avant de coder une tâche | `docs/tasks/<ID>.md` |
| Nouvelle version ou doute sur le besoin | `docs/SPEC.md` puis `docs/ROADMAP.md` |
| Nouveau module, fichier ou dépendance | `docs/ARCHITECTURE.md` |
| Envie de changer de lib, d'approche ou de structure | `docs/DECISIONS.md` **d'abord** |
| Module qui extrait, exécute, efface, stocke un secret, touche au réseau ou au SQL | `SECURITE.md` + la référence sécurité de la skill forge-app |

Ne pas tout lire d'un coup : seulement ce dont la tâche a besoin.

**`CODEMAP.md`** est généré par `scripts/codemap.py` (jamais modifié à la main) : chaque fichier
avec son rôle, ses fonctions, canaux IPC, API du preload et écrans, **avec leur numéro de ligne**,
puis les liens entre fichiers et les « points d'attention » (canal traité mais absent de la liste
blanche, canal autorisé mais traité nulle part, `window.forge.x()` non exposé, `ipcMain` direct).
Absent ou douteux : `python3 scripts/codemap.py .` (moins d'une seconde). Il est régénéré
automatiquement par `pousser-github.sh` à chaque commit.

## 🛠️ Commandes
```bash
npm install
npm start                                  # lancer en développement
python3 scripts/codemap.py .               # CODEMAP.md : carte du code + points d'attention
npm test                                   # tests sécurité + cohérence IPC : 0 échec
node scripts/scan-securite.js --complet    # 0 bloquant
node scripts/verifier-lancement.js         # démarre sans erreur console
node scripts/piloter.js                    # scénarios tests/e2e/ + captures sombre/clair
node scripts/tester-maj.js                 # mises à jour : 5 scénarios dans l'interface réelle
npm run build                              # installeur (FORGE_MAJ_JETON=… au premier build seulement)
node scripts/livrer.js                     # livraison/<version>/ : exe, SHA256, zip source
npm run publier                            # release sur Manciiie/SubForge-releases (après le push du code)
bash scripts/pousser-github.sh "feat(module): …"   # commit + push sur Manciiie/SubForge (bloque secrets et fichiers interdits)
# Sur mon PC Windows (via le shell du PC, jamais l'installeur) :
# powershell -NoProfile -ExecutionPolicy Bypass -File verifier-windows.ps1 -Exe <win-unpacked>\SubForge.exe
```

## 🔁 Workflow pour chaque tâche
1. Lire `CODEMAP.md` et `docs/PROGRESS.md`, puis la fiche `docs/tasks/<ID>.md`.
2. Fiche floue ou contradictoire avec `SPEC.md` → s'arrêter et poser **une** question, sans deviner.
3. Remplir la section « Cas limites » de la fiche (liste de la skill forge-app) **avant** de coder.
   Coder **uniquement** le périmètre de la fiche. Idée hors périmètre → `PROGRESS.md › Idées`.
4. Un module = `src/main/services/<module>.js` + canaux via `canal()` (jamais `ipcMain.handle`
   direct) + fonction exposée dans le preload + bouton de navigation + un écran.
5. Ajouter les cas de `tests/securite/` si le module extrait, exécute, efface ou stocke un secret,
   et un scénario `tests/e2e/<module>.js` avec de vrais fichiers d'exemple.
6. `codemap.py` (0 point d'attention) + `npm test` + `scan-securite.js` + `verifier-lancement.js` + `piloter.js`, puis **regarder les captures**.
7. Vérifier chaque critère d'acceptation de la fiche, un par un.
8. Cocher la fiche, la ligne de `ROADMAP.md`, et mettre à jour `PROGRESS.md`
   (et `ARCHITECTURE.md` si un module ou un canal a été ajouté).
9. `bash scripts/pousser-github.sh "feat(module): …"` : un commit par fiche, en français, poussé
   aussitôt. Si le script refuse (secret, fichier interdit, commits absents d'ici), corriger la
   cause : jamais de contournement ni d'envoi forcé.

Un bug signalé avec un rapport « Signaler un problème » (Paramètres) : partir de ce rapport
(version, système, erreurs du journal) pour reproduire avant de corriger.

## ✅ Definition of Done
- [ ] Critères d'acceptation vérifiés dans l'interface réelle (pas seulement « ça compile »)
- [ ] Tests, scan sécurité, vérification de lancement : tout passe
- [ ] `CODEMAP.md` régénéré, section « Points d'attention » vide (ou chaque point justifié)
- [ ] Captures sombre et clair regardées : pas de texte coupé, d'écran vide ni de contraste illisible
- [ ] Erreurs gérées avec un message français clair, progression + Annuler si > 1 s
- [ ] `PROGRESS.md` à jour

## 🔒 Règle absolue : GitHub
Toute modification — même une ligne — est commitée et poussée sur `Manciiie/SubForge` avec
`bash scripts/pousser-github.sh`. Rien n'est livré ni annoncé terminé tant que ce script n'a pas
affiché « Envoyé sur … ». Dépôt absent ou inaccessible : on s'arrête avant la livraison.

## 🚫 Interdits
- `innerHTML` avec des données → `textContent` ou `UI.el`.
- Erreur avalée (`catch {}`, `.catch(() => {})`, liste vide renvoyée sans le dire) → journaliser
  avec contexte + message français, ou relancer. Exception voulue : `silence-ok: raison`.
- Annoncer « Terminé » après un traitement partiel → « X sur Y, Z erreurs ».
- Traitement long dans l'interface → processus principal, `utilityProcess` ou binaire.
- Commande système via un shell → `execFile` sans shell.
- Nouvelle dépendance sans entrée dans `docs/DECISIONS.md`.
- Désactiver un test ou un contrôle de sécurité pour « faire passer » ; une exception
  `// securite-ok: raison` seulement si la raison est réelle.
- Reconstruire de zéro, renommer ou casser les paramètres existants (migration `versionFormat`).
- Dire « ça devrait marcher » : soit c'est vérifié, soit je dis ce qui ne l'a pas été.
- `git push --force`, réécrire l'historique, committer `node_modules/`, `dist/`, `livraison/` ou un secret.
