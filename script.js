/* ============================================================
DÉLICES MAISON — script.js
Version propre et stable
- Ajout massif de recettes
- Préserve les recettes déjà enregistrées par l'utilisateur
- Garde favoris / recherche / lexique / édition / suppression
============================================================ */

// ============================================================
// CATÉGORIES
// ============================================================
const CATEGORIES = {
  plats: {
    label: "🍽️ Plats",
    emoji: "🍽️",
    cls: "cat-plats",
    ph: "placeholder-plats"
  },
  desserts: {
    label: "🍰 Desserts",
    emoji: "🍰",
    cls: "cat-desserts",
    ph: "placeholder-desserts"
  },
  patisserie: {
    label: "🥐 Pâtisserie",
    emoji: "🥐",
    cls: "cat-patisserie",
    ph: "placeholder-patisserie"
  },
  gouter: {
    label: "🧁 Goûter",
    emoji: "🧁",
    cls: "cat-gouter",
    ph: "placeholder-gouter"
  },
  boissons: {
    label: "🥤 Boissons",
    emoji: "🥤",
    cls: "cat-boissons",
    ph: "placeholder-boissons"
  },
  rapide: {
    label: "⚡ Rapide",
    emoji: "⚡",
    cls: "cat-rapide",
    ph: "placeholder-rapide"
  },
  famille: {
    label: "👨‍👩‍👧 Famille",
    emoji: "👨‍👩‍👧",
    cls: "cat-famille",
    ph: "placeholder-famille"
  },
  senegalaise: {
    label: "🌍 Sénégalaise",
    emoji: "🌍",
    cls: "cat-senegalaise",
    ph: "placeholder-senegalaise"
  }
};

// ============================================================
// ÉTAT GLOBAL
// ============================================================
let db = null;
let currentView = "home";
let prevView = null;
let editingId = null;
let pendingDeleteId = null;
let lexiqueFilter = "all";

// ============================================================
// UTILITAIRES
// ============================================================
function qs(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function totalTime(recipe) {
  return Number(recipe.tempsPrep || 0) + Number(recipe.tempsCuisson || 0);
}

function difficultyLabel(diff) {
  return {
    facile: "😊 Facile",
    moyen: "😐 Moyen",
    difficile: "😤 Difficile"
  }[diff] || "😊 Facile";
}

function difficultyClass(diff) {
  return {
    facile: "diff-facile",
    moyen: "diff-moyen",
    difficile: "diff-difficile"
  }[diff] || "diff-facile";
}

function tagLabel(tag) {
  return {
    rapide: "⚡ Rapide",
    economique: "💰 Économique",
    famille: "👨‍👩‍👧 Famille",
    fete: "🎉 Fête",
    healthy: "🥗 Healthy",
    enfants: "👶 Enfants"
  }[tag] || tag;
}

function getCategoryInfo(key) {
  return CATEGORIES[key] || {
    label: "🍴 Autre",
    emoji: "🍴",
    cls: "cat-all",
    ph: "placeholder-default"
  };
}

// ============================================================
// INDEXEDDB
// ============================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("DelicesMaison", 2);

    req.onupgradeneeded = (e) => {
      const database = e.target.result;

      if (!database.objectStoreNames.contains("recettes")) {
        const store = database.createObjectStore("recettes", { keyPath: "id" });
        store.createIndex("categorie", "categorie", { unique: false });
        store.createIndex("favori", "favori", { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function dbGetAll() {
  return new Promise((resolve, reject) => {
    const req = db.transaction("recettes", "readonly").objectStore("recettes").getAll();
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

function dbGet(id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction("recettes", "readonly").objectStore("recettes").get(id);
    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

function dbPut(recipe) {
  return new Promise((resolve, reject) => {
    const req = db.transaction("recettes", "readwrite").objectStore("recettes").put(recipe);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

function dbDelete(id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction("recettes", "readwrite").objectStore("recettes").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

// ============================================================
// DONNÉES RECETTES
// ============================================================
const RECETTES_SAMPLE = [
  {
    id: 1001,
    titre: "Bœuf Bourguignon",
    categorie: "plats",
    tempsPrep: 30,
    tempsCuisson: 180,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "1.5 kg de bœuf (paleron ou gîte)",
      "200 g de lardons fumés",
      "1 bouteille de vin rouge",
      "3 carottes",
      "2 oignons",
      "3 gousses d'ail",
      "200 g de champignons de Paris",
      "2 c.s de farine",
      "1 bouquet garni",
      "Huile, sel, poivre"
    ],
    etapes: [
      "Couper le bœuf en gros cubes. Faire revenir les lardons dans une cocotte.",
      "Saisir la viande dans la même cocotte pour bien la dorer.",
      "Ajouter les légumes émincés et faire suer 5 minutes.",
      "Saupoudrer de farine, mélanger, puis verser le vin.",
      "Ajouter le bouquet garni, saler, poivrer et mijoter 2 h 30.",
      "Ajouter les champignons 30 minutes avant la fin."
    ],
    tags: ["famille", "fete"],
    notePerso: "Le lendemain, c'est encore meilleur.",
    favori: true,
    dateAjout: 1001
  },
  {
    id: 1002,
    titre: "Quiche Lorraine",
    categorie: "plats",
    tempsPrep: 20,
    tempsCuisson: 40,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "1 pâte brisée",
      "200 g de lardons",
      "3 œufs",
      "25 cl de crème fraîche",
      "25 cl de lait",
      "100 g de gruyère râpé",
      "Noix de muscade, sel, poivre"
    ],
    etapes: [
      "Préchauffer le four à 180°C.",
      "Faire revenir les lardons puis les égoutter.",
      "Mélanger œufs, crème, lait, sel, poivre et muscade.",
      "Répartir les lardons sur la pâte.",
      "Verser l'appareil, ajouter le gruyère et cuire 40 minutes."
    ],
    tags: ["famille", "rapide"],
    notePerso: "Très bonne avec une salade verte.",
    favori: false,
    dateAjout: 1002
  },
  {
    id: 1003,
    titre: "Ratatouille Provençale",
    categorie: "plats",
    tempsPrep: 25,
    tempsCuisson: 60,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "2 courgettes",
      "2 aubergines",
      "4 tomates",
      "2 poivrons",
      "2 oignons",
      "4 gousses d'ail",
      "Huile d'olive, thym, basilic, laurier"
    ],
    etapes: [
      "Couper tous les légumes en cubes.",
      "Faire revenir les oignons et l'ail dans l'huile d'olive.",
      "Ajouter les poivrons, puis les aubergines, puis les courgettes.",
      "Terminer par les tomates et les herbes.",
      "Laisser mijoter 45 minutes à feu doux."
    ],
    tags: ["healthy", "famille"],
    notePerso: "Très bonne chaude ou froide.",
    favori: false,
    dateAjout: 1003
  },
  {
    id: 1004,
    titre: "Soupe à l'Oignon Gratinée",
    categorie: "plats",
    tempsPrep: 15,
    tempsCuisson: 60,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "6 gros oignons",
      "50 g de beurre",
      "2 c.s de farine",
      "1.5 L de bouillon",
      "20 cl de vin blanc",
      "Pain de campagne",
      "Gruyère râpé"
    ],
    etapes: [
      "Émincer les oignons et les caraméliser doucement.",
      "Ajouter la farine puis le vin blanc.",
      "Verser le bouillon et mijoter 20 minutes.",
      "Verser dans des bols, ajouter pain et fromage.",
      "Passer sous le gril quelques minutes."
    ],
    tags: ["famille"],
    notePerso: "Le secret, c'est la caramélisation des oignons.",
    favori: false,
    dateAjout: 1004
  },
  {
    id: 1005,
    titre: "Blanquette de Veau",
    categorie: "plats",
    tempsPrep: 20,
    tempsCuisson: 90,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "1.5 kg de veau",
      "3 carottes",
      "2 poireaux",
      "1 oignon",
      "200 g de champignons",
      "40 g de beurre",
      "40 g de farine",
      "30 cl de crème fraîche",
      "2 jaunes d'œufs"
    ],
    etapes: [
      "Cuire la viande avec les légumes dans de l'eau froide salée.",
      "Récupérer une partie du bouillon.",
      "Faire un roux avec beurre et farine.",
      "Ajouter progressivement le bouillon.",
      "Finir avec crème, jaunes d'œufs et citron.",
      "Servir avec du riz."
    ],
    tags: ["famille", "fete"],
    notePerso: "Ne pas faire bouillir après les jaunes d'œufs.",
    favori: false,
    dateAjout: 1005
  },
  {
    id: 1006,
    titre: "Gratin Dauphinois",
    categorie: "plats",
    tempsPrep: 20,
    tempsCuisson: 75,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "1.5 kg de pommes de terre",
      "50 cl de crème liquide",
      "50 cl de lait",
      "2 gousses d'ail",
      "Noix de muscade",
      "Sel, poivre"
    ],
    etapes: [
      "Éplucher et couper les pommes de terre finement.",
      "Frotter le plat avec l'ail puis le beurrer.",
      "Chauffer lait et crème avec assaisonnement.",
      "Monter le gratin dans le plat.",
      "Verser le mélange et cuire 1 h 15 à 160°C."
    ],
    tags: ["famille"],
    notePerso: "Ne pas rincer les pommes de terre.",
    favori: true,
    dateAjout: 1006
  },
  {
    id: 1007,
    titre: "Pot-au-Feu",
    categorie: "famille",
    tempsPrep: 20,
    tempsCuisson: 180,
    portions: 8,
    difficulte: "facile",
    ingredients: [
      "1.5 kg de viande de bœuf à pot-au-feu",
      "6 carottes",
      "4 navets",
      "4 poireaux",
      "2 oignons",
      "1 bouquet garni",
      "Gros sel, poivre"
    ],
    etapes: [
      "Mettre la viande dans l'eau froide et porter à ébullition.",
      "Écumer soigneusement.",
      "Ajouter les aromates et cuire 2 heures.",
      "Ajouter les légumes et poursuivre 1 heure.",
      "Servir avec moutarde et cornichons."
    ],
    tags: ["famille"],
    notePerso: "Le bouillon se garde très bien.",
    favori: false,
    dateAjout: 1007
  },
  {
    id: 1008,
    titre: "Coq au Vin",
    categorie: "plats",
    tempsPrep: 25,
    tempsCuisson: 90,
    portions: 4,
    difficulte: "moyen",
    ingredients: [
      "1 poulet découpé",
      "200 g de lardons",
      "200 g de champignons",
      "2 oignons",
      "75 cl de vin rouge",
      "2 c.s de farine",
      "Beurre, sel, poivre"
    ],
    etapes: [
      "Faire dorer le poulet.",
      "Faire revenir lardons et oignons.",
      "Remettre le poulet et ajouter la farine.",
      "Verser le vin, ajouter ail et bouquet garni.",
      "Mijoter 1 heure et ajouter les champignons à la fin."
    ],
    tags: ["famille", "fete"],
    notePerso: "Très bon avec des pommes de terre vapeur.",
    favori: false,
    dateAjout: 1008
  },
  {
    id: 1009,
    titre: "Cassoulet Toulousain",
    categorie: "famille",
    tempsPrep: 30,
    tempsCuisson: 180,
    portions: 8,
    difficulte: "difficile",
    ingredients: [
      "500 g de haricots blancs secs",
      "4 cuisses de canard confites",
      "400 g de saucisses de Toulouse",
      "200 g de poitrine de porc",
      "4 tomates pelées",
      "4 gousses d'ail",
      "2 oignons"
    ],
    etapes: [
      "Cuire les haricots.",
      "Faire revenir viande et aromates.",
      "Ajouter tomates et haricots.",
      "Mijoter 1 heure.",
      "Ajouter confit et saucisses.",
      "Passer au four avec un peu de chapelure."
    ],
    tags: ["famille"],
    notePerso: "Encore meilleur réchauffé.",
    favori: false,
    dateAjout: 1009
  },
  {
    id: 1010,
    titre: "Crème Brûlée à la Vanille",
    categorie: "desserts",
    tempsPrep: 20,
    tempsCuisson: 40,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "6 jaunes d'œufs",
      "80 g de sucre",
      "50 cl de crème liquide entière",
      "2 gousses de vanille",
      "Sucre roux"
    ],
    etapes: [
      "Chauffer la crème avec la vanille.",
      "Fouetter jaunes et sucre.",
      "Verser la crème chaude dessus.",
      "Remplir les ramequins.",
      "Cuire au bain-marie.",
      "Réfrigérer puis caraméliser."
    ],
    tags: ["fete"],
    notePerso: "Le caramel doit être fin et craquant.",
    favori: true,
    dateAjout: 1010
  },
  {
    id: 1011,
    titre: "Île Flottante",
    categorie: "desserts",
    tempsPrep: 25,
    tempsCuisson: 15,
    portions: 4,
    difficulte: "moyen",
    ingredients: [
      "4 blancs d'œufs",
      "4 jaunes d'œufs",
      "80 g de sucre",
      "50 cl de lait",
      "1 gousse de vanille"
    ],
    etapes: [
      "Préparer une crème anglaise.",
      "Monter les blancs en neige avec le sucre.",
      "Pocher les blancs dans du lait frémissant.",
      "Verser la crème dans des coupes.",
      "Déposer les blancs dessus et ajouter le caramel."
    ],
    tags: ["fete"],
    notePerso: "Très beau dessert à l'ancienne.",
    favori: false,
    dateAjout: 1011
  },
  {
    id: 1012,
    titre: "Madeleines au Beurre Noisette",
    categorie: "gouter",
    tempsPrep: 15,
    tempsCuisson: 12,
    portions: 24,
    difficulte: "facile",
    ingredients: [
      "3 œufs",
      "150 g de sucre",
      "180 g de farine",
      "1 sachet de levure",
      "150 g de beurre",
      "Zeste de citron"
    ],
    etapes: [
      "Faire un beurre noisette.",
      "Fouetter œufs et sucre.",
      "Ajouter farine et levure.",
      "Ajouter le beurre et le zeste.",
      "Laisser reposer la pâte 1 heure au frais.",
      "Cuire à four chaud."
    ],
    tags: ["enfants", "rapide"],
    notePerso: "Le repos au froid aide pour la bosse.",
    favori: false,
    dateAjout: 1012
  },
  {
    id: 1013,
    titre: "Tarte au Citron Meringuée",
    categorie: "patisserie",
    tempsPrep: 40,
    tempsCuisson: 35,
    portions: 8,
    difficulte: "difficile",
    ingredients: [
      "1 pâte sablée",
      "4 citrons",
      "3 œufs",
      "150 g de sucre",
      "80 g de beurre",
      "3 blancs d'œufs",
      "150 g de sucre pour la meringue"
    ],
    etapes: [
      "Cuire le fond de tarte à blanc.",
      "Préparer le lemon curd.",
      "Verser le curd sur le fond de tarte.",
      "Monter la meringue.",
      "Pocher la meringue et la dorer."
    ],
    tags: ["fete"],
    notePerso: "La meringue doit être bien brillante.",
    favori: true,
    dateAjout: 1013
  },
  {
    id: 1014,
    titre: "Financiers aux Amandes",
    categorie: "gouter",
    tempsPrep: 10,
    tempsCuisson: 15,
    portions: 12,
    difficulte: "facile",
    ingredients: [
      "100 g de poudre d'amandes",
      "180 g de sucre glace",
      "60 g de farine",
      "4 blancs d'œufs",
      "150 g de beurre"
    ],
    etapes: [
      "Faire un beurre noisette.",
      "Mélanger les poudres.",
      "Ajouter les blancs d'œufs non montés.",
      "Ajouter le beurre.",
      "Cuire dans des petits moules."
    ],
    tags: ["rapide", "enfants"],
    notePerso: "Très bons avec une framboise au centre.",
    favori: false,
    dateAjout: 1014
  },
  {
    id: 1015,
    titre: "Clafoutis aux Cerises",
    categorie: "desserts",
    tempsPrep: 15,
    tempsCuisson: 40,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "500 g de cerises",
      "3 œufs",
      "100 g de sucre",
      "100 g de farine",
      "30 cl de lait"
    ],
    etapes: [
      "Beurrer le moule.",
      "Répartir les cerises.",
      "Préparer la pâte.",
      "Verser sur les fruits.",
      "Cuire 40 minutes."
    ],
    tags: ["famille", "rapide"],
    notePerso: "Avec les noyaux, il a plus de goût.",
    favori: false,
    dateAjout: 1015
  },
  {
    id: 1016,
    titre: "Far Breton aux Pruneaux",
    categorie: "patisserie",
    tempsPrep: 10,
    tempsCuisson: 50,
    portions: 8,
    difficulte: "facile",
    ingredients: [
      "200 g de farine",
      "200 g de sucre",
      "4 œufs",
      "1 L de lait",
      "200 g de pruneaux"
    ],
    etapes: [
      "Faire macérer les pruneaux si besoin.",
      "Préparer la pâte.",
      "Verser dans un plat beurré.",
      "Ajouter les pruneaux.",
      "Cuire jusqu'à belle coloration."
    ],
    tags: ["famille"],
    notePerso: "À servir bien froid.",
    favori: false,
    dateAjout: 1016
  },
  {
    id: 1017,
    titre: "Soufflé au Chocolat",
    categorie: "desserts",
    tempsPrep: 20,
    tempsCuisson: 12,
    portions: 4,
    difficulte: "difficile",
    ingredients: [
      "200 g de chocolat noir",
      "4 jaunes d'œufs",
      "5 blancs d'œufs",
      "80 g de sucre",
      "30 g de beurre"
    ],
    etapes: [
      "Beurrer et sucrer les ramequins.",
      "Préparer la base chocolat.",
      "Monter les blancs en neige.",
      "Incorporer délicatement.",
      "Cuire immédiatement sans ouvrir le four."
    ],
    tags: ["fete"],
    notePerso: "À servir dès la sortie du four.",
    favori: false,
    dateAjout: 1017
  },
  {
    id: 1018,
    titre: "Pain Perdu à la Française",
    categorie: "gouter",
    tempsPrep: 10,
    tempsCuisson: 10,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "8 tranches de pain rassis",
      "3 œufs",
      "25 cl de lait",
      "50 g de sucre",
      "50 g de beurre"
    ],
    etapes: [
      "Mélanger œufs, lait et sucre.",
      "Tremper le pain.",
      "Faire dorer à la poêle dans le beurre.",
      "Servir chaud."
    ],
    tags: ["rapide", "enfants", "economique"],
    notePerso: "Parfait pour éviter le gaspillage.",
    favori: false,
    dateAjout: 1018
  },
  {
    id: 1019,
    titre: "Crêpes Bretonnes",
    categorie: "gouter",
    tempsPrep: 10,
    tempsCuisson: 20,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "250 g de farine",
      "3 œufs",
      "50 cl de lait",
      "25 g de beurre fondu",
      "1 pincée de sel"
    ],
    etapes: [
      "Mélanger farine et œufs.",
      "Ajouter le lait progressivement.",
      "Ajouter le beurre fondu.",
      "Laisser reposer.",
      "Cuire les crêpes à la poêle."
    ],
    tags: ["enfants", "famille", "rapide"],
    notePerso: "La pâte est meilleure après repos.",
    favori: false,
    dateAjout: 1019
  },
  {
    id: 1020,
    titre: "Tarte Tatin",
    categorie: "patisserie",
    tempsPrep: 30,
    tempsCuisson: 40,
    portions: 8,
    difficulte: "moyen",
    ingredients: [
      "1 pâte feuilletée",
      "6 pommes",
      "120 g de sucre",
      "60 g de beurre"
    ],
    etapes: [
      "Faire un caramel dans le moule.",
      "Ajouter les pommes.",
      "Couvrir de pâte.",
      "Cuire au four.",
      "Retourner dès la sortie."
    ],
    tags: ["fete"],
    notePerso: "Retourner tout de suite.",
    favori: false,
    dateAjout: 1020
  },
  {
    id: 1021,
    titre: "Mousse au Chocolat Noir",
    categorie: "desserts",
    tempsPrep: 20,
    tempsCuisson: 0,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "200 g de chocolat noir",
      "4 œufs",
      "40 g de sucre",
      "1 pincée de sel"
    ],
    etapes: [
      "Faire fondre le chocolat.",
      "Ajouter les jaunes.",
      "Monter les blancs en neige.",
      "Incorporer délicatement.",
      "Laisser prendre au frais."
    ],
    tags: ["rapide", "economique"],
    notePerso: "Un peu de fleur de sel, c'est top.",
    favori: true,
    dateAjout: 1021
  },
  {
    id: 1022,
    titre: "Croissants Feuilletés",
    categorie: "patisserie",
    tempsPrep: 180,
    tempsCuisson: 20,
    portions: 12,
    difficulte: "difficile",
    ingredients: [
      "500 g de farine T45",
      "280 ml de lait",
      "10 g de levure",
      "60 g de sucre",
      "10 g de sel",
      "250 g de beurre de tourage"
    ],
    etapes: [
      "Préparer la détrempe.",
      "Faire le tourage avec le beurre.",
      "Donner plusieurs tours.",
      "Abaisser, couper et rouler.",
      "Laisser pousser.",
      "Dorer et cuire."
    ],
    tags: ["fete"],
    notePerso: "Travail au froid obligatoire.",
    favori: false,
    dateAjout: 1022
  },
  {
    id: 1023,
    titre: "Limonade Maison à la Menthe",
    categorie: "boissons",
    tempsPrep: 10,
    tempsCuisson: 5,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "4 citrons",
      "1 litre d'eau gazeuse",
      "100 g de sucre",
      "Menthe fraîche",
      "Glaçons"
    ],
    etapes: [
      "Presser les citrons.",
      "Préparer un sirop rapide.",
      "Ajouter menthe et laisser infuser.",
      "Mélanger au jus de citron.",
      "Ajouter l'eau gazeuse au moment de servir."
    ],
    tags: ["rapide", "enfants", "healthy"],
    notePerso: "Super fraîche l'été.",
    favori: false,
    dateAjout: 1023
  },
  {
    id: 1024,
    titre: "Chocolat Chaud Viennois",
    categorie: "boissons",
    tempsPrep: 5,
    tempsCuisson: 10,
    portions: 2,
    difficulte: "facile",
    ingredients: [
      "50 cl de lait entier",
      "100 g de chocolat noir",
      "2 c.s de sucre",
      "Vanille",
      "Chantilly"
    ],
    etapes: [
      "Chauffer le lait.",
      "Ajouter le chocolat.",
      "Mélanger jusqu'à texture lisse.",
      "Servir avec chantilly."
    ],
    tags: ["enfants", "rapide", "economique"],
    notePerso: "Très bon avec du cacao sur la chantilly.",
    favori: false,
    dateAjout: 1024
  },
  {
    id: 1025,
    titre: "Hachis Parmentier",
    categorie: "famille",
    tempsPrep: 25,
    tempsCuisson: 35,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "700 g de viande hachée",
      "1 kg de pommes de terre",
      "1 oignon",
      "20 cl de lait",
      "Beurre",
      "Gruyère râpé"
    ],
    etapes: [
      "Préparer une purée maison.",
      "Faire revenir la viande avec l'oignon.",
      "Mettre la viande dans un plat.",
      "Couvrir de purée.",
      "Ajouter le fromage et gratiner."
    ],
    tags: ["famille"],
    notePerso: "Parfait pour les enfants.",
    favori: false,
    dateAjout: 1025
  },
  {
    id: 1026,
    titre: "Poulet Basquaise",
    categorie: "plats",
    tempsPrep: 20,
    tempsCuisson: 50,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "1 poulet découpé",
      "3 poivrons",
      "4 tomates",
      "2 oignons",
      "2 gousses d'ail",
      "Huile d'olive"
    ],
    etapes: [
      "Faire dorer le poulet.",
      "Faire revenir les légumes.",
      "Ajouter tomates et assaisonnement.",
      "Remettre le poulet.",
      "Laisser mijoter."
    ],
    tags: ["famille"],
    notePerso: "Très bon avec du riz.",
    favori: false,
    dateAjout: 1026
  },
  {
    id: 1027,
    titre: "Flan Pâtissier",
    categorie: "patisserie",
    tempsPrep: 20,
    tempsCuisson: 45,
    portions: 8,
    difficulte: "moyen",
    ingredients: [
      "1 pâte brisée",
      "1 L de lait",
      "4 œufs",
      "120 g de sucre",
      "90 g de maïzena",
      "Vanille"
    ],
    etapes: [
      "Préchauffer le four.",
      "Préparer l'appareil à flan.",
      "Verser sur la pâte.",
      "Cuire jusqu'à belle couleur."
    ],
    tags: ["famille"],
    notePerso: "À laisser refroidir complètement.",
    favori: false,
    dateAjout: 1027
  },
  {
    id: 1028,
    titre: "Gaufres Croustillantes",
    categorie: "gouter",
    tempsPrep: 15,
    tempsCuisson: 15,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "250 g de farine",
      "2 œufs",
      "40 cl de lait",
      "80 g de beurre fondu",
      "1 sachet de levure",
      "1 c.s de sucre"
    ],
    etapes: [
      "Préparer la pâte.",
      "Laisser reposer 20 minutes si possible.",
      "Cuire dans le gaufrier."
    ],
    tags: ["enfants", "rapide"],
    notePerso: "Très bonnes avec chocolat ou sucre.",
    favori: false,
    dateAjout: 1028
  },
  {
    id: 2001,
    titre: "Thiéboudienne (Riz au Poisson)",
    categorie: "senegalaise",
    tempsPrep: 45,
    tempsCuisson: 90,
    portions: 8,
    difficulte: "difficile",
    ingredients: [
      "1.5 kg de poisson",
      "500 g de riz brisé",
      "1 chou",
      "4 carottes",
      "2 aubergines",
      "4 tomates",
      "Concentré de tomates",
      "1 oignon",
      "Ail, persil, piment",
      "Huile d'arachide"
    ],
    etapes: [
      "Préparer la farce et farcir le poisson.",
      "Faire frire le poisson puis réserver.",
      "Préparer la base tomate.",
      "Ajouter légumes et bouillon.",
      "Retirer les légumes.",
      "Cuire le riz dans le bouillon restant."
    ],
    tags: ["famille"],
    notePerso: "Le netetou donne un goût authentique.",
    favori: true,
    dateAjout: 2001
  },
  {
    id: 2002,
    titre: "Yassa Poulet",
    categorie: "senegalaise",
    tempsPrep: 30,
    tempsCuisson: 60,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "1 poulet découpé",
      "6 gros oignons",
      "4 citrons",
      "4 gousses d'ail",
      "4 c.s de moutarde",
      "Huile, sel, poivre"
    ],
    etapes: [
      "Mariner le poulet avec citron, oignons, ail et moutarde.",
      "Griller ou dorer le poulet.",
      "Cuire longuement les oignons.",
      "Ajouter la marinade.",
      "Remettre le poulet et mijoter.",
      "Servir avec du riz blanc."
    ],
    tags: ["famille"],
    notePerso: "Les oignons doivent être bien fondants.",
    favori: true,
    dateAjout: 2002
  },
  {
    id: 2003,
    titre: "Mafé",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 90,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "800 g de viande",
      "300 g de pâte d'arachide",
      "Concentré de tomates",
      "2 oignons",
      "3 carottes",
      "Pommes de terre",
      "Patates douces"
    ],
    etapes: [
      "Faire revenir la viande et les oignons.",
      "Ajouter le concentré de tomates.",
      "Délayer la pâte d'arachide dans de l'eau chaude.",
      "Verser sur la viande.",
      "Ajouter les légumes.",
      "Mijoter longuement."
    ],
    tags: ["famille"],
    notePerso: "Remuer souvent pour éviter que ça colle.",
    favori: false,
    dateAjout: 2003
  },
  {
    id: 2004,
    titre: "Thiébou Yapp",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 90,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "600 g de viande",
      "500 g de riz brisé",
      "Tomates",
      "Oignons",
      "Carottes",
      "Navet",
      "Ail"
    ],
    etapes: [
      "Faire dorer la viande.",
      "Préparer la sauce tomate.",
      "Ajouter eau et légumes.",
      "Cuire jusqu'à viande tendre.",
      "Retirer viande et légumes.",
      "Cuire le riz dans le bouillon."
    ],
    tags: ["famille"],
    notePerso: "Version viande du thiéboudienne.",
    favori: false,
    dateAjout: 2004
  },
  {
    id: 2005,
    titre: "Domoda",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 75,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "700 g de poulet ou bœuf",
      "250 g de pâte d'arachide",
      "Concentré de tomates",
      "Oignons",
      "Carottes",
      "Pommes de terre"
    ],
    etapes: [
      "Faire revenir la viande et les oignons.",
      "Ajouter l'ail et la tomate.",
      "Verser la pâte d'arachide diluée.",
      "Ajouter légumes et assaisonnement.",
      "Mijoter à feu doux."
    ],
    tags: ["famille"],
    notePerso: "Très proche du mafé.",
    favori: false,
    dateAjout: 2005
  },
  {
    id: 2006,
    titre: "Caldou",
    categorie: "senegalaise",
    tempsPrep: 15,
    tempsCuisson: 30,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "600 g de poisson blanc",
      "2 oignons",
      "4 gousses d'ail",
      "1 citron",
      "Piment vert",
      "Huile"
    ],
    etapes: [
      "Assaisonner le poisson.",
      "Faire revenir les oignons.",
      "Ajouter ail, piment et eau.",
      "Plonger le poisson.",
      "Cuire 15 à 20 minutes.",
      "Servir avec du riz."
    ],
    tags: ["rapide", "healthy"],
    notePerso: "Léger et très parfumé.",
    favori: false,
    dateAjout: 2006
  },
  {
    id: 2007,
    titre: "Superkanja",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 60,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "500 g de gombo",
      "400 g de poisson fumé",
      "Crevettes séchées",
      "Oignons",
      "Ail",
      "Huile de palme ou d'arachide"
    ],
    etapes: [
      "Couper le gombo.",
      "Faire revenir oignons et ail.",
      "Ajouter poisson fumé et crevettes.",
      "Ajouter gombo et un peu d'eau.",
      "Mijoter jusqu'à épaississement."
    ],
    tags: ["famille"],
    notePerso: "La texture filante est normale.",
    favori: false,
    dateAjout: 2007
  },
  {
    id: 2008,
    titre: "Acara",
    categorie: "senegalaise",
    tempsPrep: 30,
    tempsCuisson: 15,
    portions: 4,
    difficulte: "moyen",
    ingredients: [
      "500 g de niébé",
      "1 oignon",
      "1 piment vert",
      "Sel",
      "Huile de friture"
    ],
    etapes: [
      "Tremper les haricots.",
      "Retirer les peaux.",
      "Mixer avec oignon et piment.",
      "Battre la pâte pour l'aérer.",
      "Frire en petites boules."
    ],
    tags: ["rapide", "economique"],
    notePerso: "Bien battre la pâte est essentiel.",
    favori: false,
    dateAjout: 2008
  },
  {
    id: 2009,
    titre: "Thiakry",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 10,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "500 g de thiakry",
      "1 litre de lait caillé ou yaourt",
      "100 g de sucre",
      "Vanille",
      "Noix de coco râpée"
    ],
    etapes: [
      "Cuire le thiakry à la vapeur.",
      "Laisser refroidir.",
      "Mélanger avec le lait fermenté.",
      "Ajouter sucre et vanille.",
      "Servir très frais."
    ],
    tags: ["enfants", "economique"],
    notePerso: "Très bon bien froid.",
    favori: false,
    dateAjout: 2009
  },
  {
    id: 2010,
    titre: "Ngalakh",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 15,
    portions: 8,
    difficulte: "moyen",
    ingredients: [
      "Farine de mil",
      "Pâte d'arachide",
      "Poudre de baobab",
      "Sucre",
      "Lait",
      "Eau de fleur d'oranger"
    ],
    etapes: [
      "Cuire la farine de mil comme une bouillie.",
      "Diluer la pâte d'arachide.",
      "Mélanger les deux.",
      "Ajouter baobab, sucre et lait.",
      "Servir froid."
    ],
    tags: ["fete"],
    notePerso: "Dessert emblématique de Pâques.",
    favori: false,
    dateAjout: 2010
  },
  {
    id: 2011,
    titre: "Bissap",
    categorie: "boissons",
    tempsPrep: 10,
    tempsCuisson: 15,
    portions: 8,
    difficulte: "facile",
    ingredients: [
      "200 g de fleurs d'hibiscus séchées",
      "1.5 litre d'eau",
      "150 g de sucre",
      "Menthe fraîche",
      "Citron"
    ],
    etapes: [
      "Faire bouillir l'eau.",
      "Ajouter les fleurs d'hibiscus.",
      "Laisser infuser.",
      "Filtrer puis sucrer.",
      "Servir frais."
    ],
    tags: ["rapide", "healthy", "enfants"],
    notePerso: "Belle couleur rouge naturelle.",
    favori: false,
    dateAjout: 2011
  },
  {
    id: 2012,
    titre: "Bouye",
    categorie: "boissons",
    tempsPrep: 10,
    tempsCuisson: 0,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "200 g de poudre de baobab",
      "1.5 litre d'eau froide",
      "100 g de sucre",
      "Lait optionnel"
    ],
    etapes: [
      "Délayer la poudre dans un peu d'eau.",
      "Ajouter le reste de l'eau.",
      "Sucrer.",
      "Réfrigérer avant de servir."
    ],
    tags: ["healthy", "rapide"],
    notePerso: "Goût légèrement acidulé.",
    favori: false,
    dateAjout: 2012
  },
  {
    id: 2013,
    titre: "Jus de Gingembre",
    categorie: "boissons",
    tempsPrep: 15,
    tempsCuisson: 10,
    portions: 8,
    difficulte: "facile",
    ingredients: [
      "300 g de gingembre frais",
      "1.5 litre d'eau",
      "200 g de sucre",
      "2 citrons",
      "Menthe"
    ],
    etapes: [
      "Râper le gingembre.",
      "Le faire bouillir.",
      "Laisser infuser.",
      "Filtrer.",
      "Ajouter sucre et citron.",
      "Servir bien froid."
    ],
    tags: ["healthy", "rapide"],
    notePerso: "Très tonique.",
    favori: false,
    dateAjout: 2013
  },
  {
    id: 2014,
    titre: "Thiou Poulet",
    categorie: "senegalaise",
    tempsPrep: 15,
    tempsCuisson: 50,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "600 g de poulet",
      "Concentré de tomates",
      "Tomates fraîches",
      "2 oignons",
      "3 gousses d'ail",
      "1 piment"
    ],
    etapes: [
      "Assaisonner le poulet.",
      "Le faire dorer.",
      "Préparer la sauce tomate.",
      "Remettre le poulet.",
      "Mijoter jusqu'à sauce épaisse."
    ],
    tags: ["famille", "rapide"],
    notePerso: "Base simple et délicieuse.",
    favori: false,
    dateAjout: 2014
  },
  {
    id: 2015,
    titre: "Pastels Sénégalais",
    categorie: "senegalaise",
    tempsPrep: 35,
    tempsCuisson: 15,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "Farine",
      "Eau",
      "Sel",
      "Poisson ou viande hachée",
      "Oignon",
      "Piment",
      "Huile de friture"
    ],
    etapes: [
      "Préparer une pâte souple.",
      "Préparer la farce.",
      "Former les pastels.",
      "Fermer soigneusement.",
      "Frire jusqu'à belle coloration."
    ],
    tags: ["fete", "famille"],
    notePerso: "Très bons avec une sauce tomate pimentée.",
    favori: false,
    dateAjout: 2015
  },
  {
    id: 2016,
    titre: "Fataya",
    categorie: "senegalaise",
    tempsPrep: 35,
    tempsCuisson: 15,
    portions: 6,
    difficulte: "moyen",
    ingredients: [
      "Farine",
      "Levure",
      "Viande hachée ou thon",
      "Oignon",
      "Poivron",
      "Huile"
    ],
    etapes: [
      "Préparer une pâte légèrement levée.",
      "Préparer la farce.",
      "Former des chaussons.",
      "Frire jusqu'à ce qu'ils soient dorés."
    ],
    tags: ["famille", "fete"],
    notePerso: "Parfait en entrée ou à partager.",
    favori: false,
    dateAjout: 2016
  },
  {
    id: 2017,
    titre: "Dibi",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 25,
    portions: 4,
    difficulte: "facile",
    ingredients: [
      "1 kg d'agneau ou mouton",
      "Sel",
      "Poivre",
      "Moutarde",
      "Oignons",
      "Citron"
    ],
    etapes: [
      "Assaisonner la viande.",
      "La griller au four ou sur braises.",
      "Servir avec oignons et moutarde."
    ],
    tags: ["rapide", "famille"],
    notePerso: "Simple et très savoureux.",
    favori: false,
    dateAjout: 2017
  },
  {
    id: 2018,
    titre: "Lakh",
    categorie: "senegalaise",
    tempsPrep: 20,
    tempsCuisson: 15,
    portions: 6,
    difficulte: "facile",
    ingredients: [
      "Lakh ou semoule de mil",
      "Lait caillé",
      "Sucre",
      "Vanille"
    ],
    etapes: [
      "Cuire le lakh.",
      "Le laisser tiédir.",
      "Ajouter le lait caillé et le sucre.",
      "Servir frais."
    ],
    tags: ["enfants", "economique"],
    notePerso: "Dessert doux et nourrissant.",
    favori: false,
    dateAjout: 2018
  }
];

// ============================================================
// LEXIQUE
// ============================================================
const LEXIQUE_CATEGORIES = [
  { id: "all", label: "Tout", icon: "📚" },
  { id: "tech", label: "Techniques", icon: "👩‍🍳" },
  { id: "patiss", label: "Pâtisserie", icon: "🧁" },
  { id: "viande", label: "Viandes", icon: "🥩" },
  { id: "sauce", label: "Sauces", icon: "🫕" },
  { id: "senega", label: "Sénégalais", icon: "🌍" },
  { id: "epices", label: "Épices", icon: "🌶️" },
  { id: "ustens", label: "Ustensiles", icon: "🔪" },
  { id: "france", label: "Termes français", icon: "🇫🇷" }
];

const LEXIQUE_DATA = [
  { terme: "Blanchir", cat: "tech", origine: "int", def: "Plonger un aliment quelques minutes dans l'eau bouillante puis le refroidir.", astuce: "Idéal pour garder une belle couleur aux légumes verts." },
  { terme: "Braiser", cat: "tech", origine: "fr", def: "Cuire doucement avec un peu de liquide, longtemps et couvert.", astuce: "Toujours faire dorer avant pour plus de goût." },
  { terme: "Déglacer", cat: "tech", origine: "fr", def: "Ajouter un liquide pour récupérer les sucs au fond de la casserole.", astuce: "Le bouillon ou le vin marchent très bien." },
  { terme: "Émincer", cat: "tech", origine: "fr", def: "Couper en fines tranches régulières.", astuce: "Un bon couteau change tout." },
  { terme: "Mijoter", cat: "tech", origine: "int", def: "Cuire lentement à petit feu.", astuce: "Parfait pour ragoûts et sauces." },
  { terme: "Pocher", cat: "tech", origine: "int", def: "Cuire dans un liquide frémissant sans forte ébullition.", astuce: "Très utile pour œufs, poissons, fruits." },

  { terme: "Foncer", cat: "patiss", origine: "fr", def: "Garnir un moule avec une pâte.", astuce: "Piquer le fond pour éviter les bosses." },
  { terme: "Cuire à blanc", cat: "patiss", origine: "fr", def: "Précuire une pâte seule avant garniture.", astuce: "Mettre du poids dessus avec des billes ou haricots." },
  { terme: "Abaisser", cat: "patiss", origine: "fr", def: "Étaler une pâte au rouleau.", astuce: "Fariner légèrement le plan de travail." },
  { terme: "Bain-marie", cat: "patiss", origine: "int", def: "Cuisson douce avec un récipient placé dans l'eau chaude.", astuce: "Très utile pour chocolat et crèmes." },
  { terme: "Ganache", cat: "patiss", origine: "fr", def: "Mélange de chocolat et de crème.", astuce: "Plus il y a de chocolat, plus elle sera ferme." },
  { terme: "Feuilletage", cat: "patiss", origine: "fr", def: "Technique de pâte en couches successives avec beurre.", astuce: "Toujours travailler au froid." },

  { terme: "Mariner", cat: "viande", origine: "int", def: "Laisser une viande ou un poisson dans un mélange parfumé avant cuisson.", astuce: "Toujours mariner au frais." },
  { terme: "Dorer", cat: "viande", origine: "fr", def: "Faire colorer un aliment à feu vif.", astuce: "Ne pas surcharger la poêle." },
  { terme: "Barder", cat: "viande", origine: "fr", def: "Entourer de lard pour protéger pendant la cuisson.", astuce: "Très utile pour les viandes maigres." },
  { terme: "Cuisson rosée", cat: "viande", origine: "fr", def: "Viande cuite mais encore rose au centre.", astuce: "Laisser reposer avant de couper." },

  { terme: "Béchamel", cat: "sauce", origine: "fr", def: "Sauce faite avec roux et lait.", astuce: "Ajouter le lait progressivement." },
  { terme: "Velouté", cat: "sauce", origine: "fr", def: "Sauce à base de bouillon lié avec un roux.", astuce: "La qualité du bouillon est essentielle." },
  { terme: "Mirepoix", cat: "sauce", origine: "fr", def: "Base de légumes coupés pour parfumer une cuisson.", astuce: "Souvent oignon, carotte, céleri." },
  { terme: "Brunoise", cat: "sauce", origine: "fr", def: "Découpe en tout petits dés.", astuce: "Très utile pour farces et garnitures." },

  { terme: "Thiéboudienne", cat: "senega", origine: "sn", def: "Plat national du Sénégal à base de riz, poisson et légumes.", astuce: "Le bouillon donne toute l'âme du plat." },
  { terme: "Yassa", cat: "senega", origine: "sn", def: "Préparation citronnée avec beaucoup d'oignons.", astuce: "Les oignons doivent cuire longtemps." },
  { terme: "Mafé", cat: "senega", origine: "sn", def: "Sauce à l'arachide très populaire.", astuce: "Remuer souvent pour éviter que ça colle." },
  { terme: "Netetou", cat: "senega", origine: "sn", def: "Condiment fermenté très parfumé.", astuce: "À utiliser en petite quantité." },
  { terme: "Bissap", cat: "senega", origine: "sn", def: "Boisson à base de fleurs d'hibiscus.", astuce: "Très bonne bien fraîche." },
  { terme: "Bouye", cat: "senega", origine: "sn", def: "Fruit du baobab utilisé en boisson ou dessert.", astuce: "Goût acidulé très agréable." },

  { terme: "Curcuma", cat: "epices", origine: "int", def: "Épice jaune orangée au goût doux et terreux.", astuce: "Se marie bien avec le poivre." },
  { terme: "Cumin", cat: "epices", origine: "int", def: "Épice chaude et parfumée.", astuce: "Encore meilleur légèrement torréfié." },
  { terme: "Coriandre", cat: "epices", origine: "int", def: "Herbe ou graines très utilisées en cuisine.", astuce: "Les feuilles et les graines n'ont pas exactement le même goût." },
  { terme: "Bouquet garni", cat: "epices", origine: "fr", def: "Assemblage d'herbes aromatiques.", astuce: "À retirer avant de servir." },

  { terme: "Maryse", cat: "ustens", origine: "fr", def: "Spatule souple pour racler et mélanger délicatement.", astuce: "Indispensable pour mousses et gâteaux." },
  { terme: "Mandoline", cat: "ustens", origine: "fr", def: "Outil pour couper finement et régulièrement.", astuce: "Toujours utiliser la protection pour les doigts." },
  { terme: "Chinois", cat: "ustens", origine: "fr", def: "Passoire fine pour filtrer sauces et bouillons.", astuce: "Donne une texture plus lisse." },
  { terme: "Chalumeau", cat: "ustens", origine: "int", def: "Petit brûleur pour caraméliser ou dorer.", astuce: "Faire des mouvements réguliers." },

  { terme: "Mise en place", cat: "france", origine: "fr", def: "Préparer tous les ingrédients avant de cuisiner.", astuce: "Tu gagnes du temps et tu stresses moins." },
  { terme: "Gratiner", cat: "france", origine: "fr", def: "Faire dorer le dessus d'un plat.", astuce: "Surveiller de très près." },
  { terme: "Confit", cat: "france", origine: "fr", def: "Cuisson lente dans graisse ou sucre pour conserver.", astuce: "Toujours à feu doux." },
  { terme: "Coulis", cat: "france", origine: "fr", def: "Préparation lisse de fruits ou légumes mixés.", astuce: "Très bien pour desserts et assiettes." }
];

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(view, param = null) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));

  const navBtn = qs("nav-" + view);
  if (navBtn) navBtn.classList.add("active");

  const brand = qs("headerBrand");
  const back = qs("btnBack");
  const pageTitle = qs("headerTitle");
  const isSubView = ["recipe", "add", "category"].includes(view);

  if (brand) brand.classList.toggle("hidden", isSubView);
  if (pageTitle) pageTitle.classList.toggle("hidden", !isSubView);
  if (back) back.classList.toggle("hidden", !isSubView);

  prevView = currentView;
  currentView = view;

  if (view === "home") {
    qs("viewHome")?.classList.add("active");
    renderHome();
  } else if (view === "recipe") {
    qs("viewRecipe")?.classList.add("active");
    if (pageTitle) pageTitle.textContent = "Recette";
    renderRecipeDetail(param);
  } else if (view === "add") {
    qs("viewAdd")?.classList.add("active");
    if (pageTitle) pageTitle.textContent = editingId ? "Modifier" : "Nouvelle recette";
    if (!editingId) resetForm();
  } else if (view === "favorites") {
    qs("viewFavorites")?.classList.add("active");
    renderFavorites();
  } else if (view === "search") {
    qs("viewSearch")?.classList.add("active");
    setTimeout(() => qs("searchInput")?.focus(), 100);
  } else if (view === "category") {
    qs("viewCategory")?.classList.add("active");
    renderCategoryView(param);
  } else if (view === "lexique") {
    qs("viewLexique")?.classList.add("active");
    renderLexique();
  }

  window.scrollTo(0, 0);
}

function goBack() {
  editingId = null;
  navigateTo(prevView || "home");
}

// ============================================================
// RENDU CATÉGORIES
// ============================================================
async function renderCategories(recettes) {
  const scroll = qs("categoriesScroll");
  if (!scroll) return;

  const counts = {};
  recettes.forEach((r) => {
    counts[r.categorie] = (counts[r.categorie] || 0) + 1;
  });

  let html = `
    <div class="cat-card cat-all" onclick="navigateTo('home')">
      <span class="cat-emoji">🍴</span>
      <span class="cat-name">Tout</span>
      <span class="cat-count">${recettes.length}</span>
    </div>
  `;

  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    html += `
      <div class="cat-card ${cat.cls}" onclick="navigateTo('category','${key}')">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${escapeHtml(cat.label.replace(/^\S+\s/, ""))}</span>
        <span class="cat-count">${counts[key] || 0}</span>
      </div>
    `;
  });

  scroll.innerHTML = html;
}

// ============================================================
// RENDU CARTES RECETTES
// ============================================================
function recipeCardHTML(r) {
  const cat = getCategoryInfo(r.categorie);
  const imageHtml = r.image
    ? `<img class="card-img" src="${escapeHtml(r.image)}" alt="${escapeHtml(r.titre)}" loading="lazy">`
    : `<div class="card-img-placeholder ${cat.ph}">${cat.emoji}</div>`;

  const favIcon = r.favori ? "❤️" : "🤍";
  const temps = totalTime(r);

  return `
    <div class="recipe-card" onclick="navigateTo('recipe', ${Number(r.id)})">
      <button class="card-fav-btn" onclick="event.stopPropagation(); toggleFavorite(${Number(r.id)})">${favIcon}</button>
      ${imageHtml}
      <div class="card-body">
        <div class="card-title">${escapeHtml(r.titre)}</div>
        <div class="card-meta">
          ${temps > 0 ? `<span class="card-meta-item">⏱️ ${temps} min</span>` : ""}
          ${r.portions ? `<span class="card-meta-item">👥 ${Number(r.portions)} pers.</span>` : ""}
        </div>
        <span class="card-diff ${difficultyClass(r.difficulte)}">${difficultyLabel(r.difficulte)}</span>
      </div>
    </div>
  `;
}

// ============================================================
// RENDU ACCUEIL
// ============================================================
async function renderHome() {
  const recettes = await dbGetAll();
  const count = qs("recipeCount");
  const grid = qs("recipesGrid");

  if (count) {
    count.textContent = `${recettes.length} recette${recettes.length > 1 ? "s" : ""}`;
  }

  await renderCategories(recettes);

  if (!grid) return;

  if (!recettes.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🥄</div>
        <p>Aucune recette pour l'instant</p>
        <button class="btn-primary" onclick="navigateTo('add')">Ajouter ma première recette</button>
      </div>
    `;
    return;
  }

  const sorted = [...recettes].sort((a, b) => Number(b.dateAjout || 0) - Number(a.dateAjout || 0));
  grid.innerHTML = sorted.map(recipeCardHTML).join("");
}

// ============================================================
// RENDU VUE CATÉGORIE
// ============================================================
async function renderCategoryView(categorie) {
  const recettes = await dbGetAll();
  const filtered = recettes.filter((r) => r.categorie === categorie);
  const cat = getCategoryInfo(categorie);

  const title1 = qs("categoryViewTitle");
  const title2 = qs("headerTitle");
  const count = qs("categoryCount");
  const grid = qs("categoryGrid");

  if (title1) title1.textContent = cat.label;
  if (title2) title2.textContent = cat.label;
  if (count) count.textContent = `${filtered.length} recette${filtered.length > 1 ? "s" : ""}`;

  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${cat.emoji}</div>
        <p>Aucune recette dans cette catégorie</p>
        <button class="btn-primary" onclick="navigateTo('add')">Ajouter une recette</button>
      </div>
    `;
    return;
  }

  const sorted = [...filtered].sort((a, b) => Number(b.dateAjout || 0) - Number(a.dateAjout || 0));
  grid.innerHTML = sorted.map(recipeCardHTML).join("");
}

// ============================================================
// FICHE RECETTE
// ============================================================
async function renderRecipeDetail(id) {
  const recipe = await dbGet(Number(id));
  if (!recipe) {
    navigateTo("home");
    return;
  }

  const cat = getCategoryInfo(recipe.categorie);
  const detail = qs("recipeDetail");
  const headerTitle = qs("headerTitle");
  if (headerTitle) headerTitle.textContent = recipe.titre;

  if (!detail) return;

  const imageHtml = recipe.image
    ? `<img class="recipe-hero" src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.titre)}">`
    : `<div class="recipe-hero-placeholder ${cat.ph}">${cat.emoji}</div>`;

  const tags = safeArray(recipe.tags).length
    ? `
      <div class="recipe-tags">
        ${safeArray(recipe.tags).map((t) => `<span class="tag-chip">${escapeHtml(tagLabel(t))}</span>`).join("")}
      </div>
    `
    : "";

  const ingredients = safeArray(recipe.ingredients).filter(Boolean).length
    ? `
      <div class="recipe-section-title">🛒 Ingrédients</div>
      ${safeArray(recipe.ingredients)
        .filter(Boolean)
        .map((item) => `<div class="ingredient-item">${escapeHtml(item)}</div>`)
        .join("")}
    `
    : "";

  const etapes = safeArray(recipe.etapes).filter(Boolean).length
    ? `
      <div class="recipe-section-title">👩‍🍳 Préparation</div>
      ${safeArray(recipe.etapes)
        .filter(Boolean)
        .map(
          (step, index) => `
            <div class="etape-item">
              <div class="etape-num">${index + 1}</div>
              <div class="etape-text">${escapeHtml(step)}</div>
            </div>
          `
        )
        .join("")}
    `
    : "";

  const note = recipe.notePerso
    ? `<div class="note-box">💡 ${escapeHtml(recipe.notePerso)}</div>`
    : "";

  detail.innerHTML = `
    ${imageHtml}
    <div class="recipe-body">
      <h2 class="recipe-name">${escapeHtml(recipe.titre)}</h2>

      <div class="recipe-stats">
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">${Number(recipe.tempsPrep || 0)}</div>
          <div class="stat-label">Prép.</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${Number(recipe.tempsCuisson || 0)}</div>
          <div class="stat-label">Cuisson</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${Number(recipe.portions || 0)}</div>
          <div class="stat-label">Portions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">${recipe.difficulte === "facile" ? "😊" : recipe.difficulte === "moyen" ? "😐" : "😤"}</div>
          <div class="stat-value">${escapeHtml(difficultyLabel(recipe.difficulte).replace(/^.\s/, ""))}</div>
          <div class="stat-label">Niveau</div>
        </div>
      </div>

      ${tags}
      ${ingredients}
      ${etapes}
      ${note}

      <div class="recipe-actions">
        <button class="btn-edit" onclick="startEdit(${Number(recipe.id)})">✏️ Modifier</button>
        <button class="btn-delete" onclick="confirmDelete(${Number(recipe.id)})" title="Supprimer">🗑️</button>
      </div>
    </div>
  `;
}

// ============================================================
// FAVORIS
// ============================================================
async function toggleFavorite(id) {
  const recipe = await dbGet(Number(id));
  if (!recipe) return;

  recipe.favori = !recipe.favori;
  await dbPut(recipe);

  showToast(recipe.favori ? "❤️ Ajouté aux favoris" : "💔 Retiré des favoris");

  if (currentView === "home") renderHome();
  if (currentView === "favorites") renderFavorites();
  if (currentView === "search") searchRecipes(qs("searchInput")?.value || "");
  if (currentView === "recipe") renderRecipeDetail(id);
  if (currentView === "category") {
    const currentTitle = qs("categoryViewTitle")?.textContent || "";
    const catKey = Object.keys(CATEGORIES).find((k) => CATEGORIES[k].label === currentTitle) || recipe.categorie;
    renderCategoryView(catKey);
  }
}

async function renderFavorites() {
  const recettes = await dbGetAll();
  const favs = recettes
    .filter((r) => r.favori)
    .sort((a, b) => Number(b.dateAjout || 0) - Number(a.dateAjout || 0));

  const grid = qs("favoritesGrid");
  if (!grid) return;

  if (!favs.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💔</div>
        <p>Aucune recette en favori</p>
        <p style="font-size:.82rem;color:var(--text-light)">Appuyez sur 🤍 pour ajouter</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = favs.map(recipeCardHTML).join("");
}

// ============================================================
// FORMULAIRE
// ============================================================
function resetForm() {
  editingId = null;

  const fieldsToClear = ["fId", "fTitre", "fPrep", "fCuisson", "fNote"];
  fieldsToClear.forEach((id) => {
    const el = qs(id);
    if (el) el.value = "";
  });

  if (qs("fCategorie")) qs("fCategorie").value = "";
  if (qs("fPortions")) qs("fPortions").value = "4";
  if (qs("fDifficulte")) qs("fDifficulte").value = "facile";

  if (qs("ingredientsList")) qs("ingredientsList").innerHTML = "";
  if (qs("etapesList")) qs("etapesList").innerHTML = "";

  const imagePreview = qs("imagePreview");
  if (imagePreview) {
    imagePreview.innerHTML = `
      <div class="image-placeholder">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>Ajouter une photo</span>
      </div>
    `;
  }

  document.querySelectorAll(".tag-btn").forEach((btn) => btn.classList.remove("selected"));

  if (qs("formTitle")) qs("formTitle").textContent = "✨ Nouvelle recette";

  addIngredient();
  addEtape();
}

async function startEdit(id) {
  editingId = Number(id);
  const recipe = await dbGet(Number(id));
  if (!recipe) return;

  navigateTo("add");

  if (qs("fId")) qs("fId").value = recipe.id;
  if (qs("fTitre")) qs("fTitre").value = recipe.titre || "";
  if (qs("fCategorie")) qs("fCategorie").value = recipe.categorie || "";
  if (qs("fPrep")) qs("fPrep").value = recipe.tempsPrep || "";
  if (qs("fCuisson")) qs("fCuisson").value = recipe.tempsCuisson || "";
  if (qs("fPortions")) qs("fPortions").value = recipe.portions || 4;
  if (qs("fDifficulte")) qs("fDifficulte").value = recipe.difficulte || "facile";
  if (qs("fNote")) qs("fNote").value = recipe.notePerso || "";

  if (qs("formTitle")) qs("formTitle").textContent = "✏️ Modifier la recette";
  if (qs("headerTitle")) qs("headerTitle").textContent = "Modifier";

  if (recipe.image && qs("imagePreview")) {
    qs("imagePreview").innerHTML = `<img src="${escapeHtml(recipe.image)}" alt="Photo recette" style="width:100%;height:100%;object-fit:cover">`;
  }

  if (qs("ingredientsList")) qs("ingredientsList").innerHTML = "";
  safeArray(recipe.ingredients).forEach((item) => addIngredient(item));
  if (!safeArray(recipe.ingredients).length) addIngredient();

  if (qs("etapesList")) qs("etapesList").innerHTML = "";
  safeArray(recipe.etapes).forEach((step) => addEtape(step));
  if (!safeArray(recipe.etapes).length) addEtape();

  document.querySelectorAll(".tag-btn").forEach((btn) => {
    btn.classList.toggle("selected", safeArray(recipe.tags).includes(btn.dataset.tag));
  });
}

async function saveRecipe() {
  const titre = qs("fTitre")?.value.trim() || "";
  const categorie = qs("fCategorie")?.value || "";

  if (!titre) {
    showToast("⚠️ Le titre est requis");
    return;
  }

  if (!categorie) {
    showToast("⚠️ Choisissez une catégorie");
    return;
  }

  const ingredients = Array.from(qs("ingredientsList")?.querySelectorAll("input") || [])
    .map((el) => el.value.trim())
    .filter(Boolean);

  const etapes = Array.from(qs("etapesList")?.querySelectorAll("textarea") || [])
    .map((el) => el.value.trim())
    .filter(Boolean);

  const tags = Array.from(document.querySelectorAll(".tag-btn.selected")).map((btn) => btn.dataset.tag);

  const imageEl = qs("imagePreview")?.querySelector("img");
  const image = imageEl ? imageEl.src : "";

  const idField = qs("fId")?.value || "";
  const id = idField ? Number(idField) : Date.now();

  let existing = null;
  if (idField) existing = await dbGet(Number(idField));

  await dbPut({
    id,
    titre,
    categorie,
    image,
    tempsPrep: Number(qs("fPrep")?.value || 0),
    tempsCuisson: Number(qs("fCuisson")?.value || 0),
    portions: Number(qs("fPortions")?.value || 4),
    difficulte: qs("fDifficulte")?.value || "facile",
    ingredients,
    etapes,
    tags,
    notePerso: qs("fNote")?.value.trim() || "",
    favori: existing ? !!existing.favori : false,
    dateAjout: existing ? existing.dateAjout : Date.now()
  });

  showToast("✅ Recette enregistrée");
  editingId = null;
  navigateTo("home");
}

function addIngredient(valeur = "") {
  const list = qs("ingredientsList");
  if (!list) return;

  const div = document.createElement("div");
  div.className = "dynamic-item";
  div.innerHTML = `
    <input type="text" placeholder="Ex : 200 g de farine..." value="${escapeHtml(valeur)}">
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">✕</button>
  `;
  list.appendChild(div);
}

function addEtape(valeur = "") {
  const list = qs("etapesList");
  if (!list) return;

  const index = list.children.length + 1;
  const div = document.createElement("div");
  div.className = "dynamic-item";
  div.innerHTML = `
    <div class="item-num">${index}</div>
    <textarea class="etape-textarea" placeholder="Décrire cette étape..." oninput="autoResize(this)">${escapeHtml(valeur)}</textarea>
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">✕</button>
  `;
  list.appendChild(div);
}

function removeItem(btn) {
  btn.closest(".dynamic-item")?.remove();
  document.querySelectorAll("#etapesList .item-num").forEach((el, index) => {
    el.textContent = index + 1;
  });
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function previewImage(input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = qs("imagePreview");
    if (!preview) return;
    preview.innerHTML = `<img src="${escapeHtml(e.target.result)}" alt="Prévisualisation" style="width:100%;height:100%;object-fit:cover">`;
  };
  reader.readAsDataURL(file);
}

// ============================================================
// SUPPRESSION
// ============================================================
function confirmDelete(id) {
  pendingDeleteId = Number(id);
  const modal = qs("modal");
  const confirmBtn = qs("modalConfirmBtn");

  if (modal) modal.classList.remove("hidden");

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (pendingDeleteId == null) return;
      await dbDelete(pendingDeleteId);
      closeModal();
      showToast("🗑️ Recette supprimée");
      navigateTo("home");
    };
  }
}

function closeModal() {
  const modal = qs("modal");
  if (modal) modal.classList.add("hidden");
  pendingDeleteId = null;
}

// ============================================================
// RECHERCHE
// ============================================================
async function searchRecipes(query) {
  const q = String(query || "").trim().toLowerCase();
  const header = qs("searchResultHeader");
  const title = qs("searchResultTitle");
  const grid = qs("searchGrid");
  const clearBtn = qs("btnClearSearch");

  if (clearBtn) clearBtn.classList.toggle("hidden", !q);

  if (!grid) return;

  if (!q) {
    if (header) header.style.display = "none";
    grid.innerHTML = `
      <div class="search-hint">
        <div class="empty-icon">🔍</div>
        <p>Tapez pour rechercher une recette</p>
      </div>
    `;
    return;
  }

  const all = await dbGetAll();

  const results = all.filter((r) => {
    const catLabel = getCategoryInfo(r.categorie).label.toLowerCase();
    return (
      String(r.titre || "").toLowerCase().includes(q) ||
      String(r.categorie || "").toLowerCase().includes(q) ||
      catLabel.includes(q) ||
      safeArray(r.ingredients).some((item) => String(item).toLowerCase().includes(q)) ||
      safeArray(r.tags).some((tag) => String(tag).toLowerCase().includes(q) || tagLabel(tag).toLowerCase().includes(q)) ||
      String(r.notePerso || "").toLowerCase().includes(q)
    );
  });

  if (header) header.style.display = "";
  if (title) title.textContent = `${results.length} résultat${results.length > 1 ? "s" : ""} pour "${query}"`;

  if (!results.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕵️</div>
        <p>Aucune recette pour "<strong>${escapeHtml(query)}</strong>"</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = results
    .sort((a, b) => Number(b.dateAjout || 0) - Number(a.dateAjout || 0))
    .map(recipeCardHTML)
    .join("");
}

function clearSearch() {
  const input = qs("searchInput");
  if (!input) return;
  input.value = "";
  searchRecipes("");
  input.focus();
}

// ============================================================
// LEXIQUE
// ============================================================
function renderLexique(filterCat = null, searchQuery = "") {
  if (filterCat !== null) lexiqueFilter = filterCat;

  const filtersEl = qs("lexiqueFilters");
  const content = qs("lexiqueContent");
  if (!filtersEl || !content) return;

  filtersEl.innerHTML = LEXIQUE_CATEGORIES.map((cat) => `
    <button class="lexique-filter-btn ${lexiqueFilter === cat.id ? "active" : ""}" onclick="renderLexique('${cat.id}', '${escapeHtml(searchQuery)}')">
      ${cat.icon} ${cat.label}
    </button>
  `).join("");

  let data = [...LEXIQUE_DATA];

  if (lexiqueFilter !== "all") {
    data = data.filter((entry) => entry.cat === lexiqueFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    data = data.filter((entry) =>
      entry.terme.toLowerCase().includes(q) ||
      entry.def.toLowerCase().includes(q) ||
      String(entry.astuce || "").toLowerCase().includes(q)
    );
  }

  if (!data.length) {
    content.innerHTML = `<div class="lexique-empty">🔍 Aucun terme trouvé pour cette recherche.</div>`;
    return;
  }

  const metaMap = {
    tech: { label: "Techniques de base", icon: "👩‍🍳", cls: "tech" },
    patiss: { label: "Pâtisserie", icon: "🧁", cls: "patiss" },
    viande: { label: "Viandes & découpes", icon: "🥩", cls: "viande" },
    sauce: { label: "Sauces & bases", icon: "🫕", cls: "sauce" },
    senega: { label: "Cuisine sénégalaise", icon: "🌍", cls: "senega" },
    epices: { label: "Épices & aromates", icon: "🌶️", cls: "epices" },
    ustens: { label: "Ustensiles", icon: "🔪", cls: "ustens" },
    france: { label: "Expressions françaises", icon: "🇫🇷", cls: "france" }
  };

  const groups = {};
  data.forEach((entry) => {
    if (!groups[entry.cat]) groups[entry.cat] = [];
    groups[entry.cat].push(entry);
  });

  let html = "";

  Object.entries(groups).forEach(([catKey, entries]) => {
    const meta = metaMap[catKey] || { label: catKey, icon: "📖", cls: "tech" };

    html += `
      <div class="lexique-section">
        <div class="lexique-section-title ${meta.cls}">
          ${meta.icon} ${meta.label}
          <span style="opacity:.7;font-size:.82rem;font-weight:400">(${entries.length})</span>
        </div>

        ${entries
          .sort((a, b) => a.terme.localeCompare(b.terme, "fr"))
          .map((entry) => {
            const originLabel =
              entry.origine === "fr"
                ? "🇫🇷 Fr"
                : entry.origine === "sn"
                ? "🌍 Sn"
                : "🌐 Int";

            const originClass =
              entry.origine === "fr"
                ? "origin-fr"
                : entry.origine === "sn"
                ? "origin-sn"
                : "origin-int";

            return `
              <div class="lexique-entry" onclick="toggleLexiqueEntry(this)">
                <div class="lexique-entry-header">
                  <div class="lexique-entry-term">${escapeHtml(entry.terme)}</div>
                  <div class="lexique-entry-origin ${originClass}">${originLabel}</div>
                  <div class="lexique-chevron">▼</div>
                </div>
                <div class="lexique-entry-body">
                  ${escapeHtml(entry.def)}
                  ${entry.astuce ? `<div class="lexique-tip">💡 Astuce : ${escapeHtml(entry.astuce)}</div>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  });

  content.innerHTML = html;
}

function toggleLexiqueEntry(el) {
  el.classList.toggle("open");
}

function filterLexique(query) {
  const clearBtn = qs("btnClearLexique");
  if (clearBtn) clearBtn.classList.toggle("hidden", !query);
  renderLexique(null, query);
}

function clearLexique() {
  const input = qs("lexiqueSearch");
  if (input) input.value = "";
  renderLexique(null, "");
}

// ============================================================
// THÈME
// ============================================================
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode", !isDark);

  const iconSun = qs("iconSun");
  const iconMoon = qs("iconMoon");

  if (iconSun) iconSun.classList.toggle("hidden", !isDark);
  if (iconMoon) iconMoon.classList.toggle("hidden", isDark);

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadTheme() {
  const saved = localStorage.getItem("theme");
  const iconSun = qs("iconSun");
  const iconMoon = qs("iconMoon");

  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
    if (iconSun) iconSun.classList.remove("hidden");
    if (iconMoon) iconMoon.classList.add("hidden");
  } else {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
    if (iconSun) iconSun.classList.add("hidden");
    if (iconMoon) iconMoon.classList.remove("hidden");
  }
}

// ============================================================
// TOAST
// ============================================================
let toastTimer = null;

function showToast(message) {
  const toast = qs("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ============================================================
// INSERTION DONNÉES DE BASE
// - ajoute seulement les recettes manquantes
// - ne supprime pas les recettes déjà créées
// ============================================================
async function mergeSampleData() {
  const all = await dbGetAll();
  const existingIds = new Set(all.map((r) => Number(r.id)));

  let added = 0;

  for (const recipe of RECETTES_SAMPLE) {
    if (!existingIds.has(Number(recipe.id))) {
      await dbPut(recipe);
      added++;
    }
  }

  if (added > 0) {
    console.log(`✅ ${added} nouvelles recettes par défaut ajoutées`);
  }
}

// ============================================================
// INIT
// ============================================================
async function init() {
  try {
    db = await openDB();
    loadTheme();
    await mergeSampleData();
    navigateTo("home");

    document.querySelectorAll(".tag-btn").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("selected"));
    });

    const modal = qs("modal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  } catch (error) {
    console.error(error);
    showToast("❌ Erreur au chargement de l'application");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
