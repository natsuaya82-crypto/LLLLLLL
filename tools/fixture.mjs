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
  /* A photograph with a SHAPE, and it is declared IN here because seed() is
     sent to the page as source and cannot reach a thing in this file.

     It was a one-pixel transparent GIF, which is the right fixture for "is
     there a picture on this post" and the wrong one for every question about
     how big one is drawn: a 1x1 image blown up to fill a column looks
     identical, in a walk, to one shown at its own size. No check and no
     screenshot could tell a picture in a box from a picture stretched across
     the screen, which is why nothing said the timeline was doing the second.

     Made rather than pasted in as kilobytes of base64, at the size and the
     quality a real post carries -- POST_PIC and POST_PICQ in www/post.js. */
  const fixPic = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = '#c9d3de'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#8fa68a'; x.fillRect(0, Math.round(h * 0.62), w, h);
    x.fillStyle = '#5b6b74'; x.fillRect(Math.round(w * 0.12), Math.round(h * 0.3),
                                        Math.round(w * 0.2), Math.round(h * 0.42));
    return c.toDataURL('image/jpeg', POST_PICQ);
  };
  /* halfDone() below is sent to the page as source too, so it cannot reach
     this either. One maker, left where both can find it. */
  window.__fixPic = fixPic;
  /* Signed in, because the timeline is online: the three sns tabs and the
     composer answer with the door when there is no session, so a walk that
     arrived signed out would render four screens and never see the timeline
     at all. The DOOR is the face that needs saying out loud now, and it is
     one entry in halfDone() rather than the state everything else is walked
     in. */
  SESS = { at:'a', rt:'r', uid:'u' };
  WORDS = [
    {hw:'kano', ph:['k','a','n','o'], mn:'mountain', mns:['mountain'], pos:'n', at:1,
     reg:'wr', tags:['land'], ety:'from the word for head', up:2},
    {hw:'tir',  ph:['t','i','r'],     mn:'to see',   mns:['to see'],   pos:'v', at:2},
    {hw:'mos',  ph:['m','o','s'],     mn:'tall',     mns:['tall'],     pos:'adj', at:3},
    {hw:'sar',  ph:['s','a','r'],     mn:'river',    mns:['river'],    pos:'n', at:4},
    {hw:'nak',  ph:['n','a','k'],     mn:'not',      mns:['not'],      pos:'part', slot:'neg.not', at:5},
    {hw:'ke',   ph:['k','e'],         mn:'what',     mns:['what'],     pos:'pro',  slot:'ask.what', at:6},
    /* Three words derived from `tir`, two of them a FORM of it and one of
       them not, because that is the distinction the family list draws: a
       past tense and a progressive read under their labels and in the order
       FM lists, and the word for somebody who watches reads after them under
       nothing. A family of unlabelled words proves neither half. */
    {hw:'tira', ph:['t','i','r','a'],     mn:'saw',     mns:['saw'],     pos:'v', from:'tir', fm:'pst', at:7},
    {hw:'tiran',ph:['t','i','r','a','n'], mn:'seeing',  mns:['seeing'],  pos:'v', from:'tir', fm:'prg', at:8},
    {hw:'tiror',ph:['t','i','r','o','r'], mn:'watcher', mns:['watcher'], pos:'n', from:'tir', at:9},
    /* And one wearing a label nobody supplied. What a language calls a thing
       is its own -- the label is the words somebody typed, kept as typed and
       never translated -- and it is stored on the word, so the labels this
       language has are the ones its words are wearing. */
    {hw:'tirok',ph:['t','i','r','o','k'], mn:'lookout', mns:['lookout'], pos:'n', from:'tir', fm:'d~見張り', at:10}
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
  ME = {name:'Aya', handle:'aya', bio:'Building a language for a place that does not exist.',
        fo:['iri','veth'], fr:['iri']};
  /* Two posts, and the second one is the whole reason the timeline is written
     the way it is: it is by somebody else, in a language this phone does not
     have, and every word of it is unknown to the dictionary above. A walk
     over one post that happens to be yours proves nothing -- it is exactly
     the state in which drawing your letter, your name and your font on
     everybody's post looks perfectly correct. */
  POSTS = [{id:'p1', at:Date.now()-3600000, lang:langId, lname:'Shango', ln:'kano mos tir',
            who:'Aya', hd:'aya', mine:true,
            av:{st:[{pts:[[112,112],[688,112],[400,688]]}]},
            mn:'a tall mountain is seen', ui:'en', re:1,
            pic:fixPic(900, 600)},
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
            /* And it runs down the page, columns right to left. A post
               carries the direction it was written in for the same reason it
               carries its shapes: this phone's language runs left to right,
               and a timeline that asked the open language which way to set a
               line would set this one wrongly and look perfectly fine doing
               it. Somebody else's post is the only place that shows. */
            dir:'ttb-rl',
            /* And it has a voice on it. The bytes are a file in Documents,
               which is a place no check has -- what is walked is the row a
               post carrying one shows, which is the whole of the reading
               side of it. */
            vo:{f:'v1.m4a', ms:7000}},
           /* And an answer to the first one, which is the third thing this
              list is here to hold. Every post in the fixture was a post
              nobody had replied to, so the line saying who a reply answers
              had never been drawn by anything and the thread page had only
              its own empty case to be walked in -- and a timeline where no
              two posts have anything to do with each other is exactly the
              state in which a conversation looks perfectly fine flattened.

              It carries `toh` as well as `to`: the handle is what a reader
              is shown, and it is on the reply because the post it answers
              may not be on the phone reading it. */
           {id:'p3', at:Date.now()-1800000, lang:'other', lname:'Vethi',
            ln:'qel', who:'Iri', hd:'iri', mine:false, av:{ch:'Ж'},
            ink:{g:[[{pts:[[150,650],[400,150],[650,650]]}]], s:[0]},
            mn:'yes, that is the one', ui:'en',
            to:'p1', toh:'aya', re:1},
           /* and an answer to the answer, because one reply is a list of two
              and two is the first thing that has to be drawn as a tree */
           {id:'p4', at:Date.now()-900000, lang:langId, lname:'Shango',
            ln:'mos', who:'Aya', hd:'aya', mine:true,
            av:{st:[{pts:[[112,112],[688,112],[400,688]]}]},
            mn:'the one behind the village', ui:'en',
            to:'p3', toh:'iri'}];
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
         rules:{neg:'a rule'}, ex:{neg:[{lb:'a', ln:'kano tir', gl:'b'}]},
         /* One rule for making a form, because the screen it is written on
            renders nothing at all without one -- so a walk over an empty list
            pressed the button that opens the editor and came back with a
            blank sheet, and every control on that sheet counted as a name no
            screen ever says.
            A plural for nouns rather than a past for verbs: every verb in
            here already wears the label its parent gave it, so a rule making
            a past would have nothing left to offer and the button that
            offers it would never be drawn. */
         fm:[{id:'fr1', pos:'n', fm:'pl', at:'end', drop:0, when:'',
              add:[{l:'l1', u:'k'}]}]};
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
    /* The code and the new password, which is where asking for a reset now
       lands. It used to end at a line saying "sent". */
    ['choosing a new password',  () => { ob.step = 0; OBM.mode = 'reset';
                                         OBM.em = 'a@b.c'; OBM.code = ''; OBM.pw = '';
                                         OBM.busy = false; return vOb(); }],
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
    /* The account screen has two faces and the walk arrives signed IN, so the
       way in -- the three sign-in buttons and the mail door -- is on neither
       of them without this. It used to be the other way round; seed() signs
       in now, because the timeline does not exist without a session. */
    ['the account, signed out', () => { const was = SESS; SESS = null;
                                        window.route = 'set'; NAV = [{ r:'set', a:'acct' }];
                                        const h = vSet(); SESS = was; return h; }],
    /* And the timeline before there is anybody: one door, the app's own, with
       "continue without an account" left off -- it means "go and draw a
       letter", and somebody standing here has a language already.
       「なんでログインしてないアカウントで投稿できんの？」 */
    ['the timeline, signed out', () => { const was = SESS; SESS = null;
                                         window.route = 'feed'; NAV = [{ r:'feed' }];
                                         const h = vFeed(); SESS = was; return h; }],
    ['the word being edited', () => { openEdit('kano'); wEdit.mns = ['mountain','peak'];
                                      return FORM.html; }],
    /* The field for one more of something is not on the sheet until the `+`
       on the heading is pressed, so without these the only way to write a
       second meaning is a screen nothing walks. */
    /* The three lists the sheet sends you to. All three are about the word
       being written, so none of them is a screen without one open. */
    ['what kind of word it is', () => { openEdit('kano');
       window.route = 'pos'; NAV = [{ r:'pos' }]; return vPos(); }],
    ['how it is said', () => { openEdit('kano');
       window.route = 'reg'; NAV = [{ r:'reg' }]; return vReg(); }],
    ['one more meaning', () => { openEdit('kano'); wdMnNew = true; return wdFormHTML(); }],
    ['one more example', () => { openEdit('kano'); wdExNew = true; return wdFormHTML(); }],
    ['one more example of a stage', () => {
       const id = stAll()[0].id;
       window.route = 'gram'; NAV = [{ r:'gram', a:id }]; stExNew = id;
       const h = vGram(); stExNew = ''; return h; }],
    ['a label of your own', () => {
       window.route = 'fm'; NAV = [{ r:'fm', a:'tira' }]; fmNewG = 'i';
       const h = vFm(); fmNewG = ''; return h; }],
    /* What a word is of the word it came from, asked only of a word that HAS
       a parent
       -- so the sheet kano is edited on never carries it, and the row would
       be walked by nothing. */
    ['a form being edited', () => { openEdit('tira'); return FORM.html; }],
    /* And the other end: a word read with its forms under it. kano has no
       family, so the labelled rows are on no screen either without this. */
    ['a word and its forms', () => { openWord('tir'); return FORM.html; }],
    /* A word, read. It is what opening one gives you now -- the editor is
       behind the button at the foot of it. */
    ['a word, read', () => { const w = findWord('kano');
                             w.ex = [{ln:'kano tir', gl:'sees the mountain'}];
                             w.nt = 'the one behind the village';
                             wRelToggle('kano','syn','mos');
                             openWord('kano'); const h = FORM.html;
                             wRelToggle('kano','syn','mos');
                             delete w.ex; delete w.nt; return h; }],
    /* A dictionary that came down from a paid plan: past the free ceiling, so
       the list is the first hundred and the rest are said for at the foot of
       it. The walk runs on the free plan with six words in it, where
       wordsSeen() is simply WORDS, so without this the line that tells
       somebody where the other four thousand nine hundred went is never
       rendered by anything -- and it is the line they read the day their
       subscription lapses. */
    ['the dictionary, past the free ceiling', () => { const keep = WORDS;
      WORDS = keep.concat(Array.apply(null, {length: FREE_LIMIT})
                               .map((_, i) => ({hw:'x'+i, mns:['filler'], pos:'n', at:1})));
      const h = vWords(); WORDS = keep; return h; }],
    /* And what it says out loud, once, on the day that happens. capLapse()
       only fires on a plan that changed, and nothing in a walk changes one. */
    ['the plan has ended', () => { openCapLapse(); return FORM.html; }],
    /* The reading of a word, which is the paid plan's and is reached from a
       sheet that has a word open on it. Once with the search empty and once
       with something in it: the tiles are the screen, and a search that
       matches nothing leaves it with none. */
    /* The digits room on a paid plan, which is where the base is nudged: free
       counts in ten and has no say in it, so the row is on no screen the walk
       renders otherwise. And once more with a digit the base can no longer
       reach, which is the red cell. */
    ['the digits, where the base is set', () => { SET.plan='plus';
       window.route='ltset'; NAV=[{r:'ltset', a:'num'}];
       const h=vLtset('num'); SET.plan='free'; return h; }],
    ['a digit above the base', () => { SET.plan='plus';
       const was=STG.base; STG.base=10; ltNew({val:11});
       window.route='ltset'; NAV=[{r:'ltset', a:'num'}];
       const h=vLtset('num');
       LETTERS = LETTERS.filter(l => l.val !== 11); STG.base=was; SET.plan='free';
       return h; }],
    /* A post turned into this language, and one of its gaps opened. The
       panel is a way of LOOKING at a post -- TURNED is not stored -- so no
       screen the walk renders has it, and the bubble is one press further in
       again. */
    ['a post said in my language', () => { const p = POSTS[0];
       TURNED[p.id] = 1; window.route='feed'; NAV=[{r:'feed'}];
       const h = vFeed(); TURNED = {}; return h; }],
    /* And a piece of it pressed, which is the bubble. TRNEW is a way of
       looking at the panel, not a fact about it, so no screen the walk
       renders has it. Once on a word this language has, once on a gap. */
    ['a word of it, pressed', () => { const p = POSTS[0];
       TURNED[p.id] = 1;
       const u = trUnits(postSay(p)).filter(x => !x.sp);
       let at = -1; u.forEach((x, i) => { if (x.w && at < 0) at = i; });
       TRNEW = { id:p.id, k:String(at < 0 ? 0 : at) };
       window.route='feed'; NAV=[{r:'feed'}];
       const h = vFeed(); TRNEW = null; TURNED = {}; return h; }],
    ['a gap in it, pressed', () => { const p = POSTS[0];
       TURNED[p.id] = 1;
       const u = trUnits(postSay(p)).filter(x => !x.sp);
       let at = 0; u.forEach((x, i) => { if (x.miss && !at) at = i; });
       TRNEW = { id:p.id, k:String(at) };
       window.route='feed'; NAV=[{r:'feed'}];
       const h = vFeed(); TRNEW = null; TURNED = {}; return h; }],
    ['the reading of a word', () => { SET.plan='plus'; openEdit('kano');
                                      window.route='spell'; NAV=[{r:'spell'}];
                                      const h=vSpell(); SET.plan='free'; return h; }],
    ['the reading of a word, searched', () => { SET.plan='plus'; openEdit('kano');
                                                window.route='spell'; NAV=[{r:'spell'}];
                                                spQ='a';
                                                const h=vSpell(); spQ='';
                                                SET.plan='free'; return h; }],
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
    /* The IPA, opened from the letter it is about, and again from the
       inventory -- one page, two things a press means, so both are walked.
       Nothing reaches either by walking the routes. And once with something
       in the search, because a search that matches nothing leaves the page
       with no tiles at all. */
    ['the sounds, for one letter', () => { openSnd(LETTERS[0].id); return FORM.html; }],
    ['the sounds, for the language', () => { openSndAdd(); return FORM.html; }],
    ['the sounds, searched', () => { ipaQ = 'a'; openSnd(LETTERS[0].id);
                                     const h = FORM.html; ipaQ = ''; return h; }],
    /* What one sound IS, which is a page of its own behind the ? on a tile.
       Twice: a sound one of the ten languages has, and one that none of them
       does, because the second says only how it is made. */
    ['what a group of sounds is', () => { openIpaG('m.plosive'); return FORM.html; }],
    ['what a group with no examples is', () => { openIpaG('o'); return FORM.html; }],
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
       spelling in it -- an empty sheet has no reading to change. */
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
    /* The profile's other two lists. Each is empty on a fresh fixture, and an
       empty list draws neither a row nor anything a row carries. */
    ['the profile, replies', () => { pfTab='re'; POSTS.push({id:'pre', at:1, lang:langId,
        lname:'Shango', ln:'ke', who:'Aya', hd:'aya', mine:true, to:'p2',
        mn:'what?', ui:'en'});
        window.route='profile'; NAV=[{r:'profile'}];
        const h=vProfile(); POSTS.pop(); pfTab='posts'; return h; }],
    ['the profile, likes', () => { pfTab='li'; const p=postById('p2'); p.lime=1; p.li=1;
        window.route='profile'; NAV=[{r:'profile'}];
        const h=vProfile(); delete p.lime; p.li=0; pfTab='posts'; return h; }],
    /* The three things an author can do to their own post. The menu hangs off
       the ... , inside the post, so nothing renders it unless one is open --
       and what opens it is PMENU, which is where you are standing rather than
       anything about a post. */
    ['what an author can do to a post', () => { PMENU = 'p1';
                              window.route='feed'; NAV=[{r:'feed'}];
                              const h = vFeed(); PMENU = ''; return h; }],
    ['and the same, already pinned',    () => { const p = postById('p1'); p.pin = 1;
                              PMENU = 'p1'; window.route='feed'; NAV=[{r:'feed'}];
                              const h = vFeed(); delete p.pin; PMENU = ''; return h; }],
    /* And the OTHER menu, which is a different menu: on somebody else's post
       what you can do is about them, not about it. `p2` is Iri's. */
    ['what you can do about somebody else', () => { PMENU = 'p2';
                              window.route='feed'; NAV=[{r:'feed'}];
                              const h = vFeed(); PMENU = ''; return h; }],
    ['and the same, already blocked', () => { const was = ME.bl; ME.bl = ['iri'];
                              PMENU = 'p2'; window.route='feed'; NAV=[{r:'feed'}];
                              const h = vFeed(); ME.bl = was; PMENU = ''; return h; }],
    /* The five reasons. It is a form and nothing walks to it. */
    ['saying what is wrong with a post', () => { openReport('p2', 'iri');
                              const h = FORM.html; rpFor = null; return h; }],
    /* Somebody else's profile, the follow button on it, and the same page
       once you follow them. The only profile a walk sees is this person's
       own, and the two cards are different screens. */
    ['somebody else\'s profile', () => { window.route='profile'; NAV=[{r:'profile', a:'iri'}];
        const h = vProfile(); NAV=[{r:'profile'}]; return h; }],
    ['somebody else\'s profile, followed', () => { ME.fo = ['iri'];
        window.route='profile'; NAV=[{r:'profile', a:'iri'}];
        const h = vProfile(); NAV=[{r:'profile'}]; ME.fo = ['iri','veth']; return h; }],
    /* A post kept to yourself, which is the lock beside the time, and the
       composer while it is going to be one -- the button says so. */
    ['a post kept to yourself', () => { const p = postById('p1'); p.pv = 1;
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); delete p.pv; return h; }],
    ['a post about to be kept to yourself', () => { PW = pwBlank(); PW.pv = true;
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* Drafts, which are only drawn once there are some. */
    ['the composer with drafts saved', () => {
        DRAFTS = [{at:Date.now(), ln:'kano', mn:'a mountain', to:'', pics:[], vo:null, pv:false},
                  {at:Date.now(), ln:'', mn:'', to:'', pics:[], vo:null, pv:true}];
        PW = pwBlank(); openPost(); const h = vForm(); DRAFTS = []; return h; }],
    ['the drafts, on their own page', () => {
        DRAFTS = [{at:Date.now(), ln:'kano', mn:'a mountain', to:'', pics:[], vo:null, pv:false},
                  {at:Date.now()-90000, ln:'', mn:'', to:'', pics:[], vo:null, pv:true}];
        window.route='drafts'; NAV=[{r:'feed'},{r:'drafts'}];
        const h = vDrafts(); DRAFTS = []; NAV=[{r:'feed'}]; return h; }],
    ['the drafts page with none', () => {
        window.route='drafts'; NAV=[{r:'feed'},{r:'drafts'}];
        const h = vDrafts(); NAV=[{r:'feed'}]; return h; }],
    /* Notices, which arrive and so are never there on a phone with nobody
       else on it. */
    ['notices', () => { NOTES_HAVE = [
        {kind:'like', at:Date.now()-60000, hd:'iri', who:'Iri', av:{ch:'Ж'}, id:'p1'},
        {kind:'reply', at:Date.now()-120000, hd:'iri', who:'Iri', av:null, id:'p1'},
        {kind:'boost', at:Date.now()-180000, hd:'veth', who:'', av:null, id:'p1'},
        {kind:'follow', at:Date.now()-240000, hd:'veth', who:'', av:null, id:''},
        {kind:'pick', at:Date.now()-300000, hd:'', who:'', av:null, id:'p2'}];
        window.route='notif'; NAV=[{r:'notif'}];
        const h = vNotif(); NOTES_HAVE = null; return h; }],
    /* The search, with something in it. An empty field draws no results at
       all, so a walk that never types finds nothing to be wrong. Both
       halves: `@` is looking for a person, anything else for a post. */
    /* Searching is about PEOPLE until somebody presses the phone's own
       Search key, so the two answers are two faces and `snsMode` is what
       tells them apart. The people face carries the Follow button, which is
       on no other screen.

       The answer is put in by hand. snsFind() asks the SERVER now, and there
       is no server in a walk -- so a face that let it ask would render the
       empty page that is showing while the request is out, which is a
       different screen from the one being walked. What is put in is the shape
       netFindWho() returns. */
    ['people found by searching', () => { snsQ = 'ir'; snsMode = 'who';
        snsHits = { q:'ir', who:[{ who:'Iri', hd:'iri', av:{ch:'\u0416'},
                                   lname:'Vethi', mine:false }], posts:[] };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* Somebody already followed: Follow and Following are two states of one
       button and only one of them is drawn at a time. */
    ['a person already followed', () => { snsQ = 'ir'; snsMode = 'who';
        const was = ME.fo; ME.fo = ['iri'];
        snsHits = { q:'ir', who:[{ who:'Iri', hd:'iri', av:{ch:'\u0416'},
                                   lname:'Vethi', mine:false }], posts:[] };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); ME.fo = was; snsQ = ''; snsHits = null; return h; }],
    ['posts found by searching', () => { snsQ = 'kano'; snsMode = 'posts';
        snsHits = { q:'kano', who:[], posts:POSTS.slice(0, 2) };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; snsMode = 'who'; return h; }],
    ['a search that found nothing', () => { snsQ = 'zzzzzz'; snsMode = 'who';
        snsHits = { q:'zzzzzz', who:[], posts:[] };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* And a search that could not be made at all, which is a different answer
       from one that found nothing and must not look like it. */
    ['a search that could not be asked', () => { snsQ = 'iri'; snsMode = 'who';
        snsHits = { q:'iri', who:[], posts:[], bad:t('net.offline') };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* The badge, which only exists on a paid plan -- so a walk on the free
       plan never draws one, and free is what these walks run on. Both plans,
       and both places it shows: beside a name on a profile and beside a name
       on a post. The row that sells it is the other way round: it is there
       only while nobody has bought anything. */
    ['the profile of somebody on Plus', () => { SET.plan = 'plus';
        window.route='profile'; NAV=[{r:'profile'}];
        const h = vProfile(); SET.plan = 'free'; return h; }],
    ['the timeline of somebody on Plus', () => { SET.plan = 'plus';
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); SET.plan = 'free'; return h; }],
    /* A post with no line: a photograph on its own, and a voice on its own.
       A post was a LINE or nothing until 「文字無しでもポストできるように
       できない？」, so every walk before this had a line on every post and
       the empty case had never been drawn. */
    ['a post that is only a photograph', () => {
        POSTS.push({id:'pz', at:Date.now(), lang:langId, lname:'Shango', ln:'',
                    who:'Aya', hd:'aya', mine:true, mn:'', ui:'en',
                    pics:[POSTS[0].pic]});
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); POSTS.pop(); return h; }],
    ['a post that is only a voice', () => {
        POSTS.push({id:'pz', at:Date.now(), lang:langId, lname:'Shango', ln:'',
                    who:'Aya', hd:'aya', mine:true, mn:'', ui:'en',
                    vo:{f:'v9.m4a', ms:12000}});
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); POSTS.pop(); return h; }],
    /* The fixture's conversation is two deep, which draws one step of indent.
       Past THREAD_IN the indent stops and the rows keep going, and that is
       the branch nothing else reaches -- a thread four deep is the shortest
       one that has a row the app refuses to move any further right. */
    ['a thread past the indent', () => {
        POSTS.push({id:'pr5', at:Date.now()-500000, lang:'other', lname:'Vethi',
                    ln:'qel', who:'Iri', hd:'iri', mine:false, av:{ch:'Ж'},
                    mn:'the village', ui:'en', to:'p4', toh:'aya'},
                   {id:'pr6', at:Date.now()-400000, lang:langId, lname:'Shango',
                    ln:'tir', who:'Aya', hd:'aya', mine:true,
                    mn:'seen from there', ui:'en', to:'pr5', toh:'iri'});
        window.route='thread'; NAV=[{r:'feed'},{r:'thread', a:'p1'}];
        const h = vThread(); POSTS.pop(); POSTS.pop(); return h; }],
    /* A reply whose parent is not here: only `to`, nothing to read a handle
       off, and the line that says who it answers is correctly left off rather
       than guessed at. It is what every reply looks like the moment somebody
       deletes what they were answering. */
    ['a reply whose parent is gone', () => {
        POSTS.push({id:'pr3', at:Date.now()-600000, lang:langId, lname:'Shango',
                    ln:'kano', who:'Aya', hd:'aya', mine:true,
                    mn:'the mountain', ui:'en', to:'gone-post'});
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); POSTS.pop(); return h; }],
    /* And the thread of a post that is not here any more, which is what the
       back button lands on the moment somebody deletes what they opened. */
    ['a thread that is gone', () => {
        window.route='thread'; NAV=[{r:'feed'},{r:'thread', a:'no-such-post'}];
        return vThread(); }],
    /* The other timeline. The fixture follows @iri and @veth, so the plain
       walk sees a Following tab with posts in it; the tab is only interesting
       twice, and the second time is when it is EMPTY -- somebody who has not
       followed anybody yet, which is everybody on their first day and is a
       different sentence from "nothing has been written". */
    ['the timeline, following', () => { snsTab = 'fo';
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); snsTab = 'rec'; return h; }],
    ['the timeline, following nobody', () => { snsTab = 'fo';
        const keep = ME.fo; ME.fo = [];
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); ME.fo = keep; snsTab = 'rec'; return h; }],
    /* More than one photograph, which is a different thing from one: a strip
       that scrolls sideways. Nothing in the fixture carried two, so `.ppics.many`
       had never been rendered by anything -- and it was the rule doing the
       cropping. Two shapes, because a strip of one shape says nothing about
       what a strip does to a portrait. */
    ['a post carrying four photographs', () => {
        POSTS.push({id:'pm', at:Date.now(), lang:langId, lname:'Shango', ln:'kano',
                    who:'Aya', hd:'aya', mine:true, mn:'four of them', ui:'en',
                    pics:[POSTS[0].pic, window.__fixPic(600, 900),
                          window.__fixPic(900, 900), window.__fixPic(1200, 500)]});
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); POSTS.pop(); return h; }],
    /* And one of them opened, which is the whole picture rather than the box
       it is shown in. */
    ['one photograph, opened', () => {
        window.route='photo'; NAV=[{r:'feed'},{r:'photo', a:'p1:0'}];
        return vPhoto(); }],
    /* A pinned post in the timeline: the mark beside the time only exists on
       one, and a walk over a timeline where nothing is pinned never draws it. */
    ['a pinned post', () => { const p = postById('p1'); p.pin = 1;
                              window.route='feed'; NAV=[{r:'feed'}];
                              const h = vFeed(); delete p.pin; return h; }],
    /* A post being written, with a photograph already chosen. The button that
       takes it off and the one that changes it only exist once there is one,
       so a composer opened empty draws neither. The data URL is a real 1x1
       gif: it goes in an <img src>. */
    ['a post with a photograph', () => {
        openPost();
        PW.pics = [{u:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    marks:[]}];
        openPost(); const h = FORM.html; PW = pwBlank(); return h; }],
    /* And a post carrying the most it may. The plus is gone at four and the
       strip slides, so the composer with four pictures on it is a different
       screen from the composer with one. */
    ['a post with four photographs', () => {
        openPost();
        PW.pics = Array.apply(null, {length: POST_PICS}).map(() =>
          ({u:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            marks:[]}));
        openPost(); const h = FORM.html; PW = pwBlank(); return h; }],
    /* The contents on Studio. The AI conversation is the last chapter and it
       is Studio's, so on free the contents has no way in to it -- which is
       what act-check reports, correctly, unless the walk is shown the plan
       that has the door. */
    ['the contents on Plus', () => { SET.plan = 'plus';
                                       window.route = 'build'; NAV = [{r:'build'}];
                                       const h = vBuild(); SET.plan = 'free'; return h; }],
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
       there is nothing on it to open.

       And every one of them is on a BUILT keyboard rather than on board 0.
       Board 0 is the free QWERTY, it is not in storage, and kbEdit() refuses
       it -- so opening one of its keys gives an empty sheet, which is the
       whole point of it and would render nothing here. kbAdd() makes board 1
       and leaves kbShow on it. */
    ['a key of the keyboard, opened', () => { SET.plan = 'plus'; KB = null; kbShow = 0;
                                              kbAdd('qwerty'); kbLay = 0; kbPick(0, 0);
                                              const h = FORM.html; KB = null; kbShow = 0;
                                              SET.plan = 'free'; return h; }],
    /* A key that switches layers rather than typing one: which layer it goes
       to is a question only that kind of key is asked. */
    ['a key that switches layers', () => { SET.plan = 'plus'; KB = null; kbShow = 0;
                                           kbAdd('qwerty'); kbLay = 0; kbSetKind(0, 0, 'lay');
                                           const h = FORM.html; KB = null; kbShow = 0;
                                           SET.plan = 'free'; return h; }],
    ['the alphabet, for one slot of a key', () => { SET.plan = 'plus'; KB = null; kbShow = 0;
                                                    kbAdd('qwerty'); kbLay = 0; kbSlot(0, 0, -1);
                                                    const h = FORM.html; KB = null; kbShow = 0;
                                                    kbSlotFor = null;
                                                    SET.plan = 'free'; return h; }],
    /* The alphabet held, the same way. Two faces, because the corner mark is
       the paid plan's -- the free twenty-eight are the alphabet and taking one
       away would leave the keyboard a key that answers to nothing -- while the
       wobble and Done are on both, since the ORDER is everybody's. */
    ['the alphabet being held (paid)', () => { SET.plan = 'plus'; ltWob = true;
                                       window.route='ltset'; NAV=[{r:'ltset', a:'alpha'}];
                                       const h = vLtset();
                                       ltWob = false; SET.plan = 'free'; return h; }],
    ['the alphabet being held (free)', () => { ltWob = true;
                                       window.route='ltset'; NAV=[{r:'ltset', a:'alpha'}];
                                       const h = vLtset();
                                       ltWob = false; return h; }],
    /* A keyboard with more than one layer: the rail that switches between
       them only exists then -- and so does the rest of the editor: the way
       to add a row, to add a layer, and to put the whole thing back. */
    /* Held, the way a home screen is held: every key wobbling with a ⊖ on it
       and Done in the bar. Neither the ⊖ nor Done is on the screen at rest. */
    ['a keyboard being held', () => { SET.plan = 'plus'; KB = null; kbShow = 0;
                                      kbAdd('qwerty'); kbWob = true;
                                      window.route='kb'; NAV=[{r:'kb', a:'1'}];
                                      const h = vKb();
                                      kbWob = false; KB = null; kbShow = 0;
                                      SET.plan = 'free'; return h; }],
    ['a keyboard of two layers', () => { SET.plan = 'plus'; KB = null; kbShow = 0;
                                         kbAdd('qwerty'); kbAddLay();
                                         window.route='kb'; NAV=[{r:'kb', a:'1'}];
                                         const h = vKb();
                                         KB = null; kbShow = 0; kbLay = 0;
                                         SET.plan = 'free'; return h; }],
    /* Board 0 on the PAID screen, which is the free QWERTY with no editor on
       it -- the same keyboard, the same face, on both plans. It is a screen
       of its own and not the free branch of vKb(): the row of keyboards, the
       `+`, the ⋯ and Apply are all above it, and none of them exists on
       free. 「1つ目の無料のqwartyは編集できないようにしてくれ」 */
    /* The five patterns again, offered to a keyboard that already exists.
       Same list, same drawing, a different name on the press -- so this face
       is what proves the second name is reachable at all. */
    ['the arrangement of a keyboard that already exists', () => {
        SET.plan = 'plus'; KB = null; kbShow = 0;
        kbAdd('qwerty'); kbRepat(1);
        const h = FORM.html;
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    ['the free QWERTY, on a plan that can build others', () => {
        SET.plan = 'plus'; KB = null; kbShow = 0;
        kbAdd('tap'); kbShow = 0; KB.at = 1;
        window.route='kb'; NAV=[{r:'kb', a:'0'}];
        const h = vKb();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    /* A language holding more than one keyboard, which is where the row of
       them, the Apply button and the way to delete one all live. Every one of
       the five patterns is built across these three faces rather than
       described, so a pattern that cannot be laid out is a red check rather
       than an empty keyboard on somebody's phone -- qwerty is the first board
       and is there whether or not anything was built, then flick, chart, tap
       and abc. kbAdd() twice is three keyboards now, which is KB_MAX.

       The one APPLIED is deliberately not the one shown: that is the whole
       distinction the screen exists to make, and a face where they are the
       same would render neither the Apply button nor the line that replaces
       it. */
    ['three keyboards, looking at one that is not applied', () => {
        SET.plan = 'plus'; KB = null; kbShow = 0;
        kbAdd('flick'); kbAdd('chart');
        KB.at = 0; kbShow = 2;
        window.route='kb'; NAV=[{r:'kb', a:'2'}];
        const h = vKb();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    ['the keyboard that is already applied', () => {
        SET.plan = 'plus'; KB = null; kbShow = 0;
        kbAdd('tap');
        KB.at = 1; kbShow = 1;
        window.route='kb'; NAV=[{r:'kb', a:'1'}];
        const h = vKb();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    /* A sound the language has that no letter says yet. It is a cell in the
       alphabet now rather than a row on a chapter of its own, and it only
       exists on Plus -- free cannot add a sound. Two faces, because held it
       carries the mark that takes the sound away and at rest the speaker.
       The seeded language has a letter for every sound it has, so one is
       taken off a letter here to make one. */
    ['a sound with no letter yet', () => {
        SET.plan = 'plus'; SND.push('\u0283');
        window.route='ltset'; NAV=[{r:'ltset', a:'alpha'}];
        const h = vLtset();
        SND.pop(); SET.plan = 'free'; return h; }],
    ['a sound with no letter yet, held', () => {
        SET.plan = 'plus'; ltWob = true; SND.push('\u0283');
        window.route='ltset'; NAV=[{r:'ltset', a:'alpha'}];
        const h = vLtset();
        SND.pop(); ltWob = false; SET.plan = 'free'; return h; }],
    ['the chart, for the language rather than a letter', () => {
        SET.plan = 'plus'; openSndAdd();
        const h = FORM.html; SET.plan = 'free'; return h; }],
    /* The `?` sheet: how the keyboard gets onto the phone. It is a form and
       nothing walks to it -- and the button that opens iOS Settings is on it
       and nowhere else, so without this face that button belongs to no
       screen. Free reaches the same sheet, so the plan is not touched. */
    ['how the keyboard gets onto the phone', () => {
        openHelp('kb'); return FORM.html; }],
    /* The ⋯ at the end of the row of keyboards: deleting this one, and
       starting the whole chapter over. Both are off the screen now, and
       deleting only exists when there is more than one to delete. */
    /* The ... in the dictionary's bar. The rules that make a form out of a
       word are behind it, and that is the only door to them -- without this
       face the walk sees a screen nothing goes to, which is exactly what it
       would be if the button were deleted. */
    ['the dictionary\'s ...', () => { wordsMore(); return FORM.html; }],
    /* The sheet a word is coined on, with something typed into it. The forms
       the rules make of it are on that sheet, and they are on it only once
       there is a spelling to make them out of -- so an empty sheet names
       neither the field one is typed over in nor the minus that takes one
       off. The rule the fixture seeds is a plural for nouns, and a noun is
       what the sheet opens on. */
    ['a word being coined, with its forms', () => {
        openAdd('');
        wdSetLn('tirek');
        return wdFormHTML(); }],
    /* A rule whose condition is the letters a word ends in. The field for
       those letters is on the screen only while that is the condition
       chosen -- a field for a question nobody asked gets filled in and then
       not used -- so without this face nothing names fmrSetWend. */
    ['a rule that fires on an ending', () => {
        /* Left in place rather than put back: press-check rebuilds the screen
           and then presses it, so a rule that only exists while the HTML is
           being made is a rule fmrKeep cannot find -- every press emptied the
           screen. One rule is what a language with a rule looks like. */
        STG.fm = [];
        fmrNew();
        const r = fmRules()[0];
        r.pos = 'v'; r.fm = 'pst'; r.add = spType('ied');
        r.drop = 1; r.when = 'x'; r.wend = spType('y');
        saveStg();
        return fmrFormHTML(); }],
    ['the two that undo a keyboard', () => {
        SET.plan = 'plus'; KB = null; kbShow = 0;
        kbAdd('tap'); kbShow = 1; kbMore();
        const h = FORM.html;
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    /* And the five offered, on the sheet that makes another -- which is the
       only door to them now. The chapter itself no longer has an empty face:
       the first keyboard is the one already on the phone, so what the screen
       opens with is a keyboard rather than a chooser for one. */
    ['choosing another keyboard', () => {
        SET.plan = 'plus'; KB = null; kbShow = 0;
        kbAdd('abc'); kbNew();
        const h = FORM.html;
        KB = null; kbShow = 0; SET.plan = 'free'; return h; }],
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
    ['a word being written',   () => { openAdd(); wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                       wdSync();
                                       return wdFormHTML()+vForm(); }],
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
    ['the sound keyboard in a word', () => { SET.plan='plus'; openEdit('kano'); wdMode='ph';
                                             const h=wdFormHTML(); wdMode=''; SET.plan='free'; return h; }],
    ['the sound keyboard in a new word', () => { SET.plan='plus'; openAdd(); wdMode='ph';
                                                 const h=FORM.html; wdMode=''; SET.plan='free'; return h; }],
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
    /* Letters placed on a photograph. Reached only from a composer that
       already HAS a picture, so the walk never sees it without this -- and
       once a letter is on it, the selected face with its slider and its two
       buttons is a second screen again. */
    ['letters on a photograph', () => { PW = pwBlank();
      PW.pics = [{u:POSTS[0].pic, marks:[{tx:'kano', x:0.5, y:0.4, s:0.18, c:PW_COLS[0]}]}];
      pwPicAt = 0; pwMarkAt = 0; pwTool = 'mark'; const h = pwMarkHTML();
      PW = pwBlank(); pwPicAt = -1; pwMarkAt = -1; return h; }],
    /* And the other half of the editor: the crop, with its rectangle over the
       picture. It is a mode of the same screen, so nothing renders it unless
       the walk is put into it. */
    ['cropping a photograph', () => { PW = pwBlank();
      PW.pics = [{u:POSTS[0].pic, marks:[{tx:'kano', x:0.5, y:0.4, s:0.18, c:PW_COLS[0]}]}];
      pwPicAt = 0; pwTool = 'crop'; const h = pwMarkHTML();
      PW = pwBlank(); pwPicAt = -1; pwTool = 'mark'; return h; }],
    ['a photograph with no letters on it yet', () => { PW = pwBlank();
      PW.pics = [{u:POSTS[0].pic, marks:[]}]; pwPicAt = 0; pwMarkAt = -1; pwTool = 'mark';
      const h = pwMarkHTML(); PW = pwBlank(); pwPicAt = -1; return h; }],
    ['a reply being written', () => { PW = pwBlank(); PW.to = POSTS[0].id;
        openPost(); pwSetLn('sar'); return vForm(); }],
    /* The three moments the microphone has. A recorder is a thing the runner
       has none of -- there is no microphone on a Linux box and getUserMedia
       is never going to answer -- so what is walked is the row, in each of
       the states it can be in, which is what a thumb meets. */
    ['a voice being recorded', () => { PW = pwBlank(); PW.ln = 'kano';
        REC = {}; RECAT = (new Date()).getTime() - 7000;
        openPost(); const h = vForm(); REC = null; RECAT = 0;
        PW = pwBlank(); return h; }],
    ['a voice recorded and not yet posted', () => { PW = pwBlank(); PW.ln = 'kano';
        PW.vo = {b64:'AA', mime:'audio/mp4', ms:7000};
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* Editing your own post, which is the line and the meaning and neither
       the photographs nor the voice -- so it is the one face of the composer
       with no row of buttons under it at all. */
    ['a post being edited', () => { PW = pwBlank();
        PW.ed = POSTS[0].id; PW.ln = POSTS[0].ln; PW.mn = POSTS[0].mn;
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
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
    /* The card, which is the only screen whose output leaves the app. All
       three faces: a word, one of the sentences written under a word, and a
       post. They compose the picture differently -- a word is a page out of a
       dictionary, a sentence is a line, a post is somebody's published one --
       and only the post is offered a choice of shape, so the shape picker is
       on no screen but the third. */
    ['a word as a card',       () => { cardOpen('w', 'kano'); return FORM.html; }],
    ['a sentence as a card',   () => { findWord('kano').ex=[{ln:'kano mos tir', gl:'a tall mountain is seen'}];
                                       cardOpen('x', 'kano#0');
                                       const h=FORM.html; delete findWord('kano').ex; return h; }],
    ['a post as a card',       () => { cardOpen('p', 'p1'); return FORM.html; }],
    /* The rule a form is made by. It takes an id, and the id is the one the
       fixture put in STG above. */
    ['a rule for making a form', () => { openFmr('fr1'); return FORM.html; }]
  ];
}
