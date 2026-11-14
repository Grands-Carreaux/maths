/* =====================================================================
   RÉGLAGES DU SITE — c'est le seul fichier à modifier.
   ===================================================================== */
window.CONFIG = {
  // Nom affiché en haut du portail.
  nomSite: 'Maths DR',

  // Adresse de l'application Web Google Apps Script (voir LISEZMOI.md, étape 1).
  // Tant qu'elle est vide, le site fonctionne en mode démonstration :
  // les élèves s'entraînent, mais les résultats ne vous sont pas envoyés.
  urlScript: 'https://script.google.com/macros/s/AKfycbzJlK1s6puWUZmBTySb0M-TP7gFiyI47KPXLd8MoUooZI_RBCHdjOTDPbS-oWAberdhUw/exec',

  // Liste de vos classes, proposée aux élèves dans un menu déroulant.
  // Laissez la liste vide [] pour que les élèves tapent leur classe librement.
  classes: ['4e 1', '4e 2', '4e 3', '4e 4', '4e 5', '4e 6', '4e 7', '3e 1', '3e 2', '3e 3', '3e 4', '3e 5', '3e 6', '3e 7'],

  // Nombre de questions par série.
  nbQuestions: 10
};
