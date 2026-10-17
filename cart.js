(function(root){
  function getTotals(items,products){
    const byId=new Map(products.map(product=>[product.id,product]));
    let subtotal=0,quantity=0,pendingQuantity=0,pricedQuantity=0;
    for(const item of items){
      const product=byId.get(item.id);if(!product||product.status==='out')continue;
      const variant=product.variants.find(variant=>variant.id===item.variantId);
      if(!variant||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)continue;
      quantity+=item.quantity;
      if(Number.isInteger(variant.priceGs)&&variant.priceGs>0){subtotal+=variant.priceGs*item.quantity;pricedQuantity+=item.quantity;}
      else pendingQuantity+=item.quantity;
    }
    return {subtotal,quantity,pendingQuantity,pricedQuantity};
  }
  root.LINE_CART={getTotals};if(typeof module==='object'&&module.exports)module.exports={getTotals};
})(typeof window==='object'?window:globalThis);
