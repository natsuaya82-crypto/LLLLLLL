# Where these pages come from

The Voynich manuscript, **Beinecke MS 408**, Beinecke Rare Book & Manuscript
Library, Yale University. The scans are the library's 2014 digitisation.

**Public domain (Beinecke Rare Book & Manuscript Library, Yale University).**

Taken from the GitHub repository `sunkencity999/voynich-atlas`, folder
`images/web/` — the files `f1r.jpg` and `f2r.jpg`, copied here byte for byte.
f2r is the page every letter is traced from; f1r, whose EVA text is the best
known, is where which gallows is which was checked, and is the page the
comparison picture sets beside the app's rendering. That repository's README gives their provenance as:

> Beinecke MS 408 → Yale 2014 digitization (IIIF oid 2002046) → archive.org
> `voynich` item → SHA-256 + dimension verification against the Wayback-frozen
> Yale IIIF manifest

and says of them: "Images: Beinecke Rare Book & Manuscript Library, Yale
University — public-domain cultural heritage."

Nothing else from that repository — no code, no data — is copied here.

## What they are used for

`official/voynich-trace.py` traces the letters of the Lingua 公式 Voynich
language off these pages. `glyphs/` holds, for every letter, the places on the
page it was found (`<name>-<n>.png`) and the one that was traced, drawn with
the app's lattice over it and the traced points in red (`<name>-grid.png`).

EVA (the European Voynich Alphabet) is used only to say which shape on the page
is which letter. No Voynich font was opened, read or traced.
