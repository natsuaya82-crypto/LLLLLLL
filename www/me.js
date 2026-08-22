/* Lingua — who you are (chapter 20)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Until now the language was the author. That was true while there was one of
   each and nothing outside the phone, and it stopped being true the moment a
   post had a name on it: a person has one name and may write in three
   languages, and the reader needs to know both -- who wrote it, and what it
   is written in. 「しかも言語名とユーザー名並べろよ」

   So an account: a name, a handle, and nothing else yet. It belongs to the
   person rather than to any language, so it is filed beside the posts and not
   under langKey().

   A post does NOT keep a copy of the name. The language's name it does keep,
   because that is what the post is written in and renaming a language later
   would rewrite what old posts say they are. A person's name is not part of
   what they said; change it and every post of yours shows the new one, which
   is what every timeline does.
   ========================================================================= */

/* =========================================================================
   20. Who you are
   ========================================================================= */

var LS_ME='lingua.me';
var ME={name:'', handle:'', bio:'', pic:''};
function meRead(){
  ME={name:'', handle:'', bio:'', pic:''};
  try{
    var m=JSON.parse(localStorage.getItem(LS_ME)||'null');
    if(m){ ME.name=String(m.name||''); ME.handle=String(m.handle||'');
           ME.bio=String(m.bio||''); ME.pic=String(m.pic||''); }
  }catch(e){}
}
meRead();
function saveMe(){
  try{ localStorage.setItem(LS_ME, JSON.stringify(ME)); }catch(e){}
}
/* Nobody is made to fill this in before they can post. With no name the
   language's name stands in, which is what it did before there were accounts
   at all -- so the screen never shows an empty space or a word invented to
   fill one. */
/* ---- FOLLOW_SEAM ---------------------------------------------------------
   Who this person follows, and who follows them. Two lists of handles, and
   they are asked for through these two rather than read out of ME wherever
   somebody happens to want them -- so the day they come from somewhere else,
   they come from somewhere else here and in no other place.

   `fo` is writable from this phone: following somebody is something you do.
   `fr` is not -- being followed is something that happens to you, and this
   phone is not where it happens. Both are absent on an account that has
   neither, and absent is not empty. */
function meFollowing(){ return (ME.fo && ME.fo.length)? ME.fo : []; }
function meFollowers(){ return (ME.fr && ME.fr.length)? ME.fr : []; }
function meName(){ return ME.name || langName || ''; }
function meHandle(){
  return ME.handle || String(meName()).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function meSetName(v){ ME.name=String(v||''); saveMe(); }
/* A line about yourself, which is the one thing on a profile that is not
   about the language. It is never invented and never stands in for
   anything: with nothing written there is nothing there. */
function meSetBio(v){ ME.bio=String(v||''); saveMe(); }
/* ---- a face of your own ------------------------------------------------
   A file input, because that is the one way a WKWebView opens the camera
   roll without a plugin, and the plugin would have to be installed on a
   Mac before anybody could try it.

   It is kept as a data URL, square, 128 across. Not the picture somebody
   chose: a phone photo is three or four megabytes and localStorage holds a
   few for everything this person owns -- their words, their letters, their
   whole language -- so a face at full size would be the thing that filled
   it. 128 is twice what the largest place it is shown needs.

   The element is reached by id rather than handed in, because a file input
   has no value worth passing: what was chosen is in .files. */
var ME_PIC=128;
function meSetPic(){
  var el=document.getElementById('me-pic'), f=el && el.files && el.files[0];
  if(!f) return;
  var r=new FileReader();
  r.onload=function(){ mePicKeep(String(r.result||'')); };
  r.onerror=function(){ toast(t('me.pic.bad')); };
  r.readAsDataURL(f);
}
/* Cropped to the middle square, then squeezed. Everything that shows a face
   shows a circle, so the sides of a landscape photo were never going to be
   seen and keeping them would only cost room. */
function mePicKeep(url){
  var im=new Image();
  im.onload=function(){
    var side=Math.min(im.width, im.height);
    var c=document.createElement('canvas'), x;
    c.width=ME_PIC; c.height=ME_PIC;
    x=c.getContext('2d');
    x.drawImage(im, (im.width-side)/2, (im.height-side)/2, side, side, 0, 0, ME_PIC, ME_PIC);
    try{ ME.pic=c.toDataURL('image/jpeg', 0.82); saveMe(); }
    catch(e){ toast(t('me.pic.bad')); return; }
    openMe();
  };
  im.onerror=function(){ toast(t('me.pic.bad')); };
  im.src=url;
}
function meDropPic(){ ME.pic=''; saveMe(); openMe(); }
function meSetHandle(v){
  /* A handle is what somebody types after an @, so it is the characters that
     survive being typed after one. */
  ME.handle=String(v||'').toLowerCase().replace(/[^a-z0-9_]+/g, '');
  saveMe();
}

/* ---- the block at the top of the profile ------------------------------- */
/* Who you are, in one block: the face, the name, the handle, the line about
   yourself, and who follows whom. The two counts used to be a row of their
   own under this, in the same small grey type as the language's counts under
   THAT -- three strips of the same thing, none of which was a heading for the
   others. They are part of who somebody is, so they are in here. */
/* Beside the face: the name, the handle and the language, which is the same
   three things a post says about whoever wrote it and in the same order.
   Under them, at the left margin and across the whole phone, the line
   somebody writes about themselves.

   All of it used to be one row -- face, a column of words, the button -- so
   that line read in a column two thirds of the phone wide, indented from both
   sides. 「なんでそんな中央に寄ってるの？相手のページに飛んだらbioすらまとも
   に読めないやんけ」 On somebody else's page it is most of what there is to
   read. 「アイコンの横に名前と@と言語つければいいんじゃない」

   The language wears the same gold tag it wears on a post, and pressing it
   opens what the language is for -- which is what the tag is asking about.
   Renaming a language is in the settings, where the rest of naming it is. */
function meCard(){
  return '<div class="mecard">'+
    '<div class="metop">'+
    '<div class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</div>'+
    '<div class="mewho">'+
      '<div class="pname">'+esc(meName())+planBadge(plan())+'</div>'+
      '<div class="mehr">'+
        '<span class="phandle">@'+esc(meHandle())+'</span>'+
      '</div>'+
    '</div>'+
    '<button class="meedit"' + DO('openMe') + '>'+esc(t('me.edit'))+'</button>'+
    '</div>'+
    (ME.bio? '<div class="pbio">'+esc(ME.bio)+'</div>' : '')+
    /* The language, between what somebody says about themselves and how many
       people are reading them. It was a small tag beside the handle, which is
       where a timeline puts an affiliation and is exactly the wrong size for
       the thing this whole app is about.
       「フォローと自己紹介の間に」「linguaパッチの代わり」 */
    wldRow()+
    /* The way in, and it is on the profile because that is where somebody is
       looking at the thing they would be buying: the badge goes beside the
       name three lines up. It was at the bottom of a room inside the settings
       -- 「今の画面課金させる感が全くないしどこからする？って探さないといけない」
       -- and something you have to hunt for is something nobody buys.
       It is not there once it has been bought. */
    (plan()==='free'
      ? '<button class="upsell"' + DO('goPlans') + '>'+
          '<span class="upsm">'+MARK_PLUS+'</span>'+
          '<span class="upst">'+esc(t('up.badge'))+'</span>'+ICON_GO+'</button>'
      : '')+
    /* FOLLOW_SEAM: the two numbers are asked for rather than read, so the day
       they come from somewhere else they come from somewhere else HERE and
       nowhere else. */
    '<div class="pfstats">'+
      '<button class="pfst"' + DO('go', ["follows", "ing"]) + '><b>'+
        esc(String(meFollowing().length))+'</b> '+esc(t('me.following'))+'</button>'+
      '<button class="pfst"' + DO('go', ["follows", "ers"]) + '><b>'+
        esc(String(meFollowers().length))+'</b> '+esc(t('me.followers'))+'</button>'+
    '</div>'+
    '</div>';
}
/* ---- somebody else's card ----------------------------------------------
   Everything on it comes off a post they wrote, which is where their name,
   their handle, their face and their language's name already are -- the whole
   reason a post carries them. FOLLOW_SEAM: whether you follow them is the
   only thing here that is about you.

   No bio and no counts: neither is on a post, and inventing them out of
   nothing is how a profile starts lying. They arrive with the person when
   there is a server, and they arrive HERE. */
function whoOf(h){
  var i, p;
  h=String(h||'');
  for(i=0;i<POSTS.length;i++){
    p=POSTS[i];
    if(String(p.hd||'')===h)
      return {who:p.who||'', hd:h, av:p.av, lname:p.lname||'',
              bio:p.bio||'', fo:p.fo||0, fr:p.fr||0, out:!!p.out};
  }
  return {who:'', hd:h, av:null, lname:'', bio:'', fo:0, fr:0, out:false};
}
function meFollows(h){ return meFollowing().indexOf(String(h||''))>=0; }
/* Who you have blocked, as handles, beside who you follow -- both are the
   account's and neither is a language's. The uuids the timeline needs are the
   server's answer (netBlocked); this is what a screen asks so a button can
   say which state it is in without a request. */
function meBlocking(){ return (ME.bl && ME.bl.length)? ME.bl : []; }
function meBlocks(h){ return meBlocking().indexOf(String(h||''))>=0; }
/* Blocking somebody stops following them. Keeping a follow to somebody you
   have blocked is a list that says two opposite things, and the one the
   timeline reads would decide which is true. */
function meBlock(h){
  var bl=meBlocking(), i;
  h=String(h||'');
  if(!h || h===meHandle()) return;
  /* Blocking is a row on the server with your uid on it, so it asks who you
     are first. Kept on this phone as well and shown as blocked either way --
     but a block the server has never heard of is not a block, and a list
     that filled up before anybody signed in would be a promise the timeline
     could not keep. */
  if(!obNeed()) return;
  i=bl.indexOf(h);
  if(i>=0) bl.splice(i, 1);
  else {
    bl.push(h);
    if(meFollows(h)) meFollow(h);
  }
  ME.bl=bl;
  saveMe();
  render();
  netBlock(h, i<0, function(){}, function(){});
}
/* Following and unfollowing, in one place. The list is what this phone knows
   and netFollow() is what the server is told -- not waited on, the way a like
   is not waited on: the button has already changed. */
function meFollow(h){
  var fo=meFollowing(), i;
  h=String(h||'');
  if(!h || h===meHandle()) return;
  if(!obNeed()) return;
  i=fo.indexOf(h);
  if(i>=0) fo.splice(i, 1); else fo.push(h);
  ME.fo=fo;
  saveMe();
  render();
  netFollow(h, i<0, function(){}, function(){});
}
/* The same card as your own, in the same order, with Follow where Edit is.
   「他人のプロフィールは基本自分が見えてるのと同じ感じ」

   What is not known is simply absent -- no bio and no counts until they
   arrive with the person. Neither is on a post, and a profile that fills them
   in with a zero is a profile saying something it was never told. */
/* Whether the ... on a person's page is open. A boolean and not an id: a
   page is about one person, so there is nothing to tell two of them apart
   with. It is closed by the same press-anywhere rule PMENU is, and by
   leaving the page. */
var WMENU=false;
function whoMore(h){
  if(!h || h===meHandle()) return;
  WMENU=!WMENU;
  render();
}
function whoCard(h){
  var p=whoOf(h), on=meFollows(h);
  /* Frozen, and then nothing else about them. No face, no name, no follow
     button -- following an account that cannot post is a button with nothing
     behind it. What is still under this is their posts, which stay readable
     on their own page and come off the timeline.
     「タイムラインから外す、プロフィールからは凍結してますの表示」

     A freeze can be lifted, so nothing here is destroyed and the page comes
     back by itself. */
  if(p.out)
    return '<div class="empty"><div class="eb">'+esc(t('who.out'))+'</div></div>';
  return '<div class="mecard">'+
    '<div class="metop">'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="mewho">'+
      '<div class="pname">'+esc(postWho(p))+'</div>'+
      '<div class="mehr"><span class="phandle">@'+esc(h)+'</span></div>'+
    '</div>'+
    '<button class="meedit'+(on?' on':'')+'"' + DO('meFollow', [String(h)]) + '>'+
      esc(t(on? 'me.unfollow' : 'me.follow'))+'</button>'+
    /* The two things you can do about a PERSON rather than about one line
       they wrote. They were on a post's ... and nowhere else, so blocking
       somebody meant finding something of theirs to block them from, and
       reporting an account that had said the same thing forty times meant
       picking one of the forty. 「ブロックも通報はその人の画面でもよろしい」

       The same menu as a post's, in the same shape and closed the same way --
       WMENU beside PMENU, because a page holds one person and a timeline
       holds many posts, and one of them needs an id. */
    '<button class="pmore"' + DO('whoMore', [String(h)]) + ' aria-label="'+
      esc(t('post.more'))+'">'+ICON_DOTS+'</button>'+
    (WMENU
      ? '<span class="pmenu" data-pm="1">'+
        '<button class="pmi"' + DO('meBlock', [String(h)]) + '>'+ICON_BLOCK+
          '<span>'+esc(t(meBlocks(h)? 'post.unblock' : 'post.block'))+'</span></button>'+
        '<button class="pmi bad"' + DO('openReport', ["", String(h)]) + '>'+ICON_FLAG+
          '<span>'+esc(t('post.report'))+'</span></button>'+
        '</span>'
      : '')+
    '</div>'+
    (p.bio? '<div class="pbio">'+esc(p.bio)+'</div>' : '')+
    (p.lname? '<button class="wldrow"' + DO('go', ["about"]) + '>'+
        '<span class="wldnm">'+esc(p.lname)+'</span>'+ICON_GO+'</button>' : '')+
    /* The counts, in the same place and the same shape as your own. They come
       off the person -- FOLLOW_SEAM -- and a person who arrived on a post
       carries none, so they read zero until somebody arrives carrying them.
       Not pressable: the two lists behind your own are yours. */
    '<div class="pfstats">'+
      '<span class="pfst"><b>'+esc(String(p.fo||0))+'</b> '+esc(t('me.following'))+'</span>'+
      '<span class="pfst"><b>'+esc(String(p.fr||0))+'</b> '+esc(t('me.followers'))+'</span>'+
    '</div>'+
    '</div>';
}
function openMe(){
  /* Named after the page it is the settings for, through the one function
     that names a page. */
  openForm('me:', pageName('profile'),
    '<div class="sec">'+esc(t('me.name'))+'</div>'+
    '<div class="field"><input id="me-nm" value="'+esc(ME.name)+'" '+
      'placeholder="'+esc(langName||'')+'"' + IN('meSetName') + '></div>'+
    '<div class="sec">'+esc(t('me.handle'))+'</div>'+
    '<div class="field"><input id="me-hd" value="'+esc(ME.handle)+'" '+
      'placeholder="'+esc(meHandle())+'" autocapitalize="none" '+
      'autocorrect="off" spellcheck="false"' + IN('meSetHandle') + '></div>'+
    '<div class="sec">'+esc(t('me.bio'))+'</div>'+
    '<div class="field"><textarea id="me-bio" placeholder="'+esc(t('me.bio.ph'))+'"' +
      IN('meSetBio') + '>'+esc(ME.bio)+'</textarea></div>'+
    '<div class="sec">'+esc(t('me.pic'))+'</div>'+
    '<div class="picrow"><span class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</span>'+
      '<label class="btn ghost picpick">'+esc(t('me.pic.pick'))+
        '<input type="file" id="me-pic" accept="image/*"' + CH('meSetPic') + '></label>'+
    '</div>'+
    (ME.pic? '<button class="set" style="border-bottom:none"' + DO('meDropPic') + '>'+
       '<span class="sl bad">'+esc(t('me.pic.drop'))+'</span></button>' : ''));
}
FORM_OPEN.me=function(){ openMe(); };
/* The two lists behind the two numbers. One screen, and which one it is is the
   route's argument -- they differ in the list and in what to say when it is
   empty, and in nothing else. */
function vFollows(){
  var ers=(here().a==='ers'), list=ers? meFollowers() : meFollowing();
  return '<div class="view">'+navTop()+'<div class="body">'+
    (list.length
      ? list.map(function(h){
          return '<button class="ntrow"' + DO('go', ["find"]) + '>'+
            '<span class="nth">@'+esc(String(h))+'</span></button>';
        }).join('')
      : '<div class="note">'+esc(t(ers? 'me.followers.none' : 'me.following.none'))+'</div>')+
    '</div></div>';
}
