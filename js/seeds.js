/* Starting content shared by Home and the pages that own it. Each call returns a fresh copy. All entries are examples. */
(function(){
  var FU=window.FU=window.FU||{};
  function make(keys,rows,extra){
    return function(){
      return rows.map(function(r,i){
        var o={id:i+1,sample:true};
        keys.forEach(function(k,j){o[k]=r[j]});
        if(extra)Object.assign(o,extra(r,i));
        return o;
      });
    };
  }
  FU.seeds={
    photos:make(['title','album','date','scene','place'],[
      ['Golden hour walk','together','2024-05-12','couple','Beach Sunset'],['Anniversary roses','special','2024-05-10','roses','Anniversary'],
      ['Candlelight evening','special','2024-05-01','lantern','Dinner Date'],['Maldives sunset','trips','2024-03-18','beach','Maldives'],
      ['City lights','trips','2024-02-09','city','Dubai, UAE'],['Birthday cake','birthdays','2024-04-25','cake','Birthday Surprise'],
      ['Alpine morning','trips','2023-12-27','mountain','Switzerland'],['Hands in the sunset','together','2023-11-04','hands','Golden Hour'],
      ['Spring flowers','special','2024-04-28','flowers','Just Because'],['Blue domes','trips','2023-09-15','santorini','Santorini'],
      ['Love note','special','2024-05-05','note','Love Note'],['Island cliffs','trips','2023-07-21','adventure','Bali']
    ],function(r,i){return {fav:i===0||i===3}}),
    videos:make(['title','cat','date','place','dur','scene'],[
      ['Sunset Beach Date','dates','2024-05-25','Maldives','02:45','couple'],['Dinner Date Night','dates','2024-06-14','Dubai','03:12','lantern'],
      ['Our Switzerland Trip','travel','2024-06-22','Switzerland','04:08','mountain'],['Birthday Surprise','birthdays','2024-07-03','Home','01:36','cake'],
      ['Fair Night Fun','dates','2024-07-16','City Park','02:20','ferris'],['Just Us','special','2024-07-28','Beach','01:58','sparkler'],
      ['Camping Adventure','travel','2024-08-10','Mountains','03:34','tent'],['Boat Ride','travel','2024-08-18','Lake Como','02:16','boat'],
      ['Movie Night','dates','2024-08-25','Home','01:24','tv'],['The Surprise','surprises','2024-09-01','Our Place','02:52','roses'],
      ['City Lights','travel','2024-09-08','Dubai','03:44','city'],['Dancing in the Rain','special','2024-09-15','Street','02:03','umbrella']
    ],function(r,i){return {fav:i===2||i===3||i===6||i===7||i===10||i===11,featured:i===2}}),
    places:make(['name','type','date','rating','note','x','y'],[
      ['The corner cafe','food','2022-03-05',5,'Our first coffee. Replace this with what you ordered and what you talked about.',24,34],
      ['Sunset beach','nature','2022-07-16',5,'Where the sky does that pink thing. Add your own memory here.',78,24],
      ['Riverside bench','hangout','2022-04-02',4,'The bench where we sat for hours. Edit this to tell it your way.',60,52],
      ['Old town square','trips','2022-09-10',4,'Cobblestones, lights and street music. Add what you remember.',34,68],
      ['The little noodle place','food','2023-01-14',5,'Our go-to after a long week. Add your order here.',82,70],
      ['Hilltop viewpoint','nature','2023-05-27',5,'The whole city at our feet. Add the story of the climb.',16,16]
    ]),
    story:make(['title','date','text','scene','icon','type'],[
      ['The First Meeting','2024-06-20','The moment our eyes met for the first time. My heart knew, this is the beginning of something beautiful.','couple','people','first'],
      ['First Conversation','2024-06-21','We talked for hours like we had known each other forever. Time didn’t matter when we were talking.','neon','chat','first'],
      ['Our First Date','2024-06-30','Our first official date. So many laughs, nervous moments, and memories that will last forever.','lantern','calendar','first'],
      ['First Picture Together','2024-07-15','The first picture we took together. The start of a million more pictures and beautiful memories.','mountain','camera','first'],
      ['First Trip Together','2024-08-10','Exploring new places, creating unforgettable memories, just the two of us against the world.','plane','plane','trip'],
      ['Special Surprises','2024-09-20','Little surprises that made the biggest impact on my heart.','gift','gift','surprise'],
      ['A Lifetime Together','','And this is just the beginning of our forever. Can’t wait for all the chapters waiting for us.','hands','ring','future']
    ],function(r){return {future:r[5]==='future'}})
  };
})();
