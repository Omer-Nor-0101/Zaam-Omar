/* Login scene: stars, moon reflection, fireflies, gentle parallax, optional photo background, show/hide password. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS='http://www.w3.org/2000/svg';
  /* stars */
  var st='';for(var i=0;i<70;i++){var x=(i*173)%1600,y=(i*97)%470;st+='<circle cx="'+x+'" cy="'+y+'" r="'+(0.7+(i%3)*.5)+'" fill="#fff" opacity="'+(.3+(i%5)*.13)+'"/>'}
  document.getElementById('pStars').innerHTML=st;
  /* moon reflection on the lake */
  var rf='';for(i=0;i<9;i++){var w=150-i*13;rf+='<rect x="'+(1100-w/2)+'" y="'+(668+i*22)+'" width="'+w+'" height="6" rx="3" opacity="'+(.55-i*.05)+'" style="animation-delay:'+(i*.25)+'s"/>'}
  document.getElementById('reflect').innerHTML=rf;
  /* crop so the couple stays in view on narrow screens */
  var svg=document.getElementById('sceneSvg');
  function fit(){svg.setAttribute('viewBox',innerWidth<860?'820 180 640 720':'0 0 1600 900')}
  fit();addEventListener('resize',fit);
  /* parallax */
  var pars=[].slice.call(document.querySelectorAll('.par'));
  function move(nx,ny){pars.forEach(function(g){var d=+g.dataset.d;g.style.transform='translate('+(-nx*d)+'px,'+(-ny*d*.5)+'px)'})}
  if(!reduce){
    addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;move(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5)},{passive:true});
    addEventListener('deviceorientation',function(e){if(e.gamma==null)return;move(Math.max(-.5,Math.min(.5,e.gamma/60)),Math.max(-.5,Math.min(.5,((e.beta||0)-45)/90)))},{passive:true});
  }
  /* fireflies */
  var cv=document.getElementById('flies'),ctx=cv.getContext('2d'),W=0,H=0,dpr=Math.min(2,devicePixelRatio||1),F=[];
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    F=[];var n=Math.min(26,Math.round(W/60));for(var k=0;k<n;k++)F.push({x:Math.random()*W,y:H*.45+Math.random()*H*.5,r:1.2+Math.random()*2,a:Math.random()*6,s:.2+Math.random()*.5,p:Math.random()*6})}
  function draw(){
    ctx.clearRect(0,0,W,H);
    F.forEach(function(f){f.a+=.01+f.s*.01;f.p+=.03;f.x+=Math.cos(f.a)*f.s;f.y+=Math.sin(f.a*1.3)*f.s*.6;
      if(f.x<-10)f.x=W+10;if(f.x>W+10)f.x=-10;if(f.y<H*.3)f.y=H*.3;if(f.y>H+10)f.y=H*.4;
      var o=.25+.75*Math.abs(Math.sin(f.p));ctx.globalAlpha=o;ctx.shadowColor='#ffd9a0';ctx.shadowBlur=12;ctx.fillStyle='#ffe6b8';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.3);ctx.fill()});
    if(!reduce)requestAnimationFrame(draw);
  }
  size();draw();addEventListener('resize',function(){size();if(reduce)draw()});
  /* password eye */
  document.addEventListener('click',function(e){
    var b=e.target.closest('.eye');if(!b)return;
    var el=document.getElementById(b.dataset.for),show=el.type==='password';
    el.type=show?'text':'password';b.setAttribute('aria-pressed',show);b.setAttribute('aria-label',show?'Hide password':'Show password');
  });
  /* our own photo as the background (kept on this device) */
  var KEY='forever-us-loginbg',scene=document.getElementById('scene'),photo=document.getElementById('photo'),reset=document.getElementById('bgReset');
  function apply(u){if(u){photo.style.backgroundImage='url("'+u+'")';scene.classList.add('has-photo');reset.hidden=false}else{photo.style.backgroundImage='';scene.classList.remove('has-photo');reset.hidden=true}}
  try{apply(JSON.parse(localStorage.getItem(KEY)))}catch(e){}
  document.getElementById('bgFile').addEventListener('change',function(){
    var f=this.files&&this.files[0];this.value='';if(!f||!/^image\//.test(f.type))return;
    var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){
      var m=1600,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);var u=c.toDataURL('image/jpeg',.8);
      try{localStorage.setItem(KEY,JSON.stringify(u))}catch(e){}apply(u)};im.src=r.result};r.readAsDataURL(f);
  });
  reset.addEventListener('click',function(){try{localStorage.removeItem(KEY)}catch(e){}apply('')});
})();
