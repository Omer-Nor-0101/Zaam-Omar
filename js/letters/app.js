/* Letters page logic: search, filter, sort, cards, sidebar, reading and writing dialogs. */
(function(document){
  var FU=window.FU,L=FU.letters,CATS=L.CATS,toast=FU.toast,lscene=FU.lscene;
  var letters=L.load();
  function save(){L.save(letters)}
  var $=function(id){return document.getElementById(id)};
  var SCENE_FOR_CAT={love:'couple',special:'roses',note:'note',foryou:'letter'};
  var CHIP_ORDER=['all','love','note','special','foryou'];
  var state={cat:'all',q:'',sort:'newest'};
  var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var HEART='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/></svg>';
  var CAL='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function catOf(id){return CATS.filter(function(c){return c.id===id})[0]||CATS[0]}
  function fmt(d){var p=d.split('-');return MONTHS[+p[1]-1]+' '+(+p[2])+', '+p[0]}
  function today(){var n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')}
  function paras(b){return b.split(/\n\s*\n/).map(function(s){return s.trim()}).filter(Boolean)}
  function byId(id){return letters.filter(function(x){return x.id===id})[0]}

  function visible(){
    var q=state.q.trim().toLowerCase();
    var list=letters.filter(function(l){
      return (state.cat==='all'||l.cat===state.cat)&&(!q||(l.title+' '+l.body).toLowerCase().indexOf(q)!==-1);
    });
    if(state.sort==='newest')list.sort(function(a,b){return b.date.localeCompare(a.date)});
    if(state.sort==='oldest')list.sort(function(a,b){return a.date.localeCompare(b.date)});
    if(state.sort==='title')list.sort(function(a,b){return a.title.localeCompare(b.title)});
    if(state.sort==='fav')list.sort(function(a,b){return (b.fav-a.fav)||b.date.localeCompare(a.date)});
    return list;
  }

  function renderChips(){
    $('chips').innerHTML=CHIP_ORDER.map(function(id){
      var name=id==='all'?'All':catOf(id).name;
      return '<button type="button" class="chip" data-cat="'+id+'" aria-pressed="'+(state.cat===id)+'">'+name+'</button>';
    }).join('');
  }
  function renderGrid(){
    var list=visible();
    if(!list.length){
      $('lgrid').innerHTML='<div class="empty" style="grid-column:1/-1"><b>No letters found</b>Try another word or category, or write a new letter.</div>';
      return;
    }
    $('lgrid').innerHTML=list.map(function(l){
      var c=catOf(l.cat);
      return '<div class="lcard" role="button" tabindex="0" data-id="'+l.id+'" aria-label="Read '+esc(l.title)+'">'
        +'<div class="photo">'+lscene(l.scene||SCENE_FOR_CAT[l.cat])+'</div>'
        +'<div class="lcard-ui"><div class="ltop"><span class="tag '+l.cat+'">'+c.tag+'</span>'
        +'<button type="button" class="lfav" data-fav="'+l.id+'" aria-pressed="'+l.fav+'" aria-label="Favorite '+esc(l.title)+'">'+HEART+'</button></div>'
        +'<h3>'+esc(l.title)+'</h3><p class="ex">'+esc(paras(l.body)[0]||'')+'</p>'
        +'<div class="date">'+CAL+fmt(l.date)+'</div>'+FU.byline(l)+'</div></div>';
    }).join('');
  }
  function renderSide(){
    $('total').textContent=letters.length;
    var rows='';
    CATS.forEach(function(c){
      var n=letters.filter(function(l){return l.cat===c.id}).length;
      rows+='<li><button type="button" class="lcat" data-cat="'+c.id+'" aria-pressed="'+(state.cat===c.id)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+c.icon+'</svg>'+c.name+'<span class="n">'+n+'</span></button></li>';
    });
    $('lcats').innerHTML=rows;
    var latest=letters.slice().sort(function(a,b){return b.date.localeCompare(a.date)})[0];
    $('recent').innerHTML=latest
      ?'<div class="recent" data-id="'+latest.id+'"><div class="thumb">'+lscene(latest.scene||SCENE_FOR_CAT[latest.cat])+'</div><div><b>'+esc(latest.title)+'</b><small>'+fmt(latest.date)+'</small></div></div><button type="button" class="vall" id="vall">View All Letters &rarr;</button>'
      :'<p class="none" style="margin:0;color:var(--muted);font-size:12.5px">No letters yet. Write the first one.</p>';
  }
  function render(){renderChips();renderGrid();renderSide()}

  /* Reading dialog */
  var readDlg=$('readDlg'),writeDlg=$('writeDlg'),openId=null,editing=null,delArmed=false;
  function openDialog(d){if(d.showModal)d.showModal();else d.setAttribute('open','')}
  function closeDialog(d){if(d.close)d.close();else d.removeAttribute('open')}
  function openRead(id){
    var l=byId(id);if(!l)return;openId=id;
    var c=catOf(l.cat);
    $('rTag').className='tag '+l.cat;$('rTag').textContent=c.tag;
    $('rDate').textContent=fmt(l.date);
    $('rTitle').textContent=l.title;
    var ps=paras(l.body);
    $('rBody').innerHTML=ps.map(function(p,i){
      var sign=i===ps.length-1&&ps.length>1&&p.length<=32;
      return '<p'+(sign?' class="sign"':'')+'>'+esc(p)+'</p>';
    }).join('');
    $('rFav').setAttribute('aria-pressed',l.fav);
    $('rFav').querySelector('span').textContent=l.fav?'Favorited':'Favorite';
    openDialog(readDlg);
  }
  $('rClose').addEventListener('click',function(){closeDialog(readDlg)});
  $('rFav').addEventListener('click',function(){
    var l=byId(openId);if(!l)return;
    l.fav=!l.fav;save();
    $('rFav').setAttribute('aria-pressed',l.fav);
    $('rFav').querySelector('span').textContent=l.fav?'Favorited':'Favorite';
    renderGrid();
  });
  $('rEdit').addEventListener('click',function(){closeDialog(readDlg);openWrite(openId)});
  readDlg.addEventListener('click',function(e){if(e.target===readDlg)closeDialog(readDlg)});

  /* Writing dialog */
  $('fCat').innerHTML=CATS.map(function(c){return '<option value="'+c.id+'">'+c.name+'</option>'}).join('');
  function openWrite(id){
    editing=id;delArmed=false;$('delBtn').textContent='Delete';
    var l=id?byId(id):null;
    $('wTitle').textContent=l?'Edit letter':'Write a letter';
    $('saveBtn').textContent=l?'Save changes':'Save letter';
    $('delBtn').hidden=!l;
    $('fTitle').value=l?l.title:'';
    $('fCat').value=l?l.cat:'love';
    $('fDate').value=l?l.date:today();
    $('fBody').value=l?l.body:'';
    FU.lockForm($('form'),!!l&&!FU.canEdit(l),l);
    openDialog(writeDlg);
    $('fTitle').focus();
  }
  $('cancelBtn').addEventListener('click',function(){closeDialog(writeDlg)});
  $('delBtn').addEventListener('click',function(){
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    if(!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    letters=letters.filter(function(x){return x.id!==editing});
    save();closeDialog(writeDlg);render();toast('Letter deleted');
  });
  $('form').addEventListener('submit',function(e){
    e.preventDefault();
    if(editing&&!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    var rec={title:$('fTitle').value.trim(),cat:$('fCat').value,date:$('fDate').value,body:$('fBody').value.trim()};
    if(!rec.title||!rec.body||!rec.date)return;
    if(editing){
      var l=byId(editing);var changed=l.cat!==rec.cat;
      Object.assign(l,rec);if(changed)l.scene=SCENE_FOR_CAT[rec.cat];
      toast('Letter saved');
    }else{
      rec.id=Date.now();FU.stamp(rec);rec.fav=false;rec.scene=SCENE_FOR_CAT[rec.cat];
      letters.push(rec);toast('Letter added');
    }
    save();closeDialog(writeDlg);render();
  });
  writeDlg.addEventListener('click',function(e){if(e.target===writeDlg)closeDialog(writeDlg)});

  /* Page events */
  $('writeBtn').addEventListener('click',function(){openWrite(null)});
  $('q').addEventListener('input',function(){state.q=this.value;renderGrid()});
  $('sort').addEventListener('change',function(){state.sort=this.value;renderGrid()});
  $('chips').addEventListener('click',function(e){var b=e.target.closest('[data-cat]');if(!b)return;state.cat=b.dataset.cat;render()});
  $('lcats').addEventListener('click',function(e){
    var b=e.target.closest('[data-cat]');if(!b)return;
    state.cat=state.cat===b.dataset.cat?'all':b.dataset.cat;render();
  });
  $('recent').addEventListener('click',function(e){
    if(e.target.closest('#vall')){
      state.cat='all';state.q='';$('q').value='';render();
      $('lgrid').scrollIntoView({block:'start'});return;
    }
    var r=e.target.closest('[data-id]');if(r)openRead(+r.dataset.id);
  });
  $('lgrid').addEventListener('click',function(e){
    var f=e.target.closest('[data-fav]');
    if(f){e.stopPropagation();var id=+f.dataset.fav;var l=byId(id);if(l){l.fav=!l.fav;save();renderGrid()}return}
    var c=e.target.closest('.lcard');if(c)openRead(+c.dataset.id);
  });
  $('lgrid').addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('lcard')){e.preventDefault();openRead(+e.target.dataset.id)}
  });

  $('polaA').innerHTML=lscene('couple');
  $('polaB').innerHTML=lscene('hands');
  render();
})(window.FU.scope('letters'));