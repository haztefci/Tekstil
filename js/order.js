const orderProducts = window.PRODUCTS.filter((product) => product.active !== false);

const productsBody = document.getElementById('order-products');
const orderForm = document.getElementById('order-form');
const formError = document.getElementById('form-error');
const formStatus = document.getElementById('form-status');
const submitButton = document.getElementById('submit-order');
const orderEndpoint = 'https://formsubmit.co/ajax/etipicikisyurdu@hotmail.com';

productsBody.innerHTML = orderProducts.map((product) => `
  <tr>
    <td data-label="Ürün kodu">${product.code}</td>
    <td data-label="Ürün">${product.name}</td>
    <td data-label="Sipariş adedi">
      <input type="number" name="quantity-${product.code}" data-code="${product.code}" min="0" step="1" inputmode="numeric" aria-label="${product.name} sipariş adedi">
    </td>
    <td data-label="Sipariş notu">
      <input class="product-note" type="text" name="note-${product.code}" data-note-code="${product.code}" aria-label="${product.name} sipariş notu" placeholder="Renk, beden vb.">
    </td>
  </tr>
`).join('');

const requestedProductCode = new URLSearchParams(window.location.search).get('product');
if (requestedProductCode) {
  const requestedQuantity = orderForm.querySelector(`[data-code="${requestedProductCode}"]`);
  if (requestedQuantity) {
    requestedQuantity.value = '1';
    requestedQuantity.closest('tr').classList.add('selected-product');
  }
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;
  formStatus.hidden = true;

  if (!orderForm.reportValidity()) return;

  const selectedProducts = orderProducts.map((product) => {
    const input = orderForm.querySelector(`[data-code="${product.code}"]`);
    const noteInput = orderForm.querySelector(`[data-note-code="${product.code}"]`);
    return { ...product, quantity: Number(input.value), note: noteInput.value.trim() };
  }).filter((product) => Number.isInteger(product.quantity) && product.quantity > 0);

  if (selectedProducts.length === 0) {
    formError.textContent = 'Lütfen en az bir ürün için sipariş adedi girin.';
    formError.hidden = false;
    productsBody.querySelector('input').focus();
    return;
  }

  const data = new FormData(orderForm);
  const productLines = selectedProducts.map((product) => {
    const note = product.note ? ` | Not: ${product.note}` : '';
    return `- ${product.code} | ${product.name}: ${product.quantity} adet${note}`;
  });
  const payload = {
    _subject: `Yeni sipariş - ${data.get('institution')}`,
    _template: 'table',
    _cc: 'haz.tefci@gmail.com',
    'Kurum adı': data.get('institution'),
    'Siparişi veren': data.get('fullName'),
    'İletişim numarası': data.get('phone'),
    'Sipariş kalemleri': productLines.join('\n')
  };

  submitButton.disabled = true;
  submitButton.innerHTML = 'Gönderiliyor…';

  try {
    const response = await fetch(orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === 'false' || result.success === false) throw new Error('Gönderim başarısız');

    orderForm.reset();
    formStatus.textContent = 'Siparişiniz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.';
    formStatus.hidden = false;
  } catch (error) {
    formError.textContent = 'Sipariş gönderilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
    formError.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Siparişi gönder <span>→</span>';
  }
});
