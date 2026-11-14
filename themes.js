/* =====================================================================
   Grands Carreaux — banque d'exercices (4e – 3e)
   Chaque thème a 3 niveaux ; chaque niveau a une fonction gen() qui
   fabrique une question aléatoire.
     Question « nombre » : { type:'nombre', enonce, reponse:{n,d}, prefixe,
                             clavier, irreductible, correction }
     Question « expr »   : { type:'expr', nom, enonce, reponse:{clé:coef},
                             reponseHTML, lettres, correction }
     correction : { texte, lignes: [{ m: '…', c?: 'commentaire' }] }
   ===================================================================== */
(function (g) {
  'use strict';

  /* ---------- Outils ---------- */
  const M = '−';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rndNZ = (a, b) => { let x; do { x = rnd(a, b); } while (x === 0); return x; };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const k = gcd(n, d) || 1; return { n: n / k, d: d / k }; };
  const num = (n) => (n < 0 ? M + (-n) : String(n));
  const F = (a, b) => '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>';
  const fracQ = (q) => (q.d === 1 ? num(q.n) : (q.n < 0 ? M : '') + F(Math.abs(q.n), q.d));
  const TROU = '<span class="trou">?</span>';
  const P = (s) => '<span class="paren">(</span>' + s + '<span class="paren">)</span>';
  const NOMS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'P', 'Q', 'R', 'S', 'T'];

  /* ---------- Petite algèbre : un terme = { c: coefficient, m: { lettre: exposant } } ---------- */
  const cle = (m) => Object.keys(m).filter((l) => m[l]).sort().map((l) => l + m[l]).join('');
  const T = (c, m = {}) => ({ c, m });
  const X1 = (c, L) => T(c, { [L]: 1 });
  const X2 = (c, L) => T(c, { [L]: 2 });
  const mulT = (a, b) => { const m = Object.assign({}, a.m); for (const l in b.m) m[l] = (m[l] || 0) + b.m[l]; return T(a.c * b.c, m); };
  const degre = (m) => Object.values(m).reduce((s, e) => s + e, 0);
  function reduire(terms) {
    const map = new Map(), ordre = [];
    terms.forEach((t) => { const k = cle(t.m); if (!map.has(k)) { map.set(k, T(0, t.m)); ordre.push(k); } map.get(k).c += t.c; });
    return ordre.map((k) => map.get(k)).filter((t) => t.c !== 0);
  }
  const canon = (terms) => reduire(terms).sort((a, b) => degre(b.m) - degre(a.m) || cle(a.m).localeCompare(cle(b.m)));
  const polyMap = (terms) => { const o = {}; reduire(terms).forEach((t) => { o[cle(t.m)] = t.c; }); return o; };
  const lettresHTML = (m) => Object.keys(m).filter((l) => m[l]).sort().map((l) => '<i>' + l + '</i>' + (m[l] > 1 ? '<sup>' + m[l] + '</sup>' : '')).join('');
  function fmtT(t, premier) {
    const a = Math.abs(t.c), L = lettresHTML(t.m);
    const corps = L ? (a === 1 ? '' : a) + L : String(a);
    if (premier) return (t.c < 0 ? M : '') + corps;
    return (t.c < 0 ? ' ' + M + ' ' : ' + ') + corps;
  }
  const fmtL = (terms) => (terms.length ? terms.map((t, i) => fmtT(t, i === 0)).join('') : '0');
  const suite = (terms) => terms.map((t) => fmtT(t, false)).join('');        // termes ajoutés à la suite
  const par = (terms) => '(' + fmtL(terms) + ')';
  const fact = (t) => (t.c < 0 ? '(' + fmtT(t, true) + ')' : fmtT(t, true));  // facteur dans un produit
  const neg = (t) => T(-t.c, t.m);
  const abs = (t) => T(Math.abs(t.c), t.m);
  const lettresDe = (terms) => [...new Set(terms.flatMap((t) => Object.keys(t.m).filter((l) => t.m[l])))].sort();
  const premierPositif = (arr) => { shuffle(arr); const i = arr.findIndex((t) => t.c > 0); if (i > 0) arr.unshift(arr.splice(i, 1)[0]); return arr; };
  const ordreHasard = (a, b) => (Math.random() < 0.5 ? [a, b] : [b, a]);

  // Fabrique une question « expression ».
  function exprQ(nom, disp, resultat, lignes, texte, lettres) {
    const c = canon(resultat);
    return {
      type: 'expr', nom, enonce: nom + ' = ' + disp, prefixe: nom + ' = ',
      reponse: polyMap(resultat), reponseHTML: fmtL(c), lettres: lettres,
      correction: { texte, lignes: lignes.map((l, i) => ({ m: (i === 0 ? nom + ' = ' : '= ') + l.m, c: l.c || '' })) }
    };
  }

  /* =====================================================================
     CALCUL LITTÉRAL
     ===================================================================== */

  /* ---------- 1. Simplifier une expression (supprimer les ×) ---------- */
  const LETTRES = ['x', 'y', 'a', 'b', 'z', 't', 'n'];
  function facteurs(pattern, L) {
    return pattern.map((p) => (p === 'k' ? T(rnd(2, 9)) : p === 'L' ? X1(1, L) : p === 'kL' ? X1(rnd(2, 9), L) : X2(rnd(2, 9), L)));
  }
  const PAT1 = [['k', 'L'], ['L', 'k'], ['k', 'L', 'k'], ['L', 'L'], ['k', 'L', 'L'], ['L', 'k', 'L']];
  const PAT2 = [['kL', 'kL'], ['L', 'k', 'L', 'L'], ['kL', 'k', 'L'], ['k', 'L', 'kL'], ['L', 'kL2'], ['kL', 'L', 'k']];
  const produit = (pat, L) => { const f = facteurs(pat, L); return { f, r: f.reduce(mulT, T(1)) }; };
  const dispProd = (f) => f.map(fact).join(' × ');
  function dispRegroupe(f) {
    const nums = f.filter((t) => t.c !== 1).map((t) => String(t.c)), lets = [];
    f.forEach((t) => { Object.keys(t.m).sort().forEach((l) => { for (let i = 0; i < t.m[l]; i++) lets.push('<i>' + l + '</i>'); }); });
    return nums.concat(lets).join(' × ');
  }
  function simplifierQ(prods, lettres) {
    const nom = pick(NOMS);
    const res = prods.map((p) => p.r);
    const d0 = prods.map((p) => dispProd(p.f)).join(' + '), d1 = prods.map((p) => dispRegroupe(p.f)).join(' + ');
    const lignes = [{ m: d0 }];
    if (d1 !== d0) lignes.push({ m: d1, c: 'On regroupe les nombres, puis les lettres.' });
    lignes.push({ m: res.map((t, i) => fmtT(t, i === 0)).join('') });
    return exprQ(nom, d0, res, lignes, 'On multiplie les nombres entre eux. On supprime le signe × devant une lettre, et une lettre multipliée par elle-même s’écrit avec un exposant : a × a = a², a × a × a = a³.', lettres);
  }

  /* ---------- 2. Réduire une expression ---------- */
  function regroupe(terms) {
    const ordre = [], groupes = new Map();
    terms.forEach((t) => { const k = cle(t.m); if (!groupes.has(k)) { groupes.set(k, []); ordre.push(k); } groupes.get(k).push(t); });
    return ordre.map((k, i) => { const gr = groupes.get(k); return gr.length === 1 ? fmtT(gr[0], i === 0) : (i === 0 ? '' : ' + ') + par(gr); }).join('');
  }
  function reduireQ(terms, L) {
    const nom = pick(NOMS);
    const dejaReduite = reduire(terms).length === terms.length;
    const lignes = [{ m: fmtL(terms) }];
    if (!dejaReduite) {
      if (new Set(terms.map((t) => cle(t.m))).size > 1) lignes.push({ m: regroupe(terms), c: 'On regroupe les termes de même nature.' });
      lignes.push({ m: fmtL(canon(terms)) });
    }
    return exprQ(nom, fmtL(terms), terms, lignes, dejaReduite
      ? 'Il n’y a pas deux termes de même nature : l’expression est déjà réduite. On recopie l’expression.'
      : 'On additionne les termes de même nature : les ' + L + '² ensemble, les ' + L + ' ensemble et les nombres ensemble. ' + L + '² et ' + L + ' ne sont pas de même nature !', [L]);
  }

  /* ---------- 3. Distributivité simple ---------- */
  function prodDisplay(k, terms) {
    if (k.c > 0) return terms.map((t, i) => (i === 0 ? (t.c < 0 ? M + ' ' : '') : (t.c < 0 ? ' ' + M + ' ' : ' + ')) + fmtT(k, true) + ' × ' + fmtT(abs(t), true)).join('');
    return terms.map((t, i) => (i ? ' + ' : '') + fact(k) + ' × ' + fact(t)).join('');
  }
  const kAvant = (k) => (k.c === -1 && !degre(k.m) ? M : fmtT(k, true));
  const binome = (L, a, b) => ordreHasard(X1(a, L), T(b));
  const TXT_DIST = 'On multiplie le facteur par chaque terme de la parenthèse : k(a + b) = k × a + k × b.';

  /* ---------- 4. Double distributivité ---------- */
  const expand = (B1, B2) => B1.flatMap((t) => B2.map((u) => mulT(t, u)));
  const TXT_DOUBLE = 'On multiplie chaque terme de la première parenthèse par chaque terme de la seconde : (a + b)(c + d) = ac + ad + bc + bd. Puis on réduit.';
  // a² : x², 5², (4x)², (−4x)²
  const sq = (t) => ((t.c === 1 || !degre(t.m)) && t.c > 0 ? fmtT(t, true) + '<sup>2</sup>' : '(' + fmtT(t, true) + ')<sup>2</sup>');
  const carre = (t) => mulT(t, t);
  const coefX = () => pick([1, 1, 2, 2, 3, 3, 4, 5, 6, -1, -2, -3, -4]);

  /* ---------- 5. Identité remarquable (a − b)(a + b) = a² − b² ---------- */
  function irQ(a, b, L) {
    const [P1, P2] = ordreHasard([a, b], [a, neg(b)]), res = [carre(a), neg(carre(b))], disp = par(P1) + par(P2);
    const q = exprQ(pick(NOMS), disp, res, [{ m: disp }, { m: sq(a) + ' ' + M + ' ' + sq(b), c: 'a = ' + fmtT(a, true) + ' et b = ' + fmtT(b, true) + '.' }, { m: fmtL(res) }],
      'On reconnaît (a − b)(a + b) = a² − b². Attention : si a contient un nombre devant la lettre, il faut aussi le mettre au carré : (5x)² = 25x².', [L]);
    return Object.assign(q, { reponseHTML: fmtL(res) });
  }

  /* ---------- 6. Factorisation ---------- */
  function factoQ(terms, k, inner, L) {
    const nom = pick(NOMS), rep = kAvant(k) + par(inner);
    const q = exprQ(nom, fmtL(terms), terms, [
      { m: fmtL(terms) },
      { m: prodDisplay(k, terms.map((t) => inner.find((v) => cle(mulT(k, v).m) === cle(t.m)))),
        c: fmtT(k, true) + ' est un facteur commun aux deux termes.' },
      { m: rep }
    ], 'On cherche ce qui est commun aux deux termes (un nombre, une lettre, ou les deux), on le met devant, et on écrit le reste entre parenthèses : ka + kb = k(a + b).', [L]);
    return Object.assign(q, { facto: true, reponseHTML: rep });
  }

  /* =====================================================================
     FRACTIONS
     ===================================================================== */
  function fracIrr(dmin, dmax, nmax) {
    let n, d; do { d = rnd(dmin, dmax); n = rnd(1, nmax ? nmax(d) : 2 * d); } while (gcd(n, d) !== 1 || n === d);
    return { n, d };
  }
  const premiers = (n) => { const r = []; for (let p = 2; n > 1; p++) while (n % p === 0) { r.push(p); n /= p; } return r; };

  // Simplification pas à pas : ÷2, ÷3… (ou par puissances si trop d'étapes)
  function etapesSimplif(n, d) {
    const g0 = gcd(n, d), lignes = [];
    let ps = premiers(g0);
    if (ps.length > 4) { const m = {}; ps.forEach((p) => { m[p] = (m[p] || 1) * p; }); ps = Object.values(m); }
    let a = n, b = d;
    ps.forEach((p) => { a /= p; b /= p; lignes.push({ m: '= ' + F(a, b), c: '÷ ' + p }); });
    return lignes;
  }

  // Somme de fractions : items = [{ s: ±1, n, d }]
  const dispItems = (items) => items.map((it, i) => (i === 0 ? (it.s < 0 ? M + ' ' : '') : (it.s < 0 ? ' ' + M + ' ' : ' + ')) + (it.g ? P(dispItems(it.g)) : (it.d === 1 ? num(it.n) : F(it.n, it.d)))).join('');
  const valItems = (items) => items.reduce((acc, it) => { const v = it.g ? valItems(it.g) : Q(it.n, it.d); return Q(acc.n * v.d + it.s * v.n * acc.d, acc.d * v.d); }, Q(0));
  function chaineSomme(items) {
    const D = items.reduce((l, it) => lcm(l, it.d), 1), out = [];
    const sg = (it, i) => (i === 0 ? (it.s < 0 ? M + ' ' : '') : (it.s < 0 ? ' ' + M + ' ' : ' + '));
    if (items.some((it) => it.d !== D)) out.push({ m: items.map((it, i) => sg(it, i) + (it.d === D ? F(it.n, it.d) : F(it.n + ' × ' + D / it.d, it.d + ' × ' + D / it.d))).join(''), c: 'On met au même dénominateur : ' + D + '.' });
    const nums = items.map((it, i) => sg(it, i) + it.n * D / it.d).join('');
    const N = items.reduce((s, it) => s + it.s * it.n * D / it.d, 0);
    if (items.length > 1) out.push({ m: F(nums, D), c: 'On garde le dénominateur et on calcule les numérateurs.' });
    out.push({ m: N < 0 ? M + F(-N, D) : F(N, D) });
    if (gcd(N, D) > 1) out.push({ m: fracQ(Q(N, D)), c: 'On simplifie.' });
    return out;
  }
  function sommeQ(items, texte) {
    const lignes = [{ m: dispItems(items) }];
    let flat = items;
    if (items.some((it) => it.g)) {
      items.filter((it) => it.g).forEach((it) => {
        const ch = chaineSomme(it.g);
        lignes.push({ m: P(dispItems(it.g)) + ' = ' + ch.map((l) => l.m).join(' = '), c: 'On calcule d’abord la parenthèse.' });
      });
      flat = items.map((it) => { if (!it.g) return it; const v = valItems(it.g); return { s: it.s, n: v.n, d: v.d }; });
      lignes.push({ m: '= ' + dispItems(flat), c: 'On remplace la parenthèse par son résultat.' });
    }
    chaineSomme(flat).forEach((l) => lignes.push({ m: '= ' + l.m, c: l.c }));
    return {
      type: 'nombre', enonce: dispItems(items), reponse: valItems(items), prefixe: '= ', clavier: '-/', irreductible: 'conseil',
      correction: { texte, lignes }
    };
  }
  const fracItem = (d, s = 1) => { let n; do { n = rnd(1, 2 * d - 1); } while (gcd(n, d) !== 1 && d > 1); return { s, n, d }; };
  const diviseurs = (D) => { const r = []; for (let k = 2; k < D; k++) if (D % k === 0) r.push(k); return r; };
  const positifPartout = (items) => valItems(items).n > 0 && items.every((it) => !it.g || valItems(it.g).n > 0);
  // Parenthèses positives ; résultat final non nul, négatif environ 4 fois sur 10 quand il y a une soustraction.
  const avecSoustraction = (items) => items.some((it, i) => (i > 0 && it.s < 0) || (it.g && avecSoustraction(it.g)));
  function tirerSomme(fabrique) {
    const veutNegatif = Math.random() < 0.4;
    for (let essai = 0; essai < 400; essai++) {
      const items = fabrique(), v = valItems(items);
      if (v.n === 0 || items.some((it) => it.g && valItems(it.g).n <= 0)) continue;
      if (items.some((it) => it.g && it.g[0].d === it.g[1].d && it.g[0].n === it.g[1].n)) continue;
      if (!avecSoustraction(items) || (v.n < 0) === veutNegatif) return items;
    }
    return fabrique();
  }
  // Deux fractions : dénominateur multiple de l'autre
  const deuxMultiple = () => { const b = rnd(2, 9), D = b * rnd(2, 5), it = ordreHasard(fracItem(b), fracItem(D)); it[1].s = Math.random() < 0.6 ? -1 : 1; return it; };
  // Deux fractions : dénominateurs premiers entre eux
  const deuxPremiers = () => { let b, d; do { b = rnd(2, 12); d = rnd(2, 12); } while (b === d || gcd(b, d) !== 1 || b * d > 90); const it = [fracItem(b), fracItem(d)]; it[1].s = Math.random() < 0.6 ? -1 : 1; return it; };
  const TXT_MULTIPLE = 'Pour additionner ou soustraire des fractions, il faut le même dénominateur. Ici, l\u2019un des dénominateurs est dans la table de l\u2019autre : c\u2019est lui le dénominateur commun.';
  const TXT_PREMIERS = 'Les dénominateurs n\u2019ont aucun diviseur commun : le dénominateur commun est leur produit. On multiplie chaque fraction par le dénominateur de l\u2019autre.';
  const TXT_NEG = ' Si le résultat est négatif, le signe − peut s\u2019écrire devant la fraction, au numérateur ou au dénominateur.';

  /* =====================================================================
     GÉOMÉTRIE : THÉORÈME DE PYTHAGORE (triangle toujours nommé ABC)
     Les longueurs sont stockées en centièmes (entiers) pour des calculs exacts.
     ===================================================================== */
  const SOMMETS = ['A', 'B', 'C'];
  const cote = (p, q) => [p, q].sort().join('');                         // « BA » → « AB »
  const fmtC = (n, ech) => { // n / ech écrit avec une virgule, sans zéros inutiles
    const neg = n < 0; n = Math.abs(n);
    const ent = Math.floor(n / ech); let dec = String(n % ech).padStart(String(ech).length - 1, '0').replace(/0+$/, '');
    return (neg ? M : '') + ent + (dec ? ',' + dec : '');
  };
  const L = (c) => fmtC(c, 100);                 // longueur en centièmes
  const L2 = (c) => fmtC(c * c, 10000);          // carré d'une longueur en centièmes
  const UNITES_L = ['cm', 'cm', 'cm', 'm', 'mm'];

  // Figure : triangle rectangle tourné au hasard, codage de l'angle droit, longueurs connues et « ? » pour la longueur cherchée.
  function figureTriangle(droit, etiquettes) {
    const autres = SOMMETS.filter((s) => s !== droit), [P1, P2] = Math.random() < 0.5 ? autres : autres.slice().reverse();
    const l1 = etiquettes.long[cote(droit, P1)], l2 = etiquettes.long[cote(droit, P2)];
    let r = Math.max(0.4, Math.min(2.5, l2 / l1));             // proportions approximatives (figure à main levée)
    const th = Math.random() * Math.PI * 2, a = 1, b = r;
    const pts = { [droit]: [0, 0], [P1]: [a * Math.cos(th), a * Math.sin(th)], [P2]: [-b * Math.sin(th), b * Math.cos(th)] };
    const xs = Object.values(pts).map((p) => p[0]), ys = Object.values(pts).map((p) => p[1]);
    const Wf = 260, Hf = 170, pad = 34, sx = (Wf - 2 * pad) / (Math.max(...xs) - Math.min(...xs) || 1), sy = (Hf - 2 * pad) / (Math.max(...ys) - Math.min(...ys) || 1), s = Math.min(sx, sy);
    const ox = (Wf - (Math.max(...xs) - Math.min(...xs)) * s) / 2 - Math.min(...xs) * s, oy = (Hf - (Math.max(...ys) - Math.min(...ys)) * s) / 2 - Math.min(...ys) * s;
    const P = {}; for (const k in pts) P[k] = [pts[k][0] * s + ox, pts[k][1] * s + oy];
    const G = [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3];
    const dehors = (x, y, d) => { const dx = x - G[0], dy = y - G[1], n = Math.hypot(dx, dy) || 1; return [x + dx / n * d, y + dy / n * d]; };
    let svg = '<svg class="fig" viewBox="0 0 ' + Wf + ' ' + Hf + '" role="img" aria-label="Triangle ABC rectangle en ' + droit + '">';
    svg += '<polygon points="' + SOMMETS.map((k) => P[k].map((v) => v.toFixed(1)).join(',')).join(' ') + '" class="fig-tri"/>';
    // codage de l'angle droit
    const u1 = [P[P1][0] - P[droit][0], P[P1][1] - P[droit][1]], u2 = [P[P2][0] - P[droit][0], P[P2][1] - P[droit][1]];
    const n1 = Math.hypot(...u1), n2 = Math.hypot(...u2), c = 11;
    const q1 = [P[droit][0] + u1[0] / n1 * c, P[droit][1] + u1[1] / n1 * c], q2 = [P[droit][0] + u2[0] / n2 * c, P[droit][1] + u2[1] / n2 * c], q3 = [q1[0] + u2[0] / n2 * c, q1[1] + u2[1] / n2 * c];
    svg += '<polyline points="' + [q1, q3, q2].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ') + '" class="fig-angle"/>';
    SOMMETS.forEach((k) => { const [x, y] = dehors(P[k][0], P[k][1], 14); svg += '<text x="' + x.toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" class="fig-sommet">' + k + '</text>'; });
    [['A', 'B'], ['A', 'C'], ['B', 'C']].forEach(([p, q]) => {
      const t = etiquettes.txt[p + q]; if (!t) return;
      const m = [(P[p][0] + P[q][0]) / 2, (P[p][1] + P[q][1]) / 2], [x, y] = dehors(m[0], m[1], 15);
      svg += '<text x="' + x.toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" class="fig-long' + (t === '?' ? ' fig-inc' : '') + '">' + t + '</text>';
    });
    return svg + '</svg>';
  }

  const TRIPLETS = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [6, 8, 10], [9, 12, 15], [12, 16, 20], [9, 40, 41], [15, 20, 25], [10, 24, 26], [12, 35, 37]];
  const TXT_PYTH = (droit, hyp) => 'Dans le triangle ABC rectangle en ' + droit + ', l’hypoténuse est [' + hyp + '], le côté opposé à l’angle droit. D’après le théorème de Pythagore :';

  // Question de calcul : on cherche l'hypoténuse (cherche = 'hyp') ou un côté de l'angle droit (cherche = 'cote').
  function questionPythagore(cherche, longueurs, arrondi, sansFigure) {
    // longueurs : { a, b, h } en centièmes (a, b : côtés de l'angle droit ; h : hypoténuse)
    const droit = pick(SOMMETS), autres = SOMMETS.filter((s) => s !== droit), u = pick(UNITES_L);
    const hyp = cote(autres[0], autres[1]), [c1, c2] = shuffle([cote(droit, autres[0]), cote(droit, autres[1])]);
    const long = { [hyp]: longueurs.h, [c1]: longueurs.a, [c2]: longueurs.b };
    const inconnu = cherche === 'hyp' ? hyp : c2, connu = cherche === 'hyp' ? [c1, c2] : [hyp, c1];
    const exact = cherche === 'hyp' ? longueurs.a * longueurs.a + longueurs.b * longueurs.b : longueurs.h * longueurs.h - longueurs.a * longueurs.a; // en dix-millièmes
    const racine = Math.sqrt(exact) / 100, rep = Math.round(racine * (arrondi ? 10 : 1)) / (arrondi ? 10 : 1);
    const consigneCalc = 'Calcule ' + inconnu + (arrondi ? ' (arrondi au dixième).' : '.');
    let enonce;
    if (sansFigure) {
      enonce = '<p class="txt">ABC est un triangle rectangle en ' + droit + ' tel que ' + connu[0] + ' = ' + L(long[connu[0]]) + ' ' + u + ' et ' + connu[1] + ' = ' + L(long[connu[1]]) + ' ' + u + '.</p><p class="txt"><strong>' + consigneCalc + '</strong></p>';
    } else {
      const txt = { [connu[0]]: L(long[connu[0]]) + ' ' + u, [connu[1]]: L(long[connu[1]]) + ' ' + u, [inconnu]: '?' };
      enonce = '<p class="txt">Le triangle ABC est rectangle en ' + droit + '. <strong>' + consigneCalc + '</strong></p>' + figureTriangle(droit, { long, txt });
    }
    const lignes = [{ m: hyp + '² = ' + c1 + '² + ' + c2 + '²' }];
    if (cherche === 'hyp') {
      lignes.push({ m: hyp + '² = ' + L(long[c1]) + '² + ' + L(long[c2]) + '²' }, { m: hyp + '² = ' + L2(long[c1]) + ' + ' + L2(long[c2]) }, { m: hyp + '² = ' + fmtC(exact, 10000) });
    } else {
      lignes.push({ m: L(long[hyp]) + '² = ' + L(long[c1]) + '² + ' + c2 + '²' }, { m: c2 + '² = ' + L(long[hyp]) + '² ' + M + ' ' + L(long[c1]) + '²', c: 'On isole ' + c2 + '² en soustrayant.' },
        { m: c2 + '² = ' + L2(long[hyp]) + ' ' + M + ' ' + L2(long[c1]) }, { m: c2 + '² = ' + fmtC(exact, 10000) });
    }
    const exacte = Math.abs(racine - rep) < 1e-9;
    lignes.push({ m: inconnu + ' = √' + fmtC(exact, 10000) + (exacte ? ' = ' : ' ≈ ') + ecrireDec(rep) + ' ' + u, c: exacte ? '' : 'Avec la calculatrice, puis on arrondit au dixième.' });
    return {
      type: 'nombre', decimal: true, enonce, reponse: decQ(rep), prefixe: inconnu + ' = ', suffixe: u, clavier: ',', consigne: 'Théorème de Pythagore',
      correction: { texte: TXT_PYTH(droit, hyp), lignes }
    };
  }
  const ecrireDec = (x) => String(x).replace('.', ',');
  const decQ = (x) => { const s = String(x), d = (s.split('.')[1] || '').length; return Q(Math.round(x * Math.pow(10, d)), Math.pow(10, d)); };

  // Côtés de l'angle droit décimaux (en centièmes, un chiffre après la virgule) pour un résultat à arrondir
  function longueursDecimales(cherche) {
    for (let k = 0; k < 500; k++) {
      if (cherche === 'hyp') {
        const a = rnd(15, 120) * 10, b = rnd(15, 120) * 10, h = Math.sqrt(a * a + b * b);
        const x = h / 10; if (Math.abs(x - Math.floor(x) - 0.5) < 0.05) continue; // évite les arrondis ambigus
        return { a, b, h: Math.round(h) };
      }
      const h = rnd(40, 160) * 10, a = rnd(15, h / 10 - 8) * 10, bb = h * h - a * a, b = Math.sqrt(bb);
      if (b < 150) continue;
      const x = b / 10; if (Math.abs(x - Math.floor(x) - 0.5) < 0.05) continue;
      return { a, b: Math.round(b), h };
    }
    return { a: 300, b: 400, h: 500 };
  }
  const tripletEntier = () => { let t, k; do { t = pick(TRIPLETS); k = rnd(1, 3); } while (t[2] * k > 60); return { a: t[0] * k * 100, b: t[1] * k * 100, h: t[2] * k * 100 }; };

  function questionEgalite(sansFigure) {
    const droit = pick(SOMMETS), autres = SOMMETS.filter((s) => s !== droit), hyp = cote(autres[0], autres[1]);
    const cotes = ['AB', 'AC', 'BC'], egalite = (seul) => { const r = cotes.filter((c) => c !== seul); return seul + '² = ' + r[0] + '² + ' + r[1] + '²'; };
    const options = shuffle(cotes.slice()), reponse = options.indexOf(hyp);
    const enonce = '<p class="txt">Le triangle ABC est rectangle en ' + droit + '. <strong>Quelle est l’égalité de Pythagore ?</strong></p>' +
      (sansFigure ? '' : figureTriangle(droit, { long: { AB: 1, AC: rnd(8, 14) / 10, BC: rnd(8, 14) / 10 }, txt: {} }));
    return {
      type: 'choix', enonce, consigne: 'Théorème de Pythagore',
      etapes: [{ texte: 'Choisis la bonne égalité :', options: options.map(egalite), reponse }],
      correction: { texte: 'L’hypoténuse est le côté opposé à l’angle droit : ici [' + hyp + '], car le triangle est rectangle en ' + droit + '. Le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés.', lignes: [{ m: egalite(hyp) }] }
    };
  }

  // Réciproque : triplets (éventuellement décimaux) ou triangles « presque » rectangles
  const TRIPLETS_R = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [11, 60, 61], [33, 56, 65], [28, 45, 53], [48, 55, 73], [13, 84, 85], [36, 77, 85], [39, 80, 89], [65, 72, 97], [60, 221, 229], [12, 35, 37]];
  function questionReciproque() {
    let a, b, h;
    for (;;) {
      const t = pick(TRIPLETS_R), ech = t[2] > 100 ? pick([1]) : t[2] > 30 ? pick([1, 10]) : pick([100, 50, 20, 10, 200, 300]); // centièmes
      [a, b, h] = t.map((v) => v * ech);
      if (h <= 30000 && Math.min(a, b) >= 30) break;
    }
    const rect = Math.random() < 0.5;
    if (!rect) {
      const pas = [a, b, h].every((v) => v % 100 === 0) ? 100 : [a, b, h].every((v) => v % 10 === 0) ? 10 : 1;
      h += (h - pas > Math.max(a, b) && Math.random() < 0.5 ? -1 : 1) * pas;
    }
    const droit = pick(SOMMETS), autres = SOMMETS.filter((s) => s !== droit), hyp = cote(autres[0], autres[1]);
    const [c1, c2] = shuffle([cote(droit, autres[0]), cote(droit, autres[1])]), long = { [hyp]: h, [c1]: a, [c2]: b }, u = pick(UNITES_L);
    const ordre = shuffle(['AB', 'AC', 'BC']);
    const enonce = '<p class="txt">ABC est un triangle tel que ' + ordre[0] + ' = ' + L(long[ordre[0]]) + ' ' + u + ' ; ' + ordre[1] + ' = ' + L(long[ordre[1]]) + ' ' + u + ' et ' + ordre[2] + ' = ' + L(long[ordre[2]]) + ' ' + u + '.</p>';
    const H2 = h * h, S2 = a * a + b * b;
    const etapes = [{ texte: 'Le triangle ABC est-il rectangle ?', options: ['Oui', 'Non'], reponse: rect ? 0 : 1 }];
    if (rect) etapes.push({ texte: 'En quel point ?', options: SOMMETS.slice(), reponse: SOMMETS.indexOf(droit) });
    return {
      type: 'choix', enonce, consigne: 'Réciproque du théorème de Pythagore', etapes,
      correction: {
        texte: 'On compare le carré du plus grand côté avec la somme des carrés des deux autres côtés.',
        lignes: [
          { m: 'Le plus grand côté est [' + hyp + '].' },
          { m: hyp + '² = ' + L(h) + '² = ' + L2(h) },
          { m: c1 + '² + ' + c2 + '² = ' + L(a) + '² + ' + L(b) + '² = ' + L2(a) + ' + ' + L2(b) + ' = ' + fmtC(S2, 10000) },
          rect ? { m: hyp + '² = ' + c1 + '² + ' + c2 + '²', c: 'Donc, d’après la réciproque du théorème de Pythagore, le triangle ABC est rectangle en ' + droit + ' (le sommet opposé au plus grand côté).' }
            : { m: hyp + '² ≠ ' + c1 + '² + ' + c2 + '²', c: 'L’égalité de Pythagore n’est pas vérifiée, donc le triangle ABC n’est pas rectangle.' }
        ]
      }
    };
  }

  /* =====================================================================
     GRANDEURS ET MESURES : VITESSES ET CONVERSIONS
     Résultats exacts, sauf quand la consigne demande un arrondi au dixième.
     ===================================================================== */
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const dv = (x) => String(r3(x)).replace('.', ',');                 // nombre décimal écrit avec une virgule
  const hmin = (sec) => { const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : '') || '0 min'; };
  function nombreQ(enonce, valeur, suffixe, prefixe, texte, lignes, arrondi) {
    return { type: 'nombre', decimal: true, enonce: '<p class="txt">' + enonce + '</p>', reponse: decQ(r3(valeur)), prefixe: prefixe || '= ', suffixe, clavier: ',',
      consigne: 'Vitesses et conversions', correction: { texte, lignes } };
  }
  function dureeQ(enonce, secondes, unites, texte, lignes) {
    return { type: 'duree', enonce: '<p class="txt">' + enonce + '</p>', reponse: secondes, unites, prefixe: '= ', consigne: 'Vitesses et conversions', correction: { texte, lignes } };
  }

  // ★ Conversions de durées
  const conversionsDurees = [
    () => { // heures décimales → h min
      const h = rnd(1, 9), c = rnd(1, 19) * 5, x = h + c / 100, m = c * 60 / 100;
      return dureeQ('Convertis <strong>' + dv(x) + ' h</strong> en heures et minutes.', h * 3600 + m * 60, ['h', 'min'], 'Le chiffre avant la virgule donne les heures. La partie décimale est une fraction d’heure : on la multiplie par 60 pour l’avoir en minutes.',
        [{ m: dv(x) + ' h = ' + h + ' h + ' + dv(c / 100) + ' h' }, { m: dv(c / 100) + ' h = ' + dv(c / 100) + ' × 60 min = ' + m + ' min' }, { m: dv(x) + ' h = ' + h + ' h ' + m + ' min' }]);
    },
    () => { // minutes → heures décimales
      const m = rnd(3, 60) * pick([6, 6, 3, 12]), x = m / 60;
      return nombreQ('Convertis <strong>' + m + ' min</strong> en heures (écriture décimale).', x, 'h', '= ', 'Une heure, c’est 60 minutes : pour passer des minutes aux heures, on divise par 60.',
        [{ m: m + ' min = ' + m + ' ÷ 60 h' }, { m: '= ' + dv(x) + ' h' }]);
    },
    () => { // h min → minutes
      const h = rnd(1, 6), m = rnd(1, 59);
      return nombreQ('Convertis <strong>' + h + ' h ' + m + ' min</strong> en minutes.', h * 60 + m, 'min', '= ', 'Une heure, c’est 60 minutes.',
        [{ m: h + ' h ' + m + ' min = ' + h + ' × 60 min + ' + m + ' min' }, { m: '= ' + (h * 60) + ' min + ' + m + ' min = ' + (h * 60 + m) + ' min' }]);
    },
    () => { // h min → heures décimales
      const h = rnd(0, 5), m = pick([6, 12, 15, 18, 24, 30, 36, 42, 45, 48, 54]), x = h + m / 60;
      return nombreQ('Convertis <strong>' + (h ? h + ' h ' : '') + m + ' min</strong> en heures (écriture décimale).', x, 'h', '= ', 'On convertit les minutes en heures en divisant par 60, puis on ajoute les heures.',
        [{ m: m + ' min = ' + m + ' ÷ 60 h = ' + dv(m / 60) + ' h' }, { m: (h ? h + ' h ' : '') + m + ' min = ' + dv(x) + ' h' }]);
    },
    () => { // secondes → min s
      const s = rnd(70, 590);
      return dureeQ('Convertis <strong>' + s + ' s</strong> en minutes et secondes.', s, ['min', 's'], 'Une minute, c’est 60 secondes : on cherche combien de fois 60 il y a dans ' + s + '.',
        [{ m: s + ' = ' + Math.floor(s / 60) + ' × 60 + ' + (s % 60) }, { m: s + ' s = ' + Math.floor(s / 60) + ' min ' + (s % 60) + ' s' }]);
    }
  ];

  // ★★ v = d ÷ t
  const MOBILES = [
    { qui: 'Un automobiliste', verbe: 'roule', v: [60, 130], u: 'km/h', d: 'km' }, { qui: 'Un train', verbe: 'roule', v: [120, 300], u: 'km/h', d: 'km' },
    { qui: 'Un cycliste', verbe: 'pédale', v: [12, 36], u: 'km/h', d: 'km' }, { qui: 'Un avion', verbe: 'vole', v: [600, 900], u: 'km/h', d: 'km' },
    { qui: 'Un randonneur', verbe: 'marche', v: [3, 6], u: 'km/h', d: 'km' }, { qui: 'Un scooter', verbe: 'roule', v: [30, 45], u: 'km/h', d: 'km' }
  ];
  const TXT_V = 'Vitesse moyenne = distance ÷ durée. On peut aussi écrire d = v × t et t = d ÷ v, avec des unités cohérentes (km, h et km/h).';
  function calculVDT() {
    const mb = pick(MOBILES), quoi = pick(['v', 'd', 't']);
    let v = rnd(mb.v[0], mb.v[1]); if (v > 100) v = Math.round(v / 10) * 10; else if (v > 20) v = Math.round(v / 2) * 2;
    let t, tTxt;
    if (Math.random() < 0.6) { t = pick([1, 2, 3, 4, 5, 1.5, 2.5, 0.5, 3.5]); tTxt = dv(t) + ' h'; }
    else { const m = pick([15, 30, 45, 20, 40]), h = rnd(0, 3); t = h + m / 60; v = Math.round(v / 12) * 12 || 12; tTxt = (h ? h + ' h ' : '') + m + ' min'; }
    const d = r3(v * t);
    if (quoi === 'v') return nombreQ(mb.qui + ' a parcouru <strong>' + dv(d) + ' ' + mb.d + '</strong> en <strong>' + tTxt + '</strong>. Quelle a été sa vitesse moyenne ?', v, mb.u, 'v = ', TXT_V,
      [{ m: 'v = d ÷ t' }].concat(Number.isInteger(t * 2) ? [] : [{ m: 't = ' + tTxt + ' = ' + dv(t) + ' h', c: 'On convertit la durée en heures.' }]).concat([{ m: 'v = ' + dv(d) + ' ÷ ' + dv(t) }, { m: 'v = ' + dv(v) + ' ' + mb.u }]));
    if (quoi === 'd') return nombreQ(mb.qui + ' ' + mb.verbe + ' pendant <strong>' + tTxt + '</strong> à la vitesse moyenne de <strong>' + dv(v) + ' ' + mb.u + '</strong>. Quelle distance parcourt-il ?', d, mb.d, 'd = ', TXT_V,
      [{ m: 'd = v × t' }].concat(Number.isInteger(t * 2) ? [] : [{ m: 't = ' + tTxt + ' = ' + dv(t) + ' h', c: 'On convertit la durée en heures.' }]).concat([{ m: 'd = ' + dv(v) + ' × ' + dv(t) }, { m: 'd = ' + dv(d) + ' ' + mb.d }]));
    // durée : en heures décimales si elle tombe juste, sinon en h min
    const sec = Math.round(t * 3600);
    if (Number.isInteger(t * 2)) return nombreQ(mb.qui + ' parcourt <strong>' + dv(d) + ' ' + mb.d + '</strong> à la vitesse moyenne de <strong>' + dv(v) + ' ' + mb.u + '</strong>. Combien de temps dure le trajet ?', t, 'h', 't = ', TXT_V,
      [{ m: 't = d ÷ v' }, { m: 't = ' + dv(d) + ' ÷ ' + dv(v) }, { m: 't = ' + dv(t) + ' h' }]);
    const q = dureeQ(mb.qui + ' parcourt <strong>' + dv(d) + ' ' + mb.d + '</strong> à la vitesse moyenne de <strong>' + dv(v) + ' ' + mb.u + '</strong>. Combien de temps dure le trajet ? Donne la réponse en heures et minutes.', sec, ['h', 'min'], TXT_V,
      [{ m: 't = d ÷ v' }, { m: 't = ' + dv(d) + ' ÷ ' + dv(v) + ' = ' + dv(t) + ' h' }, { m: dv(t) + ' h = ' + hmin(sec), c: 'La partie décimale × 60 donne les minutes.' }]);
    q.prefixe = 't = ';
    return q;
  }

  // ★★★ Conversions km/h ↔ m/s (× 3,6 ou ÷ 3,6) et problèmes
  const TXT_36 = '1 m/s = 3 600 m/h = 3,6 km/h. Pour passer des m/s aux km/h, on multiplie par 3,6 ; pour passer des km/h aux m/s, on divise par 3,6.';
  const conversionsVitesses = [
    () => { const k = rnd(2, 40), kmh = r3(k * 3.6); return nombreQ('Convertis <strong>' + dv(kmh) + ' km/h</strong> en m/s.', k, 'm/s', '= ', TXT_36, [{ m: dv(kmh) + ' km/h = ' + dv(kmh) + ' ÷ 3,6 m/s' }, { m: '= ' + k + ' m/s' }]); },
    () => { const ms = rnd(2, 60) / pick([1, 1, 2, 10]), kmh = r3(ms * 3.6); return nombreQ('Convertis <strong>' + dv(ms) + ' m/s</strong> en km/h.', kmh, 'km/h', '= ', TXT_36, [{ m: dv(ms) + ' m/s = ' + dv(ms) + ' × 3,6 km/h' }, { m: '= ' + dv(kmh) + ' km/h' }]); },
    () => { // le guépard : km/h → m/s puis distance
      const kmh = pick([72, 90, 108, 100, 110, 112]), s = rnd(8, 25), ms = kmh / 3.6, d = Math.round(ms * s * 10) / 10;
      return nombreQ('Un guépard court à <strong>' + kmh + ' km/h</strong> pendant <strong>' + s + ' s</strong>. Quelle distance parcourt-il, en mètres ? (arrondi au dixième)', d, 'm', 'd = ',
        'Les unités doivent être cohérentes : la durée est en secondes, donc on convertit la vitesse en m/s.',
        [{ m: kmh + ' km/h = ' + kmh + ' ÷ 3,6 m/s ≈ ' + dv(Math.round(ms * 1000) / 1000) + ' m/s', c: 'On garde le résultat exact dans la calculatrice.' }, { m: 'd = v × t = (' + kmh + ' ÷ 3,6) × ' + s }, { m: 'd ≈ ' + dv(d) + ' m' }], true);
    },
    () => { // le voilier : durée en h min, vitesse arrondie
      const d = rnd(15, 60), h = rnd(1, 4), m = pick([10, 20, 25, 35, 40, 50, 55]), t = h + m / 60, v = Math.round(d / t * 10) / 10;
      return nombreQ('Un voilier parcourt <strong>' + d + ' km</strong> en <strong>' + h + ' h ' + m + ' min</strong>. Quelle est sa vitesse moyenne en km/h ? (arrondi au dixième)', v, 'km/h', 'v = ', 'On convertit d’abord la durée en heures décimales, puis v = d ÷ t.',
        [{ m: h + ' h ' + m + ' min = ' + h + ' h + ' + m + ' ÷ 60 h', c: m + ' ÷ 60 ne tombe pas juste : on garde le calcul exact.' }, { m: 'v = ' + d + ' ÷ (' + h + ' + ' + m + ' ÷ 60)' }, { m: 'v ≈ ' + dv(v) + ' km/h' }], true);
    },
    () => { // le son : 340 m/s
      const s = rnd(2, 15), dkm = r3(340 * s / 1000);
      return nombreQ('Le son se déplace à <strong>340 m/s</strong>. Tu entends le tonnerre <strong>' + s + ' s</strong> après l’éclair. À quelle distance est l’orage, en km ?', dkm, 'km', 'd = ', 'd = v × t donne une distance en mètres ; on la convertit ensuite en kilomètres (÷ 1 000).',
        [{ m: 'd = 340 × ' + s + ' = ' + (340 * s) + ' m' }, { m: (340 * s) + ' m = ' + dv(dkm) + ' km' }]);
    }
  ];

  /* =====================================================================
     THÈMES
     ===================================================================== */
  const THEMES = [
    /* ---------------- Calcul littéral ---------------- */
    {
      id: 'simplifier-expr', classes: ['4e', '3e'], domaine: 'Calcul littéral',
      titre: 'Simplifier une expression',
      resume: 'Supprimer les signes × et écrire les produits avec des exposants.',
      consigne: 'Simplifie l’expression.',
      niveaux: [
        { nom: 'Un produit simple', gen() { const L = pick(LETTRES); return simplifierQ([produit(pick(PAT1), L)], [L]); } },
        { nom: 'Produits avec exposants', gen() { const L = pick(LETTRES); return simplifierQ([produit(pick(PAT2), L)], [L]); } },
        { nom: 'Sommes de produits', gen() {
          const n = rnd(2, 3), Ls = shuffle(LETTRES.slice()).slice(0, n);
          return simplifierQ(Ls.map((L) => produit(pick(PAT1.concat(PAT2)), L)), Ls.slice().sort());
        } }
      ]
    },
    {
      id: 'reduire', classes: ['4e', '3e'], domaine: 'Calcul littéral',
      titre: 'Réduire une expression',
      resume: 'Regrouper les termes de même nature : les x avec les x, les nombres avec les nombres.',
      consigne: 'Réduis l’expression.',
      niveaux: [
        { nom: 'Deux sortes de termes', gen() {
          const L = pick(LETTRES), c1 = rnd(3, 15), t = [X1(c1, L)];
          t.push(Math.random() < 0.5 ? X1(-rnd(1, c1 - 1), L) : X1(rnd(1, 12), L));
          if (Math.random() < 0.6) t.push(T(rnd(1, 15)), T(rnd(1, 15)));
          if (t.length === 2) return reduireQ(t, L);
          const [a, b, c, d] = t; return reduireQ(pick([[a, b, c, d], [a, c, b, d], [a, c, d, b], [c, a, d, b]]), L);
        } },
        { nom: 'Avec des soustractions', gen() {
          const L = pick(['x', 'x', 'y', 'a']);
          let xs; do { xs = [X1(rnd(1, 15), L)]; for (let i = rnd(1, 2); i > 0; i--) xs.push(X1(rndNZ(-15, 15), L)); } while (!reduire(xs).length);
          const cs = []; for (let i = rnd(2, 3); i > 0; i--) cs.push(T(rndNZ(-20, 20)));
          return reduireQ(premierPositif(xs.concat(cs)), L);
        } },
        { nom: 'Avec des x²', gen() {
          const L = pick(['x', 'x', 'x', 'y', 'a']);
          if (Math.random() < 0.2) {
            const f = pick([[X2(rnd(2, 25), L), X1(rndNZ(-15, 15), L)], [T(rnd(2, 20)), X1(rndNZ(-9, 9), L)], [X2(rnd(2, 12), L), T(rndNZ(-20, 20))], [X1(rnd(2, 12), L), X2(rndNZ(-9, 9), L)]]);
            return reduireQ(f, L);
          }
          let x2; do { x2 = [X2(rnd(1, 12), L), X2(rndNZ(-12, 12), L)]; } while (!reduire(x2).length);
          const x1 = [X1(rndNZ(-12, 12), L), X1(rndNZ(-12, 12), L)];
          const cs = []; for (let i = rnd(1, 2); i > 0; i--) cs.push(T(rndNZ(-15, 15)));
          return reduireQ(premierPositif(x2.concat(x1, cs)), L);
        } }
      ]
    },
    {
      id: 'distributivite', classes: ['4e', '3e'], domaine: 'Calcul littéral',
      titre: 'Distributivité simple',
      resume: 'Développer k(a + b), puis réduire. Supprimer des parenthèses.',
      consigne: 'Développe et réduis.',
      niveaux: [
        { nom: 'k(x + a)', gen() {
          const L = pick(LETTRES), k = T(rnd(2, 9)), a = rnd(1, 12);
          const terms = pick([[X1(1, L), T(a)], [T(a), X1(1, L)], [X1(1, L), T(-a)], [T(a), X1(-1, L)]]);
          const disp = pick([kAvant(k) + par(terms), k.c + ' × ' + par(terms), par(terms) + ' × ' + k.c]);
          const res = terms.map((t) => mulT(k, t));
          return exprQ(pick(NOMS), disp, res, [{ m: disp }, { m: prodDisplay(k, terms), c: 'On distribue ' + k.c + '.' }, { m: fmtL(res) }], TXT_DIST, [L]);
        } },
        { nom: 'kx(ax + b)', gen() {
          const L = pick(['x', 'x', 'y', 'a', 'z']);
          if (Math.random() < 0.2) { // −(ax + b + cx²)
            const terms = shuffle([X1(rndNZ(-9, 9), L), T(rndNZ(-12, 12)), X2(rndNZ(-9, 9), L)]), res = terms.map(neg), disp = M + par(terms);
            return exprQ(pick(NOMS), disp, res, [{ m: disp }, { m: fmtL(res), c: 'On change le signe de chaque terme.' }],
              'Un signe − devant une parenthèse (sans nombre ni lettre) : on enlève les parenthèses en changeant tous les signes à l\u2019intérieur.', [L]);
          }
          const k = Math.random() < 0.6 ? X1(rndNZ(-6, 6), L) : T(pick([-9, -7, -5, -4, -3, -2, 2, 3, 4, 6, 8]));
          const terms = binome(L, rndNZ(-9, 9), rndNZ(-12, 12));
          const res = terms.map((t) => mulT(k, t)), disp = kAvant(k) + par(terms);
          return exprQ(pick(NOMS), disp, res, [{ m: disp }, { m: prodDisplay(k, terms), c: 'On distribue ' + fmtT(k, true) + '.' }, { m: fmtL(res) }],
            TXT_DIST + ' Attention aux signes, et x × x = x².', [L]);
        } },
        { nom: 'Développer et réduire', gen() {
          const L = pick(['x', 'x', 'y', 'z']), f = rnd(1, 4);
          if (f === 1) { // k(ax + b) + c
            const k = T(rnd(2, 9)), terms = binome(L, rnd(1, 9), rndNZ(-9, 9)), c = T(rndNZ(-15, 15));
            const dev = terms.map((t) => mulT(k, t)).concat(c), disp = k.c + par(terms) + fmtT(c, false);
            return exprQ(pick(NOMS), disp, dev, [{ m: disp }, { m: fmtL(dev), c: 'On développe.' }, { m: fmtL(canon(dev)), c: 'On réduit.' }], TXT_DIST, [L]);
          }
          if (f === 2) { // k(ax + b) + mx(px + q)
            const k = T(rnd(2, 6)), t1 = binome(L, rnd(1, 9), rndNZ(-9, 9)), m = X1(rnd(1, 5), L), t2 = [X1(rnd(1, 6), L), T(rndNZ(-9, 9))];
            const dev = t1.map((t) => mulT(k, t)).concat(t2.map((t) => mulT(m, t))), disp = k.c + par(t1) + ' + ' + kAvant(m) + par(t2);
            return exprQ(pick(NOMS), disp, dev, [{ m: disp }, { m: fmtL(dev), c: 'On développe chaque produit.' }, { m: fmtL(canon(dev)), c: 'On réduit.' }], TXT_DIST, [L]);
          }
          if (f === 3) { // (ax + b) − (c + dx) [+ (ex − f)]
            const p1 = binome(L, rndNZ(-9, 9), rndNZ(-9, 9)), p2 = binome(L, rndNZ(-9, 9), rndNZ(-9, 9));
            const avec3 = Math.random() < 0.5, p3 = binome(L, rndNZ(-9, 9), rndNZ(-9, 9));
            const disp = (Math.random() < 0.5 ? par(p1) : fmtL(p1)) + ' ' + M + ' ' + par(p2) + (avec3 ? ' + ' + par(p3) : '');
            const dev = p1.concat(p2.map(neg), avec3 ? p3 : []);
            return exprQ(pick(NOMS), disp, dev, [{ m: disp }, { m: fmtL(dev), c: 'Parenthèse précédée de − : on change le signe de chaque terme. Précédée de + : on enlève simplement les parenthèses.' }, { m: fmtL(canon(dev)), c: 'On réduit.' }],
              'Pour supprimer une parenthèse précédée du signe −, on change le signe de tous les termes qu’elle contient : −(a − b) = −a + b.', [L]);
          }
          const e = T(rnd(2, 20)), k = rnd(2, 9), terms = binome(L, rndNZ(-9, 9), rndNZ(-9, 9)); // e − k(ax + b)
          const dev = [e].concat(terms.map((t) => mulT(T(-k), t))), disp = e.c + ' ' + M + ' ' + k + par(terms);
          return exprQ(pick(NOMS), disp, dev, [{ m: disp }, { m: fmtL(dev), c: 'On distribue ' + M + k + ' à chaque terme de la parenthèse.' }, { m: fmtL(canon(dev)), c: 'On réduit.' }],
            'Le signe − devant le facteur fait partie du facteur : on multiplie chaque terme de la parenthèse par ' + M + k + '.', [L]);
        } }
      ]
    },
    {
      id: 'double-distributivite', classes: ['4e', '3e'], domaine: 'Calcul littéral',
      titre: 'Double distributivité',
      resume: 'Développer (a + b)(c + d), puis réduire.',
      consigne: 'Développe et réduis.',
      niveaux: [
        { nom: '(x + a)(x + b)', gen() {
          const L = pick(['x', 'x', 'y', 'a', 'n']), B1 = [X1(1, L), T(rnd(1, 9))], B2 = [X1(1, L), T(rnd(1, 9))], dev = expand(B1, B2), disp = par(B1) + par(B2);
          return exprQ(pick(NOMS), disp, dev, [{ m: disp }, { m: fmtL(dev), c: 'Quatre produits.' }, { m: fmtL(canon(dev)), c: 'On réduit.' }], TXT_DOUBLE, [L]);
        } },
        { nom: 'Avec des signes −', gen() {
          const L = pick(['x', 'x', 'y', 'u', 'n']);
          const B1 = binome(L, coefX(), rndNZ(-9, 9)), B2 = binome(L, coefX(), rndNZ(-9, 9)), dev = expand(B1, B2), disp = par(B1) + par(B2);
          return exprQ(pick(NOMS), disp, dev, [{ m: disp }, { m: fmtL(dev), c: 'Quatre produits : attention aux signes.' }, { m: fmtL(canon(dev)), c: 'On réduit.' }], TXT_DOUBLE, [L]);
        } },
        { nom: 'Expressions complètes', gen() {
          const L = pick(['x', 'y', 'z']), f = rnd(1, 4);
          const B1 = binome(L, coefX(), rndNZ(-9, 9)), B2 = binome(L, coefX(), rndNZ(-9, 9)), dev = expand(B1, B2);
          if (f === 4) { // kx(a + bx) − (…)(…)
            const k = X1(rnd(2, 6), L), t = binome(L, rndNZ(-6, 6), rndNZ(-9, 9)), d1 = t.map((u) => mulT(k, u)), red = canon(dev), tout = d1.concat(red.map(neg));
            const disp = fmtT(k, true) + par(t) + ' ' + M + ' ' + par(B1) + par(B2);
            return exprQ(pick(NOMS), disp, tout, [{ m: disp }, { m: fmtL(d1) + ' ' + M + ' ' + par(red), c: 'On développe chaque produit, en gardant les parenthèses après le signe −.' },
              { m: fmtL(d1) + suite(red.map(neg)), c: 'On supprime les parenthèses en changeant les signes.' }, { m: fmtL(canon(tout)), c: 'On réduit.' }],
            'Pour les experts : on développe les deux produits séparément. Le second est précédé d\u2019un signe − : on le garde entre parenthèses, puis on change les signes.', [L]);
          }
          if (f === 1) { // k + (…)(…)
            const k = T(rnd(1, 15)), tout = [k].concat(dev), disp = k.c + ' + ' + par(B1) + par(B2);
            return exprQ(pick(NOMS), disp, tout, [{ m: disp }, { m: fmtL(tout), c: 'On développe le produit.' }, { m: fmtL(canon(tout)), c: 'On réduit.' }],
              'Le produit est prioritaire sur l’addition : on le développe d’abord. ' + TXT_DOUBLE, [L]);
          }
          if (f === 2) { // kx − (…)(…)
            const k = X1(rnd(1, 9), L), red = canon(dev), tout = [k].concat(red.map(neg)), disp = fmtT(k, true) + ' ' + M + ' ' + par(B1) + par(B2);
            return exprQ(pick(NOMS), disp, tout, [{ m: disp }, { m: fmtT(k, true) + ' ' + M + ' ' + par(red), c: 'On développe et on réduit le produit, en gardant les parenthèses.' },
              { m: fmtT(k, true) + suite(red.map(neg)), c: 'Parenthèse précédée de − : on change tous les signes.' }, { m: fmtL(canon(tout)), c: 'On réduit.' }],
            'Avec un signe − devant le produit, on développe le produit entre parenthèses, puis on supprime les parenthèses en changeant les signes.', [L]);
          }
          const B = [X1(rnd(1, 6), L), T(rndNZ(-9, 9))], d2 = expand(B, B), disp = par(B) + '<sup>2</sup>';
          return exprQ(pick(NOMS), disp, d2, [{ m: disp }, { m: par(B) + par(B), c: 'Un carré est un produit par lui-même.' }, { m: fmtL(d2) }, { m: fmtL(canon(d2)), c: 'On réduit.' }], TXT_DOUBLE, [L]);
        } }
      ]
    },

    {
      id: 'identite-remarquable', classes: ['3e'], domaine: 'Calcul littéral',
      titre: 'Identité remarquable',
      resume: 'Développer (a − b)(a + b) = a² − b².',
      consigne: 'Développe et réduis.',
      niveaux: [
        { nom: '(x − a)(x + a)', gen() {
          const L = pick(['x', 'x', 'y', 'a', 'n']);
          return irQ(X1(1, L), T(rnd(1, 12)), L);
        } },
        { nom: '(5x − 9)(5x + 9)', gen() {
          const L = pick(['x', 'x', 'y', 'z']);
          return Math.random() < 0.75 ? irQ(X1(pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]), L), T(rnd(1, 12)), L) : irQ(T(rnd(1, 12)), X1(rnd(1, 9), L), L);
        } },
        { nom: 'Pour les experts', gen() {
          const L = pick(['x', 'x', 'y']), f = rnd(1, 3), a = X1(rnd(1, 6), L), b = T(rnd(1, 9));
          const [P1, P2] = ordreHasard([a, b], [a, neg(b)]), ir = [carre(a), neg(carre(b))], dispIR = par(P1) + par(P2);
          const k = f === 3 ? T(rnd(2, 7)) : X1(rnd(2, 7), L), t = f === 3 ? [X1(1, L), T(rndNZ(-9, 9))] : binome(L, rndNZ(-6, 6), rndNZ(-9, 9));
          const d1 = t.map((u) => mulT(k, u)), dispK = fmtT(k, true) + par(t);
          let disp, tout, lignes;
          if (f === 1) { // kx(…) + (a + b)(a − b)
            disp = dispK + ' + ' + dispIR; tout = d1.concat(ir);
            lignes = [{ m: disp }, { m: fmtL(d1) + suite(ir), c: 'On développe chaque partie : distributivité, puis identité remarquable.' }, { m: fmtL(canon(tout)), c: 'On réduit.' }];
          } else { // (a + b)(a − b) − kx(…)   ou   k(…) − (a + b)(a − b)
            const [A, B] = f === 2 ? [ir, d1] : [d1, ir];
            disp = f === 2 ? dispIR + ' ' + M + ' ' + dispK : dispK + ' ' + M + ' ' + dispIR; tout = A.concat(B.map(neg));
            lignes = [{ m: disp }, { m: fmtL(A) + ' ' + M + ' ' + par(B), c: 'On développe chaque partie, en gardant les parenthèses après le signe −.' },
              { m: fmtL(A) + suite(B.map(neg)), c: 'On supprime les parenthèses en changeant les signes.' }, { m: fmtL(canon(tout)), c: 'On réduit.' }];
          }
          return exprQ(pick(NOMS), disp, tout, lignes, 'On utilise (a − b)(a + b) = a² − b² avec a = ' + fmtT(a, true) + ' et b = ' + b.c + ', donc ' + dispIR + ' = ' + fmtL(ir) + '.', [L]);
        } }
      ]
    },
    {
      id: 'factorisation', classes: ['3e'], domaine: 'Calcul littéral',
      titre: 'Factoriser',
      resume: 'Transformer une somme en produit : facteur commun ou a² − b².',
      consigne: 'Factorise au maximum.',
      niveaux: [
        { nom: 'Facteur commun : un nombre', gen() {
          const L = pick(['x', 'x', 'y', 'n', 'a']);
          let p, q; do { p = rnd(1, 9); q = rndNZ(-12, 12); } while (gcd(p, q) !== 1);
          const k = T(Math.random() < 0.15 ? -rnd(2, 9) : rnd(2, 9));
          const inner = Math.random() < 0.2 ? [X2(p, L), T(q)] : ordreHasard(X1(p, L), T(q));
          return factoQ(inner.map((t) => mulT(k, t)), k, inner, L);
        } },
        { nom: 'Facteur commun : avec une lettre', gen() {
          const L = pick(['x', 'x', 't', 'a', 'y']);
          let p, q; do { p = rnd(1, 9); q = rndNZ(-9, 9); } while (gcd(p, q) !== 1);
          const k = X1(pick([1, 1, 2, 3, 4, 5, 6]), L), inner = ordreHasard(X1(p, L), T(q));
          return factoQ(shuffle(inner.map((t) => mulT(k, t))), k, inner, L);
        } },
        { nom: 'a² − b² ou facteur entre parenthèses', gen() {
          const L = pick(['x', 'x', 'y']);
          if (Math.random() < 0.6) { // a² − b²
            let a, b;
            do {
              const m = rnd(1, 9), n = rnd(1, 12);
              [a, b] = Math.random() < 0.8 ? [X1(m, L), T(n)] : [T(n), X1(m, L)];
            } while (gcd(a.c, b.c) !== 1);
            const terms = [carre(a), neg(carre(b))], nom = pick(NOMS), rep = par([a, b]) + par([a, neg(b)]);
            const q = exprQ(nom, fmtL(terms), terms, [{ m: fmtL(terms) }, { m: sq(a) + ' ' + M + ' ' + sq(b), c: 'On reconnaît a² − b² avec a = ' + fmtT(a, true) + ' et b = ' + fmtT(b, true) + '.' }, { m: rep }],
              'On utilise l’identité remarquable « dans l’autre sens » : a² − b² = (a + b)(a − b).', [L]);
            return Object.assign(q, { facto: true, reponseHTML: rep });
          }
          // (c)(d) ± (c)(e) = (c)(d ± e)
          let c, d, e, s, sum;
          do {
            c = binome(L, rnd(1, 6), rndNZ(-9, 9)); d = binome(L, rndNZ(-6, 6), rndNZ(-9, 9));
            e = Math.random() < 0.3 ? [T(rnd(2, 9))] : binome(L, rndNZ(-6, 6), rndNZ(-9, 9)); s = pick([1, -1]);
            sum = canon(d.concat(s > 0 ? e : e.map(neg)));
          } while (sum.length < 2 || gcd(sum[0].c, sum[1].c) !== 1 || gcd(c[0].c, c[1].c) !== 1 || fmtL(canon(sum)) === fmtL(canon(c)));
          const dispE = e.length === 1 ? String(e[0].c) : par(e);
          const disp = par(c) + par(d) + ' ' + (s > 0 ? '+' : M) + ' ' + (e.length === 1 ? e[0].c + par(c) : par(c) + dispE);
          const total = expand(c, d).concat(expand(c, e).map((t) => (s > 0 ? t : neg(t))));
          const rep = par(c) + par(sum), nom = pick(NOMS);
          const q = exprQ(nom, disp, total, [{ m: disp }, { m: par(c) + '[' + par(d) + ' ' + (s > 0 ? '+' : M) + ' ' + dispE + ']', c: par(c) + ' est un facteur commun aux deux termes.' }, { m: rep, c: 'On réduit dans le crochet.' }],
            'On repère le facteur commun ' + par(c) + ', on le met devant, et on écrit le reste entre crochets. Attention au signe − devant le second produit.', [L]);
          return Object.assign(q, { facto: true, reponseHTML: rep });
        } }
      ]
    },

    /* ---------------- Géométrie ---------------- */
    {
      id: 'pythagore', classes: ['4e', '3e'], domaine: 'Géométrie',
      titre: 'Théorème de Pythagore',
      resume: 'Écrire l’égalité de Pythagore et calculer une longueur dans un triangle rectangle.',
      consigne: 'Théorème de Pythagore', rappel: 'Prépare ta calculatrice !',
      niveaux: [
        { nom: 'L’égalité et l’hypoténuse', gen() {
          const sansFigure = Math.random() < 1 / 3;
          return Math.random() < 0.35 ? questionEgalite(sansFigure) : questionPythagore('hyp', tripletEntier(), false, sansFigure);
        } },
        { nom: 'Un côté de l’angle droit', gen() {
          return questionPythagore('cote', longueursDecimales('cote'), true, Math.random() < 1 / 3);
        } },
        { nom: 'Mélange', gen() {
          const cherche = Math.random() < 0.5 ? 'hyp' : 'cote';
          return questionPythagore(cherche, longueursDecimales(cherche), true, Math.random() < 1 / 3);
        } }
      ]
    },
    {
      id: 'reciproque-pythagore', classes: ['4e', '3e'], domaine: 'Géométrie',
      titre: 'Réciproque de Pythagore',
      resume: 'Dire si un triangle est rectangle, et en quel point.',
      consigne: 'Réciproque du théorème de Pythagore', rappel: 'Prépare ta calculatrice !',
      niveaux: [
        { nom: 'Le triangle est-il rectangle ?', gen: questionReciproque }
      ]
    },

    /* ---------------- Grandeurs et mesures ---------------- */
    {
      id: 'vitesses', classes: ['4e', '3e'], domaine: 'Grandeurs et mesures',
      titre: 'Vitesses et conversions',
      resume: 'Convertir des durées, calculer une vitesse, une distance ou une durée, convertir des km/h en m/s.',
      consigne: 'Calcule.', rappel: 'Prépare ta calculatrice !',
      niveaux: [
        { nom: 'Conversions de durées', gen: () => pick(conversionsDurees)() },
        { nom: 'Vitesse, distance, durée', gen: calculVDT },
        { nom: 'km/h et m/s, problèmes', gen: () => (Math.random() < 0.6 ? pick(conversionsVitesses.slice(0, 2)) : pick(conversionsVitesses.slice(2)))() }
      ]
    },

    /* ---------------- Fractions ---------------- */
    {
      id: 'fractions-egales', classes: ['4e', '3e'], domaine: 'Fractions',
      titre: 'Fractions égales',
      resume: 'Trouver le nombre manquant pour que deux fractions soient égales.',
      consigne: 'Complète pour que les fractions soient égales.',
      niveaux: [
        { nom: 'En multipliant', gen() {
          const { n: a, d: b } = fracIrr(2, 10), k = rnd(2, 9), haut = Math.random() < 0.5;
          return { type: 'nombre', prefixe: '? = ', clavier: '', reponse: Q(haut ? a * k : b * k),
            enonce: F(a, b) + ' = ' + (haut ? F(TROU, b * k) : F(a * k, TROU)),
            correction: { texte: (haut ? 'Le dénominateur ' + b + ' est multiplié par ' + k + ' (' + b + ' × ' + k + ' = ' + b * k + ')' : 'Le numérateur ' + a + ' est multiplié par ' + k + ' (' + a + ' × ' + k + ' = ' + a * k + ')') + ' : on multiplie aussi ' + (haut ? 'le numérateur' : 'le dénominateur') + ' par ' + k + '.',
              lignes: [{ m: F(a, b) + ' = ' + F(a + ' × ' + k, b + ' × ' + k) + ' = ' + F(a * k, b * k) }] } };
        } },
        { nom: 'En divisant', gen() {
          const { n: a, d: b } = fracIrr(2, 10), k = rnd(2, 9), haut = Math.random() < 0.5;
          return { type: 'nombre', prefixe: '? = ', clavier: '', reponse: Q(haut ? a : b),
            enonce: F(a * k, b * k) + ' = ' + (haut ? F(TROU, b) : F(a, TROU)),
            correction: { texte: (haut ? 'Le dénominateur ' + b * k + ' est divisé par ' + k : 'Le numérateur ' + a * k + ' est divisé par ' + k) + ' : on divise aussi ' + (haut ? 'le numérateur' : 'le dénominateur') + ' par ' + k + '.',
              lignes: [{ m: F(a * k, b * k) + ' = ' + F(a * k + ' ÷ ' + k, b * k + ' ÷ ' + k) + ' = ' + F(a, b) }] } };
        } },
        { nom: 'En deux étapes', gen() {
          const { n: a, d: b } = fracIrr(2, 9); let k, m; do { k = rnd(2, 6); m = rnd(2, 7); } while (k === m);
          const haut = Math.random() < 0.5;
          return { type: 'nombre', prefixe: '? = ', clavier: '', reponse: Q(haut ? a * m : b * m),
            enonce: F(a * k, b * k) + ' = ' + (haut ? F(TROU, b * m) : F(a * m, TROU)),
            correction: { texte: 'On ne passe pas directement d’une fraction à l’autre : on simplifie d’abord, puis on multiplie.',
              lignes: [{ m: F(a * k, b * k) + ' = ' + F(a, b), c: '÷ ' + k }, { m: '= ' + F(a * m, b * m), c: '× ' + m }] } };
        } }
      ]
    },
    {
      id: 'simplifier-fractions', classes: ['4e', '3e'], domaine: 'Fractions',
      titre: 'Simplifier une fraction',
      resume: 'Rendre une fraction irréductible, en une ou plusieurs étapes.',
      consigne: 'Simplifie au maximum.',
      niveaux: [
        { nom: 'Une étape', gen() {
          const { n: a, d: b } = fracIrr(2, 12), k = pick([2, 2, 3, 3, 5, 5, 7, 10]);
          return { type: 'nombre', prefixe: '= ', clavier: '/', irreductible: true, reponse: Q(a, b), enonce: F(a * k, b * k),
            correction: { texte: a * k + ' et ' + b * k + ' sont tous les deux divisibles par ' + k + '. On divise le numérateur et le dénominateur par ' + k + '.',
              lignes: [{ m: F(a * k, b * k) + ' = ' + F(a * k + ' ÷ ' + k, b * k + ' ÷ ' + k) }, { m: '= ' + F(a, b) }] } };
        } },
        { nom: 'Plusieurs étapes', gen() {
          const { n: a, d: b } = fracIrr(2, 9), k = pick([4, 6, 8, 9, 12, 14, 15, 18, 25, 27]), n = a * k, d = b * k;
          return { type: 'nombre', prefixe: '= ', clavier: '/', irreductible: true, reponse: Q(a, b), enonce: F(n, d),
            correction: { texte: n + ' et ' + d + ' sont divisibles par ' + k + '. On peut diviser directement par ' + k + ', ou simplifier en plusieurs étapes avec les critères de divisibilité (par 2, 3, 5…).',
              lignes: [{ m: F(n, d) }].concat(etapesSimplif(n, d)) } };
        } },
        { nom: 'Grands nombres et signes', gen() {
          let a, b, k; do { ({ n: a, d: b } = fracIrr(2, 15)); k = pick([12, 15, 16, 18, 20, 24, 28, 30, 36, 42, 45]); } while (a * k > 300 || b * k > 300);
          const n = a * k, d = b * k, signe = Math.random() < 0.35 ? pick(['devant', 'haut', 'bas']) : '';
          const enonce = signe === 'devant' ? M + F(n, d) : signe === 'haut' ? F(M + n, d) : signe === 'bas' ? F(n, M + d) : F(n, d);
          const lignes = [{ m: enonce }];
          if (signe) lignes.push({ m: '= ' + M + F(n, d), c: 'Un seul signe − : la fraction est négative.' });
          etapesSimplif(n, d).forEach((l) => lignes.push({ m: '= ' + (signe ? M : '') + l.m.slice(2), c: l.c }));
          return { type: 'nombre', prefixe: '= ', clavier: signe ? '-/' : '/', irreductible: true, reponse: Q(signe ? -a : a, b), enonce,
            correction: { texte: 'Le plus grand diviseur commun de ' + n + ' et ' + d + ' est ' + k + '. On peut aussi simplifier en plusieurs étapes.' + (signe ? ' Écris le signe − devant la fraction (ou au numérateur).' : ''), lignes } };
        } }
      ]
    },
    {
      id: 'addition-fractions', classes: ['4e', '3e'], domaine: 'Fractions',
      titre: 'Additionner et soustraire',
      resume: 'Mettre au même dénominateur, calculer, puis simplifier le résultat.',
      consigne: 'Calcule. Simplifie le résultat si possible.',
      niveaux: [
        { nom: 'Un dénominateur dans la table de l\u2019autre', gen() {
          return sommeQ(tirerSomme(deuxMultiple), TXT_MULTIPLE + TXT_NEG);
        } },
        { nom: 'Dénominateurs premiers entre eux', gen() {
          return sommeQ(tirerSomme(deuxPremiers), TXT_PREMIERS + TXT_NEG);
        } },
        { nom: 'Mélange, trois fractions et parenthèses', gen() {
          const f = pick([1, 2, 3, 3, 4, 4]);
          if (f === 1) return sommeQ(tirerSomme(deuxMultiple), TXT_MULTIPLE + TXT_NEG);
          if (f === 2) return sommeQ(tirerSomme(deuxPremiers), TXT_PREMIERS + TXT_NEG);
          if (f === 3) return sommeQ(tirerSomme(() => {
            const D = pick([6, 8, 10, 12, 12, 15, 18, 20, 24]), dv = shuffle(diviseurs(D)).slice(0, 2);
            const items = shuffle([fracItem(D), fracItem(dv[0]), fracItem(dv[1] || D)]);
            items[1].s = pick([1, -1]); items[2].s = pick([1, -1, -1]);
            return items;
          }), 'On cherche un dénominateur commun (ici, l\u2019un des dénominateurs est un multiple des autres), puis on calcule de gauche à droite.' + TXT_NEG);
          const g = rnd(1, 3);
          return sommeQ(tirerSomme(() => {
            const D = pick([12, 18, 20, 24, 30, 36]), dv = diviseurs(D).concat(D), d = () => pick(dv);
            if (g === 1) return [fracItem(d()), { s: pick([1, -1]), g: [fracItem(d()), fracItem(d(), -1)] }];
            if (g === 2) return [{ s: 1, g: [fracItem(d()), fracItem(d(), -1)] }, fracItem(d(), -1)];
            return [{ s: 1, g: [fracItem(d()), fracItem(d(), -1)] }, { s: pick([1, -1]), g: [fracItem(d()), fracItem(d(), -1)] }];
          }), 'On calcule d\u2019abord ce qui est entre parenthèses, puis le reste, de gauche à droite.' + TXT_NEG);
        } }
      ]
    }
  ];

  g.THEMES = THEMES;
  g.MATHS = { Q, gcd, fracQ, num, M, cle, lettresHTML };
})(typeof window !== 'undefined' ? window : globalThis);
