'use strict';
// Sous-titres en ligne : faux serveur au format de l'API OpenSubtitles (REST v1).

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { creerEnLigne, empreinte, lireNom } = require('../src/main/services/enligne');

const silencieux = { avertissement() {}, erreur() {}, info() {} };
const SRT = '1\r\n00:00:01,000 --> 00:00:02,000\r\nHello there\r\n';

function serveur(options = {}) {
  return new Promise((ok) => {
    const journal = [];
    const s = http.createServer((req, res) => {
      let corps = '';
      req.on('data', (d) => { corps += d; });
      req.on('end', () => {
        const u = new URL(req.url, 'http://x');
        journal.push({ methode: req.method, chemin: u.pathname, params: Object.fromEntries(u.searchParams), brut: u.search, cle: req.headers['api-key'], auth: req.headers.authorization, ua: req.headers['user-agent'], corps: corps ? JSON.parse(corps) : null });
        const json = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
        // Le lien de téléchargement est public (pas de clé d'API) : comme chez OpenSubtitles.
        if (u.pathname.startsWith('/fichier/')) {
          s.cleRecueSurLien = req.headers['api-key'];
          res.writeHead(200, { 'Content-Type': 'application/x-subrip' });
          res.end(options.contenu ?? SRT);
          return;
        }
        if (req.headers['api-key'] !== 'CLE-TEST') return json(401, { message: 'Invalid API key' });
        if (u.pathname === '/api/v1/login') {
          if (JSON.parse(corps).password !== 'secret') return json(401, { message: 'Error, invalid username/password' });
          return json(200, { token: 'JETON-123', status: 200, user: { allowed_downloads: 20, user_id: 1 }, base_url: 'api.opensubtitles.com' });
        }
        if (u.pathname === '/api/v1/infos/formats') return json(200, { data: { output_formats: ['srt'] } });
        if (u.pathname === '/api/v1/subtitles') {
          if (options.vide) return json(200, { total_count: 0, data: [] });
          return json(200, {
            total_count: 3, page: 1, data: [
              { id: '1', type: 'subtitle', attributes: { language: 'en', release: 'Show.S02E05.WEB', download_count: 900, machine_translated: false, files: [{ file_id: 11, file_name: 'Show.S02E05.WEB.srt' }], feature_details: { title: 'The Office', year: 2005 } } },
              { id: '2', type: 'subtitle', attributes: { language: 'en', release: 'Show.S02E05.720p.HDTV', download_count: 50, moviehash_match: true, files: [{ file_id: 22, file_name: 'Show.S02E05.720p.srt' }], feature_details: { title: 'The Office' } } },
              { id: '3', type: 'subtitle', attributes: { language: 'en', release: 'auto', download_count: 5000, machine_translated: true, files: [{ file_id: 33, file_name: 'x.srt' }] } },
              { id: '4', type: 'subtitle', attributes: { language: 'en', files: [] } },
            ],
          });
        }
        if (u.pathname === '/api/v1/download') {
          if (options.quota) return json(406, { message: 'You have downloaded your allowed 20 subtitles for 24h', remaining: 0, reset_time: '23 heures et 59 minutes' });
          const lien = options.lien || `http://127.0.0.1:${s.address().port}/fichier/${JSON.parse(corps).file_id}`;
          return json(200, { link: lien, file_name: 'Show.S02E05.720p.srt', requests: 1, remaining: 19, reset_time: '23 heures' });
        }
        json(404, { message: 'not found' });
      });
    });
    s.journal = journal;
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

function film(nom, taille = 300000) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-enligne-'));
  const f = path.join(d, nom);
  fs.writeFileSync(f, crypto.randomBytes(taille));
  return f;
}

const ecrire = (cheminFilm, contenu, ext, langue) => {
  const c = path.join(path.dirname(cheminFilm), `${path.basename(cheminFilm, path.extname(cheminFilm))}.${langue}${ext}`);
  fs.writeFileSync(c, contenu);
  return c;
};

test('nom du fichier → titre, année, saison, épisode', () => {
  assert.deepEqual(lireNom('C:/Films/The.Office.US.S02E05.720p.WEB-DL.mkv'), { saison: 2, episode: 5, titre: 'The Office US' });
  assert.deepEqual(lireNom('/x/Heat.1995.1080p.BluRay.x264.mkv'), { annee: 1995, titre: 'Heat' });
  assert.deepEqual(lireNom('/x/Le Grand Film (2024).mkv'), { annee: 2024, titre: 'Le Grand Film' });
  assert.deepEqual(lireNom('/x/Show 3x07.avi'), { saison: 3, episode: 7, titre: 'Show' });
  assert.deepEqual(lireNom('/x/2001 A Space Odyssey.mkv'), { titre: '2001 A Space Odyssey' });
});

test('empreinte OpenSubtitles : identique à l\'implémentation de référence (Python)', () => {
  const f = film('a.mkv', 1234567);
  const attendu = (() => {
    const b = fs.readFileSync(f);
    let s = BigInt(b.length);
    for (const off of [0, b.length - 65536]) for (let i = 0; i < 65536; i += 8) s += b.readBigUInt64LE(off + i);
    return BigInt.asUintN(64, s).toString(16).padStart(16, '0');
  })();
  assert.equal(empreinte(f), attendu);
  assert.equal(empreinte(film('petit.mkv', 1000)), null, 'moins de 128 Ko : pas d\'empreinte');
});

test('recherche : paramètres triés, empreinte + titre + épisode, connexion, tri des résultats', async () => {
  const s = await serveur();
  const url = `http://127.0.0.1:${s.address().port}/api/v1`;
  const en = creerEnLigne({ fetch, lireSecrets: () => ({ cle: 'CLE-TEST', motDePasse: 'secret' }), utilisateur: () => 'moi', version: '1.1.0', urlTest: url, journal: silencieux });
  const f = film('The.Office.S02E05.720p.mkv');
  const r = await en.chercher(f, { langue: 'en' });
  const login = s.journal.find((j) => j.chemin === '/api/v1/login');
  assert.deepEqual(login.corps, { username: 'moi', password: 'secret' });
  const q = s.journal.find((j) => j.chemin === '/api/v1/subtitles');
  assert.equal(q.brut.slice(1).split('&').map((x) => x.split('=')[0]).join(','), 'episode_number,languages,moviehash,query,season_number', 'paramètres triés');
  assert.equal(q.params.query, 'the office');
  assert.equal(q.params.moviehash, empreinte(f));
  assert.equal(q.auth, 'Bearer JETON-123');
  assert.equal(q.ua, 'SubForge v1.1.0');
  assert.deepEqual(r.resultats.map((x) => x.fileId), [22, 11, 33], 'correspondance exacte, puis humain, puis traduction automatique');
  assert.equal(r.resultats[0].exact, true);
  s.closeAllConnections(); s.close();
});

test('téléchargement : fichier écrit, quota restant ; quota épuisé, clé refusée, lien étranger, contenu invalide', async () => {
  const f = film('Heat.1995.mkv');
  let s = await serveur();
  let url = `http://127.0.0.1:${s.address().port}/api/v1`;
  const secrets = { cle: 'CLE-TEST', motDePasse: '' };
  let en = creerEnLigne({ fetch, lireSecrets: () => secrets, urlTest: url, journal: silencieux });
  const t = await en.telecharger(f, 22, { langue: 'en', ecrire });
  assert.equal(fs.readFileSync(t.fichier, 'utf8'), SRT);
  assert.equal(t.restants, 19);
  assert.ok(!s.journal.some((j) => j.chemin.endsWith('/login')), 'sans compte : pas de connexion');
  assert.equal(s.cleRecueSurLien, undefined, 'la clé d\'API n\'est jamais envoyée au lien de téléchargement');
  s.closeAllConnections(); s.close();

  s = await serveur({ quota: true });
  url = `http://127.0.0.1:${s.address().port}/api/v1`;
  en = creerEnLigne({ fetch, lireSecrets: () => secrets, urlTest: url, journal: silencieux });
  await assert.rejects(en.telecharger(f, 22, { langue: 'en', ecrire }), /Quota de téléchargements du jour atteint \(de nouveau possible dans 23 heures et 59 minutes\)/);
  s.closeAllConnections(); s.close();

  s = await serveur({ lien: 'https://exemple-malveillant.com/x.srt' });
  url = `http://127.0.0.1:${s.address().port}/api/v1`;
  en = creerEnLigne({ fetch, lireSecrets: () => secrets, urlTest: url, journal: silencieux });
  await assert.rejects(en.telecharger(f, 22, { langue: 'en', ecrire }), /ne mène pas chez OpenSubtitles/);
  s.closeAllConnections(); s.close();

  for (const [contenu, motif] of [['', /vide/], [Buffer.from([0x50, 0x4b, 3, 4]), /zip/], [Buffer.from([0x1f, 0x8b, 8]), /compressé/]]) {
    s = await serveur({ contenu });
    url = `http://127.0.0.1:${s.address().port}/api/v1`;
    en = creerEnLigne({ fetch, lireSecrets: () => secrets, urlTest: url, journal: silencieux });
    await assert.rejects(en.telecharger(f, 22, { langue: 'en', ecrire }), motif);
    s.closeAllConnections(); s.close();
  }

  s = await serveur();
  url = `http://127.0.0.1:${s.address().port}/api/v1`;
  en = creerEnLigne({ fetch, lireSecrets: () => ({ cle: 'MAUVAISE' }), urlTest: url, journal: silencieux });
  await assert.rejects(en.chercher(f, { langue: 'en' }), /refuse la clé d'API/);
  en = creerEnLigne({ fetch, lireSecrets: () => ({ cle: 'CLE-TEST', motDePasse: 'faux' }), utilisateur: () => 'moi', urlTest: url, journal: silencieux });
  await assert.rejects(en.tester(), /refuse la clé d'API ou le compte/);
  en = creerEnLigne({ fetch, lireSecrets: () => ({}), urlTest: url, journal: silencieux });
  await assert.rejects(en.chercher(f, { langue: 'en' }), /Aucune clé d'API OpenSubtitles/);
  s.closeAllConnections(); s.close();
});

test('hors ligne : message clair ; aucun résultat : liste vide renvoyée (l\'écran dit « Rien trouvé »)', async () => {
  const en = creerEnLigne({ fetch, lireSecrets: () => ({ cle: 'CLE-TEST' }), urlTest: 'http://127.0.0.1:1/api/v1', journal: silencieux });
  await assert.rejects(en.chercher(film('Heat.1995.mkv'), { langue: 'en' }), /injoignable/);
  const s = await serveur({ vide: true });
  const en2 = creerEnLigne({ fetch, lireSecrets: () => ({ cle: 'CLE-TEST' }), urlTest: `http://127.0.0.1:${s.address().port}/api/v1`, journal: silencieux });
  assert.deepEqual((await en2.chercher(film('Heat.1995.mkv'), { langue: 'fr' })).resultats, []);
  s.closeAllConnections(); s.close();
});
