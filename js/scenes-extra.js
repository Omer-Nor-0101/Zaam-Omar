/* More illustrated scenes: ferris wheel, sparkler, tent, boat, movie night, umbrella, plane window, neon sign, gift. Exposes FU.xscene(key). */
(function(){
  var uid=0;
  function grad(id,stops,dir){var d=(dir||'0 0 0 1').split(' ');return '<linearGradient id="'+id+'" x1="'+d[0]+'" y1="'+d[1]+'" x2="'+d[2]+'" y2="'+d[3]+'">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"/>'}).join('')+'</linearGradient>'}
  function wrap(defs,body){return '<svg viewBox="0 0 300 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'+defs+'</defs>'+body+'</svg>'}
  function blur(u,sd){return '<filter id="'+u+'b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="'+sd+'"/></filter>'}
  function bokeh(u,list,colors){return '<g filter="url(#'+u+'b)">'+list.map(function(p,i){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+colors[i%colors.length]+'" opacity="'+(p[3]||.7)+'"/>'}).join('')+'</g>'}
  function pair(x,y,s,c){ /* two heads and shoulders, seen from the front */
    return '<g transform="translate('+x+' '+y+') scale('+s+')" fill="'+c+'"><circle cx="-16" cy="-30" r="13"/><circle cx="16" cy="-28" r="12"/><path d="M-42 30C-42 -2 -30 -14 -16 -14s26 12 26 44z"/><path d="M-6 30C-6 0 4 -12 16 -12s26 12 26 42z"/></g>';
  }
  var scenes={
    ferris:function(u){
      var sp='',lt='';
      for(var i=0;i<12;i++){var a=i*Math.PI/6,x=150+Math.cos(a)*86,y=104+Math.sin(a)*86;sp+='<line x1="150" y1="104" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'"/>';lt+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4.500" fill="#ffd27a"/>'}
      return wrap(grad(u+'s',[[0,'#1b1740'],[1,'#4a2a5a']])+blur(u,3),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/>'+bokeh(u,[[40,60,10],[260,50,12],[230,190,14],[60,200,12]],['#ffb86a','#ff9fbf'])
        +'<g stroke="#ffd9a0" stroke-width="1.600" fill="none"><circle cx="150" cy="104" r="86"/><circle cx="150" cy="104" r="60"/>'+sp+'</g>'+lt+'<path d="M150 104L112 232M150 104L188 232" stroke="#ffd9a0" stroke-width="3"/>'
        +'<rect y="226" width="300" height="44" fill="#120c22"/>'+pair(120,214,.7,'#0b0716')+pair(190,218,.6,'#0b0716'));
    },
    sparkler:function(u){
      var rays='';for(var i=0;i<16;i++){var a=i*Math.PI/8;rays+='<line x1="150" y1="150" x2="'+(150+Math.cos(a)*(18+(i%3)*8)).toFixed(1)+'" y2="'+(150+Math.sin(a)*(18+(i%3)*8)).toFixed(1)+'"/>'}
      return wrap(grad(u+'s',[[0,'#120a18'],[1,'#2a1420']])+'<radialGradient id="'+u+'g"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>'+blur(u,4),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/>'+bokeh(u,[[50,60,12,.5],[250,90,16,.4]],['#ffb86a'])
        +'<circle cx="150" cy="150" r="90" fill="url(#'+u+'g)"/><g fill="#2a1a22"><circle cx="92" cy="130" r="30"/><circle cx="208" cy="132" r="29"/><path d="M40 270C44 190 70 170 92 168C114 170 130 190 134 270zM166 270C170 190 186 170 208 168C230 170 256 190 260 270z"/></g>'
        +'<g stroke="#fff3c0" stroke-width="1.600" stroke-linecap="round">'+rays+'</g><circle cx="150" cy="150" r="5" fill="#fff"/>');
    },
    tent:function(u){
      var l='';for(var i=0;i<14;i++){l+='<circle cx="'+(20+i*20)+'" cy="'+(36+Math.sin(i)*8)+'" r="3" fill="#ffd27a"/>'}
      return wrap(grad(u+'s',[[0,'#1a1226'],[1,'#3b2230']])+'<radialGradient id="'+u+'g"><stop offset="0" stop-color="#ffb25a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>'+blur(u,3),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/><path d="M0 40C80 56 220 56 300 40" stroke="#6a5a5a" fill="none"/>'+l
        +'<path d="M40 232L150 58L260 232z" fill="#7a4a3a"/><path d="M150 58L150 232L118 232z" fill="#2a1a1a" opacity=".6"/><ellipse cx="150" cy="184" rx="60" ry="46" fill="url(#'+u+'g)"/>'+pair(150,196,.8,'#1a0f14')
        +'<rect y="232" width="300" height="38" fill="#141018"/>');
    },
    boat:function(u){
      return wrap(grad(u+'s',[[0,'#3a4a7a'],[.6,'#c27a8a'],[1,'#f0b48a']])+grad(u+'w',[[0,'#44648a'],[1,'#1c2c4c']]),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/><path d="M0 130L50 96L90 120L140 84L200 124L260 100L300 120L300 150L0 150z" fill="#4a4a70" opacity=".85"/><rect y="146" width="300" height="124" fill="url(#'+u+'w)"/>'
        +'<path d="M30 206C80 232 230 232 280 200L262 188L52 192z" fill="#c9a07a"/><path d="M52 192L262 188L270 180L44 184z" fill="#7a5238"/>'+pair(160,176,.7,'#1a1220')
        +'<g stroke="#fff" stroke-opacity=".3" fill="none"><path d="M20 244c40 6 80 0 120 6"/><path d="M160 252c40 4 80 0 120 4"/></g>');
    },
    tv:function(u){
      var l='';for(var i=0;i<10;i++){l+='<circle cx="'+(24+i*28)+'" cy="'+(34+(i%2)*10)+'" r="4" fill="#ffd27a"/>'}
      return wrap(grad(u+'s',[[0,'#1a1020'],[1,'#33202c']])+grad(u+'t',[[0,'#e8f0ff'],[1,'#8aa0d0']])+blur(u,3),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/>'+bokeh(u,[[40,90,14,.5],[260,100,16,.5],[240,40,10]],['#ffb86a'])+l
        +'<rect x="88" y="70" width="124" height="78" rx="4" fill="#0a0810"/><rect x="94" y="76" width="112" height="66" fill="url(#'+u+'t)"/><path d="M94 130l30-26 22 18 20-14 40 22v12H94z" fill="#3a4a7a" opacity=".6"/><rect x="140" y="148" width="20" height="8" fill="#0a0810"/>'
        +'<rect x="20" y="200" width="260" height="70" rx="14" fill="#2a1a24"/>'+pair(150,208,.9,'#0e0810'));
    },
    umbrella:function(u){
      return wrap(grad(u+'s',[[0,'#141a3a'],[1,'#3a2a50']])+blur(u,4),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/>'+bokeh(u,[[40,200,16],[100,220,12],[230,210,18],[270,160,12],[70,150,10]],['#ff9fbf','#ffd27a','#9ac0ff'])
        +'<path d="M30 112C40 48 260 48 270 112C250 98 230 98 210 112C190 98 170 98 150 112C130 98 110 98 90 112C70 98 50 98 30 112z" fill="#14101c"/><path d="M150 112L150 206" stroke="#14101c" stroke-width="3"/><path d="M60 82C100 62 200 62 240 82" stroke="#6a5a8a" stroke-opacity=".7" fill="none" stroke-width="2"/>'
        +'<g fill="#0c0810"><circle cx="134" cy="146" r="12"/><circle cx="166" cy="148" r="11"/><path d="M104 270C106 200 120 166 134 162C150 166 156 190 156 270zM150 270C150 190 156 164 168 162C184 166 198 200 198 270z"/></g>'
        +'<g stroke="#bcd0ff" stroke-opacity=".5" stroke-width="1">'+Array.apply(null,Array(26)).map(function(_,i){var x=(i*37)%300,y=(i*53)%260;return '<line x1="'+x+'" y1="'+y+'" x2="'+(x-5)+'" y2="'+(y+16)+'"/>'}).join('')+'</g>');
    },
    plane:function(u){
      return wrap(grad(u+'s',[[0,'#5a4a9a'],[.5,'#f08a7a'],[1,'#ffd2a0']])+grad(u+'c',[[0,'#fff1e6'],[1,'#e8a8a0']])+'<clipPath id="'+u+'k"><rect x="62" y="30" width="176" height="210" rx="78"/></clipPath>',
        '<rect width="300" height="270" fill="#0c0a12"/><g clip-path="url(#'+u+'k)"><rect x="60" y="28" width="180" height="214" fill="url(#'+u+'s)"/><circle cx="170" cy="150" r="22" fill="#fff0c0" opacity=".9"/><path d="M60 190C90 160 110 170 140 176C170 160 210 172 240 186L240 242L60 242z" fill="url(#'+u+'c)"/><path d="M60 220C100 200 150 214 190 204C210 200 230 206 240 210L240 242L60 242z" fill="#fff" opacity=".7"/><path d="M92 130L206 112L214 120L98 142z" fill="#c9ced8"/><path d="M92 130L96 112L108 128z" fill="#aab0bc"/></g>'
        +'<rect x="56" y="24" width="188" height="222" rx="84" fill="none" stroke="#1c1824" stroke-width="12"/><rect x="62" y="30" width="176" height="210" rx="78" fill="none" stroke="#3a3446" stroke-width="2"/>');
    },
    neon:function(u){
      return wrap(grad(u+'s',[[0,'#2a1418'],[1,'#3d1c22']])+blur(u,3),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/><g stroke="#4a2a2e" stroke-width="1">'+Array.apply(null,Array(9)).map(function(_,i){return '<line x1="0" y1="'+(i*32)+'" x2="300" y2="'+(i*32)+'"/>'}).join('')+'</g>'
        +bokeh(u,[[30,40,6],[80,30,5],[150,24,6],[230,34,6],[270,60,5]],['#ffb86a','#ff8aa0'])
        +'<g filter="url(#'+u+'b)" opacity=".8"><text x="150" y="132" text-anchor="middle" font-size="46" fill="#ff5d93" font-family="Dancing Script,cursive">You &amp; Me</text></g>'
        +'<text x="150" y="132" text-anchor="middle" font-size="46" fill="#ffd0e0" stroke="#ff5d93" stroke-width="1" font-family="Dancing Script,cursive">You &amp; Me</text>'
        +'<path d="M104 158h92a14 14 0 0 1 14 14v18a14 14 0 0 1-14 14h-52l-18 14v-14h-22a14 14 0 0 1-14-14v-18a14 14 0 0 1 14-14z" fill="none" stroke="#ff5d93" stroke-width="3"/><g fill="#ff5d93"><circle cx="128" cy="182" r="4"/><circle cx="150" cy="182" r="4"/><circle cx="172" cy="182" r="4"/></g>');
    },
    gift:function(u){
      return wrap(grad(u+'s',[[0,'#2a1620'],[1,'#4a2430']])+grad(u+'g',[[0,'#f6b4c4'],[1,'#d9728c']])+blur(u,5),
        '<rect width="300" height="270" fill="url(#'+u+'s)"/>'+bokeh(u,[[40,60,16],[100,40,10],[250,50,18],[270,140,14],[30,150,12],[220,20,9]],['#ffd27a','#ffb6c8'])
        +'<rect x="70" y="130" width="160" height="110" rx="6" fill="url(#'+u+'g)"/><rect x="62" y="116" width="176" height="28" rx="5" fill="#f2a0b6"/><rect x="138" y="116" width="24" height="124" fill="#fbe3ea"/>'
        +'<path d="M150 116C110 76 80 100 112 116zM150 116C190 76 220 100 188 116z" fill="#fbe3ea" stroke="#e8a0b4" stroke-width="2"/><circle cx="150" cy="114" r="9" fill="#f6c6d4"/><rect y="240" width="300" height="30" fill="#2a1a22"/>');
    }
  };
  window.FU=window.FU||{};
  window.FU.xscene=function(key){return scenes[key]('x'+(uid++))};
  window.FU.xsceneKeys=Object.keys(scenes);
})();
