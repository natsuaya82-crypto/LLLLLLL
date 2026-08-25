/* Lingua — which screen a route shows
   Loaded by www/index.html after every file that defines a view, beside
   act-map.js and before boot.js.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   www/screens.js has PAGES, which says what a route is called and which tab it
   lives under. It did not say what a route *shows*. That lived separately, as
   a ladder of twenty-two conditions inside render():

     var v = route==='build'? vBuild()
           : route==='find' ? vFind()
           : ... twenty more ...
           : vHome();

   which is the same table written a second time, in a second file, in a form
   nothing can read. The two agreed, and nothing checked that they agreed. A
   route added to PAGES and forgotten here fell through to vHome — the app
   would show the home screen under another screen's name, with a back button
   that worked, and nothing would look broken enough to report. A view whose
   route was quietly dropped simply stopped being reachable.

   So the view goes on the page it belongs to, by the same rule act-map.js
   already follows: the function itself, never its name.

     page('build', vBuild);

   A deleted view now stops the app on load, loudly, instead of turning into
   a home screen weeks later. And because every route the app can render is in
   one table, tools/act-check.mjs proves both directions: no page without a
   view, and no view that no page shows.

   vOb is not here. The onboarding is not somewhere you navigate to — it is
   what the app is until SET.done, and render() returns on it before any of
   this is reached. It is the one view with no route, and act-check knows it
   by name so that the next one cannot slip in beside it. */

function page(r, view){
  /* A route that is not in PAGES has no name and no tab, so it could never
     have been navigated to properly in the first place. */
  if(!PAGES[r]) throw new Error('page(): no route called ' + r);
  PAGES[r].view = view;
}

page('feed',     vFeed);
page('explore',  vExplore);
page('notif',    vNotif);
page('profile',  vProfile);
page('build',    vBuild);
page('find',     vFind);
page('form',     vForm);
page('letters',  vLetters);
page('kb',       vKb);
page('spell',    vSpell);
page('ltset',    vLtset);
page('letter',   vLetter);
page('wsys',     vWsys);
page('abugida',  vAbugida);
page('relate',   vRelate);
page('fm',       vFm);
page('forms',    vForms);
page('fmrpos',   vFmrPos);
page('fmrfm',    vFmrFm);
page('pos',      vPos);
page('reg',      vReg);
page('follows',  vFollows);
page('glyph',    vGlyph);
page('words',    vWords);
page('gram',     vGram);
page('notes',    vNotes);
page('settings', vSettings);
page('set',      vSet);
page('world',    vWorld);
page('wldart',   vWldArt);
page('about',    vAbout);
page('thread',   vThread);
page('photo',    vPhoto);
page('drafts',   vDrafts);
page('langs',    vLangs);
page('mod',      vMod);
page('plans',    vPlans);
