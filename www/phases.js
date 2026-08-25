/* Lingua — a grammar is built in stages, and words get made while you build it
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The grammar chapter was seven decisions in a row with nothing between them.
   It asked for a word order before the language had a word for "I" -- so the
   very first decision could not be demonstrated, let alone used. And there was
   nowhere in it to write a word down, which meant deciding how to say no and
   then leaving to go and make the word for no.

   It is stages now, in the order they unlock each other. Greetings first,
   because one word is enough to say something out loud. Then the pronouns,
   because without them there is no subject and word order has nothing to
   arrange. Then word order, and from there the rest.

   Each stage holds four things: the words it needs, made on the spot; the
   decisions it carries; a note of its own; and a line you can now say that you
   could not say before. It is finished when all of that is filled.

   The list does not end. The last row adds a stage of your own -- honorifics,
   kinship, direction, whatever this language turns out to need -- with its own
   words and its own note. Nothing here limits how many.

   Nouns are not here. Water and mountain belong to the dictionary. What lives
   in a stage is the words you cannot make a sentence without: pronouns,
   question words, numbers, the words for yes and no. */

/* {done:{}, notes:{}, set:{}, extra:[]} -- `set` is which decisions have been
   touched, because every decision has a default and a default is not a
   choice. */
/* rules: what you decided, written by you. ex: the lines that show it.
   notes stays for what is neither. */
/* `order` and `gpos` are the word order and the three places a word can
   stand. They are here rather than in SET from 2026-08-25 -- see
   migrateGramLang() below -- because they are the language's, not the
   phone's. Empty means nobody has answered and the default stands. */
var STG={done:{}, notes:{}, set:{}, extra:[], rules:{}, ex:{}, fm:[], order:'', gpos:{}};
/* How far the open language has got. Empty first: see langRead() in core.js. */
function stRead(){
  STG={done:{}, notes:{}, set:{}, extra:[], rules:{}, ex:{}, fm:[], order:'', gpos:{}};
  try{
    var stgs=JSON.parse(localStorage.getItem(langKey('phases'))||'null');
    if(stgs){ STG.done=stgs.done||{}; STG.notes=stgs.notes||{}; STG.set=stgs.set||{};
              STG.extra=stgs.extra||[]; STG.rules=stgs.rules||{}; STG.ex=stgs.ex||{};
              STG.fm=stgs.fm||[];
              STG.order=stgs.order||''; STG.gpos=stgs.gpos||{}; }
  }catch(e){}
}
/* ---- the word order and the three positions belong to the LANGUAGE -------
   They belonged to the phone. SET.order and SET.gpos.{adj,negp,adp} live in
   'lingua.set', which langKey() never touches and which langOpen() does not
   re-read -- correctly, because SET is the person's. So a second language was
   born already speaking the first one's grammar, and changing the order in
   one changed it in the other. Measured on a phone rather than read off the
   code: docs/BACKLOG.md, and it is the same failure CLAUDE.md already names
   about what a language is FOR, which sat in SET under a comment saying it
   travels with the language.

   They come to STG because STG is already the language's -- langKey('phases')
   -- and 'phases' is already in SLICES, so a value put here is in the backup
   and goes when the language goes, with nothing added to core.js and nothing
   added to the list of slices. The state was already split down the middle
   and this is the half that was on the wrong side: STG.set, which says
   whether a decision was TOUCHED, has been the language's all along while the
   value it marks was the phone's.

   This COPIES. SET.order and SET.gpos are read and left exactly where they
   are -- docs/DATA_SAFETY.md rule 2, and langMigrate()'s own argument: it
   runs once, on a phone, against the only copy of something somebody spent
   months on, and copying a few hundred bytes cannot lose anything where
   moving them could.

   OWNER DECISION 2026-08-25 「言語ごとですよ？」: the ONE value that is there
   now goes to EVERY language the person already has. That is a decision and
   not a reading of the data -- somebody with two languages has one value and
   no way to say which language it was decided in -- and it is the day with
   the least surprise in it, because that one value is what every one of their
   screens shows today. A language made AFTERWARDS gets neither key and takes
   the defaults, which is the whole of the bug: a new language is born with no
   grammar on it.

   Once per person, so the mark is the person's. It is written the way
   planMigrate() in www/core.js writes the settings at load, and for the same
   reason: save() calls bkTouch(), and www/backup.js is loaded after this file
   in index.html's list.

   It does not touch STG.set. A value arriving is not somebody choosing it,
   and which decisions were chosen is already recorded per language.

   A phases slice that will not parse is wreckage and is left alone -- "empty"
   and "broken" are different states, and a restore is what answers the second
   one. That language keeps the value it has always had in SET and is the one
   language this does not reach.

   A write that fails leaves the mark unwritten, so the next launch tries the
   whole thing again: every language it did reach already has an `order` and
   is skipped. */
function migrateGramLang(){
  if(SET.gramLang) return;
  var id, key, raw, o, g, k, v, failed=false;
  for(id in LANGS){
    if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
    key=langKeyOf(id, 'phases');
    raw=localStorage.getItem(key);
    o={};
    if(raw!==null){
      try{ o=JSON.parse(raw); }catch(e){ o=null; }
      if(!o || typeof o!=='object' ||
         Object.prototype.toString.call(o)==='[object Array]') continue;
    }
    /* Only an answer this app could have given is copied. Anything else in
       there is not a word order, and the screen has been showing the default
       for it all along. */
    if(o.order===undefined && ORDERS.indexOf(SET.order)>=0) o.order=SET.order;
    if(o.gpos===undefined){
      g={};
      for(k in GPOS_DEF) if(Object.prototype.hasOwnProperty.call(GPOS_DEF, k)){
        v=SET.gpos && SET.gpos[k];
        if(v==='before' || v==='after') g[k]=v;
      }
      /* Nothing to say is said by saying nothing: an empty gpos and no gpos
         at all are the same three defaults, and the second invents less. */
      for(k in g) if(Object.prototype.hasOwnProperty.call(g, k)){ o.gpos=g; break; }
    }
    try{ localStorage.setItem(key, JSON.stringify(o)); }catch(e){ failed=true; }
  }
  if(failed) return;
  SET.gramLang=1;
  try{ localStorage.setItem(LS_S, JSON.stringify(setOnDisk())); }catch(e){}
}
migrateGramLang();
stRead();
function saveStg(){ bkTouch(); try{ localStorage.setItem(langKey('phases'), JSON.stringify(STG)); }catch(e){} }

/* The stages, in the order they open each other up. `slots` are the words the
   stage cannot do without; `feats` are the decisions from www/grammar.js it
   carries. A stage may have only one of the two. */
/* ---- the parts of a grammar ------------------------------------------
   「語順のページなにそれ。SVOを決めて終わり？そんなページいらねえよ。もっと長い文法の
   時は？キモい分け方すんなよ。接続詞とかもっと会話に必要なところあるだろ。」
   「否定のページも何これ？意味がわからない。音で決めるの何さっきから」
   「メモじゃなくてもうルールを書き記せるページにしてくれ。例文で比較したいし、決める
   こと決めて、あとは例文。文法のページ全部がゴミ。全部示す示さないみたいなゴミみたいな
   決め方。」

   What was here asked, for six different things, whether the language marks
   it -- yes or no -- and then which piece of sound the mark is. That is one
   sentence of grammar dressed as a whole chapter, it cannot describe a
   language that does the same job by word order or by a separate word or by
   nothing at all, and it left the parts a conversation actually needs --
   conjunctions, particles, politeness, conditionals -- with nowhere to go.

   A part of a grammar is three things now:

     the words it needs      made here, as before, because that worked
     the rule                written by you, in your own words
     lines that show it      pairs you can put side by side and compare

   Word order stays a choice with buttons, because it genuinely is one: six
   options, one answer, and the answer changes every sentence. Nothing else
   is. The rest are written, because a grammar is written.

   Fifteen parts, and you can add as many of your own as you like. */
var STAGES=[
  {id:'greet', slots:['yes','no','hello','bye','thanks'], pos:'x',   feats:[]},
  {id:'pron',  slots:['i','you','he','we','youpl','they'], pos:'pro', feats:[]},
  {id:'order', slots:[], pos:'v', feats:['order']},
  {id:'noun',  slots:[], pos:'n',  feats:[]},
  {id:'verb',  slots:[], pos:'v',  feats:[]},
  {id:'neg',   slots:['not'], pos:'part', feats:['negp']},
  {id:'ask',   slots:['what','who','where','when','why','how'], pos:'pro', feats:[]},
  {id:'desc',  slots:[], pos:'adj', feats:['adj']},
  {id:'have',  slots:[], pos:'n', feats:[]},
  /* The numbers are numerals, which read the same in every language on the
     list, so they are the one set of labels that needs no translating. */
  {id:'count', slots:['1','2','3','4','5','6','7','8','9','10'], pos:'num', feats:[]},
  {id:'conj',  slots:['and','or','but','because','if','then'], pos:'conj', feats:[]},
  {id:'polite',slots:[], pos:'x',  feats:[]},
  {id:'where', slots:['in','on','under','to','from','with'], pos:'part', feats:['adp']},
  {id:'when',  slots:['now','before','after','today','tomorrow','yesterday'], pos:'x', feats:[]},
  /* The calendar, and its slots come from two numbers the way counting's come
     from the base. www/cal.js says why there is no arithmetic of anybody's
     own behind them. */
  {id:'month', slots:[], pos:'n', feats:[]},
  {id:'wday',  slots:[], pos:'n', feats:[]}
];
/* Stages that are not every language's, and are not offered until somebody's
   language turns out to have one.
   「助詞がない言語もあるんだから、助詞が最初からあるのおかしいだろ」

   Particles are the case that made the point: English has none, and a list
   that opens with a page for them is the app telling somebody their language
   has something it may well not.

   They are not deleted. A stage here appears the moment there is an answer in
   it -- notes, rules, an example, a word, or merely having been opened -- so a
   language that used one keeps it and nothing anybody wrote goes anywhere.
   docs/DATA_SAFETY.md: nothing a person made is removed because the current
   shape does not need it.

   Adding one back by hand is what `stAddOwn` has always been for. */
var STAGES_IF=[
  {id:'part',  slots:[], pos:'part', feats:[]}
];
function stUsed(id){
  return !!(stTouched(id) || (STG.notes && STG.notes[id]) ||
            (STG.rules && STG.rules[id]) ||
            (STG.ex && STG.ex[id] && STG.ex[id].length));
}
/* A copy with its slots filled in, and a copy is the point: STAGES is one
   array shared by every call, so a stage edited in place stays edited. */
function stWith(p, slots){
  return {id:p.id, slots:slots, pos:p.pos, feats:p.feats};
}
function stAll(){
  var out=[], i;
  /* The counting stage's slots are the base's, not a fixed ten: twelve words
     in base twelve. Rebuilt rather than written over, because STAGES is one
     array shared by every call and a stage edited in place stays edited. */
  for(i=0;i<STAGES.length;i++){
    if(STAGES[i].id==='count')      out.push(stWith(STAGES[i], numWordSlots()));
    else if(STAGES[i].id==='month') out.push(stWith(STAGES[i], calMonthSlots()));
    else if(STAGES[i].id==='wday')  out.push(stWith(STAGES[i], calWeekSlots()));
    else out.push(STAGES[i]);
  }
  for(i=0;i<STAGES_IF.length;i++)
    if(stUsed(STAGES_IF[i].id)) out.push(STAGES_IF[i]);
  for(i=0;i<STG.extra.length;i++) out.push({id:STG.extra[i].id, slots:STG.extra[i].slots||[],
                                           pos:'x', feats:[], own:STG.extra[i]});
  return out;
}
function stBy(id){
  var a=stAll(), i;
  for(i=0;i<a.length;i++) if(a[i].id===id) return a[i];
  return null;
}
/* What a slot is called. A stage you added names its own; the numbers name
   themselves. */
function stSlotLabel(p, k){
  if(p.own){
    var i, s=p.own.labels||{};
    return s[k]||k;
  }
  /* The three whose slots are numbers name themselves. There is no key for
     "the third month" because the app does not know what anybody's third
     month is, and inventing March here would be it deciding. */
  if(p.id==='count' || p.id==='month' || p.id==='wday') return k;
  return t('stg.'+p.id+'.'+k);
}
function stTitle(p){ return p.own ? (p.own.title||t('stg.own.untitled')) : t('stg.'+p.id+'.t'); }
function stWhat(p){
  if(p.own) return p.own.what||'';
  /* "One to ten" is only true in base ten, and the same is true of twelve
     months and seven days: all three counts are the language's. */
  if(p.id==='count') return t('stg.count.d', numLabel(numBase()));
  if(p.id==='month') return t('stg.month.d', numLabel(calMonths()));
  if(p.id==='wday')  return t('stg.wday.d', numLabel(calWeek()));
  return t('stg.'+p.id+'.d');
}

/* ---- a word made for a slot -------------------------------------------
   It goes into the dictionary like any other word. It also remembers which
   slot it filled, so the stage can see that it is done and so changing it
   later changes it here too. */
function stWordFor(p, k){
  var key=p.id+'.'+k, i;
  for(i=0;i<WORDS.length;i++) if(WORDS[i].slot===key) return WORDS[i];
  return null;
}
function stSlotsDone(p){
  var n=0, i;
  for(i=0;i<p.slots.length;i++) if(stWordFor(p, p.slots[i])) n++;
  return n;
}
/* A decision counts once it has been touched. Every one of them has a default
   and a default nobody chose is not a decision. */
function stTouched(id){ return !!STG.set[id]; }
function stMarkSet(id){ STG.set[id]=1; saveStg(); }
function stFeatsDone(p){
  var n=0, i;
  for(i=0;i<p.feats.length;i++) if(stTouched(p.feats[i])) n++;
  return n;
}
function stTotal(p){ return p.slots.length + p.feats.length + 1; }
/* The +1 is the part itself: something written about it, or a line showing
   it. A part with no words and no buttons -- politeness, particles -- is
   finished when you have said what it does, which is the only thing it could
   ever have meant. */
function stSaid(p){ return (stRules(p.id).length || stEx(p.id).length)? 1 : 0; }
function stFilled(p){ return stSlotsDone(p) + stFeatsDone(p) + stSaid(p); }
function stIsDone(p){ return stFilled(p)>=stTotal(p); }
function stCount(){
  var a=stAll(), n=0, i;
  for(i=0;i<a.length;i++) if(stIsDone(a[i])) n++;
  return n;
}

/* ---- a slot's word is a word, and a word has one screen ----------------
   This used to be a form of its own: a box of sounds you pressed, a reading
   with a speaker on it, a row of suggestions, and a Keep button. Four things
   the word screen already does, done a second way, on a screen that could not
   do the rest of what a word has -- meanings, register, an example, a note.

   「文法から単語とか作るときも、単語画面と全く同じ見た目で、1なら1とか数詞とか
   埋められてるやつを書いてある感じにして欲しい」

   So it is the word screen, opened with the two things the slot already
   knows written in: the meaning is what the slot is called, and the part of
   speech is the stage's. Everything else is typed, the way every other word
   in the app is typed.

   A slot that is already filled is not a form at all -- it is a word, and it
   opens on the word. */
function openSlot(pid, k){
  var p=stBy(pid) || stAll()[0];
  var key=(k===undefined||k===null)? (p.slots[0]||'') : String(k);
  var had=stWordFor(p, key);
  if(had){ openWord(had.hw); return; }
  var route='slot:'+p.id+'/'+key;
  /* The same test openAdd() makes, and for the same reason: coming back from
     the picker must not throw away what has been typed, and arriving at the
     route cold must not leave the draft null for wdFormHTML() to trip over. */
  var fresh=!(here().r==='form' && here().a===route) || !addW || !wEdit;
  if(fresh){
    openHw=''; addFrom='';
    addW={hw:'', mns:[], pos:p.pos, syn:[], ant:[], ex:[]};
    wdMnNew=false; wdExNew=false;
    wEdit={seq:[], sp:[], mns:[stSlotLabel(p, key)], pos:p.pos,
           reg:'', tags:[], ety:'', nt:''};
    addFmClear();
    wdSync();
  }
  /* Which slot this draft fills. addOne() writes it onto the word, and
     openAdd() clears it -- a word coined from the dictionary fills nothing. */
  addSlot=p.id+'.'+key;
  if(capStop(1)) return;
  openForm(route, stSlotLabel(p, key),
    '<div id="wd-body">'+wdFormHTML()+'</div>',
    function(){ phkMount(); geTiles(); });
}
FORM_OPEN.slot=function(a){ var i=String(a).indexOf('/'); openSlot(a.slice(0,i), a.slice(i+1)); };
/* ---- a stage of your own ---------------------------------------------- */
function openOwnPhase(){
  /* Writing a grammar stage of your own is the third of the four. */
  if(!makeNeed()) return;
  openForm('own:', t('stg.own.h'),
    '<div class="field"><label>'+t('stg.own.title')+'</label>'+
      '<input id="st-t" placeholder="'+esc(t('stg.own.title.ph'))+'"></div>'+
    '<div class="field"><label>'+t('stg.own.words')+'</label>'+
      '<textarea id="st-w" class="ntbody" style="min-height:120px" placeholder="'+esc(t('stg.own.words.ph'))+'"></textarea></div>'+
    /* This one still says what it does: it is the button that makes the
       thing the form is for, not one more row of a list. */
    '<button class="btn" style="width:100%;margin-top:6px"' + DO('stAddOwn') + '>'+
      t('stg.own.add')+'</button>');
}
FORM_OPEN.own=function(){ openOwnPhase(); };
function stAddOwn(){
  /* The screen only offers this on a paid plan; a form is a route and a route
     can be arrived at from anywhere. */
  if(!can('gram')){ goPlans(); return; }
  var a=document.getElementById('st-t'), b=document.getElementById('st-w');
  if(!a) return;
  var title=String(a.value||'').trim();
  if(!title){ toast(t('stg.own.need')); return; }
  var lines=String((b&&b.value)||'').split('\n'), slots=[], labels={}, i, s, k=0;
  for(i=0;i<lines.length;i++){
    s=lines[i].trim();
    if(!s) continue;
    k++; slots.push('s'+k); labels['s'+k]=s;
  }
  STG.extra.push({id:'own'+(STG.extra.length+1)+'_'+WORDS.length+'_'+slots.length,
                 title:title, slots:slots, labels:labels, what:''});
  saveStg(); closeSheet({target:{id:'sbg'}}); render(); toast(t('stg.own.added', title));
}
/* Deleting one is gated too, and that is a change: it used to be open on
   every plan, on the grounds that a language which came down from a paid plan
   still owns what it made. It still owns it -- which is exactly why it cannot
   be thrown away from a plan that cannot make another one.
   「無料に戻ったら無料の形に戻る」 A stage of somebody's own stays on the
   list, stays in the backup, and cannot be added to or removed until the plan
   that made it is back. Gating a delete never costs anybody anything. */
function stDelOwn(id){
  if(!can('gram')){ goPlans(); return; }
  if(!confirm(t('stg.own.del.ask'))) return;
  STG.extra=STG.extra.filter(function(x){ return x.id!==id; });
  saveStg(); if(gOpenOf()) back(); else render();
}

/* ---- the note a stage carries ----------------------------------------- */
function stNote(id, v){ STG.notes[id]=String(v||''); saveStg(); }
/* ---- the rule, and the lines that show it ----------------------------- */
function stRules(id){ if(!STG.rules) STG.rules={}; return STG.rules[id]||''; }
function stSetRules(id, v){ if(!STG.rules) STG.rules={}; STG.rules[id]=String(v||''); saveStg(); }
function stEx(id){ if(!STG.ex) STG.ex={}; if(!STG.ex[id]) STG.ex[id]=[]; return STG.ex[id]; }
function stAddEx(id){
  var a=document.getElementById('sx-lb'), b=document.getElementById('sx-ln'),
      c=document.getElementById('sx-gl');
  if(!b) return;
  /* The line, or -- when none was written and a meaning was -- the line this
     language makes of that meaning. gExLine() in www/grammar.js is where that
     is decided, so this stays one question asked in one place: it reads the
     dictionary and the word order, and it can be put samples through in Node.
     What was typed always wins; only an empty line is filled in. */
  var gl=String((c&&c.value)||'').trim();
  var ln=gExLine(String(b.value||''), gl);
  if(!ln){ toast(t('word.ex.need')); return; }
  stEx(id).push({lb:String((a&&a.value)||'').trim(), ln:ln, gl:gl});
  saveStg(); render();
}
function stDelEx(id, i){ stEx(id).splice(i,1); saveStg(); render(); }
/* Two lines side by side is the whole of comparing: a label on each says what
   the pair is a pair of -- 肯定 / 否定 -- and the two read as one thought. */
/* The same as the word sheet's: the field for one more appears when the `+`
   on the heading is pressed. */
var stExNew='';
function stExOpen(id){ stExNew=id; render(); }
function stExHTML(id){
  var a=stEx(id);
  return (a.length
    ? '<div class="exlist">'+a.map(function(e,i){
        return exRowHTML(e, exSeq(e.ln),
          exBtn('stDelEx', [id, i], 'word.ex.del', ICON_CROSS));
      }).join('')+'</div>'
    : '')+
    (stExNew===id? '<div class="exadd">'+
      '<input id="sx-lb" class="exsm" placeholder="'+esc(t('stg.ex.lb.ph'))+'" autocomplete="off">'+
      lnField('sx-ln', exHint(), KD('stAddEx', [id]), '')+
      '<input id="sx-gl" placeholder="'+esc(t('word.ex.gl.ph'))+'" '+
        '' + KD('stAddEx', [id]) + '>'+
    '</div>' : '');
}

/* Which stage is open comes from the trail, so leaving the page and coming
   back lands on the same stage and the back button needs no help. */
function gOpenOf(){ return (here().r==='gram')? (here().a||null) : null; }
/* A stage is a page of its own, reached and left like every other page, so
   there is one back button on it and it goes wherever you came from. gOpen
   is the trail's argument now, not a separate piece of state that a second
   back button had to clear. */
/* The way from the list of stages into one of them. Writing a grammar stage
   is the third of the four, and the list is where it is entered from --
   「文法も並んでるページから入ろうとするとログイン必要にすれば良い」 --
   so the ask is here rather than on each of the eight things a stage's page
   can write. */
function stOpen(id){
  if(!makeNeed()) return;
  go('gram', id);
}
function stRow(p, n){
  var done=stIsDone(p), tot=stTotal(p);
  return '<button class="strow'+(done?' done':'')+'"' + DO('stOpen', [p.id]) + '>'+
    '<span class="stn">'+n+'</span>'+
    '<span class="stt">'+esc(stTitle(p))+'</span>'+
    '<span class="lead"></span>'+
    '<span class="stv">'+(tot? (stFilled(p)+' / '+tot) : '—')+'</span>'+
    ICON_GO+'</button>';
}
function stListHTML(){
  var a=stAll(), i, rows='';
  for(i=0;i<a.length;i++) rows+=stRow(a[i], i+1);
  /* The rules that make a form out of a word were at the head of this list.
     They are not a stage of the grammar and they are about the dictionary, so
     they are behind the ... in the dictionary's bar -- wordsMore(). */
  return '<div class="stlist">'+rows+'</div>'+
    /* The fifteen are free and are the whole of the chapter there. They ask
       for forty-six words between them, which is most of what a free
       dictionary is for; a stage of your own is the sixteenth and past that
       is what can('gram') buys. Deleting one is gated as well -- see
       stDelOwn: a language that came down from a paid plan still owns what it
       made, and cannot throw it away from a plan that cannot make another. */
    (can('gram')
      ? '<button class="btn ghost" style="width:100%;margin-top:14px"' + DO('openOwnPhase') + '>'+
          ICON_ADD+t('stg.own.add.btn')+'</button>'
      : '')+
    '';
}

function stSlotRow(p, k){
  var w=stWordFor(p, k);
  return '<button class="stslot'+(w?' has':'')+'"' + DO('openSlot', [p.id, k]) + '>'+
    (p.id==='count'? numFace(k) : '')+
    '<span class="psm">'+esc(stSlotLabel(p, k))+'</span>'+
    (w ? '<span class="psw">'+esc(w.hw)+'</span>'+
         '<span class="psi">'+esc(phIpa(wPh(w)))+'</span>'
       : '<span class="psn">'+t('stg.make')+'</span>')+
    ICON_GO+'</button>';
}
function stDetailHTML(p){
  var i, out='';
  out+='<h2 class="sth">'+esc(stTitle(p))+'</h2>';
  if(stWhat(p)) out+='<div class="note" style="margin-bottom:6px">'+esc(stWhat(p))+'</div>';

  if(p.feats.length){
    out+='<div class="sec">'+t('stg.decide')+'</div>';
    for(i=0;i<p.feats.length;i++) out+=stFeatHTML(p.feats[i]);
  }
  if(p.slots.length){
    out+='<div class="sec">'+t('stg.words')+'</div>';
    out+='<div class="stslots">';
    for(i=0;i<p.slots.length;i++) out+=stSlotRow(p, p.slots[i]);
    out+='</div>';
  }
  out+='<div class="sec">'+t('stg.rules')+'</div>'+
    '<textarea class="ntbody" style="min-height:130px" placeholder="'+esc(t('stg.rules.ph'))+'" '+
    '' + CH('stSetRules', [p.id]) + '>'+esc(stRules(p.id))+'</textarea>';

  out+=secAdd(ICON_LINE+t('stg.ex'), DO('stExOpen', [p.id]), t('word.mn.add'))+stExHTML(p.id);

  out+='<div class="sec">'+t('stg.note')+'</div>'+
    '<textarea class="ntbody" style="min-height:90px" placeholder="'+esc(t('stg.note.ph'))+'" '+
    '' + CH('stNote', [p.id]) + '>'+esc(STG.notes[p.id]||'')+'</textarea>';
  if(p.own) out+='<button class="set" style="margin-top:18px;border-bottom:none"' + DO('stDelOwn', [p.id]) + '>'+
    '<span class="sl bad">'+t('stg.own.del')+'</span></button>';
  return out;
}
/* The decisions that are decisions: word order, and the three places a word
   can stand. Each is one answer for the whole language, each changes every
   sentence that uses it, and each is shown in your own words underneath so it
   can be heard rather than only read. Everything else on a stage is written. */
function stFeatHTML(id){
  if(id==='order'){
    return '<div class="segs">'+ORDERS.map(function(o){
        return '<button class="seg'+(o===orderDef().id?' on':'')+'"' + DO('setOrder', [o]) + '>'+o+'</button>';
      }).join('')+'</div>'+gOrderLine()+gOrderDemo();
  }
  if(id!=='adj' && id!=='negp' && id!=='adp') return '';
  return '<div class="segs">'+['before','after'].map(function(o){
      return '<button class="seg'+(o===gPos(id)?' on':'')+'"' + DO('setGPos', [id, o]) + '>'+
        esc(gPosLab(id, o))+'</button>';
    }).join('')+'</div>'+gPosDemo(id);
}
function vGram(){
  var gOpen=gOpenOf();
  var p = gOpen? stBy(gOpen) : null;
  return '<div class="view">'+
    navTop()+
    '<div class="body">'+
    (p? stDetailHTML(p) : stListHTML())+
    '</div></div>';
}
