/* ---------------------------------------------------------------------------
   tools/fixture.mjs — something for the screens to be about.

   A screen with no words in it renders almost nothing, and a check that walks
   an empty app proves almost nothing. So every tool that opens the app in a
   browser first fills it with the same small language: six words, eleven
   sounds, a letter of each of the three kinds there are -- one that reads a
   sound, one that reads something that is not a sound, one that is a digit --
   a note, and a grammar stage with a rule and an example.

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
  ME = {name:'Aya', handle:'aya', bio:'Building a language for a place that does not exist.'};
  /* Two posts, and the second one is the whole reason the timeline is written
     the way it is: it is by somebody else, in a language this phone does not
     have, and every word of it is unknown to the dictionary above. A walk
     over one post that happens to be yours proves nothing -- it is exactly
     the state in which drawing your letter, your name and your font on
     everybody's post looks perfectly correct. */
  POSTS = [{id:'p1', at:Date.now()-3600000, lang:langId, lname:'Shango', ln:'kano mos tir',
            who:'Aya', hd:'aya', mine:true,
            av:{st:[{pts:[[112,112],[688,112],[400,688]]}]},
            mn:'a tall mountain is seen', ui:'en',
            gl:[{w:'kano', m:'mountain', p:'n'}, {w:'mos', m:'tall', p:'adj'},
                {w:'zzq', m:'', p:''}]},
           /* Somebody else's language, in somebody else's letters. The shapes
              are ON the post -- this phone has never seen the alphabet they
              were drawn in and never will -- which is the whole reason the
              line carries ink at all. Two letters, used four times between
              them, and the space between the words is text. */
           {id:'p2', at:Date.now()-7200000, lang:'other', lname:'Vethi', ln:'qel dross',
            who:'Iri', hd:'iri', mine:false, av:{ch:'Ж'},
            ink:{g:[[{pts:[[150,650],[400,150],[650,650]]}],
                    [{pts:[[200,200],[600,200]]}, {pts:[[400,200],[400,640]]}]],
                 s:[0, 1, 0, ' ', 1, 0, 1, 1, 0]},
            mn:'the sea has gone quiet', ui:'en',
            gl:[{w:'qel', m:'sea', p:'n'}, {w:'dross', m:'quiet', p:'adj'}]}];
  LETTERS = [{id:'l1', st:[{pts:[[112,112],[688,112],[400,688]]}], ch:'', nm:'', snd:['k']},
             {id:'l2', st:null, ch:'Ϙ', nm:'', snd:['t']},
             {id:'l3', st:[{pts:[[112,688],[400,112],[688,688]]}], ch:'', nm:'', snd:[]},
             /* a mark: a letter that reads something with no sound in it */
             {id:'l4', st:[{pts:[[200,200],[600,300],[400,600]]}], ch:'', nm:'', snd:['?']},
             /* a digit: a letter with a value instead of a reading */
             {id:'l5', st:[{pts:[[300,150],[300,650]]}], ch:'', nm:'', snd:[], val:1}];
  /* And the twenty-eight slots the free plan puts there. boot.js already ran
     it, against an empty language, before this file replaced LETTERS -- so
     without this line every check and every screenshot was looking at a
     five-letter alphabet that no free phone can be holding, and the QWERTY
     was three keys wide. */
  ltStart();
  /* and the ink for the post that is this person's own, for the same reason:
     boot.js cut what it could before this file put these posts here. */
  migratePostInk();
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
    /* The door itself, which is the sign-in screen: there is no splash in
       front of it any more. It was never in this list and did not need to be
       while nothing on it did anything. */
    ['the door',                  () => { ob.step = 0; ob.mode = ''; OBM.mode = 'in';
                                          return vOb(); }],
    ['characters to borrow',      () => { ob.step = 1; ob.mode = 'borrow';
                                          ob.pick = WORLD_SCRIPTS[0].id; return vOb(); }],
    ['no script picked to borrow from', () => { ob.step = 1; ob.mode = 'borrow';
                                                ob.pick = ''; return vOb(); }],
    /* The step where a letter is drawn. Its two buttons -- finish, or skip the
       drawing -- are the last thing a person touches before the app becomes
       the app, and nothing had ever pressed either of them. */
    ['drawing the first letter', () => { ob.step = 1; ob.mode = ''; return vOb(); }],
    /* The shape is drawn and the alphabet is under it. This step is the one
       ltNew() used to answer on everybody's behalf, so it is also the one
       nothing had ever walked. */
    ['choosing which letter the shape is', () => { ob.step = 2; ob.mode = '';
                                                   ob.lid = (LETTERS[0] || {}).id || '';
                                                   return vOb(); }],
    ['naming the language',      () => { ob.step = 3; ob.mode = ''; return vOb(); }],
    /* The door's other three faces. None is reachable from a screen at rest,
       so a walk that only ever renders the door presses none of their
       buttons.

       Each leaves the mode where it put it, like every other entry here
       leaves ob.step. They used to put it back, and the walks did not care
       because they read the html these return -- but shot.mjs calls render()
       afterwards, so a fixture that tidied up photographed the screen it had
       tidied back to, and three pictures of the door were captioned as three
       different screens. */
    ['making an account',        () => { ob.step = 0; OBM.mode = 'up';
                                         return vOb(); }],
    ['the six digits out of the mail', () => { ob.step = 0; OBM.mode = 'code';
                                         OBM.em = 'a@b.c'; return vOb(); }],
    ['having forgotten the password',  () => { ob.step = 0; OBM.mode = 'forgot';
                                         return vOb(); }],
    /* Through the door and not yet anybody. Only a signed-in person reaches
       it, so nothing else in this file or in shot.mjs ever renders it. */
    ['saying who you are',       () => { ob.step = 0; OBM.mode = 'who';
                                         OBM.busy = false; return vOb(); }]
  ];
}

/* Screens whose buttons only exist once something is half-done: a word being
   spelled, a letter being drawn, suggestions on the table, a conversation under
   way. A walk that only ever renders a screen at rest never sees these buttons
   at all -- and press.mjs, which has to rebuild a screen before every press,
   needs the same list act-check walks or the two drift apart silently. */
export function halfDone(){
  return [
    /* The account screen has two faces and the walk arrives with no session,
       so the way back out -- signing out -- was on neither of them. */
    ['the account, signed in', () => { SESS = { at:'a', rt:'r', uid:'u' };
                                       window.route = 'set'; NAV = [{ r:'set', a:'acct' }];
                                       const h = vSet(); SESS = null; return h; }],
    ['the word being edited', () => { openEdit('kano'); wEdit.mns = ['mountain','peak'];
                                      return FORM.html; }],
    /* A word, read. It is what opening one gives you now -- the editor is
       behind the button at the foot of it. */
    ['a word, read', () => { const w = findWord('kano');
                             w.ex = [{ln:'kano tir', gl:'sees the mountain'}];
                             w.nt = 'the one behind the village';
                             wRelToggle('kano','syn','mos');
                             openWord('kano'); const h = FORM.html;
                             wRelToggle('kano','syn','mos');
                             delete w.ex; delete w.nt; return h; }],
    ['the word being spelled', () => { openEdit('kano'); window.route='spell';
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
    /* An alphabet with a letter nobody has given a reading yet: the line
       saying how many only exists then, and only on that one of the three. */
    ['the alphabet with a letter unread', () => { window.route='ltset';
                                       NAV=[{r:'ltset', a:'alpha'}]; return vLtset(); }],
    /* The digits page, which is the only one of the three carrying the base. */
    ['the digits', () => { window.route='ltset';
                           NAV=[{r:'ltset', a:'num'}]; return vLtset(); }],
    ['the marks',  () => { window.route='ltset';
                           NAV=[{r:'ltset', a:'mark'}]; return vLtset(); }],
    ['a letter in the editor', () => { editGlyph('k'); window.route='glyph';
                                       NAV=[{r:'glyph', a:GE.lid}]; return vGlyph(); }],
    /* The chart, opened from the letter it is about. It is a sheet now
       rather than a chapter, so nothing reaches it by walking the routes --
       and the proposal inside it, with its row of sounds and its way to ask
       for one more, only exists once a character has been picked. */
    ['the chart, for one letter', () => { sndFeelPick = AS_CHARS[0].id;
                                          openSnd(LETTERS[0].id); return FORM.html; }],
    ['a word related to another', () => { window.route='relate'; NAV=[{r:'relate', a:'kano'}];
                                          return vRelate('kano'); }],
    /* The new-word sheet with something already chosen on it. The chips for
       what means the same and what means the opposite are the one place a
       relation on a word that does not exist yet can be taken back off, and
       an empty sheet has no chips -- so the sheet opened blank walks a screen
       whose only way to undo is never drawn. */
    /* Opened from somewhere that is not itself, so the sheet is a NEW one --
       openAdd() keeps what is on it when it is reopened by its own redraw or
       on the way back from the picker, which is the whole point of it, and a
       fixture that lands on the form twice gets the second of those. */
    ['the new word sheet, with a synonym', () => { window.route='words'; NAV=[{r:'words'}];
                                                   openAdd(''); addW.syn = ['kano'];
                                                   addW.ant = ['tir']; addW.ex = [{ln:'kano tir', gl:'sees it'}];
                                                   openAdd('');
                                                   const h = FORM.html; addW = null; return h; }],
    /* A note that already exists: the delete button only appears once there
       is something to delete, so a form opened empty never shows it. */
    ['a note being edited',    () => { openNote(0); return FORM.html; }],
    /* The three faces where a word is built out of SOUNDS rather than typed.
       Free types -- the alphabet is a to z and every one of them already
       reads something, so there is nothing to pick -- and picking is what
       can('snd') buys. All three still have to be walked, so all three flip
       the plan and put it back. */
    /* Derived from a word that already exists, so the sheet opens with a
       spelling in it -- the row of letter tiles is the only door to the page
       for one position of it, and an empty sheet has no tiles. */
    ['the new word sheet, by sound', () => { SET.plan = 'plus'; openAdd('kano');
                                             const h = FORM.html; addFrom = '';
                                             SET.plan = 'free'; return h; }],
    ['the word being edited, by sound', () => { SET.plan = 'plus'; openEdit('kano');
                                                const h = FORM.html;
                                                SET.plan = 'free'; return h; }],
    /* And the OTHER face of each of those two: the rail switches the sheet
       between the letters and the sounds, and the fixture's language has
       letters, so the sound half is never the one that opens. */
    ['the new word sheet, sounds rail', () => { SET.plan = 'plus'; wdMode = 'ph';
                                                openAdd(''); const h = FORM.html;
                                                wdMode = ''; SET.plan = 'free'; return h; }],
    ['the word being edited, sounds rail', () => { SET.plan = 'plus'; wdMode = 'ph';
                                                   openEdit('kano'); const h = FORM.html;
                                                   wdMode = ''; SET.plan = 'free'; return h; }],
    /* A grammar stage of your own: the door is on the paid plan, because the
       fifteen are the whole of the free chapter. */
    ['a grammar stage of your own', () => { SET.plan = 'plus'; openOwnPhase();
                                            const h = FORM.html;
                                            SET.plan = 'free'; return h; }],
    ['the grammar list, paid', () => { SET.plan = 'plus'; window.route='gram';
                                       NAV=[{r:'gram'}]; const h = vGram();
                                       SET.plan = 'free'; return h; }],
    ['a stage slot, by sound', () => { SET.plan = 'plus';
                                       openSlot(stAll()[0].id, stAll()[0].slots[0]);
                                       const h = FORM.html;
                                       SET.plan = 'free'; return h; }],
    /* The new-word sheet has two faces, and the buttons differ on each. */
    /* The keyboard the language owns, and the two sheets that build it: one
       key opened, and the alphabet being chosen from for one of its slots.
       Neither is a route -- they are forms, so nothing reaches them by
       walking. Every one of them is on the paid plan, because the editor is: the free
       keyboard is a QWERTY built from the letters every time it is shown and
       there is nothing on it to open. */
    ['a key of the keyboard, opened', () => { SET.plan = 'plus'; kbLay = 0; kbPick(0, 0);
                                              const h = FORM.html; KB = null;
                                              SET.plan = 'free'; return h; }],
    /* A key that switches layers rather than typing one: which layer it goes
       to is a question only that kind of key is asked. */
    ['a key that switches layers', () => { SET.plan = 'plus'; kbLay = 0; kbSetKind(0, 0, 'lay');
                                           const h = FORM.html; KB = null;
                                           SET.plan = 'free'; return h; }],
    ['the alphabet, for one slot of a key', () => { SET.plan = 'plus'; kbLay = 0; kbSlot(0, 0, -1);
                                                    const h = FORM.html; KB = null;
                                                    kbSlotFor = null;
                                                    SET.plan = 'free'; return h; }],
    /* A keyboard with more than one layer: the rail that switches between
       them only exists then -- and so does the rest of the editor: the way
       to add a row, to add a layer, and to put the whole thing back. */
    ['a keyboard of two layers', () => { SET.plan = 'plus'; kbAddLay(); const h = vKb();
                                         KB = null; kbLay = 0;
                                         SET.plan = 'free'; return h; }],
    /* ---- the paid faces of the making side ----------------------------
       Four screens the free plan does not show, because on free the
       alphabet is twenty-eight slots that cannot be added to, renamed or
       deleted from. Each of these is the same screen with the plan changed,
       and without them the buttons that do those things belong to no screen
       at all. */
    ['the alphabet, on the paid plan', () => { SET.plan = 'plus';
        window.route = 'ltset'; NAV = [{r:'ltset', a:'alpha'}];
        const h = vLtset(); SET.plan = 'free'; return h; }],
    ['one letter, on the paid plan', () => { SET.plan = 'plus';
        window.route = 'letter'; NAV = [{r:'letter', a:'l1'}];
        const h = vLetter(); SET.plan = 'free'; return h; }],
    /* The letters chapter with everything open: the keyboard's door, and the
       abugida bench's -- which is the only way to that screen, and only
       exists while the writing is an abugida, which is itself paid. */
    ['the letters chapter, on the paid plan', () => { SET.plan = 'plus'; SET.wsys = 'abugida';
        window.route = 'letters'; NAV = [{r:'letters'}];
        const h = vLetters(); SET.plan = 'free'; SET.wsys = ''; return h; }],
    ['the abugida bench', () => { SET.plan = 'plus'; SET.wsys = 'abugida';
        window.route = 'abugida'; NAV = [{r:'abugida'}];
        const h = vAbugida(); SET.plan = 'free'; SET.wsys = ''; return h; }],
    ['the five kinds of writing', () => { SET.plan = 'plus';
        window.route = 'wsys'; NAV = [{r:'wsys'}];
        const h = vWsys(); SET.plan = 'free'; return h; }],
    ['a word being added, by letter', () => { SET.plan='plus'; openAdd(''); wdSetMode('lt');
                                              const h=FORM.html; wdMode=''; SET.plan='free'; return h; }],
    ['a word being added, by sound',  () => { SET.plan='plus'; openAdd(''); wdSetMode('ph');
                                              const h=FORM.html; wdMode=''; SET.plan='free'; return h; }],
    ['one letter, opened',     () => { window.route='letter'; NAV=[{r:'letter', a:'l1'}];
                                       return vLetter(); }],
    ['a mark, opened',          () => { window.route='letter'; NAV=[{r:'letter', a:'l4'}];
                                       return vLetter(); }],
    /* A digit: a letter with a value instead of a reading. The row of values
       is on every letter, but only one of them is on. */
    ['a digit, opened',         () => { window.route='letter'; NAV=[{r:'letter', a:'l5'}];
                                       return vLetter(); }],
    /* A letter that borrowed a character rather than being drawn. The way to
       give the character back only exists once there is one. */
    ['a borrowed letter, opened', () => { window.route='letter'; NAV=[{r:'letter', a:'l2'}];
                                          return vLetter(); }],
    ['a conversation under way', () => { TALK=[{me:true, w:[['k','a','n','o']], g:['mountain']}];
                                         window.route='talk'; NAV=[{r:'talk'}];
                                         const h=vTalk(); TALK=[]; return h; }],
    ['a word being written',   () => { openAdd(); wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                       wdSync(); SUG=[['k','a'],['t','i']];
                                       return wdFormHTML()+vForm(); }],
    ['a word being spelled again', () => { openEdit('kano'); window.route='spell';
                                           NAV=[{r:'spell'}];
                                           wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                           return vSpell(); }],
    ['a word with a sentence in it', () => { findWord('kano').ex=[{ln:'kano tir', gl:'sees it'}];
                                             openEdit('kano');
                                             const h=wdFormHTML();
                                             delete findWord('kano').ex; return h; }],
    ['relatives to choose from', () => { window.route='relate'; NAV=[{r:'relate', a:'kano'}];
                                         return vRelate('kano'); }],
    ['a stage of your own',    () => { STG.extra=[{id:'own1', title:'mine', slots:['s1'],
                                                   labels:{s1:'a'}, what:''}];
                                       window.route='gram'; NAV=[{r:'gram', a:'own1'}];
                                       const h=vGram(); return h; }],
    /* The notebook with its lens pressed. The box is not on the screen at
       rest -- that is the whole point of the lens -- so nothing typed into
       it was ever reached by a walk over the routes. */
    /* A face already chosen. The way to take it off only exists once there
       is one, and a walk over a fresh install never has one. The data URL is
       a real 1x1 gif: postFace puts it in an <img src>. */
    ['a face already chosen', () => {
        ME.pic = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        openMe(); const h = FORM.html; ME.pic = ''; return h; }],
    ['searching the notes', () => { ntFind = true; ntQ = 'a';
                                    window.route='notes'; NAV=[{r:'notes'}];
                                    return vNotes(); }],
    ['a slot already filled',  () => { openSlot('neg','not'); return FORM.html; }],
    ['words being suggested for a slot', () => { openSlot('greet','yes');
                                                 stSug=[['k','a'],['t','i']];
                                                 return FORM.html.replace(/$/, stSugHTML()); }],
    ['one position of a word',   () => { openEdit('kano');
                                          wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                          window.route='spell'; NAV=[{r:'spell', a:'0'}];
                                          return vSpell(); }],
    ['one position of a new word', () => { openAdd(); wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                           wdSync();
                                           window.route='spell'; NAV=[{r:'spell', a:'0'}];
                                           return vSpell(); }],
    ['the sound keyboard in a word', () => { SET.plan='plus'; openEdit('kano'); wdMode='ph';
                                             const h=wdFormHTML(); wdMode=''; SET.plan='free'; return h; }],
    ['the sound keyboard in a new word', () => { SET.plan='plus'; openAdd(); wdMode='ph';
                                                 const h=FORM.html; wdMode=''; SET.plan='free'; return h; }],
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
    /* A post being written: the gloss under the line only exists once there
       is a line, and the meaning is filled from it. */
    /* The whole form, not just its body: the button that posts it sits in the
       top bar now, and a face that returns only FORM.html cannot see it. */
    ['a post being written', () => { PW = pwBlank(); openPost();
        pwSetLn('kano mos tir'); return vForm(); }],
    ['a reply being written', () => { PW = pwBlank(); PW.to = POSTS[0].id;
        openPost(); pwSetLn('sar'); return vForm(); }],
    ['who you are, being edited', () => { openMe(); return vForm(); }],
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
