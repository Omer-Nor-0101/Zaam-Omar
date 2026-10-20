/* Surprises page: add, edit and preview special days. */
(function(document){
  var FU=window.FU,SP=FU.sp,esc=FU.esc,toast=FU.toast;
  var $=function(id){return document.getElementById(id)};
  var items=SP.load(),editing=null,delArmed=false;
  function save(){if(!SP.save(items))toast('Storage is full, so this change will be lost when you close the page')}
  function byId(id){return items.filter(function(x){return String(x.id)===String(id)})[0]}
  var ICON={
    birthday:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v3h-2zM5 11h14a2 2 0 0 1 2 2v3c-1.500 0-2-1-3-1s-1.500 1-3 1-2-1-3-1-1.500 1-3 1-2-1-3-1-1.500 1-3 1v-3a2 2 0 0 1 2-2zM3 19c1.500 0 2-1 3-1s1.500 1 3 1 2-1 3-1 1.500 1 3 1 2-1 3-1 1.500 1 3 1v3H3z"/></svg>',
    anniversary:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C5 15.500 2 12 2 8.500 2 5.800 4.200 4 6.800 4c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 4 22 5.800 22 8.500c0 3.500-3 7-10 12.500z"/></svg>',
    custom:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8h18v4H3zM5 12h14v9H5zM11 8h2v13h-2zM12 8C9 8 7 6 8 4.500 9.500 3 12 5 12 8zm0 0c3 0 5-2 4-3.500C14.500 3 12 5 12 8z"/></svg>'
  };
  function fmt(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(undefined,{day:'numeric',month:'long'})}
  function when(n){return n===null?'':n===0?'Today!':n===1?'Tomorrow':'in '+n+' days'}

  function paint(){
    var withDays=items.map(function(o){return {o:o,n:SP.daysUntil(o)}});
    var up=withDays.filter(function(x){return x.n!==null}).sort(function(a,b){return a.n-b.n})[0];
    if(up){
      var o=up.o;
      $('next').innerHTML='<div><small>Next surprise</small><h2>'+esc(o.title)+'</h2><p>'+(up.n===0?'It is today. Open it from the card below.':fmt(SP.dateOf(o))+(SP.yearsOf(o)>0&&o.kind==='anniversary'?' &middot; '+(SP.yearsOf(o)+1)+' years of us coming':''))+'</p></div>'
        +'<div class="nc-days"><b>'+(up.n===0?'&#9829;':up.n)+'</b><span>'+(up.n===0?'Today':up.n===1?'day to go':'days to go')+'</span></div>';
    }else{
      $('next').innerHTML='<div><small>Next surprise</small><h2>Nothing set yet</h2><p>Add a birthday or set the day your story began.</p></div><div class="nc-days"><b>&#9829;</b></div>';
    }
    $('sgrid').innerHTML=withDays.map(function(x){
      var o=x.o,d=SP.dateOf(o);
      var date=d?fmt(d)+(o.kind==='birthday'||o.kind==='anniversary'?' &middot; '+d.slice(0,4):''):'';
      var needDate=o.auto&&!d;
      return '<article class="scard'+(x.n===0?' today':'')+'"><div class="sc-top"><span class="sc-ico">'+(ICON[o.kind]||ICON.custom)+'</span><div><h3>'+esc(o.title)+'</h3><small>'+(needDate?'Using our date':date)+'</small></div><span class="sc-when">'+when(x.n)+'</span></div>'
        +(needDate?'<p class="sc-note">Set the day our story began so this surprise knows when to open.</p>':'')
        +'<p class="sc-msg">'+(o.message&&o.message.trim()?esc(o.message):'<em>A loving message will be written for you on the day.</em>')+'</p>'
        +'<div class="sc-act">'+(needDate?'<button type="button" class="go" data-setdate>Set our date</button>':'<button type="button" class="go" data-prev="'+esc(String(o.id))+'">Preview</button>')
        +'<button type="button" data-edit="'+esc(String(o.id))+'">Edit</button></div></article>';
    }).join('');
  }

  var dlg=$('sDlg');FU.backdropClose(dlg);
  function formKind(){return editing&&byId(editing)&&byId(editing).kind==='anniversary'?'anniversary':$('sfKind').value}
  function draft(){
    var o=editing?Object.assign({},byId(editing)):{kind:$('sfKind').value};
    o.to=$('sfTo').value.trim()||'My love';o.message=$('sfText').value;o.title=$('sfName').value.trim();
    if(!o.auto)o.date=$('sfDate').value;
    o.by=FU.user();return o;
  }
  function openForm(id){
    editing=id;delArmed=false;$('sfDel').textContent='Delete';
    var o=id?byId(id):null,anniv=o&&o.auto;
    $('sfTitle').textContent=o?'Edit surprise':'Add a surprise';
    $('sfKind').disabled=!!anniv;$('sfKind').innerHTML=anniv?'<option value="anniversary">Our anniversary</option>':'<option value="birthday">Birthday</option><option value="custom">Other special day</option>';
    $('sfKind').value=o?o.kind:'birthday';
    $('sfName').value=o?o.title:'';$('sfName').readOnly=!!anniv;
    $('dateRow').hidden=!!anniv;$('sfDate').required=!anniv;$('sfDate').value=o&&!anniv?o.date:'';
    $('sfTo').value=o?o.to||'':'';$('sfText').value=o?o.message||'':'';
    $('sfDel').hidden=!o||!!anniv;$('sfSave').textContent=o?'Save changes':'Save surprise';
    $('sfNote').textContent=anniv?'The date comes from "Set our date". Leave the message empty and a loving one is written for you on the day.':'Leave the message empty and a loving one is written for you on the day.';
    FU.lockForm($('sf'),!!o&&!FU.canEdit(o),o);
    $('sfPrev').disabled=false;$('sfWrite').disabled=!!(o&&!FU.canEdit(o));
    FU.open(dlg);$(anniv?'sfTo':'sfName').focus();
  }
  $('addBtn').addEventListener('click',function(){openForm(null)});
  $('sgrid').addEventListener('click',function(e){
    var ed=e.target.closest('[data-edit]'),pv=e.target.closest('[data-prev]');
    if(ed)openForm(ed.dataset.edit);
    if(pv){var o=byId(pv.dataset.prev);if(o)SP.show(Object.assign({by:FU.user()},o))}
  });
  $('sfKind').addEventListener('change',function(){if(!editing&&!$('sfName').value)$('sfName').placeholder=this.value==='birthday'?"Zaam's birthday":'Our first trip'});
  $('sfWrite').addEventListener('click',function(){
    var o=draft(),kind=formKind(),years=SP.yearsOf(o.auto?o:{date:o.date,auto:false});
    $('sfText').value=SP.compose(kind==='birthday'||kind==='anniversary'?kind:'custom',$('sfTone').value,{to:o.to,years:years});
  });
  $('sfPrev').addEventListener('click',function(){var o=draft();if(!o.title)o.title='Preview';FU.close(dlg);SP.show(o)});
  $('sfCancel').addEventListener('click',function(){FU.close(dlg)});
  $('sfDel').addEventListener('click',function(){
    if(!delArmed){delArmed=true;this.textContent='Click again to delete';return}
    if(!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    items=items.filter(function(x){return String(x.id)!==String(editing)});save();FU.close(dlg);paint();toast('Surprise deleted');
  });
  $('sf').addEventListener('submit',function(e){
    e.preventDefault();
    if(editing&&!FU.canEdit(byId(editing))){FU.denied(byId(editing));return}
    var o=editing?byId(editing):null,rec={title:$('sfName').value.trim(),to:$('sfTo').value.trim()||'My love',message:$('sfText').value.trim()};
    if(!rec.title)return;
    if(!o||!o.auto){rec.date=$('sfDate').value;rec.kind=$('sfKind').value;if(!rec.date)return}
    if(o){Object.assign(o,rec);toast('Surprise saved')}
    else{rec.id='s'+Date.now();FU.stamp(rec);items.push(rec);toast('Surprise added')}
    save();FU.close(dlg);paint();
  });
  FU.onDateChange=paint;
  paint();
})(window.FU.scope('surprises'));