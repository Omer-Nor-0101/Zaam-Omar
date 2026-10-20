/* Home: live counter, totals, and a strip of the most recent photos and videos. */
(function(document){
  var FU=window.FU,esc=FU.esc,store=FU.store;
  var $=function(id){return document.getElementById(id)};

  /* ---------- Live counter ---------- */
  var LABELS=[['y','Years'],['m','Months'],['w','Weeks'],['d','Days'],['h','Hours'],['mi','Minutes'],['s','Seconds']];
  function pad(n){return n<10?'0'+n:String(n)}
  var built=false,lastTotal=null;
  function paintUnits(){
    var t=FU.elapsed();
    $('sinceDate').textContent=FU.dmy(FU.startDate());
    if(!t){built=false;$('units').innerHTML='<p class="hint" style="grid-column:1/-1;color:#ffc2d6">Set a date that has already happened to start the counter.</p>';paintStats(null);return}
    if(!built){
      $('units').innerHTML=LABELS.map(function(l){return '<div class="unit"><strong data-u="'+l[0]+'"></strong><span>'+l[1]+'</span></div>'}).join('');
      built=true;
    }
    LABELS.forEach(function(l){var el=$('units').querySelector('[data-u="'+l[0]+'"]');if(el)el.textContent=pad(t[l[0]])});
    if(t.total!==lastTotal){lastTotal=t.total;paintStats(t)}
  }

  /* ---------- Saved content (same keys the other pages use) ---------- */
  function photos(){var v=store.get('forever-us-photos-v2',null)||store.get('forever-us-photos-v1',null);return Array.isArray(v)?v:FU.seeds.photos()}
  function videos(){var v=store.get('forever-us-videos-v2',null);return Array.isArray(v)?v:FU.seeds.videos()}
  function places(){var v=store.get('forever-us-places-v1',null);return Array.isArray(v)?v:FU.seeds.places()}

  var KIND={
    photo:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.800"/><path d="M3 17l5-4 4 3 3-2 6 4"/></svg>',
    video:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="6" width="13" height="12" rx="2.500"/><path d="M17 10.500l5-3v9l-5-3z"/></svg>'
  };
  var BIG={
    photo:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.800"/><path d="M3 17l5-4 4 3 3-2 6 4"/></svg>',
    video:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2.500"/><path d="M17 10.500l5-3v9l-5-3z"/></svg>',
    pin:'<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6 15 4 12 4 9a8 8 0 0 1 16 0c0 3-2 6-8 13zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>',
    heart:'<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/></svg>'
  };
  function paintStats(t){
    var cards=[
      ['photo',photos().length,'Photos','Memories captured','#photos'],
      ['video',videos().length,'Videos','Moments in motion','#videos'],
      ['pin',places().length,'Places','Together we explored','#places'],
      ['heart',t?t.total:0,'Days','Of love & happiness','#story']
    ];
    $('stats').innerHTML=cards.map(function(c){
      return '<a class="stat" href="'+c[4]+'"><span class="stat-i">'+BIG[c[0]]+'</span><strong>'+Number(c[1]).toLocaleString()+'<small>'+c[2]+'</small></strong><p>'+c[3]+'</p></a>';
    }).join('');
  }

  /* ---------- Recent memories ---------- */
  function ago(d){
    var p=d.split('-'),then=new Date(+p[0],+p[1]-1,+p[2]),now=new Date();
    var days=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate())-then)/864e5);
    function n(v,u){return v+' '+u+(v===1?'':'s')+' ago'}
    if(days<=0)return 'Today';
    if(days<7)return n(days,'Day');
    if(days<30)return n(Math.floor(days/7),'Week');
    if(days<365)return n(Math.floor(days/30),'Month');
    return n(Math.floor(days/365),'Year');
  }
  function recent(){
    var items=photos().map(function(p){return {kind:'photo',title:p.title,date:p.date,scene:p.scene,src:p.src,href:'#photos'}})
      .concat(videos().map(function(v){return {kind:'video',title:v.title,date:v.date,scene:v.scene,href:'#videos'}}));
    items.sort(function(a,b){return b.date.localeCompare(a.date)});
    return items.slice(0,10);
  }

  /* ---------- Latest published: everything either of you added, with who added it ---------- */
  var KINDS=[['Photo','forever-us-photos-v2','#photos'],['Video','forever-us-videos-v2','#videos'],['Place','forever-us-places-v1','#places'],['Milestone','forever-us-story-v2','#story'],['Dream','forever-us-dreams-v1','#dreams'],['Letter','forever-us-letters-v1','#letters']];
  var pubWho='all';
  function published(){
    var out=[];
    KINDS.forEach(function(k){
      var v=store.get(k[1],null);if(!Array.isArray(v))return;
      v.forEach(function(it){if(it&&it.by)out.push({kind:k[0],href:k[2],by:it.by,title:it.title||it.name||'Untitled',at:it.byAt||'',id:+it.id||0})});
    });
    out.sort(function(a,b){return (b.at.localeCompare(a.at))||(b.id-a.id)});
    return out;
  }
  function paintPub(){
    var all=published(),sec=$('pubSec');
    sec.hidden=!all.length;if(!all.length)return;
    var names=[];all.forEach(function(x){if(names.indexOf(x.by)<0)names.push(x.by)});
    if(pubWho!=='all'&&names.indexOf(pubWho)<0)pubWho='all';
    $('pubFilter').innerHTML=['all'].concat(names).map(function(n){return '<button type="button" class="chip" data-who="'+esc(n)+'" aria-pressed="'+(n===pubWho)+'">'+(n==='all'?'Everyone':esc(n))+'</button>'}).join('');
    $('pubList').innerHTML=all.filter(function(x){return pubWho==='all'||x.by===pubWho}).slice(0,8).map(function(x){
      return '<a class="pub-item" href="'+x.href+'"><span class="pub-k">'+x.kind+'</span><b>'+esc(x.title)+'</b><small>Published by '+esc(x.by)+(x.at?' &middot; '+ago(x.at):'')+'</small></a>';
    }).join('');
  }
  $('pubFilter').addEventListener('click',function(e){var b=e.target.closest('[data-who]');if(b){pubWho=b.dataset.who;paintPub()}});
  var car=$('rcar'),dots=$('dots');
  function pages(){return Math.max(1,Math.round(car.scrollWidth/Math.max(1,car.clientWidth)))}
  function paintDots(){
    var n=pages(),cur=Math.round(car.scrollLeft/Math.max(1,car.clientWidth));
    dots.innerHTML=n<2?'':Array.apply(null,Array(n)).map(function(_,i){return '<button type="button" role="tab" aria-label="Page '+(i+1)+'" aria-selected="'+(i===cur)+'" data-i="'+i+'"></button>'}).join('');
  }
  function paintRecent(){
    var l=recent();
    if(!l.length){car.innerHTML='<div class="empty" style="flex:1">Nothing here yet. Add a photo or a video to see it here.</div>';dots.innerHTML='';return}
    car.innerHTML=l.map(function(it){
      return '<a class="rc" href="'+it.href+'"><div class="rc-img">'+(it.src?'<img alt="" src="'+it.src+'">':FU.art(it.scene||'couple'))+'<span class="rc-kind" aria-hidden="true">'+KIND[it.kind]+'</span></div><b>'+esc(it.title)+'</b><small>'+ago(it.date)+'</small></a>';
    }).join('');
    paintDots();
  }
  dots.addEventListener('click',function(e){var b=e.target.closest('[data-i]');if(b)car.scrollTo({left:+b.dataset.i*car.clientWidth,behavior:'smooth'})});
  car.addEventListener('scroll',function(){
    var cur=Math.round(car.scrollLeft/Math.max(1,car.clientWidth));
    dots.querySelectorAll('button').forEach(function(b,i){b.setAttribute('aria-selected',i===cur)});
  });
  window.addEventListener('resize',paintDots);

  FU.onDateChange=function(){lastTotal=null;paintUnits()};
  paintRecent();paintPub();
  paintUnits();
  setInterval(paintUnits,1000);

  /* ---------- Welcome chip follows the scroll ---------- */
  (function(){
    var w=$('welcome');if(!w)return;
    var ph=document.createElement('div');ph.className='welcome-ph';w.parentNode.insertBefore(ph,w);
    var floating=false,ticking=false;
    function update(){
      ticking=false;
      if(!w.innerHTML){return}
      var ref=floating?ph:w;
      var r=ref.getBoundingClientRect();
      var past=r.bottom<0;
      if(past&&!floating){
        var h=w.offsetHeight,cs=getComputedStyle(w);
        ph.style.cssText='display:block;height:'+(h+parseFloat(cs.marginBottom||0))+'px';
        w.classList.add('floating');floating=true;
      }else if(!past&&floating){
        w.classList.remove('floating');ph.style.cssText='';floating=false;
      }
    }
    function req(){if(!ticking){ticking=true;requestAnimationFrame(update)}}
    window.addEventListener('scroll',req,{passive:true});
    window.addEventListener('resize',req);
    update();
  })();
})(window.FU.scope('home'));