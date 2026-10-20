/* App logic: filters, sorting, rendering, add/edit dialog, sidebar. */
(function(document){
  var FU=window.FU,CATS=FU.CATS,ALL_ICON=FU.ALL_ICON,SCENE_FOR_CAT=FU.SCENE_FOR_CAT,scene=FU.scene;
  var dreams=FU.load();
  function save(){FU.save(dreams)}

  var state={status:'all',cat:null,sort:'default'};
  var $=function(id){return document.getElementById(id)};
  var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){if(!d)return null;var p=d.split('-');return MONTHS[+p[1]-1]+' '+p[0]}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var CAL='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  var HEART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/></svg>';
  var MAX=150*1024*1024,draft={file:null,remove:false,url:''},saving=false;
  function murl(d){return d&&d.media&&d.media.id?FUAPI.mediaUrl(d.media.id):''}
  function isVid(m){return m&&/^video\//.test(m.type||'')}
  function mb(n){return (n/1048576).toFixed(n>=10485760?0:1)+' MB'}
  function art(d){
    var u=murl(d);
    if(!u)return scene(d.scene||SCENE_FOR_CAT[d.cat]);
    return isVid(d.media)?'<video muted loop playsinline preload="metadata" src="'+u+'#t=0.5" aria-hidden="true" tabindex="-1"></video>'
      :'<img src="'+u+'" alt="" loading="lazy">';
  }
  function label(s){return s.charAt(0).toUpperCase()+s.slice(1)}

  function visible(){
    var list=dreams.filter(function(d){return (state.status==='all'||d.status===state.status)&&(!state.cat||d.cat===state.cat)});
    if(state.sort==='date')list.sort(function(a,b){return (a.date||'9999').localeCompare(b.date||'9999')});
    if(state.sort==='progress')list.sort(function(a,b){return b.prog-a.prog});
    if(state.sort==='name')list.sort(function(a,b){return a.name.localeCompare(b.name)});
    return list;
  }
  function renderChips(){
    $('chips').innerHTML=['all','planned','visited','wishlist'].map(function(s){return '<button type="button" class="chip" data-s="'+s+'" aria-pressed="'+(state.status===s)+'">'+label(s)+'</button>'}).join('');
  }
  function renderGrid(){
    var list=visible();
    if(!list.length){$('grid').innerHTML='<div class="empty"><b>No dreams here yet</b>Pick another filter or add a new place to dream about.</div>';return}
    $('grid').innerHTML=list.map(function(d){
      var when=d.date?((d.status==='visited'?'Visited: ':'Plan: ')+fmt(d.date)):'No date yet';
      return '<div class="card is-'+d.status+'" role="button" tabindex="0" data-id="'+d.id+'" aria-label="Edit '+esc(d.name)+'">'
        +'<div class="scene">'+art(d)+(isVid(d.media)?'<span class="vbadge" aria-label="Video"><svg viewBox="0 0 24 24" width="12" height="12" fill="#fff"><path d="M7 4v16l13-8z"/></svg></span>':'')+'</div>'
        +'<div class="card-ui"><div class="top"><span class="badge b-'+d.status+'">'+label(d.status)+'</span>'
        +'<button type="button" class="fav" data-fav="'+d.id+'" aria-pressed="'+d.fav+'" aria-label="Favorite '+esc(d.name)+'">'+HEART+'</button></div>'
        +'<div class="bottom"><h3>'+esc(d.name)+'</h3><p>'+esc(d.blurb||'')+'</p>'+FU.byline(d,'on-art')
        +'<div class="meta"><span class="when">'+CAL+when+'</span><span class="bar"><i style="width:'+d.prog+'%"></i></span><span class="pct">'+d.prog+'%</span></div></div></div></div>';
    }).join('');
  }
  function renderSide(){
    var total=dreams.length,done=dreams.filter(function(d){return d.status==='visited'}).length;
    var pct=total?Math.round(done/total*100):0;
    $('ringPct').textContent=pct+'%';
    $('ringCount').textContent=done+' / '+total+' Places';
    $('ringArc').setAttribute('stroke-dashoffset',(213.6*(1-pct/100)).toFixed(1));
    var rows='<li><button type="button" class="cat" data-cat="" aria-pressed="'+(!state.cat)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ALL_ICON+'</svg>All Destinations<span class="n">'+total+'</span></button></li>';
    CATS.forEach(function(c){
      var n=dreams.filter(function(d){return d.cat===c.id}).length;
      rows+='<li><button type="button" class="cat" data-cat="'+c.id+'" aria-pressed="'+(state.cat===c.id)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+c.icon+'</svg>'+c.name+'<span class="n">'+n+'</span></button></li>';
    });
    $('cats').innerHTML=rows;
    var now=new Date(),ym=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    var up=dreams.filter(function(d){return d.status==='planned'&&d.date&&d.date>=ym}).sort(function(a,b){return a.date.localeCompare(b.date)})[0];
    $('next').innerHTML=up?'<div class="next"><div class="thumb">'+scene(up.scene||SCENE_FOR_CAT[up.cat])+'</div><div><span class="badge b-planned" style="display:inline-block">Planned</span><b>'+esc(up.name)+'</b><small>'+CAL+'Plan: '+fmt(up.date)+'</small></div></div><button type="button" class="view" data-id="'+up.id+'">View Details &rarr;</button>'
      :'<p class="none">No trip is planned yet. Mark a dream as Planned and give it a month.</p>';
  }
  function render(){renderChips();renderGrid();renderSide()}

  /* Dialog */
  var dlg=$('dlg'),editing=null,delArmed=false;
  $('fCat').innerHTML=CATS.map(function(c){return '<option value="'+c.id+'">'+c.name+'</option>'}).join('');
  function openDlg(id){
    editing=id;delArmed=false;$('delBtn').textContent='Delete';
    var d=id?dreams.filter(function(x){return x.id===id})[0]:null;
    $('dlgTitle').textContent=d?'Edit dream':'Add a dream';
    $('saveBtn').textContent=d?'Save':'Add dream';
    $('delBtn').hidden=!d;
    $('fName').value=d?d.name:'';$('fBlurb').value=d?d.blurb:'';
    $('fCat').value=d?d.cat:'beach';$('fStatus').value=d?d.status:'wishlist';
    $('fDate').value=d?(d.date||''):'';$('fProg').value=d?d.prog:0;$('fProgOut').textContent=(d?d.prog:0)+'%';
    clearDraft();$('fMedia').value='';
    if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
    FU.lockForm($('form'),!!d&&!FU.canEdit(d),d);
    paintMedia(d);
    $('fName').focus();
  }
  function clearDraft(){if(draft.url)URL.revokeObjectURL(draft.url);draft={file:null,remove:false,url:''}}
  function paintMedia(d){
    var box=$('fMediaPrev'),note=$('fMediaNote'),del=$('fMediaDel'),html='',has=false;
    if(draft.file){
      has=true;
      html=/^video\//.test(draft.file.type)?'<video controls playsinline preload="metadata" src="'+draft.url+'"></video>':'<img alt="" src="'+draft.url+'">';
      note.textContent=draft.file.name+' ('+mb(draft.file.size)+'). It uploads when you press Save.';
    }else if(d&&d.media&&!draft.remove){
      has=true;
      html=isVid(d.media)?'<video controls playsinline preload="metadata" src="'+murl(d)+'"></video>':'<img alt="" src="'+murl(d)+'">';
      note.textContent=(d.media.name||'File')+' (' + mb(d.media.size||0) + '), saved on our server.';
    }else{
      note.textContent=draft.remove?'The file will be removed when you press Save.':'Add a photo or a video, up to 150 MB.';
    }
    box.innerHTML=html;box.hidden=!has;del.hidden=!has||!!(d&&!FU.canEdit(d));
  }
  function currentDream(){return editing?dreams.filter(function(x){return x.id===editing})[0]:null}
  $('fMedia').addEventListener('change',function(){
    var f=this.files&&this.files[0];if(!f)return;
    if(!/^(image|video)\//.test(f.type)||f.type==='image/svg+xml'){toast('Please choose a photo or a video');this.value='';return}
    if(f.size>MAX){toast('That file is '+mb(f.size)+'. The limit is 150 MB.');this.value='';return}
    clearDraft();draft.file=f;draft.url=URL.createObjectURL(f);paintMedia(currentDream());
  });
  $('fMediaDel').addEventListener('click',function(){
    clearDraft();$('fMedia').value='';
    var d=currentDream();if(d&&d.media)draft.remove=true;
    paintMedia(d);
  });
  function closeDlg(){if(saving){toast('Still uploading, please wait');return}clearDraft();if(dlg.close)dlg.close();else dlg.removeAttribute('open')}
  $('fProg').addEventListener('input',function(){$('fProgOut').textContent=this.value+'%'});
  $('fStatus').addEventListener('change',function(){if(this.value==='visited'){$('fProg').value=100;$('fProgOut').textContent='100%'}});
  $('cancelBtn').addEventListener('click',closeDlg);
  $('delBtn').addEventListener('click',function(){
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    var _d=dreams.filter(function(x){return x.id===editing})[0];if(!FU.canEdit(_d)){FU.denied(_d);return}
    if(_d&&_d.media)FUAPI.removeMedia(_d.media.id);
    dreams=dreams.filter(function(x){return x.id!==editing});save();closeDlg();render();toast('Dream removed');
  });
  $('form').addEventListener('submit',function(e){
    e.preventDefault();
    if(saving)return;
    if(editing){var _e=currentDream();if(!FU.canEdit(_e)){FU.denied(_e);return}}
    var name=$('fName').value.trim();if(!name)return;
    var rec={name:name,blurb:$('fBlurb').value.trim(),cat:$('fCat').value,status:$('fStatus').value,date:$('fDate').value,prog:+$('fProg').value};
    if(rec.status==='visited')rec.prog=100;
    var file=draft.file,removeOld=draft.remove,btn=$('saveBtn'),lab=btn.textContent;
    function commit(media){
      var oldId=null;
      if(editing){
        dreams.forEach(function(d){if(d.id===editing){
          var catChanged=d.cat!==rec.cat;Object.assign(d,rec);if(catChanged)d.scene=SCENE_FOR_CAT[rec.cat];
          if(media||removeOld){oldId=d.media&&d.media.id;if(media)d.media=media;else delete d.media}
        }});toast('Saved');
      }else{
        rec.id=Date.now();FU.stamp(rec);rec.fav=false;rec.scene=SCENE_FOR_CAT[rec.cat];if(media)rec.media=media;dreams.push(rec);toast('Added '+name);
      }
      save();FUAPI.removeMedia(oldId);saving=false;closeDlg();render();
    }
    if(!file){commit(null);return}
    saving=true;btn.disabled=true;btn.textContent='Uploading 0%';
    FUAPI.upload(file,function(p){btn.textContent='Uploading '+p+'%'}).then(commit)
      .catch(function(err){saving=false;toast(err.message)})
      .then(function(){btn.disabled=false;btn.textContent=lab});
  });
  dlg.addEventListener('click',function(e){if(e.target===dlg)closeDlg()});
  dlg.addEventListener('close',function(){$('fMediaPrev').innerHTML=''});

  /* Events */
  $('addBtn').addEventListener('click',function(){openDlg(null)});
  $('chips').addEventListener('click',function(e){var b=e.target.closest('[data-s]');if(!b)return;state.status=b.dataset.s;render()});
  $('sort').addEventListener('change',function(){state.sort=this.value;renderGrid()});
  $('cats').addEventListener('click',function(e){var b=e.target.closest('[data-cat]');if(!b)return;state.cat=b.dataset.cat||null;render()});
  $('next').addEventListener('click',function(e){var b=e.target.closest('[data-id]');if(b)openDlg(+b.dataset.id)});
  $('grid').addEventListener('click',function(e){
    var f=e.target.closest('[data-fav]');
    if(f){e.stopPropagation();var id=+f.dataset.fav;dreams.forEach(function(d){if(d.id===id)d.fav=!d.fav});save();renderGrid();return}
    var c=e.target.closest('.card');if(c)openDlg(+c.dataset.id);
  });
  $('grid').addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('card')){e.preventDefault();openDlg(+e.target.dataset.id)}
  });
  var toast=FU.toast;

  /* Banner polaroids */
  $('polaA').innerHTML=scene('beach');
  $('polaB').innerHTML=scene('city');
  render();
})(window.FU.scope('dreams'));