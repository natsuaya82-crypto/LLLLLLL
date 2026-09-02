/* ---------------------------------------------------------------------------
   tools/pv/scenes.mjs — what happens, second by second.

   A scene has a name, a length in seconds, an `enter` that puts the app where
   it needs to be, and an `at(stage, k, t)` called once for every frame it is
   made of -- k running 0..1 through the scene, t the seconds into it.

   Everything the app is asked to do is sent to it as SOURCE and runs inside
   the page, so a function here may not close over anything in this file:
   every name inside one is one of the app's own globals. That is the rule
   tools/fixture.mjs is written under, for the same reason.

   THREE THINGS DECIDE HOW THIS IS CUT.

   1. THE WHOLE PHONE IS NEVER IN THE PICTURE. A 390-point screen shown whole
      inside a 1080-tall frame puts the app's 16px type at about 20px for
      somebody watching from a sofa: legible in a screenshot, not legible in a
      film. 「携帯の画面にされると見えません」 So the camera is INSIDE the
      screen -- the app is scaled 2.2 to 2.6 and framed on the one thing the
      scene is about. What is lost is the device, and the device was never
      the product.

   2. NOTHING IS EVER STILL. Every shot is either moving through the app
      (scrolling, drawing, typing) or moving on it (a slow push in), the
      screen slides in from the side when it changes, and the words arrive a
      LINE at a time rather than as a block. 「動きが少ない」

   3. THE PART NOBODY WOULD GUESS IS IN IT. Anybody can imagine a screen for
      drawing letters. Nobody guesses that you can open somebody else's
      language, take their alphabet, and read it on your own phone -- so the
      film goes and does exactly that, on the real screens, with the real
      button. 「みんなが気づかないところをちゃんとやらない？」

   Where to point is asked of the PAGE -- a selector, and the element's own
   box -- rather than written out as coordinates here, so a screen that moves
   is still framed correctly the next time the film is run.
   --------------------------------------------------------------------------- */

/* ---- easing ------------------------------------------------------------- */
const io = (k) => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2, 3)/2;
const out = (k) => 1 - Math.pow(1 - k, 3);
const out5 = (k) => 1 - Math.pow(1 - k, 5);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ramp = (t, a, b) => io(clamp((t - a) / (b - a), 0, 1));
const rampO = (t, a, b) => out(clamp((t - a) / (b - a), 0, 1));
const ramp5 = (t, a, b) => out5(clamp((t - a) / (b - a), 0, 1));
const mix = (a, b, k) => a + (b - a) * k;

/* The nine screens the wall is built from, photographed once before the film
   starts. Written here because it is a thing about the FILM -- which screens
   are worth a glance -- and not a thing about the tool. */
export const WALL_ROUTES = [
  { r:'build' }, { r:'words', y:260 }, { r:'ltset', a:'all', y:120 },
  { r:'kb' }, { r:'feed', y:200 }, { r:'gram' },
  { r:'notes' }, { r:'world' }, { r:'profile' }
];

export function SCENES(F){
  const wide = !F.portrait;
  const W = F.W, H = F.H;

  /* CUT ON THE BAR. Every shot is a whole number of bars of the track the
     film is cut to, so a cut never lands between two beats -- which is the
     difference between a film with music under it and a film cut to music.
     The length of a bar is measured off the track itself (tools/pv.mjs
     --bar) and nothing here restates it. */
  const BAR = F.bar || 1.690;
  const bars = (n) => Math.round(BAR * n * 1000) / 1000;

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
  /* A screen ARRIVES: it comes in from the right and settles. Six frames of
     it is the difference between a cut and an edit. */
  const arrive = (pose, t, from) => {
    const k = ramp5(t, 0, 0.5);
    pose.x += mix(from === undefined ? 130 : from, 0, k);
    pose.o = mix(0.15, 1, ramp(t, 0, 0.36));
    return pose;
  };

  const box = (stage, sel) => stage.app(function(sel){
    var e = document.querySelector(sel);
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, sel);

  const TYPETOP = wide ? 0 : -640;

  /* THE WORDS, a line at a time. The kicker first, then each line of the head
     wiped up from under its own edge, then the sentence -- and all of it out
     together at the end, because leaving is not where the interest is. */
  const words = (stage, t, secs, c) => {
    const inAt = c.in === undefined ? 0.30 : c.in;
    const off = secs - 0.5;
    const gone = 1 - ramp(t, off, off + 0.4);
    const lines = c.head || [];
    const lo = [], ly = [];
    for (let i = 0; i < lines.length; i++){
      const a = inAt + 0.14 + i * 0.11;
      lo.push(Math.min(ramp(t, a, a + 0.45), gone));
      ly.push(mix(1.1 * 92, 0, ramp5(t, a, a + 0.75)));
    }
    const sa = inAt + 0.16 + lines.length * 0.11;
    return stage.set({ type: {
      key: c.key, kicker: c.kicker || '', head: lines, sub: c.sub || '',
      top: c.top === undefined ? TYPETOP : c.top,
      ko: Math.min(ramp(t, inAt, inAt + 0.4), gone),
      ky: mix(14, 0, rampO(t, inAt, inAt + 0.7)),
      lo: lo, ly: ly,
      so: Math.min(ramp(t, sa, sa + 0.45), gone),
      sy: mix(16, 0, rampO(t, sa, sa + 0.7))
    }});
  };
  const noWords = (stage) => stage.set({ type: { key: 'none', kicker: '', head: [], sub: '',
    ko: 0, ky: 0, lo: [0], ly: [0], so: 0, sy: 0, top: TYPETOP } });

  const nav = (stage, r, a) => stage.app(function(arg){
    go(arg.r, arg.a === null ? undefined : arg.a); render(); window.scrollTo(0, 0);
  }, { r: r, a: a === undefined ? null : a });
  const scroll = (stage, y) => stage.app(function(y){ window.scrollTo(0, y); }, y);
  const noTap = { o: 0, x: -99, y: -99 };
  /* A thumb, where something on the screen is. Inside the phone, so it is
     scaled with everything else -- a fifth of its own size at 2.4x is a
     fingertip rather than a saucer. */
  const thumb = (at, since) => at ? { x: at.x, y: at.y,
      o: Math.max(0, 1 - since / 0.5) * 0.95,
      s: mix(0.22, 0.62, clamp(since / 0.5, 0, 1)) } : noTap;

  const LT = 'c', TAP0 = 0.7, TAPGAP = 0.55;
  const sc_draw = bars(4);
  const sc_alphabet = bars(2);
  const sc_keyboard = bars(2);
  const sc_write = bars(3);
  const sc_feed = bars(4);
  const sc_thread = bars(2);
  const sc_card = bars(2);
  const sc_seen = bars(2);
  const sc_download = bars(2);
  const sc_theirs = bars(2);
  const sc_font = bars(2);
  const sc_wall = bars(2);
  const sc_range = bars(2);
  const sc_end = bars(3);


  return [
  /* ====================== I. A LETTER, AND THE REST ==================== */

  /* A letter, tap by tap. The first second has no words on it: what has to
     be understood first is that a person is drawing. */
  { name: 'draw', secs: sc_draw,
    enter: async (stage) => {
      await stage.set({ card: { o: 0 }, wash: 0, tap: noTap, wall: { o: 0 } });
      await noWords(stage);
      await stage.app(function(lt){
        window.__pvMine = langId;          /* to come back to after theirs */
        var l = null, i;
        for (i = 0; i < LETTERS.length; i++)
          if (String(ltName(LETTERS[i]) || '') === lt) l = LETTERS[i];
        window.__pvLt = l.id;
        window.__pvSt = JSON.parse(JSON.stringify(l.st));
        l.st = [];
        editLetter(l.id);
        GE.st = []; GE.si = -1; GE.pi = -1; GE.seal = false;
        render();
        /* Where each tap lands ON THE SCREEN, asked of the editor's own
           mapping rather than worked out again here -- geTo is what puts a
           point where the finger left it, so the dot and the point cannot
           come apart. A curve is one stroke of many points; the film taps
           out the ends and the corners of it, which is what a finger does. */
        var c = document.getElementById('gcanv'), b = c.getBoundingClientRect();
        var taps = [], j, st = window.__pvSt, pts;
        for (i = 0; i < st.length; i++){
          pts = st[i].pts;
          for (j = 0; j < pts.length; j++){
            if (pts.length > 6 && j % 4 && j !== pts.length - 1) continue;
            taps.push({ x: b.left + geTo(b.width, pts[j][0], 0),
                        y: b.top + geTo(b.height, pts[j][1], 1), i: i, j: j });
          }
        }
        window.__pvTaps = taps;
      }, LT);
      stage.taps = await stage.app(function(){ return window.__pvTaps; });
      stage.at = await box(stage, '#gcanv');
    },
    at: async (stage, k, t) => {
      let placed = 0;
      for (let i = 0; i < stage.taps.length; i++) if (t >= TAP0 + i * TAPGAP) placed = i + 1;
      const upto = placed ? stage.taps[placed - 1] : null;
      await stage.app(function(u){
        var st = window.__pvSt, next = [], i, j, pts;
        for (i = 0; i < st.length; i++){
          if (!u || i > u.i) break;
          pts = [];
          for (j = 0; j < st[i].pts.length; j++){
            if (i === u.i && j > u.j) break;
            pts.push(st[i].pts[j]);
          }
          if (pts.length) next.push({ pts: pts });
        }
        GE.st = next;
        GE.si = next.length - 1;
        GE.pi = next.length ? next[next.length - 1].pts.length - 1 : -1;
        geDraw();
      }, upto);
      const i = placed - 1;
      const pose = look(stage.at.x, stage.at.y, mix(SCALE * 1.02, SCALE * 1.14, k));
      pose.o = ramp(t, 0, 0.6);
      await stage.set({ phone: pose,
        tap: thumb(i >= 0 ? stage.taps[i] : null, i >= 0 ? t - (TAP0 + i * TAPGAP) : 99) });
      words(stage, t, sc_draw, { key:'draw', in: 1.3, kicker: 'Lingua',
        head: ['Invent a <em>language</em>.'],
        sub: 'It begins with one letter, drawn with a finger.' });
    } },

  /* The alphabet it belongs to. */
  { name: 'alphabet', secs: sc_alphabet,
    enter: async (stage) => {
      await stage.set({ tap: noTap });
      await stage.app(function(){
        var l = ltById(window.__pvLt);
        l.st = window.__pvSt;                /* the letter, put back whole */
        saveLetters(); installScriptFont(); installTypeFont();
        go('ltset', 'all'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(60, 980, io(clamp((k - 0.06) / 0.88, 0, 1)))));
      await stage.set({ phone: arrive(look(195, 430, SCALE * 0.92), t) });
      words(stage, t, sc_alphabet, { key:'alpha', kicker: 'The alphabet',
        head: ['An alphabet', 'nobody else has.'],
        sub: 'Every letter in it is one you drew.' });
    } },

  /* A QWERTY wearing them. */
  { name: 'keyboard', secs: sc_keyboard,
    enter: async (stage) => {
      await nav(stage, 'kb');
      stage.at = await box(stage, '.kb');
    },
    at: async (stage, k, t) => {
      await stage.set({ phone: arrive(
        look(stage.at.x, stage.at.y, mix(SCALE * 0.96, SCALE * 1.05, k)), t) });
      words(stage, t, sc_keyboard, { key:'kb', kicker: 'The keyboard',
        head: ['And a keyboard', 'of your own letters.'],
        sub: 'The same alphabet, on every key of the phone.' });
    } },

  /* ======================= II. SAYING SOMETHING ======================== */

  /* Typed in the letters somebody drew, and sent. */
  { name: 'write', secs: sc_write,
    enter: async (stage) => {
      await stage.app(function(){ window.__pvSent = 0; window.scrollTo(0, 0); openPost('new'); render(); });
    },
    at: async (stage, k, t) => {
      let tap = noTap;
      if (t < 3.2){
        await stage.app(function(k){
          /* What the Lingua keyboard puts in a field is a private use code
             point per drawn letter -- the only thing on a phone that tells
             this alphabet's `a` from the system QWERTY's. Typing roman here
             would show roman, which is not what somebody holding the phone
             sees. ltPuaOrder() is the app's own answer to which letter is
             which code point; nothing is worked out twice. */
          var full = 'venar kel', lts = ltPuaOrder(), s = '', i, j;
          for (i = 0; i < full.length; i++){
            var ch = full.charAt(i);
            if (ch === ' '){ s += ' '; continue; }
            for (j = 0; j < lts.length; j++)
              if (String(ltName(lts[j]) || '') === ch){ s += ltPua(j); break; }
          }
          var n = Math.round((k < 0 ? 0 : k > 1 ? 1 : k) * s.length);
          PW.ln = s.slice(0, n);
          PW.mn = n >= s.length ? 'stone, in the evening' : '';
          pwFresh(); render();
        }, (t - 0.45) / 2.3);
      } else {
        const at = await stage.app(function(){
          var b = document.getElementById('pw-go');
          if (!b) return null;
          var r = b.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        tap = thumb(at, t - 3.2);
        if (t >= 3.6) await stage.app(function(){
          if (window.__pvSent) return;
          window.__pvSent = 1;
          pwSend();
          window.scrollTo(0, 0);
        });
      }
      await stage.set({ phone: arrive(look(195, 210, SCALE), t), tap: tap });
      words(stage, t, sc_write, { key:'write', kicker: 'Write in it',
        head: ['Then say', 'something in it.'],
        sub: 'The keyboard puts your own letters into the line.' });
    } },

  /* THE TIMELINE, and it is the centre of the film: four people, three
     alphabets, none of which this phone could have drawn on its own. */
  { name: 'feed', secs: sc_feed,
    enter: async (stage) => { await nav(stage, 'feed'); },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 1750, io(clamp((k - 0.05) / 0.92, 0, 1)))));
      await stage.set({ phone: arrive(look(195, 420, SCALE * 0.98), t) });
      words(stage, t, sc_feed, { key:'feed', kicker: 'The timeline',
        head: ['Everyone here', 'writes in their own.'],
        sub: 'Every line carries its own letters, so a phone that has never seen that alphabet can still read it.' });
    } },

  /* Two of them, answering each other. */
  { name: 'thread', secs: sc_thread,
    enter: async (stage) => { await nav(stage, 'thread', 'p2'); },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 460, io(clamp((k - 0.10) / 0.85, 0, 1)))));
      await stage.set({ phone: arrive(look(195, 380, SCALE * 0.98), t) });
      words(stage, t, sc_thread, { key:'thread', kicker: 'A conversation',
        head: ['Two scripts,', 'one thread.'],
        sub: 'Answered in a language the other person does not have.' });
    } },

  /* A line of it, as a picture that leaves the phone. */
  { name: 'card', secs: sc_card,
    enter: async (stage) => {
      await stage.app(function(){ cardOpen('p', 'p1'); render(); window.scrollTo(0, 0); });
      stage.at = await box(stage, '.cardwrap, canvas');
    },
    at: async (stage, k, t) => {
      const c = stage.at || { x: 195, y: 300 };
      await stage.set({ phone: arrive(
        look(c.x, c.y, mix(SCALE * 1.0, SCALE * 1.08, k)), t) });
      words(stage, t, sc_card, { key:'card', kicker: 'A card',
        head: ['And a picture', 'of what you wrote.'],
        sub: 'Ready to leave the phone, in your letters.' });
    } },

  /* ========================= III. SOMEBODY ELSE'S ====================== */

  { name: 'seen', secs: sc_seen,
    enter: async (stage) => {
      await stage.app(function(){ go('about', 'seen-vethi'); render(); window.scrollTo(0, 0); });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(0, 200, io(clamp((k - 0.12) / 0.82, 0, 1)))));
      await stage.set({ phone: arrive(look(195, 340, SCALE * 0.96), t) });
      words(stage, t, sc_seen, { key:'seen', kicker: 'Somebody else\u2019s',
        head: ['Other people', 'publish theirs.'],
        sub: 'A whole language of somebody else\u2019s, written up as a page.' });
    } },

  /* Taken -- with the real button, which really adds it. */
  { name: 'download', secs: sc_download,
    enter: async (stage) => {
      await stage.app(function(){
        ABOPEN.wlddl = true; go('about', 'seen-vethi'); render();
        window.scrollTo(0, 260);
      });
      stage.at = await stage.app(function(){
        var b = document.querySelector('[data-do="wldGet"]');
        if (!b) return null;
        var r = b.getBoundingClientRect();
        return { x: r.right - 22, y: r.top + r.height / 2 };
      });
    },
    at: async (stage, k, t) => {
      let tap = noTap;
      if (t >= 0.9){
        tap = thumb(stage.at, t - 0.9);
        if (t >= 1.3) await stage.app(function(){
          if (window.__pvGot) return;
          window.__pvGot = 1;
          wldGet('seen-vethi', 'letters');
        });
      }
      await stage.set({ phone: arrive(look(195, 430, SCALE), t), tap: tap });
      words(stage, t, sc_download, { key:'dl', kicker: 'Take it',
        head: ['Their alphabet,', 'on your phone.'],
        sub: 'One tap, and nothing of yours is touched.' });
    } },

  /* And read in their letters, which are not built like yours. */
  { name: 'theirs', secs: sc_theirs,
    enter: async (stage) => {
      await stage.app(function(){
        langOpen('seen-vethi');
        SET.myfont = true;
        installScriptFont(); installTypeFont();
        go('ltset', 'all'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(40, 460, io(clamp((k - 0.10) / 0.85, 0, 1)))));
      await stage.set({ phone: arrive(look(195, 430, SCALE * 0.92), t) });
      words(stage, t, sc_theirs, { key:'theirs', kicker: 'And read it',
        head: ['Built nothing', 'like your own.'],
        sub: 'Their letters, opened on your phone.' });
    } },

  /* ============================ IV. THE REST =========================== */

  /* The dictionary, set in the letters. */
  { name: 'font', secs: sc_font,
    enter: async (stage) => {
      await stage.app(function(){ langOpen(window.__pvMine); go('words'); render(); window.scrollTo(0, 0); });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(190, 1100, io(clamp((k - 0.08) / 0.88, 0, 1)))));
      await stage.set({ phone: arrive(look(195, 430, SCALE), t) });
      words(stage, t, sc_font, { key:'font', kicker: 'The lexicon',
        head: ['Your letters', 'become a <em>font</em>.'],
        sub: 'Every word you keep is written in them.' });
    } },

  /* Everything else there is, at a glance. */
  { name: 'wall', secs: sc_wall,
    enter: async (stage) => {
      await stage.app(function(){ go('build'); render(); });
      await stage.set({ phone: { x: 0, y: 0, s: 1, o: 0 } });
    },
    at: async (stage, k, t) => {
      const cols = F.portrait ? 2 : 3, rows = 3;
      const ts = [];
      for (let i = 0; i < 9; i++){
        const cx = i % cols, cy = Math.floor(i / cols);
        const gx = (F.portrait ? 470 : 500), gy = 560;
        const x = W / 2 - 195 + (cx - (cols - 1) / 2) * gx;
        const y = H / 2 - 422 + (cy - (rows - 1) / 2) * gy;
        const a = 0.10 + (cx + cy) * 0.09;
        ts.push({ x: x, y: y, s: 0.62,
                  o: Math.min(ramp(t, a, a + 0.45), 1 - ramp(t, sc_wall - 0.6, sc_wall - 0.2)) });
      }
      await stage.set({ wall: {
        o: 1, s: mix(1.0, 1.14, k),
        x: mix(60, -60, k), y: mix(60, -70, k),
        tiles: ts } });
      words(stage, t, sc_wall, { key:'wall', in: 0.4, kicker: 'All of it',
        head: ['Phonology. Grammar.', 'Notes. Numbers.'],
        sub: 'A book with chapters, not a screen with buttons.' });
    } },

  /* Ten interface languages, and both themes. */
  { name: 'range', secs: sc_range,
    enter: async (stage) => {
      await stage.set({ wall: { o: 0 } });
      await nav(stage, 'build');
    },
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
      await stage.set({ phone: arrive(look(195, 300, SCALE * 0.95), t) });
      words(stage, t, sc_range, { key:'range', kicker: 'Wherever you are',
        head: ['Ten languages.', 'Light and dark.'],
        sub: 'The app speaks yours while you build one of your own.' });
    } },

  /* The name. */
  { name: 'end', secs: sc_end,
    enter: async (stage) => {
      await stage.app(function(){
        SET.ui = 'en'; SET.theme = 'dark'; applyTheme(); go('feed'); render();
        window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      const pose = look(195, 300, mix(SCALE, SCALE * 1.06, out(k)));
      pose.o = 1 - ramp(t, 0.05, 0.85);
      await noWords(stage);
      await stage.set({
        phone: pose,
        card: { o: ramp(t, 0.45, 1.3), tag: 'Build a language. Write in it.',
                foot: 'Lingua for iPhone',
                mark: mix(1.14, 1, out(clamp((t - 0.45) / 1.4, 0, 1))),
                rule: Math.round(mix(0, 280, ramp(t, 0.9, 2.3))) }
      });
    } },
  ];
}
