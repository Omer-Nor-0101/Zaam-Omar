/* Connects the site to the server (SQL Server). Loaded before common.js.
   - On every page except login it pulls the saved data from the server into localStorage (one request),
     so all the existing page scripts keep working unchanged.
   - Every later save of a shared key is sent back to the server (debounced). */
(function(){
  var TOKEN='forever-us-token';
  var SHARED=['forever-us-photos-v2','forever-us-videos-v2','forever-us-places-v1','forever-us-story-v2','forever-us-dreams-v1','forever-us-letters-v1','forever-us-surprises-v1','forever-us-start','forever-us-social','forever-us-avatars'];
  var raw={get:Storage.prototype.getItem,set:Storage.prototype.setItem,del:Storage.prototype.removeItem};
  function ls(){return localStorage}
  function tok(){try{return raw.get.call(ls(),TOKEN)||''}catch(e){return ''}}
  var FUAPI=window.FUAPI={token:tok,online:true};

  FUAPI.login=function(path,body){
    return fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||'Something went wrong.');return j})});
  };
  FUAPI.signIn=function(res){
    raw.set.call(ls(),TOKEN,res.token);
    raw.set.call(ls(),'forever-us-session',JSON.stringify(res.account.key));
    raw.set.call(ls(),'forever-us-user',JSON.stringify(res.account.name));
  };
  function signOutLocal(){
    [TOKEN,'forever-us-session','forever-us-user'].forEach(function(k){try{raw.del.call(ls(),k)}catch(e){}});
  }
  FUAPI.signOut=signOutLocal;

  /* ---------- Photos & videos: uploaded to the server and kept in the database (limit 150 MB each) ---------- */
  FUAPI.MAX_MEDIA=150*1024*1024;
  FUAPI.mediaUrl=function(id){return '/api/media/'+encodeURIComponent(id)+'?t='+encodeURIComponent(tok())};
  FUAPI.upload=function(file,onProgress){
    return new Promise(function(resolve,reject){
      if(file.size>FUAPI.MAX_MEDIA){reject(new Error('This file is bigger than 150 MB.'));return}
      var x=new XMLHttpRequest();
      x.open('PUT','/api/media');
      x.setRequestHeader('Authorization','Bearer '+tok());
      x.setRequestHeader('Content-Type',file.type||'application/octet-stream');
      x.setRequestHeader('X-File-Name',encodeURIComponent(file.name||'file'));
      if(x.upload&&onProgress)x.upload.onprogress=function(e){if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100))};
      x.onload=function(){
        var j={};try{j=JSON.parse(x.responseText)}catch(e){}
        if(x.status===401){signOutLocal();location.replace('login.html');return}
        if(x.status>=200&&x.status<300)resolve({id:j.id,name:j.name,type:j.type,size:j.size});
        else reject(new Error(j.error||'Upload failed. Please try again.'));
      };
      x.onerror=function(){reject(new Error('Upload failed. Check your connection and try again.'))};
      x.onabort=function(){reject(new Error('Upload cancelled.'))};
      x.send(file);
    });
  };
  FUAPI.removeMedia=function(id){
    if(!id)return;
    try{fetch('/api/media/'+encodeURIComponent(id),{method:'DELETE',headers:{'Authorization':'Bearer '+tok()},keepalive:true}).catch(function(){})}catch(e){}
  };

  var page=document.body&&document.body.getAttribute('data-page');
  if(page==='login')return;

  /* ---------- Pull everything from the server before the page scripts run ---------- */
  var version='';
  if(!tok()){signOutLocal();return}      /* common.js sends you to login.html */
  try{
    var x=new XMLHttpRequest();
    x.open('GET','/api/sync',false);                     /* synchronous on purpose: data must exist before the sections draw */
    x.setRequestHeader('Authorization','Bearer '+tok());
    x.send();
    if(x.status===401){signOutLocal()}
    else if(x.status===200){
      var j=JSON.parse(x.responseText);
      SHARED.forEach(function(k){
        if(Object.prototype.hasOwnProperty.call(j.data,k))raw.set.call(ls(),k,j.data[k]);
        else raw.del.call(ls(),k);
      });
      raw.set.call(ls(),'forever-us-session',JSON.stringify(j.me.key));
      raw.set.call(ls(),'forever-us-user',JSON.stringify(j.me.name));
      raw.set.call(ls(),'forever-us-accounts',JSON.stringify(j.accounts));
      version=j.version||'';
    }
  }catch(e){FUAPI.online=false}                           /* server unreachable: keep working from this browser's copy */

  /* ---------- Send changes back ---------- */
  var timers={},pending={};
  function push(k){
    var v=pending[k];delete pending[k];
    var opt={headers:{'Authorization':'Bearer '+tok(),'Content-Type':'application/json'},keepalive:v&&v.length<60000};
    var req=v===null?fetch('/api/data/'+k,{method:'DELETE',headers:opt.headers,keepalive:true})
                    :fetch('/api/data/'+k,{method:'PUT',headers:opt.headers,body:JSON.stringify({value:v}),keepalive:opt.keepalive});
    req.then(function(r){
      if(r.status===401){signOutLocal();location.replace('login.html');return}
      if(!r.ok&&window.FU&&FU.toast)FU.toast('Could not save to the server');
    }).catch(function(){if(window.FU&&FU.toast)FU.toast('Offline: saved on this device only')});
  }
  function queue(k,v){pending[k]=v;clearTimeout(timers[k]);timers[k]=setTimeout(function(){push(k)},600)}
  Storage.prototype.setItem=function(k,v){
    raw.set.call(this,k,v);
    if(this===ls()){
      if(SHARED.indexOf(k)>-1)queue(k,String(v));
      else if(k==='forever-us-user'){try{var n=JSON.parse(v);fetch('/api/me',{method:'PUT',headers:{'Authorization':'Bearer '+tok(),'Content-Type':'application/json'},body:JSON.stringify({name:n})})}catch(e){}}
    }
  };
  Storage.prototype.removeItem=function(k){
    raw.del.call(this,k);
    if(this===ls()&&SHARED.indexOf(k)>-1)queue(k,null);
  };
  addEventListener('pagehide',function(){Object.keys(pending).forEach(function(k){clearTimeout(timers[k]);push(k)})});

  /* ---------- See your partner's new posts: when you come back to the tab, reload if the server changed ---------- */
  document.addEventListener('visibilitychange',function(){
    if(document.hidden||!FUAPI.online||Object.keys(pending).length)return;
    if(document.querySelector('dialog[open]'))return;
    fetch('/api/version',{headers:{'Authorization':'Bearer '+tok()}}).then(function(r){return r.ok?r.json():null}).then(function(j){
      if(j&&version&&j.version&&j.version!==version&&!document.querySelector('dialog[open]'))location.reload();
    }).catch(function(){});
  });
})();
