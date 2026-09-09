/* Plain JavaScript only — this file runs directly on GitHub Pages. */
const WHATSAPP = '916393556640';
const UPI_ID = '6393556640@okbizaxis';

const sizes = ['A4', 'A3', '12 × 18', '13 × 19', '20 × 30'];
const prices = { A4: 149, A3: 199, '12 × 18': 249, '13 × 19': 299, '20 × 30': 799 };
const covers = { glass: 'Glass', plastic: 'Transparent plastic sheet' };
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

// Add customer-approved feedback here when supplied: { name, quote, rating }.
// Ratings must be the customer's actual rating; never generate a rating.
const reviews = [];

let selectedSizes = Object.fromEntries(products.map((product) => [product.id, 'A4']));
let selectedCovers = Object.fromEntries(products.map((product) => [product.id, 'glass']));
let cart = [];
let carouselIndex = products.findIndex((product) => product.id === 'featured-oak');
let checkoutLines = [];
let customerDetails = { name: '', phone: '', address: '', city: '', pincode: '' };
let checkoutStage = 'details';
const CHECKOUT_STORAGE_KEY = 'phoframes-checkout-draft';
const CHECKOUT_DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;

const $ = (selector) => document.querySelector(selector);
const money = (number) => `₹${number.toLocaleString('en-IN')}`;
const priceFor = (size) => prices[size] || prices.A4;
const productById = (id) => products.find((product) => product.id === id);

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('phoframes-cart-static') || '[]');
    return Array.isArray(saved) ? saved.map(normalizeOrderLine).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeOrderLine(line) {
  if (!line || !productById(line.productId) || !sizes.includes(line.size) || !Number.isSafeInteger(line.quantity) || line.quantity < 1) return null;
  const cover = Object.hasOwn(covers, line.cover) ? line.cover : 'glass';
  return { key: `${line.productId}::${line.size}::${cover}`, productId: line.productId, size: line.size, cover, quantity: line.quantity };
}

function saveCart() {
  try {
    localStorage.setItem('phoframes-cart-static', JSON.stringify(cart));
  } catch { /* Shopping still works if this browser blocks storage. */ }
}

function readCustomerForm(form) {
  const data = new FormData(form);
  return Object.fromEntries(['name', 'phone', 'address', 'city', 'pincode'].map((field) => [field, String(data.get(field) || '').slice(0, field === 'address' ? 500 : 120)]));
}

function saveCheckoutDraft() {
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
      savedAt: Date.now(), stage: checkoutStage, lines: checkoutLines, customer: customerDetails,
    }));
  } catch { /* The order can continue even when browser storage is unavailable. */ }
}

function clearCheckoutDraft() {
  try { localStorage.removeItem(CHECKOUT_STORAGE_KEY); } catch { /* Storage is unavailable. */ }
  customerDetails = { name: '', phone: '', address: '', city: '', pincode: '' };
  renderCheckoutForm();
  $('#checkout-save-note').textContent = 'Saved checkout details cleared from this browser.';
}

function restoreCheckoutDraft() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || 'null');
    if (!saved) return;
    if (!Number.isFinite(saved.savedAt) || Date.now() - saved.savedAt > CHECKOUT_DRAFT_LIFETIME) {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      return;
    }
  } catch { return; }
  if (!saved.customer || !Array.isArray(saved.lines)) return;
  const lines = saved.lines.map(normalizeOrderLine).filter(Boolean);
  if (!lines.length) return;
  customerDetails = Object.fromEntries(Object.keys(customerDetails).map((field) => [field, typeof saved.customer[field] === 'string' ? saved.customer[field].slice(0, field === 'address' ? 500 : 120) : '']));
  checkoutLines = lines;
  goTo('store');
  const hasDetails = Object.values(customerDetails).every((value) => value.trim());
  if (hasDetails && saved.stage === 'verification') renderCelebration();
  else if (hasDetails && saved.stage === 'payment') renderPayment();
  else renderCheckoutForm();
  openOverlay('checkout');
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
  $('#hero-cover-picker').innerHTML = coverPicker(product);
}

function coverPicker(product) {
  return `<label class="cover-picker">FRONT COVER · SAME PRICE<select data-cover-product="${product.id}" aria-label="Choose front cover for ${product.name}">${Object.entries(covers).map(([key, label]) => `<option value="${key}"${selectedCovers[product.id] === key ? ' selected' : ''}>${label}</option>`).join('')}</select></label>`;
}

function renderProducts() {
  $('#product-grid').innerHTML = products.map((product) => {
    const selected = selectedSizes[product.id];
    return `<article class="product-card">
      <div class="product-art">${frameVisual(product, product.category)}</div>
      <div class="product-copy"><div><p>${product.category}</p><h3>${product.name}</h3></div><strong>${money(priceFor(selected))}</strong></div>
      <p class="product-note">${product.note}</p>
      <p class="photo-included">Photo print included · Share your photo on WhatsApp.</p>
      <div class="size-picker" aria-label="Choose ${product.name} size">${sizes.map((size) => `<button type="button" class="${size === selected ? 'is-selected' : ''}" data-size="${size}" data-product="${product.id}">${size}</button>`).join('')}</div>
      ${coverPicker(product)}
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
    return `<article class="cart-line"><div class="cart-thumb">${frameVisual(product)}</div><div class="cart-line-copy"><h3>${product.name}</h3><p>${line.size} · ${covers[line.cover]} · Photo included</p><strong>${money(priceFor(line.size))}</strong><div class="quantity-row"><button type="button" data-quantity="-1" data-key="${line.key}" aria-label="Reduce quantity">−</button><span>${line.quantity}</span><button type="button" data-quantity="1" data-key="${line.key}" aria-label="Increase quantity">+</button><button class="remove-line" type="button" data-remove="${line.key}" aria-label="Remove frame">×</button></div></div></article>`;
  }).join('');
}

function addToCart(productId) {
  const size = selectedSizes[productId] || 'A4';
  const cover = selectedCovers[productId] || 'glass';
  const key = `${productId}::${size}::${cover}`;
  const existing = cart.find((line) => line.key === key);
  if (existing) existing.quantity += 1;
  else cart.push({ key, productId, size, cover, quantity: 1 });
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
  checkoutLines = lines.map(normalizeOrderLine).filter(Boolean);
  if (!checkoutLines.length) return;
  closeOverlay('cart');
  renderCheckoutForm();
  saveCheckoutDraft();
  openOverlay('checkout');
}

function renderCheckoutForm() {
  checkoutStage = 'details';
  const total = lineTotal(checkoutLines);
  $('#checkout-title').textContent = 'Your details';
  const count = checkoutLines.reduce((sum, line) => sum + line.quantity, 0);
  $('#checkout-content').innerHTML = `<form class="checkout-form" id="checkout-form">
    <div class="form-grid">
      <label>YOUR NAME<input name="name" autocomplete="name" required maxlength="120" placeholder="Your name"></label>
      <label>PHONE NUMBER<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" pattern="[+0-9 ]{10,20}" title="Enter your phone number using digits, spaces and an optional country-code plus sign" placeholder="Your WhatsApp number"></label>
      <label class="form-wide">DELIVERY ADDRESS<textarea name="address" autocomplete="street-address" required maxlength="500" rows="3" placeholder="House number, street and locality"></textarea></label>
      <label>CITY<input name="city" autocomplete="address-level2" required maxlength="120" placeholder="Your city"></label>
      <label>PIN CODE<input name="pincode" inputmode="numeric" autocomplete="postal-code" required pattern="[1-9][0-9]{5}" maxlength="6" title="Enter a six-digit Indian PIN code" placeholder="Six-digit PIN code"></label>
    </div>
    <div class="order-mini"><span>${count} frame${count === 1 ? '' : 's'} + photo print</span><strong>${money(total)}</strong></div>
    <p class="delivery-summary" id="checkout-delivery-summary" role="status"></p>
    <button class="primary-button full-button" id="checkout-next" type="submit">CONTINUE TO PAYMENT</button>
    <p class="secure-note" id="checkout-save-note" role="status">Your details and checkout are saved on this browser for up to 7 days so you can return after paying.</p>
    <button class="checkout-text-button" type="button" id="clear-checkout-details">CLEAR SAVED DETAILS</button>
  </form>`;
  const form = $('#checkout-form');
  for (const [name, value] of Object.entries(customerDetails)) form.elements.namedItem(name).value = value;
  updateDeliverySummary();
}

function isJhansi() {
  return ['jhansi', 'झांसी', 'झाँसी'].includes(customerDetails.city.normalize('NFKC').trim().toLowerCase());
}

function updateDeliverySummary() {
  const hasCity = Boolean(customerDetails.city.trim());
  $('#checkout-delivery-summary').textContent = !hasCity
    ? 'Free delivery in Jhansi. Other cities: delivery charges confirmed on WhatsApp before payment.'
    : isJhansi()
      ? `Delivery in Jhansi: FREE. Total payable: ${money(lineTotal(checkoutLines))}.`
      : `Frames: ${money(lineTotal(checkoutLines))} + delivery charges. Contact us on WhatsApp for the delivery charge and final total before paying.`;
  $('#checkout-next').textContent = hasCity && !isJhansi() ? 'CONTINUE TO DELIVERY CONFIRMATION' : 'CONTINUE TO PAYMENT';
}

function orderMessage() {
  const frames = checkoutLines.map((line) => `• ${productById(line.productId).name} — ${line.size} — ${covers[line.cover]} × ${line.quantity}`).join('\n');
  return `Name: ${customerDetails.name}\nPhone: ${customerDetails.phone}\nAddress: ${customerDetails.address}\nCity: ${customerDetails.city}\nPIN code: ${customerDetails.pincode}\n\nFrames selected:\n${frames}\nFrame amount: ${money(lineTotal(checkoutLines))}\nPhoto print included.\nDelivery: ${isJhansi() ? 'Free in Jhansi' : 'Charge to be confirmed on WhatsApp'}`;
}

function renderPayment() {
  checkoutStage = 'payment';
  saveCheckoutDraft();
  const total = lineTotal(checkoutLines);
  if (!isJhansi()) {
    $('#checkout-title').textContent = 'Confirm delivery';
    const deliveryLink = whatsappLink(`Hello PHOFRAMES! Please confirm delivery availability, delivery charge and the final payable total for this order before I pay.\n\n${orderMessage()}`);
    const screenshotLink = whatsappLink(`Hello PHOFRAMES! You confirmed my delivery charge in this chat. I will attach my payment screenshot here. Please verify the payment and confirm my order.\n\n${orderMessage()}`);
    $('#checkout-content').innerHTML = `<div class="payment-stage"><p class="eyebrow">DELIVERY OUTSIDE JHANSI</p><h3>Let’s confirm<br>your delivery.</h3><div class="delivery-summary"><p>Frames & photo print: <strong>${money(total)}</strong></p><p>+ Delivery charge: confirmed on WhatsApp</p><p>The final payable total is pending. Confirm the delivery charge with PHOFRAMES before making any payment.</p></div><a class="primary-button full-button" href="${deliveryLink}">CONFIRM DELIVERY ON WHATSAPP</a><p class="manual-note">Your contact details, address, PIN code and selected frames are included in the message. We will share the final total and payment instructions in the chat.</p><a class="checkout-text-button" href="${screenshotLink}">ALREADY PAID THE AGREED TOTAL? SHARE SCREENSHOT</a><button class="checkout-text-button" type="button" id="edit-checkout-details">EDIT ORDER DETAILS</button></div>`;
    return;
  }
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=PHOFRAMES&am=${total}&cu=INR`;
  $('#checkout-title').textContent = 'Scan & pay';
  $('#checkout-content').innerHTML = `<div class="payment-stage"><p class="eyebrow">PAYMENT REQUEST</p><img class="payment-qr-image" src="upi-qr.jpeg" alt="PHOFRAMES UPI QR code"><h3>Pay, then share<br>your screenshot.</h3><p class="payment-copy">Scan the QR code or use your UPI app. The frame amount is ${money(total)}. If scanning the QR, enter this amount in your payment app.</p><div class="upi-id-line"><span>${UPI_ID}</span><button type="button" id="copy-upi">COPY</button></div><a class="primary-button full-button" href="${upiUrl}">PAY NOW IN YOUR UPI APP</a><button class="paid-button" type="button" id="payment-returned">I HAVE PAID · CONTINUE TO CONFIRMATION</button><p class="manual-note">Payment is verified manually by PHOFRAMES. After paying, share your screenshot on WhatsApp; we will confirm payment and your order there. Returning from your payment app does not confirm payment.</p><button class="checkout-text-button" type="button" id="edit-checkout-details">EDIT ORDER DETAILS</button></div>`;
}

function renderCelebration() {
  checkoutStage = 'verification';
  saveCheckoutDraft();
  const total = lineTotal(checkoutLines);
  const message = `Hello PHOFRAMES! Please verify my payment for this frame order.\n\n${orderMessage()}\n\nI will attach my payment screenshot and the photo to frame in this chat. Please confirm payment received and book my order.\nStatus: Payment verification pending.`;
  $('#checkout-title').textContent = 'Confirm on WhatsApp';
  $('#checkout-content').innerHTML = `<div class="celebration-stage"><div class="celebration-aura" aria-hidden="true"></div><div class="celebration-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="check-orb" aria-hidden="true">…</div><p class="eyebrow verification-status">PAYMENT VERIFICATION PENDING</p><h3>One last step:<br>share your screenshot.</h3><p class="celebration-copy">Open WhatsApp below, attach your payment screenshot, and send the prepared message. Your name, address, city, PIN code and selected frames are already included. PHOFRAMES will verify the payment and confirm your order in the chat.</p><a class="primary-button full-button receipt-link" href="${whatsappLink(message)}">SHARE SCREENSHOT ON WHATSAPP</a><p class="manual-note">The screenshot is attached in WhatsApp, not uploaded here. Your order is confirmed only after PHOFRAMES verifies payment. Please also share the photo you want framed.</p><button class="checkout-text-button" type="button" id="edit-checkout-details">EDIT ORDER DETAILS</button></div>`;
}

function updateCustomWhatsApp() {
  $('#custom-whatsapp').href = whatsappLink('Hello PHOFRAMES! I would like to customize a frame. Please help me choose a size and style.');
}

function rotateStory() {
  let index = 0;
  const line = $('#story-line');
  line.classList.remove('is-revealing');
  // Change the words only when the CSS fade reaches full transparency.
  line.addEventListener('animationiteration', (event) => {
    if (event.animationName !== 'hero-quote-fade') return;
    index = (index + 1) % stories.length;
    line.textContent = stories[index];
  });
}

function rotateReview() {
  const available = reviews.filter((review) => review && typeof review.name === 'string' && typeof review.quote === 'string' && review.quote.trim());
  if (!available.length) return;
  document.querySelectorAll('[data-review-slot]').forEach((slot, slotIndex) => {
    const isBottom = slot.dataset.reviewSlot.endsWith('bottom');
    if (isBottom && available.length === 1) return;
    slot.hidden = false;
    slot.closest('[data-screen]').classList.add('has-customer-reviews');
    const card = document.createElement('article');
    card.className = 'customer-review-card';
    slot.append(card);
    let index = slotIndex % available.length;
    const fillCard = () => {
      const review = available[index];
      card.replaceChildren();
      if (Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) {
        const stars = document.createElement('span');
        stars.className = 'customer-review-stars';
        stars.setAttribute('aria-label', `${review.rating} out of 5 stars`);
        stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        card.append(stars);
      }
      const quote = document.createElement('p');
      quote.textContent = review.quote;
      const author = document.createElement('span');
      author.className = 'customer-review-author';
      author.textContent = review.name;
      card.append(quote, author);
    };
    fillCard();
    card.addEventListener('animationiteration', (event) => {
      if (event.animationName !== 'customer-review-arrival') return;
      index = (index + 1) % available.length;
      fillCard();
    });
  });
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
  if (target.dataset.buy) { const id = target.dataset.buy; openCheckout([{ productId: id, size: selectedSizes[id], cover: selectedCovers[id], quantity: 1 }]); return; }
  if (target.dataset.quantity) { changeQuantity(target.dataset.key, Number(target.dataset.quantity)); return; }
  if (target.dataset.remove) { removeFromCart(target.dataset.remove); return; }
  if (target.id === 'begin-checkout') { openCheckout(cart); return; }
  if (target.id === 'payment-returned') { renderCelebration(); return; }
  if (target.id === 'clear-checkout-details') { clearCheckoutDraft(); return; }
  if (target.id === 'edit-checkout-details') { renderCheckoutForm(); saveCheckoutDraft(); return; }
  if (target.id === 'copy-upi') {
    navigator.clipboard?.writeText(UPI_ID);
    target.textContent = 'COPIED';
    setTimeout(() => { target.textContent = 'COPY'; }, 1500);
  }
});

document.addEventListener('change', (event) => {
  const productId = event.target.dataset.coverProduct;
  if (!productById(productId) || !Object.hasOwn(covers, event.target.value)) return;
  selectedCovers[productId] = event.target.value;
  renderHero();
  renderProducts();
});

document.addEventListener('input', (event) => {
  const form = event.target.closest('#checkout-form');
  if (!form) return;
  customerDetails = readCustomerForm(form);
  updateDeliverySummary();
  saveCheckoutDraft();
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'checkout-form') {
    event.preventDefault();
    customerDetails = readCustomerForm(event.target);
    renderPayment();
  }
});

$('#site-shell').addEventListener('pointermove', (event) => {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--pointer-x', `${((event.clientX - box.left) / box.width) * 100}%`);
  event.currentTarget.style.setProperty('--pointer-y', `${((event.clientY - box.top) / box.height) * 100}%`);
});

cart = loadCart();
renderHero();
renderProducts();
renderCart();
updateCustomWhatsApp();
rotateStory();
rotateReview();
restoreCheckoutDraft();
