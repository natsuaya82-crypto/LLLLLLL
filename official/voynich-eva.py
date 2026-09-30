#!/usr/bin/env python3
"""official/voynich-eva.py -- the Voynich letters, drawn on the app's lattice
with EVA Hand A as the picture to draw from.

Run it:   python3 official/voynich-eva.py              -> official/voynich-strokes.json
          python3 official/voynich-eva.py --grid FONT --out DIR
                                                        -> DIR/<letter>.png
          node official/voynich-draw.mjs               -> official/voynich.json

NOT a check and not in the gate.

WHERE THE SHAPES COME FROM. 「一旦見本の絵としてやってみて」 OWNER 2026-09-30:
the font Voynich EVA Hand A (Gabriel Landini, 1997) is shown as a PICTURE,
the app's lattice is laid over it, and every point in `P` below was placed by
eye along the middle of the stroke -- a centre line for the app's round pen,
which is a different thing from the font's outline. Nothing is taken out of
the font file: no outline, no point, no path, and no skeleton computed from
it. The font file is not in this repository; `--grid` needs it handed in and
writes the pictures to a folder outside it.

WHAT A LETTER IS CALLED. EVA, the font's own assignment: `fachys` typed is
`fachys` in the hand. The font has no b, u or w, so those slots stay empty.

THE METRIC. One scale for every letter: the o's x-height is five steps and
its foot is row FOOT, so a gallows reaches row 0 and a tail row 20. The four
benched gallows are 25 steps wide at that scale; their bench arms (the c on
the left and the h on the right) are drawn one to two steps shorter so they
fit in 21. Nothing else is moved or scaled.

A point is [column, row], or [column, row, 'c'] for a point the line bends
through (the curve flag in www/glyph.js). A stroke is a list of points, or
{'p': points, 'closed': 1} for a ring.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'voynich-strokes.json')
FOOT = 15
N = 21

P = {
  'a': [[[10, 10], [8, 11, 'c'], [7, 13, 'c'], [8, 15, 'c'], [10, 14]],
        [[10, 10], [11, 13, 'c'], [12, 15, 'c'], [14, 14]]],
  'c': [[[15, 10], [11, 10, 'c'], [8, 11, 'c'], [5, 13, 'c'], [6, 15, 'c'], [9, 15, 'c'], [11, 14]]],
  'd': [{'p': [[11, 10, 'c'], [12, 12, 'c'], [12, 14, 'c'], [10, 15, 'c'], [8, 15, 'c'], [7, 13, 'c'], [8, 11, 'c'], [10, 9, 'c'], [10, 7, 'c'], [11, 6, 'c'], [13, 7, 'c'], [12, 8, 'c']], 'closed': 1}],
  'e': [[[11, 11], [9, 11, 'c'], [7, 13, 'c'], [9, 15, 'c'], [11, 15, 'c'], [13, 14]]],
  'f': [[[8, 0], [9, 16]],
        [[9, 8], [11, 8, 'c'], [13, 7, 'c'], [13, 4, 'c'], [13, 1, 'c'], [14, 0, 'c'], [15, 0, 'c'], [16, 1, 'c'], [15, 2, 'c'], [13, 3]],
        [[9, 8], [7, 8, 'c'], [5, 8, 'c'], [5, 9, 'c'], [6, 9]]],
  'g': [[[10, 10], [8, 10, 'c'], [6, 12, 'c'], [7, 14, 'c'], [9, 15, 'c'], [11, 14]],
        [[10, 10], [10, 7, 'c'], [11, 6, 'c'], [13, 6, 'c'], [14, 7, 'c'], [12, 9, 'c'], [11, 10, 'c'], [13, 14, 'c'], [13, 16, 'c'], [12, 18, 'c'], [9, 20]]],
  'h': [[[5, 11], [10, 11, 'c'], [13, 11], [10, 13, 'c'], [9, 15, 'c'], [11, 15, 'c'], [14, 14]]],
  'i': [[[8, 11], [10, 12, 'c'], [11, 14, 'c'], [12, 15]]],
  'j': [[[6, 10], [8, 13, 'c'], [10, 15, 'c'], [12, 15, 'c'], [13, 13, 'c'], [13, 11, 'c'], [12, 9, 'c'], [10, 7, 'c'], [11, 6, 'c'], [13, 6, 'c'], [13, 8, 'c'], [12, 10, 'c'], [10, 12]]],
  'k': [[[7, 0], [7, 15]],
        [[7, 4], [13, 4], [14, 3, 'c'], [14, 1, 'c'], [12, 0, 'c'], [10, 2, 'c'], [10, 4]],
        [[10, 4], [10, 14, 'c'], [11, 15, 'c'], [13, 14]]],
  'l': [[[13, 9], [11, 9, 'c'], [9, 10, 'c'], [8, 11, 'c'], [9, 13, 'c'], [11, 15, 'c'], [13, 15]],
        [[13, 9], [12, 11, 'c'], [10, 14, 'c'], [7, 19]]],
  'm': [[[6, 10], [8, 11, 'c'], [9, 13, 'c'], [10, 15, 'c'], [11, 15]],
        [[8, 11], [10, 9], [9, 7, 'c'], [10, 6, 'c'], [12, 6, 'c'], [13, 7, 'c'], [12, 9, 'c'], [11, 10, 'c'], [13, 12, 'c'], [14, 15, 'c'], [13, 17, 'c'], [10, 19]]],
  'n': [[[7, 6], [8, 5, 'c'], [10, 5, 'c'], [12, 7, 'c'], [13, 10, 'c'], [12, 13, 'c'], [10, 15]],
        [[7, 11], [9, 14, 'c'], [10, 15]]],
  'o': [{'p': [[10, 10, 'c'], [12, 11, 'c'], [12, 13, 'c'], [11, 14, 'c'], [9, 15, 'c'], [8, 13, 'c'], [9, 11, 'c']], 'closed': 1}],
  'p': [[[9, 0], [9, 16]],
        [[9, 0], [7, 0, 'c'], [5, 1, 'c'], [4, 2, 'c'], [6, 3, 'c'], [9, 3], [13, 3]],
        [[13, 3], [13, 1, 'c'], [14, 0, 'c'], [15, 0, 'c'], [16, 1, 'c'], [15, 2, 'c'], [13, 3], [14, 4, 'c'], [14, 7, 'c'], [12, 8, 'c'], [9, 8]],
        [[9, 6], [7, 6, 'c'], [5, 6, 'c'], [4, 7, 'c'], [4, 9, 'c'], [6, 9, 'c'], [7, 9]]],
  'q': [[[10, 7], [5, 11], [10, 11], [15, 10]],
        [[10, 7], [10, 15, 'c'], [10, 18]]],
  'r': [[[8, 6], [9, 3, 'c'], [11, 3, 'c'], [13, 4, 'c'], [13, 7, 'c'], [12, 10, 'c'], [10, 11]],
        [[7, 11], [9, 13, 'c'], [10, 15, 'c'], [11, 15]]],
  's': [[[7, 5], [9, 3, 'c'], [11, 2, 'c'], [13, 3, 'c'], [13, 6, 'c'], [11, 8, 'c'], [8, 10, 'c'], [8, 12, 'c'], [9, 14, 'c'], [11, 15, 'c'], [13, 14]]],
  't': [[[8, 0], [8, 15]],
        [[8, 0], [6, 1, 'c'], [5, 3, 'c'], [5, 5], [12, 5]],
        [[12, 4], [12, 14, 'c'], [13, 15, 'c'], [15, 14]],
        [[12, 4], [12, 1, 'c'], [14, 0, 'c'], [16, 0, 'c'], [17, 2, 'c'], [15, 4, 'c'], [12, 5]]],
  'v': [[[7, 15], [9, 12, 'c'], [10, 11, 'c'], [11, 12, 'c'], [13, 15]]],
  'x': [[[7, 9], [13, 9]],
        [[10, 9], [10, 12, 'c'], [7, 15]],
        [[10, 12], [13, 15]]],
  'y': [[[11, 14], [9, 14, 'c'], [7, 13, 'c'], [8, 11, 'c'], [10, 10, 'c'], [12, 11, 'c'], [13, 13, 'c'], [12, 16, 'c'], [10, 19, 'c'], [7, 20]]],
  'z': [[[5, 11], [9, 11], [11, 14, 'c'], [12, 15], [15, 15]],
        [[13, 11], [13, 12]]],
  'ch': [[[16, 10], [10, 10], [6, 10, 'c'], [3, 12, 'c'], [4, 15, 'c'], [6, 15, 'c'], [9, 14]],
        [[16, 10], [13, 12, 'c'], [12, 14, 'c'], [14, 15, 'c'], [17, 14]]],
  'sh': [[[3, 5], [5, 3, 'c'], [7, 2, 'c'], [9, 3, 'c'], [9, 6, 'c'], [8, 8, 'c'], [5, 9, 'c'], [4, 11, 'c'], [4, 13, 'c'], [6, 15, 'c'], [9, 14]],
        [[9, 11], [16, 11], [13, 13, 'c'], [13, 15, 'c'], [15, 15, 'c'], [18, 14]]],
  'cth': [[[9, 10], [3, 10], [1, 11, 'c'], [0, 13, 'c'], [2, 15, 'c'], [4, 15, 'c'], [6, 14]],
        [[12, 10], [19, 10], [16, 13, 'c'], [16, 15, 'c'], [18, 15, 'c'], [20, 14]],
        [[7, 0], [7, 15]],
        [[7, 0], [5, 1, 'c'], [4, 2, 'c'], [3, 4, 'c'], [4, 5], [11, 5]],
        [[11, 4], [11, 14, 'c'], [12, 15, 'c'], [14, 14]],
        [[11, 4], [11, 1, 'c'], [12, 0, 'c'], [14, 0, 'c'], [16, 1, 'c'], [15, 3, 'c'], [12, 4]]],
  'ckh': [[[9, 10], [4, 10], [1, 12, 'c'], [1, 14, 'c'], [3, 15, 'c'], [5, 15, 'c'], [7, 14]],
        [[12, 10], [18, 10], [15, 13, 'c'], [16, 15, 'c'], [18, 15, 'c'], [20, 14]],
        [[8, 0], [8, 15]],
        [[8, 4], [14, 4], [15, 2, 'c'], [14, 0, 'c'], [12, 0, 'c'], [11, 2, 'c'], [11, 4]],
        [[11, 4], [11, 14, 'c'], [12, 15, 'c'], [13, 14]]],
  'cph': [[[9, 10], [5, 10], [2, 11, 'c'], [1, 13, 'c'], [3, 15, 'c'], [5, 15, 'c'], [7, 14]],
        [[11, 10], [18, 10], [15, 13, 'c'], [16, 15, 'c'], [18, 15, 'c'], [20, 14]],
        [[9, 0], [9, 15]],
        [[9, 0], [6, 0, 'c'], [4, 1, 'c'], [5, 2, 'c'], [7, 3], [14, 3]],
        [[14, 3], [12, 1, 'c'], [13, 0, 'c'], [15, 0, 'c'], [15, 2, 'c'], [14, 3], [14, 5, 'c'], [12, 7, 'c'], [9, 7]],
        [[9, 7], [6, 6, 'c'], [4, 7, 'c'], [5, 9, 'c'], [7, 9]]],
  'cfh': [[[10, 10], [5, 10], [1, 12, 'c'], [1, 14, 'c'], [3, 15, 'c'], [5, 15, 'c'], [6, 14]],
        [[12, 10], [18, 10], [15, 13, 'c'], [16, 15, 'c'], [18, 15, 'c'], [20, 14]],
        [[9, 0], [9, 16]],
        [[10, 3], [12, 3], [12, 1, 'c'], [13, 0, 'c'], [15, 0, 'c'], [15, 2, 'c'], [13, 3, 'c'], [12, 5, 'c'], [12, 7, 'c'], [9, 7]],
        [[9, 7], [7, 7, 'c'], [5, 8, 'c'], [5, 9, 'c'], [6, 9]]],
}


def through(pts, closed):
  """The points in P are where the line should GO. The app draws a run of
  'c' points as a uniform cubic B-spline (bspline() in www/otf5.js), which
  passes near a point at (before + 4 x point + after) / 6 -- inside it, not
  through it -- so a curve drawn straight from P comes out shrunk, its rings
  do not close and its joins fall short. This puts each 'c' point where the
  spline has to be told to be for the line to pass through the point read,
  then back on the lattice. A point without 'c' is passed through as it is,
  which is why a join or a corner never carries one."""
  m = len(pts)
  soft = [len(q) > 2 and (closed or 0 < i < m - 1) for i, q in enumerate(pts)]
  want = [(float(q[0]), float(q[1])) for q in pts]
  ctl = list(want)
  for _ in range(40):
    nxt = list(ctl)
    for i in range(m):
      if not soft[i]:
        continue
      a = ctl[(i - 1) % m] if (closed or i > 0) else ctl[i]
      b = ctl[(i + 1) % m] if (closed or i < m - 1) else ctl[i]
      nxt[i] = ((6 * want[i][0] - a[0] - b[0]) / 4, (6 * want[i][1] - a[1] - b[1]) / 4)
    ctl = nxt
  out = []
  for i, q in enumerate(pts):
    x, y = (ctl[i] if soft[i] else want[i])
    x = int(round(min(max(x, 0), N - 1))); y = int(round(min(max(y, 0), N - 1)))
    out.append([x, y, 'c'] if len(q) > 2 else [x, y])
  return out


def strokes(letter):
  out = []
  for s in P[letter]:
    pts, closed = (s['p'], s.get('closed')) if isinstance(s, dict) else (s, 0)
    for q in pts:
      assert 0 <= q[0] < N and 0 <= q[1] < N, (letter, q)
    out.append({'p': through(pts, closed), 'closed': bool(closed)})
  return out


def grid(font, out, letters):
  """the font as a picture, the lattice over it, the points in red"""
  from PIL import Image, ImageDraw, ImageFont
  import numpy as np
  ST, V = 30, 4
  f = ImageFont.truetype(font, int(200 * (5.5 * ST) / 80))
  def ink(t):
    im = Image.new('L', (3000, 2000), 255)
    ImageDraw.Draw(im).text((600, 600), t, font=f, fill=0)
    return im, np.nonzero(np.asarray(im) < 128)
  _, (oy, _) = ink('o')
  os.makedirs(out, exist_ok=True)
  for t in letters:
    tmp, (ys, xs) = ink(t)
    W = (N + 2 * V) * ST
    ox = (10 + V + 0.5) * ST - (xs.min() + xs.max()) / 2
    oy_ = (FOOT + V + 0.8) * ST - oy.max()
    im = Image.new('RGB', (W, W), 'white')
    g = tmp.point(lambda v: 200 if v < 128 else 255).convert('RGB')
    im.paste(g.crop((int(-ox), int(-oy_), int(-ox) + W, int(-oy_) + W)), (0, 0))
    d = ImageDraw.Draw(im)
    at = lambda c, r: ((c + V + 0.5) * ST, (r + V + 0.5) * ST)
    for i in range(-V, N + V):
      col = (200, 0, 200) if i in (0, N - 1) else ((90, 90, 220) if i % 5 == 0 else (185, 185, 185))
      x, y = at(i, i)
      d.line([(x, 0), (x, W)], fill=col); d.line([(0, y), (W, y)], fill=col)
      d.text((x + 2, 2), str(i), fill=(0, 0, 160)); d.text((2, y + 2), str(i), fill=(0, 0, 160))
    d.line([(0, at(0, FOOT)[1]), (W, at(0, FOOT)[1])], fill=(0, 150, 0), width=2)
    for s in strokes(t):
      q = [at(p[0], p[1]) for p in s['p']] + ([at(*s['p'][0][:2])] if s['closed'] else [])
      d.line(q, fill=(230, 0, 0), width=4)
    im.save(os.path.join(out, t + '.png'))


def main():
  a = sys.argv[1:]
  if '--grid' in a:
    grid(a[a.index('--grid') + 1], a[a.index('--out') + 1], list(P))
    return
  res = {k: {'from': 'EVA Hand A, looked at', 'strokes': strokes(k)} for k in P}
  with open(OUT, 'w') as f:
    json.dump(res, f, indent=1)
    f.write('\n')
  print(f'{len(res)} letters:', ' '.join(res))


if __name__ == '__main__':
  main()
