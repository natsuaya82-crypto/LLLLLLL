/* ---------------------------------------------------------------------------
   tools/pv/seed.mjs — the app, filled with the film's languages.

   Two tools photograph the same app: tools/pv.mjs (the film) and
   tools/storeshot.mjs (the pictures on the App Store page). They have to be
   filled with EXACTLY the same thing -- the same alphabets, the same
   timeline, the same words -- or the store page and the trailer are about
   two different apps. So the filling lives here and neither of them has a
   copy of it.

   tools/fixture.mjs is run first, because it is the one place that knows
   what a whole app-state looks like, and the film's own languages are laid
   over it.
   --------------------------------------------------------------------------- */
import { seed } from '../fixture.mjs';
import { PV_STROKES, PV_WORDS, PV_SND, PV_OTHER, PV_SEEN, PV_FEED,
         PV_CURVE, PV_WEDGE, PV_BLOCK, inkFor } from './lang.mjs';

export async function seedFilm(app){
  await app.evaluate('window.__seed = ' + seed.toString());
  /* The three scripts, and the posts written in them. Built HERE rather than
     in the page: inkFor() is the same shape www/post.js's inkOfCut() makes, and
     what a post carries is what a server would have sent -- glyphs and a
     sequence, with nothing on the phone needed to draw them. */
  const SCRIPTS = { curve: PV_CURVE, wedge: PV_WEDGE, block: PV_BLOCK };
  const FEED = PV_FEED.map((p) => Object.assign({}, p, {
    ink: inkFor(SCRIPTS[p.script], p.ln),
    av: { st: SCRIPTS[p.script][p.face] }
  }));
  const MYFACE = { st: PV_CURVE['o'] };

  /* The app is filled with one made-up language, the same one every run --
     tools/pv/lang.mjs. It is not tools/fixture.mjs's: that one is three letters
     and a triangle, which is right for a check and is not a language anybody
     would want to look at. The fixture is run FIRST all the same, because it is
     the one place that knows what a whole app-state looks like, and the film's
     own language is laid over it. */
  await app.evaluate('window.__seed = ' + seed.toString());
  await app.evaluate(({ s, st, wds, snd, other, seen, feed, myFace, SCR }) => {
    eval('(' + s + ')()');
    SET.done = true; SET.theme = 'dark'; SET.ui = 'en';
    /* FREE. Not because the film is being modest -- because the free plan is
       what the free plan is: your own shapes for a-z and 0-9, and a QWERTY
       wearing them. Every screen in the film is one anybody gets. */
    SET.plan = 'free';
    langName = 'Shango';
    SND = snd;

    /* A word was made on a day. tools/fixture.mjs numbers them 1..20 because a
       check only ever asks which came first; a film shows the date on screen,
       and 1970-01-01 is what a 1 means. */
    var day = 86400000, now = Date.now(), i, w;
    WORDS = wds;
    for (i = 0; i < WORDS.length; i++){
      w = WORDS[i];
      w.at = now - (21 - w.at) * day * 3;
      w.up = w.at + day;
    }

    /* The letters are the app's OWN -- ltStart() made them, on the free plan,
       the way a phone does -- and what the film adds is the drawing on each.
       Replacing LETTERS wholesale would be the film inventing a shape of data
       the app never makes. What IS dropped is the check fixture's own
       placeholder letters: a chevron that reads nothing and a borrowed Greek
       character are stage dressing from a different job. */
    var l, k, kept = [], n = 0;
    for (i = 0; i < LETTERS.length; i++){
      l = LETTERS[i];
      k = (typeof numIsDigit === 'function' && numIsDigit(l)) ? '#' + l.val
                                                             : String(ltName(l) || '');
      if (!st[k]) continue;
      /* ltIsBase() -- which is how the free plan counts its own thirty-eight
         slots -- reads `ab`, the roman character the letter was made from, and
         the fixture's letters have none: they were written out by hand rather
         than made by ltStart(). Three of them were therefore over the free
         allotment, and the alphabet carried a "3 hidden / Upgrade" banner in
         the middle of the film. */
      if (!l.ab && !numIsDigit(l)) l.ab = k;
      l.st = JSON.parse(JSON.stringify(st[k]));
      if (l.ch) l.ch = '';         /* a letter that was borrowing a character */
      kept.push(l); n++;
    }
    LETTERS = kept;
    window.__pvDrawn = n;

    /* Nobody's alphabet has c, q and x all reading /k/. ltStart() gives every
       roman letter the sound it is usually written with, which is right on the
       day it runs and is not what somebody's language looks like a month
       later -- and the app says so on screen, in red, which in a film reads as
       an error rather than as a thing to get round to. */
    var say = { c:['tʃ'], q:['q'], x:['ʃ'], y:['y'] };
    for (i = 0; i < LETTERS.length; i++){
      k = String(ltName(LETTERS[i]) || '');
      if (say[k]) LETTERS[i].snd = say[k];
    }

    saveLetters(); save();

    /* SOMEBODY ELSE'S LANGUAGE, as the server would answer it: what it is
       called, what it says about itself, and the chapters its owner has said
       may be taken. The shape is supabase/schema.sql's `slice_read` -- the five
       a reader of a published language is allowed, and not the dictionary,
       which it refuses to everybody but its owner. Their alphabet is built the
       other way round from this phone's, which is the whole reason the film
       goes and gets it. */
    WLD_HAVE[seen.id] = { id: seen.id, name: seen.name, license: '',
                          pub: '2026-08-14', nwords: 61, nletters: other.length };
    WLDS_HAVE[seen.id] = {
      wld:     { body: JSON.stringify({ dl:true, where: seen.where,
                   ov:[{ k:'', v: seen.note }] }), no:3 },
      script:  { body: JSON.stringify({ dir:'ltr' }), no:1 },
      snd:     { body: JSON.stringify(['a','e','i','o','u','k','n','r','s','t']), no:10 },
      letters: { body: JSON.stringify(other), no: other.length },
      kb:      { body: JSON.stringify({ boards:[] }), no:1 }
    };

    /* A photograph on a post. The fixture's is three grey rectangles, which is
       the right picture for "is there an image here" and the wrong one for a
       film. Drawn rather than pasted in as kilobytes of base64. */
    function pic(v){
      var c = document.createElement('canvas'), w = 1200, h = 800;
      c.width = w; c.height = h;
      var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h);
      var sky = v === 2 ? ['#20303a', '#3c5560', '#7d8f86', '#c3c6a8']
                        : ['#1b2740', '#4a4258', '#9c7a55', '#d8a86a'];
      g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]);
      g.addColorStop(0.78, sky[2]); g.addColorStop(1, sky[3]);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,238,205,.85)';
      x.beginPath(); x.arc(w*0.72, h*0.60, 26, 0, 7); x.fill();
      var far = v === 2 ? ['#33463f', '#26362f', '#1a2620'] : ['#2c3347', '#232a3c', '#191e2c'], j;
      for (j = 0; j < 3; j++){
        x.fillStyle = far[j];
        x.beginPath();
        x.moveTo(-40, h);
        var px = -40, py = h * (0.70 + j * 0.07);
        var sd = (v === 2 ? 31 : 7) + j * 13;
        while (px < w + 40){
          var upv = ((sd = (sd * 1103515245 + 12345) & 0x7fffffff) % 1000) / 1000;
          py += (upv - 0.45) * (j ? 70 : 130);
          py = Math.max(h * (0.30 + j * 0.12), Math.min(h * (0.80 + j * 0.05), py));
          px += 90 + upv * 150;
          x.lineTo(px, py);
        }
        x.lineTo(w + 40, h); x.closePath(); x.fill();
      }
      return c.toDataURL('image/jpeg', typeof POST_PICQ === 'number' ? POST_PICQ : 0.72);
    }

    /* THE TIMELINE, and it is the film's centre. Four people, three scripts,
       one conversation 「いろんな言語が飛び交ってる感じにしたい」. Every line
       arrives with its own SHAPES on it -- which is the only reason a phone
       that has never seen the Wedge alphabet can draw a sentence written in
       it. www/post.js's line, and docs rule 8.

       The pictures and the faces are here too: a face is a letter of that
       person's own alphabet, and two of the posts carry a photograph. */
    POSTS = feed.map(function(p, i){
      var o = { id: 'p' + (i + 1), at: now - p.ago * 60000,
                lang: p.mine ? langId : ('lang-' + p.hd), lname: p.lname,
                ln: p.ln, who: p.who, hd: p.hd, mine: !!p.mine,
                av: p.av, ink: p.ink, mn: p.mn, ui: 'en', re: p.re || 0 };
      if (p.dir) o.dir = p.dir;
      if (p.to) { o.to = p.to; o.toh = p.toh; }
      if (p.vo) o.vo = { f: 'v1.m4a', ms: 7000 };
      if (p.pic) o.pic = pic(p.pic);
      return o;
    });
    POSTS.sort(function(a, b){ return b.at - a.at; });
    ME.av = myFace;

    /* WHOSE LANGUAGE THE FILM GOES AND GETS. The door into somebody else's
       language is the row on their profile, and that row is drawn exactly when
       the server has answered that they have published one (www/me.js) -- so
       the film seeds the answer rather than inventing a door. WHO_ASKED stops
       it being asked for over a network no check and no film has. */
    WHO_HAVE['iri'] = { who:'Iri', hd:'iri', av:{ st: SCR.block['k'] },
                        lname: seen.name, lid: seen.id, lpub: true,
                        bio:'Building a language for the islands.',
                        fo: 41, fr: 68 };
    WHO_ASKED['iri'] = 1;

    SET.myfont = true;
    if (typeof applyTheme === 'function') applyTheme();
    if (typeof installScriptFont === 'function') installScriptFont();
    /* The face the Lingua keyboard types INTO a field -- the private use area,
       one code point per drawn letter. Without it the composer in the film
       would show roman where a phone shows the letters somebody drew. */
    if (typeof installTypeFont === 'function') installTypeFont();
    if (typeof render === 'function') render();
  }, { s: seed.toString(), st: PV_STROKES, wds: PV_WORDS, snd: PV_SND,
       other: PV_OTHER, seen: PV_SEEN, feed: FEED, myFace: MYFACE,
       SCR: { curve: PV_CURVE, wedge: PV_WEDGE, block: PV_BLOCK } });
  return await app.evaluate(() => window.__pvDrawn);
}
