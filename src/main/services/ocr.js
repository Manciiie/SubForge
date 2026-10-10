'use strict';
// Lecture du texte des sous-titres en image (OCR), hors ligne : Tesseract (tesseract.js, WASM) dans des
// threads de travail, jamais dans l'interface. Données de langue livrées avec l'app (aucun téléchargement).
// Sans Electron : testé par tests/ocr.test.js.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { versPgm } = require('./pgs');

// Langues de SubForge → données Tesseract livrées.
const LANGUES_OCR = { en: 'eng', 'en-GB': 'eng', fr: 'fra', es: 'spa', de: 'deu', it: 'ita', pt: 'por', 'pt-BR': 'por', nl: 'nld' };

function erreurAnnulation() {
  return Object.assign(new Error('Traduction annulée.'), { name: 'AbortError' });
}

// Corrections des confusions habituelles de l'OCR sur des sous-titres.
function nettoyer(texte, langue) {
  let t = texte.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  t = t
    .replace(/(^|[\s"«(\-—])\|(?=[\s'’a-zA-Z])/gm, '$1I')  // « | told you » → « I told you »
    .replace(/\|/g, 'I')
    .replace(/[ \t]+([,.!?;:…])/g, (m, p) => (langue === 'fr' && /[!?;:]/.test(p) ? ` ${p}` : p))
    .replace(/^[-–—]\s*/gm, '- ')                            // tirets de dialogue uniformes
    .replace(/[ \t]{2,}/g, ' ');
  if (langue === 'en' || langue === 'en-GB') t = t.replace(/\bl'm\b/g, 'I\'m').replace(/\bl'(ll|ve|d)\b/g, 'I\'$1').replace(/(^|\s)l(?=\s)/gm, '$1I');
  return t.trim();
}

function creerOcr({ dossierLangues, cheminTravailleur = null, journal = console, travailleurs = Math.max(1, Math.min(4, os.cpus().length - 1)) }) {
  function disponible(langue) {
    const code = LANGUES_OCR[langue];
    return Boolean(code && fs.existsSync(path.join(dossierLangues, `${code}.traineddata.gz`)));
  }

  // images : [{ largeur, hauteur, gris }] → [{ texte, confiance }] (même ordre)
  async function lire(images, { langue, signal, surAvancement = () => {} }) {
    const code = LANGUES_OCR[langue];
    if (!code || !disponible(langue)) throw new Error(`Lecture des sous-titres en image non disponible pour cette langue (langues lues : anglais, français, espagnol, allemand, italien, portugais, néerlandais).`);
    if (signal?.aborted) throw erreurAnnulation();
    const Tesseract = require('tesseract.js');
    const options = { langPath: dossierLangues, gzip: true, cacheMethod: 'none', errorHandler: (e) => journal.erreur('[ocr] travailleur :', e) };
    if (cheminTravailleur) options.workerPath = cheminTravailleur;
    const planificateur = Tesseract.createScheduler();
    let arrete = false;
    const arreter = () => { if (!arrete) { arrete = true; planificateur.terminate().catch((e) => journal.avertissement('[ocr] arrêt :', e?.message || e)); } };
    signal?.addEventListener('abort', arreter, { once: true });
    try {
      const n = Math.max(1, Math.min(travailleurs, images.length));
      for (let k = 0; k < n; k++) {
        const w = await Tesseract.createWorker(code, Tesseract.OEM.LSTM_ONLY, options);
        await w.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, preserve_interword_spaces: '1' });
        planificateur.addWorker(w);
        if (signal?.aborted) throw erreurAnnulation();
      }
      let faits = 0;
      // Les tâches en attente ne se terminent pas toujours quand on arrête Tesseract : l'annulation gagne la course.
      const annulation = new Promise((_ok, ko) => {
        if (signal?.aborted) ko(erreurAnnulation());
        signal?.addEventListener('abort', () => ko(erreurAnnulation()), { once: true });
      });
      annulation.catch(() => { /* silence-ok: l'annulation est relancée par Promise.race juste en dessous */ });
      const resultats = await Promise.race([annulation, Promise.all(images.map(async (img) => {
        const r = await planificateur.addJob('recognize', versPgm(img));
        faits += 1;
        surAvancement(faits, images.length);
        return { texte: nettoyer(r.data.text || '', langue), confiance: Math.round(r.data.confidence ?? 0) };
      }))]);
      if (signal?.aborted) throw erreurAnnulation();
      return resultats;
    } catch (e) {
      if (signal?.aborted) throw erreurAnnulation();
      journal.erreur('[ocr] échec :', e);
      throw new Error(`Lecture des images (OCR) impossible : ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      signal?.removeEventListener('abort', arreter);
      arreter();
    }
  }

  return { disponible, lire };
}

// Construit un document SRT à partir des répliques lues (minutages en millisecondes).
function versSrt(repliques, textes) {
  const temps = (ms) => {
    const t = Math.max(0, Math.round(ms));
    const h = Math.floor(t / 3600000); const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000); const r = t % 1000;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`;
  };
  const doc = { format: 'srt', eol: '\r\n', repliques: [] };
  repliques.forEach((r, i) => {
    const texte = textes[i]?.texte;
    if (!texte) return;
    doc.repliques.push({ indice: String(doc.repliques.length + 1), minutage: `${temps(r.debut)} --> ${temps(r.fin)}`, debut: temps(r.debut), texte });
  });
  return doc;
}

module.exports = { creerOcr, nettoyer, versSrt, LANGUES_OCR };
