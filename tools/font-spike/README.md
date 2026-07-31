# Font spike — user-drawn glyphs to typeable text

Proves the pipeline Lingua needs for custom writing systems: a user draws glyphs,
assigns them romanisations, and then types their own script inside the app as
**real text** (selectable, copyable, laid out by the browser).

Five spikes. **v3 is the authoring model to build, v4 is its spacing, and v5 is
the decision about which rhythm the script has** — proportional or square cell.
v1 and v2 are kept as the record of what the routes we rejected actually cost.

**The spike has landed.** `otf5.js` is the shipping font writer and the app builds
its font on device; see "In the app" at the bottom. Everything above that section
is the record of how the parameters were chosen, not code the app runs.

## Run

    npm install --no-save opentype.js playwright
    node tools/font-spike/build3.mjs      # skeletons + one pen -> 5 OTFs + index3.html
    node tools/font-spike/shot3.mjs       # renders them in Chromium -> proof3.png
    node tools/font-spike/build4.mjs      # spacing: 104 sweep fonts + the 4 chosen + index4.html
    node tools/font-spike/measure4.mjs    # renders all 104 and picks the two parameters
    node tools/font-spike/shot4.mjs       # v3-vs-v4 proof -> proof4.png, and re-measures in the browser
    node tools/font-spike/calibrate5.mjs  # points v4's own instrument at real shipping fonts
    node tools/font-spike/build5.mjs      # one fixed pen, square-cell modes -> 7 OTFs + index5.html
    node tools/font-spike/measure5.mjs    # the four candidates + ink survival at 12/15/17/22px
    node tools/font-spike/shot5.mjs       # phone-size proof -> proof5.png, grid checked to the pixel
    node tools/font-spike/build6.mjs      # square cell chosen: the 2 open choices only -> 6 OTFs
    node tools/font-spike/shot6.mjs       # the decision page -> proof6.png
    node tools/font-spike/verify-otf5.mjs # the ES5 in-app writer vs opentype.js, to the pixel

`build6.mjs` imports `buildFont` from `build5.mjs` rather than forking it, so the
fonts on the decision page are the same code path as the measured ones.

`build4.mjs` writes its sweep into `sweep/`, which is not committed. The four
fonts at the top level are the ones the measurement chose.

## v3 — the authoring model, in three sentences

**A glyph is a list of pen strokes.** A stroke is a list of vertices; a vertex is
either a corner or a curve. Nothing else exists — no path strings, no fill rules,
no per-contour hole flags, no filled shapes.

**A curve is a button on a vertex, not extra points.** Marking a vertex `'c'`
rounds that corner: pull back along both neighbours by 44% of the shorter leg and
bend through the vertex with a quadratic. The same four taps make a sharp `L` or a
smooth hook depending on one toggle. `l` in the proof is four vertices with two of
them curved.

**The pen is ONE global setting for the whole writing system** — `width`,
`angleDeg`, `contrast`. Kana, Hangul and Latin on a phone are all one weight; a
script the user draws should be too. There is no per-stroke width anywhere.

Two things fall out of that last decision for free, and they are the reason to
prefer it rather than merely accept it:

- **Weight becomes a slider.** The same vertices regenerate Light / Regular / Bold.
  39 authored vertices produced all five fonts in `proof3.png`.
- **Calligraphic contrast becomes two numbers.** `contrast < 1` makes the nib an
  ellipse, so thick and thin come out of stroke *direction* the way a chisel pen
  behaves. Zero extra authoring. See the `broadnib` row.

And a closed stroke needs no hole flag at all: **the counter is simply where the
pen did not go.**

## Skeleton to outline, with no offsetting maths

Sweeping a convex nib along a segment is a Minkowski sum, and the Minkowski sum of
a segment and a convex polygon is just the convex hull of that polygon placed at
both ends. So each flattened segment emits one hull, every hull is wound the same
way, and non-zero fill unions them. Caps and joins come out of that for free.

The reason this matters more than elegance: a curve tighter than the nib **cannot**
fold the outline inside out. Real offsetting routines produce a swallowtail loop
there, which non-zero fill turns into a hole. Someone drawing a tight curl on a
phone with a fat pen would hit that constantly. Here it is unreachable by
construction — no boolean path operations anywhere in the pipeline.

## What v3 measured

| | |
|---|---|
| authored input | **39 vertices**, total, for all five fonts |
| OTF size | **~5.6 KB** for 8 glyphs → roughly 140 KB at 200 glyphs |
| geometry | 92 contours, ~1,280 points per font |
| `opentype.js` minified UMD | 240 KB, client-side |
| weight axis real | `kalisht` measures 278 / 308 / 356 px at width 60 / 110 / 190 |
| `sh` ligature fires | yes, at every weight |
| stored text stays ASCII | `input.value` is `"kalisht ho si"` |
| legible small | holds at 22 / 15 / 12 px — see the last row of `proof3.png` |
| console errors | none |

Size note: ~700 bytes per glyph is 3–4× a hand-drawn font glyph, because a hull per
flattened segment is more points than a designer would place. 140 KB for a complete
writing system is still under one webfont weight and it is generated on device, so
this is not worth optimising yet. The lever, if it ever is: emit a true two-sided
offset contour for runs whose curvature radius exceeds the nib radius, and keep the
hull union only for the tight ones.

## The ceiling a weight slider has to respect

A global pen width is only safe until the pen starts filling in the glyph's own
counters. `build3.mjs` measures that ceiling per glyph instead of guessing: build a
distance field to the skeleton, flood the white in from the outside for a candidate
nib radius, and any white the flood cannot reach is a surviving counter. Binary
search the largest radius that still leaves one.

For the sample alphabet the ring `a` caps out at **pen width 298** and every other
glyph has no enclosed counter at all, so no ceiling. The `over` row in the proof is
width 340, deliberately past it — the counter is gone, not merely tight. The
comfortable ceiling is lower, around 60% of the topological one, because a real
bold also *widens* the glyph to keep its counter open.

So the app can compute this per glyph and clamp the slider. The user cannot ruin
their own alphabet by dragging.

## v4 — where a machine puts a letter, and how it knows

Looking at `proof3.png` the fit between letters was wrong. It was, for two
separate reasons, and one of them was a shipped bug.

**The bug.** v3 computed `advanceWidth` from the outline bbox and wrote a
`leftSideBearing` into `hmtx` — but never moved the outline. **`hmtx.lsb` is
descriptive metadata; the path coordinates are what position ink.** So every glyph
kept whatever x it happened to be drawn at on the authoring canvas. Measured by
parsing `LS3-regular.otf`: left gaps ran 65..135 and right gaps ran −35..+35. `i`
had a 135-unit hole in front of it and stuck 35 units *into* the next letter. v4
translates every point by `dx = lsb − xMin`, and `shot4.mjs` re-measures it off the
rendered canvas: no glyph's ink now leaves its own advance box at any pen.

**The design error.** Even with the outline moved, a fixed gap either side of the
*bounding box* is the wrong metric. The bbox of a round `a` touches its neighbour
at one point; the bbox of an open `l` is mostly air. Equal box gaps therefore look
unequal — which is exactly what the eye caught.

So v4 measures the **white area** beside each outline and solves each sidebearing
to hold that area constant: sample the margin at every scanline, clamp how deep
into a concavity the white is allowed to count (`DEPTH`), average, and give back
whatever the average is short of the target (`GAP`). Same idea as Huerta
Tipográfica's letterspacer. A flat stem gets the full gap, a round bowl sits
closer, an open shape lets its neighbour tuck under.

The reason this is available to us without a designer is the whole point: **the app
generated the outline, so it can measure it.** Nothing here needs a human to judge
a fit.

Two things make it safe rather than merely clever:

- **Clearance is guaranteed by an identity, not by testing.** The minimum clearance
  between any two letters is at least `rsb(left) + lsb(right)`, so flooring every
  sidebearing at `C/2` forces clearance ≥ `C` for *every* pair, including pairs of
  glyphs the user has not drawn yet. Measured floor at the chosen settings: 110–114
  em units at all four pens, and no ink overlaps ink in any of the 104 sweep fonts.
- **Every emitted contour is a convex hull** (see above), so a horizontal scanline
  meets it in exactly one interval. The margin is read exactly, with no rasterising
  and no winding rules.

Also: v3 had no space glyph at all — `charToGlyphIndex(' ')` was 0, so every word
gap came from the fallback font. v4 emits a real `space` at `U+0020` with advance
`2·GAP + penWidth`.

### The two parameters were measured, not chosen

`measure4.mjs` is deliberately built to know nothing about the solver. It renders a
de Bruijn string containing every ordered pair of the alphabet exactly once, sums
alpha per pixel column, Gaussian-blurs by about one stem width, and reads the depth
of the trough at each letter join. The coefficient of variation of those 36 troughs
*is* the squint test, mechanised. `shot4.mjs` re-implements the same reading
independently inside the proof page and gets identical numbers.

| | worst pen | light | regular | bold | broadnib |
|---|---|---|---|---|---|
| v3, bbox gaps | **41.3%** | 30.9% | 38.1% | 36.2% | 41.3% |
| v4, equal area | **16.9%** | 16.5% | 12.0% | 12.7% | 16.9% |

Winner: `GAP 140`, `DEPTH_F 0.14`, `CLEAR_F 0.15`, picked on the **worst** pen
rather than the best reading, because in the app the pen is one setting for the
whole writing system and the user drags the weight slider afterwards.

**GAP turned out to have to be absolute em units, not a multiple of pen width.**
Proportional looked tidier and was wrong: at the light pen it made GAP 45 while
glyphs were donating 90–150 units of white, so every sidebearing saturated on the
collision floor and the solver stopped distinguishing shapes at all — the exact
failure it exists to prevent. Skeletons do not shrink when the pen thins, so the
white beside them must not either.

### Six flawed versions of this measurement, recorded so they are not rebuilt

Each of these produced a *better-looking* number than the truth:

1. Scaling the metric by the parameter being tuned. Looser tracking always wins if
   the blur radius is fixed in pixels while the letters shrink. Fixed em size fixes it.
2. Clamping the yardstick at the solver's own `DEPTH`, so the metric moved with the
   parameter.
3. Measuring the solver's own equalised area — tautologically optimal by construction.
4. Normalising total width, which makes the reading monotonic in tracking.
5. Blur σ at 0.16 em, which silently deleted every trough *inside* the letters, so
   the interior/exterior balance read exactly 1.00 with nothing left to balance.
6. Letting join troughs into the "interior" population, which pinned the same
   balance near 1.00 from the other direction.

Balance (white inside letters vs white between them) was then abandoned as a
selection criterion for a real reason, not a convenient one: it cannot reach 1.00
at pen 190 because the counters are nearly filled, and extrapolating gives a
negative GAP. A criterion that only works at light weights is not a criterion for a
font whose weight is a slider.

### Kerning is the wrong next lever

The 12–17% residual is structured **per glyph, not per pair**: pairs beginning with
`l` read tight (`la` .33, `ll` .31, `ls` .30) and pairs ending in `k`/`t` read loose
(`kk` .20, `tk` .20, `tt` .22) at every weight. So the improvement is a better
margin statistic than a clamped mean — not a pair table. Which is fortunate, because
**opentype.js cannot write kerning** (see limits below).

## v5 — one pen, phone size, and the square that makes spacing moot

Three sentences from the user set v5: pen 60 feels right and should be **fixed**, the
type should be **as small as phone text**, and — the important one — *if every letter
is drawn inside a square, then worrying about the space between letters is a strange
thing to be doing*. The third is a design claim, so it got measured rather than
agreed with.

### First, calibrate the yardstick

v4 reported "gap evenness cv 16.9%". That number meant nothing, because no shipping
font had ever been put through the same instrument. `calibrate5.mjs` fixes that: the
identical de Bruijn / blur / trough code, pointed at real faces, with a
`document.fonts.check` guard so a fallback measurement can't masquerade as a result.
Two readings, because the two designs optimise different things — `gapCv` is the
spread of trough depth at each join, `pitchCv` the spread of the advance widths.

    font                   gap cv   pitch cv
    DejaVu Sans             11.9%     30.6%    proportional latin, drawn professionally
    Carlito                 18.0%     28.0%
    FreeSerif               17.8%     26.2%
    DejaVu Sans Mono        50.4%      0.0%    latin monospace
    Noto Sans JP kana       85.9%      0.0%    a square-cell script a billion people read
    IPAGothic kana          98.7%      0.0%
    Noto Sans JP kanji      60.3%      0.0%
    Noto Sans KR hangul     19.6%      0.0%    square cell AND even gaps: designed for it
    Lingua v4, pen 60       16.5%     20.5%

Two things fall out of this table, and both matter more than anything v4 claimed.

**v4's spacing is already at shipping quality.** 16.5% is better than Carlito (18.0%)
and FreeSerif (17.8%) and not far off DejaVu Sans (11.9%). The remaining 12–17%
residual is not a defect to fix before shipping; it is where real text faces live.

**The user is right, and here is the proof.** Real kana score 85.9–98.7% on gap
evenness — five to eight times "worse" than a Latin text face — and nobody in a
billion readers has ever filed a complaint about kana letter-spacing. What a
square-cell script equalises is the **pitch**, which is exactly 0% by construction.
So gap evenness and pitch evenness are not one quality metric with a winner. They are
**two different rhythms**, and only one of them can be had at a time. v3 looked wrong
because it had neither: uneven gaps *and* uneven pitch.

Hangul is the interesting exception — 19.6% gaps *and* 0% pitch — but it earns that by
designing every syllable block to fill its cell evenly. That is a constraint on the
letterforms, not a spacing algorithm, and it is not something an app can impose on a
user's drawings.

### Square cell, built four ways

`build5.mjs` shares v4's geometry and adds `CELL = 800` — the authoring square itself.
`advance = CELL`, and then there is no solver, no `GAP`, no `DEPTH`, and no clearance
floor, because a grid cannot collide. Four candidates, measured by `measure5.mjs` and
independently re-measured in the browser by `shot5.mjs` (identical figures from both):

    candidate                  gap cv   pitch cv   cell   worst pair error
    proportional (v4 solve)     16.5%      20.5%    54px      52.8px
    square, as drawn           126.2%       0.0%    80px       0.000px
    square, ink centred        109.6%       0.0%    80px       0.000px
    square, scaled to fill      80.5%       0.0%    80px       0.000px

The grid claim is checkable to the pixel and it checks out: across all 36 ordered
pairs, and across an 8-letter line, the rendered width of *n* letters is exactly *n*
cells — error `0.000px`, not "small". The `sh` ligature costs exactly one cell, so a
digraph occupies one square like a Korean syllable block, which is the correct
behaviour and not a coincidence.

And the "worse" numbers land where they should. `asdrawn` at 126% is looser than any
real kana face; `fit` at 80.5% is *inside* the kana range (85.9–98.7%). So the
square-cell route is not a compromise — at `fit` it sits in the same regime as a
script people read all day.

**But `fit` has a hard limit worth knowing before building the editor.** Rescaling the
skeleton in x before the nib sweep — so the stroke width stays exactly 60 — cannot
widen a vertical stem. `i` needs a 2.20× scale to reach the cell and still ends up
with 370/370 sidebearings, because there is nothing in it to stretch. Fit-to-cell
therefore cannot rescue an intrinsically narrow letter. The fix is not an algorithm:
**show the square while drawing.** A user who can see the cell fills it, the way
anyone writing kana in a genkō-yōshi grid does.

### Pen 60 at 17px is a real risk, and the user should see it before choosing

60/1000 em is a **1.02px stem at 17px**. A normal text face is 0.08–0.10 em, i.e.
~1.53px. So the pen chosen while looking at 64px type will render lighter than the UI
around it. Measured as peak per-pixel alpha of the stem of `i`, with the counter of
`a` checked for closure at the same time (`o` = still an open hole):

    pen        12px      15px      17px      22px
    60        0.46 o    0.39 o    0.56 o    0.73 o
    90        0.51 o    0.50 o    0.84 o    0.89 o
    120       0.69 o    0.66 o    0.82 o    0.83 o
    sys       0.74 o    0.62 o    0.94 o    0.96 o    <- DejaVu Sans, the reference

Pen 60 reads at roughly 60% of the reference's ink at every size. Nothing *breaks* —
the counters stay open at all four sizes at all three pens, and pen 60 is the safest
of the three in that respect — but the type will look lighter than the surrounding
interface. That is a legitimate choice, made deliberately; it just should not be made
by accident at 64px. Pens 60/90/120 are rendered side by side at 17/15/12px in
`proof5.png` next to the system font, so the decision can be taken by eye.

### v6 — the decision page

**Square cell is chosen.** `build6.mjs` / `shot6.mjs` exist only to carry the two
choices that are left, and everything that was there to argue *for* the square is
deleted from the page: no proportional row, no de Bruijn grid, no calibration table,
no cv figures, no size ladder, no 120 pen. Three placements (as drawn / centred /
scaled to fill) at pen 60, and pen 60 versus 90 at one placement — six fonts, every
line the same five words at 17px, with a real kana line and the app's own UI text as
the only two reference rows.

At 17px "as drawn" and "centred" are nearly indistinguishable, which is itself the
finding: with the cell fixed, the real choice is whether the letters get stretched to
fill it, and that is a choice about the letterforms rather than about spacing.

### What v5 settles

- Spacing is no longer the open question. Proportional is at shipping quality already;
  square cell makes the question vanish by construction.
- **The choice is a product decision, not a measurement**: proportional gives Latin-like
  reading rhythm and needs the area solve; square cell gives kana-like rhythm, needs no
  solver at all, and makes the editor simpler (draw in a box, done).
- If square cell is chosen, the editor **must show the cell**, because `fit` cannot
  compensate for a letter drawn narrow.
- Pen width is fixed at 60 and there is no weight axis. `WPENS` exists only as the
  evidence for that choice, not as a shipping feature.

## v7 — the writer that can actually ship (`otf5.js`)

Everything above builds fonts in Node with opentype.js. The app cannot: `www/index.html`
runs in an old WKWebView and is ES5 throughout, and opentype.js 2.0.0's dist is 516 KB
of ES2015+ (73 arrow functions, 2454 `const`/`let`, 140 template literals). Inlining it
is not an option, and neither is transpiling 516 KB into a file that is already 5.5k lines.

So the font writer is hand-written: `otf5.js`, 751 lines of ES5, no dependencies, no
`Set`/`Map`/`Math.hypot`/arrow functions. It is tractable for one reason recorded in
the outliner section above — **a swept convex nib produces only convex polygons**, so
the CFF charstrings need `rmoveto`, `rlineto` and `endchar` and no curve operator, no
hint, no subroutine. Tables written: `CFF `, `GSUB`, `OS/2`, `cmap`, `head`, `hhea`,
`hmtx`, `maxp`, `name`, `post`.

The claim is not "it produces a font". The claim is **it produces the same font**, and
`verify-otf5.mjs` checks that three independent ways:

| check | what it would catch | result |
|---|---|---|
| placement numbers vs `build5.mjs` | a geometry port that drifted | dx, advance, lsb all identical, max diff 0 |
| opentype.js **parses otf5's file back** | a malformed INDEX, charset or dict | parses; outline points identical, max diff 0 |
| Chromium renders both faces to canvas | anything the other two miss | **0 differing subpixels** of 14 433 inked |

Plus, on the parsed-back font: cell 13.6px at 17px in both, advances uniform, worst
ordered-pair error 0px over 36 pairs, an 8-letter line exactly 8 cells, and `s`+`h`
still costing exactly one cell through the hand-written `GSUB`.

Result: **4060 bytes vs opentype.js's 5604** for the same 10 glyphs, because there are
no hints, no subrs and no standard-strings padding.

Two bugs, both found by Chromium's OTS sanitizer rather than by opentype.js, which is
the argument for check 3 existing at all:

- `cmap` encoding records must be sorted by platform ID, so Unicode (0) has to precede
  Windows (3). opentype.js parsed the wrong order happily.
- `cmap` format 4's `entrySelector` must be exactly `log2(segCount)`. An off-by-one in
  the classic `searchRange` loop is a hard reject: *"entry selector != log2(segment
  count) (1 != 2)"*.

## The contract

- em square `1000`, ascender `800`, descender `-200`, baseline at authoring `y = 800`
- **authoring space is y-down, fonts are y-up** — `fontY = 800 - y`. Forget this and
  every glyph renders upside down with no error anywhere.
- **`hmtx.leftSideBearing` is metadata. Translate the path.** v3's spacing bug was
  nothing but this.
- advance and sidebearings come from the white-area solve above, so they track pen
  width automatically and `GAP` is the one tracking control for the writing system
- `U+0020` is a real glyph, advance `2·GAP + penWidth`
- **glyphs are keyed to the romanisation's own codepoints, not the Private Use
  Area** (this is v2's finding, carried into v3). Glyph `k` lives at `U+006B`, so
  the stored string is ASCII and showing the custom script is nothing but
  `font-family`. No transliteration layer, no separate display buffer, no iOS
  keyboard extension. Search, sort, export and copy/paste all keep working.
- a digraph that is a single letter of the script (`sh`) is one glyph with **no cmap
  entry**, reached by an OpenType `liga` substitution — the user types `s` then `h`
- each glyph carries `phonemes`, so the script stays wired to the phonology. This is
  the loop no competitor closes: type roman → see custom glyphs → derive IPA → speak

## Known limits still open

1. **Not tested in WKWebView on device.** Desktop Chromium only. Capacitor serves
   from a real origin so `data:` fonts should work, but verify on hardware. If it
   fails, fall back to a `blob:` URL or write the OTF via Capacitor Filesystem and
   reference it by file URL.
2. **Undrawn letters fall back silently** to the UI font. Handle it deliberately:
   render a placeholder box in the accent colour so an undrawn letter reads as a
   to-do rather than a bug.
3. **A romanisation-keyed cmap cannot express a glyph with no roman spelling.** Emit
   a second PUA cmap alongside for those — and for a future native iOS keyboard
   extension and CSUR registration.
4. **Overlapping contours are legal but unhinted.** Every rasterizer handles
   non-zero winding overlaps correctly; font validators will still warn. Ignore it,
   or run an overlap-removal pass at final export if a foundry-grade file is ever
   wanted.
5. **Corner rounding pulls back 44% of the shorter leg.** Two curve vertices very
   close together will therefore round less than the user expects. Visible only on
   deliberately cramped shapes; worth a nicer curvature-continuous scheme later.
6. **Only quadratic bends.** Fine for a phone-drawn skeleton; an S-curve inside a
   single segment needs two vertices, not one.
7. **opentype.js cannot write kerning.** `kern_default` is `{ parse: parseKernTable }`
   — parse only, no `make`. `makeGposTable` exists but its `subtableMakers2` array is
   empty, so pair positioning cannot be emitted either. Doing it would mean injecting
   a raw format-0 `kern` table into the sfnt by hand: rebuild the table directory,
   shift every offset, recompute `head.checkSumAdjustment`, then verify empirically
   that browsers apply it. Not needed yet — v4 shows the residual is per-glyph, not
   per-pair.
8. **The area solve is a clamped mean.** It has no notion of *where* the white sits
   vertically, so a glyph whose margin is all at x-height and a glyph whose margin is
   all at the baseline get the same sidebearing. This is the 12–17% residual. The
   next lever is a vertically weighted or percentile margin statistic. Calibration
   (v5) shows this residual is inside the range real text faces occupy, so it is not
   blocking.
9. **`fit` mode cannot widen a narrow letter.** x-scaling a vertical stem leaves it a
   vertical stem, so `i` stays 370/370 inside its cell however hard it is scaled. A
   square-cell writing system needs the square *visible in the editor*; no
   post-processing recovers a letter drawn too narrow.
10. **Pen 60 is lighter than the surrounding UI at phone sizes** — a 1.02px stem at
   17px against ~1.53px for a normal text face, measuring ~60% of the reference's ink
   at 12/15/17/22px. Counters stay open, so nothing is broken; but if it reads too
   faint on device, the lever is the pen width, and it is one constant.

## v2 — points in, romanisation-keyed cmap

`build2.mjs` / `shot2.mjs` / `pixdiff.mjs`. Authored glyphs as point contours with
declared holes, and established the romanisation-keyed cmap and the `liga` digraph
trick that v3 keeps. Superseded on the authoring side only.

It also shipped, and then fixed, a bug worth remembering: winding correction was
`nodes.slice().reverse()`, which is **wrong for curves** — a control point belongs
to the segment *arriving* at its node, so reversing direction has to re-attach every
control to the segment that now arrives there. Without it a declared hole came out
as a spiked diamond: correct topology, mangled geometry, no error anywhere.
`pixdiff.mjs` asserts the fix by authoring the same glyph both ways round and
requiring 0 differing pixels. v3 sidesteps the whole class of problem — every
contour it emits is a convex hull of corners, with no controls to re-attach.

## v1 — SVG import, PUA codepoints

`build.mjs` / `shot.mjs`. Works (1,696 bytes for 4 glyphs, real text in an `<input>`,
no console errors) but pays for an SVG parser, stroke-to-outline offsetting,
`fill-rule="evenodd"` conversion, a transliteration step at input time, and a native
iOS keyboard extension before the system keyboard can type it at all. Every one of
those costs is gone by v3.

## In the app

`www/otf5.js` is a hand-written ES5 OpenType/CFF writer — no opentype.js, no build
step, ~4 KB of output for a ten-letter alphabet in about a millisecond. It exists
because the font has to be built **on the phone**, from letters the user drew
minutes ago, inside an old WKWebView.

    node tools/font-spike/verify-otf5.mjs  otf5 vs opentype.js, to the pixel
    node tools/es5-check.mjs               everything under www/ is still ES5
    node tools/verify-script.mjs           the real app, in a phone-sized Chromium

It used to live here, at `tools/font-spike/otf5.js`, and a script copied it into
`www/index.html` because the app was one file and the writer could not be a
`<script src>`. That meant it lived twice, and an edit made in the copy was
destroyed on the next commit without saying so. The app is several files now, so
the writer is a `<script src>` like everything else and there is exactly one of
it: **edit `www/otf5.js`.** The ES5 gate the inliner used to carry moved to
`tools/es5-check.mjs`, which reads every file under `www/` rather than this one,
because a `const` a desktop browser shrugs at is a blank screen on a real phone.
`tools/pre-commit` runs it whenever anything under `www/` is staged.

What ships, and what proves it:

- **One drawing serves both cases.** Headwords are stored capitalised, so the app
  passes `roman: 'aA'` and both codepoints resolve to the same gid — no duplicate
  glyph, no silent fallback on an initial capital. (verify-otf5 §4)
- **The alphabet follows the dictionary.** A word written after the font was built
  can need a letter the font does not have, so `render()` compares `scriptSig()`
  against the installed font and rebuilds when it differs. Building is cheap
  enough that being right costs nothing. (verify-script §4)
- **The toggle is a font-family swap.** `html[data-script="on"]` and nothing else;
  the stored text stays ASCII, which is what keeps CSV export, search and the
  cloud honest. (verify-script §5)
- **The square cell holds.** 13.6px at 17px, every letter identical, worst pair
  error 0px, an 8-letter line exactly 8 cells, and the `sh` digraph exactly one
  cell via `liga`. An undrawn letter still holds its cell rather than collapsing.
- **Both palettes, no app errors.** `verify-script.mjs` drives the real app at
  402x874 dScale 3 and writes `tools/script-proof.png`. It separates app errors
  from resource-load failures on purpose: this sandbox has no route to Google
  Fonts, and failing on that would be failing on the network, not the code.

Limit #1 still stands: **none of this has run in WKWebView on real hardware.**
Chromium's OTS sanitizer is the strictest gate available here, and it passes, but
CoreText is a different parser.
