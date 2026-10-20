/* Illustrated destination scenes (inline SVG). Exposes FU.scene() and FU.SCENE_FOR_CAT. */
(function(){
var uid=0;
  function grad(id,stops){return '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"/>'}).join('')+'</linearGradient>'}
  function wrap(u,defs,body){return '<svg viewBox="0 0 300 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'+defs+'</defs>'+body+'</svg>'}
  function mosque(u,sky,glow,fill,dome){
    var mins=[[70,60],[104,80],[196,80],[230,60]],b='';
    mins.forEach(function(m){b+='<rect x="'+(m[0]-4)+'" y="'+m[1]+'" width="8" height="'+(190-m[1])+'" fill="'+fill+'"/><path d="M'+(m[0]-6)+' '+m[1]+'L'+m[0]+' '+(m[1]-26)+'L'+(m[0]+6)+' '+m[1]+'z" fill="'+fill+'"/><rect x="'+(m[0]-6)+'" y="'+(m[1]+30)+'" width="12" height="3" fill="'+fill+'"/>'});
    return wrap(u,grad(u+'s',sky),'<rect width="300" height="270" fill="url(#'+u+'s)"/><circle cx="150" cy="150" r="70" fill="'+glow+'" opacity=".35"/>'+b+'<path d="M95 190C95 130 125 100 150 100s55 30 55 90z" fill="'+dome+'"/><rect x="146" y="82" width="8" height="20" fill="'+dome+'"/><rect x="0" y="190" width="300" height="80" fill="'+fill+'"/><g fill="#fff" opacity=".7"><circle cx="40" cy="40" r="1.500"/><circle cx="250" cy="30" r="1.500"/><circle cx="270" cy="70" r="1"/><circle cx="20" cy="90" r="1"/></g>');
  }
  var scenes={
    beach:function(u){
      var huts='';[.3,.5,.7,.9].forEach(function(t){var x=-10+215*t,y=262-112*t,s=1.2-t*.55;huts+='<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="-13" y="-16" width="26" height="11" fill="#4a3328"/><path d="M-17 -16L0 -28L17 -16z" fill="#7a5238"/><rect x="-4" y="-14" width="8" height="6" fill="#ffd27a"/></g>'});
      return wrap(u,grad(u+'s',[[0,'#40306f'],[.5,'#e46a98'],[1,'#ffb583']])+grad(u+'w',[[0,'#2a8296'],[1,'#0c3350']]),'<rect width="300" height="270" fill="url(#'+u+'s)"/><circle cx="172" cy="132" r="30" fill="#ffe0aa" opacity=".92"/><rect y="134" width="300" height="140" fill="url(#'+u+'w)"/><g stroke="#ffd5a0" stroke-opacity=".5" stroke-width="2"><line x1="145" y1="142" x2="198" y2="142"/><line x1="152" y1="150" x2="192" y2="150"/><line x1="160" y1="158" x2="184" y2="158"/></g><path d="M-10 268L205 154L210 158L20 276z" fill="#2b1d22"/>'+huts);
    },
    city:function(u){
      return wrap(u,grad(u+'s',[[0,'#2f2358'],[.6,'#d9715f'],[1,'#f4b179']])+grad(u+'t',[[0,'#463457'],[1,'#1b1426']]),'<rect width="300" height="270" fill="url(#'+u+'s)"/><g fill="#201830"><rect x="20" y="170" width="22" height="100"/><rect x="48" y="150" width="18" height="120"/><rect x="72" y="185" width="26" height="85"/><rect x="198" y="165" width="22" height="105"/><rect x="226" y="145" width="20" height="125"/><rect x="252" y="180" width="30" height="90"/><rect x="104" y="200" width="20" height="70"/><rect x="176" y="195" width="20" height="75"/></g><path d="M150 14L154 80L161 140L170 215L130 215L139 140L146 80z" fill="url(#'+u+'t)"/><rect x="0" y="228" width="300" height="42" fill="#150f1f"/><g fill="#ffd9a0" opacity=".8"><rect x="28" y="185" width="3" height="3"/><rect x="54" y="170" width="3" height="3"/><rect x="204" y="180" width="3" height="3"/><rect x="232" y="165" width="3" height="3"/><rect x="258" y="196" width="3" height="3"/></g>');
    },
    istanbul:function(u){return mosque(u,[[0,'#2c2a5e'],[.55,'#e0807c'],[1,'#f6c48b']],'#ffd7a0','#201832','#2b2040')},
    holy:function(u){return mosque(u,[[0,'#0b1522'],[.7,'#1c4a49'],[1,'#3a7a63']],'#9fe0b8','#0c1a22','#2e8b6e')},
    santorini:function(u){
      var b='',doms=[[190,150],[120,190],[235,205]];
      b+='<path d="M0 270L0 170L70 150L110 175L170 140L220 160L300 130L300 270z" fill="#f2e9e4"/>';
      [[30,176,34,28],[78,190,30,30],[130,166,30,34],[186,150,34,34],[236,150,32,40],[262,170,38,34],[150,206,40,30],[60,218,44,28],[210,214,40,30]].forEach(function(r){b+='<rect x="'+r[0]+'" y="'+r[1]+'" width="'+r[2]+'" height="'+r[3]+'" fill="#fbf6f2" stroke="#d9c9c8" stroke-width=".6"/>'});
      doms.forEach(function(d){b+='<path d="M'+(d[0]-16)+' '+d[1]+'a16 16 0 0 1 32 0z" fill="#1f5fbf"/><rect x="'+(d[0]-1)+'" y="'+(d[1]-22)+'" width="2" height="7" fill="#fbf6f2"/>'});
      return wrap(u,grad(u+'s',[[0,'#3a4a8c'],[.55,'#f3946e'],[1,'#ffd3a2']])+grad(u+'w',[[0,'#295a9a'],[1,'#17315e']]),'<rect width="300" height="270" fill="url(#'+u+'s)"/><circle cx="60" cy="110" r="26" fill="#ffe3b0" opacity=".85"/><rect y="128" width="300" height="142" fill="url(#'+u+'w)" opacity=".9"/>'+b);
    },
    mountain:function(u){
      return wrap(u,grad(u+'s',[[0,'#4f93cf'],[1,'#cfe8f2']])+grad(u+'l',[[0,'#4a8fb0'],[1,'#2b6384']]),'<rect width="300" height="270" fill="url(#'+u+'s)"/><path d="M-10 170L70 70L110 120L150 40L230 150L310 90L310 200L-10 200z" fill="#8ea6c6"/><path d="M70 70L88 94L78 90L70 100L60 88zM150 40L174 78L160 72L150 84L138 70zM310 90L286 120L296 116L300 124z" fill="#fff"/><path d="M-10 190C60 150 120 175 170 165C220 155 270 175 310 160L310 215L-10 215z" fill="#3f7c4b"/><rect y="205" width="300" height="70" fill="url(#'+u+'l)"/><g transform="translate(205 168)"><rect x="-16" y="0" width="32" height="20" fill="#6b4a35"/><path d="M-22 0L0 -18L22 0z" fill="#8a3b2e"/><rect x="-4" y="6" width="8" height="8" fill="#ffd27a"/></g><path d="M0 238C80 226 160 244 300 232" stroke="#fff" stroke-opacity=".25" fill="none"/>');
    },
    adventure:function(u){
      return wrap(u,grad(u+'s',[[0,'#e36f55'],[.6,'#f7a95d'],[1,'#f9dca3']])+grad(u+'w',[[0,'#2a7d8c'],[1,'#10445a']]),'<rect width="300" height="270" fill="url(#'+u+'s)"/><circle cx="200" cy="120" r="32" fill="#fff0c4" opacity=".9"/><rect y="140" width="300" height="130" fill="url(#'+u+'w)"/><path d="M-10 270L-10 100L40 90L80 130L110 160L140 200L190 270z" fill="#6a4a38"/><path d="M-10 100L40 90L80 130L50 135L20 118L-10 125z" fill="#3f7a46"/><path d="M60 100C60 80 70 66 84 56M60 100C66 82 84 76 98 80M60 100C50 84 36 80 22 86" stroke="#2b5a34" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M60 100L60 118" stroke="#3b2a22" stroke-width="3"/><g stroke="#fff" stroke-opacity=".5" fill="none"><path d="M120 190c20 4 40 0 60 6"/><path d="M200 220c20 4 40 0 60 4"/></g>');
    }
  };
  var SCENE_FOR_CAT={beach:'beach',cities:'city',mountains:'mountain',religious:'holy',adventure:'adventure'};
  function scene(key){return scenes[key]('s'+(uid++))}
  window.FU=window.FU||{};
  window.FU.scene=scene;
  window.FU.SCENE_FOR_CAT=SCENE_FOR_CAT;
})();
