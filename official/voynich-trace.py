#!/usr/bin/env python3
"""official/voynich-trace.py -- the Voynich letters, TRACED from the manuscript.

Run it:   python3 official/voynich-trace.py        -> official/voynich-strokes.json
                                                      official/ref/glyphs/*.png
          node official/voynich-draw.mjs           -> official/voynich.json

Needs Pillow, numpy and scikit-image (pip install Pillow numpy scikit-image).
NOT a check and not in the gate.

WHERE THE SHAPES COME FROM. The pages in official/ref/ -- Beinecke MS 408, the
2014 Beinecke/Yale scans, public domain (official/ref/SOURCE.md). EVA is used
for one thing only: to know WHICH shape on the page is which letter. No Voynich
font -- EVA Hand, pk「ヴォイニッチ手稿」, ヴォイニッチ等幅, Megami Voynich or any
other -- was opened, read or traced: docs/FEATURE_RULES.md § 2026-09-30, and
its 追記.

HOW A LETTER IS TRACED. Every letter lists two or three places on the page it
was found (`EX`), each cropped into official/ref/glyphs/<name>-<n>.png so the
choice can be looked at again. The one traced (`PICK`, default the first) is
drawn enlarged as <name>-grid.png with the app's lattice laid over it at the
page's scale and the ink's centre line (the scan thresholded and thinned) in
blue. The points in `P` are read off that picture -- dot by dot along the
centre line -- and the same picture is drawn again with them in red, so a
point that is off the ink is seen, not believed. The scan is about 1200
pixels across a page and a letter is about nine pixels tall: a centre line
taken by a program alone at that size came out with the loop of a gallows
missing and letters half or twice the size of their neighbours, which is why
the points are placed by reading the line rather than taken from it blind.

THE METRIC. One scale for the whole hand: a step of the lattice is STEP
pixels of the scan. A letter's foot on the page (`base`, where the bottom of
an o is) stands on row FOOT. With these the x-height is about five steps
(rows 9-14), a gallows reaches row 1, and the tail of a y row 19.
Two kinds of letter do not fit the square at that scale and are FITTED
(fit()): a benched gallows is wider than twenty-one steps, so it is narrowed;
a gallows from the first line of a paragraph (the p and the f found here)
rises higher than row 0, so what is above the foot is shortened. Only the
axis that overflows is touched, and the run prints which letters were.

A point is [column, row], or [column, row, 'c'] for a point the line bends
through (the curve flag in www/glyph.js). A stroke is a list of points, or
{'p': points, 'closed': 1} for a ring.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from skimage.filters import threshold_otsu
from skimage.morphology import skeletonize, remove_small_objects

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, 'ref')
GLY = os.path.join(REF, 'glyphs')
OUT = os.path.join(HERE, 'voynich-strokes.json')

STEP = 1.8        # pixels of the scan per step of the lattice
FOOT = 14         # the row the foot of the x-height stands on
N = 21            # dots each way (GGRID.n in www/glyph.js)
UP = 16           # how much the grid picture is enlarged

# letter -> examples: (folio, x0, x1, base) -- the letter's span across the
# line and the y of its foot, in pixels of official/ref/<folio>.jpg.
EX = {
  'o': [('f2r', 203, 221, 1208), ('f2r', 308, 323, 1105), ('f2r', 455, 471, 1174)],
  'e': [('f2r', 302, 312, 1241), ('f2r', 311, 321, 1241), ('f2r', 211, 222, 1105)],
  'a': [('f2r', 247, 262, 1063), ('f2r', 250, 266, 1171), ('f2r', 440, 454, 1173)],
  'i': [('f2r', 266, 274, 1166), ('f2r', 262, 269, 1066)],
  'n': [('f2r', 273, 296, 1166), ('f2r', 268, 291, 1066), ('f2r', 370, 392, 1067)],
  'd': [('f2r', 232, 247, 1064), ('f2r', 311, 324, 1169), ('f2r', 590, 604, 1175)],
  'y': [('f2r', 212, 231, 1064), ('f2r', 387, 404, 1172), ('f2r', 314, 332, 1244)],
  'q': [('f2r', 402, 419, 1065), ('f2r', 423, 441, 1107)],
  'l': [('f2r', 330, 346, 1165), ('f2r', 530, 552, 1072)],
  'r': [('f2r', 364, 380, 1204), ('f2r', 458, 470, 1211), ('f2r', 516, 529, 1212)],
  's': [('f2r', 454, 474, 1068)],
  'k': [('f2r', 290, 312, 1100), ('f2r', 279, 296, 1243), ('f2r', 526, 548, 1107)],
  'p': [('f2r', 300, 332, 231)],
  'f': [('f2r', 545, 574, 1071)],
  'ch': [('f2r', 278, 300, 1202), ('f2r', 329, 352, 1207)],
  'sh': [('f2r', 205, 232, 1240), ('f2r', 303, 332, 1066)],
  'cth': [('f2r', 398, 430, 1208), ('f2r', 502, 562, 1246)],
  't': [('f2r', 447, 473, 334), ('f2r', 193, 220, 365), ('f2r', 575, 599, 397)],
  'ckh': [('f2r', 249, 288, 430), ('f2r', 910, 951, 1153)],
  'cfh': [('f2r', 565, 614, 334)],
}
PICK = {}
# letter -> the traced strokes, read off <letter>-grid.png
P = {
  'o': [{'p': [[10, 9, 'c'], [12, 10, 'c'], [12, 13, 'c'], [11, 14, 'c'], [9, 14, 'c'], [8, 13, 'c'], [8, 10, 'c']], 'closed': 1}],
  'e': [[[11, 10], [9, 11, 'c'], [9, 13, 'c'], [11, 13, 'c'], [12, 13]]],
  'a': [[[9, 10], [7, 10, 'c'], [6, 12, 'c'], [6, 13, 'c'], [9, 13]],
        [[8, 10], [10, 11, 'c'], [11, 13, 'c'], [14, 13]]],
  'i': [[[7, 11], [8, 13, 'c'], [9, 14, 'c'], [11, 13]]],
  'n': [[[6, 10], [6, 12, 'c'], [8, 14, 'c'], [11, 14, 'c'], [12, 11, 'c'], [12, 9, 'c'], [10, 7, 'c'], [7, 7, 'c'], [6, 9]]],
  'd': [{'p': [[10, 8], [8, 10, 'c'], [6, 11, 'c'], [6, 13, 'c'], [8, 14, 'c'], [10, 13, 'c'], [10, 11, 'c'], [8, 10, 'c'],
               [7, 8, 'c'], [7, 6, 'c'], [9, 5, 'c'], [10, 7, 'c']], 'closed': 1}],
  'y': [[[11, 12], [9, 13, 'c'], [7, 12, 'c'], [7, 10, 'c'], [9, 9, 'c'], [11, 10, 'c'], [11, 13, 'c'], [10, 16, 'c'], [8, 18, 'c'], [6, 19]]],
  'q': [[[11, 8], [5, 12], [11, 13], [14, 13]], [[11, 8], [11, 19]]],
  'l': [[[9, 19], [11, 17, 'c'], [13, 13, 'c'], [11, 11, 'c'], [11, 9, 'c'], [13, 9, 'c'], [14, 10, 'c'], [14, 11, 'c'],
         [13, 13, 'c'], [14, 15, 'c'], [16, 14]]],
  'r': [[[6, 4], [8, 3, 'c'], [10, 4, 'c'], [11, 7, 'c'], [10, 10, 'c'], [8, 11]], [[6, 10], [8, 12, 'c'], [10, 14, 'c'], [12, 14]]],
  's': [[[10, 6], [12, 5, 'c'], [14, 6, 'c'], [15, 8, 'c'], [14, 10, 'c'], [11, 11, 'c'], [10, 13, 'c'], [12, 14, 'c'], [14, 13]]],
  'ch': [[[8, 14], [6, 14, 'c'], [5, 12, 'c'], [6, 10, 'c'], [7, 10, 'c'], [11, 10, 'c'], [14, 10]],
         [[14, 10], [13, 11, 'c'], [13, 13, 'c'], [14, 14, 'c'], [16, 13]]],
  'k': [[[5, 1], [5, 13]], [[5, 5], [9, 5]],
        [[10, 13], [9, 13], [9, 2, 'c'], [10, 0, 'c'], [12, 0, 'c'], [13, 2, 'c'], [12, 4, 'c'], [9, 5]]],
  'sh': [[[8, 13], [6, 13, 'c'], [5, 12, 'c'], [5, 11, 'c'], [6, 10, 'c'], [9, 10, 'c'], [13, 10, 'c'], [17, 11]],
         [[17, 11], [17, 13, 'c'], [18, 14, 'c'], [20, 14]],
         [[12, 4], [12, 2, 'c'], [13, 1, 'c'], [14, 1, 'c'], [15, 3]]],
  'cth': [[[7, 12], [5, 13, 'c'], [3, 13, 'c'], [3, 11, 'c'], [5, 10, 'c'], [8, 10], [21, 10]],
          [[21, 10], [20, 12, 'c'], [21, 13, 'c'], [23, 14, 'c'], [25, 13]],
          [[8, 3], [8, 13], [10, 12]], [[12, 3], [13, 13], [14, 12]], [[8, 3], [12, 3]],
          [[8, 3], [8, 1, 'c'], [7, -1, 'c'], [5, 0, 'c'], [5, 2, 'c'], [8, 3]],
          [[12, 3], [12, 0, 'c'], [14, -2, 'c'], [16, -1, 'c'], [16, 1, 'c'], [14, 3, 'c'], [12, 3]]],
  'f': [[[10, -5], [10, 13], [11, 13]],
        [[10, -1], [16, -1, 'c'], [18, -3, 'c'], [17, -5, 'c'], [15, -5, 'c'], [14, -3, 'c'], [14, 3, 'c'], [13, 4, 'c'], [10, 4]],
        [[10, 4], [7, 4, 'c'], [4, 4, 'c'], [2, 5, 'c'], [3, 7, 'c'], [5, 8]]],
  'p': [[[10, -5], [10, 13]],
        [[7, -6], [8, -5, 'c'], [12, -5], [16, -5], [16, 0, 'c'], [15, 1, 'c'], [10, 1]],
        [[10, 1], [6, 2, 'c'], [2, 2, 'c'], [-1, 3, 'c'], [0, 4, 'c'], [2, 4]]],
  't': [[[9, -2], [9, 13], [10, 13]], [[13, 3], [13, 13], [15, 13]], [[9, 3], [13, 3]],
        [[9, 3], [6, 3, 'c'], [3, 2, 'c'], [5, 0, 'c'], [8, -2, 'c'], [10, -2]],
        [[13, 3], [13, 1, 'c'], [15, -1, 'c'], [18, -1, 'c'], [20, 1, 'c'], [18, 3, 'c'], [15, 3, 'c'], [13, 3]]],
  'ckh': [[[4, 13], [2, 14, 'c'], [0, 13, 'c'], [0, 11, 'c'], [2, 10, 'c'], [5, 9, 'c'], [8, 9], [20, 8]],
          [[19, 8], [18, 10, 'c'], [18, 11, 'c'], [20, 11]],
          [[8, -1], [8, 12]], [[12, 1], [12, 12]], [[8, 1], [12, 1]],
          [[12, 1], [13, 0, 'c'], [15, -2, 'c'], [17, -2, 'c'], [17, 0, 'c'], [15, 1, 'c'], [12, 1]]],
  'cfh': [[[6, 13], [4, 13, 'c'], [3, 11, 'c'], [4, 10, 'c'], [8, 10], [18, 10]],
          [[18, 10], [17, 11, 'c'], [17, 12, 'c'], [18, 13, 'c'], [19, 13]],
          [[10, -4], [10, 13]],
          [[10, -4], [9, -3, 'c'], [8, -1, 'c'], [9, 0, 'c'], [10, 0]],
          [[10, 0], [14, 1, 'c'], [18, 0], [18, -2, 'c'], [19, -4, 'c'], [21, -4, 'c'], [23, -3, 'c'], [22, -1, 'c'],
           [20, 0, 'c'], [18, 2, 'c'], [15, 4, 'c'], [10, 4]],
          [[10, 4], [7, 3, 'c'], [3, 3, 'c'], [0, 3, 'c'], [-3, 4, 'c'], [-3, 5, 'c'], [-2, 6]]],
}

# Three letters the hand never writes on their own here, made of strokes
# traced above and nothing else: c and h are the two halves of the traced ch
# (EVA c and h are the halves of the bench), and no benched p was found on
# these pages, so cph is cfh's traced bench with the traced p standing on it
# -- both have their stem on column 10 and their foot on row FOOT, as read.
# letter -> [(traced letter, which of its strokes), ...]
FROM = {
  'c': [('ch', [0])],
  'h': [('ch', [1])],
  'cph': [('cfh', [0, 1]), ('p', [0, 1, 2])],
}


def fit(strokes):
  """centre the letter across the square, and bring back inside it the axis
  that overflows: across for a benched gallows (narrowed about column 10),
  above the foot for a tall gallows (shortened towards row FOOT). Returns the
  strokes and what was done, if anything."""
  pts = [p for s in strokes for p in s['p']]
  x0 = min(p[0] for p in pts); x1 = max(p[0] for p in pts)
  top = min(p[1] for p in pts)
  dx = 10 - (x0 + x1) / 2
  kx = min(1.0, (N - 1) / (x1 - x0)) if x1 > x0 else 1.0
  ky = min(1.0, FOOT / (FOOT - top)) if top < 0 else 1.0
  out = []
  for s in strokes:
    q = []
    for p in s['p']:
      x = 10 + (p[0] + dx - 10) * kx
      y = p[1] if p[1] >= FOOT else FOOT - (FOOT - p[1]) * ky
      x = int(round(min(max(x, 0), N - 1))); y = int(round(min(max(y, 0), N - 1)))
      pt = [x, y] + (['c'] if len(p) > 2 else [])
      if not q or q[-1][:2] != pt[:2]:
        q.append(pt)
    out.append({'p': q, 'closed': s['closed']})
  did = []
  if kx < 1: did.append('narrowed x%.2f' % kx)
  if ky < 1: did.append('shortened above the foot x%.2f' % ky)
  return out, did




def load(folio):
  return Image.open(os.path.join(REF, folio + '.jpg')).convert('L')


# letter -> how many steps more the grid picture shows on every side, for a
# letter that reaches past the square before fit() brings it back
VIEW = {'cth': 5, 'p': 6, 'f': 5, 't': 3, 'ckh': 5, 'cfh': 6}


def frame(ex, v=0):
  """the lattice square over the page: row FOOT on the letter's foot and
  column 10 on the middle of its span, and `v` steps more all round"""
  folio, x0, x1, base = ex
  cx = (x0 + x1) / 2
  left = cx - (10 + v) * STEP - STEP / 2
  top = base - (FOOT + v) * STEP - STEP / 2
  return folio, left, top, (N + 2 * v) * STEP


def centre_line(crop):
  a = np.asarray(crop).astype(float)
  a = np.percentile(a, 80) - a
  m = a > max(threshold_otsu(a), 18)
  m = remove_small_objects(m, max_size=UP * UP * 2)
  return skeletonize(m)


def grid(ex, strokes, path, v=0):
  folio, left, top, size = frame(ex, v)
  px = int(round(size * UP))
  crop = load(folio).transform((px, px), Image.EXTENT, (left, top, left + size, top + size), Image.BICUBIC)
  crop = ImageOps.autocontrast(crop, cutoff=1)
  sk = centre_line(crop)
  rgb = crop.convert('RGB')
  d = ImageDraw.Draw(rgb)
  def at(c, r):
    return ((c + v + 0.5) * STEP * UP, (r + v + 0.5) * STEP * UP)
  for i in range(-v, N + v):
    col = (150, 150, 150) if i % 5 else (90, 90, 200)
    if i in (0, N - 1): col = (200, 0, 200)
    x, _ = at(i, 0); _, y = at(0, i)
    d.line([(x, 0), (x, px)], fill=col, width=1)
    d.line([(0, y), (px, y)], fill=col, width=1)
    d.text((x + 2, 2), str(i), fill=(0, 0, 160))
    d.text((2, y + 2), str(i), fill=(0, 0, 160))
  _, fy = at(0, FOOT)
  d.line([(0, fy), (px, fy)], fill=(0, 150, 0), width=2)
  ys, xs = np.nonzero(sk)
  for y, x in zip(ys, xs):
    rgb.putpixel((int(x), int(y)), (0, 170, 255))
  for st in strokes or []:
    pts, closed = (st['p'], st.get('closed')) if isinstance(st, dict) else (st, 0)
    q = [at(p[0], p[1]) for p in pts]
    if closed:
      q = q + q[:1]
    d.line(q, fill=(230, 0, 0), width=3)
    for p, pt in zip(q, pts):
      r = 5
      d.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), outline=(230, 0, 0) if len(pt) > 2 else (0, 0, 0), width=2)
  rgb.save(path)


def crop_of(ex, path):
  folio, x0, x1, base = ex
  im = load(folio).crop((x0 - 3, base - 28, x1 + 3, base + 10))
  im.resize((im.width * 8, im.height * 8), Image.BICUBIC).save(path)


def main():
  os.makedirs(GLY, exist_ok=True)
  res = {}
  for letter, exs in EX.items():
    for i, ex in enumerate(exs):
      crop_of(ex, os.path.join(GLY, f'{letter}-{i + 1}.png'))
    k = PICK.get(letter, 0)
    grid(exs[k], P.get(letter), os.path.join(GLY, f'{letter}-grid.png'), VIEW.get(letter, 0))
    if letter not in P:
      continue
    folio, x0, x1, base = exs[k]
    st = []
    for s in P[letter]:
      pts, closed = (s['p'], s.get('closed')) if isinstance(s, dict) else (s, 0)
      for p in pts:
        assert p[0] == int(p[0]) and p[1] == int(p[1]), (letter, p)
      st.append({'p': pts, 'closed': bool(closed)})
    st, did = fit(st)
    if did:
      print(f'  {letter}: {", ".join(did)}')
    res[letter] = {'from': f'{folio} x{x0}-{x1} foot y{base}', 'strokes': st}
  for letter, parts in FROM.items():
    st = []
    for src, which in parts:
      for i in which:
        one = P[src][i]
        pts, closed = (one['p'], one.get('closed')) if isinstance(one, dict) else (one, 0)
        st.append({'p': pts, 'closed': bool(closed)})
    st, did = fit(st)
    if did:
      print(f'  {letter}: {", ".join(did)}')
    res[letter] = {'from': 'made of ' + ' + '.join(f'{src} strokes {which}' for src, which in parts), 'strokes': st}
  with open(OUT, 'w') as f:
    json.dump(res, f, indent=1)
    f.write('\n')
  print(f'{len(res)} letters ({len(res) - len(FROM)} traced, {len(FROM)} made of traced strokes):', ' '.join(res))


if __name__ == '__main__':
  main()
