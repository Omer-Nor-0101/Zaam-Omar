/* Magic: sparkle trail and tap hearts, a soft "our song" you can play, today's love note, a date-idea magic ball,
   and an automatic celebration on day 100, 200, ... and every anniversary day count. Loaded on every page. */
(function(){
  var FU=window.FU,store=FU.store,esc=FU.esc;
  if(document.body.getAttribute('data-page')==='login')return;
  var link=document.createElement('link');link.rel='stylesheet';link.href='css/magic.css';document.head.appendChild(link);
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY='forever-us-magic';
  var pref=store.get(KEY,null)||{sparkles:!reduce};
  function savePref(){store.set(KEY,{sparkles:pref.sparkles})}

  /* ---------- Dock ---------- */
  var dock=document.createElement('div');dock.className='mg-dock';
  dock.innerHTML='<button type="button" id="mgSpark" aria-label="Sparkles" title="Sparkles"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.200 6.300L21 10l-6.800 1.700L12 18l-2.200-6.300L3 10l6.800-1.700zM19 15l.9 2.100L22 18l-2.100.9L19 21l-.9-2.100L16 18l2.100-.9z"/></svg></button>'
    +'<button type="button" id="mgSong" aria-label="Play our song" title="Play our song"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3v11.600A3.500 3.500 0 1 0 11 18V8l8-2v7.600A3.500 3.500 0 1 0 21 17V3z"/></svg></button>';
  document.body.appendChild(dock);
  var bS=dock.querySelector('#mgSpark'),bM=dock.querySelector('#mgSong');
  function paintDockOld(){bS.setAttribute('aria-pressed',pref.sparkles)}
  bS.addEventListener('click',function(){pref.sparkles=!pref.sparkles;savePref();bS.setAttribute('aria-pressed',pref.sparkles);FU.toast(pref.sparkles?'Sparkles on':'Sparkles off')});

  /* ---------- Sparkles ---------- */
  var live=0,last=0,GL=['♥','✦','♥','✧','♥'],COL=['#ff6f9f','#ffb3cd','#ffd9a0','#ffffff','#d93a70'];
  function spawn(x,y,burst){
    if(!pref.sparkles||live>60)return;
    var s=document.createElement('span');s.className='mg-s';s.setAttribute('aria-hidden','true');
    s.textContent=GL[(Math.random()*GL.length)|0];
    var dx=(Math.random()-.5)*(burst?120:40),dy=-(20+Math.random()*(burst?90:40));
    s.style.cssText='left:'+x+'px;top:'+y+'px;color:'+COL[(Math.random()*COL.length)|0]+';font-size:'+(10+Math.random()*(burst?16:8))+'px;--dx:'+dx+'px;--dy:'+dy+'px';
    document.body.appendChild(s);live++;
    s.addEventListener('animationend',function(){s.remove();live--});
  }
  document.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch'||!pref.sparkles)return;
    var t=Date.now();if(t-last<45)return;last=t;spawn(e.clientX,e.clientY,false);
  },{passive:true});
  document.addEventListener('pointerdown',function(e){
    if(!pref.sparkles||e.target.closest('.mg-dock'))return;
    for(var i=0;i<7;i++)spawn(e.clientX,e.clientY,true);
  },{passive:true});

  /* ---------- Our music: the built-in song plus music you add (kept on this device) ---------- */
  var ctx=null,master=null,timer=null,playing=false,step=0;
  var CH=[[261.63,329.63,392,493.88],[220,261.63,329.63,392],[174.61,220,261.63,329.63],[196,246.94,293.66,392]];
  function tone(f,t,d,type,v){
    var o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.04);g.gain.exponentialRampToValueAtTime(.0008,t+d);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05);
  }
  function bar(){
    var t=ctx.currentTime+.05,c=CH[step%4],beat=.55;
    tone(c[0]/2,t,beat*8,'sine',.16);
    for(var i=0;i<8;i++){var n=c[[0,1,2,3,2,1,2,3][i]]*(i%4===3?2:1);tone(n,t+i*beat,beat*2.4,'triangle',.11)}
    step++;
  }
  function startSong(){
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC){FU.toast('Music is not supported in this browser');return false}
    if(!ctx){ctx=new AC();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination)}
    if(ctx.state==='suspended')ctx.resume();
    playing=true;step=0;bar();timer=setInterval(bar,4400);return true;
  }
  function stopSong(){if(!playing)return;playing=false;clearInterval(timer);if(ctx)ctx.suspend()}

  var audio=new Audio(),tracks=[],cur=null,curUrl='',DB=null,hasDB=!!window.indexedDB;
  audio.preload='auto';
  function idb(){return new Promise(function(res,rej){
    if(DB)return res(DB);
    var r=indexedDB.open('forever-us-music',1);
    r.onupgradeneeded=function(){r.result.createObjectStore('tracks',{keyPath:'id'})};
    r.onsuccess=function(){DB=r.result;res(DB)};r.onerror=function(){rej(r.error)};
  })}
  function dbAll(){return idb().then(function(db){return new Promise(function(res,rej){var q=db.transaction('tracks').objectStore('tracks').getAll();q.onsuccess=function(){res(q.result||[])};q.onerror=function(){rej(q.error)}})})}
  function dbPut(t){return idb().then(function(db){return new Promise(function(res,rej){var q=db.transaction('tracks','readwrite').objectStore('tracks').put(t);q.onsuccess=res;q.onerror=function(){rej(q.error)}})})}
  function dbDel(id){return idb().then(function(db){return new Promise(function(res,rej){var q=db.transaction('tracks','readwrite').objectStore('tracks').delete(id);q.onsuccess=res;q.onerror=function(){rej(q.error)}})})}

  function anyPlaying(){return playing||!audio.paused}
  function paintDock(){bM.setAttribute('aria-pressed',anyPlaying());paintPanel()}

  var panel=document.createElement('div');panel.className='mg-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Our music');
  document.body.appendChild(panel);
  function paintPanel(){
    if(panel.hidden)return;
    var now=playing?'Our song':(cur!==null&&!audio.paused?nameOf(cur):'Nothing playing');
    var h='<div class="mp-head"><b>Our music</b><button type="button" class="mp-x" id="mpClose" aria-label="Close">&times;</button></div>'
      +'<p class="mp-now" aria-live="polite">'+(anyPlaying()?'<span class="mp-eq" aria-hidden="true"><i></i><i></i><i></i></span>':'')+esc(now)+'</p>'
      +'<div class="mp-ctl"><button type="button" id="mpPrev" aria-label="Previous">&#9198;</button><button type="button" id="mpToggle" class="big" aria-label="'+(anyPlaying()?'Pause':'Play')+'">'+(anyPlaying()?'&#10074;&#10074;':'&#9654;')+'</button><button type="button" id="mpNext" aria-label="Next">&#9197;</button></div>'
      +'<ul class="mp-list"><li class="'+(playing?'on':'')+'"><button type="button" class="mp-row" data-built="1"><span class="mp-n">Our song</span><small>Made in your browser</small></button></li>';
    tracks.forEach(function(t){
      var on=cur===t.id&&!audio.paused;
      h+='<li class="'+(on?'on':'')+'"><button type="button" class="mp-row" data-id="'+t.id+'"><span class="mp-n">'+esc(t.name)+'</span><small>'+(t.by?'Added by '+esc(t.by):'Added')+'</small></button>'
        +(FU.canEdit(t)?'<button type="button" class="mp-del" data-del="'+t.id+'" aria-label="Remove '+esc(t.name)+'">&times;</button>':'')+'</li>';
    });
    h+='</ul>';
    if(hasDB)h+='<label class="mp-add" for="mpFile">+ Add my music<input id="mpFile" type="file" accept="audio/*" multiple hidden></label><p class="mp-hint">MP3, M4A, WAV and more. Music stays on this device only.</p>';
    else h+='<p class="mp-hint">Adding music is not available in this browser.</p>';
    panel.innerHTML=h;
  }
  function nameOf(id){var t=tracks.filter(function(x){return x.id===id})[0];return t?t.name:''}
  function playTrack(id){
    var t=tracks.filter(function(x){return x.id===id})[0];if(!t)return;
    stopSong();
    if(curUrl)URL.revokeObjectURL(curUrl);
    curUrl=URL.createObjectURL(t.blob);audio.src=curUrl;cur=id;
    audio.play().catch(function(){FU.toast('This file could not be played')});
  }
  function playBuilt(){audio.pause();if(startSong())paintDock()}
  function step1(dir){
    if(!tracks.length){playBuilt();return}
    var i=tracks.map(function(t){return t.id}).indexOf(cur);
    i=i<0?(dir>0?0:tracks.length-1):(i+dir+tracks.length)%tracks.length;playTrack(tracks[i].id);
  }
  audio.addEventListener('play',paintDock);audio.addEventListener('pause',paintDock);
  audio.addEventListener('ended',function(){step1(1)});
  audio.addEventListener('error',function(){if(audio.src)FU.toast('This file could not be played')});

  panel.addEventListener('click',function(e){
    var t=e.target;
    if(t.closest('#mpClose')){panel.hidden=true;return}
    if(t.closest('#mpToggle')){
      if(anyPlaying()){audio.pause();stopSong();paintDock()}
      else if(cur!==null&&audio.src)audio.play();
      else if(tracks.length)playTrack(tracks[0].id);else playBuilt();
      return}
    if(t.closest('#mpNext'))return step1(1);
    if(t.closest('#mpPrev'))return step1(-1);
    var d=t.closest('[data-del]');
    if(d){var id=+d.dataset.del,tr=tracks.filter(function(x){return x.id===id})[0];
      if(!FU.canEdit(tr)){FU.denied(tr);return}
      if(cur===id){audio.pause();audio.removeAttribute('src');cur=null}
      dbDel(id).then(function(){tracks=tracks.filter(function(x){return x.id!==id});paintDock();FU.toast('Music removed')});return}
    var r=t.closest('.mp-row');
    if(r){if(r.dataset.built){if(playing){stopSong();paintDock()}else playBuilt()}
      else{var id2=+r.dataset.id;if(cur===id2&&!audio.paused){audio.pause()}else playTrack(id2)}}
  });
  panel.addEventListener('change',function(e){
    if(e.target.id!=='mpFile')return;
    var files=[].slice.call(e.target.files||[]);e.target.value='';
    var ok=files.filter(function(f){return /^audio\//.test(f.type)||/\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(f.name)});
    if(!ok.length){FU.toast('Please choose audio files');return}
    var big=0;
    Promise.all(ok.map(function(f,i){
      if(f.size>80*1024*1024){big++;return null}
      var t=FU.stamp({id:Date.now()+i,name:f.name.replace(/\.[^.]+$/,'').slice(0,60)||'My music',blob:f});
      return dbPut(t).then(function(){return t});
    })).then(function(added){
      added=added.filter(Boolean);tracks=tracks.concat(added);paintDock();
      FU.toast(added.length?(added.length+(added.length===1?' song added':' songs added')):'Those files are too big (80 MB max each)');
      if(added.length&&!anyPlaying())playTrack(added[0].id);
    }).catch(function(){FU.toast('Could not save the music. Storage may be full.')});
  });
  function openPanel(){panel.hidden=false;paintPanel()}
  bM.addEventListener('click',function(e){e.stopPropagation();if(panel.hidden)openPanel();else panel.hidden=true});
  document.addEventListener('click',function(e){if(panel.hidden)return;var path=e.composedPath?e.composedPath():[];if(path.indexOf(panel)<0&&path.indexOf(dock)<0)panel.hidden=true});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;bM.focus()}});
  if(hasDB)dbAll().then(function(l){tracks=l.sort(function(a,b){return a.id-b.id});paintDock()}).catch(function(){hasDB=false});
  bM.setAttribute('aria-label','Our music');bM.title='Our music';
  paintDock();

  /* ---------- Home: Magic corner ---------- */
  var NOTES=['You are my favorite hello and my hardest goodbye.','Every little thing about you is my favorite thing.','With you, even ordinary days feel like a celebration.','I fall for you a little more every morning.','Home is wherever you are.','You make my heart feel light.','Thank you for being exactly who you are.','If I could choose again, I would still choose you.','My best days all have your name on them.','You are the calm in my busiest thoughts.','I love how you make me laugh when I least expect it.','Holding your hand is my favorite place to be.','You are my today and all of my tomorrows.','I am proud of you, and I am so lucky I get to love you.','Your smile is my favorite sunrise.','Being loved by you is the best thing that ever happened to me.','Wherever life takes us, I want to go there with you.','You are my person, my peace, my favorite adventure.','Some people wait their whole life for what I found in you.','The best part of my day is you.','You turned my life into a story I never want to end.','Every song makes sense when I think of you.','I love the little things you do without noticing.','You are enough, you are loved, you are mine.','Thank you for choosing me, every single day.','I carry you in my heart, even when we are apart.','Your love is my favorite kind of magic.','Together is my favorite place to be.','You make the world softer just by being in it.','I am still falling for you, and I hope it never stops.'];
  var IDEAS=['Cook a new recipe together and rate it like judges.','Watch the sunset from somewhere you have never been.','Write each other a letter and swap them.','Have a picnic, even if it is on the living room floor.','Take 10 silly photos in a photo booth.','Dance in the kitchen to your song.','Go for a night walk and talk about your dreams.','Build a pillow fort and watch a favorite movie.','Visit the first place you ever went together.','Make a playlist of 10 songs that remind you of each other.','Try a cafe neither of you has been to.','Stargaze and make a wish on every shooting star.','Bake something and give half to a neighbor.','Plan a pretend trip: pick the place, the hotel, the food.','Take turns telling your favorite memory of us.','Go on a no-phone walk and hold hands the whole way.','Make breakfast for dinner.','Write three things you love about each other and keep them.','Take a day trip with no plan.','Recreate your first date at home.','Learn three words of a new language to say to each other.','Paint or draw each other, however badly.','Look through old photos and pick the funniest.','Light candles and have a slow dinner together.'];
  function dayIndex(){var d=new Date();return Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate())/864e5)}
  var sec=document.getElementById('magicSec');
  if(sec){
    var note=NOTES[dayIndex()%NOTES.length],opened=store.get('forever-us-note-open','')===String(dayIndex());
    sec.innerHTML='<div class="mg-card mg-note'+(opened?' open':'')+'" id="mgNote"><small>Love note of the day</small>'
      +'<button type="button" class="mg-env" id="mgEnv" aria-expanded="'+opened+'"><span class="mg-ico" aria-hidden="true">&#9993;</span><span>'+(opened?'Read again':'Open today\'s note')+'</span></button>'
      +'<p class="mg-text" id="mgText" '+(opened?'':'hidden')+'>'+esc(note)+'</p></div>'
      +'<div class="mg-card mg-ball"><small>Magic date ball</small>'
      +'<button type="button" class="mg-orb" id="mgOrb" aria-label="Shake the magic ball for a date idea"><span class="mg-orb-in" id="mgOrbIn">&#9829;</span></button>'
      +'<p class="mg-text" id="mgIdea" aria-live="polite">Tap the ball for a date idea.</p></div>';
    var env=document.getElementById('mgEnv'),txt=document.getElementById('mgText');
    env.addEventListener('click',function(){
      var card=document.getElementById('mgNote');card.classList.add('open');txt.hidden=false;env.setAttribute('aria-expanded','true');env.lastChild.textContent='Read again';
      store.set('forever-us-note-open',String(dayIndex()));
      var r=env.getBoundingClientRect();for(var i=0;i<12;i++)spawn(r.left+r.width/2,r.top+r.height/2,true);
    });
    var orb=document.getElementById('mgOrb'),idea=document.getElementById('mgIdea'),lastI=-1;
    orb.addEventListener('click',function(){
      var i;do{i=(Math.random()*IDEAS.length)|0}while(i===lastI);lastI=i;
      orb.classList.remove('shake');void orb.offsetWidth;orb.classList.add('shake');
      idea.textContent='';
      setTimeout(function(){idea.textContent=IDEAS[i];var r=orb.getBoundingClientRect();for(var k=0;k<8;k++)spawn(r.left+r.width/2,r.top+r.height/2,true)},reduce?0:600);
    });
  }

  /* ---------- Day-count milestones: 100, 200, ... and each year ---------- */
  setTimeout(function(){
    if(!FU.sp||!FU.store.get('forever-us-session',''))return;
    var t=FU.together&&FU.together();if(!t||FU.startIsSample())return;
    var n=t.total,hit=n>0&&(n%100===0||n%365===0);if(!hit)return;
    var seen=store.get('forever-us-surprise-seen',{})||{},id='ms'+n;if(seen[id])return;
    if(document.querySelector('.sp'))return;
    seen[id]=n;store.set('forever-us-surprise-seen',seen);
    var yrs=n%365===0?(n/365)+(n/365===1?' year':' years'):'';
    FU.sp.show({id:id,kind:'milestone',title:n+' days',to:'My love',by:FU.user(),
      message:'Today is day '+n+' of us'+(yrs?' ('+yrs+' together)':'')+'.\nEvery single one of those days has been a gift, and I would choose each of them again.\nThank you for being my person. Here is to the next '+n+', and the next, and the next.'});
  },1800);
})();
