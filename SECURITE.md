# Rapport de sécurité — SubForge 1.1.0

Date : 2026-10-10

## Contrôles effectués
| Contrôle | Résultat |
|---|---|
| Tests (`npm test`) | 76 tests, 0 échec (dont OCR réel, MKV réel au nom piégé, faux serveurs DeepL / Ollama / OpenSubtitles, secrets) |
| Scan statique (`npm run securite -- --complet`) | 0 bloquant, 0 avertissement ; 6 constats electronegativity justifiés |
| Dépendances (`npm audit --omit=dev`) | 0 vulnérabilité haute ou critique |
| Lancement de la version compilée (Linux empaquetée) | OK + scénarios traduction, saison, glossaire/mémoire et Blu-ray (OCR) complets sur la version compilée ; recherche en ligne en développement (faux serveur) |
| Mises à jour (`tester-maj.js`) | 5 scénarios sur 5 |
| Lancement sur Windows réel (`verifier-windows.ps1`) | **Non testé** : PC non joignable pendant la session. `ffmpeg.exe` 7.1 vérifié sous wine (lecture des pistes) |
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
- **OpenSubtitles** : clé d'API et mot de passe au coffre DPAPI, jamais renvoyés à l'interface ni
  journalisés ; la clé n'est envoyée qu'à l'API, jamais au lien de téléchargement ; lien accepté
  seulement en HTTPS chez opensubtitles.com/.org ; fichier reçu limité à 20 Mo, refusé s'il est
  vide, compressé ou dans un zip, relu comme vrai sous-titre puis réécrit en UTF-8, sans écraser.
- **TMDB (contexte du film)** : jeton au coffre DPAPI, jamais renvoyé à l'interface ni journalisé ;
  jeton v4 en en-tête `Authorization`, clé v3 en paramètre HTTPS (seule forme acceptée par TMDB, jamais
  journalisée) ; redirections refusées ; réponses ≤ 2 Mo ; textes reçus nettoyés (caractères de
  contrôle) et coupés avant d'être donnés aux moteurs ; adresse de test seulement hors version installée.
- **Remplacement du film d'origine (1.9, option)** : jamais d'effacement définitif ; l'original va à la
  corbeille de Windows (`shell.trashItem`), seulement après écriture complète et vérification de la
  nouvelle version (durée, pistes) ; rien n'est écrasé si le nom final existe déjà ; confirmation
  explicite au choix de l'option ; dossier de « corbeille » de test seulement hors version installée.
- **OCR** : données de langue livrées (aucun téléchargement au premier lancement), images limitées
  à 4096 px, piste .sup limitée à 200 Mo, segments abîmés comptés et annoncés.
- **Dossiers** : liens symboliques et jonctions jamais suivis, profondeur 6, 1 000 fichiers au plus.
- **Glossaire / mémoire** : fichiers locaux écrits de façon atomique ; glossaire abîmé mis de côté,
  jamais écrasé ; caractères `< > { }` refusés dans le glossaire.
- **Réseau** : `net.fetch` avec délais ; réponses bornées à 8 Mo et validées ; IA locale en HTTP
  seulement vers ce PC ou le réseau local, sinon HTTPS ; l'adresse DeepL de test n'existe que
  hors version installée.
- **Affichage** : sous-titres et noms de fichiers toujours en `textContent` ; « Ouvrir le dossier »
  limité aux fichiers produits par SubForge.

## Points restants / exceptions justifiées
- `http://127.0.0.1:11434` (Ollama) : adresse locale par définition, HTTP accepté uniquement en local.
- ffmpeg 7.1 tiré de la wheel PyPI `imageio-ffmpeg` (empreinte figée) faute de source npm récente
  fiable et de GitHub joignable au moment du build (D-007).
- Le contexte du film envoie à TMDB le titre et l'année lus dans le nom du fichier (dit dans Moteurs).
- La recherche OpenSubtitles envoie l'empreinte du fichier et le titre lu dans son nom (dit dans Moteurs).
- Le texte des sous-titres part chez DeepL quand ce moteur est choisi (dit dans l'interface).
