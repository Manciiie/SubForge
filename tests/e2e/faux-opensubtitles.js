'use strict';
// Faux OpenSubtitles (format de l'API REST v1) pour le scénario de bout en bout en développement :
//   node tests/e2e/faux-opensubtitles.js 9556 &
//   SUBFORGE_OS_URL_TEST=http://127.0.0.1:9556/api/v1 node scripts/piloter.js tests/e2e/enligne.js
// (ignoré par la version installée : l'adresse de test n'est lue que hors empaquetage).
const http = require('http');
const port = Number(process.argv[2] || 9556);
const SRT = '1\r\n00:00:01,000 --> 00:00:03,000\r\nWe found it online.\r\n\r\n2\r\n00:00:04,000 --> 00:00:05,000\r\nGood.\r\n';
const s = http.createServer((req, res) => {
  let corps = '';
  req.on('data', (d) => { corps += d; });
  req.on('end', () => {
    const u = new URL(req.url, 'http://x');
    const json = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (u.pathname.startsWith('/fichier/')) { res.writeHead(200); res.end(SRT); return; }
    if (req.headers['api-key'] !== 'abcdefghijklmnopqrstuvwxyz012345') return json(401, { message: 'Invalid API key' });
    if (u.pathname === '/api/v1/infos/formats') return json(200, { data: {} });
    if (u.pathname === '/api/v1/subtitles') {
      if (u.searchParams.get('languages') !== 'en') return json(200, { data: [] });
      return json(200, { data: [
        { attributes: { language: 'en', release: 'Vacances.2019.1080p.BluRay', download_count: 1200, moviehash_match: true, files: [{ file_id: 7001, file_name: 'Vacances.2019.srt' }], feature_details: { title: 'Vacances', year: 2019 } } },
        { attributes: { language: 'en', release: 'Vacances.2019.WEB', download_count: 300, files: [{ file_id: 7002, file_name: 'b.srt' }] } },
      ] });
    }
    if (u.pathname === '/api/v1/download') return json(200, { link: `http://127.0.0.1:${port}/fichier/${JSON.parse(corps).file_id}`, file_name: 'Vacances.2019.srt', remaining: 4, reset_time: '23 heures' });
    json(404, { message: 'introuvable' });
  });
});
s.listen(port, '127.0.0.1');
