# SubForge

Traducteur de sous-titres de films

## Installer
1. Lancer `SubForge-Setup-<version>.exe`.
   - Si l'installeur est livré en plusieurs parties : mettre toutes les parties et `reassembler-SubForge.bat` dans le même dossier, double-cliquer sur le `.bat`, puis lancer l'installeur reconstitué.
2. Windows SmartScreen peut afficher « Windows a protégé votre ordinateur » : l'exécutable n'est pas signé. Cliquer sur « Informations complémentaires » puis « Exécuter quand même ».
3. Vérifier l'empreinte (facultatif) : `certutil -hashfile SubForge-Setup-<version>.exe SHA256` doit donner la valeur de `SHA256.txt`.

## Utiliser
1. **Moteurs** : collez votre clé DeepL (gratuite sur deepl.com → API), ou réglez l'IA locale
   (Ollama installé + un modèle, par exemple `ollama pull qwen2.5:7b`).
2. **Traduire** : glissez des fichiers `.srt`, `.ass`, `.ssa`, `.vtt` ou des films `.mkv`, `.mp4`…
   Pour un film, choisissez la piste de sous-titres (les pistes en image PGS/VobSub ne sont pas
   traduisibles). Choisissez les langues et le moteur, puis **Traduire tout**.
3. Le fichier traduit est enregistré à côté du film : `Film.fr.srt` (jamais d'écrasement :
   `Film.fr (2).srt` si besoin). VLC, MPC, Plex ou Kodi le trouvent tout seuls. La vidéo n'est
   jamais modifiée.

Les paramètres (thème, couleur d'accent, accélération matérielle) sont dans **Paramètres**.
En cas de problème : **Paramètres → Ouvrir le dossier des journaux** (`%APPDATA%\SubForge\logs`).

## Mises à jour
Au démarrage, l'application vérifie s'il existe une version plus récente et **demande avant de
télécharger**. Une fois téléchargée et vérifiée, elle s'installe avec « Redémarrer maintenant »
ou à la fermeture. Réglage : **Paramètres → Mises à jour**. Les versions sont publiées sur le
dépôt privé `Manciiie/SubForge-releases`.

## Compiler depuis le code source
```bash
npm install
npm test                 # tests de sécurité
npm run securite         # scan de sécurité
npm start                # lancer en développement
npm run build            # installeur Windows dans dist/ (FORGE_MAJ_JETON=… au premier build)
node scripts/livrer.js   # dossier de livraison (empreinte, découpage, zip source)
bash scripts/pousser-github.sh "chore: version <version>"   # obligatoire avant toute livraison
npm run publier          # publie la version pour les mises à jour automatiques
```
