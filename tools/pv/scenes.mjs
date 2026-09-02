/* ---------------------------------------------------------------------------
   tools/pv/scenes.mjs — what happens, second by second.

   A scene has a name, a length in seconds, an `enter` that puts the app where
   it needs to be, and an `at(stage, k, t)` called once for every frame it is
   made of -- k running 0..1 through the scene, t the seconds into it.

   Everything the app is asked to do is sent to it as SOURCE and runs inside
   the page, so a function here may not close over anything in this file:
   every name inside one is one of the app's own globals. That is the rule
   tools/fixture.mjs is written under, for the same reason.

   THE WHOLE PHONE IS NEVER IN THE PICTURE, and that is the film's one
   structural decision. A 390-point screen shown whole inside a 1080-tall
   frame puts the app's 16px type at about 20px for somebody watching from a
   sofa: legible in a screenshot, not legible in a film.
   「携帯の画面にされると見えません」 So the camera is INSIDE the screen -- the
   app is scaled between 2.2 and 2.6 and framed on the one thing the scene is
   about, which puts that same type at 40 to 48px. What is lost is the
   device, and the device was never the product.

   Where to point is asked of the PAGE -- a selector, and the element's own
   box -- rather than written out as coordinates here, so a screen that moves
   is still framed correctly the next time the film is run.

   Fifty-nine seconds, eight scenes:

     draw       6   a letter, tap by tap, on the real editor
     alphabet   8   the letters it belongs to
     font       8   the lexicon, set in them
     word       7   one word, and what the app knows about it
     keyboard   8   a QWERTY wearing the drawn letters
     post      12   the timeline, and a line written into it
     range      6   ten interface languages, both themes
     end        4   the name
   --------------------------------------------------------------------------- */

/* ---- easing -------------------------------------------------------------
   `io` is slow at both ends, which is what a thing being LOOKED at does, as
   against a thing being thrown. Every move in the film is written as "between
   this second and that second, go from here to there". */
const io = (k) => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2, 3)/2;
const out = (k) => 1 - Math.pow(1 - k, 3);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ramp = (t, a, b) => io(clamp((t - a) / (b - a), 0, 1));
const rampO = (t, a, b) => out(clamp((t - a) / (b - a), 0, 1));
const mix = (a, b, k) => a + (b - a) * k;

export function SCENES(F){
  const wide = !F.portrait;
  const W = F.W, H = F.H;

  /* Where the middle of what we are looking at lands on the stage. In 16:9
     the app is a slab down the right with the words beside it; in 9:16 it is
     the picture, and the words sit over the top of it. */
  const ANCHOR = wide ? { x: W * 0.745, y: H * 0.50 } : { x: W * 0.50, y: H * 0.60 };
  const SCALE  = wide ? 2.4 : 2.5;

  /* An app point (ax, ay) lands on the stage anchor at scale s. #stagePhone
     is 390x844 with its transform origin in the middle, which is where the
     195 and the 422 come from. */
  const look = (ax, ay, s, dx, dy) => ({
    x: (dx === undefined ? ANCHOR.x : dx) - 195 - (ax - 195) * s,
    y: (dy === undefined ? ANCHOR.y : dy) - 422 - (ay - 422) * s,
    s: s
  });

  /* The box of something on the screen, asked of the page. */
  const box = (stage, sel) => stage.app(function(sel){
    var e = document.querySelector(sel);
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, sel);

  const TYPETOP = wide ? 0 : -640;

  /* The words rise a little as they arrive and are gone before the next
     scene's are wanted. One shape for all eight, so nothing in the film
     announces itself differently from anything else. */
  const words = (stage, t, secs, c) => {
    const inAt = c.in === undefined ? 0.4 : c.in;
    return stage.set({ type: {
      o: Math.min(ramp(t, inAt, inAt + 0.8), 1 - ramp(t, secs - 0.7, secs - 0.1)),
      y: mix(24, 0, rampO(t, inAt, inAt + 1.1)),
      top: c.top === undefined ? TYPETOP : c.top,
      kicker: c.kicker || '', head: c.head || '', sub: c.sub || ''
    }});
  };

  const nav = (stage, r, a) => stage.app(function(arg){
    go(arg.r, arg.a === null ? undefined : arg.a); render(); window.scrollTo(0, 0);
  }, { r: r, a: a === undefined ? null : a });
  const scroll = (stage, y) => stage.app(function(y){ window.scrollTo(0, y); }, y);

  /* The letter the film draws, and how long each tap takes. */
  const LT = 'z', TAP0 = 0.85, TAPGAP = 0.44;

  return [
  /* =====================================================================
     1. A letter, tap by tap. The first second has no words on it at all:
     what has to be understood first is that a person is drawing.
     ===================================================================== */
  { name: 'draw', secs: 6,
    enter: async (stage) => {
      await stage.set({ card: { o: 0 }, wash: 0, type: { o: 0 }, tap: { o: 0, x: -99, y: -99 } });
      await stage.app(function(lt){
        var l = null, i;
        for (i = 0; i < LETTERS.length; i++)
          if (String(ltName(LETTERS[i]) || '') === lt) l = LETTERS[i];
        /* Emptied first, so what appears on the canvas over the next six
           seconds is drawn there rather than recalled. */
        window.__pvLt = l.id;
        window.__pvSt = JSON.parse(JSON.stringify(l.st));
        l.st = [];
        editLetter(l.id);
        GE.st = []; GE.si = -1; GE.pi = -1; GE.seal = false;
        render();
        /* Where each tap lands ON THE SCREEN, asked of the editor's own
           mapping rather than worked out again here -- geTo is what puts a
           point where the finger left it, so the dot and the point cannot
           come apart. */
        var c = document.getElementById('gcanv'), b = c.getBoundingClientRect();
        var taps = [], j, st = window.__pvSt;
        for (i = 0; i < st.length; i++) for (j = 0; j < st[i].pts.length; j++)
          taps.push({ x: b.left + geTo(b.width, st[i].pts[j][0], 0),
                      y: b.top + geTo(b.height, st[i].pts[j][1], 1) });
        window.__pvTaps = taps;
      }, LT);
      stage.taps = await stage.app(function(){ return window.__pvTaps; });
      stage.at = await box(stage, '#gcanv');
    },
    at: async (stage, k, t) => {
      const n = stage.taps.length;
      let placed = 0;
      for (let i = 0; i < n; i++) if (t >= TAP0 + i * TAPGAP) placed = i + 1;
      await stage.app(function(upto){
        var st = window.__pvSt, next = [], seen = 0, i, j, pts;
        for (i = 0; i < st.length; i++){
          pts = [];
          for (j = 0; j < st[i].pts.length; j++){
            seen++;
            if (seen <= upto) pts.push(st[i].pts[j]);
          }
          if (pts.length) next.push({ pts: pts });
        }
        GE.st = next;
        GE.si = next.length - 1;
        GE.pi = next.length ? next[next.length - 1].pts.length - 1 : -1;
        geDraw();
      }, placed);
      /* The canvas fills the frame and creeps closer while it is drawn on. */
      const s = mix(SCALE * 1.04, SCALE * 1.14, rampO(t, 0, 6));
      const i = placed - 1;
      const since = i >= 0 ? t - (TAP0 + i * TAPGAP) : 99;
      const p = i >= 0 ? stage.taps[i] : { x: -99, y: -99 };
      const pose = look(stage.at.x, stage.at.y, s);
      pose.o = ramp(t, 0, 0.5);
      await stage.set({
        phone: pose,
        /* the dot is inside the phone, so it is scaled with everything else:
           a sixth of its own size at 2.5x is a fingertip and not a saucer */
        tap: { x: p.x, y: p.y, o: Math.max(0, 1 - since / 0.5) * 0.95,
               s: mix(0.22, 0.62, clamp(since / 0.5, 0, 1)) }
      });
      words(stage, t, 6, { in: 1.5, kicker: 'Lingua',
        head: 'Invent a <em>language</em>.',
        sub: 'It begins with one letter, drawn with a finger.' });
    } },

  /* =====================================================================
     2. The letters it belongs to.
     ===================================================================== */
  { name: 'alphabet', secs: 8,
    enter: async (stage) => {
      await stage.set({ tap: { o: 0, x: -99, y: -99 } });
      await stage.app(function(){
        var l = ltById(window.__pvLt);
        l.st = window.__pvSt;                /* the letter, put back whole */
        saveLetters(); installScriptFont(); installTypeFont();
        go('ltset', 'all'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(60, 900, io(clamp((t - 0.9) / 6.2, 0, 1)))));
      await stage.set({ phone: look(195, 430, SCALE * 0.92) });
      words(stage, t, 8, { kicker: 'The alphabet',
        head: 'An alphabet<br>nobody else has.',
        sub: 'Every letter in it is one you drew.' });
    } },

  /* =====================================================================
     3. The letters become a font, and the app is written in it.
     ===================================================================== */
  { name: 'font', secs: 8,
    enter: async (stage) => { await nav(stage, 'words'); },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(190, 1100, io(clamp((t - 0.9) / 6.4, 0, 1)))));
      await stage.set({ phone: look(195, 430, SCALE) });
      words(stage, t, 8, { kicker: 'The lexicon',
        head: 'Your letters<br>become a <em>font</em>.',
        sub: 'Every word you keep is written in them.' });
    } },

  /* =====================================================================
     4. One word, and everything the app knows about it.
     ===================================================================== */
  { name: 'word', secs: 7,
    enter: async (stage) => { await nav(stage, 'form', 'word:kano'); },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 430, io(clamp((t - 1.0) / 5.0, 0, 1)))));
      await stage.set({ phone: look(195, 400, SCALE) });
      words(stage, t, 7, { kicker: 'One word',
        head: 'A dictionary that<br>knows your words.',
        sub: 'What it sounds like, what it means, where it came from.' });
    } },

  /* =====================================================================
     5. The keyboard: a QWERTY with the drawn letters on the keys.
     ===================================================================== */
  { name: 'keyboard', secs: 8,
    enter: async (stage) => {
      await nav(stage, 'kb');
      stage.at = await box(stage, '.kb');
    },
    at: async (stage, k, t) => {
      const s = mix(SCALE * 0.96, SCALE * 1.04, rampO(t, 0, 8));
      await stage.set({ phone: look(stage.at.x, stage.at.y, s) });
      words(stage, t, 8, { kicker: 'The keyboard',
        head: 'And a keyboard<br>of your own letters.',
        sub: 'The same alphabet, on every key.' });
    } },

  /* =====================================================================
     6. The timeline, and a line being written into it.
     ===================================================================== */
  { name: 'post', secs: 12,
    enter: async (stage) => {
      await stage.app(function(){ window.__pvSent = 0; go('feed'); render(); window.scrollTo(0, 0); });
    },
    at: async (stage, k, t) => {
      let tap = { o: 0, x: -99, y: -99 };
      let focus = 430;
      if (t < 3.4){
        await scroll(stage, Math.round(mix(120, 860, io(clamp((t - 0.6) / 2.8, 0, 1)))));
      } else if (t < 3.7){
        await stage.app(function(){ window.scrollTo(0, 0); openPost('new'); render(); });
      } else if (t < 7.2){
        await stage.app(function(k){
          /* What the Lingua keyboard puts in a field is a private use code
             point per drawn letter -- that is the only thing on a phone that
             tells this alphabet's `a` from the system QWERTY's. Typing the
             roman here would show roman, which is not what somebody holding
             the phone sees. ltPuaOrder() is the app's own answer to which
             letter is which code point; nothing is worked out twice. */
          var full = 'kano mos tir', lts = ltPuaOrder(), s = '', i, j;
          for (i = 0; i < full.length; i++){
            var ch = full.charAt(i);
            if (ch === ' '){ s += ' '; continue; }
            for (j = 0; j < lts.length; j++)
              if (String(ltName(lts[j]) || '') === ch){ s += ltPua(j); break; }
          }
          var n = Math.round((k < 0 ? 0 : k > 1 ? 1 : k) * s.length);
          PW.ln = s.slice(0, n);
          PW.mn = n >= s.length ? 'a tall mountain is seen' : '';
          pwFresh(); render();
        }, (t - 3.9) / 2.6);
        focus = 200;                       /* the line being written */
      } else if (t < 7.9){
        focus = 200;
        const at = await stage.app(function(){
          var b = document.getElementById('pw-go');
          if (!b) return null;
          var r = b.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        if (at) tap = { x: at.x, y: at.y, o: Math.max(0, 1 - (t - 7.2) / 0.5) * 0.95,
                        s: mix(0.22, 0.62, clamp((t - 7.2) / 0.5, 0, 1)) };
        if (t >= 7.55) await stage.app(function(){
          if (window.__pvSent) return;
          window.__pvSent = 1;
          pwSend();
          window.scrollTo(0, 0);
        });
      } else {
        focus = 300;                       /* the post that was just made */
      }
      await stage.set({ phone: look(195, focus, SCALE), tap: tap });
      words(stage, t, 12, { kicker: 'The timeline',
        head: 'Then say<br>something in it.',
        sub: 'Every post here is in somebody’s own language.' });
    } },

  /* =====================================================================
     7. What it is in: ten interface languages, and both themes.
     ===================================================================== */
  { name: 'range', secs: 6,
    enter: async (stage) => { await nav(stage, 'build'); },
    at: async (stage, k, t) => {
      await stage.app(function(k){
        var langs = ['en','ja','ko','zh','es','fr','de','pt','it','ru'];
        var i = Math.min(langs.length - 1, Math.floor(k * langs.length));
        var want = k > 0.5 ? 'light' : 'dark';
        var move = false;
        if (SET.ui !== langs[i]){ SET.ui = langs[i]; move = true; }
        if (SET.theme !== want){ SET.theme = want; applyTheme(); move = true; }
        if (move) render();
      }, k);
      await stage.set({ phone: look(195, 300, SCALE * 0.95) });
      words(stage, t, 6, { kicker: 'Wherever you are',
        head: 'Ten languages.<br>Light and dark.',
        sub: 'The app speaks yours while you build one of your own.' });
    } },

  /* =====================================================================
     8. The name.
     ===================================================================== */
  { name: 'end', secs: 4,
    enter: async (stage) => {
      await stage.app(function(){
        SET.ui = 'en'; SET.theme = 'dark'; applyTheme(); go('feed'); render();
        window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      const pose = look(195, 300, mix(SCALE, SCALE * 1.05, out(k)));
      pose.o = 1 - ramp(t, 0.05, 0.9);
      await stage.set({
        phone: pose,
        type: { o: 0 },
        card: { o: ramp(t, 0.45, 1.3), tag: 'Build a language. Write in it.',
                foot: 'Lingua for iPhone',
                rule: Math.round(mix(0, 280, ramp(t, 0.9, 2.3))) }
      });
    } },
  ];
}
