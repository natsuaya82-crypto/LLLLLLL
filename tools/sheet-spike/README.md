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
                page of samples in, names out. No global, no document.
    print.mjs   makes a real sheet.pdf and rasterises it, to be LOOKED at
    trip.mjs    the round trip, measured

## what has been measured

`node tools/sheet-spike/trip.mjs` prints a table. The sheet is drawn at 260dpi,
photographed badly -- rotated, sheared, blurred, with a lighting gradient over
it and noise on top -- then the four corner marks are found, the perspective
undone, and the twenty names read back off the strip.

    scanner      0.8°   all twenty
    by hand      4°     all twenty
    carelessly   10°    all twenty
    very skewed  18°    all twenty

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

## what has NOT been measured

- **Real ink.** The letters here are clean vector shapes with blur on them. A
  brush bleeds into paper and goes dry; its edge is not a step. The owner is
  testing that with a real sheet before release.
- **That the PDF puts things where `shCellAt` says.** The round trip draws the
  page onto a canvas from the same `shBoxAt`/`shMarks`/`shCellAt` the PDF is
  written from, so it holds the reader honest and not the writer. The writer
  was checked by looking at `sheet.pdf` -- which is how it was found that a
  wide name overflowed its box and the strip sat on the bottom row.
