/* Places: a hand-drawn style map with pins, a detail panel and a list. */
(function(document){
  var FU=window.FU,esc=FU.esc,store=FU.store,toast=FU.toast;
  var KEY='forever-us-places-v1';
  var TYPES=[['food','Cafes & Food','<path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18M17 3c-2 2-3 5-3 8h3v10"/>'],['nature','Nature','<path d="M12 21V11M12 11C8 11 5 8 5 4c4 0 7 3 7 7zM12 14c3 0 6-2 6-6-4 0-6 2-6 6z"/>'],['trips','Trips','<path d="M3 17l18-8-5 12-4-5z"/>'],['hangout','Our Spots','<path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/>']];
  var SEED=FU.seeds.places();
  var places=store.get(KEY,null);if(!Array.isArray(places))places=SEED;
  var state={type:'all',sel:null,placing:null};
  var $=function(id){return document.getElementById(id)};
  var editing=null,delArmed=false;
  function save(){if(!store.set(KEY,places))toast('Storage is full, so this change will be lost when you close the page')}
  function byId(id){return places.filter(function(p){return p.id===id})[0]}
  function typeOf(id){return TYPES.filter(function(t){return t[0]===id})[0]||TYPES[3]}
  function icon(t){return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+typeOf(t)[2]+'</svg>'}
  function hearts(n){var s='<span class="hearts" aria-label="'+n+' of 5">';for(var i=1;i<=5;i++)s+='<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="'+(i>n?'off':'')+'"><path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/></svg>';return s+'</span>'}
  var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){if(!d)return 'Date not set';var p=d.split('-');return MONTHS[+p[1]-1]+' '+(+p[2])+', '+p[0]}

  /* Map drawing: land, river, lake, park, roads */
  var MAP_SVG='<svg viewBox="0 0 160 110" preserveAspectRatio="none" aria-hidden="true">'
    +'<rect width="160" height="110" fill="var(--map-land)"/>'
    +'<path d="M-5 78C20 70 38 84 60 74C84 63 96 48 120 52C140 55 150 44 165 38L165 54C150 60 142 70 120 68C98 66 88 80 62 90C40 99 20 92 -5 98z" fill="var(--map-water)"/>'
    +'<ellipse cx="132" cy="22" rx="20" ry="11" fill="var(--map-water)"/>'
    +'<path d="M12 8h34q6 0 6 6v18q0 6-6 6H12q-6 0-6-6V14q0-6 6-6z" fill="var(--map-park)"/>'
    +'<path d="M68 96h26q5 0 5 5v6H63v-6q0-5 5-5z" fill="var(--map-park)"/>'
    +'<g fill="none" stroke="var(--map-road)" stroke-width="2.600" stroke-linecap="round"><path d="M0 40L70 36L110 14L160 10"/><path d="M52 0L56 60L40 110"/><path d="M96 0L100 40L90 110"/><path d="M0 60L50 62L100 40L160 56"/><path d="M118 0L126 40L160 84"/></g>'
    +'<g fill="none" stroke="var(--map-line)" stroke-width=".7"><path d="M0 20L50 18M70 24L160 28M0 90L40 92M104 82L160 96M20 0L24 46M76 0L80 60M140 56L136 110"/></g>'
    +'</svg>';
  var PIN='<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M17 41C6 28 2 22 2 15 2 7.800 8.800 2 17 2s15 5.800 15 13c0 7-4 13-15 26z" fill="currentColor" stroke="#fff" stroke-width="2"/><path d="M17 22.500C11 18.500 9.500 16 9.500 13.800c0-1.800 1.400-3.100 3.200-3.100 1.700 0 3.200.9 4.300 2.400 1.100-1.500 2.600-2.400 4.300-2.400 1.800 0 3.200 1.300 3.200 3.100 0 2.200-1.500 4.700-7.500 8.700z" fill="#fff"/></svg>';

  function render(){
    $('chips').innerHTML=[['all','All']].concat(TYPES.map(function(t){return [t[0],t[1]]})).map(function(c){return '<button type="button" class="chip" data-t="'+c[0]+'" aria-pressed="'+(state.type===c[0])+'">'+c[1]+'</button>'}).join('');
    var l=places.filter(function(p){return state.type==='all'||p.type===state.type});
    if(state.sel&&!l.some(function(p){return p.id===state.sel}))state.sel=null;
    if(!state.sel&&l.length)state.sel=l[0].id;
    var map=$('map');
    map.className='map'+(state.placing?' placing':'');
    map.innerHTML=MAP_SVG+l.map(function(p){
      return '<button type="button" class="pin" style="left:'+p.x+'%;top:'+p.y+'%" data-id="'+p.id+'" aria-pressed="'+(state.sel===p.id)+'" aria-label="'+esc(p.name)+'">'+PIN+'</button>';
    }).join('')+(state.placing?'<div class="place-hint">Click anywhere on the map to place the pin</div>':'');
    $('plist').innerHTML=l.length?l.map(function(p){
      return '<li><button type="button" class="prow" data-id="'+p.id+'" aria-pressed="'+(state.sel===p.id)+'"><span class="dot">'+icon(p.type)+'</span><span><b>'+esc(p.name)+'</b><small>'+typeOf(p.type)[1]+'</small></span></button></li>';
    }).join(''):'<li class="hint">No places of this type yet.</li>';
    var s=state.sel?byId(state.sel):null;
    $('detail').innerHTML=s?'<h4>'+esc(s.name)+(s.sample?'<span class="sample-chip">Example</span>':'')+'</h4><div class="meta-line">'+hearts(s.rating)+'<span>'+typeOf(s.type)[1]+'</span><span>'+fmt(s.date)+'</span></div><p>'+esc(s.note||'No memory written yet.')+'</p>'+FU.byline(s)+'<div class="actions"><button type="button" id="dEdit">Edit place</button></div>'
      :'<p class="hint">Add a place to see it here.</p>';
  }

  $('map').addEventListener('click',function(e){
    var pin=e.target.closest('.pin');
    if(state.placing&&!pin){
      var r=this.getBoundingClientRect();
      var p=byId(state.placing);
      p.x=Math.max(3,Math.min(97,Math.round((e.clientX-r.left)/r.width*1000)/10));
      p.y=Math.max(10,Math.min(97,Math.round((e.clientY-r.top)/r.height*1000)/10));
      state.sel=state.placing;state.placing=null;save();render();toast('Pin placed');return;
    }
    if(pin){state.sel=+pin.dataset.id;render()}
  });
  $('plist').addEventListener('click',function(e){var b=e.target.closest('.prow');if(b){state.sel=+b.dataset.id;render()}});
  $('chips').addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(b){state.type=b.dataset.t;render()}});
  $('detail').addEventListener('click',function(e){if(e.target.id==='dEdit')openForm(state.sel)});

  var dlg=$('pDlg');FU.backdropClose(dlg);
  $('pfType').innerHTML=TYPES.map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>'}).join('');
  $('pfRating').addEventListener('input',function(){$('pfRatingOut').textContent=this.value});
  function openForm(id){
    editing=id;delArmed=false;$('pfDel').textContent='Delete';
    var p=id?byId(id):null;
    $('pfTitle').textContent=p?'Edit place':'Add a place';$('pfSave').textContent=p?'Save changes':'Add place';
    $('pfDel').hidden=!p;$('pfMove').hidden=!p;
    $('pfName').value=p?p.name:'';$('pfType').value=p?p.type:'food';$('pfDate').value=p?(p.date||''):'';
    $('pfRating').value=p?p.rating:5;$('pfRatingOut').textContent=p?p.rating:5;$('pfNote').value=p?p.note:'';
    FU.lockForm($('pf'),!!p&&!FU.canEdit(p),p);
    FU.open(dlg);$('pfName').focus();
  }
  $('addBtn').addEventListener('click',function(){openForm(null)});
  $('pfCancel').addEventListener('click',function(){FU.close(dlg)});
  $('pfMove').addEventListener('click',function(){state.placing=editing;state.type='all';FU.close(dlg);render();$('map').scrollIntoView({block:'center'})});
  $('pfDel').addEventListener('click',function(){
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    if(!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    places=places.filter(function(p){return p.id!==editing});if(state.sel===editing)state.sel=null;save();FU.close(dlg);render();toast('Place deleted');
  });
  $('pf').addEventListener('submit',function(e){
    e.preventDefault();
    if(editing&&!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    var rec={name:$('pfName').value.trim(),type:$('pfType').value,date:$('pfDate').value,rating:+$('pfRating').value,note:$('pfNote').value.trim()};
    if(!rec.name)return;
    if(editing){var p=byId(editing);Object.assign(p,rec);if(p.sample&&!p.by)FU.stamp(p);delete p.sample;toast('Place saved')}
    else{
      rec.id=Date.now();FU.stamp(rec);rec.x=50;rec.y=50;places.push(rec);state.sel=rec.id;state.placing=rec.id;state.type='all';
      toast('Now click the map to place the pin');
    }
    save();FU.close(dlg);render();
    if(state.placing)$('map').scrollIntoView({block:'center'});
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&state.placing){state.placing=null;render()}});
  render();
})(window.FU.scope('places'));