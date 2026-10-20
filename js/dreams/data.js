/* Categories, seed destinations and localStorage persistence. */
(function(){
  /* Data */
  var CATS=[
    {id:'beach',name:'Beach & Islands',icon:'<path d="M3 17c3-3 5-3 9 0s6 3 9 0M3 21c3-3 5-3 9 0s6 3 9 0M12 3v9M12 3c4 0 6 3 6 5-3-1-5-1-6-1-1 0-3 0-6 1 0-2 2-5 6-5z"/>'},
    {id:'cities',name:'Cities',icon:'<path d="M4 21V9h6v12M10 21V4h6v17M16 21V11h4v10M13 8h0M7 13h0M7 17h0M13 12h0"/>'},
    {id:'mountains',name:'Mountains',icon:'<path d="M2 20l7-12 4 7 3-4 6 9z"/>'},
    {id:'religious',name:'Religious',icon:'<path d="M20 14a8 8 0 1 1-9-10 6 6 0 0 0 9 10zM17 5l.6 1.4L19 7l-1.400.6L17 9l-.6-1.400L15 7l1.400-.6z"/>'},
    {id:'adventure',name:'Adventure',icon:'<circle cx="12" cy="12" r="9"/><path d="M15.500 8.500l-2 5-5 2 2-5z"/>'}
  ];
  var ALL_ICON='<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-4 4 3 3-2 6 4"/>';
  var SEED=[
    {id:1,name:'Maldives',blurb:'Crystal clear water, private villas and endless sunsets.',cat:'beach',status:'planned',date:'2026-12',prog:25,fav:false,scene:'beach'},
    {id:2,name:'Istanbul, Turkey',blurb:'Explore the city of history, culture and beautiful views.',cat:'cities',status:'wishlist',date:'2027-04',prog:0,fav:false,scene:'istanbul'},
    {id:3,name:'Makkah',blurb:'A spiritual journey, a dream of every heart.',cat:'religious',status:'visited',date:'2024-08',prog:100,fav:true,scene:'holy'},
    {id:4,name:'Santorini, Greece',blurb:'White houses, blue seas and unforgettable moments.',cat:'beach',status:'wishlist',date:'2027-07',prog:0,fav:false,scene:'santorini'},
    {id:5,name:'Dubai, UAE',blurb:'Modern city, luxury lifestyle and amazing adventures.',cat:'cities',status:'planned',date:'2026-11',prog:40,fav:false,scene:'city'},
    {id:6,name:'Switzerland',blurb:'The land of natural beauty, peace and love.',cat:'mountains',status:'wishlist',date:'2027-06',prog:0,fav:false,scene:'mountain'},
    {id:7,name:'Bali, Indonesia',blurb:'Cliffside sunsets, rice terraces and quiet temples.',cat:'adventure',status:'planned',date:'2027-01',prog:10,fav:false,scene:'adventure'}
  ];
  var KEY='forever-us-dreams-v1';
  function load(){
    var list=null;
    try{var raw=localStorage.getItem(KEY);list=raw?JSON.parse(raw):null}catch(e){list=null}
    if(!Array.isArray(list))list=SEED.map(function(d){return Object.assign({},d)});
    return list;
  }
  function save(list){try{localStorage.setItem(KEY,JSON.stringify(list))}catch(e){}}
  window.FU=window.FU||{};
  window.FU.CATS=CATS;window.FU.ALL_ICON=ALL_ICON;window.FU.load=load;window.FU.save=save;
})();
