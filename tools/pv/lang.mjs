/* ---------------------------------------------------------------------------
   tools/pv/lang.mjs — the languages the film is about.

   tools/fixture.mjs is three letters and a triangle. That is the right
   fixture for a check, which only ever asks whether a screen renders, and it
   is not a language anybody would want to look at for a minute.

   THREE SCRIPTS, NOT ONE. The film's timeline has people writing in
   different languages at once 「いろんな言語が飛び交ってる感じにしたい」, and
   that is worth nothing if everybody's letters are built the same way. So
   there are three systems here and they do not share a skeleton:

     CURVE   one flowing stroke, and dots above or below saying which letter
             it is. No stem anywhere. This is the phone's own language.
     WEDGE   a bar across the top with wedges hanging off it, and a second
             bar or a stem for the rest.
     BLOCK   part of a square frame, with a mark inside it.

   The first version of this file was a vertical stem with a tick stuck on
   one side, which is the skeleton of a roman letter with the curves taken
   off -- 「そんなアルファベットみたいなの入れるのやめてくれ」. None of these
   three has a stem, and none of them is the alphabet you are reading.

   Coordinates are the drawing surface's own -- an 800 x 800 box with the
   grid inset 40 from each edge, y downwards -- so what is here is what a
   person's finger would have left behind. A straight stroke's ends are put
   on the editor's lattice; a curve is not, because a curve is what ROUND
   makes of three taps rather than a run between two points.
   --------------------------------------------------------------------------- */

const STEP = (800 - 80) / 20;
function snap(v){
  const k = Math.round((v - 40) / STEP);
  return Math.round(40 + Math.max(0, Math.min(20, k)) * STEP);
}
function pt(x, y){ return [snap(x), snap(y)]; }
function raw(x, y){ return [Math.round(x), Math.round(y)]; }
function S(pts){ return { pts: pts }; }
function line(x1, y1, x2, y2){ return S([pt(x1, y1), pt(x2, y2)]); }
/* Degrees, y downwards, so 0 is to the right and 90 is below. */
function arc(cx, cy, r, a0, a1, n){
  const out = [];
  const steps = n || Math.max(8, Math.round(Math.abs(a1 - a0) / 14));
  for (let i = 0; i <= steps; i++){
    const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
    out.push(raw(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return S(out);
}
function ring(cx, cy, r){ return arc(cx, cy, r, -90, 271, 18); }
function dot(cx, cy){ return ring(cx, cy, 30); }
/* Two arcs that meet, drawn as the one stroke a finger would make. */
function join(){
  const p = [];
  for (const s of arguments) for (const q of s.pts) p.push(q);
  return S(p);
}

const AZ = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* ---- CURVE: one stroke, and dots ---------------------------------------- */
function curveScript(){
  const shape = [
    () => join(arc(400, 300, 150, 120, 300, 10), arc(400, 540, 150, -60, 120, 10)),
    () => join(arc(400, 300, 150, 240, 60, 10), arc(400, 540, 150, 120, 300, 10)),
    () => join(S([pt(250, 200), pt(250, 470)]), arc(370, 470, 120, 180, 10, 10)),
    () => join(S([pt(560, 200), pt(560, 470)]), arc(440, 470, 120, 170, 350, 10)),
    () => join(arc(320, 420, 130, 180, 0, 8), arc(560, 420, 120, 180, 360, 10)),
    () => join(arc(400, 380, 150, 90, 430, 14), S([pt(400, 530), pt(400, 660)])),
    () => arc(400, 420, 170, 30, 330, 14)
  ];
  const dots = [ [], [[400,140]], [[320,140],[480,140]], [[400,690]],
                 [[320,690],[480,690]], [[400,140],[400,690]] ];
  const m = {};
  AZ.forEach(function(c, i){
    m[c] = [shape[i % shape.length]()].concat(
      dots[Math.floor(i / shape.length) % dots.length].map(function(d){ return dot(d[0], d[1]); }));
  });
  /* the two marks the free plan gives everybody, in the same hand */
  m['!'] = [join(arc(400, 330, 120, 250, 80, 8)), dot(400, 660)];
  m['?'] = [join(arc(400, 300, 140, 180, 20, 8), S([pt(400, 440), pt(400, 540)])), dot(400, 660)];
  /* and the numerals: counting in fives, a bar for the hand and strokes
     under it, which is a system somebody would actually invent */
  for (let v = 0; v <= 9; v++) m['#' + v] = digit(v);
  return m;
}
function digit(v){
  if (v === 0) return [ring(400, 420, 150)];
  const out = [];
  const hands = Math.floor(v / 5), ones = v % 5;
  if (hands) out.push(line(210, 290, 590, 290));
  const top = hands ? 350 : 260;
  for (let i = 0; i < ones; i++) out.push(line(270 + i * 65, top, 270 + i * 65, 660));
  if (!ones) out.push(line(400, top, 400, 660));
  return out;
}

/* ---- WEDGE: a bar, and what hangs off it -------------------------------- */
function wedgeScript(){
  const bar = () => line(140, 230, 660, 230);
  const low = () => line(140, 560, 660, 560);
  const V = (x, d) => S([pt(x - 70, 230), pt(x, 230 + d), pt(x + 70, 230)]);
  const Vu = (x) => S([pt(x - 70, 230), pt(x, 110), pt(x + 70, 230)]);
  const stem = (x, h) => line(x, 230, x, 230 + h);
  const at = [220, 400, 580];
  const m = {};
  AZ.forEach(function(c, i){
    const n = i % 3, kind = Math.floor(i / 3) % 9;
    const g = [bar()];
    if (kind === 0) g.push(V(at[n], 300));
    if (kind === 1) g.push(V(at[n], 300), stem(at[(n + 1) % 3], 400));
    if (kind === 2) g.push(Vu(at[n]), V(at[(n + 2) % 3], 300));
    if (kind === 3) g.push(V(at[n], 220), low());
    if (kind === 4) g.push(stem(at[n], 430), dot(at[(n + 1) % 3], 430));
    if (kind === 5) g.push(V(at[n], 430), Vu(at[(n + 1) % 3]));
    if (kind === 6) g.push(low(), stem(at[n], 330));
    if (kind === 7) g.push(V(at[0], 200), V(at[2], 380), stem(at[1], 260));
    if (kind === 8) g.push(Vu(at[n]), low());
    m[c] = g;
  });
  return m;
}

/* ---- BLOCK: part of a frame, and a mark inside it ----------------------- */
function blockScript(){
  const L = 150, R2 = 650, T = 190, B = 650;
  const frame = [
    () => S([pt(L, T), pt(L, B), pt(R2, B)]),
    () => S([pt(L, B), pt(L, T), pt(R2, T)]),
    () => S([pt(R2, T), pt(R2, B), pt(L, B)]),
    () => S([pt(L, T), pt(R2, T), pt(R2, B), pt(L, B), pt(L, T)])
  ];
  const inside = [
    () => [line(280, 420, 520, 420)],
    () => [line(400, 290, 400, 550)],
    () => [dot(400, 420)],
    () => [line(280, 300, 520, 540)],
    () => [line(280, 540, 520, 300)],
    () => [line(280, 340, 520, 340), line(280, 500, 520, 500)],
    () => [ring(400, 420, 110)]
  ];
  const m = {};
  AZ.forEach(function(c, i){
    m[c] = [frame[i % frame.length]()].concat(inside[Math.floor(i / frame.length) % inside.length]());
  });
  return m;
}

export const PV_CURVE = curveScript();
export const PV_WEDGE = wedgeScript();
export const PV_BLOCK = blockScript();
/* The phone's own language is the curved one. */
export const PV_STROKES = PV_CURVE;

/* ---- what a post carries -------------------------------------------------
   A post is drawn from the post: the SHAPES travel on it, because the phone
   reading it has never seen that alphabet and never will (docs rule 8, and
   www/post.js's line). This builds exactly what inkOfCut() builds -- `g` is
   every distinct glyph in the line and `s` is the sequence, with a space
   staying a piece of text. */
export function inkFor(script, line){
  const g = [], s = [], seen = {};
  for (const ch of String(line)){
    if (ch === ' '){ s.push(' '); continue; }
    const st = script[ch];
    if (!st){ s.push(ch); continue; }
    const key = JSON.stringify(st);
    if (seen[key] === undefined){ seen[key] = g.length; g.push(st); }
    s.push(seen[key]);
  }
  return { g: g, s: s };
}
/* A face is a letter of that person's own alphabet, which is what a face on
   this timeline is. */
export function faceOf(script, ch){ return { st: script[ch] }; }

/* ---- the dictionary -----------------------------------------------------
   Enough that the lexicon is a page somebody has been keeping, and short
   enough that every line of it can be read at a glance. */
export const PV_WORDS = [
  { hw:'kano',  ph:['k','a','n','o'],         mn:'mountain',      pos:'n',   at:1,  tags:['land'], ety:'from the word for head' },
  { hw:'sar',   ph:['s','a','r'],             mn:'river',         pos:'n',   at:2,  tags:['land'] },
  { hw:'tir',   ph:['t','i','r'],             mn:'to see',        pos:'v',   at:3 },
  { hw:'tira',  ph:['t','i','r','a'],         mn:'saw',           pos:'v',   at:4,  from:'tir', fm:'pst' },
  { hw:'tiran', ph:['t','i','r','a','n'],     mn:'seeing',        pos:'v',   at:5,  from:'tir', fm:'prg' },
  { hw:'tiror', ph:['t','i','r','o','r'],     mn:'watcher',       pos:'n',   at:6,  from:'tir' },
  { hw:'mos',   ph:['m','o','s'],             mn:'tall',          pos:'adj', at:7 },
  { hw:'mosun', ph:['m','o','s','u','n'],     mn:'height',        pos:'n',   at:8,  from:'mos' },
  { hw:'lenu',  ph:['l','e','n','u'],         mn:'quiet',         pos:'adj', at:9 },
  { hw:'lenka', ph:['l','e','n','k','a'],     mn:'to fall silent',pos:'v',   at:10, from:'lenu' },
  { hw:'veth',  ph:['v','e','t','h'],         mn:'sea',           pos:'n',   at:11, tags:['land'] },
  { hw:'venar', ph:['v','e','n','a','r'],     mn:'evening',       pos:'n',   at:12 },
  { hw:'ora',   ph:['o','r','a'],             mn:'to walk',       pos:'v',   at:13 },
  { hw:'orana', ph:['o','r','a','n','a'],     mn:'a road',        pos:'n',   at:14, from:'ora' },
  { hw:'kel',   ph:['k','e','l'],             mn:'stone',         pos:'n',   at:15 },
  { hw:'keluk', ph:['k','e','l','u','k'],     mn:'wall',          pos:'n',   at:16, from:'kel' },
  { hw:'nak',   ph:['n','a','k'],             mn:'not',           pos:'part',at:17, slot:'neg.not' },
  { hw:'ke',    ph:['k','e'],                 mn:'what',          pos:'pro', at:18, slot:'ask.what' },
  { hw:'aru',   ph:['a','r','u'],             mn:'to hold',       pos:'v',   at:19 },
  { hw:'sarin', ph:['s','a','r','i','n'],     mn:'to flow',       pos:'v',   at:20, from:'sar' }
].map(function(w){ w.mns = [w.mn]; return w; });

export const PV_SND = ['k','t','m','n','s','r','l','v','h','a','i','u','e','o'];

/* ---- the timeline -------------------------------------------------------
   Four people, three scripts, one conversation. What makes this the film's
   centre is that not one of these lines could be drawn by the phone reading
   it: the shapes are ON the posts.

   `dir` travels too, and two of them do not run left to right -- somebody
   else's post is the only place that shows. */
export const PV_FEED = [
  { who:'Aya',  hd:'aya',  lname:'Shango', script:'curve', face:'o', mine:true,
    ln:'kano mos tir', mn:'a tall mountain is seen', ago:64, pic:1, re:2, rp:1 },
  { who:'Iri',  hd:'iri',  lname:'Vethi',  script:'block', face:'k',
    ln:'qel dross', mn:'the sea has gone quiet', ago:44, dir:'ttb-rl', vo:1, re:5 },
  { who:'Sena', hd:'sena', lname:'Orune',  script:'wedge', face:'t',
    ln:'ashk ram vel', mn:'the road bends before the wall', ago:31, re:3 },
  { who:'Aya',  hd:'aya',  lname:'Shango', script:'curve', face:'o', mine:true,
    ln:'sar lenu', mn:'the river has gone quiet', ago:22, to:'p2', toh:'iri', re:1 },
  { who:'Noor', hd:'noor', lname:'Kettish',script:'block', face:'m',
    ln:'thek ilan', mn:'nine days of rain', ago:14, pic:2, re:8 },
  { who:'Iri',  hd:'iri',  lname:'Vethi',  script:'block', face:'k',
    ln:'qel', mn:'yes, that is the one', ago:8, to:'p4', toh:'aya', re:1 },
  { who:'Sena', hd:'sena', lname:'Orune',  script:'wedge', face:'t',
    ln:'vel ram', mn:'the wall, and what is behind it', ago:3, dir:'rtl', re:2 }
];

/* ---- somebody else's language, the one the film downloads ----------------
   Their alphabet is the BLOCK one: opened on this phone, it is visibly not
   built like the phone's own, which is the whole reason the film goes and
   gets it. The shape is supabase/schema.sql's `slice_read` -- the five a
   reader of a published language is allowed, and not the dictionary. */
export const PV_SEEN = {
  id: 'seen-vethi',
  name: 'Vethi',
  where: 'the coast, and the islands off it',
  note: 'a language somebody else is building'
};
export const PV_OTHER = Object.keys(PV_BLOCK).slice(0, 16).map(function(k, i){
  return { id: 'vx' + i, ab: k, st: PV_BLOCK[k], ch: '', nm: '', snd: [k] };
});
