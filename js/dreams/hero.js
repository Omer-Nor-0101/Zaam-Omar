/* Twilight hero artwork: city lights, balloons and the couple silhouette. */
/* Hero art */
  (function(document){
    var u='h',s='';
    var lights='';
    for(var i=0;i<130;i++){var x=(i*97)%1200,y=430+((i*53)%90),r=1+((i*7)%3),c=['#ffd9a0','#ff9fc0','#fff2c8'][i%3];lights+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" opacity="'+(.35+((i*13)%50)/100)+'"/>'}
    function balloon(x,y,sc,c){return '<g transform="translate('+x+' '+y+') scale('+sc+')"><ellipse cx="0" cy="0" rx="22" ry="28" fill="'+c+'"/><path d="M-22 4L-8 42M22 4L8 42" stroke="#2a1830" stroke-width="1"/><rect x="-7" y="42" width="14" height="9" fill="#2a1830"/></g>'}
    s+='<defs><radialGradient id="hg" cx="68%" cy="60%" r="45%"><stop offset="0" stop-color="#ff8a6a" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient></defs>';
    s+='<rect width="1200" height="520" fill="url(#hg)"/>'+lights;
    s+='<path d="M0 470C200 440 330 470 520 450C760 425 900 470 1200 440L1200 520L0 520z" fill="#1b1022" opacity=".9"/>';
    s+=balloon(720,120,1,'#7a3b52')+balloon(1010,80,.5,'#6b3a5a')+balloon(860,150,.4,'#8a4a5a')+balloon(565,60,.45,'#5b3560');
    s+='<g transform="translate(560 140) scale(1.100)"><path d="M10 380C12 250 70 170 140 160C210 170 250 250 252 380z" fill="#1d1423"/><circle cx="142" cy="112" r="44" fill="#1a111f"/><path d="M96 100C100 70 130 60 150 64C176 70 190 90 186 112" stroke="#6e4a58" stroke-width="2" fill="none" opacity=".6"/></g>';
    s+='<g transform="translate(650 160) scale(1.100)"><path d="M70 380C78 270 130 205 190 196C250 206 296 270 300 380z" fill="#c9a89c"/><path d="M70 380C78 270 130 205 190 196C250 206 296 270 300 380z" fill="#1d1423" opacity=".35"/><path d="M118 92C118 40 262 40 262 104C282 170 276 230 258 300L214 300C228 230 206 168 190 140C150 150 124 150 118 92z" fill="#2b1a1c"/><circle cx="196" cy="108" r="40" fill="#3a2323"/><path d="M160 80C170 60 220 60 236 90" stroke="#a06a5e" stroke-width="2" fill="none" opacity=".7"/></g>';
    document.getElementById('heroArt').innerHTML=s;
  })(window.FU.scope('dreams'));