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
var ME={name:'', handle:'', bio:''};
function meRead(){
  ME={name:'', handle:'', bio:''};
  try{
    var m=JSON.parse(localStorage.getItem(LS_ME)||'null');
    if(m){ ME.name=String(m.name||''); ME.handle=String(m.handle||'');
           ME.bio=String(m.bio||''); }
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
function meName(){ return ME.name || langName || ''; }
function meHandle(){
  return ME.handle || String(meName()).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function meSetName(v){ ME.name=String(v||''); saveMe(); }
/* A line about yourself, which is the one thing on a profile that is not
   about the language. It is never invented and never stands in for
   anything: with nothing written there is nothing there. */
function meSetBio(v){ ME.bio=String(v||''); saveMe(); }
function meSetHandle(v){
  /* A handle is what somebody types after an @, so it is the characters that
     survive being typed after one. */
  ME.handle=String(v||'').toLowerCase().replace(/[^a-z0-9_]+/g, '');
  saveMe();
}

/* ---- the block at the top of the profile ------------------------------- */
function meCard(){
  return '<div class="mecard">'+
    '<div class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</div>'+
    '<div class="mewho">'+
      '<div class="pname">'+esc(meName())+'</div>'+
      '<div class="phandle">@'+esc(meHandle())+'</div>'+
      (ME.bio? '<div class="pbio">'+esc(ME.bio)+'</div>' : '')+
    '</div>'+
    '<button class="meedit"' + DO('openMe') + '>'+esc(t('me.edit'))+'</button>'+
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
      IN('meSetBio') + '>'+esc(ME.bio)+'</textarea></div>');
}
FORM_OPEN.me=function(){ openMe(); };
