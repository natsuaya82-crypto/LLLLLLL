/* ---------------------------------------------------------------------------
   tools/fixture.mjs — something for the screens to be about.

   A screen with no words in it renders almost nothing, and a check that walks
   an empty app proves almost nothing. So every tool that opens the app in a
   browser first fills it with the same small language: six words, eleven
   sounds, three letters (one drawn, one borrowed, one drawn again), a note, a
   grammar stage with a rule and an example.

   It lives here rather than inside one of the checks because two of them need
   it and a copy in each would drift the first time a field is added — and the
   drift would be silent, because both would still pass. The check that had the
   older copy would simply be walking a poorer app.

   `seed` is handed to Playwright's evaluate(), which sends the function's
   source to the page and runs it there. So it may not close over anything from
   this file: every name in it is a global the app itself defines.

   Used by tools/act-check.mjs and tools/press.mjs.
   --------------------------------------------------------------------------- */

/* eslint-disable no-undef */
export function seed(){
  WORDS = [
    {hw:'kano', ph:['k','a','n','o'], mn:'mountain', mns:['mountain'], pos:'n', at:1},
    {hw:'tir',  ph:['t','i','r'],     mn:'to see',   mns:['to see'],   pos:'v', at:2},
    {hw:'mos',  ph:['m','o','s'],     mn:'tall',     mns:['tall'],     pos:'adj', at:3},
    {hw:'sar',  ph:['s','a','r'],     mn:'river',    mns:['river'],    pos:'n', at:4},
    {hw:'nak',  ph:['n','a','k'],     mn:'not',      mns:['not'],      pos:'part', slot:'neg.not', at:5},
    {hw:'ke',   ph:['k','e'],         mn:'what',     mns:['what'],     pos:'pro',  slot:'ask.what', at:6}
  ];
  langName = 'Shango';
  /* The person's settings, back to what a fresh install has. A press that
     writes SET.x -- a theme, a reading mode, a writing system -- was
     otherwise still in force on every screen built after it, so the walk was
     covering one arrangement of the app and calling it all of them. */
  SET.theme='system'; SET.plan='free'; SET.done=true; SET.order='SOV';
  SET.read='both'; SET.voice=''; SET.ui='en'; SET.script=false;
  SET.myfont=false; SET.wsys=''; SET.gpos=''; SET.myfont=false;
  SND = ['k','t','m','n','s','r','a','i','u','e','o'];
  NOTES = [{t:'note', b:'body'}];
  TALK = [];
  LETTERS = [{id:'l1', st:[{pts:[[112,112],[688,112],[400,688]]}], ch:'', nm:'', snd:['k']},
             {id:'l2', st:null, ch:'Ϙ', nm:'', snd:['t']},
             {id:'l3', st:[{pts:[[112,688],[400,112],[688,688]]}], ch:'', nm:'', snd:[]},
             /* a mark: a letter that reads something with no sound in it */
             {id:'l4', st:[{pts:[[200,200],[600,300],[400,600]]}], ch:'', nm:'', snd:['?']}];
  STG = {done:{}, notes:{gr:'x'}, set:{}, extra:[],
         rules:{neg:'a rule'}, ex:{neg:[{lb:'a', ln:'kano tir', gl:'b'}]}};
  /* Where you are standing is the app's to say, not this file's. viewReset()
     in www/shell.js is the one list of what a screen forgets when you leave
     it; a copy here would be a second list to keep in step, and the first
     version of this was exactly that -- two of the fifteen. */
  viewReset();
}

/* The steps of the onboarding that have a second face: the writing systems to
   choose from, the sounds offered again, the characters on offer to borrow.
   Each entry is a label and a function returning that screen's HTML. */
export function obStates(){
  return [
    ['characters to borrow',      () => { ob.step = 1; ob.mode = 'borrow';
                                          ob.pick = WORLD_SCRIPTS[0].id; return vOb(); }],
    ['no script picked to borrow from', () => { ob.step = 1; ob.mode = 'borrow';
                                                ob.pick = ''; return vOb(); }],
    /* The step where a letter is drawn. Its two buttons -- finish, or skip the
       drawing -- are the last thing a person touches before the app becomes
       the app, and nothing had ever pressed either of them. */
    ['drawing the first letter', () => { ob.step = 1; ob.mode = ''; return vOb(); }]
  ];
}

/* Screens whose buttons only exist once something is half-done: a word being
   spelled, a letter being drawn, suggestions on the table, a conversation under
   way. A walk that only ever renders a screen at rest never sees these buttons
   at all -- and press.mjs, which has to rebuild a screen before every press,
   needs the same list act-check walks or the two drift apart silently. */
export function halfDone(){
  return [
    ['the word being edited', () => { openWord('kano'); wEdit.mns = ['mountain','peak'];
                                      wEdit.ex = [{ln:'kano tir', gl:'sees the mountain'}];
                                      return FORM.html; }],
    ['the word being spelled', () => { openWord('kano'); window.route='spell';
                                       NAV=[{r:'spell'}]; return vSpell(); }],
    ['the abugida editor',     () => { window.route='abugida'; NAV=[{r:'abugida'}];
                                       SET.wsys='abugida'; abVow = 'a';
                                       const h = vAbugida(); SET.wsys=''; return h; }],
    /* The letters chapter of a language that IS an abugida. The row that opens
       the bench only exists there, so a fixture whose language is an alphabet
       walks a chapter with no way to reach it -- which is indistinguishable,
       from outside, from a bench nothing can reach at all. */
    ['the letters chapter of an abugida', () => { window.route='letters'; NAV=[{r:'letters'}];
                                       SET.wsys='abugida';
                                       const h = vLetters(); SET.wsys=''; return h; }],
    ['a letter in the editor', () => { editGlyph('k'); window.route='glyph';
                                       NAV=[{r:'glyph', a:GE.lid}]; return vGlyph(); }],
    ['words being suggested',  () => { window.route='make'; NAV=[{r:'make'}];
                                       cands=[{q:['k','a','n','o'], on:true},
                                              {q:['t','i','r'], on:false}];
                                       return vMake(); }],
    /* the phonology chapter with an inventory proposed: the row of sounds and
       the way to ask for another only exist once a character has been picked */
    ['an inventory proposed',  () => { window.route='sound'; NAV=[{r:'sound'}];
                                       sndFeelPick = AS_CHARS[0].id; return vSound(); }],
    ['a word related to another', () => { window.route='relate'; NAV=[{r:'relate', a:'kano'}];
                                          return vRelate('kano'); }],
    /* A note that already exists: the delete button only appears once there
       is something to delete, so a form opened empty never shows it. */
    ['a note being edited',    () => { openNote(0); return FORM.html; }],
    /* The new-word sheet has two faces, and the buttons differ on each. */
    ['a word being added, by letter', () => { openAdd(''); addSetMode('lt');
                                              return FORM.html; }],
    ['a word being added, by sound',  () => { openAdd(''); addSetMode('ph');
                                              return FORM.html; }],
    ['one letter, opened',     () => { window.route='letter'; NAV=[{r:'letter', a:'l1'}];
                                       return vLetter(); }],
    ['a mark, opened',          () => { window.route='letter'; NAV=[{r:'letter', a:'l4'}];
                                       return vLetter(); }],
    /* A letter that borrowed a character rather than being drawn. The way to
       give the character back only exists once there is one. */
    ['a borrowed letter, opened', () => { window.route='letter'; NAV=[{r:'letter', a:'l2'}];
                                          return vLetter(); }],
    ['a conversation under way', () => { TALK=[{me:true, w:[['k','a','n','o']], g:['mountain']}];
                                         window.route='talk'; NAV=[{r:'talk'}];
                                         const h=vTalk(); TALK=[]; return h; }],
    ['a word being written',   () => { openAdd(); addSeq=['k','a','n','o'];
                                       addSp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                       SUG=[['k','a'],['t','i']];
                                       return wdBodyHTML? FORM.html+vForm() : FORM.html; }],
    ['a word being spelled again', () => { openWord('kano'); window.route='spell';
                                           NAV=[{r:'spell'}];
                                           wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                           return vSpell(); }],
    ['a word with a sentence in it', () => { findWord('kano').ex=[{ln:'kano tir', gl:'sees it'}];
                                             openWord('kano');
                                             const h=wdBodyHTML();
                                             delete findWord('kano').ex; return h; }],
    ['relatives to choose from', () => { window.route='relate'; NAV=[{r:'relate', a:'kano'}];
                                         return vRelate('kano'); }],
    ['a stage of your own',    () => { STG.extra=[{id:'own1', title:'mine', slots:['s1'],
                                                   labels:{s1:'a'}, what:''}];
                                       window.route='gram'; NAV=[{r:'gram', a:'own1'}];
                                       const h=vGram(); return h; }],
    ['a slot already filled',  () => { openSlot('neg','not'); return FORM.html; }],
    ['words being suggested for a slot', () => { openSlot('greet','yes');
                                                 stSug=[['k','a'],['t','i']];
                                                 return FORM.html.replace(/$/, stSugHTML()); }],
    ['one position of a word',   () => { openWord('kano');
                                          wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                          window.route='spell'; NAV=[{r:'spell', a:'0'}];
                                          return vSpell(); }],
    ['one position of a new word', () => { openAdd(); addSp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                           window.route='aspell'; NAV=[{r:'aspell', a:'0'}];
                                           return vASpell(); }],
    ['the sound keyboard in a word', () => { openWord('kano'); wdMode='ph';
                                             return wdBodyHTML(); }],
    ['the sound keyboard in a new word', () => { openAdd(); addMode='ph';
                                                 return FORM.html; }],
    ['words offered for a meaning', () => { SUG=[['k','a'],['t','i']]; sugMn='mountain';
                                            const h=sugHTML(); SUG=[]; return h; }],
    ['synonyms to choose from',  () => { window.route='relate'; NAV=[{r:'relate', a:'syn:kano'}];
                                         return vRelate(); }],
    ['characters on offer',      () => { openPick('l1'); pkScript=WORLD_SCRIPTS[0].id;
                                         return FORM.html + pkCharsHTML(); }],
    ['an abugida being placed',  () => { SET.wsys='abugida';
                                         LETTERS.push({id:'lv', st:[{pts:[[200,200],[600,600]]}],
                                                       ch:'', nm:'', snd:['a']});
                                         window.route='abugida'; NAV=[{r:'abugida'}];
                                         abVow='a';
                                         const h=vAbugida(); SET.wsys='alpha'; return h; }],
    ['a letter wearing a borrowed character', () => { editGlyph('t'); GE.ch='Ϙ';
                                                      window.route='glyph';
                                                      NAV=[{r:'glyph', a:GE.lid}];
                                                      return vGlyph(); }],
    ['the free plan out of room', () => { SET.plan='free'; SET.aiDay='';
                                          SET.aiN=999; openAdd();
                                          const h=FORM.html; SET.aiN=0; return h; }],
    ['a language somebody else is reading', () => { LANGS.L_other={name:'Necwe', mine:false};
                                                     window.route='langs'; NAV=[{r:'langs'}];
                                                     const h=vLangs(); delete LANGS.L_other; return h; }],
    ['a mark in the editor',   () => { editLetter('l4'); window.route='glyph';
                                       NAV=[{r:'glyph', a:GE.lid}]; return vGlyph(); }],
    /* A list being read in has three faces and they share no buttons: the
       paste box, the table where each column is said to be something, and
       what happened afterwards with the way to undo it. */
    ['a list waiting to be understood', () => { IMP = impBlank();
        impTake('Word,Meaning,Part of Speech,Made\n' +
                'kano,mountain,noun,2024\nzzk,a thing,verb,2024\n');
        return FORM.html; }],
    /* The same list where one of its words is already in the dictionary, so
       the choice between skipping and overwriting exists at all. */
    ['a list with words already here', () => { IMP = impBlank();
        impTake('Word,Meaning\nkano,mountain\nzzk,a thing\n');
        return FORM.html; }],
    /* An alphabet rather than a dictionary: the same screen, and the counts
       below the table say letters instead of words. */
    ['an alphabet waiting to be understood', () => { IMP = impBlank();
        impTake('Letter,Sound,Name\nϘ,k,qoppa\nϠ,sh,sampi\n');
        return FORM.html; }],
    ['a list just brought in', () => { IMP = impBlank();
        IMP.read = {shape:'table', head:null, rows:[['zzk', 'a thing']]};
        IMP.roles = ['hw', 'mn'];
        doImport();
        const h = FORM.html; impUndo(); return h; }],
    /* On the paid plan the file button is a real file input rather than the
       way to the plans. */
    ['a file being chosen', () => { SET.plan = 'plus'; IMP = impBlank();
        openImport();
        const h = FORM.html; SET.plan = 'free'; return h; }],
    /* The card, which is the only screen whose output leaves the app. Both
       faces: a word, and one of the sentences written under a word -- they
       compose the picture differently (one spelling, or several with the
       gaps between them) and only the second can overflow the width. */
    ['a word as a card',       () => { cardOpen('w', 'kano'); return FORM.html; }],
    ['a sentence as a card',   () => { findWord('kano').ex=[{ln:'kano mos tir', gl:'a tall mountain is seen'}];
                                       cardOpen('x', 'kano#0');
                                       const h=FORM.html; delete findWord('kano').ex; return h; }]
  ];
}
