/* Our Story: a two-sided timeline of milestones you can add, edit and delete. */
(function(document){
  var FU=window.FU,esc=FU.esc,store=FU.store,toast=FU.toast;
  var KEY='forever-us-story-v2',OLD_KEY='forever-us-story-v1';
  var ARTS=[['couple','Together at sunset'],['neon','Neon sign'],['lantern','Candlelight'],['mountain','Mountains'],['plane','Plane window'],['gift','A gift'],['hands','Heart hands'],['roses','Roses'],['beach','Beach'],['city','City lights'],['cake','Celebration'],['flowers','Flowers'],['letter','A letter'],['sparkler','Sparkler'],['ferris','Fair night']];
  var P={
    people:'<circle cx="9" cy="8" r="3.200"/><circle cx="17" cy="9" r="2.600"/><path d="M3 20c0-3.500 2.800-6 6-6s6 2.500 6 6zM15 20c0-2 .8-3.600 2.200-4.600 2.300.2 3.800 2 3.800 4.600z"/>',
    chat:'<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
    calendar:'<path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 5v9h14v-9zM8 3h2v4H8zm6 0h2v4h-2z"/>',
    camera:'<path d="M9 4l-1.500 2H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-3.500L15 4zm3 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>',
    plane:'<path d="M21 3L3 10.500l6 2.500 2.500 6zM9 13l6-5"/>',
    gift:'<path d="M3 8h18v4H3zM5 12h14v9H5zM11 8h2v13h-2zM12 8C9 8 7 6 8 4.500 9.500 3 12 5 12 8zm0 0c3 0 5-2 4-3.500C14.500 3 12 5 12 8z"/>',
    ring:'<path d="M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-3a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM9 3l3 3 3-3-1.500-1h-3z"/>',
    heart:'<path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/>'
  };
  var ICONS=[['people','Two people'],['chat','Conversation'],['calendar','Calendar'],['camera','Camera'],['plane','Plane'],['gift','Gift'],['ring','Ring'],['heart','Heart']];
  function svg(name,size){return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="'+(name==='plane'?1.800:0.3)+'" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+(P[name]||P.heart)+'</svg>'}
  var HEART_S=svg('heart',13);

  function load(){
    var v=store.get(KEY,null);if(Array.isArray(v))return v;
    var old=store.get(OLD_KEY,null);
    if(Array.isArray(old))return old.map(function(m){m.icon=m.icon||'heart';m.type=m.type||'milestone';return m});
    return FU.seeds.story();
  }
  var items=load();
  var state={type:'all'},editing=null,delArmed=false;
  var $=function(id){return document.getElementById(id)};
  function save(){if(!store.set(KEY,items))toast('Storage is full, so this change will be lost when you close the page')}
  function byId(id){return items.filter(function(x){return x.id===id})[0]}
  function sorted(){
    return items.slice().sort(function(a,b){
      if(a.future!==b.future)return a.future?1:-1;
      return (a.date||'').localeCompare(b.date||'');
    });
  }
  function matches(m){return state.type==='all'||(state.type==='future'?m.future:(!m.future&&m.type===state.type))}

  function render(){
    var l=sorted().filter(matches);
    if(!l.length){$('timeline').innerHTML='<div class="empty">Nothing in this group yet. Use Add Milestone at the top to write a chapter.</div>';return}
    $('timeline').innerHTML=l.map(function(m,i){
      var side=i%2===0?'L':'R';
      return '<div class="tl2-item '+side+'"><span class="tl2-node" aria-hidden="true">'+svg(m.icon,20)+'</span>'
        +'<button type="button" class="tl2-card" data-id="'+m.id+'" aria-label="Edit '+esc(m.title)+'"><span class="tl2-img">'+FU.art(m.scene||'couple')+'<span class="tl2-badge">'+svg('heart',13).replace('currentColor','#fff')+'</span></span>'
        +'<span class="tl2-text"><span class="tl2-date">'+(m.future||!m.date?'Future...':esc(FU.dmy(m.date)))+'</span><h3>'+esc(m.title)+HEART_S+'</h3><p>'+esc(m.text)+'</p>'+FU.byline(m)+'</span></button></div>';
    }).join('');
  }
  function paintSince(){
    $('sinceDate').textContent=FU.dmy(FU.startDate());
    var t=FU.together();$('sinceDays').textContent=(t?t.total.toLocaleString():'0')+' Days Together';
  }

  var dlg=$('sDlg');FU.backdropClose(dlg);
  $('sfArt').innerHTML=ARTS.map(function(a){return '<option value="'+a[0]+'">'+a[1]+'</option>'}).join('');
  $('sfIcon').innerHTML=ICONS.map(function(a){return '<option value="'+a[0]+'">'+a[1]+'</option>'}).join('');
  $('sfFuture').addEventListener('change',function(){$('sfDate').disabled=this.checked;$('sfDate').required=!this.checked});
  function openForm(id){
    editing=id;delArmed=false;$('sfDel').textContent='Delete';
    var m=id?byId(id):null;
    $('sfTitle').textContent=m?'Edit milestone':'Add a milestone';$('sfSave').textContent=m?'Save changes':'Add milestone';
    $('sfDel').hidden=!m;
    $('sfName').value=m?m.title:'';
    $('sfFuture').checked=!!(m&&m.future);$('sfDate').disabled=$('sfFuture').checked;$('sfDate').required=!$('sfFuture').checked;
    $('sfDate').value=m?(m.date||''):new Date().toISOString().slice(0,10);
    $('sfType').value=m&&m.type&&m.type!=='future'?m.type:'first';
    $('sfText').value=m?m.text:'';$('sfArt').value=m?(m.scene||'couple'):'couple';$('sfIcon').value=m?(m.icon||'heart'):'heart';
    FU.lockForm($('sf'),!!m&&!FU.canEdit(m),m);
    FU.open(dlg);$('sfName').focus();
  }
  $('addBtn').addEventListener('click',function(){openForm(null)});
  $('timeline').addEventListener('click',function(e){var c=e.target.closest('.tl2-card');if(c)openForm(+c.dataset.id)});
  $('typeSel').addEventListener('change',function(){state.type=this.value;render()});
  $('sfCancel').addEventListener('click',function(){FU.close(dlg)});
  $('sfDel').addEventListener('click',function(){
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    if(!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    items=items.filter(function(x){return x.id!==editing});save();FU.close(dlg);render();toast('Milestone deleted');
  });
  $('sf').addEventListener('submit',function(e){
    e.preventDefault();
    var future=$('sfFuture').checked;
    var rec={title:$('sfName').value.trim(),date:future?'':$('sfDate').value,type:future?'future':$('sfType').value,future:future,text:$('sfText').value.trim(),scene:$('sfArt').value,icon:$('sfIcon').value};
    if(!rec.title||!rec.text||(!future&&!rec.date))return;
    if(editing&&!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    if(editing){var m=byId(editing);Object.assign(m,rec);if(m.sample&&!m.by)FU.stamp(m);delete m.sample;toast('Milestone saved')}
    else{rec.id=Date.now();FU.stamp(rec);items.push(rec);toast('Milestone added')}
    save();FU.close(dlg);render();
  });

  FU.onDateChange=paintSince;
  $('polaA').innerHTML=FU.art('couple');$('polaB').innerHTML=FU.art('hands');$('polaC').innerHTML=FU.art('mountain');
  paintSince();render();
})(window.FU.scope('story'));