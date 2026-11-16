/**
 * Grands Carreaux — réception des résultats dans un tableur Google.
 *
 * 1. Tapez votre code professeur entre les guillemets de la ligne CODE_PROF ci-dessous.
 *    C'est la SEULE ligne à modifier dans ce fichier.
 * 2. Première fois : Déployer > Nouveau déploiement > Application Web
 *      Exécuter en tant que : Moi
 *      Qui peut accéder : Tout le monde
 *    Mise à jour : Déployer > Gérer les déploiements > crayon > Version : Nouvelle version > Déployer
 * 3. Copiez l'adresse obtenue dans config.js (urlScript).
 */
const CODE_PROF = '';          // ← tapez votre code entre les guillemets, par exemple 'pythagore2026'

const ONGLET = 'Résultats';
const ENTETES = ['Date', 'ID', 'Prénom', 'Classe', 'Thème (id)', 'Exerciseur', 'Niveau', 'Nom du niveau', 'Score', 'Total', 'Durée (s)', 'Détail'];
const ONGLET_JEU = 'Jeu';
const ENTETES_JEU = ['Date', 'ID', 'Prénom', 'Classe', 'Mode', 'Score', 'Durée (s)'];

// Vérifie qu'un code professeur a été choisi (au moins 4 caractères). Ne pas modifier.
function codeChoisi_() {
  return String(CODE_PROF).trim().length >= 4;
}

function onglet_(nom, entetes) {
  nom = nom || ONGLET; entetes = entetes || ENTETES;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nom);
  if (!sh) {
    sh = ss.insertSheet(nom);
    sh.appendRow(entetes);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, entetes.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Texte court, sans formule (empêche l'injection de formules dans le tableur).
function texte_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max || 60);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function entier_(v, min, max) {
  const n = Math.round(Number(v));
  return isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;
}
const norm_ = function (x) { return String(x).trim().toLowerCase(); };

// Vrai si l'identifiant a déjà été reçu (renvoi après une coupure réseau).
function dejaRecu_(sh, id) {
  const der = sh.getLastRow();
  if (der < 2) return false;
  const debut = Math.max(2, der - 500);
  return sh.getRange(debut, 2, der - debut + 1, 1).getValues().some(function (x) { return x[0] === id; });
}

/** Un élève envoie un résultat de série, ou un score du jeu. */
function doPost(e) {
  let r;
  try { r = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, erreur: 'format' }); }
  if (r && r.action === 'supprimer') return supprimer_(r);
  if (!r || !r.id || !r.prenom || !r.classe) return json_({ ok: false, erreur: 'incomplet' });
  if (r.type === 'jeu') return scoreJeu_(r);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = onglet_();
    const id = texte_(r.id, 40);
    if (dejaRecu_(sh, id)) return json_({ ok: true, doublon: true });
    const date = new Date(r.date);
    sh.appendRow([
      isNaN(date) ? new Date() : date, id,
      texte_(r.prenom, 30), texte_(r.classe, 30),
      texte_(r.themeId, 30), texte_(r.theme, 60),
      entier_(r.niveau, 1, 3), texte_(r.niveauNom, 40),
      entier_(r.score, 0, 100), entier_(r.total, 1, 100), entier_(r.duree, 0, 86400),
      texte_(r.detail, 300)
    ]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

/** Score du jeu « Au tableau ! » : on ne garde que le MEILLEUR score de chaque élève, pour chaque mode.
 *  Une nouvelle partie remplace la ligne de l'élève seulement si elle bat son record ; sinon rien n'est ajouté.
 *  Les anciennes lignes en double de cet élève sont supprimées au passage. */
function scoreJeu_(r) {
  const score = entier_(r.score, 0, 1000000), duree = entier_(r.duree, 0, 7200);
  const mode = r.mode === 'expert' ? 'expert' : 'normal';
  if (duree < 5 || score > 40 * duree + 100) return json_({ ok: true, ignore: true }); // score non plausible : non enregistré
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = onglet_(ONGLET_JEU, ENTETES_JEU);
    const id = texte_(r.id, 40);
    const n = sh.getLastRow() - 1;
    const v = n >= 1 ? sh.getRange(2, 1, n, ENTETES_JEU.length).getValues() : [];
    if (v.some(function (l) { return String(l[1]) === id; })) return json_({ ok: true, doublon: true });
    const miennes = [];
    v.forEach(function (l, i) {
      if (norm_(l[2]) === norm_(r.prenom) && norm_(l[3]) === norm_(r.classe) && String(l[4]) === mode) miennes.push({ i: i, score: Number(l[5]) });
    });
    const date = new Date(r.date);
    const ligne = [isNaN(date) ? new Date() : date, id, texte_(r.prenom, 30), texte_(r.classe, 30), mode, score, duree];
    if (!miennes.length) { sh.appendRow(ligne); return json_({ ok: true, record: true }); }
    miennes.sort(function (a, b) { return b.score - a.score; });
    const garde = miennes[0], record = score > garde.score;
    if (record) sh.getRange(garde.i + 2, 1, 1, ENTETES_JEU.length).setValues([ligne]);
    miennes.slice(1).map(function (m) { return m.i; }).sort(function (a, b) { return b - a; })
      .forEach(function (i) { sh.deleteRow(i + 2); }); // de bas en haut
    return json_({ ok: true, record: record });
  } finally {
    lock.releaseLock();
  }
}

/** Garde une seule ligne par élève et par mode dans l'onglet « Jeu » (la meilleure). Ne modifie rien s'il n'y a pas de doublon.
 *  Appelé automatiquement à l'ouverture de l'espace professeur. */
function dedoublonnerJeu_() {
  const sh = onglet_(ONGLET_JEU, ENTETES_JEU), n = sh.getLastRow() - 1;
  if (n < 2) return 0;
  const v = sh.getRange(2, 1, n, ENTETES_JEU.length).getValues(), meilleur = {};
  v.forEach(function (l, i) {
    const k = norm_(l[3]) + '|' + norm_(l[2]) + '|' + l[4];
    if (meilleur[k] === undefined || Number(l[5]) > Number(v[meilleur[k]][5])) meilleur[k] = i;
  });
  const garde = {}; Object.keys(meilleur).forEach(function (k) { garde[meilleur[k]] = true; });
  let i = -1;
  return reecrire_(sh, ENTETES_JEU.length, function () { i++; return garde[i]; });
}

/** Facultatif : la même chose à la main. Dans Apps Script, choisir « nettoyerJeu » dans la liste en haut, puis « Exécuter ». */
function nettoyerJeu() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { dedoublonnerJeu_(); } finally { lock.releaseLock(); }
}

/** Classement public du jeu : podium de la classe et podium toutes classes, pour chaque mode. */
function classement_(classe) {
  const sh = onglet_(ONGLET_JEU, ENTETES_JEU);
  const n = sh.getLastRow() - 1;
  const v = n >= 1 ? sh.getRange(2, 1, n, ENTETES_JEU.length).getValues() : [];
  function podium(mode, filtreClasse) {
    const meilleurs = {};
    v.forEach(function (l) {
      if (l[4] !== mode || (filtreClasse && norm_(l[3]) !== norm_(filtreClasse))) return;
      const k = norm_(l[3]) + '|' + norm_(l[2]);
      if (!meilleurs[k] || l[5] > meilleurs[k].score) meilleurs[k] = { prenom: String(l[2]), classe: String(l[3]), score: Number(l[5]) };
    });
    return Object.keys(meilleurs).map(function (k) { return meilleurs[k]; })
      .sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
  }
  return json_({
    ok: true,
    classe: { normal: podium('normal', classe), expert: podium('expert', classe) },
    tous: { normal: podium('normal', null), expert: podium('expert', null) }
  });
}

/** Réécrit un onglet en ne gardant que les lignes pour lesquelles garder(ligne) est vrai. Renvoie le nombre de lignes supprimées.
 *  (Beaucoup plus rapide que de supprimer les lignes une par une quand il y en a beaucoup.) */
function reecrire_(sh, ncols, garder) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const v = sh.getRange(2, 1, n, ncols).getValues(), reste = v.filter(garder);
  if (reste.length === n) return 0;
  sh.getRange(2, 1, n, ncols).clearContent();
  if (reste.length) sh.getRange(2, 1, reste.length, ncols).setValues(reste);
  sh.deleteRows(2 + reste.length, n - reste.length);
  return n - reste.length;
}

/** La page professeur supprime : une ou plusieurs séries (ids), un ou plusieurs scores du jeu (ids + feuille 'jeu'),
 *  ou un ou plusieurs élèves (eleves : [{prenom, classe}]) avec toutes leurs séries et tous leurs scores. */
function supprimer_(r) {
  if (!codeChoisi_() || r.cle !== CODE_PROF) { Utilities.sleep(800); return json_({ ok: false, erreur: 'cle' }); }
  const ids = (r.ids || (r.id ? [r.id] : [])).map(String);
  const eleves = r.eleves || (r.prenom && r.classe ? [{ prenom: r.prenom, classe: r.classe }] : []);
  if (!ids.length && !eleves.length) return json_({ ok: false, erreur: 'incomplet' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    let compte = 0;
    if (ids.length) {
      const set = {}; ids.forEach(function (i) { set[i] = true; });
      const sh = r.feuille === 'jeu' ? onglet_(ONGLET_JEU, ENTETES_JEU) : onglet_();
      compte += reecrire_(sh, r.feuille === 'jeu' ? ENTETES_JEU.length : ENTETES.length, function (l) { return !set[String(l[1])]; });
    }
    if (eleves.length) {
      const cles = {}; eleves.forEach(function (e) { cles[norm_(e.classe) + '|' + norm_(e.prenom)] = true; });
      const garder = function (l) { return !cles[norm_(l[3]) + '|' + norm_(l[2])]; };
      compte += reecrire_(onglet_(), ENTETES.length, garder);
      compte += reecrire_(onglet_(ONGLET_JEU, ENTETES_JEU), ENTETES_JEU.length, garder);
    }
    return json_({ ok: true, supprimees: compte });
  } finally {
    lock.releaseLock();
  }
}

/** Lecture : classement public du jeu, ou tous les résultats (page professeur, avec le code). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'classement') return classement_(p.classe || '');
  if (!codeChoisi_()) return json_({ ok: false, erreur: 'Choisissez un code professeur (au moins 4 caractères) dans le script, ligne CODE_PROF, puis redéployez une nouvelle version.' });
  if (p.cle !== CODE_PROF) { Utilities.sleep(800); return json_({ ok: false, erreur: 'cle' }); }
  // nettoyage automatique des anciennes parties en double (une ligne par élève et par mode)
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) { try { dedoublonnerJeu_(); } finally { lock.releaseLock(); } }
  const sh = onglet_();
  const n = sh.getLastRow() - 1;
  const v = n >= 1 ? sh.getRange(2, 1, n, ENTETES.length).getValues() : [];
  const lignes = v.map(function (l) {
    return {
      date: l[0] instanceof Date ? l[0].toISOString() : String(l[0]), id: String(l[1]),
      prenom: String(l[2]), classe: String(l[3]), themeId: String(l[4]), theme: String(l[5]),
      niveau: Number(l[6]), score: Number(l[8]), total: Number(l[9]), duree: Number(l[10])
    };
  });
  const sj = onglet_(ONGLET_JEU, ENTETES_JEU);
  const nj = sj.getLastRow() - 1;
  const jeu = (nj >= 1 ? sj.getRange(2, 1, nj, ENTETES_JEU.length).getValues() : []).map(function (l) {
    return { date: l[0] instanceof Date ? l[0].toISOString() : String(l[0]), id: String(l[1]), prenom: String(l[2]), classe: String(l[3]), mode: String(l[4]), score: Number(l[5]), duree: Number(l[6]) };
  });
  return json_({ ok: true, lignes: lignes, jeu: jeu });
}
