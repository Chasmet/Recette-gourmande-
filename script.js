/* ============================================================
   DÉLICES MAISON — script.js  (V1.2)
   40+ recettes françaises & sénégalaises + Lexique 80+ termes
   ============================================================ */

// ── CATÉGORIES ─────────────────────────────────────────────
const CATEGORIES = {
  plats:       { label: '🍽️ Plats',       emoji: '🍽️', cls: 'cat-plats',       ph: 'placeholder-plats' },
  desserts:    { label: '🍰 Desserts',    emoji: '🍰', cls: 'cat-desserts',    ph: 'placeholder-desserts' },
  patisserie:  { label: '🥐 Pâtisserie',  emoji: '🥐', cls: 'cat-patisserie',  ph: 'placeholder-patisserie' },
  gouter:      { label: '🧁 Goûter',      emoji: '🧁', cls: 'cat-gouter',      ph: 'placeholder-gouter' },
  boissons:    { label: '🥤 Boissons',    emoji: '🥤', cls: 'cat-boissons',    ph: 'placeholder-boissons' },
  rapide:      { label: '⚡ Rapide',      emoji: '⚡', cls: 'cat-rapide',      ph: 'placeholder-rapide' },
  famille:     { label: '👨‍👩‍👧 Famille',    emoji: '👨‍👩‍👧', cls: 'cat-famille',    ph: 'placeholder-famille' },
  senegalaise: { label: '🌍 Sénégalaise', emoji: '🌍', cls: 'cat-senegalaise', ph: 'placeholder-senegalaise' },
};

// ── ÉTAT GLOBAL ────────────────────────────────────────────
let db          = null;
let currentView = 'home';
let prevView    = null;
let editingId   = null;
let lexiqueFilter = 'all';

// ============================================================
// INDEXEDDB
// ============================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('DelicesMaison', 2);
    req.onupgradeneeded = e => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('recettes')) {
        const store = database.createObjectStore('recettes', { keyPath: 'id' });
        store.createIndex('categorie', 'categorie', { unique: false });
        store.createIndex('favori',    'favori',    { unique: false });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
function dbGetAll() {
  return new Promise((resolve, reject) => {
    const req = db.transaction('recettes','readonly').objectStore('recettes').getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
function dbGet(id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('recettes','readonly').objectStore('recettes').get(id);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
function dbPut(r) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('recettes','readwrite').objectStore('recettes').put(r);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
function dbDelete(id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('recettes','readwrite').objectStore('recettes').delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// ============================================================
// DONNÉES : 40+ RECETTES
// ============================================================
const RECETTES_SAMPLE = [

  // ── RECETTES FRANÇAISES — PLATS ──
  {
    id:1001, titre:'Bœuf Bourguignon', categorie:'plats',
    tempsPrep:30, tempsCuisson:180, portions:6, difficulte:'moyen',
    ingredients:['1.5 kg de bœuf (paleron ou gîte)','200g de lardons fumés','1 bouteille de vin rouge de Bourgogne','3 carottes','2 oignons','3 gousses d\'ail','200g de champignons de Paris','2 c.s de farine','1 bouquet garni','Huile, sel, poivre'],
    etapes:['Couper le bœuf en gros cubes. Faire revenir les lardons dans une cocotte.','Saisir la viande en morceaux dans la même cocotte pour bien dorer.','Ajouter les légumes émincés, faire suer 5 minutes.','Saupoudrer de farine, mélanger, puis verser le vin rouge.','Ajouter le bouquet garni, sel, poivre. Couvrir et mijoter 2h30 à feu doux.','Ajouter les champignons 30 minutes avant la fin. Rectifier l\'assaisonnement.'],
    tags:['famille','fete'], notePerso:'Le lendemain c\'est encore meilleur ! Servir avec des pâtes fraîches ou une purée.', favori:true, dateAjout:1001
  },
  {
    id:1002, titre:'Quiche Lorraine', categorie:'plats',
    tempsPrep:20, tempsCuisson:40, portions:6, difficulte:'facile',
    ingredients:['1 pâte brisée','200g de lardons fumés','3 œufs','25 cl de crème fraîche épaisse','25 cl de lait','100g de gruyère râpé','Noix de muscade, sel, poivre'],
    etapes:['Préchauffer le four à 180°C. Foncer le moule avec la pâte.','Faire revenir les lardons à la poêle, les égoutter.','Mélanger œufs, crème, lait, muscade, sel et poivre.','Répartir les lardons sur la pâte. Verser l\'appareil dessus.','Parsemer de gruyère. Cuire 40 minutes jusqu\'à coloration dorée.'],
    tags:['famille','rapide'], notePerso:'Ajouter des oignons caramélisés pour plus de saveur.', favori:false, dateAjout:1002
  },
  {
    id:1003, titre:'Ratatouille Provençale', categorie:'plats',
    tempsPrep:25, tempsCuisson:60, portions:4, difficulte:'facile',
    ingredients:['2 courgettes','2 aubergines','4 tomates mûres','2 poivrons (rouge et vert)','2 oignons','4 gousses d\'ail','Huile d\'olive, thym, basilic, laurier, sel, poivre'],
    etapes:['Couper tous les légumes en cubes de taille égale.','Faire revenir les oignons et l\'ail dans l\'huile d\'olive.','Ajouter les poivrons, faire revenir 5 minutes.','Incorporer les aubergines, puis les courgettes, puis les tomates.','Assaisonner, ajouter les herbes. Couvrir et mijoter 45 minutes à feu doux.','Rectifier l\'assaisonnement. Servir chaud ou froid.'],
    tags:['healthy','famille'], notePerso:'Délicieuse froide en entrée ou chaude avec du riz.', favori:false, dateAjout:1003
  },
  {
    id:1004, titre:'Soupe à l\'Oignon Gratinée', categorie:'plats',
    tempsPrep:15, tempsCuisson:60, portions:4, difficulte:'facile',
    ingredients:['6 gros oignons','50g de beurre','1 c.s d\'huile','2 c.s de farine','1,5L de bouillon de bœuf','20 cl de vin blanc sec','8 tranches de pain de campagne','200g de gruyère râpé','Sel, poivre, thym'],
    etapes:['Émincer finement les oignons. Les faire caraméliser 30 min dans beurre+huile à feu doux.','Saupoudrer de farine, remuer, puis verser le vin blanc.','Ajouter le bouillon chaud, thym, sel, poivre. Mijoter 20 minutes.','Répartir la soupe dans des bols allant au four.','Poser 2 tranches de pain sur chaque bol, couvrir de gruyère.','Passer sous le gril 5 minutes jusqu\'à gratinage doré.'],
    tags:['famille'], notePerso:'Le secret : bien caraméliser les oignons, ne pas aller trop vite.', favori:false, dateAjout:1004
  },
  {
    id:1005, titre:'Blanquette de Veau', categorie:'plats',
    tempsPrep:20, tempsCuisson:90, portions:6, difficulte:'moyen',
    ingredients:['1.5 kg de veau (épaule ou flanchet)','3 carottes','2 poireaux','1 oignon clouté de girofle','200g de champignons de Paris','1 bouquet garni','Sauce : 40g beurre, 40g farine, 30cl crème fraîche, 2 jaunes d\'œufs, jus de citron'],
    etapes:['Plonger la viande dans l\'eau froide, porter à ébullition 5 min, égoutter et rincer.','Remettre dans une casserole avec les légumes, bouquet garni, sel. Couvrir d\'eau froide.','Cuire 1h30 à frémissement. Récupérer 1L de bouillon de cuisson.','Faire un roux avec beurre et farine, mouiller avec le bouillon filtré.','Ajouter champignons, crème fraîche, jaunes d\'œufs, citron. Remuer à feu doux.','Verser la sauce sur la viande. Servir avec du riz.'],
    tags:['famille','fete'], notePerso:'La sauce ne doit pas bouillir après l\'ajout des jaunes d\'œufs.', favori:false, dateAjout:1005
  },
  {
    id:1006, titre:'Gratin Dauphinois', categorie:'plats',
    tempsPrep:20, tempsCuisson:75, portions:6, difficulte:'facile',
    ingredients:['1.5 kg de pommes de terre à chair ferme','50 cl de crème fraîche liquide','50 cl de lait entier','2 gousses d\'ail','Noix de muscade','Sel, poivre','Beurre pour le plat'],
    etapes:['Éplucher et trancher les pommes de terre finement (2mm) à la mandoline.','Frotter le plat à gratin avec l\'ail, beurrer généreusement.','Porter le lait et la crème à frémissement avec sel, poivre, muscade.','Disposer les pommes de terre en couches régulières dans le plat.','Verser le mélange lait-crème. Enfourner à 160°C pendant 1h15.','Vérifier la cuisson avec la pointe d\'un couteau. Gratiner 10 min à 200°C.'],
    tags:['famille'], notePerso:'Ne pas rincer les pommes de terre : l\'amidon tient le gratin !', favori:true, dateAjout:1006
  },
  {
    id:1007, titre:'Pot-au-Feu', categorie:'famille',
    tempsPrep:20, tempsCuisson:180, portions:8, difficulte:'facile',
    ingredients:['1.5 kg de plat-de-côtes','500g de queue de bœuf','500g de jarret de bœuf','6 carottes','4 navets','4 poireaux','4 branches de céleri','2 oignons','1 bouquet garni','Gros sel, poivre en grains','Os à moelle'],
    etapes:['Mettre la viande dans une grande marmite, couvrir d\'eau froide. Porter à ébullition.','Écumer soigneusement pendant 15 minutes, puis réduire le feu.','Ajouter oignons, bouquet garni, poivre et gros sel.','Cuire 2 heures à frémissement avant d\'ajouter les légumes entiers.','Poursuivre 1 heure. Les os à moelle les 30 dernières minutes.','Servir bouillon en entrée, puis viande et légumes avec cornichons et moutarde.'],
    tags:['famille'], notePerso:'Conserver le bouillon pour faire des soupes ou des risottos.', favori:false, dateAjout:1007
  },
  {
    id:1008, titre:'Coq au Vin', categorie:'plats',
    tempsPrep:25, tempsCuisson:90, portions:4, difficulte:'moyen',
    ingredients:['1 poulet entier découpé','200g de lardons','200g de champignons de Paris','2 oignons','3 gousses d\'ail','75 cl de vin rouge','Bouquet garni','2 c.s de farine','50g de beurre','Sel, poivre'],
    etapes:['Faire dorer les morceaux de poulet dans le beurre. Réserver.','Dans la même cocotte, faire revenir lardons et oignons.','Remettre le poulet, saupoudrer de farine et remuer.','Verser le vin rouge, ajouter l\'ail et le bouquet garni.','Couvrir et mijoter 1h à feu doux. Ajouter les champignons 20 min avant la fin.','Rectifier l\'assaisonnement. Servir avec des pommes de terre vapeur.'],
    tags:['famille','fete'], notePerso:'Utiliser un vin de Bourgogne ou un Côtes du Rhône.', favori:false, dateAjout:1008
  },
  {
    id:1009, titre:'Cassoulet Toulousain', categorie:'famille',
    tempsPrep:30, tempsCuisson:180, portions:8, difficulte:'difficile',
    ingredients:['500g de haricots blancs secs (trempés une nuit)','4 cuisses de canard confites','400g de saucisses de Toulouse','200g de poitrine de porc','4 tomates pelées','4 gousses d\'ail','2 oignons','Bouquet garni','Chapelure, sel, poivre'],
    etapes:['Égoutter les haricots, les cuire 30 min dans de l\'eau salée.','Dans une cocotte, faire revenir la poitrine, les oignons, l\'ail.','Ajouter les tomates, les haricots égouttés, le bouquet garni, sel, poivre.','Couvrir d\'eau et mijoter 1h.','Ajouter les cuisses de canard et les saucisses. Couvrir de chapelure.','Enfourner à 160°C pendant 1h30 en enfonçant la croûte 3 fois pendant la cuisson.'],
    tags:['famille'], notePerso:'Le cassoulet est encore meilleur réchauffé le lendemain !', favori:false, dateAjout:1009
  },

  // ── RECETTES FRANÇAISES — DESSERTS & PÂTISSERIE ──
  {
    id:1010, titre:'Crème Brûlée à la Vanille', categorie:'desserts',
    tempsPrep:20, tempsCuisson:40, portions:6, difficulte:'moyen',
    ingredients:['6 jaunes d\'œufs','80g de sucre','50 cl de crème liquide entière','2 gousses de vanille','Sucre roux pour caraméliser'],
    etapes:['Préchauffer le four à 150°C. Fendre les gousses, gratter les graines.','Chauffer la crème avec les gousses de vanille et les graines.','Fouetter les jaunes avec le sucre jusqu\'à blanchiment. Verser la crème chaude doucement.','Filtrer la préparation. Remplir les ramequins.','Cuire au bain-marie 35-40 min. Les crèmes doivent être tremblantes au centre.','Réfrigérer au moins 4h. Saupoudrer de sucre roux et caraméliser au chalumeau.'],
    tags:['fete'], notePerso:'La technique du chalumeau donne un caramel parfait et craquant.', favori:true, dateAjout:1010
  },
  {
    id:1011, titre:'Île Flottante', categorie:'desserts',
    tempsPrep:25, tempsCuisson:15, portions:4, difficulte:'moyen',
    ingredients:['Blancs : 4 blancs d\'œufs, 80g sucre, 1 pincée de sel','Crème anglaise : 4 jaunes, 80g sucre, 50cl lait, 1 gousse de vanille','Caramel : 100g sucre, quelques gouttes de citron'],
    etapes:['Crème anglaise : infuser la vanille dans le lait. Fouetter jaunes+sucre, verser le lait chaud. Cuire à 82°C en remuant. Laisser refroidir.','Battre les blancs en neige ferme avec le sel et le sucre.','Former des îles avec 2 grandes cuillères. Les pocher 2 min dans du lait frémissant.','Égoutter les îles sur un torchon propre.','Faire un caramel blond avec le sucre et quelques gouttes de citron.','Verser la crème anglaise dans des coupes, poser les îles, napper de caramel.'],
    tags:['fete'], notePerso:'Le caramel doit être coulé au dernier moment pour qu\'il reste craquant.', favori:false, dateAjout:1011
  },
  {
    id:1012, titre:'Madeleines au Beurre Noisette', categorie:'gouter',
    tempsPrep:15, tempsCuisson:12, portions:24, difficulte:'facile',
    ingredients:['3 œufs','150g de sucre','180g de farine','1 sachet de levure','150g de beurre','Zeste d\'un citron','1 pincée de sel'],
    etapes:['Faire fondre le beurre jusqu\'à coloration noisette et le laisser tiédir.','Fouetter œufs et sucre jusqu\'à blanchiment.','Incorporer farine, levure et sel. Puis le beurre noisette et le zeste.','Filmer la pâte et réfrigérer 1h (étape cruciale pour la bosse).','Préchauffer le four à 220°C. Beurrer et fariner le moule.','Remplir les empreintes aux 3/4. Cuire 10-12 min. La bosse doit se former.'],
    tags:['enfants','rapide'], notePerso:'Le choc thermique (pâte froide / four très chaud) crée la bosse caractéristique !', favori:false, dateAjout:1012
  },
  {
    id:1013, titre:'Tarte au Citron Meringuée', categorie:'patisserie',
    tempsPrep:40, tempsCuisson:35, portions:8, difficulte:'difficile',
    ingredients:['Pâte sablée : 250g farine, 125g beurre, 80g sucre, 1 œuf','Lemon curd : 4 citrons (zeste+jus), 3 œufs, 150g sucre, 80g beurre','Meringue : 3 blancs d\'œufs, 150g sucre'],
    etapes:['Pâte sablée : sabler beurre+farine, ajouter sucre et œuf. Frigo 30 min.','Foncer le moule, piquer, cuire à blanc 20 min à 180°C.','Lemon curd : chauffer jus+zestes+sucre, ajouter œufs battus, cuire en remuant jusqu\'à épaississement, ajouter beurre.','Verser le curd sur le fond de tarte refroidi.','Meringue : battre les blancs, incorporer le sucre en pluie. Pocher sur la tarte.','Dorer la meringue au chalumeau ou 3 min sous le gril.'],
    tags:['fete'], notePerso:'Le curd doit napper la cuillère avant d\'être versé sur la tarte.', favori:true, dateAjout:1013
  },
  {
    id:1014, titre:'Financiers aux Amandes', categorie:'gouter',
    tempsPrep:10, tempsCuisson:15, portions:12, difficulte:'facile',
    ingredients:['100g de poudre d\'amandes','180g de sucre glace','60g de farine','4 blancs d\'œufs','150g de beurre','1 c.c d\'extrait d\'amande amère'],
    etapes:['Préchauffer le four à 200°C. Faire le beurre noisette.','Mélanger poudre d\'amandes, sucre glace et farine.','Incorporer les blancs d\'œufs (pas montés), puis le beurre noisette tiède.','Ajouter l\'extrait d\'amande amère.','Remplir les moules beurres. Cuire 12-15 min.','Doivent être dorés en surface et moelleux à l\'intérieur.'],
    tags:['rapide','enfants'], notePerso:'Ajouter une framboise au centre avant d\'enfourner pour une version festive.', favori:false, dateAjout:1014
  },
  {
    id:1015, titre:'Clafoutis aux Cerises', categorie:'desserts',
    tempsPrep:15, tempsCuisson:40, portions:6, difficulte:'facile',
    ingredients:['500g de cerises fraîches (avec noyaux)','3 œufs','100g de sucre','100g de farine','30 cl de lait entier','1 sachet de sucre vanillé','Beurre et sucre pour le moule'],
    etapes:['Préchauffer le four à 180°C. Beurrer et sucrer le plat à gratin.','Ne pas dénoyauter les cerises (elles gardent plus de saveur).','Mélanger œufs, sucre, sucre vanillé, puis ajouter la farine.','Délayer progressivement avec le lait pour obtenir une pâte lisse.','Disposer les cerises dans le plat, verser la pâte par-dessus.','Cuire 40 min. Saupoudrer de sucre glace avant de servir tiède.'],
    tags:['famille','rapide'], notePerso:'Les noyaux des cerises donnent un goût d\'amande subtil à la pâte.', favori:false, dateAjout:1015
  },
  {
    id:1016, titre:'Far Breton aux Pruneaux', categorie:'patisserie',
    tempsPrep:10, tempsCuisson:50, portions:8, difficulte:'facile',
    ingredients:['200g de farine','200g de sucre','4 œufs','100 cl de lait entier','200g de pruneaux dénoyautés','2 c.s de rhum','1 sachet de sucre vanillé','Beurre'],
    etapes:['Faire macérer les pruneaux dans le rhum pendant 1 heure.','Préchauffer le four à 200°C. Beurrer généreusement un plat.','Mélanger farine et sucre, ajouter les œufs un par un.','Verser le lait progressivement en fouettant pour éviter les grumeaux.','Ajouter le rhum des pruneaux et le sucre vanillé.','Verser la pâte dans le plat, répartir les pruneaux. Cuire 50 min.'],
    tags:['famille'], notePerso:'Le far doit avoir l\'aspect d\'un flan dense. Servir froid.', favori:false, dateAjout:1016
  },
  {
    id:1017, titre:'Soufflé au Chocolat', categorie:'desserts',
    tempsPrep:20, tempsCuisson:12, portions:4, difficulte:'difficile',
    ingredients:['200g de chocolat noir 70%','4 jaunes + 5 blancs d\'œufs','80g de sucre','30g de beurre','20g de farine','20 cl de lait','Beurre et sucre pour les ramequins'],
    etapes:['Beurrer et sucrer les ramequins. Réfrigérer.','Faire une béchamel avec beurre, farine et lait. Ajouter le chocolat fondu.','Hors du feu, incorporer les jaunes d\'œufs un par un.','Battre les blancs en neige ferme avec 40g de sucre.','Incorporer 1/3 des blancs énergiquement, puis le reste délicatement.','Remplir les ramequins aux 3/4. Cuire IMMÉDIATEMENT à 190°C pendant 12 min. NE PAS OUVRIR LE FOUR.'],
    tags:['fete'], notePerso:'Servir IMMÉDIATEMENT à la sortie du four. C\'est l\'essentiel !', favori:false, dateAjout:1017
  },
  {
    id:1018, titre:'Pain Perdu à la Française', categorie:'gouter',
    tempsPrep:10, tempsCuisson:10, portions:4, difficulte:'facile',
    ingredients:['8 tranches de pain rassis','3 œufs','25 cl de lait','50g de sucre','1 sachet de sucre vanillé','50g de beurre','Cannelle (optionnel)'],
    etapes:['Battre les œufs avec le lait, le sucre et le sucre vanillé.','Tremper les tranches de pain dans ce mélange des deux côtés.','Chauffer le beurre dans une poêle à feu moyen.','Faire dorer les tranches 2-3 min de chaque côté.','Saupoudrer de sucre et de cannelle.','Servir chaud avec du miel, de la confiture ou de la crème fouettée.'],
    tags:['rapide','enfants','economique'], notePerso:'Idéal pour utiliser un pain qui commence à durcir.', favori:false, dateAjout:1018
  },
  {
    id:1019, titre:'Crêpes Bretonnes', categorie:'gouter',
    tempsPrep:10, tempsCuisson:20, portions:4, difficulte:'facile',
    ingredients:['250g de farine','3 œufs','50 cl de lait','25g de beurre fondu','1 pincée de sel','1 c.s de sucre','2 c.s de rhum ou fleur d\'oranger (facultatif)'],
    etapes:['Mélanger farine, sel et sucre. Creuser un puits, ajouter les œufs.','Incorporer le lait progressivement en fouettant pour éviter les grumeaux.','Ajouter le beurre fondu et le rhum. La pâte doit être fluide.','Laisser reposer 1h minimum (idéalement une nuit au frigo).','Faire cuire dans une poêle légèrement beurrée, 1-2 min par face.','Garnir au choix : sucre, beurre salé, Nutella, confiture...'],
    tags:['enfants','famille','rapide'], notePerso:'Le repos de la pâte est indispensable pour des crêpes légères et souples.', favori:false, dateAjout:1019
  },
  {
    id:1020, titre:'Tarte Tatin Caramel', categorie:'patisserie',
    tempsPrep:30, tempsCuisson:40, portions:8, difficulte:'moyen',
    ingredients:['1 pâte feuilletée','6 pommes golden','120g de sucre','60g de beurre','1 gousse de vanille'],
    etapes:['Faire fondre le beurre et le sucre dans un moule à manqué pour obtenir un caramel brun.','Éplucher et couper les pommes en quartiers, les disposer serrés sur le caramel.','Ajouter les graines de vanille.','Couvrir avec la pâte feuilletée en rentrant les bords sous les pommes.','Cuire à 190°C pendant 35-40 min.','Retourner immédiatement sur le plat de service dès la sortie du four.'],
    tags:['fete'], notePerso:'Ne pas attendre pour retourner la tarte, le caramel doit être encore liquide !', favori:false, dateAjout:1020
  },
  {
    id:1021, titre:'Mousse au Chocolat Noir', categorie:'desserts',
    tempsPrep:20, tempsCuisson:0, portions:6, difficulte:'facile',
    ingredients:['200g de chocolat noir 70%','4 œufs','40g de sucre','1 pincée de sel'],
    etapes:['Faire fondre le chocolat au bain-marie. Laisser tiédir.','Séparer les blancs des jaunes. Incorporer les jaunes au chocolat.','Monter les blancs en neige ferme avec le sel et le sucre.','Incorporer délicatement les blancs au chocolat en 3 fois à la maryse.','Répartir dans des verrines. Réfrigérer au moins 2h avant de servir.'],
    tags:['rapide','economique'], notePerso:'Ajouter une touche de fleur de sel sur le dessus pour sublimer le chocolat !', favori:true, dateAjout:1021
  },
  {
    id:1022, titre:'Croissants Feuilletés', categorie:'patisserie',
    tempsPrep:180, tempsCuisson:20, portions:12, difficulte:'difficile',
    ingredients:['500g de farine T45','280ml de lait tiède','10g de levure boulangère','60g de sucre','10g de sel','40g de beurre mou','250g de beurre de tourage','1 jaune d\'œuf pour la dorure'],
    etapes:['Mélanger farine, levure, sucre, sel, beurre mou et lait. Pétrir 10 min. Filmer et réfrigérer 1h.','Étaler la détrempe en rectangle. Placer le beurre de tourage au centre, refermer.','Donner 3 tours doubles (tourage) en réfrigérant 30 min entre chaque tour.','Abaisser la pâte à 3mm. Couper des triangles. Rouler depuis la base vers la pointe.','Dorer et laisser pousser 2h à température ambiante.','Cuire à 180°C pendant 18-20 min jusqu\'à coloration dorée.'],
    tags:['fete'], notePerso:'La qualité du beurre de tourage est primordiale pour un bon feuilletage.', favori:false, dateAjout:1022
  },

  // ── RECETTES FRANÇAISES — BOISSONS ──
  {
    id:1023, titre:'Limonade Maison à la Menthe', categorie:'boissons',
    tempsPrep:10, tempsCuisson:5, portions:6, difficulte:'facile',
    ingredients:['4 citrons non traités','1 litre d\'eau gazeuse très froide','100g de sucre','Un bouquet de menthe fraîche','Glaçons'],
    etapes:['Presser les citrons. Récupérer les zestes de 2 citrons.','Faire un sirop en chauffant sucre + 10 cl d\'eau avec les zestes 5 min.','Laisser infuser les feuilles de menthe dans le sirop chaud 10 min. Filtrer.','Mélanger le jus de citron et le sirop refroidi dans un pichet.','Verser l\'eau gazeuse au moment de servir. Ajouter les glaçons.','Décorer avec des feuilles de menthe fraîche.'],
    tags:['rapide','enfants','healthy'], notePerso:'Ajuster sucre selon les citrons. Peut aussi se faire avec de l\'eau plate.', favori:false, dateAjout:1023
  },
  {
    id:1024, titre:'Chocolat Chaud Viennois', categorie:'boissons',
    tempsPrep:5, tempsCuisson:10, portions:2, difficulte:'facile',
    ingredients:['50 cl de lait entier','100g de chocolat noir de qualité','2 c.s de sucre','1 c.c d\'extrait de vanille','Chantilly maison pour servir','Cacao en poudre pour décorer'],
    etapes:['Hacher finement le chocolat.','Chauffer le lait à feu doux, ne pas le faire bouillir.','Ajouter le chocolat haché et fouetter jusqu\'à dissolution complète.','Ajouter le sucre et la vanille. Mélanger.','Verser dans des tasses chaudes.','Garnir d\'une belle touche de chantilly et saupoudrer de cacao.'],
    tags:['enfants','rapide','economique'], notePerso:'Un chocolat noir à 70% donne un résultat incomparable.', favori:false, dateAjout:1024
  },

  // ============================================================
  // RECETTES SÉNÉGALAISES
  // ============================================================
  {
    id:2001, titre:'Thiéboudienne (Riz au Poisson)', categorie:'senegalaise',
    tempsPrep:45, tempsCuisson:90, portions:8, difficulte:'difficile',
    ingredients:['1.5 kg de poisson (thiof / mérou / capitaine)','500g de riz brisé','1 chou','4 carottes','2 aubergines locales','4 tomates fraîches','3 c.s de concentré de tomates','1 oignon','4 gousses d\'ail','Persil frais','Piment habanero','Huile d\'arachide','Sel, poivre noir','Netetou (ferment de néré – optionnel)'],
    etapes:['Préparer la farce : mixer ail, persil, piment. Farcir les morceaux de poisson avec ce mélange.','Faire frire le poisson dans l\'huile chaude jusqu\'à coloration. Réserver.','Dans la même huile, faire revenir l\'oignon, ajouter concentré de tomates et tomates fraîches.','Ajouter 2L d\'eau, les légumes (carottes, chou, aubergines), netetou, sel, poivre. Mijoter 30 min.','Retirer les légumes. Dans le bouillon restant, verser le riz, couvrir et cuire à feu doux jusqu\'à absorption.','Dresser : riz au centre, légumes tout autour, poisson frit posé sur le riz.'],
    tags:['famille'], notePerso:'Le Thiéboudienne est le plat national du Sénégal. Le netetou donne ce goût authentique unique.', favori:true, dateAjout:2001
  },
  {
    id:2002, titre:'Yassa Poulet', categorie:'senegalaise',
    tempsPrep:30, tempsCuisson:60, portions:6, difficulte:'facile',
    ingredients:['1 poulet entier découpé','6 gros oignons','4 citrons (jus)','4 gousses d\'ail','2 piments (optionnel)','4 c.s de moutarde','Huile d\'arachide','Sel, poivre','Riz blanc pour servir'],
    etapes:['Mariner le poulet : mélanger jus de citron, ail écrasé, oignons émincés, moutarde, sel, poivre. Mariner 2h minimum (idéalement une nuit).','Séparer le poulet des oignons. Faire griller le poulet au barbecue ou à la poêle.','Faire revenir les oignons de la marinade à l\'huile jusqu\'à caramélisation dorée.','Ajouter le reste de la marinade et un peu d\'eau. Mijoter 15 min.','Ajouter le poulet grillé dans la sauce aux oignons. Mijoter encore 15 min.','Servir avec du riz blanc. L\'acidité citronnée doit bien se sentir.'],
    tags:['famille'], notePerso:'Le secret : bien caraméliser les oignons. Et le grillage du poulet avant la sauce est indispensable !', favori:true, dateAjout:2002
  },
  {
    id:2003, titre:'Mafé (Sauce Arachide)', categorie:'senegalaise',
    tempsPrep:20, tempsCuisson:90, portions:6, difficulte:'moyen',
    ingredients:['800g de viande de bœuf (ou agneau)','300g de pâte d\'arachide pure','3 c.s de concentré de tomates','2 oignons','3 carottes','2 pommes de terre','2 patates douces','1 piment','4 gousses d\'ail','Huile d\'arachide','Sel, poivre noir'],
    etapes:['Faire revenir la viande coupée en morceaux dans l\'huile chaude avec les oignons.','Ajouter le concentré de tomates, l\'ail écrasé. Remuer 5 min.','Délayer la pâte d\'arachide dans 1L d\'eau chaude. Verser sur la viande.','Ajouter les légumes entiers, le piment, sel et poivre.','Couvrir et mijoter à feu doux 1h30 en remuant régulièrement pour éviter que ça accroche.','Rectifier la consistance (ajouter eau si trop épais). Servir avec du riz.'],
    tags:['famille'], notePerso:'La sauce doit être épaisse et bien dorée. Remuer souvent car la pâte d\'arachide peut coller.', favori:false, dateAjout:2003
  },
  {
    id:2004, titre:'Thiébou Yapp (Riz à la Viande)', categorie:'senegalaise',
    tempsPrep:20, tempsCuisson:90, portions:6, difficulte:'moyen',
    ingredients:['600g de viande de mouton ou bœuf (avec os)','500g de riz brisé','3 c.s de concentré de tomates','4 tomates fraîches','2 oignons','3 carottes','1 navet','4 gousses d\'ail','Piment','Huile d\'arachide','Sel, poivre, laurier'],
    etapes:['Faire dorer la viande à l\'huile. Réserver.','Faire revenir les oignons, ajouter concentré de tomates et tomates fraîches.','Remettre la viande, couvrir d\'eau (1.5L), ajouter légumes, ail, laurier, piment.','Mijoter 1h jusqu\'à ce que la viande soit tendre. Retirer légumes et viande.','Dans le bouillon, verser le riz. Couvrir et cuire à feu doux jusqu\'à absorption.','Dresser sur un grand plat : riz, viande et légumes.'],
    tags:['famille'], notePerso:'Variante du Thiéboudienne mais avec de la viande rouge à la place du poisson.', favori:false, dateAjout:2004
  },
  {
    id:2005, titre:'Domoda (Ragoût à l\'Arachide)', categorie:'senegalaise',
    tempsPrep:20, tempsCuisson:75, portions:6, difficulte:'facile',
    ingredients:['700g de poulet ou bœuf','250g de pâte d\'arachide','2 c.s de concentré de tomates','2 oignons','3 gousses d\'ail','2 carottes','2 pommes de terre','Piment, sel, poivre','Huile d\'arachide'],
    etapes:['Faire revenir la viande dans l\'huile avec les oignons émincés.','Ajouter ail, concentré de tomates. Faire revenir 5 min.','Diluer la pâte d\'arachide dans 80 cl d\'eau chaude.','Verser sur la viande. Ajouter légumes, piment, sel, poivre.','Mijoter 1h à feu doux en remuant fréquemment.','Servir avec du riz blanc.'],
    tags:['famille'], notePerso:'Version gambienne très proche du mafé sénégalais, légèrement plus simple.', favori:false, dateAjout:2005
  },
  {
    id:2006, titre:'Caldou (Soupe de Poisson Sérère)', categorie:'senegalaise',
    tempsPrep:15, tempsCuisson:30, portions:4, difficulte:'facile',
    ingredients:['600g de poisson blanc (capitaine ou dorade)','2 oignons','4 gousses d\'ail','1 citron (jus)','Piment vert','3 c.s d\'huile d\'arachide','Sel, poivre','Riz ou fonio pour servir'],
    etapes:['Préparer le poisson en morceaux, assaisonner avec sel, ail, citron.','Faire revenir les oignons dans l\'huile jusqu\'à transparence.','Ajouter l\'ail, le piment, puis 80 cl d\'eau. Porter à ébullition.','Plonger le poisson dans le bouillon. Cuire 15-20 min à feu doux.','Ajuster l\'assaisonnement. La soupe doit être légère et parfumée.','Servir avec du riz blanc ou du fonio.'],
    tags:['rapide','healthy'], notePerso:'Plat traditionnel sérère, léger et savoureux. L\'ail et le citron sont les saveurs dominantes.', favori:false, dateAjout:2006
  },
  {
    id:2007, titre:'Superkanja (Sauce Gombo)', categorie:'senegalaise',
    tempsPrep:20, tempsCuisson:60, portions:6, difficulte:'moyen',
    ingredients:['500g de gombo frais','400g de poisson fumé','200g de crevettes séchées','2 c.s de pâte d\'arachide (optionnel)','2 oignons','3 gousses d\'ail','Piment','Huile de palme ou d\'arachide','Sel, netetou'],
    etapes:['Couper le gombo en rondelles. Plus on coupe fin, plus la sauce sera liante.','Faire revenir les oignons dans l\'huile. Ajouter ail et piment.','Ajouter le poisson fumé émietté et les crevettes séchées.','Incorporer le gombo, 50 cl d\'eau, netetou, sel. Bien mélanger.','Mijoter 30-40 min à feu doux en remuant. La sauce va épaissir.','Servir avec du riz blanc. La sauce doit être liante et parfumée.'],
    tags:['famille'], notePerso:'Le gombo donne cette texture filante caractéristique. C\'est voulu et apprécié !', favori:false, dateAjout:2007
  },
  {
    id:2008, titre:'Acara (Beignets de Haricots)', categorie:'senegalaise',
    tempsPrep:30, tempsCuisson:15, portions:4, difficulte:'moyen',
    ingredients:['500g de niébé (haricots blancs ou cornilles)','1 oignon','1 piment vert','Sel','Huile d\'arachide pour la friture'],
    etapes:['Tremper les haricots une nuit. Les frotter pour enlever les peaux.','Mixer les haricots avec l\'oignon, le piment et le sel jusqu\'à obtenir une pâte épaisse.','Battre la pâte à la main ou au fouet pour l\'aérer (10 minutes). Elle doit être mousseuse.','Chauffer l\'huile à 170°C.','Déposer des boules de pâte à la cuillère dans l\'huile chaude.','Frire 3-4 min en retournant jusqu\'à coloration dorée. Égoutter sur du papier absorbant.'],
    tags:['rapide','economique'], notePerso:'La clé : bien battre la pâte pour l\'aérer. Servir chaud avec une sauce tomate-oignon.', favori:false, dateAjout:2008
  },
  {
    id:2009, titre:'Thiakry (Dessert au Couscous de Mil)', categorie:'senegalaise',
    tempsPrep:20, tempsCuisson:10, portions:6, difficulte:'facile',
    ingredients:['500g de thiakry (couscous de mil)','1 litre de lait fermenté (lait caillé ou yaourt nature)','100g de sucre','1 c.c de vanille','Noix de coco râpée (optionnel)','Raisins secs (optionnel)'],
    etapes:['Faire cuire le thiakry à la vapeur 10-15 min jusqu\'à ce qu\'il soit tendre.','Laisser refroidir complètement. Égrainer avec les mains.','Mélanger avec le lait fermenté.','Ajouter sucre, vanille, noix de coco et raisins secs.','Bien mélanger. La consistance doit être crémeuse.','Réfrigérer 2h avant de servir. Servir bien frais.'],
    tags:['enfants','economique'], notePerso:'Dessert traditionnel servi lors des baptêmes et fêtes. Rafraîchissant et nutritif.', favori:false, dateAjout:2009
  },
  {
    id:2010, titre:'Ngalakh (Dessert de Carême et Pâques)', categorie:'senegalaise',
    tempsPrep:20, tempsCuisson:15, portions:8, difficulte:'moyen',
    ingredients:['500g de farine de mil (bouille)','500g de pâte d\'arachide','200g de poudre de baobab (bouye)','100g de sucre','1 litre de lait','Eau de fleur d\'oranger','Noix de coco râpée'],
    etapes:['Faire cuire la farine de mil avec de l\'eau en remuant comme une bouillie.','Diluer la pâte d\'arachide dans 50 cl d\'eau tiède.','Incorporer la pâte d\'arachide dans la bouillie hors du feu.','Ajouter la poudre de baobab, le sucre, l\'eau de fleur d\'oranger.','Allonger avec le lait pour obtenir une consistance crémeuse.','Saupoudrer de noix de coco. Servir froid.'],
    tags:['fete'], notePerso:'Dessert symbolique préparé pour Pâques et le Carême au Sénégal. Goût unique grâce au baobab.', favori:false, dateAjout:2010
  },

  // ── BOISSONS SÉNÉGALAISES ──
  {
    id:2011, titre:'Bissap (Jus d\'Hibiscus)', categorie:'boissons',
    tempsPrep:10, tempsCuisson:15, portions:8, difficulte:'facile',
    ingredients:['200g de fleurs d\'hibiscus séchées (bissap)','1.5 litre d\'eau','150g de sucre','Menthe fraîche','Jus de citron (optionnel)','Gingembre frais (optionnel)'],
    etapes:['Porter l\'eau à ébullition. Ajouter les fleurs d\'hibiscus.','Laisser bouillir 10 min puis éteindre le feu.','Ajouter le sucre et remuer jusqu\'à dissolution.','Laisser infuser 30 min. Filtrer soigneusement.','Ajouter jus de citron ou gingembre selon les goûts.','Servir froid sur glace avec des feuilles de menthe.'],
    tags:['rapide','healthy','enfants'], notePerso:'La couleur rouge intense est magnifique ! Riche en vitamine C.', favori:false, dateAjout:2011
  },
  {
    id:2012, titre:'Bouye (Jus de Baobab)', categorie:'boissons',
    tempsPrep:10, tempsCuisson:0, portions:6, difficulte:'facile',
    ingredients:['200g de poudre de fruit de baobab','1.5 litre d\'eau froide','100g de sucre','Lait (optionnel pour version crémeuse)','Glaçons'],
    etapes:['Délayer la poudre de baobab dans 50 cl d\'eau froide en fouettant bien.','Filtrer pour enlever les fibres si désiré.','Ajouter le reste de l\'eau et le sucre. Bien mélanger.','Pour version crémeuse : remplacer 30 cl d\'eau par du lait.','Réfrigérer 1h minimum.','Servir très frais sur des glaçons.'],
    tags:['healthy','rapide'], notePerso:'Le baobab est un superaliment riche en calcium et antioxydants. Goût légèrement acidulé.', favori:false, dateAjout:2012
  },
  {
    id:2013, titre:'Ginger Beer (Jus de Gingembre)', categorie:'boissons',
    tempsPrep:15, tempsCuisson:10, portions:8, difficulte:'facile',
    ingredients:['300g de gingembre frais','1.5 litre d\'eau','200g de sucre','2 citrons (jus)','Quelques clous de girofle','Menthe fraîche'],
    etapes:['Éplucher et râper grossièrement le gingembre.','Porter l\'eau à ébullition. Ajouter le gingembre râpé et les clous de girofle.','Laisser bouillir 10 min, puis infuser 20 min hors du feu.','Filtrer, ajouter sucre et jus de citron. Mélanger.','Laisser refroidir complètement. Réfrigérer.','Servir froid avec des glaçons et de la menthe.'],
    tags:['healthy','rapide'], notePerso:'Ajuster le gingembre selon votre tolérance au piquant. Très digestif !', favori:false, dateAjout:2013
  },
  {
    id:2014, titre:'Thiou Poulet (Sauce Tomate Sénégalaise)', categorie:'senegalaise',
    tempsPrep:15, tempsCuisson:50, portions:4, difficulte:'facile',
    ingredients:['600g de poulet découpé','3 c.s de concentré de tomates','4 tomates fraîches','2 oignons','3 gousses d\'ail','1 piment','Laurier','Huile d\'arachide','Sel, poivre'],
    etapes:['Assaisonner le poulet avec sel, poivre, ail écrasé. Laisser mariner 30 min.','Faire frire le poulet jusqu\'à coloration dorée. Réserver.','Dans la même huile, faire revenir les oignons jusqu\'à transparence.','Ajouter concentré et tomates fraîches. Faire réduire 10 min.','Remettre le poulet, ajouter l\'eau, le piment et le laurier.','Mijoter 25 min. La sauce doit être épaisse et brillante. Servir avec du riz.'],
    tags:['famille','rapide'], notePerso:'Le thiou est la sauce de base de la cuisine sénégalaise. Simple et délicieux.', favori:false, dateAjout:2014
  },
];

// ============================================================
// LEXIQUE — 80+ TERMES CULINAIRES
// ============================================================
const LEXIQUE_CATEGORIES = [
  { id:'all',     label:'Tout',          icon:'📚' },
  { id:'tech',    label:'Techniques',    icon:'👩‍🍳' },
  { id:'patiss',  label:'Pâtisserie',    icon:'🧁' },
  { id:'viande',  label:'Viandes',       icon:'🥩' },
  { id:'sauce',   label:'Sauces',        icon:'🫕' },
  { id:'senega',  label:'Sénégalais',    icon:'🌍' },
  { id:'epices',  label:'Épices',        icon:'🌶️' },
  { id:'ustens',  label:'Ustensiles',    icon:'🔪' },
  { id:'france',  label:'Termes français',icon:'🇫🇷' },
];

const LEXIQUE_DATA = [
  // ── TECHNIQUES ──
  { terme:'Blanchir', cat:'tech', origine:'int',
    def:'Plonger un aliment dans de l\'eau bouillante salée quelques minutes, puis dans de l\'eau glacée pour stopper la cuisson. Permet de conserver la couleur des légumes verts.',
    astuce:'Pour les légumes verts (haricots, brocolis) : 2 min à l\'eau bouillante, puis eau glacée immédiatement.' },
  { terme:'Braiser', cat:'tech', origine:'fr',
    def:'Cuire un aliment dans un récipient fermé avec peu de liquide, à feu doux et longtemps. Idéal pour les viandes dures qui deviennent fondantes.',
    astuce:'Toujours faire dorer la viande avant de braiser pour développer les saveurs (réaction de Maillard).' },
  { terme:'Déglacer', cat:'tech', origine:'fr',
    def:'Verser un liquide (vin, bouillon, eau) dans un récipient chaud pour décoller les sucs de cuisson attachés au fond. Ces sucs sont pleins de saveur.',
    astuce:'Utiliser du vin, du cognac ou du bouillon. Remuer vigoureusement pour dissoudre tous les sucs dorés.' },
  { terme:'Émincer', cat:'tech', origine:'fr',
    def:'Couper en tranches fines et régulières. S\'applique aux légumes, viandes ou charcuteries. La régularité assure une cuisson homogène.',
    astuce:'Un bon couteau bien aiguisé est indispensable pour émincer proprement sans écraser les aliments.' },
  { terme:'Faire suer', cat:'tech', origine:'fr',
    def:'Cuire des légumes à feu doux dans de la matière grasse, sans coloration, jusqu\'à ce qu\'ils libèrent leur eau et deviennent transparents.',
    astuce:'Couvrir en début de cuisson pour accélérer le processus, puis découvrir pour éliminer l\'humidité.' },
  { terme:'Julienne', cat:'tech', origine:'fr',
    def:'Technique de découpe qui consiste à tailler les légumes en fins bâtonnets réguliers (2-3 mm d\'épaisseur, 5-6 cm de long).',
    astuce:'D\'abord couper en tranches fines, puis empiler les tranches et couper en bâtonnets.' },
  { terme:'Mijoter', cat:'tech', origine:'fr',
    def:'Cuire doucement à frémissement léger (90°C environ), en dessous du point d\'ébullition. Idéal pour les ragoûts et bouillons.',
    astuce:'On dit qu\'on mijote quand on voit de petites bulles monter lentement, pas une ébullition agitée.' },
  { terme:'Monter en neige', cat:'tech', origine:'int',
    def:'Fouetter des blancs d\'œufs jusqu\'à obtenir une mousse blanche et ferme. Incorpore de l\'air et donne de la légèreté aux préparations.',
    astuce:'Le bol et les fouets doivent être parfaitement propres et sans trace de gras pour que les blancs montent bien.' },
  { terme:'Pocher', cat:'tech', origine:'int',
    def:'Cuire un aliment dans un liquide frémissant (eau, bouillon, lait) sans le faire bouillir. Méthode douce qui préserve la texture.',
    astuce:'Pour les œufs pochés : eau vinaigrée (1 c.s pour 1L d\'eau), créer un tourbillon avant de glisser l\'œuf.' },
  { terme:'Réduire', cat:'tech', origine:'int',
    def:'Faire évaporer une partie du liquide d\'une sauce à feu vif ou moyen pour la concentrer et l\'épaissir naturellement.',
    astuce:'Surveiller en remuant. Une sauce réduite de moitié est généralement plus concentrée en saveurs.' },
  { terme:'Sauter', cat:'tech', origine:'int',
    def:'Cuire rapidement à feu vif dans peu de matière grasse en remuant ou en sautant la poêle. Idéal pour légumes et petites pièces de viande.',
    astuce:'La poêle doit être très chaude avant d\'ajouter les aliments pour éviter qu\'ils rendent de l\'eau.' },
  { terme:'Lier', cat:'tech', origine:'fr',
    def:'Épaissir une sauce ou un potage avec un agent liant : farine, fécule, jaune d\'œuf, crème, roux...',
    astuce:'Délayer toujours la fécule dans un liquide froid avant de l\'incorporer à la préparation chaude.' },
  { terme:'Monder', cat:'tech', origine:'fr',
    def:'Retirer la peau d\'un légume ou d\'un fruit (tomate, pêche) après l\'avoir ébouillant é quelques secondes.',
    astuce:'Inciser la peau en croix, 30 sec dans l\'eau bouillante, puis eau glacée. La peau part toute seule.' },

  // ── PÂTISSERIE ──
  { terme:'Chemiser', cat:'patiss', origine:'fr',
    def:'Tapisser l\'intérieur d\'un moule de papier sulfurisé, de beurre et farine, ou de biscuits pour faciliter le démoulage et donner une forme.',
    astuce:'Pour un gâteau : beurrer puis fariner en tapotant pour bien répartir. Tapoter le moule retourné pour enlever l\'excédent.' },
  { terme:'Foncer', cat:'patiss', origine:'fr',
    def:'Garnir le fond et les bords d\'un moule à tarte avec une pâte. La pâte doit bien adhérer aux bords sans bulle d\'air.',
    astuce:'Toujours piquer le fond avec une fourchette pour éviter que la pâte gonfle pendant la cuisson à blanc.' },
  { terme:'Cuire à blanc', cat:'patiss', origine:'fr',
    def:'Précuire un fond de tarte sans garniture pour qu\'il reste croustillant une fois garni. On pose des billes ou légumes secs sur la pâte.',
    astuce:'15-20 min à 180°C avec un papier sulfurisé et des haricots secs. Retirer 5 min avant la fin pour dorer.' },
  { terme:'Fraiser', cat:'patiss', origine:'fr',
    def:'Écraser la pâte avec la paume de la main pour mélanger les ingrédients sans la travailler excessivement. Donne une texture sablée.',
    astuce:'Ne fraiser qu\'une ou deux fois maximum pour ne pas développer le gluten, ce qui rendrait la pâte élastique.' },
  { terme:'Abaisser', cat:'patiss', origine:'fr',
    def:'Étaler une pâte au rouleau jusqu\'à obtenir l\'épaisseur souhaitée. S\'utilise pour les pâtes à tarte, les croissants...',
    astuce:'Toujours travailler sur un plan légèrement fariné. Tourner la pâte d\'un quart de tour à chaque passage.' },
  { terme:'Roux', cat:'patiss', origine:'fr',
    def:'Mélange de beurre fondu et de farine cuit ensemble, base de nombreuses sauces (béchamel, velouté). Le roux peut être blanc, blond ou brun.',
    astuce:'Cuire le roux 2 min à feu doux après l\'ajout de la farine pour éliminer le goût de farine crue.' },
  { terme:'Bain-marie', cat:'patiss', origine:'int',
    def:'Méthode de cuisson douce qui consiste à placer un récipient dans un autre contenant de l\'eau chaude. Évite les chocs thermiques.',
    astuce:'L\'eau ne doit pas bouillir. Pour fondre du chocolat : feu doux, le bol ne doit pas toucher l\'eau.' },
  { terme:'Tamiser', cat:'patiss', origine:'int',
    def:'Passer la farine, la levure ou le sucre glace à travers un tamis fin pour éliminer les grumeaux et aérer la préparation.',
    astuce:'Tamiser directement au-dessus du bol de préparation pour éviter de tout salir.' },
  { terme:'Tempérer', cat:'patiss', origine:'int',
    def:'Stabiliser le chocolat par des variations de température pour lui donner brillance et croquant. Technique des chocolatiers professionnels.',
    astuce:'Faire fondre à 45°C, refroidir à 27°C sur marbre, remonter à 31°C. Un chocolat tempéré craquera et brillera.' },
  { terme:'Ganache', cat:'patiss', origine:'fr',
    def:'Mélange de chocolat et de crème chaude utilisé pour fourrer ou napper les gâteaux, truffes et bonbons.',
    astuce:'Ratio de base : 1/1 (poids égal chocolat/crème) pour une ganache à tartiner. 2/1 pour des truffes fermes.' },
  { terme:'Feuilletage', cat:'patiss', origine:'fr',
    def:'Technique de pâtisserie qui consiste à incorporer du beurre dans la pâte par des pliages successifs (tourage) créant des centaines de couches.',
    astuce:'La pâte et le beurre doivent être à la même température pour un bon feuilletage. Travailler au froid.' },
  { terme:'Détrempe', cat:'patiss', origine:'fr',
    def:'En pâtisserie : pâte de base sans beurre de tourage, qui sera ensuite feuilletée. Aussi : pâte trop humide.',
    astuce:'La détrempe pour croissants doit être souple mais pas collante. Réfrigérer avant le tourage.' },

  // ── VIANDES ──
  { terme:'Mariner', cat:'viande', origine:'int',
    def:'Faire tremper un aliment dans un liquide aromatique (marinade) pour l\'attendrir, l\'aromatiser et le parfumer avant la cuisson.',
    astuce:'Viandes rouges : 4-24h minimum. Volaille : 2-8h. Toujours mariner au réfrigérateur et couvrir.' },
  { terme:'Dorer', cat:'viande', origine:'fr',
    def:'Faire colorer la surface d\'un aliment à feu vif dans de la matière grasse pour créer une croûte savoureuse. Réaction de Maillard.',
    astuce:'Ne pas surcharger la poêle : si les morceaux se touchent, ils cuisent à la vapeur et ne dorent pas.' },
  { terme:'Saigner', cat:'viande', origine:'fr',
    def:'En boucherie, retirer le sang de la viande par trempage dans l\'eau froide. Pour les abats (foie, rognons) afin d\'atténuer le goût fort.',
    astuce:'Tremper les abats 1-2h dans l\'eau froide légèrement salée, en changeant l\'eau une fois.' },
  { terme:'Piquer', cat:'viande', origine:'fr',
    def:'Insérer dans la chair d\'une viande des lardons, de l\'ail, des herbes avec une lardoire. Parfume la viande de l\'intérieur.',
    astuce:'Pour un gigot d\'agneau : inciser avec la pointe d\'un couteau et insérer des gousses d\'ail entières.' },
  { terme:'Barder', cat:'viande', origine:'fr',
    def:'Entourer une viande ou une volaille de fines tranches de lard pour la protéger du dessèchement pendant la cuisson.',
    astuce:'Fixer la barde avec de la ficelle de cuisine. Retirer la barde les 15 dernières minutes pour faire dorer la peau.' },
  { terme:'Cuisson rosée', cat:'viande', origine:'fr',
    def:'Cuisson d\'une viande rouge dont le centre est encore rose. Temperature à cœur : 55-60°C. Idéal pour le bœuf.',
    astuce:'Toujours laisser reposer la viande 5-10 min sous aluminium après cuisson pour redistribuer les jus.' },

  // ── SAUCES ──
  { terme:'Béchamel', cat:'sauce', origine:'fr',
    def:'Sauce de base française à base de roux blanc mouillé avec du lait. Base du gratin, des lasagnes et de nombreuses autres préparations.',
    astuce:'Verser le lait chaud progressivement sur le roux en fouettant pour éviter les grumeaux.' },
  { terme:'Velouté', cat:'sauce', origine:'fr',
    def:'Sauce de base à partir d\'un roux blanc mouillé avec un bouillon (volaille, veau ou poisson). Moins riche que la béchamel.',
    astuce:'La qualité du bouillon est primordiale car c\'est lui qui donne toute la saveur au velouté.' },
  { terme:'Hollandaise', cat:'sauce', origine:'fr',
    def:'Sauce chaude émulsionnée à base de jaunes d\'œufs et de beurre clarifié, avec du citron. Accompagne l\'asperge et le poisson.',
    astuce:'La préparation ne doit jamais dépasser 65°C pour éviter que les jaunes ne coagulent.' },
  { terme:'Brunoise', cat:'sauce', origine:'fr',
    def:'Technique de coupe en très petits dés de 1-2mm. Utilisée pour préparer une base aromatique (oignons, carottes, céleri).',
    astuce:'Couper d\'abord en julienne, puis couper perpendiculairement pour obtenir des petits cubes réguliers.' },
  { terme:'Mirepoix', cat:'sauce', origine:'fr',
    def:'Mélange de légumes (oignon, carotte, céleri) coupés en dés, utilisé comme base aromatique pour les sauces, ragoûts et bouillons.',
    astuce:'La taille de coupe dépend de la durée de cuisson : petits dés pour courte cuisson, gros dés pour long.' },

  // ── TERMES SÉNÉGALAIS ──
  { terme:'Thiéboudienne', cat:'senega', origine:'sn',
    def:'Plat national du Sénégal (thiébou dièn en wolof = riz au poisson). Riz cuit dans un bouillon de poisson avec légumes et tomates. Originaire de Saint-Louis.',
    astuce:'Le netetou (ferment de néré) est l\'ingrédient secret qui donne ce goût authentique irremplaçable.' },
  { terme:'Yassa', cat:'senega', origine:'sn',
    def:'Plat de la Casamance à base de viande ou poisson marinés au citron et cuits avec des oignons caramélisés. Saveur acidulée et sucrée.',
    astuce:'Les oignons doivent être bien caramélisés (30 min minimum) pour le goût authentique du yassa.' },
  { terme:'Mafé', cat:'senega', origine:'sn',
    def:'Ragoût de viande en sauce à base de pâte d\'arachide (cacahuète). Plat répandu en Afrique de l\'Ouest. Riche et savoureux.',
    astuce:'Remuer souvent ! La pâte d\'arachide colle facilement au fond. Ajouter de l\'eau si trop épais.' },
  { terme:'Netetou', cat:'senega', origine:'sn',
    def:'Ferment traditionnel de graines de néré (locust bean). Condiment essentiel de la cuisine sénégalaise avec une odeur forte mais un goût umami puissant.',
    astuce:'Utiliser en petite quantité : c\'est très parfumé ! Équivalent sénégalais du miso ou de la sauce poisson.' },
  { terme:'Thiof', cat:'senega', origine:'sn',
    def:'Mérou blanc. Poisson noble et savoureux, roi de la cuisine sénégalaise. Très apprécié pour le Thiéboudienne. Sa chair est ferme et délicate.',
    astuce:'Peut être remplacé par du capitaine, de la dorade royale ou tout poisson à chair ferme.' },
  { terme:'Bissap', cat:'senega', origine:'sn',
    def:'Fleurs d\'hibiscus séchées (Hibiscus sabdariffa). Servent à préparer la boisson nationale sénégalaise, rouge vif, acidulée et sucrée.',
    astuce:'Riche en vitamine C et antioxydants. La couleur rouge intense est naturelle et magnifique.' },
  { terme:'Bouye', cat:'senega', origine:'sn',
    def:'Fruit du baobab. Sa pulpe séchée en poudre est utilisée pour des jus et desserts. Goût acidulé caractéristique, très nutritif.',
    astuce:'Superaliment : riche en calcium (6x plus que le lait), vitamine C et fibres.' },
  { terme:'Fonio', cat:'senega', origine:'sn',
    def:'Céréale ancestrale d\'Afrique de l\'Ouest, petit grain plus fin que le couscous. Sans gluten, très nutritif. Cuit en 5 minutes.',
    astuce:'Rincer abondamment avant cuisson. Cuire avec le double de son volume en eau. Excellent avec les sauces.' },
  { terme:'Dibi', cat:'senega', origine:'sn',
    def:'Viande d\'agneau ou de mouton grillée sur braises, assaisonnée simplement. Plat de rue populaire au Sénégal, servi avec oignons et moutarde.',
    astuce:'La simplicité est le secret : bonne viande, braises bien chaudes, sel et citron suffisent.' },
  { terme:'Ceebu jen', cat:'senega', origine:'sn',
    def:'Autre nom du Thiéboudienne en wolof (riz au poisson). Ceebu = riz, jen = poisson. Le plat national sénégalais par excellence.',
    astuce:'Existe aussi en version "ceebu yapp" (riz à la viande) ou "ceebu guinar" (riz au poulet).' },
  { terme:'Thiou', cat:'senega', origine:'sn',
    def:'Sauce tomate à base d\'oignons et de concentré de tomates, base de nombreux plats sénégalais. Simple mais savoureux.',
    astuce:'Un bon thiou demande de la patience : laisser réduire la sauce tomate longuement pour concentrer les saveurs.' },
  { terme:'Mboum', cat:'senega', origine:'sn',
    def:'Légume-feuille sénégalais (feuilles de baobab séchées et réduites en poudre). Épaissit les sauces et apporte des nutriments.',
    astuce:'Équivalent du gombo pour lier les sauces. Riche en calcium, fer et protéines.' },

  // ── ÉPICES ──
  { terme:'Curcuma', cat:'epices', origine:'int',
    def:'Épice en poudre jaune-orangé issue d\'un rhizome. Goût terreux et légèrement amer. Donne la couleur jaune au curry et au riz.',
    astuce:'Anti-inflammatoire puissant. Mieux absorbé associé au poivre noir (pipérine active la curcumine).' },
  { terme:'Cumin', cat:'epices', origine:'int',
    def:'Épice aux graines allongées, goût chaud et terreux. Essentiel dans la cuisine du Moyen-Orient, d\'Inde et d\'Afrique du Nord.',
    astuce:'Torréfier légèrement les graines à sec avant de les moudre pour décupler les arômes.' },
  { terme:'Fenugrec', cat:'epices', origine:'int',
    def:'Graine amère aux arômes de caramel et de curry. Utilisée dans la cuisine indienne, africaine et comme médicament traditionnel.',
    astuce:'En petite quantité ! L\'amertume peut dominer le plat. Faire tremper les graines avant de les utiliser entières.' },
  { terme:'Piment de Cayenne', cat:'epices', origine:'int',
    def:'Piment séché et moulu, très piquant (30 000-50 000 unités Scoville). Utilisé dans de nombreuses cuisines mondiales.',
    astuce:'Commencer par 1/4 de cuillère à café pour goûter. Beaucoup plus piquant que le paprika !' },
  { terme:'Coriandre', cat:'epices', origine:'int',
    def:'Herbe fraîche aux feuilles ressemblant au persil mais au goût très distinct, parfumé et légèrement citronné. Aussi disponible en graines.',
    astuce:'Les graines et les feuilles ont des saveurs très différentes. Certains trouvent les feuilles fraiches « savon » : c\'est génétique !' },
  { terme:'Bouquet garni', cat:'epices', origine:'fr',
    def:'Assemblage d\'herbes aromatiques (thym, laurier, persil) attachées ensemble et utilisées pour parfumer les bouillons, sauces et ragoûts.',
    astuce:'Retirer le bouquet garni avant de servir. Peut être ficelé dans un morceau de poireau pour plus de facilité.' },

  // ── USTENSILES ──
  { terme:'Maryse', cat:'ustens', origine:'fr',
    def:'Spatule souple en silicone ou caoutchouc. Permet de racler les bords d\'un bol et d\'incorporer délicatement les blancs en neige.',
    astuce:'Irremplaçable pour les mouvements "envelopper" des mousses et soufflés. Utiliser une grande maryse pour efficacité.' },
  { terme:'Mandoline', cat:'ustens', origine:'fr',
    def:'Outil de cuisine permettant de trancher les légumes en lamelles très fines et régulières. Indispensable pour le gratin dauphinois.',
    astuce:'Toujours utiliser le protège-mains fourni ! La mandoline est l\'ustensile qui cause le plus de coupures en cuisine.' },
  { terme:'Chinois', cat:'ustens', origine:'fr',
    def:'Passoire conique à mailles fines pour filtrer les sauces et bouillons et leur donner une texture soyeuse et lisse.',
    astuce:'Passer les sauces au chinois en appuyant avec le dos d\'une cuillère pour extraire un maximum de liquide.' },
  { terme:'Rouleau à pâtisserie', cat:'ustens', origine:'int',
    def:'Cylindre lisse en bois ou métal utilisé pour abaisser (étaler) les pâtes en couche fine et uniforme.',
    astuce:'Travailler à froid pour les pâtes feuilletées. Faire tourner la pâte d\'un quart de tour régulièrement.' },
  { terme:'Chalumeau de cuisine', cat:'ustens', origine:'int',
    def:'Petit brûleur à gaz portable pour caraméliser le sucre (crème brûlée), gratiner ou dorer les préparations.',
    astuce:'Tenir à 10-15 cm de la surface. Faire des mouvements circulaires réguliers pour caraméliser sans brûler.' },

  // ── TERMES FRANÇAIS ──
  { terme:'Mise en place', cat:'france', origine:'fr',
    def:'Expression culinaire désignant la préparation et l\'organisation de tous les ingrédients et ustensiles avant de commencer la cuisson.',
    astuce:'C\'est la règle d\'or des cuisiniers professionnels : tout peser, couper et préparer AVANT de commencer à cuire.' },
  { terme:'Au jus', cat:'france', origine:'fr',
    def:'Viande servie avec son propre jus de cuisson naturel, non épaissi. Goût pur et concentré.',
    astuce:'Pour un jus parfait : déglacer le plat de cuisson avec du bouillon ou du vin et réduire.' },
  { terme:'En papillote', cat:'france', origine:'fr',
    def:'Technique de cuisson dans une enveloppe de papier sulfurisé ou d\'aluminium fermée hermétiquement. Cuisson vapeur dans le colis.',
    astuce:'La papillote gonfle pendant la cuisson : c\'est la vapeur qui se forme. Couper devant les convives pour l\'effet wow.' },
  { terme:'Gratiner', cat:'france', origine:'fr',
    def:'Passer un plat sous le gril du four ou avec un chalumeau pour créer une croûte dorée et croustillante en surface.',
    astuce:'Surveiller sans cesse : le passage du doré au brûlé peut prendre 30 secondes !' },
  { terme:'Déglacé', cat:'france', origine:'fr',
    def:'Qualifie une sauce obtenue après déglaçage. Ex : "escalope à la crème déglacée au cognac".',
    astuce:'Déglacer avec un alcool de qualité : le goût de la sauce reflètera directement la qualité du liquide utilisé.' },
  { terme:'Coulis', cat:'france', origine:'fr',
    def:'Purée liquide et fine de légumes ou de fruits, généralement crue ou très peu cuite, passée au mixeur et chinois.',
    astuce:'Pour un coulis de tomates : pas besoin de cuire. Mixer, filtrer, assaisonner. Simple et savoureux.' },
  { terme:'Confit', cat:'france', origine:'fr',
    def:'Technique de conservation par cuisson lente dans la graisse (canard confit) ou dans le sucre (fruits confits). Aussi : oignons confits.',
    astuce:'Cuisson à 80-90°C dans la graisse, jamais à frite. La graisse doit à peine frémir pendant la cuisson.' },
  { terme:'Fricassée', cat:'france', origine:'fr',
    def:'Préparation à mi-chemin entre le sauté et le ragoût. La viande est cuite dans sa sauce crémeuse, sans coloration préalable.',
    astuce:'La fricassée est plus délicate que le ragoût car la sauce reste blanche et crémeuse. Ne pas faire trop colorer.' },
];

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(view, param = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const navBtn = document.getElementById('nav-' + view);
  if (navBtn) navBtn.classList.add('active');

  const brand     = document.getElementById('headerBrand');
  const back      = document.getElementById('btnBack');
  const pageTitle = document.getElementById('headerTitle');
  const isSubView = ['recipe','add','category'].includes(view);

  brand.classList.toggle('hidden', isSubView);
  pageTitle.classList.toggle('hidden', !isSubView);
  back.classList.toggle('hidden', !isSubView);

  prevView    = currentView;
  currentView = view;

  if (view === 'home')      { document.getElementById('viewHome').classList.add('active'); renderHome(); }
  else if (view === 'recipe')    { document.getElementById('viewRecipe').classList.add('active'); pageTitle.textContent = 'Recette'; renderRecipeDetail(param); }
  else if (view === 'add')       { document.getElementById('viewAdd').classList.add('active'); pageTitle.textContent = editingId ? 'Modifier' : 'Nouvelle recette'; if (!editingId) resetForm(); }
  else if (view === 'favorites') { document.getElementById('viewFavorites').classList.add('active'); renderFavorites(); }
  else if (view === 'search')    { document.getElementById('viewSearch').classList.add('active'); setTimeout(() => document.getElementById('searchInput').focus(), 100); }
  else if (view === 'category')  { document.getElementById('viewCategory').classList.add('active'); renderCategoryView(param); }
  else if (view === 'lexique')   { document.getElementById('viewLexique').classList.add('active'); renderLexique(); }

  window.scrollTo(0, 0);
}

function goBack() {
  editingId = null;
  navigateTo(prevView || 'home');
}

// ============================================================
// RENDU ACCUEIL
// ============================================================
async function renderHome() {
  const recettes = await dbGetAll();
  const count = document.getElementById('recipeCount');
  count.textContent = recettes.length + ' recette' + (recettes.length !== 1 ? 's' : '');

  renderCategories(recettes);

  const grid  = document.getElementById('recipesGrid');
  if (recettes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🥄</div>
        <p>Aucune recette pour l'instant</p>
        <button class="btn-primary" onclick="navigateTo('add')">Ajouter ma première recette</button>
      </div>`;
    return;
  }
  const sorted = [...recettes].sort((a, b) => b.dateAjout - a.dateAjout);
  grid.innerHTML = sorted.map(r => recipeCardHTML(r)).join('');
}

async function renderCategories(recettes) {
  if (!recettes) recettes = await dbGetAll();
  const scroll = document.getElementById('categoriesScroll');
  const counts = {};
  recettes.forEach(r => { counts[r.categorie] = (counts[r.categorie] || 0) + 1; });

  let html = `<div class="cat-card cat-all" onclick="navigateTo('home')">
    <span class="cat-emoji">🍴</span>
    <span class="cat-name">Tout</span>
    <span class="cat-count">${recettes.length}</span>
  </div>`;

  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const n = counts[key] || 0;
    html += `<div class="cat-card ${cat.cls}" onclick="navigateTo('category','${key}')">
      <span class="cat-emoji">${cat.emoji}</span>
      <span class="cat-name">${cat.label.replace(/^\S+\s/,'')}</span>
      <span class="cat-count">${n}</span>
    </div>`;
  });
  scroll.innerHTML = html;
}

async function renderCategoryView(categorie) {
  const recettes = await dbGetAll();
  const filtered = recettes.filter(r => r.categorie === categorie);
  const cat      = CATEGORIES[categorie];

  document.getElementById('categoryViewTitle').textContent = cat ? cat.label : categorie;
  document.getElementById('headerTitle').textContent       = cat ? cat.label : categorie;
  document.getElementById('categoryCount').textContent     = filtered.length + ' recette' + (filtered.length !== 1 ? 's' : '');

  const grid = document.getElementById('categoryGrid');
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">${cat ? cat.emoji : '📂'}</div>
      <p>Aucune recette dans cette catégorie</p>
      <button class="btn-primary" onclick="navigateTo('add')">Ajouter une recette</button>
    </div>`;
  } else {
    grid.innerHTML = filtered.map(r => recipeCardHTML(r)).join('');
  }
}

// ── CARTE RECETTE ─────────────────────────────────────────
function recipeCardHTML(r) {
  const cat     = CATEGORIES[r.categorie] || {};
  const imgHTML = r.image
    ? `<img class="card-img" src="${r.image}" alt="${r.titre}" loading="lazy">`
    : `<div class="card-img-placeholder ${cat.ph || 'placeholder-default'}">${cat.emoji || '🍴'}</div>`;

  const temps    = (r.tempsPrep || 0) + (r.tempsCuisson || 0);
  const diffCls  = { facile:'diff-facile', moyen:'diff-moyen', difficile:'diff-difficile' }[r.difficulte] || 'diff-facile';
  const diffLbl  = { facile:'😊 Facile', moyen:'😐 Moyen', difficile:'😤 Difficile' }[r.difficulte] || '';
  const favIcon  = r.favori ? '❤️' : '🤍';

  return `
    <div class="recipe-card" onclick="navigateTo('recipe',${r.id})">
      <button class="card-fav-btn" onclick="event.stopPropagation();toggleFavorite(${r.id})">${favIcon}</button>
      ${imgHTML}
      <div class="card-body">
        <div class="card-title">${r.titre}</div>
        <div class="card-meta">
          ${temps>0 ? `<span class="card-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>${temps} min</span>` : ''}
          ${r.portions ? `<span class="card-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>${r.portions} pers.</span>` : ''}
        </div>
        <span class="card-diff ${diffCls}">${diffLbl}</span>
      </div>
    </div>`;
}

// ── FICHE RECETTE ─────────────────────────────────────────
async function renderRecipeDetail(id) {
  const r = await dbGet(Number(id));
  if (!r) { navigateTo('home'); return; }

  const cat     = CATEGORIES[r.categorie] || {};
  const imgHTML = r.image
    ? `<img class="recipe-hero" src="${r.image}" alt="${r.titre}">`
    : `<div class="recipe-hero-placeholder ${cat.ph || 'placeholder-default'}">${cat.emoji || '🍴'}</div>`;

  const diffCls = { facile:'diff-facile', moyen:'diff-moyen', difficile:'diff-difficile' }[r.difficulte] || '';

  document.getElementById('headerTitle').textContent = r.titre;
  document.getElementById('recipeDetail').innerHTML = `
    ${imgHTML}
    <div class="recipe-body">
      <h2 class="recipe-name">${r.titre}</h2>
      <div class="recipe-stats">
        <div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-value">${r.tempsPrep||'-'}</div><div class="stat-label">Prép.</div></div>
        <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">${r.tempsCuisson||'-'}</div><div class="stat-label">Cuisson</div></div>
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${r.portions||'-'}</div><div class="stat-label">Portions</div></div>
        <div class="stat-card">
          <div class="stat-icon">${r.difficulte==='facile'?'😊':r.difficulte==='moyen'?'😐':'😤'}</div>
          <div class="stat-value"><span class="card-diff ${diffCls}" style="padding:2px 5px">${r.difficulte||'-'}</span></div>
          <div class="stat-label">Niveau</div>
        </div>
      </div>
      ${(r.tags||[]).length ? `<div class="recipe-tags">${r.tags.map(t=>`<span class="tag-chip">${tagLabel(t)}</span>`).join('')}</div>` : ''}
      ${(r.ingredients||[]).filter(i=>i.trim()).length ? `
        <h3 class="recipe-section-title">🛒 Ingrédients</h3>
        <div>${(r.ingredients||[]).filter(i=>i.trim()).map(i=>`<div class="ingredient-item">${i}</div>`).join('')}</div>` : ''}
      ${(r.etapes||[]).filter(e=>e.trim()).length ? `
        <h3 class="recipe-section-title" style="margin-top:20px">👩‍🍳 Préparation</h3>
        <div>${(r.etapes||[]).filter(e=>e.trim()).map((e,i)=>`
          <div class="etape-item">
            <div class="etape-num">${i+1}</div>
            <div class="etape-text">${e}</div>
          </div>`).join('')}</div>` : ''}
      ${r.notePerso ? `<div class="note-box">💡 ${r.notePerso}</div>` : ''}
      <div class="recipe-actions">
        <button class="btn-edit" onclick="startEdit(${r.id})">✏️ Modifier</button>
        <button class="btn-delete" onclick="confirmDelete(${r.id})" title="Supprimer">🗑️</button>
      </div>
    </div>`;
}

function tagLabel(tag) {
  const m = { rapide:'⚡ Rapide', economique:'💰 Économique', famille:'👨‍👩‍👧 Famille', fete:'🎉 Fête', healthy:'🥗 Healthy', enfants:'👶 Enfants' };
  return m[tag] || tag;
}

// ── FAVORIS ───────────────────────────────────────────────
async function toggleFavorite(id) {
  const r = await dbGet(Number(id));
  if (!r) return;
  r.favori = !r.favori;
  await dbPut(r);
  showToast(r.favori ? '❤️ Ajouté aux favoris' : '💔 Retiré des favoris');
  if (currentView === 'home')      renderHome();
  if (currentView === 'favorites') renderFavorites();
  if (currentView === 'search')    searchRecipes(document.getElementById('searchInput').value);
  if (currentView === 'recipe')    renderRecipeDetail(id);
}

async function renderFavorites() {
  const recettes = await dbGetAll();
  const favs     = recettes.filter(r => r.favori);
  const grid     = document.getElementById('favoritesGrid');
  if (favs.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">💔</div><p>Aucune recette en favori</p><p style="font-size:.82rem;color:var(--text-light)">Appuyez sur 🤍 pour ajouter</p></div>`;
  } else {
    grid.innerHTML = favs.map(r => recipeCardHTML(r)).join('');
  }
}

// ── FORMULAIRE ────────────────────────────────────────────
function resetForm() {
  editingId = null;
  ['fId','fTitre','fPrep','fCuisson','fNote'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('fCategorie').value  = '';
  document.getElementById('fPortions').value   = '4';
  document.getElementById('fDifficulte').value = 'facile';
  document.getElementById('ingredientsList').innerHTML = '';
  document.getElementById('etapesList').innerHTML      = '';
  document.getElementById('imagePreview').innerHTML    = `
    <div class="image-placeholder">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>Ajouter une photo</span>
    </div>`;
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('formTitle').textContent = '✨ Nouvelle recette';
  addIngredient(); addEtape();
}

async function startEdit(id) {
  editingId = id;
  const r   = await dbGet(Number(id));
  if (!r) return;
  navigateTo('add');
  document.getElementById('fId').value         = r.id;
  document.getElementById('fTitre').value      = r.titre;
  document.getElementById('fCategorie').value  = r.categorie || '';
  document.getElementById('fPrep').value       = r.tempsPrep   || '';
  document.getElementById('fCuisson').value    = r.tempsCuisson|| '';
  document.getElementById('fPortions').value   = r.portions    || 4;
  document.getElementById('fDifficulte').value = r.difficulte  || 'facile';
  document.getElementById('fNote').value       = r.notePerso   || '';
  document.getElementById('formTitle').textContent = '✏️ Modifier la recette';
  document.getElementById('headerTitle').textContent = 'Modifier';
  if (r.image) document.getElementById('imagePreview').innerHTML = `<img src="${r.image}" style="width:100%;height:100%;object-fit:cover">`;
  document.getElementById('ingredientsList').innerHTML = '';
  (r.ingredients || []).forEach(i => addIngredient(i));
  if (!(r.ingredients || []).length) addIngredient();
  document.getElementById('etapesList').innerHTML = '';
  (r.etapes || []).forEach(e => addEtape(e));
  if (!(r.etapes || []).length) addEtape();
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.toggle('selected', (r.tags||[]).includes(b.dataset.tag)));
}

async function saveRecipe() {
  const titre     = document.getElementById('fTitre').value.trim();
  const categorie = document.getElementById('fCategorie').value;
  if (!titre)     { showToast('⚠️ Le titre est requis'); return; }
  if (!categorie) { showToast('⚠️ Choisissez une catégorie'); return; }

  const ingredients = [...document.getElementById('ingredientsList').querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean);
  const etapes      = [...document.getElementById('etapesList').querySelectorAll('textarea')].map(t=>t.value.trim()).filter(Boolean);
  const tags        = [...document.querySelectorAll('.tag-btn.selected')].map(b=>b.dataset.tag);
  const imgEl       = document.getElementById('imagePreview').querySelector('img');
  const image       = imgEl ? imgEl.src : '';
  const idField     = document.getElementById('fId').value;
  const id          = idField ? Number(idField) : Date.now();
  let favori = false;
  if (idField) { const ex = await dbGet(Number(idField)); favori = ex ? ex.favori : false; }

  await dbPut({ id, titre, categorie, image,
    tempsPrep: Number(document.getElementById('fPrep').value)||0,
    tempsCuisson: Number(document.getElementById('fCuisson').value)||0,
    portions:  Number(document.getElementById('fPortions').value)||4,
    difficulte: document.getElementById('fDifficulte').value,
    ingredients, etapes, tags,
    notePerso: document.getElementById('fNote').value.trim(),
    favori, dateAjout: idField ? id : Date.now()
  });
  showToast('✅ Recette enregistrée !');
  editingId = null;
  navigateTo('home');
}

function addIngredient(valeur = '') {
  const list = document.getElementById('ingredientsList');
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `<input type="text" placeholder="Ex : 200g de farine..." value="${valeur}">
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">✕</button>`;
  list.appendChild(div);
}

function addEtape(valeur = '') {
  const list = document.getElementById('etapesList');
  const idx  = list.children.length + 1;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `<div class="item-num">${idx}</div>
    <textarea class="etape-textarea" placeholder="Décrire cette étape..." oninput="autoResize(this)">${valeur}</textarea>
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">✕</button>`;
  list.appendChild(div);
}

function removeItem(btn) {
  btn.closest('.dynamic-item').remove();
  document.querySelectorAll('#etapesList .item-num').forEach((el, i) => { el.textContent = i + 1; });
}
function autoResize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tag-btn').forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('selected')));
});

function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`; };
  reader.readAsDataURL(file);
}

// ── SUPPRESSION ───────────────────────────────────────────
let pendingDeleteId = null;
function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalConfirmBtn').onclick = async () => {
    await dbDelete(Number(pendingDeleteId));
    closeModal(); showToast('🗑️ Recette supprimée'); navigateTo('home');
  };
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  pendingDeleteId = null;
}
document.getElementById('modal')?.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

// ── RECHERCHE ─────────────────────────────────────────────
async function searchRecipes(query) {
  const q      = (query || '').trim().toLowerCase();
  const header = document.getElementById('searchResultHeader');
  const title  = document.getElementById('searchResultTitle');
  const grid   = document.getElementById('searchGrid');
  document.getElementById('btnClearSearch').classList.toggle('hidden', !q);
  if (!q) {
    grid.innerHTML = `<div class="search-hint"><div class="empty-icon">🔍</div><p>Tapez pour rechercher une recette</p></div>`;
    header.style.display = 'none'; return;
  }
  const all     = await dbGetAll();
  const results = all.filter(r =>
    r.titre.toLowerCase().includes(q) ||
    (r.categorie||'').toLowerCase().includes(q) ||
    (r.ingredients||[]).some(i=>i.toLowerCase().includes(q)) ||
    (r.tags||[]).some(t=>t.toLowerCase().includes(q)) ||
    (r.notePerso||'').toLowerCase().includes(q)
  );
  header.style.display = '';
  title.textContent = `${results.length} résultat${results.length!==1?'s':''} pour "${query}"`;
  if (results.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🕵️</div><p>Aucune recette pour "<strong>${query}</strong>"</p></div>`;
  } else {
    grid.innerHTML = results.map(r => recipeCardHTML(r)).join('');
  }
}
function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = ''; searchRecipes(''); input.focus();
}

// ============================================================
// LEXIQUE
// ============================================================
function renderLexique(filterCat = null, searchQuery = '') {
  if (filterCat !== null) lexiqueFilter = filterCat;

  // Filtres
  const filtersEl = document.getElementById('lexiqueFilters');
  filtersEl.innerHTML = LEXIQUE_CATEGORIES.map(c => `
    <button class="lexique-filter-btn ${lexiqueFilter === c.id ? 'active' : ''}" onclick="renderLexique('${c.id}','${searchQuery}')">
      ${c.icon} ${c.label}
    </button>`).join('');

  // Filtrer les données
  let donnees = LEXIQUE_DATA;
  if (lexiqueFilter !== 'all') donnees = donnees.filter(e => e.cat === lexiqueFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    donnees = donnees.filter(e =>
      e.terme.toLowerCase().includes(q) ||
      e.def.toLowerCase().includes(q) ||
      (e.astuce||'').toLowerCase().includes(q)
    );
  }

  const content = document.getElementById('lexiqueContent');
  if (donnees.length === 0) {
    content.innerHTML = `<div class="lexique-empty">🔍 Aucun terme trouvé pour cette recherche.</div>`;
    return;
  }

  // Grouper par catégorie
  const groupes = {};
  donnees.forEach(e => {
    if (!groupes[e.cat]) groupes[e.cat] = [];
    groupes[e.cat].push(e);
  });

  const catsMeta = {
    tech:   { label:'Techniques de base',     icon:'👩‍🍳', cls:'tech' },
    patiss: { label:'Pâtisserie',              icon:'🧁', cls:'patiss' },
    viande: { label:'Viandes & Découpes',      icon:'🥩', cls:'viande' },
    sauce:  { label:'Sauces & Fonds',          icon:'🫕', cls:'sauce' },
    senega: { label:'Vocabulaire Sénégalais',  icon:'🌍', cls:'senega' },
    epices: { label:'Épices & Aromates',       icon:'🌶️', cls:'epices' },
    ustens: { label:'Ustensiles',              icon:'🔪', cls:'ustens' },
    france: { label:'Expressions Françaises',  icon:'🇫🇷', cls:'france' },
  };

  let html = '';
  Object.entries(groupes).forEach(([catKey, entries]) => {
    const meta = catsMeta[catKey] || { label: catKey, icon: '📖', cls: 'tech' };
    html += `
      <div class="lexique-section">
        <div class="lexique-section-title ${meta.cls}">${meta.icon} ${meta.label} <span style="opacity:.7;font-size:.82rem;font-weight:400">(${entries.length})</span></div>
        ${entries.sort((a,b) => a.terme.localeCompare(b.terme, 'fr')).map(e => `
          <div class="lexique-entry" onclick="toggleLexiqueEntry(this)">
            <div class="lexique-entry-header">
              <span class="lexique-entry-term">${e.terme}</span>
              <span class="lexique-entry-origin origin-${e.origine}">${e.origine === 'fr' ? '🇫🇷 Fr' : e.origine === 'sn' ? '🌍 Sn' : '🌐 Int'}</span>
              <span class="lexique-chevron">▼</span>
            </div>
            <div class="lexique-entry-body">
              ${e.def}
              ${e.astuce ? `<div class="lexique-tip">💡 Astuce : ${e.astuce}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
  });

  content.innerHTML = html;
}

function toggleLexiqueEntry(el) {
  el.classList.toggle('open');
}

function filterLexique(query) {
  document.getElementById('btnClearLexique').classList.toggle('hidden', !query);
  renderLexique(null, query);
}
function clearLexique() {
  document.getElementById('lexiqueSearch').value = '';
  renderLexique(null, '');
}

// ── THÈME ─────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode', !isDark);
  document.getElementById('iconSun').classList.toggle('hidden', !isDark);
  document.getElementById('iconMoon').classList.toggle('hidden', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    document.getElementById('iconSun').classList.remove('hidden');
    document.getElementById('iconMoon').classList.add('hidden');
  }
}

// ── TOAST ─────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── DONNÉES DE DÉMO ───────────────────────────────────────
async function insertSampleData() {
  const all = await dbGetAll();
  if (all.length > 0) return; // Ne pas réinsérer si des données existent déjà
  for (const r of RECETTES_SAMPLE) await dbPut(r);
  console.log(`✅ ${RECETTES_SAMPLE.length} recettes insérées avec succès !`);
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  db = await openDB();
  loadTheme();
  await insertSampleData();
  navigateTo('home');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
