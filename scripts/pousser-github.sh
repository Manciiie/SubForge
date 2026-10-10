#!/usr/bin/env bash
# Envoie le logiciel sur son dépôt privé GitHub Manciiie/<Nom> : prépare git au besoin,
# refuse les fichiers interdits et les secrets, commit puis push sur main.
#   bash scripts/pousser-github.sh "feat(extraction): reprise des archives interrompues"
# Le dépôt doit exister (je le crée moi-même) et être ajouté à la session par Claude avant.
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RACINE"
MESSAGE="${1:-}"
if [ -z "$MESSAGE" ]; then echo "Usage : bash scripts/pousser-github.sh \"message du commit\"" >&2; exit 2; fi

NOM="$(node -e "const p=require('./package.json');process.stdout.write(p.build?.productName||p.productName||p.name)")"
URL="https://github.com/Manciiie/${NOM}"

# 1. Préparer le dépôt local.
if [ ! -d .git ]; then git init -q -b main; fi
git config user.name >/dev/null 2>&1 || git config user.name "Manciiie"
git config user.email >/dev/null 2>&1 || git config user.email "Manciiie@users.noreply.github.com"
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$URL"
fi
ACTUEL="$(git remote get-url origin)"
case "$ACTUEL" in
  *"github.com/Manciiie/${NOM}"|*"github.com/Manciiie/${NOM}.git") ;;
  /*|file://*) ;;  # dépôt local (tests de la skill)
  *) echo "ERREUR : origin pointe vers $ACTUEL, attendu $URL" >&2; exit 1 ;;
esac

# 2. Carte du code (CODEMAP.md) régénérée : chaque commit porte une carte à jour,
#    c'est elle que Claude lit en premier pour ne pas ouvrir tous les fichiers.
if [ -f scripts/codemap.py ]; then
  if command -v python3 >/dev/null 2>&1; then
    python3 scripts/codemap.py . || echo "Avertissement : CODEMAP.md non régénéré." >&2
  else
    echo "Avertissement : python3 absent, CODEMAP.md non régénéré." >&2
  fi
fi

# 3. Préparer le commit et refuser ce qui ne doit jamais partir.
git add -A
INTERDITS="$(git diff --cached --name-only | grep -E '(^|/)(node_modules|dist|livraison|captures[^/]*)/|(^|/)\.env($|\.)|\.log$|(^|/)secrets\.dat$|\.(pfx|p12|pem|key)$' || true)"
if [ -n "$INTERDITS" ]; then
  echo "ERREUR : fichiers interdits dans le commit (vérifier .gitignore) :" >&2
  echo "$INTERDITS" | head -20 >&2
  git reset -q
  exit 1
fi
# Les tests de sécurité contiennent volontairement de fausses clés : tests/ est exclu.
SECRETS="$(git diff --cached -U0 -- . ':(exclude)tests/**' | grep -E '^\+' | grep -v 'securite-ok' | grep -nE 'BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}' || true)"
if [ -n "$SECRETS" ]; then
  echo "ERREUR : ce qui ressemble à un secret est sur le point d'être envoyé :" >&2
  echo "$SECRETS" | cut -c1-120 | head -10 >&2
  git reset -q
  exit 1
fi

if git diff --cached --quiet; then
  echo "Rien de nouveau à committer."
else
  git commit -q -m "$MESSAGE"
fi
if ! git rev-parse -q --verify HEAD >/dev/null; then echo "ERREUR : aucun commit à envoyer." >&2; exit 1; fi

# 4. Ne jamais écraser ce qui est déjà sur GitHub.
if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
  git fetch -q origin main
  if ! git merge-base --is-ancestor FETCH_HEAD HEAD; then
    echo "ERREUR : le dépôt GitHub contient des commits absents d'ici." >&2
    echo "Repartir d'un clone du dépôt (ou intégrer ses commits) ; ne jamais forcer l'envoi." >&2
    exit 1
  fi
fi

git push -q -u origin main 2>&1 | grep -vE "push negotiation|expected .acknowledgments" || true
LOCAL="$(git rev-parse HEAD)"
DISTANT="$(git ls-remote origin refs/heads/main | cut -f1)"
if [ "$LOCAL" != "$DISTANT" ]; then
  echo "ERREUR : l'envoi n'a pas abouti (local $LOCAL, GitHub ${DISTANT:-vide})." >&2
  exit 1
fi
echo "Envoyé sur ${URL} : $(git log -1 --format='%h %s')"
