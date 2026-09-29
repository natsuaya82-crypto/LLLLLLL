/* ---------------------------------------------------------------------------
   tools/video/scripts.mjs — what each film presses, in order.

   One entry per video. The key is the file name and the id in
   docs/video/topics.md. A step is read by tools/video/rec.mjs:

     cap: 'text'        the caption over the top ('' takes it off)
     go: route, a: arg  arrive on a route the way a door does (no finger)
     tap: target        press it -- 'do:name' for the button carrying that
                        data-do, 'text:words' for what it says, or a selector.
                        nth: which of several; dx/dy: where inside it
     type: 'text'       type, into: target to press first
     draw: [[[u,v],..]] strokes, each a list of points 0..1 inside `on`
                        (default: the first canvas)
     eval: 'js'         set something up in the page (never a press)
     wait: ms           how long to stand after the step (default 500)

   `setup` runs before filming starts. `endLine` is under the name at the end.
   --------------------------------------------------------------------------- */

export const SCRIPTS = {
  /* 1-01 — draw a letter of your own */
  'draw-a-letter': {
    setup: [{ go: 'build' }],
    steps: [
      { cap: 'Draw your own alphabet', wait: 1400 },
      { tap: 'text:Letters', wait: 900 },
      { tap: 'text:Alphabet', wait: 900 },
      { cap: 'Pick a letter', wait: 300 },
      { tap: 'do:ltGo', nth: 12, wait: 900 },
      { cap: 'Tap it to open the pen', wait: 300 },
      { tap: 'do:editLetter', wait: 1000 },
      { cap: 'Draw with your finger', wait: 200 },
      { draw: [
          [[0.22, 0.78], [0.22, 0.34]],
          [[0.22, 0.40], [0.36, 0.28], [0.50, 0.40], [0.50, 0.78]],
          [[0.50, 0.40], [0.64, 0.28], [0.78, 0.40], [0.78, 0.78]],
        ], gap: 380, wait: 700 },
      { cap: 'Round bends the last line', wait: 300 },
      { tap: 'do:geCircle', wait: 1300 },
      { cap: 'Save it', wait: 300 },
      { tap: 'do:keepPress', wait: 1500 },
      { cap: 'It is a letter of your language now', wait: 2200 },
    ],
    endLine: 'Make your own language',
  },
};
