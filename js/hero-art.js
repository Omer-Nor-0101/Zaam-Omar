/* Hero artwork for Photos, Videos, Our Story and Places. The page sets <svg id="heroArt" data-art="...">. */
(function(){
  document.querySelectorAll('svg.hero-art[data-art]').forEach(function(svg){
  var kind=svg.getAttribute('data-art');
  var s='<defs><radialGradient id="ha-glow" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#ff8a6a" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient>'
    +'<filter id="ha-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>';
  s+='<ellipse cx="760" cy="400" rx="640" ry="120" fill="url(#ha-glow)"/>';
  function heart(x,y,sc,o){return '<path transform="translate('+x+' '+y+') scale('+sc+')" d="M0 8C-10 0 -10 -9 -4 -9c3 0 4 2 4 3 0-1 1-3 4-3 6 0 6 9-4 17z" fill="#ff6f9f" opacity="'+o+'" style="filter:drop-shadow(0 0 6px rgba(255,90,140,.9))"/>'}
  function lights(n,y0,span){var o='';for(var i=0;i<n;i++){var x=640+(i*137)%560,y=y0+((i*53)%span);o+='<circle cx="'+x+'" cy="'+y+'" r="'+(2+(i%4))+'" fill="'+(i%2?'#ffb86a':'#ffd9a0')+'" opacity="'+(.3+((i*17)%50)/100)+'" filter="url(#ha-blur)"/>'}return o}
  function polaroid(x,y,rot,c1,c2){return '<g transform="translate('+x+' '+y+') rotate('+rot+')"><rect x="-70" y="-80" width="140" height="170" rx="3" fill="#fbf4f0" opacity=".96"/><defs><linearGradient id="pg'+x+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs><rect x="-60" y="-70" width="120" height="120" fill="url(#pg'+x+')"/><circle cx="0" cy="-8" r="20" fill="#ffe0b0" opacity=".85"/><path d="M-60 50L-60 24C-30 6 30 6 60 24L60 50z" fill="#241830" opacity=".75"/></g>'}
  if(kind==='photos'||kind==='couple'){
    /* sunset over the sea, a couple seen from behind, distant mountains */
    s+='<circle cx="930" cy="250" r="120" fill="#ff9a6a" opacity=".28"/><circle cx="930" cy="250" r="34" fill="#ffe2b8"/>';
    s+='<path d="M860 270C940 150 1010 190 1070 235C1110 205 1160 195 1220 215L1220 300L860 300z" fill="#4a2c48" opacity=".75"/>';
    s+='<rect x="0" y="268" width="1200" height="152" fill="#5d3552" opacity=".55"/>';
    s+='<g stroke="#ffd2a0" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"><line x1="880" y1="282" x2="980" y2="282"/><line x1="895" y1="296" x2="965" y2="296"/><line x1="910" y1="312" x2="950" y2="312"/></g>';
    s+=lights(18,120,90);
    s+='<g transform="translate(585 95) scale(.9)"><path d="M10 380C12 250 70 170 140 160C210 170 250 250 252 380z" fill="#1d1423"/><circle cx="142" cy="112" r="44" fill="#1a111f"/><path d="M96 100C100 70 130 60 150 64C176 70 190 90 186 112" stroke="#6e4a58" stroke-width="2" fill="none" opacity=".6"/></g>';
    s+='<g transform="translate(668 112) scale(.9)"><path d="M70 380C78 270 130 205 190 196C250 206 296 270 300 380z" fill="#c9a89c"/><path d="M70 380C78 270 130 205 190 196C250 206 296 270 300 380z" fill="#1d1423" opacity=".4"/><path d="M118 92C118 40 262 40 262 104C282 170 276 230 258 300L214 300C228 230 206 168 190 140C150 150 124 150 118 92z" fill="#2b1a1c"/><circle cx="196" cy="108" r="40" fill="#3a2323"/></g>';
    s+=heart(1060,110,1.200,.5)+heart(1120,160,1,.4)+heart(1000,70,.9,.45);
  }else if(kind==='videos'){
    s+=lights(24,180,200);
    s+='<g transform="translate(900 230)"><circle r="92" fill="#d93a70" opacity=".22"/><circle r="68" fill="none" stroke="#ff8db0" stroke-width="2" style="filter:drop-shadow(0 0 12px rgba(255,100,150,.8))"/><path d="M-20 -32L40 0L-20 32z" fill="#fff"/></g>';
    var f='';for(var i=0;i<9;i++){f+='<rect x="'+(560+i*74)+'" y="340" width="52" height="44" rx="4" fill="#120a18" opacity=".7" stroke="#ff8db0" stroke-opacity=".35"/>';f+='<rect x="'+(570+i*74)+'" y="326" width="10" height="8" rx="2" fill="#ff8db0" opacity=".5"/>'}
    s+='<g transform="rotate(-4 900 360)">'+f+'</g>'+heart(1080,120,1.200,.9)+heart(740,110,.9,.8);
  }else if(kind==='story'){
    s+=lights(18,150,150);
    s+='<path d="M560 420C700 380 760 300 880 290C1000 280 1060 200 1200 170" stroke="#ffd9a0" stroke-opacity=".55" stroke-width="3" fill="none" stroke-dasharray="2 9" stroke-linecap="round"/>';
    [[700,360,1.2],[830,300,1],[960,278,1.3],[1090,205,1.5]].forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(9*p[2])+'" fill="#d93a70" opacity=".35"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#ff8db0"/>'});
    s+='<g transform="translate(1120 150)"><path d="M0 0C-26 -10 -26 -34 -10 -34c6 0 10 4 10 8 0-4 4-8 10-8 16 0 16 24-10 34z" fill="#ff6f9f" style="filter:drop-shadow(0 0 10px rgba(255,90,140,.9))"/></g>'+heart(760,230,1,.8);
  }else if(kind==='surprise'){
    s+=lights(22,120,220);
    [[760,150,'#ff6f9f'],[840,110,'#ffd9a0'],[930,160,'#ff8db0'],[1020,120,'#d93a70'],[1100,170,'#ffd1e0']].forEach(function(b){s+='<g><line x1="'+b[0]+'" y1="'+(b[1]+46)+'" x2="'+(b[0]-6)+'" y2="330" stroke="#ffd2a0" stroke-opacity=".5"/><ellipse cx="'+b[0]+'" cy="'+b[1]+'" rx="34" ry="42" fill="'+b[2]+'" opacity=".88" style="filter:drop-shadow(0 0 10px rgba(255,120,160,.6))"/></g>'});
    s+='<g transform="translate(900 300)"><rect x="-70" y="-10" width="140" height="100" rx="6" fill="#d93a70"/><rect x="-78" y="-34" width="156" height="30" rx="6" fill="#ff6f9f"/><rect x="-9" y="-34" width="18" height="124" fill="#ffd1e0"/><path d="M0 -34C-30 -70 -62 -40 -30 -34zM0 -34C30 -70 62 -40 30 -34z" fill="#ffd1e0"/></g>'+heart(700,260,1.4,.8)+heart(1130,90,1.2,.7);
  }else if(kind==='places'){
    s+='<g stroke="#ffb6cc" stroke-opacity=".28" fill="none" stroke-width="1.500"><path d="M560 380C700 330 800 360 900 300C1000 240 1100 270 1200 210"/><path d="M620 250C720 270 800 220 900 240S1100 180 1200 230"/><path d="M780 420L820 200L900 120"/><path d="M980 420L1010 260L1120 140"/></g>';
    [[820,215],[905,298],[1010,262],[1115,215],[730,330]].forEach(function(p,i){s+='<g transform="translate('+p[0]+' '+p[1]+')"><ellipse cx="0" cy="22" rx="10" ry="3.500" fill="#000" opacity=".3"/><path d="M0 22C-18 4 -18 -14 0 -14s18 18 0 36z" fill="'+(i%2?'#ff6f9f':'#d93a70')+'" style="filter:drop-shadow(0 0 8px rgba(255,90,140,.7))"/><circle cx="0" cy="-3" r="5" fill="#fff"/></g>'});
    s+=lights(14,160,160);
  }
  s+='<path d="M0 410C200 392 330 410 520 400C760 388 900 410 1200 392L1200 420L0 420z" fill="#1b1022" opacity=".85"/>';
  svg.innerHTML=s;
  });
})();
