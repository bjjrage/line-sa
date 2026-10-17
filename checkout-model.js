(function(root){
  const cart=typeof module==='object'&&module.exports?require('./cart.js'):root.LINE_CART;
  const pricing=typeof module==='object'&&module.exports?require('./pricing.js'):root.LINE_PRICING;
  function buildOrder(items,products,financing){
    const totals=cart.getTotals(items,products);
    const lines=[];
    for(const item of items){
      const product=products.find(product=>product.id===item.id);
      const variant=product?.variants.find(variant=>variant.id===item.variantId);
      if(!product||product.status==='out'||!variant||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)continue;
      const cash=Number.isInteger(variant.priceGs)&&variant.priceGs>0?variant.priceGs*item.quantity:null;
      lines.push({...item,name:product.name,capacity:product.capacity,color:variant.color,condition:variant.condition,cash,plan:pricing.financePlan(cash,item.term,financing)});
    }
    const complete=lines.length===items.length&&lines.length>0&&totals.pendingQuantity===0;
    const financedComplete=complete&&lines.every(line=>line.plan);
    return {...totals,lines,payable:complete,financedPayable:financedComplete,financedTotal:financedComplete?lines.reduce((sum,line)=>sum+line.plan.total,0):null};
  }
  root.LINE_CHECKOUT={buildOrder};
  if(typeof module==='object'&&module.exports)module.exports={buildOrder};
})(typeof window==='object'?window:globalThis);
