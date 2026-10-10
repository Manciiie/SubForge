'use strict';
// Faux serveur DeepL (format officiel des réponses) pour le scénario de bout en bout en développement :
//   node tests/e2e/faux-deepl.js 9555 &
//   SUBFORGE_DEEPL_URL_TEST=http://127.0.0.1:9555 node scripts/piloter.js tests/e2e/traduction.js
// (ignoré par la version installée : l'adresse de test n'est lue que hors empaquetage).
const http = require('http');
const port = Number(process.argv[2] || 9555);
http.createServer((req, res) => {
  let corps = '';
  req.on('data', (d) => { corps += d; });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    if (!/^DeepL-Auth-Key \S+$/.test(req.headers.authorization || '')) { res.statusCode = 403; res.end('{}'); return; }
    if (req.url === '/v2/usage') { res.end(JSON.stringify({ character_count: 1234, character_limit: 500000 })); return; }
    const o = JSON.parse(corps);
    res.end(JSON.stringify({ translations: o.text.map((t) => ({ detected_source_language: 'EN', text: `[${o.target_lang}] ${t}` })) }));
  });
}).listen(port, '127.0.0.1');
