// Funciones compartidas por catálogo, simulador, selección y mensaje de WhatsApp.
(function(root){
  function cashPrice(referenceUsd,pricing) {
    if(!Number.isFinite(referenceUsd)||referenceUsd<=0)return null;
    return Math.round(referenceUsd*pricing.exchangeRate*(100+pricing.markupPercent)/100);
  }
  function financePlan(principal,months,financing) {
    if(!Number.isInteger(principal)||principal<=0||!financing.terms.includes(months)||!['simple','nominal','effective'].includes(financing.method))return null;
    let unroundedTotal;
    if(financing.method==='simple')unroundedTotal=principal*(1+financing.annualRate*months/12);
    else {
      const rate=financing.method==='nominal'?financing.annualRate/12:Math.expm1(Math.log1p(financing.annualRate)/12);
      const monthly=rate===0?principal/months:principal*rate/(-Math.expm1(-months*Math.log1p(rate)));
      unroundedTotal=monthly*months;
    }
    // Compensa el error binario en importes que terminan exactamente en medio guaraní.
    const total=Math.round(unroundedTotal+Number.EPSILON*Math.abs(unroundedTotal));
    const monthly=Math.round(total/months);
    const lastPayment=total-monthly*(months-1);
    return {months,principal,total,monthly,lastPayment,interest:total-principal,annualRate:financing.annualRate,method:financing.method};
  }
  const api={cashPrice,financePlan};
  root.LINE_PRICING=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
