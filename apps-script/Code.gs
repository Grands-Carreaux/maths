/**
 * Grands Carreaux — réception des résultats dans un tableur Google.
 *
 * 1. Tapez votre code professeur entre les guillemets de la ligne CODE_PROF ci-dessous.
 *    C'est la SEULE ligne à modifier dans ce fichier.
 * 2. Déployer > Nouveau déploiement > Application Web
 *      Exécuter en tant que : Moi
 *      Qui peut accéder : Tout le monde
 * 3. Copiez l'adresse obtenue dans config.js (urlScript).
 */
const CODE_PROF = '';          // ← tapez votre code entre les guillemets, par exemple 'pythagore2026'
const ONGLET = 'Résultats';
const ENTETES = ['Date', 'ID', 'Prénom', 'Classe', 'Thème (id)', 'Exerciseur', 'Niveau', 'Nom du niveau', 'Score', 'Total', 'Durée (s)', 'Détail'];

// Vérifie qu'un code professeur a été choisi (au moins 4 caractères). Ne pas modifier.
function codeChoisi_() {
  return String(CODE_PROF).trim().length >= 4;
}

function onglet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ONGLET);
  if (!sh) {
    sh = ss.insertSheet(ONGLET);
    sh.appendRow(ENTETES);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, ENTETES.length).setFontWeight('bold');
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

/** Un élève envoie un résultat. */
function doPost(e) {
  let r;
  try { r = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, erreur: 'format' }); }
  if (r && r.action === 'supprimer') return supprimer_(r);
  if (!r || !r.id || !r.prenom || !r.classe) return json_({ ok: false, erreur: 'incomplet' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = onglet_();
    const id = texte_(r.id, 40);
    // Ignore un envoi déjà reçu (renvoi après une coupure réseau).
    const der = sh.getLastRow();
    if (der > 1) {
      const debut = Math.max(2, der - 500);
      const ids = sh.getRange(debut, 2, der - debut + 1, 1).getValues();
      if (ids.some(function (x) { return x[0] === id; })) return json_({ ok: true, doublon: true });
    }
    const date = new Date(r.date);
    sh.appendRow([
      isNaN(date) ? new Date() : date, id,
      texte_(r.prenom, 30), texte_(r.classe, 20),
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

/** La page professeur supprime un élève (toutes ses séries) ou une seule série. */
function supprimer_(r) {
  if (!codeChoisi_() || r.cle !== CODE_PROF) { Utilities.sleep(800); return json_({ ok: false, erreur: 'cle' }); }
  if (!r.id && !(r.prenom && r.classe)) return json_({ ok: false, erreur: 'incomplet' });
  const norm = function (x) { return String(x).trim().toLowerCase(); };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = onglet_();
    const n = sh.getLastRow() - 1;
    let compte = 0;
    if (n >= 1) {
      const v = sh.getRange(2, 1, n, 4).getValues();
      for (let i = n - 1; i >= 0; i--) { // de bas en haut, pour ne pas décaler les lignes
        const ok = r.id ? String(v[i][1]) === String(r.id) : norm(v[i][2]) === norm(r.prenom) && norm(v[i][3]) === norm(r.classe);
        if (ok) { sh.deleteRow(i + 2); compte++; }
      }
    }
    return json_({ ok: true, supprimees: compte });
  } finally {
    lock.releaseLock();
  }
}

/** La page professeur lit les résultats (avec le code professeur). */
function doGet(e) {
  if (!codeChoisi_()) return json_({ ok: false, erreur: 'Choisissez un code professeur (au moins 4 caractères) dans le script, ligne CODE_PROF, puis redéployez une nouvelle version.' });
  if (!e.parameter || e.parameter.cle !== CODE_PROF) { Utilities.sleep(800); return json_({ ok: false, erreur: 'cle' }); }
  const sh = onglet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return json_({ ok: true, lignes: [] });
  const v = sh.getRange(2, 1, n, ENTETES.length).getValues();
  const lignes = v.map(function (l) {
    return {
      date: l[0] instanceof Date ? l[0].toISOString() : String(l[0]), id: String(l[1]),
      prenom: String(l[2]), classe: String(l[3]), themeId: String(l[4]), theme: String(l[5]),
      niveau: Number(l[6]), score: Number(l[8]), total: Number(l[9]), duree: Number(l[10])
    };
  });
  return json_({ ok: true, lignes: lignes });
}
