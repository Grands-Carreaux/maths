/* Grands Carreaux — moteur du site (portail, séries d'exercices, espace professeur). */
(function () {
  'use strict';

  const C = Object.assign({ nomSite: 'Grands Carreaux', urlScript: '', classes: [], nbQuestions: 10 }, window.CONFIG || {});
  const THEMES = window.THEMES;
  const { Q, gcd, fracQ, M, cle } = window.MATHS;
  const NIVEAUX = ['4e', '3e'];
  /* Les grands domaines du programme. « sous » : les chapitres (champ domaine des exerciseurs dans themes.js) rangés dans ce domaine.
     « niveaux » : si présent, le domaine n'apparaît que pour ces niveaux. */
  const ICO = {
    nombres: '<path d="M3 8h9M7.5 3.5v9M15 16l6 6M21 16l-6 6"/>',
    geometrie: '<path d="M4 21V4l17 17z"/><path d="M4 16h5v5"/>',
    grandeurs: '<circle cx="12" cy="13" r="8.5"/><path d="M12 8.5V13l3 2M10 2h4"/>',
    donnees: '<path d="M3 21h18"/><path d="M5 21v-6h3.5v6M10.5 21V9H14v12M16 21V4h3.5v17"/>',
    algo: '<path d="M4 7h6l1.5 2H20v4H11.5L10 15H4z"/><path d="M4 18h9"/>',
    automatismes: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>'
  };
  const DOMAINES = [
    { id: 'nombres', nom: 'Nombres et calculs', c: '#3a5bd9', forme: '50%', sous: ['Nombres relatifs', 'Fractions', 'Calcul littéral'] },
    { id: 'geometrie', nom: 'Espace et géométrie', c: '#14866d', forme: '0', sous: ['Géométrie'] },
    { id: 'grandeurs', nom: 'Grandeurs et mesures', c: '#e8590c', forme: '30%', sous: [] },
    { id: 'donnees', nom: 'Données et fonctions', c: '#8338ec', forme: '12%', sous: ['Fonctions', 'Statistiques', 'Probabilités'] },
    { id: 'algo', nom: 'Algorithmique', c: '#d6336c', forme: '40% 0', sous: ['Scratch'] },
    { id: 'automatismes', nom: 'Automatismes du brevet', c: '#c98a00', forme: '50% 0', sous: ['Automatismes'], niveaux: ['3e'] }
  ];
  const domaineDe = (t) => DOMAINES.find((d) => d.nom === t.domaine || d.sous.includes(t.domaine)) || DOMAINES[0];
  const icone = (id) => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + ICO[id] + '</svg>';
  const styleDom = (d) => 'style="--c:' + d.c + ';--forme:' + d.forme + '"';
  /* ---------- XP : chaque niveau porte le nom d'un ou d'une mathématicienne ---------- */
  const RANGS = [
    { xp: 0, nom: 'Apprenti calculateur', txt: 'Tous les grands mathématiciens ont commencé ici : par des calculs, des erreurs et de l’entraînement.' },
    { xp: 150, nom: 'Hypatie', txt: 'Hypatie (vers 400, Alexandrie) est l’une des premières femmes mathématiciennes connues. Elle enseignait la géométrie et l’astronomie.' },
    { xp: 400, nom: 'Al-Khwârizmî', txt: 'Al-Khwârizmî (IXe siècle, Bagdad) : son nom a donné le mot « algorithme », et le titre de son livre le mot « algèbre ».' },
    { xp: 800, nom: 'Euclide', txt: 'Euclide (vers 300 av. J.-C.) a écrit Les Éléments, un livre de géométrie utilisé pendant plus de 2 000 ans.' },
    { xp: 1400, nom: 'Fibonacci', txt: 'Fibonacci (1202, Pise) a fait connaître en Europe les chiffres que nous utilisons, et le zéro.' },
    { xp: 2200, nom: 'Descartes', txt: 'René Descartes (1596-1650) a eu l’idée de repérer les points par des coordonnées : on parle de repère « cartésien ».' },
    { xp: 3200, nom: 'Sophie Germain', txt: 'Sophie Germain (1776-1831) étudiait en cachette et envoyait ses travaux sous un nom d’homme, « Monsieur Le Blanc ».' },
    { xp: 4500, nom: 'Euler', txt: 'Leonhard Euler (1707-1783) a inventé la notation f(x). Devenu aveugle, il continuait à faire d’énormes calculs de tête.' },
    { xp: 6000, nom: 'Emmy Noether', txt: 'Emmy Noether (1882-1935) a fondé l’algèbre moderne. Einstein la considérait comme un génie.' },
    { xp: 8000, nom: 'Ramanujan', txt: 'Srinivasa Ramanujan (1887-1920), autodidacte indien, voyait des propriétés dans tous les nombres : 1729 est devenu « le nombre de Ramanujan ».' }
  ];
  const COUL_RANG = ['#fb5607', '#3a5bd9', '#14866d', '#8338ec', '#d6336c', '#c98a00', '#0b7285', '#e8590c', '#5f3dc4', '#e63946'];
  const xpSerie = (score, total) => 10 * score + (score >= Math.ceil(0.8 * total) ? 20 : 0); // même calcul que le script Google
  const rangDe = (xp) => { let i = 0; while (i + 1 < RANGS.length && xp >= RANGS[i + 1].xp) i++; return i; };
  const cleMoi = (m) => (m.classe + '|' + m.prenom).toLowerCase();
  const jourLocal = (d) => { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  // XP des séries terminées mais pas encore envoyées (hors connexion) ; les scores du jeu ne comptent pas
  const xpEnAttente = (file, m) => file.filter((x) => x.themeId && cleMoi(x) === cleMoi(m)).reduce((a, x) => a + xpSerie(x.score, x.total), 0);
  const getProfil = (m) => store.get('xp:' + cleMoi(m), { xp: 0, jours: 0 });
  // L'avatar gagne un côté à chaque niveau : triangle, carré, pentagone… jusqu'au cercle au dernier niveau.
  function avatar(xp, prenom) {
    const r = rangDe(xp), c = COUL_RANG[r], lettre = '<text x="24" y="' + (r ? 31 : 36) + '" text-anchor="middle">' + esc(prenom.charAt(0).toUpperCase()) + '</text>';
    if (r === RANGS.length - 1) return '<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="' + c + '"/>' + lettre + '</svg>';
    const n = r + 3, pts = [];
    for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k + (n === 4 ? 0.5 : 0)) * 2 * Math.PI / n; pts.push((24 + 22 * Math.cos(a)).toFixed(1) + ',' + ((n === 3 ? 28 : 24) + 22 * Math.sin(a)).toFixed(1)); }
    return '<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true"><polygon points="' + pts.join(' ') + '" fill="' + c + '"/>' + lettre + '</svg>';
  }
  function htmlXP(p) {
    const r = rangDe(p.xp), suiv = RANGS[r + 1];
    const pct = suiv ? Math.round(100 * (p.xp - RANGS[r].xp) / (suiv.xp - RANGS[r].xp)) : 100;
    return '<div class="xp"><button class="rang" aria-expanded="false">Niveau ' + (r + 1) + ' · <b>' + esc(RANGS[r].nom) + '</b> <span aria-hidden="true">ⓘ</span></button>' +
      (p.jours >= 1 ? '<span class="flamme" title="Jours d’affilée avec au moins une série">🔥 ' + p.jours + ' jour' + (p.jours > 1 ? 's' : '') + '</span>' : '') +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
      '<small>' + p.xp + ' XP' + (suiv ? ' · prochain niveau à ' + suiv.xp + ' XP : ' + esc(suiv.nom) : ' · niveau maximum !') + '</small>' +
      '<p class="anecdote" hidden>' + esc(RANGS[r].txt) + '</p></div>';
  }
  function brancherXP(root) {
    const b = root.querySelector('.rang'); if (!b) return;
    b.onclick = () => { const a = root.querySelector('.anecdote'); a.hidden = !a.hidden; b.setAttribute('aria-expanded', String(!a.hidden)); };
  }
  function majProfilAffiche() {
    const moi = getMoi(), pr = app.querySelector('.profil');
    if (!moi || !pr) return;
    const p = getProfil(moi);
    pr.querySelector('.avatar').outerHTML = avatar(p.xp, moi.prenom);
    pr.querySelector('.xp').outerHTML = htmlXP(p); brancherXP(pr);
  }
  // Conseils du prof (ordre conseillé) et profil à jour, demandés au tableur à l'ouverture de l'accueil
  let dernierAccueil = 0, eleveAccueil = null; // on redemande tout de suite si l'élève a changé (connexion sur un nouvel appareil)
  function chargerAccueil(apres) {
    const moi = getMoi(), qui = moi ? cleMoi(moi) : '';
    if (!C.urlScript || (qui === eleveAccueil && Date.now() - dernierAccueil < 30000)) return;
    dernierAccueil = Date.now(); eleveAccueil = qui;
    fetch(C.urlScript + '?action=accueil' + (moi ? '&prenom=' + encodeURIComponent(moi.prenom) + '&classe=' + encodeURIComponent(moi.classe) : ''))
      .then((r) => r.json()).then((j) => {
        if (!j || !j.ok) return;
        if (j.conseils) store.set('conseils', j.conseils);
        if (moi && j.profil) {
          // on ajoute les séries pas encore envoyées (hors connexion)
          const enAttente = xpEnAttente(store.get('file', []), moi);
          const loc = getProfil(moi);
          store.set('xp:' + cleMoi(moi), { xp: j.profil.xp + enAttente, jours: Math.max(j.profil.jours, loc.d === jourLocal() ? loc.jours : 0), d: loc.d });
        }
        apres();
      }).catch(() => { /* hors connexion : on garde ce qu'on a */ });
  }
  function htmlConseils(niveau) {
    const liste = (store.get('conseils', {})[niveau] || []).map((c) => ({ t: THEMES.find((x) => x.id === c.id && x.classes.includes(niveau)), l: c.l })).filter((c) => c.t && c.t.niveaux[c.l - 1]);
    if (!liste.length) return '';
    return '<section class="conseils"><h2>Conseils du prof</h2><p>Les exerciseurs à faire, dans l’ordre :</p><ol>' + liste.map((c) => {
      const b = store.get('best:' + c.t.id + ':' + c.l, null), ok = b && b.s >= 0.8 * b.t;
      return '<li class="' + (ok ? 'fait' : '') + '"><a href="#ex-' + c.t.id + '" ' + styleDom(domaineDe(c.t)) + '>' + esc(c.t.titre) + '</a> <span class="cons-niv">' + (c.t.parties ? esc(c.t.niveaux[c.l - 1].court || c.t.niveaux[c.l - 1].nom) : '★'.repeat(c.l)) + '</span>' + (ok ? ' <span class="cons-ok">✓ réussi</span>' : '') + '</li>';
    }).join('') + '</ol></section>';
  }
  const reussi = (t) => t.niveaux.some((lv, i) => { const b = store.get('best:' + t.id + ':' + (i + 1), null); return b && b.s >= 0.8 * b.t; });
  const AUTRE = 'Autre';
  const app = document.getElementById('app');
  document.title = C.nomSite;

  /* ---------- Utilitaires ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mem = {}; // secours si le navigateur refuse la mémoire (navigation privée, navigateur de l'ENT…)
  const store = {
    get(k, def) { try { const v = localStorage.getItem('gc:' + k); if (v != null) return JSON.parse(v); } catch (e) { /* */ } return k in mem ? mem[k] : def; },
    set(k, v) { mem[k] = v; try { localStorage.setItem('gc:' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
    del(k) { delete mem[k]; try { localStorage.removeItem('gc:' + k); } catch (e) { /* */ } }
  };
  // Un exerciseur organisé en « parties » (ex. automatismes) n'affiche pas d'étoiles de difficulté.
  const avecEtoiles = (t) => t.niveaux.length > 1 && !t.parties;
  const stars = (n) => '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span>';
  const tone = (s, t) => { const p = s / t; return p >= 0.8 ? 'ok' : p >= 0.5 ? 'mid' : 'ko'; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const fmtDuree = (s) => { s = Math.round(s); const m = Math.floor(s / 60); return m ? m + ' min ' + String(s % 60).padStart(2, '0') : s + ' s'; };
  const nomPropre = (s) => s.trim().replace(/\s+/g, ' ').replace(/(^|[\s-])(\p{L})/gu, (a, b, c) => b + c.toUpperCase());

  /* ---------- Identité de l'élève (gardée sur l'appareil) ---------- */
  const getMoi = () => store.get('moi', null);
  // « 4e 3 » → « 4e » ; « Autre : … » → null
  const niveauDeClasse = (c) => NIVEAUX.find((n) => String(c || '').startsWith(n)) || null;
  function formIdent(onDone) {
    const moi = getMoi() || { prenom: '', classe: '' };
    const estAutre = moi.classe && !C.classes.includes(moi.classe);
    const precision = estAutre ? moi.classe.replace(/^Autre\s*:\s*/, '') : '';
    const classeField = C.classes.length
      ? '<select id="id-classe"><option value="">Choisis…</option>' + C.classes.map((c) => '<option' + (c === moi.classe ? ' selected' : '') + '>' + esc(c) + '</option>').join('') +
        '<option value="' + AUTRE + '"' + (estAutre ? ' selected' : '') + '>Autre</option></select>'
      : '<input id="id-classe" autocomplete="off" placeholder="ex. 4e 3" value="' + esc(moi.classe) + '">';
    const el = document.createElement('form');
    el.className = 'card ident';
    el.innerHTML =
      '<h2>Qui es-tu ?</h2><p>Ton prénom et ta classe permettent à ton professeur de voir tes résultats.</p>' +
      '<div class="fields"><label class="field">Prénom<input id="id-prenom" autocomplete="given-name" maxlength="30" placeholder="ex. Léa" value="' + esc(moi.prenom) + '">' +
      '<span class="aide">Si un autre élève de ta classe a le même prénom, ajoute l’initiale de ton nom.</span></label>' +
      '<label class="field">Classe' + classeField + '</label>' +
      '<label class="field" id="autre-zone"' + (estAutre ? '' : ' hidden') + '>Précise<input id="id-autre" maxlength="20" placeholder="ex. 5e 2, Prof…" value="' + esc(precision) + '"></label></div>' +
      '<p class="msg-err" id="id-err" hidden></p>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">C’est parti</button></div>';
    // La phrase d'aide apparaît au premier clic dans le champ Prénom, puis reste affichée (pas de saut de mise en page au moment de valider).
    const inPrenom = el.querySelector('#id-prenom');
    inPrenom.addEventListener('focus', () => inPrenom.closest('.field').classList.add('aide-vue'));
    const sel = el.querySelector('select#id-classe');
    if (sel) sel.onchange = () => { el.querySelector('#autre-zone').hidden = sel.value !== AUTRE; if (sel.value === AUTRE) el.querySelector('#id-autre').focus(); };
    el.addEventListener('submit', (e) => {
      e.preventDefault();
      const prenom = nomPropre(el.querySelector('#id-prenom').value).slice(0, 30);
      let classe = el.querySelector('#id-classe').value.trim().slice(0, 20);
      const err = el.querySelector('#id-err');
      if (!prenom) { err.textContent = 'Écris ton prénom.'; err.hidden = false; return; }
      if (!classe) { err.textContent = 'Indique ta classe.'; err.hidden = false; return; }
      if (sel && classe === AUTRE) {
        const pr = el.querySelector('#id-autre').value.trim().replace(/\s+/g, ' ').slice(0, 20);
        if (!pr) { err.textContent = 'Précise qui tu es (ta classe, ou « Prof »).'; err.hidden = false; return; }
        classe = AUTRE + ' : ' + pr;
      }
      const ancien = getMoi();
      store.set('moi', { prenom, classe });
      if (!ancien || ancien.classe !== classe) { const n = niveauDeClasse(classe); if (n) store.set('niveau', n); }
      onDone();
    });
    return el;
  }

  /* ---------- Routage ---------- */
  function route() {
    stopKeys();
    if (window.__jeuStop) window.__jeuStop();
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'prof') vueProf();
    else if (h === 'jeu') vueJeu();
    else if (h === 'ciel') vueCiel();
    else if (h.startsWith('dom-')) vueDomaine(h.slice(4));
    else if (h.startsWith('ex-')) { const t = THEMES.find((x) => 'ex-' + x.id === h); t ? vueTheme(t) : vuePortail(); }
    else vuePortail();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* =====================================================================
     PORTAIL
     ===================================================================== */
  function vuePortail() {
    const moi = getMoi();
    let niveau = store.get('niveau', null);
    if (!NIVEAUX.includes(niveau)) niveau = moi ? niveauDeClasse(moi.classe) : null;
    app.innerHTML =
      '<div class="wrap">' +
      '<header class="top"><div class="brand"><div class="logo" aria-hidden="true"></div><div><h1>' + esc(C.nomSite) + '</h1><p>Exerciseurs de mathématiques</p></div></div>' +
      '</header>' +
      (moi ? '<section class="profil">' + avatar(getProfil(moi).xp, moi.prenom) +
        '<div class="profil-txt"><span>Bonjour</span><strong>' + esc(moi.prenom) + '</strong><span>' + esc(moi.classe) + '</span></div>' + htmlXP(getProfil(moi)) +
        '<div class="profil-btns"><button class="btn btn-ghost" id="chg">Modifier</button><button class="btn btn-ghost" id="changer">Changer d’élève</button></div></section>' : '') +
      '<div id="identzone"></div>' +
      '<nav class="niveaux" aria-label="Niveau"><span class="niv-label">Ton niveau</span>' +
      NIVEAUX.map((n) => '<button class="niv" data-n="' + n + '" aria-pressed="' + (n === niveau) + '">' + n + '</button>').join('') +
      '</nav><div id="conszone">' + (niveau ? htmlConseils(niveau) : '') + '</div><div id="jeuzone"></div><div id="grid"></div>' +
      '<footer class="foot"><a class="btn btn-ghost" href="#prof">Espace professeur</a></footer></div>';

    const iz = app.querySelector('#identzone');
    if (!moi) iz.appendChild(formIdent(vuePortail));
    const chgEl = app.querySelector('#changer');
    if (chgEl) chgEl.onclick = () => {
      // Confirmation dans la page : l'appareil oublie le prénom et la classe (les données de chaque élève restent rangées à son nom)
      iz.innerHTML = '<div class="card confirm-eleve" role="alertdialog"><p><strong>Changer d’élève ?</strong> Cet appareil va oublier « ' + esc(moi.prenom) + ' · ' + esc(moi.classe) + ' ». Tes résultats déjà envoyés sont conservés.</p>' +
        '<div class="btn-row"><button class="btn btn-primary" id="chg-oui">Oui, changer d’élève</button><button class="btn btn-ghost" id="chg-non">Annuler</button></div></div>';
      iz.querySelector('#chg-non').onclick = () => { iz.innerHTML = ''; };
      iz.querySelector('#chg-oui').onclick = () => { store.del('moi'); store.del('niveau'); vuePortail(); };
    };
    const chg = app.querySelector('#chg');
    if (chg) chg.onclick = () => { iz.innerHTML = ''; iz.appendChild(formIdent(vuePortail)); iz.querySelector('input').focus(); };

    app.querySelectorAll('.niv').forEach((b) => b.onclick = () => { store.set('niveau', b.dataset.n); vuePortail(); });
    if (moi) app.querySelector('#jeuzone').innerHTML = carteJeu() + (niveau ? carteCiel(niveau) : '');
    brancherXP(app);
    chargerAccueil(() => { majProfilAffiche(); const cz = app.querySelector('#conszone'); if (cz && niveau) cz.innerHTML = htmlConseils(niveau); });
    const grid = app.querySelector('#grid');
    if (!niveau) { grid.innerHTML = '<div class="card empty">Choisis ton niveau pour voir les exerciseurs.</div>'; return; }
    const liste = THEMES.filter((t) => t.classes.includes(niveau));
    if (!liste.length) { grid.innerHTML = '<div class="card empty">Pas encore d’exerciseur pour la ' + niveau + '.</div>'; return; }
    grid.innerHTML = '<div class="doms">' + DOMAINES.filter((d) => !d.niveaux || d.niveaux.includes(niveau)).map((d) => {
      const lt = liste.filter((t) => domaineDe(t) === d), ok = lt.filter(reussi).length;
      if (!lt.length) return '<div class="dom bientot" ' + styleDom(d) + '>' + icone(d.id) + '<b>' + esc(d.nom) + '</b><small>Bientôt</small></div>';
      return '<a class="dom" href="#dom-' + d.id + '" ' + styleDom(d) + '>' + icone(d.id) + '<b>' + esc(d.nom) + '</b><small>' + lt.length + ' exerciseur' + (lt.length > 1 ? 's' : '') +
        (ok ? ' · ' + ok + ' réussi' + (ok > 1 ? 's' : '') : '') + '</small></a>';
    }).join('') + '</div>';
  }

  /* =====================================================================
     CONSTELLATION : chaque exerciseur est une étoile dans un repère ; celles d'un domaine dessinent une figure
     ===================================================================== */
  // Figures en unités du repère (0 à 10) : une ligne brisée, ou un cercle. Les étoiles sont réparties le long de la figure.
  const FIGURES = {
    nombres: { nom: 'π', traits: [[[0.5, 9.6], [5.5, 9.6]], [[1.8, 9.6], [1.3, 5]], [[4.2, 9.6], [4.8, 5]]] },
    geometrie: { nom: 'triangle rectangle', traits: [[[6.6, 9.4], [6.6, 5.4], [9.8, 5.4], [6.6, 9.4]]] },
    grandeurs: { nom: 'cercle', cercle: [2.6, 2.6, 1.5] },
    donnees: { nom: 'courbe', traits: [[[0.8, 4.4], [2, 5.4], [3.2, 4.8], [4.4, 5.8]]] },
    algo: { nom: 'flèche', traits: [[[5.2, 4], [5.2, 2.6], [4.6, 3.1]], [[5.2, 2.6], [5.8, 3.1]]] },
    automatismes: { nom: 'éclair', traits: [[[8.6, 3.8], [7, 2.2], [8.4, 2.2], [6.8, 0.6]]] }
  };
  // Meilleur niveau réussi (8/10 ou plus) : 0 si aucun ; pour les exerciseurs en parties, nombre de parties réussies (3 au plus)
  function eclat(t) {
    let n = 0;
    t.niveaux.forEach((lv, i) => { const b = store.get('best:' + t.id + ':' + (i + 1), null); if (b && b.s >= 0.8 * b.t) n = t.parties ? n + 1 : i + 1; });
    return Math.min(3, n);
  }
  function placer(fig, n) {
    if (fig.cercle) { const [cx, cy, r] = fig.cercle; return Array.from({ length: n }, (_, k) => [cx + r * Math.cos(Math.PI / 2 - 2 * Math.PI * k / n), cy + r * Math.sin(Math.PI / 2 - 2 * Math.PI * k / n)]); }
    const segs = []; fig.traits.forEach((tr) => { for (let i = 0; i + 1 < tr.length; i++) segs.push([tr[i], tr[i + 1]]); });
    const lg = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1])), tot = lg.reduce((a, b) => a + b, 0);
    const ferme = fig.traits.length === 1 && String(fig.traits[0][0]) === String(fig.traits[0][fig.traits[0].length - 1]);
    return Array.from({ length: n }, (_, k) => {
      let d = n === 1 ? 0 : tot * k / (ferme ? n : n - 1), i = 0;
      while (i < segs.length - 1 && d > lg[i]) { d -= lg[i]; i++; }
      const [a, b] = segs[i], f = lg[i] ? Math.min(1, d / lg[i]) : 0;
      return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
    });
  }
  const etoilesDe = (niveau) => DOMAINES.flatMap((d) => {
    const lt = THEMES.filter((t) => t.classes.includes(niveau) && domaineDe(t) === d);
    return placer(FIGURES[d.id], lt.length).map((p, k) => ({ t: lt[k], d, x: Math.round(p[0] * 10) / 10, y: Math.round(p[1] * 10) / 10, e: eclat(lt[k]) }));
  });
  function carteCiel(niveau) {
    const et = etoilesDe(niveau), on = et.filter((x) => x.e).length;
    return '<a class="card ciel-carte" href="#ciel"><svg class="ciel-ico" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="10"/><path d="M10 38 20 16 34 26 40 10" /><circle cx="10" cy="38" r="3"/><circle cx="20" cy="16" r="3.5"/><circle cx="34" cy="26" r="2.5"/><circle cx="40" cy="10" r="3"/></svg>' +
      '<span class="jeu-txt"><strong>Ma constellation</strong><span>' + on + ' étoile' + (on > 1 ? 's' : '') + ' allumée' + (on > 1 ? 's' : '') + ' sur ' + et.length + ' · une série réussie allume une étoile</span></span></a>';
  }
  function vueCiel() {
    const moi = getMoi();
    let niveau = store.get('niveau', null);
    if (!NIVEAUX.includes(niveau)) niveau = moi ? niveauDeClasse(moi.classe) : null;
    if (!niveau) { location.hash = ''; return; }
    const et = etoilesDe(niveau), on = et.filter((x) => x.e).length;
    const W = 320, H = 340, X = (x) => 24 + x * 28.5, Y = (y) => 312 - y * 29;
    const nbr = (v) => String(v).replace('.', ',');
    const clair = (c) => 'color-mix(in srgb, ' + c + ' 55%, white)';
    let svg = '<svg class="ciel-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Constellation des exerciseurs de ' + niveau + '">' +
      '<defs><radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="repere"><line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(10.2) + '" y2="' + Y(0) + '"/><line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(0) + '" y2="' + Y(10.2) + '"/>';
    for (let k = 1; k <= 10; k++) svg += '<line x1="' + X(k) + '" y1="' + (Y(0) - 3) + '" x2="' + X(k) + '" y2="' + (Y(0) + 3) + '"/><line x1="' + (X(0) - 3) + '" y1="' + Y(k) + '" x2="' + (X(0) + 3) + '" y2="' + Y(k) + '"/>';
    svg += '<text x="' + (X(0) - 6) + '" y="' + (Y(0) + 14) + '">0</text><text x="' + X(1) + '" y="' + (Y(0) + 14) + '" text-anchor="middle">1</text><text x="' + (X(0) - 8) + '" y="' + (Y(1) + 4) + '" text-anchor="end">1</text></g>';
    DOMAINES.forEach((d) => {
      const sd = et.filter((x) => x.d === d); if (!sd.length) return;
      const fig = FIGURES[d.id], complet = sd.every((x) => x.e), c = clair(d.c);
      svg += '<g class="figure' + (complet ? ' complete' : '') + '" style="stroke:' + c + '">' + (fig.cercle
        ? '<circle cx="' + X(fig.cercle[0]) + '" cy="' + Y(fig.cercle[1]) + '" r="' + fig.cercle[2] * 28.7 + '"/>'
        : fig.traits.map((tr) => '<polyline points="' + tr.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ') + '"/>').join('')) + '</g>';
    });
    et.forEach((s, i) => {
      const c = clair(s.d.c), r = s.e ? 5 + 2 * s.e : 4.5;
      svg += '<g class="etoile' + (s.e ? ' on' : '') + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(s.t.titre) + ', ' + (s.e ? 'allumée' : 'pas encore allumée') + '">' +
        (s.e ? '<circle cx="' + X(s.x) + '" cy="' + Y(s.y) + '" r="' + (r * 2.6) + '" fill="url(#halo)" opacity=".35"/>' : '') +
        '<circle cx="' + X(s.x) + '" cy="' + Y(s.y) + '" r="13" fill="transparent"/><circle class="coeur" cx="' + X(s.x) + '" cy="' + Y(s.y) + '" r="' + r + '" fill="' + c + '"/></g>';
    });
    svg += '</svg>';
    const legende = DOMAINES.filter((d) => et.some((x) => x.d === d)).map((d) => {
      const sd = et.filter((x) => x.d === d), n = sd.filter((x) => x.e).length;
      return '<li style="--c:' + clair(d.c) + '"><b>' + esc(d.nom) + '</b> · ' + FIGURES[d.id].nom + ' · ' + n + '/' + sd.length + (n === sd.length ? ' ✨' : '') + '</li>';
    }).join('');
    app.innerHTML = '<div class="wrap"><a class="btn btn-ghost back" href="#">← Accueil</a>' +
      '<div class="ciel"><h1>Ma constellation · ' + niveau + '</h1><p class="ciel-sous">' + on + ' étoile' + (on > 1 ? 's' : '') + ' allumée' + (on > 1 ? 's' : '') + ' sur ' + et.length + '. Touche une étoile.</p>' + svg +
      '<div class="ciel-info" id="ciel-info" aria-live="polite">Une étoile s’allume quand tu réussis une série (8/10 ou plus). Elle grossit avec les niveaux ★★ et ★★★. Quand toutes les étoiles d’un domaine sont allumées, sa figure brille.</div>' +
      '<ul class="ciel-leg">' + legende + '</ul></div></div>';
    const info = app.querySelector('#ciel-info');
    const montrer = (g) => {
      app.querySelectorAll('.etoile.choisie').forEach((x) => x.classList.remove('choisie')); g.classList.add('choisie');
      const s = et[+g.dataset.i], t = s.t;
      const scores = t.niveaux.map((lv, i) => { const b = store.get('best:' + t.id + ':' + (i + 1), null); return '<span class="pill ' + (b ? tone(b.s, b.t) : '') + '">' + (t.parties ? esc(lv.court || lv.nom) : '★'.repeat(i + 1)) + ' ' + (b ? b.s + '/' + b.t : '–') + '</span>'; }).join('');
      info.innerHTML = '<strong>' + esc(t.titre) + '</strong> <span class="ciel-coord">(' + nbr(s.x) + ' ; ' + nbr(s.y) + ')</span><div class="prog">' + scores + '</div>' +
        '<a class="btn btn-primary" href="#ex-' + t.id + '">' + (s.e ? 'S’entraîner encore' : 'Allumer cette étoile') + '</a>';
    };
    app.querySelectorAll('.etoile').forEach((g) => {
      g.onclick = () => montrer(g);
      g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); montrer(g); } };
    });
  }

  /* =====================================================================
     DOMAINE : les exerciseurs d'un domaine, rangés par chapitre
     ===================================================================== */
  function carteTheme(t) {
    const prog = t.niveaux.map((lv, i) => {
      const b = store.get('best:' + t.id + ':' + (i + 1), null);
      return '<span class="pill ' + (b ? tone(b.s, b.t) : '') + '">' + (t.parties ? esc(lv.court || lv.nom) : '★'.repeat(i + 1)) + ' ' + (b ? b.s + '/' + b.t : '–') + '</span>';
    }).join('') + ((ec) => (ec ? '<span class="pill pause">En pause · question ' + questionEnCours(ec) + '/' + ec.n + '</span>' : ''))(lireEnCours(t));
    return '<a class="card theme" href="#ex-' + t.id + '"><h3>' + esc(t.titre) + '</h3><p>' + esc(t.resume) + '</p>' +
      '<div class="prog" aria-label="Tes meilleurs scores">' + prog + '</div></a>';
  }
  function vueDomaine(id) {
    const d = DOMAINES.find((x) => x.id === id);
    let niveau = store.get('niveau', null);
    if (!NIVEAUX.includes(niveau)) { const moi = getMoi(); niveau = moi ? niveauDeClasse(moi.classe) : null; }
    const liste = d && niveau ? THEMES.filter((t) => t.classes.includes(niveau) && domaineDe(t) === d) : [];
    if (!liste.length) { location.hash = ''; return; }
    const rangC = (c) => (d.sous.indexOf(c) + 1 || 99);
    const chap = [...new Set(liste.map((t) => t.domaine))].sort((a, b) => rangC(a) - rangC(b)); // ordre de la liste DOMAINES
    app.innerHTML = '<div class="wrap page-dom" ' + styleDom(d) + '><a class="btn btn-ghost back" href="#">← Tous les domaines</a>' +
      '<div class="dom-tete">' + icone(d.id) + '<div><span class="eyebrow">' + niveau + '</span><h1>' + esc(d.nom) + '</h1></div></div>' +
      chap.map((c) => '<section class="domaine">' + (chap.length > 1 || c !== d.nom ? '<h2>' + esc(c) + '</h2>' : '') + '<div class="grid">' +
        liste.filter((t) => t.domaine === c).map(carteTheme).join('') + '</div></section>').join('') + '</div>';
  }

  /* =====================================================================
     THÈME : choix de la difficulté
     ===================================================================== */
  /* ---------- Rappel de cours ---------- */
  // lvl absent : tout le rappel, avec les compléments marqués d'étoiles ; sinon : la base et le complément de ce niveau.
  function htmlCours(t, lvl) {
    const c = t.cours, niv = c.niv || {};
    const plus = lvl ? (niv[lvl] ? '<div class="cours-niv">' + niv[lvl] + '</div>' : '')
      : Object.keys(niv).map((k) => '<div class="cours-niv"><span class="cours-etoiles">' + (avecEtoiles(t) ? '★'.repeat(+k) : esc(t.niveaux[k - 1].nom)) + '</span>' + niv[k] + '</div>').join('');
    return '<div class="cours-txt">' + c.base + plus + '</div>';
  }
  function ouvrirCours(auto) {
    const t = S.t, z = document.createElement('div');
    z.className = 'cours-pop'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-modal', 'true'); z.setAttribute('aria-labelledby', 'cours-titre');
    z.innerHTML = '<div class="card cours-boite"><h2 id="cours-titre">' + (auto ? 'Petit rappel avant de continuer' : 'Rappel de cours') + '</h2>' + htmlCours(t, S.lvl) +
      '<button class="btn btn-primary" id="cours-ok">' + (auto ? 'J’ai compris, je continue' : 'Retour à la question') + '</button></div>';
    document.body.appendChild(z);
    const fermer = () => { z.remove(); document.removeEventListener('keydown', esc_, true); };
    const esc_ = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); fermer(); } };
    document.addEventListener('keydown', esc_, true);
    z.querySelector('#cours-ok').onclick = fermer;
    z.addEventListener('click', (e) => { if (e.target === z) fermer(); });
    z.querySelector('#cours-ok').focus();
  }

  function vueTheme(t) {
    const moi = getMoi(), ec = lireEnCours(t);
    app.innerHTML =
      '<div class="wrap page-dom" ' + styleDom(domaineDe(t)) + '><a class="btn btn-ghost back" href="#dom-' + domaineDe(t).id + '">← ' + esc(domaineDe(t).nom) + '</a>' +
      '<div class="thead"><span class="eyebrow">' + esc(t.domaine) + ' · ' + t.classes.join(', ') + '</span><h1>' + esc(t.titre) + '</h1><p>' + esc(t.resume) + (t.parties ? ' Choisis une partie : une' : t.niveaux.length > 1 ? ' Choisis ta difficulté : une' : ' Une') + ' série compte ' + C.nbQuestions + ' questions.</p></div>' +
      '<div id="identzone"></div>' + (ec
        ? '<div class="card reprise"><div><strong>Série en pause</strong><span class="sub">' + (avecEtoiles(t) ? stars(ec.lvl) + ' ' : '') + esc(t.niveaux[ec.lvl - 1].nom) + ' · question ' + questionEnCours(ec) + '/' + ec.n + ' · ' + ec.score + (ec.score > 1 ? ' bonnes réponses' : ' bonne réponse') + '</span>' +
          '<span class="sub">Commencer une nouvelle série remplacera celle-ci.</span></div><div class="btn-row"><button class="btn btn-primary" id="reprendre">Reprendre</button><button class="btn btn-ghost" id="abandon">Abandonner</button></div></div>'
        : '') + '<div class="levels">' +
      t.niveaux.map((lv, i) => {
        const b = store.get('best:' + t.id + ':' + (i + 1), null);
        return '<button class="card level' + (avecEtoiles(t) ? '' : ' sans-etoiles') + '" data-l="' + (i + 1) + '">' + (avecEtoiles(t) ? '<span class="stars" aria-label="Niveau ' + (i + 1) + '">' + stars(i + 1) + '</span>' : '') +
          '<span><strong>' + esc(lv.nom) + '</strong><span class="sub">' + (b ? 'Ton meilleur score : ' + b.s + '/' + b.t : 'Pas encore essayé') + '</span></span><span aria-hidden="true">›</span></button>';
      }).join('') + '</div>' +
      (C.urlScript ? '' : '<p class="notice">Mode démonstration : les résultats ne sont pas encore envoyés au professeur.</p>') + '</div>';
    if (t.cours) {
      const ferme = store.get('cours-ferme:' + t.id, false);
      app.querySelector('.thead').insertAdjacentHTML('afterend', '<details class="card cours"' + (ferme ? '' : ' open') + '><summary><span>Rappel de cours</span><span class="cours-voir">' + (ferme ? 'Revoir le rappel' : 'Replier') + '</span></summary>' + htmlCours(t) + '</details>');
      const d = app.querySelector('details.cours');
      d.addEventListener('toggle', () => { store.set('cours-ferme:' + t.id, !d.open); d.querySelector('.cours-voir').textContent = d.open ? 'Replier' : 'Revoir le rappel'; });
    }
    if (t.rappel) app.querySelector('.thead').insertAdjacentHTML('afterend', '<p class="rappel" role="note"><svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true"><rect x="1" y="1" width="18" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="4" width="12" height="5" rx="1" fill="currentColor"/><g fill="currentColor"><circle cx="6" cy="13" r="1.4"/><circle cx="10" cy="13" r="1.4"/><circle cx="14" cy="13" r="1.4"/><circle cx="6" cy="18" r="1.4"/><circle cx="10" cy="18" r="1.4"/><circle cx="14" cy="18" r="1.4"/></g></svg>' + esc(t.rappel) + '</p>');
    if (!moi) app.querySelector('#identzone').appendChild(formIdent(() => vueTheme(t)));
    if (ec) {
      app.querySelector('#reprendre').onclick = () => reprendre(t, ec);
      app.querySelector('#abandon').onclick = () => { effacer(t); vueTheme(t); };
    }
    app.querySelectorAll('.level').forEach((b) => b.onclick = () => {
      if (!getMoi()) { const f = app.querySelector('#identzone input'); if (f) { f.focus(); f.closest('form').classList.add('shake'); setTimeout(() => f.closest('form').classList.remove('shake'), 350); } return; }
      demarrer(t, +b.dataset.l);
    });
  }

  /* =====================================================================
     SÉRIE DE QUESTIONS
     ===================================================================== */
  let S = null;        // état de la série en cours
  let keyHandler = null;
  function stopKeys() { if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; } }

  function nouvelleQuestion(t, lvl, deja) {
    // évite deux énoncés identiques dans la même série
    // évite aussi deux questions du même type (q.cat) dans une même série, tant que c'est possible
    for (let k = 0; k < 40; k++) {
      const q = t.niveaux[lvl - 1].gen();
      if (deja.has(q.enonce)) continue;
      if (q.cat && S && S.cats && S.cats.has(q.cat) && k < 35) continue;
      return q;
    }
    return t.niveaux[lvl - 1].gen();
  }

  /* ---------- Série en pause : enregistrée sur l'appareil après chaque question ---------- */
  const cleEnCours = (t) => { const m = getMoi(); return m ? 'encours:' + t.id + ':' + (m.classe + '|' + m.prenom).toLowerCase() : null; };
  function lireEnCours(t) {
    const k = cleEnCours(t);
    const e = k && store.get(k, null);
    if (!e || Date.now() - e.date > 30 * 864e5 || !t.niveaux[e.lvl - 1]) return null;
    return e;
  }
  const questionEnCours = (e) => Math.min(e.i + (e.repondu ? 2 : 1), e.n);
  function sauver() {
    const k = cleEnCours(S.t);
    if (k) store.set(k, { lvl: S.lvl, i: S.i, n: S.n, score: S.score, serie: S.serie, meilleureSerie: S.meilleureSerie, ecoule: Date.now() - S.debut, vus: [...S.vus], cats: [...(S.cats || [])], hist: S.hist, q: S.q, repondu: S.repondu, erreursSuite: S.erreursSuite || 0, coursMontre: !!S.coursMontre, ratt: S.ratt || { n: 0, ok: 0 }, enRattrapage: !!S.enRattrapage, date: Date.now() });
  }
  function effacer(t) { const k = cleEnCours(t); if (k) store.del(k); }
  function reprendre(t, e) {
    // le temps passé hors de la série n'est pas compté
    S = Object.assign({}, e, { t, vus: new Set(e.vus), cats: new Set(e.cats || []), debut: Date.now() - e.ecoule });
    if (!S.ratt) S.ratt = { n: 0, ok: 0 };
    if (e.repondu) suivante(); else poser(e.q);
  }

  function demarrer(t, lvl) {
    S = { t, lvl, i: 0, n: C.nbQuestions, score: 0, serie: 0, meilleureSerie: 0, debut: Date.now(), vus: new Set(), cats: new Set(), hist: [], erreursSuite: 0, coursMontre: false, ratt: { n: 0, ok: 0 }, enRattrapage: false };
    poser();
  }

  const estExpr = () => S.q.type === 'expr';
  const estChoix = () => S.q.type === 'choix';
  const estDuree = () => S.q.type === 'duree';
  // Durées : la saisie interne utilise h, m (min) et s ; l'ordre est toujours h, puis min, puis s.
  const UNITES = { h: 'h', m: 'min', s: 's' };
  const fmtDureeQ = (sec, unites) => {
    const u = unites || ['h', 'min'], parts = [];
    let reste = sec;
    [['h', 3600], ['min', 60], ['s', 1]].forEach(([nom, val]) => {
      if (!u.includes(nom)) return;
      const n = Math.floor(reste / val); reste -= n * val;
      if (n) parts.push(n + ' ' + nom);
    });
    return parts.join(' ') || '0 ' + u[u.length - 1];
  };
  const SUP = { '²': '2', '³': '3' };

  function poser(qx) {
    const { t, lvl } = S;
    S.q = qx || nouvelleQuestion(t, lvl, S.vus);
    S.vus.add(S.q.enonce);
    if (S.q.cat) S.cats.add(S.q.cat);
    S.saisie = '';
    S.repondu = false;
    S.etape = 0;
    S.choixFaits = [];
    const k = (v, cls, label) => '<button class="key ' + (cls || '') + '" data-k="' + v + '" aria-label="' + (label || v) + '">' + (label || v) + '</button>';
    const vide = '<span class="key blank" aria-hidden="true"></span>';
    let pad;
    if (estChoix()) {
      pad = '<div class="pad choix" id="choix"></div>';
    } else if (estDuree()) {
      // Clavier « durée » : chiffres et unités demandées
      const u = S.q.unites || ['h', 'min'];
      const uk = (v, lab) => (u.includes(lab) ? k(v, 'op unite', lab) : vide);
      pad = '<div class="pad">' +
        k('7') + k('8') + k('9') + k('del', 'op', '⌫') +
        k('4') + k('5') + k('6') + uk('h', 'h') +
        k('1') + k('2') + k('3') + uk('m', 'min') +
        uk('s', 's') + k('0') + '<button class="key go" data-k="ok">Valider</button></div>';
    } else if (estExpr()) {
      // Clavier « calcul littéral » : chiffres, lettres de l'exercice, +, −, ², ³
      const L = S.q.lettres.slice(0, S.q.facto ? 1 : 3);
      const lk = (i) => (S.q.facto && i > 0 ? k(i === 1 ? '(' : ')', 'op') : L[i] ? '<button class="key lettre" data-k="' + L[i] + '" aria-label="lettre ' + L[i] + '"><i>' + L[i] + '</i></button>' : vide);
      pad = '<div class="pad c5">' +
        k('7') + k('8') + k('9') + lk(0) + k('del', 'op', '⌫') +
        k('4') + k('5') + k('6') + lk(1) + k('²', 'op', 'x²').replace('>x²<', '><span class="exp">□<sup>2</sup></span><') +
        k('1') + k('2') + k('3') + lk(2) + k('³', 'op', 'x³').replace('>x³<', '><span class="exp">□<sup>3</sup></span><') +
        k('+', 'op') + k('0') + k('-', 'op', M) + '<button class="key go" data-k="ok">Valider</button></div>';
    } else {
      const keys = S.q.clavier != null ? S.q.clavier : (t.clavier || '');
      const opt = (v, label) => (keys.includes(v) ? k(v, 'op', label) : vide);
      pad = '<div class="pad">' +
        k('7') + k('8') + k('9') + k('del', 'op', '⌫') +
        k('4') + k('5') + k('6') + opt('-', M) +
        k('1') + k('2') + k('3') + opt('/', '/') +
        opt(',', ',') + k('0') + '<button class="key go" data-k="ok">Valider</button></div>';
    }
    app.innerHTML =
      '<div class="play">' +
      '<div class="bar"><button class="iconbtn" id="quit" aria-label="Quitter la série">✕</button>' +
      (t.cours ? '<button class="iconbtn cours-btn" id="cours" aria-label="Rappel de cours">Rappel</button>' : '') +
      '<span class="count">' + (S.enRattrapage ? 'Rattrapage' : (S.i + 1) + '/' + S.n) + '</span><div class="track"><i style="width:' + (S.i / S.n * 100) + '%"></i></div>' +
      '<span class="score">✓ ' + S.score + '</span></div>' +
      '<div id="quitzone"></div>' +
      '<section class="sheet">' + (S.enRattrapage ? '<div class="ratt-etiquette">Rattrapage · ne compte pas dans le score</div>' : '') + '<div class="consigne">' + esc(S.q.consigne || t.consigne) + (avecEtoiles(t) ? ' <span aria-hidden="true">' + stars(lvl) + '</span>' : '') + '</div>' +
      '<div class="enonce">' + S.q.enonce + '</div>' +
      '<div class="answer" id="ans"><span class="pre">' + esc(S.q.prefixe != null ? S.q.prefixe : estChoix() ? '' : (t.prefixe || '= ')) + '</span><span class="box" id="box"></span>' + (S.q.suffixe ? '<span class="suf">' + esc(S.q.suffixe) + '</span>' : '') + '</div></section>' +
      '<p class="hint" id="hint"></p>' +
      '<div id="zone">' + pad + '</div></div>';
    afficherSaisie();
    if (estChoix()) afficherChoix();
    app.querySelector('.pad').addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]');
      if (c) return choisir(+c.dataset.c);
      const b = e.target.closest('[data-k]'); if (b) touche(b.dataset.k);
    });
    app.querySelector('#quit').onclick = demanderQuitter;
    if (t.cours) app.querySelector('#cours').onclick = () => ouvrirCours(false);
    if (S.coursAFaire) { S.coursAFaire = false; S.coursMontre = true; ouvrirCours(true); }
    stopKeys();
    keyHandler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,select')) return;
      const map = { Backspace: 'del', Delete: 'del', Enter: 'ok', '-': '-', '−': '-', '/': '/', ',': ',', '.': ',', '+': '+', '²': '²', '³': '³', '(': '(', ')': ')' };
      let v = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
      if (!v && estExpr() && S.q.lettres.includes(e.key.toLowerCase())) v = e.key.toLowerCase();
      if (!v && estDuree() && /^[hms]$/i.test(e.key)) v = e.key.toLowerCase();
      if (!v && estChoix() && /^[a-z]$/i.test(e.key)) v = e.key;
      if (!v) return;
      e.preventDefault();
      if (document.querySelector('.cours-pop')) return;
      if (S.repondu) { if (v === 'ok') { const nx = app.querySelector('#next'); if (nx) nx.click(); else suivante(); } return; }
      if (estChoix()) {
        // 1, 2, 3… choisissent la 1re, 2e, 3e option ; une lettre (A, B, C, O pour Oui, N pour Non) choisit l'option qui commence par elle
        const opts = S.q.etapes[S.etape].options, txt = (o) => o.replace(/<[^>]+>/g, '').trim().toUpperCase();
        let i = /^[1-9]$/.test(v) ? +v - 1 : -1;
        if (i < 0 && e.key.length === 1) i = opts.findIndex((o) => txt(o).startsWith(e.key.toUpperCase()));
        if (i >= 0 && i < opts.length) choisir(i);
        return;
      }
      touche(v);
    };
    document.addEventListener('keydown', keyHandler);
    sauver();
  }

  function touche(v) {
    if (S.repondu) return;
    const s = S.saisie, last = s.slice(-1);
    app.querySelector('#hint').textContent = '';
    if (v === 'ok') return valider();
    if (v === 'del') S.saisie = s.slice(0, -1);
    else if (estDuree()) {
      const u = S.q.unites || ['h', 'min'], ordre = 'hms';
      if (/[0-9]/.test(v)) {
        const bloc = (s.match(/(\d*)$/) || ['', ''])[1];
        if (bloc.length >= 5 || (s.endsWith('s'))) return;
      } else if (/[hms]/.test(v)) {
        if (!u.includes(UNITES[v]) || !/[0-9]$/.test(s)) return;
        const deja = s.replace(/[0-9]/g, '');
        if (deja.includes(v) || (deja && ordre.indexOf(v) < ordre.indexOf(deja.slice(-1)))) return;
      } else return;
      S.saisie = s + v;
    } else if (estExpr()) {
      const estOp = (c) => c === '+' || c === '-';
      const prof = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
      if (s.length >= 40) return;
      if (/[0-9]/.test(v)) { if (/[a-z²³]/.test(last)) return; }
      else if (/[a-z]/.test(v)) { if (!S.q.lettres.includes(v)) return; }
      else if (v === '(') { if (!S.q.facto || prof > 0) return; }
      else if (v === ')') { if (prof !== 1 || estOp(last) || last === '(') return; }
      else if (v === '+') { if (s === '' || estOp(last) || last === '(') return; }
      else if (v === '-') { if (estOp(last)) return; }
      else if (v === '²' || v === '³') { if (!/[a-z]/.test(last)) return; }
      else return;
      S.saisie = s + v;
    } else {
      const keys = S.q.clavier != null ? S.q.clavier : (S.t.clavier || '');
      if (!/[0-9]/.test(v) && !keys.includes(v)) return;
      if (s.length >= 9) return;
      if (v === '-') { if (s === '') S.saisie = '-'; else if (s.endsWith('/') && !s.includes('/-')) S.saisie = s + '-'; else return; }
      else if (v === '/') { if (/\d$/.test(s) && !s.includes('/') && !s.includes(',')) S.saisie = s + '/'; else return; }
      else if (v === ',') { if (s.includes(',') || s.includes('/')) return; S.saisie = (s === '' || s === '-') ? s + '0,' : s + ','; }
      else S.saisie = s + v;
    }
    afficherSaisie();
  }

  function rendNombre(s) { return s.replace(/-/g, M); }
  function rendExpr(s) {
    let h = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (/[a-z]/.test(c)) h += '<i>' + c + '</i>';
      else if (SUP[c]) h += '<sup>' + SUP[c] + '</sup>';
      else if (c === '+') h += ' + ';
      else if (c === '-') h += (i === 0 || s[i - 1] === '(') ? M : ' ' + M + ' ';
      else h += c;
    }
    return h;
  }
  function afficherSaisie() {
    const box = app.querySelector('#box');
    const s = S.saisie;
    let html;
    if (estChoix()) html = S.choixFaits.map((i, k) => S.q.etapes[k].options[i]).join(' · ');
    else if (estDuree()) html = s.replace(/(\d+)([hms])/g, (_, n, u) => n + '<span class="u">' + UNITES[u] + '</span> ').trim();
    else if (estExpr()) html = rendExpr(s);
    else if (s.includes('/')) {
      const [a, b] = s.split('/');
      html = '<span class="frac"><span>' + esc(rendNombre(a)) + '</span><span>' + (b ? esc(rendNombre(b)) : '<span class="ph">□</span>') + '</span></span>';
    } else html = esc(rendNombre(s));
    box.innerHTML = '<span class="saisie">' + html + '</span>' + (S.repondu ? '' : '<span class="caret" aria-hidden="true"></span>');
  }

  function lire(s) {
    if (/^-?\d+(,\d+)?$/.test(s)) {
      const [ent, dec = ''] = s.split(',');
      const d = Math.pow(10, dec.length);
      const neg = ent.startsWith('-');
      const n = Math.abs(parseInt(ent, 10)) * d + (dec ? parseInt(dec, 10) : 0);
      return { q: Q(neg ? -n : n, d), brut: { n: neg ? -n : n, d, frac: false } };
    }
    const m = s.match(/^(-?\d+)\/(-?\d+)$/);
    if (m) { const n = +m[1], d = +m[2]; if (d === 0) return { zero: true }; return { q: Q(n, d), brut: { n, d, frac: true } }; }
    return null;
  }

  // Lit une expression littérale tapée par l'élève : { map, pasReduit } ou null si incomplète.
  function lireExpr(s) {
    if (s === '0') return { map: {}, pasReduit: false };
    if (/[+-]$/.test(s)) return null;
    const termes = s.match(/[+-]?[^+-]+/g);
    if (!termes || termes.join('') !== s) return null;
    const map = {}, vus = new Set();
    let pasReduit = false;
    for (const tm of termes) {
      const signe = tm[0] === '-' ? -1 : 1;
      const corps = tm.replace(/^[+-]/, '');
      const mm = corps.match(/^(\d*)((?:[a-z][²³]?)*)$/);
      if (!mm || !corps) return null;
      const [, chiffres, lettres] = mm;
      if (!chiffres && !lettres) return null;
      const c = chiffres ? parseInt(chiffres, 10) : 1;
      if (chiffres === '1' && lettres) pasReduit = true;
      if (c === 0) pasReduit = true;
      const m = {};
      (lettres.match(/[a-z][²³]?/g) || []).forEach((x) => { const l = x[0], e = x[1] ? +SUP[x[1]] : 1; if (m[l]) pasReduit = true; m[l] = (m[l] || 0) + e; });
      const k = cle(m);
      if (vus.has(k)) pasReduit = true;
      vus.add(k);
      map[k] = (map[k] || 0) + signe * c;
    }
    Object.keys(map).forEach((k) => { if (map[k] === 0) delete map[k]; });
    return { map, pasReduit };
  }
  // Forme factorisée : signe, monôme facteur, puis des parenthèses. { map, produit, incomplet, pasReduit } ou null.
  const versM = (k) => { const m = {}; k.replace(/([a-z])(\d+)/g, (_, l, e) => { m[l] = +e; }); return m; };
  function mulMaps(a, b) {
    const r = {};
    for (const ka in a) for (const kb in b) {
      const ma = versM(ka), mb = versM(kb);
      for (const l in mb) ma[l] = (ma[l] || 0) + mb[l];
      const k = cle(ma); r[k] = (r[k] || 0) + a[ka] * b[kb];
    }
    Object.keys(r).forEach((k) => { if (r[k] === 0) delete r[k]; });
    return r;
  }
  function lireFacto(s) {
    if (!s.includes('(')) { const r = lireExpr(s); return r && { map: r.map, produit: false, pasReduit: r.pasReduit }; }
    if ((s.match(/\(/g) || []).length !== (s.match(/\)/g) || []).length) return null;
    let i = 0, signe = 1, dehors = '', pasReduit = false, incomplet = false;
    const groupes = [];
    if (s[0] === '-') { signe = -1; i = 1; }
    while (i < s.length) {
      const c = s[i];
      if (c === '(') {
        const j = s.indexOf(')', i), g = lireExpr(s.slice(i + 1, j));
        if (!g) return null;
        groupes.push(g); i = j + 1;
      } else if (c === '+' || c === '-') return { map: null, sommeDeProduits: true };
      else { dehors += c; i++; }
    }
    const mm = dehors.match(/^(\d*)((?:[a-z][²³]?)*)$/);
    if (!mm) return { map: null, sommeDeProduits: true };
    const m = {};
    (mm[2].match(/[a-z][²³]?/g) || []).forEach((x) => { if (m[x[0]]) pasReduit = true; m[x[0]] = (m[x[0]] || 0) + (x[1] ? +SUP[x[1]] : 1); });
    if (mm[1] === '1' && mm[2]) pasReduit = true;
    let map = { [cle(m)]: signe * (mm[1] ? parseInt(mm[1], 10) : 1) };
    groupes.forEach((g) => {
      map = mulMaps(map, g.map);
      if (g.pasReduit) pasReduit = true;
      const ks = Object.keys(g.map);
      if (ks.length < 2) { pasReduit = true; return; }
      if (ks.map((k) => Math.abs(g.map[k])).reduce(gcd) > 1) incomplet = true;
      const communes = ks.map(versM).reduce((a, b) => { const r = {}; for (const l in a) if (b[l]) r[l] = Math.min(a[l], b[l]); return r; });
      if (Object.keys(communes).length) incomplet = true;
    });
    const nonTrivial = mm[1] && mm[1] !== '1' || mm[2];
    return { map, produit: groupes.length >= 2 || (groupes.length === 1 && !!nonTrivial), incomplet, pasReduit };
  }
  const memeMap = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every((k) => a[k] === b[k]); };
  const reponseHTML = (q) => (q.type === 'expr' ? q.reponseHTML
    : q.type === 'choix' ? q.etapes.map((e) => e.options[e.reponse]).join(' · ')
      : q.type === 'duree' ? fmtDureeQ(q.reponse, q.unites)
        : q.decimal ? String(q.reponse.n / q.reponse.d).replace('.', ',').replace('-', M) + (q.suffixe ? ' ' + esc(q.suffixe) : '') : fracQ(q.reponse));

  // Questions à choix : une ou plusieurs étapes (ex. « rectangle ? » puis « en quel point ? »).
  // On passe à l'étape suivante seulement si la réponse est juste.
  function afficherChoix() {
    const st = S.q.etapes[S.etape];
    app.querySelector('#choix').innerHTML = (st.texte ? '<p class="choix-q">' + st.texte + '</p>' : '') +
      '<div class="choix-grid n' + Math.min(st.options.length, 4) + (st.options.some((o) => o.replace(/<[^>]+>/g, '').length > 6) ? ' long' : '') + '">' + st.options.map((o, i) => '<button class="key opt" data-c="' + i + '">' + o + '</button>').join('') + '</div>';
  }
  function choisir(i) {
    if (S.repondu) return;
    S.choixFaits.push(i);
    const st = S.q.etapes[S.etape];
    if (i === st.reponse && S.etape + 1 < S.q.etapes.length) { S.etape++; afficherSaisie(); afficherChoix(); return; }
    valider();
  }

  function valider() {
    const hint = app.querySelector('#hint');
    if (!estChoix() && (!S.saisie || S.saisie === '-')) { hint.textContent = 'Écris ta réponse avec le clavier.'; secouer(); return; }
    let egal, pasSimplifie = false, conseil = '';
    let msgPresque = 'Ton expression est bien égale au résultat, mais elle n’est pas réduite au maximum. On attendait <strong>' + reponseHTML(S.q) + '</strong>.';
    if (estChoix()) {
      egal = S.choixFaits.length === S.q.etapes.length && S.choixFaits.every((i, k) => i === S.q.etapes[k].reponse);
    } else if (estDuree()) {
      const m = S.saisie.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
      if (!m || /\d$/.test(S.saisie)) { hint.textContent = 'Ajoute l’unité après chaque nombre (h, min ou s).'; secouer(); return; }
      const h = +(m[1] || 0), mi = +(m[2] || 0), se = +(m[3] || 0), u = S.q.unites || ['h', 'min'];
      egal = h * 3600 + mi * 60 + se === S.q.reponse;
      if (egal && ((u.includes('h') && mi >= 60) || (u.includes('min') && se >= 60))) {
        pasSimplifie = true;
        msgPresque = 'Ta durée est juste, mais il faut convertir : 60 min = 1 h et 60 s = 1 min. On attendait <strong>' + reponseHTML(S.q) + '</strong>.';
      }
    } else if (estExpr() && S.q.facto) {
      const r = lireFacto(S.saisie);
      if (!r) { hint.textContent = 'Ta réponse est incomplète : vérifie les parenthèses.'; secouer(); return; }
      egal = !!r.map && memeMap(r.map, S.q.reponse);
      if (egal && !r.produit) { pasSimplifie = true; msgPresque = 'Ton expression est bien égale, mais ce n’est pas un produit : elle n’est pas factorisée. On attendait <strong>' + reponseHTML(S.q) + '</strong>.'; }
      else if (egal && r.incomplet) { pasSimplifie = true; msgPresque = 'C’est bien un produit égal à l’expression, mais on peut encore mettre un facteur en évidence dans une parenthèse. On attendait <strong>' + reponseHTML(S.q) + '</strong>.'; }
      else if (egal && r.pasReduit) pasSimplifie = true;
    } else if (estExpr()) {
      const r = lireExpr(S.saisie);
      if (!r) { hint.textContent = 'Ta réponse est incomplète.'; secouer(); return; }
      egal = memeMap(r.map, S.q.reponse);
      pasSimplifie = egal && r.pasReduit;
    } else {
      const r = lire(S.saisie);
      if (!r) { hint.textContent = 'Ta réponse est incomplète.'; secouer(); return; }
      if (r.zero) { hint.textContent = 'Le dénominateur ne peut pas être 0.'; secouer(); return; }
      const att = S.q.reponse;
      egal = r.q.n === att.n && r.q.d === att.d;
      const nonIrr = r.brut.frac && (gcd(r.brut.n, r.brut.d) !== 1 || Math.abs(r.brut.d) === 1); // le signe − est accepté au numérateur comme au dénominateur
      const mode = S.q.irreductible != null ? S.q.irreductible : S.t.irreductible;
      if (egal && nonIrr && mode === true) pasSimplifie = true;
      if (egal && nonIrr && mode === 'conseil') conseil = 'Tu pouvais simplifier : ' + fracQ(r.brut.d < 0 ? { n: -r.brut.n, d: -r.brut.d } : r.brut) + ' = ' + fracQ(att) + '.';
    }
    const juste = egal && !pasSimplifie;
    S.repondu = true;
    const ratt = S.enRattrapage;
    if (ratt) { S.ratt.n++; if (juste) S.ratt.ok++; S.hist[S.hist.length - 1].ratt = juste; }
    else {
      if (juste) { S.score++; S.serie++; S.meilleureSerie = Math.max(S.meilleureSerie, S.serie); } else S.serie = 0;
      S.hist.push({ enonce: S.q.enonce, att: reponseHTML(S.q), juste });
      S.erreursSuite = juste ? 0 : (S.erreursSuite || 0) + 1;
      if (S.erreursSuite >= 2 && !S.coursMontre && S.t.cours) S.coursAFaire = true; // rappel affiché avant la question suivante
    }
    sauver();
    afficherSaisie();
    app.querySelector('#ans').classList.add(juste ? 'ok' : 'ko');
    app.querySelector('.score').textContent = '✓ ' + S.score;
    if (!ratt) app.querySelector('.track i').style.width = ((S.i + 1) / S.n * 100) + '%';

    const der = S.i + 1 >= S.n, proposeRatt = !juste && !ratt && S.t.rattrapage;
    const bravo = ['Exact !', 'Bravo !', 'Bien joué !', 'Parfait !', 'Juste !'];
    const bouton = proposeRatt
      ? '<div class="btn-row"><button class="btn btn-primary" id="next">Rattrapage : une question du même type</button><button class="btn btn-ghost" id="passer">Passer</button></div>'
      : '<button class="btn btn-primary" id="next">' + (der ? 'Voir mon résultat' : 'Question suivante') + '</button>';
    let html;
    if (juste) {
      html = '<div class="fb ok" role="status"><h2>' + (ratt ? 'Bien rattrapé !' : bravo[Math.floor(Math.random() * bravo.length)]) + '</h2>' +
        (conseil ? '<p>' + conseil + '</p>' : '') +
        (S.serie >= 3 ? '<p>' + S.serie + ' bonnes réponses d’affilée.</p>' : '') + bouton + '</div>';
    } else {
      const corr = S.q.correction;
      if (!estExpr()) msgPresque = 'Ta fraction est bien égale au résultat, mais elle n’est pas simplifiée au maximum.';
      html = '<div class="fb ko" role="status"><h2>' + (pasSimplifie ? 'Presque !' : 'Pas tout à fait.') + '</h2>' +
        '<p>' + (pasSimplifie ? msgPresque : 'La bonne réponse est <strong class="rep">' + reponseHTML(S.q) + '</strong>.') + '</p>' +
        '<div class="corr"><div class="t">' + (corr.texte || '') + '</div><ol>' +
        corr.lignes.map((l) => '<li><span class="m">' + l.m + '</span>' + (l.c ? '<span class="c">' + esc(l.c) + '</span>' : '') + '</li>').join('') +
        '</ol></div>' + bouton + '</div>';
    }
    app.querySelector('#zone').innerHTML = html;
    app.querySelector('#hint').textContent = '';
    const nx = app.querySelector('#next');
    nx.onclick = proposeRatt ? rattrapage : suivante;
    const ps = app.querySelector('#passer'); if (ps) ps.onclick = suivante;
    nx.focus({ preventScroll: true });
  }

  function secouer() { const a = app.querySelector('#ans'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); }

  // Rattrapage (automatismes) : une question du même type (q.cat), qui ne compte pas dans le score
  function rattrapage() {
    const cat = S.q.cat, gens = [S.t.niveaux[S.lvl - 1]].concat(S.t.niveaux.filter((lv, i) => i !== S.lvl - 1)); // « Tout mélangé » : on cherche aussi dans chaque partie
    let q = null;
    for (const gen of gens) for (let k = 0; k < 80 && !q; k++) { const c = gen.gen(); if (c.cat === cat && c.enonce !== S.q.enonce) q = c; }
    if (!q) return suivante();
    S.enRattrapage = true;
    poser(q);
  }

  function suivante() {
    S.enRattrapage = false;
    S.i++;
    if (S.i >= S.n) bilan(); else poser();
  }

  function demanderQuitter() {
    const z = app.querySelector('#quitzone');
    if (z.innerHTML) { z.innerHTML = ''; return; }
    z.innerHTML = '<div class="quitbar"><span>Ta série est enregistrée sur cet appareil : tu pourras la reprendre plus tard à la question ' + questionEnCours(S) + '.</span>' +
      '<span class="btn-row"><button class="btn" id="q-non">Continuer</button><button class="btn btn-primary" id="q-pause">Faire une pause</button><button class="btn btn-ghost" id="q-stop">Abandonner la série</button></span></div>';
    const sortir = () => { const t = S.t; S = null; stopKeys(); vueTheme(t); };
    z.querySelector('#q-non').onclick = () => { z.innerHTML = ''; };
    z.querySelector('#q-pause').onclick = () => { sauver(); sortir(); };
    z.querySelector('#q-stop').onclick = () => { effacer(S.t); sortir(); };
  }

  /* ---------- Bilan de fin de série ---------- */
  function bilan() {
    stopKeys();
    const { t, lvl, score, n } = S;
    effacer(t);
    const bonusAvant = viesBonus(), reussie = score >= Math.ceil(0.8 * n);
    if (reussie) setViesBonus(bonusAvant + 1);
    const bonusApres = viesBonus();
    const moiB = getMoi(), gain = xpSerie(score, n);
    let xpTxt = '';
    if (moiB) {
      const p0 = getProfil(moiB), auj = jourLocal(), hier = jourLocal(new Date(Date.now() - 864e5));
      const p1 = { xp: p0.xp + gain, jours: p0.d === auj ? p0.jours || 1 : p0.d === hier ? (p0.jours || 0) + 1 : 1, d: auj };
      store.set('xp:' + cleMoi(moiB), p1);
      const r0 = rangDe(p0.xp), r1 = rangDe(p1.xp);
      xpTxt = '<div class="card gain-xp' + (r1 > r0 ? ' monte' : '') + '"><strong>+' + gain + ' XP</strong>' +
        (r1 > r0 ? '<span>Nouveau niveau ' + (r1 + 1) + ' : <b>' + esc(RANGS[r1].nom) + '</b> ! Ton avatar gagne un côté.</span><span class="anecdote">' + esc(RANGS[r1].txt) + '</span>'
          : '<span>' + p1.xp + ' XP au total · niveau ' + (r1 + 1) + ' : ' + esc(RANGS[r1].nom) + '</span>') + '</div>';
    }
    const duree = (Date.now() - S.debut) / 1000;
    const cle = 'best:' + t.id + ':' + lvl;
    const best = store.get(cle, null);
    if (!best || score > best.s) store.set(cle, { s: score, t: n });
    const p = score / n;
    const titre = p >= 0.9 ? 'Excellent !' : p >= 0.7 ? 'Très bien !' : p >= 0.5 ? 'C’est en bonne voie.' : 'Continue à t’entraîner, ça va venir.';
    const moi = getMoi() || { prenom: '?', classe: '?' };
    const res = {
      id: uid(), date: new Date().toISOString(), prenom: moi.prenom, classe: moi.classe,
      themeId: t.id, theme: t.titre, niveau: lvl, niveauNom: t.niveaux[lvl - 1].nom,
      score, total: n, duree: Math.round(duree),
      detail: S.hist.map((h, i) => 'Q' + (i + 1) + (h.juste ? ' ok' : ' faux') + (h.ratt == null ? '' : h.ratt ? ' ratt ok' : ' ratt faux')).join(' ')
    };
    const recap = S.hist.map((h, i) => '<li><span class="n">' + (i + 1) + '.</span><span>' + h.enonce + '</span><span class="' + (h.juste ? 'ok">✓' : 'ko">✗ ' + h.att) + '</span></li>').join('');
    app.innerHTML =
      '<div class="wrap"><div class="end">' +
      '<span class="eyebrow">' + esc(t.titre) + ' · ' + (avecEtoiles(t) ? stars(lvl) + ' ' : '') + esc(t.niveaux[lvl - 1].nom) + '</span>' +
      '<div class="big">' + score + '<small>/' + n + '</small></div><h1>' + titre + '</h1>' +
      '<div class="stats"><div class="card stat"><b>' + fmtDuree(duree) + '</b><span>Temps</span></div><div class="card stat"><b>' + S.meilleureSerie + '</b><span>Meilleure série</span></div></div>' +
      xpTxt + (S.ratt && S.ratt.n ? '<p class="ratt-bilan">Rattrapages : ' + S.ratt.ok + ' réussi' + (S.ratt.ok > 1 ? 's' : '') + ' sur ' + S.ratt.n + '</p>' : '') +
      '<p class="send" id="send">' + (C.urlScript ? 'Envoi du résultat à ton professeur…' : 'Mode démonstration : le résultat n’est pas envoyé.') + '</p>' +
      '<a class="card gain" href="#jeu"><span class="jeu-icone">' + ICONE_JEU + '</span><span class="jeu-txt"><strong>' +
        (bonusApres > bonusAvant ? 'Bravo, 8/10 ou plus : +1 vie pour ' + JEU.nom + ' !' : reussie ? 'Réserve de vies bonus pleine !' : JEU.nom) + '</strong>' +
        '<span>' + (reussie ? 'Ta prochaine partie : ' + txtVies(bonusApres) + '.' : 'Fais 8/10 ou plus pour gagner une vie bonus. Tu peux quand même jouer !') + '</span></span>' + pastilles(bonusApres) + '</a>' +
      '<div class="btn-row">' +
      (p >= 0.8 && lvl < 3 ? '<button class="btn btn-primary" id="up">Passer au niveau ' + '★'.repeat(lvl + 1) + '</button>' : '') +
      '<button class="btn ' + (p >= 0.8 && lvl < 3 ? '' : 'btn-primary') + '" id="again">Nouvelle série</button>' +
      '<a class="btn" href="#dom-' + domaineDe(t).id + '">Autres exerciseurs</a></div>' +
      '<details class="card recap"><summary>Revoir mes réponses</summary><ol>' + recap + '</ol></details>' +
      '</div></div>';
    if (reussie) pluie();
    app.querySelector('#again').onclick = () => demarrer(t, lvl);
    const up = app.querySelector('#up');
    if (up) up.onclick = () => demarrer(t, lvl + 1);
    if (C.urlScript) {
      const file = store.get('file', []);
      file.push(res);
      store.set('file', file);
      envoyer().then((etat) => {
        const el = document.getElementById('send');
        if (!el) return;
        if (etat === 'ok') { el.textContent = 'Résultat envoyé à ton professeur.'; el.className = 'send ok'; }
        else { el.textContent = 'Pas de connexion : ton résultat sera envoyé automatiquement la prochaine fois que tu ouvriras le site.'; el.className = 'send wait'; }
      });
    }
  }

  /* ---------- Pluie de symboles quand la série est réussie (8/10 ou plus) ---------- */
  function pluie() {
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* */ }
    const sym = ['π', '√', '∞', 'Σ', '∫', '×', '÷', '≈', 'Δ', 'θ', '½', '%'], col = DOMAINES.map((d) => d.c).concat('#ffb703');
    const z = document.createElement('div'); z.className = 'pluie'; z.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 28; i++) {
      const e = document.createElement('span'); e.textContent = sym[i % sym.length];
      e.style.cssText = 'left:' + (Math.random() * 96) + '%;color:' + col[i % col.length] + ';font-size:' + (20 + Math.random() * 22) + 'px;animation-delay:' + (Math.random() * 1.2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6) + 's';
      z.appendChild(e);
    }
    document.body.appendChild(z); setTimeout(() => z.remove(), 5200);
  }

  /* ---------- Envoi des résultats (avec file d'attente hors connexion) ---------- */
  let envoiEnCours = null;
  function envoyer() {
    if (!C.urlScript) return Promise.resolve('off');
    if (envoiEnCours) return envoiEnCours;
    envoiEnCours = (async () => {
      let file = store.get('file', []);
      for (const r of file.slice()) {
        try {
          const rep = await fetch(C.urlScript, { method: 'POST', body: JSON.stringify(r) });
          const j = await rep.json();
          if (j && j.ok) {
            file = file.filter((x) => x.id !== r.id); store.set('file', file);
            if (j.profil) { const k = 'xp:' + cleMoi(r), loc = store.get(k, {}); store.set(k, { xp: j.profil.xp + xpEnAttente(file, r), jours: j.profil.jours, d: loc.d || jourLocal() }); }
          }
        } catch (e) { break; }
      }
      return file.length ? 'attente' : 'ok';
    })().finally(() => { envoiEnCours = null; });
    return envoiEnCours;
  }

  /* =====================================================================
     ESPACE PROFESSEUR
     ===================================================================== */
  let donneesProf = null, donneesJeu = [], consProf = { '4e': [], '3e': [] };
  function vueProf() {
    app.innerHTML = '<div class="wrap prof"><a class="btn btn-ghost back" href="#">← Portail élèves</a><h1>Espace professeur</h1>' +
      '<p class="lead">Résultats envoyés par les élèves à la fin de chaque série.</p><div id="pz"></div></div>';
    const pz = app.querySelector('#pz');
    if (!C.urlScript) {
      pz.innerHTML = '<div class="card panel"><h2>L’envoi des résultats n’est pas encore configuré</h2><p>Suivez l’étape 1 du fichier LISEZMOI.md : créez le tableur Google et son script, puis collez l’adresse obtenue dans <code>config.js</code> (ligne <code>urlScript</code>).</p></div>';
      return;
    }
    let cle = '';
    try { cle = sessionStorage.getItem('gc:cle') || ''; } catch (e) { /* */ }
    if (cle && donneesProf) return rendreProf(pz);
    if (cle) return chargerProf(pz, cle);
    formCle(pz);
  }

  function formCle(pz, erreur) {
    pz.innerHTML = '<form class="card panel" id="fk"><label class="field">Code professeur<input id="cle" type="password" autocomplete="current-password" required></label>' +
      (erreur ? '<p class="msg-err">' + esc(erreur) + '</p>' : '') +
      '<div class="btn-row"><button class="btn btn-primary">Afficher les résultats</button></div></form>';
    pz.querySelector('#fk').onsubmit = (e) => { e.preventDefault(); chargerProf(pz, pz.querySelector('#cle').value.trim()); };
    pz.querySelector('#cle').focus();
  }

  async function chargerProf(pz, cle) {
    pz.innerHTML = '<div class="card panel">Chargement des résultats…</div>';
    try {
      const rep = await fetch(C.urlScript + '?cle=' + encodeURIComponent(cle));
      const j = await rep.json();
      if (!j.ok) { try { sessionStorage.removeItem('gc:cle'); } catch (e) { /* */ } return formCle(pz, j.erreur === 'cle' ? 'Code incorrect.' : 'Erreur : ' + (j.erreur || 'inconnue')); }
      try { sessionStorage.setItem('gc:cle', cle); } catch (e) { /* */ }
      donneesProf = j.lignes.map((l) => Object.assign(l, { t: new Date(l.date).getTime(), cleEleve: (l.classe + '|' + l.prenom).toLowerCase() }));
      consProf = { '4e': [], '3e': [], ...(j.conseils || {}) };
      donneesJeu = (j.jeu || []).map((l) => Object.assign(l, { t: new Date(l.date).getTime(), cleEleve: (l.classe + '|' + l.prenom).toLowerCase() }));
      rendreProf(pz);
    } catch (e) {
      formCle(pz, 'Impossible de joindre le tableur. Vérifiez la connexion et l’adresse urlScript dans config.js.');
    }
  }

  const F = { classe: '', theme: '', periode: '30', q: '', onglet: 'eleves' };
  let flash = '';
  async function supprimerDistant(payload) {
    let cle = '';
    try { cle = sessionStorage.getItem('gc:cle') || ''; } catch (e) { /* */ }
    const rep = await fetch(C.urlScript, { method: 'POST', body: JSON.stringify(Object.assign({ action: 'supprimer', cle }, payload)) });
    return rep.json();
  }
  function rendreProf(pz) {
    const d = donneesProf;
    const classes = [...new Set(d.map((l) => l.classe).concat(donneesJeu.map((l) => l.classe)))].sort();
    const themes = [...new Set(d.map((l) => l.themeId))].map((id) => ({ id, titre: (THEMES.find((t) => t.id === id) || {}).titre || id }));
    const sel = (id, opts, val) => '<select id="' + id + '">' + opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
    pz.innerHTML =
      '<div class="card panel"><div class="filters">' +
      '<label class="field">Classe' + sel('f-classe', [['', 'Toutes']].concat(classes.map((c) => [c, c])), F.classe) + '</label>' +
      '<label class="field">Exerciseur' + sel('f-theme', [['', 'Tous']].concat(themes.map((t) => [t.id, t.titre])), F.theme) + '</label>' +
      '<label class="field">Période' + sel('f-periode', [['1', 'Aujourd’hui'], ['7', '7 derniers jours'], ['30', '30 derniers jours'], ['', 'Depuis le début']], F.periode) + '</label>' +
      '<label class="field">Élève<input id="f-q" placeholder="Rechercher un prénom" value="' + esc(F.q) + '"></label>' +
      '</div><div class="btn-row"><button class="btn" id="reload">Actualiser</button><button class="btn btn-ghost" id="logout">Se déconnecter</button></div></div>' +
      '<details class="card panel cons-ed"><summary>Conseils du prof : l’ordre des exerciseurs conseillé aux élèves</summary><div id="cons-body"></div></details>' +
      '<div id="res"></div>';
    editeurConseils(pz.querySelector('#cons-body'));
    const maj = () => {
      F.classe = pz.querySelector('#f-classe').value; F.theme = pz.querySelector('#f-theme').value;
      F.periode = pz.querySelector('#f-periode').value; F.q = pz.querySelector('#f-q').value.trim().toLowerCase();
      tableaux(pz.querySelector('#res'));
    };
    ['#f-classe', '#f-theme', '#f-periode'].forEach((s) => pz.querySelector(s).onchange = maj);
    pz.querySelector('#f-q').oninput = maj;
    pz.querySelector('#reload').onclick = () => { let c = ''; try { c = sessionStorage.getItem('gc:cle'); } catch (e) { /* */ } chargerProf(pz, c); };
    pz.querySelector('#logout').onclick = () => { try { sessionStorage.removeItem('gc:cle'); } catch (e) { /* */ } donneesProf = null; formCle(pz); };
    maj();
  }

  /* Conseils du prof : liste ordonnée par niveau, affichée sur l'accueil des élèves */
  function editeurConseils(el, msg) {
    const nomNiv = (t, l) => (t.parties ? (t.niveaux[l - 1].court || t.niveaux[l - 1].nom) : '★'.repeat(l));
    el.innerHTML = '<p class="lead">Les élèves voient cette liste sur l’accueil, sous le choix 4e / 3e. Changez l’ordre avec les flèches, puis enregistrez.</p>' +
      NIVEAUX.map((niv) => {
        const dispo = THEMES.filter((t) => t.classes.includes(niv));
        return '<div class="cons-niv-bloc"><h3>' + niv + '</h3><ol class="cons-liste">' + (consProf[niv] || []).map((c, i) => {
          const t = THEMES.find((x) => x.id === c.id);
          return '<li><span>' + (t ? esc(t.titre) + ' · ' + esc(nomNiv(t, c.l)) : esc(c.id) + ' (exerciseur introuvable)') + '</span><span class="cons-act">' +
            '<button class="btn btn-ghost" data-a="haut" data-n="' + niv + '" data-i="' + i + '" aria-label="Monter"' + (i ? '' : ' disabled') + '>↑</button>' +
            '<button class="btn btn-ghost" data-a="bas" data-n="' + niv + '" data-i="' + i + '" aria-label="Descendre"' + (i < consProf[niv].length - 1 ? '' : ' disabled') + '>↓</button>' +
            '<button class="btn btn-ghost" data-a="suppr" data-n="' + niv + '" data-i="' + i + '" aria-label="Retirer">✕</button></span></li>';
        }).join('') + '</ol><div class="cons-ajout"><select data-t="' + niv + '">' + dispo.map((t) => '<option value="' + t.id + '">' + esc(t.titre) + '</option>').join('') + '</select>' +
          '<select data-l="' + niv + '"></select><button class="btn" data-a="ajout" data-n="' + niv + '">Ajouter</button></div></div>';
      }).join('') +
      '<div class="btn-row"><button class="btn btn-primary" id="cons-ok">Enregistrer les conseils</button></div>' + (msg ? '<p class="send ' + msg[0] + '">' + esc(msg[1]) + '</p>' : '');
    const remplirNiveaux = (niv) => {
      const t = THEMES.find((x) => x.id === el.querySelector('[data-t="' + niv + '"]').value);
      el.querySelector('[data-l="' + niv + '"]').innerHTML = t.niveaux.map((lv, i) => '<option value="' + (i + 1) + '">' + esc(nomNiv(t, i + 1)) + '</option>').join('');
    };
    NIVEAUX.forEach((niv) => { remplirNiveaux(niv); el.querySelector('[data-t="' + niv + '"]').onchange = () => remplirNiveaux(niv); });
    el.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => {
      const niv = b.dataset.n, L = consProf[niv] = consProf[niv] || [], i = +b.dataset.i;
      if (b.dataset.a === 'ajout') L.push({ id: el.querySelector('[data-t="' + niv + '"]').value, l: +el.querySelector('[data-l="' + niv + '"]').value });
      else if (b.dataset.a === 'suppr') L.splice(i, 1);
      else { const j = b.dataset.a === 'haut' ? i - 1 : i + 1; [L[i], L[j]] = [L[j], L[i]]; }
      editeurConseils(el, ['wait', 'Modifications non enregistrées.']);
    });
    el.querySelector('#cons-ok').onclick = async () => {
      let cle = ''; try { cle = sessionStorage.getItem('gc:cle') || ''; } catch (e) { /* */ }
      try {
        const j = await (await fetch(C.urlScript, { method: 'POST', body: JSON.stringify({ action: 'conseils', cle, conseils: consProf }) })).json();
        if (j.ok) { consProf = Object.assign({ '4e': [], '3e': [] }, j.conseils); store.set('conseils', consProf); editeurConseils(el, ['ok', 'Conseils enregistrés : les élèves les voient sur l’accueil.']); }
        else editeurConseils(el, ['wait', j.erreur === 'cle' ? 'Code refusé : reconnectez-vous.' : 'Erreur : ' + (j.erreur || 'inconnue') + '. Le script Google est-il à jour ?']);
      } catch (e) { editeurConseils(el, ['wait', 'Impossible de joindre le tableur.']); }
    };
  }

  // Tri (clic sur un titre de colonne) et sélection (cases à cocher) propres à chaque onglet
  const TRI = { eleves: { col: 'classe', sens: 1 }, series: { col: 'date', sens: -1 }, jeu: { col: 'date', sens: -1 } };
  const SEL = { eleves: new Set(), series: new Set(), jeu: new Set() };
  let dernierCoche = null;
  const MAX_LIGNES = 500;

  function tableaux(el) {
    const now = Date.now(), o = F.onglet;
    const dansPeriode = (l) => !F.periode || (F.periode === '1' ? new Date(l.t).toDateString() === new Date().toDateString() : now - l.t <= F.periode * 864e5);
    const L = donneesProf.filter((l) => (!F.classe || l.classe === F.classe) && (!F.theme || l.themeId === F.theme) && (!F.q || l.prenom.toLowerCase().includes(F.q)) && dansPeriode(l));
    const LJ = donneesJeu.filter((l) => (!F.classe || l.classe === F.classe) && (!F.q || l.prenom.toLowerCase().includes(F.q)) && dansPeriode(l));
    const eleves = new Map();
    L.slice().sort((a, b) => b.t - a.t).forEach((l) => {
      if (!eleves.has(l.cleEleve)) eleves.set(l.cleEleve, { cle: l.cleEleve, prenom: l.prenom, classe: l.classe, n: 0, s: 0, tot: 0, der: l.t, best: new Map() });
      const e = eleves.get(l.cleEleve);
      e.n++; e.s += l.score; e.tot += l.total;
      const k = l.themeId + ':' + l.niveau, b = e.best.get(k);
      if (!b || l.score / l.total > b.score / b.total) e.best.set(k, l);
    });
    const moy = L.length ? Math.round(L.reduce((s, l) => s + l.score / l.total, 0) / L.length * 100) : 0;
    const meter = (p) => { const c = p >= 80 ? 'var(--ok)' : p >= 50 ? 'var(--mid)' : 'var(--ko)'; return '<span class="meter"><i style="width:' + p + '%;background:' + c + '"></i></span>' + p + ' %'; };
    const dt = (t) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const nomT = (id) => (THEMES.find((t) => t.id === id) || {}).titre || id;
    const etoiles = (l) => { const th = THEMES.find((t) => t.id === l.themeId); return th && th.parties ? esc((th.niveaux[l.niveau - 1] || {}).court || '') : '★'.repeat(l.niveau); };

    // Colonnes de chaque onglet : titre, valeur de tri, contenu affiché
    const COLS = {
      eleves: [
        { id: 'prenom', titre: 'Élève', v: (e) => e.prenom, h: (e) => '<strong>' + esc(e.prenom) + '</strong>' },
        { id: 'classe', titre: 'Classe', v: (e) => e.classe, h: (e) => esc(e.classe) },
        { id: 'n', titre: 'Séries', v: (e) => e.n, h: (e) => e.n, num: true },
        { id: 'pct', titre: 'Réussite', v: (e) => e.s / e.tot, h: (e) => meter(Math.round(e.s / e.tot * 100)), num: true },
        { id: 'best', titre: 'Meilleurs scores', h: (e) => '<div class="cell-pills">' + [...e.best.values()].sort((a, b) => a.themeId.localeCompare(b.themeId) || a.niveau - b.niveau).map((b) => '<span class="pill ' + tone(b.score, b.total) + '">' + esc(nomT(b.themeId)) + ' ' + etoiles(b) + ' ' + b.score + '/' + b.total + '</span>').join('') + '</div>' },
        { id: 'date', titre: 'Dernière activité', v: (e) => e.der, h: (e) => dt(e.der), num: true }
      ],
      series: [
        { id: 'date', titre: 'Date', v: (l) => l.t, h: (l) => dt(l.t), num: true },
        { id: 'prenom', titre: 'Élève', v: (l) => l.prenom, h: (l) => '<strong>' + esc(l.prenom) + '</strong>' },
        { id: 'classe', titre: 'Classe', v: (l) => l.classe, h: (l) => esc(l.classe) },
        { id: 'theme', titre: 'Exerciseur', v: (l) => nomT(l.themeId), h: (l) => esc(nomT(l.themeId)) },
        { id: 'niveau', titre: 'Niveau', v: (l) => l.niveau, h: etoiles },
        { id: 'score', titre: 'Score', v: (l) => l.score / l.total, h: (l) => '<span class="pill ' + tone(l.score, l.total) + '">' + l.score + '/' + l.total + '</span>' },
        { id: 'duree', titre: 'Durée', v: (l) => l.duree, h: (l) => fmtDuree(l.duree), num: true }
      ],
      jeu: [
        { id: 'date', titre: 'Date', v: (l) => l.t, h: (l) => dt(l.t), num: true },
        { id: 'prenom', titre: 'Élève', v: (l) => l.prenom, h: (l) => '<strong>' + esc(l.prenom) + '</strong>' },
        { id: 'classe', titre: 'Classe', v: (l) => l.classe, h: (l) => esc(l.classe) },
        { id: 'mode', titre: 'Mode', v: (l) => l.mode, h: (l) => (l.mode === 'expert' ? 'Expert' : 'Normal') },
        { id: 'score', titre: 'Meilleur score', v: (l) => l.score, h: (l) => '<strong>' + l.score + '</strong>', num: true },
        { id: 'duree', titre: 'Durée', v: (l) => l.duree, h: (l) => fmtDuree(l.duree), num: true }
      ]
    };
    const donnees = o === 'eleves' ? [...eleves.values()] : o === 'series' ? L : LJ;
    const cle = (r) => (o === 'eleves' ? r.cle : r.id);
    const cols = COLS[o], tri = TRI[o], colTri = cols.find((c) => c.id === tri.col) || cols[0];
    const cmp = (a, b) => { const x = colTri.v(a), y = colTri.v(b); const r = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'fr', { numeric: true }); return r * tri.sens || (b.t || b.der || 0) - (a.t || a.der || 0); };
    const lignes = donnees.slice().sort(cmp);
    // la sélection ne garde que des lignes encore présentes avec les filtres actuels
    const presentes = new Set(lignes.map(cle));
    [...SEL[o]].forEach((k) => { if (!presentes.has(k)) SEL[o].delete(k); });
    const sel = SEL[o], toutes = lignes.length && lignes.every((r) => sel.has(cle(r)));
    const affichees = lignes.slice(0, MAX_LIGNES);
    const quoi = { eleves: ['élève', 'élèves'], series: ['série', 'séries'], jeu: ['score', 'scores'] }[o];

    let corps;
    if (!lignes.length) corps = '<div class="card empty">' + (o === 'jeu' ? 'Aucune partie de ' + JEU.nom + ' pour ces filtres.' : 'Aucun résultat pour ces filtres.') + '</div>';
    else corps =
      '<div class="barre-sel" id="barre-sel">' + (sel.size
        ? '<strong>' + sel.size + ' ' + quoi[sel.size > 1 ? 1 : 0] + ' sélectionné' + (o === 'series' ? 'e' : '') + (sel.size > 1 ? 's' : '') + '</strong><button class="btn danger-plein" id="sel-suppr">Supprimer la sélection</button><button class="btn btn-ghost" id="sel-aucun">Tout décocher</button>'
        : '<span class="aide-sel">Coche des lignes pour les supprimer ensemble (Maj + clic pour cocher une plage). La case de l’en-tête coche toutes les lignes des filtres actuels.</span>') + '</div>' +
      '<div class="card tablewrap"><table><thead><tr><th class="col-sel"><input type="checkbox" id="sel-tout" aria-label="Tout cocher"' + (toutes ? ' checked' : '') + '></th>' +
      cols.map((c) => (c.v ? '<th><button class="tri' + (c.id === tri.col ? ' actif' : '') + '" data-tri="' + c.id + '">' + c.titre + (c.id === tri.col ? (tri.sens > 0 ? ' ▲' : ' ▼') : '') + '</button></th>' : '<th>' + c.titre + '</th>')).join('') + '<th></th></tr></thead><tbody>' +
      affichees.map((r, i) => '<tr' + (sel.has(cle(r)) ? ' class="coche"' : '') + '><td class="col-sel"><input type="checkbox" data-i="' + i + '"' + (sel.has(cle(r)) ? ' checked' : '') + ' aria-label="Sélectionner"></td>' +
        cols.map((c) => '<td' + (c.num ? ' class="num"' : '') + '>' + c.h(r) + '</td>').join('') +
        '<td class="act"><button class="btn btn-ghost danger" data-un="' + i + '">Supprimer</button></td></tr>').join('') + '</tbody></table></div>' +
      (lignes.length > MAX_LIGNES ? '<p class="jeu-note">Les ' + MAX_LIGNES + ' premières lignes sont affichées sur ' + lignes.length + '. La case de l’en-tête les coche toutes.</p>' : '');

    el.innerHTML = (flash ? '<p class="flash" role="status">' + esc(flash) + '</p>' : '') +
      '<div class="kpis"><div class="card kpi"><b>' + eleves.size + '</b><span>élèves actifs</span></div><div class="card kpi"><b>' + L.length + '</b><span>séries terminées</span></div><div class="card kpi"><b>' + moy + ' %</b><span>réussite moyenne</span></div></div>' +
      '<div class="tabs"><button class="chip" data-o="eleves" aria-pressed="' + (o === 'eleves') + '">Par élève</button><button class="chip" data-o="series" aria-pressed="' + (o === 'series') + '">Toutes les séries</button><button class="chip" data-o="jeu" aria-pressed="' + (o === 'jeu') + '">Jeu</button></div>' + corps;
    flash = '';
    el.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => { F.onglet = b.dataset.o; dernierCoche = null; tableaux(el); });
    el.querySelectorAll('[data-tri]').forEach((b) => b.onclick = () => {
      const c = b.dataset.tri; if (tri.col === c) tri.sens = -tri.sens; else { tri.col = c; tri.sens = cols.find((x) => x.id === c).num ? -1 : 1; }
      tableaux(el);
    });
    if (!lignes.length) return;
    // cases à cocher, avec Maj + clic pour une plage
    el.querySelectorAll('input[data-i]').forEach((cb) => cb.onclick = (ev) => {
      const i = +cb.dataset.i, on = cb.checked;
      const [a, b] = ev.shiftKey && dernierCoche != null ? [Math.min(dernierCoche, i), Math.max(dernierCoche, i)] : [i, i];
      for (let k = a; k <= b; k++) { const kk = cle(affichees[k]); if (on) sel.add(kk); else sel.delete(kk); }
      dernierCoche = i; tableaux(el);
    });
    el.querySelector('#sel-tout').onclick = (ev) => { if (ev.target.checked) lignes.forEach((r) => sel.add(cle(r))); else sel.clear(); dernierCoche = null; tableaux(el); };
    const aucun = el.querySelector('#sel-aucun'); if (aucun) aucun.onclick = () => { sel.clear(); tableaux(el); };
    const suppr = el.querySelector('#sel-suppr'); if (suppr) suppr.onclick = () => confirmer([...sel]);
    el.querySelectorAll('[data-un]').forEach((b) => b.onclick = () => confirmer([cle(affichees[+b.dataset.un])]));

    // Confirmation, puis suppression dans le tableur
    function confirmer(cles) {
      const ens = new Set(cles), n = cles.length;
      let texte, payload, garder = () => true, garderJeu = () => true;
      if (o === 'eleves') {
        const choisis = lignes.filter((e) => ens.has(e.cle)), ns = donneesProf.filter((l) => ens.has(l.cleEleve)).length, nj = donneesJeu.filter((l) => ens.has(l.cleEleve)).length;
        texte = 'Supprimer ' + (n === 1 ? choisis[0].prenom + ' (' + choisis[0].classe + ')' : n + ' élèves') + ', avec ' + ns + (ns > 1 ? ' séries' : ' série') + (nj ? ' et ' + nj + (nj > 1 ? ' scores' : ' score') + ' du jeu' : '') + ' ?';
        payload = { eleves: choisis.map((e) => ({ prenom: e.prenom, classe: e.classe })) };
        garder = (l) => !ens.has(l.cleEleve); garderJeu = garder;
        flash = (n === 1 ? 'Élève supprimé : ' + choisis[0].prenom + ' (' + choisis[0].classe + ').' : n + ' élèves supprimés.') + ' ' + ns + (ns > 1 ? ' séries' : ' série') + (nj ? ' et ' + nj + (nj > 1 ? ' scores' : ' score') + ' du jeu' : '') + ' effacé' + (ns + nj > 1 ? 's' : '') + '.';
      } else if (o === 'series') {
        texte = 'Supprimer ' + (n > 1 ? 'ces ' + n + ' séries' : 'cette série') + ' ?';
        payload = { ids: cles }; garder = (l) => !ens.has(l.id);
        flash = n > 1 ? n + ' séries supprimées.' : 'Série supprimée.';
      } else {
        texte = 'Supprimer ' + (n > 1 ? 'ces ' + n + ' scores' : 'ce score') + ' du jeu ?';
        payload = { ids: cles, feuille: 'jeu' }; garderJeu = (l) => !ens.has(l.id);
        flash = n > 1 ? n + ' scores du jeu supprimés.' : 'Score du jeu supprimé.';
      }
      const msg = flash; flash = '';
      const barre = el.querySelector('#barre-sel');
      barre.classList.add('confirm-zone');
      barre.innerHTML = '<strong>' + esc(texte) + ' C’est définitif.</strong><button class="btn danger-plein" id="ok-suppr">Oui, supprimer</button><button class="btn btn-ghost" id="non-suppr">Annuler</button>';
      barre.scrollIntoView({ block: 'nearest' });
      barre.querySelector('#non-suppr').onclick = () => tableaux(el);
      barre.querySelector('#ok-suppr').onclick = async (ev) => {
        ev.target.disabled = true; ev.target.textContent = 'Suppression…';
        try {
          const j = await supprimerDistant(payload);
          if (!j.ok) throw new Error(j.erreur === 'cle' ? 'Code professeur refusé.' : (j.erreur || 'erreur'));
          donneesProf = donneesProf.filter(garder); donneesJeu = donneesJeu.filter(garderJeu);
          cles.forEach((k) => sel.delete(k));
          flash = msg; tableaux(el);
        } catch (err) {
          barre.innerHTML = '<span class="msg-err">Suppression impossible : ' + esc(err.message) + '</span><button class="btn btn-ghost" id="non-suppr">Fermer</button>';
          barre.querySelector('#non-suppr').onclick = () => tableaux(el);
        }
      };
    }
  }

  /* =====================================================================
     JEU « PLUIE DE NOMBRES »
     Une partie est gagnée à chaque série terminée (3 en réserve au maximum).
     ===================================================================== */
  const JEU = { nom: 'Au tableau !', viesBase: 3, maxBonus: 3, seuilExpert: 300 };
  const idEleve = () => { const m = getMoi(); return m ? (m.classe + '|' + m.prenom).toLowerCase() : 'anonyme'; };
  // Vies bonus : +1 par série terminée avec 8/10 ou plus, 3 au maximum, toutes utilisées à la partie suivante.
  const viesBonus = () => store.get('viesbonus:' + idEleve(), 0);
  const setViesBonus = (n) => store.set('viesbonus:' + idEleve(), Math.max(0, Math.min(JEU.maxBonus, n)));
  const txtVies = (b) => JEU.viesBase + ' vies' + (b ? ' + ' + b + (b > 1 ? ' vies bonus' : ' vie bonus') : '');
  const record = (mode) => store.get('record:' + mode + ':' + idEleve(), 0);
  const expertDebloque = () => record('normal') >= JEU.seuilExpert;
  const pastilles = (n) => '<span class="pastilles" aria-label="' + n + (n > 1 ? ' vies bonus' : ' vie bonus') + ' sur ' + JEU.maxBonus + '">' +
    [0, 1, 2].map((i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</span>';
  const ICONE_JEU = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="1" y="1" width="46" height="46" rx="8" fill="#26453a"/><rect x="1" y="40" width="46" height="7" fill="#8a5a33"/>' +
    '<text x="12" y="18" class="ij-n">7</text><text x="29" y="27" class="ij-n ij-d">2,5</text><rect x="15" y="30" width="18" height="9" rx="3" fill="#f4f1e4"/><rect x="15" y="30" width="5" height="9" rx="2" fill="#f2c94c"/></svg>';

  function carteJeu() {
    const b = viesBonus();
    return '<a class="card jeu-carte" href="#jeu"><span class="jeu-icone">' + ICONE_JEU + '</span><span class="jeu-txt"><strong>' + JEU.nom + '</strong>' +
      '<span>' + txtVies(b) + (b < JEU.maxBonus ? ' · Une série à 8/10 ou plus = +1 vie bonus' : ' · Réserve de vies bonus pleine !') + '</span></span>' + pastilles(b) + '</a>';
  }

  function vueJeu() {
    const moi = getMoi();
    if (!moi) { location.hash = ''; return; }
    const b = viesBonus(), exp = expertDebloque();
    app.innerHTML = '<div class="wrap jeu-page"><a class="btn btn-ghost back" href="#">← Retour aux exerciseurs</a>' +
      '<div class="thead"><span class="eyebrow">Jeu</span><h1>' + JEU.nom + '</h1>' +
      '<p>Déplace ta craie avec les flèches ◀ ▶ (ou celles du clavier). <strong>Attrape les nombres entiers</strong>, évite les nombres décimaux. Les nombres tombent de plus en plus vite, et tu as 3 vies, plus tes vies bonus.</p>' +
      '<p>Les <strong>calculs encadrés en jaune</strong> rapportent +30 si leur résultat est un entier. <strong>5 bonnes prises d’affilée</strong> : combo, +20.</p>' +
      '<p><strong>Ta craie s’use</strong> : chaque bonne prise la recharge. Si elle est vide, tu perds une vie. Impossible de gagner en restant sur le côté !</p>' +
      '<p>Régulièrement, un <strong>bonus</strong> change la règle (que des calculs, nombres pairs, multiples de 9, règle inversée…) et <strong>double les points</strong>. Sans faute, le bonus est <strong>prolongé</strong> (jusqu’à 1 minute). Tout bon : +50. La règle s’affiche en grand avant de commencer ; touche l’écran quand tu l’as lue.</p></div>' +
      '<div class="card jeu-panneau"><div class="jeu-ligne"><span>Vies pour ta prochaine partie : <strong>' + txtVies(b) + '</strong></span>' + pastilles(b) + '</div>' +
      '<div class="jeu-ligne"><span>Ton record</span><strong>' + record('normal') + ' pts</strong></div>' +
      (exp ? '<div class="jeu-ligne"><span>Ton record en mode expert</span><strong>' + record('expert') + ' pts</strong></div>' : '') +
      '<div class="btn-row"><button class="btn btn-primary" id="j-normal">Jouer</button>' +
      '<button class="btn" id="j-expert"' + (exp ? '' : ' disabled') + '>Mode expert</button></div>' +
      '<p class="jeu-note">Chaque série d’exercices terminée avec 8/10 ou plus te donne une vie bonus (' + JEU.maxBonus + ' au maximum), utilisée à ta prochaine partie.</p>' +
      '<p class="jeu-note">' + (exp ? 'Mode expert : la règle change toutes les 15 secondes (nombres premiers, multiples de 3, de 5 ou de 10).'
        : 'Le mode expert se débloque à ' + JEU.seuilExpert + ' points en mode normal.') + '</p></div>' +
      '<section id="podiums" class="podiums"></section></div>';
    const b1 = app.querySelector('#j-normal'), b2 = app.querySelector('#j-expert');
    b1.onclick = () => jouer('normal');
    b2.onclick = () => jouer('expert');
    afficherPodiums(app.querySelector('#podiums'));
  }

  async function afficherPodiums(el) {
    if (!el) return;
    if (!C.urlScript) { el.innerHTML = '<p class="jeu-note">Le classement s’affichera quand le site sera relié au tableur du professeur.</p>'; return; }
    el.innerHTML = '<p class="jeu-note">Chargement du classement…</p>';
    const moi = getMoi();
    try {
      const rep = await fetch(C.urlScript + '?action=classement&classe=' + encodeURIComponent(moi.classe));
      const d = await rep.json();
      if (!d.ok) throw new Error();
      const pod = (liste, avecClasse) => (liste.length ? '<ol class="podium">' + liste.map((l, i) => '<li class="p' + (i + 1) + '"><span class="rang">' + (i + 1) + '</span><span class="nom">' + esc(l.prenom) +
        (avecClasse ? ' <small>' + esc(l.classe) + '</small>' : '') + '</span><b>' + l.score + '</b></li>').join('') + '</ol>' : '<p class="jeu-note">Personne pour l’instant : à toi de jouer !</p>');
      const bloc = (titre, data, avecClasse) => '<div class="card podium-bloc"><h2>' + titre + '</h2><h3>Mode normal</h3>' + pod(data.normal, avecClasse) +
        (data.expert.length ? '<h3>Mode expert</h3>' + pod(data.expert, avecClasse) : '') + '</div>';
      el.innerHTML = bloc('Ta classe · ' + esc(moi.classe), d.classe, false) + bloc('Tout le collège', d.tous, true);
    } catch (e) {
      el.innerHTML = '<p class="jeu-note">Classement indisponible pour le moment (pas de connexion ?).</p>';
    }
  }

  // ---------- Générateurs de nombres qui tombent ----------
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const estPremier = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  const ecrire = (x) => String(x).replace('.', ',').replace('-', M);
  const REGLES = {
    base: { bandeau: 'Attrape les entiers, évite les décimaux', pts: 10,
      gen() {
        if (Math.random() < 0.55) { const n = Math.random() < 0.15 ? -rint(1, 20) : rint(0, 99); return { txt: ecrire(n), bon: true }; }
        const ent = rint(0, 49), dec = Math.random() < 0.6 ? rint(1, 9) / 10 : rint(1, 99) / 100, x = Math.round((ent + dec) * 100) / 100;
        return { txt: ecrire(Math.random() < 0.15 ? -x : x), bon: Number.isInteger(x) };
      } },
    fractions: { bandeau: 'BONUS : attrape les fractions dont le quotient est un entier', pts: 20, bonus: true,
      gen() {
        const b = rint(2, 9);
        if (Math.random() < 0.5) return { frac: [b * rint(1, 9), b], bon: true };
        let a; do { a = rint(1, 9 * b); } while (a % b === 0);
        return { frac: [a, b], bon: false };
      } },
    multiples5: { bandeau: 'BONUS : attrape les multiples de 5', pts: 20, bonus: true,
      gen() { const n = Math.random() < 0.45 ? 5 * rint(1, 20) : (() => { let x; do { x = rint(1, 100); } while (x % 5 === 0); return x; })(); return { txt: String(n), bon: n % 5 === 0 }; } },
    premiers: { bandeau: 'Attrape les nombres premiers', pts: 20,
      gen() { let n; const veut = Math.random() < 0.45; do { n = rint(2, 100); } while (estPremier(n) !== veut); return { txt: String(n), bon: veut }; } },
    multiples3: { bandeau: 'Attrape les multiples de 3', pts: 20,
      gen() { let n; const veut = Math.random() < 0.45; do { n = rint(2, 100); } while ((n % 3 === 0) !== veut); return { txt: String(n), bon: veut }; } },
    multiples5e: { bandeau: 'Attrape les multiples de 5', pts: 20,
      gen() { let n; const veut = Math.random() < 0.45; do { n = rint(2, 100); } while ((n % 5 === 0) !== veut); return { txt: String(n), bon: veut }; } },
    multiples10: { bandeau: 'Attrape les multiples de 10', pts: 20,
      gen() { let n; const veut = Math.random() < 0.45; do { n = rint(2, 120); } while ((n % 10 === 0) !== veut); return { txt: String(n), bon: veut }; } }
  };
  // Règles qui servent à la fois de bonus (mode normal, points doublés) et de règle du mode expert (clé + 'E')
  const tirer = (test, min, max) => { let n; const veut = Math.random() < 0.45; do { n = rint(min, max); } while (test(n) !== veut); return { txt: String(n), bon: veut }; };
  const NOUVELLES = {
    pairs: ['attrape les nombres pairs', () => tirer((n) => n % 2 === 0, 1, 99)],
    impairs: ['attrape les nombres impairs', () => tirer((n) => n % 2 === 1, 1, 99)],
    multiples3b: ['attrape les multiples de 3', () => tirer((n) => n % 3 === 0, 2, 99)],
    multiples9: ['attrape les multiples de 9', () => tirer((n) => n % 9 === 0, 2, 120)],
    sup50: ['attrape les nombres plus grands que 50', () => {
      if (Math.random() < 0.35) { const p = Math.random() < 0.5 ? 10 : 100, x = Math.round((49 + Math.random() * 2) * p) / p; const y = x === 50 ? 50.1 : x; return { txt: ecrire(y), bon: y > 50 }; }
      const n = rint(20, 80); return { txt: String(n), bon: n > 50 };
    }],
    inverse: ['règle inversée ! Attrape les décimaux, évite les entiers', () => { const g = REGLES.base.gen(); return { txt: g.txt, bon: !g.bon }; }],
    calculs: ['que des calculs ! Attrape ceux dont le résultat est un entier', () => genCalcul()]
  };
  Object.keys(NOUVELLES).forEach((k) => {
    const [txt, gen] = NOUVELLES[k];
    REGLES[k] = { bandeau: 'BONUS : ' + txt, pts: 20, bonus: true, gen };
    REGLES[k + 'E'] = { bandeau: txt.charAt(0).toUpperCase() + txt.slice(1), pts: 20, gen };
  });
  // Bonus du mode normal : de plus en plus variés au fil de la partie (secondes de jeu → bonus possibles)
  // (« que des calculs » revient un bonus sur deux, en alternance avec ceux-ci)
  const BONUS_PAR_TEMPS = [[0, ['pairs', 'impairs', 'multiples5', 'sup50']], [60, ['fractions', 'multiples3b']], [100, ['multiples9', 'inverse']]];

  // Tuile « calcul » : petit calcul avec des décimaux, résultat entier une fois sur deux.
  function genCalcul() {
    const entier = Math.random() < 0.5, op = pick3(['+', '−', '×']);
    const dec = (x) => ecrire(Math.round(x * 100) / 100);
    if (op === '+') {
      const d1 = rint(1, 9), a = rint(0, 6) + d1 / 10;
      let d2 = 10 - d1; if (!entier) { do { d2 = rint(1, 9); } while (d2 === 10 - d1); }
      const b = rint(0, 4) + d2 / 10;
      return { calc: dec(a) + ' + ' + dec(b), bon: (d1 + d2) % 10 === 0 };
    }
    if (op === '−') {
      const d1 = rint(1, 9), a = rint(2, 9) + d1 / 10;
      let d2 = d1; if (!entier) { do { d2 = rint(1, 9); } while (d2 === d1); }
      const b = rint(0, Math.floor(a) - 1) + d2 / 10;
      return { calc: dec(a) + ' − ' + dec(b), bon: d1 === d2 };
    }
    const paires = entier ? [[0.5, 2], [0.5, 4], [2.5, 2], [2.5, 4], [1.5, 2], [1.25, 4], [0.25, 4], [3.5, 2], [0.2, 5], [0.4, 5], [1.2, 5], [0.6, 5], [4.5, 2], [0.75, 4]]
      : [[1.2, 2], [0.3, 3], [2.5, 3], [1.5, 3], [0.7, 2], [1.25, 2], [0.4, 3], [0.6, 4], [3.5, 3], [0.25, 3], [1.1, 4]];
    const [x, k] = paires[rint(0, paires.length - 1)];
    return { calc: Math.random() < 0.5 ? dec(x) + ' × ' + k : k + ' × ' + dec(x), bon: entier };
  }
  const pick3 = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function jouer(mode) {
    if (mode === 'expert' && !expertDebloque()) return vueJeu();
    const bonusUtilises = viesBonus();
    setViesBonus(0);
    document.body.classList.add('en-jeu');
    app.innerHTML = '<div class="jeu-play">' +
      '<div class="bar"><button class="iconbtn" id="j-quit" aria-label="Arrêter la partie">✕</button><span class="vies" id="vies"></span>' +
      '<span class="craie-jauge" id="craie" title="Ta craie s’use : attrape des bons nombres pour la recharger"><span>Craie</span><b><i></i></b></span><span class="combo" id="combo" aria-label="Combo"><i></i><i></i><i></i><i></i><i></i></span><span class="jeu-score" id="jscore">0</span></div>' +
      '<div class="jeu-bandeau" id="bandeau"><span id="bandeau-txt"></span><i id="bandeau-temps"></i></div>' +
      '<div class="jeu-cadre" id="cadre"><canvas id="cv"></canvas></div>' +
      '<div class="jeu-ctrl"><button class="key" id="j-g" aria-label="Aller à gauche">◀</button><button class="key" id="j-d" aria-label="Aller à droite">▶</button></div></div>';
    const cv = app.querySelector('#cv'), cx = cv.getContext('2d'), cadre = app.querySelector('#cadre');
    // Couleurs du tableau (fixes : le tableau reste vert en mode clair comme en mode sombre)
    const T = { fond: '#26453a', craie: '#f4f1e4', jaune: '#f2c94c', bleu: '#8fd3f4', vert: '#9be38f', rouge: '#ff8a80', bois: '#8a5a33', boisClair: '#a87447', ombre: 'rgba(0,0,0,.25)' };
    const POLICE = '"Chalkboard SE", "Segoe Print", "Comic Sans MS", "Comic Neue", "Marker Felt", system-ui, sans-serif';
    let W = 0, H = 0, dpr = 1, poussiere = [];
    const FORMULES = ['a² + b² = c²', 'π ≈ 3,14', '(x + 3)(x − 3)', 'v = d ÷ t', '2/3 + 1/6', '17 × 3 = 51', '√49 = 7', 'x = −2'];
    let fondPos = [];
    function taille() {
      dpr = window.devicePixelRatio || 1;
      W = cadre.clientWidth; H = cadre.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      poussiere = Array.from({ length: Math.round(W * H / 900) }, () => [Math.random() * W, Math.random() * H, Math.random() * 1.2 + 0.3]);
      fondPos = FORMULES.map((f, i) => [f, 14 + ((i * 97) % Math.max(60, W - 150)), 60 + ((i * 131) % Math.max(80, H - 160)), (i % 3 - 1) * 0.06]);
    }
    taille();
    const echelle = () => Math.max(0.8, Math.min(1.3, H / 560));
    const REBORD = 18;
    const J = { x: W / 2, w: Math.max(84, W * 0.24), h: 36 };
    const viesDepart = JEU.viesBase + bonusUtilises;
    let items = [], effets = [], t = 0, tJeu = 0, score = 0, vies = viesDepart, prochain = 0.6, fini = false, raf = 0, dernier = performance.now();
    let gauche = false, droite = false, cible = null, regle = 'base', finPhase = 0, combo = 0;
    // Annonce d'une règle : texte en gros, puis 3, 2, 1. Pendant l'annonce, rien ne tombe et le temps de jeu est arrêté.
    // 3 s pour lire la règle (on peut toucher l'écran pour passer), puis 3, 2, 1. Retour à la règle normale : plus court.
    const LECTURE = 3, DECOMPTE = 3, LECTURE_RETOUR = 1.5, DECOMPTE_RETOUR = 1.5;
    let decompte = DECOMPTE, annonce = LECTURE + DECOMPTE, premiere = true, bilanBonus = '';
    // Mode normal : bonus de 20 s au moins, prolongé tant que l'élève ne se trompe pas (60 s au plus), puis 15 s de règle normale.
    // Un bonus sur deux est « que des calculs ». Premier bonus à 20 s. Mode expert : règle changée toutes les 15 s.
    const DUREE_BONUS = 20, PLAFOND_BONUS = 60, ENTRE_BONUS = 15;
    let nBonus = 0, debutBonus = 0, erreurBonus = false, prolongation = false;
    const ordreExpert = ['premiers', 'multiples3', 'multiples5e', 'multiples10', 'multiples9E', 'sup50E', 'inverseE', 'calculsE'].sort(() => Math.random() - 0.5);
    let iExpert = 0, prochainBonus = 20, dernierBonus = '';
    const choisirBonus = () => {
      nBonus++;
      if (nBonus % 2 === 0) return 'calculs';
      const pool = BONUS_PAR_TEMPS.filter(([t0]) => tJeu >= t0).flatMap(([, l]) => l).filter((k) => k !== dernierBonus);
      dernierBonus = pool[Math.floor(Math.random() * pool.length)]; return dernierBonus;
    };
    // Craie : elle s'use avec le temps et se recharge à chaque bonne prise. Vide → une vie perdue.
    const USURE = 1 / 16, RECHARGE = 0.3;
    let craie = 1, bonusPris = 0, bonusVus = 0;
    if (mode === 'expert') { regle = ordreExpert[0]; finPhase = 15; }
    const majBandeau = () => {
      const R = REGLES[regle];
      app.querySelector('#bandeau-txt').textContent = R.bandeau + ' (+' + (R.bonus ? 2 * R.pts + ', points doublés' : R.pts) + ')';
      app.querySelector('#bandeau').className = 'jeu-bandeau' + (R.bonus ? ' bonus' : '') + (mode === 'expert' ? ' expert' : '');
    };
    const majVies = () => { app.querySelector('#vies').innerHTML = Array.from({ length: viesDepart }, (_, i) => '<i class="' + (i < vies ? 'on' : '') + (i >= JEU.viesBase ? ' bonus' : '') + '"></i>').join(''); };
    const majCombo = () => { app.querySelectorAll('#combo i').forEach((el, i) => el.classList.toggle('on', i < combo % 5)); };
    majBandeau(); majVies(); majCombo();
    const changerRegle = (r, duree) => {
      if (enBonus() && mode === 'normal') {
        bilanBonus = 'Bonus : ' + bonusPris + ' attrapé' + (bonusPris > 1 ? 's' : '') + ' sur ' + bonusVus;
        if (bonusVus >= 3 && bonusPris === bonusVus) { score += 50; bilanBonus += ' · Parfait ! +50'; app.querySelector('#jscore').textContent = score; }
      } else bilanBonus = '';
      bonusPris = 0; bonusVus = 0; erreurBonus = false; prolongation = false; debutBonus = tJeu;
      if (r === 'base' && mode === 'normal') prochainBonus = tJeu + ENTRE_BONUS;
      regle = r; finPhase = tJeu + duree; items = [];
      const retour = r === 'base' && mode === 'normal';
      decompte = retour ? DECOMPTE_RETOUR : DECOMPTE; annonce = (retour ? LECTURE_RETOUR : LECTURE) + decompte; majBandeau();
    };
    const passerLecture = () => { if (annonce > decompte) annonce = decompte; };
    const majCraie = () => { const el = app.querySelector('#craie i'); if (!el) return; el.style.width = Math.round(craie * 100) + '%'; app.querySelector('#craie').classList.toggle('bas', craie < 0.3); };
    majCraie();
    const enBonus = () => !!REGLES[regle].bonus;

    function apparaitre() {
      let g = REGLES[regle].gen(), pts = REGLES[regle].pts, calcul = false;
      if (regle === 'base' && mode === 'normal' && Math.random() < 1 / 5) { g = genCalcul(); pts = 30; calcul = true; }
      if (g.calc) calcul = true;
      const taillePolice = Math.round((calcul ? 22 : 30) * echelle());
      cx.font = '700 ' + taillePolice + 'px ' + POLICE;
      const txt = g.calc || g.txt;
      const lw = g.frac ? Math.max(cx.measureText(String(g.frac[0])).width, cx.measureText(String(g.frac[1])).width) : cx.measureText(txt).width;
      const w = lw + (calcul ? 28 : 16) * echelle(), h = (g.frac ? 70 : calcul ? 46 : 40) * echelle();
      // Toujours un passage libre plus large que la gomme entre les mauvais nombres de la moitié haute du tableau
      const passageLibre = (x) => {
        if (g.bon) return true;
        const iv = items.filter((it) => !it.bon && it.y < H * 0.6).map((it) => [it.x - it.w / 2, it.x + it.w / 2]).concat([[x - w / 2, x + w / 2]]).sort((a, b) => a[0] - b[0]);
        let bord = 0;
        for (const [a, b] of iv) { if (a - bord >= J.w * 1.25) return true; bord = Math.max(bord, b); }
        return W - bord >= J.w * 1.25;
      };
      let x, essais = 0, ok = false;
      do {
        x = w / 2 + 6 + Math.random() * Math.max(1, W - w - 12); essais++;
        ok = passageLibre(x) && !items.some((it) => it.y < h * 1.5 && Math.abs(it.x - x) < (it.w + w) / 2 + 6);
      } while (essais < 12 && !ok);
      if (!passageLibre(x)) return false; // pas de place : on réessaie un peu plus tard
      items.push(Object.assign(g, { txt, x, y: -h / 2, w, h, pts, calcul, taillePolice, angle: (Math.random() - 0.5) * 0.12 }));
    }
    function ecrireCraie(texte, x, y, taillePx, couleur) {
      cx.font = '700 ' + taillePx + 'px ' + POLICE; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillStyle = couleur; cx.globalAlpha = 0.95; cx.fillText(texte, x, y);
      cx.globalAlpha = 0.25; cx.fillText(texte, x + 0.8, y + 0.6); cx.globalAlpha = 1;
    }
    function nombre(it) {
      cx.save(); cx.translate(it.x, it.y); cx.rotate(it.angle);
      if (it.calcul) {
        cx.strokeStyle = T.jaune; cx.lineWidth = 2.5; cx.setLineDash([7, 4]);
        cx.beginPath(); cx.roundRect ? cx.roundRect(-it.w / 2, -it.h / 2, it.w, it.h, 10) : cx.rect(-it.w / 2, -it.h / 2, it.w, it.h); cx.stroke(); cx.setLineDash([]);
        ecrireCraie(it.txt, 0, 1, it.taillePolice, T.jaune);
      } else if (it.frac) {
        ecrireCraie(String(it.frac[0]), 0, -it.h * 0.24, it.taillePolice, T.craie);
        cx.fillStyle = T.craie; cx.fillRect(-it.w / 2 + 6, -1.5, it.w - 12, 3);
        ecrireCraie(String(it.frac[1]), 0, it.h * 0.26, it.taillePolice, T.craie);
      } else ecrireCraie(it.txt, 0, 1, it.taillePolice, T.craie);
      cx.restore();
    }
    function personnage() {
      const y = H - REBORD - J.h, x = J.x - J.w / 2, r = 12;
      cx.fillStyle = T.ombre; cx.beginPath(); cx.ellipse(J.x, H - REBORD + 2, J.w / 2, 5, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = T.craie; cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, J.w, J.h, r) : cx.rect(x, y, J.w, J.h); cx.fill();
      cx.fillStyle = T.jaune; cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, J.w * 0.22, J.h, [r, 4, 4, r]) : cx.rect(x, y, J.w * 0.22, J.h); cx.fill();
      // visage : il regarde dans la direction du mouvement
      const dir = gauche ? -1 : droite ? 1 : 0, ex = J.x + J.w * 0.12 + dir * 3, ey = y + J.h * 0.42;
      cx.fillStyle = T.fond; cx.beginPath(); cx.arc(ex - 9, ey, 4.5, 0, 7); cx.arc(ex + 9, ey, 4.5, 0, 7); cx.fill();
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(ex - 8 + dir, ey - 1.5, 1.6, 0, 7); cx.arc(ex + 10 + dir, ey - 1.5, 1.6, 0, 7); cx.fill();
      cx.strokeStyle = T.fond; cx.lineWidth = 2.5; cx.lineCap = 'round'; cx.beginPath();
      if (effetVisage > 0 && visage === 'triste') cx.arc(ex, ey + 13, 6, Math.PI * 1.15, Math.PI * 1.85); else cx.arc(ex, ey + 4, 7, Math.PI * 0.2, Math.PI * 0.8);
      cx.stroke();
    }
    let visage = 'content', effetVisage = 0;
    function dessiner() {
      cx.fillStyle = T.fond; cx.fillRect(0, 0, W, H);
      cx.fillStyle = '#ffffff';
      poussiere.forEach(([x, y, r]) => { cx.globalAlpha = 0.08; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); });
      cx.globalAlpha = 1;
      fondPos.forEach(([f, x, y, a]) => { cx.save(); cx.translate(x, y); cx.rotate(a); cx.globalAlpha = 0.13; cx.fillStyle = T.craie; cx.font = '600 ' + Math.round(16 * echelle()) + 'px ' + POLICE; cx.textAlign = 'left'; cx.fillText(f, 0, 0); cx.restore(); });
      cx.globalAlpha = 1;
      items.forEach(nombre);
      // rebord en bois, avec un morceau de craie et une éponge
      cx.fillStyle = T.bois; cx.fillRect(0, H - REBORD, W, REBORD);
      cx.fillStyle = T.boisClair; cx.fillRect(0, H - REBORD, W, 3);
      personnage();
      effets.forEach((e) => {
        cx.globalAlpha = Math.max(0, Math.min(1, e.v)); const k = e.gros ? 1 + (1 - e.v) * 0.3 : 1;
        ecrireCraie(e.txt, e.x, e.y, Math.round((e.gros ? 40 : 22) * echelle() * k), e.c); cx.globalAlpha = 1;
      });
      if (annonce > 0) {
        cx.fillStyle = 'rgba(15, 30, 24, .78)'; cx.fillRect(0, 0, W, H);
        const R = REGLES[regle], titre = premiere ? (mode === 'expert' ? 'Mode expert' : 'C’est parti !') : R.bonus ? 'BONUS ×2 !' : mode === 'expert' ? 'Nouvelle règle !' : 'Retour à la règle normale';
        if (bilanBonus) ecrireCraie(bilanBonus, W / 2, H * 0.13, Math.round(20 * echelle()), T.vert);
        ecrireCraie(titre, W / 2, H * 0.24, Math.round(28 * echelle()), R.bonus ? T.jaune : T.bleu);
        // règle en gros, sur plusieurs lignes si besoin
        const regleTxt = R.bandeau.replace(/^BONUS : /, ''), tp = Math.round(30 * echelle());
        cx.font = '700 ' + tp + 'px ' + POLICE;
        const mots = regleTxt.split(' '), lignes = []; let l = '';
        mots.forEach((m) => { const essai = l ? l + ' ' + m : m; if (cx.measureText(essai).width > W * 0.86 && l) { lignes.push(l); l = m; } else l = essai; });
        lignes.push(l);
        lignes.forEach((li, i) => ecrireCraie(li, W / 2, H * 0.38 + i * tp * 1.25, tp, T.craie));
        ecrireCraie('+' + (R.bonus ? 2 * R.pts : R.pts) + ' par bonne prise', W / 2, H * 0.38 + lignes.length * tp * 1.25 + 10, Math.round(18 * echelle()), T.vert);
        if (annonce <= decompte) {
          const n = Math.ceil(annonce / (decompte / 3));
          ecrireCraie(String(n), W / 2, H * 0.74, Math.round(64 * echelle()), T.jaune);
        } else ecrireCraie('Touche l’écran quand tu as lu', W / 2, H * 0.9, Math.round(15 * echelle()), T.bleu);
      }
    }
    function etape(now) {
      if (fini) return;
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now; t += dt;
      if (effetVisage > 0) effetVisage -= dt;
      if (annonce > 0) annonce -= dt; else { tJeu += dt; premiere = false; }
      // phases (le temps des annonces n'est pas compté)
      if (annonce <= 0) {
        if (mode === 'expert' && tJeu >= finPhase) { iExpert = (iExpert + 1) % ordreExpert.length; changerRegle(ordreExpert[iExpert], 15); }
        if (mode === 'normal') {
          if (regle === 'base' && tJeu >= prochainBonus) changerRegle(choisirBonus(), DUREE_BONUS);
          else if (regle !== 'base') {
            const fin = tJeu - debutBonus >= PLAFOND_BONUS || (tJeu >= finPhase && erreurBonus);
            if (fin) changerRegle('base', 0);
            else if (tJeu >= finPhase && !prolongation) {
              prolongation = true;
              effets.push({ txt: 'Prolongation !', x: W / 2, y: H * 0.4, c: T.jaune, v: 1.6, gros: true });
              app.querySelector('#bandeau-txt').textContent = REGLES[regle].bandeau.replace(/^BONUS : /, 'Sans faute, le bonus continue : ') + ' (+' + 2 * REGLES[regle].pts + ')';
            }
          }
        }
      }
      const reste = prolongation ? Math.max(0, debutBonus + PLAFOND_BONUS - tJeu) / (PLAFOND_BONUS - DUREE_BONUS)
        : enBonus() || mode === 'expert' ? Math.max(0, finPhase - tJeu) / (mode === 'expert' ? 15 : DUREE_BONUS) : 0;
      app.querySelector('#bandeau-temps').style.width = (reste * 100) + '%';
      // déplacement du personnage
      const vJ = W * 1.15;
      if (gauche) J.x -= vJ * dt; if (droite) J.x += vJ * dt;
      if (cible != null && !gauche && !droite) { const d = cible - J.x; J.x += Math.sign(d) * Math.min(Math.abs(d), vJ * dt); }
      J.x = Math.max(J.w / 2, Math.min(W - J.w / 2, J.x));
      // pluie : accélération douce (vitesse maximale vers 3 minutes), plus lente pendant les bonus
      const lent = enBonus() ? 0.85 : 1;
      // usure de la craie (pas pendant les annonces)
      if (annonce <= 0) {
        craie -= USURE * dt;
        if (craie <= 0) {
          craie = 1; vies--; combo = 0; majVies(); majCombo(); visage = 'triste'; effetVisage = 0.8;
          effets.push({ txt: 'Craie usée ! −1 vie', x: W / 2, y: H * 0.45, c: T.rouge, v: 1.6, gros: true });
          cadre.classList.remove('choc'); void cadre.offsetWidth; cadre.classList.add('choc');
        }
        majCraie();
      }
      const vitesse = Math.min(400, 110 + 1.6 * tJeu) * echelle() * lent;
      if (annonce <= 0) { prochain -= dt; if (prochain <= 0) { prochain = apparaitre() === false ? 0.3 : Math.max(0.5, 1.2 - tJeu * 0.004) / lent; } }
      const py = H - REBORD - J.h;
      items.forEach((it) => { it.y += vitesse * (it.calcul ? 0.7 : 1) * dt; });
      items = items.filter((it) => {
        if (it.y + it.h / 2 >= py && it.y - it.h / 2 <= py + J.h && Math.abs(it.x - J.x) < (J.w + it.w) / 2 * 0.9) {
          if (it.bon) {
            const gain = enBonus() ? 2 * it.pts : it.pts;
            score += gain; combo++; craie = Math.min(1, craie + RECHARGE);
            if (enBonus()) { bonusPris++; bonusVus++; }
            effets.push({ txt: '+' + gain, x: it.x, y: py - 12, c: T.vert, v: 1 });
            if (combo % 5 === 0) { score += 20; effets.push({ txt: 'Combo ! +20', x: W / 2, y: H * 0.42, c: T.jaune, v: 1.4, gros: true }); }
          } else {
            vies--; combo = 0; majVies(); visage = 'triste'; effetVisage = 0.8;
            if (enBonus()) erreurBonus = true; // pendant la prolongation, la première erreur termine le bonus
            effets.push({ txt: it.calcul ? 'Pas entier !' : 'Raté !', x: it.x, y: py - 12, c: T.rouge, v: 1 });
            cadre.classList.remove('choc'); void cadre.offsetWidth; cadre.classList.add('choc');
          }
          majCombo(); app.querySelector('#jscore').textContent = score;
          return false;
        }
        const dedans = it.y - it.h / 2 < H;
        if (!dedans && it.bon && enBonus()) bonusVus++; // bon nombre laissé passer pendant un bonus
        return dedans;
      });
      effets.forEach((e) => { e.y -= (e.gros ? 15 : 40) * dt; e.v -= dt * 1.1; }); effets = effets.filter((e) => e.v > 0);
      dessiner();
      if (vies <= 0) return finJeu();
      raf = requestAnimationFrame(etape);
    }
    // commandes : flèches du clavier, flèches tactiles (maintenir), ou glisser le doigt sur le tableau
    const kd = (e) => { if ((e.key === ' ' || e.key === 'Enter') && annonce > decompte) { passerLecture(); e.preventDefault(); } if (e.key === 'ArrowLeft') { gauche = true; e.preventDefault(); } if (e.key === 'ArrowRight') { droite = true; e.preventDefault(); } };
    const ku = (e) => { if (e.key === 'ArrowLeft') gauche = false; if (e.key === 'ArrowRight') droite = false; };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    const tenir = (btn, sens) => {
      const on = (e) => { e.preventDefault(); if (sens < 0) gauche = true; else droite = true; };
      const off = () => { if (sens < 0) gauche = false; else droite = false; };
      btn.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, off));
    };
    tenir(app.querySelector('#j-g'), -1); tenir(app.querySelector('#j-d'), 1);
    cv.addEventListener('pointerdown', (e) => { if (annonce > decompte) { passerLecture(); return; } cible = e.offsetX; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (cible != null) cible = e.offsetX; });
    ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => { cible = null; }));
    // Le tableau change de taille (bandeau sur deux lignes, rotation de l'écran) : on redimensionne le dessin
    const obs = window.ResizeObserver ? new ResizeObserver(() => { if (cadre.clientHeight !== H || cadre.clientWidth !== W) taille(); }) : null;
    if (obs) obs.observe(cadre); else window.addEventListener('resize', taille);
    const arreter = () => { fini = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); if (obs) obs.disconnect(); else window.removeEventListener('resize', taille); document.body.classList.remove('en-jeu'); window.__jeuStop = null; };
    window.__jeuStop = () => { if (!fini) { arreter(); enregistrer(); } };
    app.querySelector('#j-quit').onclick = () => finJeu();
    window.__gc.jeu = { etat: () => ({ t, tJeu, score, vies, regle, combo, annonce, H, prolongation, items: items.map((i) => ({ bon: i.bon, x: i.x, y: i.y, w: i.w, calcul: i.calcul, txt: i.txt })), J: { x: J.x, w: J.w } }) };

    function enregistrer() {
      const duree = Math.round(t), moi = getMoi(), cleR = 'record:' + mode + ':' + idEleve(), ancien = store.get(cleR, 0);
      if (score > ancien) store.set(cleR, score);
      if (C.urlScript && moi && duree >= 5 && score > 0) {
        const file = store.get('file', []);
        file.push({ type: 'jeu', id: uid(), date: new Date().toISOString(), prenom: moi.prenom, classe: moi.classe, mode, score, duree });
        store.set('file', file);
        return envoyer();
      }
      return Promise.resolve('off');
    }
    function finJeu() {
      if (fini) return;
      const ancien = record(mode);
      arreter();
      const envoi = enregistrer();
      const nouveau = score > ancien, debloque = mode === 'normal' && ancien < JEU.seuilExpert && score >= JEU.seuilExpert;
      app.innerHTML = '<div class="wrap jeu-page"><div class="end"><span class="eyebrow">' + JEU.nom + (mode === 'expert' ? ' · mode expert' : '') + '</span>' +
        '<div class="big">' + score + '<small> pts</small></div><h1>' + (nouveau ? 'Nouveau record !' : 'Partie terminée') + '</h1>' +
        (debloque ? '<p class="send ok">Bravo, tu as débloqué le mode expert !</p>' : '') +
        '<p class="jeu-note" id="j-envoi">' + (C.urlScript ? (Math.round(t) >= 5 && score > 0 ? 'Envoi de ton score au classement…' : '') : '') + '</p>' +
        '<div class="btn-row"><button class="btn btn-primary" id="j-encore">Rejouer</button><a class="btn" href="#">Faire des exercices</a></div>' +
        '<p class="jeu-note">Astuce : une série d’exercices à 8/10 ou plus te donne une vie bonus pour ta prochaine partie.</p>' +
        '<section id="podiums" class="podiums"></section></div></div>';
      const enc = app.querySelector('#j-encore'); if (enc) enc.onclick = () => jouer(mode);
      envoi.then((etat) => {
        const el = document.getElementById('j-envoi'); if (!el || !C.urlScript) return;
        el.textContent = etat === 'ok' ? 'Score envoyé au classement.' : etat === 'off' ? '' : 'Pas de connexion : ton score sera envoyé plus tard.';
        afficherPodiums(document.getElementById('podiums'));
      });
    }
    raf = requestAnimationFrame((n) => { dernier = n; etape(n); });
  }

  /* ---------- Démarrage ---------- */
  window.__gc = Object.assign(window.__gc || {}, { question: () => (S ? S.q : null), lireFacto: (s) => lireFacto(s) }); // aide aux tests automatiques
  route();
  envoyer(); // renvoie les résultats restés en attente (hors connexion)
})();
