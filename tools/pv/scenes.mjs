/* ---------------------------------------------------------------------------
   tools/pv/scenes.mjs — what happens, second by second.

   A scene has a name, a length in seconds, an `enter` that puts the app where
   it needs to be, and an `at(stage, k, t)` called once for every frame it is
   made of -- k running 0..1 through the scene, t the seconds into it.

   Everything the app is asked to do is sent to it as SOURCE and runs inside
   the page, so a function here may not close over anything in this file:
   every name inside one is one of the app's own globals. That is the rule
   tools/fixture.mjs is written under, for the same reason.

   Sixty seconds, eight scenes:

     draw       6   a letter, tap by tap, on the real editor
     alphabet   8   the thirty-eight it belongs to
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

  /* Where the phone stands. In 16:9 it is to one side with the words beside
     it; in 9:16 it is the whole frame and the words go above. A scale is
     never so large that 844 points of phone leave the top of the frame --
     that is the one mistake this list exists to prevent. */
  const POSE = wide ? {
    side:   { cx: W*0.668, cy: H*0.50, s: 1.00 },
    middle: { cx: W*0.500, cy: H*0.50, s: 1.08 },
    close:  { cx: W*0.640, cy: H*0.50, s: 1.14 },
  } : {
    side:   { cx: W*0.50, cy: H*0.585, s: 1.24 },
    middle: { cx: W*0.50, cy: H*0.560, s: 1.30 },
    close:  { cx: W*0.50, cy: H*0.575, s: 1.44 },
  };
  const at = (p, o) => ({ x: p.cx - 195, y: p.cy - 422, s: p.s, o: o === undefined ? 1 : o });
  const tween = (a, b, k, o) => ({ x: mix(a.cx, b.cx, k) - 195, y: mix(a.cy, b.cy, k) - 422,
                                   s: mix(a.s, b.s, k), o: o === undefined ? 1 : o });
  /* An offset from the middle of the frame, not a distance from the top. */
  const TYPETOP = wide ? 0 : -520;

  /* The words rise a little as they arrive and are gone before the next
     scene's are wanted. One shape for all eight, so nothing in the film
     announces itself differently from anything else. */
  const words = (stage, t, secs, c) => stage.set({ type: {
    o: Math.min(ramp(t, c.in === undefined ? 0.4 : c.in, (c.in === undefined ? 0.4 : c.in) + 0.8),
                1 - ramp(t, secs - 0.7, secs - 0.1)),
    y: mix(24, 0, rampO(t, c.in === undefined ? 0.4 : c.in, (c.in === undefined ? 0.4 : c.in) + 1.1)),
    top: c.top === undefined ? TYPETOP : c.top,
    kicker: c.kicker || '', head: c.head || '', sub: c.sub || ''
  }});

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
    },
    at: async (stage, k, t) => {
      const n = stage.taps.length;
      /* how many points are down at this instant */
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
      /* the finger: a disc that swells and fades where the tap just landed */
      const i = placed - 1;
      const since = i >= 0 ? t - (TAP0 + i * TAPGAP) : 99;
      const p = i >= 0 ? stage.taps[i] : { x: -99, y: -99 };
      await stage.set({
        phone: at(POSE.close, ramp(t, 0, 0.5)),
        tap: { x: p.x, y: p.y, o: Math.max(0, 1 - since / 0.5) * 0.95,
               s: mix(0.6, 1.7, clamp(since / 0.5, 0, 1)) }
      });
      words(stage, t, 6, { in: 1.5, kicker: 'Lingua',
        head: 'Invent a <em>language</em>.',
        sub: 'It begins with one letter, drawn with a finger.' });
    } },

  /* =====================================================================
     2. The alphabet it belongs to.
     ===================================================================== */
  { name: 'alphabet', secs: 8,
    enter: async (stage) => {
      await stage.set({ tap: { o: 0, x: -99, y: -99 } });
      await stage.app(function(){
        var l = ltById(window.__pvLt);
        l.st = window.__pvSt;                /* the letter, put back whole */
        saveLetters(); installScriptFont();
        go('ltset', 'all'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 700, io(clamp((t - 1.5) / 5.4, 0, 1)))));
      await stage.set({ phone: tween(POSE.close, POSE.side, ramp(t, 0, 1.2)) });
      words(stage, t, 8, { kicker: 'The alphabet',
        head: 'Thirty-eight<br>of your own.',
        sub: 'a to z, the two marks, and numerals that count in fives.' });
    } },

  /* =====================================================================
     3. The letters become a font, and everything is written in it.
     ===================================================================== */
  { name: 'font', secs: 8,
    enter: async (stage) => { await nav(stage, 'words'); },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 1000, io(clamp((t - 1.4) / 5.8, 0, 1)))));
      await stage.set({ phone: at(POSE.side) });
      words(stage, t, 8, { kicker: 'The lexicon',
        head: 'They become<br>a <em>font</em>.',
        sub: 'Every word you keep is set in the letters you drew.' });
    } },

  /* =====================================================================
     4. One word, and everything the app knows about it.
     ===================================================================== */
  { name: 'word', secs: 7,
    enter: async (stage) => { await nav(stage, 'form', 'word:kano'); },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 460, io(clamp((t - 1.5) / 4.6, 0, 1)))));
      await stage.set({ phone: at(POSE.side) });
      words(stage, t, 7, { kicker: 'One word',
        head: 'Sound, sense,<br>and where it came from.',
        sub: 'A dictionary that knows how your words are built.' });
    } },

  /* =====================================================================
     5. The keyboard: a QWERTY with the drawn letters on the keys.
     ===================================================================== */
  { name: 'keyboard', secs: 8,
    enter: async (stage) => { await nav(stage, 'kb'); },
    at: async (stage, k, t) => {
      await stage.set({ phone: tween(POSE.side, POSE.close, ramp(t, 0.5, 3.4)) });
      words(stage, t, 8, { kicker: 'The keyboard',
        head: 'And a keyboard<br>to write it with.',
        sub: 'Your letters on every key — on the phone itself.' });
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
      if (t < 3.4){
        await scroll(stage, Math.round(mix(0, 760, io(clamp((t - 0.7) / 2.7, 0, 1)))));
      } else if (t < 3.7){
        await stage.app(function(){ window.scrollTo(0, 0); openPost('new'); render(); });
      } else if (t < 7.2){
        await stage.app(function(k){
          /* What the Lingua keyboard puts in a field is a private use code
             point per drawn letter -- that is the only thing on a phone that
             tells this alphabet's `a` from the system QWERTY's. Typing the
             roman here would have shown roman, which is not what somebody
             holding the phone sees. ltPuaOrder() is the app's own answer to
             which letter is which code point; nothing is worked out twice. */
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
      } else if (t < 7.9){
        /* the thumb on the button that finishes it, and then the post itself */
        const at = await stage.app(function(){
          var b = document.getElementById('pw-go');
          if (!b) return null;
          var r = b.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        if (at) tap = { x: at.x, y: at.y, o: Math.max(0, 1 - (t - 7.2) / 0.5) * 0.95,
                        s: mix(0.6, 1.6, clamp((t - 7.2) / 0.5, 0, 1)) };
        if (t >= 7.55) await stage.app(function(){
          if (window.__pvSent) return;
          window.__pvSent = 1;
          pwSend();
          window.scrollTo(0, 0);
        });
      }
      await stage.set({ phone: tween(POSE.close, POSE.side, ramp(t, 0, 1.1)), tap: tap });
      words(stage, t, 12, { kicker: 'The timeline',
        head: 'Then say<br>something in it.',
        sub: 'Every post here is written in somebody\u2019s own language.' });
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
      await stage.set({ phone: at(POSE.side) });
      words(stage, t, 6, { kicker: 'Wherever you are',
        head: 'Ten languages.<br>Two themes.',
        sub: 'The app speaks yours while you build one of your own.' });
    } },

  /* =====================================================================
     8. The name.
     ===================================================================== */
  { name: 'end', secs: 4,
    enter: async (stage) => {
      await stage.app(function(){
        SET.ui = 'en'; SET.theme = 'dark'; applyTheme(); go('feed'); render();
      });
    },
    at: async (stage, k, t) => {
      await stage.set({
        phone: { x: POSE.side.cx - 195, y: POSE.side.cy - 422,
                 s: mix(POSE.side.s, POSE.side.s * 0.94, out(k)),
                 o: 1 - ramp(t, 0.05, 0.9) },
        type: { o: 0 },
        card: { o: ramp(t, 0.45, 1.3), tag: 'Build a language. Write in it.',
                foot: 'Lingua for iPhone',
                rule: Math.round(mix(0, 280, ramp(t, 0.9, 2.3))) }
      });
    } },
  ];
}
