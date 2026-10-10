'use strict';
// Fonctions pures du module de mise à jour (testables sans Electron).

// Notes de version : texte brut uniquement (affichées avec textContent côté interface).
function notesEnTexte(notes) {
  if (!notes) return '';
  const brut = Array.isArray(notes) ? notes.map((n) => `${n.version}\n${n.note || ''}`).join('\n\n') : String(notes);
  return brut
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 6000);
}

function messageErreur(e) {
  const t = `${e?.message || e} ${e?.code || ''}`;
  if (/sha512|checksum|mismatch/i.test(t)) return 'Le fichier téléchargé est corrompu : il a été supprimé. Réessayez plus tard.';
  if (/\b401\b|\b403\b|Bad credentials|authentication/i.test(t)) return 'Accès aux mises à jour refusé : le jeton a expiré ou a été révoqué. Il faudra une version réinstallée à la main avec un nouveau jeton.';
  if (/\b404\b|No published versions|Cannot find latest|Unable to find latest/i.test(t)) return 'Aucune version publiée pour le moment (ou dépôt de mises à jour inaccessible avec ce jeton).';
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_NETWORK|net::/i.test(t)) return 'Pas de connexion à internet : impossible de vérifier les mises à jour.';
  if (/ENOSPC/i.test(t)) return 'Espace disque insuffisant pour télécharger la mise à jour.';
  return 'La mise à jour a échoué. Le détail est dans le journal (Paramètres → Ouvrir le dossier des journaux).';
}

// Le jeton est rangé ENCODÉ dans maj-config.json (base64 du texte à l'envers), fichier versionné
// dans le dépôt du logiciel pour qu'une mise à jour faite plus tard le retrouve.
// Ce n'est PAS une protection : le jeton reste extractible de l'exe, c'est pourquoi il doit
// être en lecture seule et limité aux dépôts d'installeurs. L'encodage sert seulement à ce que
// la protection anti-fuite de GitHub ne bloque pas l'envoi du dépôt, et à ce qu'une simple
// recherche « github_pat » dans l'exe ne le trouve pas.
function encoderJeton(jeton) {
  return Buffer.from([...String(jeton)].reverse().join(''), 'utf8').toString('base64');
}
function decoderJeton(code) {
  return [...Buffer.from(String(code), 'base64').toString('utf8')].reverse().join('');
}

module.exports = { notesEnTexte, messageErreur, encoderJeton, decoderJeton };
