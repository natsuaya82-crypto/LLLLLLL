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
    var stgs=JSON.parse(slRd(langKey('phases'))||'null');
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
   -- and 'phases' is already in SLICES, so a value put here goes up to the
   server and goes when the language goes, with nothing added to core.js and nothing
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

   WHICH LANGUAGES THIS IS ABOUT, AND IT IS NOT 「every one in the index」.
   -----------------------------------------------------------------------
   That is what it used to ask and it is the wrong question, because the
   index goes on filling up. `SET.order` is what the PHONE answered before a
   language could answer for itself, so the languages it belongs to are the
   ones that were LIVING UNDER IT -- and a language made since was never
   under it and is born with none 「新しく作った言語は語順を持たずに生まれる」.

   The two have to hold at once and each fix for one used to bring the other
   back. `SET.gramLang` said 「this has run」 and stopped the second one: it
   is gone and must not come back, because a slice is in memory now
   (CLAUDE.md rule 22) while that mark was on the disk -- the copy died with
   the app and the mark outlived it, so a word order somebody chose was
   copied once and lost for good on the next launch. `migrate-check` is what
   said so.

   SO IT IS ASKED OF THE DISK, WHICH ALREADY KNOWS. An older version of this
   app wrote every slice to `localStorage` as `lingua.<id>.<slice>`, and this
   version writes NO such key -- slWr() puts a slice in memory and the only
   per-language thing that reaches the disk now is slGot()'s picture, which
   wears `.got`. So a plain slice key on this disk is a language an older
   version left here, which is exactly a language that was living under the
   phone's one word order. langUnderSet() below is that question, it is a
   fact about the language rather than a record of what this function did,
   and it answers the same way on every launch -- which is what lets this run
   again and again with no mark at all.

   It does not touch STG.set. A value arriving is not somebody choosing it,
   and which decisions were chosen is already recorded per language.

   A phases slice that will not parse is wreckage and is left alone -- "empty"
   and "broken" are different states, and a restore is what answers the second
   one. That language keeps the value it has always had in SET and is the one
   language this does not reach. */
function langUnderSet(id){
  var i, v;
  for(i=0;i<SLICES.length;i++){
    try{ v=localStorage.getItem(langKeyOf(id, SLICES[i])); }catch(e){ v=null; }
    if(v!==null) return true;
  }
  return false;
}
function migrateGramLang(){
  /* What the APP put in the settings, as against what a person put there.
     Read off setDefaults() in www/core.js rather than written out here, so
     there is one place that says it: a second copy of 'SOV' in this file is
     a copy that goes on saying 'SOV' the day the default changes. */
  var appOrder=setDefaults().order;
  var id, key, raw, o, g, k, v;
  for(id in LANGS){
    if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
    if(!langUnderSet(id)) continue;
    key=langKeyOf(id, 'phases');
    raw=slRd(key);
    o={};
    if(raw!==null){
      try{ o=JSON.parse(raw); }catch(e){ o=null; }
      if(!o || typeof o!=='object' ||
         Object.prototype.toString.call(o)==='[object Array]') continue;
    }
    /* Only an answer this app could have given is copied. Anything else in
       there is not a word order, and the screen has been showing the default
       for it all along.

       AND ONLY AN ANSWER A PERSON GAVE. setDefaults() puts `order:'SOV'` into
       the settings of everybody alive, so this used to write 'SOV' onto every
       language of everybody who has never once opened the word-order stage --
       a value the app itself put there, filed under the language as though
       somebody had answered it.
       「普通にアプリが入れる仕様なんて誰も頼んでないけど」OWNER 2026-09-04:
       what nobody was asked for is not written down, and a field nobody
       touched stays empty.

       Nothing on any screen moves. orderDef() in www/grammar.js answers 'SOV'
       for an empty field, which is the same page it drew before, and whether
       anybody CHOSE it is STG.set's question and always was. What changes is
       that the slice stays ABSENT -- which is what a restore is for, the same
       argument as the `{}` two blocks down.

       It does not narrow the other way. A person who chose one of the six
       still has it copied onto every language they already have: that is
       OWNER 2026-08-25 「言語ごとですよ？」, it is what every one of their
       screens shows today, and taking it away would be this app changing a
       word order under somebody -- the opposite mistake in the same place.
       'SOV' chosen by hand is the one case that cannot be told from the
       default, and it costs nothing: the field is empty and the screen says
       SOV either way.

       The three positions have no such value to guard against. Nothing in
       www/ writes SET.gpos any more -- GPOS_DEF is read at the moment a
       screen asks and is put nowhere -- so what is here is what a person
       pressed, and it is copied as it always was. */
    if(o.order===undefined && SET.order!==appOrder &&
       orderSeq(SET.order).join('')===SET.order) o.order=SET.order;
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
    /* Nothing was there and nothing was copied. "Empty" and ABSENT are two
       states, the way empty and broken are: an absent slice is what
       netLangsDown() fills in, and one written here is a slice it steps over
       for good. So this language keeps having none. */
    if(raw===null && o.order===undefined && o.gpos===undefined) continue;
    slWr(key, JSON.stringify(o));
  }
  /* AND NOTHING IS WRITTEN BACK TO THE SETTINGS. This wrote them at the foot
     to save `SET.gramLang`; with the mark gone it wrote them out unchanged,
     behind a catch with nothing in it, on every launch. `SET.order` and
     `SET.gpos` are READ here and never touched -- docs/DATA_SAFETY.md rule 2
     -- so there is nothing to save. */
}
migrateGramLang();
stRead();
function saveStg(){ if(langLocked()) return; bkTouch(); slWr(langKey('phases'), JSON.stringify(STG)); }

/* The stages, in the order they open each other up. `slots` are the words the
   stage cannot do without. There was a `feats` beside it -- the decisions from
   www/grammar.js a stage carried -- and it is gone with the four stages that
   had one: what a chapter decides is the chapter's now. */
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

   The rest are written, because a grammar is written.

   SEVEN OF THEM ARE GONE. 語順, 名詞（複数）, 動詞（時制）, 否定, 疑問, 形容詞
   and 場所 were each a chapter of the rule-made group as well, so one list
   named them twice and the number beside each pair was the only thing telling
   them apart. 「文法はさっき言ったルール。しっかり翻訳できる仕様にしてくれれば
   いい。重複はいらない。」 OWNER 2026-09-06 -- the rule chapters are the
   grammar, and what is left here is the ten no rule chapter says.

   The WORDS three of them asked for did not go with them: CHAP_SLOTS below
   carries those slots, under the ids they were stored under, and the chapter
   of the same name draws them. Ten parts, and you can add as many of your own
   as you like. */
var STAGES=[
  {id:'greet', slots:['yes','no','hello','bye','thanks'], pos:'x'},
  {id:'pron',  slots:['i','you','he','we','youpl','they'], pos:'pro'},
  {id:'have',  slots:[], pos:'n'},
  /* The numbers are numerals, which read the same in every language on the
     list, so they are the one set of labels that needs no translating. */
  {id:'count', slots:['1','2','3','4','5','6','7','8','9','10'], pos:'num'},
  {id:'conj',  slots:['and','or','but','because','if','then'], pos:'conj'},
  {id:'polite',slots:[], pos:'x'},
  /* Particles. It sat in a list of its own, off the chapter until somebody
     pressed a row at the foot -- 「助詞は最初から出せ」 OWNER 2026-09-01, so
     it is a stage like the rest. A language with no particles leaves it empty,
     which is what an unanswered stage already is everywhere else. */
  {id:'part',  slots:['subj','obj','rec'], pos:'part'},
  {id:'when',  slots:['now','before','after','today','tomorrow','yesterday'], pos:'x'},
  /* The calendar, and its slots come from two numbers the way counting's come
     from the base. www/cal.js says why there is no arithmetic of anybody's
     own behind them. */
  {id:'month', slots:[], pos:'n'},
  {id:'wday',  slots:[], pos:'n'}
];
/* The words three chapters of the rule-made group ask for. They were the
   slots of three stages that are gone, and a word somebody made for one of
   them is in WORDS with `neg.not` or `ask.what` or `where.in` written on it --
   so the ids here are the ids they were stored under, and every one of those
   words is still found by the row that asks for it.

   `chap` is which chapter draws them: the 否定 stage's word for "not" belongs
   to the 否定形 chapter, the 疑問 stage's six to 疑問形, and the 場所 stage's
   six to 場所. Words only: what a chapter decides is the chapter's, and the
   two that decide a side -- 形容詞 and 場所 -- ask g2Side() on their own page.

   The negation's own side has nowhere left to be set. It was this stage's
   `negp` and the 否定形 chapter has no picker; docs/BACKLOG.md is where that
   goes, not a second table here. */
var CHAP_SLOTS=[
  {id:'neg',   chap:'neg', slots:['not'], pos:'part'},
  {id:'ask',   chap:'q',   slots:['what','who','where','when','why','how'], pos:'pro'},
  {id:'where', chap:'adp', slots:['in','on','under','to','from','with'], pos:'part'}
];
function chapSlots(id){
  var i;
  for(i=0;i<CHAP_SLOTS.length;i++) if(CHAP_SLOTS[i].id===id) return CHAP_SLOTS[i];
  return null;
}
/* The rows one chapter draws, asked by the CHAPTER's id rather than the
   slots' -- 疑問形 is `q` and the slots it draws are `ask`'s. Drawn by
   stSlotRow(), which is the row the stage drew, so a slot looks and behaves on
   a chapter exactly as it did on the stage it came from. */
/* Which of the three a chapter's words are, asked here and nowhere else: the
   list draws a chapter faint when this language has said nothing in it
   (g2Said() in www/grammar.js) and that is the same question as which words it
   is about. It was a loop inside the drawing below. */
function chapSlotsOf(chap){
  var i;
  for(i=0;i<CHAP_SLOTS.length;i++) if(CHAP_SLOTS[i].chap===chap) return CHAP_SLOTS[i];
  return null;
}
function chapSlotsHTML(chap){
  var p=chapSlotsOf(chap), i, out='';
  if(!p) return '';
  for(i=0;i<p.slots.length;i++) out+=stSlotRow(p, p.slots[i]);
  return '<div class="sec">'+t('stg.words')+'</div><div class="stslots">'+out+'</div>';
}
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
/* Its slots are the three roles a mark can take a word OUT of the queue for.
   A particle is a WORD in this app -- the same as the 否定 stage's word for
   "not" and the 場所 stage's adpositions -- so making one is making a word,
   and nothing new is stored anywhere. gInfl() in www/grammar.js is what turns
   the word somebody made here into something the engine reads.

   Three, and not the eight morphology.js knows: these are the ones WORD ORDER
   would otherwise decide, and a mark is what takes a word out of that queue.
   Where a thing IS and where it goes are the 場所 stage's adpositions and
   already have somewhere to live -- two places saying the same thing is the
   one shape this repository is most often bitten by. */
/* A copy with its slots filled in, and a copy is the point: STAGES is one
   array shared by every call, so a stage edited in place stays edited. */
function stWith(p, slots){
  return {id:p.id, slots:slots, pos:p.pos};
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
  /* The stages somebody added, and only while the plan that added them is
     paid for. 「課金で追加した機能は無料になったら全部隠れる」 OWNER
     2026-09-01 -- the same as the words past a hundred and the letters past
     the free alphabet: hidden, never removed. STG.extra is untouched, it is
     in storage, in the backup and on the server, and paying again brings
     every one of them straight back.

     The stages the book always has are not this: they are what a free grammar
     IS, and they stay. */
  if(can('gram'))
    for(i=0;i<STG.extra.length;i++) out.push({id:STG.extra[i].id, slots:STG.extra[i].slots||[],
                                             pos:'x', own:STG.extra[i]});
  return out;
}
/* How many are not on screen. The foot of the list says so, the same way the
   dictionary and the alphabet do. */
function stHidden(){ return can('gram')? 0 : (STG.extra? STG.extra.length : 0); }
/* Every argument the `gram` route takes -- the stages, and the chapters of
   the chapter that is being rebuilt. Both walks ask THIS rather than keeping
   a list of their own: tools/act-check.mjs's walkArg and tools/i18n-check.mjs's
   argsOf. A ninth chapter is walked the day it is added, and a chapter that
   nothing renders is a chapter where a hard-coded string sits forever. */
function gramArgs(){
  var out=stAll().map(function(p){ return p.id; }), a, i;
  out.push('v2');
  a=(typeof g2Chaps==='function')? g2Chaps() : [];
  for(i=0;i<a.length;i++) out.push('v2:'+a[i].id);
  return out;
}
function stBy(id){
  var a=stAll(), i;
  for(i=0;i<a.length;i++) if(a[i].id===id) return a[i];
  return null;
}
/* What SLOTS an id has, wherever they live. A stage carries its own; three
   chapters carry the ones their stage used to. stBy() stays "is this a stage"
   -- it is what the route, the bar and the detail page ask, and answering it
   with a chapter's slots would put a second page back on the list. */
function stSlotsBy(id){ return stBy(id) || chapSlots(id); }
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
/* Under the title, a stage says one more thing -- when there is one more
   thing to say. Four of them said the title again 「否定」の下に「否定の
   表し方」 and are gone: 「↑これは説明だろ」. They are gone from the ten
   files rather than emptied in them, because a key that is always there and
   always blank is ten lines in every language that nothing ever shows.

   So the presence of the key IS the answer, asked of `en`, which is the
   source of truth for the key set. Removing a subtitle is removing ten lines
   and touching nothing here; adding one is adding ten. Asking t() instead
   would put the key itself on screen, which i18n-check would then find in
   plain letters -- rightly. */
function stHasWhat(id){ return strOf('en')['stg.'+id+'.d']!==undefined; }
function stWhat(p){
  if(p.own) return p.own.what||'';
  /* "One to ten" is only true in base ten, and the same is true of twelve
     months and seven days: all three counts are the language's. */
  if(p.id==='count') return t('stg.count.d', numLabel(numBase()));
  if(p.id==='month') return t('stg.month.d', numLabel(calMonths()));
  if(p.id==='wday')  return t('stg.wday.d', numLabel(calWeek()));
  return stHasWhat(p.id)? t('stg.'+p.id+'.d') : '';
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
/* A decision counts once it has been touched. `STG.set` is written by
   setOrder() and setGPos() in www/grammar.js and is what says a language
   ANSWERED rather than took the default. It went unread for a while -- stOn()
   lit a stage's button and the stages that had buttons are gone -- and the
   chapter that was going to ask it has arrived: the contents draws a chapter
   faint until this language has said something in it, and for 語順 and the two
   pairs that is exactly this and nothing else (g2Said() in www/grammar.js).
   One place reads it, as one place writes it. */
function stTouched(id){ return !!(STG && STG.set && STG.set[id]); }
function stMarkSet(id){ STG.set[id]=1; saveStg(); }
function stTotal(p){ return p.slots.length + 1; }
/* The +1 is the part itself: something written about it, or a line showing
   it. A part with no words and no buttons -- politeness, particles -- is
   finished when you have said what it does, which is the only thing it could
   ever have meant. */
function stSaid(p){ return (stRules(p.id).length || stEx(p.id).length)? 1 : 0; }
function stFilled(p){ return stSlotsDone(p) + stSaid(p); }
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
  var p=stSlotsBy(pid) || stAll()[0];
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
    wdMnNew=false; wdExNew=false; wdSubNew=false;
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
    function(){ phkMount(); geTiles(); }, wdSaveBtn());
}
FORM_OPEN.slot=function(a){ var i=String(a).indexOf('/'); openSlot(a.slice(0,i), a.slice(i+1)); };
/* ---- a stage of your own ---------------------------------------------- */
function openOwnPhase(){
  /* Writing a grammar stage of your own is the third of the four. */
  if(!makeNeed()) return;
  openForm('own:', t('stg.own.h'),
    /* This field carries no name of its own -- it is read when the form is
       saved -- so what makes it grow is the line in www/act.js. */
    '<div class="field"><label>'+t('stg.own.title')+'</label>'+
      lnField('st-t', t('stg.own.title.ph'), '', '')+'</div>'+
    '<div class="field"><label>'+t('stg.own.words')+'</label>'+
      '<textarea id="st-w" class="ntbody" style="min-height:120px" placeholder="'+esc(t('stg.own.words.ph'))+'"></textarea></div>'+
    /* This one still says what it does: it is the button that makes the
       thing the form is for, not one more row of a list. */
    '<button class="btn" style="width:100%;margin-top:6px"' + DO('stAddOwn') + '>'+
      t('stg.own.add')+'</button>');
}
FORM_OPEN.own=function(){ openOwnPhase(); };
/* Saying yes to the stage that is off the list. stMarkSet() is what stUsed()
   reads, so the stage is on the list from here on and this button is not --
   and the mark is in STG.set, which is the language's and is already in the
   backup. Nothing is added to what is stored. */
function stAddOwn(){
  /* The screen only offers this on a paid plan; a form is a route and a route
     can be arrived at from anywhere. */
  if(upStop(can('gram'))) return;
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
  if(upStop(can('gram'))) return;
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('stg.own.del.ask'), function(){ stDelOwnGo(id); }, t('pop.yes'));
}
function stDelOwnGo(id){
  STG.extra=STG.extra.filter(function(x){ return x.id!==id; });
  saveStg(); if(gOpenOf()) back(); else render();
}

/* ---- the note a stage carries ----------------------------------------- */
/* ---- the two things written on a stage ---------------------------------
   The rule and the note are typed, and the button in the bar writes them --
   OWNER DECISION 2026-09-03, www/shell.js § KEEP. Both used to call saveStg()
   the moment the field lost focus, which is a save nobody asked for at a
   moment nobody chose.

   The stage is the route's argument, so the buffer is filed under this screen
   and two stages are two buffers. `stKeepOn()` is called from the stage's own
   face below, which is what knows which stage is in front of somebody. */
function stKeepOn(id){
  /* Not in somebody else's language: saveStg() refuses one. */
  if(langLocked()) return;
  keepOn(keepKey(),
         {rules:String(stRules(id)||''), note:String((STG.notes && STG.notes[id])||'')},
         function(v, done){ stKeepSave(id, v); done(true); });
}
function stKeepSave(id, v){
  if(v.hasOwnProperty('rules')){ if(!STG.rules) STG.rules={}; STG.rules[id]=String(v.rules); }
  if(v.hasOwnProperty('note')){ if(!STG.notes) STG.notes={}; STG.notes[id]=String(v.note); }
  saveStg();
}
function stNote(v){ keepSet('note', String(v||'')); }
/* ---- the rule, and the lines that show it ----------------------------- */
function stRules(id){ if(!STG.rules) STG.rules={}; return STG.rules[id]||''; }
function stSetRules(v){ keepSet('rules', String(v||'')); }
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
  saveStg(); openStEx(id);
}
function stDelEx(id, i){ stEx(id).splice(i,1); saveStg(); openStEx(id); }
/* Two lines side by side is the whole of comparing: a label on each says what
   the pair is a pair of -- 肯定 / 否定 -- and the two read as one thought. */
/* The same as the word sheet's: the field for one more appears when the `+`
   on the heading is pressed. */
var stExNew='';
function stExOpen(id){ stExNew=id; openStEx(id); }
function stExHTML(id){
  var a=stEx(id);
  return (a.length
    ? '<div class="exlist">'+a.map(function(e,i){
        return exRowHTML(e, exSeq(e.ln),
          exBtn('stDelEx', [id, i], 'word.ex.del', ICON_CROSS));
      }).join('')+'</div>'
    : '')+
    (stExNew===id? '<div class="exadd">'+
      lnField('sx-lb', t('stg.ex.lb.ph'), '', '', 'exsm')+
      lnField('sx-ln', exHint(), KD('stAddEx', [id]), '')+
      lnField('sx-gl', t('word.ex.gl.ph'), KD('stAddEx', [id]), '')+
    '</div>' : '');
}

/* 規則 IS A PAGE, AND SO IS 例文.
   「規則>で規則だけの見開きでメモみたいな画面全体にかけるページにして。例文も
   そう。時制のページとかも何を書くの」 OWNER 2026-09-05.

   They were a 130px box and a list stacked in the middle of the stage's page,
   between the words above them and the note below -- so writing a grammar down
   was typing into a letterbox with the rest of the screen in the way, and the
   examples were a section you scrolled past. Each is the whole screen now,
   reached by its own row, and the page it opens is the one the notebook
   already uses: a bar and a body and nothing else.

   The buffer is filed under the FORM, exactly as a note's is (ntKeepOn in
   www/notes.js) -- the field is typed into on that page, so that is the page
   its buffer belongs to. stKeepSave() is still the one place either of them is
   written to STG, so what the row saves and what this saves cannot differ. */
function stRuleKeepOn(id){
  if(langLocked()) return;
  keepOn(keepKeyOf('form', 'strule:'+id),
         {rules:String(stRules(id)||'')},
         function(v, done){ stKeepSave(id, v); done(true); });
}
function openStRules(id){
  var p=stBy(id);
  if(!p) return;
  stRuleKeepOn(id);
  openForm('strule:'+id, t('stg.rules'),
    '<textarea class="ntbody" style="min-height:66vh" placeholder="'+esc(t('stg.rules.ph'))+'"'+
    IN('stSetRules') + '>'+esc(keepVal(keepKeyOf('form', 'strule:'+id), 'rules'))+'</textarea>');
}
FORM_OPEN.strule=function(a){ openStRules(String(a||'')); };
function openStEx(id){
  if(!stBy(id)) return;
  openForm('stex:'+id, t('stg.ex'),
    secAdd(ICON_LINE+t('stg.ex'), DO('stExOpen', [id]), t('word.mn.add'))+stExHTML(id));
}
FORM_OPEN.stex=function(a){ openStEx(String(a||'')); };
/* The way in. The row says what is behind it and how much of it there is --
   an example is a thing you can count and a rule written in prose is not, so
   one says a number and the other says nothing. */
function stPageRow(label, val, doAttr){
  return '<button class="set"'+doAttr+'>'+
    '<span class="sl">'+esc(label)+'</span>'+
    '<span class="sv">'+esc(val)+ICON_GO+'</span></button>';
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
/* And a chapter nobody has written in yet is FAINT. 「まだ書いていない章は
   薄い字」 OWNER 2026-09-06 -- so the contents says at a glance how far the
   book has got, which is what a contents page is for. Same question the count
   on the right has always answered; what is new is that it is legible without
   reading a number. */
function stRow(p, n){
  var done=stIsDone(p), tot=stTotal(p);
  return '<button class="strow'+(done?' done':'')+(stFilled(p)? '':' pale')+'"' +
    DO('stOpen', [p.id]) + '>'+
    '<span class="stn">'+n+'</span>'+
    '<span class="stt">'+esc(stTitle(p))+'</span>'+
    '<span class="lead"></span>'+
    '<span class="stv">'+(tot? (stFilled(p)+' / '+tot) : '—')+'</span>'+
    ICON_GO+'</button>';
}
/* ONE list of chapters. There were two: this one, and the chapters that say
   what a word actually turns into, which sat behind a button at the foot of
   it labelled 語順 -- so they were two steps down inside one of the sixteen.
   「文法ページはいつ統合されんの？」 OWNER 2026-08-28.

   The rule-made forms come first: docs/GRAMMAR-V2-SPEC.md §14 is the chapter
   that says how a word changes, which is what the grammar is FOR. The
   sixteen follow, in the order they were in, numbered on from the eight.
   Nothing is folded away.

   Each group is NAMED, in the shape vWsys() puts `dir.title` over its three
   directions: a `sec` and a name, no frame, no panel, no corner, and no
   sentence. It is what CLAUDE.md §14 already calls that group from outside
   the app, so nothing new was decided here. The names earn their place
   because five pairs of rows are called the same thing -- 語順, 否定, 疑問,
   形容詞, 場所 are each a chapter of both groups, invisible while one list
   was hidden inside the other. Which group a row is in is the whole of what
   tells them apart, so it has to be on the screen. */
function stHidHTML(){
  var n=stHidden();
  if(!n) return '';
  return '<button class="capwarn" style="margin:14px 0 0"' + DO('goPlans') + '>'+
    t('cap.hid', n)+'<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>';
}
/* THE ORDER OF THE CONTENTS, and it is a grammar book's rather than the app's.
   「1 語順 2 名詞 3 動詞（時制・否定・疑問）4 代名詞 5 数 6 挨拶…」 OWNER
   2026-09-06.

   The list was two lists with a name over each -- the chapters that say what a
   word turns into, then the stages -- and the split was true of the code and of
   nothing anybody opens the page to find out. A grammar book has ONE contents
   page: word order, then the noun and what happens to it, then the verb and
   everything that happens to that, then the pronouns, the numbers, the
   greetings, and the rest.

   A CHAPTER NOT NAMED HERE STILL APPEARS. It goes to the foot in the order it
   was in, which is what a stage somebody added themselves is, and is also why
   this can never hide one: a thirteenth form added to G2FM_CHAPS lands on the
   list the day it is added, at the end, and moving it into the book's order is
   a line here. The tie is broken by where it was, because sort() is not
   promised to be stable on the WKWebView this runs in and two of somebody's own
   stages swapping places on a redraw is the app rearranging their work. */
var G2TOC=['order','n','pl',
           'prs','pst','fut','plp','prg','prf','cnd','cau','imp','pas','neg','q',
           'pron','count','greet',
           'adj','adp','part','conj','polite','have','when','month','wday','st'];
function stTocAt(id){
  var i=G2TOC.indexOf(String(id));
  return (i<0)? G2TOC.length : i;
}
function stListHTML(){
  var g=g2Chaps(), a=stAll(), all=[], i, n=0, out='';
  for(i=0;i<g.length;i++) all.push({id:g[i].id, c:g[i], at:all.length});
  for(i=0;i<a.length;i++) all.push({id:a[i].id, p:a[i], at:all.length});
  all.sort(function(x, y){
    return (stTocAt(x.id)-stTocAt(y.id)) || (x.at-y.at); });
  for(i=0;i<all.length;i++)
    out+= all[i].c? g2ChapRow(all[i].c, ++n) : stRow(all[i].p, ++n);
  /* The rules that make a form out of a word were at the head of this list.
     They are not a stage of the grammar and they are about the dictionary, so
     they are behind the ... in the dictionary's bar -- wordsMore(). */
  return '<div class="stlist">'+out+'</div>'+
    stHidHTML()+
    /* The fifteen are free and are the whole of the chapter there. They ask
       for forty-six words between them, which is most of what a free
       dictionary is for; a stage of your own is the sixteenth and past that
       is what can('gram') buys. Deleting one is gated as well -- see
       stDelOwn: a language that came down from a paid plan still owns what it
       made, and cannot throw it away from a plan that cannot make another. */
    /* The way IN to the one stage that is not on the list. It is off the list
       on purpose -- English has no particles and opening the chapter with a
       page for them is the app saying a language has something it may well
       not -- but a page with no door is the trap rule 19 is written about,
       and 「好きに書かせて幅広げた方が良くねえか」 is an argument for being
       able to say yes, not for being asked. So it is at the FOOT, next to
       the stage somebody adds themselves, and it is gone once the stage is
       on the list above. The stage names itself; nothing here explains it. */
    /* THE SAME + AS EVERYWHERE ELSE. 「丸い＋一つ（辞書と同じ）」 OWNER
       2026-09-01 -- .fab is what the dictionary, the alphabet, the composer
       and the notebook add with. Drawn on every plan: openOwnPhase() answers
       on the press with the popup.

       The particles row that used to sit beside it is gone: 「文法ページに◉+
       あるのに下までいくと助詞+って二重になってる。◉＋だけにして、助詞は最初
       から出せ」 OWNER 2026-09-01. It turned on a stage the book already knows,
       which is now on the list from the start (STAGES above). */
    (langLocked()? '' :
     '<button class="fab"' + DO('openOwnPhase') + ' aria-label="'+esc(t('stg.own.add.btn'))+'">'+
      ICON_ADD+'</button>');
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
  /* No heading. The bar over this page already says the stage's name, and it
     says it by calling the SAME function -- www/shell.js's pageName() ends in
     `if(r==='gram' && a) return stTitle(st)`, which is what this line was
     passing to esc(). Two lines that cannot disagree are one line said twice,
     and 「否定」 came out twice, one under the other.
     Rule 2's NAMES is exactly this claim: what a screen is called is PAGES' to
     say through pageName(), and naming one anywhere else is the same screen
     named twice. Same precedent as the day four screens stopped saying what a
     heading already said. */
  if(stWhat(p)) out+='<div class="note" style="margin-bottom:6px">'+esc(stWhat(p))+'</div>';

  if(p.slots.length){
    out+='<div class="sec">'+t('stg.words')+'</div>';
    out+='<div class="stslots">';
    for(i=0;i<p.slots.length;i++) out+=stSlotRow(p, p.slots[i]);
    out+='</div>';
  }
  /* The note below is typed into a buffer, so it has to exist before it is
     drawn out of it. www/shell.js § KEEP. The rule and the examples have a
     page each and carry their own. */
  stKeepOn(p.id);
  out+=stPageRow(t('stg.rules'), '', DO('openStRules', [p.id]))+
       stPageRow(t('stg.ex'), String(stEx(p.id).length||''), DO('openStEx', [p.id]));

  out+='<div class="sec">'+t('stg.note')+'</div>'+
    '<textarea class="ntbody" style="min-height:90px" placeholder="'+esc(t('stg.note.ph'))+'" '+
    '' + IN('stNote') + '>'+esc(keepVal(keepKey(), 'note'))+'</textarea>';
  if(p.own) out+='<button class="set" style="margin-top:18px;border-bottom:none"' + DO('stDelOwn', [p.id]) + '>'+
    '<span class="sl bad">'+t('stg.own.del')+'</span></button>';
  return out;
}
/* The decisions that are decisions -- word order and the three places a word
   can stand -- are NOT here any more, and neither is the drawing of them. They
   were the `feats` of the 語順, 否定, 形容詞 and 場所 stages, and all four of
   those stages are gone: each was a chapter of the rule-made group said a
   second time, 「重複はいらない」 OWNER 2026-09-06. The board is g2Board()'s and
   the two sides are g2Adj()'s and g2Adp()'s, on their own chapters, which is
   where they are now decided. stOn(), stFeatHTML() and the demonstrations they
   drew (gOrderLine, gOrderDemo, gPosDemo, gSide, gPairOf, gNeedWords in
   www/grammar.js) went with them rather than being left standing unreachable.

   THE NEGATION'S OWN SIDE HAS NOWHERE LEFT TO BE SET. `STG.gpos.negp` is still
   read by gRules() and still travels; nothing writes it any more, because the
   否定形 chapter has no picker and putting one there is not this session's to
   decide. docs/BACKLOG.md carries it. */
function vGram(){
  var gOpen=gOpenOf();
  var p;
  /* docs/GRAMMAR-V2-SPEC.md §14 -- the chapters that say what a word turns
     into. They arrive as arguments of this route rather than as a route of
     their own: www/shell.js's PAGES is another session's file and a view with
     no page there fails act-check. Their names are on the one list below,
     which is where they are opened from now.

     An argument that names no chapter -- the bare `v2` the foot of the old
     list used to open, or a chapter that has gone -- falls through to the
     list rather than to a blank page. */
  var c=(gOpen && gOpen.indexOf('v2:')===0)? g2ChapBy(gOpen.slice(3)) : null;
  /* The `?` in the bar, and the whole of what a chapter has to say is behind
     it -- 「説明禁止の代わりに？を儲けてるからね？」 OWNER 2026-09-05.
     helpQ() draws nothing for a chapter that has registered none, so the
     chapters that are not a form of a word simply have no mark. */
  if(c)
    return '<div class="view">'+navTop('', g2ChapBar(c))+
      '<div class="body">'+g2Page(c)+'</div></div>';
  p = gOpen? stBy(gOpen) : null;
  return '<div class="view">'+
    navTop()+
    '<div class="body">'+
    (p? stDetailHTML(p) : stListHTML())+
    '</div></div>';
}
