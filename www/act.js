/* Lingua — what a button does
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   「文字列が増えたあと修正が大変になるから綺麗にしろ」

   Every screen in this app is a string of HTML built in JavaScript, and until
   now every button in it carried its own JavaScript inside that string:

     '<button onclick="tkAdd(\'' + esc(w.hw) + '\')">'
     '<button onclick="stDelEx(\'' + id + '\',' + i + ')">'
     '<button onclick="sayPh(' + esc(JSON.stringify(wPh(w))) + ')">'

   Two hundred of them. A quote inside a quote inside an attribute, and the
   name of the function written as text. Nothing checks that text. Rename the
   function and nothing complains; delete it and nothing complains. What
   breaks is the button, on the device, when somebody presses it -- which is
   how `wdRelHTML is not defined` shipped.

   So the markup no longer contains JavaScript. It contains a name:

     '<button' + DO('tkAdd', [w.hw]) + '>'      ->  <button data-do="tkAdd" ...>

   One listener sits on the page and looks the name up in ACT. ACT is written
   by hand in www/act-map.js, with the function itself, not its name:

     act('tkAdd', tkAdd);

   which means a deleted function is an error the moment the app loads, not
   the moment somebody presses something. And because every name a screen can
   say is now in one table, tools/act-check.mjs can walk every screen, collect
   every name, and prove both directions: nothing is named that does not
   exist, and nothing exists that is never named.

   Arguments travel as JSON in an attribute, so a number stays a number and a
   list of sounds stays a list of sounds. No quoting, no escaping by hand, and
   nothing to get wrong when a word has an apostrophe in it. */

var ACT={}, ACT_IN={}, ACT_KEY={};
function act(name, fn){ ACT[name]=fn; }
/* Something typed into: the value comes last, after whatever the markup
   named. IN('wldSet',['where']) calls wldSet('where', <what was typed>). */
function actIn(name, fn){ ACT_IN[name]=fn; }
/* Enter pressed in a field. */
function actKey(name, fn){ ACT_KEY[name]=fn; }

function actArgs(args){
  return (args && args.length)? ' data-a="'+esc(JSON.stringify(args))+'"' : '';
}
/* Pressed. `stop` keeps the press from reaching a button underneath, which is
   what a small delete mark sitting on top of a bigger button needs. */
function DO(name, args, stop){
  return ' data-do="'+name+'"'+actArgs(args)+(stop? ' data-stop="1"' : '');
}
/* Something to run straight after the first thing, on the same press. The
   drawing tools use it: the tool acts, and then the little demonstration of
   that tool is shown. Two names, both looked up in the same table, so both
   are checked. */
function AFTER(name, args){
  return ' data-do2="'+name+'"'+(args && args.length? ' data-b="'+esc(JSON.stringify(args))+'"' : '');
}
/* Typed into, as it is typed. */
function IN(name, args){ return ' data-in="'+name+'"'+actArgs(args); }
/* Finished typing -- left the field, or chose from a list. */
function CH(name, args){ return ' data-ch="'+name+'"'+actArgs(args); }
/* Enter. */
function KD(name, args){ return ' data-kd="'+name+'"'+actArgs(args); }

function actOf(el, attr){
  while(el && el!==document && el.getAttribute){
    if(el.getAttribute(attr)) return el;
    el=el.parentNode;
  }
  return null;
}
function actRead(el, k){
  var s=el.getAttribute(k||'data-a');
  if(!s) return [];
  try{ var a=JSON.parse(s); return (a && a.length)? a : []; }catch(e){ return []; }
}
function actRun(table, el, attr, extra, argAttr){
  var fn=table[el.getAttribute(attr)];
  if(!fn) return false;
  var a=actRead(el, argAttr);
  if(extra!==undefined) a=a.concat([extra]);
  fn.apply(el, a);
  return true;
}

/* One listener for the whole app. A screen is replaced wholesale on every
   render, so nothing can be bound to the elements themselves: they are thrown
   away several times a second. This sits above them and outlives them. */
function actWire(root){
  if(!root) return;
  root.addEventListener('click', function(e){
    var el=actOf(e.target, 'data-do');
    /* A menu hanging off a post closes when anything else is pressed, which
       is what a menu over a page has always done -- and the press that closes
       it is not also delivered, exactly as tapping away from an open menu does
       not press what is underneath.

       Here rather than on a backdrop element: a backdrop is a thing
       press-check has to press, a thumb can miss it, and it would sit over
       the very post the menu is about. One question, asked of post.js, which
       is where the answer lives. */
    if(typeof postMenuTook==='function' && postMenuTook(e.target)) return;
    if(!el) return;
    if(el.getAttribute('data-stop')) e.stopPropagation();
    actRun(ACT, el, 'data-do');
    if(el.getAttribute('data-do2')) actRun(ACT, el, 'data-do2', undefined, 'data-b');
  }, false);
  root.addEventListener('input', function(e){
    var el=actOf(e.target, 'data-in');
    if(el) actRun(ACT_IN, el, 'data-in', e.target.value);
    /* A line field is as tall as what is in it, and a field with NO NAME on
       it has nobody to say so. `.lnin` is a textarea with `overflow:hidden`,
       so a field that never grows does not scroll -- what was typed is simply
       not on the screen, which is the same complaint as the one this shape
       was built for, arriving downwards instead of sideways.
       「全部改行して画面内に文字が収まるようにして欲しい」 OWNER 2026-08-27.

       Measured on `wd-exl`, which had been in this state since the day the
       shape was written: 120 characters, box 46px, content 116px -- 70px of
       what somebody typed was not there. With this line, 115px and 1px.

       The screens that DO carry a name call lnGrow() themselves and are
       unaffected; this is for the ones where a field is read when the form
       is saved rather than as it is typed. Asked of the class rather than of
       a list of ids, so a field added tomorrow grows tomorrow -- the same
       argument lnGrowAll() is already making.

       `lnFit` by name: this file is the one delegated listener and it does
       not otherwise know shell.js exists. */
    if(typeof lnFit==='function' && e.target &&
       String(e.target.className||'').indexOf('lnin')>=0) lnFit(e.target);
  }, false);
  root.addEventListener('change', function(e){
    var el=actOf(e.target, 'data-ch');
    if(el) actRun(ACT_IN, el, 'data-ch', e.target.value);
  }, false);
  /* The composer keeps the keyboard. It is asked of post.js rather than
     decided here -- this listener knows about presses and typing, and whether
     a screen may put its own keyboard back is that screen's question.
     「投稿開いたらキーボードが自動で出て下ろせないが正解」 OWNER 2026-08-25 */
  root.addEventListener('focusout', function(){
    if(typeof pwKbGuard==='function') pwKbGuard();
  }, false);
  root.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.keyCode!==13) return;
    var el=actOf(e.target, 'data-kd');
    if(!el) return;
    e.preventDefault();
    actRun(ACT_KEY, el, 'data-kd');
  }, false);
}
