const products = window.PRODUCTS.filter((product) => product.active !== false);

const grid = document.getElementById('product-grid');
const count = document.getElementById('result-count');
const title = document.getElementById('catalog-title');
const empty = document.getElementById('empty-state');
const search = document.getElementById('product-search');
const dialog = document.getElementById('product-dialog');
let activeFilter = 'all';
let activeGallery = [];
let detailZoom = 1;

const filterLabels = { all: 'Tüm ürünler' };
const priceFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const categoryFilters = document.getElementById('category-filters');

const productGroups = new Map();
products.forEach((product) => {
  filterLabels[product.group] = product.groupLabel;
  filterLabels[product.type] = product.typeLabel;
  if (!productGroups.has(product.group)) productGroups.set(product.group, { label: product.groupLabel, products: [] });
  productGroups.get(product.group).products.push(product);
});

categoryFilters.innerHTML = [...productGroups.entries()].map(([groupKey, group]) => {
  const types = new Map();
  group.products.forEach((product) => {
    if (!types.has(product.type)) types.set(product.type, product.typeLabel);
  });
  const typeButtons = [...types.entries()].map(([typeKey, typeLabel]) => `<button type="button" data-filter="${typeKey}">${typeLabel}</button>`).join('');
  return `<div class="filter-group">
    <button class="side-filter parent" type="button" data-filter="${groupKey}"><span>${group.label}</span><b>${String(group.products.length).padStart(2, '0')}</b></button>
    <div class="subfilters">${typeButtons}</div>
  </div>`;
}).join('');

document.querySelectorAll('.side-filter[data-filter]').forEach((button) => {
  const filter = button.dataset.filter;
  const total = filter === 'all' ? products.length : products.filter((product) => product.group === filter || product.type === filter).length;
  const counter = button.querySelector('b');
  if (counter) counter.textContent = String(total).padStart(2, '0');
});

function productCard(product) {
  return `<button class="product-card" type="button" data-id="${product.id}" aria-label="${product.name} detayını aç">
    <span class="product-visual"><img src="${product.images[0]}" alt="${product.name}" loading="lazy">${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}<span class="product-open">↗</span></span>
    <span class="product-copy"><small>${product.groupLabel} / ${product.typeLabel}</small><h3>${product.name}</h3><span>${product.code}</span></span>
  </button>`;
}

function renderProducts() {
  const term = search.value.trim().toLocaleLowerCase('tr-TR');
  const visible = products.filter((product) => {
    const matchesFilter = activeFilter === 'all' || product.group === activeFilter || product.type === activeFilter;
    const haystack = `${product.name} ${product.typeLabel} ${product.code}`.toLocaleLowerCase('tr-TR');
    return matchesFilter && haystack.includes(term);
  });
  grid.innerHTML = visible.map(productCard).join('');
  count.textContent = `${visible.length} ürün`;
  title.textContent = term ? 'Arama sonuçları' : filterLabels[activeFilter];
  empty.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  grid.querySelectorAll('.product-card').forEach((card) => card.addEventListener('click', () => openProduct(card.dataset.id)));
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === filter));
  renderProducts();
}

document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
search.addEventListener('input', renderProducts);

function setGalleryImage(index) {
  const image = document.getElementById('detail-image');
  image.src = activeGallery[index];
  setDetailZoom(1);
  document.getElementById('gallery-current').textContent = String(index + 1).padStart(2, '0');
  document.querySelectorAll('.detail-thumbs button').forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === index));
}

function setDetailZoom(value) {
  const image = document.getElementById('detail-image');
  detailZoom = Math.min(3, Math.max(1, value));
  image.style.transform = `scale(${detailZoom})`;
  image.classList.toggle('zoomed', detailZoom > 1);
  document.getElementById('detail-zoom-reset').textContent = `${Math.round(detailZoom * 100)}%`;
}

const detailMainImage = document.getElementById('detail-main-image');
document.getElementById('detail-zoom-in').addEventListener('click', () => setDetailZoom(detailZoom + 0.5));
document.getElementById('detail-zoom-out').addEventListener('click', () => setDetailZoom(detailZoom - 0.5));
document.getElementById('detail-zoom-reset').addEventListener('click', () => setDetailZoom(1));
document.getElementById('detail-image').addEventListener('click', () => setDetailZoom(detailZoom > 1 ? 1 : 2));
detailMainImage.addEventListener('mousemove', (event) => {
  if (detailZoom === 1) return;
  const box = detailMainImage.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * 100;
  const y = ((event.clientY - box.top) / box.height) * 100;
  document.getElementById('detail-image').style.transformOrigin = `${x}% ${y}%`;
});
detailMainImage.addEventListener('mouseleave', () => {
  document.getElementById('detail-image').style.transformOrigin = 'center';
});

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  activeGallery = product.images;
  document.getElementById('detail-group').textContent = product.groupLabel;
  document.getElementById('detail-type').textContent = product.typeLabel;
  document.getElementById('detail-name').textContent = product.name;
  document.getElementById('detail-code').textContent = `Ürün kodu: ${product.code}`;
  document.getElementById('detail-description').textContent = product.description;
  document.getElementById('detail-fabric').textContent = product.fabric;
  document.getElementById('detail-weight').textContent = product.weight;
  document.getElementById('detail-fit').textContent = product.fit;
  document.getElementById('detail-price').textContent = Number.isFinite(product.price) ? priceFormatter.format(product.price) : 'Fiyat bilgisi yakında';
  document.getElementById('detail-care').textContent = product.care;
  document.getElementById('detail-colors').innerHTML = product.colors.map((color) => `<span class="color-dot" style="background:${color}" aria-label="Renk seçeneği"></span>`).join('');
  document.getElementById('detail-sizes').innerHTML = product.sizes.map((size) => `<span class="size-chip">${size}</span>`).join('');
  document.getElementById('detail-thumbs').innerHTML = product.images.map((src, index) => `<button type="button" data-image-index="${index}" aria-label="${index + 1}. fotoğrafı göster"><img src="${src}" alt=""></button>`).join('');
  document.getElementById('gallery-total').textContent = String(product.images.length).padStart(2, '0');
  document.getElementById('detail-image').alt = `${product.name} ürün fotoğrafı`;
  document.getElementById('detail-cta').href = `order.html?product=${encodeURIComponent(product.code)}`;
  document.querySelectorAll('.detail-thumbs button').forEach((button) => button.addEventListener('click', () => setGalleryImage(Number(button.dataset.imageIndex))));
  setGalleryImage(0);
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

function closeDialog() {
  dialog.close();
  document.body.classList.remove('dialog-open');
}

document.querySelector('.dialog-close').addEventListener('click', closeDialog);
dialog.addEventListener('click', (event) => {
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
});
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

const customSlider = document.getElementById('custom-slider');
const customSliderPrev = document.getElementById('custom-slider-prev');
const customSliderNext = document.getElementById('custom-slider-next');
const customSliderMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let customSliderTimer;

function scrollCustomSlider(direction) {
  const slide = customSlider.querySelector('.custom-slide');
  const gap = parseFloat(getComputedStyle(customSlider).gap) || 0;
  const step = slide.offsetWidth + gap;
  const atEnd = customSlider.scrollLeft + customSlider.clientWidth >= customSlider.scrollWidth - 4;
  const atStart = customSlider.scrollLeft <= 4;

  if (direction > 0 && atEnd) {
    customSlider.scrollTo({ left: 0, behavior: 'smooth' });
  } else if (direction < 0 && atStart) {
    customSlider.scrollTo({ left: customSlider.scrollWidth, behavior: 'smooth' });
  } else {
    customSlider.scrollBy({ left: direction * step, behavior: 'smooth' });
  }
}

function stopCustomSlider() {
  window.clearInterval(customSliderTimer);
}

function startCustomSlider() {
  stopCustomSlider();
  if (customSliderMotion.matches || document.hidden) return;
  customSliderTimer = window.setInterval(() => scrollCustomSlider(1), 2500);
}

customSliderPrev.addEventListener('click', () => {
  scrollCustomSlider(-1);
  startCustomSlider();
});
customSliderNext.addEventListener('click', () => {
  scrollCustomSlider(1);
  startCustomSlider();
});
customSlider.addEventListener('mouseenter', stopCustomSlider);
customSlider.addEventListener('mouseleave', startCustomSlider);
customSlider.addEventListener('focusin', stopCustomSlider);
customSlider.addEventListener('focusout', startCustomSlider);
customSlider.addEventListener('touchstart', stopCustomSlider, { passive: true });
customSlider.addEventListener('touchend', startCustomSlider, { passive: true });
document.addEventListener('visibilitychange', startCustomSlider);
customSliderMotion.addEventListener('change', startCustomSlider);

renderProducts();
startCustomSlider();
