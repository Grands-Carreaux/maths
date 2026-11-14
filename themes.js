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
