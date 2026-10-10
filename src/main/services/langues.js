'use strict';
// Langues proposées. `code` sert au nom de sortie (Film.fr.srt), `deeplSource`/`deeplCible` à DeepL
// (null = DeepL ne la propose pas), `iso3` à reconnaître la langue des pistes vidéo, `anglais` au
// prompt de l'IA locale (les petits modèles suivent mieux les consignes en anglais).

const LANGUES = [
  { code: 'fr', nom: 'Français', anglais: 'French', deeplSource: 'FR', deeplCible: 'FR', iso3: ['fre', 'fra'] },
  { code: 'en', nom: 'Anglais (États-Unis)', anglais: 'American English', deeplSource: 'EN', deeplCible: 'EN-US', iso3: ['eng'] },
  { code: 'en-GB', nom: 'Anglais (Royaume-Uni)', anglais: 'British English', deeplSource: 'EN', deeplCible: 'EN-GB', iso3: [], suffixe: 'en' },
  { code: 'es', nom: 'Espagnol', anglais: 'Spanish', deeplSource: 'ES', deeplCible: 'ES', iso3: ['spa'] },
  { code: 'de', nom: 'Allemand', anglais: 'German', deeplSource: 'DE', deeplCible: 'DE', iso3: ['ger', 'deu'] },
  { code: 'it', nom: 'Italien', anglais: 'Italian', deeplSource: 'IT', deeplCible: 'IT', iso3: ['ita'] },
  { code: 'pt', nom: 'Portugais (Portugal)', anglais: 'European Portuguese', deeplSource: 'PT', deeplCible: 'PT-PT', iso3: ['por'] },
  { code: 'pt-BR', nom: 'Portugais (Brésil)', anglais: 'Brazilian Portuguese', deeplSource: 'PT', deeplCible: 'PT-BR', iso3: [] },
  { code: 'nl', nom: 'Néerlandais', anglais: 'Dutch', deeplSource: 'NL', deeplCible: 'NL', iso3: ['dut', 'nld'] },
  { code: 'pl', nom: 'Polonais', anglais: 'Polish', deeplSource: 'PL', deeplCible: 'PL', iso3: ['pol'] },
  { code: 'ru', nom: 'Russe', anglais: 'Russian', deeplSource: 'RU', deeplCible: 'RU', iso3: ['rus'] },
  { code: 'uk', nom: 'Ukrainien', anglais: 'Ukrainian', deeplSource: 'UK', deeplCible: 'UK', iso3: ['ukr'] },
  { code: 'ja', nom: 'Japonais', anglais: 'Japanese', deeplSource: 'JA', deeplCible: 'JA', iso3: ['jpn'] },
  { code: 'zh', nom: 'Chinois simplifié', anglais: 'Simplified Chinese', deeplSource: 'ZH', deeplCible: 'ZH-HANS', iso3: ['chi', 'zho'] },
  { code: 'zh-Hant', nom: 'Chinois traditionnel', anglais: 'Traditional Chinese', deeplSource: 'ZH', deeplCible: 'ZH-HANT', iso3: [] },
  { code: 'ko', nom: 'Coréen', anglais: 'Korean', deeplSource: 'KO', deeplCible: 'KO', iso3: ['kor'] },
  { code: 'ar', nom: 'Arabe', anglais: 'Arabic', deeplSource: 'AR', deeplCible: 'AR', iso3: ['ara'] },
  { code: 'tr', nom: 'Turc', anglais: 'Turkish', deeplSource: 'TR', deeplCible: 'TR', iso3: ['tur'] },
  { code: 'sv', nom: 'Suédois', anglais: 'Swedish', deeplSource: 'SV', deeplCible: 'SV', iso3: ['swe'] },
  { code: 'da', nom: 'Danois', anglais: 'Danish', deeplSource: 'DA', deeplCible: 'DA', iso3: ['dan'] },
  { code: 'fi', nom: 'Finnois', anglais: 'Finnish', deeplSource: 'FI', deeplCible: 'FI', iso3: ['fin'] },
  { code: 'nb', nom: 'Norvégien', anglais: 'Norwegian Bokmål', deeplSource: 'NB', deeplCible: 'NB', iso3: ['nor', 'nob'] },
  { code: 'cs', nom: 'Tchèque', anglais: 'Czech', deeplSource: 'CS', deeplCible: 'CS', iso3: ['cze', 'ces'] },
  { code: 'el', nom: 'Grec', anglais: 'Greek', deeplSource: 'EL', deeplCible: 'EL', iso3: ['gre', 'ell'] },
  { code: 'hu', nom: 'Hongrois', anglais: 'Hungarian', deeplSource: 'HU', deeplCible: 'HU', iso3: ['hun'] },
  { code: 'ro', nom: 'Roumain', anglais: 'Romanian', deeplSource: 'RO', deeplCible: 'RO', iso3: ['rum', 'ron'] },
  { code: 'bg', nom: 'Bulgare', anglais: 'Bulgarian', deeplSource: 'BG', deeplCible: 'BG', iso3: ['bul'] },
  { code: 'sk', nom: 'Slovaque', anglais: 'Slovak', deeplSource: 'SK', deeplCible: 'SK', iso3: ['slo', 'slk'] },
  { code: 'sl', nom: 'Slovène', anglais: 'Slovenian', deeplSource: 'SL', deeplCible: 'SL', iso3: ['slv'] },
  { code: 'et', nom: 'Estonien', anglais: 'Estonian', deeplSource: 'ET', deeplCible: 'ET', iso3: ['est'] },
  { code: 'lv', nom: 'Letton', anglais: 'Latvian', deeplSource: 'LV', deeplCible: 'LV', iso3: ['lav'] },
  { code: 'lt', nom: 'Lituanien', anglais: 'Lithuanian', deeplSource: 'LT', deeplCible: 'LT', iso3: ['lit'] },
  { code: 'id', nom: 'Indonésien', anglais: 'Indonesian', deeplSource: 'ID', deeplCible: 'ID', iso3: ['ind'] },
  { code: 'he', nom: 'Hébreu', anglais: 'Hebrew', deeplSource: null, deeplCible: null, iso3: ['heb'] },
  { code: 'vi', nom: 'Vietnamien', anglais: 'Vietnamese', deeplSource: null, deeplCible: null, iso3: ['vie'] },
  { code: 'th', nom: 'Thaï', anglais: 'Thai', deeplSource: null, deeplCible: null, iso3: ['tha'] },
  { code: 'hi', nom: 'Hindi', anglais: 'Hindi', deeplSource: null, deeplCible: null, iso3: ['hin'] },
];

const PAR_CODE = new Map(LANGUES.map((l) => [l.code, l]));

function langue(code) {
  return PAR_CODE.get(code) || null;
}

// Langue d'une piste vidéo (« eng », « fre ») → nom français, ou le code tel quel si inconnu.
function depuisIso3(code) {
  const c = String(code || '').toLowerCase();
  if (!c || c === 'und') return null;
  return LANGUES.find((l) => l.iso3.includes(c) || l.code === c) || null;
}

function suffixe(code) {
  const l = langue(code);
  return l?.suffixe || code;
}

module.exports = { LANGUES, langue, depuisIso3, suffixe, codes: () => LANGUES.map((l) => l.code) };
