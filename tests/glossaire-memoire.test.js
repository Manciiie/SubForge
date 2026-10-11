'use strict';
// Glossaire, mémoire de traduction et traitement complet d'un document (faux moteur qui compte ses appels).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { creerGlossaire, appliquer, restituer } = require('../src/main/services/glossaire');
const { creerMemoire } = require('../src/main/services/memoire');
const { traduireDocument } = require('../src/main/services/pipeline');
const formats = require('../src/main/services/formats');

const silencieux = { avertissement() {}, erreur() {}, info() {} };
const dossier = () => fs.mkdtempSync(path.join(os.tmpdir(), 'subforge-gm-'));

// Faux moteur : « traduit » en préfixant [fr], garde les marqueurs, compte les textes reçus.
function fauxMoteur() {
  const recus = [];
  return {
    recus,
    async traduireTout(segments, _o, avancement = () => {}) {
      recus.push(...segments);
      avancement(segments.length, segments.length);
      return segments.map((s) => `[fr] ${s}`);
    },
  };
}

test('glossaire : mot entier, le plus long d\'abord, casse ignorée, accents gérés', () => {
  const d = dossier();
  const g = creerGlossaire({ fichier: path.join(d, 'glossaire.json'), journal: silencieux });
  g.enregistrer({ terme: 'Jon Snow', traduction: '' });
  g.enregistrer({ terme: 'Jon', traduction: '' });
  g.enregistrer({ terme: "Night's Watch", traduction: 'Garde de Nuit' });
  g.enregistrer({ terme: 'Ned', traduction: '' });
  g.enregistrer({ terme: 'Élise', traduction: '', cible: 'es' });
  const p = g.pour('fr');
  const r = appliquer('JON SNOW joined the night\'s watch, not Nedra.', p);
  assert.equal(r.texte, '<g n="0"/> joined the <g n="1"/>, not Nedra.');
  assert.deepEqual(r.valeurs, ['JON SNOW', 'Garde de Nuit']);
  assert.equal(appliquer('Élise est là', p).valeurs.length, 0, 'terme limité à l\'espagnol');
  assert.equal(appliquer('Élise est là', g.pour('es')).valeurs.length, 1);
  // Marqueurs de mise en forme intacts, terme entre balises reconnu.
  const b = appliquer('<x n="0"/>Jon<x n="1"/>, run!', p);
  assert.equal(b.texte, '<x n="0"/><g n="0"/><x n="1"/>, run!');
  // Restitution, et marqueur perdu compté.
  assert.deepEqual(restituer('<g n="0"/> a rejoint la <g n="1"/>.', r.valeurs), { texte: 'JON SNOW a rejoint la Garde de Nuit.', perdus: 0 });
  assert.equal(restituer('a rejoint la <g n="1"/>.', r.valeurs).perdus, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

test('glossaire : doublons, caractères interdits, import CSV avec bilan, fichier abîmé mis de côté', () => {
  const d = dossier();
  const f = path.join(d, 'glossaire.json');
  const g = creerGlossaire({ fichier: f, journal: silencieux });
  g.enregistrer({ terme: 'Winterfell', traduction: '' });
  assert.throws(() => g.enregistrer({ terme: 'winterfell', traduction: 'x' }), /déjà dans le glossaire/);
  assert.throws(() => g.enregistrer({ terme: '<script>', traduction: '' }), /pas autorisés/);
  assert.throws(() => g.enregistrer({ terme: '   ', traduction: '' }), /vide/);
  const bilan = g.importer('terme;traduction\nKing\'s Landing;Port-Réal\nWinterfell;\n;vide\nThe Wall;Le Mur;fr\nDragonstone;Peyredragon;xx\n', ['fr', 'en']);
  assert.equal(bilan.ajoutes, 3);
  assert.equal(bilan.ignores, 2);
  assert.equal(g.lister().entrees.find((e) => e.terme === 'The Wall').cible, 'fr');
  assert.equal(g.lister().entrees.find((e) => e.terme === 'Dragonstone').cible, '*');
  // Relu depuis le disque par une nouvelle instance.
  assert.equal(creerGlossaire({ fichier: f, journal: silencieux }).lister().entrees.length, 4);
  fs.writeFileSync(f, '{ abîmé');
  const g2 = creerGlossaire({ fichier: f, journal: silencieux });
  const l = g2.lister();
  assert.equal(l.entrees.length, 0);
  assert.match(l.avertissement, /mis de côté/);
  assert.ok(fs.readdirSync(d).some((x) => x.startsWith('glossaire.json.corrompu-')));
  fs.rmSync(d, { recursive: true, force: true });
});

test('mémoire : relue depuis le disque, ligne abîmée ignorée, vidée', () => {
  const d = dossier();
  const f = path.join(d, 'memoire.jsonl');
  const ctx = { moteur: 'deepl', variante: 'ton:defaut', source: 'en', cible: 'fr' };
  const m = creerMemoire({ fichier: f, journal: silencieux });
  assert.deepEqual(m.ajouter(ctx, [['Hello', 'Bonjour'], ['Bye', 'Au revoir'], ['Vide', '']]), { ok: true });
  fs.appendFileSync(f, '{"k":"coupé au milieu\n');
  m.ajouter(ctx, [['Yes', 'Oui']]);
  const m2 = creerMemoire({ fichier: f, journal: silencieux });
  const r = m2.chercher(ctx, ['Hello', 'Yes', 'Nouveau', 'Vide']);
  assert.deepEqual([...r.trouves], [[0, 'Bonjour'], [1, 'Oui']]);
  assert.deepEqual(r.manquants, [2, 3]);
  assert.equal(m2.chercher({ ...ctx, cible: 'es' }, ['Hello']).trouves.size, 0, 'autre langue = autre entrée');
  assert.equal(m2.etat().entrees, 3);
  m2.vider();
  assert.equal(fs.existsSync(f), false);
  assert.equal(m2.etat().entrees, 0);
  fs.rmSync(d, { recursive: true, force: true });
});

test('mémoire : écriture impossible → traduction quand même, erreur annoncée', async () => {
  const d = dossier();
  const bloque = path.join(d, 'pas-un-dossier');
  fs.writeFileSync(bloque, 'x');
  const m = creerMemoire({ fichier: path.join(bloque, 'memoire.jsonl'), journal: silencieux });
  const doc = formats.analyser('1\n00:00:01,000 --> 00:00:02,000\nHello\n', 'srt');
  const bilan = await traduireDocument(doc, { moteurs: fauxMoteur(), memoire: m, options: { moteur: 'deepl', cible: 'fr' } });
  assert.equal(doc.repliques[0].texte, '[fr] Hello');
  assert.ok(bilan.erreurMemoire);
  fs.rmSync(d, { recursive: true, force: true });
});

test('traitement complet : doublons envoyés une fois, deuxième passage 100 % mémoire, glossaire respecté', async () => {
  const d = dossier();
  const memoire = creerMemoire({ fichier: path.join(d, 'm.jsonl'), journal: silencieux });
  const g = creerGlossaire({ fichier: path.join(d, 'g.json'), journal: silencieux });
  g.enregistrer({ terme: 'Jon Snow', traduction: '' });
  g.enregistrer({ terme: "Night's Watch", traduction: 'Garde de Nuit' });
  const srt = '1\n00:00:01,000 --> 00:00:02,000\n<i>Jon Snow</i> joined\nthe Night\'s Watch.\n\n'
    + '2\n00:00:03,000 --> 00:00:04,000\nYes.\n\n3\n00:00:05,000 --> 00:00:06,000\nYes.\n\n'
    + '4\n00:00:07,000 --> 00:00:08,000\nJon Snow.\n';
  const options = { moteur: 'deepl', source: 'en', cible: 'fr', formalite: 'defaut' };

  const m1 = fauxMoteur();
  const doc1 = formats.analyser(srt, 'srt');
  const b1 = await traduireDocument(doc1, { moteurs: m1, memoire, glossairePrepare: g.pour('fr'), options });
  assert.deepEqual(m1.recus, ['<g n="0"/><x n="0"/> joined the <g n="1"/>.', 'Yes.'], 'doublon et réplique « nom seul » non envoyés');
  assert.equal(doc1.repliques[0].texte, '<i>[fr] Jon Snow</i> joined\nthe Garde de Nuit.');
  assert.equal(doc1.repliques[1].texte, '[fr] Yes.');
  assert.equal(doc1.repliques[2].texte, '[fr] Yes.');
  assert.equal(doc1.repliques[3].texte, 'Jon Snow.');
  assert.equal(b1.envoyes, 2);
  assert.equal(b1.repris, 0);

  const m2 = fauxMoteur();
  const doc2 = formats.analyser(srt, 'srt');
  const b2 = await traduireDocument(doc2, { moteurs: m2, memoire, glossairePrepare: g.pour('fr'), options });
  assert.equal(m2.recus.length, 0, 'aucun appel au moteur au deuxième passage');
  assert.equal(b2.repris, 2);
  assert.ok(b2.caracteresEconomises > 10);
  assert.deepEqual(doc2.repliques.map((r) => r.texte), doc1.repliques.map((r) => r.texte));

  // Glossaire modifié : la mémoire reste valable, la nouvelle traduction du terme est appliquée.
  const e = g.lister().entrees.find((x) => x.terme === "Night's Watch");
  g.enregistrer({ ...e, traduction: 'Garde de la Nuit' });
  const g2 = creerGlossaire({ fichier: path.join(d, 'g.json'), journal: silencieux });
  const doc3 = formats.analyser(srt, 'srt');
  await traduireDocument(doc3, { moteurs: fauxMoteur(), memoire, glossairePrepare: g2.pour('fr'), options });
  assert.match(doc3.repliques[0].texte, /Garde de la Nuit/);

  // Mémoire désactivée : tout est renvoyé.
  const m4 = fauxMoteur();
  await traduireDocument(formats.analyser(srt, 'srt'), { moteurs: m4, memoire, options: { ...options, memoire: false } });
  assert.equal(m4.recus.length, 3);
  fs.rmSync(d, { recursive: true, force: true });
});

test('garde-fou : piste restée en anglais → erreur claire, rien en mémoire ; anciennes recopies de la mémoire ignorées', async () => {
  const d = dossier();
  const memoire = creerMemoire({ fichier: path.join(d, 'm.jsonl'), journal: silencieux });
  const srt = Array.from({ length: 10 }, (_, i) => `${i + 1}\n00:00:0${i},000 --> 00:00:0${i},900\nThey are Americans number ${i}\n`).join('\n');
  const lire = () => formats.analyser(srt, 'srt');
  const options = { moteur: 'ollama', modele: 'petit:1b', source: 'en', cible: 'fr', memoire: true };
  const recopieur = { async traduireTout(segments) { return segments.slice(); } };
  await assert.rejects(traduireDocument(lire(), { moteurs: recopieur, memoire, options }),
    /Traduction ratée : 10 répliques sur 10 sont restées telles quelles\. Le modèle d'IA locale « petit:1b »/);
  assert.equal(memoire.etat().entrees, 0, 'aucune recopie enregistrée en mémoire');

  // Mémoire « empoisonnée » par une version précédente : ces entrées sont ignorées et retraduites.
  const contexte = { moteur: 'ollama', variante: 'modele:petit:1b', source: 'en', cible: 'fr' };
  memoire.ajouter(contexte, [['They are Americans number 0', 'They are Americans number 0'], ['They are Americans number 1', 'Ce sont des Américains numéro 1']]);
  const m = fauxMoteur();
  const doc = lire();
  const b = await traduireDocument(doc, { moteurs: m, memoire, options });
  assert.equal(b.repris, 1);
  assert.ok(m.recus.includes('They are Americans number 0'));
  assert.equal(doc.repliques[0].texte, '[fr] They are Americans number 0');
  assert.equal(doc.repliques[1].texte, 'Ce sont des Américains numéro 1');
  fs.rmSync(d, { recursive: true, force: true });
});
