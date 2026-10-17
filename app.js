const config = window.LINE_CONFIG;
const products = config.products;
const productById = new Map(products.map(product => [product.id, product]));
const storageKey = 'line-retail-selection-v2';
const $ = selector => document.querySelector(selector);
const safeText = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const cleanPreference = value => typeof value === 'string' ? value.trim().slice(0,120) : '';
const validPhone = phone => /^\d{8,15}$/.test(phone || '');
let selection = [];
let filter = 'all';
let activeProduct;
let catalogTerm = config.financing.defaultTerm;
let activeTerm = catalogTerm;
const money = value => `₲ ${new Intl.NumberFormat('es-PY',{maximumFractionDigits:0}).format(value)}`;
const fullName = product => `${product.name}${/GB/.test(product.capacity)?` ${product.capacity}`:''}`;
const variantLabel = variant => [variant.color,variant.condition].filter(Boolean).join(' · ');
const priceFor = variant => Number.isInteger(variant?.priceGs)&&variant.priceGs>0?variant.priceGs:null;
const planFor = (price,term) => window.LINE_PRICING.financePlan(price,term,config.financing);
const defaultVariant = product => [...product.variants].sort((a,b)=>(a.priceGs??Infinity)-(b.priceGs??Infinity))[0];
const officialImages = {'iphone-16-128':'iphone-16.jpg','iphone-15-128':'iphone-15.jpg','iphone-14-128':'iphone-14.jpg','iphone-13-128':'iphone-13.jpg','iphone-12-128':'iphone-12.jpg','iphone-11-128':'iphone-11.jpg','iphone-11-64':'iphone-11.jpg'};
const methodName = () => ({simple:'Interés simple proporcional al plazo',nominal:'Cuota fija sobre saldo · TNA',effective:'Cuota fija sobre saldo · TEA'}[config.financing.method]||'Modalidad a confirmar');
const financingNote = () => `Simulación al 45% anual. ${methodName()}. Cuotas mensuales en guaraníes; la última ajusta el redondeo. Disponibilidad y condiciones a confirmar por WhatsApp.`;
let retailSummary = '';
let wholesaleSummary = '';
let toastTimer;
const dialogTriggers = new WeakMap();

try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) selection = stored.slice(0,20).filter(item => item && productById.has(item.id) && productById.get(item.id).status!=='out' && productById.get(item.id).variants.some(variant=>variant.id===item.variantId)).map(item => ({id:item.id,variantId:item.variantId,notes:cleanPreference(item.notes),term:config.financing.terms.includes(item.term)?item.term:catalogTerm,quantity:Number.isInteger(item.quantity)?Math.max(1,Math.min(20,item.quantity)):1}));
} catch { /* La selección sigue funcionando si el almacenamiento no está disponible. */ }

function persistSelection() {
  try { localStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Sesión sin almacenamiento persistente. */ }
  const count = window.LINE_CART.getTotals(selection,products).quantity;
  document.querySelectorAll('.selection-count').forEach(badge => {badge.textContent = count;badge.setAttribute('aria-label',`${count} ${count===1?'producto':'productos'}`);});
  $('.cart-fab').hidden=count===0;
}
function openDialog(id, trigger) {
  const dialog = $(id);
  if (dialog.open) return;
  dialogTriggers.set(dialog, trigger || document.activeElement);
  dialog.showModal(); dialog.scrollTop = 0;
}
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { const trigger=dialogTriggers.get(dialog); if(trigger?.isConnected)trigger.focus(); });
  dialog.addEventListener('click',event=> { if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close(); });
});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.close).close()));

function renderProducts() {
  const query = $('#shop-search').value.trim().toLocaleLowerCase('es');
  const visible = products.filter(product => (filter==='all'||filter==='budget'&&product.budget||filter==='apple'&&product.brand==='Apple'||filter==='samsung'&&product.brand==='Samsung'||filter==='consolas'&&product.category==='consolas')&&`${product.brand} ${product.name} ${product.capacity} ${product.variants.map(variantLabel).join(' ')}`.toLocaleLowerCase('es').includes(query));
  $('#product-grid').innerHTML = visible.map(product=>{
    const variant=defaultVariant(product);const cash=priceFor(variant);const plan=planFor(cash,catalogTerm);const out=product.status==='out';
    const from=new Set(product.variants.map(priceFor)).size>1?' desde':'';
    const priceContent=out?'<p class="no-stock-text">Sin stock por el momento</p>':cash?`<p class="card-cash">Contado${from} <strong>${money(cash)}</strong></p><div class="card-installment">${plan?`<span>${catalogTerm} cuotas desde</span><strong>${money(plan.monthly)}<small>/mes</small></strong>`:`<span>6, 12 o 18 cuotas</span><strong class="pending-price">Consultá tu plan</strong>`}</div>`:'<p class="card-cash">Precio y disponibilidad<strong>A consultar</strong></p><div class="card-installment"><span>6, 12 o 18 cuotas</span><strong class="pending-price">Pedí tu cotización</strong></div>';
    return `<article class="product-card ${out?'is-out':''}"><button class="product-image ${safeText(product.photo)}" data-product="${safeText(product.id)}" aria-label="Ver ficha de ${safeText(fullName(product))}">${product.tag?`<span class="product-badge">${safeText(product.tag)}</span>`:''}<span class="reference-note">IMAGEN DE REFERENCIA</span></button><div class="product-info"><p class="product-brand">${safeText(product.brand.toUpperCase())} / ${product.category==='consolas'?'CONSOLAS':'CELULARES'}</p><h3>${safeText(product.name)}</h3><p class="product-capacity">${safeText(product.capacity)}</p><p class="product-tagline">${variant?safeText(variantLabel(variant)):'Reposición a confirmar'}</p><div class="catalog-card-price">${priceContent}</div><div class="catalog-card-action"><span>${out?'NO DISPONIBLE':'Ver colores y cuotas'}</span><button class="add-product" data-product="${safeText(product.id)}" aria-label="Elegir ${safeText(fullName(product))}" ${out?'disabled':''}>${out?'—':'+'}</button></div></div></article>`;
  }).join('');
  for(const product of visible){const photo=officialImages[product.id];if(!photo)continue;const imageButton=$(`#product-grid .product-image[data-product="${product.id}"]`);imageButton.classList.add('official-photo');const img=document.createElement('img');img.src=`assets/${photo}`;img.alt=`${product.name}, imagen de referencia del fabricante`;img.loading='lazy';imageButton.prepend(img);}
  $('#shop-empty').hidden=visible.length>0;
  $('#product-count').textContent=`${String(visible.length).padStart(2,'0')} ${visible.length===1?'MODELO':'MODELOS'}`;
  $('#all-products-count').textContent=products.length;
  $('#catalog-finance-note').textContent=financingNote();
}
document.querySelectorAll('[data-catalog-term]').forEach(button=>button.addEventListener('click',()=>{catalogTerm=Number(button.dataset.catalogTerm);document.querySelectorAll('[data-catalog-term]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});renderProducts();}));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});
  renderProducts();
}));
$('#shop-search').addEventListener('input',renderProducts);
$('#product-grid').addEventListener('click',event=>{
  const trigger=event.target.closest('[data-product]');if(!trigger)return;
  activeProduct=productById.get(trigger.dataset.product);if(!activeProduct)return;
  $('#product-title').textContent=fullName(activeProduct);
  $('#product-brand').textContent=`LINE / ${activeProduct.brand.toUpperCase()}`;
  $('#product-description').textContent=activeProduct.status==='out'?'Consultá más adelante por su reposición.':activeProduct.brand==='Samsung'?'Consultá precio, capacidad, colores y disponibilidad con el equipo comercial.':'Elegí la variante. El precio y las cuotas se actualizan según el color y la condición informada.';
  $('#product-form').reset();
  activeTerm=catalogTerm;
  $('#product-form').hidden=activeProduct.status==='out';$('#product-out').hidden=activeProduct.status!=='out';
  $('#product-variant').innerHTML=activeProduct.variants.map(variant=>`<option value="${safeText(variant.id)}">${safeText(variantLabel(variant))}</option>`).join('');
  if(activeProduct.status!=='out'){$('#product-variant').value=defaultVariant(activeProduct).id;updateProductPlan();}
  openDialog('#product-dialog',trigger);
});
function updateProductPlan() {
  if(!activeProduct||activeProduct.status==='out')return;
  const variant=activeProduct.variants.find(item=>item.id===$('#product-variant').value);const unitPrice=priceFor(variant);
  const quantity=Math.max(1,Math.min(20,Number($('#product-form').elements.quantity.value)||1));
  const cash=unitPrice===null?null:unitPrice*quantity;const plan=planFor(cash,activeTerm);
  $('#product-cash-price').textContent=cash===null?'A consultar':money(cash)+(quantity>1?` · ${quantity} unidades`:'');
  $('#product-plan').innerHTML=plan?`<p class="plan-eyebrow">${activeTerm} CUOTAS MENSUALES</p><p class="plan-main">${money(plan.monthly)}<span>/mes</span></p>`:`<p class="plan-eyebrow">${activeTerm} CUOTAS</p><p class="plan-pending">${cash===null?'Precio y cuotas a consultar.':'Cálculo de cuotas pendiente de confirmación.'}</p>`;
  $('#product-finance-note').textContent=financingNote();
  document.querySelectorAll('[data-product-term]').forEach(button=>{const active=Number(button.dataset.productTerm)===activeTerm;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
}
$('#product-variant').addEventListener('change',updateProductPlan);$('#product-form').elements.quantity.addEventListener('input',updateProductPlan);
document.querySelectorAll('[data-product-term]').forEach(button=>button.addEventListener('click',()=>{activeTerm=Number(button.dataset.productTerm);updateProductPlan();}));
$('#product-form').addEventListener('submit',event=>{
  event.preventDefault();if(!activeProduct||activeProduct.status==='out')return;
  const data=new FormData(event.currentTarget);
  const quantity=Number(data.get('quantity'));if(!Number.isInteger(quantity)||quantity<1||quantity>20)return;
  if(!activeProduct.variants.some(variant=>variant.id===data.get('variant')))return;
  const item={id:activeProduct.id,variantId:data.get('variant'),notes:cleanPreference(data.get('notes')),term:activeTerm,quantity};
  const match=selection.find(existing=>existing.id===item.id&&existing.variantId===item.variantId&&existing.notes===item.notes&&existing.term===item.term);
  if(match)match.quantity=Math.min(20,match.quantity+quantity);
  else if(selection.length<20)selection.push(item);
  else {$('#product-dialog').close();showToast('Tu carrito está completo. Revisalo antes de sumar más.');return;}
  persistSelection();$('#product-dialog').close();showToast(`${activeProduct.name} agregado al carrito.`);
});
function showToast(message) {clearTimeout(toastTimer);$('#toast-message').textContent=message;$('#shop-toast').hidden=false;toastTimer=setTimeout(()=>{$('#shop-toast').hidden=true;},5500);}

function renderSelection() {
  selection=selection.filter(item=>productById.has(item.id)&&productById.get(item.id).status!=='out'&&productById.get(item.id).variants.some(variant=>variant.id===item.variantId));
  persistSelection();
  const totals=window.LINE_CART.getTotals(selection,products);
  $('#selection-empty').hidden=selection.length>0;
  $('#selection-content').hidden=selection.length===0;
  $('#retail-result').hidden=true;
  $('#selection-items').innerHTML=selection.map((item,index)=>{
    const product=productById.get(item.id);
    const variant=product.variants.find(variant=>variant.id===item.variantId);const unitPrice=priceFor(variant);const cash=unitPrice===null?null:unitPrice*item.quantity;const plan=planFor(cash,item.term);
    const details=[variantLabel(variant),item.notes].filter(Boolean).join(' · ');
    const photo=officialImages[product.id];
    const thumb=photo?`<div class="cart-item-thumb"><img src="assets/${safeText(photo)}" alt="${safeText(product.name)}" width="64" height="78"></div>`:`<div class="cart-item-thumb reference-thumb ${safeText(product.photo)}" aria-hidden="true"></div>`;
    const price=cash===null?'Por cotizar':money(cash);
    const monthly=plan?`${item.term} cuotas desde ${money(plan.monthly)}/mes${item.quantity>1?' · por estas unidades':''}`:`Cuotas a confirmar por WhatsApp`;
    return `<article class="selection-item">${thumb}<div class="cart-item-main"><h3>${safeText(fullName(product))}</h3><p>${safeText(details)}</p><div class="cart-line-price">${price}${unitPrice!==null&&item.quantity>1?`<span class="cart-unit-price">${money(unitPrice)} c/u</span>`:''}</div><div class="cart-line-controls"><div class="quantity-control"><button data-quantity="${index}" data-delta="-1" aria-label="Restar ${safeText(fullName(product))}" ${item.quantity===1?'disabled':''}>−</button><output aria-label="Cantidad de ${safeText(fullName(product))}">${item.quantity}</output><button data-quantity="${index}" data-delta="1" aria-label="Sumar ${safeText(fullName(product))}" ${item.quantity===20?'disabled':''}>+</button></div><label><span class="sr-only">Cuotas de ${safeText(fullName(product))} ${safeText(variantLabel(variant))}</span><select class="cart-plan-select" data-cart-term="${index}" aria-label="Cuotas de ${safeText(fullName(product))} ${safeText(variantLabel(variant))}">${config.financing.terms.map(term=>`<option value="${term}" ${item.term===term?'selected':''}>${term} cuotas</option>`).join('')}</select></label></div><p class="cart-monthly">${monthly}</p><button class="remove-item" data-remove="${index}" aria-label="Quitar ${safeText(fullName(product))}">Quitar</button></div></article>`;
  }).join('');
  $('#cart-item-count').textContent=totals.quantity?`${String(totals.quantity).padStart(2,'0')} ${totals.quantity===1?'PRODUCTO':'PRODUCTOS'}`:'';
  $('#cart-total-label').textContent=totals.pendingQuantity?'Subtotal con precio (contado)':'Subtotal al contado';
  $('#cart-subtotal').textContent=totals.pricedQuantity?money(totals.subtotal):'A cotizar';
  $('#cart-pending').hidden=totals.pendingQuantity===0;
  $('#cart-pending').textContent=`${totals.pendingQuantity} ${totals.pendingQuantity===1?'producto pendiente de cotización. Su precio no está incluido en el subtotal.':'productos pendientes de cotización. Sus precios no están incluidos en el subtotal.'}`;
  updateCartWhatsApp();
}
function openSelection(trigger) {$('#shop-toast').hidden=true;renderSelection();openDialog('#selection-dialog',trigger);}
document.querySelectorAll('[data-selection]').forEach(button=>button.addEventListener('click',()=>openSelection(button)));
$('#browse-products').addEventListener('click',()=>{$('#selection-dialog').close();$('#mini-shop').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('#continue-shopping').addEventListener('click',()=>{$('#selection-dialog').close();$('#mini-shop').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('#selection-items').addEventListener('click',event=>{
  const quantityButton=event.target.closest('[data-quantity]');const removeButton=event.target.closest('[data-remove]');
  if(quantityButton){const index=Number(quantityButton.dataset.quantity);const item=selection[index];if(!item)return;item.quantity=Math.max(1,Math.min(20,item.quantity+Number(quantityButton.dataset.delta)));persistSelection();renderSelection();const replacement=$(`#selection-items [data-quantity="${index}"][data-delta="${quantityButton.dataset.delta}"]`);if(replacement&&!replacement.disabled)replacement.focus();else $(`#selection-items [data-quantity="${index}"]:not(:disabled)`)?.focus();}
  if(removeButton){const index=Number(removeButton.dataset.remove);if(!Number.isInteger(index)||!selection[index])return;selection.splice(index,1);persistSelection();renderSelection();$('#selection-items .remove-item')?.focus();if(!selection.length)$('#browse-products').focus();}
});
$('#selection-items').addEventListener('change',event=>{const select=event.target.closest('[data-cart-term]');if(!select)return;const index=Number(select.dataset.cartTerm);const term=Number(select.value);if(!selection[index]||!config.financing.terms.includes(term))return;selection[index].term=term;persistSelection();renderSelection();$(`#selection-items [data-cart-term="${index}"]`)?.focus();});

function attachWhatsApp(resultId,phone,message) {
  const result=$(resultId);let link=result.querySelector('.whatsapp-link');
  if(!validPhone(phone)){link?.remove();return false;}
  if(!link){link=document.createElement('a');link.className='button button-light whatsapp-link';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Continuar en WhatsApp ↗';result.querySelector('pre').after(link);}
  link.href=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;return true;
}
$('#retail-submit-label').textContent='Ver resumen del pedido';
$('#retail-contact-note').textContent=validPhone(config.retailWhatsApp)?'Se abre WhatsApp con tu carrito. Confirmá allí los detalles con nuestro equipo.':'Podés revisar y copiar tu pedido. El contacto comercial todavía no está disponible.';
function composeRetailSummary(){
  const data=new FormData($('#retail-form'));const name=String(data.get('name')||'').trim();const notes=String(data.get('notes')||'').trim();
  const lines=selection.map(item=>{const product=productById.get(item.id);const variant=product.variants.find(variant=>variant.id===item.variantId);const unitPrice=priceFor(variant);const cash=unitPrice===null?null:unitPrice*item.quantity;const plan=planFor(cash,item.term);return `• ${item.quantity} × ${fullName(product)} — ${variantLabel(variant)}${item.notes?`\n  Observaciones: ${item.notes}`:''}${cash===null?`\n  Precio a consultar. Me interesan ${item.term} cuotas.`:`\n  Contado: ${money(cash)}${plan?`\n  Plan: ${item.term-1} cuotas de ${money(plan.monthly)} + última de ${money(plan.lastPayment)}\n  Total financiado: ${money(plan.total)} · Interés: ${money(plan.interest)}`:`\n  Plazo deseado: ${item.term} cuotas (importe a confirmar).`}`}`;}).join('\n\n');
  const totals=window.LINE_CART.getTotals(selection,products);
  const subtotal=totals.pricedQuantity?`${totals.pendingQuantity?'Subtotal con precio (contado)':'Subtotal al contado'}: ${money(totals.subtotal)}`:'Subtotal a cotizar.';
  return `Hola, Line S.A. Quiero consultar por mi carrito del mini shop.\n${name?`\nMi nombre: ${name}\n`:''}\nMi carrito:\n${lines}\n\n${subtotal}${totals.pendingQuantity?`\n${totals.pendingQuantity} ${totals.pendingQuantity===1?'producto por cotizar, no incluido en el subtotal.':'productos por cotizar, no incluidos en el subtotal.'}`:''}\n\nTasa: 45% anual. ${methodName()}.\n¿Me confirman disponibilidad, condiciones y entrega?${notes?`\n\nMi consulta: ${notes}`:''}`;
}
function updateCartWhatsApp(){const link=$('#cart-whatsapp');const available=validPhone(config.retailWhatsApp)&&selection.length>0;link.setAttribute('aria-disabled',String(!available));if(available)link.href=`https://wa.me/${config.retailWhatsApp}?text=${encodeURIComponent(composeRetailSummary())}`;else link.removeAttribute('href');}
$('#retail-form').addEventListener('input',updateCartWhatsApp);
$('#retail-form').addEventListener('submit',event=>{
  event.preventDefault();if(!selection.length)return;
  retailSummary=composeRetailSummary();
  $('#retail-summary').textContent=retailSummary;
  const available=attachWhatsApp('#retail-result',config.retailWhatsApp,retailSummary);
  $('#retail-feedback').textContent=available?'Tu consulta está lista. Continuá en WhatsApp y confirmá el envío allí.':'Consulta preparada. Podés copiarla o descargarla; aún no se envió.';
  $('#selection-content').hidden=true;$('#selection-empty').hidden=true;$('#retail-result').hidden=false;
  $('#selection-dialog').scrollTop=0;$('#retail-result .whatsapp-link, #copy-retail').focus();
});
$('#edit-selection').addEventListener('click',()=>{renderSelection();$('#cart-whatsapp').focus();});

$('#wholesale-submit-label').textContent=validPhone(config.wholesaleWhatsApp)?'Revisar consulta mayorista':'Preparar consulta mayorista';
$('#wholesale-contact-note').textContent=validPhone(config.wholesaleWhatsApp)?'Revisá tu pedido y continuá la consulta por WhatsApp.':'Podés copiar o descargar tu consulta para compartirla con el equipo comercial.';
document.querySelectorAll('[data-quote]').forEach(button=>button.addEventListener('click',()=>{$('#quote-form').hidden=false;$('#wholesale-result').hidden=true;openDialog('#quote-dialog',button);}));
$('#quote-form').addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(event.currentTarget);
  wholesaleSummary=`Hola, Line S.A. Quiero consultar por un pedido MAYORISTA.\n\nNombre: ${data.get('name').trim()}\nNegocio: ${data.get('business').trim()}\nContacto: ${data.get('contact').trim()}\nLíneas: ${data.getAll('brand').join(', ')||'A consultar'}\n\nModelos y cantidades:\n${data.get('details').trim()}`;
  $('#quote-summary').textContent=wholesaleSummary;const available=attachWhatsApp('#wholesale-result',config.wholesaleWhatsApp,wholesaleSummary);
  $('#quote-feedback').textContent=available?'Consulta mayorista lista. Continuá en WhatsApp y confirmá el envío allí.':'Tu consulta está lista para compartir. Aún no se envió.';
  $('#quote-form').hidden=true;$('#wholesale-result').hidden=false;$('#quote-dialog').scrollTop=0;$('#wholesale-result .whatsapp-link, #copy-quote').focus();
});
$('#edit-quote').addEventListener('click',()=>{$('#quote-form').hidden=false;$('#wholesale-result').hidden=true;$('#quote-form').elements.name.focus();});
async function copySummary(summary,feedback) {try{await navigator.clipboard.writeText(summary);feedback.textContent='Consulta copiada. Ya podés compartirla.';}catch{feedback.textContent='No se pudo acceder al portapapeles. Podés descargar tu consulta.';}}
function downloadSummary(summary,filename,feedback){const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback.textContent='Consulta descargada. Lista para compartir.';}
$('#copy-retail').addEventListener('click',()=>copySummary(retailSummary,$('#retail-feedback')));
$('#copy-quote').addEventListener('click',()=>copySummary(wholesaleSummary,$('#quote-feedback')));
$('#download-retail').addEventListener('click',()=>downloadSummary(retailSummary,'consulta-cuotas-line-sa.txt',$('#retail-feedback')));
$('#download-quote').addEventListener('click',()=>downloadSummary(wholesaleSummary,'consulta-mayorista-line-sa.txt',$('#quote-feedback')));

const menu=$('.menu-toggle');const navigation=$('#navigation');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú');navigation.classList.remove('is-open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');navigation.classList.toggle('is-open',open);});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
$('#year').textContent=new Date().getFullYear();$('.financing-note').textContent=financingNote();$('.selection-pricing').textContent='Las cuotas son una simulación al 45% anual. Disponibilidad, financiación y entrega se confirman por WhatsApp.';persistSelection();renderProducts();
