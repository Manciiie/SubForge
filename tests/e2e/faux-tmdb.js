'use strict';
// Faux TMDB (format des réponses de l'API v3) pour les tests.
// Jeton accepté : JETON_TEST (en-tête Bearer) ou CLE_TEST (paramètre api_key).
//   Unitaire : const s = await fauxTmdb(); urlTest = s.url
//   E2E      : node tests/e2e/faux-tmdb.js 9557  puis  SUBFORGE_TMDB_URL_TEST=http://127.0.0.1:9557/3

const http = require('http');

const JETON_TEST = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0ZXN0In0.c2lnbmF0dXJl';
const CLE_TEST = '0123456789abcdef0123456789abcdef';

const FILMS = [
  { id: 1001, title: 'The Witch: Part 1. The Subversion', original_title: '마녀', release_date: '2018-06-27', overview: 'A girl who escaped a mysterious facility ten years ago lives with an old couple on a farm.\u0007',
    cast: [{ character: 'Ja-yoon', name: 'Kim Da-mi', gender: 1, order: 0 }, { character: 'Dr. Baek', name: 'Jo Min-su', gender: 1, order: 1 },
      { character: 'Nobleman', name: 'Choi Woo-shik', gender: 2, order: 2 }, { character: 'Mr. Choi', name: 'Park Hee-soon', gender: 2, order: 3 }, { character: 'Myung-hee (voice)', name: 'Go Min-si', gender: 0, order: 4 }] },
  { id: 1002, title: 'The Witch', original_title: 'The VVitch', release_date: '2015-01-27', overview: 'A family in 1630s New England.', cast: [] },
];
const SERIES = [{ id: 100, name: 'Serie', original_name: 'Serie', first_air_date: '2020-01-01', overview: 'A test series about a detective.' }];

function fauxTmdb(port = 0) {
  return new Promise((ok) => {
    const requetes = [];
    const s = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      requetes.push({ chemin: u.pathname, params: Object.fromEntries(u.searchParams), auth: req.headers.authorization || null });
      const json = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
      const autorise = req.headers.authorization === `Bearer ${JETON_TEST}` || u.searchParams.get('api_key') === CLE_TEST;
      if (!autorise) return json(401, { status_code: 7, status_message: 'Invalid API key: You must be granted a valid key.' });
      const p = u.pathname.replace(/^\/3/, '');
      const q = (u.searchParams.get('query') || '').toLowerCase();
      const film = (f) => ({ id: f.id, title: f.title, original_title: f.original_title, release_date: f.release_date, overview: f.overview, media_type: 'movie' });
      const serie = (x) => ({ id: x.id, name: x.name, original_name: x.original_name, first_air_date: x.first_air_date, overview: x.overview, media_type: 'tv' });
      const correspond = (t) => q.split(/\s+/).filter(Boolean).every((m) => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').includes(m));
      if (p === '/authentication') return json(200, { success: true });
      if (p === '/search/movie') return json(200, { results: FILMS.filter((f) => correspond(f.title)).map(film) });
      if (p === '/search/tv') return json(200, { results: SERIES.filter((x) => correspond(x.name)).map(serie) });
      if (p === '/search/multi') return json(200, { results: [...FILMS.filter((f) => correspond(f.title)).map(film), ...SERIES.filter((x) => correspond(x.name)).map(serie), { id: 5, media_type: 'person', name: 'Someone' }] });
      const m = /^\/movie\/(\d+)$/.exec(p);
      if (m) {
        const f = FILMS.find((x) => x.id === Number(m[1]));
        return f ? json(200, { ...film(f), credits: { cast: f.cast } }) : json(404, { status_code: 34 });
      }
      if (p === '/tv/100') {
        return json(200, { ...serie(SERIES[0]), aggregate_credits: { cast: [
          { name: 'Actor A', gender: 2, total_episode_count: 10, roles: [{ character: 'Detective Park', episode_count: 10 }] },
          { name: 'Actor B', gender: 1, total_episode_count: 8, roles: [{ character: 'Sergeant Lee', episode_count: 8 }] },
        ] } });
      }
      if (p === '/tv/100/season/1/episode/2') return json(200, { name: 'The Visitor', overview: 'A stranger arrives in town.', guest_stars: [{ character: 'The Visitor', name: 'Guest C', gender: 1 }] });
      return json(404, { status_code: 34, status_message: 'The resource you requested could not be found.' });
    });
    s.requetes = requetes;
    s.listen(port, '127.0.0.1', () => { s.url = `http://127.0.0.1:${s.address().port}/3`; ok(s); });
  });
}

module.exports = { fauxTmdb, JETON_TEST, CLE_TEST };
if (require.main === module) fauxTmdb(Number(process.argv[2] || 9557)).then((s) => console.log(`Faux TMDB : ${s.url}`));
