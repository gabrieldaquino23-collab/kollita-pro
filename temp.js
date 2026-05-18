
const K = (() => {
'use strict';
const _e=document.createElement('div');
function esc(s){_e.textContent=String(s??'');return _e.innerHTML;}
const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);

const HIST_KEY='kollita_v4_hist';
const SHARED_KEY='kollita_custom_cats';
const PENDIENTES_KEY='kollita_pendientes';
const SYNC_CHANNEL='kollita_sync';

let syncChannel=null;
try{syncChannel=new BroadcastChannel(SYNC_CHANNEL);}catch(e){}

function notifySync(type,data){
  try{if(syncChannel)syncChannel.postMessage({type,data,time:Date.now()});}catch(e){}
  try{window.dispatchEvent(new CustomEvent('kollita_sync',{detail:{type,data}}));}catch(e){}
}

// â”€â”€ SUPABASE SYNC (DESCONECTADO) â”€â”€
// const SUPA_URL='https://yngeclqhqljnjxvqgbih.supabase.co/rest/v1/kollita_config';
// const SUPA_KEY='sb_publishable_KjmHILYWY4s40McEN5e-kA_QOE1izkI';
async function fetchCloud(){}
// â”€â”€ Solo localStorage â”€â”€
function lg(k,d){
  // if(cloudData&&cloudData[k]!==undefined)return cloudData[k];
  try{const r=localStorage.getItem(k);return r?JSON.parse(r):d;}catch(e){return d;}
}
function readHist(){return lg(HIST_KEY,[]);}
function saveHist(){try{localStorage.setItem(HIST_KEY,JSON.stringify(history));}catch(e){}}

// â”€â”€â”€ CONFIG â”€â”€â”€
const CFG={
  storeAddr:'Santa Cruz de la Sierra Â· Bolivia',
  branches:[
    {n:'3 PASOS',              tel:'59178501031'},
    {n:'VIRGEN DE COTOCA',     tel:'59169014533'},
    {n:'G77 AV. CAMBODROMO',   tel:'59176625470'},
    {n:'CUCHILLA',             tel:'59176380472'},
    {n:'KM8 DOBLE VÍA',        tel:'59169683746'},
    {n:'4TO ANILLO CANAL ISUTO',tel:'59162837160'},
    {n:'AV. PAURITO',          tel:'59178141268'}
  ],
  // 3% descuento SOLO en Coca Machuca, SOLO pagando EFECTIVO
  discPct:3,
  discMin:100, // descuento solo si total supera este monto

  machucaCats:[
    {id:'trad',name:'TRADICIONAL',emoji:'ðŸƒ',
     groups:[
       {price:14,label:'14Bs S/CafÃ©',items:['BICO','ESTEVIA BLANCA','ESTEVIA VERDE']},
       {price:15,label:'15Bs C/CafÃ©',items:['BICO NESCAFE','BLANCA NESCAFE','VERDE NESCAFE']},
       {price:25,label:'25Bs S/CafÃ©',items:['BICO','ESTEVIA BLANCA','ESTEVIA VERDE']},
       {price:25,label:'25Bs C/CafÃ©',items:['BICO NESCAFE','BLANCA NESCAFE','VERDE NESCAFE']}
     ]
    },
    {id:'esp',name:'ESPECIAL',emoji:'â­',
     groups:[
       {price:15,label:'15Bs S/CafÃ©',items:['YOGOBULL','REDBULL','YOGURT MORA','CHICLE','MARACUYA','BANANA','SANDIA','MONSTER','CAPUCCINO','YOGURT','CEDRON','FRUTILLA','ASIA','MENTA','MANGO','LIMON','CHIRIMOYA','NARANJA','CHOCOLATE']},
       {price:15,label:'15Bs C/CafÃ©',items:['YOGOBULL C/C','REDBULL C/C','YOGURT MORA C/C','CHICLE C/C','MARACUYA C/C','BANANA C/C','SANDIA C/C','MONSTER C/C','CAPUCCINO C/C','YOGURT C/C','CEDRON C/C','FRUTILLA C/C','ASIA C/C','MENTA C/C','MANGO C/C','LIMON C/C','CHIRIMOYA C/C','NARANJA C/C','CHOCOLATE C/C']},
       {price:25,label:'25Bs S/CafÃ©',items:['YOGOBULL','REDBULL','YOGURT MORA','CHICLE','MARACUYA','BANANA','SANDIA','MONSTER','CAPUCCINO','YOGURT','CEDRON','FRUTILLA','ASIA','MENTA','MANGO','LIMON','CHIRIMOYA','NARANJA','CHOCOLATE']},
       {price:25,label:'25Bs C/CafÃ©',items:['YOGOBULL C/C','REDBULL C/C','YOGURT MORA C/C','CHICLE C/C','MARACUYA C/C','BANANA C/C','SANDIA C/C','MONSTER C/C','CAPUCCINO C/C','YOGURT C/C','CEDRON C/C','FRUTILLA C/C','ASIA C/C','MENTA C/C','MANGO C/C','LIMON C/C','CHIRIMOYA C/C','NARANJA C/C','CHOCOLATE C/C']}
     ]
    },
    {id:'prem',name:'PREMIUM',emoji:'ðŸ’Ž',
     groups:[
       {price:15,label:'15Bs S/CafÃ©',items:['3 POLVOS','SUEGRA VENENOSA','SUPER DOSIS','PARALIZADOR','QUITA HEMBRA','7 SABORES','TORCEDURA SEGURA','ZOMBIE','QUITA MACHO','MUTAZO','TRALALERO']},
       {price:15,label:'15Bs C/CafÃ©',items:['3 POLVOS C/C','SUEGRA VENENOSA C/C','SUPER DOSIS C/C','PARALIZADOR C/C','QUITA HEMBRA C/C','7 SABORES C/C','TORCEDURA SEGURA C/C','ZOMBIE C/C','QUITA MACHO C/C','MUTAZO C/C','TRALALERO C/C']},
       {price:25,label:'25Bs S/CafÃ©',items:['3 POLVOS','SUEGRA VENENOSA','SUPER DOSIS','PARALIZADOR','QUITA HEMBRA','7 SABORES','TORCEDURA SEGURA','ZOMBIE','QUITA MACHO','MUTAZO','TRALALERO']},
       {price:25,label:'25Bs C/CafÃ©',items:['3 POLVOS C/C','SUEGRA VENENOSA C/C','SUPER DOSIS C/C','PARALIZADOR C/C','QUITA HEMBRA C/C','7 SABORES C/C','TORCEDURA SEGURA C/C','ZOMBIE C/C','QUITA MACHO C/C','MUTAZO C/C','TRALALERO C/C']}
     ]
    },
    {id:'despunt',name:'DESPUNTADA',emoji:'âœ‚ï¸',
     groups:[
       {price:40,label:'40Bs TRAD.',items:['BICO','ESTEVIA BLANCA','ESTEVIA VERDE']},
       {price:45,label:'45Bs ESP.',items:['YOGOBULL','REDBULL','YOGURT MORA','CHICLE','MARACUYA','BANANA','SANDIA','MONSTER','CAPUCCINO','YOGURT','CEDRON','FRUTILLA','ASIA','MENTA','MANGO','LIMON','CHIRIMOYA','NARANJA','CHOCOLATE']},
       {price:50,label:'50Bs PREM.',items:['3 POLVOS','SUEGRA VENENOSA','SUPER DOSIS','PARALIZADOR','QUITA HEMBRA','7 SABORES','TORCEDURA SEGURA','ZOMBIE','QUITA MACHO','MUTAZO','TRALALERO']}
     ]
    },
    {id:'despal',name:'DESPALADA',emoji:'ðŸŒ¿',
     groups:[
       {price:50,label:'50Bs TRAD.',items:['BICO','ESTEVIA BLANCA','ESTEVIA VERDE']},
       {price:55,label:'55Bs ESP.',items:['YOGOBULL','REDBULL','YOGURT MORA','CHICLE','MARACUYA','BANANA','SANDIA','MONSTER','CAPUCCINO','YOGURT','CEDRON','FRUTILLA','ASIA','MENTA','MANGO','LIMON','CHIRIMOYA','NARANJA','CHOCOLATE']},
       {price:60,label:'60Bs PREM.',items:['3 POLVOS','SUEGRA VENENOSA','SUPER DOSIS','PARALIZADOR','QUITA HEMBRA','7 SABORES','TORCEDURA SEGURA','ZOMBIE','QUITA MACHO','MUTAZO','TRALALERO']}
     ]
    }
  ]
};

const BEB_CATS=[
  {id:'all',label:'ðŸ” Todo'},
  {id:'gaseosas',label:'ðŸ¥¤ Gaseosas'},
  {id:'aguas',label:'ðŸ’§ Aguas'},
  {id:'energizantes',label:'âš¡ Energizantes'},
  {id:'cervezas',label:'ðŸº Cervezas'},
  {id:'vinos',label:'ðŸ· Vinos'},
  {id:'rones',label:'ðŸ¥ƒ Rones'},
  {id:'licores',label:'ðŸ¸ Licores'},
  {id:'singani',label:'ðŸŒ¿ Singani'},
  {id:'varios',label:'ðŸ›’ Varios'},
  {id:'custom',label:'â­ Mis Productos'}
];
const BEB_LABELS={gaseosas:'ðŸ¥¤ Gaseosas & Jugos',aguas:'ðŸ’§ Aguas',energizantes:'âš¡ Energizantes',cervezas:'ðŸº Cervezas',vinos:'ðŸ· Vinos',rones:'ðŸ¥ƒ Rones & Aguardientes',licores:'ðŸ¸ Licores & Spirits',singani:'ðŸŒ¿ Singani',varios:'ðŸ›’ Varios'};

const BEBIDAS=[
  {id:1,cat:'gaseosas',e:'ðŸ¥¤',n:'Coca Cola 3 Lt',p:20},
  {id:2,cat:'gaseosas',e:'ðŸ¥¤',n:'Coca Cola 2 Lt',p:14},
  {id:3,cat:'gaseosas',e:'ðŸ¥¤',n:'Coca Cola 1.5 Lt',p:10},
  {id:4,cat:'gaseosas',e:'ðŸ¥¤',n:'Coca Cola Personal',p:6},
  {id:5,cat:'gaseosas',e:'ðŸ¥¤',n:'Coca Cola PequeÃ±a',p:4},
  {id:6,cat:'gaseosas',e:'ðŸ¥¤',n:'Coca Cola Retornable 2.5 Lt',p:12},
  {id:7,cat:'gaseosas',e:'ðŸŸ ',n:'Fanta / Sprite 3 Lt',p:20},
  {id:8,cat:'gaseosas',e:'ðŸŸ ',n:'Fanta / Sprite 2 Lt',p:14},
  {id:9,cat:'gaseosas',e:'ðŸŸ ',n:'Fanta / Sprite Personal',p:6},
  {id:10,cat:'gaseosas',e:'ðŸŸ ',n:'Fanta / Sprite PequeÃ±a',p:4},
  {id:11,cat:'gaseosas',e:'ðŸŽ',n:'Simba / Manzana / PiÃ±a / Durazno',p:11},
  {id:12,cat:'gaseosas',e:'ðŸ‹',n:'CabaÃ±a Limonada 2 Lt',p:14},
  {id:13,cat:'gaseosas',e:'ðŸ‹',n:'CabaÃ±a Limonada 1 Lt',p:10},
  {id:14,cat:'gaseosas',e:'ðŸ‹',n:'CabaÃ±a Limonada Personal',p:6},
  {id:15,cat:'gaseosas',e:'ðŸ«',n:'Del Valle 3 Lt',p:20},
  {id:16,cat:'gaseosas',e:'ðŸ«',n:'Del Valle 2 Lt',p:14},
  {id:17,cat:'gaseosas',e:'ðŸ«',n:'Del Valle Personal',p:6},
  {id:18,cat:'gaseosas',e:'ðŸ«',n:'Del Valle PequeÃ±a',p:4},
  {id:19,cat:'gaseosas',e:'ðŸ',n:'Aquario Pera/Pomelo 3 Lt',p:20},
  {id:20,cat:'gaseosas',e:'ðŸ',n:'Aquario Pera/Pomelo 2 Lt',p:14},
  {id:21,cat:'gaseosas',e:'ðŸ',n:'Aquario Personal',p:6},
  {id:22,cat:'gaseosas',e:'ðŸ',n:'Aquario PequeÃ±a',p:4},
  {id:23,cat:'gaseosas',e:'ðŸŸ£',n:'Pepsi 3 Lt',p:15},
  {id:24,cat:'gaseosas',e:'ðŸŸ£',n:'Pepsi 2 Lt',p:12},
  {id:25,cat:'gaseosas',e:'ðŸŸ£',n:'Pepsi 1 Lt',p:7},
  {id:26,cat:'gaseosas',e:'ðŸŸ£',n:'Pepsi PequeÃ±a 250 ml',p:3},
  {id:27,cat:'gaseosas',e:'ðŸ¥¤',n:'Cuba Libre 3 Lt',p:40},
  {id:28,cat:'gaseosas',e:'ðŸ¥¤',n:'Cuba Libre 2 Lt',p:30},
  {id:29,cat:'gaseosas',e:'ðŸ¥¤',n:'Cuba Libre 1 Lt',p:15},
  {id:30,cat:'gaseosas',e:'ðŸ¥¤',n:'Cuba Libre Personal',p:10},
  {id:31,cat:'gaseosas',e:'ðŸ¥¤',n:'Cuba Libre PequeÃ±a',p:5},
  {id:32,cat:'gaseosas',e:'ðŸ¥¤',n:'Cuba Libre Lata',p:10},
  {id:50,cat:'aguas',e:'ðŸ’§',n:'Agua Vital 3 Lt',p:10},
  {id:51,cat:'aguas',e:'ðŸ’§',n:'Agua con Gas / sin Gas 2 Lt',p:8},
  {id:52,cat:'aguas',e:'ðŸ’§',n:'Agua 1 Lt',p:6},
  {id:53,cat:'aguas',e:'ðŸ’§',n:'Agua Personal 600 ml',p:5},
  {id:54,cat:'aguas',e:'ðŸ’ª',n:'Activade 1 Lt',p:10},
  {id:60,cat:'energizantes',e:'âš¡',n:'Volt 350 ml',p:5},
  {id:61,cat:'energizantes',e:'âš¡',n:'Volt Lata 473 ml',p:12},
  {id:62,cat:'energizantes',e:'âš«',n:'Black 330 ml',p:8},
  {id:63,cat:'energizantes',e:'ðŸŒ€',n:'CiclÃ³n Botella 500 ml',p:8},
  {id:64,cat:'energizantes',e:'ðŸŒ€',n:'CiclÃ³n Botella 350 ml',p:6},
  {id:65,cat:'energizantes',e:'ðŸŒ€',n:'CiclÃ³n Lata 473 ml',p:14},
  {id:66,cat:'energizantes',e:'ðŸŒ€',n:'CiclÃ³n Lata 269 ml',p:10},
  {id:67,cat:'energizantes',e:'ðŸŸ¢',n:'Monster (Negro/Blanco/Celeste)',p:20},
  {id:68,cat:'energizantes',e:'ðŸ‚',n:'Red Bull',p:18},
  {id:69,cat:'energizantes',e:'ðŸŒ¿',n:'Sante 500 ml',p:8},
  {id:70,cat:'energizantes',e:'ðŸŒ¿',n:'Sante 1 Lt',p:12},
  {id:71,cat:'energizantes',e:'ðŸŒ¾',n:'Malta',p:7},
  {id:72,cat:'energizantes',e:'ðŸŒ¾',n:'MaltÃ­n',p:8},
  {id:73,cat:'energizantes',e:'ðŸŒµ',n:'Aloe Vera',p:10},
  {id:74,cat:'energizantes',e:'â­',n:'Rockstar',p:6},
  {id:75,cat:'energizantes',e:'ðŸ’ª',n:'Power Rojo/Azul 1 Lt',p:12},
  {id:76,cat:'energizantes',e:'ðŸ§‰',n:'Yerba Mate Black',p:40},
  {id:77,cat:'energizantes',e:'ðŸ’Š',n:'Suero Surtido',p:15},
  {id:78,cat:'energizantes',e:'â˜•',n:'NescafÃ© en Sachet',p:2},
  {id:80,cat:'cervezas',e:'ðŸº',n:'PaceÃ±a Palito 269 cc',p:8},
  {id:81,cat:'cervezas',e:'ðŸº',n:'PaceÃ±a Lata 354 cc',p:10},
  {id:82,cat:'cervezas',e:'ðŸº',n:'PaceÃ±a Lata Grande',p:12},
  {id:83,cat:'cervezas',e:'ðŸº',n:'PaceÃ±a Botella PequeÃ±a Ret.',p:6},
  {id:84,cat:'cervezas',e:'ðŸº',n:'PaceÃ±a Botella 350 ml',p:10},
  {id:85,cat:'cervezas',e:'ðŸ“¦',n:'Pack PaceÃ±a Palito x24',p:190,pack:'Pack x24'},
  {id:86,cat:'cervezas',e:'ðŸ“¦',n:'Pack PaceÃ±a Lata x24',p:220,pack:'Pack x24'},
  {id:87,cat:'cervezas',e:'ðŸº',n:'Quilmes',p:12},
  {id:88,cat:'cervezas',e:'ðŸ“¦',n:'Pack Quilmes x24',p:250,pack:'Pack x24'},
  {id:89,cat:'cervezas',e:'ðŸº',n:'Conti Lata 269 cc',p:7},
  {id:90,cat:'cervezas',e:'ðŸº',n:'Conti Lata Gordita 350 cc',p:8},
  {id:91,cat:'cervezas',e:'ðŸº',n:'Conti Lata 410 cc',p:10},
  {id:92,cat:'cervezas',e:'ðŸ“¦',n:'Pack Conti 269 x24',p:160,pack:'Pack x24'},
  {id:93,cat:'cervezas',e:'ðŸº',n:'Huari Lata 269 cc',p:9},
  {id:94,cat:'cervezas',e:'ðŸº',n:'Huari Miel Lata 269 cc',p:9},
  {id:95,cat:'cervezas',e:'ðŸº',n:'Huari Miel Botellita',p:15},
  {id:96,cat:'cervezas',e:'ðŸ“¦',n:'Pack Huari x24',p:210,pack:'Pack x24'},
  {id:97,cat:'cervezas',e:'ðŸº',n:'Corona Botellita 330 ml',p:15},
  {id:98,cat:'cervezas',e:'ðŸ“¦',n:'Pack Corona x24',p:340,pack:'Pack x24'},
  {id:99,cat:'cervezas',e:'ðŸº',n:'Ducal Lata 269 cc',p:7},
  {id:100,cat:'cervezas',e:'ðŸº',n:'Ducal Lata 310 cc',p:9},
  {id:200,cat:'cervezas',e:'ðŸ“¦',n:'Pack Ducal x24',p:150,pack:'Pack x24'},
  {id:201,cat:'cervezas',e:'ðŸº',n:'Golden Skol 410 cc',p:10},
  {id:202,cat:'cervezas',e:'ðŸº',n:'Golden Skol 269 cc',p:7},
  {id:203,cat:'cervezas',e:'ðŸº',n:'Amstel 269 cc',p:7},
  {id:204,cat:'cervezas',e:'ðŸº',n:'Amstel 473 cc',p:10},
  {id:205,cat:'cervezas',e:'ðŸº',n:'Ice 51 Surtida',p:15},
  {id:206,cat:'cervezas',e:'ðŸº',n:'Cerveza Burguesa 269 cc',p:8},
  {id:207,cat:'cervezas',e:'ðŸº',n:'Budweiser 269 cc',p:8},
  {id:208,cat:'cervezas',e:'ðŸº',n:'Samba Palito 269 ml',p:6},
  {id:300,cat:'vinos',e:'ðŸ·',n:'Vino Kolberg Tinto/Blanco',p:30},
  {id:301,cat:'vinos',e:'ðŸ·',n:'Vino Campos de Solana',p:30},
  {id:302,cat:'vinos',e:'ðŸ·',n:'Vino TerruÃ±o Tinto/Blanco',p:30},
  {id:303,cat:'vinos',e:'ðŸ·',n:'Vino ViÃ±a de Balbo',p:30},
  {id:304,cat:'vinos',e:'ðŸ·',n:'Vino Toro Viejo Botella',p:40},
  {id:305,cat:'vinos',e:'ðŸ“¦',n:'Vino Toro Viejo CartÃ³n',p:70,pack:'CartÃ³n'},
  {id:400,cat:'rones',e:'ðŸ¥ƒ',n:'Flor de CaÃ±a 1 Lt',p:100},
  {id:401,cat:'rones',e:'ðŸ¥ƒ',n:'Flor de CaÃ±a 1.75 Lt',p:150},
  {id:402,cat:'rones',e:'ðŸ¥ƒ',n:'Ron Abuelo 1 Lt',p:120},
  {id:403,cat:'rones',e:'ðŸ¥ƒ',n:'Ron Abuelo 1.75 Lt',p:190},
  {id:404,cat:'rones',e:'ðŸ¥ƒ',n:'Havana Club 7 AÃ±os',p:180},
  {id:405,cat:'rones',e:'ðŸ¥ƒ',n:'Havana Club 3 AÃ±os',p:130},
  {id:406,cat:'rones',e:'ðŸ¥ƒ',n:'Havana Club Especial',p:140},
  {id:407,cat:'rones',e:'ðŸ¥ƒ',n:'Havana Club Reserva',p:150},
  {id:408,cat:'rones',e:'ðŸ¥ƒ',n:'Ron PampeÃ±o',p:25},
  {id:409,cat:'rones',e:'ðŸ¥ƒ',n:'Bacardi LimÃ³n Surtido',p:140},
  {id:410,cat:'rones',e:'ðŸ¥ƒ',n:'Ron Kayana',p:50},
  {id:411,cat:'rones',e:'ðŸ¥ƒ',n:'Ron 37 Lengua',p:90},
  {id:500,cat:'licores',e:'ðŸ¸',n:'Fernet Branca 750 ml',p:110},
  {id:501,cat:'licores',e:'ðŸ¸',n:'Fernet Branca 1 Lt',p:130},
  {id:502,cat:'licores',e:'ðŸ¸',n:'Fernet Menta 750 ml',p:100},
  {id:503,cat:'licores',e:'ðŸ¸',n:'Fernet Bhuero Negro',p:100},
  {id:504,cat:'licores',e:'ðŸ¸',n:'Vodka Skyy Surtido',p:130},
  {id:505,cat:'licores',e:'ðŸ¸',n:'Vodka LimÃ³n',p:25},
  {id:506,cat:'licores',e:'ðŸŒµ',n:'Tequila Jose Cuervo 750 ml',p:150},
  {id:507,cat:'licores',e:'ðŸŒµ',n:'Tequila Jose Cuervo 375 ml',p:90},
  {id:508,cat:'licores',e:'ðŸŒµ',n:'Tequila Olmeca',p:175},
  {id:509,cat:'licores',e:'ðŸŒµ',n:'Tequila Jarana',p:190},
  {id:510,cat:'licores',e:'ðŸ¥ƒ',n:'Whisky Grants',p:140},
  {id:511,cat:'licores',e:'ðŸ¥ƒ',n:'Johnnie Walker Rojo',p:170},
  {id:512,cat:'licores',e:'ðŸ¥ƒ',n:'Johnnie Walker Negro',p:340},
  {id:513,cat:'licores',e:'ðŸ¥ƒ',n:'Old Par',p:340},
  {id:514,cat:'licores',e:'ðŸ¥ƒ',n:'Chivas Regal',p:380},
  {id:515,cat:'licores',e:'ðŸ¸',n:'Beefeater 1Â¼ Lt',p:250},
  {id:516,cat:'licores',e:'ðŸ¸',n:'Beefeater 750 ml',p:200},
  {id:517,cat:'licores',e:'ðŸ¸',n:'Tanqueray 1 Lt',p:300},
  {id:518,cat:'licores',e:'ðŸ¸',n:'Tanqueray 750 ml',p:260},
  {id:519,cat:'licores',e:'ðŸ¸',n:'Amarula 750 ml',p:160},
  {id:520,cat:'licores',e:'ðŸ¸',n:'Belho Barreiro',p:60},
  {id:521,cat:'licores',e:'ðŸ¸',n:'Agua Ardiente AntioqueÃ±o',p:170},
  {id:522,cat:'licores',e:'ðŸ¸',n:'Four Loko Grande',p:45},
  {id:523,cat:'licores',e:'ðŸ¸',n:'Four Loko Mediano',p:35},
  {id:524,cat:'licores',e:'ðŸ¸',n:'3 Plumas Seco Chico',p:12},
  {id:525,cat:'licores',e:'ðŸ¸',n:'3 Plumas Seco 1 Lt',p:50},
  {id:526,cat:'licores',e:'ðŸ¸',n:'3 Plumas Menta Chico',p:12},
  {id:527,cat:'licores',e:'ðŸ¸',n:'3 Plumas Menta 1 Lt',p:50},
  {id:528,cat:'licores',e:'â˜•',n:'CafÃ© CoÃ±ac Chico',p:12},
  {id:529,cat:'licores',e:'â˜•',n:'CafÃ© CoÃ±ac 1 Lt',p:50},
  {id:530,cat:'licores',e:'ðŸ¸',n:'Doble V Chico',p:12},
  {id:531,cat:'licores',e:'ðŸ¸',n:'Doble V 1 Lt',p:50},
  {id:600,cat:'singani',e:'ðŸŒ¿',n:'Singani 3 Estrellas Roja',p:35},
  {id:601,cat:'singani',e:'ðŸŒ¿',n:'Singani 3 Estrellas Negra',p:35},
  {id:602,cat:'singani',e:'ðŸŒ¿',n:'Singani Casa Real Rojo',p:60},
  {id:603,cat:'singani',e:'ðŸŒ¿',n:'Singani Casa Real Negro',p:95},
  {id:604,cat:'singani',e:'ðŸŒ¿',n:'Singani Casa Real Azul',p:40},
  {id:605,cat:'singani',e:'ðŸŒ¿',n:'Chanceler',p:65},
  {id:606,cat:'singani',e:'ðŸŒ¿',n:'Old Red',p:70},
  {id:607,cat:'singani',e:'ðŸŒ¿',n:'Black Stone',p:60},
  {id:608,cat:'singani',e:'ðŸŒ¿',n:'Singani Insignia Negro',p:120},
  {id:609,cat:'singani',e:'ðŸŒ¿',n:'Singani Insignia Rojo',p:110},
  {id:700,cat:'varios',e:'ðŸš¬',n:'Cigarro Bohem',p:15},
  {id:701,cat:'varios',e:'ðŸš¬',n:'Cigarro Hills',p:8},
  {id:702,cat:'varios',e:'ðŸš¬',n:'Cigarro Changer',p:21},
  {id:703,cat:'varios',e:'ðŸ¬',n:'Chicle Grosso',p:1},
  {id:704,cat:'varios',e:'ðŸ¬',n:'Chicle Beldent Negro/Verde',p:5},
  {id:705,cat:'varios',e:'ðŸ¬',n:'Chicle Cloret',p:1},
  {id:706,cat:'varios',e:'ðŸ§»',n:'Papel HigiÃ©nico 6 Rollos',p:12},
  {id:707,cat:'varios',e:'ðŸ§»',n:'Papel HigiÃ©nico 1 Rollo',p:2},
  {id:708,cat:'varios',e:'ðŸ’Š',n:'Preservativo Pantera',p:8},
  {id:709,cat:'varios',e:'ðŸ’Š',n:'Alikal',p:8},
  {id:710,cat:'varios',e:'ðŸ’Š',n:'Digestan',p:5},
  {id:711,cat:'varios',e:'ðŸ’Š',n:'Ressaka',p:6},
  {id:712,cat:'varios',e:'ðŸ”¥',n:'Encendedor Chispa',p:2},
  {id:713,cat:'varios',e:'ðŸ”¥',n:'Encendedor PresiÃ³n',p:3},
  {id:714,cat:'varios',e:'ðŸ”¥',n:'Encendedor Rompeviento',p:4}
];

// â”€â”€â”€ ESTADO â”€â”€â”€
let history=readHist();
let cart=[];
let branch=null;
let adminCfg=null; // config from admin panel (prices + images)
let payment='efectivo';
let pendingWA=null;
let store='machuca';
let mCat=null;
let mGroup=null;
let bCat='all';
let bSearch='';

function rd(v){
  // Round discount to nearest Bs: 0.50+ rounds up, below doesn't apply
  return Math.round(v);
}
function rdDisc(v){
  // Apply discount only if rounded result >= 1 Bs (decimal .50 rounds up)
  const rounded=Math.round(v);
  return rounded>=1?rounded:0;
}

// TOAST
let toastT=null;
function toast(msg){
  const t=$('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),1700);
}

// â•â• SUCURSALES â•â•
function renderBranches(){
  const c=$('branch-list');c.innerHTML='';
  CFG.branches.forEach(b=>{
    const btn=document.createElement('button');
    btn.className='br-btn';
    btn.innerHTML='<span class="br-dot"></span><span>'+esc(b.n)+'</span><i class="fa-solid fa-chevron-right"></i>';
    btn.addEventListener('click',async ()=>{
      branch=b;
      
      // Mostrar pantalla de carga interactiva
      c.innerHTML='<div style="text-align:center;padding:30px;color:#aaa"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;color:var(--red);margin-bottom:15px"></i><br><b style="font-size:14px;color:#fff">Cargando sucursal...</b></div>';
      
      // Esperar sincronizaciÃ³n de nube MÃXIMO 2.5 segundos para no dejar al usuario esperando
      if(window._cloudPromise) {
        await Promise.race([window._cloudPromise, new Promise(r=>setTimeout(r, 2500))]);
      }
      
      // Diferir el render pesado para que no se congele 
      setTimeout(() => {
        localStorage.setItem('kol_movil_sesion', JSON.stringify({branch:b.n, branchTel:b.tel, store:'machuca', ts:Date.now()}));
        $('scr-branch').style.display='none';
        $('hdr-branch').textContent=b.n;
        $('rc-addr').textContent=CFG.storeAddr;
        renderMachucaCats();
        renderBebCats();
        setStore('machuca');
      }, 50);
    });
    c.appendChild(btn);
  });
}

// â•â• STORE TOGGLE â•â•
function setStore(s){
  store=s;
  $('tab-machuca').classList.toggle('on',s==='machuca');
  $('tab-bolo').classList.toggle('on',s==='bolo');
  $('tab-bebidas').classList.toggle('on',s==='bebidas');
  $('zone-machuca').style.display=s==='machuca'?'block':'none';
  $('zone-bolo').style.display=s==='bolo'?'block':'none';
  $('zone-bebidas').style.display=s==='bebidas'?'block':'none';
  $('scroll-area').scrollTo({top:0});
  if(s==='bolo') boloRenderSabores();
}

// â•â• MACHUCA â•â•
function renderMachucaCats(){
  const nav=$('mach-cats');nav.innerHTML='';
  CFG.machucaCats.forEach((cat,i)=>{
    const btn=document.createElement('button');
    btn.className='mcat-btn'+(i===0?' on':'');
    btn.textContent=cat.emoji+' '+cat.name;
    btn.addEventListener('click',()=>{
      $$('.mcat-btn').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      mCat=cat;
      renderMachucaPrices(cat);
    });
    nav.appendChild(btn);
  });
  mCat=CFG.machucaCats[0];
  renderMachucaPrices(mCat);
}

function renderMachucaPrices(cat){
  const nav=$('mach-prices');nav.innerHTML='';
  cat.groups.forEach((g,i)=>{
    const btn=document.createElement('button');
    btn.className='mprice-btn'+(i===0?' on':'');
    btn.textContent=g.label;
    btn.addEventListener('click',()=>{
      $$('.mprice-btn').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      mGroup=g;
      renderMachucaList();
    });
    nav.appendChild(btn);
  });
  mGroup=cat.groups[0];
  renderMachucaList();
}

function renderMachucaList(){
  if(store!=='machuca')return;
  const list=$('mach-list');list.innerHTML='';
  if(!mGroup)return;
  mGroup.items.forEach((name,i)=>{
    const row=document.createElement('div');
    row.className='prod-row';
    row.style.animationDelay=(i*.02)+'s';
    const uid='m_'+i;
    const catEmoji=mCat?mCat.emoji:'ðŸƒ';
    row.innerHTML=
      '<div class="prod-emoji">'+catEmoji+'</div>'+
      '<div class="prod-name">'+esc(name)+'</div>'+
      '<div class="prod-ctrl">'+
        '<input type="number" id="'+uid+'" class="prod-input" placeholder="1" min="1" inputmode="numeric">'+
        '<button class="prod-add">+</button>'+
      '</div>';
    row.querySelector('.prod-add').addEventListener('click',()=>{
      const inp=$(uid);
      const qty=parseInt(inp.value)||1;
      const key=name+'|'+mGroup.label;
      const ex=cart.find(it=>it._key===key);
      if(ex){
        ex.c+=qty;
      }else{
        // detect s/c or c/c from group label
        const _lbl=(mGroup.label||'').toLowerCase();
        const _cafe=_lbl.includes('c/caf')||_lbl.includes('c/c')&&!_lbl.includes('s/c')?'C/C':_lbl.includes('s/caf')||_lbl.includes('s/c')?'S/C':'';
        cart.push({_key:key,n:name,p:mGroup.price,e:catEmoji,c:qty,cat:'machuca',cafe:_cafe,glabel:mGroup.label});
      }
      inp.value='';
      updateBadge();recalc();
      toast('+'+qty+' '+name);
    });
    list.appendChild(row);
  });
}

// â•â• BEBIDAS â•â•
// â”€â”€â”€ Leer categorÃ­as personalizadas del Admin â”€â”€â”€
function _loadCustomCats(){return lg(SHARED_KEY,{});}
function _getBranchId(){return branch?branch.n:'';}  // match by branch name

function renderBebCats(){
  const nav=$('beb-cats');nav.innerHTML='';
  BEB_CATS.forEach((cat,i)=>{
    const btn=document.createElement('button');
    btn.className='bcat-btn'+(i===0?' on':'');
    btn.textContent=cat.label;
    btn.addEventListener('click',()=>{
      $$('.bcat-btn').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      bCat=cat.id;
      renderBebContent();
      $('scroll-area').scrollTo({top:0,behavior:'smooth'});
    });
    nav.appendChild(btn);
  });
  let _bebDebounce;
  $('beb-search').addEventListener('input',e=>{
    clearTimeout(_bebDebounce);
    _bebDebounce=setTimeout(()=>{
      bSearch=e.target.value.trim();
      renderBebContent();
    },300);
  });
  
  // Renderizar contenido por defecto ("Todo") al inicializar la pestaÃ±a
  bCat = 'all';
  renderBebContent();
}

function renderBebContent(){
  if(store!=='bebidas')return;
  const cont=$('beb-content');cont.innerHTML='';
  const cats=bCat==='all'?BEB_CATS.filter(c=>c.id!=='all').map(c=>c.id):[bCat];
  let found=false;
  cats.forEach(catId=>{
    let items=BEBIDAS.filter(p=>p.cat===catId);
    if(bSearch)items=items.filter(p=>p.n.toLowerCase().includes(bSearch.toLowerCase()));
    if(!items.length)return;
    found=true;
    const sec=document.createElement('div');
    sec.className='beb-section';
    const hdr=document.createElement('div');
    hdr.className='beb-sec-hdr';
    hdr.innerHTML='<span>'+esc(BEB_LABELS[catId]||catId)+'</span>';
    const grid=document.createElement('div');
    grid.className='beb-grid';
    items.forEach(p=>{
      // Get price/image overrides from admin config for this branch
      const branchProds=(()=>{
        if(!adminCfg||!branch)return{};
        const br=adminCfg.branches?.find(b=>b.name===branch.n);
        const map={};(br?.products||[]).forEach(x=>{map[x.id]=x;});return map;
      })();
      const ov=branchProds[p.id]||{};
      const price=ov.p??p.p;
      const img=ov.img||'';
      const productName=ov.n||p.n;
      const inCart=cart.find(x=>x._key==='b_'+p.id);
      const qty=inCart?inCart.c:0;
      const card=document.createElement('div');
      card.className='beb-card'+(qty>0?' in-cart':'');
      card.id='bc_'+p.id;
      card.innerHTML=
        '<div class="beb-qty">'+qty+'</div>'+
        '<div class="beb-img">'+(img?'<img src="'+img+'" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px">':'')+'<span class="beb-emoji-big">'+p.e+'</span></div>'+
        '<div class="beb-name">'+esc(productName)+'</div>'+
        (p.pack?'<div class="beb-pack">'+esc(ov.pack||p.pack)+'</div>':'')+
        '<div class="beb-footer">'+
          '<div class="beb-price"><small>Bs </small>'+price+'</div>'+
          '<div class="beb-add-btn">+</div>'+
        '</div>';
      card.addEventListener('click',()=>{
        const key='b_'+p.id;
        const ex=cart.find(x=>x._key===key);
        if(ex)ex.c++;else cart.push({_key:key,n:productName,p:price,e:p.e,c:1,cat:'bebida'});
        updateBadge();recalc();
        const nc=cart.find(x=>x._key===key);
        if(nc){
          card.classList.add('in-cart');
          const qb=card.querySelector('.beb-qty');
          if(qb){qb.textContent=nc.c;qb.style.display='flex';}
        }
        toast('+1 '+productName.split(' ').slice(0,3).join(' '));
      });
      grid.appendChild(card);
    });
    sec.appendChild(hdr);
    sec.appendChild(grid);
    cont.appendChild(sec);
  });
  // â”€â”€ CategorÃ­as personalizadas del Admin â”€â”€
  if(bCat==='all'||bCat==='custom'){
    const shared=_loadCustomCats();
    const branchCats=shared[_getBranchId()]||[];
    branchCats.forEach(cat=>{
      let prods=(cat.products||[]).filter(p=>p.active!==false);
      if(bSearch) prods=prods.filter(p=>p.n.toLowerCase().includes(bSearch.toLowerCase()));
      if(!prods.length)return;
      found=true;
      const sec=document.createElement('div');
      sec.className='beb-section';
      const hdr=document.createElement('div');
      hdr.className='beb-sec-hdr';
      hdr.innerHTML='<span>'+esc((cat.emoji||'ðŸ·ï¸')+' '+cat.name)+'</span>';
      const grid=document.createElement('div');
      grid.className='beb-grid';
      prods.forEach(p=>{
        const key='custom_'+p.id;
        const inCart=cart.find(x=>x._key===key);
        const qty=inCart?inCart.c:0;
        const card=document.createElement('div');
        card.className='beb-card'+(qty>0?' in-cart':'');
        card.id='bc_custom_'+p.id;
        card.innerHTML=
          '<div class="beb-qty">'+qty+'</div>'+
          '<div class="beb-img">'+(p.img?`<img src="${p.img}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:9px">`:'')+'<span class="beb-emoji-big">'+esc(p.e||'ðŸ“¦')+'</span></div>'+
          '<div class="beb-name">'+esc(p.n)+'</div>'+
          (p.pack?'<div class="beb-pack">'+esc(p.pack)+'</div>':'')+
          '<div class="beb-footer">'+
            '<div class="beb-price"><small>Bs </small>'+p.p+'</div>'+
            '<div class="beb-add-btn">+</div>'+
          '</div>';
        card.addEventListener('click',()=>{
          const ex=cart.find(x=>x._key===key);
          if(ex)ex.c++;else cart.push({_key:key,n:p.n,p:p.p,e:p.e||'ðŸ“¦',c:1,cat:'bebida'});
          updateBadge();recalc();
          const nc=cart.find(x=>x._key===key);
          if(nc){card.classList.add('in-cart');const qb=card.querySelector('.beb-qty');if(qb){qb.textContent=nc.c;qb.style.display='flex';}}
          toast('+1 '+p.n.split(' ').slice(0,3).join(' '));
        });
        grid.appendChild(card);
      });
      sec.appendChild(hdr);sec.appendChild(grid);
      cont.appendChild(sec);
    });
  }

  if(!found){
    cont.innerHTML='<div style="text-align:center;padding:48px 20px;color:#aaa"><div style="font-size:40px;margin-bottom:10px">ðŸ”</div><div style="font-size:14px;font-weight:600">Sin resultados</div></div>';
  }
}

// â•â• BADGE â•â•
function updateBadge(){
  $('fab-badge').textContent=cart.reduce((s,i)=>s+i.c,0);
}

// â•â• RECALC â•â•
// REGLA: descuento 3% SOLO sobre subtotal de items cat==='machuca', SOLO si payment==='efectivo'
// Bebidas: NUNCA descuento, sin importar quÃ© mÃ¡s haya en el carrito
function recalc(){
  // Ordenar: machuca primero, luego bebidas
  cart.sort((a,b)=>{
    const aMach=a.cat==='machuca', bMach=b.cat==='machuca';
    if(aMach!==bMach) return aMach?-1:1;
    if(aMach&&bMach){
      if(a.p!==b.p) return a.p-b.p;
      const cv=t=>t==='S/C'?0:t==='C/C'?1:2;
      if(a.cafe!==b.cafe) return cv(a.cafe)-cv(b.cafe);
      return a.n.localeCompare(b.n);
    }
    const CO={gaseosas:0,aguas:1,energizantes:2,cervezas:3,vinos:4,rones:5,licores:6,singani:7,varios:8};
    if(a.cat!==b.cat) return (CO[a.cat]??9)-(CO[b.cat]??9);
    return a.p-b.p;
  });
  const rc=$('rc-items');
  let sub=0,html='',lastCat=null;
  cart.forEach((it,i)=>{
    const catLabel=it.cat==='machuca'?'COCA MACHUCA':'BEBIDAS';
    if(it.cat!==lastCat){html+='<div class="rc-group-hdr">'+catLabel+'</div>';lastCat=it.cat;}
    const s=it.c*it.p;sub+=s;
    const cafeLbl=it.cafe?(' <span style="background:rgba(0,166,74,.15);color:#00A64A;font-size:9px;font-weight:800;padding:2px 5px;border-radius:4px;vertical-align:middle">'+esc(it.cafe)+'</span>'):'';
    html+='<div class="rc-item" style="flex-wrap:wrap;gap:4px">'+
      '<div class="rc-info" style="width:100%;display:flex;align-items:center;justify-content:space-between">'+
        '<div style="min-width:0;flex:1"><div class="rc-name">'+esc(it.n)+cafeLbl+'</div>'+
        '<div class="rc-meta">'+(it.glabel?esc(it.glabel)+' Â· ':'')+it.c+' Ã— Bs '+it.p+'</div></div>'+
        '<div class="rc-sub">'+s.toFixed(2)+' Bs</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;width:100%;justify-content:space-between;padding-top:2px">'+
        '<button class="rc-del" data-idx="'+i+'" style="flex-shrink:0">âœ•</button>'+
        '<div style="display:flex;align-items:center;gap:0;background:#f0f0f5;border-radius:8px;overflow:hidden;border:1px solid #ddd">'+
          '<button class="rc-qty-btn rc-minus" data-idx="'+i+'" style="width:32px;height:30px;border:none;background:none;font-size:18px;font-weight:900;cursor:pointer;color:#666;display:flex;align-items:center;justify-content:center">âˆ’</button>'+
          '<span style="min-width:28px;text-align:center;font-weight:800;font-size:14px;padding:0 2px">'+it.c+'</span>'+
          '<button class="rc-qty-btn rc-plus" data-idx="'+i+'" style="width:32px;height:30px;border:none;background:none;font-size:18px;font-weight:700;cursor:pointer;color:#00A64A;display:flex;align-items:center;justify-content:center">+</button>'+
        '</div>'+
        '<div style="font-size:10px;color:#999;font-weight:600">Bs '+it.p+' c/u</div>'+
      '</div>'+
    '</div>';
  });
  rc.innerHTML=html||'<div class="rc-empty">â€” Carrito vacÃ­o â€”</div>';
  rc.querySelectorAll('.rc-del').forEach(btn=>{
    btn.addEventListener('click',()=>{cart.splice(parseInt(btn.dataset.idx),1);updateBadge();recalc();});
  });
  rc.querySelectorAll('.rc-minus').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=parseInt(btn.dataset.idx);
      if(cart[idx].c>1){cart[idx].c--;}else{cart.splice(idx,1);}
      updateBadge();recalc();
    });
  });
  rc.querySelectorAll('.rc-plus').forEach(btn=>{
    btn.addEventListener('click',()=>{
      cart[parseInt(btn.dataset.idx)].c++;
      updateBadge();recalc();
    });
  });
  const totalItems=cart.reduce((s,i)=>s+i.c,0);
  $('cart-badge').textContent=totalItems+(totalItems===1?' item':' items');

  // DESCUENTO: SOLO si el carrito es 100% Coca Machuca (sin ninguna bebida) y pago EFECTIVO
  const soloMachuca=cart.length>0&&cart.every(i=>i.cat==='machuca');
  const machSub=soloMachuca?sub:0;
  let disc=0;
  if(soloMachuca&&machSub>=CFG.discMin&&payment==='efectivo') disc=rdDisc(machSub*CFG.discPct/100);
  else if(soloMachuca&&machSub>=CFG.discMin&&payment==='mixto'){
    const cash=Math.min(parseFloat($('mix-cash').value)||0,machSub);
    disc=rdDisc(cash*CFG.discPct/100);
    $('mix-qr').value=Math.round(sub-cash);
  }
  const total=Math.round(sub-disc);
  const fmtBs=v=>Number.isInteger(v)?v:v.toFixed(2);
  $('rc-totals').innerHTML=
    '<div class="rc-row"><span>Subtotal</span><span>Bs '+fmtBs(sub)+'</span></div>'+
    '<div class="rc-row"><span>Metodo</span><span>'+payment.toUpperCase()+'</span></div>'+
    (soloMachuca&&disc>0?'<div class="rc-row disc"><span>Desc. '+CFG.discPct+'% efectivo Machuca</span><span>-Bs '+disc+'</span></div>':'')+
    '<div class="rc-final"><div class="rc-final-label">TOTAL</div><div class="rc-final-amount">Bs '+total+'</div></div>';
}

function setPayment(m){
  payment=m;
  $$('.pay-btn').forEach(b=>b.classList.remove('on'));
  $('pay-'+m).classList.add('on');
  $('mix-area').classList.toggle('show',m==='mixto');
  recalc();
}

// â•â• PANELS â•â•
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ARMADOR DE BOLO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let boloState={size:null,cafe:null,cargada:'no',sabores:[],cant:1};

function boloGetAllFlavors(){
  // Recopilar todos los sabores Ãºnicos de machuca (sin C/C suffix)
  const flavors=new Set();
  CFG.machucaCats.forEach(cat=>{
    cat.groups.forEach(g=>{
      g.items.forEach(item=>{
        // normalize: quitar " C/C" o " C/CAFÃ‰" suffix
        const clean=item.replace(/\s+c\/c[aÃ¡]?[fÃ©]?$/i,'').trim();
        flavors.add(clean);
      });
    });
  });
  // Also check admin custom flavors from localStorage
  try{
    const adm=localStorage.getItem('kollita_bolo_sabores');
    if(adm){JSON.parse(adm).forEach(s=>flavors.add(s));}
  }catch(e){}
  return [...flavors].sort();
}

function boloGetBasePrice(size){
  if(size==='media')return 15;
  if(size==='cuartilla')return 25;
  if(size==='despuntada')return 50;
  if(size==='despalada')return 60;
  return 25;
}
function boloCalcPrice(){
  const s=boloState;
  if(!s.size||!s.cafe) return 0;
  const base=boloGetBasePrice(s.size);
  const extraPerSabor=s.size==='media'?1:2;
  const extraSabores=Math.max(0,s.sabores.length-1)*extraPerSabor;
  const extraCafe=s.cargada&&s.cargada!=='no'?3:0;
  return (base+extraSabores+extraCafe)*s.cant;
}

function boloUpdateNota(){
  const s=boloState;
  const ready=s.size&&s.cafe&&s.sabores.length>0;
  const btn=$('bolo-add-btn');
  const nota=$('bolo-nota');
  if(!ready){
    if(nota)nota.style.display='none';
    if(btn){btn.style.opacity='.4';btn.style.pointerEvents='none';}
    return;
  }
  const total=boloCalcPrice();
  const base=boloGetBasePrice(s.size);
  const extraPerSabor=s.size==='media'?1:2;
  const extraSabores=Math.max(0,s.sabores.length-1)*extraPerSabor;
  const extraCafe=s.cargada&&s.cargada!=='no'?3:0;
  const sizeLabel=s.size==='media'?'Media Cuartilla':s.size==='cuartilla'?'Cuartilla':s.size==='despuntada'?'Despuntada':'Despalada';
  const cafeLabel=s.cafe==='cc'?'Con CafÃ© (C/C)':'Sin CafÃ© (S/C)';
  const cargadaLabel=s.cargada==='cafe'?'Cargada de CafÃ© âš¡â˜•':s.cargada==='esencia'?'Cargada de Esencia âš¡ðŸŒº':'';
  let body=`<div>ðŸ“ ${sizeLabel} â€” Bs ${base}</div>`;
  body+=`<div>â˜• ${cafeLabel}</div>`;
  if(cargadaLabel) body+=`<div style="color:var(--yellow)">âš¡ ${cargadaLabel} â€” +Bs 3</div>`;
  body+=`<div>ðŸƒ Sabores: ${s.sabores.join(', ')}</div>`;
  if(extraSabores>0) body+=`<div style="color:var(--yellow)">+ ${s.sabores.length-1} sabor${s.sabores.length>2?'es':''} extra â€” +Bs ${extraSabores}</div>`;
  if(s.cant>1) body+=`<div>âœ• ${s.cant} bolos</div>`;
  if($('bolo-nota-body'))$('bolo-nota-body').innerHTML=body;
  if($('bolo-nota-total'))$('bolo-nota-total').textContent='Bs '+total;
  if(nota)nota.style.display='block';
  if(btn){btn.style.opacity='1';btn.style.pointerEvents='auto';}
}

function boloSetSize(size){
  boloState.size=size;
  // Si elige media o cuartilla, ocultar despuntada/despalada
  // Si elige cuartilla, mostrar las opciones extra
  const extraDiv=$('bolo-extra-sizes');
  if(size==='cuartilla'){
    if(extraDiv)extraDiv.style.display='grid';
  } else if(size==='media'){
    if(extraDiv)extraDiv.style.display='none';
    // Si habÃ­a despuntada o despalada seleccionada, limpiar
    if(boloState.size==='despuntada'||boloState.size==='despalada'){
      ['despuntada','despalada'].forEach(id=>{
        const el=$('bolo-'+id);if(el)el.classList.remove('bolo-size-sel');
      });
    }
  }
  // Highlight seleccionado
  ['media','cuart','despuntada','despalada'].forEach(id=>{
    const el=$('bolo-'+id);
    if(!el)return;
    const match=(id==='media'&&size==='media')||(id==='cuart'&&size==='cuartilla')||
                (id==='despuntada'&&size==='despuntada')||(id==='despalada'&&size==='despalada');
    el.classList.toggle('bolo-size-sel',match);
  });
  boloUpdateNota();
}

function boloSetCafe(cafe){
  boloState.cafe=cafe;
  ['sc','cc'].forEach(id=>{
    const el=$('bolo-'+id);
    if(el)el.classList.toggle('bolo-cafe-sel',(id===cafe));
  });
  boloUpdateNota();
}
function boloSetCargada(val){
  boloState.cargada=val;
  ['no-cargada','cargada-cafe','cargada-esencia'].forEach(id=>{
    const el=$('bolo-'+id);
    const match=(id==='no-cargada'&&val==='no')||(id==='cargada-cafe'&&val==='cafe')||(id==='cargada-esencia'&&val==='esencia');
    if(el)el.classList.toggle('bolo-cafe-sel',match);
  });
  boloUpdateNota();
}

function boloToggleSabor(sabor){
  const idx=boloState.sabores.indexOf(sabor);
  if(idx>=0) boloState.sabores.splice(idx,1);
  else boloState.sabores.push(sabor);
  // update button style
  document.querySelectorAll('.bolo-sabor-btn').forEach(btn=>{
    if(btn.dataset.sabor===sabor) btn.classList.toggle('sel',idx<0);
  });
  const cnt=$('bolo-sabores-count');
  if(cnt) cnt.textContent=boloState.sabores.length+' seleccionado'+(boloState.sabores.length!==1?'s':'');
  boloUpdateNota();
}

function boloCantDelta(d){
  boloState.cant=Math.max(1,boloState.cant+d);
  const el=$('bolo-cant');
  if(el)el.textContent=boloState.cant;
  boloUpdateNota();
}

function boloRenderSabores(){
  const grid=$('bolo-sabores-grid');
  if(!grid)return;
  const flavors=boloGetAllFlavors();
  grid.innerHTML=flavors.map(f=>`
    <button class="bolo-sabor-btn ${boloState.sabores.includes(f)?'sel':''}"
      data-sabor="${esc(f)}" onclick="K.boloToggleSabor('${esc(f)}')">
      ðŸƒ ${esc(f)}
    </button>`).join('');
}

function boloReset(){
  boloState={size:null,cafe:null,cargada:'no',sabores:[],cant:1};
  ['media','cuart','despuntada','despalada'].forEach(id=>{const el=$('bolo-'+id);if(el)el.classList.remove('bolo-size-sel');});
  const exDiv=$('bolo-extra-sizes');if(exDiv)exDiv.style.display='none';
  ['sc','cc'].forEach(id=>{const el=$('bolo-'+id);if(el)el.classList.remove('bolo-cafe-sel');});
  ['no-cargada','cargada-cafe','cargada-esencia'].forEach(id=>{const el=$('bolo-'+id);if(el)el.classList.remove('bolo-cafe-sel');});
  const cnt=$('bolo-sabores-count');if(cnt)cnt.textContent='0 seleccionados';
  const cantEl=$('bolo-cant');if(cantEl)cantEl.textContent='1';
  const nota=$('bolo-nota');if(nota)nota.style.display='none';
  const btn=$('bolo-add-btn');if(btn){btn.style.opacity='.4';btn.style.pointerEvents='none';}
  boloRenderSabores();
}

function boloAgregar(){
  const s=boloState;
  if(!s.size||!s.cafe||!s.sabores.length) return;
  const sizeLabel=s.size==='media'?'Media':s.size==='cuartilla'?'Cuartilla':s.size==='despuntada'?'Despuntada':'Despalada';
  // Sigla de tipo para el nombre del bolo
  const siglaTipo=s.size==='despuntada'?' [DPT]':s.size==='despalada'?' [DPL]':'';
  const cafeTag=s.cafe==='cc'?'C/C':'S/C';
  const cargadaTag=s.cargada==='cafe'?' Cargada CafÃ©':s.cargada==='esencia'?' Cargada Esencia':'';
  const base=boloGetBasePrice(s.size);
  const extraPerSabor=s.size==='media'?1:2;
  const extraCafe=s.cargada&&s.cargada!=='no'?3:0;
  const extraSabores=Math.max(0,s.sabores.length-1)*extraPerSabor;
  const precioUnit=base+extraCafe+extraSabores;
  const key='bolo_'+Date.now();
  // Nombre resumen: "Bolo(sabor1+sabor2) [DPT]" o "[DPL]"
  const nombreSabores=s.sabores.join('+').toLowerCase();
  const nombre='Bolo('+nombreSabores+')'+siglaTipo;
  cart.push({
    _key:key,
    n:nombre,
    p:precioUnit,
    e:'ðŸ§ƒ',
    c:s.cant,
    cat:'machuca',
    cafe:cafeTag,
    glabel:sizeLabel+' '+cafeTag+cargadaTag,
    _bolo:true
  });
  updateBadge();recalc();
  toast('ðŸ§ƒ Bolo agregado'+siglaTipo+' â€” '+s.sabores.length+' sabor'+(s.sabores.length>1?'es':''));
  boloReset();
}

function openCart(){$('panel-cart').classList.add('open');$('cart-body').scrollTo({top:0});recalc();}
function closeCart(){$('panel-cart').classList.remove('open');}
function openHistory(){renderHistory();$('panel-history').classList.add('open');}
function closeHistory(){$('panel-history').classList.remove('open');}

// â•â• CONFIRM â•â•
// CategorÃ­as que van SOLO por WhatsApp (no al panel del secretario)
const CATS_WA_ONLY=['gaseosas','aguas','energizantes','cervezas','vinos','rones','licores','singani','varios'];
function esCatBebida(cat){
  return CATS_WA_ONLY.includes((cat||'').toLowerCase());
}

function confirmOrder(){
  const client=$('inp-client').value.trim();
  const note=$('inp-note').value.trim();
  if(!client)return toast('Ingrese nombre del cliente');
  if(!cart.length)return toast('El carrito estÃ¡ vacÃ­o');
  if(!branch)return toast('Seleccione una sucursal');
  let sub=cart.reduce((s,i)=>s+i.c*i.p,0);
  const soloMachuca=cart.length>0&&cart.every(i=>i.cat==='machuca');
  let disc=0;
  if(soloMachuca&&sub>=CFG.discMin&&payment==='efectivo')disc=rdDisc(sub*CFG.discPct/100);
  else if(soloMachuca&&sub>=CFG.discMin&&payment==='mixto'){const cash=Math.min(parseFloat($('mix-cash').value)||0,sub);disc=rdDisc(cash*CFG.discPct/100);}
  const total=Math.round(sub-disc);
  const now=new Date();
  const nowISO=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const order={
    id:Date.now(),client,branch:branch.n,branchTel:branch.tel,
    method:payment,note,items:JSON.parse(JSON.stringify(cart)),
    subtotal:sub,discount:disc,total,
    time:now.toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'}),
    date:now.toLocaleDateString('es-BO',{day:'2-digit',month:'2-digit',year:'numeric'}),
    fechaISO:nowISO,
    estado:'PENDIENTE',
    origen:'movil'
  };
  history.unshift(order);pendingWA=order;saveHist();

  // Solo los Ã­tems de COCA MACHUCA van al panel del secretario como pendientes
  const itemsMachuca=cart.filter(i=>!esCatBebida(i.cat));
  const itemsBebidas=cart.filter(i=>esCatBebida(i.cat));

  if(itemsMachuca.length>0){
    // Crear pedido solo con Ã­tems de machuca para el secretario
    const orderParaSecretario=Object.assign({},order,{
      items:JSON.parse(JSON.stringify(itemsMachuca)),
      subtotal:itemsMachuca.reduce((s,i)=>s+i.c*i.p,0),
      total:itemsMachuca.reduce((s,i)=>s+i.c*i.p,0)-disc
    });
    var pendientes = [];
    try{ pendientes = JSON.parse(localStorage.getItem(PENDIENTES_KEY)||'[]'); }catch(e){ pendientes = []; }
    pendientes.push(orderParaSecretario);
    localStorage.setItem(PENDIENTES_KEY,JSON.stringify(pendientes));
    notifySync('nuevo_pendiente',orderParaSecretario);
  }
  // Si hay bebidas, se le avisa al cliente que esos items van solo por WhatsApp
  if(itemsBebidas.length>0&&itemsMachuca.length>0){
    // Pedido mixto: machuca va al secretario, bebidas solo WA
    order._aviso_bebidas_wa=true;
  }

  $('notif-dot').classList.add('on');
  $('modal-client').textContent=client.toUpperCase();
  $('modal').classList.add('open');
}

function closeModal(){$('modal').classList.remove('open');}
function modalSendWA(){closeModal();if(pendingWA)sendWA(pendingWA);newOrder();}
function modalNewOrder(){closeModal();newOrder();}
function newOrder(){
  cart=[];payment='efectivo';
  $('inp-client').value='';$('inp-note').value='';
  $('mix-cash').value='';$('mix-qr').value='';
  $('mix-area').classList.remove('show');
  $$('.pay-btn').forEach(b=>b.classList.remove('on'));
  $('pay-efectivo').classList.add('on');
  updateBadge();recalc();closeCart();toast('Nuevo pedido listo');
  document.querySelectorAll('.beb-card').forEach(c=>{
    c.classList.remove('in-cart');
    const q=c.querySelector('.beb-qty');if(q)q.style.display='none';
  });
}

// â•â• WHATSAPP â•â•
function sendWA(o){
  let msg='*LA KOLLITA*%0A'+encodeURIComponent(o.branch)+
    '%0ACliente: '+encodeURIComponent(o.client)+
    '%0APago: '+o.method.toUpperCase()+'%0A%0A*DETALLE:*%0A';
  let lastCat=null;
  o.items.forEach(it=>{
    const lbl=it.cat==='machuca'?'COCA MACHUCA':'BEBIDAS';
    if(it.cat!==lastCat){msg+='%0A*-- '+lbl+' --*%0A';lastCat=it.cat;}
    const _cafetag=it.cafe?' ('+it.cafe+')':'';
    // Sin emoji: solo nombre y cantidades
    msg+='*'+encodeURIComponent(it.n+_cafetag)+'*%0A'+it.c+'x Bs'+it.p+' = Bs '+(it.c*it.p).toFixed(0)+'%0A';
  });
  const _fbs=v=>Number.isInteger(v)?v:parseFloat(v.toFixed(2));
  msg+='%0ASubtotal: Bs '+_fbs(o.subtotal);
  // Mostrar descuento SOLO si existe y es mayor a 0
  if(o.discount&&o.discount>0) msg+='%0ADescuento: -Bs '+o.discount;
  msg+='%0A*TOTAL: Bs '+o.total+'*';
  if(o.note)msg+='%0A%0ANota: '+encodeURIComponent(o.note);
  msg+='%0A%0A'+o.time+' Â· '+o.date+'%0AGracias por su compra';
  window.open('https://wa.me/'+o.branchTel+'?text='+msg,'_blank');
}

// â•â• HISTORIAL â•â•
function renderHistory(){
  const cont=$('hist-body');
  $('hist-badge').textContent=history.length+(history.length===1?' pedido':' pedidos');
  if(!history.length){cont.innerHTML='<div class="hist-empty"><div class="hist-empty-icon">ðŸ“‹</div><div class="hist-empty-txt">Sin pedidos registrados</div></div>';return;}
  const tSales=history.reduce((s,p)=>s+p.total,0);
  const tItems=history.reduce((s,p)=>s+p.items.reduce((a,i)=>a+i.c,0),0);
  let html='<div class="hist-summary">'+
    '<div class="hist-stat"><div class="hist-stat-num">'+history.length+'</div><div class="hist-stat-lbl">Pedidos</div></div>'+
    '<div class="hist-sep"></div>'+
    '<div class="hist-stat"><div class="hist-stat-num">'+tItems+'</div><div class="hist-stat-lbl">Productos</div></div>'+
    '<div class="hist-sep"></div>'+
    '<div class="hist-stat"><div class="hist-stat-total">'+tSales.toFixed(0)+'</div><div class="hist-stat-lbl">Bs Total</div></div>'+
  '</div>';
  history.forEach((order,idx)=>{
    const tp=order.items.reduce((s,i)=>s+i.c,0);
    let det='';let lastCat=null;
    order.items.forEach(it=>{
      const lbl=it.cat==='machuca'?'COCA MACHUCA':'BEBIDAS';
      if(it.cat!==lastCat){det+='<div class="od-group">'+lbl+'</div>';lastCat=it.cat;}
      det+='<div class="od-item"><div><div class="od-name">'+esc(it.e)+' '+esc(it.n)+'</div><span class="od-label">'+it.c+' Ã— Bs '+it.p+'</span></div><div class="od-sub">Bs '+(it.c*it.p).toFixed(2)+'</div></div>';
    });
    det+='<div class="od-totals">'+
      '<div class="od-tr"><span>Subtotal</span><span>Bs '+order.subtotal.toFixed(2)+'</span></div>'+
      '<div class="od-tr"><span>Pago</span><span>'+order.method.toUpperCase()+'</span></div>'+
      '<div class="od-tr"><span>Descuento</span><span>-Bs '+order.discount.toFixed(2)+'</span></div>'+
      (order.note?'<div class="od-tr"><span>Nota</span><span>'+esc(order.note)+'</span></div>':'')+
      '<div class="od-tr final"><span>TOTAL</span><span>Bs '+order.total.toFixed(2)+'</span></div>'+
    '</div>';
    det+='<div class="order-actions">'+
      '<button class="btn-resend" data-idx="'+idx+'">ðŸ“© Reenviar WhatsApp</button>'+
      '<button class="btn-del-order" data-idx="'+idx+'">ðŸ—‘</button>'+
    '</div>';
    html+='<div class="order-card">'+
      '<div class="order-head" data-idx="'+idx+'">'+
        '<div class="order-num">'+(history.length-idx)+'</div>'+
        '<div class="order-info"><div class="order-client">'+esc(order.client)+'</div><div class="order-meta">'+esc(order.branch)+' Â· '+tp+' prod Â· '+order.method.toUpperCase()+'</div></div>'+
        '<div class="order-total"><div class="order-amount">Bs '+order.total.toFixed(2)+'</div><div class="order-time">'+esc(order.time)+'</div></div>'+
        '<div class="order-arrow" id="oa-'+idx+'">â–¼</div>'+
      '</div>'+
      '<div class="order-detail" id="od-'+idx+'">'+det+'</div>'+
    '</div>';
  });
  html+='<button class="btn-clear-hist" id="btn-clear-hist">ðŸ—‘ Limpiar historial</button>';
  cont.innerHTML=html;
  cont.querySelectorAll('.order-head').forEach(el=>{
    el.addEventListener('click',()=>{
      const i=parseInt(el.dataset.idx);
      const d=$('od-'+i);const a=$('oa-'+i);
      const open=d.classList.contains('open');
      $$('.order-detail').forEach(x=>x.classList.remove('open'));
      $$('.order-arrow').forEach(x=>x.classList.remove('open'));
      if(!open){d.classList.add('open');a.classList.add('open');}
    });
  });
  cont.querySelectorAll('.btn-resend').forEach(el=>{el.addEventListener('click',()=>sendWA(history[parseInt(el.dataset.idx)]));});
  cont.querySelectorAll('.btn-del-order').forEach(el=>{
    el.addEventListener('click',()=>{
      history.splice(parseInt(el.dataset.idx),1);
      if(!history.length)$('notif-dot').classList.remove('on');
      saveHist();renderHistory();
    });
  });
  const cb=$('btn-clear-hist');
  if(cb)cb.addEventListener('click',()=>{history=[];pendingWA=null;$('notif-dot').classList.remove('on');saveHist();renderHistory();});
}

// INIT
  function _initApp(){
    history=readHist();
    adminCfg=lg('kol_adm_v3',null);
    const s=lg('kollita_logo','');
    if(s){const im=document.getElementById('br-logo-img');const ic=document.getElementById('br-logo-icon');if(im&&ic){im.src=s;im.style.display='block';ic.style.display='none';}}
    
    renderBranches();recalc();
    if(history.length)$('notif-dot').classList.add('on');
    
    window._cloudPromise = fetchCloud().then(() => {
      adminCfg=lg('kol_adm_v3',null);
      if(branch) {
        renderBebContent();
        if(store==='machuca') renderMachucaCats();
      }
    });

    // Auto-login movido aquí adentro
    var ses = localStorage.getItem('kol_movil_sesion');
    if(ses){
      try{
        var s = JSON.parse(ses);
        if(Date.now() - s.ts < 86400000){
          branch = CFG.branches.find(function(b){return b.n===s.branch;}) || null;
          if(branch){
            store = s.store || 'machuca';
            $('scr-branch').style.display='none';
            $('hdr-branch').textContent=branch.n;
            $('rc-addr').textContent=CFG.storeAddr;
            renderMachucaCats();
            renderBebCats();
            setStore(store);
          }
        }
      }catch(e){}
    }
  }

  return{openCart,closeCart,openHistory,closeHistory,setPayment,recalc,confirmOrder,closeModal,modalSendWA,modalNewOrder,setStore,boloSetSize,boloSetCafe,boloSetCargada,boloToggleSabor,boloCantDelta,boloAgregar,_initApp};
})();

K._initApp();

window.addEventListener('storage', function(e){
  if(e.key==='kollita_db' || e.key==='kollita_pendientes'){
    recalc();
  }
});

