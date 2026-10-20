/* Shared behavior on every page: navigation, Login, toast, footer, saved values and the "days together" counter. */
(function(){
  var FU=window.FU=window.FU||{};
  var $=function(id){return document.getElementById(id)};
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  FU.esc=esc;

  /* One page, many sections: each section's script sees only its own elements (ids repeat between sections). */
  FU.scope=function(secId){
    var root=document.getElementById(secId);
    return new Proxy(document,{
      get:function(t,p){
        if(p==='getElementById')return function(i){return root.querySelector('[id="'+i+'"]')||t.getElementById(i)};
        if(p==='querySelector')return function(s){return root.querySelector(s)||t.querySelector(s)};
        if(p==='querySelectorAll')return function(s){var r=root.querySelectorAll(s);return r.length?r:t.querySelectorAll(s)};
        var v=t[p];return typeof v==='function'?v.bind(t):v;
      },
      set:function(t,p,v){t[p]=v;return true}
    });
  };

  /* ---------- Saved values (per browser) ---------- */
  FU.store={
    get:function(k,fallback){try{var r=localStorage.getItem(k);return r===null?fallback:JSON.parse(r)}catch(e){return fallback}},
    set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},
    remove:function(k){try{localStorage.removeItem(k)}catch(e){}}
  };

  /* ---------- Start gate: you must log in or register first ---------- */
  (function(){
    if(document.body.getAttribute('data-page')==='login')return;
    if(!FU.store.get('forever-us-session','')){var f=location.pathname.split('/').pop();location.replace('login.html'+(f&&f!=='index.html'?'?next='+encodeURIComponent(f):''))}
  })();

  /* ---------- Toast ---------- */
  var timer;
  FU.toast=function(msg){
    var t=$('toast');
    if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');
    clearTimeout(timer);timer=setTimeout(function(){t.classList.remove('show')},2600);
  };

  /* ---------- Art: picks the right scene set ---------- */
  FU.art=function(key){
    if(FU.xsceneKeys&&FU.xsceneKeys.indexOf(key)>-1)return FU.xscene(key);
    if(FU.lsceneKeys&&FU.lsceneKeys.indexOf(key)>-1)return FU.lscene(key);
    return FU.scene(key);
  };

  /* ---------- Dialog helpers ---------- */
  FU.open=function(d){if(d.showModal)d.showModal();else d.setAttribute('open','')};
  FU.close=function(d){if(d.close)d.close();else d.removeAttribute('open')};
  FU.backdropClose=function(d){d.addEventListener('click',function(e){if(e.target===d)FU.close(d)})};

  /* ---------- Navigation ---------- */
  var PAGES=[['home','Home','#home'],['photos','Photos','#photos'],['videos','Videos','#videos'],['story','Our Story','#story'],['places','Places','#places'],['dreams','Future Dreams','#dreams'],['letters','Letters','#letters'],['surprises','Surprises','#surprises']];
  var current=document.body.getAttribute('data-page');
  var nav=$('siteNav');
  if(nav){
    nav.innerHTML='<a class="logo" href="#home" aria-label="Omar &amp; Zaam home">'
      +'<svg width="38" height="34" viewBox="0 0 24 22" fill="none" stroke="#ff6f9f" stroke-width="1.6"><path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/></svg>'
      +'<span><b>Omar &amp; Zaam</b><small>Our Love Story <span style="color:#ff6f9f">&#9829;</span></small></span></a>'
      +'<div class="nav-links">'+PAGES.map(function(p){return '<a href="'+p[2]+'"'+(p[0]===current?' aria-current="page"':'')+'>'+p[1]+'</a>'}).join('')+'</div>'
      +'<button class="login" id="login" type="button"></button>'
      +'<button class="nav-toggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>';
    nav.querySelector('.nav-links').id='navLinks';
    (function(){
      var t=nav.querySelector('#navToggle');
      function set(o){nav.classList.toggle('open',o);t.setAttribute('aria-expanded',o);t.setAttribute('aria-label',o?'Close menu':'Open menu')}
      t.addEventListener('click',function(e){e.stopPropagation();set(!nav.classList.contains('open'))});
      nav.addEventListener('click',function(e){if(e.target.closest('.nav-links a'))set(false)});
      document.addEventListener('click',function(e){if(!nav.contains(e.target))set(false)});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){set(false);t.focus()}});
      window.addEventListener('resize',function(){if(window.innerWidth>1100)set(false)});
    })();
    /* Scrollspy: the link of the section you are in is highlighted */
    (function(){
      var ids=PAGES.map(function(p){return p[0]}),links=nav.querySelectorAll('.nav-links a'),cur='',tick=false;
      function mark(){
        tick=false;
        var line=(nav.classList.contains('stuck')?nav.offsetHeight:80)+Math.min(160,innerHeight*.25),pick=ids[0];
        ids.forEach(function(id){var el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=line)pick=id});
        if(innerHeight+(window.pageYOffset||0)>=document.documentElement.scrollHeight-4)pick=ids[ids.length-1];
        if(pick===cur)return;cur=pick;
        links.forEach(function(a){if(a.getAttribute('href')==='#'+pick)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
      }
      function req(){if(!tick){tick=true;requestAnimationFrame(mark)}}
      window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',req);window.addEventListener('load',req);mark();
    })();
    /* Nav stays on screen while you scroll */
    (function(){
      var ph=document.createElement('div');ph.className='nav-ph';nav.parentNode.insertBefore(ph,nav);
      var stuck=false,tick=false,root=document.documentElement;
      function upd(){
        tick=false;
        var h=stuck?ph.offsetHeight:nav.offsetHeight,y=window.pageYOffset||root.scrollTop;
        var want=y>h;
        if(want&&!stuck){ph.style.height=nav.offsetHeight+'px';nav.classList.add('stuck');stuck=true}
        else if(!want&&stuck){nav.classList.remove('stuck');ph.style.height='';stuck=false}
        root.style.setProperty('--navh',stuck?nav.offsetHeight+'px':'0px');
      }
      function req(){if(!tick){tick=true;requestAnimationFrame(upd)}}
      window.addEventListener('scroll',req,{passive:true});
      window.addEventListener('resize',function(){if(stuck)ph.style.height=nav.offsetHeight+'px';req()});
      upd();
    })();
  }

  /* ---------- Account button: shows who is logged in, and Sign out ---------- */
  FU.user=function(){return FU.store.get('forever-us-user','')};
  /* Who published an item: set when it is created, shown as a "Published by" badge. Sample entries have no publisher. */
  FU.stamp=function(rec){rec.by=FU.user()||'Someone';rec.byEmail=FU.email();rec.byAt=new Date().toISOString().slice(0,10);return rec};
  /* Ownership: only the account that published an item can change or delete it. Sample entries (no publisher) are open to everyone. */
  FU.canEdit=function(it){if(!it||!it.by)return true;if(it.byEmail)return it.byEmail===FU.email();return it.by===FU.user()};
  FU.denied=function(it){FU.toast('Only '+(it&&it.by||'the person who added it')+' can change or delete this')};
  /* Turns a form into a read-only view for everyone but the owner. */
  FU.lockForm=function(form,locked,it){
    var note=form.querySelector('.lock-note');
    form.querySelectorAll('input,select,textarea').forEach(function(el){el.disabled=locked});
    form.querySelectorAll('.primary,.danger,[data-owner]').forEach(function(el){
      if(locked){if(el.dataset.h===undefined)el.dataset.h=el.hidden?'1':'0';el.hidden=true}
      else if(el.dataset.h!==undefined){el.hidden=el.dataset.h==='1';delete el.dataset.h}
    });
    if(locked){
      if(!note){note=document.createElement('p');note.className='lock-note';form.insertBefore(note,form.children[1]||null)}
      note.textContent='Added by '+it.by+'. Only '+it.by+' can change or delete it. You can read it here.';note.hidden=false;
    }else if(note)note.hidden=true;
  };
  FU.byline=function(it,cls){return it&&it.by?'<span class="by '+(cls||'')+'"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/></svg>Published by <b>'+esc(it.by)+'</b></span>':''};
  FU.email=function(){return FU.store.get('forever-us-session','')};
  /* Profile photo: stored per account on this device, shrunk to a small square. */
  FU.avatar=function(){var m=FU.store.get('forever-us-avatars',{})||{};return m[FU.email()]||''};
  function setAvatar(url){var m=FU.store.get('forever-us-avatars',{})||{};if(url)m[FU.email()]=url;else delete m[FU.email()];return FU.store.set('forever-us-avatars',m)}
  FU.avatarHtml=function(name,pic,big){
    var ini=esc((name||'?').trim().charAt(0).toUpperCase()||'?');
    return '<span class="av'+(big?' big':'')+'" aria-hidden="true">'+(pic?'<img alt="" src="'+pic+'">':'<b>'+ini+'</b>')+'<i class="dot"></i></span>';
  };
  function paintLogin(){
    var b=$('login');if(!b)return;
    var u=FU.user();
    b.className='login on';
    b.setAttribute('aria-label','Your profile: '+(u||'you')+', active now');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');
    b.innerHTML=FU.avatarHtml(u,FU.avatar())+'<span class="nm">'+esc(u||'You')+'</span>';
    var w=$('welcome');if(w)w.innerHTML=FU.avatarHtml(u,FU.avatar(),true)+'<span class="w-t"><small>Welcome back</small><b>'+esc(u||'you')+'</b><em><i class="dot inline"></i>Active now</em></span>';
    document.querySelectorAll('[data-greet]').forEach(function(el){el.textContent=u?('Welcome back, '+u):'Welcome to our little world'});
  }
  /* ---------- Profile card (opens under the avatar button) ---------- */
  var PUB_KEYS=['forever-us-photos-v2','forever-us-videos-v2','forever-us-places-v1','forever-us-story-v2','forever-us-dreams-v1','forever-us-letters-v1','forever-us-surprises-v1'];
  function myAccount(){var l=FU.store.get('forever-us-accounts',[])||[],k=FU.email();return l.filter(function(a){return (a.key||a.email)===k})[0]}
  function countMine(){
    var n=0,me=FU.email(),nm=FU.user();
    PUB_KEYS.forEach(function(k){var v=FU.store.get(k,null);if(Array.isArray(v))v.forEach(function(it){if(it&&it.by&&(it.byEmail?it.byEmail===me:it.by===nm))n++})});
    return n;
  }
  var pf=document.createElement('div');pf.className='pf';pf.id='pf';pf.hidden=true;pf.setAttribute('role','dialog');pf.setAttribute('aria-label','Your profile');
  pf.innerHTML='<div class="pf-cover" aria-hidden="true"></div><div class="pf-av" id="acAv"></div>'
    +'<div class="pf-body"><h3 id="acName"></h3><p class="pf-id" id="acId"></p><span class="active-pill"><i class="dot inline"></i>Active now</span>'
    +'<div class="pf-stats"><div><b id="pfDays">0</b><span>Days together</span></div><div><b id="pfPub">0</b><span>Published by me</span></div><div><b id="pfJoin">-</b><span>Joined</span></div></div>'
    +'<form class="pf-edit" id="pfEdit" hidden><label for="pfNameIn" class="pf-l">Your name</label><div><input id="pfNameIn" maxlength="24" autocomplete="given-name"><button type="submit">Save</button></div></form>'
    +'<div class="pf-actions"><label class="btn-pic" for="acFile">Change photo<input id="acFile" type="file" accept="image/*" hidden></label><button type="button" id="pfRename">Edit name</button><button type="button" id="acRemove">Remove photo</button></div>'
    +'<button type="button" class="pf-out" id="lgOut">Sign out</button><p class="pf-hint">Your photo and name are saved on the server.</p></div>';
  document.body.appendChild(pf);
  function paintPf(){
    var pic=FU.avatar(),t=FU.together&&FU.together(),acc=myAccount();
    $('acAv').innerHTML=FU.avatarHtml(FU.user(),pic,true);
    $('acName').textContent=FU.user()||'You';$('acId').textContent=FU.email().replace(/^@/,'');
    $('acRemove').hidden=!pic;
    $('pfDays').textContent=t&&!FU.startIsSample()?t.total.toLocaleString():'-';
    $('pfPub').textContent=countMine();
    $('pfJoin').textContent=acc&&acc.created?new Date(acc.created+'T00:00:00').toLocaleDateString(undefined,{month:'short',year:'numeric'}):'-';
  }
  function placePf(){
    var b=$('login').getBoundingClientRect(),w=Math.min(360,innerWidth-24);
    pf.style.position='fixed';pf.style.width=w+'px';pf.style.top=(b.bottom+10)+'px';
    pf.style.left=Math.max(12,Math.min(innerWidth-w-12,b.right-w))+'px';
  }
  function openPf(){paintPf();$('pfEdit').hidden=true;pf.hidden=false;placePf();$('login').setAttribute('aria-expanded','true')}
  function closePf(){pf.hidden=true;var l=$('login');if(l)l.setAttribute('aria-expanded','false')}
  document.addEventListener('click',function(e){
    var path=e.composedPath?e.composedPath():[];
    if(path.indexOf($('login'))>-1){e.preventDefault();pf.hidden?openPf():closePf();return}
    if(!pf.hidden&&path.indexOf(pf)<0)closePf();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pf.hidden){closePf();var l=$('login');if(l)l.focus()}});
  addEventListener('resize',function(){if(!pf.hidden)placePf()});
  addEventListener('scroll',function(){if(!pf.hidden)placePf()},{passive:true});
  function shrinkPic(file){
    return new Promise(function(res,rej){
      var r=new FileReader();r.onerror=rej;
      r.onload=function(){var im=new Image();im.onerror=rej;im.onload=function(){
        var n=192,c=document.createElement('canvas');c.width=c.height=n;var x=c.getContext('2d');
        var m=Math.min(im.width,im.height),sx=(im.width-m)/2,sy=(im.height-m)/2;
        x.drawImage(im,sx,sy,m,m,0,0,n,n);res(c.toDataURL('image/jpeg',.85));
      };im.src=r.result};r.readAsDataURL(file);
    });
  }
  $('acFile').addEventListener('change',function(){
    var f=this.files&&this.files[0];this.value='';if(!f)return;
    if(!/^image\//.test(f.type)){FU.toast('Please choose a picture');return}
    shrinkPic(f).then(function(u){if(!setAvatar(u)){FU.toast('Could not save the photo, storage is full');return}paintPf();paintLogin();FU.toast('Profile photo saved')}).catch(function(){FU.toast('That picture could not be read')});
  });
  $('acRemove').addEventListener('click',function(){setAvatar('');paintPf();paintLogin();FU.toast('Photo removed')});
  $('pfRename').addEventListener('click',function(){var f=$('pfEdit');f.hidden=!f.hidden;if(!f.hidden){$('pfNameIn').value=FU.user();$('pfNameIn').focus()}});
  $('pfEdit').addEventListener('submit',function(e){
    e.preventDefault();var n=$('pfNameIn').value.trim();if(!n){$('pfNameIn').focus();return}
    FU.store.set('forever-us-user',n);
    var l=FU.store.get('forever-us-accounts',[])||[],k=FU.email();l.forEach(function(a){if((a.key||a.email)===k)a.name=n});FU.store.set('forever-us-accounts',l);
    $('pfEdit').hidden=true;paintPf();paintLogin();FU.toast('Name saved');
  });
  $('lgOut').addEventListener('click',function(){FU.store.remove('forever-us-session');FU.store.remove('forever-us-user');FU.store.remove('forever-us-token');location.replace('login.html')});
  paintLogin();

  /* ---------- Days together ---------- */
  var SAMPLE_START='2024-06-20';
  FU.startDate=function(){var v=FU.store.get('forever-us-start',null);return v||SAMPLE_START};
  FU.startIsSample=function(){return !FU.store.get('forever-us-start',null)};
  function parse(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2])}
  FU.together=function(){
    var from=parse(FU.startDate()),to=new Date();to=new Date(to.getFullYear(),to.getMonth(),to.getDate());
    if(isNaN(from)||from>to)return null;
    var y=to.getFullYear()-from.getFullYear(),m=to.getMonth()-from.getMonth(),d=to.getDate()-from.getDate();
    if(d<0){m--;d+=new Date(to.getFullYear(),to.getMonth(),0).getDate()}
    if(m<0){y--;m+=12}
    var total=Math.round((Date.UTC(to.getFullYear(),to.getMonth(),to.getDate())-Date.UTC(from.getFullYear(),from.getMonth(),from.getDate()))/864e5);
    return {y:y,m:m,d:d,total:total};
  };
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  FU.longDate=function(s){var d=parse(s);return MONTHS[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()};


  FU.dmy=function(s){var d=parse(s);return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()};
  FU.elapsed=function(){
    var from=parse(FU.startDate()),now=new Date();
    if(isNaN(from)||from>now)return null;
    var y=now.getFullYear()-from.getFullYear(),m=now.getMonth()-from.getMonth(),d=now.getDate()-from.getDate();
    if(d<0){m--;d+=new Date(now.getFullYear(),now.getMonth(),0).getDate()}
    if(m<0){y--;m+=12}
    var t=FU.together();
    return {y:y,m:m,w:Math.floor(d/7),d:d%7,h:now.getHours(),mi:now.getMinutes(),s:now.getSeconds(),total:t?t.total:0};
  };

  var dateDlg=document.createElement('dialog');dateDlg.id='dateDlg';
  dateDlg.innerHTML='<form class="dlg-form" id="dateForm" method="dialog"><h2>When did our story begin?</h2>'
    +'<p class="hint">Pick the day you first met or got together. The counters on Home and Our Story count from it.</p>'
    +'<label class="field" for="sdInput">Our date<input id="sdInput" type="date" required></label>'
    +'<div class="actions"><button type="button" id="sdCancel">Cancel</button><button type="submit" class="primary">Save date</button></div></form>';
  document.body.appendChild(dateDlg);FU.backdropClose(dateDlg);
  $('sdCancel').addEventListener('click',function(){FU.close(dateDlg)});
  $('dateForm').addEventListener('submit',function(e){
    e.preventDefault();
    var v=$('sdInput').value;if(!v)return;
    var today=new Date().toISOString().slice(0,10);
    if(v>today){FU.toast('Pick a date that has already happened');return}
    FU.store.set('forever-us-start',v);FU.close(dateDlg);FU.renderCounters();if(FU.onDateChange)FU.onDateChange();if(FU.renderFooter)FU.renderFooter();FU.toast('Our date is saved');
  });
  FU.renderCounters=function(){
    document.querySelectorAll('[data-counter]').forEach(function(el){
      var t=FU.together();
      var tiles=t?[[t.y,t.y===1?'Year':'Years'],[t.m,t.m===1?'Month':'Months'],[t.d,t.d===1?'Day':'Days']]:[];
      el.innerHTML='<div class="counter-head"><h2>Together since '+esc(FU.longDate(FU.startDate()))+' <span class="heart">&#9829;</span></h2>'
        +'<button type="button" class="link-btn" data-setdate>Set our date</button></div>'
        +(t?'<div class="counter-tiles">'+tiles.map(function(x){return '<div class="ctile"><strong>'+x[0]+'</strong><span>'+x[1]+'</span></div>'}).join('')+'</div>'
          +'<p class="counter-sub">That is <b>'+t.total.toLocaleString()+'</b> days of loving each other.'+(FU.startIsSample()?' <i>This is an example date. Set yours.</i>':'')+'</p>'
          :'<p class="counter-sub">Set a date that has already happened to start the counter.</p>');
    });
  };
  document.addEventListener('click',function(e){
    if(!e.target.closest('[data-setdate]'))return;
    $('sdInput').value=FU.startDate();$('sdInput').max=new Date().toISOString().slice(0,10);FU.open(dateDlg);$('sdInput').focus();
  });
  FU.renderCounters();

  /* ---------- Footer ---------- */
  /* ---------- Footer: links, social icons, back to top ---------- */
  var SOC=[
    ['facebook','Facebook','<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'],
    ['instagram','Instagram','<rect x="2.500" y="2.500" width="19" height="19" rx="5.500"/><circle cx="12" cy="12" r="4.200"/><circle cx="17.600" cy="6.400" r=".6"/>'],
    ['whatsapp','WhatsApp','<path d="M3 21l1.700-4.900A9 9 0 1 1 8 19.400z"/><path d="M9 8.500c.4 2.600 2.700 5 6 6.200l1.500-1.700-2.200-1.100-1 .9c-1-.4-2-1.400-2.400-2.400l.9-1-1.100-2.200z"/>'],
    ['tiktok','TikTok','<path d="M16 3v11.500a4.500 4.500 0 1 1-4.500-4.500M16 3c.4 2.800 2.200 4.600 5 5"/>'],
    ['youtube','YouTube','<path d="M22.500 6.400a2.800 2.800 0 0 0-2-2C18.900 4 12 4 12 4s-6.900 0-8.500.4a2.800 2.800 0 0 0-2 2A29 29 0 0 0 1 11.800a29 29 0 0 0 .5 5.300 2.800 2.800 0 0 0 2 2c1.600.4 8.500.4 8.500.4s6.900 0 8.500-.4a2.800 2.800 0 0 0 2-2 29 29 0 0 0 .5-5.300 29 29 0 0 0-.5-5.400z"/><path d="M9.800 15l5.700-3.200-5.700-3.300z"/>'],
    ['x','X','<path d="M4 4l16 16M20 4L4 20"/>'],
    ['telegram','Telegram','<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>']
  ];
  function socials(){var v=FU.store.get('forever-us-social',{});return v&&typeof v==='object'?v:{}}
  function safeUrl(u){
    u=(u||'').trim();if(!u)return '';
    if(/^\+?[\d\s()-]{7,}$/.test(u))return 'https://wa.me/'+u.replace(/[^\d]/g,'');
    if(!/^https?:\/\//i.test(u))u='https://'+u;
    try{var x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:''}catch(e){return ''}
  }
  var foot=document.createElement('footer');foot.className='site-foot';
  function renderFoot(){
    var cur='',sv=socials();
    var t=FU.together&&!FU.startIsSample()?FU.together():null;
    var links=PAGES.map(function(p){return '<a href="'+p[2]+'"'+(p[0]===cur?' aria-current="page"':'')+'>'+p[1]+'</a>'}).join('');
    var mq=PAGES.map(function(p){return '<a href="'+p[2]+'" tabindex="-1">'+p[1]+'</a><span aria-hidden="true">&#9829;</span>'}).join('');
    var ico=SOC.map(function(x){
      var u=sv[x[0]];
      return u?'<a class="soc" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer" aria-label="'+x[1]+'" title="'+x[1]+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+x[2]+'</svg></a>'
        :'<button type="button" class="soc off" data-soc="'+x[0]+'" aria-label="Add your '+x[1]+' link" title="Add your '+x[1]+' link"><svg viewBox="0 0 24 24" aria-hidden="true">'+x[2]+'</svg></button>';
    }).join('');
    foot.innerHTML='<div class="sf-marq" aria-hidden="true"><div class="sf-track">'+mq+mq+'</div></div>'
      +'<div class="sf-main">'
        +'<div class="sf-brand"><div class="sf-logo"><svg width="40" height="36" viewBox="0 0 24 22" fill="none" stroke="#ff6f9f" stroke-width="1.6" aria-hidden="true"><path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/></svg><b>Omar &amp; Zaam</b></div>'
          +'<p>Every moment with you is my favorite memory. Our photos, videos, places and letters, all in one little world.</p>'
          +(t?'<span class="sf-days"><b>'+t.total.toLocaleString()+'</b> days of love</span>':'<a class="sf-days" href="'+PAGES[0][2]+'#top">Set the day our story began</a>')+'</div>'
        +'<nav class="sf-col" aria-label="Pages"><h4>Explore</h4>'+links+'</nav>'
        +'<nav class="sf-col" aria-label="Quick links"><h4>Our corner</h4>'
          +'<a href="'+PAGES[0][2]+'#magicSec">Love note of the day</a><a href="'+PAGES[0][2]+'#pubSec">Latest published</a><a href="'+PAGES[0][2]+'#rcar">Recent memories</a><a href="#sgrid">Special days</a><a href="#pgrid">Our photos</a></nav>'
        +'<div class="sf-col"><h4>Follow us</h4><div class="sf-soc">'+ico+'</div><button type="button" class="sf-edit" id="sfEditSoc">Edit social links</button></div>'
      +'</div>'
      +'<div class="sf-bar"><p>Made with <b>&#9829;</b> for Omar &amp; Zaam. Everything you add is saved in this browser only.</p><button type="button" class="sf-top" id="sfTop" aria-label="Back to top">Back to top <span aria-hidden="true">&#8593;</span></button></div>';
  }
  renderFoot();document.body.appendChild(foot);

  var sdlg=document.createElement('dialog');sdlg.id='socialDlg';
  sdlg.innerHTML='<form class="dlg-form" id="socialForm" method="dialog"><h2>Your social links</h2><p class="hint">Paste the address of your page or profile. Leave a box empty to hide that icon. Links are saved in this browser only.</p>'
    +SOC.map(function(x){return '<label class="field" for="soc_'+x[0]+'">'+x[1]+'<input id="soc_'+x[0]+'" inputmode="url" autocomplete="off" placeholder="'+(x[0]==='whatsapp'?'Phone number or link':'https://')+'"></label>'}).join('')
    +'<div class="actions"><button type="button" id="socCancel">Cancel</button><button type="submit" class="primary">Save links</button></div></form>';
  document.body.appendChild(sdlg);FU.backdropClose(sdlg);
  function openSoc(focus){var sv=socials();SOC.forEach(function(x){document.getElementById('soc_'+x[0]).value=sv[x[0]]||''});FU.open(sdlg);var f=document.getElementById('soc_'+(focus||SOC[0][0]));if(f)f.focus()}
  document.getElementById('socCancel').addEventListener('click',function(){FU.close(sdlg)});
  document.getElementById('socialForm').addEventListener('submit',function(e){
    e.preventDefault();var out={},bad=[];
    SOC.forEach(function(x){var raw=document.getElementById('soc_'+x[0]).value.trim();if(!raw)return;var u=safeUrl(raw);if(u)out[x[0]]=u;else bad.push(x[1])});
    if(bad.length){FU.toast('Check the link for '+bad.join(', '));return}
    FU.store.set('forever-us-social',out);FU.close(sdlg);renderFoot();FU.toast('Social links saved');
  });
  foot.addEventListener('click',function(e){
    var b=e.target.closest('[data-soc]');if(b)return openSoc(b.dataset.soc);
    if(e.target.closest('#sfEditSoc'))return openSoc();
    if(e.target.closest('#sfTop'))window.scrollTo({top:0,behavior:'smooth'});
  });
  FU.renderFooter=renderFoot;

  /* ---------- Surprises: load the celebration screen on every page (surprises.html loads it itself) ---------- */
  if(false){
    var l=document.createElement('link');l.rel='stylesheet';l.href='css/surprise.css';document.head.appendChild(l);
    var sc=document.createElement('script');sc.src='js/surprise.js';document.body.appendChild(sc);
  }
})();
