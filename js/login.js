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

  function show(msg){var e=$('lgErr');e.textContent=msg;e.hidden=!msg;if(msg)$('lgOk').hidden=true}
  function ok(msg){var e=$('lgOk');e.textContent=msg;e.hidden=!msg;if(msg)$('lgErr').hidden=true}
  var resetToken=new URLSearchParams(location.search).get('reset')||'';
  /* modes: in, up, forgot (ask for a link), code (use the secret reset code), reset (arrived from the emailed link) */
  function setMode(m){
    mode=m;
    var auth=m==='in'||m==='up',newPass=m==='up'||m==='code'||m==='reset';
    document.querySelector('.tabs').hidden=!auth;
    $('tabIn').setAttribute('aria-selected',m==='in');$('tabUp').setAttribute('aria-selected',m==='up');document.querySelector('.tabs').classList.toggle('up',m==='up');
    $('nameRow').hidden=$('userRow').hidden=$('emailRow').hidden=m!=='up';
    $('pass2Row').hidden=!newPass;
    $('idRow').hidden=!(m==='in'||m==='forgot'||m==='code');
    $('codeRow').hidden=m!=='code';
    $('lgPass').closest('.field').hidden=m==='forgot';
    $('lgPass').autocomplete=m==='in'?'current-password':'new-password';
    $('lgPass').closest('.field').querySelector('.lab').textContent=(m==='code'||m==='reset')?'New password':'Password';
    $('forgotBtn').hidden=m!=='in';$('codeBtn').hidden=m!=='forgot';$('backBtn').hidden=auth||false;
    $('lgGo').innerHTML=({in:'Login',up:'Create my account',forgot:'Send me a reset link',code:'Reset password',reset:'Save new password'}[m])+' <span aria-hidden="true">&#9829;</span>';
    $('lgLede').textContent=({in:'Log in to open our story.',up:'Create an account to open our story.',forgot:'Type your Gmail or username and we will help you back in.',code:'Use the secret reset code to choose a new password.',reset:'Choose a new password for your account.'}[m]);
    show('');ok('');
  }
  $('forgotBtn').addEventListener('click',function(){setMode('forgot');$('lgId').focus()});
  $('codeBtn').addEventListener('click',function(){setMode('code');$('lgId').focus()});
  $('backBtn').addEventListener('click',function(){setMode('in');$('lgId').focus()});
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
    if(mode!=='forgot'&&pass.length<6){show('Password needs at least 6 characters.');$('lgPass').focus();return}
    var path,body;
    if(mode==='forgot'){
      var fid=$('lgId').value.trim().toLowerCase().replace(/^@/,'');
      if(!fid){show('Enter your Gmail or username.');$('lgId').focus();return}
      busy=true;$('lgGo').disabled=true;
      FUAPI.login('forgot',{id:fid}).then(function(r){
        busy=false;$('lgGo').disabled=false;
        var msg='If that account has a Gmail and email is set up on the server, a reset link is on its way (valid 30 minutes). Check your spam folder too.';
        if(!r.emailEnabled)msg='Email is not set up on this server. Press "I have a reset code" and use the secret RESET_CODE from the server settings.';
        else if(r.codeEnabled)msg+=' No email? Use "I have a reset code".';
        ok(msg);
      }).catch(function(err){busy=false;$('lgGo').disabled=false;show(err&&err.message&&err.message!=='Failed to fetch'?err.message:'Cannot reach the server. Is it running?')});
      return;
    }
    if(mode==='code'||mode==='reset'){
      if(pass!==$('lgPass2').value){show('The two passwords do not match.');$('lgPass2').focus();return}
      if(mode==='reset'){path='reset';body={token:resetToken,password:pass}}
      else{
        var cid=$('lgId').value.trim().toLowerCase().replace(/^@/,''),code=$('lgCode').value;
        if(!cid){show('Enter your Gmail or username.');$('lgId').focus();return}
        if(!code){show('Enter the reset code.');$('lgCode').focus();return}
        path='reset';body={id:cid,code:code,password:pass};
      }
    }else if(mode==='up'){
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
  setMode(resetToken?'reset':(qm==='register'?'up':'in'));
  if(resetToken)history.replaceState(null,'',location.pathname);   /* the one-time token is not left in the address bar */
  $(mode==='up'?'lgNameF':(mode==='reset'?'lgPass':'lgId')).focus();
})();
