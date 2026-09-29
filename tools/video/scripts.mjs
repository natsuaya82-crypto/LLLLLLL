/* ---------------------------------------------------------------------------
   tools/video/scripts.mjs — what each film presses, in order.

   One entry per video. The key is the file name and the id in
   docs/scope/r133-video/topics.md. A step is read by tools/video/rec.mjs:

     cap: 'text'        the caption over the top ('' takes it off);
                        capAt: px from the top when the top is where the thing is
     go: route, a: arg  arrive on a route the way a door does (no finger)
     tap: target        press it -- 'do:name' for the button carrying that
                        data-do, 'text:words' for what it says, or a selector.
                        nth: which of several; dx/dy: where inside it
     type: 'text'       type, into: target to press first; lingua: true types
                        each letter as the Lingua keyboard does (its PUA code)
     draw: [[[u,v],..]] strokes, each a list of points 0..1 inside `on`
                        (default: the first canvas)
     eval: 'js'         set something up in the page (never a press)
     wait: ms           how long to stand after the step (default 500)

   `setup` runs before filming starts. `blank` names letters left undrawn
   (every other a-z is given a shape by rec.mjs, see SHAPES there). `endLine` is under the name at the end.
   --------------------------------------------------------------------------- */

export const SCRIPTS = {
  /* 1-01 — draw a letter of your own */
  'draw-a-letter': {
    blank: ['m'],
    setup: [{ go: 'build' }],
    steps: [
      { cap: 'Draw your own alphabet', wait: 1400 },
      { tap: 'text:Letters', wait: 900 },
      { tap: 'text:Alphabet', wait: 900 },
      { cap: 'Pick a letter', wait: 300 },
      { tap: 'do:ltGo', nth: 12, wait: 900 },
      { cap: 'Tap it to open the pen', capAt: 240, wait: 300 },
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
      { cap: 'Saved', capAt: 330, wait: 1400 },
      { tap: 'do:back', wait: 900 },
      { cap: 'Now it is part of your alphabet', capAt: 300, wait: 2600 },
    ],
    endLine: 'Make your own language',
  },

  /* 2-01 — build a keyboard for your language */
  'build-a-keyboard': {
    setup: [{ go: 'build' }],
    steps: [
      { cap: 'A keyboard for your own language', capAt: 360, wait: 2200 },
      { tap: 'text:Keyboard', wait: 900 },
      { cap: 'Add one', capAt: 360, wait: 300 },
      { tap: 'do:kbNew', wait: 1000 },
      { cap: 'Pick a layout', capAt: 470, wait: 900 },
      { tap: 'text:Flick', wait: 1000 },
      { cap: 'Your letters are already on it', capAt: 36, wait: 2800 },
      { cap: 'Tap a key', capAt: 555, wait: 200 },
      { tap: 'do:kbTapKey', nth: 2, wait: 700 },
      { tap: 'do:kbOpenSel', wait: 1100 },
      { cap: 'Flick it four ways', capAt: 560, wait: 2000 },
      { tap: 'do:back', wait: 900 },
      { cap: 'Save it', capAt: 555, wait: 300 },
      { tap: 'do:keepPress', wait: 1600 },
      { cap: 'Your keyboard is ready', capAt: 360, wait: 2800 },
    ],
    endLine: 'Make your own language',
  },

  /* 4-05 — answer the day's prompt */
  'post-to-the-prompt': {
    setup: [
      { eval: "DAY = { id: 7, on_day: '2026-09-29', text: 'What did you eat today?', says: { en: 'What did you eat today?' } }" },
      { go: 'feed' },
    ],
    steps: [
      { cap: 'A new prompt every day', capAt: 470, wait: 2400 },
      { cap: 'Tap it to answer', capAt: 470, wait: 200 },
      { tap: 'do:openPost', nth: 0, wait: 1000 },
      { cap: 'Write in your own language', capAt: 330, wait: 300 },
      { type: 'tir mos kano', lingua: true, into: 'do:pwFocusLn', delay: 230, wait: 1400 },
      { cap: 'The prompt comes with it', capAt: 330, wait: 2400 },
      { cap: 'Post it', capAt: 330, wait: 300 },
      { tap: 'do:pwSend', wait: 1600 },
      { cap: 'Your answer is on the timeline', capAt: 470, wait: 2600 },
      { cap: 'Everyone answers the same prompt', capAt: 470, wait: 2600 },
    ],
    endLine: 'Make your own language',
  },
};
