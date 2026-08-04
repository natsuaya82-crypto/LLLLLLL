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
   named. IN('setWld',['where']) calls setWld('where', <what was typed>). */
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
    if(!el) return;
    if(el.getAttribute('data-stop')) e.stopPropagation();
    actRun(ACT, el, 'data-do');
    if(el.getAttribute('data-do2')) actRun(ACT, el, 'data-do2', undefined, 'data-b');
  }, false);
  root.addEventListener('input', function(e){
    var el=actOf(e.target, 'data-in');
    if(el) actRun(ACT_IN, el, 'data-in', e.target.value);
  }, false);
  root.addEventListener('change', function(e){
    var el=actOf(e.target, 'data-ch');
    if(el) actRun(ACT_IN, el, 'data-ch', e.target.value);
  }, false);
  root.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.keyCode!==13) return;
    var el=actOf(e.target, 'data-kd');
    if(!el) return;
    e.preventDefault();
    actRun(ACT_KEY, el, 'data-kd');
  }, false);
}
