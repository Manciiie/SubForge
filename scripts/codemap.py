#!/usr/bin/env python3
"""
codemap.py — carte du code (CODEMAP.md) pour lire un projet sans tout ouvrir.

Pour chaque fichier : rôle, nombre de lignes et symboles avec leur numéro de ligne
(fonctions, events, callbacks, exports, commandes, canaux IPC, écrans, tables SQL…).
Puis les liens entre fichiers et les points d'attention (event émis jamais écouté,
canal IPC hors liste blanche, handler réseau qui donne de l'argent, Wait(0)…).

Langages : Lua (FiveM : QBCore, Qbox, ESX, ox_lib), JS/TS (Electron, NUI),
Python (bots Discord / Telegram), HTML, SQL.

Échecs silencieux signalés (catch vide, pcall ignoré, except: pass…). Exception assumée :
commentaire `silence-ok: <raison>` sur la ligne, celle d'avant ou celle d'après.

Usage :
  python3 codemap.py <dossier>                 écrit <dossier>/CODEMAP.md
  python3 codemap.py <dossier> --stdout        affiche sans écrire
  python3 codemap.py <dossier> --verifier      code 1 si CODEMAP.md n'est pas à jour
  python3 codemap.py <dossier> -o carte.md     autre fichier de sortie

Uniquement la bibliothèque standard. La sortie ne contient ni date ni chemin absolu :
elle ne change que si le code change.
"""
from __future__ import annotations

import argparse
import bisect
import fnmatch
import os
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field

VERSION = 3

DOSSIERS_IGNORES = {
    '.git', 'node_modules', 'dist', 'build', 'out', 'livraison', 'release', 'releases',
    '__pycache__', '.venv', 'venv', 'env', '.mypy_cache', '.pytest_cache', '.ruff_cache',
    'stream', 'captures', 'captures-maj', 'coverage', '.idea', '.vscode', 'logs', 'data',
}
EXTENSIONS = {
    '.lua': 'lua', '.js': 'js', '.mjs': 'js', '.cjs': 'js', '.ts': 'js', '.tsx': 'js',
    '.jsx': 'js', '.vue': 'js', '.svelte': 'js', '.py': 'py', '.html': 'html', '.htm': 'html',
    '.sql': 'sql',
}
TAILLE_MAX = 600_000  # au-delà : fichier généré ou minifié, ignoré
NOM_SORTIE = 'CODEMAP.md'


# ─────────────────────────── Nettoyage des commentaires ───────────────────────────

def sans_commentaires(src: str, lang: str, vider_chaines: bool = False) -> str:
    """Remplace les commentaires par des espaces en gardant les retours à la ligne
    (les numéros de ligne restent justes). Les chaînes sont conservées, sauf si
    vider_chaines : leur contenu est alors effacé aussi (les guillemets restent)."""
    if lang not in ('lua', 'js', 'py'):
        return src
    out = list(src)
    i, n = 0, len(src)

    def blanchir(a: int, b: int) -> None:
        for k in range(a, min(b, n)):
            if out[k] != '\n':
                out[k] = ' '

    while i < n:
        c = src[i]
        if lang == 'lua':
            if src.startswith('--', i):
                m = re.match(r'--\[(=*)\[', src[i:])
                if m:
                    fin = src.find(']' + m.group(1) + ']', i)
                    fin = n if fin < 0 else fin + len(m.group(1)) + 2
                else:
                    fin = src.find('\n', i)
                    fin = n if fin < 0 else fin
                blanchir(i, fin)
                i = fin
                continue
            m = re.match(r'\[(=*)\[', src[i:i + 12])
            if m:
                fin = src.find(']' + m.group(1) + ']', i)
                fin = n if fin < 0 else fin + len(m.group(1)) + 2
                if vider_chaines:
                    blanchir(i + len(m.group(0)), fin - len(m.group(1)) - 2)
                i = fin
                continue
        elif lang == 'js':
            if src.startswith('//', i):
                fin = src.find('\n', i)
                fin = n if fin < 0 else fin
                blanchir(i, fin)
                i = fin
                continue
            if src.startswith('/*', i):
                fin = src.find('*/', i + 2)
                fin = n if fin < 0 else fin + 2
                blanchir(i, fin)
                i = fin
                continue
        elif lang == 'py':
            if c == '#':
                fin = src.find('\n', i)
                fin = n if fin < 0 else fin
                blanchir(i, fin)
                i = fin
                continue
            if src.startswith('"""', i) or src.startswith("'''", i):
                fin = src.find(src[i:i + 3], i + 3)
                fin = n if fin < 0 else fin + 3
                if vider_chaines:
                    blanchir(i + 3, fin - 3)
                i = fin
                continue
        if c in '"\'' or (c == '`' and lang == 'js'):
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == '\\':
                    j += 1
                elif src[j] == '\n' and c != '`':
                    break  # chaîne non fermée : on s'arrête à la fin de ligne
                j += 1
            if vider_chaines:
                blanchir(i + 1, j)
            i = j + 1
            continue
        i += 1
    return ''.join(out)


# ─────────────────────────────── Modèle de données ───────────────────────────────

@dataclass
class Fichier:
    chemin: str               # relatif à la racine, séparateur /
    lang: str
    lignes: int
    role: str = ''
    sections: dict = field(default_factory=lambda: defaultdict(list))  # titre -> [(nom, ligne)]
    alertes: list = field(default_factory=list)                         # (ligne, texte)

    def ajouter(self, section: str, nom: str, ligne: int) -> None:
        if (nom, ligne) not in self.sections[section]:
            self.sections[section].append((nom, ligne))


@dataclass
class Lien:
    nom: str
    fichier: str
    ligne: int
    unite: str  # ressource / projet


class Index:
    """Tout ce qui sert aux vérifications croisées."""
    def __init__(self) -> None:
        self.emis = defaultdict(list)        # event -> [Lien]
        self.ecoutes = defaultdict(list)
        self.cb_declares = defaultdict(list)
        self.cb_appeles = defaultdict(list)
        self.nui_lua = defaultdict(list)     # RegisterNUICallback
        self.nui_js = defaultdict(list)      # fetch vers la ressource
        self.nui_actions_lua = defaultdict(list)  # SendNUIMessage action
        self.nui_actions_js = defaultdict(list)   # écouteurs d'action côté JS
        self.exports_fournis = defaultdict(set)   # ressource -> {fonction}
        self.exports_utilises = []           # (ressource, fonction, Lien)
        self.ipc_traites = defaultdict(list)
        self.ipc_liste_blanche = defaultdict(list)
        self.ipc_appeles = defaultdict(list)
        self.ipc_vers_ui = defaultdict(list)
        self.ipc_evenements_ui = defaultdict(list)
        self.api_exposee = {}                # forge.x.y -> Lien
        self.api_utilisee = defaultdict(list)


# ──────────────────────────────── Outils regex ────────────────────────────────

def lignes_de(src: str):
    debuts = [0] + [m.end() for m in re.finditer('\n', src)]
    return lambda pos: bisect.bisect_right(debuts, pos)


S = r"""['"`]([^'"`\n]+?)['"`]"""  # premier argument chaîne


def chercher(motif: str, texte: str, ligne_de, flags=0):
    for m in re.finditer(motif, texte, flags):
        yield m, ligne_de(m.start())


# ─────────────────────────────────── Lua / FiveM ───────────────────────────────────

ARGENT_OBJET = re.compile(
    r'\b(AddMoney|addMoney|addAccountMoney|AddItem|addInventoryItem|GiveItem|giveItem|'
    r'SetMoney|setMoney|setAccountMoney|Bridge\.\w*(?:Ajouter|Donner|Add|Give)\w*)\b')
VALIDATION = re.compile(
    r'#\(?\s*\w*[Cc]oords?|GetEntityCoords|GetPlayerPed|Vdist|distance|Distance|'
    r'\bjob\b|\.job\.|HasItem|hasItem|cooldown|Cooldown|[Ee]n[Cc]ours|onDuty|isBusy')


def analyser_lua(f: Fichier, src: str, idx: Index, unite: str, cote: str) -> None:
    ld = lignes_de(src)
    lien = lambda nom, l: Lien(nom, f.chemin, l, unite)

    for m, l in chercher(r'(?m)^[ \t]*(local[ \t]+)?function[ \t]+([\w.:]+)[ \t]*\(([^)]*)\)', src, ld):
        f.ajouter('fonctions', f"{m.group(2)}({m.group(3).strip()})", l)
    for m, l in chercher(r'(?m)^[ \t]*(?:local[ \t]+)?([\w.:\[\]\'"]+)[ \t]*=[ \t]*function[ \t]*\(([^)]*)\)', src, ld):
        f.ajouter('fonctions', f"{m.group(1)}({m.group(2).strip()})", l)

    for m, l in chercher(r'\b(RegisterNetEvent|RegisterServerEvent|AddEventHandler)\s*\(\s*' + S, src, ld):
        f.ajouter('écoute (events)', m.group(2), l)
        idx.ecoutes[m.group(2)].append(lien(m.group(2), l))
    for m, l in chercher(r'\b(TriggerServerEvent|TriggerLatentServerEvent)\s*\(\s*' + S, src, ld):
        f.ajouter('émet → serveur', m.group(2), l)
        idx.emis[m.group(2)].append(lien(m.group(2), l))
    for m, l in chercher(r'\b(TriggerClientEvent|TriggerLatentClientEvent)\s*\(\s*' + S, src, ld):
        f.ajouter('émet → client', m.group(2), l)
        idx.emis[m.group(2)].append(lien(m.group(2), l))
    for m, l in chercher(r'\bTriggerEvent\s*\(\s*' + S, src, ld):
        f.ajouter('émet (local)', m.group(1), l)
        idx.emis[m.group(1)].append(lien(m.group(1), l))

    for m, l in chercher(r'\b(lib\.callback\.register|QBCore\.Functions\.CreateCallback|'
                         r'ESX\.RegisterServerCallback|Bridge\.\w*Callback\w*)\s*\(\s*' + S, src, ld):
        f.ajouter('callbacks déclarés', m.group(2), l)
        idx.cb_declares[m.group(2)].append(lien(m.group(2), l))
    for m, l in chercher(r'\b(lib\.callback(?:\.await)?|QBCore\.Functions\.TriggerCallback|'
                         r'ESX\.TriggerServerCallback)\s*\(\s*' + S, src, ld):
        if m.group(1) == 'lib.callback' and src[m.end(1):m.end(1) + 9] == '.register':
            continue
        f.ajouter('callbacks appelés', m.group(2), l)
        idx.cb_appeles[m.group(2)].append(lien(m.group(2), l))

    for m, l in chercher(r'\bexports\s*\(\s*' + S, src, ld):
        f.ajouter('exports fournis', m.group(1), l)
        idx.exports_fournis[unite].add(m.group(1))
    for m, l in chercher(r"""\bexports\s*(?:\[\s*['"]([\w-]+)['"]\s*\]|\.([\w_]+))\s*[:.]\s*(\w+)""", src, ld):
        res, fn = m.group(1) or m.group(2), m.group(3)
        f.ajouter('exports utilisés', f"{res}:{fn}", l)
        idx.exports_utilises.append((res, fn, lien(f"{res}:{fn}", l)))

    for m, l in chercher(r'\b(RegisterCommand|lib\.addCommand|QBCore\.Commands\.Add|ESX\.RegisterCommand)\s*\(\s*'
                         r"""(?:['"]([^'"]+)['"]|\{([^}]*)\})""", src, ld):
        nom = m.group(2) or ', '.join(re.findall(r"""['"]([^'"]+)['"]""", m.group(3) or ''))
        f.ajouter('commandes', '/' + nom, l)
    for m, l in chercher(r'\bRegisterKeyMapping\s*\(\s*' + S + r'\s*,\s*' + S + r'(?:\s*,\s*' + S + r'\s*,\s*' + S + ')?', src, ld):
        f.ajouter('touches', f"{m.group(1)} ({m.group(4) or '?'})", l)

    for m, l in chercher(r'\bRegisterNUICallback\s*\(\s*' + S, src, ld):
        f.ajouter('NUI : callbacks reçus', m.group(1), l)
        idx.nui_lua[m.group(1)].append(lien(m.group(1), l))
    for m, l in chercher(r'\bSendNUIMessage\s*\(', src, ld):
        bloc = src[m.end():m.end() + 300]
        a = re.search(r"""\b(?:action|type)\s*=\s*['"]([^'"]+)['"]""", bloc)
        nom = a.group(1) if a else '?'
        f.ajouter('NUI : messages envoyés', nom, l)
        if a:
            idx.nui_actions_lua[nom].append(lien(nom, l))

    # Threads et boucles qui tournent à chaque frame
    for m, l in chercher(r'\b(?:Citizen\.)?CreateThread\s*\(', src, ld):
        f.ajouter('threads', 'CreateThread', l)
    for m, l in chercher(r'\b(?:Citizen\.)?Wait\s*\(\s*0\s*\)', src, ld):
        f.alertes.append((l, 'Wait(0) : boucle à chaque frame, vérifier qu\'elle ne tourne pas au repos'))

    # Base de données (oxmysql, mysql-async, ghmattimysql)
    for m, l in chercher(r'\b(?:MySQL\.[\w.]+|exports\.oxmysql:\w+|exports\[\s*[\'"]oxmysql[\'"]\s*\]:\w+)\s*\(\s*'
                         r"""(['"])(.+?)\1""", src, ld, re.S):
        for t in tables_sql(m.group(2)):
            f.ajouter('tables SQL', t, l)

    # Config
    if re.search(r'(^|/)config[^/]*\.lua$', f.chemin, re.I) or cote == 'config':
        for m, l in chercher(r'(?m)^(Config\.[\w.]+|Config\[[^\]]+\])\s*=', src, ld):
            f.ajouter('clés de config', m.group(1), l)

    # Framework utilisé
    fw = [n for n, r in (('QBCore', r'\bQBCore\b'), ('Qbox', r'\bqbx_core\b|exports\.qbx_core'),
                         ('ESX', r'\bESX\b'), ('ox_lib', r'\blib\.'), ('Bridge', r'\bBridge\.')) if re.search(r, src)]
    if fw:
        f.ajouter('framework', ', '.join(fw), 1)

    # Handlers réseau côté serveur qui donnent de l'argent ou des objets
    if cote == 'serveur':
        net = [(m, ld(m.start())) for m in re.finditer(r'\bRegisterNetEvent\s*\(\s*' + S, src)]
        for k, (m, l) in enumerate(net):
            fin = net[k + 1][0].start() if k + 1 < len(net) else len(src)
            corps = src[m.end():min(fin, m.end() + 4000)]
            fin_fn = re.search(r'(?m)^end\b', corps)  # fin du handler écrit au niveau 0
            if fin_fn:
                corps = corps[:fin_fn.start()]
            if ARGENT_OBJET.search(corps):
                garde = 'quelques contrôles présents' if VALIDATION.search(corps) else 'AUCUN contrôle visible'
                f.alertes.append((l, f"event réseau « {m.group(1)} » donne argent/objet ({garde}) : "
                                     "vérifier distance, job, état et cooldown côté serveur"))


def tables_sql(requete: str) -> list[str]:
    return sorted({t for t in re.findall(
        r'(?i)\b(?:from|into|update|join|table(?:\s+if\s+(?:not\s+)?exists)?)\s+`?(\w+)`?', requete)
        if t.lower() not in {'select', 'set', 'where', 'values', 'if', 'not', 'exists'}})


def lire_manifest(src: str) -> dict:
    """fxmanifest.lua → listes de fichiers et dépendances."""
    propre = sans_commentaires(src, 'lua')
    res = defaultdict(list)
    for cle, bloc in re.findall(r"""\b(client_scripts?|server_scripts?|shared_scripts?|files?|dependencies|"""
                                r"""dependency|ui_page|exports|server_exports|escrow_ignore)\s*(\{[^}]*\}|['"][^'"]+['"])""",
                                propre):
        cle = cle.rstrip('s') if cle not in ('dependencies',) else 'dependency'
        res[cle] += re.findall(r"""['"]([^'"]+)['"]""", bloc)
    for cle in ('fx_version', 'game', 'lua54', 'version', 'author', 'description'):
        m = re.search(r'\b' + cle + r"""\s+['"]([^'"]+)['"]""", propre)
        if m:
            res[cle] = m.group(1)
    return res


def cote_lua(chemin_rel: str, manifest: dict) -> str:
    """client / serveur / partagé / config, d'après le fxmanifest puis le chemin."""
    for cle, cote in (('server_script', 'serveur'), ('client_script', 'client'), ('shared_script', 'partagé')):
        for motif in manifest.get(cle, []):
            if motif.startswith('@'):
                continue
            if fnmatch.fnmatch(chemin_rel, motif.replace('**/', '*').replace('**', '*')):
                return 'config' if 'config' in chemin_rel.lower() else cote
    bas = chemin_rel.lower()
    if 'config' in os.path.basename(bas):
        return 'config'
    for mot, cote in (('server', 'serveur'), ('serveur', 'serveur'), ('sv_', 'serveur'), ('client', 'client'),
                      ('cl_', 'client'), ('shared', 'partagé'), ('bridge', 'partagé'), ('locale', 'traductions')):
        if mot in bas:
            return cote
    return ''


# ─────────────────────────────────────── JS ───────────────────────────────────────

MOTS_JS = {'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'await', 'typeof', 'new', 'else'}


def analyser_js(f: Fichier, src: str, idx: Index, unite: str) -> None:
    ld = lignes_de(src)
    lien = lambda nom, l: Lien(nom, f.chemin, l, unite)

    for m, l in chercher(r'(?m)^[ \t]*(?:export[ \t]+(?:default[ \t]+)?)?(?:async[ \t]+)?function\*?[ \t]+(\w+)[ \t]*\(([^)]*)\)', src, ld):
        f.ajouter('fonctions', f"{m.group(1)}({compact(m.group(2))})", l)
    for m, l in chercher(r'(?m)^[ \t]*(?:export[ \t]+)?(?:const|let|var)[ \t]+(\w+)[ \t]*=[ \t]*(?:async[ \t]*)?(?:\(([^)]*)\)|(\w+))[ \t]*=>', src, ld):
        f.ajouter('fonctions', f"{m.group(1)}({compact(m.group(2) or m.group(3) or '')})", l)
    for m, l in chercher(r'(?m)^[ \t]*(?:export[ \t]+(?:default[ \t]+)?)?class[ \t]+(\w+)', src, ld):
        f.ajouter('classes', m.group(1), l)
    for m, l in chercher(r'(?m)^[ \t]{2,}(?:static[ \t]+)?(?:async[ \t]+)?(\w+)[ \t]*\(([^)]*)\)[ \t]*\{', src, ld):
        if m.group(1) not in MOTS_JS:
            f.ajouter('méthodes', f"{m.group(1)}({compact(m.group(2))})", l)

    # Dépendances locales et paquets
    for m, l in chercher(r"""\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)|\bfrom\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]""", src, ld, re.M):
        cible = m.group(1) or m.group(2) or m.group(3)
        f.ajouter('importe' if cible.startswith('.') else 'paquets', cible, l)
    m = re.search(r'module\.exports\s*=\s*\{([^}]*)\}', src)
    if m:
        for nom in re.findall(r'(\w+)\s*(?:[:,]|$)', m.group(1)):
            f.ajouter('exporte', nom, ld(m.start()))
    for m, l in chercher(r'\b(?:module\.)?exports\.(\w+)\s*=', src, ld):
        f.ajouter('exporte', m.group(1), l)

    # Electron : IPC
    for m, l in chercher(r'\b(?:canal|ipcMain\.(?:handle|handleOnce|on|once))\s*\(\s*' + S, src, ld):
        f.ajouter('IPC : canaux traités', m.group(1), l)
        idx.ipc_traites[m.group(1)].append(lien(m.group(1), l))
        if m.group(0).startswith('ipcMain'):
            f.alertes.append((l, f"ipcMain direct pour « {m.group(1)} » : passer par canal() (validation des arguments)"))
    for m, l in chercher(r'\b(?:ipcRenderer\.(?:invoke|send|sendSync)|appeler)\s*\(\s*' + S, src, ld):
        f.ajouter('IPC : canaux appelés', m.group(1), l)
        idx.ipc_appeles[m.group(1)].append(lien(m.group(1), l))
    for m, l in chercher(r'\bwebContents\.send\s*\(\s*' + S, src, ld):
        f.ajouter('IPC : envoyé à l\'interface', m.group(1), l)
        idx.ipc_vers_ui[m.group(1)].append(lien(m.group(1), l))
    for nom_tab, cible, titre in (('CANAUX', idx.ipc_liste_blanche, 'IPC : liste blanche'),
                                  ('EVENEMENTS', idx.ipc_evenements_ui, 'IPC : événements autorisés')):
        m = re.search(r'\bconst\s+' + nom_tab + r'\s*=\s*\[([^\]]*)\]', src)
        if m:
            for c in re.finditer(r"""['"]([^'"]+)['"]""", m.group(1)):
                l = ld(m.start(1) + c.start())
                cible[c.group(1)].append(lien(c.group(1), l))
                f.ajouter(titre, c.group(1), l)
    m = re.search(r'exposeInMainWorld\s*\(\s*' + S + r'\s*,', src)
    if m:
        racine = m.group(1)
        api = api_exposee(src, m.end(), racine, ld)
        for nom, (canal_, l) in api.items():
            idx.api_exposee[nom] = Lien(canal_, f.chemin, l, unite)
            f.ajouter('API exposée à l\'interface', f"{nom} → {canal_}" if canal_ else nom, l)
    for m, l in chercher(r'\bwindow\.(forge|api|electron)\.([\w.]+)\s*\(', src, ld):
        nom = f"{m.group(1)}.{m.group(2)}"
        idx.api_utilisee[nom].append(lien(nom, l))
        f.ajouter('API Electron utilisée', nom, l)

    # NUI FiveM côté JS. Les fonctions maison qui enveloppent fetch(`https://${ressource}/${nom}`)
    # (envoyer, post, fetchNui…) sont détectées d'après leur corps, quel que soit leur nom.
    aides = {'fetchNui', 'fetchNUI', 'postNui', 'postNUI', 'nuiCallback'}
    for m in re.finditer(r'fetch\s*\(\s*`https?://\$\{[^}]+\}/\$\{\s*\w+\s*\}', src):
        avant = src[:m.start()]
        d = list(re.finditer(r'(?:function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|\())', avant))
        if d:
            aides.add(d[-1].group(1) or d[-1].group(2))
    motif_aides = '|'.join(sorted(map(re.escape, aides)))
    for m, l in chercher(r"""https?://(?:\$\{[^}]+\}|[\w-]+)/([\w:-]+)|"""
                         r"""\b(?:""" + motif_aides + r""")\s*\(\s*['"`]([\w:-]+)['"`]""", src, ld):
        nom = m.group(1) or m.group(2)
        if nom and not re.match(r'^(www|cdn|fonts?)$', nom):
            f.ajouter('NUI : callbacks envoyés au Lua', nom, l)
            idx.nui_js[nom].append(lien(nom, l))
    if re.search(r"""addEventListener\s*\(\s*['"]message['"]""", src):
        for m, l in chercher(r"""\b(?:case\s+|(?:action|type)\s*===?\s*)['"]([\w:-]+)['"]""", src, ld):
            f.ajouter('NUI : actions reçues', m.group(1), l)
            idx.nui_actions_js[m.group(1)].append(lien(m.group(1), l))


def compact(args: str) -> str:
    args = re.sub(r'\s+', ' ', args).strip()
    return args if len(args) <= 60 else args[:57].rstrip(', ') + '…'


def fin_valeur(src: str, j: int) -> int:
    """Fin d'une valeur d'objet JS : la virgule ou l'accolade fermante de même niveau
    (gère `{ a: f() }` sur une ligne et les fonctions sur plusieurs lignes)."""
    n, prof, k, chaine = len(src), 0, j, None
    while k < n:
        c = src[k]
        if chaine:
            if c == '\\':
                k += 2
                continue
            if c == chaine:
                chaine = None
        elif c in '\'"`':
            chaine = c
        elif src.startswith('//', k):
            nl = src.find('\n', k)
            k = n if nl < 0 else nl
            continue
        elif c in '([{':
            prof += 1
        elif c in ')]}':
            if prof == 0:
                return k
            prof -= 1
        elif c == ',' and prof == 0:
            return k + 1
        k += 1
    return n


def api_exposee(src: str, debut: int, racine: str, ld) -> dict:
    """Parcourt l'objet passé à exposeInMainWorld : chemin.de.fonction → canal."""
    res, pile, i, n = {}, [racine], src.find('{', debut), len(src)
    if i < 0:
        return res
    i += 1
    profondeur = 1
    cle_en_cours = None
    while i < n and profondeur > 0:
        m = re.compile(r'\s*(\w+)\s*:\s*').match(src, i)
        if m:
            cle_en_cours = m.group(1)
            j = m.end()
            if src.startswith('{', j):
                pile.append(cle_en_cours)
                profondeur += 1
                i = j + 1
                continue
            fin = fin_valeur(src, j)
            valeur = src[j:fin]
            c = re.search(r"""(?:appeler|invoke|send|ecouter)\s*\(\s*['"]([^'"]+)['"]""", valeur)
            res['.'.join(pile + [cle_en_cours])] = (c.group(1) if c else '', ld(j))
            i = fin
            continue
        if src[i] == '{':
            profondeur += 1
        elif src[i] == '}':
            profondeur -= 1
            if len(pile) > 1 and profondeur >= 1:
                pile.pop()
        i += 1
    return res


# ───────────────────────────────────── Python ─────────────────────────────────────

def analyser_py(f: Fichier, src: str, idx: Index, unite: str) -> None:
    ld = lignes_de(src)
    lignes = src.split('\n')
    classe_courante, indent_classe = None, -1
    asynchrone = 'async def' in src
    for num, ligne in enumerate(lignes, 1):
        m = re.match(r'^(\s*)class\s+(\w+)\s*(\(([^)]*)\))?', ligne)
        if m:
            classe_courante, indent_classe = m.group(2), len(m.group(1))
            base = f"({m.group(4)})" if m.group(4) else ''
            f.ajouter('classes', m.group(2) + base, num)
            continue
        m = re.match(r'^(\s*)(async\s+)?def\s+(\w+)\s*\(([^)]*)', ligne)
        if not m:
            continue
        indent, nom = len(m.group(1)), m.group(3)
        if classe_courante and indent > indent_classe:
            nom_aff = f"{classe_courante}.{nom}"
        else:
            classe_courante = None
            nom_aff = nom
        args = compact(re.sub(r'\bself\s*,?\s*', '', m.group(4)))
        f.ajouter('fonctions', f"{'async ' if m.group(2) else ''}{nom_aff}({args})", num)
        # décorateurs au-dessus de la fonction
        k = num - 2
        while k >= 0 and lignes[k].strip().startswith('@'):
            deco = lignes[k].strip()
            nom_cmd = re.search(r"""name\s*=\s*['"]([^'"]+)['"]""", deco)
            if re.search(r'\.(?:command|hybrid_command|slash_command|group)\b|app_commands\.command', deco):
                f.ajouter('commandes', '/' + (nom_cmd.group(1) if nom_cmd else nom), k + 1)
            elif re.search(r'\.event\b|Cog\.listener', deco):
                f.ajouter('events écoutés', nom, k + 1)
            elif re.search(r'tasks\.loop|scheduled_job|\.cron\b|\.interval\b', deco):
                f.ajouter('tâches planifiées', f"{nom} {deco[deco.find('('):][:40]}" if '(' in deco else nom, k + 1)
            elif re.search(r'\.(?:message|callback_query|inline_query|edited_message|channel_post)\s*\(', deco):
                cmd = re.search(r"""Command\(\s*(?:commands\s*=\s*)?\[?\s*['"]([^'"]+)['"]""", deco)
                cb = re.search(r"""F\.data\s*(?:==|\.startswith\()\s*['"]([^'"]+)['"]""", deco)
                etiquette = '/' + cmd.group(1) if cmd else (f"bouton {cb.group(1)}" if cb else deco[1:60])
                f.ajouter('handlers Telegram', f"{etiquette} → {nom}", k + 1)
            elif re.search(r'\.(?:route|get|post|put|delete|websocket)\s*\(', deco):
                f.ajouter('routes HTTP', deco[1:70], k + 1)
            k -= 1

    for m, l in chercher(r'(?m)^\s*(?:from\s+(\.[\w.]*|\w[\w.]*)\s+import|import\s+([\w.]+))', src, ld):
        mod = m.group(1) or m.group(2)
        if mod.startswith('.') or mod.split('.')[0] in noms_locaux(f):
            f.ajouter('importe', mod, l)
    for m, l in chercher(r"""\bos\.(?:getenv|environ\.get)\s*\(\s*['"](\w+)['"]|\bos\.environ\[\s*['"](\w+)['"]""", src, ld):
        f.ajouter('variables d\'environnement', m.group(1) or m.group(2), l)
    for m, l in chercher(r"""\b(?:execute|executemany|fetch|fetchrow|fetchval|fetchall|fetchone)\s*\(\s*(f?)(['"]{1,3})(.+?)\2""", src, ld, re.S):
        for t in tables_sql(m.group(3)):
            f.ajouter('tables SQL', t, l)
        if m.group(1):
            f.alertes.append((l, 'requête SQL en f-string : utiliser des paramètres'))
    for m, l in chercher(r'\bcreate_task\s*\(|\.add_job\s*\(', src, ld):
        f.ajouter('tâches planifiées', m.group(0).rstrip('( '), l)
    if asynchrone:
        for m, l in chercher(r'\brequests\.(get|post|put|delete|patch)\s*\(|\btime\.sleep\s*\(', src, ld):
            f.alertes.append((l, f"appel bloquant « {m.group(0).rstrip('(')} » dans du code async"))


_noms_locaux_cache: set = set()


def noms_locaux(_f) -> set:
    return _noms_locaux_cache


# ───────────────────────────────── Échecs silencieux ─────────────────────────────────
# Une erreur avalée sans trace = un bug impossible à diagnostiquer chez l'utilisateur.
# Exception assumée : marqueur `silence-ok: <raison>` en commentaire sur la ligne,
# celle d'avant ou celle d'après (ex. nettoyage d'un fichier temporaire déjà absent).

MARQUEUR_SILENCE = 'silence-ok'

MOTIFS_SILENCE = {
    'lua': [
        (r'(?m)^[ \t]*x?pcall\s*\(', "pcall dont le résultat est ignoré : l'erreur disparaît sans trace"),
        (r'\bxpcall\s*\([^,]+,\s*function\s*\([^)]*\)\s*end\s*\)', "xpcall avec un gestionnaire d'erreur vide"),
    ],
    'js': [
        (r'\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}', 'catch vide : erreur avalée sans journal ni message'),
        (r'\.catch\s*\(\s*(?:async\s*)?(?:\(\s*\w*\s*\)|\w+)\s*=>\s*(?:\{\s*\}|undefined|void 0)\s*\)',
         '.catch(() => {}) : promesse en échec ignorée'),
        (r'\.catch\s*\(\s*function\s*\([^)]*\)\s*\{\s*\}\s*\)', '.catch(function(){}) : promesse en échec ignorée'),
    ],
    'py': [
        (r'(?m)^([ \t]*)except\b[^:\n]*:[ \t]*(?:pass|\.\.\.)[ \t]*$', 'except … : pass — erreur avalée'),
        (r'(?m)^([ \t]*)except\b[^:\n]*:[ \t]*\n[ \t]+(?:pass|\.\.\.)[ \t]*(?:\n(?![ \t]*\S)|\n(?=\1\S)|\Z)',
         'except … : pass — erreur avalée'),
        (r'(?m)^[ \t]*except[ \t]*:', 'except nu : attrape tout, même Ctrl+C et les erreurs de programmation'),
        (r'\bsuppress\s*\(\s*(?:Exception|BaseException)\s*\)', 'suppress(Exception) : toutes les erreurs ignorées'),
    ],
}


def echecs_silencieux(f: Fichier, src: str, brut: str, lang: str) -> None:
    motifs = MOTIFS_SILENCE.get(lang)
    if not motifs:
        return
    ld = lignes_de(src)
    lignes_brutes = brut.split('\n')
    vues = set()
    for motif, texte in motifs:
        for m in re.finditer(motif, src):
            debut = m.start() + (len(m.group(1)) if m.groups() and m.group(1) else 0)
            l = ld(debut)
            fin = ld(max(m.end() - 1, m.start()))
            voisinage = lignes_brutes[l - 1:fin + 1]  # lignes du motif + la suivante
            precedente = lignes_brutes[l - 2].strip() if l >= 2 else ''
            if precedente.startswith(('--', '//', '#', '/*', '*')):  # commentaire seul juste au-dessus
                voisinage.append(precedente)
            if l in vues or any(MARQUEUR_SILENCE in x for x in voisinage):
                continue
            vues.add(l)
            f.alertes.append((l, f"échec silencieux — {texte}"))


# ─────────────────────────────────── HTML / SQL ───────────────────────────────────

def analyser_html(f: Fichier, src: str) -> None:
    src = re.sub(r'<!--.*?-->', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), src, flags=re.S)
    ld = lignes_de(src)
    for m, l in chercher(r"""<script[^>]+src\s*=\s*['"]([^'"]+)['"]""", src, ld, re.I):
        f.ajouter('scripts', m.group(1), l)
    for m, l in chercher(r"""<link[^>]+href\s*=\s*['"]([^'"]+\.css)['"]""", src, ld, re.I):
        f.ajouter('styles', m.group(1), l)
    for m, l in chercher(r"""<section[^>]*\bid\s*=\s*['"]([^'"]+)['"]|data-(?:ecran|page|view|tab)\s*=\s*['"]([^'"]+)['"]""", src, ld, re.I):
        f.ajouter('écrans / sections', m.group(1) or m.group(2), l)
    for m, l in chercher(r'<script(?![^>]*\bsrc=)[^>]*>', src, ld, re.I):
        f.ajouter('script intégré', '<script>', l)


def analyser_sql(f: Fichier, src: str) -> None:
    ld = lignes_de(src)
    for m, l in chercher(r'(?i)\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?`?(\w+)`?', src, ld):
        f.ajouter('tables créées', m.group(1), l)
    for m, l in chercher(r'(?i)\balter\s+table\s+`?(\w+)`?', src, ld):
        f.ajouter('tables modifiées', m.group(1), l)


# ───────────────────────────────────── Parcours ─────────────────────────────────────

def ignores_du_projet(racine: str) -> set:
    """Chemins relatifs listés dans `.codemap-ignorer` (code tiers recopié tel quel, généré…)."""
    try:
        with open(os.path.join(racine, '.codemap-ignorer'), encoding='utf-8') as fh:
            return {l.strip().strip('/') for l in fh if l.strip() and not l.lstrip().startswith('#')}
    except FileNotFoundError:  # silence-ok: fichier facultatif
        return set()


def parcourir(racine: str):
    ignores = ignores_du_projet(racine)
    for dossier, sous, fichiers in os.walk(racine):
        rel = os.path.relpath(dossier, racine).replace(os.sep, '/')
        sous[:] = sorted(d for d in sous if d not in DOSSIERS_IGNORES and not d.startswith('.')
                         and (d if rel == '.' else f'{rel}/{d}') not in ignores)
        for nom in sorted(fichiers):
            ext = os.path.splitext(nom)[1].lower()
            if ext in EXTENSIONS and not nom.endswith(('.min.js', '.bundle.js', '.d.ts')) and nom not in (NOM_SORTIE, 'codemap.py'):
                chemin = os.path.join(dossier, nom)
                if os.path.getsize(chemin) <= TAILLE_MAX:
                    yield chemin, EXTENSIONS[ext]


def unites(racine: str) -> dict:
    """Dossiers qui sont des ressources FiveM (fxmanifest) : chemin_rel -> manifest."""
    res = {}
    for dossier, sous, fichiers in os.walk(racine):
        sous[:] = [d for d in sous if d not in DOSSIERS_IGNORES and not d.startswith('.')]
        for nom in ('fxmanifest.lua', '__resource.lua'):
            if nom in fichiers:
                with open(os.path.join(dossier, nom), encoding='utf-8', errors='replace') as fh:
                    rel = os.path.relpath(dossier, racine).replace(os.sep, '/')
                    res['' if rel == '.' else rel] = lire_manifest(fh.read())
                break
    return res


def unite_de(chemin_rel: str, ressources: dict) -> str:
    meilleur = None
    for u in ressources:
        if u == '' or chemin_rel.startswith(u + '/'):
            if meilleur is None or len(u) > len(meilleur):
                meilleur = u
    return meilleur if meilleur is not None else ''


def role_de(chemin: str, lang: str, cote: str) -> str:
    bas = '/' + chemin.lower()
    nom = os.path.basename(bas)
    if nom in ('fxmanifest.lua', '__resource.lua'):
        return 'manifeste'
    if cote:
        return cote
    if lang == 'js':
        for mot, role in (('preload', 'preload'), ('/main/', 'processus principal'), ('main.js', 'processus principal'),
                          ('renderer', 'interface'), ('/html/', 'NUI'), ('/web/', 'NUI'), ('/ui/', 'NUI'),
                          ('/nui/', 'NUI'), ('test', 'tests'), ('/scripts/', 'outil')):
            if mot in bas:
                return role
    if lang == 'py':
        for mot, role in (('__main__', 'point d\'entrée'), ('config', 'configuration'), ('/cogs/', 'cog'),
                          ('/handlers/', 'handlers'), ('/services/', 'service'), ('/db/', 'base de données'),
                          ('test', 'tests')):
            if mot in bas:
                return role
    if lang == 'html' and 'renderer' in bas:
        return 'interface'
    if lang == 'html' and any(m in bas for m in ('html/', 'web/', 'ui/', 'nui/')):
        return 'NUI'
    return ''


def analyser(racine: str):
    racine = os.path.abspath(racine)
    ressources = unites(racine)
    idx = Index()
    fichiers = []
    _noms_locaux_cache.clear()
    for d in os.listdir(racine):
        if os.path.isdir(os.path.join(racine, d)) or d.endswith('.py'):
            _noms_locaux_cache.add(os.path.splitext(d)[0])
    for chemin, lang in parcourir(racine):
        rel = os.path.relpath(chemin, racine).replace(os.sep, '/')
        with open(chemin, encoding='utf-8', errors='replace') as fh:
            brut = fh.read()
        unite = unite_de(rel, ressources)
        f = Fichier(rel, lang, brut.count('\n') + (0 if brut.endswith('\n') or not brut else 1))
        cote = ''
        if lang == 'lua' and unite in ressources:
            rel_res = rel[len(unite) + 1:] if unite else rel
            cote = cote_lua(rel_res, ressources[unite])
        f.role = role_de(rel, lang, cote)
        src = sans_commentaires(brut, lang)
        if lang == 'lua':
            if os.path.basename(rel) not in ('fxmanifest.lua', '__resource.lua'):
                analyser_lua(f, src, idx, unite or '(racine)', cote)
            for m in re.finditer(r'\bexports\s*\{([^}]*)\}', src) if 'manifest' in f.role else []:
                for nom in re.findall(r"""['"](\w+)['"]""", m.group(1)):
                    idx.exports_fournis[unite or '(racine)'].add(nom)
        elif lang == 'js':
            analyser_js(f, src, idx, unite or '(racine)')
        elif lang == 'py':
            analyser_py(f, src, idx, unite or '(racine)')
        elif lang == 'html':
            analyser_html(f, brut)
        elif lang == 'sql':
            analyser_sql(f, brut)
        echecs_silencieux(f, sans_commentaires(brut, lang, vider_chaines=True), brut, lang)
        fichiers.append(f)
    return racine, ressources, fichiers, idx


# ─────────────────────────────── Vérifications croisées ───────────────────────────────

PREFIXES_EXTERNES = (
    'QBCore:', 'qb-', 'qbx_', 'qbx:', 'esx:', 'esx_', 'ox_', 'ox:', 'onResource', 'onServerResource',
    'onClientResource', 'playerDropped', 'playerConnecting', 'playerJoining', 'baseevents:', 'txAdmin:',
    'txsv:', 'chat:', 'gameEventTriggered', 'populationPedCreating', 'entityCreated', 'entityRemoved',
    'explosionEvent', 'weaponDamageEvent', 'ptFxEvent', 'startProjectileEvent', 'hospital:', 'police:',
    'inventory:', 'qs-', 'ps-', 'lb-', 'okokNotify:', 'mythic_notify:', 'Bridge:', 'pma-voice:',
)


def externe(nom: str) -> bool:
    return nom.startswith(PREFIXES_EXTERNES)


def prefixe(nom: str) -> str:
    return re.split(r'[:.]', nom, maxsplit=1)[0] if re.search(r'[:.]', nom) else ''


def loc(liens: list, maxi: int = 4) -> str:
    txt = ', '.join(f"`{x.fichier}:{x.ligne}`" for x in liens[:maxi])
    return txt + (f" (+{len(liens) - maxi})" if len(liens) > maxi else '')


def verifications(idx: Index) -> tuple[list, list]:
    """Retourne (liens, problèmes) en lignes Markdown."""
    liens, pbs = [], []

    # Events : préfixes « maison » = ceux qui apparaissent à la fois en émission et en écoute
    propres = {prefixe(n) for n in idx.emis} & {prefixe(n) for n in idx.ecoutes}
    propres.discard('')
    for nom in sorted(set(idx.emis) | set(idx.ecoutes)):
        e, o = idx.emis.get(nom, []), idx.ecoutes.get(nom, [])
        if e and o:
            liens.append(f"- `{nom}` : émis {loc(e)} → écouté {loc(o)}")
        elif externe(nom) or prefixe(nom) not in propres:
            continue
        elif e:
            pbs.append(f"- Event `{nom}` émis {loc(e)} mais **jamais écouté** dans ce dossier (faute de frappe ?)")
        else:
            pbs.append(f"- Event `{nom}` écouté {loc(o)} mais **jamais émis** dans ce dossier (déclenché par une autre ressource ?)")

    for nom in sorted(set(idx.cb_declares) | set(idx.cb_appeles)):
        d, a = idx.cb_declares.get(nom, []), idx.cb_appeles.get(nom, [])
        if d and a:
            liens.append(f"- callback `{nom}` : déclaré {loc(d)} ← appelé {loc(a)}")
        elif a and not externe(nom):
            pbs.append(f"- Callback `{nom}` appelé {loc(a)} mais **déclaré nulle part** ici")
        elif d and not externe(nom):
            pbs.append(f"- Callback `{nom}` déclaré {loc(d)} mais jamais appelé ici (code mort ou utilisé ailleurs)")

    for nom in sorted(set(idx.nui_lua) | set(idx.nui_js)):
        lu, js = idx.nui_lua.get(nom, []), idx.nui_js.get(nom, [])
        if lu and js:
            liens.append(f"- NUI `{nom}` : JS {loc(js)} → Lua {loc(lu)}")
        elif js and idx.nui_lua:  # sans aucun Lua (projet Electron), une URL n'est pas un callback NUI
            pbs.append(f"- NUI : le JS appelle `{nom}` {loc(js)} mais **aucun RegisterNUICallback** ne le reçoit")
        elif lu:
            pbs.append(f"- NUI : `RegisterNUICallback('{nom}')` {loc(lu)} jamais appelé par le JS")
    if idx.nui_actions_js:
        for nom in sorted(idx.nui_actions_lua):
            if nom in idx.nui_actions_js:
                liens.append(f"- NUI action `{nom}` : Lua {loc(idx.nui_actions_lua[nom])} → JS {loc(idx.nui_actions_js[nom])}")
            else:
                pbs.append(f"- NUI : `SendNUIMessage` action `{nom}` {loc(idx.nui_actions_lua[nom])} non gérée côté JS")

    for res, fn, l in idx.exports_utilises:
        if res in idx.exports_fournis or any(u.endswith('/' + res) for u in idx.exports_fournis):
            fournis = idx.exports_fournis.get(res) or next(v for u, v in idx.exports_fournis.items() if u.endswith('/' + res))
            if fn not in fournis:
                pbs.append(f"- Export `{res}:{fn}` utilisé `{l.fichier}:{l.ligne}` mais `{res}` ne le fournit pas")

    # Electron
    if idx.ipc_traites or idx.ipc_liste_blanche:
        for nom in sorted(set(idx.ipc_traites) | set(idx.ipc_liste_blanche) | set(idx.ipc_appeles)):
            t, b, a = idx.ipc_traites.get(nom, []), idx.ipc_liste_blanche.get(nom, []), idx.ipc_appeles.get(nom, [])
            if t and (b or not idx.ipc_liste_blanche):
                liens.append(f"- IPC `{nom}` : traité {loc(t)}" + (f", autorisé {loc(b)}" if b else ''))
            if t and idx.ipc_liste_blanche and not b:
                pbs.append(f"- Canal `{nom}` traité {loc(t)} mais **absent de la liste blanche** du preload (inaccessible)")
            if b and not t:
                pbs.append(f"- Canal `{nom}` autorisé {loc(b)} mais **traité nulle part** (l'appel échouera)")
            if a and not t and not b:
                pbs.append(f"- Canal `{nom}` appelé {loc(a)} mais ni traité ni autorisé")
        for nom in sorted(idx.ipc_vers_ui):
            if idx.ipc_evenements_ui and nom not in idx.ipc_evenements_ui:
                pbs.append(f"- Événement `{nom}` envoyé à l'interface {loc(idx.ipc_vers_ui[nom])} mais absent de `EVENEMENTS` du preload")
    if idx.api_exposee:
        for nom, ls in sorted(idx.api_utilisee.items()):
            if nom not in idx.api_exposee:
                pbs.append(f"- `window.{nom}()` utilisé {loc(ls)} mais **non exposé** par le preload")
    return liens, pbs


# ─────────────────────────────────────── Rendu ───────────────────────────────────────

ORDRE_SECTIONS = [
    'framework', 'commandes', 'touches', 'handlers Telegram', 'events écoutés', 'routes HTTP', 'tâches planifiées',
    'écoute (events)', 'émet → serveur', 'émet → client', 'émet (local)', 'callbacks déclarés', 'callbacks appelés',
    'NUI : callbacks reçus', 'NUI : messages envoyés', 'NUI : callbacks envoyés au Lua', 'NUI : actions reçues',
    'exports fournis', 'exports utilisés', 'IPC : canaux traités', 'IPC : canaux appelés', 'IPC : envoyé à l\'interface',
    'IPC : liste blanche', 'IPC : événements autorisés', 'API exposée à l\'interface', 'API Electron utilisée',
    'classes', 'fonctions', 'méthodes', 'exporte', 'importe', 'tables SQL', 'tables créées', 'tables modifiées',
    'clés de config', 'variables d\'environnement', 'écrans / sections', 'scripts', 'styles', 'script intégré',
    'threads', 'paquets',
]
SANS_LIGNE = {'framework', 'paquets', 'importe', 'scripts', 'styles'}


def formater_section(titre: str, items: list) -> str:
    if titre in SANS_LIGNE:
        noms = list(dict.fromkeys(n for n, _ in items))
        return f"- {titre} : " + ', '.join(f"`{n}`" if titre != 'framework' else n for n in noms)
    if titre == 'threads':
        return f"- threads : {len(items)} (l. " + ', '.join(str(l) for _, l in items) + ")"
    return f"- {titre} : " + ', '.join(f"`{n}` {l}" for n, l in sorted(items, key=lambda x: x[1]))


def rendre(racine: str, ressources: dict, fichiers: list, idx: Index) -> str:
    nom_projet = os.path.basename(racine.rstrip(os.sep))
    total = sum(f.lignes for f in fichiers)
    par_lang = defaultdict(int)
    for f in fichiers:
        par_lang[f.lang] += 1
    out = [
        f"# CODEMAP — {nom_projet}",
        '',
        f"> Généré par `codemap.py` v{VERSION} : **ne pas modifier à la main**. "
        "Régénérer après chaque modification du code.",
        "> Format : `nom` suivi du numéro de ligne → lire seulement les lignes utiles (Read avec offset).",
        '',
        f"**{len(fichiers)} fichiers · {total} lignes** · " +
        ' · '.join(f"{n} {l}" for l, n in sorted(par_lang.items(), key=lambda x: -x[1])),
        '',
    ]

    # Ressources FiveM
    if ressources:
        out += ['## Ressources FiveM', '']
        for u, man in sorted(ressources.items()):
            nom = u or nom_projet
            details = []
            for cle, lib in (('fx_version', 'fx'), ('version', 'v'), ('lua54', 'lua54')):
                if man.get(cle):
                    details.append(f"{lib} {man[cle]}")
            out.append(f"- **{nom}**" + (f" ({', '.join(details)})" if details else ''))
            for cle, lib in (('shared_script', 'partagé'), ('client_script', 'client'), ('server_script', 'serveur'),
                             ('ui_page', 'ui_page'), ('dependency', 'dépendances'), ('export', 'exports manifeste')):
                if man.get(cle):
                    out.append(f"  - {lib} : " + ', '.join(f"`{x}`" for x in man[cle]))
        out.append('')

    liens, pbs = verifications(idx)
    alertes = [(f.chemin, l, t) for f in fichiers for l, t in sorted(f.alertes)]
    if pbs or alertes:
        out += ['## ⚠ Points d\'attention', '']
        out += pbs
        groupes = defaultdict(list)
        for ch, l, t in alertes:
            groupes[t if t.startswith('Wait(0)') else (ch, l, t)].append((ch, l))
        for cle, occ in groupes.items():
            if isinstance(cle, str):
                out.append(f"- {cle} : " + ', '.join(f"`{c}:{l}`" for c, l in occ))
            else:
                ch, l, t = cle
                out.append(f"- `{ch}:{l}` — {t}")
        out.append('')

    if liens:
        out += ['## Liens entre fichiers', ''] + liens + ['']

    out += ['## Fichiers', '']
    for f in sorted(fichiers, key=lambda x: (x.chemin.count('/') > 0, x.chemin)):
        entete = f"### {f.chemin} — {f.role + ' · ' if f.role else ''}{f.lignes} l."
        out.append(entete)
        sections = [s for s in ORDRE_SECTIONS if f.sections.get(s)]
        sections += [s for s in f.sections if s not in ORDRE_SECTIONS]
        if not sections:
            out.append('- (aucun symbole)')
        for s in sections:
            out.append(formater_section(s, f.sections[s]))
        out.append('')
    return '\n'.join(out).rstrip() + '\n'


def main() -> int:
    p = argparse.ArgumentParser(description='Génère CODEMAP.md : carte du code avec numéros de ligne.')
    p.add_argument('dossier', nargs='?', default='.')
    p.add_argument('-o', '--sortie', help=f'fichier de sortie (défaut : <dossier>/{NOM_SORTIE})')
    p.add_argument('--stdout', action='store_true', help='afficher au lieu d\'écrire')
    p.add_argument('--verifier', action='store_true', help='code 1 si le fichier existant n\'est pas à jour')
    a = p.parse_args()
    if not os.path.isdir(a.dossier):
        print(f"Dossier introuvable : {a.dossier}", file=sys.stderr)
        return 2
    texte = rendre(*analyser(a.dossier))
    if a.stdout:
        sys.stdout.write(texte)
        return 0
    sortie = a.sortie or os.path.join(a.dossier, NOM_SORTIE)
    if a.verifier:
        actuel = open(sortie, encoding='utf-8').read() if os.path.exists(sortie) else ''
        if actuel != texte:
            print(f"{sortie} n'est pas à jour : relancer codemap.py", file=sys.stderr)
            return 1
        print(f"{sortie} est à jour")
        return 0
    with open(sortie, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(texte)
    nb_pb = texte.count('\n- ', texte.find('## ⚠'), texte.find('## ', texte.find('## ⚠') + 3)) if '## ⚠' in texte else 0
    print(f"{sortie} : {texte.count(chr(10) + '### ')} fichiers cartographiés, {nb_pb} point(s) d'attention")
    return 0


if __name__ == '__main__':
    sys.exit(main())
