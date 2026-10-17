// Pasarela de demostración: no procesa pagos, guarda tarjetas ni confirma pedidos.
const paymentMethods={card:'Tarjeta de crédito o débito',transfer:'Transferencia bancaria',installments:'Cuotas Line'};
const currentPaymentMethod=()=>$('#payment-form').elements['payment-method'].value;
const checkoutOrder=()=>window.LINE_CHECKOUT.buildOrder(selection,products,config.financing);
function checkoutMessage(order,method){
  const data=new FormData($('#retail-form'));const name=String(data.get('name')||'').trim();const notes=String(data.get('notes')||'').trim();
  const lines=order.lines.map(line=>`• ${line.quantity} × ${line.name} ${/GB/.test(line.capacity)?line.capacity:''} — ${[line.color,line.condition].filter(Boolean).join(' · ')}\n  Contado: ${line.cash===null?'A cotizar':money(line.cash)}${method==='installments'&&line.plan?`\n  Plan: ${line.term-1} cuotas de ${money(line.plan.monthly)} + última de ${money(line.plan.lastPayment)}\n  Total del plan: ${money(line.plan.total)}`:''}${line.notes?`\n  Observaciones: ${line.notes}`:''}`).join('\n\n');
  return `Hola, Line S.A. Quiero consultar por mi pedido.${name?`\nMi nombre: ${name}`:''}\n\n${lines}\n\n${order.pendingQuantity?'Subtotal con precio':'Subtotal al contado'}: ${order.pricedQuantity?money(order.subtotal):'A cotizar'}${order.pendingQuantity?'\nHay productos pendientes de cotización.':''}\nMedio de pago de mi interés: ${paymentMethods[method]}.${method==='installments'?`\n${financingNote()}${order.financedPayable?`\nTotal de los planes: ${money(order.financedTotal)}`:''}`:''}\n¿Me confirman disponibilidad, condiciones y entrega?${notes?`\nMi consulta: ${notes}`:''}`;
}

function renderCheckout(){
  const order=checkoutOrder();const method=currentPaymentMethod();
  const financed=method==='installments';
  $('#checkout-flow').hidden=false;$('#checkout-result').hidden=true;
  $('#checkout-quantity').textContent=`${order.quantity} ${order.quantity===1?'PRODUCTO':'PRODUCTOS'}`;
  $('#checkout-lines').innerHTML=order.lines.map(line=>`<article class="checkout-line"><div><h4>${line.quantity} × ${safeText(line.name)} ${/GB/.test(line.capacity)?safeText(line.capacity):''}</h4><p>${safeText([line.color,line.condition].filter(Boolean).join(' · '))}</p>${line.notes?`<p>${safeText(line.notes)}</p>`:''}</div><strong>${line.cash===null?'Por cotizar':money(line.cash)}</strong></article>`).join('');
  $('#checkout-subtotal').textContent=order.pricedQuantity?money(order.subtotal):'A cotizar';
  $('#checkout-subtotal').previousElementSibling.textContent=order.pendingQuantity?'Subtotal con precio':'Subtotal al contado';
  $('#checkout-total-label').textContent=financed?'Total del plan':'Total al contado';
  $('#checkout-total').textContent=order.payable?(financed?(order.financedPayable?money(order.financedTotal):'A confirmar'):money(order.subtotal)):'A cotizar';
  $('#checkout-pending').hidden=order.payable;
  $('#checkout-pending').textContent='Hay productos pendientes de precio o disponibilidad. Consultá su cotización antes de pagar.';
  $('#payment-card-panel').hidden=method!=='card';$('#payment-transfer-panel').hidden=method!=='transfer';$('#payment-installments-panel').hidden=!financed;
  $('#checkout-installment-lines').innerHTML=order.lines.map(line=>`<div class="checkout-plan-line"><span>${line.quantity} × ${safeText(line.name)}<small>${line.term} cuotas</small></span><strong>${line.plan?`${money(line.plan.monthly)}<small>/mes${line.quantity>1?' · estas unidades':''}</small>`:'A confirmar'}</strong></div>`).join('');
  $('#checkout-rate-note').textContent=financingNote()+' El total del plan incluye el interés del plazo elegido. Los planes con distintos plazos se muestran por producto.';
  $('.payment-submit').disabled=financed?!order.financedPayable:!order.payable;
  $('#payment-submit-label').textContent=method==='transfer'?'Simular transferencia':financed?'Simular plan de cuotas':'Simular pago con tarjeta';
  const message=checkoutMessage(order,method);
  for(const selector of ['#checkout-whatsapp','#checkout-result-whatsapp']){const link=$(selector);link.hidden=!validPhone(config.retailWhatsApp);if(!link.hidden)link.href=`https://wa.me/${config.retailWhatsApp}?text=${encodeURIComponent(message)}`;else link.removeAttribute('href');}
}
$('#cart-pay').addEventListener('click',event=>{
  renderSelection();if(!selection.length)return;
  $('#payment-form').reset();renderCheckout();openDialog('#checkout-dialog',event.currentTarget);
});
$('#payment-form').addEventListener('change',renderCheckout);
$('#payment-form').addEventListener('submit',event=>{
  event.preventDefault();
  const order=checkoutOrder();const method=currentPaymentMethod();
  if(!Object.hasOwn(paymentMethods,method)||!order.payable||method==='installments'&&!order.financedPayable){renderCheckout();return;}
  // Sólo se cambia la vista local. Sin solicitudes a procesadores ni comprobantes reales.
  $('#demo-method').textContent=paymentMethods[method];
  $('#demo-amount').textContent=money(method==='installments'?order.financedTotal:order.subtotal);
  $('#checkout-flow').hidden=true;$('#checkout-result').hidden=false;
  $('#checkout-dialog').scrollTop=0;$('#checkout-result-title').focus();
});
$('#retry-checkout').addEventListener('click',()=>{renderCheckout();$('#payment-form input:checked').focus();});
