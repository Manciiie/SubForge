# [v1.0-T001] — Module : [nom]

**Version** : 1.0.0 · **Statut** : `[ ]` · **Dépend de** : —

## Objectif
Ce que je peux faire dans SubForge une fois la tâche finie, en une phrase.

## Périmètre
**Inclus** :
-
**Exclu** (ne pas toucher) :
-

## Implémentation
- **Service** : `src/main/services/<module>.js`
- **Canaux IPC** (`canal()`) : `<module>:…` — arguments validés :
- **Preload** : fonction exposée
- **Écran** : bouton de navigation + écran `<module>`
- **Long (> 1 s) ?** : progression + Annuler, traitement hors interface
- **Protections** (`SECURITE.md` / référence sécurité) : zip slip · bombes · `execFile` sans shell ·
  double confirmation · disque système exclu · secrets au coffre · réseau · SQL — garder ce qui s'applique

## Cas limites (avant de coder)
Choisis dans la liste de la skill (entrées, système, utilisateur, volume, réseau, interruption)
ceux qui concernent ce module, avec le comportement attendu :
- … → …

## Critères d'acceptation
- [ ] Quand je fais X dans l'écran, alors Y (vérifié sur le disque, pas seulement à l'écran)
- [ ] Erreur Z → message français clair, pas de crash
- [ ] Chaque cas limite ci-dessus vérifié (test ou scénario e2e), résultat partiel annoncé comme tel
- [ ] Aucune erreur avalée : `CODEMAP.md` sans « échec silencieux » (ou `silence-ok: raison`)
- [ ] Rendu correct en thème sombre et clair

## Vérification
- `tests/securite/…` : cas piégés ajoutés (si extraction, exécution, effacement ou secret)
- `tests/e2e/<module>.js` : scénario avec vrais fichiers dans `p.dossierTemp`
- `npm test` · `scan-securite.js --complet` · `verifier-lancement.js` · `piloter.js` + captures regardées

---
## Compte rendu (à la fin)
- **Fait** :
- **Vérifié** :
- **Écarts par rapport à la fiche** :
