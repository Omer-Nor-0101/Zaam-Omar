/* Videos: categories, search, filter, sort, pagination, featured video and a player dialog.
   The video file is uploaded to the server (up to 150 MB) and stays there, so it never disappears. */
(function(document){
  var FU=window.FU,esc=FU.esc,store=FU.store,toast=FU.toast;
  var KEY='forever-us-videos-v2',OLD_KEY='forever-us-videos-v1',PER_PAGE=12;
  var CATS=[
    ['travel','Travel','<path d="M3 17l18-8-5 12-4-5z" fill="currentColor"/>','mountain'],
    ['dates','Dates','<path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z" fill="currentColor"/>','lantern'],
    ['special','Special Moments','<path d="M12 3l2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.500 6.600 19.500l1.200-6L3.300 9.300l6.100-.7z" fill="currentColor"/>','couple'],
    ['birthdays','Birthdays','<rect x="4" y="12" width="16" height="8" rx="1.500" fill="currentColor"/><path d="M12 4v5M8 6v3M16 6v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>','cake'],
    ['surprises','Surprises','<path d="M3 8h18v4H3zM5 12h14v9H5z" fill="currentColor"/><path d="M12 8C9 8 7 6 8 4.500 9.500 3 12 5 12 8zm0 0c3 0 5-2 4-3.500C14.500 3 12 5 12 8z" fill="none" stroke="currentColor" stroke-width="1.800"/>','gift'],
    ['others','Others','<circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/>','couple']
  ];
  var ALL_ICON='<rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor"/><path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4" stroke="#fff" stroke-width="1.200"/>';
  var OLD_MAP={trips:'travel',celebrations:'birthdays',everyday:'others'};
  function load(){
    var v=store.get(KEY,null);if(Array.isArray(v))return v;
    var old=store.get(OLD_KEY,null);
    if(Array.isArray(old))return old.map(function(x){x.cat=OLD_MAP[x.cat]||x.cat;x.place=x.place||'';x.fav=!!x.fav;return x});
    return FU.seeds.videos();
  }
  var videos=load();
  var MAX=150*1024*1024,saving=false;
  var state={cat:'all',q:'',sort:'newest',page:1,fav:false,mine:false,place:false},openId=null,editing=null,delArmed=false,pending=null;
  var $=function(id){return document.getElementById(id)};
  var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){var p=d.split('-');return pad(+p[2])+' '+MONTHS[+p[1]-1]+' '+p[0]}
  function pad(n){return n<10?'0'+n:String(n)}
  function save(){if(!store.set(KEY,videos))toast('Storage is full, so this change will be lost when you close the page')}
  function byId(id){return videos.filter(function(v){return v.id===id})[0]}
  function cat(id){return CATS.filter(function(c){return c[0]===id})[0]||CATS[5]}
  function scene(v){return v.scene||cat(v.cat)[3]}
  function url(v){return v&&v.media&&v.media.id?FUAPI.mediaUrl(v.media.id):''}
  function thumb(v){var u=url(v);return u?'<video muted playsinline preload="metadata" src="'+u+'#t=0.5" aria-hidden="true" tabindex="-1"></video>':FU.art(scene(v))}
  function mb(n){return (n/1048576).toFixed(n>=10485760?0:1)+' MB'}
  function pickOk(f,input){
    if(!f)return false;
    if(!/^video\//.test(f.type)){toast('Please choose a video file');if(input)input.value='';return false}
    if(f.size>MAX){toast('That video is '+mb(f.size)+'. The limit is 150 MB.');if(input)input.value='';return false}
    return true;
  }
  var PLAY='<span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
  var CAL='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  var PIN='<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6 15 4 12 4 9a8 8 0 0 1 16 0c0 3-2 6-8 13zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>';
  var HEART='<svg viewBox="0 0 24 24"><path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/></svg>';

  function matches(v){
    if(state.cat!=='all'&&v.cat!==state.cat)return false;
    var q=state.q.trim().toLowerCase();
    if(q&&(v.title+' '+(v.place||'')+' '+cat(v.cat)[1]).toLowerCase().indexOf(q)===-1)return false;
    if(state.fav&&!v.fav)return false;
    if(state.mine&&v.sample)return false;
    if(state.place&&!v.place)return false;
    return true;
  }
  function visible(){
    var l=videos.filter(matches);
    if(state.sort==='newest')l.sort(function(a,b){return b.date.localeCompare(a.date)});
    if(state.sort==='oldest')l.sort(function(a,b){return a.date.localeCompare(b.date)});
    if(state.sort==='fav')l.sort(function(a,b){return (b.fav-a.fav)||b.date.localeCompare(a.date)});
    if(state.sort==='title')l.sort(function(a,b){return a.title.localeCompare(b.title)});
    return l;
  }
  function renderCats(){
    var rows='<li><button type="button" class="pcat" data-c="all" aria-pressed="'+(state.cat==='all')+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+ALL_ICON+'</svg>All Videos<span class="n">'+videos.length+'</span></button></li>';
    CATS.forEach(function(c){
      var n=videos.filter(function(v){return v.cat===c[0]}).length;
      rows+='<li><button type="button" class="pcat" data-c="'+c[0]+'" aria-pressed="'+(state.cat===c[0])+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+c[2]+'</svg>'+c[1]+'<span class="n">'+n+'</span></button></li>';
    });
    $('pcats').innerHTML=rows;
  }
  function renderFeatured(){
    var f=videos.filter(function(v){return v.featured})[0]||videos.filter(function(v){return v.fav})[0]||videos[0];
    if(!f){$('featured').innerHTML='<h3>Featured Video</h3><p class="hint">Add a video to feature it here.</p>';return}
    var yr=f.date.slice(0,4);
    $('featured').innerHTML='<h3>Featured Video</h3><button type="button" class="f-thumb" data-open="'+f.id+'" aria-label="Play '+esc(f.title)+'">'+thumb(f)+PLAY+'</button>'
      +'<span class="f-title">'+esc(f.title)+'</span><span class="f-sub">'+(f.place?esc(f.place)+' ':'')+yr+'</span>'+(f.by?'<span class="f-by">'+FU.byline(f)+'</span>':'')
      +'<div class="watch"><button type="button" data-open="'+f.id+'"><svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M7 4v16l13-8z"/></svg> Watch Now</button></div>';
  }
  function renderPager(pages){
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
    renderCats();renderFeatured();
    $('statCount').textContent=videos.length.toLocaleString()+(videos.length===1?' Video':' Videos');
    var l=visible(),pages=Math.max(1,Math.ceil(l.length/PER_PAGE));
    if(state.page>pages)state.page=pages;
    var shown=l.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE);
    var hasSample=videos.some(function(v){return v.sample});
    $('countLine').textContent=l.length+(l.length===1?' video':' videos')+(hasSample?'. Sample entries are shown until you add your own.':'');
    var nf=(state.fav?1:0)+(state.mine?1:0)+(state.place?1:0);
    $('fCount').hidden=!nf;$('fCount').textContent=nf;
    if(!shown.length){
      $('vgrid').innerHTML='<div class="empty"><b style="display:block;font-family:var(--font-display);font-size:18px;color:var(--ink)">No videos here yet</b>Try another category or search, or use Add Video at the top.</div>';
    }else{
      $('vgrid').innerHTML=shown.map(function(v){
        return '<article class="vc"><button type="button" class="vc-thumb" data-open="'+v.id+'" aria-label="Play '+esc(v.title)+'">'+thumb(v)+PLAY+(v.dur?'<span class="dur">'+esc(v.dur)+'</span>':'')+'</button>'
          +'<div class="vc-row"><b title="'+esc(v.title)+'">'+esc(v.title)+'</b><button type="button" class="vc-heart" data-fav="'+v.id+'" aria-pressed="'+!!v.fav+'" aria-label="Favorite '+esc(v.title)+'">'+HEART+'</button></div>'
          +(v.by?'<div class="vc-by">'+FU.byline(v)+'</div>':'')+'<div class="vc-meta"><span>'+CAL+fmt(v.date)+'</span>'+(v.place?'<span>'+PIN+esc(v.place)+'</span>':'')+'<button type="button" class="vc-more" data-edit="'+v.id+'" aria-label="Edit '+esc(v.title)+'">&#8942;</button></div></article>';
      }).join('');
    }
    renderPager(pages);
  }

  /* Player dialog */
  var dlg=$('vDlg');FU.backdropClose(dlg);
  function openVideo(id){
    var v=byId(id);if(!v)return;openId=id;delArmed=false;$('vDel').textContent='Delete';
    $('vTitle').textContent=v.title;
    $('vMeta').textContent=cat(v.cat)[1]+' · '+fmt(v.date)+(v.place?' · '+v.place:'')+(v.dur?' · '+v.dur:'');
    var by=$('vBy');if(!by){by=document.createElement('div');by.id='vBy';$('vMeta').insertAdjacentElement('afterend',by)}
    by.innerHTML=FU.byline(v);
    $('vDel').hidden=$('vEdit').hidden=!FU.canEdit(v);
    paintPlayer(v);FU.open(dlg);
  }
  function paintPlayer(v){
    var u=url(v),box=$('vPlayer');
    if(u){
      box.innerHTML='<video controls playsinline preload="metadata" src="'+u+'"></video>';
      $('vNote').textContent=(v.media.name?v.media.name+' · ':'')+'Saved on our server, so it will always be here.';
      $('vFileBtn').firstChild.nodeValue='Replace video file';
    }else{
      box.innerHTML='<div class="vph">'+FU.art(scene(v))+'</div><div class="v-note">No video file is attached yet.</div>';
      $('vNote').textContent=(v.sample?'This is a sample entry. ':'')+'Choose a video file (up to 150 MB) and it will be saved here for good.';
      $('vFileBtn').firstChild.nodeValue='Choose video file';
    }
    var dl=$('vDownload');if(dl){if(u){dl.href=u+'&download=1';dl.download=(v.media&&v.media.name)||((v.title||'video').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+'.mp4');dl.hidden=false}else dl.hidden=true}
    $('vFileBtn').hidden=!FU.canEdit(v);
  }
  dlg.addEventListener('close',function(){var vid=$('vPlayer').querySelector('video');if(vid)vid.pause()});
  $('vClose').addEventListener('click',function(){FU.close(dlg)});
  $('vFile').addEventListener('change',function(){
    var input=this,f=input.files&&input.files[0],id=openId,vid=byId(id);
    if(!pickOk(f,input)||!vid)return;
    if(!FU.canEdit(vid)){FU.denied(vid);input.value='';return}
    var lab=$('vFileBtn').firstChild,orig=lab.nodeValue;
    input.disabled=true;lab.nodeValue='Uploading 0%';
    FUAPI.upload(f,function(p){lab.nodeValue='Uploading '+p+'%'}).then(function(m){
      var old=vid.media&&vid.media.id;vid.media=m;
      save();FUAPI.removeMedia(old);toast('Video saved');
      if(openId===id)paintPlayer(vid);render();
    }).catch(function(e){lab.nodeValue=orig;toast(e.message)}).then(function(){input.disabled=false;input.value=''});
  });
  $('vDel').addEventListener('click',function(){
    if(!FU.canEdit(byId(openId))){FU.denied(byId(openId));return}
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    var gone=byId(openId);videos=videos.filter(function(v){return v.id!==openId});save();if(gone&&gone.media)FUAPI.removeMedia(gone.media.id);FU.close(dlg);render();toast('Video deleted');
  });
  $('vEdit').addEventListener('click',function(){var id=openId;FU.close(dlg);openForm(id)});

  /* Add / edit dialog */
  var form=$('vForm');FU.backdropClose(form);
  $('vfCat').innerHTML=CATS.map(function(c){return '<option value="'+c[0]+'">'+c[1]+'</option>'}).join('');
  function openForm(id){
    editing=id;pending=null;
    var v=id?byId(id):null;
    if(v&&!FU.canEdit(v)){FU.denied(v);return}
    $('vfTitle').textContent=v?'Edit video':'Add a video';
    $('vfName').value=v?v.title:'';$('vfCat').value=v?v.cat:(state.cat==='all'?'dates':state.cat);
    $('vfDate').value=v?v.date:new Date().toISOString().slice(0,10);$('vfPlace').value=v?(v.place||''):'';$('vfDur').value=v?(v.dur||''):'';
    $('vfFeat').checked=!!(v&&v.featured);$('vfFile').value='';
    $('vfHint').textContent=v&&v.media?'A video is already saved. Choose a new file only if you want to replace it (up to 150 MB).':'Choose a video (up to 150 MB). It is saved on our server and stays here for good.';
    FU.open(form);$('vfName').focus();
  }
  $('addBtn').addEventListener('click',function(){openForm(null)});
  $('vfCancel').addEventListener('click',function(){if(saving){toast('Still uploading, please wait');return}FU.close(form)});
  $('vfFile').addEventListener('change',function(){
    var f=this.files&&this.files[0];if(!f){pending=null;return}
    if(!pickOk(f,this)){pending=null;return}
    pending=f;
    if(!$('vfName').value.trim())$('vfName').value=f.name.replace(/\.[^.]+$/,'').slice(0,50);
  });
  $('vf').addEventListener('submit',function(e){
    e.preventDefault();
    if(saving)return;
    if(editing&&!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    var rec={title:$('vfName').value.trim(),cat:$('vfCat').value,date:$('vfDate').value,place:$('vfPlace').value.trim(),dur:$('vfDur').value.trim(),featured:$('vfFeat').checked};
    if(!rec.title||!rec.date)return;
    var file=pending,btn=$('vfSave'),label=btn.textContent;
    function commit(media){
      var id,oldMedia=null;
      if(editing){var v=byId(editing);var changed=v.cat!==rec.cat;Object.assign(v,rec);if(changed)v.scene=cat(rec.cat)[3];id=editing;toast('Video saved');
        if(media){oldMedia=v.media&&v.media.id;v.media=media}}
      else{rec.id=Date.now();rec.scene=cat(rec.cat)[3];rec.fav=false;if(media)rec.media=media;FU.stamp(rec);videos.push(rec);id=rec.id;toast('Video added')}
      if(rec.featured)videos.forEach(function(v){if(v.id!==id)v.featured=false});
      pending=null;save();FUAPI.removeMedia(oldMedia);state.page=1;FU.close(form);render();
    }
    if(!file){commit(null);return}
    saving=true;btn.disabled=true;btn.textContent='Uploading 0%';
    FUAPI.upload(file,function(p){btn.textContent='Uploading '+p+'%'}).then(commit)
      .catch(function(err){toast(err.message)})
      .then(function(){saving=false;btn.disabled=false;btn.textContent=label});
  });

  /* Page controls */
  $('pcats').addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;state.cat=b.dataset.c;state.page=1;render()});
  $('q').addEventListener('input',function(){state.q=this.value;state.page=1;render()});
  $('sort').addEventListener('change',function(){state.sort=this.value;state.page=1;render()});
  $('pager').addEventListener('click',function(e){
    var b=e.target.closest('[data-p]');if(!b||b.disabled)return;
    state.page=+b.dataset.p;render();$('vgrid').scrollIntoView({block:'start',behavior:'smooth'});
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('#videos'))return;
    var o=e.target.closest('[data-open]');if(o){openVideo(+o.dataset.open);return}
    var f=e.target.closest('[data-fav]');if(f){var v=byId(+f.dataset.fav);if(v){v.fav=!v.fav;save();render()}return}
    var ed=e.target.closest('[data-edit]');if(ed)openForm(+ed.dataset.edit);
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
  render();
})(window.FU.scope('videos'));