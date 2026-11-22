# Grands Carreaux : guide d'installation et d'utilisation

Grands Carreaux est un portail d'exerciseurs de calcul littéral et de fractions pour la 4e et la 3e.
Il fonctionne sur tablette, téléphone et ordinateur.

- Les élèves choisissent un exerciseur, puis un niveau de difficulté (★, ★★ ou ★★★).
- Ils font des séries de 10 questions tirées au hasard, corrigées immédiatement avec une correction pas à pas.
- À la fin de chaque série, le score est envoyé dans **un tableur Google qui vous appartient**.
- Une **page professeur**, protégée par un code, affiche les résultats par élève et par série.

Durée d'installation : environ 20 minutes, en trois étapes (tableur Google, réglages, mise en ligne).

---

## Le contenu du dossier

| Fichier | Rôle | À modifier ? |
|---|---|---|
| `config.js` | Vos réglages : nom du site, adresse du tableur, liste des classes. | **Oui** (étape 2) |
| `apps-script/Code.gs` | Le petit programme à coller dans votre tableur Google. | **Oui**, une seule ligne : votre code professeur (étape 1) |
| `index.html` | La page du site. | Non |
| `themes.js` | Les exerciseurs et leurs générateurs de questions. | Non |
| `app.js` | Le fonctionnement du site : portail, clavier, correction, page professeur. | Non |
| `app.css` | L'apparence : couleurs, polices, tailles. | Non |
| `familles.html` | La page pour les parents (comment aider son enfant, données personnelles). Un lien y mène en bas de chaque page du site. | Seulement si vous voulez changer le texte |
| `LISEZMOI.md` | Ce guide. | Non |

---

## Étape 1 : créer le tableur qui reçoit les résultats (10 minutes)

1. Ouvrez [Google Drive](https://drive.google.com) avec votre compte Google, puis créez un **nouveau Google Sheets** (Nouveau > Google Sheets).
   Donnez-lui un nom, par exemple « Résultats Grands Carreaux ».
2. Dans le tableur, ouvrez le menu **Extensions > Apps Script**. Un éditeur de code s'ouvre dans un nouvel onglet.
3. Effacez tout le code présent (`function myFunction() …`).
4. Ouvrez le fichier `apps-script/Code.gs` du dossier avec un éditeur de texte (Bloc-notes, TextEdit…), copiez **tout** son contenu
   et collez-le dans l'éditeur Apps Script.
5. Tout en haut du script, repérez la ligne :
   ```
   const CODE_PROF = '';
   ```
   Tapez votre code **entre les deux guillemets simples** (au moins 4 caractères, sans apostrophe). Exemple :
   ```
   const CODE_PROF = 'pythagore2026';
   ```
   **C'est la seule ligne à modifier dans le script.** Ne touchez à rien d'autre : plus bas, `CODE_PROF` apparaît encore
   plusieurs fois, mais ce sont des vérifications automatiques, pas des réglages.
   Ce code vous sera demandé pour ouvrir la page professeur. Ne le donnez pas aux élèves.
6. Cliquez sur l'icône **Enregistrer** (la disquette).
7. Cliquez sur le bouton bleu **Déployer**, puis sur **Nouveau déploiement**.
   - Cliquez sur la roue dentée à côté de « Sélectionner le type », puis choisissez **Application Web**.
   - Description : ce que vous voulez, par exemple « Grands Carreaux ».
   - Exécuter en tant que : **Moi**.
   - Qui peut accéder : **Tout le monde**.
   - Cliquez sur **Déployer**.
8. Google demande d'autoriser l'accès. Cliquez sur **Autoriser l'accès**, puis choisissez votre compte.
   Un écran « Google n'a pas validé cette application » s'affiche. C'est normal pour un script que vous avez créé vous-même :
   cliquez sur **Paramètres avancés**, puis sur **Accéder à … (non sécurisé)**, puis sur **Autoriser**.
9. Copiez l'**URL de l'application Web** qui s'affiche. Elle ressemble à :
   `https://script.google.com/macros/s/AKfycb…/exec`
   Gardez-la : vous en avez besoin à l'étape 2.

**Vérification rapide** : collez cette adresse dans votre navigateur. Vous devez voir un texte du type
`{"ok":false,"erreur":"cle"}`. Le script fonctionne et refuse l'accès sans code. C'est le résultat attendu.

> **Si vous modifiez le script plus tard** (par exemple pour changer votre code professeur) :
> **Déployer > Gérer les déploiements**, cliquez sur le crayon ✏️, choisissez **Version : Nouvelle version**, puis **Déployer**.
> L'adresse reste ainsi la même. Ne créez pas de « Nouveau déploiement » : cela changerait l'adresse.

---

## Étape 2 : régler `config.js` (2 minutes)

Ouvrez `config.js` avec un éditeur de texte simple (Bloc-notes sur Windows, TextEdit sur Mac), pas avec Word. Il contient :

```js
window.CONFIG = {
  nomSite: 'Grands Carreaux',
  urlScript: '',
  classes: ['4e 1', '4e 2', '4e 3', '4e 4', '4e 5', '4e 6', '4e 7', '3e 1', '3e 2', '3e 3', '3e 4', '3e 5', '3e 6', '3e 7'],
  nbQuestions: 10
};
```

- **`urlScript`** : collez entre les deux guillemets simples l'adresse copiée à l'étape 1.
  Exemple : `urlScript: 'https://script.google.com/macros/s/AKfycb…/exec',`
- **`classes`** : les classes du menu déroulant des élèves. Une option **« Autre »** est toujours ajoutée en fin de liste
  (élève d'une autre classe, professeur qui teste) : la personne précise alors qui elle est, par exemple « 5e 2 » ou « Prof ».
  Le début du nom de la classe (« 4e » ou « 3e ») sert à présélectionner le niveau sur le portail.
- **`nomSite`** : le nom affiché en haut du portail. Vous pouvez le changer.
- **`nbQuestions`** : le nombre de questions par série.

Enregistrez le fichier. Attention à ne pas effacer les guillemets ou les virgules.

Tant que `urlScript` reste vide, le site fonctionne en **mode démonstration** : les élèves s'entraînent,
mais les résultats ne vous sont pas envoyés, et un bandeau l'indique.

---

## Étape 3 : mettre le site en ligne avec GitHub Pages (gratuit, 10 minutes)

1. Créez un compte sur [github.com](https://github.com) (bouton **Sign up**), puis connectez-vous.
2. Créez un dépôt : bouton **+** en haut à droite, puis **New repository**.
   - **Repository name** : ce nom fera partie de l'adresse du site. **Choisissez un nom court et définitif**,
     par exemple `maths`. Si vous le changez après avoir donné le lien aux élèves, vous devrez le leur redistribuer.
   - Cochez **Public**. GitHub Pages gratuit l'exige. Seuls les fichiers du site sont publics ; les résultats des élèves restent dans votre Google Drive.
   - Cliquez sur **Create repository**.
3. Sur la page du dépôt, cliquez sur le lien **uploading an existing file**, ou sur **Add file > Upload files**.
4. Décompressez le zip sur votre ordinateur. Ouvrez le dossier `exerciseurs` et glissez **son contenu** dans la page :
   les fichiers `index.html`, `app.js`, `app.css`, `themes.js`, `config.js` et `LISEZMOI.md`, ainsi que le dossier `apps-script`.
   **Ne glissez pas le dossier `exerciseurs` lui-même** : `index.html` doit se trouver à la racine du dépôt.
5. En bas de la page, cliquez sur **Commit changes**.
6. Ouvrez l'onglet **Settings** du dépôt, puis **Pages** dans le menu de gauche.
   Sous « Build and deployment » : Source = **Deploy from a branch**, Branch = **main** et **/ (root)**. Cliquez sur **Save**.
7. Attendez une ou deux minutes, puis rechargez la page. L'adresse du site s'affiche en haut :
   `https://VOTRE-COMPTE.github.io/maths/`

**Test complet avant de donner le lien aux élèves :**
1. Ouvrez le site, entrez un prénom de test et une classe, puis faites une série jusqu'au bout.
2. L'écran de fin doit afficher « Résultat envoyé à ton professeur. »
3. Une ligne doit apparaître dans l'onglet **Résultats** de votre tableur Google.
4. Allez sur **Espace professeur** (en bas du portail), entrez votre code : le résultat de test s'affiche.
5. Supprimez ensuite la ligne de test dans le tableur.

Autre possibilité : n'importe quel hébergement de pages simples fonctionne (espace web de l'établissement, Netlify…).
Il suffit d'y copier les fichiers.

---

## Étape 4 : donner le lien aux élèves

- Partagez l'adresse sur l'ENT ou Pronote, ou affichez-la en classe sous forme de QR code.
- Sur tablette ou téléphone, l'élève peut ajouter le site à son écran d'accueil (menu Partager > « Sur l'écran d'accueil »).
- Lors de sa première visite, l'élève tape son **prénom** (avec l'initiale de son nom seulement si un camarade de sa classe
  a le même prénom), puis choisit sa classe, ou « Autre » en précisant qui il est. L'appareil s'en souvient.
- Le portail s'ouvre sur son **niveau** (4e ou 3e, d'après sa classe). Deux gros boutons permettent de changer de niveau.
  Dans chaque niveau, les exerciseurs sont rangés par domaine.
- Sur une **tablette partagée** en classe, chaque élève clique sur **Changer d'élève** en haut du portail : la tablette oublie
  le prénom et la classe de l'élève précédent, et affiche un formulaire vide. Les séries en pause, records et vies bonus
  restent rangés au nom de chaque élève : il les retrouve en retapant le même prénom et la même classe.
- Le bouton **Modifier** sert à corriger une faute dans son prénom ou sa classe.
- Hors connexion, le résultat est mis de côté, puis envoyé automatiquement la prochaine fois que le site est ouvert.

**Faire une pause au milieu d'une série.** L'élève n'est pas obligé de faire les 10 questions d'un coup.
- La série est enregistrée sur l'appareil après chaque question. En touchant ✕, l'élève choisit
  **Faire une pause** ou **Abandonner la série**. Fermer l'onglet ou éteindre la tablette met aussi la série en pause.
- Quand il revient sur l'exerciseur, même plusieurs jours après, un encadré « Série en pause » lui propose de **reprendre** :
  il retrouve exactement la même question, avec son score. Le portail affiche « En pause · question 4/10 » sur l'exerciseur concerné.
- Le temps passé hors de la série n'est pas compté dans la durée.
- Seules les séries terminées vous sont envoyées. Une série en pause n'apparaît pas dans vos résultats.
- La pause est liée à l'appareil et au prénom : sur une tablette partagée, chaque élève retrouve sa propre série.
  En revanche, une série commencée en classe ne peut pas être reprise sur le téléphone de l'élève à la maison.
- Une série en pause depuis plus de 30 jours est oubliée.

**Le jeu « Au tableau ! ».** Une récompense pour motiver les élèves, dans un décor de tableau de classe.
- Le jeu est **accessible à tout moment**, avec **3 vies** par partie.
- **Chaque série terminée avec 8/10 ou plus donne une vie bonus** (3 vies bonus au maximum en réserve), utilisée à la
  partie suivante. La carte du jeu, en haut du portail, indique par exemple « 3 vies + 2 vies bonus ».
- Règle : l'élève déplace une petite craie avec les flèches (tactiles ou du clavier), **attrape les entiers** (+10 points)
  et **évite les décimaux** (une vie perdue). Les nombres tombent de plus en plus vite (vitesse maximale vers 3 minutes).
- **Calculs encadrés en jaune** (environ un objet sur cinq) : 0,5 + 0,5 ; 4 × 2,5 ; 1,6 − 0,6… Résultat entier attrapé : +30 ;
  résultat décimal attrapé : une vie perdue. Ils tombent plus lentement, pour laisser le temps de calculer.
- **Combo** : 5 bonnes prises d'affilée rapportent +20 points (jauge à côté du score). Le combo repart à zéro quand on perd une vie.
- **La craie s'use** : une jauge « Craie » se vide en 16 secondes environ et se recharge à chaque bonne prise.
  Si elle est vide, l'élève perd une vie. Rester sur le côté sans rien attraper ne marche donc plus.
- **Bonus** : le premier arrive à 20 secondes. Un bonus dure **20 secondes**, puis, si l'élève ne s'est pas trompé,
  « Prolongation ! » : il continue tant que l'élève ne se trompe pas (attraper un mauvais nombre ou un calcul non entier),
  **60 secondes au plus**. Ensuite, 15 secondes de règle normale avant le bonus suivant.
  Pendant un bonus, les **points sont doublés** (+40 par bonne prise) et les nombres tombent à 85 % de la vitesse du moment.
  À la fin, un bilan s'affiche (« Bonus : 5 attrapés sur 7 ») ; tout bon : +50.
  **Un bonus sur deux est « que des calculs »** (il ne tombe que des calculs : attraper ceux dont le résultat est un entier).
  Les autres sont tirés au hasard : nombres pairs, impairs, multiples de 5, plus grands que 50 (dès le début) ; fractions dont
  le quotient est un entier, multiples de 3 (après 1 minute) ; multiples de 9 et **règle inversée** (après 1 min 40).
- Hors bonus, environ **un objet sur cinq est un calcul** encadré en jaune.
- Le jeu laisse **toujours un passage libre plus large que la gomme** entre les mauvais nombres : on peut toujours les éviter.
- **Annonces** : la nouvelle règle reste affichée 3 secondes (l'élève peut toucher l'écran pour passer), puis « 3, 2, 1 ».
  Le retour à la règle normale est annoncé plus rapidement.
- **Mode expert**, débloqué à 300 points en mode normal : la règle change toutes les 15 secondes
  (nombres premiers, multiples de 3, 5, 9 ou 10, plus grands que 50, règle inversée, que des calculs).
- **Classement** : chaque élève voit son record, le podium de sa classe et le podium de tout le collège (les 3 meilleurs),
  séparément pour le mode normal et le mode expert, sur toute l'année.
- **Un seul score par élève** dans le tableur (onglet « Jeu ») : son meilleur score, pour chaque mode. Une nouvelle partie
  ne remplace la ligne que si elle bat le record ; sinon, rien n'est ajouté. Le tableur reste ainsi léger toute l'année.
- Les scores impossibles (trop élevés pour la durée de la partie) sont ignorés automatiquement.

---

## Étape 5 : consulter les résultats

- Lien **Espace professeur** en bas du portail, ou adresse du site suivie de `#prof`, puis votre code.
- Onglet **Par élève** : nombre de séries, taux de réussite, meilleur score par exerciseur et par niveau, dernière activité.
- Onglet **Toutes les séries** : la liste chronologique.
- Onglet **Jeu** : les parties de « Au tableau ! » (élève, classe, mode, score, durée), avec un bouton **Supprimer**
  pour retirer un score suspect ou un prénom déplacé du classement.
- Filtres par classe, exerciseur, période et prénom. Le bouton **Actualiser** recharge les derniers résultats.
- **Trier** : cliquez sur un titre de colonne (Date, Élève, Classe, Score…) ; un deuxième clic inverse l'ordre (flèche ▲ ▼).
- Le tableur Google contient toutes les données brutes, avec le détail question par question, pour vos tris ou exports.

**Supprimer des résultats** (un prénom fantaisiste, une faute de frappe, des essais, ou tout en fin d'année).
- Le bouton **Supprimer** au bout d'une ligne supprime cette ligne. Dans l'onglet **Par élève**, il supprime l'élève avec
  **toutes** ses séries et ses scores du jeu.
- Pour en supprimer **plusieurs d'un coup** : cochez les cases au début des lignes (**Maj + clic** pour cocher toute une plage),
  puis cliquez sur **Supprimer la sélection**.
- La case dans l'**en-tête** coche **toutes les lignes des filtres actuels** : par exemple, toute la 4e 3, ou tout,
  avec la période « Depuis le début ».
- Une confirmation est toujours demandée. **La suppression est définitive**, sauf à passer par l'historique des versions
  de Google Sheets (Fichier > Historique des versions).
- Si l'élève refait une série avec le même prénom sur le même appareil, il réapparaît. Pour corriger durablement un prénom,
  demandez-lui de cliquer sur **Modifier** en haut du portail et de taper son vrai prénom.

---

## XP, niveaux et conseils du prof

- **XP** : chaque série terminée rapporte 10 XP par bonne réponse, plus 20 XP si elle est réussie (8/10 ou plus).
  Le calcul est fait par le script Google, dans l'onglet **Profils** (une ligne par élève : XP, nombre de séries,
  dernier jour, jours d'affilée). Les XP suivent donc l'élève sur n'importe quel appareil.
  Les séries envoyées avant la mise en place des XP sont comptées automatiquement à la première nouvelle série.
- **Niveaux** : 10 niveaux portant le nom d'un mathématicien ou d'une mathématicienne (Hypatie, Al-Khwârizmî, Euclide,
  Fibonacci, Descartes, Sophie Germain, Euler, Emmy Noether, Ramanujan), avec une anecdote (touchez le niveau sur l'accueil).
  L'avatar gagne un côté à chaque niveau : triangle, carré, pentagone… et devient un cercle au niveau 10.
- **🔥 Jours d'affilée** : nombre de jours de suite avec au moins une série terminée.
- **Conseils du prof** : dans l'espace professeur, ouvrez « Conseils du prof », ajoutez des exerciseurs (avec leur niveau ★)
  pour la 4e et la 3e, rangez-les avec les flèches, puis « Enregistrer les conseils ». Les élèves voient la liste sur l'accueil,
  et les exerciseurs déjà réussis sont barrés.
- Supprimer un élève dans l'espace professeur efface aussi sa ligne de l'onglet Profils.
- **Ma constellation** (carte sur l'accueil, sous le jeu) : chaque exerciseur du niveau est une étoile placée dans un repère.
  Elle s'allume quand l'élève réussit une série (8/10 ou plus) et grossit avec les niveaux ★★ et ★★★.
  Les étoiles d'un domaine dessinent une figure (π pour Nombres et calculs, triangle rectangle pour la géométrie,
  cercle pour Grandeurs et mesures, éclair pour les automatismes) qui brille quand toutes sont allumées.
  En touchant une étoile, l'élève voit ses coordonnées, ses meilleurs scores, et peut ouvrir l'exerciseur.
  Les étoiles se placent toutes seules quand on ajoute des exerciseurs.

## Les exerciseurs

**Rangement par domaines.** Après le choix 4e / 3e, l'élève voit six tuiles de couleur : Nombres et calculs (bleu),
Espace et géométrie (vert), Grandeurs et mesures (orange), Données et fonctions (violet), Algorithmique (rose)
et, en 3e seulement, Automatismes du brevet (jaune). Un domaine sans exerciseur s'affiche grisé avec « Bientôt ».
Chaque exerciseur est rangé grâce à son champ `domaine` (dans `themes.js`) : « Fractions » et « Calcul littéral »
vont dans Nombres et calculs, « Géométrie » dans Espace et géométrie. La liste est en haut de `app.js` (`DOMAINES`).
Quand un élève réussit une série (8/10 ou plus), une pluie de symboles (π, √, ∞, Σ…) tombe sur l'écran.

Il y a 3 niveaux de difficulté par exerciseur. Tous sont pour la 4e et la 3e, sauf ceux marqués 3e.

### Calcul littéral

Le clavier propose les chiffres, les lettres de l'exercice, +, −, ² et ³, ainsi que des parenthèses pour la factorisation.

| Exerciseur | ★ | ★★ | ★★★ |
|---|---|---|---|
| Simplifier une expression | 5 × a × 4 | a × 2 × a × a, 2y × 7y | sommes de produits |
| Réduire une expression | 9a − 7a, 8x + 2x + 6 + 5 | avec des soustractions | avec des x², ou expression déjà réduite |
| Distributivité simple | 5(a + 9), (11 + c) × 7 | 3a(6 − 5a), −2(3x − 5), −(3x − 8 + 7x²) | développer et réduire, parenthèses précédées de − |
| Double distributivité | (x + 1)(x + 5) | (3 − 2x)(4 + x) | 6 + (5y − 2)(3 − 4y), 2x(1 − x) − (x − 4)(3x + 1), (4z + 3)² |
| Identité remarquable (3e) | (x − 3)(x + 3) | (4x − 7)(4x + 7), (3 + 2x)(3 − 2x) | pour les experts : 2(x + 3) − (2x + 3)(2x − 3) |
| Factoriser (3e) | 3x − 3, −2x² − 2 | 7x² − 5x, 30a + 36a² | x² − 16, 1 − 49x², (2x + 1)(3x − 5) + (2x + 1)(x + 4) |

### Géométrie

Une figure est dessinée automatiquement (triangle toujours nommé ABC, angle droit en A, B ou C), sauf pour environ une question
sur trois, rédigée sans figure. Un rappel « Prépare ta calculatrice ! » s'affiche à l'ouverture de ces exerciseurs.

| Exerciseur | ★ | ★★ | ★★★ |
|---|---|---|---|
| Théorème de Pythagore | égalité de Pythagore (à choisir) et hypoténuse, résultats entiers | un côté de l'angle droit, arrondi au dixième | mélange : hypoténuse ou côté, arrondi au dixième |
| Réciproque de Pythagore | un seul niveau : « le triangle est-il rectangle ? » (Oui / Non), puis « en quel point ? » (A / B / C) | | |

La correction suit la rédaction du cours : « Dans le triangle ABC rectangle en A, d'après le théorème de Pythagore :
BC² = AB² + AC² … BC = √… ≈ … cm ». Pour la réciproque : plus grand côté, calcul des deux membres, conclusion.

### Grandeurs et mesures

| Exerciseur | ★ | ★★ | ★★★ |
|---|---|---|---|
| Vitesses et conversions | durées : 2,35 h = 2 h 21 min ; 432 min = 7,2 h ; 2 h 45 min = 165 min ; 395 s = 6 min 35 s | vitesse, distance ou durée (v = d ÷ t), durées en heures décimales ou en h min | km/h ↔ m/s (÷ 3,6 et × 3,6), problèmes : guépard, voilier, orage |

Les nombres sont choisis pour que les résultats tombent juste ; seuls quelques problèmes du niveau ★★★ demandent
explicitement un arrondi au dixième. Les réponses en « h min » se tapent avec les touches h, min et s du clavier.
Rappel « Prépare ta calculatrice ! » à l'ouverture de l'exerciseur.

### Automatismes du brevet (3e uniquement)

Questions courtes et variées, **sans calculatrice** (rappel à l'ouverture). Pas d'étoiles : l'élève choisit une **partie**.
Dans une série, deux questions du même type ne tombent pas deux fois tant que c'est possible. Environ une question sur trois
a un résultat ou un terme négatif dans les parties 1 et 2.

| Partie | Exemples de questions |
|---|---|
| Nombres et calculs | simplifier une fraction ; somme, produit, quotient de fractions (signes − possibles) ; relatifs, (−3)² et −3² ; 40 % de 200, prix après une baisse ; un diviseur de 150 (QCM) ; 5□7 divisible par 9 ; 57 est-il premier ? ; décomposition en facteurs premiers (QCM) ; tableau de proportionnalité ; le plus petit nombre (QCM) ; priorités |
| Calcul littéral | réduire (2x + 3 − 5x + 8 ; 7x − 3 − 2(x − 5)) ; développer ; factoriser (4x + 8 ; x² − 16) ; résoudre 4x + 7 = 19 ; valeur pour x = −3 ; programme de calcul (QCM) ; équation produit nul (QCM) |
| Fonctions et données | image par le calcul ; image ou antécédent lus sur une droite dessinée ; moyenne, médiane, étendue ; diagramme en barres ; probabilités (sac de boules, lettres d'un mot) |
| Géométrie | égalité de Pythagore (QCM) ; Pythagore avec des nombres simples ; réciproque ; Thalès (avec ou sans figure) ; quotient du cosinus, du sinus ou de la tangente (QCM) ; aires et périmètres ; formules du cercle, volume d'un cylindre (QCM) ; angles d'un triangle, angle au centre d'un polygone régulier |
| Tout mélangé | 10 questions tirées dans les 4 parties |

À venir : Scratch, transformations, puissances de 10 et notation scientifique.

### Nombres relatifs (4e et 3e)

| Exerciseur | ★ | ★★ | ★★★ |
|---|---|---|---|
| Multiplier et diviser des relatifs | deux nombres : produit ou quotient (entiers, et 1 fois sur 4 un décimal simple : −2,5 × 4) | 3 ou 4 facteurs (compter les négatifs), facteur manquant : −8 × ? = 40, ? ÷ (−5) = −7 | priorités (−6 + (−4) × (−6)), deux produits, parenthèses, carrés ((−4)² et −4²), quotient (44 ÷ (2 − (−9))) |

La correction rappelle la règle des signes (ou le nombre de facteurs négatifs) et détaille les étapes.
Clavier : chiffres, signe − et virgule.

### Fractions

| Exerciseur | ★ | ★★ | ★★★ |
|---|---|---|---|
| Fractions égales | 3/4 = ?/20 | 15/25 = ?/5 | 6/9 = ?/15 (simplifier, puis multiplier) |
| Simplifier une fraction | une division | plusieurs étapes (81/108) | grands nombres et signes − |
| Additionner et soustraire | un dénominateur dans la table de l'autre (3/4 − 5/12) | dénominateurs premiers entre eux (2/7 − 1/6) | mélange, trois fractions, parenthèses |

### Règles de correction

- **Calcul littéral** : l'ordre des termes est libre (4x + 16 ou 16 + 4x).
  Une réponse égale mais non réduite (1x, 3x + 2x…) est comptée fausse, avec le message « Presque ! ».
- **Factoriser** : la réponse doit être un produit, factorisé au maximum. L'ordre des facteurs est libre.
  Une réponse développée est refusée (« ce n'est pas un produit »).
  Une factorisation incomplète aussi : 3(2x² − 5x) pour 6x² − 15x, où il reste x en facteur commun.
- **Simplifier une fraction** : une fraction qui n'est pas irréductible est comptée fausse (« Presque ! »).
- **Additionner et soustraire** : environ 4 soustractions sur 10 donnent un résultat négatif. Le signe − est accepté
  devant la fraction, au numérateur (−7/12) ou au dénominateur (7/−12). Un résultat juste mais non simplifié
  est compté juste, avec un conseil pour le simplifier.

---

## Modifier le site plus tard

### Mise à jour de novembre 2026 (portail par niveau, jeu, nouvelles classes, changer d'élève)

Cette mise à jour touche le site **et** le script Google (le jeu enregistre ses scores dans un nouvel onglet « Jeu » du tableur).

1. **GitHub** : déposez `app.js`, `app.css`, `themes.js`, `LISEZMOI.md` et le dossier `apps-script`
   (**Add file > Upload files**, puis **Commit changes**). Ne déposez pas `config.js` : votre version contient l'adresse de votre script.
2. **Classes** : sur GitHub, cliquez sur `config.js`, puis sur le crayon ✏️ en haut à droite du fichier. Remplacez la ligne `classes: …` par :
   ```js
   classes: ['4e 1', '4e 2', '4e 3', '4e 4', '4e 5', '4e 6', '4e 7', '3e 1', '3e 2', '3e 3', '3e 4', '3e 5', '3e 6', '3e 7'],
   ```
   puis cliquez sur **Commit changes…** (deux fois).
3. **Script Google** (fenêtre privée, compte Maths) : ouvrez le tableur, puis **Extensions > Apps Script**.
   Effacez tout le code, collez le nouveau `apps-script/Code.gs`, **remettez votre code** à la ligne `CODE_PROF`, enregistrez.
   Puis **Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer**. L'adresse ne change pas.
4. Testez : une série jusqu'au bout, une partie du jeu, puis l'onglet **Jeu** de la page professeur.

### Mise à jour de novembre (2) : un score de jeu par élève, tri et suppression groupée

Cette mise à jour touche le **site** et le **script Google**.
1. **GitHub** : déposez `app.js`, `app.css`, `index.html`, `LISEZMOI.md`, puis le nouveau `Code.gs` dans le dossier `apps-script`
   (copie de rangement, **sans** votre code professeur).
2. **Script Google** (fenêtre privée, compte **Maths**) : ouvrez le tableur, puis **Extensions > Apps Script**.
   **Notez votre code professeur** (ligne `CODE_PROF`), puis Ctrl + A, Suppr, et collez le nouveau `apps-script/Code.gs`.
   Remettez votre code entre les guillemets, **enregistrez**, puis
   **Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer**.
3. Ouvrez l'**espace professeur** : les anciennes parties en double de l'onglet « Jeu » sont nettoyées automatiquement
   (une seule ligne par élève et par mode, la meilleure).

### Marche à suivre habituelle

Depuis la mise à jour « Pythagore », chaque envoi de fichiers comprend aussi `index.html` : il contient un **numéro de version**
qui oblige les navigateurs à charger tout de suite les nouveaux fichiers (plus besoin de Ctrl + F5 ni d'attendre).

Pour toute modification, la marche à suivre est la même :
1. Claude vous fournit le ou les fichiers modifiés.
2. Sur GitHub, ouvrez votre dépôt, cliquez sur **Add file > Upload files** et déposez ces fichiers.
   Ils remplacent les anciens, qui portent le même nom.
3. Cliquez sur **Commit changes**. Le site est à jour en une ou deux minutes.
   Sur tablette, rechargez la page si l'ancienne version s'affiche encore.

**Ajouter un exerciseur en cours d'année.** Donnez à Claude votre fiche de cours ou d'exercices, en précisant la classe.
Claude ajoute un bloc dans `themes.js` et le teste, puis vous déposez le nouveau `themes.js`, et parfois aussi `app.js`.
Le portail, la page professeur et le tableur prennent le nouvel exerciseur en compte automatiquement.
Les scores déjà enregistrés sont conservés.

**Changer l'apparence.** Les couleurs, les polices et les arrondis sont réglés en haut du fichier `app.css`.
Changer l'apparence ne touche ni aux exercices ni aux résultats.

**Plus simple encore** : si vous reliez votre dépôt GitHub à Claude Code, Claude peut publier lui-même les modifications,
et vous n'avez plus de fichier à déposer.

**Ne modifiez pas** l'adresse du script dans `config.js` ni le nom du dépôt sans raison : le site cesserait d'envoyer
les résultats, ou son adresse changerait pour les élèves.

---

## Données personnelles (RGPD)

- Seules ces données sont collectées : prénom, classe, exerciseur, niveau, score, durée et détail juste/faux par question,
  ainsi que les scores du jeu. Le classement du jeu affiche le prénom et la classe des 3 meilleurs à tous les élèves du collège.
  Il n'y a ni compte élève, ni e-mail, ni mot de passe.
- Elles sont stockées dans **votre** Google Drive. Le site lui-même ne garde rien sur un serveur ;
  seul le meilleur score de l'élève est gardé sur son propre appareil.
- Informez votre chef d'établissement (et le DPO académique si votre académie le demande), ainsi que les familles :
  la page `familles.html` (lien en bas de chaque page) leur explique tout, avec le contact « Collège Louis-Aragon — le professeur de mathématiques, par la messagerie de l'ENT ».
- Videz le tableur en fin d'année scolaire.
- Le site ne charge aucune police ni aucun service externe : seul l'envoi des résultats passe par Google.

## Limites à connaître

- Si le navigateur refuse la mémoire de l'appareil (navigation privée, navigateur intégré à l'ENT…), le site garde le prénom et la classe tant que la page reste ouverte ; il faudra les redonner seulement après avoir fermé ou rechargé la page.

- Il n'y a pas d'authentification élève : un élève peut taper le prénom d'un autre. L'outil sert l'entraînement, pas l'évaluation notée.
- Le code professeur se trouve dans le script Google, pas dans le site : les élèves ne peuvent pas le lire.

## En cas de problème

| Ce que vous voyez | Que faire |
|---|---|
| Bandeau « Mode démonstration » | `urlScript` est vide dans `config.js`, ou l'ancien `config.js` est encore en ligne. Vérifiez l'étape 2 et redéposez le fichier. |
| « Pas de connexion : ton résultat sera envoyé… » alors qu'Internet fonctionne | L'adresse `urlScript` est incorrecte, ou le script n'est pas déployé avec l'accès « Tout le monde ». Refaites l'étape 1, points 7 à 9. |
| « Code incorrect » dans la page professeur | Le code tapé ne correspond pas à `CODE_PROF`. Si vous avez changé le code, redéployez une nouvelle version (encadré de l'étape 1). |
| « Choisissez un code professeur… » dans la page professeur | Les guillemets de la ligne `CODE_PROF` sont vides (ou le code fait moins de 4 caractères). Tapez votre code, puis redéployez une nouvelle version (encadré de l'étape 1). |
| Page GitHub vide ou erreur 404 | Vérifiez que `index.html` est à la racine du dépôt et non dans un sous-dossier, et que GitHub Pages est activé (étape 3, point 6). |
