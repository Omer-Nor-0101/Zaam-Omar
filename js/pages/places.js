/* Places: a REAL world map (OpenStreetMap through Leaflet). Every place is a real location found by search,
   by your phone's location, or by tapping the map. Names, memories and ratings are saved with the coordinates. */
(function(document){
  var FU=window.FU,esc=FU.esc,store=FU.store,toast=FU.toast;
  var KEY='forever-us-places-v1';
  var TYPES=[['food','Cafes & Food','<path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18M17 3c-2 2-3 5-3 8h3v10"/>'],['nature','Nature','<path d="M12 21V11M12 11C8 11 5 8 5 4c4 0 7 3 7 7zM12 14c3 0 6-2 6-6-4 0-6 2-6 6z"/>'],['trips','Trips','<path d="M3 17l18-8-5 12-4-5z"/>'],['hangout','Our Spots','<path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/>']];
  var places=store.get(KEY,null);
  if(!Array.isArray(places))places=[];
  /* The old invented example places (hand-drawn map, no real location) are removed. */
  var before=places.length;
  places=places.filter(function(p){return !(p.sample&&typeof p.lat!=='number')});
  if(places.length!==before)store.set(KEY,places);

  var state={type:'all',sel:null,placing:false};
  var $=function(id){return document.getElementById(id)};
  var editing=null,delArmed=false,loc=null,draft=null,markers={},map=null,tmpMarker=null;
  function save(){if(!store.set(KEY,places))toast('Storage is full, so this change will be lost when you close the page')}
  function byId(id){return places.filter(function(p){return p.id===id})[0]}
  function typeOf(id){return TYPES.filter(function(t){return t[0]===id})[0]||TYPES[3]}
  function real(p){return typeof p.lat==='number'&&typeof p.lng==='number'}
  function icon(t){return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+typeOf(t)[2]+'</svg>'}
  function hearts(n){var s='<span class="hearts" aria-label="'+n+' of 5">';for(var i=1;i<=5;i++)s+='<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="'+(i>n?'off':'')+'"><path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/></svg>';return s+'</span>'}
  var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){if(!d)return 'Date not set';var p=d.split('-');return MONTHS[+p[1]-1]+' '+(+p[2])+', '+p[0]}
  var PIN='<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M17 41C6 28 2 22 2 15 2 7.800 8.800 2 17 2s15 5.800 15 13c0 7-4 13-15 26z" fill="currentColor" stroke="#fff" stroke-width="2"/><path d="M17 22.500C11 18.500 9.500 16 9.500 13.800c0-1.800 1.400-3.100 3.200-3.100 1.700 0 3.200.9 4.300 2.400 1.100-1.500 2.600-2.400 4.300-2.400 1.800 0 3.200 1.300 3.200 3.100 0 2.200-1.500 4.700-7.500 8.700z" fill="#fff"/></svg>';
  function coord(n){return Math.round(n*1e6)/1e6}

  /* ---------- The map ---------- */
  var mapEl=$('map');
  if(window.L){
    map=L.map(mapEl,{worldCopyJump:true,zoomControl:true,attributionControl:true}).setView([20,10],2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    if(window.ResizeObserver)new ResizeObserver(function(){map.invalidateSize()}).observe(mapEl);
    addEventListener('load',function(){map.invalidateSize()});
    map.on('click',function(e){
      if(!state.placing)return;
      state.placing=false;mapEl.classList.remove('placing');
      setLoc({lat:coord(e.latlng.lat),lng:coord(e.latlng.lng),address:''},true);
      reopenForm();
      reverse(e.latlng.lat,e.latlng.lng);
    });
  }else{
    mapEl.innerHTML='<div class="map-off">The world map could not load. Check your internet connection and reload the page.</div>';
  }
  function markerIcon(sel){return L.divIcon({className:'lpin'+(sel?' sel':''),html:PIN,iconSize:[34,42],iconAnchor:[17,41],popupAnchor:[0,-38]})}

  function render(focus){
    $('chips').innerHTML=[['all','All']].concat(TYPES.map(function(t){return [t[0],t[1]]})).map(function(c){return '<button type="button" class="chip" data-t="'+c[0]+'" aria-pressed="'+(state.type===c[0])+'">'+c[1]+'</button>'}).join('');
    var l=places.filter(function(p){return state.type==='all'||p.type===state.type});
    if(state.sel&&!l.some(function(p){return p.id===state.sel}))state.sel=null;
    if(!state.sel&&l.length)state.sel=l[0].id;
    if(map){
      Object.keys(markers).forEach(function(k){map.removeLayer(markers[k])});markers={};
      var pts=[];
      l.filter(real).forEach(function(p){
        var m=L.marker([p.lat,p.lng],{icon:markerIcon(state.sel===p.id),title:p.name,keyboard:true,zIndexOffset:state.sel===p.id?1000:0}).addTo(map);
        m.on('click',function(){state.sel=p.id;render(true)});
        markers[p.id]=m;pts.push([p.lat,p.lng]);
      });
      var s0=state.sel?byId(state.sel):null;
      if(focus&&s0&&real(s0))map.setView([s0.lat,s0.lng],Math.max(map.getZoom(),13),{animate:true});
      else if(pts.length>1)map.fitBounds(pts,{padding:[40,40],maxZoom:14});
      else if(pts.length===1)map.setView(pts[0],13);
      setTimeout(function(){map.invalidateSize()},0);
    }
    $('plist').innerHTML=l.length?l.map(function(p){
      return '<li><button type="button" class="prow" data-id="'+p.id+'" aria-pressed="'+(state.sel===p.id)+'"><span class="dot">'+icon(p.type)+'</span><span><b>'+esc(p.name)+'</b><small>'+typeOf(p.type)[1]+(real(p)?'':' · needs a real location')+'</small></span></button></li>';
    }).join(''):'<li class="hint">'+(places.length?'No places of this type yet.':'No places yet. Press Add Place and search for our first real place.')+'</li>';
    var s=state.sel?byId(state.sel):null;
    $('detail').innerHTML=s?'<h4>'+esc(s.name)+'</h4><div class="meta-line">'+hearts(s.rating)+'<span>'+typeOf(s.type)[1]+'</span><span>'+fmt(s.date)+'</span></div>'
      +(real(s)?'<p class="addr">'+esc(s.address||(s.lat.toFixed(4)+', '+s.lng.toFixed(4)))+'</p>':'<p class="addr warn">This place has no real location yet. Press Edit place and search for it.</p>')
      +'<p>'+esc(s.note||'No memory written yet.')+'</p>'+FU.byline(s)
      +'<div class="actions">'+(real(s)?'<a class="btn-link" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+s.lat+','+s.lng+'">Directions</a>':'')+'<button type="button" id="dEdit">Edit place</button></div>'
      :'<p class="hint">Add a place to see it here.</p>';
  }

  $('plist').addEventListener('click',function(e){var b=e.target.closest('.prow');if(b){state.sel=+b.dataset.id;render(true)}});
  $('chips').addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(b){state.type=b.dataset.t;render()}});
  $('detail').addEventListener('click',function(e){if(e.target.id==='dEdit')openForm(state.sel)});

  /* ---------- Finding the real place ---------- */
  var dlg=$('pDlg');FU.backdropClose(dlg);
  $('pfType').innerHTML=TYPES.map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>'}).join('');
  $('pfRating').addEventListener('input',function(){$('pfRatingOut').textContent=this.value});

  function setLoc(l,fromMap){
    loc=l;
    var out=$('pfLoc');
    if(!l){out.textContent='No location chosen yet. Search above, use your location, or tap the map.';out.classList.remove('ok');return}
    out.textContent='Real location set: '+(l.address||(l.lat.toFixed(4)+', '+l.lng.toFixed(4)));out.classList.add('ok');
    if(map){
      if(tmpMarker)map.removeLayer(tmpMarker);
      tmpMarker=L.marker([l.lat,l.lng],{icon:markerIcon(true),interactive:false}).addTo(map);
      if(!fromMap)map.setView([l.lat,l.lng],15);
    }
  }
  function reverse(lat,lng){
    fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat='+lat+'&lon='+lng).then(function(r){return r.json()}).then(function(j){
      if(!j||!j.display_name||!loc||loc.lat!==coord(lat)||loc.lng!==coord(lng))return;
      loc.address=j.display_name;
      if(dlg.open){setLoc(loc,true)}
      if(!$('pfName').value.trim()&&j.name)$('pfName').value=String(j.name).slice(0,60);
    }).catch(function(){});
  }
  function search(){
    var q=$('pfQ').value.trim(),res=$('pfRes');
    if(q.length<2){toast('Type the name of the place first');return}
    var btn=$('pfSearch');btn.disabled=true;btn.textContent='Searching...';
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q='+encodeURIComponent(q)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(list){
      res.hidden=false;
      if(!list.length){res.innerHTML='<li class="none">Nothing found. Try the city name too, for example "Cafe Name, Hargeisa".</li>';return}
      res.innerHTML=list.map(function(r,i){return '<li><button type="button" data-i="'+i+'"><b>'+esc(r.name||String(r.display_name).split(',')[0])+'</b><small>'+esc(r.display_name)+'</small></button></li>'}).join('');
      res._list=list;
    }).catch(function(){res.hidden=false;res.innerHTML='<li class="none">Could not search right now. Check your connection.</li>'})
      .then(function(){btn.disabled=false;btn.textContent='Search'});
  }
  $('pfSearch').addEventListener('click',search);
  $('pfQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();search()}});
  $('pfRes').addEventListener('click',function(e){
    var b=e.target.closest('[data-i]');if(!b)return;
    var r=this._list[+b.dataset.i];if(!r)return;
    setLoc({lat:coord(+r.lat),lng:coord(+r.lon),address:r.display_name});
    if(!$('pfName').value.trim())$('pfName').value=String(r.name||String(r.display_name).split(',')[0]).slice(0,60);
    this.hidden=true;
  });
  $('pfGeo').addEventListener('click',function(){
    if(!navigator.geolocation){toast('Your browser cannot share its location');return}
    var b=this;b.disabled=true;
    navigator.geolocation.getCurrentPosition(function(p){
      b.disabled=false;setLoc({lat:coord(p.coords.latitude),lng:coord(p.coords.longitude),address:''});reverse(p.coords.latitude,p.coords.longitude);
    },function(){b.disabled=false;toast('Could not get your location. Allow location access or search instead.')},{enableHighAccuracy:true,timeout:15000});
  });
  $('pfPick').addEventListener('click',function(){
    if(!map){toast('The map is not loaded');return}
    keepDraft();FU.close(dlg);state.placing=true;mapEl.classList.add('placing');
    mapEl.scrollIntoView({block:'center',behavior:'smooth'});toast('Tap the exact spot on the map');
  });

  /* ---------- Add / edit ---------- */
  function keepDraft(){draft={id:editing,name:$('pfName').value,type:$('pfType').value,date:$('pfDate').value,rating:$('pfRating').value,note:$('pfNote').value,q:$('pfQ').value}}
  function reopenForm(){openForm(draft&&draft.id||null,true)}
  function openForm(id,keep){
    editing=id;delArmed=false;$('pfDel').textContent='Delete';
    var p=id?byId(id):null;
    if(!keep){draft=null;loc=p&&real(p)?{lat:p.lat,lng:p.lng,address:p.address||''}:null}
    $('pfTitle').textContent=p?'Edit place':'Add a place';$('pfSave').textContent=p?'Save changes':'Add place';
    $('pfDel').hidden=!p;
    var d=keep&&draft;
    $('pfName').value=d?d.name:(p?p.name:'');$('pfType').value=d?d.type:(p?p.type:'food');$('pfDate').value=d?d.date:(p?(p.date||''):'');
    $('pfRating').value=d?d.rating:(p?p.rating:5);$('pfRatingOut').textContent=$('pfRating').value;$('pfNote').value=d?d.note:(p?p.note:'');
    $('pfQ').value=d?d.q:'';$('pfRes').hidden=true;
    var locked=!!p&&!FU.canEdit(p);
    FU.lockForm($('pf'),locked,p);
    $('pfFind').hidden=locked;
    FU.open(dlg);
    setLoc(loc,true);
    (p?$('pfName'):$('pfQ')).focus();
  }
  $('addBtn').addEventListener('click',function(){openForm(null)});
  $('pfCancel').addEventListener('click',function(){FU.close(dlg)});
  dlg.addEventListener('close',function(){if(tmpMarker&&map&&!state.placing){map.removeLayer(tmpMarker);tmpMarker=null}});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&state.placing){state.placing=false;mapEl.classList.remove('placing');reopenForm()}
  });
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
    if(!loc){toast('Choose the real place first: search for it, use your location, or tap the map');$('pfQ').focus();return}
    rec.lat=loc.lat;rec.lng=loc.lng;rec.address=loc.address||'';
    var id;
    if(editing){var p=byId(editing);Object.assign(p,rec);delete p.x;delete p.y;if(p.sample&&!p.by)FU.stamp(p);delete p.sample;id=editing;toast('Place saved')}
    else{rec.id=Date.now();FU.stamp(rec);places.push(rec);id=rec.id;toast('Place added')}
    if(tmpMarker&&map){map.removeLayer(tmpMarker);tmpMarker=null}
    state.sel=id;state.type='all';draft=null;
    save();FU.close(dlg);render(true);
  });
  render();
})(window.FU.scope('places'));
