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

  /* 16:9 puts the app down one side with the words beside it. 9:16 is the
     same shape as the phone, so the app IS the frame and the words sit over
     the top of it -- and the two scales are much closer together, because
     there is no room to fly in from a long way out. */
  const ANCHOR = wide ? { x: W * 0.745, y: H * 0.50 } : { x: W * 0.50, y: H * 0.615 };
  const SCALE  = wide ? 2.4 : 2.42;

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

  /* THE CAMERA IS OUTSIDE THE PHONE, AND FLIES INTO THE SCREEN.
     「タップしてその画面にブーンって全体が移動してまたiPhoneが出てくる」
     A shot that begins wide shows the whole device -- shell, corners and all
     -- something is tapped, and the picture goes in through the screen until
     the device is off the frame and the app is all there is. The frame is
     blurred while it is moving, which is what makes it read as a camera
     rather than as a jump. */
  const WIDE = () => look(195, 422, wide ? 0.95 : 1.60);
  const dive = (target, s, k) => {
    const w = WIDE(), c = look(target.x, target.y, s);
    const e = io(clamp(k, 0, 1));
    return { x: mix(w.x, c.x, e), y: mix(w.y, c.y, e), s: mix(w.s, c.s, e),
             shell: 1 - clamp(k / 0.42, 0, 1),
             radius: mix(46, 0, clamp(k / 0.5, 0, 1)),
             blur: 7 * Math.pow(Math.sin(Math.PI * clamp(k, 0, 1)), 1.5) };
  };
  /* Where something on the screen IS, asked of the page. */
  const hit = (stage, sel) => stage.app(function(sel){
    var e = document.querySelector(sel);
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);

  const box = (stage, sel) => stage.app(function(sel){
    var e = document.querySelector(sel);
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, sel);

  const TYPETOP = wide ? 0 : -655;

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
      key: (c.key || '') + (F.vo ? '-v' : ''), kicker: c.kicker || '', head: lines,
      top: c.top === undefined ? TYPETOP : c.top,
      sub: F.vo ? '' : (c.sub || ''),
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
  /* The disc is inside the phone, so it is scaled with everything else: what
     is a fingertip at 2.4x is a speck at 0.95x. `m` is how much bigger it has
     to be drawn while the camera is still outside. */
  const thumb = (at, since, m) => at ? { x: at.x, y: at.y,
      o: Math.max(0, 1 - since / 0.5) * 0.95,
      s: mix(0.22, 0.62, clamp(since / 0.5, 0, 1)) * (m || 1) } : noTap;

  const LT = 'c', TAP0 = 0.55, TAPGAP = 0.5;
  const sc_draw = bars(4);
  const sc_alphabet = bars(2);
  const sc_keyboard = bars(3);
  const sc_write = bars(3);
  const sc_feed = bars(4);
  const sc_card = bars(2);
  const sc_seen = bars(3);
  const sc_download = bars(2);
  const sc_theirs = bars(2);
  const sc_font = bars(2);
  const sc_wall = bars(2);
  const sc_range = bars(2);
  const sc_end = bars(3);
  /* A shot that starts outside the phone: how long it is held wide, when
     the finger lands, and how long the flight in takes. */
  const HOLD = 0.55, TAPAT = 0.62, FLY0 = 0.8, FLY = 0.7;

  const WIDECUT = [
  /* ====================== I. A LETTER, AND THE REST ==================== */

  /* A letter, tap by tap. The first second has no words on it: what has to
     be understood first is that a person is drawing. */
  /* THE FILM OPENS OUTSIDE THE PHONE. The whole device is in the frame, on
     the alphabet, with one slot still empty. A finger lands on it, and the
     picture goes in through the screen and does not come back out for two
     shots. */
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
        l.st = [];                          /* the slot the film draws into */
        saveLetters();
        go('ltset', 'all'); render(); window.scrollTo(0, 0);
      }, LT);
      /* the tile of that letter, on the grid, where the finger will land */
      stage.tile = await stage.app(function(id){
        var b = document.querySelector('[data-do="editLetter"][data-a*="' + id + '"]');
        if (!b) return null;
        var r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, await stage.app(function(){ return window.__pvLt; }));
      stage.taps = null;
    },
    at: async (stage, k, t) => {
      let tap = noTap;
      if (t < FLY0){
        /* outside: the whole phone, and a finger on the empty slot */
        tap = thumb(stage.tile, t - TAPAT, 2.6);
        await stage.set({ phone: Object.assign(dive(stage.tile || { x:195, y:422 }, SCALE, 0),
                                               { o: ramp(t, 0, 0.5) }) });
      } else {
        if (!stage.taps){
          /* the tap OPENS it, and the camera goes in after it */
          await stage.app(function(){
            editLetter(window.__pvLt);
            GE.st = []; GE.si = -1; GE.pi = -1; GE.seal = false;
            render();
            var c = document.getElementById('gcanv'), b = c.getBoundingClientRect();
            var taps = [], i, j, st = window.__pvSt, pts;
            for (i = 0; i < st.length; i++){
              pts = st[i].pts;
              for (j = 0; j < pts.length; j++){
                if (pts.length > 6 && j % 4 && j !== pts.length - 1) continue;
                taps.push({ x: b.left + geTo(b.width, pts[j][0], 0),
                            y: b.top + geTo(b.height, pts[j][1], 1), i: i, j: j });
              }
            }
            window.__pvTaps = taps;
          });
          stage.taps = await stage.app(function(){ return window.__pvTaps; });
          stage.at = await box(stage, '#gcanv');
        }
        const since = t - FLY0;
        const T0 = FLY + 0.25;
        let placed = 0;
        for (let i = 0; i < stage.taps.length; i++)
          if (since >= T0 + i * TAPGAP) placed = i + 1;
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
        tap = thumb(i >= 0 ? stage.taps[i] : null, i >= 0 ? since - (T0 + i * TAPGAP) : 99);
        const pose = dive(stage.at, SCALE * mix(1.02, 1.12, clamp((since - FLY) / 4, 0, 1)),
                          clamp(since / FLY, 0, 1));
        await stage.set({ phone: pose });
      }
      await stage.set({ tap: tap });
      words(stage, t, sc_draw, { key:'draw', in: 1.9, kicker: 'Lingua',
        head: ['Invent a <em>language</em>.'],
        sub: 'It begins with one letter, drawn with a finger.' });
    } },

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
  /* AND THE PHONE IS BACK. Out of the screen, onto the contents page, a
     finger on the chapter, and in again. */
  { name: 'keyboard', secs: sc_keyboard,
    enter: async (stage) => {
      await stage.app(function(){ go('build'); render(); window.scrollTo(0, 0); });
      stage.tile = await hit(stage, '[data-do="go"][data-a*="kb"]');
      stage.at = null;
    },
    at: async (stage, k, t) => {
      let tap = noTap;
      if (t < FLY0){
        tap = thumb(stage.tile, t - TAPAT, 2.6);
        await stage.set({ phone: dive(stage.tile || { x:195, y:422 }, SCALE, 0) });
      } else {
        if (!stage.at){
          await stage.app(function(){ go('kb'); render(); window.scrollTo(0, 0); });
          stage.at = await box(stage, '.kb');
        }
        const since = t - FLY0;
        await stage.set({ phone: dive(stage.at,
          SCALE * mix(0.96, 1.03, clamp((since - FLY) / 3, 0, 1)), clamp(since / FLY, 0, 1)) });
      }
      await stage.set({ tap: tap });
      words(stage, t, sc_keyboard, { key:'kb', in: 1.6, kicker: 'The keyboard',
        head: ['And a keyboard', 'of your own letters.'],
        sub: 'The same alphabet, on every key of the phone.' });
    } },

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

  /* OUT AGAIN, onto somebody else's profile, and in through the row that
     names their language. It is the app's own door: a profile carries that
     row exactly when the person has published (www/me.js). */
  { name: 'seen', secs: sc_seen,
    enter: async (stage) => {
      await stage.app(function(){ go('profile', 'iri'); render(); window.scrollTo(0, 0); });
      stage.tile = await hit(stage, '.wldrow');
      stage.at = null;
    },
    at: async (stage, k, t) => {
      let tap = noTap;
      if (t < FLY0){
        tap = thumb(stage.tile, t - TAPAT, 2.6);
        await stage.set({ phone: dive(stage.tile || { x:195, y:422 }, SCALE, 0) });
      } else {
        if (!stage.at){
          await stage.app(function(){ go('about', 'seen-vethi'); render(); window.scrollTo(0, 0); });
          stage.at = { x: 195, y: 340 };
        }
        const since = t - FLY0;
        await scroll(stage, Math.round(mix(0, 190, io(clamp((since - FLY) / 2.2, 0, 1)))));
        await stage.set({ phone: dive(stage.at, SCALE * 0.96, clamp(since / FLY, 0, 1)) });
      }
      await stage.set({ tap: tap });
      words(stage, t, sc_seen, { key:'seen', in: 1.6, kicker: 'Somebody else\u2019s',
        head: ['Other people', 'publish theirs.'],
        sub: 'A whole language of somebody else\u2019s, written up as a page.' });
    } },

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
      const cols = 3, rows = 3;
      const ts = [];
      for (let i = 0; i < 9; i++){
        const cx = i % cols, cy = Math.floor(i / cols);
        const gx = (F.portrait ? 348 : 500), gy = (F.portrait ? 430 : 560);
        const x = W / 2 - 195 + (cx - (cols - 1) / 2) * gx;
        const y = H / 2 - 422 + (cy - (rows - 1) / 2) * gy;
        const a = 0.10 + (cx + cy) * 0.09;
        ts.push({ x: x, y: y, s: F.portrait ? 0.44 : 0.62,
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
  /* AND OUT, all the way, until the phone is a phone again. */
  { name: 'end', secs: sc_end,
    enter: async (stage) => {
      await stage.app(function(){
        SET.ui = 'en'; SET.theme = 'dark'; applyTheme();
        langOpen(window.__pvMine); go('feed'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      const back = 1 - clamp(t / 0.9, 0, 1);          /* 1 = inside, 0 = wide */
      const pose = dive({ x: 195, y: 300 }, SCALE, back);
      pose.o = 1 - ramp(t, 1.5, 2.3);
      await noWords(stage);
      await stage.set({
        phone: pose,
        card: { o: ramp(t, 1.7, 2.6), tag: 'Build a language. Write in it.',
                foot: 'Lingua for iPhone',
                mark: mix(1.14, 1, out(clamp((t - 1.7) / 1.4, 0, 1))),
                rule: Math.round(mix(0, 280, ramp(t, 2.2, 3.4))) }
      });
    } },

  ];

  /* =====================================================================
     9:16 IS A DIFFERENT FILM, not the same one stood on its end.
     「同じのダメだよー」

     A phone held in a hand is watched with a thumb over the bottom of it,
     muted, for about a second before somebody decides. So: thirty seconds
     rather than sixty, the app edge to edge with no frame round it at all,
     the words big and short in the bottom third, and the HOOK FIRST -- the
     timeline, three alphabets at once, before anything has been explained.
     The wide cut is a story that starts at the beginning; this one starts
     at the strangest thing in the app and works backwards.
     ===================================================================== */
  const FULL = W / 390;                    /* the app, exactly frame-wide */
  const eye = (ay, dy) => look(195, ay, FULL, W / 2, dy === undefined ? H * 0.5 : dy);
  /* Two bars a shot, except the alphabet, which is a glance rather than a
     beat -- and one bar is what makes the whole thing fit inside the thirty
     seconds an App Store preview is allowed. Seventeen bars is 28.7s. */
  const sc = bars(2), scq = bars(1);
  /* One short line, in the bottom third, with nothing under it. */
  const line = (stage, t, head, len, lift) => {
    const L = len === undefined ? sc : len;
    const gone = 1 - ramp(t, L - 0.45, L - 0.1);
    return stage.set({ type: {
      key: 'v-' + head, kicker: '', head: head ? [head] : [], sub: '',
      top: 0, lift: lift || 0, ko: 0, ky: 0,
      lo: [Math.min(ramp(t, 0.22, 0.7), gone)],
      ly: [mix(96, 0, ramp5(t, 0.22, 1.0))],
      so: 0, sy: 0
    }});
  };

  const TALLCUT = [
  /* THE HOOK: a timeline nobody can read, and three people writing in it. */
  { name: 'hook', secs: sc,
    enter: async (stage) => {
      await stage.set({ card: { o: 0 }, wash: 0, tap: noTap, wall: { o: 0 } });
      await stage.app(function(){
        window.__pvMine = langId;
        go('feed'); render(); window.scrollTo(0, 260);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(260, 1500, io(clamp(k / 0.94, 0, 1)))));
      await stage.set({ phone: { x: eye(422).x, y: eye(422).y, s: FULL,
                                 shell: 0, radius: 0, blur: 0, o: ramp(t, 0, 0.4) } });
      line(stage, t, 'Nobody here shares an alphabet.');
    } },

  /* Where they come from: a finger. */
  { name: 'draw', secs: sc,
    enter: async (stage) => {
      await stage.app(function(lt){
        var l = null, i;
        for (i = 0; i < LETTERS.length; i++)
          if (String(ltName(LETTERS[i]) || '') === lt) l = LETTERS[i];
        window.__pvLt = l.id;
        window.__pvSt = JSON.parse(JSON.stringify(l.st));
        l.st = [];
        editLetter(l.id);
        GE.st = []; GE.si = -1; GE.pi = -1; GE.seal = false;
        render();
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
      const T0 = 0.35, GAP = 0.34;
      let placed = 0;
      for (let i = 0; i < stage.taps.length; i++) if (t >= T0 + i * GAP) placed = i + 1;
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
        GE.st = next; GE.si = next.length - 1;
        GE.pi = next.length ? next[next.length - 1].pts.length - 1 : -1;
        geDraw();
      }, upto);
      const i = placed - 1;
      const p = eye(stage.at.y, H * 0.44);
      await stage.set({
        phone: { x: p.x, y: p.y, s: FULL * mix(1, 1.06, k), shell: 0, radius: 0, blur: 0 },
        tap: thumb(i >= 0 ? stage.taps[i] : null, i >= 0 ? t - (T0 + i * GAP) : 99) });
      line(stage, t, 'Every letter is drawn.');
    } },

  { name: 'alpha', secs: scq,
    enter: async (stage) => {
      await stage.set({ tap: noTap });
      await stage.app(function(){
        var l = ltById(window.__pvLt);
        l.st = window.__pvSt;
        saveLetters(); installScriptFont(); installTypeFont();
        go('ltset', 'all'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(60, 760, io(clamp(k / 0.92, 0, 1)))));
      const p = eye(400, H * 0.44);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0 } });
      line(stage, t, 'Yours as well.', scq);
    } },

  { name: 'keys', secs: sc,
    enter: async (stage) => {
      await stage.app(function(){ go('kb'); render(); window.scrollTo(0, 0); });
      stage.at = await box(stage, '.kb');
    },
    at: async (stage, k, t) => {
      const p = eye(stage.at.y, H * 0.42);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL * mix(1, 1.05, k),
                                 shell: 0, radius: 0, blur: 0 } });
      line(stage, t, 'On every key.');
    } },

  { name: 'write', secs: sc,
    enter: async (stage) => {
      await stage.app(function(){ window.__pvSent = 0; window.scrollTo(0, 0); openPost('new'); render(); });
    },
    at: async (stage, k, t) => {
      let tap = noTap;
      if (t < 1.9){
        await stage.app(function(k){
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
        }, (t - 0.15) / 1.5);
      } else {
        const at = await stage.app(function(){
          var b = document.getElementById('pw-go');
          if (!b) return null;
          var r = b.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        tap = thumb(at, t - 1.9, 1);
        if (t >= 2.25) await stage.app(function(){
          if (window.__pvSent) return;
          window.__pvSent = 1; pwSend(); window.scrollTo(0, 0);
        });
      }
      const p = eye(t < 2.6 ? 260 : 330, H * 0.40);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0 },
                        tap: tap });
      line(stage, t, 'Write in it.');
    } },

  { name: 'seen', secs: sc,
    enter: async (stage) => {
      await stage.app(function(){
        ABOPEN.wlddl = true; go('about', 'seen-vethi'); render(); window.scrollTo(0, 250);
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
      if (t >= 1.5){
        tap = thumb(stage.at, t - 1.5, 1);
        if (t >= 1.85) await stage.app(function(){
          if (window.__pvGot) return;
          window.__pvGot = 1; wldGet('seen-vethi', 'letters');
        });
      }
      const p = eye(420, H * 0.44);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0 },
                        tap: tap });
      line(stage, t, 'Take somebody else\u2019s.');
    } },

  { name: 'theirs', secs: sc,
    enter: async (stage) => {
      await stage.app(function(){
        langOpen('seen-vethi'); SET.myfont = true;
        installScriptFont(); installTypeFont();
        go('ltset', 'all'); render(); window.scrollTo(0, 40);
      });
    },
    at: async (stage, k, t) => {
      await scroll(stage, Math.round(mix(40, 380, io(clamp(k / 0.9, 0, 1)))));
      const p = eye(400, H * 0.44);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0 } });
      line(stage, t, 'Read it on your phone.');
    } },

  { name: 'range', secs: sc,
    enter: async (stage) => {
      await stage.app(function(){ langOpen(window.__pvMine); go('build'); render(); window.scrollTo(0, 0); });
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
      const p = eye(330, H * 0.42);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0 } });
      line(stage, t, 'Ten languages. Light and dark.');
    } },

  { name: 'end', secs: sc,
    enter: async (stage) => {
      await stage.app(function(){
        SET.ui = 'en'; SET.theme = 'dark'; applyTheme(); go('feed'); render(); window.scrollTo(0, 0);
      });
    },
    at: async (stage, k, t) => {
      const p = eye(330, H * 0.44);
      await noWords(stage);
      await stage.set({
        phone: { x: p.x, y: p.y, s: FULL * mix(1, 1.05, out(k)), shell: 0, radius: 0,
                 blur: 0, o: 1 - ramp(t, 0.1, 0.8) },
        card: { o: ramp(t, 0.5, 1.2), tag: 'Build a language. Write in it.',
                foot: 'Lingua for iPhone',
                mark: mix(1.14, 1, out(clamp((t - 0.5) / 1.2, 0, 1))),
                rule: Math.round(mix(0, 260, ramp(t, 0.9, 2.2))) }
      });
    } },
  ];

  /* =====================================================================
     THE TYPING FILM. 「キーボードで入力してるのを動画にしたいね」
     「キーボードがちゃんと動いてるように見せたいのよ」

     THE BOARD IS THE APP'S OWN, NOT A DRAWING OF ONE. `kbHTML(null, true)`
     is the same call the keyboard screen makes -- same layout, same drawn
     letters, same key widths, the QWERTY's inset third row and all -- so
     nothing about the keyboard is written down twice and a key that moves
     in the app moves here on the next run.

     WHAT THE FILM DOES IS PUT IT WHERE iOS PUTS IT. On a phone the board
     under the field is drawn by iOS from ios/App/LinguaKeyboard, and no
     browser can show an iOS keyboard extension, so the one composite in
     this film is the board standing at the foot of the screen. Everything
     else is the app running.

     AND IT IS WORKING, not miming. A key puts a private use code point in
     the field -- one per drawn letter, which is the only thing on a phone
     that tells this alphabet's `a` from the system QWERTY's -- and the
     letter that lands is the letter of the key the thumb is on, found
     through the `data-lt` every read-only letter key carries.

     AND IT MEASURES WHAT THE PHONE'S MEASURES. The app's board is its own
     drawing -- index.html says so over `--kh`, "not what goes to the phone"
     -- so the film puts the EXTENSION's numbers on it: the key's corner, the
     3pt between keys, and a row that is 0.1385 of the phone's short side.
     All three are read out of the Swift by tools/pv.mjs (`kbm`) rather than
     written down here, because one number in two languages is the thing that
     drifts. The colours are the two the extension asks UIKit for by name --
     a letter key `secondarySystemBackground`, everything else
     `tertiarySystemFill`, and `systemFill` while a key is held -- in their
     dark-mode values, which is the one place the film has to say a number
     iOS would have said.
     ===================================================================== */
  /* THE KEYBOARD IS THE PHONE'S OWN, PHOTOGRAPHED, wearing this language's
     letters. tools/pv/kbswap.mjs makes it: the owner's screenshot of the real
     Lingua keyboard with the letters taken off and these ones put on, key by
     key, at rects worked out from the layout the app hands over and the
     arithmetic in KeyBoardView.layoutSubviews. So the backdrop, the gaps,
     ⌫ and ⏎ and the space bar, the globe and the microphone are a phone, and
     the letters on the keys are this film's language.

     It is placed where iOS places it and nothing else about it is touched.
     The one thing the film draws is the key going down under the finger, and
     that is a `screen` blend so the letter on the key stays white -- on the
     phone the highlight is BEHIND the glyph, and a wash over the top would
     dim the one thing the shot is about. rgb(38,38,40) screened onto the key
     lands on 62, which is `systemFill` over `secondarySystemBackground`:
     what KeyView.hold() gives. */
  const KBIM = F.kbreal;                    /* px, and where every letter is */
  const KBSC = KBIM ? 390 / KBIM.w : 1;     /* the picture, at phone width */
  const KBH = KBIM ? KBIM.h * KBSC : 0;
  const KBFOOT = 693;                       /* the bottom edge of the frame */
  const KBTOP = KBFOOT - KBH;
  const kbBox = (i) => {                    /* a key, in the app's points */
    const k = KBIM.keys[i];
    return { x: k.x * KBSC, y: KBTOP + k.y * KBSC, w: k.w * KBSC, h: k.h * KBSC };
  };
  const kbMid = (i) => { const b = kbBox(i); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };

  const kbOn = (stage) => stage.app(function(o){
    var d = document.getElementById('pvkb');
    if (!d){ d = document.createElement('div'); d.id = 'pvkb'; document.body.appendChild(d); }
    d.style.cssText = 'position:fixed;left:0;right:0;top:' + o.top + 'px;z-index:60;' +
      'line-height:0;will-change:transform';
    d.innerHTML =
      '<img src="/pv/kbreal.png" style="display:block;width:390px">' +
      '<div id="pvkbdn" style="position:absolute;border-radius:' + o.radius + 'px;' +
      'background:rgb(38,38,40);mix-blend-mode:screen;opacity:0"></div>';
    /* the line, in the code points the keyboard puts in, and the order of the
       keys it comes off */
    var full = 'venar kel', lts = ltPuaOrder(), s = '', seq = [], i, j;
    for (i = 0; i < full.length; i++){
      var ch = full.charAt(i), id = null;
      if (ch === ' ') s += ' ';
      else for (j = 0; j < lts.length; j++)
        if (String(ltName(lts[j]) || '') === ch){ s += ltPua(j); id = lts[j].id; break; }
      seq.push(id);
    }
    window.__pvS = s; window.__pvSeq = seq;
  }, { top: KBTOP, radius: (KBIM ? 15 * KBSC : 5) });
  const kbOff = (stage) => stage.app(function(){
    var d = document.getElementById('pvkb');
    if (d) d.parentNode.removeChild(d);
  });
  /* One call a frame: how far up the board has come, how much of the line is
     in, and which key is down. Together, because they are one act. */
  const kbAt = (stage, o) => stage.app(function(o){
    var d = document.getElementById('pvkb');
    if (!d) return;
    d.style.transform = 'translateY(' + o.up.toFixed(1) + 'px)';
    var s = window.__pvS.slice(0, o.n);
    if (PW.ln !== s){ PW.ln = s; pwFresh(); render(); }
    var e = document.getElementById('pvkbdn');
    if (!e) return;
    if (o.box){
      e.style.opacity = 1;
      e.style.left = o.box.x + 'px'; e.style.top = (o.box.y - o.top) + 'px';
      e.style.width = o.box.w + 'px'; e.style.height = o.box.h + 'px';
    } else e.style.opacity = 0;
  }, o);
  /* The window is the app's top 693 points -- 1920 tall at frame-wide -- so
     the keyboard's foot lands on the frame's bottom edge and the field is at
     the top of the picture, which is where both of them are on a phone. */
  const deck = () => eye(346, H * 0.5);
  /* A letter every four tenths of a second: slower than somebody typing,
     because every one of them has to be read. */
  const T0 = 1.05, GAP = 0.42, NCH = 9, DOWN = 0.15;
  /* which key of the picture each letter of the line comes off */
  const kbIdx = (id) => { for (let i = 0; i < KBIM.keys.length; i++) if (KBIM.keys[i].lt === id) return i; return -1; };

  const TYPECUT = [
  { name: 'keys', secs: sc,
    enter: async (stage) => {
      await stage.set({ card: { o: 0 }, wash: 0, tap: noTap, wall: { o: 0 }, fade: 1 });
      await stage.app(function(){ window.__pvMine = langId; go('kb'); render(); window.scrollTo(0, 0); });
      stage.at = await box(stage, '.kb');
    },
    at: async (stage, k, t) => {
      const p = eye(stage.at.y, H * 0.42);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL * mix(1, 1.07, out(k)),
                                 shell: 0, radius: 0, blur: 0, o: ramp(t, 0, 0.35) } });
      line(stage, t, 'A keyboard of your own letters.');
    } },

  { name: 'type', secs: bars(4),
    enter: async (stage) => {
      await stage.set({ fade: 0 });
      await stage.app(function(){ window.__pvSent = 0; window.scrollTo(0, 0); openPost('new'); render(); });
      await kbOn(stage);
      const seq = await stage.app(function(){ return window.__pvSeq; });
      stage.seq = seq.map(kbIdx);
    },
    at: async (stage, k, t) => {
      /* it comes UP, the way a keyboard does */
      const up = mix(KBH, 0, out(clamp(t / 0.55, 0, 1)));
      let n = 0;
      for (let i = 0; i < NCH; i++) if (t >= T0 + i * GAP) n = i + 1;
      const i = n - 1;
      const since = i >= 0 ? t - (T0 + i * GAP) : 99;
      const ki = i >= 0 ? stage.seq[i] : -1;
      await kbAt(stage, { up: up, n: n, top: KBTOP,
                          box: (ki >= 0 && since < DOWN) ? kbBox(ki) : null });
      const p = deck();
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0,
                                 o: ramp(t, 0, 0.3) },
                        tap: thumb(ki >= 0 ? kbMid(ki) : null, since, 1.5) });
      line(stage, t, 'Every key is a letter you drew.', bars(4), 860);
    } },

  /* AND WHAT IT SAYS -- WHICH THE APP FILLS IN ITSELF. `pwMn()` is the app's
     own answer to what a line means, read word by word out of the person's
     dictionary: `venar kel` comes back `evening stone` because those are the
     two words they wrote. Nothing here types it; the shot holds while the
     app does. */
  { name: 'mean', secs: sc,
    at: async (stage, k, t) => {
      const p = deck();
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL, shell: 0, radius: 0, blur: 0 },
                        tap: noTap });
      line(stage, t, 'Your own dictionary reads it back.', sc, 860);
    } },

  { name: 'sent', secs: sc,
    enter: async (stage) => { await kbOff(stage); await stage.set({ tap: noTap, fade: 1 }); },
    at: async (stage, k, t) => {
      let tap = noTap;
      const at = await hit(stage, '#pw-go');
      if (t < 1.1) tap = thumb(at, t - 0.35, 1);
      if (t >= 0.75) await stage.app(function(){
        if (window.__pvSent) return;
        window.__pvSent = 1; pwSend(); window.scrollTo(0, 0);
      });
      const p = eye(300, H * 0.42);
      await stage.set({ phone: { x: p.x, y: p.y, s: FULL * mix(1, 1.04, out(clamp((t - 1.1) / 2, 0, 1))),
                                 shell: 0, radius: 0, blur: 0 },
                        tap: tap });
      line(stage, t, 'Say it in your own alphabet.');
    } },

  { name: 'end', secs: sc,
    at: async (stage, k, t) => {
      const p = eye(330, H * 0.44);
      await noWords(stage);
      await stage.set({
        phone: { x: p.x, y: p.y, s: FULL * mix(1, 1.05, out(k)), shell: 0, radius: 0,
                 blur: 0, o: 1 - ramp(t, 0.1, 0.8) },
        card: { o: ramp(t, 0.5, 1.2), tag: 'Build a language. Write in it.',
                foot: 'Lingua for iPhone',
                mark: mix(1.14, 1, out(clamp((t - 0.5) / 1.2, 0, 1))),
                rule: Math.round(mix(0, 260, ramp(t, 0.9, 2.2))) }
      });
    } },
  ];

  return F.cut === 'type' ? TYPECUT : F.portrait ? TALLCUT : WIDECUT;
}
