# Rapport de sécurité — SubForge 1.0.0

Date : 2026-10-07

## Contrôles effectués
| Contrôle | Résultat |
|---|---|
| Tests de sécurité (`npm test`) | 53 tests, 0 échec (dont MKV réel au nom piégé, clé DeepL, faux serveurs) |
| Scan statique (`npm run securite -- --complet`) | 0 bloquant, 0 avertissement ; 6 constats electronegativity justifiés |
| Dépendances (`npm audit --omit=dev`) | 0 vulnérabilité haute ou critique |
| Lancement de la version compilée (Linux empaquetée) | OK + scénario de bout en bout complet (`piloter.js --exe`) |
| Mises à jour (`tester-maj.js`) | 5 scénarios sur 5 |
| Lancement sur Windows réel (`verifier-windows.ps1`) | Non testé sur Windows réel (pas d'accès à un shell sur le PC). `ffmpeg.exe` livré vérifié sous wine : liste et extrait les pistes. |
| Fuses de l'exécutable | RunAsNode, NODE_OPTIONS et --inspect désactivés ; chargement depuis app.asar uniquement |

## Protections en place
- Fenêtre isolée : `contextIsolation`, `sandbox`, pas de Node dans l'interface, DevTools coupés en production.
- Politique de contenu (CSP) stricte, navigation et nouvelles fenêtres bloquées, permissions refusées par défaut.
- Échanges interface ↔ application limités à une liste blanche, arguments validés.
- Secrets chiffrés par Windows (DPAPI), masqués dans les journaux.

## Spécifique à ce logiciel
- **ffmpeg** : livré avec l'app (empreinte SHA-512 du paquet figée), appelé par chemin absolu avec
  `spawn` sans shell : un film nommé `"; touch PIRATE; " & del x | $(id).mkv` n'exécute rien
  (test réel). Délai maximum, processus tués à l'annulation et à la fermeture.
- **Fichiers** : sous-titres limités à 20 Mo ; sorties écrites dans un fichier temporaire puis
  renommées, jamais d'écrasement (`Film.fr (2).srt`) ; la vidéo n'est jamais ouverte en écriture ;
  pistes extraites dans un dossier temporaire privé supprimé ensuite.
- **Clé DeepL** : coffre chiffré par Windows (DPAPI), envoyée seulement dans l'en-tête
  `Authorization` en HTTPS, jamais renvoyée à l'interface (qui n'affiche que `••••`), masquée dans
  les journaux (test : aucune trace sur le disque).
- **Réseau** : `net.fetch` avec délais ; réponses bornées à 8 Mo et validées ; IA locale en HTTP
  seulement vers ce PC ou le réseau local, sinon HTTPS ; l'adresse DeepL de test n'existe que
  hors version installée.
- **Affichage** : sous-titres et noms de fichiers toujours en `textContent` ; « Ouvrir le dossier »
  limité aux fichiers produits par SubForge.

## Points restants / exceptions justifiées
- `http://127.0.0.1:11434` (Ollama) : adresse locale par définition, HTTP accepté uniquement en local.
- ffmpeg 4.1 (2018) : suffisant pour lire/extraire des sous-titres ; il ne lit que des fichiers
  choisis par l'utilisateur. Mise à jour du binaire proposée pour la suite.
- Le texte des sous-titres part chez DeepL quand ce moteur est choisi (dit dans l'interface).
