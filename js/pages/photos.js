/* Photos: categories, search, filters, sort, pagination, lightbox, and adding your own photos (resized and saved in this browser). */
(function(document){
  var FU=window.FU,esc=FU.esc,store=FU.store,toast=FU.toast;
  var KEY='forever-us-photos-v2',OLD_KEY='forever-us-photos-v1',PER_PAGE=12;
  var CATS=[
    ['together','Together','<path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z" fill="currentColor"/>'],
    ['trips','Trips','<path d="M3 17l18-8-5 12-4-5z" fill="currentColor"/>'],
    ['birthdays','Birthdays','<rect x="4" y="12" width="16" height="8" rx="1.500" fill="currentColor"/><path d="M12 4v5M8 6v3M16 6v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'],
    ['coffee','Coffee Dates','<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2a2 2 0 0 1 0 5h-2" fill="currentColor" stroke="currentColor" stroke-width="1.500"/>'],
    ['special','Special Moments','<path d="M12 3l2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.500 6.600 19.500l1.200-6L3.300 9.300l6.100-.7z" fill="currentColor"/>'],
    ['family','Family','<circle cx="9" cy="8" r="3.200" fill="currentColor"/><circle cx="17" cy="9" r="2.600" fill="currentColor"/><path d="M3 20c0-3.500 2.800-6 6-6s6 2.500 6 6zM15 20c0-2 .8-3.600 2.200-4.600 2.300.2 3.800 2 3.800 4.600z" fill="currentColor"/>']
  ];
  var ALL_ICON='<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.800"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="M3 17l5-4 4 3 3-2 6 4v3H3z" fill="currentColor"/>';
  var SEED=FU.seeds.photos();
  var OLD_MAP={travel:'trips',celebrations:'birthdays',moments:'special'};

  function load(){
    var v=store.get(KEY,null);
    if(Array.isArray(v))return v;
    var old=store.get(OLD_KEY,null);   /* bring over photos saved by the earlier version */
    if(Array.isArray(old))return old.map(function(p){p.album=OLD_MAP[p.album]||p.album;return p});
    return SEED;
  }
  var photos=load();
  var state={cat:'all',q:'',sort:'newest',page:1,fav:false,mine:false,place:false},openId=null,delArmed=false;
  var $=function(id){return document.getElementById(id)};
  var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){var p=d.split('-');return (+p[2])+' '+MONTHS[+p[1]-1]+' '+p[0]}
  function today(){return new Date().toISOString().slice(0,10)}
  function save(){if(!store.set(KEY,photos))toast('Storage is full, so this change will be lost when you close the page')}
  function byId(id){return photos.filter(function(p){return p.id===id})[0]}
  function catName(id){var c=CATS.filter(function(x){return x[0]===id})[0];return c?c[1]:'Together'}
  function media(p){return p.src?'<img alt="'+esc(p.title)+'" src="'+p.src+'">':FU.art(p.scene||'couple')}

  function matches(p,skipCat){
    if(!skipCat&&state.cat!=='all'&&p.album!==state.cat)return false;
    var q=state.q.trim().toLowerCase();
    if(q&&(p.title+' '+(p.place||'')+' '+catName(p.album)).toLowerCase().indexOf(q)===-1)return false;
    if(state.fav&&!p.fav)return false;
    if(state.mine&&p.sample)return false;
    if(state.place&&!p.place)return false;
    return true;
  }
  function visible(){
    var l=photos.filter(function(p){return matches(p)});
    if(state.sort==='newest')l.sort(function(a,b){return b.date.localeCompare(a.date)});
    if(state.sort==='oldest')l.sort(function(a,b){return a.date.localeCompare(b.date)});
    if(state.sort==='fav')l.sort(function(a,b){return (b.fav-a.fav)||b.date.localeCompare(a.date)});
    if(state.sort==='title')l.sort(function(a,b){return a.title.localeCompare(b.title)});
    return l;
  }
  var PIN='<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6 15 4 12 4 9a8 8 0 0 1 16 0c0 3-2 6-8 13zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>';
  var CAL='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  var HEART='<svg class="ph-heart" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/></svg>';

  function renderCats(){
    var base=photos.filter(function(p){return true});
    var rows='<li><button type="button" class="pcat" data-c="all" aria-pressed="'+(state.cat==='all')+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+ALL_ICON+'</svg>All Photos<span class="n">'+base.length+'</span></button></li>';
    CATS.forEach(function(c){
      var n=photos.filter(function(p){return p.album===c[0]}).length;
      rows+='<li><button type="button" class="pcat" data-c="'+c[0]+'" aria-pressed="'+(state.cat===c[0])+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+c[2]+'</svg>'+c[1]+'<span class="n">'+n+'</span></button></li>';
    });
    $('pcats').innerHTML=rows;
  }
  function renderPager(pages){
    if(pages<1)pages=1;
    var nums=[];
    if(pages<=5){for(var i=1;i<=pages;i++)nums.push(i)}
    else{
      nums=[1];
      var s=Math.max(2,state.page-1),e=Math.min(pages-1,state.page+1);
      if(state.page<=3){s=2;e=3}
      if(state.page>=pages-2){s=pages-2;e=pages-1}
      if(s>2)nums.push('...');
      for(var k=s;k<=e;k++)nums.push(k);
      if(e<pages-1)nums.push('...');
      nums.push(pages);
    }
    $('pager').innerHTML='<button type="button" data-p="'+(state.page-1)+'" aria-label="Previous page"'+(state.page<=1?' disabled':'')+'>&lsaquo;</button>'
      +nums.map(function(n){return n==='...'?'<span class="dots">&hellip;</span>':'<button type="button" data-p="'+n+'"'+(n===state.page?' aria-current="page"':'')+'>'+n+'</button>'}).join('')
      +'<button type="button" data-p="'+(state.page+1)+'" aria-label="Next page"'+(state.page>=pages?' disabled':'')+'>&rsaquo;</button>';
  }
  function render(){
    renderCats();
    var total=photos.length;
    $('statCount').textContent=total.toLocaleString()+(total===1?' Photo':' Photos');
    var l=visible(),pages=Math.max(1,Math.ceil(l.length/PER_PAGE));
    if(state.page>pages)state.page=pages;
    var shown=l.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE);
    var hasSample=photos.some(function(p){return p.sample});
    $('countLine').textContent=l.length+(l.length===1?' photo':' photos')+(hasSample?'. Sample pictures are shown until you add your own.':'');
    var nf=(state.fav?1:0)+(state.mine?1:0)+(state.place?1:0);
    $('fCount').hidden=!nf;$('fCount').textContent=nf;
    if(!shown.length){
      $('pgrid').innerHTML='<div class="empty"><b style="display:block;font-family:var(--font-display);font-size:18px;color:var(--ink)">No photos here yet</b>Try another category or search, or use Add Photos at the top.</div>';
    }else{
      $('pgrid').innerHTML=shown.map(function(p){
        return '<button type="button" class="ph" data-id="'+p.id+'" aria-label="Open '+esc(p.title)+'">'+media(p)+(p.fav?HEART:'')+FU.byline(p,'ph-by')
          +'<span class="ph-cap">'+(p.place?'<span class="ph-place">'+PIN+esc(p.place)+'</span>':'')+'<span class="ph-date">'+CAL+fmt(p.date)+'</span></span></button>';
      }).join('');
    }
    renderPager(pages);
  }

  /* Lightbox */
  var lb=$('lb');FU.backdropClose(lb);
  $('lbAlbum').innerHTML=CATS.map(function(c){return '<option value="'+c[0]+'">'+c[1]+'</option>'}).join('');
  function show(id){
    var p=byId(id);if(!p)return;openId=id;delArmed=false;$('lbDel').textContent='Delete';
    $('lbStage').innerHTML=media(p);
    $('lbTitle').textContent=p.title;
    $('lbMeta').textContent=fmt(p.date)+(p.place?' · '+p.place:'');
    var by=$('lbBy');if(!by){by=document.createElement('div');by.id='lbBy';$('lbMeta').insertAdjacentElement('afterend',by)}
    by.innerHTML=FU.byline(p);var can=FU.canEdit(p);$('lbDel').hidden=!can;$('lbAlbum').disabled=$('lbPlace').disabled=!can;
    $('lbAlbum').value=p.album;$('lbPlace').value=p.place||'';
    $('lbDl').hidden=!p.src;$('lbFav').setAttribute('aria-pressed',p.fav);$('lbFav').querySelector('span').textContent=p.fav?'Favorited':'Favorite';
  }
  function step(dir){
    var l=visible();var i=l.map(function(p){return p.id}).indexOf(openId);if(i<0||!l.length)return;
    show(l[(i+dir+l.length)%l.length].id);
  }
  $('pgrid').addEventListener('click',function(e){var b=e.target.closest('.ph');if(!b)return;show(+b.dataset.id);FU.open(lb)});
  $('lbPrev').addEventListener('click',function(){step(-1)});
  $('lbNext').addEventListener('click',function(){step(1)});
  $('lbClose').addEventListener('click',function(){FU.close(lb)});
  lb.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
    if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);
  });
  lb.addEventListener('close',render);
  $('lbDl').addEventListener('click',function(){var p=byId(openId);if(p&&p.src)FU.download(p.src,p.title,'jpg')});
  $('lbFav').addEventListener('click',function(){var p=byId(openId);if(!p)return;p.fav=!p.fav;save();show(openId)});
  $('lbAlbum').addEventListener('change',function(){var p=byId(openId);if(!p)return;p.album=this.value;save()});
  $('lbPlace').addEventListener('change',function(){var p=byId(openId);if(!p)return;p.place=this.value.trim();save();$('lbMeta').textContent=fmt(p.date)+(p.place?' · '+p.place:'')});
  $('lbDel').addEventListener('click',function(){
    if(!FU.canEdit(byId(openId))){FU.denied(byId(openId));return}
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    var l=visible(),i=l.map(function(p){return p.id}).indexOf(openId);
    photos=photos.filter(function(p){return p.id!==openId});save();
    var next=visible();
    if(!next.length){FU.close(lb)}else{show(next[Math.min(i,next.length-1)].id)}
    render();toast('Photo deleted');
  });

  /* Controls */
  $('pcats').addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;state.cat=b.dataset.c;state.page=1;render()});
  $('q').addEventListener('input',function(){state.q=this.value;state.page=1;render()});
  $('sort').addEventListener('change',function(){state.sort=this.value;state.page=1;render()});
  $('pager').addEventListener('click',function(e){
    var b=e.target.closest('[data-p]');if(!b||b.disabled)return;
    state.page=+b.dataset.p;render();$('pgrid').scrollIntoView({block:'start',behavior:'smooth'});
  });
  var menu=$('filterMenu'),fbtn=$('filterBtn');
  function setMenu(open){menu.hidden=!open;fbtn.setAttribute('aria-expanded',open)}
  fbtn.addEventListener('click',function(e){e.stopPropagation();setMenu(menu.hidden)});
  document.addEventListener('click',function(e){if(!menu.hidden&&!e.target.closest('.fwrap'))setMenu(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){setMenu(false);fbtn.focus()}});
  [['fFav','fav'],['fMine','mine'],['fPlace','place']].forEach(function(f){
    $(f[0]).addEventListener('change',function(){state[f[1]]=this.checked;state.page=1;render()});
  });
  $('fClear').addEventListener('click',function(){
    state.fav=state.mine=state.place=false;['fFav','fMine','fPlace'].forEach(function(id){$(id).checked=false});state.page=1;render();
  });

  /* Adding photos: resize in a canvas so many fit in browser storage */
  function shrink(file){
    return new Promise(function(resolve,reject){
      var fr=new FileReader();
      fr.onerror=function(){reject()};
      fr.onload=function(){
        var img=new Image();
        img.onerror=function(){reject()};
        img.onload=function(){
          var max=1000,r=Math.min(1,max/Math.max(img.width,img.height));
          var c=document.createElement('canvas');c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          resolve(c.toDataURL('image/jpeg',.78));
        };
        img.src=fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  $('addPhotos').addEventListener('change',function(){
    var files=Array.prototype.slice.call(this.files||[]).filter(function(f){return /^image\//.test(f.type)});
    var input=this;if(!files.length)return;
    var cleared=photos.length>0&&photos.every(function(p){return p.sample});
    if(cleared){photos=[]}
    var album=state.cat==='all'?'together':state.cat;
    Promise.all(files.map(function(f,i){
      return shrink(f).then(function(src){
        var d=f.lastModified?new Date(f.lastModified).toISOString().slice(0,10):today();
        return FU.stamp({id:Date.now()+i,title:f.name.replace(/\.[^.]+$/,'').slice(0,40)||'New photo',album:album,date:d,src:src,place:'',fav:false});
      }).catch(function(){return null});
    })).then(function(list){
      list=list.filter(Boolean);
      if(!list.length){toast('Those files could not be read as pictures');return}
      photos=photos.concat(list);save();state.page=1;render();
      toast(list.length+(list.length===1?' photo added':' photos added')+(cleared?'. The sample pictures were cleared.':'. Open one to add a place.'));
      input.value='';
    });
  });
  render();
})(window.FU.scope('photos'));