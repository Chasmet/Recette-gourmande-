/* ============================================================
DÉLICES MAISON — script.js
Version enrichie
- Grosse base de recettes françaises
- Grosse base de recettes sénégalaises traduites en français
- Ajout intelligent sans effacer les recettes déjà créées
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
// OUTILS
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

function makeRecipe(
  id,
  titre,
  categorie,
  tempsPrep,
  tempsCuisson,
  portions,
  difficulte,
  ingredients,
  etapes,
  tags = [],
  notePerso = "",
  favori = false
) {
  return {
    id,
    titre,
    categorie,
    image: "",
    tempsPrep,
    tempsCuisson,
    portions,
    difficulte,
    ingredients,
    etapes,
    tags,
    notePerso,
    favori,
    dateAjout: id
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
// RECETTES PAR DÉFAUT
// ============================================================
const RECETTES_SAMPLE = [
  // =========================================================
  // FRANCE - PLATS / FAMILLE / RAPIDE
  // =========================================================
  makeRecipe(
    1001,
    "Bœuf Bourguignon",
    "plats",
    30,
    180,
    6,
    "moyen",
    ["1,5 kg de bœuf", "carottes", "oignons", "vin rouge", "champignons", "ail", "bouquet garni"],
    ["Faire revenir la viande.", "Ajouter légumes et aromates.", "Verser le vin.", "Laisser mijoter longuement."],
    ["famille", "fete"],
    "Encore meilleur le lendemain.",
    true
  ),
  makeRecipe(
    1002,
    "Quiche Lorraine",
    "plats",
    20,
    40,
    6,
    "facile",
    ["pâte brisée", "lardons", "œufs", "crème", "lait", "gruyère"],
    ["Préchauffer le four.", "Faire revenir les lardons.", "Mélanger les œufs, la crème et le lait.", "Cuire jusqu'à ce que la quiche soit dorée."],
    ["famille", "rapide"]
  ),
  makeRecipe(
    1003,
    "Ratatouille Provençale",
    "plats",
    25,
    60,
    4,
    "facile",
    ["courgettes", "aubergines", "tomates", "poivrons", "oignons", "ail", "huile d'olive"],
    ["Couper tous les légumes.", "Faire revenir les aromates.", "Ajouter les légumes progressivement.", "Laisser mijoter doucement."],
    ["healthy", "famille"]
  ),
  makeRecipe(
    1004,
    "Soupe à l'Oignon Gratinée",
    "plats",
    15,
    60,
    4,
    "facile",
    ["oignons", "beurre", "bouillon", "pain", "gruyère", "vin blanc"],
    ["Caraméliser les oignons.", "Ajouter farine et bouillon.", "Verser dans des bols.", "Garnir de pain et fromage puis gratiner."],
    ["famille"]
  ),
  makeRecipe(
    1005,
    "Blanquette de Veau",
    "plats",
    20,
    90,
    6,
    "moyen",
    ["veau", "carottes", "poireaux", "oignon", "champignons", "crème", "jaunes d'œufs"],
    ["Cuire la viande avec les légumes.", "Préparer une sauce blanche.", "Ajouter crème et jaunes d'œufs.", "Servir chaud avec du riz."],
    ["famille", "fete"]
  ),
  makeRecipe(
    1006,
    "Gratin Dauphinois",
    "plats",
    20,
    75,
    6,
    "facile",
    ["pommes de terre", "crème", "lait", "ail", "muscade"],
    ["Couper les pommes de terre finement.", "Disposer dans un plat.", "Verser lait et crème assaisonnés.", "Cuire longuement au four."],
    ["famille"],
    "Ne pas rincer les pommes de terre.",
    true
  ),
  makeRecipe(
    1007,
    "Pot-au-Feu",
    "famille",
    20,
    180,
    8,
    "facile",
    ["viande de bœuf", "carottes", "navets", "poireaux", "oignons", "bouquet garni"],
    ["Mettre la viande dans l'eau froide.", "Écumer.", "Ajouter aromates et légumes.", "Cuire très doucement."],
    ["famille"]
  ),
  makeRecipe(
    1008,
    "Coq au Vin",
    "plats",
    25,
    90,
    4,
    "moyen",
    ["poulet", "lardons", "champignons", "oignons", "vin rouge", "ail"],
    ["Faire dorer le poulet.", "Ajouter lardons et oignons.", "Verser le vin.", "Laisser cuire lentement."],
    ["famille", "fete"]
  ),
  makeRecipe(
    1009,
    "Cassoulet Toulousain",
    "famille",
    30,
    180,
    8,
    "difficile",
    ["haricots blancs", "saucisses", "confit de canard", "poitrine de porc", "tomates", "ail"],
    ["Cuire les haricots.", "Préparer la base aromatique.", "Assembler avec les viandes.", "Finir au four."],
    ["famille"]
  ),
  makeRecipe(
    1010,
    "Hachis Parmentier",
    "famille",
    25,
    35,
    6,
    "facile",
    ["viande hachée", "pommes de terre", "oignon", "lait", "beurre", "gruyère"],
    ["Préparer une purée.", "Cuire la viande avec l'oignon.", "Monter dans un plat.", "Faire gratiner."],
    ["famille", "enfants"]
  ),
  makeRecipe(
    1011,
    "Poulet Basquaise",
    "plats",
    20,
    50,
    4,
    "facile",
    ["poulet", "poivrons", "tomates", "oignons", "ail", "huile d'olive"],
    ["Faire dorer le poulet.", "Cuire les légumes.", "Ajouter tomates et aromates.", "Mijoter ensemble."],
    ["famille"]
  ),
  makeRecipe(
    1012,
    "Tartiflette",
    "famille",
    20,
    35,
    6,
    "facile",
    ["pommes de terre", "lardons", "oignons", "reblochon", "crème"],
    ["Cuire les pommes de terre.", "Faire revenir lardons et oignons.", "Monter dans un plat.", "Cuire avec le reblochon."],
    ["famille", "fete"]
  ),
  makeRecipe(
    1013,
    "Choucroute Garnie",
    "famille",
    25,
    120,
    6,
    "moyen",
    ["choucroute", "saucisses", "lard", "pommes de terre", "oignons", "vin blanc"],
    ["Rincer la choucroute.", "La cuire avec aromates.", "Ajouter les viandes.", "Servir avec pommes de terre."],
    ["famille"]
  ),
  makeRecipe(
    1014,
    "Aligot Saucisse",
    "famille",
    20,
    30,
    4,
    "facile",
    ["pommes de terre", "tomme fraîche", "crème", "beurre", "saucisses"],
    ["Préparer une purée.", "Ajouter la tomme en mélangeant.", "Cuire les saucisses.", "Servir bien filant."],
    ["famille"]
  ),
  makeRecipe(
    1015,
    "Bouillabaisse",
    "plats",
    30,
    70,
    6,
    "moyen",
    ["poissons variés", "fenouil", "tomates", "oignons", "ail", "safran"],
    ["Préparer le bouillon.", "Cuire les poissons selon leur fermeté.", "Servir avec pain grillé et rouille."],
    ["fete"]
  ),
  makeRecipe(
    1016,
    "Moules Marinières",
    "rapide",
    15,
    15,
    4,
    "facile",
    ["moules", "échalotes", "persil", "vin blanc", "beurre"],
    ["Nettoyer les moules.", "Faire revenir les échalotes.", "Ajouter les moules et le vin.", "Cuire jusqu'à ouverture."],
    ["rapide"]
  ),
  makeRecipe(
    1017,
    "Sole Meunière",
    "plats",
    15,
    15,
    2,
    "facile",
    ["soles", "beurre", "farine", "citron", "persil"],
    ["Fariner légèrement le poisson.", "Cuire au beurre.", "Ajouter citron et persil avant de servir."],
    ["fete"]
  ),
  makeRecipe(
    1018,
    "Endives au Jambon",
    "famille",
    20,
    30,
    4,
    "facile",
    ["endives", "jambon", "béchamel", "gruyère"],
    ["Cuire les endives.", "Les rouler dans le jambon.", "Napper de béchamel.", "Faire gratiner."],
    ["famille"]
  ),
  makeRecipe(
    1019,
    "Brandade de Morue",
    "plats",
    20,
    35,
    4,
    "moyen",
    ["morue dessalée", "pommes de terre", "ail", "huile d'olive", "lait"],
    ["Cuire la morue et les pommes de terre.", "Écraser ensemble.", "Monter avec huile et lait.", "Faire gratiner légèrement."],
    ["famille"]
  ),
  makeRecipe(
    1020,
    "Confit de Canard",
    "plats",
    15,
    120,
    4,
    "moyen",
    ["cuisses de canard", "graisse de canard", "ail", "thym", "sel"],
    ["Assaisonner le canard.", "Cuire doucement dans la graisse.", "Faire dorer avant de servir."],
    ["fete"]
  ),
  makeRecipe(
    1021,
    "Baeckeoffe",
    "famille",
    30,
    180,
    6,
    "moyen",
    ["viandes variées", "pommes de terre", "oignons", "poireaux", "vin blanc"],
    ["Mariner les viandes.", "Monter les couches dans une terrine.", "Cuire longuement au four."],
    ["famille"]
  ),
  makeRecipe(
    1022,
    "Pissaladière",
    "rapide",
    20,
    30,
    6,
    "facile",
    ["pâte", "oignons", "anchois", "olives noires", "huile d'olive"],
    ["Cuire longtemps les oignons.", "Étaler sur la pâte.", "Ajouter anchois et olives.", "Cuire au four."],
    ["rapide"]
  ),
  makeRecipe(
    1023,
    "Galette Complète",
    "rapide",
    10,
    10,
    2,
    "facile",
    ["galettes de sarrasin", "jambon", "œufs", "fromage"],
    ["Chauffer la galette.", "Ajouter garniture.", "Cuire l'œuf au centre.", "Plier et servir."],
    ["rapide"]
  ),
  makeRecipe(
    1024,
    "Croque-Monsieur",
    "rapide",
    10,
    12,
    2,
    "facile",
    ["pain de mie", "jambon", "fromage", "béchamel optionnelle"],
    ["Monter les croques.", "Ajouter fromage et béchamel si souhaité.", "Cuire au four ou à la poêle."],
    ["rapide", "enfants"]
  ),
  makeRecipe(
    1025,
    "Omelette aux Fines Herbes",
    "rapide",
    5,
    6,
    2,
    "facile",
    ["œufs", "persil", "ciboulette", "beurre", "sel", "poivre"],
    ["Battre les œufs.", "Ajouter herbes et assaisonnement.", "Cuire rapidement dans le beurre."],
    ["rapide"]
  ),
  makeRecipe(
    1026,
    "Cordon Bleu Maison",
    "famille",
    20,
    20,
    4,
    "facile",
    ["escalopes de poulet", "jambon", "fromage", "œufs", "chapelure"],
    ["Garnir les escalopes.", "Paner.", "Cuire à la poêle ou au four."],
    ["famille", "enfants"]
  ),
  makeRecipe(
    1027,
    "Gratin de Chou-Fleur",
    "famille",
    15,
    30,
    4,
    "facile",
    ["chou-fleur", "béchamel", "gruyère", "muscade"],
    ["Cuire le chou-fleur.", "Le mettre dans un plat.", "Ajouter béchamel et fromage.", "Faire gratiner."],
    ["famille"]
  ),
  makeRecipe(
    1028,
    "Gratin de Courgettes",
    "famille",
    15,
    30,
    4,
    "facile",
    ["courgettes", "crème", "œufs", "fromage", "ail"],
    ["Couper les courgettes.", "Préparer l'appareil.", "Cuire au four jusqu'à belle couleur."],
    ["famille", "healthy"]
  ),
  makeRecipe(
    1029,
    "Parmentier de Canard",
    "famille",
    25,
    35,
    6,
    "moyen",
    ["confit de canard", "pommes de terre", "lait", "beurre", "échalotes"],
    ["Effilocher le canard.", "Préparer la purée.", "Monter dans un plat.", "Faire gratiner."],
    ["fete", "famille"]
  ),
  makeRecipe(
    1030,
    "Piperade Basque",
    "rapide",
    15,
    25,
    4,
    "facile",
    ["poivrons", "tomates", "oignons", "ail", "œufs ou jambon"],
    ["Faire revenir les légumes.", "Laisser compoter.", "Ajouter la garniture choisie."],
    ["rapide"]
  ),
  makeRecipe(
    1031,
    "Daube Provençale",
    "plats",
    25,
    180,
    6,
    "moyen",
    ["bœuf", "vin rouge", "carottes", "oignons", "ail", "zeste d'orange"],
    ["Faire mariner si souhaité.", "Faire revenir la viande.", "Ajouter aromates et vin.", "Cuire très doucement."],
    ["famille"]
  ),
  makeRecipe(
    1032,
    "Saucisse Lentilles",
    "famille",
    15,
    40,
    4,
    "facile",
    ["saucisses", "lentilles vertes", "carottes", "oignon", "bouquet garni"],
    ["Cuire les lentilles avec aromates.", "Ajouter les saucisses.", "Laisser mijoter."],
    ["famille"]
  ),
  makeRecipe(
    1033,
    "Quenelles Sauce Nantua",
    "plats",
    15,
    25,
    4,
    "moyen",
    ["quenelles", "béchamel", "écrevisses ou bisque", "fromage"],
    ["Préparer la sauce.", "Disposer les quenelles.", "Napper et cuire au four."],
    ["fete"]
  ),
  makeRecipe(
    1034,
    "Ficelle Picarde",
    "rapide",
    20,
    15,
    4,
    "facile",
    ["crêpes salées", "champignons", "jambon", "crème", "fromage"],
    ["Préparer la farce.", "Garnir les crêpes.", "Napper légèrement et gratiner."],
    ["rapide", "famille"]
  ),
  makeRecipe(
    1035,
    "Gratin de Ravioles",
    "famille",
    10,
    20,
    4,
    "facile",
    ["ravioles", "crème", "fromage", "muscade"],
    ["Alterner ravioles et crème dans un plat.", "Ajouter le fromage.", "Cuire au four."],
    ["rapide", "famille"]
  ),

  // =========================================================
  // FRANCE - DESSERTS / PÂTISSERIE / GOÛTER / BOISSONS
  // =========================================================
  makeRecipe(
    1101,
    "Crème Brûlée à la Vanille",
    "desserts",
    20,
    40,
    6,
    "moyen",
    ["jaunes d'œufs", "sucre", "crème entière", "vanille", "sucre roux"],
    ["Infuser la vanille.", "Mélanger avec jaunes et sucre.", "Cuire au bain-marie.", "Refroidir puis caraméliser."],
    ["fete"],
    "Le caramel doit être fin et craquant.",
    true
  ),
  makeRecipe(
    1102,
    "Île Flottante",
    "desserts",
    25,
    15,
    4,
    "moyen",
    ["œufs", "sucre", "lait", "vanille"],
    ["Préparer une crème anglaise.", "Monter les blancs.", "Pocher les blancs.", "Servir avec caramel."],
    ["fete"]
  ),
  makeRecipe(
    1103,
    "Madeleines au Beurre Noisette",
    "gouter",
    15,
    12,
    24,
    "facile",
    ["œufs", "sucre", "farine", "levure", "beurre", "zeste de citron"],
    ["Préparer le beurre noisette.", "Mélanger les ingrédients.", "Laisser reposer si possible.", "Cuire dans les moules."],
    ["enfants", "rapide"]
  ),
  makeRecipe(
    1104,
    "Tarte au Citron Meringuée",
    "patisserie",
    40,
    35,
    8,
    "difficile",
    ["pâte sablée", "citrons", "œufs", "sucre", "beurre", "blancs d'œufs"],
    ["Cuire le fond de tarte.", "Préparer le lemon curd.", "Pocher la meringue.", "Dorer."],
    ["fete"],
    "",
    true
  ),
  makeRecipe(
    1105,
    "Financiers aux Amandes",
    "gouter",
    10,
    15,
    12,
    "facile",
    ["poudre d'amandes", "sucre glace", "farine", "blancs d'œufs", "beurre"],
    ["Préparer le beurre noisette.", "Mélanger les ingrédients.", "Cuire dans de petits moules."],
    ["rapide", "enfants"]
  ),
  makeRecipe(
    1106,
    "Clafoutis aux Cerises",
    "desserts",
    15,
    40,
    6,
    "facile",
    ["cerises", "œufs", "sucre", "farine", "lait"],
    ["Disposer les cerises.", "Préparer la pâte.", "Verser sur les fruits.", "Cuire au four."],
    ["famille", "rapide"]
  ),
  makeRecipe(
    1107,
    "Far Breton aux Pruneaux",
    "patisserie",
    10,
    50,
    8,
    "facile",
    ["farine", "sucre", "œufs", "lait", "pruneaux"],
    ["Préparer la pâte.", "Verser dans un plat.", "Ajouter les pruneaux.", "Cuire jusqu'à prise complète."],
    ["famille"]
  ),
  makeRecipe(
    1108,
    "Soufflé au Chocolat",
    "desserts",
    20,
    12,
    4,
    "difficile",
    ["chocolat noir", "œufs", "sucre", "beurre"],
    ["Préparer la base chocolat.", "Monter les blancs.", "Incorporer délicatement.", "Cuire sans ouvrir le four."],
    ["fete"]
  ),
  makeRecipe(
    1109,
    "Pain Perdu",
    "gouter",
    10,
    10,
    4,
    "facile",
    ["pain rassis", "œufs", "lait", "sucre", "beurre"],
    ["Préparer le mélange lait-œufs.", "Tremper le pain.", "Faire dorer à la poêle."],
    ["rapide", "economique", "enfants"]
  ),
  makeRecipe(
    1110,
    "Crêpes Bretonnes",
    "gouter",
    10,
    20,
    4,
    "facile",
    ["farine", "œufs", "lait", "beurre fondu", "sel", "sucre"],
    ["Préparer la pâte.", "Laisser reposer si possible.", "Cuire les crêpes."],
    ["famille", "enfants", "rapide"]
  ),
  makeRecipe(
    1111,
    "Tarte Tatin",
    "patisserie",
    30,
    40,
    8,
    "moyen",
    ["pâte feuilletée", "pommes", "sucre", "beurre"],
    ["Faire un caramel.", "Cuire les pommes.", "Recouvrir de pâte.", "Retourner à la sortie du four."],
    ["fete"]
  ),
  makeRecipe(
    1112,
    "Mousse au Chocolat Noir",
    "desserts",
    20,
    0,
    6,
    "facile",
    ["chocolat noir", "œufs", "sucre", "sel"],
    ["Faire fondre le chocolat.", "Ajouter les jaunes.", "Incorporer les blancs montés.", "Laisser prendre au frais."],
    ["rapide", "economique"],
    "Une pincée de fleur de sel fonctionne très bien.",
    true
  ),
  makeRecipe(
    1113,
    "Croissants Feuilletés",
    "patisserie",
    180,
    20,
    12,
    "difficile",
    ["farine", "lait", "levure", "sucre", "sel", "beurre de tourage"],
    ["Préparer la détrempe.", "Faire le tourage.", "Façonner les croissants.", "Laisser pousser puis cuire."],
    ["fete"]
  ),
  makeRecipe(
    1114,
    "Flan Pâtissier",
    "patisserie",
    20,
    45,
    8,
    "moyen",
    ["pâte", "lait", "œufs", "sucre", "maïzena", "vanille"],
    ["Préparer l'appareil.", "Verser sur la pâte.", "Cuire jusqu'à belle coloration."],
    ["famille"]
  ),
  makeRecipe(
    1115,
    "Gaufres Croustillantes",
    "gouter",
    15,
    15,
    6,
    "facile",
    ["farine", "œufs", "lait", "beurre", "levure", "sucre"],
    ["Préparer la pâte.", "Laisser reposer un peu si possible.", "Cuire au gaufrier."],
    ["enfants", "rapide"]
  ),
  makeRecipe(
    1116,
    "Tarte aux Pommes Normande",
    "patisserie",
    20,
    35,
    8,
    "facile",
    ["pâte", "pommes", "œufs", "crème", "sucre", "beurre"],
    ["Foncer le moule.", "Disposer les pommes.", "Ajouter l'appareil.", "Cuire au four."],
    ["famille"]
  ),
  makeRecipe(
    1117,
    "Paris-Brest",
    "patisserie",
    40,
    35,
    8,
    "difficile",
    ["pâte à choux", "praliné", "beurre", "œufs", "farine"],
    ["Préparer la pâte à choux.", "Cuire en couronne.", "Garnir d'une crème pralinée."],
    ["fete"]
  ),
  makeRecipe(
    1118,
    "Profiteroles",
    "desserts",
    35,
    25,
    6,
    "moyen",
    ["pâte à choux", "glace vanille", "chocolat", "crème"],
    ["Préparer les choux.", "Les cuire.", "Les garnir de glace.", "Napper de chocolat chaud."],
    ["fete"]
  ),
  makeRecipe(
    1119,
    "Mille-feuille",
    "patisserie",
    35,
    30,
    8,
    "difficile",
    ["pâte feuilletée", "crème pâtissière", "sucre glace"],
    ["Cuire la pâte feuilletée.", "Préparer la crème.", "Monter les couches."],
    ["fete"]
  ),
  makeRecipe(
    1120,
    "Éclair au Chocolat",
    "patisserie",
    35,
    25,
    10,
    "moyen",
    ["pâte à choux", "crème pâtissière chocolat", "glaçage"],
    ["Préparer la pâte à choux.", "Pocher et cuire.", "Garnir puis glacer."],
    ["fete"]
  ),
  makeRecipe(
    1121,
    "Chouquettes",
    "gouter",
    20,
    20,
    20,
    "facile",
    ["pâte à choux", "sucre perlé"],
    ["Préparer la pâte à choux.", "Pocher.", "Ajouter le sucre perlé.", "Cuire."],
    ["enfants", "rapide"]
  ),
  makeRecipe(
    1122,
    "Cannelés Bordelais",
    "patisserie",
    20,
    55,
    12,
    "moyen",
    ["lait", "œufs", "farine", "sucre", "rhum", "vanille"],
    ["Préparer la pâte la veille si possible.", "Verser dans les moules.", "Cuire jusqu'à croûte bien brune."],
    ["fete"]
  ),
  makeRecipe(
    1123,
    "Kouign-amann",
    "patisserie",
    45,
    35,
    8,
    "difficile",
    ["farine", "beurre", "sucre", "levure", "eau"],
    ["Préparer la pâte.", "Incorporer beurre et sucre.", "Plier plusieurs fois.", "Cuire."],
    ["fete"]
  ),
  makeRecipe(
    1124,
    "Moelleux au Chocolat",
    "desserts",
    10,
    12,
    6,
    "facile",
    ["chocolat", "beurre", "œufs", "sucre", "farine"],
    ["Faire fondre chocolat et beurre.", "Ajouter œufs et sucre.", "Cuire peu de temps."],
    ["rapide", "fete"]
  ),
  makeRecipe(
    1125,
    "Riz au Lait à la Vanille",
    "desserts",
    10,
    35,
    6,
    "facile",
    ["riz rond", "lait", "sucre", "vanille"],
    ["Cuire le riz dans le lait sucré et vanillé.", "Servir tiède ou froid."],
    ["famille", "economique"]
  ),
  makeRecipe(
    1126,
    "Baba au Rhum",
    "patisserie",
    35,
    20,
    8,
    "moyen",
    ["farine", "œufs", "beurre", "levure", "sucre", "rhum"],
    ["Préparer la pâte.", "Cuire le baba.", "Imbiber de sirop au rhum."],
    ["fete"]
  ),
  makeRecipe(
    1127,
    "Charlotte aux Fraises",
    "desserts",
    25,
    0,
    8,
    "facile",
    ["biscuits à la cuillère", "fraises", "crème", "sucre"],
    ["Monter la charlotte.", "Laisser prendre au frais."],
    ["fete"]
  ),
  makeRecipe(
    1128,
    "Opéra",
    "patisserie",
    60,
    20,
    10,
    "difficile",
    ["biscuit amande", "crème au café", "ganache", "glaçage chocolat"],
    ["Préparer les couches.", "Monter le gâteau.", "Glacer."],
    ["fete"]
  ),
  makeRecipe(
    1129,
    "Palmier Feuilleté",
    "gouter",
    10,
    18,
    12,
    "facile",
    ["pâte feuilletée", "sucre"],
    ["Saupoudrer de sucre.", "Rouler les deux côtés.", "Couper puis cuire."],
    ["rapide", "enfants"]
  ),
  makeRecipe(
    1130,
    "Sablés Bretons",
    "gouter",
    15,
    15,
    16,
    "facile",
    ["farine", "beurre", "sucre", "jaunes d'œufs", "levure"],
    ["Préparer la pâte.", "Découper.", "Cuire jusqu'à légère coloration."],
    ["enfants", "rapide"]
  ),
  makeRecipe(
    1131,
    "Limonade Maison à la Menthe",
    "boissons",
    10,
    5,
    6,
    "facile",
    ["citrons", "eau gazeuse", "sucre", "menthe", "glaçons"],
    ["Préparer un sirop léger.", "Ajouter menthe et citron.", "Compléter avec eau gazeuse."],
    ["rapide", "healthy"]
  ),
  makeRecipe(
    1132,
    "Chocolat Chaud Viennois",
    "boissons",
    5,
    10,
    2,
    "facile",
    ["lait", "chocolat noir", "sucre", "chantilly"],
    ["Chauffer le lait.", "Faire fondre le chocolat dedans.", "Servir avec chantilly."],
    ["enfants", "rapide"]
  ),
  makeRecipe(
    1133,
    "Citronnade Maison",
    "boissons",
    8,
    0,
    6,
    "facile",
    ["citrons", "eau", "sucre", "glaçons"],
    ["Presser les citrons.", "Mélanger avec eau et sucre.", "Servir très frais."],
    ["rapide", "healthy"]
  ),
  makeRecipe(
    1134,
    "Vin Chaud aux Épices",
    "boissons",
    5,
    15,
    6,
    "facile",
    ["vin rouge", "orange", "cannelle", "sucre", "clous de girofle"],
    ["Chauffer doucement sans faire bouillir.", "Laisser infuser.", "Servir chaud."],
    ["fete"]
  ),

  // =========================================================
  // SÉNÉGAL - RECETTES TRADUITES EN FRANÇAIS
  // =========================================================
  makeRecipe(
    2001,
    "Riz au Poisson Sénégalais (Thiéboudienne)",
    "senegalaise",
    45,
    90,
    8,
    "difficile",
    ["poisson", "riz brisé", "carottes", "chou", "aubergines", "tomates", "ail", "persil"],
    ["Préparer la farce du poisson.", "Faire dorer le poisson.", "Préparer la sauce tomate et le bouillon.", "Cuire les légumes.", "Cuire le riz dans le bouillon."],
    ["famille"],
    "Plat emblématique du Sénégal.",
    true
  ),
  makeRecipe(
    2002,
    "Poulet Yassa",
    "senegalaise",
    30,
    60,
    6,
    "facile",
    ["poulet", "oignons", "citrons", "moutarde", "ail", "poivre"],
    ["Faire mariner le poulet.", "Le griller ou le dorer.", "Cuire longuement les oignons.", "Remettre le poulet dans la sauce."],
    ["famille"],
    "Les oignons doivent être très fondants.",
    true
  ),
  makeRecipe(
    2003,
    "Bœuf Mafé",
    "senegalaise",
    20,
    90,
    6,
    "moyen",
    ["bœuf", "pâte d'arachide", "concentré de tomates", "oignons", "carottes", "patates"],
    ["Faire revenir la viande.", "Ajouter tomate et aromates.", "Verser la pâte d'arachide délayée.", "Laisser mijoter longuement."],
    ["famille"]
  ),
  makeRecipe(
    2004,
    "Riz à la Viande Sénégalais (Thiébou Yapp)",
    "senegalaise",
    20,
    90,
    6,
    "moyen",
    ["viande", "riz brisé", "tomates", "oignons", "carottes", "navet", "ail"],
    ["Faire dorer la viande.", "Préparer le bouillon tomate.", "Cuire les légumes.", "Cuire le riz dans le bouillon."],
    ["famille"]
  ),
  makeRecipe(
    2005,
    "Domoda",
    "senegalaise",
    20,
    75,
    6,
    "facile",
    ["viande ou poulet", "pâte d'arachide", "tomates", "oignons", "pommes de terre"],
    ["Faire revenir la viande.", "Ajouter la base tomate.", "Incorporer la pâte d'arachide.", "Mijoter."],
    ["famille"]
  ),
  makeRecipe(
    2006,
    "Caldou",
    "senegalaise",
    15,
    30,
    4,
    "facile",
    ["poisson blanc", "oignons", "ail", "citron", "piment"],
    ["Assaisonner le poisson.", "Préparer un bouillon léger.", "Cuire doucement le poisson dedans."],
    ["healthy", "rapide"]
  ),
  makeRecipe(
    2007,
    "Sauce Gombo Sénégalaise (Soupou Kandja)",
    "senegalaise",
    20,
    60,
    6,
    "moyen",
    ["gombo", "poisson fumé", "crevettes séchées", "oignons", "huile", "piment"],
    ["Faire revenir les aromates.", "Ajouter poisson et crevettes.", "Ajouter le gombo.", "Laisser épaissir doucement."],
    ["famille"]
  ),
  makeRecipe(
    2008,
    "Beignets de Haricots (Acara)",
    "senegalaise",
    30,
    15,
    4,
    "moyen",
    ["niébé", "oignon", "piment", "sel", "huile"],
    ["Tremper et peler les haricots.", "Mixer la pâte.", "Bien l'aérer.", "Frire en petites portions."],
    ["economique", "rapide"]
  ),
  makeRecipe(
    2009,
    "Couscous de Mil au Lait Caillé (Thiakry)",
    "senegalaise",
    20,
    10,
    6,
    "facile",
    ["thiakry", "lait caillé ou yaourt", "sucre", "vanille", "raisins secs"],
    ["Cuire le couscous de mil.", "Laisser refroidir.", "Mélanger avec le lait caillé sucré."],
    ["enfants", "fete"]
  ),
  makeRecipe(
    2010,
    "Dessert de Mil, Arachide et Baobab (Ngalakh)",
    "senegalaise",
    20,
    15,
    8,
    "moyen",
    ["farine de mil", "pâte d'arachide", "poudre de baobab", "lait", "sucre"],
    ["Cuire le mil.", "Ajouter l'arachide.", "Incorporer baobab, lait et sucre.", "Servir froid."],
    ["fete"]
  ),
  makeRecipe(
    2011,
    "Sauce Tomate au Poulet (Thiou Poulet)",
    "senegalaise",
    15,
    50,
    4,
    "facile",
    ["poulet", "tomates", "concentré de tomates", "oignons", "ail", "piment"],
    ["Faire dorer le poulet.", "Préparer la sauce tomate.", "Laisser mijoter ensemble."],
    ["famille", "rapide"]
  ),
  makeRecipe(
    2012,
    "Chaussons Frits Sénégalais (Pastels)",
    "senegalaise",
    35,
    15,
    6,
    "moyen",
    ["farine", "eau", "sel", "poisson ou viande", "oignon", "piment", "huile"],
    ["Préparer la pâte.", "Faire la farce.", "Façonner les chaussons.", "Frire."],
    ["fete", "famille"]
  ),
  makeRecipe(
    2013,
    "Chaussons Levés Sénégalais (Fataya)",
    "senegalaise",
    35,
    15,
    6,
    "moyen",
    ["farine", "levure", "viande ou thon", "oignon", "poivron", "huile"],
    ["Préparer la pâte.", "Préparer la farce.", "Façonner.", "Frire."],
    ["famille", "fete"]
  ),
  makeRecipe(
    2014,
    "Viande Grillée Sénégalaise (Dibi)",
    "senegalaise",
    20,
    25,
    4,
    "facile",
    ["agneau ou mouton", "sel", "poivre", "moutarde", "oignons", "citron"],
    ["Assaisonner la viande.", "La griller.", "Servir avec oignons et moutarde."],
    ["rapide", "famille"]
  ),
  makeRecipe(
    2015,
    "Bouillie de Mil au Lait (Lakh)",
    "senegalaise",
    20,
    15,
    6,
    "facile",
    ["mil", "lait caillé", "sucre", "vanille"],
    ["Cuire le mil.", "Ajouter le lait caillé sucré.", "Servir tiède ou frais."],
    ["enfants", "economique"]
  ),
  makeRecipe(
    2016,
    "Poisson Yassa",
    "senegalaise",
    25,
    40,
    4,
    "facile",
    ["poisson", "oignons", "citrons", "moutarde", "ail"],
    ["Faire mariner le poisson.", "Le cuire.", "Préparer les oignons citronnés.", "Assembler."],
    ["healthy"]
  ),
  makeRecipe(
    2017,
    "Riz au Poulet Sénégalais (Ceebu Guinaar)",
    "senegalaise",
    25,
    75,
    6,
    "moyen",
    ["poulet", "riz brisé", "tomates", "oignons", "carottes", "ail"],
    ["Faire dorer le poulet.", "Préparer le bouillon rouge.", "Cuire le poulet puis le riz dedans."],
    ["famille"]
  ),
  makeRecipe(
    2018,
    "Haricots Blancs Tomatés (Ndambé)",
    "senegalaise",
    15,
    60,
    6,
    "facile",
    ["haricots", "tomates", "oignons", "ail", "huile", "piment"],
    ["Cuire les haricots.", "Préparer la sauce tomate.", "Mélanger et laisser mijoter."],
    ["economique", "famille"]
  ),
  makeRecipe(
    2019,
    "Riz Saloum Viande et Arachide (Mbakhal Saloum)",
    "senegalaise",
    20,
    75,
    6,
    "moyen",
    ["riz", "viande", "arachides", "tomates", "oignons", "ail"],
    ["Faire revenir la viande.", "Ajouter la tomate et les arachides.", "Cuire avec le riz."],
    ["famille"]
  ),
  makeRecipe(
    2020,
    "Fonio au Poulet",
    "senegalaise",
    20,
    35,
    4,
    "facile",
    ["fonio", "poulet", "oignons", "carottes", "huile", "épices"],
    ["Cuire le poulet.", "Préparer le fonio.", "Servir avec sauce et légumes."],
    ["healthy", "famille"]
  ),
  makeRecipe(
    2021,
    "Couscous de Mil Salé (Thiéré Bassi Salté)",
    "senegalaise",
    25,
    45,
    6,
    "moyen",
    ["couscous de mil", "viande", "légumes", "oignons", "tomates"],
    ["Préparer la sauce.", "Cuire le thiéré à la vapeur.", "Servir avec viande et légumes."],
    ["famille"]
  ),
  makeRecipe(
    2022,
    "Couscous de Mil aux Feuilles de Baobab (Thiéré Mboum)",
    "senegalaise",
    25,
    45,
    6,
    "moyen",
    ["thiéré", "poudre de feuilles de baobab", "viande ou poisson", "oignons"],
    ["Cuire le couscous de mil.", "Préparer la sauce.", "Ajouter le mboum.", "Servir chaud."],
    ["famille", "healthy"]
  ),
  makeRecipe(
    2023,
    "Couscous de Mil Sucré (Thiéré Sim)",
    "senegalaise",
    15,
    20,
    6,
    "facile",
    ["thiéré", "sucre", "lait", "vanille", "raisins secs"],
    ["Cuire le thiéré.", "Mélanger avec le lait sucré.", "Servir tiède ou froid."],
    ["enfants", "economique"]
  ),
  makeRecipe(
    2024,
    "Riz à l'Arachide Sénégalais (Ceebu Guerté)",
    "senegalaise",
    20,
    50,
    6,
    "moyen",
    ["riz", "pâte d'arachide", "oignons", "tomates", "ail"],
    ["Préparer une base tomate.", "Ajouter l'arachide.", "Cuire le riz dans la sauce."],
    ["famille"]
  ),
  makeRecipe(
    2025,
    "Galettes de Mil Sucrées",
    "senegalaise",
    15,
    15,
    8,
    "facile",
    ["farine de mil", "sucre", "eau", "huile ou beurre"],
    ["Préparer une pâte.", "Former des petites galettes.", "Cuire à la poêle."],
    ["economique", "enfants"]
  ),
  makeRecipe(
    2026,
    "Boulettes de Poisson Sénégalaises",
    "senegalaise",
    20,
    30,
    4,
    "facile",
    ["poisson", "ail", "persil", "oignon", "chapelure", "œuf"],
    ["Mixer le poisson avec les aromates.", "Former les boulettes.", "Cuire en sauce ou à la poêle."],
    ["famille"]
  ),
  makeRecipe(
    2027,
    "Couscous de Mil aux Légumes",
    "senegalaise",
    20,
    35,
    6,
    "facile",
    ["thiéré", "carottes", "navets", "chou", "oignons", "huile"],
    ["Cuire le thiéré.", "Préparer les légumes.", "Servir ensemble."],
    ["healthy", "famille"]
  ),
  makeRecipe(
    2028,
    "Lait Caillé au Couscous de Mil (Dégué)",
    "senegalaise",
    10,
    10,
    6,
    "facile",
    ["couscous de mil", "lait caillé", "sucre", "vanille"],
    ["Cuire légèrement le couscous si besoin.", "Laisser refroidir.", "Mélanger avec le lait caillé."],
    ["enfants", "rapide"]
  ),
  makeRecipe(
    2029,
    "Riz Rouge au Poisson Fumé",
    "senegalaise",
    20,
    45,
    6,
    "facile",
    ["riz", "poisson fumé", "tomates", "oignons", "ail", "huile"],
    ["Préparer la base tomate.", "Ajouter le poisson fumé.", "Cuire le riz dedans."],
    ["famille"]
  ),
  makeRecipe(
    2030,
    "Sauce Feuilles et Viande",
    "senegalaise",
    25,
    60,
    6,
    "moyen",
    ["feuilles comestibles", "viande", "oignons", "huile", "ail"],
    ["Cuire la viande.", "Préparer les feuilles.", "Mijoter ensemble."],
    ["healthy", "famille"]
  ),
  makeRecipe(
    2031,
    "Beignets Sucrés Sénégalais",
    "senegalaise",
    20,
    15,
    8,
    "facile",
    ["farine", "sucre", "levure", "eau", "huile"],
    ["Préparer la pâte.", "Laisser lever un peu.", "Frire en petites portions."],
    ["enfants", "fete"]
  ),
  makeRecipe(
    2032,
    "Riz au Poisson Sec et Légumes",
    "senegalaise",
    20,
    50,
    6,
    "moyen",
    ["riz", "poisson sec", "tomates", "oignons", "légumes", "ail"],
    ["Dessaler si besoin.", "Préparer la sauce.", "Ajouter légumes et riz.", "Cuire doucement."],
    ["famille"]
  ),

  // =========================================================
  // SÉNÉGAL - BOISSONS
  // =========================================================
  makeRecipe(
    2101,
    "Jus d'Hibiscus (Bissap)",
    "boissons",
    10,
    15,
    8,
    "facile",
    ["fleurs d'hibiscus séchées", "eau", "sucre", "menthe", "citron"],
    ["Faire bouillir l'eau.", "Ajouter les fleurs.", "Laisser infuser.", "Filtrer et sucrer."],
    ["healthy", "rapide"]
  ),
  makeRecipe(
    2102,
    "Jus de Baobab (Bouye)",
    "boissons",
    10,
    0,
    6,
    "facile",
    ["poudre de baobab", "eau", "sucre", "lait optionnel"],
    ["Délayer la poudre.", "Ajouter eau et sucre.", "Servir bien frais."],
    ["healthy", "rapide"]
  ),
  makeRecipe(
    2103,
    "Jus de Gingembre Sénégalais",
    "boissons",
    15,
    10,
    8,
    "facile",
    ["gingembre", "eau", "sucre", "citron", "menthe"],
    ["Faire bouillir ou infuser le gingembre.", "Filtrer.", "Ajouter sucre et citron.", "Servir frais."],
    ["healthy", "rapide"]
  ),
  makeRecipe(
    2104,
    "Café Touba",
    "boissons",
    10,
    10,
    4,
    "facile",
    ["café moulu", "poivre de Guinée", "eau", "sucre optionnel"],
    ["Faire chauffer l'eau.", "Infuser le café et les épices.", "Filtrer et servir."],
    ["rapide"]
  ),
  makeRecipe(
    2105,
    "Jus de Tamarin",
    "boissons",
    10,
    10,
    6,
    "facile",
    ["tamarin", "eau", "sucre"],
    ["Faire tremper ou bouillir légèrement le tamarin.", "Filtrer.", "Sucrer et servir frais."],
    ["healthy", "rapide"]
  )
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
  { terme: "Blanchir", cat: "tech", origine: "int", def: "Plonger brièvement un aliment dans l'eau bouillante puis le refroidir.", astuce: "Très utile pour garder la couleur des légumes verts." },
  { terme: "Braiser", cat: "tech", origine: "fr", def: "Cuire doucement avec un peu de liquide dans un récipient fermé.", astuce: "Idéal pour les viandes longues à cuire." },
  { terme: "Déglacer", cat: "tech", origine: "fr", def: "Ajouter un liquide pour décoller les sucs de cuisson.", astuce: "Le vin ou le bouillon marchent très bien." },
  { terme: "Mijoter", cat: "tech", origine: "int", def: "Cuire lentement à petit feu.", astuce: "Parfait pour les ragoûts et sauces." },
  { terme: "Pocher", cat: "tech", origine: "int", def: "Cuire dans un liquide frémissant.", astuce: "Très bien pour poisson, œufs ou fruits." },

  { terme: "Foncer", cat: "patiss", origine: "fr", def: "Garnir un moule avec une pâte.", astuce: "Toujours piquer le fond." },
  { terme: "Cuire à blanc", cat: "patiss", origine: "fr", def: "Précuire une pâte sans sa garniture.", astuce: "Ajouter des poids dessus." },
  { terme: "Abaisser", cat: "patiss", origine: "fr", def: "Étaler une pâte au rouleau.", astuce: "Fariner légèrement le plan de travail." },
  { terme: "Ganache", cat: "patiss", origine: "fr", def: "Mélange de chocolat et de crème.", astuce: "Plus elle refroidit, plus elle se tient." },

  { terme: "Mariner", cat: "viande", origine: "int", def: "Laisser un aliment tremper dans un mélange aromatique.", astuce: "Toujours au réfrigérateur." },
  { terme: "Dorer", cat: "viande", origine: "fr", def: "Faire colorer un aliment à feu vif.", astuce: "Ne pas trop remplir la poêle." },

  { terme: "Béchamel", cat: "sauce", origine: "fr", def: "Sauce au lait liée avec un roux.", astuce: "Verser le lait petit à petit." },
  { terme: "Velouté", cat: "sauce", origine: "fr", def: "Sauce liée à base de bouillon.", astuce: "La qualité du bouillon est essentielle." },

  { terme: "Thiéboudienne", cat: "senega", origine: "sn", def: "Riz au poisson, plat emblématique du Sénégal.", astuce: "Le bouillon et la farce du poisson font la différence." },
  { terme: "Yassa", cat: "senega", origine: "sn", def: "Préparation au citron avec beaucoup d'oignons.", astuce: "Les oignons doivent cuire longuement." },
  { terme: "Mafé", cat: "senega", origine: "sn", def: "Sauce à l'arachide très populaire en Afrique de l'Ouest.", astuce: "Remuer souvent pour éviter que ça colle." },
  { terme: "Bissap", cat: "senega", origine: "sn", def: "Boisson à base de fleurs d'hibiscus séchées.", astuce: "Servir très frais." },
  { terme: "Bouye", cat: "senega", origine: "sn", def: "Fruit du baobab utilisé en boisson ou dessert.", astuce: "Goût légèrement acidulé." },

  { terme: "Curcuma", cat: "epices", origine: "int", def: "Épice jaune au goût doux et terreux.", astuce: "Se marie bien avec le poivre." },
  { terme: "Cumin", cat: "epices", origine: "int", def: "Épice chaude et parfumée.", astuce: "Très bon légèrement torréfié." },

  { terme: "Maryse", cat: "ustens", origine: "fr", def: "Spatule souple pour racler ou mélanger délicatement.", astuce: "Très utile pour les mousses." },
  { terme: "Mandoline", cat: "ustens", origine: "fr", def: "Outil pour faire des tranches très fines.", astuce: "Toujours utiliser la protection pour les doigts." },

  { terme: "Mise en place", cat: "france", origine: "fr", def: "Préparer tous les ingrédients avant de commencer.", astuce: "Tu gagnes du temps et tu évites les oublis." },
  { terme: "Gratiner", cat: "france", origine: "fr", def: "Faire dorer le dessus d'un plat.", astuce: "Surveiller sans s'éloigner." }
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
// CARTE RECETTE
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
// ACCUEIL
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
// CATÉGORIE
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
    viande: { label: "Viandes", icon: "🥩", cls: "viande" },
    sauce: { label: "Sauces", icon: "🫕", cls: "sauce" },
    senega: { label: "Cuisine sénégalaise", icon: "🌍", cls: "senega" },
    epices: { label: "Épices", icon: "🌶️", cls: "epices" },
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
// INSERTION DES RECETTES PAR DÉFAUT
// - ajoute seulement les recettes manquantes
// - n'efface pas les recettes déjà créées
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
    console.log(`✅ ${added} recettes par défaut ajoutées`);
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
