# the sheet, before it is in the app

`sheet.js` is written to go into `www/` as chapter 26 and is ES5 already
(`npm run es5` passes on it). It is not there yet, and the reason is not the
code: `www/index.html` has to gain one `<script src>` line, and that file
belongs to another session while three of them are in flight. It lands in one
commit the day that file is free.

Same shape as `tools/font-spike/build5.mjs`, which is where `www/otf5.js` came
from: a thing that works, kept where it can be run, until it has a home.

## what is here

    sheet.js    the two halves. Above the line: names in, PDF bytes out; and a
                photograph in, names and shapes out. No global, no document.
    print.mjs   makes a real sheet.pdf and rasterises it, to be LOOKED at
    trip.mjs    the round trip of the NAMES, measured
    fake.mjs    a written-on sheet, photographed badly -- a stand-in until a
                real one arrives
    read.mjs    node tools/sheet-spike/read.mjs <photo or PDF> [out.png]
                the whole reading side: find the marks, undo the perspective,
                read the names, and pull each box's drawing out as an outline
    wrap.mjs    the scanner stand-in: an image packed into a real PDF, with a
                small preview beside the page, so "largest wins" is tested

## what has been measured

`node tools/sheet-spike/trip.mjs` prints a table. The sheet is drawn at 260dpi,
photographed badly -- rotated, sheared, blurred, with a lighting gradient over
it and noise on top -- then the four corner marks are found, the perspective
undone, and the twenty names read back off the strip.

    scanner      0.8°   all twenty
    by hand      4°     all twenty
    carelessly   10°    all twenty
    very skewed  18°    all twenty

It also prints two things that are not the round trip and are checked every
run: that a box's name does not reach the box above it (`shSane`), and that an
empty box comes back empty.

Three things that cost a round each and are worth not rediscovering:

- **A fixed threshold does not work over a whole page.** A lighting gradient
  takes the dark side of the paper below 128 and the sheet turns black. It has
  to be local -- each pixel against the brightness around it. This is what
  Calligraphr's "automatically clean templates" is for.
- **And a local threshold without denoising first turns every noise pixel into
  ink.** 378,648 blobs, from a page that has about 170. Two windows: a small
  one to smooth, a large one for the background, ink where small < large*0.85.
- **The spare cells are worth using.** Twenty short names are about 70 bytes of
  a strip that holds 264, so the rest was zeroes. The packet is written three
  and a bit times over instead, and the first copy that checksums wins. One bad
  cell of 2112 refused a sheet before that; now it repairs. Forty scattered bad
  cells still refuse -- which is the half that matters, because a misread sheet
  must be turned away rather than half-imported.

## what is inside a box

**The app's own lattice, and nothing else.** 21 dots across with an inset of
40 in a square of 800 -- `GGRID`, the same dots a finger traces on the canvas.
「その代わり四角の中に点線めっちゃ入れてあげたら？」

It was Calligraphr's faint character-to-trace, copied without thinking about
what this app is for. There it is right: you are collecting somebody's
handwriting of a letter that already exists. Here it is backwards -- somebody
inventing their own script for 水 would find 水 waiting in the box and trace
the Japanese one. A dot says nothing about what to draw.

Measured: an empty box on a photographed sheet comes back with **0 ink pixels
of 16384**. The dots are pale enough that the local threshold drops them before
the clean-up is even reached.

That number cuts both ways and is worth writing down: ink has to be darker than
about 0.85 of the paper around it to be seen at all. A hard pencil may be
marginal. Something to put in front of a real sheet.

## reading a sheet, end to end

`node tools/sheet-spike/read.mjs /tmp/fake.png` on a sheet with three boxes
drawn in, photographed at 6 degrees with a lighting gradient over it:

    7    (か)   4033 ink pixels   3 loops    57 points
    2    (よ)   2920             2          41
    25   (ring) 2717             2          39
    the other seventeen           0          0

All twenty names came off the strip. **The seventeen empty boxes come back
empty** -- the lattice is not read as ink. And the ring's hole survives, which
is the one that matters for a pictographic script: a circle that fills in is a
blot, not a letter.

Two things cost a round each here:

- **A pixel walk does not close.** The first tracer followed ink pixels and
  could leave its own loop, so every loop ran to its guard of 160,000 points --
  and the thinner behind it is O(n^2). Nothing threw; the page just never came
  back. Following the CRACKS BETWEEN pixels closes by construction. 3ms.
- **Asking the background brightness per pixel is most of the minute.** It is a
  fourteenth of the picture wide, so it cannot change from one pixel to the
  next; it is sampled on a coarse grid now. `shScan` went from not finishing to
  50ms.

## the first sheet somebody actually wrote on

The owner wrote one and sent it back. Twenty boxes, ten of them drawn in. The
four marks were found, the strip gave all twenty names, the ten drawn boxes came
out as the letters they were drawn as, and the ten empty ones came back at
**zero pixels** -- the printed lattice is not read as ink on a real sheet either.

It found one bug on its first run, and the bug is worth keeping written down
because of the SHAPE of it. `shClean`'s comment said "forget a margin of the
box, then drop every island smaller than `least`"; the code dropped any island
that *touched* the margin, on the grounds that the printed box edge is such an
island. One of the ten letters had a stroke running out past the edge of its
square. The letter is one connected island, it touched, so the whole letter
went: **3998 pixels found and 3998 thrown away**, which on the table reads as a
box that was drawn in and lost -- not as a box left empty. The comment had been
describing the right rule the whole time and nothing held the code to it.

The margin is forgotten now and never used as a reason to drop anything. It
costs a stroke the outermost 3 cells of 200, and the other nine boxes did not
move by one pixel, which is the part that says the printed edge is still not
coming through. The printed edge is at a place this file KNOWS, because this
file drew it; where somebody's stroke happens to end is not.

## the thickness of a stroke

The owner looked at what came back and said the letters were the wrong weight
and uneven with it -- 「なんか俺が送ったやつ文字の太さが違うなまちまちになってる」.
Measured against the widths actually drawn, on the ten boxes of the real sheet:
**they came back between 81% and 96% heavier.** Two causes, and neither is in the
tracer -- the outline and the thinning together move the area by under 2.3%.

- **A box MEAN moves an edge.** A white pixel SM away from a black stroke has
  its mean dragged down, so a stroke comes back SM pixels fatter on each side.
  At SM=3 on a photograph whose strokes are eight pixels wide, that is nearly
  double. A MEDIAN discards the same grain of noise and leaves the edge where
  it is; that is the entire difference between the two, and it is why the
  denoising step could be kept while the fattening went.
- **0.85 of white paper is 217**, which is very nearly white, so the soft ramp
  at the side of every stroke counted as ink for most of its width. The edge
  goes at the MIDPOINT between this paper and the darkest ink near here now.
  Where there is no ink near here the two are equal and nothing is ink, so a
  blank box stays blank. The 15% is kept as the FLOOR -- the question "is there
  any ink here at all", which is what decides whether a pencil is seen. That
  number has not moved.

    box   drawn    before          after
    7     3.66     6.89  +88.3%    3.55   -3.0%
    2     4.05     7.34  +81.2%    4.05    0.0%
    ...
    木    3.69     7.24  +96.2%    3.60   -2.4%

Both faults added a roughly fixed number of PIXELS, which is the half worth
keeping in mind: a thin stroke gains a far larger share of itself than a thick
one, so a hand that varies comes back flattened. The drawn widths here span
3.42 to 4.25 and that spread is now reproduced -- the scatter against the drawn
width fell from 2.5% to 0.9%. **Weight is what a person notices second.**

`shScan` answers two predicates rather than one, because these are two jobs:
`dark` (mean, 0.85) finds the four marks and reads the strip, where nothing
cares where an edge is to a pixel, and it keeps the mask every number above was
measured on. `crisp` (median, midpoint) cuts the letters out. The strip still
reads all twenty names at 18 degrees, and the empty boxes are still 0 pixels --
the printed lattice does not become ink under the sharper eye either.

## a PDF that came back

A scanner does not hand back a photograph. iOS Notes, Adobe Scan and every
flatbed hand back a PDF, and inside one the page IS a photograph -- one JPEG per
page, stored byte for byte, because `/DCTDecode` means "these bytes are already
a JPEG". `shPdfJpeg()` takes it out without rendering anything. `wrap.mjs` is
the scanner stand-in: it packs an image into a real PDF, xref and all, **with a
small preview of the page beside the page**, because a PDF often carries one and
reading that instead does not fail -- it reads the sheet at an eighth of the
size, with a corner mark eight pixels across. Largest wins, and the test proves
which one was taken by printing its byte count.

The hole is stated rather than papered over: a PDF whose ink was **drawn** on a
screen has no photograph inside it, and turning one into pixels is a renderer.
The phone has one -- PDFKit, native, the same bridge the outgoing PDF has to
cross anyway. This file does not. `shPdfWhy()` answers `photo` / `packed` /
`drawn` / `not-pdf` so the app can say which of the four arrived instead of
"could not read this file". All four were watched.

## what has NOT been measured

- **A brush, and pencil.** The sheet that came back was written with a pen that
  gives a solid black edge. A brush bleeds into paper and goes dry; a hard
  pencil may not clear "0.85 of the paper around it" at all. Neither has been
  seen yet.
- **That the PDF puts things where `shCellAt` says.** The round trip draws the
  page onto a canvas from the same `shBoxAt`/`shMarks`/`shCellAt` the PDF is
  written from, so it holds the reader honest and not the writer. The writer
  was checked by looking at `sheet.pdf` -- which is how it was found that a
  wide name overflowed its box and the strip sat on the bottom row.
