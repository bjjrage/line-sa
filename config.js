// Precios retail en guaraníes. Las referencias de proveedor se conservan
// fuera de los archivos servidos al público, en data/precios-referencia.csv.
window.LINE_CONFIG = Object.freeze({
  retailWhatsApp: '595974810900', wholesaleWhatsApp: '595974810900',
  financing: {annualRate:0.45,method:'simple',terms:[6,12,18],defaultTerm:12},
  products: [
    {id:'iphone-16-128',brand:'Apple',name:'iPhone 16',capacity:'128 GB',category:'celulares',photo:'apple',tag:'DESTACADO',status:'consult',variants:[
      {id:'blue-active',color:'Azul',condition:'Activado',priceGs:5054825},
      {id:'blue',color:'Azul',condition:'',priceGs:5156600},
      ...['Blanco','Rosa','Negro','Verde'].map(color=>({id:color.toLowerCase(),color,condition:'',priceGs:5190525}))]},
    {id:'iphone-15-128',brand:'Apple',name:'iPhone 15',capacity:'128 GB',category:'celulares',photo:'apple',tag:'DESTACADO',status:'consult',variants:[
      {id:'blue-act',color:'Azul',condition:'ACT · A3090',priceGs:4240625},
      {id:'blue',color:'Azul',condition:'',priceGs:4579875},{id:'black',color:'Negro',condition:'',priceGs:4579875}]},
    {id:'iphone-14-128',brand:'Apple',name:'iPhone 14',capacity:'128 GB',category:'celulares',photo:'apple',tag:'DESTACADO',status:'consult',variants:[{id:'midnight',color:'Midnight',condition:'R',priceGs:4138850}]},
    {id:'iphone-14-pm-128',brand:'Apple',name:'iPhone 14 Pro Max',capacity:'128 GB',category:'celulares',photo:'apple',status:'consult',variants:[{id:'purple',color:'Lila',condition:'SWAP A',priceGs:3528200}]},
    {id:'iphone-14-pm-256',brand:'Apple',name:'iPhone 14 Pro Max',capacity:'256 GB',category:'celulares',photo:'apple',tag:'SIN STOCK',status:'out',variants:['Dorado','Blanco','Lila'].map(color=>({id:color.toLowerCase(),color,condition:'SWAP A+',priceGs:3867450}))},
    {id:'iphone-13-128',brand:'Apple',name:'iPhone 13',capacity:'128 GB',category:'celulares',photo:'apple',tag:'MÁS ECONÓMICO',budget:true,status:'consult',variants:['Rosa','Negro','Blanco','Verde'].map(color=>({id:color.toLowerCase(),color,condition:'SWAP A',priceGs:2035500}))},
    {id:'iphone-12-128',brand:'Apple',name:'iPhone 12',capacity:'128 GB',category:'celulares',photo:'apple',tag:'MÁS ECONÓMICO',budget:true,status:'consult',variants:['Blanco','Lila'].map(color=>({id:color.toLowerCase(),color,condition:'SWAP A',priceGs:1594475}))},
    {id:'iphone-11-128',brand:'Apple',name:'iPhone 11',capacity:'128 GB',category:'celulares',photo:'apple',tag:'SIN STOCK',budget:true,status:'out',variants:[{id:'white',color:'Blanco',condition:'Sin lacre',priceGs:1764100}]},
    {id:'iphone-11-64',brand:'Apple',name:'iPhone 11',capacity:'64 GB',category:'celulares',photo:'apple',tag:'MÁS ECONÓMICO',budget:true,status:'consult',variants:[{id:'white',color:'Blanco',condition:'Sin lacre',priceGs:1560550}]},
    // Modelos verificados en Samsung Newsroom. Precio y disponibilidad pendientes
    // de confirmación del negocio; no usar precios minoristas de otros países.
    {id:'galaxy-s26-ultra',brand:'Samsung',name:'Galaxy S26 Ultra',capacity:'Versión a consultar',category:'celulares',photo:'samsung',tag:'SAMSUNG',status:'consult',variants:[{id:'consult',color:'A consultar',condition:'',priceGs:null}]},
    {id:'galaxy-s26',brand:'Samsung',name:'Galaxy S26',capacity:'Versión a consultar',category:'celulares',photo:'samsung',tag:'SIN STOCK',status:'out',variants:[{id:'consult',color:'A consultar',condition:'',priceGs:null}]},
    {id:'galaxy-a57',brand:'Samsung',name:'Galaxy A57 5G',capacity:'Versión a consultar',category:'celulares',photo:'samsung',tag:'SAMSUNG',status:'consult',variants:[{id:'consult',color:'A consultar',condition:'',priceGs:null}]},
    {id:'galaxy-a37',brand:'Samsung',name:'Galaxy A37 5G',capacity:'Versión a consultar',category:'celulares',photo:'samsung',tag:'SAMSUNG',status:'consult',variants:[{id:'consult',color:'A consultar',condition:'',priceGs:null}]},
    {id:'playstation-5',brand:'PlayStation',name:'PlayStation 5',capacity:'Consola',category:'consolas',photo:'playstation',tag:'SIN STOCK',status:'out',variants:[]}
  ]
});
