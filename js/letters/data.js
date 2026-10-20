/* Letter categories, sample letters and localStorage persistence. */
(function(){
  var CATS=[
    {id:'love',name:'Love Letters',tag:'Love Letter',icon:'<path d="M12 20.500C5 15 2 11.500 2 7.800 2 5 4.200 3 6.800 3c2 0 3.700 1.100 5.200 3 1.500-1.900 3.200-3 5.200-3C19.800 3 22 5 22 7.800c0 3.700-3 7.200-10 12.700z"/>'},
    {id:'special',name:'Special Days',tag:'Special Day',icon:'<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8C9 8 7 6.500 7.500 5 8.500 3 12 5 12 8zm0 0c3 0 5-1.500 4.500-3C15.500 3 12 5 12 8z"/>'},
    {id:'note',name:'Notes',tag:'Note',icon:'<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>'},
    {id:'foryou',name:'For You',tag:'For You',icon:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>'}
  ];
  var SEED=[
    {id:1,title:'You Are My Today and Always',cat:'love',date:'2024-05-12',fav:true,scene:'couple',
     body:'Every moment with you feels like a beautiful dream come true. I wake up grateful, and I fall asleep grateful, and somewhere in between you make the ordinary hours feel like something worth keeping.\n\nI do not need a perfect day. I only need to share it with you.\n\nToday, tomorrow and every day after that, I choose you.\n\nAlways yours'},
    {id:2,title:'On Our Anniversary',cat:'special',date:'2024-05-10',fav:false,scene:'roses',
     body:'Another year, another chapter of our beautiful story together. Some pages were easy and some were hard, and I would not trade a single one of them.\n\nThank you for staying, for laughing with me, and for growing with me.\n\nHere is to the next chapter, and the one after that.\n\nForever yours'},
    {id:3,title:'For When You Miss Me',cat:'love',date:'2024-05-08',fav:false,scene:'letter',
     body:'If you are reading this, I hope it brings a smile to your face. I know the days apart can feel long.\n\nClose your eyes for a moment and remember how it feels when we are together. That feeling does not go anywhere when I am away.\n\nI am only a thought, a call and a little time away from you.\n\nMissing you too'},
    {id:4,title:'Just a Little Note to Say',cat:'note',date:'2024-05-05',fav:false,scene:'note',
     body:'I love the little things about you that make you, you. The way you hum when you are concentrating. The way you remember small details nobody else notices.\n\nI wanted you to know that I notice you, too.\n\nThat is all. Have a lovely day.\n\nYours'},
    {id:5,title:'My Heart’s Promise',cat:'love',date:'2024-05-01',fav:false,scene:'lantern',
     body:'No matter where life takes us, my heart will always belong to you. I promise to listen when it is hard to talk, and to celebrate with you when it is easy.\n\nI promise to be patient, to be honest and to keep choosing us.\n\nLike a small light in the dark, this promise stays lit.\n\nYours, always'},
    {id:6,title:'Thinking of You',cat:'note',date:'2024-04-28',fav:false,scene:'flowers',
     body:'Just a reminder that you are always in my thoughts. In the middle of a busy day, a small thing reminds me of you and I smile.\n\nTake a breath. Drink some water. You are doing better than you think.\n\nSee you soon.\n\nWith love'},
    {id:7,title:'Happy Birthday, My Love',cat:'special',date:'2024-04-25',fav:false,scene:'cake',
     body:'Wishing you a day as wonderful and amazing as you are. May it be full of cake, laughter and people who adore you.\n\nI am so glad you were born, and even more glad that our paths crossed.\n\nMake a wish. I hope I am in it.\n\nHappy birthday'},
    {id:8,title:'Forever Grateful for You',cat:'love',date:'2024-04-20',fav:false,scene:'hands',
     body:'Thank you for being my person, my partner, my everything. For the quiet evenings, the long talks and the way you make home feel like a person instead of a place.\n\nI am grateful for you in the big moments and in all the small ones in between.\n\nThank you, with all my heart.\n\nForever yours'}
  ];
  var KEY='forever-us-letters-v1';
  function load(){
    var list=null;
    try{var raw=localStorage.getItem(KEY);list=raw?JSON.parse(raw):null}catch(e){list=null}
    if(!Array.isArray(list))list=SEED.map(function(d){return Object.assign({},d)});
    return list;
  }
  function save(list){try{localStorage.setItem(KEY,JSON.stringify(list))}catch(e){}}
  window.FU=window.FU||{};
  window.FU.letters={CATS:CATS,load:load,save:save};
})();
