/* ============================================================
   DÉLICES MAISON — script.js
   IndexedDB + Navigation + CRUD + Recherche + Favoris
   ============================================================ */

// ── CONFIG CATÉGORIES ──────────────────────────────────────
const CATEGORIES = {
  plats:      { label: '🍽️ Plats',      emoji: '🍽️', cls: 'cat-plats',      ph: 'placeholder-plats' },
  desserts:   { label: '🍰 Desserts',   emoji: '🍰', cls: 'cat-desserts',   ph: 'placeholder-desserts' },
  patisserie: { label: '🥐 Pâtisserie', emoji: '🥐', cls: 'cat-patisserie', ph: 'placeholder-patisserie' },
  gouter:     { label: '🧁 Goûter',     emoji: '🧁', cls: 'cat-gouter',     ph: 'placeholder-gouter' },
  boissons:   { label: '🥤 Boissons',   emoji: '🥤', cls: 'cat-boissons',   ph: 'placeholder-boissons' },
  rapide:     { label: '⚡ Rapide',     emoji: '⚡', cls: 'cat-rapide',     ph: 'placeholder-rapide' },
  famille:    { label: '👨‍👩‍👧 Famille',   emoji: '👨‍👩‍👧', cls: 'cat-famille',   ph: 'placeholder-famille' },
};

// ── ÉTAT GLOBAL ───────────────────────────────────────────
let db = null;
let currentView = 'home';
let prevView    = null;
let editingId   = null;

// ── INDEXEDDB ─────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('DelicesMaison', 1);
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
    const tx  = db.transaction('recettes', 'readonly');
    const req = tx.objectStore('recettes').getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbGet(id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('recettes', 'readonly');
    const req = tx.objectStore('recettes').get(id);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbPut(recette) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('recettes', 'readwrite');
    const req = tx.objectStore('recettes').put(recette);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbDelete(id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('recettes', 'readwrite');
    const req = tx.objectStore('recettes').delete(id);
    req.onsuccess = e => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// ── NAVIGATION ────────────────────────────────────────────
function navigateTo(view, param = null) {
  // Masquer toutes les vues
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Mettre à jour la nav bas
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + view);
  if (navBtn) navBtn.classList.add('active');

  // Header
  const brand      = document.getElementById('headerBrand');
  const back       = document.getElementById('btnBack');
  const pageTitle  = document.getElementById('headerTitle');

  const subViews = ['recipe', 'add', 'category'];
  const isSubView = subViews.includes(view);

  brand.classList.toggle('hidden', isSubView);
  pageTitle.classList.toggle('hidden', !isSubView);
  back.classList.toggle('hidden', !isSubView);

  prevView = currentView;
  currentView = view;

  if (view === 'home') {
    document.getElementById('viewHome').classList.add('active');
    renderHome();
  } else if (view === 'recipe') {
    document.getElementById('viewRecipe').classList.add('active');
    pageTitle.textContent = 'Recette';
    renderRecipeDetail(param);
  } else if (view === 'add') {
    document.getElementById('viewAdd').classList.add('active');
    pageTitle.textContent = editingId ? 'Modifier' : 'Nouvelle recette';
    if (!editingId) resetForm();
  } else if (view === 'favorites') {
    document.getElementById('viewFavorites').classList.add('active');
    renderFavorites();
  } else if (view === 'search') {
    document.getElementById('viewSearch').classList.add('active');
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
  } else if (view === 'category') {
    document.getElementById('viewCategory').classList.add('active');
    renderCategoryView(param);
  }

  window.scrollTo(0, 0);
}

function goBack() {
  editingId = null;
  navigateTo(prevView || 'home');
}

// ── RENDU ACCUEIL ─────────────────────────────────────────
async function renderHome() {
  const recettes = await dbGetAll();

  // Compteur
  const count = document.getElementById('recipeCount');
  count.textContent = recettes.length + ' recette' + (recettes.length !== 1 ? 's' : '');
  count.style.display = recettes.length ? '' : 'none';

  // Catégories
  renderCategories(recettes);

  // Grille de recettes
  const grid = document.getElementById('recipesGrid');
  const empty = document.getElementById('emptyState');

  if (recettes.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(empty || createEmptyState());
    return;
  }

  // Trier par date (les plus récentes d'abord)
  const sorted = [...recettes].sort((a, b) => b.dateAjout - a.dateAjout);
  grid.innerHTML = sorted.map(r => recipeCardHTML(r)).join('');
}

// ── RENDU CATÉGORIES ──────────────────────────────────────
async function renderCategories(recettes) {
  if (!recettes) recettes = await dbGetAll();

  const scroll = document.getElementById('categoriesScroll');
  const counts = {};
  recettes.forEach(r => {
    counts[r.categorie] = (counts[r.categorie] || 0) + 1;
  });

  // Carte "Tout"
  let html = `
    <div class="cat-card cat-all" onclick="navigateTo('home')">
      <span class="cat-emoji">🍴</span>
      <span class="cat-name">Tout</span>
      <span class="cat-count">${recettes.length}</span>
    </div>`;

  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const n = counts[key] || 0;
    html += `
      <div class="cat-card ${cat.cls}" onclick="navigateTo('category', '${key}')">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${cat.label.replace(/^\S+\s/, '')}</span>
        <span class="cat-count">${n}</span>
      </div>`;
  });

  scroll.innerHTML = html;
}

// ── RENDU VUE CATÉGORIE ───────────────────────────────────
async function renderCategoryView(categorie) {
  const recettes = await dbGetAll();
  const filtered = recettes.filter(r => r.categorie === categorie);
  const cat = CATEGORIES[categorie];

  document.getElementById('categoryViewTitle').textContent =
    (cat ? cat.label : categorie);
  document.getElementById('headerTitle').textContent =
    cat ? cat.label : categorie;

  const grid = document.getElementById('categoryGrid');
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${cat ? cat.emoji : '📂'}</div>
        <p>Aucune recette dans cette catégorie</p>
        <button class="btn-primary" onclick="navigateTo('add')">Ajouter une recette</button>
      </div>`;
  } else {
    grid.innerHTML = filtered.map(r => recipeCardHTML(r)).join('');
  }
}

// ── CARTE RECETTE HTML ────────────────────────────────────
function recipeCardHTML(r) {
  const cat = CATEGORIES[r.categorie] || {};
  const imgHTML = r.image
    ? `<img class="card-img" src="${r.image}" alt="${r.titre}" loading="lazy">`
    : `<div class="card-img-placeholder ${cat.ph || 'placeholder-default'}">${cat.emoji || '🍴'}</div>`;

  const temps = (r.tempsPrep || 0) + (r.tempsCuisson || 0);
  const diffClass = { facile: 'diff-facile', moyen: 'diff-moyen', difficile: 'diff-difficile' }[r.difficulte] || 'diff-facile';
  const diffLabel = { facile: '😊 Facile', moyen: '😐 Moyen', difficile: '😤 Difficile' }[r.difficulte] || '';
  const favIcon = r.favori ? '❤️' : '🤍';

  return `
    <div class="recipe-card" onclick="navigateTo('recipe', ${r.id})">
      <button class="card-fav-btn" onclick="event.stopPropagation(); toggleFavorite(${r.id})">${favIcon}</button>
      ${imgHTML}
      <div class="card-body">
        <div class="card-title">${r.titre}</div>
        <div class="card-meta">
          ${temps > 0 ? `<span class="card-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>${temps} min</span>` : ''}
          ${r.portions ? `<span class="card-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>${r.portions} pers.</span>` : ''}
        </div>
        <span class="card-diff ${diffClass}">${diffLabel}</span>
      </div>
    </div>`;
}

// ── FICHE RECETTE DÉTAILLÉE ───────────────────────────────
async function renderRecipeDetail(id) {
  const r = await dbGet(Number(id));
  if (!r) { navigateTo('home'); return; }

  const cat     = CATEGORIES[r.categorie] || {};
  const imgHTML = r.image
    ? `<img class="recipe-hero" src="${r.image}" alt="${r.titre}">`
    : `<div class="recipe-hero-placeholder ${cat.ph || 'placeholder-default'}">${cat.emoji || '🍴'}</div>`;

  const temps      = (r.tempsPrep || 0) + (r.tempsCuisson || 0);
  const diffLabel  = { facile: '😊 Facile', moyen: '😐 Moyen', difficile: '😤 Difficile' }[r.difficulte] || '-';
  const diffCls    = { facile: 'diff-facile', moyen: 'diff-moyen', difficile: 'diff-difficile' }[r.difficulte] || '';

  const ingredientsHTML = (r.ingredients || [])
    .filter(i => i.trim())
    .map(i => `<div class="ingredient-item">${i}</div>`)
    .join('');

  const etapesHTML = (r.etapes || [])
    .filter(e => e.trim())
    .map((e, i) => `
      <div class="etape-item">
        <div class="etape-num">${i + 1}</div>
        <div class="etape-text">${e}</div>
      </div>`)
    .join('');

  const tagsHTML = (r.tags || []).length
    ? `<div class="recipe-tags">${r.tags.map(t => `<span class="tag-chip">${tagLabel(t)}</span>`).join('')}</div>`
    : '';

  const noteHTML = r.notePerso
    ? `<div class="note-box">💡 ${r.notePerso}</div>`
    : '';

  document.getElementById('headerTitle').textContent = r.titre;
  document.getElementById('recipeDetail').innerHTML = `
    ${imgHTML}
    <div class="recipe-body">
      <h2 class="recipe-name">${r.titre}</h2>

      <div class="recipe-stats">
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">${r.tempsPrep || '-'} min</div>
          <div class="stat-label">Préparation</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${r.tempsCuisson || '-'} min</div>
          <div class="stat-label">Cuisson</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${r.portions || '-'}</div>
          <div class="stat-label">Portions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">${r.difficulte === 'facile' ? '😊' : r.difficulte === 'moyen' ? '😐' : '😤'}</div>
          <div class="stat-value card-diff ${diffCls}" style="padding:2px 6px">${r.difficulte || '-'}</div>
          <div class="stat-label">Niveau</div>
        </div>
      </div>

      ${tagsHTML}

      ${ingredientsHTML ? `
        <h3 class="recipe-section-title">🛒 Ingrédients</h3>
        <div class="ingredients-list">${ingredientsHTML}</div>` : ''}

      ${etapesHTML ? `
        <h3 class="recipe-section-title" style="margin-top:20px">👩‍🍳 Préparation</h3>
        <div class="etapes-list">${etapesHTML}</div>` : ''}

      ${noteHTML}

      <div class="recipe-actions">
        <button class="btn-edit" onclick="startEdit(${r.id})">✏️ Modifier</button>
        <button class="btn-delete" onclick="confirmDelete(${r.id})" title="Supprimer">🗑️</button>
      </div>
    </div>`;
}

function tagLabel(tag) {
  const m = { rapide:'⚡ Rapide', economique:'💰 Économique', famille:'👨‍👩‍👧 Famille',
               fete:'🎉 Fête', healthy:'🥗 Healthy', enfants:'👶 Enfants' };
  return m[tag] || tag;
}

// ── FAVORIS ───────────────────────────────────────────────
async function toggleFavorite(id) {
  const r = await dbGet(Number(id));
  if (!r) return;
  r.favori = !r.favori;
  await dbPut(r);
  showToast(r.favori ? '❤️ Ajouté aux favoris' : '💔 Retiré des favoris');

  // Rafraîchir la vue courante
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
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💔</div>
        <p>Aucune recette en favori</p>
        <p style="font-size:0.82rem;color:var(--text-light)">Appuyez sur 🤍 pour ajouter</p>
      </div>`;
  } else {
    grid.innerHTML = favs.map(r => recipeCardHTML(r)).join('');
  }
}

// ── FORMULAIRE ────────────────────────────────────────────
function resetForm() {
  editingId = null;
  document.getElementById('fId').value       = '';
  document.getElementById('fTitre').value    = '';
  document.getElementById('fCategorie').value= '';
  document.getElementById('fPrep').value     = '';
  document.getElementById('fCuisson').value  = '';
  document.getElementById('fPortions').value = '4';
  document.getElementById('fDifficulte').value = 'facile';
  document.getElementById('fNote').value     = '';
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
  // Ajouter 1 ingrédient et 1 étape vides par défaut
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
  document.getElementById('fPrep').value       = r.tempsPrep || '';
  document.getElementById('fCuisson').value    = r.tempsCuisson || '';
  document.getElementById('fPortions').value   = r.portions || 4;
  document.getElementById('fDifficulte').value = r.difficulte || 'facile';
  document.getElementById('fNote').value       = r.notePerso || '';
  document.getElementById('formTitle').textContent = '✏️ Modifier la recette';
  document.getElementById('headerTitle').textContent = 'Modifier';

  // Image
  if (r.image) {
    document.getElementById('imagePreview').innerHTML =
      `<img src="${r.image}" style="width:100%;height:100%;object-fit:cover">`;
  }

  // Ingrédients
  document.getElementById('ingredientsList').innerHTML = '';
  (r.ingredients || []).forEach(i => addIngredient(i));
  if (!r.ingredients || r.ingredients.length === 0) addIngredient();

  // Étapes
  document.getElementById('etapesList').innerHTML = '';
  (r.etapes || []).forEach(e => addEtape(e));
  if (!r.etapes || r.etapes.length === 0) addEtape();

  // Tags
  document.querySelectorAll('.tag-btn').forEach(b => {
    b.classList.toggle('selected', (r.tags || []).includes(b.dataset.tag));
  });
}

async function saveRecipe() {
  const titre     = document.getElementById('fTitre').value.trim();
  const categorie = document.getElementById('fCategorie').value;

  if (!titre) { showToast('⚠️ Le titre est requis'); return; }
  if (!categorie) { showToast('⚠️ Choisissez une catégorie'); return; }

  // Collecter ingrédients
  const ingredients = [...document.getElementById('ingredientsList')
    .querySelectorAll('input')]
    .map(i => i.value.trim())
    .filter(Boolean);

  // Collecter étapes
  const etapes = [...document.getElementById('etapesList')
    .querySelectorAll('textarea')]
    .map(t => t.value.trim())
    .filter(Boolean);

  // Tags sélectionnés
  const tags = [...document.querySelectorAll('.tag-btn.selected')]
    .map(b => b.dataset.tag);

  // Image (si modifiée)
  const imgEl = document.getElementById('imagePreview').querySelector('img');
  const image = imgEl ? imgEl.src : '';

  const idField = document.getElementById('fId').value;
  const id      = idField ? Number(idField) : Date.now();

  // Récupérer favori existant si édition
  let favori = false;
  if (idField) {
    const existing = await dbGet(Number(idField));
    favori = existing ? existing.favori : false;
  }

  const recette = {
    id,
    titre,
    categorie,
    image,
    tempsPrep:    Number(document.getElementById('fPrep').value)    || 0,
    tempsCuisson: Number(document.getElementById('fCuisson').value) || 0,
    portions:     Number(document.getElementById('fPortions').value) || 4,
    difficulte:   document.getElementById('fDifficulte').value,
    ingredients,
    etapes,
    tags,
    notePerso:    document.getElementById('fNote').value.trim(),
    favori,
    dateAjout:    idField ? id : Date.now(),
  };

  await dbPut(recette);
  showToast('✅ Recette enregistrée !');
  editingId = null;
  navigateTo('home');
}

// Ajouter un champ ingrédient
function addIngredient(valeur = '') {
  const list = document.getElementById('ingredientsList');
  const idx  = list.children.length + 1;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <input type="text" placeholder="Ex : 200g de farine..." value="${valeur}"
           oninput="updateNumbers('ingredientsList')">
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">✕</button>`;
  list.appendChild(div);
}

// Ajouter un champ étape
function addEtape(valeur = '') {
  const list = document.getElementById('etapesList');
  const idx  = list.children.length + 1;
  const div  = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="item-num">${idx}</div>
    <textarea class="etape-textarea" placeholder="Décrire cette étape..."
              oninput="autoResize(this)">${valeur}</textarea>
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">✕</button>`;
  list.appendChild(div);
}

function removeItem(btn) {
  btn.closest('.dynamic-item').remove();
  // Renuméroter les étapes
  document.querySelectorAll('#etapesList .item-num').forEach((el, i) => {
    el.textContent = i + 1;
  });
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// Tags
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });
});

// ── IMAGE ─────────────────────────────────────────────────
function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('imagePreview').innerHTML =
      `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
  };
  reader.readAsDataURL(file);
}

// ── SUPPRESSION ───────────────────────────────────────────
let pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalConfirmBtn').onclick = async () => {
    await dbDelete(Number(pendingDeleteId));
    closeModal();
    showToast('🗑️ Recette supprimée');
    navigateTo('home');
  };
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  pendingDeleteId = null;
}
// Fermer le modal en cliquant dehors
document.getElementById('modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── RECHERCHE ─────────────────────────────────────────────
async function searchRecipes(query) {
  const q     = (query || '').trim().toLowerCase();
  const btn   = document.getElementById('btnClearSearch');
  const header= document.getElementById('searchResultHeader');
  const title = document.getElementById('searchResultTitle');
  const grid  = document.getElementById('searchGrid');

  btn.classList.toggle('hidden', !q);

  if (!q) {
    grid.innerHTML = `
      <div class="search-hint">
        <div class="empty-icon">🔍</div>
        <p>Tapez pour rechercher une recette</p>
      </div>`;
    header.style.display = 'none';
    return;
  }

  const all     = await dbGetAll();
  const results = all.filter(r =>
    r.titre.toLowerCase().includes(q)  ||
    (r.categorie && r.categorie.toLowerCase().includes(q)) ||
    (r.ingredients || []).some(i => i.toLowerCase().includes(q)) ||
    (r.tags || []).some(t => t.toLowerCase().includes(q))
  );

  header.style.display = '';
  title.textContent = `${results.length} résultat${results.length !== 1 ? 's' : ''} pour "${query}"`;

  if (results.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕵️</div>
        <p>Aucune recette trouvée pour "<strong>${query}</strong>"</p>
      </div>`;
  } else {
    grid.innerHTML = results.map(r => recipeCardHTML(r)).join('');
  }
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  searchRecipes('');
  input.focus();
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

// ── DONNÉES DE DÉMONSTRATION ──────────────────────────────
async function insertSampleData() {
  const all = await dbGetAll();
  if (all.length > 0) return; // Déjà des données

  const samples = [
    {
      id: Date.now() - 3000,
      titre: 'Mousse au Chocolat Noir',
      categorie: 'desserts',
      image: '',
      tempsPrep: 20, tempsCuisson: 0, portions: 6, difficulte: 'facile',
      ingredients: ['200g de chocolat noir 70%', '4 œufs', '40g de sucre', '1 pincée de sel'],
      etapes: [
        'Faire fondre le chocolat au bain-marie. Laisser tiédir.',
        'Séparer les blancs des jaunes. Incorporer les jaunes au chocolat.',
        'Monter les blancs en neige ferme avec le sel.',
        'Incorporer délicatement les blancs au chocolat en 3 fois.',
        'Répartir dans des verrines. Réfrigérer au moins 2h avant de servir.'
      ],
      tags: ['rapide', 'economique'], notePerso: 'Ajouter une touche de fleur de sel sur le dessus !',
      favori: true, dateAjout: Date.now() - 3000,
    },
    {
      id: Date.now() - 2000,
      titre: 'Poulet Rôti aux Herbes',
      categorie: 'plats',
      image: '',
      tempsPrep: 15, tempsCuisson: 90, portions: 4, difficulte: 'facile',
      ingredients: ['1 poulet entier (1.5kg)', '3 gousses d\'ail', 'Thym, romarin, laurier', '50g de beurre', 'Sel, poivre', '1 citron'],
      etapes: [
        'Préchauffer le four à 200°C.',
        'Frotter le poulet avec le beurre mou, l\'ail écrasé et les herbes.',
        'Saler, poivrer généreusement. Glisser le citron coupé à l\'intérieur.',
        'Enfourner 1h30 en arrosant toutes les 30 minutes.',
        'Laisser reposer 10 minutes avant de découper.'
      ],
      tags: ['famille'], notePerso: 'Mettre des pommes de terre autour pour un plat complet.',
      favori: false, dateAjout: Date.now() - 2000,
    },
    {
      id: Date.now() - 1000,
      titre: 'Tarte Tatin Caramel',
      categorie: 'patisserie',
      image: '',
      tempsPrep: 30, tempsCuisson: 40, portions: 8, difficulte: 'moyen',
      ingredients: ['1 rouleau de pâte feuilletée', '6 pommes golden', '120g de sucre', '60g de beurre', '1 gousse de vanille'],
      etapes: [
        'Dans un moule à manqué, faire un caramel avec le sucre et le beurre.',
        'Éplucher et couper les pommes en quartiers. Disposer sur le caramel.',
        'Couvrir avec la pâte feuilletée en rentrant les bords.',
        'Enfourner à 180°C pendant 40 minutes.',
        'Retourner immédiatement à la sortie du four. Servir tiède avec de la crème fraîche.'
      ],
      tags: ['fete'], notePerso: 'Ne pas attendre pour la retourner, le caramel doit être encore chaud !',
      favori: false, dateAjout: Date.now() - 1000,
    },
  ];

  for (const s of samples) await dbPut(s);
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  db = await openDB();
  loadTheme();
  await insertSampleData();
  navigateTo('home');

  // Enregistrer le Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
