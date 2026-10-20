/* Letters hero artwork: dusk horizon, bokeh, envelope with heart seal, roses and a candle lantern. */
(function(document){
  var s='<defs>'
    +'<radialGradient id="lh-glow" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#ff8a6a" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient>'
    +'<radialGradient id="lh-flame" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>'
    +'<linearGradient id="lh-env" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c9b9"/><stop offset="1" stop-color="#b98f86"/></linearGradient>'
    +'<filter id="lh-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>'
    +'</defs>';
  s+='<ellipse cx="700" cy="250" rx="620" ry="110" fill="url(#lh-glow)"/>';
  s+='<path d="M0 262C200 252 380 268 560 258C760 246 900 262 1280 250L1280 330L0 330z" fill="#2a1a28" opacity=".85"/>';
  var b='';
  var pts=[[420,242,5],[470,238,7],[510,246,4],[560,236,5],[385,250,4],[600,244,3],[340,256,3]];
  pts.forEach(function(p,i){b+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+(i%2?'#ffb86a':'#ffd9a0')+'" opacity=".85" filter="url(#lh-blur)"/>'});
  for(var i=0;i<26;i++){var x=(i*173)%700,y=215+((i*41)%55);b+='<circle cx="'+x+'" cy="'+y+'" r="'+(1.5+(i%3))+'" fill="#ffd9a0" opacity="'+(.25+((i*17)%40)/100)+'"/>'}
  s+=b;
  /* sand / blanket on the right */
  s+='<path d="M640 330C700 292 820 276 960 280C1080 276 1200 268 1280 262L1280 330z" fill="#3a2a2c"/><path d="M700 330C780 306 900 296 1010 302C1110 296 1200 290 1280 286L1280 330z" fill="#4a3634"/>';
  /* envelope */
  s+='<g transform="translate(0 4)"><path d="M632 266L776 212L944 246L800 312z" fill="url(#lh-env)"/><path d="M632 266L800 312L944 246" fill="none" stroke="#8f6a62" stroke-width="1.500"/><path d="M632 266L788 264L944 246" fill="none" stroke="#8f6a62" stroke-width="1" opacity=".6"/>'
    +'<path d="M776 212L788 262L944 246z" fill="#d7b3a5" opacity=".6"/>'
    +'<path d="M772 266c-12-8-14-18-8-23 6-5 12-2 16 3 4-5 10-8 16-3 6 5 4 15-8 23-6 4-11 4-16 0z" fill="#e0527f"/></g>';
  /* roses */
  function rose(x,y,r,c1,c2){return '<g><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c1+'"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.7)+'" fill="'+c2+'"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.42)+'" fill="'+c1+'"/><path d="M'+(x-r*.28)+' '+y+'a'+(r*.28)+' '+(r*.28)+' 0 0 1 '+(r*.56)+' 0" stroke="'+c2+'" stroke-width="'+(r*.09)+'" fill="none"/></g>'}
  s+='<ellipse cx="880" cy="200" rx="60" ry="14" fill="#2c4a34" opacity=".9"/>';
  [[826,180,30,'#7a2a3c','#a8445a'],[876,142,34,'#8a2f44','#b94c64'],[928,186,36,'#8f3045','#c0546b'],[868,205,26,'#6e2538','#9a3d52'],[958,150,22,'#7a2a3c','#a8445a'],[812,214,20,'#6e2538','#9a3d52']].forEach(function(p){s+=rose(p[0],p[1],p[2],p[3],p[4])});
  /* lantern */
  s+='<circle cx="1030" cy="150" r="120" fill="url(#lh-flame)" opacity=".5"/>';
  s+='<rect x="1006" y="0" width="14" height="30" fill="#17111c"/><path d="M968 52L1090 52L1070 30L988 30z" fill="#17111c"/><rect x="974" y="52" width="110" height="10" fill="#17111c"/>';
  s+='<rect x="982" y="62" width="94" height="170" fill="#ffb86a" opacity=".22"/><rect x="982" y="62" width="6" height="170" fill="#17111c"/><rect x="1070" y="62" width="6" height="170" fill="#17111c"/><rect x="1024" y="62" width="4" height="170" fill="#17111c" opacity=".8"/><rect x="974" y="232" width="110" height="16" fill="#17111c"/>';
  s+='<rect x="1002" y="150" width="54" height="82" rx="3" fill="#f6e3c4"/><ellipse cx="1029" cy="136" rx="9" ry="20" fill="#ffe08a"/><ellipse cx="1029" cy="140" rx="4" ry="11" fill="#fff6d0"/>';
  /* floating hearts */
  function heart(x,y,sc,o){return '<path transform="translate('+x+' '+y+') scale('+sc+')" d="M0 8C-10 0 -10 -9 -4 -9c3 0 4 2 4 3 0-1 1-3 4-3 6 0 6 9-4 17z" fill="#ff6f9f" opacity="'+o+'" style="filter:drop-shadow(0 0 6px rgba(255,90,140,.9))"/>'}
  s+=heart(772,106,1.1,.95)+heart(840,114,1.4,.9)+heart(808,92,.6,.8)+heart(818,86,.45,.7);
  document.getElementById('heroArt').innerHTML=s;
})(window.FU.scope('letters'));