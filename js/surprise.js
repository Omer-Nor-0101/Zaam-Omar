/* Surprises: special days (birthdays, our anniversary, any date) with a heartfelt message.
   When the day arrives and the site is opened, a gift-opening screen shows the message.
   Loaded on every page. Data lives in this browser only. */
(function(){
  var FU=window.FU,esc=FU.esc,store=FU.store;
  var KEY='forever-us-surprises-v1',SEEN='forever-us-surprise-seen';
  var SP=FU.sp={};

  /* ---------- Message writer ---------- */
  var T={
    birthday:{
      romantic:['Happy birthday, {to}.\nThe day you were born, the world got a little warmer, and years later it led you to me.\nI love the way you laugh, the way you care, and the way you make an ordinary day feel like a gift.\nMay this year give you everything your heart asks for. I will be right beside you for all of it.','My dearest {to},\nToday the whole world celebrates you, but nobody is more thankful than I am.\nYou are my calm, my joy and my favorite person to come home to.\nHappy birthday, my love. Here is to another year of us.'],
      sweet:['Happy birthday, {to}!\nYou make every day brighter just by being in it.\nThank you for every smile, every hug and every little thing you do that you never notice.\nI hope today is as wonderful as you are.','Happy birthday, my favorite person!\nI wish you cake, laughter and every good thing you deserve.\nI am so lucky it is you I get to celebrate.'],
      poetic:['{to},\nIf I could gather every sunrise and tie it with a ribbon, I would still not have a gift as bright as you.\nOne more year of you is one more verse in the best poem I have ever read.\nHappy birthday, my heart.','On the day you arrived, the stars leaned a little closer.\nI have been grateful ever since.\nHappy birthday, {to}. You are my favorite chapter.']
    },
    anniversary:{
      romantic:['Happy anniversary, {to}.\n{yearsLine}\nEvery day with you has been my favorite day. You turned plain moments into memories I will keep forever.\nI would choose you again in every lifetime.','My love,\n{yearsLine}\nThank you for staying, for laughing with me, for holding my hand when things got hard.\nWith you I found home. I love you more today than yesterday.'],
      sweet:['Happy anniversary, {to}!\n{yearsLine}\nI am so happy we found each other. You are my best friend, my partner and my favorite hello.\nHere is to many more adventures together.','Another day to celebrate us!\n{yearsLine}\nThank you for making me smile every single day. I love you so much.'],
      poetic:['{yearsLine}\nTwo paths became one road, and every step since has been a song.\nYou are the page I never want to turn, {to}.\nHappy anniversary, my forever.','Like the moon that loves the sea, I keep coming back to you.\n{yearsLine}\nHappy anniversary, my love.']
    },
    custom:{
      romantic:['Dear {to},\nI wanted today to be a little more special, because you are special to me every day.\nThank you for loving me exactly as I am. You are my heart, my home and my forever.','My love,\nNo reason is needed to tell you this, but today is a good one:\nI love you, I am proud of you, and I am so grateful you are mine.'],
      sweet:['Hey {to},\nJust a little surprise to make you smile.\nYou are wonderful, and I am so lucky to have you. Hope today is full of good things!','A little hello from my heart to yours.\nYou make my life so much better, {to}. Thank you for being you.'],
      poetic:['{to},\nIf love were a language, you would be every word I know.\nToday I wrote this just to say: you are my favorite everything.','In a world of ordinary days, you are the one that glows.\nThis little note is my way of saying thank you for being my light.']
    }
  };
  var counter={};
  SP.compose=function(kind,tone,v){
    var set=(T[kind]||T.custom)[tone]||T[kind||'custom'].romantic;
    var k=kind+tone;counter[k]=((counter[k]||0)+1)%set.length;
    var years=v.years>0?(v.years+(v.years===1?' year':' years')+' of us'):'';
    var yl=v.years>0?('It has been '+v.years+(v.years===1?' year':' years')+' since we began, and my heart still skips for you.'):'Today we celebrate the day our story began.';
    return set[counter[k]].replace(/\{to\}/g,v.to||'my love').replace(/\{yearsLine\}/g,yl).replace(/\{years\}/g,years);
  };

  /* ---------- Data ---------- */
  SP.load=function(){
    var v=store.get(KEY,null);
    if(Array.isArray(v))return v;
    return [{id:'anniv',kind:'anniversary',auto:true,title:'Our Anniversary',to:'my love',message:''}];
  };
  SP.save=function(l){return store.set(KEY,l)};
  SP.dateOf=function(o){return o.auto?(FU.startIsSample()?'':FU.startDate()):o.date};
  function parts(s){var p=s.split('-');return {y:+p[0],m:+p[1],d:+p[2]}}
  function midnight(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function onDate(y,p){var leap=(y%4===0&&y%100!==0)||y%400===0;return (p.m===2&&p.d===29&&!leap)?new Date(y,1,28):new Date(y,p.m-1,p.d)}
  SP.daysUntil=function(o){
    var s=SP.dateOf(o);if(!s)return null;
    var p=parts(s),now=midnight(new Date()),t=onDate(now.getFullYear(),p);
    if(t<now)t=onDate(now.getFullYear()+1,p);
    return Math.round((t-now)/864e5);
  };
  SP.yearsOf=function(o){
    var s=SP.dateOf(o);if(!s)return 0;
    var p=parts(s),now=new Date(),n=now.getFullYear()-p.y;
    return Math.max(0,n);
  };
  SP.defaultMessage=function(o){return SP.compose(o.kind==='birthday'||o.kind==='anniversary'?o.kind:'custom','romantic',{to:o.to,years:SP.yearsOf(o)})};
  var LABEL={birthday:'Happy Birthday',anniversary:'Happy Anniversary',custom:'A Surprise For You',milestone:'A Milestone Together'};
  SP.label=function(o){return LABEL[o.kind]||LABEL.custom};

  /* ---------- Overlay ---------- */
  var css=document.createElement('link');css.rel='stylesheet';css.href='css/surprise.css';document.head.appendChild(css);
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf=0,ov=null,lastFocus=null;

  function burst(canvas,mode){
    var ctx=canvas.getContext('2d'),W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1),P=[];
    function size(){W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
    size();window.addEventListener('resize',size);
    var cols=['#ff6f9f','#ff8db0','#ffd1e0','#ffd9a0','#ffffff','#d93a70'];
    function make(top){return {x:Math.random()*W,y:top?-20-Math.random()*H:H+20,r:6+Math.random()*14,vy:(top?1:-1)*(0.6+Math.random()*1.6),vx:(Math.random()-.5)*.8,rot:Math.random()*6,vr:(Math.random()-.5)*.04,c:cols[(Math.random()*cols.length)|0],kind:Math.random()<.65?'h':'c',o:.5+Math.random()*.5,ph:Math.random()*6}}
    var n=Math.min(70,Math.round(W/16));
    for(var i=0;i<n;i++){var q=make(mode==='fall');q.y=Math.random()*H;P.push(q)}
    function heart(x,y,s,rot,c,o){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s/10,s/10);ctx.globalAlpha=o;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-12,-1,-8,-11,0,-5);ctx.bezierCurveTo(8,-11,12,-1,0,8);ctx.fill();ctx.restore()}
    function frame(){
      ctx.clearRect(0,0,W,H);
      P.forEach(function(p){
        p.y+=p.vy;p.x+=p.vx+Math.sin(p.ph+=.02)*.4;p.rot+=p.vr;
        if(p.vy>0&&p.y>H+30){p.y=-30;p.x=Math.random()*W}
        if(p.vy<0&&p.y<-30){p.y=H+30;p.x=Math.random()*W}
        if(p.kind==='h')heart(p.x,p.y,p.r,p.rot*.3,p.c,p.o);
        else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.o;ctx.fillStyle=p.c;ctx.fillRect(-3,-5,6,10);ctx.restore()}
      });
      raf=requestAnimationFrame(frame);
    }
    if(reduce){frame();cancelAnimationFrame(raf)}else frame();
    return function(){cancelAnimationFrame(raf);window.removeEventListener('resize',size)};
  }

  var stopFx=null;
  SP.close=function(){
    if(!ov)return;
    if(stopFx)stopFx();stopFx=null;
    ov.classList.remove('in');
    var o=ov;ov=null;document.removeEventListener('keydown',onKey);
    setTimeout(function(){o.remove()},350);
    if(lastFocus&&lastFocus.focus)lastFocus.focus();
  };
  function onKey(e){if(e.key==='Escape')SP.close()}

  SP.show=function(o){
    if(ov)SP.close();
    lastFocus=document.activeElement;
    var years=SP.yearsOf(o),from=o.by||FU.user()||'';
    var msg=(o.message&&o.message.trim())||SP.defaultMessage(o);
    var paras=msg.split(/\n+/).map(function(l){return l.trim()}).filter(Boolean);
    var big=o.kind==='anniversary'&&years>0?'<div class="sp-years"><b>'+years+'</b><span>'+(years===1?'year':'years')+' of us</span></div>':(o.kind==='birthday'&&years>0?'<div class="sp-years"><b>'+years+'</b><span>today</span></div>':'');
    ov=document.createElement('div');ov.className='sp';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',SP.label(o));
    ov.innerHTML='<canvas class="sp-fx" aria-hidden="true"></canvas>'
      +'<div class="sp-stage sp-gift">'
        +'<button type="button" class="sp-env" id="spOpen" aria-label="Open your surprise">'
          +'<svg viewBox="0 0 200 150" width="260" aria-hidden="true"><defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1e0"/><stop offset="1" stop-color="#ff8db0"/></linearGradient></defs>'
          +'<rect x="10" y="30" width="180" height="110" rx="10" fill="url(#spg)"/><path d="M10 40l90 60 90-60" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/><path class="sp-flap" d="M10 32L100 96 190 32z" fill="#ff6f9f" opacity=".9"/>'
          +'<path class="sp-seal" d="M100 118C84 106 78 98 78 90c0-6 5-11 11-11 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 11 0 8-6 16-22 28z" fill="#d93a70" transform="translate(0 -22)"/></svg>'
        +'</button>'
        +'<p class="sp-hint">A surprise is waiting for you</p>'
        +'<button type="button" class="sp-btn" id="spOpen2">Open with love <span aria-hidden="true">&#9829;</span></button>'
      +'</div>'
      +'<article class="sp-card" hidden>'
        +'<p class="sp-eyebrow">'+esc(SP.label(o)).toUpperCase()+' <span>&#9829;</span></p>'
        +'<h2 class="sp-to">'+esc(o.to||'My love')+'</h2>'+big
        +'<div class="sp-body">'+paras.map(function(p,i){return '<p style="--i:'+i+'">'+esc(p)+'</p>'}).join('')+'</div>'
        +(from?'<p class="sp-sign" style="--i:'+paras.length+'">With all my love,<br><b>'+esc(from)+'</b> <span>&#9829;</span></p>':'')
        +'<div class="sp-actions"><button type="button" class="sp-btn ghost" id="spAgain">More hearts</button><button type="button" class="sp-btn" id="spClose">Close</button></div>'
      +'</article>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ov.classList.add('in')});
    var canvas=ov.querySelector('canvas');stopFx=burst(canvas,'rise');
    function openIt(){
      ov.querySelector('.sp-gift').hidden=true;ov.querySelector('.sp-card').hidden=false;ov.classList.add('open');
      if(stopFx)stopFx();stopFx=burst(canvas,'fall');ov.querySelector('#spClose').focus();
    }
    ov.querySelector('#spOpen').addEventListener('click',openIt);
    ov.querySelector('#spOpen2').addEventListener('click',openIt);
    ov.querySelector('#spClose').addEventListener('click',SP.close);
    ov.querySelector('#spAgain').addEventListener('click',function(){if(stopFx)stopFx();stopFx=burst(canvas,'fall')});
    document.addEventListener('keydown',onKey);
    ov.querySelector('#spOpen2').focus();
  };

  /* ---------- Auto-show on the day ---------- */
  function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
  SP.dueToday=function(){return SP.load().filter(function(o){return SP.daysUntil(o)===0})};
  function check(){
    if(document.body.getAttribute('data-page')==='login'||!FU.store.get('forever-us-session',''))return;
    var seen=store.get(SEEN,{})||{},t=today(),due=SP.dueToday().filter(function(o){return seen[o.id]!==t});
    if(!due.length)return;
    var o=due[0];seen[o.id]=t;store.set(SEEN,seen);
    setTimeout(function(){SP.show(o)},600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check);else check();
})();
