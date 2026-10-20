/* Illustrated photo scenes for each letter card (inline SVG). Exposes FU.lscene(key). */
(function(){
  var uid=0;
  function grad(id,stops,dir){var d=dir||'0 0 0 1';d=d.split(' ');return '<linearGradient id="'+id+'" x1="'+d[0]+'" y1="'+d[1]+'" x2="'+d[2]+'" y2="'+d[3]+'">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"/>'}).join('')+'</linearGradient>'}
  function wrap(defs,body){return '<svg viewBox="0 0 300 390" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'+defs+'</defs>'+body+'</svg>'}
  function blur(u,sd){return '<filter id="'+u+'b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="'+sd+'"/></filter>'}
  function bokeh(u,list,colors){
    return '<g filter="url(#'+u+'b)">'+list.map(function(p,i){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+colors[i%colors.length]+'" opacity="'+(p[3]||.7)+'"/>'}).join('')+'</g>';
  }
  function rose(x,y,r,c1,c2){
    return '<g><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c1+'"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.72)+'" fill="'+c2+'"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.46)+'" fill="'+c1+'"/><path d="M'+(x-r*.3)+' '+y+'a'+(r*.3)+' '+(r*.3)+' 0 0 1 '+(r*.6)+' 0" stroke="'+c2+'" stroke-width="'+(r*.1)+'" fill="none"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.18)+'" fill="'+c2+'"/></g>';
  }
  function lines(x,y,w,n,gap,c){var s='';for(var i=0;i<n;i++)s+='<rect x="'+x+'" y="'+(y+i*gap)+'" width="'+(w*(i%3===2?.7:1))+'" height="1.600" fill="'+c+'" opacity=".55"/>';return s}

  var scenes={
    couple:function(u){
      return wrap(grad(u+'s',[[0,'#34285a'],[.5,'#d46a7c'],[1,'#f6b786']])+grad(u+'w',[[0,'#5a4a80'],[1,'#1e1836']]),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/><circle cx="150" cy="215" r="46" fill="#ffd6a0" opacity=".85"/><rect y="228" width="300" height="100" fill="url(#'+u+'w)"/><g stroke="#ffd6a0" stroke-opacity=".4" stroke-width="2"><line x1="110" y1="240" x2="190" y2="240"/><line x1="124" y1="250" x2="176" y2="250"/></g><path d="M0 320C80 300 200 305 300 318L300 390L0 390z" fill="#2a2036"/>'
        +'<path d="M70 345C68 300 80 280 98 276C116 280 124 300 124 345z" fill="#1a1224"/><circle cx="98" cy="262" r="13" fill="#1a1224"/><path d="M84 258C84 240 112 240 112 262C118 280 116 296 110 308L96 300C102 290 90 280 84 258z" fill="#120b1a"/>'
        +'<path d="M124 345C124 296 138 276 160 272C182 276 192 300 192 345z" fill="#1c1426"/><circle cx="158" cy="258" r="13" fill="#1c1426"/>');
    },
    roses:function(u){
      var r='';
      [[200,70,34,'#c43d5e','#e27a92'],[250,120,30,'#b53255','#d9708a'],[160,120,26,'#d04a68','#ec8aa0'],[215,160,30,'#a82c4d','#cf6482'],[270,60,22,'#c43d5e','#e27a92'],[120,60,22,'#b53255','#d9708a']].forEach(function(p){r+=rose(p[0],p[1],p[2],p[3],p[4])});
      return wrap(grad(u+'s',[[0,'#2b1620'],[1,'#4a2a34']]),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/><g transform="rotate(-12 110 260)"><rect x="20" y="170" width="190" height="210" rx="4" fill="#efe0cf"/>'+lines(38,196,150,14,12,'#8a6a5a')+'</g>'
        +'<ellipse cx="90" cy="190" rx="26" ry="12" fill="#3f7a4a" transform="rotate(-30 90 190)"/><ellipse cx="60" cy="330" rx="30" ry="12" fill="#3a6f45" transform="rotate(20 60 330)"/>'+r);
    },
    letter:function(u){
      return wrap(grad(u+'s',[[0,'#3c2a40'],[1,'#5f4552']])+blur(u,5),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/>'+bokeh(u,[[40,60,18],[90,40,12],[250,70,20],[200,30,10],[280,150,14],[20,160,12]],['#ffd9a0','#ffb6c8','#fff1c8'])
        +'<path d="M0 240C60 210 120 250 180 230C230 215 270 235 300 220L300 390L0 390z" fill="#6a5160"/><path d="M0 290C70 270 130 305 200 285C250 272 280 290 300 282L300 390L0 390z" fill="#7a5f6e"/>'
        +'<g transform="rotate(14 150 280)"><rect x="60" y="215" width="190" height="130" rx="3" fill="#f3eadf"/>'+lines(78,240,150,7,14,'#7a6a6a')+'</g>'
        +'<g transform="rotate(-24 220 300)"><rect x="160" y="296" width="120" height="7" rx="3.500" fill="#cfd3dc"/><path d="M160 296l-14 3.500 14 3.500z" fill="#2a2430"/></g>');
    },
    note:function(u){
      return wrap(grad(u+'s',[[0,'#241a30'],[1,'#3a2a3c']])+blur(u,5),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/>'+bokeh(u,[[60,70,22,.6],[120,40,14],[200,90,26,.55],[270,50,16],[30,160,16],[240,170,18],[160,150,12],[100,120,10]],['#ffd9a0','#ffb6c8','#fff1c8','#ffcf9a'])
        +'<path d="M70 250L160 270L160 360L70 335z" fill="#e8dccd"/><path d="M160 270L270 235L270 322L160 360z" fill="#f1e7da"/><path d="M160 270L160 360" stroke="#b9a592" stroke-width="2"/>'
        +'<g transform="skewY(11) translate(0 -42)">'+lines(176,328,80,6,12,'#8a7a70')+'</g>'
        +'<g transform="skewY(-6) translate(0 20)">'+lines(88,268,60,5,12,'#8a7a70')+'</g>');
    },
    lantern:function(u){
      return wrap(grad(u+'s',[[0,'#241d4a'],[.55,'#9a4a6a'],[1,'#e9936f']])+grad(u+'g',[[0,'#ffd27a'],[1,'#e8864a']])+blur(u,6),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/>'+bokeh(u,[[50,90,12],[240,60,16],[270,150,10],[30,220,14]],['#ffd9a0','#ffb6c8'])
        +'<circle cx="150" cy="250" r="90" fill="#ffb25a" opacity=".25" filter="url(#'+u+'b)"/>'
        +'<path d="M120 150C120 110 180 110 180 150" stroke="#1b1320" stroke-width="5" fill="none"/><rect x="112" y="150" width="76" height="12" fill="#1b1320"/><rect x="118" y="162" width="64" height="130" fill="url(#'+u+'g)" opacity=".9"/>'
        +'<rect x="118" y="162" width="5" height="130" fill="#1b1320"/><rect x="177" y="162" width="5" height="130" fill="#1b1320"/><rect x="146" y="162" width="4" height="130" fill="#1b1320" opacity=".7"/><rect x="108" y="292" width="84" height="14" fill="#1b1320"/>'
        +'<rect x="140" y="238" width="20" height="54" rx="2" fill="#fbf0dc"/><ellipse cx="150" cy="222" rx="7" ry="16" fill="#fff2b8"/><rect x="0" y="330" width="300" height="60" fill="#241628"/>');
    },
    flowers:function(u){
      var f='';
      [[120,150,30],[175,125,36],[225,160,30],[150,200,28],[205,215,26],[100,210,22],[250,215,18]].forEach(function(p,i){f+=rose(p[0],p[1],p[2],i%2?'#e48aa8':'#f0a6bc','#fbd2de')});
      return wrap(grad(u+'s',[[0,'#c99aa6'],[1,'#5c4152']])+grad(u+'v',[[0,'#f5e8ee'],[1,'#c9b3c0']],'0 0 1 0')+blur(u,6),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/>'+bokeh(u,[[40,80,40,.5],[250,60,50,.45]],['#fff1e0'])
        +'<path d="M130 230L150 330M175 220L170 330M215 235L190 330" stroke="#4a7a52" stroke-width="4" fill="none"/>'+f
        +'<path d="M120 270C120 330 130 345 150 345H190C210 345 220 330 220 270z" fill="url(#'+u+'v)" opacity=".85"/><rect x="0" y="345" width="300" height="45" fill="#6a4f5c"/><rect x="40" y="352" width="110" height="18" rx="2" fill="#e9dccd"/>');
    },
    cake:function(u){
      return wrap(grad(u+'s',[[0,'#26162e'],[1,'#41263a']])+blur(u,5),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/>'+bokeh(u,[[50,80,16],[250,70,20],[270,190,12],[30,190,14],[200,50,10]],['#ffd9a0','#ff9fbf','#fff1c8'])
        +'<ellipse cx="150" cy="320" rx="110" ry="22" fill="#d9c9c0"/><rect x="70" y="240" width="160" height="75" rx="8" fill="#4a2a24"/><path d="M70 250C70 232 90 230 100 238C110 226 130 226 140 236C150 226 170 226 180 236C190 226 214 230 230 242L230 262C220 272 210 262 200 270C190 280 180 266 170 272C160 280 150 268 140 274C130 280 120 268 110 274C100 280 84 270 70 262z" fill="#f4b6c6"/>'
        +'<ellipse cx="150" cy="240" rx="80" ry="14" fill="#f7c9d6"/>'
        +[[110,200],[150,190],[190,202]].map(function(c){return '<rect x="'+(c[0]-3)+'" y="'+c[1]+'" width="6" height="42" fill="#fbe9ee"/><ellipse cx="'+c[0]+'" cy="'+(c[1]-9)+'" rx="5" ry="11" fill="#ffd45a"/><ellipse cx="'+c[0]+'" cy="'+(c[1]-8)+'" rx="2.500" ry="6" fill="#fff4c0"/>'}).join(''));
    },
    hands:function(u){
      return wrap(grad(u+'s',[[0,'#7a3b6a'],[.5,'#e46a6a'],[1,'#ffb56a']]),
        '<rect width="300" height="390" fill="url(#'+u+'s)"/><circle cx="150" cy="190" r="60" fill="#ffd9a0" opacity=".55"/>'
        +'<path fill-rule="evenodd" fill="#2a1424" d="M10 390L40 270C80 240 110 250 150 290C190 250 220 240 260 270L290 390zM150 282C118 250 96 232 96 206C96 184 120 178 150 206C180 178 204 184 204 206C204 232 182 250 150 282z"/>');
    }
  };
  window.FU=window.FU||{};
  window.FU.lscene=function(key){return (scenes[key]||scenes.couple)('l'+(uid++))};
  window.FU.lsceneKeys=Object.keys(scenes);
})();
