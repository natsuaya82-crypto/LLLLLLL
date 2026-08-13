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
      '<div class="pname">'+esc(meName())+'</div>'+
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
  return '<div class="view">'+navTop(String(list.length))+'<div class="body">'+
    (list.length
      ? list.map(function(h){
          return '<button class="ntrow"' + DO('go', ["find"]) + '>'+
            '<span class="nth">@'+esc(String(h))+'</span></button>';
        }).join('')
      : '<div class="note">'+esc(t(ers? 'me.followers.none' : 'me.following.none'))+'</div>')+
    '</div></div>';
}
