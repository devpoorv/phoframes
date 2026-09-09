/* Plain JavaScript only — this file runs directly on GitHub Pages. */
const WHATSAPP = '916393556640';
const UPI_ID = '6393556640@okbizaxis';

const sizes = ['A4', 'A3', '12 × 18', '13 × 19', '20 × 30'];
const prices = { A4: 149, A3: 199, '12 × 18': 249, '13 × 19': 299, '20 × 30': 799 };
const products = [
  { id: 'ivory-gold', name: 'Ivory Gold', image: 'ivory-gold.png', category: 'Ivory & gold', note: 'Ivory finish with a luminous gold inlay' },
  { id: 'pearl-oak', name: 'Pearl Oak', image: 'pearl-oak.png', category: 'Oak & pearl', note: 'Warm oak grain with a pearl-white border' },
  { id: 'royal-walnut', name: 'Royal Walnut', image: 'royal-walnut.png', category: 'Dark walnut', note: 'Deep walnut grain with a refined inner edge' },
  { id: 'black-marble', name: 'Black Marble', image: 'black-marble.png', category: 'Statement black', note: 'Black marble effect with bright natural veining' },
  { id: 'classic-oak', name: 'Classic Oak', image: 'classic-oak.png', category: 'Classic wood', note: 'Natural oak finish with a dark inner profile' },
  { id: 'dark-oak', name: 'Dark Oak', image: 'dark-oak.png', category: 'Rich wood', note: 'Dark oak finish with a sleek black inner edge' },
  { id: 'featured-oak', name: 'Featured Oak', image: 'featured-oak.png', category: 'Featured collection', note: 'Statement oak grain with a polished black inner profile' },
];

const stories = [
  'Some moments deserve more than a gallery.',
  'A photograph captures a second. A frame keeps it alive.',
  'Because your best moments deserve a place on your wall.',
];

const reviews = [
  ['“The frame felt like the final touch our picture was waiting for.”', 'READY FOR YOUR REAL REVIEWS'],
  ['“The details made our little moment feel beautifully considered.”', 'ADD YOUR VERIFIED CUSTOMER FEEDBACK'],
  ['“A gift that looked personal before it was even opened.”', 'SHARE YOUR CUSTOMER STORIES'],
];

let selectedSizes = Object.fromEntries(products.map((product) => [product.id, 'A4']));
let cart = loadCart();
let carouselIndex = products.findIndex((product) => product.id === 'featured-oak');
let checkoutLines = [];
let customerDetails = { name: '', phone: '', address: '' };

const $ = (selector) => document.querySelector(selector);
const money = (number) => `₹${number.toLocaleString('en-IN')}`;
const priceFor = (size) => prices[size] || prices.A4;
const productById = (id) => products.find((product) => product.id === id);

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('phoframes-cart-static') || '[]');
    return Array.isArray(saved) ? saved.filter((line) => productById(line.productId) && prices[line.size]) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('phoframes-cart-static', JSON.stringify(cart));
}

function frameVisual(product, label = '') {
  if (product.image) {
    return `<div class="real-frame"><img src="${product.image}" alt="${product.name} frame">${label ? `<span class="real-frame-label">${label}</span>` : ''}</div>`;
  }
  return `<div class="frame-visual frame-${product.tone}"><div class="frame-matte"><div class="frame-art">${label ? `<span class="frame-label">${label}</span>` : ''}</div></div></div>`;
}

function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function goTo(view) {
  document.querySelectorAll('[data-screen]').forEach((screen) => screen.classList.toggle('is-active', screen.dataset.screen === view));
  closeOverlay('cart');
  closeOverlay('checkout');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHero() {
  const product = products[carouselIndex];
  const size = selectedSizes[product.id];
  $('#featured-frame').innerHTML = frameVisual(product, product.category);
  $('#carousel-index').textContent = `${String(carouselIndex + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
  $('#hero-size-strip').innerHTML = sizes.map((item) => `<span>${item} · ${money(priceFor(item))}</span>`).join('');
  $('#hero-size-picker').innerHTML = sizes.map((item) => `<button type="button" class="${item === size ? 'is-selected' : ''}" data-size="${item}" data-product="${product.id}">${item}</button>`).join('');
  $('#hero-price').textContent = money(priceFor(size));
}

function renderProducts() {
  $('#product-grid').innerHTML = products.map((product) => {
    const selected = selectedSizes[product.id];
    return `<article class="product-card">
      <div class="product-art">${frameVisual(product, product.category)}</div>
      <div class="product-copy"><div><p>${product.category}</p><h3>${product.name}</h3></div><strong>${money(priceFor(selected))}</strong></div>
      <p class="product-note">${product.note}</p>
      <div class="size-picker" aria-label="Choose ${product.name} size">${sizes.map((size) => `<button type="button" class="${size === selected ? 'is-selected' : ''}" data-size="${size}" data-product="${product.id}">${size}</button>`).join('')}</div>
      <div class="product-actions"><button class="add-button" type="button" data-add="${product.id}">ADD TO BAG</button><button class="buy-button" type="button" data-buy="${product.id}">BUY NOW</button></div>
    </article>`;
  }).join('');
}

function renderCart() {
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + priceFor(line.size) * line.quantity, 0);
  $('#cart-count').textContent = cartCount;
  $('#cart-total').textContent = money(total);
  const cartLines = $('#cart-lines');
  const checkoutButton = $('#begin-checkout');
  checkoutButton.disabled = cart.length === 0;
  if (!cart.length) {
    cartLines.innerHTML = '<div class="empty-cart"><div>✦</div><h3>Your bag is waiting.</h3><p>Choose a frame and size to begin your collection.</p></div>';
    return;
  }
  cartLines.innerHTML = cart.map((line) => {
    const product = productById(line.productId);
    return `<article class="cart-line"><div class="cart-thumb">${frameVisual(product)}</div><div class="cart-line-copy"><h3>${product.name}</h3><p>${line.size} · Ready to frame</p><strong>${money(priceFor(line.size))}</strong><div class="quantity-row"><button type="button" data-quantity="-1" data-key="${line.key}" aria-label="Reduce quantity">−</button><span>${line.quantity}</span><button type="button" data-quantity="1" data-key="${line.key}" aria-label="Increase quantity">+</button><button class="remove-line" type="button" data-remove="${line.key}" aria-label="Remove frame">×</button></div></div></article>`;
  }).join('');
}

function addToCart(productId) {
  const size = selectedSizes[productId] || 'A4';
  const key = `${productId}::${size}`;
  const existing = cart.find((line) => line.key === key);
  if (existing) existing.quantity += 1;
  else cart.push({ key, productId, size, quantity: 1 });
  saveCart();
  renderCart();
  openOverlay('cart');
}

function changeQuantity(key, delta) {
  cart = cart.flatMap((line) => {
    if (line.key !== key) return [line];
    const quantity = line.quantity + delta;
    return quantity > 0 ? [{ ...line, quantity }] : [];
  });
  saveCart();
  renderCart();
}

function removeFromCart(key) {
  cart = cart.filter((line) => line.key !== key);
  saveCart();
  renderCart();
}

function lineTotal(lines) {
  return lines.reduce((sum, line) => sum + priceFor(line.size) * line.quantity, 0);
}

function openOverlay(name) {
  const overlay = $(`#${name}-overlay`);
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeOverlay(name) {
  const overlay = $(`#${name}-overlay`);
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
}

function openCheckout(lines) {
  if (!lines.length) return;
  checkoutLines = lines.map((line) => ({ ...line }));
  closeOverlay('cart');
  renderCheckoutForm();
  openOverlay('checkout');
}

function renderCheckoutForm() {
  const total = lineTotal(checkoutLines);
  $('#checkout-title').textContent = 'Your details';
  $('#checkout-content').innerHTML = `<form class="checkout-form" id="checkout-form"><div class="form-grid"><label>YOUR NAME<input name="name" autocomplete="name" required placeholder="Your name"></label><label>PHONE NUMBER<input name="phone" inputmode="tel" autocomplete="tel" required placeholder="Your WhatsApp number"></label><label class="form-wide">DELIVERY ADDRESS<textarea name="address" autocomplete="street-address" required rows="3" placeholder="House number, street, city and PIN code"></textarea></label></div><div class="order-mini"><span>${checkoutLines.reduce((sum, line) => sum + line.quantity, 0)} frame${checkoutLines.length > 1 ? 's' : ''}</span><strong>${money(total)}</strong></div><button class="primary-button full-button" type="submit">CONTINUE TO PAYMENT</button><p class="secure-note">Your details are used only to arrange this order.</p></form>`;
}

function renderPayment() {
  const total = lineTotal(checkoutLines);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=PHOFRAMES&am=${total}&cu=INR`;
  $('#checkout-title').textContent = 'Scan & pay';
  $('#checkout-content').innerHTML = `<div class="payment-stage"><p class="eyebrow">PAYMENT REQUEST</p><img class="payment-qr-image" src="upi-qr.jpeg" alt="PHOFRAMES UPI QR code"><h3>Your frame is<br>almost home.</h3><p class="payment-copy">Scan the QR code or use your UPI app. The amount is ${money(total)}.</p><div class="upi-id-line"><span>${UPI_ID}</span><button type="button" id="copy-upi">COPY</button></div><a class="primary-button full-button" href="${upiUrl}">PAY NOW IN YOUR UPI APP</a><button class="paid-button" type="button" id="payment-returned">I HAVE COMPLETED PAYMENT</button><p class="manual-note">Your order details are ready to be included in the final WhatsApp message.</p></div>`;
}

function renderCelebration() {
  const total = lineTotal(checkoutLines);
  const frames = checkoutLines.map((line) => {
    const product = productById(line.productId);
    return `• ${product.name} — ${line.size} × ${line.quantity}`;
  }).join('\n');
  const message = `Hello PHOFRAMES! I have completed payment of ${money(total)} for my frame order.\n\nName: ${customerDetails.name}\nPhone: ${customerDetails.phone}\nAddress: ${customerDetails.address}\n\nFrames selected:\n${frames}\n\nI am sharing my payment screenshot here. Please book my order.`;
  $('#checkout-title').textContent = 'Thank you';
  $('#checkout-content').innerHTML = `<div class="celebration-stage"><div class="celebration-aura" aria-hidden="true"></div><div class="celebration-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="check-orb">✓</div><p class="eyebrow">PAYMENT RECEIPT READY</p><h3>Your frame order<br>is ready to book.</h3><p class="celebration-copy">Your name, phone number, address, selected frame, and payment amount will be placed in the WhatsApp message automatically. Just attach your payment screenshot and send.</p><a class="primary-button full-button receipt-link" href="${whatsappLink(message)}">SHARE PAYMENT SCREENSHOT</a></div>`;
}

function updateCustomWhatsApp() {
  $('#custom-whatsapp').href = whatsappLink('Hello PHOFRAMES! I would like to customize a frame. Please help me choose a size and style.');
}

function rotateStory() {
  let index = 0;
  setInterval(() => {
    index = (index + 1) % stories.length;
    const line = $('#story-line');
    line.classList.remove('is-revealing');
    void line.offsetWidth;
    line.textContent = stories[index];
    line.classList.add('is-revealing');
  }, 4200);
}

function rotateReview() {
  let index = 0;
  setInterval(() => {
    index = (index + 1) % reviews.length;
    $('#review-quote').textContent = reviews[index][0];
    $('#review-label').textContent = reviews[index][1];
  }, 3400);
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.dataset.go) { goTo(target.dataset.go); return; }
  if (target.dataset.close) { closeOverlay(target.dataset.close); return; }
  if (target.id === 'open-cart') { renderCart(); openOverlay('cart'); return; }
  if (target.dataset.size) {
    selectedSizes[target.dataset.product] = target.dataset.size;
    renderHero();
    renderProducts();
    return;
  }
  if (target.id === 'previous-frame') { carouselIndex = (carouselIndex - 1 + products.length) % products.length; renderHero(); return; }
  if (target.id === 'next-frame') { carouselIndex = (carouselIndex + 1) % products.length; renderHero(); return; }
  if (target.id === 'hero-add') { addToCart(products[carouselIndex].id); return; }
  if (target.dataset.add) { addToCart(target.dataset.add); return; }
  if (target.dataset.buy) { const id = target.dataset.buy; openCheckout([{ key: `direct::${id}::${selectedSizes[id]}`, productId: id, size: selectedSizes[id], quantity: 1 }]); return; }
  if (target.dataset.quantity) { changeQuantity(target.dataset.key, Number(target.dataset.quantity)); return; }
  if (target.dataset.remove) { removeFromCart(target.dataset.remove); return; }
  if (target.id === 'begin-checkout') { openCheckout(cart); return; }
  if (target.id === 'payment-returned') { renderCelebration(); return; }
  if (target.id === 'copy-upi') {
    navigator.clipboard?.writeText(UPI_ID);
    target.textContent = 'COPIED';
    setTimeout(() => { target.textContent = 'COPY'; }, 1500);
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'checkout-form') {
    event.preventDefault();
    const data = new FormData(event.target);
    customerDetails = {
      name: String(data.get('name') || ''),
      phone: String(data.get('phone') || ''),
      address: String(data.get('address') || ''),
    };
    renderPayment();
  }
});

$('#site-shell').addEventListener('pointermove', (event) => {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--pointer-x', `${((event.clientX - box.left) / box.width) * 100}%`);
  event.currentTarget.style.setProperty('--pointer-y', `${((event.clientY - box.top) / box.height) * 100}%`);
});

renderHero();
renderProducts();
renderCart();
updateCustomWhatsApp();
rotateStory();
rotateReview();
