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
  /* A token shaped like a real one, because three things are read OFF it:
     whether the session is anonymous, which door it came in by, and the
     address. `at:'a'` answered none of them, so the account room walked as a
     session whose token could not be read -- which is a real state and is not
     the one everybody is in. Signed in by mail here, so the row that changes
     a password is rendered; the two that have no password of ours are a
     halfDone entry. */
  const jwt = (o) => 'h.' + btoa(JSON.stringify(o))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.s';
  window.__jwt = jwt;
  SESS = { at: jwt({ sub:'u', email:'aya@example.com',
                     app_metadata:{ provider:'email' } }),
           rt:'r', uid:'u', anon:false };
  /* No sentence of the day, unless a face puts one there. It is server data
     and there is no network in any of these checks, so null is what the app
     really has -- and clearing it HERE rather than at the end of the two
     faces that set it is what keeps shot.mjs's render() from photographing
     the screen a face tidied back to. */
  DAY = null;
  /* AND THE LANGUAGE THIS FIXTURE IS STANDING IN BELONGS TO THAT SESSION.
     core.js mints the first language at load, before net.js exists, so it
     carries no `uid` -- and on a real phone netLangRow() puts one on the
     first time it goes up. Nothing here goes up, so without this line the
     walks run inside a language that belongs to NOBODY: langOwned() answers
     false once SET.done is true, langCount() goes to 0, and every screen
     above a language disappears. That is what made act, plan and dl go red
     together on 2026-09-02, and it was read as the rule being wrong rather
     than as the fixture being a phone that had never once synced. */
  for (var __k in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, __k) && !LANGS[__k].uid)
      LANGS[__k].uid = 'u';
  langStore();
  /* anon:false is the half that matters. There is a session from the first
     launch now whether or not anybody has said who they are, so a fixture
     that only set `rt` would be walking the app as somebody with no name --
     and every button that writes would answer with the door instead of doing
     what it does. */
  WORDS = [
    {hw:'kano', ph:['k','a','n','o'], mn:'mountain', mns:['mountain'], pos:'n', at:1,
     reg:'wr', tags:['land'], ety:'from the word for head', up:2},
    /* Two verbs in two subclasses of the person's own making, and a third
       verb in neither. OWNER 2026-09-05 put those under the thirteen, and
       what the screens do with them cannot be walked unless a word is in one:
       the row of subclasses on the filter appears only where a word wears
       one, and the sheet's picker is that same list. Three, so that "narrows
       to this subclass" is a different answer from "narrows to this part of
       speech" and from "everything". */
    {hw:'tir',  ph:['t','i','r'],     mn:'to see',   mns:['to see'],   pos:'v', sub:'\u4ed6\u52d5\u8a5e', at:2},
    {hw:'mos',  ph:['m','o','s'],     mn:'tall',     mns:['tall'],     pos:'adj', at:3},
    {hw:'lom',  ph:['l','o','m'],     mn:'to fall',  mns:['to fall'],  pos:'v', sub:'\u81ea\u52d5\u8a5e', at:11},
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
  /* Two saved searches, for the same reason `WLD` is seeded below: with none
     saved, the row that lists them never renders, so `snsPickSaved` was an
     entry no screen ever named -- true, and not what it meant. A saved search
     is a word as it was typed. */
  SET.saved = ['ka', 'the sea'];
  SND = ['k','t','m','n','s','r','a','i','u','e','o'];
  /* What the language is FOR. Seeded because it is a slice like the others,
     and because NOT seeding it made one button unreachable: `setWldHide`
     writes WLD.hide and press rebuilds the screen before every press, so the
     first press of it hid the row under it -- setWldDl -- for the rest of the
     run. press then reported that button as never pressed, which was true and
     was not what it meant. The walk was narrowing the app as it went, which is
     the one thing seed() exists to stop. Public, so the row below is there. */
  /* And a section somebody wrote, because the article is theirs to write and
     a language with none of them walks a page that has never had one on it.
     Two: one with a title and a body, which is what the article draws, and one
     with neither, which is the row that has to say so instead of being blank.
     `wldart:` is reached from the list on the World screen, so seeding these
     is also what gives that route a way in. */
  /* And the page arrives with every section shut -- 「この言語については初手は
     全部閉じて」 -- so the state that says which are OPEN is emptied here with
     the rest of the arriving state. It belongs in viewReset() (www/shell.js)
     for the app itself; the two faces below are what the walk needs to get
     INSIDE a section, because arriving is now outside every one of them. */
  ABOPEN = {};
  WLD = {use:'story', where:'a valley', who:'two families',
         note:'nobody outside the valley speaks it',
         arts:[{id:'A1', t:'The valley', b:'Two families have farmed it for nine generations.'},
               {id:'A2', t:'', b:''}],
         /* Rows of the overview somebody wrote. Two, because the arrows that
            move one only exist where there is somewhere to move it: a single
            row draws neither, and the walk then reports wldOvMove as a name
            no screen ever says, which is true and is not what it means.
            The second has no name on purpose -- that is the shape the note
            becomes, and it is drawn as a paragraph rather than as a fact. */
         ovs:[{id:'O1', k:'Older name', v:'Shangolu'},
              {id:'O2', k:'', v:'It has no word for the sea.'}]};
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
            /* AND A TAG IN WHAT SOMEBODY WROTE. 「タグは本文中に。」 OWNER
               2026-09-04 -- a tag is characters, not a row the app adds, so
               the only way one is on a screen is that a post carries one.
               Without this the blue word is in no walk and nothing presses
               it. tagHTML() in www/sns.js. */
            mn:'the sea has gone quiet #\u4eca\u65e5\u306e\u304a\u984c', ui:'en',
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
  /* SOMETHING UNREAD, so the number on the bell is a state the walk reaches.
     `press` reported `.tabn` as styled and worn by nothing -- which is that
     check's own words for "a class only worn in a state nothing here gets
     into", and its own advice is to seed it rather than to freeze it into
     tools/css-baseline.txt.

     One notice, newer than `SET.notAt` (which no fixture sets, so it is 0).
     tabBar() draws the figure on every render, so this is worn on every
     screen -- and a person with an unread notice is the ordinary state of a
     timeline, not a corner of it. */
  /* AND THE WATERMARK BACK TO NOTHING. Opening the notices is what marks them
     read -- notSeen() writes `SET.notAt` -- and the walks render every screen
     in one page, so the first render of `notif` was making every render after
     it a phone with nothing unread. The bell then appeared on two screens and
     never again, which is a fixture that changes under the walk rather than
     one that seeds a state. Reset here, where every other field of SET is. */
  SET.notAt = 0;
  /* And nobody else's language answered for. `wldSeenPull()` writes both, and
     they are a session's memory of what came back rather than anything stored
     -- so a face that seeds one must not leave it standing for every render
     after it. Reset where the rest of the state is. */
  WLD_HAVE = {}; WLD_ASKED = {}; WLDS_HAVE = {}; WLDS_ASKED = {};
  /* Where you are standing is the app's to say, not this file's. viewReset()
     in www/shell.js is the one list of what a screen forgets when you leave
     it; a copy here would be a second list to keep in step, and the first
     version of this was exactly that -- two of the fifteen. */
  viewReset();
  /* AFTER viewReset(), and that is the whole of why it was not working.
     viewReset() nulls NOTES_HAVE -- 「the notices, asked again」 -- so a seed
     written above it was wiped by the last line of this function every time.
     The bell was measured at 0 on every screen and the state simply never
     existed. Anything here that viewReset() forgets has to be set after it. */
  NOTES_HAVE = [{kind:'like', at:Date.now()-60000, hd:'iri', who:'Iri',
                 av:{ch:'\u0416'}, id:'p1', n:1, more:[]}];
  /* AND THE FACT THAT THE SERVER ANSWERED FOR ALL OF THEM, which is a second
     thing and has to be said out loud now.

     From 2026-09-05 every list that lives on the server has three faces and
     not two -- the mark while the question is out, the list when it is in,
     and 「none」 only once the server has said so (www/sns.js § WHAT AN OPEN
     ASKS FOR). `PULL_GOT` is where 「the server has answered this session」 is
     kept, for all of them, in one place.

     There is no server behind any of these checks, so without this line the
     fixture is a phone that has asked and never been answered: the kept
     words, the history, the drafts and the notices all draw the mark, and the
     buttons and the classes on their rows are on no screen at all. act-check
     read that correctly and called seven names unreachable, and press said
     eleven classes were worn by nothing -- both true of the app they were
     handed, and neither what it meant. A phone holding two saved searches and
     a notice HAS been answered; the seeding says so now instead of implying
     it.

     AFTER viewReset(), for the reason the seed above it is: viewReset() drops
     the notices AND the record that they were answered, so a line written
     before it is wiped by it.

     `feed` is not in here: SNS_GOT is the timeline's own record, per tab, and
     the walks that want an answered timeline set that themselves. */
  PULL_GOT = { saved:1, recent:1, drafts:1, notif:1, mine:1, day:1, blocks:1 };
}

/* The steps of the onboarding that have a second face: the writing systems to
   choose from, the sounds offered again, the characters on offer to borrow.
   Each entry is a label and a function returning that screen's HTML. */
export function obStates(){
  return [
    /* The door, opened from somewhere -- Settings, a timeline. That is a
       different thing from the door as the onboarding's LAST STEP, which is
       what OB_IN is below: obPending() tells them apart and only one of the
       two counts itself with dots. */
    ['the door',                  () => { SET.obback = { r: 'set', a: 'acct' };
                                          OBM.mode = 'in'; return vOb(); }],
    /* And the door as the walk's last step. Nothing else reaches it. */
    ['signing in, the last step', () => { SET.obback = null; ob.step = OB_IN;
                                              ob.mode = ''; OBM.mode = 'in'; return vOb(); }],
    ['characters to borrow',      () => { SET.obback = null; ob.step = OB_DRAW; ob.mode = 'borrow';
                                          ob.pick = WORLD_SCRIPTS[0].id; return vOb(); }],
    ['no script picked to borrow from', () => { SET.obback = null; ob.step = OB_DRAW; ob.mode = 'borrow';
                                                ob.pick = ''; return vOb(); }],
    /* The step where a letter is drawn, with nothing on the canvas: the line
       over it says what to do with a finger and the button that ends the step
       is down. */
    ['drawing the first letter', () => { SET.obback = null; ob.step = OB_DRAW; ob.mode = '';
                                         GE = null; return vOb(); }],
    /* And the same step with a stroke on it, which is the other half of the
       coaching and the only state the finish button can be pressed from. */
    /* It leaves GE where it put it, like every other entry here leaves
       ob.step. Tidying up is what the note above this list is about: shot.mjs
       calls render() afterwards, so an entry that cleared the canvas
       photographed the empty one and captioned it as the drawn one. */
    ['the first letter, once a line is on it', () => {
        SET.obback = null; ob.step = OB_DRAW; ob.mode = '';
        GE = newGE(''); GE.st = [{ pts: [[200, 200], [200, 600]] }]; GE.si = 0;
        return vOb(); }],
    /* The walk through the app itself. It is not a face of vOb() -- it is the
       real screen with everything but one thing greyed out -- so what these
       return is the whole app, overlay and all, and nothing else reaches the
       two buttons the tour owns. */
    /* All three put the screen on the PAGE before building the overlay,
       because that is the order render() does it in and the overlay MEASURES
       the screen: the hole in the grey is cut around the lit thing, and the
       hand is stood under it. A screen that is only a string is not on the
       document and has no boxes to measure. */
    ['the walk: the making screen, with the keyboard lit', () => {
        SET.done = false; ob.step = OB_TOUR; obTour = 0; ob.mode = '';
        window.route = 'build'; NAV = [{ r: 'build', a: '' }];
        var h = vBuild();
        document.getElementById('app').innerHTML = h;
        return h + obTourHTML(); }],
    ['the walk: the key the letter went on', () => {
        SET.done = false; ob.step = OB_TOUR; obTour = 1; ob.mode = '';
        ob.lid = (LETTERS[0] || {}).id || '';
        window.route = 'kb'; NAV = [{ r: 'kb', a: '' }];
        var h = vKb();
        document.getElementById('app').innerHTML = h;
        return h + obTourHTML(); }],
    /* And the same stop with nothing to light. ob.lid is empty for anybody
       who skipped the drawing, so the key they drew is a key that is not
       there -- and a grey screen with nothing on it to press would be an app
       somebody cannot leave. The pad is the whole screen here. */
    ['the walk: the key that is not there', () => {
        SET.done = false; ob.step = OB_TOUR; obTour = 1; ob.mode = '';
        ob.lid = '';
        window.route = 'kb'; NAV = [{ r: 'kb', a: '' }];
        var h = vKb();
        document.getElementById('app').innerHTML = h;
        return h + obTourHTML(); }],
    /* And the stage after the walk: the SNS mock. obSnsHTML() builds the
       feed's own shape -- rootTop(), dayRow(), postRow(), snsFab() -- from
       the same parts the real one does, inside the onboarding's scrolling
       box, with pointer-events off. It is a face of vOb(). */
    ['the walk: the timeline, before there is an account',
        () => { SET.done = false; SET.obback = null; ob.step = OB_SNS;
                ob.mode = ''; return vOb(); }],
    ['naming the language',      () => { SET.obback = null; ob.step = OB_NAME; ob.mode = ''; return vOb(); }],
    /* The door's other three faces. None is reachable from a screen at rest,
       so a walk that only ever renders the door presses none of their
       buttons.

       Each leaves the mode where it put it, like every other entry here
       leaves ob.step. They used to put it back, and the walks did not care
       because they read the html these return -- but shot.mjs calls render()
       afterwards, so a fixture that tidied up photographed the screen it had
       tidied back to, and three pictures of the door were captioned as three
       different screens. */
    ['making an account',        () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'up'; return vOb(); }],
    ['the code out of the mail', () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'code';
                                         OBM.em = 'a@b.c'; return vOb(); }],
    /* Asking for a reset lands on the digits. It used to end at a line saying
       "sent"; then it was the digits and the password on one screen; it is two
       screens now, and both are here because both are screens. */
    ['the code of a reset', () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'reset';
                                         OBM.em = 'a@b.c'; OBM.code = ''; OBM.pw = '';
                                         OBM.busy = false; return vOb(); }],
    /* And what a code the server accepted opens onto. Reached from nowhere
       else: obResetGo() is the only thing that sets this mode. */
    ['choosing a new password',  () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'newpw'; OBM.fresh = false;
                                         OBM.em = 'a@b.c'; OBM.code = ''; OBM.pw = '';
                                         OBM.busy = false; return vOb(); }],
    /* And the same screen on the other road: an account being MADE. Six
       digits proved the address, and this is the first password rather than a
       replacement -- 「普通に6桁のコード打ってからパスワード要求だろ」 OWNER
       2026-09-02. The heading is what differs, so both faces are walked. */
    ['choosing a password, new account', () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'newpw'; OBM.fresh = true;
                                         OBM.em = 'a@b.c'; OBM.code = ''; OBM.pw = '';
                                         OBM.busy = false; return vOb(); }],
    ['having forgotten the password',  () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'forgot';
                                         return vOb(); }],
    /* Through the door and not yet anybody. Only a signed-in person reaches
       it, so nothing else in this file or in shot.mjs ever renders it. */
    ['saying who you are',       () => { SET.obback = { r: 'set', a: 'acct' };
                                         OBM.mode = 'who';
                                         OBM.busy = false; return vOb(); }],
    /* THE SAME SIX DIGITS WITH NOWHERE TO GO BACK TO, and this is the state
       the owner was standing in: signed out, creating an account, the mail
       has been sent. Every face above it carries SET.obback -- a door opened
       FROM somewhere, which is the road out of Settings -- and obPending()
       being true is what put the chevron on all of them. Signed out there is
       no obback, appIs() answers 'door' rather than 'ob', and obCanBack() used
       to answer false for the whole door: no way back off the screen, and no
       way to have the mail sent again.
       『後追加でメールを確認のボタンに再送信ボタンと戻るボタンがない』 OWNER
       2026-09-02.

       IT DOES NOT TAKE THE SESSION AWAY, and the first version did. The
       entries here deliberately do not tidy up after themselves, so a face
       that set SESS to null left every walk AFTER it signed out: act-check
       went from 260/260 buttons to 246/261, and the fourteen it could no
       longer reach were the composer, the profile editor and the voice --
       every screen that answers with the door when nobody is signed in.

       ob.step === OB_IN is the same state for the question this face is here
       to ask. obAtDoor() is 「appIs() is the door, OR the door was opened from
       somewhere, OR this is the walk's last step」, and the middle one is what
       every face above has. What the real signed-out phone does is held by
       tools/open-check.mjs § 2c, which boots one. */
    ['the code, no way back to', () => { SET.obback = null; SET.done = true;
                                         ob.step = OB_IN;
                                         OBM.mode = 'code'; OBM.busy = false;
                                         OBM.em = 'a@b.c'; return vOb(); }]
  ];
}

/* Screens whose buttons only exist once something is half-done: a word being
   spelled, a letter being drawn, suggestions on the table, a conversation under
   way. A walk that only ever renders a screen at rest never sees these buttons
   at all -- and press.mjs, which has to rebuild a screen before every press,
   needs the same list act-check walks or the two drift apart silently. */
export function halfDone(){
  /* What the app puts round a sheet, for a seed that has changed something
     since the form opened. FORM.html is the body as it was the moment
     openForm() ran; a seed that then sets a flag or fills a field has to
     rebuild it, and a bare body is not a screen. It hands the fresh body to
     this and gets back what vForm() makes of it -- the view, the top bar with
     the form's own button in it, and `.body` with its 24px of padding.

     Rebuilding the wrapper here would be a second copy of vForm() that drifts
     the first time somebody changes the first, so it does not: it puts the
     body where the app keeps it and asks the app. */
  const sheet = (html) => { if (typeof FORM !== 'undefined' && FORM) FORM.html = html;
                            return vForm(); };
  /* SOMEBODY ELSE'S PUBLISHED LANGUAGE, on this phone, as the two answers that
     draw their page: the row `language_seen` gives, and the five slices
     `slice_read` in supabase/schema.sql opens to a reader -- wld, script, snd,
     letters, kb, and NOT the dictionary or the grammar, which it refuses to
     everybody but their owner. `dl:true` is its owner having said its chapters
     may be taken.

     One place, because two faces below want it and press() re-seeds between
     them: a copy in each is a face that draws the waiting shell and a check
     that walks a screen the app never shows. */
  const __seenLang = () => {
    const lid = 'seen-lang-1';
    WLD_HAVE[lid] = { id:lid, name:'Shango', license:'', pub:'2026-08-01',
                      nwords:12, nletters:5 };
    WLDS_HAVE[lid] = {
      wld:     { body: JSON.stringify({ dl:true, where:'the northern valleys',
                   ov:[{k:'', v:'a language somebody else wrote'}] }), no:3 },
      script:  { body: JSON.stringify({ dir:'ltr' }), no:1 },
      snd:     { body: JSON.stringify(['a','k','n']), no:2 },
      letters: { body: JSON.stringify([{ id:'sx1',
                   st:[{pts:[[100,100],[700,700]]}], ch:'', nm:'q', snd:[] }]), no:5 },
      kb:      { body: JSON.stringify({ boards:[] }), no:1 }
    };
    return lid;
  };
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
    /* The day's sentence is up. Without this, dayRow() is never rendered by
       anything: DAY is null until a fetch answers, and no check has a network.
       Both faces of it are here, because the second one is the whole point --
       the meaning arrives written and cannot be changed. */
    ['the day\'s sentence', () => {
       DAY = { id: 7, on_day: '2026-08-23', text: 'It is unbearably hot today.',
               says: { en: 'It is unbearably hot today.',
                       ja: '今日はめちゃくちゃ暑い。' } };
       window.route = 'feed'; NAV = [{ r:'feed' }];
       /* Left where it is put, like every other entry here leaves ob.step:
          shot.mjs calls render() afterwards, so a face that tidies up
          photographs the screen it tidied back to. seed() is what clears
          DAY, once, before each. */
       return vFeed(); }],
    /* AND AN ANSWER TO IT, SITTING IN THE TIMELINE. The tag is drawn from
       the prompt id ON THE POST, so until one post carried an id there was
       nothing anywhere that walked postTagHTML() -- find4 took the tag out
       of the filter column, and a look nothing walks is a look nobody
       notices breaking.

       The other posts in this list carry no id and wear no tag, in the same
       render, which is the half worth having: a tag drawn out of `DAY`
       instead of out of the post would put today's tag on all four of them
       and this face is where that shows. */
    ['an answer to the day\'s sentence, in the timeline', () => {
       DAY = { id: 7, on_day: '2026-08-23', text: 'It is unbearably hot today.',
               says: { en: 'It is unbearably hot today.',
                       ja: '今日はめちゃくちゃ暑い。' } };
       POSTS.unshift({id:'pd', at:Date.now()-600000, lang:langId, lname:'Shango',
                      ln:'tir mos kano', who:'Aya', hd:'aya', mine:true,
                      av:{st:[{pts:[[112,112],[688,112],[400,688]]}]},
                      mn:'It is unbearably hot today.', ui:'en', pr:7});
       window.route = 'feed'; NAV = [{ r:'feed' }];
       const h = vFeed(); POSTS.shift(); return h; }],
    ['answering the day\'s sentence', () => {
       DAY = { id: 7, on_day: '2026-08-23', text: 'It is unbearably hot today.',
               says: { en: 'It is unbearably hot today.',
                       ja: '今日はめちゃくちゃ暑い。' } };
       PW = pwBlank(); openPost('day');
       return vForm(); }],
    ['the word being edited', () => { openEdit('kano'); wEdit.mns = ['mountain','peak'];
                                      return vForm(); }],
    /* The field for one more of something is not on the sheet until the `+`
       on the heading is pressed, so without these the only way to write a
       second meaning is a screen nothing walks. */
    /* The three lists the sheet sends you to. All three are about the word
       being written, so none of them is a screen without one open. */
    ['what kind of word it is', () => { openEdit('kano');
       window.route = 'pos'; NAV = [{ r:'pos' }]; return vPos(); }],
    ['how it is said', () => { openEdit('kano');
       window.route = 'reg'; NAV = [{ r:'reg' }]; return vReg(); }],
    /* And the fourth, which is the person's own -- OWNER 2026-09-05. Opened
       on a VERB, because the list on it is the subclasses of the part of
       speech the word is in and the fixture's subclasses are the verbs'.
       Opened on `kano` it would be the empty face, which is a real state and
       is not the one this is here to show. */
    ['the subclass under it', () => { openEdit('tir'); openSub(); return vForm(); }],
    /* And the box behind its ＋. The names this app offers are on the screen
       from the moment it opens; the field that writes one that is not on it
       is one press away, and nothing else renders it -- so without this face
       act-check reports the Enter on that box as an entry no screen names,
       which is true and is not what was meant. */
    ['a subclass being written', () => { openEdit('tir'); subNewOpen();
                                         return vForm(); }],
    ['one more meaning', () => { openEdit('kano'); wdMnNew = true;
                                 return sheet('<div id="wd-body">'+wdFormHTML()+'</div>'); }],
    ['one more example', () => { openEdit('kano'); wdExNew = true;
                                 return sheet('<div id="wd-body">'+wdFormHTML()+'</div>'); }],
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
    ['a form being edited', () => { openEdit('tira'); return vForm(); }],
    /* And the other end: a word read with its forms under it. kano has no
       family, so the labelled rows are on no screen either without this. */
    ['a word and its forms', () => { openWord('tir'); return vForm(); }],
    /* A word, read. It is what opening one gives you now -- the editor is
       behind the button at the foot of it. */
    ['a word, read', () => { const w = findWord('kano');
                             w.ex = [{ln:'kano tir', gl:'sees the mountain'}];
                             w.nt = 'the one behind the village';
                             wRelToggle('kano','syn','mos');
                             openWord('kano'); const h = vForm();
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
    ['the plan has ended', () => { openCapLapse(); return vForm(); }],
    /* The reading of a word, which is the paid plan's and is reached from a
       sheet that has a word open on it. Once with the search empty and once
       with something in it: the tiles are the screen, and a search that
       matches nothing leaves it with none. */
    /* The digits room on a paid plan, which is where the base is nudged: free
       counts in ten and has no say in it, so the row is on no screen the walk
       renders otherwise. And once more with a digit the base can no longer
       reach, which is the red cell. */
    /* THE POPUP, open. It is not a route and nothing at rest shows it -- it
       sits over whatever screen was there -- so without this face its two
       buttons belong to no screen. 「標準は使わねえって言ってるだろこれも
       禁止や」 OWNER 2026-09-01: every ask in the app comes through it. */
    ['the popup, asking', () => {
        popAsk('...', function(){});
        const h = document.getElementById('pop').outerHTML;
        popOff(); return h; }],
    /* A stage somebody added, on the plan that can add one. Free hides them
       now (「課金で追加した機能は無料になったら全部隠れる」), so the delete
       on one is reachable only here. */
    ['a grammar stage somebody added', () => {
        SET.plan = 'pro';
        STG.extra = (STG.extra||[]).concat([{id:'ownfix', slots:[], t:'own'}]);
        /* The PAGE of the stage, not the list: the delete is on the page and
           `p.own` is what draws it. */
        window.route='gram'; NAV=[{r:'gram', a:'ownfix'}];
        const h = vGram();
        STG.extra.pop(); SET.plan = 'free'; return h; }],
    ['the digits, where the base is set', () => { SET.plan = 'pro';
       window.route='ltset'; NAV=[{r:'ltset', a:'num'}];
       const h=vLtset('num'); SET.plan='free'; return h; }],
    ['a digit above the base', () => { SET.plan = 'pro';
       const was=STG.base; STG.base=10; ltNew({val:11});
       window.route='ltset'; NAV=[{r:'ltset', a:'num'}];
       const h=vLtset('num');
       LETTERS = LETTERS.filter(l => l.val !== 11); STG.base=was; SET.plan='free';
       return h; }],
    /* SOMEBODY ELSE'S LANGUAGE PAGE, with the answers in. Both are needed and
       they are two requests: `language_seen` says the language is published
       and gives its name, and the slices are what the page is made of. No
       check has a network, so without this the reader's face of `about` is
       the empty shell it draws while the answers are out -- and the ↓ that
       takes a chapter is never rendered, which act-check reports, correctly,
       as an entry no screen names.

       The slices are the five `slice_read` in supabase/schema.sql opens to a
       reader of a published language, and NOT the dictionary or the grammar,
       which it refuses to everybody but their owner. `dl:true` in `wld` is
       that language's owner having said its chapters may be taken. */
    ['somebody else\u2019s language page', () => {
       const lid = __seenLang();
       window.route='about'; NAV=[{ r:'about', a:lid }];
       const h=vAbout();
       return h; }],
    /* and the same page with its download section OPEN, which is where the ↓
       itself is -- ABOPEN records what is open, so the arriving state is
       everything closed and a walk that never toggles never sees inside one.

       IT SEEDS THE LANGUAGE ITSELF rather than leaning on the face above.
       tools/press.mjs runs seed() before EVERY one of these, and seed() puts
       WLD_HAVE and WLDS_HAVE back to empty -- so a face that only set ABOPEN
       drew the waiting shell, the ↓ was never rendered, and `wldGet` came out
       as a name no screen ever says. tools/act-check.mjs did not re-seed
       between them and saw it, which is the two checks walking two apps. */
    ['somebody else\u2019s language page, downloads open', () => {
       const lid = __seenLang();
       const was = ABOPEN.wlddl;
       ABOPEN.wlddl = true;
       window.route='about'; NAV=[{ r:'about', a:lid }];
       const h=vAbout();
       ABOPEN.wlddl = was;
       return h; }],
    /* AND THE SAME PAGE WITH ITS ALPHABET OPEN, which is the only face that
       draws somebody else's LETTERS at all -- every section arrives shut, so
       neither face above had ever rendered one. That is why 「人のwikiページ
       開いても文字表示されない」 (OWNER 2026-09-03) was green everywhere: a
       cell nothing renders is a cell nothing can find empty.

       Seeds the language itself, for the reason written over the face above:
       press() re-seeds before every one of these. */
    ['somebody else\u2019s language page, letters open', () => {
       const lid = __seenLang();
       const was = ABOPEN.letters;
       ABOPEN.letters = true;
       window.route='about'; NAV=[{ r:'about', a:lid }];
       const h=vAbout();
       ABOPEN.letters = was;
       return h; }],
    ['the reading of a word', () => { SET.plan = 'pro'; openEdit('kano');
                                      window.route='spell'; NAV=[{r:'spell'}];
                                      const h=vSpell(); SET.plan='free'; return h; }],
    ['the reading of a word, searched', () => { SET.plan = 'pro'; openEdit('kano');
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
    /* The same page, counted in three. The clock on it wears twelve numerals
       or four, and which one is decided by the widest hour: more than two
       signs is a smudge however narrow it is drawn. Three is the first base
       where that happens -- twelve is 110 -- and the eight hours that lose
       their numeral get a tick instead. Counting in ten, no hour is ever
       three signs, so the tick had never been drawn. */
    ['the digits, counted in three', () => { const was=STG.base; STG.base=3;
                           window.route='ltset'; NAV=[{r:'ltset', a:'num'}];
                           const h=vLtset('num'); STG.base=was; return h; }],
    ['the marks',  () => { window.route='ltset';
                           NAV=[{r:'ltset', a:'mark'}]; return vLtset(); }],
    ['a letter in the editor', () => { editGlyph('k'); window.route='glyph';
                                       NAV=[{r:'glyph', a:GE.lid}]; return vGlyph(); }],
    /* The IPA, opened from the letter it is about, and again from the
       inventory -- one page, two things a press means, so both are walked.
       Nothing reaches either by walking the routes. And once with something
       in the search, because a search that matches nothing leaves the page
       with no tiles at all. */
    ['the sounds, for one letter', () => { openSnd(LETTERS[0].id); return vForm(); }],
    ['the sounds, searched', () => { ipaQ = 'a'; openSnd(LETTERS[0].id);
                                     const h = vForm(); ipaQ = ''; return h; }],
    /* What one sound IS, which is a page of its own behind the ? on a tile.
       Twice: a sound one of the ten languages has, and one that none of them
       does, because the second says only how it is made. */
    ['what a group of sounds is', () => { openIpaG('m.plosive'); return vForm(); }],
    ['what a group with no examples is', () => { openIpaG('o'); return vForm(); }],
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
                                                   const h = vForm(); addW = null; return h; }],
    /* A note that already exists: the delete button only appears once there
       is something to delete, so a form opened empty never shows it. */
    ['a note being edited',    () => { openNote(0); return vForm(); }],
    /* The three faces where a word is built out of SOUNDS rather than typed.
       Free types -- the alphabet is a to z and every one of them already
       reads something, so there is nothing to pick -- and picking is what
       can('snd') buys. All three still have to be walked, so all three flip
       the plan and put it back. */
    /* Derived from a word that already exists, so the sheet opens with a
       spelling in it -- an empty sheet has no reading to change. */
    ['the new word sheet, by sound', () => { SET.plan = 'pro'; openAdd('kano');
                                             const h = vForm(); addFrom = '';
                                             SET.plan = 'free'; return h; }],
    ['the word being edited, by sound', () => { SET.plan = 'pro'; openEdit('kano');
                                                const h = vForm();
                                                SET.plan = 'free'; return h; }],
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
    /* ---- the timeline read by somebody who did not write it -------------
       Three states off the owner's phone on 2026-09-04. None of them is a
       route: each is a fact about what has arrived, and each was the one
       nobody had photographed. tools/tl-check.mjs holds them. */
    /* A post of yours, gone up, answered by somebody else. The answer points
       at the SERVER's name for your post -- the only name the phone that
       wrote it ever saw -- and your phone still calls that post by its own.
       「返事したはずなのにスレッドに来ない」 */
    ['a thread with an answer that came back from the server', () => {
        const mine = postById('p1'); mine.sid = 'SRV-1';
        POSTS.push({ id:'SRV-9', sid:'SRV-9', at:Date.now(), lang:langId,
                     lname:'Vethi', ln:'qel tir', mn:'and the rest of it',
                     ui:'en', who:'Iri', hd:'iri', mine:false, av:{ch:'\u0416'},
                     to:'SRV-1', toh:'aya' });
        window.route='thread'; NAV=[{r:'thread', a:'p1'}];
        const h = vThread(); POSTS.pop(); delete mine.sid; return h; }],
    /* YOUR OWN ROW, on somebody else's followers list, on a phone holding no
       post of yours to take a name off. 「ここも？になるの謎だし」 */
    ['your own row on somebody else\u2019s followers list', () => {
        const was = POSTS.slice(); POSTS.length = 0;
        FOL_HAVE['ers:iri'] = [meHandle(), 'veth']; FOL_ASKED['ers:iri'] = 1;
        window.route='follows'; NAV=[{r:'follows', a:'ers:iri'}];
        const h = vFollows();
        delete FOL_HAVE['ers:iri']; delete FOL_ASKED['ers:iri'];
        POSTS.push.apply(POSTS, was); return h; }],
    /* And a profile whose two counts nobody has answered for yet, which is
       what stands there instead of a 0 that jumps.
       「0 と出て1秒後に1に変わる、をしない」 */
    ['a profile before the counts have arrived', () => {
        const fo = ME.fo, fr = ME.fr; delete ME.fo; delete ME.fr;
        window.route='profile'; NAV=[{r:'profile'}];
        const h = vProfile(); ME.fo = fo; ME.fr = fr; return h; }],
    /* ---- a tag, and what pressing one gives ------------------------------
       「タグは青く光るからタップしたらタグの検索になる。」 OWNER 2026-09-04.
       Two faces, because the fault is nearly always in the one nobody
       photographed: the word sitting in what somebody wrote, and the answer
       that comes back when a thumb lands on it. */
    ['a tag in what somebody wrote', () => {
        window.route='thread'; NAV=[{r:'thread', a:'p2'}];
        return vThread(); }],
    ['and the answer to pressing one', () => {
        snsQ = '#\u4eca\u65e5\u306e\u304a\u984c';
        snsHits = { q:snsQ, who:[], posts:POSTS.slice(0, 2) };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
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
       what you can do is about them, not about it. `p2` is Iri's.

       OPENED THE WAY A THUMB OPENS IT, and that is the whole of why these two
       are worth reading. They used to set PMENU by hand, so they drew a menu
       the app itself could not reach: postMore() returned on `!p.mine`, and
       the ... on somebody else's post did nothing when it was pressed
       (「投稿の人の...タップしてもなにも出ないけど？」 OWNER, build 107).
       Everything stayed green because the menu WAS on the screen -- nothing
       asked who had put it there, and the fixture was the one putting it.

       postMore() is what opens it now. Close that door again and `post.block`,
       `post.unblock` and `post.report` are keys no screen in the app asks for,
       which i18n-check fails on. */
    ['what you can do about somebody else', () => { window.route='feed'; NAV=[{r:'feed'}];
                              postMore('p2');
                              const h = vFeed(); PMENU = ''; return h; }],
    ['and the same, already blocked', () => { const was = ME.bl; ME.bl = ['iri'];
                              window.route='feed'; NAV=[{r:'feed'}];
                              postMore('p2');
                              const h = vFeed(); ME.bl = was; PMENU = ''; return h; }],
    /* The five reasons. It is a form and nothing walks to it. */
    ['saying what is wrong with a post', () => { openReport('p2', 'iri');
                              const h = vForm(); rpFor = null; return h; }],
    /* And the other end of that form, which is one account's and is drawn for
       nobody else. The row at the foot of the settings list is the only way
       in, and NET_STAFF is false everywhere else -- so both the door and the
       room behind it are on no screen at all without these two. */
    /* The two things you can do about a PERSON, which live behind the ... on
       their page. Nothing at rest opens it, so nothing had ever pressed
       either of them.

       WHO_HAVE['iri'] is seeded here on purpose: vProfile() now spins the
       whole screen in place of the card until the server's own answer is
       in (OWNER 2026-09-05, see 'waiting on the server' below), and the
       menu lives ON that card -- nothing gives it a screen to sit on
       without this. */
    ["somebody else's page, with the menu open",
                                 () => { WMENU = true;
                                         WHO_HAVE['iri'] = { who:'Iri', hd:'iri',
                                             av:{ch:'Ж'}, lname:'Vethi', bio:'',
                                             fo:2, fr:3, out:false };
                                         window.route = 'profile';
                                         NAV = [{ r: 'profile', a: 'iri' }];
                                         return vProfile(); }],
    /* Frozen, which is said on the page the app opens on and nowhere else --
       no notice, and the three sns tabs stay open. */
    ['home, for an account that has been frozen',
                                 () => { NET_BANNED = 'spam';
                                         window.route = 'feed'; NAV = [{ r: 'feed' }];
                                         return vFeed(); }],
    /* The same room for an account that came in by Apple or Google: no
       address of ours to show and no password of ours to change. */
    ['the account, signed in with Google',
                                 () => { const was = SESS;
                                         SESS = { at: window.__jwt({ sub:'u',
                                             email:'aya@gmail.com',
                                             app_metadata:{ provider:'google' } }),
                                           rt:'r', uid:'u', anon:false };
                                         window.route='set'; NAV=[{r:'set', a:'acct'}];
                                         const h = vSet(); SESS = was;
                                         NAV=[{r:'settings'}]; return h; }],
    ['the settings list, for whoever answers the reports', () => {
        NET_STAFF = true; window.route='settings'; NAV=[{r:'settings'}];
        const h = vSettings(); NET_STAFF = false; return h; }],
    /* Three reports, because they are three different rows: a post still up,
       a post already taken down -- which offers to put it back rather than to
       take it down again -- and a report about an ACCOUNT, which has no post
       under it and nothing to press. */
    ['the reports', () => { const keep = MODS;
        MODS = [{ id:1, why:'spam',  note:'', at:Date.now()-600000,
                  who:'veth', uid:'u1', out:false, by:'aya',
                  pid:'ps1', ln:'kano mos tir', down:false },
                { id:2, why:'abuse', note:'and again this morning',
                  at:Date.now()-7200000, who:'iri', uid:'u2', out:true,
                  by:'sol', pid:'ps2', ln:'qel dross', down:true },
                /* About an account and not a post: nothing to take down, and
                   the only button on it is the one that matters. */
                /* And one whose author has closed their account since: no
                    handle to name, and the line simply has nothing on that
                    side rather than a blank where a name goes. */
                { id:3, why:'other', note:'', at:Date.now()-86400000,
                  who:'iri', uid:'u2', out:true, by:'', pid:'', ln:'',
                  down:false }];
        window.route='mod'; NAV=[{r:'mod'}];
        const h = vMod(); MODS = keep; return h; }],
    /* The reports before the server has answered, and the reports when there
       are none. Two sentences, and they are not the same sentence. */
    ['the reports, and there are none', () => { const keep = MODS; MODS = [];
        window.route='mod'; NAV=[{r:'mod'}];
        const h = vMod(); MODS = keep; return h; }],
    /* And the one thing on this screen that really deletes, asking. A post
       comes back and an account comes back; a report row that has gone has
       gone, so the word on the button that does it is the word for what it
       does rather than 「はい」. */
    ['a report being deleted, asking', () => {
        popAsk(t('mod.drop.sure'), function(){}, t('mod.drop.yes'));
        const h = document.getElementById('pop').outerHTML;
        popOff(); return h; }],
    /* Both halves of the admin screen, because they are two screens and only
       one of them is ever on. The door is what everybody sees -- the fixture's
       account came in through `email`, so adminLocked() is true here exactly
       as it is on the owner's phone -- and everything the page is FOR is
       behind it. Without the second entry nothing on it is ever drawn, and a
       screen no check has ever seen is the white screen this family of checks
       exists to prevent. */
    ['the admin screen, locked', () => { window.route='admin'; NAV=[{r:'admin'}];
        return vAdmin(); }],
    ['the admin screen', () => { const keep = MODS, keepN = ADMINN, keepS = ADMINS;
        ADMIN_OK = true;
        ADMINN = { people:1284, posts:9130, langs:412, reports:1 };
        /* Two rows and they are not the same row: the one above staff is in
           the list and cannot be taken off it, so it is the one without a
           press. A list holding only the second kind would never draw that. */
        ADMINS = [{ id:'u9', handle:'lingua', admin:true },
                  { id:'u1', handle:'mod', admin:false }];
        MODS = [{ id:1, why:'spam', note:'', at:Date.now()-600000,
                  who:'veth', uid:'u1', out:false, by:'aya',
                  pid:'ps1', ln:'kano mos tir', down:false }];
        window.route='admin'; NAV=[{r:'admin'}];
        const h = vAdmin();
        ADMIN_OK = false; ADMINN = keepN; ADMINS = keepS; MODS = keep; return h; }],
    /* The composer, for somebody who has been ejected. Every write they make
       is refused by the server, and the line saying so is on no screen
       otherwise -- NET_BANNED is empty for everybody else. */
    /* Backing out of a half-written post, with the question up. BACKQ is 0
       everywhere else, so `.bkq` and the two answers are on no screen without
       this -- press reported five classes and act-check three names, all of
       them real and all of them this one state.

       It is set rather than reached by pressing: back() would ALSO run, and a
       face is a screen rather than a sequence. What the three answers DO is
       draft-check's, over the real back(). */
    ['a half-written post, asked about on the way out', () => {
        PW = pwBlank(); openPost(); pwSetLn('kano mos'); pwSetMn('a hill');
        BACKQ = 1; const h = vForm(); BACKQ = 0; PW = pwBlank(); return h; }],
    ['the composer, for somebody stopped', () => { NET_BANNED = 'spam';
        PW = pwBlank(); openPost(); const h = vForm();
        NET_BANNED = ''; PW = pwBlank(); return h; }],
    /* Your own post, taken down. Only its author is ever handed one, so this
       is the only screen the line is ever on. */
    ['your own post, taken down', () => { const p = postById('p1'); p.down = true;
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); delete p.down; return h; }],
    /* The post somebody came to read, gone. What is left is the tombstone and
       the replies to it -- and the replies are somebody else's lines, so they
       are still there, whole. 「スレッドは本ツイートだけね？」 */
    /* Left where it puts it, like the door's faces above and for the same
       reason: shot.mjs calls render() afterwards, so an entry that tidied up
       photographs the screen it tidied back to. */
    ["a thread whose post was taken down", () => { const p = postById('p1');
        p.down = true; p.mine = false;
        window.route='thread'; NAV=[{r:'thread', a:'p1'}];
        return vThread(); }],
    /* An account that has been frozen, seen by somebody else: the page says
       so and nothing else about them, and their posts are still under it.
       「タイムラインから外す、プロフィールからは凍結してますの表示。ツイート
       は自己責任で見れるようにする」 */
    ["somebody else's page, frozen", () => {
        POSTS.forEach((x) => { if (x.hd === 'iri') x.out = true; });
        /* WHO_HAVE is the record now (whoOf()'s `out`), not just the posts
           this phone happens to be holding -- carried here too so the card
           still draws instead of the wait mark below. */
        WHO_HAVE['iri'] = { who:'Iri', hd:'iri', av:{ch:'Ж'}, lname:'Vethi',
                             bio:'', fo:2, fr:3, out:true };
        window.route = 'profile'; NAV = [{ r: 'profile', a: 'iri' }];
        return vProfile(); }],
    /* Somebody else's profile, the follow button on it, and the same page
       once you follow them. The only profile a walk sees is this person's
       own, and the two cards are different screens. */
    ['somebody else\'s profile', () => { window.route='profile'; NAV=[{r:'profile', a:'iri'}];
        WHO_HAVE['iri'] = { who:'Iri', hd:'iri', av:{ch:'Ж'}, lname:'Vethi',
                             bio:'', fo:2, fr:3, out:false };
        /* BEFORE you follow them, which is what this face is for and what it
           was not: the seed already follows 'iri', so both faces drew
           「フォロー中」 and the gold button the owner is talking about was
           in no picture. */
        const was = ME.fo; ME.fo = [];
        const h = vProfile(); ME.fo = was; NAV=[{r:'profile'}]; return h; }],
    ['somebody else\'s profile, followed', () => { ME.fo = ['iri'];
        WHO_HAVE['iri'] = { who:'Iri', hd:'iri', av:{ch:'Ж'}, lname:'Vethi',
                             bio:'', fo:2, fr:3, out:false };
        window.route='profile'; NAV=[{r:'profile', a:'iri'}];
        const h = vProfile(); NAV=[{r:'profile'}]; ME.fo = ['iri','veth']; return h; }],
    /* AND THE FACE BEFORE THE SERVER HAS ANSWERED. 「他の人のプロフィール
       いく時、フォロー中とフォロワーがくるくるするけど、そこじゃなくて
       その人の画面がくるくるして欲しい」 OWNER 2026-09-05 -- vProfile()
       spins the whole screen in place of the card while WHO_HAVE[h] is
       still empty, and every fixture above now seeds it so the card itself
       stays walked. 'kai' carries no seed anywhere in this file and no post
       of their own, so this is the one face that is left turning. */
    ['somebody else\'s profile, waiting on the server', () => {
        window.route='profile'; NAV=[{r:'profile', a:'kai'}];
        const h = vProfile(); NAV=[{r:'profile'}]; return h; }],
    /* A post kept to yourself, which is the lock beside the time, and the
       composer while it is going to be one -- the button says so. */
    ['a post kept to yourself', () => { const p = postById('p1'); p.pv = 1;
        window.route='feed'; NAV=[{r:'feed'}];
        const h = vFeed(); delete p.pv; return h; }],
    ['a post about to be kept to yourself', () => { PW = pwBlank(); PW.pv = true;
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* REPLYING, which nothing here had ever rendered. Every composer face was
       a new post, so the one thing a reply draws that a post does not -- the
       post being answered, above the two fields -- was walked by nothing, in
       any check. It is where the owner found both of 2026-09-01's composer
       faults. `pwHead()` is above the line in post.js on purpose (the head is
       somebody else's post), which makes it exactly the shape rule 8 is about:
       nothing in the gate was looking at it. */
    ['the composer, replying to somebody', () => {
        PW = pwBlank(); PW.to = 'p1'; openPost('reply');
        const h = vForm(); PW = pwBlank(); return h; }],
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
    /* And the same list being chosen from -- 選択 at the far end of the bar, a
       ◉ at the front of each row, 削除 beside 完了. The same shape the notes
       and the keyboards have: 「後下書きのポップも他のと合わせて欲しい」. */
    ['the drafts, choosing, with nothing chosen yet', () => {
        DRAFTS = [{at:Date.now(), ln:'kano', mn:'a mountain', to:'', pics:[], vo:null, pv:false},
                  {at:Date.now()-90000, ln:'', mn:'', to:'', pics:[], vo:null, pv:true}];
        window.route='drafts'; NAV=[{r:'feed'},{r:'drafts'}];
        DFSEL = {};
        const h = vDrafts(); DFSEL = null; DRAFTS = []; NAV=[{r:'feed'}]; return h; }],
    ['the drafts, choosing, with one chosen', () => {
        DRAFTS = [{at:Date.now(), ln:'kano', mn:'a mountain', to:'', pics:[], vo:null, pv:false},
                  {at:Date.now()-90000, ln:'', mn:'', to:'', pics:[], vo:null, pv:true}];
        window.route='drafts'; NAV=[{r:'feed'},{r:'drafts'}];
        DFSEL = { 0:1 };
        const h = vDrafts(); DFSEL = null; DRAFTS = []; NAV=[{r:'feed'}]; return h; }],
    ['the drafts page with none', () => {
        window.route='drafts'; NAV=[{r:'feed'},{r:'drafts'}];
        const h = vDrafts(); NAV=[{r:'feed'}]; return h; }],
    /* Notices, which arrive and so are never there on a phone with nobody
       else on it. */
    /* WHAT `notices()` ACTUALLY HANDS BACK, which is not what this said.
       supabase/schema.sql groups by (kind, post): every row carries `n`, how
       many there were, and `more`, up to three of the other people. Every
       notice here was written before those two existed, so all five were
       n=1 with nobody else on them -- and a screen drawn from them showed
       five ungrouped rows however well the grouping worked.

       That is the fixture standing in front of the thing it is supposed to
       show. Three of the five carry a group now: two people on one post,
       twelve on another, and four follows -- which is 「〇〇さん他3人にフォロー
       されました」, the shape the owner asked for.

       `who` and `av` are filled in on all of them for the same reason. Two
       rows had `who:''` and `av:null`, so postFace() fell through to `?` --
       and `notices()` answers with `p0.display` and `p0.av`, which a person
       who has set neither would leave empty, but veth has a name and a face
       everywhere else in this fixture. A face that is `?` because the fixture
       forgot is a face nobody can tell from one that is `?` because the app
       is broken.

       NOT here, deliberately: 「A が2件の投稿にいいね」 -- the same person
       across several posts. `notices()` groups by (kind, post), so two likes
       by one person on two posts are two rows and there is no shape this
       fixture could take that would make them one. Putting it in would be
       seeding a state the app cannot produce -- the wdMode mistake CLAUDE.md
       records, where six faces were walked in a state that no longer existed.
       It is a supabase/schema.sql change and it is in the report. */
    /* THE TIMELINE BEING PULLED DOWN. `press` reported `.pullrule` unworn for
       the same reason it reported `.tabn`: the mark is put in by a finger
       dragging the page, and a walk has no finger. It is `pullSpinOn()` that
       is called here rather than the markup being written out -- a copy of
       what is under test agrees with it by construction, which is the mistake
       conv-check was written after. */
    ['the timeline, pulled down', () => {
        const app = document.getElementById('app'), was = app.innerHTML;
        window.route = 'feed'; NAV = [{ r:'feed' }];
        app.innerHTML = vFeed();
        pullSpinOn();
        const h = app.innerHTML;
        PULL_SPIN = null; app.innerHTML = was;
        return h; }],
    /* SOMEBODY ELSE'S LANGUAGE, answered for. The page draws nothing until
       `language_seen` comes back, which is right on a phone and means a blank
       photograph on a bench with no server -- so the answer is put in by hand,
       in the shape netLangSeen() returns.

       The numbers are the SERVER's count. `slice_read` still opens no
       dictionary to anybody, so there is no word list here to seed and none
       is drawn. */
    /* SOMEBODY ELSE'S LANGUAGE, as the same wiki page. 「このwikiのような感じに
       するんじゃないの？」 OWNER 2026-09-01 -- so what is seeded is what the
       SERVER hands over: the row language_seen answers with, and the five
       slices slice_read opens on a published language. The page is then the
       real wldPage(), drawn from those and from nothing of this phone's.

       The `wld` slice is the article itself -- the two the book always has
       and one the person wrote. No `words` and no `gram` slice, because
       slice_read opens neither to anybody and seeding one would be a fixture
       showing a state the server cannot produce. */
    ['somebody else\u2019s language', () => {
        WLD_HAVE['L1'] = { id:'L1', name:'Vethi', license:'',
                           pub:'2026-08-20T00:00:00Z', nwords:412, nletters:38 };
        WLD_ASKED['L1'] = 1;
        WLDS_HAVE['L1'] = {
          wld: { body: JSON.stringify({
                   where:'A valley under the north ridge',
                   who:'The people who winter there',
                   arts:[{ id:'A1', t:'Seasons', b:'Four, and the fifth is the thaw.' }],
                   secs:{} }), no:1 },
          letters: { body: JSON.stringify([
                   { id:'v1', nm:'ka', snd:['k'], st:[{ pts:[[112,112],[688,112],[400,688]] }] },
                   { id:'v2', nm:'to', snd:['t'], st:[{ pts:[[112,688],[400,112],[688,688]] }] },
                   { id:'v3', nm:'ri', snd:['r'], st:[{ pts:[[300,150],[300,650]] }] }]), no:1 },
          snd: { body: JSON.stringify(['k','t','r','a','i']), no:1 } };
        WLDS_ASKED['L1'] = 1;
        window.route='about'; NAV=[{ r:'about', a:'L1' }];
        return vAbout(); }],
    ['notices', () => { NOTES_HAVE = [
        {kind:'like', at:Date.now()-60000, hd:'iri', who:'Iri', av:{ch:'Ж'}, id:'p1',
         n:2, more:[{hd:'veth', who:'Veth', av:{ch:'V'}}]},
        {kind:'reply', at:Date.now()-120000, hd:'iri', who:'Iri', av:null, id:'p1',
         n:1, more:[]},
        {kind:'boost', at:Date.now()-180000, hd:'veth', who:'Veth', av:{ch:'V'}, id:'p1',
         n:12, more:[{hd:'iri', who:'Iri', av:{ch:'Ж'}},
                     {hd:'kai', who:'Kai', av:null},
                     {hd:'mor', who:'Mor', av:null}]},
        {kind:'follow', at:Date.now()-240000, hd:'veth', who:'Veth', av:{ch:'V'}, id:'',
         n:4, more:[{hd:'iri', who:'Iri', av:{ch:'Ж'}},
                    {hd:'kai', who:'Kai', av:null}]},
        {kind:'pick', at:Date.now()-300000, hd:'', who:'', av:null, id:'p2',
         n:1, more:[]}];
        window.route='notif'; NAV=[{r:'notif'}];
        const h = vNotif(); NOTES_HAVE = null; return h; }],
    /* The search, with something in it. An empty field draws no results at
       all, so a walk that never types finds nothing to be wrong.

       ONE ANSWER WITH BOTH IN IT since 2026-09-04 -- people and posts come
       back together and nothing chooses between them. They are still several
       faces here because the ROWS differ: a person's row carries the Follow
       button, which is on no other screen, and a post's row carries
       everything a post carries.

       The answer is put in by hand. snsFind() asks the SERVER now, and there
       is no server in a walk -- so a face that let it ask would render the
       empty page that is showing while the request is out, which is a
       different screen from the one being walked. What is put in is the shape
       netFindWho() returns. */
    ['people found by searching', () => { snsQ = 'ir';
        snsHits = { q:'ir', who:[{ who:'Iri', hd:'iri', av:{ch:'\u0416'},
                                   lname:'Vethi', mine:false }], posts:[] };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* Somebody already followed: Follow and Following are two states of one
       button and only one of them is drawn at a time. */
    ['a person already followed', () => { snsQ = 'ir';
        const was = ME.fo; ME.fo = ['iri'];
        snsHits = { q:'ir', who:[{ who:'Iri', hd:'iri', av:{ch:'\u0416'},
                                   lname:'Vethi', mine:false }], posts:[] };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); ME.fo = was; snsQ = ''; snsHits = null; return h; }],
    ['posts found by searching', () => { snsQ = 'kano';
        snsHits = { q:'kano', who:[], posts:POSTS.slice(0, 2) };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* And the shape the owner asked for: one word, and people and posts in
       the same answer. It is its own face because neither of the two above
       draws the other's rows -- a walk that only ever sees one kind at a
       time cannot see them meeting. */
    ['people and posts in one answer', () => { snsQ = 'kano';
        snsHits = { q:'kano',
                    who:[{ who:'Iri', hd:'iri', av:{ch:'\u0416'},
                           lname:'Vethi', mine:false }],
                    posts:POSTS.slice(0, 2) };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    ['a search that found nothing', () => { snsQ = 'zzzzzz';
        snsHits = { q:'zzzzzz', who:[], posts:[] };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* The words this account has typed, which are only ever drawn under an
       EMPTY field -- every other face of this screen has a query in it, so
       without this one the history's two buttons are walked by nothing and
       act-check reports them as entries no screen names, which is true and is
       not what anybody meant. */
    ['the searches already made', () => { snsQ = '';
        const was = SET.recent;
        SET.recent = ['kano', 'ir', 'tolven'];
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); SET.recent = was; return h; }],
    /* And a search that could not be made at all, which is a different answer
       from one that found nothing and must not look like it. */
    ['a search that could not be asked', () => { snsQ = 'iri';
        snsHits = { q:'iri', who:[], posts:[], bad:t('net.offline') };
        window.route='explore'; NAV=[{r:'explore'}];
        const h = vExplore(); snsQ = ''; snsHits = null; return h; }],
    /* The badge, which only exists on a paid plan -- so a walk on the free
       plan never draws one, and free is what these walks run on. Both plans,
       and both places it shows: beside a name on a profile and beside a name
       on a post. The row that sells it is the other way round: it is there
       only while nobody has bought anything. */
    ['the profile of somebody on Plus', () => { SET.plan = 'pro';
        window.route='profile'; NAV=[{r:'profile'}];
        const h = vProfile(); SET.plan = 'free'; return h; }],
    ['the timeline of somebody on Plus', () => { SET.plan = 'pro';
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
    /* A THREAD THAT BRANCHES, which the seeded one does not: p1 -> p3 -> p4
       is a straight chain, and a chain is the one shape where stacking the
       rows happens to be unambiguous. 「親から分岐した時とか子供が分岐した時に
       線で繋いでないとマジでどの投稿か分からなくなる」 OWNER 2026-09-05 is
       about the other shape, and no face had it.

       p3 answers twice over -- once down through p4 and once beside it -- and
       the branch under p4 runs three deep, so every rail this screen can draw
       is on this one picture: the one under a face that has an answer, and
       the ones standing at each step above a row two and three in. */
    ['a thread that branches', () => {
        POSTS.push({id:'pb1', at:Date.now()-700000, lang:'other', lname:'Vethi',
                    ln:'dross', who:'Veth', hd:'veth', mine:false, av:{ch:'V'},
                    mn:'or the other one', ui:'en', to:'p3', toh:'iri'},
                   {id:'pb2', at:Date.now()-600000, lang:'other', lname:'Vethi',
                    ln:'qel tir', who:'Iri', hd:'iri', mine:false, av:{ch:'\u0416'},
                    mn:'and the rest of it', ui:'en', to:'p4', toh:'aya'},
                   {id:'pb3', at:Date.now()-500000, lang:langId, lname:'Shango',
                    ln:'kano', who:'Aya', hd:'aya', mine:true,
                    mn:'that is the one', ui:'en', to:'pb2', toh:'iri'});
        window.route='thread'; NAV=[{r:'feed'},{r:'thread', a:'p1'}];
        const h = vThread(); POSTS.pop(); POSTS.pop(); POSTS.pop(); return h; }],
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
    /* The second of four, opened. Every count that used to be along the top of
       a screen was taken off -- words, letters, drafts, followers -- and this
       is the one left, because which of four you are looking at is where you
       are standing and not how much you have. A post carrying one photograph
       is not told it is one of one, so the seed above never draws it.
       「総数系いらないやろ全部」 */
    ['the second of four photographs, opened', () => {
        POSTS.push({id:'pm', at:Date.now(), lang:langId, lname:'Shango', ln:'kano',
                    who:'Aya', hd:'aya', mine:true, mn:'four of them', ui:'en',
                    pics:[POSTS[0].pic, window.__fixPic(600, 900),
                          window.__fixPic(900, 900), window.__fixPic(1200, 500)]});
        window.route='photo'; NAV=[{r:'feed'},{r:'photo', a:'pm:1'}];
        const h = vPhoto(); POSTS.pop(); return h; }],
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
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* A picture with marks already put on it. The count in the corner only
       exists once there is something to count -- www/post.js pwpicn -- so a
       composer whose pictures are bare draws no number anywhere. */
    ['a photograph with marks on it', () => {
        openPost();
        PW.pics = [{u:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    marks:[{x:.3, y:.4, w:'kano'}, {x:.7, y:.6, w:'mos'}]}];
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* A line long enough for the composer to start counting down. It says
       nothing until forty are left, so a composer with a short line in it --
       every other one here -- never draws the number. And once past the end,
       where the same number goes red. */
    ['a post running out of room', () => {
        openPost();
        PW.ln = Array.apply(null, {length: POST_MAX - 10}).map(() => 'a').join('');
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    ['a post past the end of the room', () => {
        openPost();
        PW.ln = Array.apply(null, {length: POST_MAX + 5}).map(() => 'a').join('');
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* And a post that has been edited since it was sent, which is a mark on
       somebody's own post and on nobody else's. */
    ['a post that was edited', () => {
        const keep = POSTS;
        POSTS = keep.map((p, i) => i ? p : Object.assign({}, p, { ed: 1 }));
        window.route = 'feed'; NAV = [{ r:'feed' }];
        const h = vFeed(); POSTS = keep; return h; }],
    /* And a post carrying the most it may. The plus is gone at four and the
       strip slides, so the composer with four pictures on it is a different
       screen from the composer with one. */
    ['a post with four photographs', () => {
        openPost();
        PW.pics = Array.apply(null, {length: POST_PICS}).map(() =>
          ({u:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            marks:[]}));
        openPost(); const h = vForm(); PW = pwBlank(); return h; }],
    /* The composer of a language written from the right, in its own font.
       Both of those are the paid plan's and both are off in seed(), so the
       field the line goes in has only ever been rendered left-to-right in
       the ordinary face. They are one seed because they are one element:
       `dirClass(scriptDir()) + (myFontOn()? ' tfont' : '')` is the whole of
       that field's class, and the two answers meet nowhere else.
       .tfont is LinguaType, which carries only the private use area, so
       nothing is drawn here that the Lingua keyboard did not type -- which
       is the rule the second face exists to keep. */
    ['a line written from the right, in a font of your own', () => {
        const wasPlan = SET.plan, wasDir = SCRIPT.dir;
        SET.plan = 'pro'; SCRIPT.dir = 'rtl';   /* dir is 'pro' since the rename */
        SET.myfont = true; installScriptFont();
        openPost(); const h = vForm();
        PW = pwBlank(); SET.myfont = false;
        SCRIPT.dir = wasDir; SET.plan = wasPlan; return h; }],
    /* AND THE ONE WRITTEN DOWNWARD, THE FIRST COLUMN AT THE LEFT. Four
       directions and this is the only one no screen wore. It used to be
       reached by PRESSING it: the writing-system screen wrote the language
       on the press, so `setScriptDir('ttb-lr')` took effect and every screen
       drawn after it wore the class. That screen chooses now and writes from
       the Save in the bar (www/sound.js § wsPick), and a walk cannot press
       two buttons in a row -- press-check rebuilds the screen before every
       press -- so nothing in it ever saves. The state is seeded here
       instead, which is what tools/press.mjs asks for when it names a class
       nothing wears.

       Same element as the two above and for the same reason:
       `dirClass(scriptDir())` on the composer's line is the whole of it, and
       `scriptDir()` (www/wsys.js) answers 'ltr' on any plan but Pro. */
    ['a line written downward, the first column at the left', () => {
        const wasPlan = SET.plan, wasDir = SCRIPT.dir;
        SET.plan = 'pro'; SCRIPT.dir = 'ttb-lr';
        openPost(); const h = vForm();
        PW = pwBlank();
        SCRIPT.dir = wasDir; SET.plan = wasPlan; return h; }],
    /* And the same line in a timeline, where the direction is the post's own
       and not the reader's: a post says which way it was written and carries
       it, because rule 8 is that what somebody wrote is shown the way they
       wrote it. */
    ['a post written from the right', () => {
        const keep = POSTS;
        POSTS = keep.map((p, i) => i ? p : Object.assign({}, p, { dir: 'rtl' }));
        window.route = 'feed'; NAV = [{ r:'feed' }];
        const h = vFeed(); POSTS = keep; return h; }],
    /* The contents on Studio. The AI conversation is the last chapter and it
       is Studio's, so on free the contents has no way in to it -- which is
       what act-check reports, correctly, unless the walk is shown the plan
       that has the door. */
    ['the contents on Plus', () => { SET.plan = 'pro';
                                       window.route = 'build'; NAV = [{r:'build'}];
                                       const h = vBuild(); SET.plan = 'free'; return h; }],
    /* A grammar stage of your own: the door is on the paid plan, because the
       fifteen are the whole of the free chapter. */
    ['a grammar stage of your own', () => { SET.plan = 'pro'; openOwnPhase();
                                            const h = vForm();
                                            SET.plan = 'free'; return h; }],
    ['the grammar list, paid', () => { SET.plan = 'pro'; window.route='gram';
                                       NAV=[{r:'gram'}]; const h = vGram();
                                       SET.plan = 'free'; return h; }],
    /* ---- the chapter that is being rebuilt ------------------------------
       docs/GRAMMAR-V2-SPEC.md §14. It arrives as an argument of the `gram`
       route rather than as a route of its own -- www/shell.js's PAGES is
       another session's file -- and act-check walks that route's arguments by
       asking stAll(), which this page is deliberately NOT in. So without a
       face here the walk never renders it: every button on it would be an
       entry no screen names, and every string on it could be hard-coded
       forever. Two faces, because a word being carried looks different from
       a word standing still, and that difference is the whole chapter. */
    ['the word order, arranged', () => {
        window.route = 'gram'; NAV = [{ r:'gram', a:'v2' }];
        g2Lift = '';
        return vGram(); }],
    ['the word order, one word lifted', () => {
        window.route = 'gram'; NAV = [{ r:'gram', a:'v2' }];
        g2Lift = 'order:0';
        const h = vGram(); g2Lift = ''; return h; }],
    /* ---- the 助詞 stage, both faces ------------------------------------
       It is a stage like every other one now 「助詞は最初から出せ」 OWNER
       2026-09-01, so no mark has to be set to reach it. The first is the
       stage EMPTY -- three slots and nothing in them. The second has the
       particle made, because a slot with a word in it draws a different row
       -- the spelling and its sound instead of 「作る」 -- and that row is
       most of what this chapter IS. */
    ['the particle stage, empty', () => {
        window.route = 'gram'; NAV = [{ r:'gram', a:'part' }];
        return vGram(); }],
    ['the particle stage, with a mark made', () => {
        WORDS.push({ hw:'ga', ph:['g','a'], mn:'subject mark',
                     mns:['subject mark'], pos:'part', slot:'part.subj', at:5 });
        window.route = 'gram'; NAV = [{ r:'gram', a:'part' }];
        const h = vGram();
        WORDS.pop();
        return h; }],
    /* And the list with the door on it, which is the only place the way in
       exists. Everything else walks with the stage off the list, so this is
       the one face that renders that button. */
    ['the grammar list, with the way in to particles', () => {
        const was = !!STG.set.part;
        if (was) { delete STG.set.part; saveStg(); }
        window.route = 'gram'; NAV = [{ r:'gram' }];
        const h = vGram();
        if (was) { stMarkSet('part'); }
        return h; }],
    ['a stage slot, by sound', () => { SET.plan = 'pro';
                                       openSlot(stAll()[0].id, stAll()[0].slots[0]);
                                       const h = vForm();
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
       and leaves kbShow on it -- and LANDS on it, which is why none of these
       says where it is.

       They used to. Every face on a board's page wrote its own
       `window.route='kb'; NAV=[{r:'kb', a:'1'}]`, and that is a state no
       press produces: the route carries which keyboard you are on, and the
       app was putting nothing there, so what the walk saw and what a finger
       reached were two different screens. The ⋯ is drawn on a board's page
       and the chapter's list carries the ? instead, so these faces showed a
       ⋯ that was on no screen anybody could get to, and press stayed green
       over a road with its first step missing -- it prints a name it never
       pressed and does not fail on one. A face is built by the acts now, and
       an act that stops landing takes the face with it. */
    ['a key of the keyboard, opened', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                              kbAdd('qwerty'); kbLay = 0; kbPick(0, 0);
                                              const h = vForm(); KB = null; kbShow = 0;
                                              SET.plan = 'free'; return h; }],
    /* THE SAME KEY WITH A LETTER CHOSEN ON IT, which is a face and not a
       state of the one above: the confirm in the bar is drawn only while
       something is chosen -- 「何も選んでいなければ出ない」 OWNER 2026-09-03 --
       so on every other face of this screen it is on no screen at all, and
       act-check said so the day it went in. Built by the act, like the rest
       of this chapter: kbLtTap() is what a finger does to a letter. */
    ['a key with a letter chosen for it', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('qwerty'); kbLay = 0; kbPick(0, 0);
                                                  const a = ltOfKind('alpha');
                                                  if (a.length) kbLtTap(0, 0, -1, a[0].id);
                                                  const h = vForm(); kbLtPick = null;
                                                  KB = null; kbShow = 0;
                                                  SET.plan = 'free'; return h; }],
    /* AND THE SAME KEY WITH A DRAWN LETTER CHOSEN, which is the other state
       of one square and the one the change of 2026-09-05 is about: the shape
       goes in the square with the name small under it, and a letter with
       nothing drawn on it -- the face above -- keeps its name and nothing
       else. Both, because the fault is nearly always in the one nobody
       photographed. */
    ['a key with a drawn letter chosen for it', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('qwerty'); kbLay = 0; kbPick(0, 0);
                                                  const d = ltOfKind('alpha').filter((l) => inkGeo(l));
                                                  if (d.length) kbLtTap(0, 0, -1, d[0].id);
                                                  const h = vForm(); kbLtPick = null;
                                                  KB = null; kbShow = 0;
                                                  SET.plan = 'free'; return h; }],
    /* A FLICK keyboard, which is the other half of the editor and the only
       one that has corners. kbSlotsShown() is true when the board's pattern
       is 'flick' or when a key already carries something in one of its four,
       and a qwerty has neither -- so on the qwerty seeds above a key opens
       with one slot in the middle and the four directions are on no screen
       at all. Four classes were unworn for that reason alone: kbeu kbel kber
       kbed, www/keyboard.js kbKeyHTML(). */
    ['a key of a flick keyboard, opened', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('flick'); kbLay = 0; kbPick(0, 0);
                                                  const h = vForm(); KB = null; kbShow = 0;
                                                  SET.plan = 'free'; return h; }],
    /* And the board itself, where the four corners of every key are drawn on
       the key: kbFlicks(key, slots) puts a letter in a corner that has one
       and a dot in a corner that is empty -- kbf and kbfx -- and it is passed
       slots:false everywhere the keyboard is only being SHOWN. */
    ['a flick keyboard, being built', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                              kbAdd('flick'); kbLay = 0;
                                              const h = vKb(); KB = null; kbShow = 0;
                                              SET.plan = 'free'; return h; }],
    /* THE SAVE IN THE CORNER, GOLD, on the keyboard being built. It is the
       one thing on this screen the change of 2026-09-05 moves and it is a
       COLOUR, so both states have to be photographed or the fault is in the
       one nobody looked at: every other face of this chapter is the grey.
       A board is deleted out from under the page first, because that is the
       road the buffer used to come apart on -- the layout wrote one key and
       the bar read another, and the Save stayed grey with a row gone. */
    ['a keyboard changed, the Save gold', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  KEEP = {};
                                                  kbAdd('qwerty'); kbAdd('flick');
                                                  kbGoBoard(2); render();
                                                  kbDropGo(1); render();
                                                  KBH = { k:'r', r:0, i:0 }; kbCut();
                                                  const h = vKb();
                                                  KEEP = {}; KB = null; kbShow = 0;
                                                  SET.plan = 'free'; return h; }],
    /* A key that switches layers rather than typing one: which layer it goes
       to is a question only that kind of key is asked. */
    ['a key that switches layers', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                           kbAdd('qwerty'); kbLay = 0; kbSetKind(0, 0, 'lay');
                                           const h = vForm(); KB = null; kbShow = 0;
                                           SET.plan = 'free'; return h; }],
    ['the alphabet, for one slot of a key', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                    kbAdd('qwerty'); kbLay = 0; kbSlot(0, 0, -1);
                                                    const h = vForm(); KB = null; kbShow = 0;
                                                    kbSlotFor = null;
                                                    SET.plan = 'free'; return h; }],
    /* The alphabet held, the same way. Two faces, because the corner mark is
       the paid plan's -- the free twenty-eight are the alphabet and taking one
       away would leave the keyboard a key that answers to nothing -- while the
       wobble and Done are on both, since the ORDER is everybody's. */
    ['the alphabet being held (paid)', () => { SET.plan = 'pro'; ltWob = true;
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
    ['a keyboard being held', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                      kbAdd('qwerty'); kbWob = true;
                                      const h = vKb();
                                      kbWob = false; KB = null; kbShow = 0;
                                      SET.plan = 'free'; return h; }],
    /* A row of the sheet selected, which is a state of the editor and not a
       screen: the bin and the three alignments are only up while something is
       selected, so this is the only face that can press them. */
    ['a row of the keyboard selected', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                               kbAdd('qwerty'); kbLay = 0; kbHeadRow(1);
                                               const h = vKb();
                                               KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                               SET.plan = 'free'; return h; }],
    /* the + asking which side of the selected row a new one goes on. The two
       answers replace the alignments and the bin while it asks, so this is
       the only face they can be pressed from. */
    /* One row is taken off first: a board made from the qwerty pattern is AT
       the row ceiling -- five rows, the free QWERTY's own shape -- so the +
       is down on it and there is nothing to ask. That is the ceiling working,
       and this face is about the two answers it gives when there IS room. */
    ['a row selected, asking where a new one goes', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                               kbAdd('qwerty'); kbLay = 0;
                                               kbHeadRow(0); kbCut();
                                               kbHeadRow(1); kbInsAsk();
                                               const h = vKb();
                                               KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                               SET.plan = 'free'; return h; }],
    /* A key joined to the one UNDER it -- two rows tall, with a gap standing
       in the row below where its lower half is. The only face where a merged
       cell is drawn, and where the three alignments are down on a row for a
       reason other than nothing being selected.
       「a1a2触ってキーをくっつける」 */
    ['a keyboard with a key two rows tall', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                               kbAdd('qwerty'); kbLay = 0; kbVJoin(0, 3);
                                               const h = vKb();
                                               KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                               SET.plan = 'free'; return h; }],
    /* A KEY of the sheet selected. Pressing a key selects it now -- the same
       habit as the row's number and the column's letter -- and the buttons
       over the sheet act on it: joining it to the one beside it, opening its
       own page, and the bin. This is the only face they can be pressed from.
       「タップしたらそのキーが選ばれて上のゴミ箱ボタンとかくっつけるボタンとか
       押してその作業がされるようにしようよ」 */
    ['a key of the keyboard selected', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                               kbAdd('qwerty'); kbLay = 0; kbTapKey(0, 2);
                                               const h = vKb();
                                               KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                               SET.plan = 'free'; return h; }],
    /* TWO keys chosen, which is the face the join button lives on now.
       「なんで？ 結合ボタン作れよ。編集も含め全部ボタンで作業だから」
       「編集ボタンは1キー選択時のみ」 OWNER 2026-08-27 -- so the join is drawn
       here and the key's page is drawn on the face above, and neither is on
       both. Without this the walk never sees kbJoinSel at all. */
    ['two keys of the keyboard selected', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('qwerty'); kbLay = 0;
                                                  kbTapKey(0, 2); kbTapKey(0, 3);
                                                  const h = vKb();
                                                  KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                                  SET.plan = 'free'; return h; }],
    /* An empty FRAME of the sheet selected, which is the state the band's one
       remaining button lives in: pressing a frame selects it and the button
       over the sheet puts a key in, the width of that frame.
       「全部のます触ったら選択で」「キーを入れるのは帯のボタン」 OWNER
       2026-08-28. The board a pattern makes is ten across with no slack, so a
       column comes out first to leave frames to press -- and without this face
       the walk never draws that band at all, because a frame is the only
       thing that puts it up. */
    ['an empty frame of the keyboard selected', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('qwerty'); kbLay = 0;
                                                  kbHeadCol(0); kbCut();
                                                  kbCellAdd(0, 0, 1);
                                                  const h = vKb();
                                                  KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                                  SET.plan = 'free'; return h; }],
    /* and a column, which lights up and can be cut but has no slack to align */
    ['a column of the keyboard selected', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('qwerty'); kbLay = 0; kbHeadCol(2);
                                                  const h = vKb();
                                                  KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                                  SET.plan = 'free'; return h; }],
    /* A RUN of columns, chosen by drawing the finger along the heads.
       「キーボードaおしたら縦列選択できるけどさ、そこからabcdみたいに引っ張って
       も選択ができない」 OWNER 2026-09-05. The far end is written by the drag
       and by nothing else, so the face is built by the drag -- the real
       handlers, with elementFromPoint standing in for the finger for the
       length of one question, exactly as tools/kb-check.mjs drives it. */
    ['a run of columns of the keyboard selected', () => { SET.plan = 'pro'; KB = null;
                                                  kbShow = 0; kbAdd('qwerty'); kbLay = 0;
                                                  const hd = (n) => document.querySelector(
                                                    '#kb [data-do="kbHeadCol"][data-a="[' + n + ']"]');
                                                  const src = hd(0), dst = hd(3),
                                                        real = document.elementFromPoint;
                                                  if (src && dst) {
                                                    kbDown({ target: src, touches: [{ clientX: 60, clientY: 60 }] });
                                                    document.elementFromPoint = () => dst;
                                                    kbDragTo({ touches: [{ clientX: 160, clientY: 60 }],
                                                               preventDefault: () => {} });
                                                    document.elementFromPoint = real;
                                                    kbUp({ preventDefault: () => {} });
                                                  }
                                                  const h = vKb();
                                                  KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                                  SET.plan = 'free'; return h; }],
    /* the + asking which side of the selected COLUMN a new one goes on, which
       is the row face one axis over -- and it needs a column CUT first,
       because every pattern the app builds comes to the full ten and a board
       with no slack is not offered a + at all. 「最大になったら+はなし」 */
    ['a column selected, asking where a new one goes', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                                  kbAdd('qwerty'); kbLay = 0;
                                                  kbHeadCol(0); kbCut();
                                                  kbHeadCol(2); kbInsAsk();
                                                  const h = vKb();
                                                  KBH = null; KB = null; kbShow = 0; kbLay = 0;
                                                  SET.plan = 'free'; return h; }],
    ['a keyboard of two layers', () => { SET.plan = 'pro'; KB = null; kbShow = 0;
                                         kbAdd('qwerty'); kbAddLay();
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
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('qwerty'); kbRepat(1);
        const h = vForm();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    ['the free QWERTY, on a plan that can build others', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('tap'); kbShow = 0; KB.at = 1;
        kbGoBoard(0);
        const h = vKb();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    /* A language holding more than one keyboard, which is where the row of
       them, the Apply button and the way to delete one all live. Every one of
       the five patterns is built across these three faces rather than
       described, so a pattern that cannot be laid out is a red check rather
       than an empty keyboard on somebody's phone -- qwerty is the first board
       and is there whether or not anything was built, then flick, chart, tap
       and abc. kbAdd() twice is three keyboards, which the paid plan has room for.

       The one APPLIED is deliberately not the one shown: that is the whole
       distinction the screen exists to make, and a face where they are the
       same would render neither the Apply button nor the line that replaces
       it. */
    ['three keyboards, looking at one that is not applied', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('flick'); kbAdd('chart');
        KB.at = 0; kbShow = 2;
        const h = vKb();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    ['the keyboard that is already applied', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('tap');
        KB.at = 1; kbShow = 1;
        const h = vKb();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    /* A sound the language has that no letter says yet. It is a cell in the
       alphabet now rather than a row on a chapter of its own, and it only
       exists on Plus -- free cannot add a sound. Two faces, because held it
       carries the mark that takes the sound away and at rest the speaker.
       The seeded language has a letter for every sound it has, so one is
       taken off a letter here to make one. */
    ['a sound with no letter yet', () => {
        SET.plan = 'pro'; SND.push('\u0283');
        window.route='ltset'; NAV=[{r:'ltset', a:'alpha'}];
        const h = vLtset();
        SND.pop(); SET.plan = 'free'; return h; }],
    ['a sound with no letter yet, held', () => {
        SET.plan = 'pro'; ltWob = true; SND.push('\u0283');
        window.route='ltset'; NAV=[{r:'ltset', a:'alpha'}];
        const h = vLtset();
        SND.pop(); ltWob = false; SET.plan = 'free'; return h; }],
    /* The `?` sheet: how the keyboard gets onto the phone. It is a form and
       nothing walks to it -- and the button that opens iOS Settings is on it
       and nowhere else, so without this face that button belongs to no
       screen. Free reaches the same sheet, so the plan is not touched. */
    ['how the keyboard gets onto the phone', () => {
        openHelp('kb'); return vForm(); }],
    /* The ⋯ at the end of the row of keyboards: deleting this one, and
       starting the whole chapter over. Both are off the screen now, and
       deleting only exists when there is more than one to delete. */
    /* The ... in the dictionary's bar. The rules that make a form out of a
       word are behind it, and that is the only door to them -- without this
       face the walk sees a screen nothing goes to, which is exactly what it
       would be if the button were deleted. */
    /* The sheet a word is coined on, with something typed into it. The forms
       the rules make of it are on that sheet, and they are on it only once
       there is a spelling to make them out of -- so an empty sheet names
       neither the field one is typed over in nor the minus that takes one
       off. The rule the fixture seeds is a plural for nouns, and a noun is
       what the sheet opens on. */
    ['a word being coined, with its forms', () => {
        openAdd('');
        wdSetLn('tirek');
        return sheet('<div id="wd-body">'+wdFormHTML()+'</div>'); }],
    /* A rule written on the OLD editor -- it drops a letter and fires only on
       words ending in one. The screen is two fields now and cannot write
       another like it, and this face is what proves the ones somebody already
       has are untouched: the values are still on the rule, and gFmDrop() and
       gFmCond() in www/grammar.js still hand them to the engine. */
    ['a rule written before the editor was two fields', () => {
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
        return sheet(fmrFormHTML()); }],
    ['the two that undo a keyboard', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('tap'); kbShow = 1; kbMore();
        const h = vForm();
        KB = null; kbShow = 0; kbLay = 0; SET.plan = 'free'; return h; }],
    /* And the five offered, on the sheet that makes another -- which is the
       only door to them now. The chapter itself no longer has an empty face:
       the first keyboard is the one already on the phone, so what the screen
       opens with is a keyboard rather than a chooser for one. */
    /* The list of keyboards, being chosen from -- Select at the far end of the
       bar, a ◉ at the front of each row, Delete beside Done. Board 0 is the
       free QWERTY and gets no mark: it is not in storage and cannot go. */
    ['the keyboards, choosing, with nothing chosen yet', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('abc'); kbAdd('qwerty');
        window.route = 'kb'; NAV = [{ r:'kb' }];
        KBSEL = {};
        const h = vKb();
        KBSEL = null; KB = null; kbShow = 0; SET.plan = 'free'; return h; }],
    ['the keyboards, choosing, with two chosen', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('abc'); kbAdd('qwerty');
        window.route = 'kb'; NAV = [{ r:'kb' }];
        KBSEL = { 1:1, 2:1 };
        const h = vKb();
        KBSEL = null; KB = null; kbShow = 0; SET.plan = 'free'; return h; }],
    ['choosing another keyboard', () => {
        SET.plan = 'pro'; KB = null; kbShow = 0;
        kbAdd('abc'); kbNew();
        const h = vForm();
        KB = null; kbShow = 0; SET.plan = 'free'; return h; }],
    /* ---- the paid faces of the making side ----------------------------
       Four screens the free plan does not show, because on free the
       alphabet is twenty-eight slots that cannot be added to, renamed or
       deleted from. Each of these is the same screen with the plan changed,
       and without them the buttons that do those things belong to no screen
       at all. */
    ['the alphabet, on the paid plan', () => { SET.plan = 'pro';
        window.route = 'ltset'; NAV = [{r:'ltset', a:'alpha'}];
        const h = vLtset(); SET.plan = 'free'; return h; }],
    ['one letter, on the paid plan', () => { SET.plan = 'pro';
        window.route = 'letter'; NAV = [{r:'letter', a:'l1'}];
        const h = vLetter(); SET.plan = 'free'; return h; }],
    /* The letters chapter with everything open: the keyboard's door, and the
       abugida bench's -- which is the only way to that screen, and only
       exists while the writing is an abugida, which is itself paid. */
    ['the letters chapter, on the paid plan', () => { SET.plan = 'pro'; SET.wsys = 'abugida';
        window.route = 'letters'; NAV = [{r:'letters'}];
        const h = vLetters(); SET.plan = 'free'; SET.wsys = ''; return h; }],
    ['the abugida bench', () => { SET.plan = 'pro'; SET.wsys = 'abugida';
        window.route = 'abugida'; NAV = [{r:'abugida'}];
        const h = vAbugida(); SET.plan = 'free'; SET.wsys = ''; return h; }],
    ['the five kinds of writing', () => { SET.plan = 'pro';
        window.route = 'wsys'; NAV = [{r:'wsys'}];
        const h = vWsys(); SET.plan = 'free'; return h; }],
    ['one letter, opened',     () => { window.route='letter'; NAV=[{r:'letter', a:'l1'}];
                                       return vLetter(); }],
    ['a mark, opened',          () => { window.route='letter'; NAV=[{r:'letter', a:'l4'}];
                                       return vLetter(); }],
    /* TWO LETTERS FOR ONE SOUND, which is c and k and is allowed --
       「全部入力で被ったら赤字」. The field goes red and the line under it says
       which letter already reads it. Nothing else here reaches that state:
       every letter in this alphabet reads its own sound, so `.ltdup` was
       styled and worn by nothing and press said so. */
    ['a letter whose sound another letter already reads', () => {
        const a = ltById('l1'), b = ltById('l2');
        const was = b ? JSON.parse(JSON.stringify(b.snd || [])) : null;
        if (a && b) b.snd = (a.snd || []).slice();
        window.route='letter'; NAV=[{r:'letter', a:'l2'}];
        const h = vLetter();
        if (b && was) b.snd = was;
        return h; }],
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
                                       return sheet('<div id="wd-body">'+wdFormHTML()+'</div>'); }],
    ['a word with a sentence in it', () => { findWord('kano').ex=[{ln:'kano tir', gl:'sees it'}];
                                             openEdit('kano');
                                             const h=vForm();
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
        openMe(); const h = vForm(); ME.pic = ''; return h; }],
    /* The notebook, being chosen from -- Select at the far end of the bar,
       a ◉ at the front of each row, Delete beside Done. */
    ['the notes, choosing, with nothing chosen yet', () => {
        window.route = 'notes'; NAV = [{ r:'notes' }];
        NTSEL = {};
        const h = vNotes(); NTSEL = null; return h; }],
    ['the notes, choosing, with one chosen', () => {
        window.route = 'notes'; NAV = [{ r:'notes' }];
        NTSEL = { 0:1 };
        const h = vNotes(); NTSEL = null; return h; }],
    /* A row swiped left, its delete showing -- 「一覧から右にスワイプして削除」
       OWNER 2026-09-05. Nothing at rest ever has a row open, the same reason
       the lens above never had a box: a walk over the routes never swipes. */
    ['a note row with its delete showing', () => {
        window.route = 'notes'; NAV = [{ r:'notes' }];
        ntSwipeAt = 0;
        const h = vNotes(); ntSwipeAt = -1; return h; }],
    /* A slot's word is made on the word screen now, with the two things the
       slot already knows written in: the meaning is what the slot is called
       and the part of speech is the stage's. There is no form of its own any
       more, and no row of suggestions -- both went with it.
       A slot that is ALREADY filled is not a form at all: openSlot() sends
       you to the word, and the word screen is walked elsewhere. */
    ['a slot\'s word being made', () => { openSlot('greet','yes'); return vForm(); }],
    ['synonyms to choose from',  () => { window.route='relate'; NAV=[{r:'relate', a:'syn:kano'}];
                                         return vRelate(); }],
    /* One of them is the letter's own, which is the only state that wears
       .cur. It went unwalked for as long as the plans screen happened to wear
       the same class on something else -- `press` reports a class nothing
       wears, and a second wearer somewhere else is a mask, not a test. */
    ['characters on offer',      () => { const w = WORLD_SCRIPTS[0];
                                         const l = ltById('l1');
                                         if (l) l.ch = w.ch.split(' ')[1];
                                         openPick('l1'); pkScript = w.id;
                                         return sheet(FORM.html + pkCharsHTML()); }],
    /* The same sheet for a letter that already has one borrowed. Taking it
       back off is the only thing on the sheet that depends on there being
       something there -- www/home.js pkclear -- so on a bare letter it is on
       no screen. */
    ['a character already borrowed', () => { const l = ltById('l1');
                                             const was = l ? l.ch : '';
                                             if (l) l.ch = '\u3042';
                                             openPick('l1'); const h = vForm();
                                             if (l) l.ch = was; return h; }],
    /* A word with no meaning on it yet, and a word with more than one. The
       dictionary numbers the meanings only when there are two to tell apart
       -- www/words.js sn -- and a word with none has NO second line at all
       since 2026-09-05 (「空欄でいいよ」). Every word the fixture holds has
       exactly one, so neither row is on any screen without this. */
    ['the dictionary, with a word unfinished and a word with two meanings', () => {
        const keep = WORDS;
        WORDS = keep.concat([{ hw:'vel', ph:['v','e','l'], mns:[], pos:'n', at:11 },
                             { hw:'dros', ph:['d','r','o','s'],
                               mns:['a bank of a river','an edge'], pos:'n', at:12 }]);
        window.route = 'words'; NAV = [{ r:'words' }];
        const h = vWords(); WORDS = keep; return h; }],
    /* ---- the dictionary as a list you CHOOSE from -----------------------
       Three faces, because the buttons differ on every one of them and none of
       the three is reachable from the list at rest: nothing here is on a screen
       until `wSel` is a map, and the two that act on a selection are down
       until something is in it.

       Each puts the state back, the way the plan faces below do. What is
       pressed afterwards therefore finds `wSel` and `wUndo` back at null and
       returns without doing anything, which is the point -- the walk is about
       every button being reachable and none of them throwing, and a fixture
       that left a delete armed would be asking a confirm() nobody can answer. */
    ['the dictionary, choosing, with nothing chosen yet', () => {
        window.route = 'words'; NAV = [{ r:'words' }];
        wSel = {};
        const h = vWords(); wSel = null; return h; }],
    ['the dictionary, choosing, with two words chosen', () => {
        window.route = 'words'; NAV = [{ r:'words' }];
        wSel = {}; WORDS.slice(0, 2).forEach(w => { wSel[w.hw] = 1; });
        const h = vWords(); wSel = null; return h; }],
    /* What a bulk delete leaves behind: the row that says what happened and
       the row that makes it not have happened. `wUndo` is the only thing that
       draws either, and no walk ever deletes. */
    ['the dictionary, just after words were deleted together', () => {
        window.route = 'words'; NAV = [{ r:'words' }];
        wUndo = { n:2, w:[], other:[], lines:[] };
        const h = vWords(); wUndo = null; return h; }],
    /* A stage that has been finished. A stage is done when its slots, its
       decisions and the one thing it has to SAY are all answered -- www/
       phases.js stIsDone -- and the fixture finishes none of them, so the
       mark on a finished row is on no screen. A part with no slots and no
       decisions is finished by saying what it does, which is one line. */
    ['the stages, with one finished', () => {
        const p = stAll().filter(x => !x.slots.length && !x.feats.length)[0]
                  || stAll()[0];
        const was = stRules(p.id);
        stKeepSave(p.id, { rules: 'a name is a word that stands for a thing' });
        window.route = 'gram'; NAV = [{ r:'gram' }];
        const h = vGram(); stKeepSave(p.id, { rules: was }); return h; }],
    /* The article, with a finished stage in it. `.abtline` is worn by the
       name of every stage that has been answered -- www/home.js:1123 -- and
       the fixture finishes none of them, so that line is on no screen and
       press reported the class as worn by nothing. It is the "add the seed"
       side of press's two, not the "delete it" side: the wearer is right
       there and the walk simply never stood where it is.

       Finished the same way "the stages, with one finished" does it, and for
       the same reason: a part with no slots and no decisions is finished by
       saying what it does, which is one line. Put back afterwards. */
    ['this language, with a stage finished in it', () => {
        const p = stAll().filter(x => !x.slots.length && !x.feats.length)[0]
                  || stAll()[0];
        const was = stRules(p.id);
        stKeepSave(p.id, { rules: 'a name is a word that stands for a thing' });
        window.route = 'about'; NAV = [{ r:'about' }];
        const h = vAbout(); stKeepSave(p.id, { rules: was }); return h; }],
    /* A character another letter has already taken. The picker dims it rather
       than hiding it, because which letter has it is worth seeing -- and
       chTaken() is empty in a language that has borrowed nothing, so the dim
       face is on no screen. www/home.js had. */
    ['a character another letter has taken', () => {
        const w = WORLD_SCRIPTS[0]; pkScript = w.id;
        const ch = w.ch.split(' ')[0];
        const other = LETTERS.filter(l => l.id !== 'l1')[0];
        const was = other ? other.ch : '';
        if (other) other.ch = ch;
        openPick('l1'); const h = vForm();
        if (other) other.ch = was; return h; }],
    /* A language with its page turned off. The word that says so sits beside
       the name and nowhere else -- www/home.js wldoff -- and hide is absent
       by default, which is what makes it public. */
    ['a language whose page is hidden', () => { const w = world();
                                                const was = w.hide; w.hide = true;
                                                window.route = 'profile'; NAV = [{ r:'profile' }];
                                                const h = vProfile();
                                                if (was === undefined) delete w.hide;
                                                else w.hide = was;
                                                return h; }],
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
                                          const h=vForm(); SET.aiN=0; return h; }],
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
      pwMarkOpen(0); pwMarkAt = 0; pwTool = 'mark'; const h = sheet(pwMarkHTML());
      PW = pwBlank(); pwPicAt = -1; pwMarkAt = -1; return h; }],
    /* And the other half of the editor: the crop, with its rectangle over the
       picture. It is a mode of the same screen, so nothing renders it unless
       the walk is put into it. */
    ['cropping a photograph', () => { PW = pwBlank();
      PW.pics = [{u:POSTS[0].pic, marks:[{tx:'kano', x:0.5, y:0.4, s:0.18, c:PW_COLS[0]}]}];
      pwMarkOpen(0); pwTool = 'crop'; const h = sheet(pwMarkHTML());
      PW = pwBlank(); pwPicAt = -1; pwTool = 'mark'; return h; }],
    ['a photograph with no letters on it yet', () => { PW = pwBlank();
      PW.pics = [{u:POSTS[0].pic, marks:[]}]; pwPicAt = 0; pwMarkAt = -1; pwTool = 'mark';
      pwMarkOpen(0); pwMarkAt = -1;
      const h = sheet(pwMarkHTML()); PW = pwBlank(); pwPicAt = -1; return h; }],
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
        return vForm(); }],
    /* The same list where one of its words is already in the dictionary, so
       the choice between skipping and overwriting exists at all. */
    ['a list with words already here', () => { IMP = impBlank();
        impTake('Word,Meaning\nkano,mountain\nzzk,a thing\n');
        return vForm(); }],
    /* An alphabet rather than a dictionary: the same screen, and the counts
       below the table say letters instead of words. */
    ['an alphabet waiting to be understood', () => { IMP = impBlank();
        impTake('Letter,Sound,Name\nϘ,k,qoppa\nϠ,sh,sampi\n');
        return vForm(); }],
    ['a list just brought in', () => { IMP = impBlank();
        IMP.read = {shape:'table', head:null, rows:[['zzk', 'a thing']]};
        IMP.roles = ['hw', 'mn'];
        doImport();
        const h = vForm(); impUndo(); return h; }],
    /* On the paid plan the file button is a real file input rather than the
       way to the plans. */
    ['a file being chosen', () => { SET.plan = 'pro'; IMP = impBlank();
        openImport();
        const h = vForm(); SET.plan = 'free'; return h; }],
    /* The card, which is the only screen whose output leaves the app. All
       three faces: a word, one of the sentences written under a word, and a
       post. They compose the picture differently -- a word is a page out of a
       dictionary, a sentence is a line, a post is somebody's published one --
       and only the post is offered a choice of shape, so the shape picker is
       on no screen but the third. */
    ['a word as a card',       () => { cardOpen('w', 'kano'); return vForm(); }],
    ['a sentence as a card',   () => { findWord('kano').ex=[{ln:'kano mos tir', gl:'a tall mountain is seen'}];
                                       cardOpen('x', 'kano#0');
                                       const h=vForm(); delete findWord('kano').ex; return h; }],
    ['a post as a card',       () => { cardOpen('p', 'p1'); return vForm(); }],
    /* The rule a form is made by. It takes an id, and the id is the one the
       fixture put in STG above. */
    ['a rule for making a form', () => { openFmr('fr1'); return vForm(); }],
    /* 規則 and 例文 are a page each now (openStRules / openStEx in
       www/phases.js) and are the only place either is written, so without
       these two faces nothing names what is typed into them. The examples page
       is drawn TWICE: with the row for one more folded away, which is what it
       opens as, and with it out, because the three fields and the Enter on
       them exist only while it is out. */
    ['what a stage says its rule is', () => { openStRules('neg'); return vForm(); }],
    ['the examples of a stage', () => { stExNew=''; openStEx('neg'); return vForm(); }],
    ['an example being written', () => {
        stExOpen('neg');
        const h=vForm(); stExNew=''; return h; }],
    /* The sheet (www/sheet.js, chapter 26). Four faces, because they share no
       buttons: the room, the names being typed, the one control before a file
       has been handed over, and what came off one afterwards.

       The last is built from a made-up reading rather than from a photograph
       -- tools/sheet-check.mjs puts a real page through the real reader, and
       what these two walks are for is the SCREEN. A row that says `empty` and
       a row that says `drawn` are two different rows, so both are here, and
       the button at the foot only exists while something was drawn.

       vForm() and not FORM.html: the app wraps a form in view/body, and a face
       that hands back the bare html is measured 48px wider than the phone will
       ever show it. That was fixed across all 48 the same day this arrived. */
    ['the sheet',              () => { SH = shBlank(); openWrite(); return vForm(); }],
    ['a sheet being made',     () => { SH = shBlank(); SH.names = 'a, ka, 7';
                                       openWrOut();
                                       const h = vForm(); SH = shBlank(); return h; }],
    /* and the same screen once the sheet is out. `file` is what it was filed
       as, which is the only thing that says a sheet exists to write on -- the
       row that opens Apple's Markup is not there before one does. */
    ['a sheet that is written', () => { SH = shBlank(); SH.names = 'a, ka, 7';
                                       SH.file = 'sheet.pdf'; openWrOut();
                                       const h = vForm(); SH = shBlank(); return h; }],
    ['a sheet to read back',   () => { SH = shBlank(); openWrIn(); return vForm(); }],
    ['a sheet that came back', () => { SH = shBlank(); SH.from = 'sheet.jpg';
        SH.got = [{nm:'ka', sh:[[[100,100],[700,100],[700,700],[100,700]]]},
                  {nm:'7',  sh:[]}];
        openWrIn(); const h = vForm(); SH = shBlank(); return h; }],
    /* A language nobody may open, on both of its faces. `seed()` leaves WLD
       public -- it has to, or every screen below the top switch narrows away
       and the walk covers one arrangement of the app while calling it all of
       them -- so these two faces exist nowhere else, and until they were here
       the mirror had never once rendered a hidden page in any language.

       They are two entries rather than one because the two faces stop at
       different lines and that difference is the whole decision:
       「非公開にする場合は言語名しか表示されない」 is the article, and
       「非公開にしたら編集画面が全部非表示になる感じ」 is the editor, which keeps
       the one row that can undo it. A single face would prove whichever of
       the two it happened to be. */
    /* Left set, not put back. shot.mjs calls render() after a face, so one
       that tidies up photographs the screen it tidied back to -- the day's
       sentence above says the same thing, and this cost one round of looking
       at a public page and being told it was the hidden one. seed() runs
       before each face and is what puts it back. */
    ['the language nobody may open', () => { WLD.hide = true;
                                         window.route = 'about'; NAV = [{ r:'about' }];
                                         return vAbout(); }],
    ['writing on a page nobody may open', () => { WLD.hide = true;
                                         window.route = 'world'; NAV = [{ r:'world' }];
                                         return vWorld(); }],
    /* A language with a keyboard somebody BUILT, and three of its four
       chapters open to be taken away. Neither is reachable from seed(): the
       walk runs on the free plan, where `kbBoards()` answers with the free
       QWERTY alone and the article draws no keyboard at all -- 「無料キーボード
       はなしでいいよ。作ったキーボードのみ表示」 -- and nothing has ever been
       switched on for `dl`, so the mark that says a chapter may be taken away
       was on no screen in any language.
       Board 1, because board 0 is the free QWERTY itself. */
    ['a language anybody may take away', () => {
       SET.plan = 'plus';
       KB = { at: 1, kbs: [{ nm: 'Shango', pat: 'abc', lay: kbAbcLay() }] };
       WLD.secs = { letters: { dl: true }, words: { dl: true }, kb: { dl: true } };
       window.route = 'about'; NAV = [{ r:'about' }];
       return vAbout(); }],
    /* Inside the sections. The page arrives with every one of them shut as of
       2026-08-26, so everything a section CONTAINS is now behind a press --
       and a walk that only ever arrives reports every one of those buttons as
       an entry no screen names, which is true of the arriving page and is not
       what it means. `wldOvDel`, `wldOvSet` and `wldSet` went that way the
       hour the default changed.

       Both faces, because they hold different things: the article draws the
       rows, and the editor draws the fields that write them. */
    /* The plans page after the App Store has answered. Every other walk runs
       in a browser, where there is no App Store at all, so the struck-through
       price a year carries is on no screen any of them reaches -- and a class
       nothing wears reads as a class nothing needs.
       「49.99は取り消し線＋17%OFF」OWNER 2026-08-26. The numbers are the same
       fakes tools/plan-check.mjs uses and for the same reason: a saving that
       comes out 33 cannot be the 17 written on PLANS. */
    ['the plans, priced by the App Store', () => {
        STORE_P = { 'com.tokinets.lingua.plus.monthly':
                      { price: '¥750', amount: 750, year: '¥9,000' },
                    'com.tokinets.lingua.plus.yearly':
                      { price: '¥6,000', amount: 6000 } };
        const h = vPlans(); STORE_P = null; return h; }],
    ['a page with every section open', () => {
       /* Public, said here rather than assumed: act-check does NOT re-seed
          between faces, and the two faces above are left hidden on purpose.
          A hidden page is the NAME and nothing else, so without this line
          these two render no section at all and prove nothing -- which is how
          they were first written, and act-check went on reporting the three
          buttons inside a section as named by no screen. */
       WLD.hide = false;
       wldSecs().forEach(function(sec){ ABOPEN[sec.r] = true; });
       window.route = 'about'; NAV = [{ r:'about' }];
       return vAbout(); }],
    ['writing with every section open', () => {
       WLD.hide = false;
       wldSecs().forEach(function(sec){ ABOPEN[sec.r] = true; });
       window.route = 'world'; NAV = [{ r:'world' }];
       return vWorld(); }],
    /* The word order WITH the demonstration under it. Every chapter that shows
       one draws it only once the stage has been touched -- `stTouched(id)` is
       `STG.set[id]`, and the seed's `set` is empty -- so `.gdemo`, the row
       inside it and the button that says the line out loud were on no route
       and in no face, and could not be photographed at all. Appended at the
       END so no index above it moves. */
    ['the word order, with the demonstration under it', () => {
       STG.set['order'] = 1;
       window.route = 'gram'; NAV = [{ r:'gram', a:'order' }];
       return vGram(); }],
    /* ---- the search boxes, with something typed in them -----------------
       The cross only exists once there is something to clear, so a box with
       an empty field says nothing about whether it has one. These are the
       ones that had no face with a query in them. 「調べる系は ❌欲しいかも」
       OWNER 2026-09-04 -- every box clears now, and this is where that is
       looked at. Appended at the END so no index above moves. */
    ['the dictionary, searched', () => {
       q = 'ka';
       window.route = 'words'; NAV = [{ r:'words' }];
       const h = vWords(); q = ''; return h; }],
    ['searching everything, searched', () => {
       fq = 'ka';
       window.route = 'find'; NAV = [{ r:'find' }];
       const h = vFind(); fq = ''; return h; }],
    /* vLetters() is the CONTENTS of the chapter -- Alphabet, Marks, Digits --
       and carries no search box. The list that does is vLtset(), which reads
       here() rather than an argument, so the route has to be stood on. */
    ['the alphabet, searched', () => {
       ltQ = 'k';
       window.route = 'ltset'; NAV = [{ r:'ltset', a:'alpha' }];
       const h = vLtset(); ltQ = ''; return h; }],
    /* AN ALPHABET THAT DOUBLED, ARRIVED AT.
       「あと、キーボード足したりしてたら文字増殖してるんだけど何で？」OWNER
       2026-09-04. Thirty-eight slots made twice under two sets of ids, which
       is what the owner is holding: a a, b b, c c, every reading twice.

       It goes through ltStart() rather than showing the seventy-six, because
       ltStart() is the road -- www/boot.js and langOpen() call it -- and what
       this face is for is the screen somebody ARRIVES at. With the join in it
       is thirty-eight; with the join taken out it is the owner's photograph.
       One face, both states, which is what a picture of a fix has to be. */
    ['an alphabet that had doubled, arrived at', () => {
       const was = LETTERS, wasPlan = SET.plan, wasSeq = LT_SEQ;
       SET.plan = 'free';
       LT_SEQ = 0; LETTERS = []; ltStart();
       const old = JSON.parse(JSON.stringify(LETTERS));
       old.forEach((l, i) => { l.id = 'l' + (i + 1) + '_' + i + '_6'; });
       LT_SEQ = 0; LETTERS = []; ltStart();
       LETTERS = old.concat(LETTERS);
       ltStart();
       window.route = 'ltset'; NAV = [{ r:'ltset', a:'alpha' }];
       const h = vLtset();
       LETTERS = was; SET.plan = wasPlan; LT_SEQ = wasSeq;
       return h; }],
    /* §14 語順、A LANGUAGE THAT WAS JUST MADE, on a phone whose settings still
       carry the word order from before a language could hold one of its own.
       That is the state migrateGramLang() (www/phases.js) is about and there
       is no route to it: the migration runs at load, and a language minted
       afterwards is one this file has to mint itself.

       It is here because this screen CHANGES with it. The six buttons and the
       example line are both behind stTouched('order') -- nobody chose this,
       so neither is drawn either way -- but g2Sent() prints orderDef().id
       under the three words and arranges them by orderDef().seq with no gate
       at all. A new language used to come out OSV, wearing the phone's answer;
       it comes out SOV now, which is the default with nothing chosen. */
    ['§14 語順、a language just made on a phone that had one', () => {
       const wasLangs = JSON.parse(JSON.stringify(LANGS));
       const wasId = langId, wasStg = JSON.parse(JSON.stringify(STG));
       const wasOrder = SET.order, wasGpos = SET.gpos;
       SET.order = 'OSV';
       SET.gpos = { adj:'before', negp:'before', adp:'after' };
       const id = langMint();
       LANGS[id].name = 'Tosk';
       migrateGramLang();
       langId = id; stRead();
       window.route = 'gram'; NAV = [{ r:'gram', a:'v2:order' }];
       const h = vGram();
       delete LANGS[id]; LANGS = wasLangs;
       SET.order = wasOrder; SET.gpos = wasGpos;
       langId = wasId; STG = wasStg;
       return h; }],
    /* 写しの無い iPhone で辞書を開いたところ ── 単語が一つも無く、サーバーは
       まだ何も答えていない。この検査の後ろにサーバーは無いので、その二つ目は
       ここでは既定の状態。

       この形が二度書き換わった画面で、どちらの姿も一枚ずつ要る:
       2026-09-05 の朝は「通信エラーです。通信の良いところで接続してください」
       を出し、同じ日にそれを消して「単語がまだありません」に戻した。 */
    ['写しの無い iPhone の辞書', () => {
       const was = WORDS;
       WORDS = [];
       window.route = 'words'; NAV = [{ r:'words' }];
       const h = vWords();
       WORDS = was;
       return h; }]
  ];
}
