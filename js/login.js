/* Login / Register. Accounts live in SQL Server; passwords are hashed with bcrypt on the server. */
(function(){
  var ACC='forever-us-accounts',SESSION='forever-us-session',USER='forever-us-user';
  function get(k,f){try{var r=localStorage.getItem(k);return r===null?f:JSON.parse(r)}catch(e){return f}}
  function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  var $=function(id){return document.getElementById(id)};
  var mode='in';

  function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ('0'+b.toString(16)).slice(-2)}).join('')}
  function hash(pass,salt){
    var enc=new TextEncoder();
    if(window.crypto&&crypto.subtle){
      return crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveBits']).then(function(k){
        return crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},k,256)
      }).then(hex);
    }
    var h=5381,t=salt+pass;for(var i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;
    return Promise.resolve('x'+(h>>>0).toString(16));
  }
  function salt(){var a=new Uint8Array(12);(window.crypto||{getRandomValues:function(x){for(var i=0;i<x.length;i++)x[i]=Math.random()*256}}).getRandomValues(a);return hex(a)}

  function show(msg){var e=$('lgErr');e.textContent=msg;e.hidden=!msg}
  function setMode(m){
    mode=m;
    $('tabIn').setAttribute('aria-selected',m==='in');$('tabUp').setAttribute('aria-selected',m==='up');document.querySelector('.tabs').classList.toggle('up',m==='up');
    $('nameRow').hidden=$('pass2Row').hidden=$('userRow').hidden=$('emailRow').hidden=m==='in';
    $('idRow').hidden=m==='up';
    $('lgPass').autocomplete=m==='in'?'current-password':'new-password';
    $('lgGo').innerHTML=(m==='in'?'Login':'Create my account')+' <span aria-hidden="true">&#9829;</span>';
    $('lgLede').textContent=m==='in'?'Log in to open our story.':'Create an account to open our story.';
    show('');
  }
  $('tabIn').addEventListener('click',function(){setMode('in');$('lgId').focus()});
  $('tabUp').addEventListener('click',function(){setMode('up');$('lgNameF').focus()});

  function enter(acc){
    set(SESSION,acc.key||acc.email);set(USER,acc.name);
    var q=new URLSearchParams(location.search).get('next');
    location.replace(q&&/^[a-z]+\.html$/.test(q)?q:'index.html');
  }
  var EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,USER_RE=/^[a-z0-9_.]{3,20}$/;

  var busy=false;
  $('lgForm').addEventListener('submit',function(e){
    e.preventDefault();show('');if(busy)return;
    var pass=$('lgPass').value;
    if(pass.length<6){show('Password needs at least 6 characters.');$('lgPass').focus();return}
    var path,body;
    if(mode==='up'){
      var name=$('lgNameF').value.trim(),user=$('lgUser').value.trim().toLowerCase().replace(/^@/,''),email=$('lgEmail').value.trim().toLowerCase();
      if(!name){show('Please type your name.');$('lgNameF').focus();return}
      if(!user&&!email){show('Enter a username, a Gmail, or both.');$('lgUser').focus();return}
      if(user&&!USER_RE.test(user)){show('Username: 3 to 20 letters, numbers, dots or underscores.');$('lgUser').focus();return}
      if(email&&!EMAIL.test(email)){show('Please enter a valid Gmail address.');$('lgEmail').focus();return}
      if(pass!==$('lgPass2').value){show('The two passwords do not match.');$('lgPass2').focus();return}
      path='register';body={name:name,username:user,email:email,password:pass};
    }else{
      var id=$('lgId').value.trim().toLowerCase().replace(/^@/,'');
      if(!id){show('Enter your Gmail or username.');$('lgId').focus();return}
      path='login';body={id:id,password:pass};
    }
    busy=true;$('lgGo').disabled=true;
    FUAPI.login(path,body).then(function(res){
      FUAPI.signIn(res);
      var q=new URLSearchParams(location.search).get('next');
      location.replace(q&&/^[a-z]+\.html$/.test(q)?q:'index.html');
    }).catch(function(err){
      busy=false;$('lgGo').disabled=false;
      show(err&&err.message&&err.message!=='Failed to fetch'?err.message:'Cannot reach the server. Is it running?');
    });
  });
  var qm=new URLSearchParams(location.search).get('mode');
  setMode(qm==='register'?'up':'in');
  $(mode==='in'?'lgId':'lgNameF').focus();
})();
