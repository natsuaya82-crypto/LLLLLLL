/* Lingua — the interface in 한국어 (ko).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- ko — 한국어 ---------------------------------------------------------- */
defLang('ko', (function(){
  /* ------------------------------------------------------------------------
     Lingua reading table — Korean (ko), written in 한글.

     Two entry points:
       syl_ko(p)    one syllable {on,nu,co} -> a string of Hangul blocks
       word_ko(ps)  every syllable of one word -> the finished reading

     Everything else in this file carries a _ko / _KO suffix so it cannot
     collide with the other nine languages sharing one global scope.

     No Hangul character is ever written as a literal syllable block below.
     Every block is composed arithmetically from three jamo indices:

         code = 0xAC00 + (initial * 21 + medial) * 28 + final

     which is exactly how the Unicode Hangul Syllables area is laid out:
     19 initials x 21 medials x 28 finals = 11172 blocks, in that nesting
     order.  The three index tables are spelled out in full below, because
     the next person to read this file will not have them memorised.
     ------------------------------------------------------------------------ */

  /* --- table 1 of 3: the 19 initials (초성), in Unicode order ---------------
       0 ㄱ    1 ㄲ    2 ㄴ    3 ㄷ    4 ㄸ    5 ㄹ    6 ㅁ
       7 ㅂ    8 ㅃ    9 ㅅ   10 ㅆ   11 ㅇ   12 ㅈ   13 ㅉ
      14 ㅊ   15 ㅋ   16 ㅌ   17 ㅍ   18 ㅎ
     ㅇ (11) is the silent initial: a block that begins with a vowel still
     needs an initial slot filled, and ㅇ is the filler.                      */
  var CHO_KO = { G:0, GG:1, N:2, D:3, DD:4, R:5, M:6, B:7, BB:8, S:9, SS:10,
                 NIL:11, J:12, JJ:13, CH:14, K:15, T:16, P:17, H:18 };

  /* --- table 2 of 3: the 21 medials (중성), in Unicode order ----------------
       0 ㅏ a     1 ㅐ ae    2 ㅑ ya    3 ㅒ yae   4 ㅓ eo   5 ㅔ e
       6 ㅕ yeo   7 ㅖ ye    8 ㅗ o     9 ㅘ wa   10 ㅙ wae 11 ㅚ oe
      12 ㅛ yo   13 ㅜ u    14 ㅝ wo   15 ㅞ we   16 ㅟ wi  17 ㅠ yu
      18 ㅡ eu   19 ㅢ ui   20 ㅣ i
     Note that ㅑ ㅕ ㅛ ㅠ ㅖ ㅒ (the /j/ glides) and ㅘ ㅝ ㅟ ㅞ ㅙ (the /w/
     glides) live HERE, in the medial slot.  Korean has no initial /j/ or /w/
     consonant to put them in.                                               */
  var JUNG_KO = { A:0, AE:1, YA:2, YAE:3, EO:4, E:5, YEO:6, YE:7, O:8, WA:9,
                  WAE:10, OE:11, YO:12, U:13, WO:14, WE:15, WI:16, YU:17,
                  EU:18, UI:19, I:20 };

  /* --- table 3 of 3: the 28 finals (종성/받침), in Unicode order ------------
       0 (none)  1 ㄱ   2 ㄲ   3 ㄳ   4 ㄴ   5 ㄵ   6 ㄶ   7 ㄷ
       8 ㄹ      9 ㄺ  10 ㄻ  11 ㄼ  12 ㄽ  13 ㄾ  14 ㄿ  15 ㅀ
      16 ㅁ     17 ㅂ  18 ㅄ  19 ㅅ  20 ㅆ  21 ㅇ  22 ㅈ  23 ㅊ
      24 ㅋ     25 ㅌ  26 ㅍ  27 ㅎ
     Index 0 means "open syllable, no 받침".  Only a handful of these are ever
     used for loanwords: ㄴ ㄹ ㅁ ㅇ and the stops ㄱ ㅂ ㅅ.                    */
  var JONG_KO = { NONE:0, G:1, GG:2, GS:3, N:4, NJ:5, NH:6, D:7, R:8, RG:9,
                  RM:10, RB:11, RS:12, RT:13, RP:14, RH:15, M:16, B:17, BS:18,
                  S:19, SS:20, NG:21, J:22, CH:23, K:24, T:25, P:26, H:27 };

  var SBASE_KO = 0xAC00, SEND_KO = 0xD7A3;

  /* Compose one real Hangul syllable block from the three indices. */
  function block_ko(cho, jung, jong) {
    return String.fromCharCode(SBASE_KO + (cho * 21 + jung) * 28 + jong);
  }

  /* ------------------------------------------------------------------------
     Consonant -> initial (초성).

     /f/ /v/ /θ/ /z/ do not exist in Korean.  The conventional 외래어 표기법
     substitutions, used here:
         f -> ㅍ   (필름 film, 프랑스 France)
         v -> ㅂ   (바이올린 violin, 베토벤 Beethoven)
         th /θ/ -> ㅅ   (스미스 Smith, 스릴러 thriller)
         z -> ㅈ   (재즈 jazz, 지그재그 zigzag)
     /l/ and /r/ are one phoneme in Korean and share one letter, ㄹ.  See
     the positional handling further down — that is where the two differ.
     sh /ʃ/ takes ㅅ as its initial but forces a palatal medial (샤 셔 쇼 슈 시).
     ------------------------------------------------------------------------ */
  var INI_KO = {
    b: CHO_KO.B,  p: CHO_KO.P,  d: CHO_KO.D,  t: CHO_KO.T,
    g: CHO_KO.G,  k: CHO_KO.K,  m: CHO_KO.M,  n: CHO_KO.N,
    l: CHO_KO.R,  r: CHO_KO.R,  s: CHO_KO.S,  h: CHO_KO.H,
    ch: CHO_KO.CH,
    f: CHO_KO.P,  v: CHO_KO.B,  th: CHO_KO.S, z: CHO_KO.J,
    sh: CHO_KO.S
  };

  /* A consonant that has no vowel of its own gets ㅡ, the neutral vowel:
     a Korean syllable cannot hold a bare consonant, so 드라 for /dra/ and
     실바 for /sil.va/.  This is the [cho, jung] pair for such a block.
     ㅡ everywhere except the palatals, which take ㅣ (치) or ㅠ (슈).       */
  var LOOSE_KO = {
    b:[CHO_KO.B, JUNG_KO.EU],  p:[CHO_KO.P, JUNG_KO.EU],
    d:[CHO_KO.D, JUNG_KO.EU],  t:[CHO_KO.T, JUNG_KO.EU],
    g:[CHO_KO.G, JUNG_KO.EU],  k:[CHO_KO.K, JUNG_KO.EU],
    m:[CHO_KO.M, JUNG_KO.EU],  n:[CHO_KO.N, JUNG_KO.EU],
    l:[CHO_KO.R, JUNG_KO.EU],  r:[CHO_KO.R, JUNG_KO.EU],
    s:[CHO_KO.S, JUNG_KO.EU],  h:[CHO_KO.H, JUNG_KO.EU],
    f:[CHO_KO.P, JUNG_KO.EU],  v:[CHO_KO.B, JUNG_KO.EU],
    th:[CHO_KO.S, JUNG_KO.EU], z:[CHO_KO.J, JUNG_KO.EU],
    ch:[CHO_KO.CH, JUNG_KO.I],   /* 치 — ㅊ never takes ㅡ in loanwords     */
    sh:[CHO_KO.S,  JUNG_KO.I],   /* 시 — word-final /ʃ/, as in 키라시        */
    j:[CHO_KO.NIL, JUNG_KO.I],   /* a stranded glide /j/ is just 이          */
    w:[CHO_KO.NIL, JUNG_KO.U]    /* a stranded glide /w/ is just 우          */
  };
  /* ...except /ʃ/ before another consonant, which is 슈 (슈림프 shrimp). */
  var LOOSE_PRECONS_KO = { sh:[CHO_KO.S, JUNG_KO.YU] };

  /* Consonant -> 받침.  Only ㄴ ㅁ ㅇ ㄹ and the stops may close a Korean
     syllable; anything else has to become a block of its own via LOOSE_KO.
     /r/ is deliberately absent: a 받침 ㄹ is a lateral [l], so a coda tap is
     written as its own block 르 instead (아노르, 페르쿠 — cf. 카르멘, 바르셀로나).
     Voiced stops are given 받침 too (압/앗/악-type), so the block count matches
     the source; strict 외래어 표기법 would write 브 드 그 there.            */
  var BAT_KO = {
    n: JONG_KO.N,  m: JONG_KO.M,  l: JONG_KO.R,
    p: JONG_KO.B,  b: JONG_KO.B,
    t: JONG_KO.S,  d: JONG_KO.S,
    k: JONG_KO.G,  g: JONG_KO.G
  };

  /* Vowel -> medial.  The conlang's five vowels are continental and pure,
     which is the easy case: Korean has all five outright.  `y` as a nucleus
     is /i/, so it maps to ㅣ like `i`.                                      */
  var VOW_KO  = { a:JUNG_KO.A,  e:JUNG_KO.E,  i:JUNG_KO.I,
                  o:JUNG_KO.O,  u:JUNG_KO.U,  y:JUNG_KO.I };
  /* the same five after a /j/ glide ... */
  var VOW_J_KO = { a:JUNG_KO.YA, e:JUNG_KO.YE, i:JUNG_KO.I,   /* /ji/ is 이 */
                   o:JUNG_KO.YO, u:JUNG_KO.YU, y:JUNG_KO.I };
  /* ... and after a /w/ glide.  /wu/ is 우: ㅜ has no ㅜ-glide partner.     */
  var VOW_W_KO = { a:JUNG_KO.WA, e:JUNG_KO.WE, i:JUNG_KO.WI,
                   o:JUNG_KO.WO, u:JUNG_KO.U,  y:JUNG_KO.WI };

  /* ㅈ ㅉ ㅊ are already palatal in Korean, and Hangul orthography does not
     write a y-glide after them: 챠 is spelled 차, 쥬 is spelled 주.  This
     table folds a y-medial back onto its plain partner.                     */
  var FLAT_KO = {};
  FLAT_KO[JUNG_KO.YA]  = JUNG_KO.A;
  FLAT_KO[JUNG_KO.YAE] = JUNG_KO.AE;
  FLAT_KO[JUNG_KO.YEO] = JUNG_KO.EO;
  FLAT_KO[JUNG_KO.YE]  = JUNG_KO.E;
  FLAT_KO[JUNG_KO.YO]  = JUNG_KO.O;
  FLAT_KO[JUNG_KO.YU]  = JUNG_KO.U;

  /* ------------------------------------------------------------------------
     Normalising the raw spelling fragments.
     ------------------------------------------------------------------------ */

  /* Consonant string -> array of units, with the spelling-only letters
     resolved: c q -> k, x -> k+s, y -> the glide j.  Digraphs are split by
     splitC(), never by single characters.  Adjacent identical units are
     collapsed: Korean writes a doubled consonant once (Cannes 칸, Ann 앤).  */
  function cons_ko(str) {
    var u = splitC(String(str || '').toLowerCase()), out = [], i, c;
    for (i = 0; i < u.length; i++) {
      c = u[i];
      if (c === 'c' || c === 'q') c = 'k';
      else if (c === 'y') c = 'j';
      else if (c === 'x') { if (out[out.length - 1] !== 'k') out.push('k'); c = 's'; }
      if (out.length && out[out.length - 1] === c) continue;
      out.push(c);
    }
    return out;
  }

  /* Vowel string -> array of vowel letters.
     A doubled vowel is a long vowel in the source.  Hangul has no length
     mark at all — modern spelling simply does not write vowel length — so
     `uu` is written 우, exactly like `u`.  The length is lost; nothing else
     would be readable.  Two DIFFERENT vowels are kept as two letters and
     become two blocks (ae -> 아에), which is what Korean does with hiatus.  */
  function vows_ko(str) {
    var v = String(str || '').toLowerCase().split(''), out = [], i;
    for (i = 0; i < v.length; i++) {
      if (i > 0 && v[i] === v[i - 1]) continue;   /* long vowel -> one block */
      out.push(v[i]);
    }
    return out;
  }

  /* ------------------------------------------------------------------------
     syl_ko — one syllable of the source becomes one or more Hangul blocks.
     ------------------------------------------------------------------------ */
  function syl_ko(p) {
    var on = cons_ko(p.on), nu = vows_ko(p.nu), co = cons_ko(p.co);
    var out = '', glide = '', i, c;

    /* 1. A glide is not an initial.  /j/ and /w/ have no consonant letter in
          Hangul; they are carried by the medial (ㅑ ㅛ ㅠ ㅘ ㅝ ㅟ ...).  Pull
          a trailing j/w off the onset and remember it.                       */
    if (on.length && (on[on.length - 1] === 'j' || on[on.length - 1] === 'w')) {
      glide = on.pop();
    }
    /* 2. A nucleus-initial `y` before another vowel is the same glide,
          merely spelled as a vowel: ya -> ㅑ, yo -> ㅛ, yu -> ㅠ.             */
    if (!glide && nu.length > 1 && nu[0] === 'y') { glide = 'j'; nu.shift(); }

    /* 3. No vowel at all (an all-consonant fragment): every unit is loose.   */
    if (!nu.length) {
      if (glide) on.push(glide);
      for (i = 0; i < on.length; i++) out += loose_ko(on[i], i < on.length - 1);
      for (i = 0; i < co.length; i++) out += loose_ko(co[i], i < co.length - 1);
      return out;
    }

    /* 4. Choose the initial.  Only the last onset consonant can occupy it;
          everything in front of it is a cluster the Korean syllable cannot
          hold, so each of those becomes its own ㅡ block (드라, 실바, 스소).  */
    var initial = CHO_KO.NIL, palatal = false, lead = on;
    if (lead.length) {
      c = lead[lead.length - 1];
      /* 외래어 표기법: a consonant + /w/ splits into two blocks (스윙, 트위스트)
         unless the consonant is ㄱ ㅋ ㅎ, which keep it (펭귄, 쿼터, 휘슬).     */
      var keeps = (glide !== 'w') || c === 'g' || c === 'k' || c === 'h';
      if (keeps) { initial = INI_KO[c]; palatal = (c === 'sh'); lead = lead.slice(0, lead.length - 1); }
    }
    for (i = 0; i < lead.length; i++) out += loose_ko(lead[i], true);

    /* 5. The medial of the first block: plain, or glided, or palatalised
          because the initial is /ʃ/ (샤 셔 쇼 슈 시).                         */
    var med;
    if (glide === 'j' || palatal) med = VOW_J_KO[nu[0]];
    else if (glide === 'w') med = VOW_W_KO[nu[0]];
    else med = VOW_KO[nu[0]];
    if (med === undefined) med = JUNG_KO.EU;
    /* ㅈ ㅊ do not take a y-medial in Hangul spelling. */
    if ((initial === CHO_KO.J || initial === CHO_KO.JJ || initial === CHO_KO.CH) &&
        FLAT_KO[med] !== undefined) med = FLAT_KO[med];

    /* 6. Hiatus: the second and later vowels of the nucleus each get a block
          of their own on the silent initial ㅇ (ae -> 아에, ia -> 이아).       */
    var blocks = [[initial, med]];
    for (i = 1; i < nu.length; i++) {
      blocks.push([CHO_KO.NIL, VOW_KO[nu[i]] === undefined ? JUNG_KO.EU : VOW_KO[nu[i]]]);
    }

    /* 7. The coda.  Only a consonant sitting directly on the vowel can be a
          받침, and only if it is one of ㄴ ㅁ ㅇ ㄹ or a stop.  Everything
          after that, and everything that cannot be a 받침 in the first place,
          becomes its own block (안스, 아스트, 나에스, 아노르).                 */
    var jong = JONG_KO.NONE, tail = '';
    for (i = 0; i < co.length; i++) {
      c = co[i];
      if (i === 0 && BAT_KO[c] !== undefined) jong = BAT_KO[c];
      else tail += loose_ko(c, i < co.length - 1);
    }
    blocks[blocks.length - 1].push(jong);

    for (i = 0; i < blocks.length; i++) {
      out += block_ko(blocks[i][0], blocks[i][1], blocks[i][2] || JONG_KO.NONE);
    }
    out += tail;

    /* 8. A single ㄹ between two vowels is a tap [ɾ], not [l].  When the
          initial ㄹ of this syllable came from an /l/ and there is an
          epenthetic block right in front of it, double it: 받침 ㄹ + 초성 ㄹ
          (슬라이드 slide, 해들리 Hadley).  The cross-syllable case is handled
          in word_ko, which can see the previous syllable.                    */
    if (lead.length && on.length && on[on.length - 1] === 'l') out = add_bat_ko(out, lead.length - 1, JONG_KO.R);
    return out;
  }

  /* One consonant as a block of its own.  `preCons` picks 슈 over 시 for /ʃ/. */
  function loose_ko(c, preCons) {
    var pair = (preCons && LOOSE_PRECONS_KO[c]) || LOOSE_KO[c];
    if (!pair) pair = [CHO_KO.NIL, JUNG_KO.EU];
    return block_ko(pair[0], pair[1], JONG_KO.NONE);
  }

  /* Add a 받침 to the block at `pos` (negative counts from the end), if that
     block is a Hangul syllable that has no 받침 yet.  Decomposition is the
     same arithmetic run backwards: (code - 0xAC00) % 28 is the final index.  */
  function add_bat_ko(str, pos, jong) {
    if (pos < 0) pos += str.length;
    if (pos < 0 || pos >= str.length) return str;
    var code = str.charCodeAt(pos);
    if (code < SBASE_KO || code > SEND_KO) return str;
    if ((code - SBASE_KO) % 28 !== 0) return str;          /* already closed */
    return str.slice(0, pos) + String.fromCharCode(code + jong) + str.slice(pos + 1);
  }

  /* A voiceless stop between a vowel and a non-sonorant consonant is written
     as a 받침 rather than as its own ㅡ block: 멕시코 Mexico, 액트 act,
     셋백 setback.  Before a liquid or a nasal it keeps the ㅡ (아크릴 acrylic). */
  var BAT_STOP_KO = { p: JONG_KO.B, t: JONG_KO.S, k: JONG_KO.G };
  var SONOR_KO = { l:1, r:1, m:1, n:1, w:1, j:1 };

  /* ------------------------------------------------------------------------
     word_ko — every syllable of one word, in order.

     Korean does not mark stress, so the house style's first-syllable capital
     has nothing to attach to: Hangul has no case, and 한글 표기 never marks
     prominence.  There is no syllable separator either — a Hangul block is
     already visibly one syllable, so a hyphen would only look like a compound
     boundary.  The blocks are therefore joined with nothing at all.
     ------------------------------------------------------------------------ */
  function word_ko(ps) {
    var out = [], i, u;
    for (i = 0; i < ps.length; i++) out.push(syl_ko(ps[i]));

    /* The ㄹㄹ rule across a syllable boundary.  An intervocalic /l/ would be
       read as a tap if written with one ㄹ, so it is doubled onto the coda of
       the block before it: 엘로라 Elora, 아엘린 Aelin, 바엘로스 Vaeloth
       (cf. 햄릿 Hamlet, 헨리 Henley).  A tap /r/ is left single: 미라에.      */
    for (i = 1; i < ps.length; i++) {
      u = cons_ko(ps[i].on);
      if (u.length && u[0] === 'l') { out[i - 1] = add_bat_ko(out[i - 1], -1, JONG_KO.R); continue; }
      /* and the 받침 stop rule, which also needs the previous syllable in view */
      if (u.length > 1 && BAT_STOP_KO[u[0]] !== undefined && !SONOR_KO[u[1]]) {
        var moved = add_bat_ko(out[i - 1], -1, BAT_STOP_KO[u[0]]);
        if (moved !== out[i - 1]) { out[i - 1] = moved; out[i] = out[i].slice(1); }
      }
    }
    return out.join('');
  }

  return {
    label  : "한국어",
    rdName : "한글 표기",
    all    : "전체",
    pos    : {n:"명사", v:"동사", adj:"형용사", adv:"부사", pro:"대명사", num:"수사", part:"조사", conj:"접속사", intj:"감탄사", aff:"접사", nm:"고유명사", x:"기타", idm:"관용구"},
    read   : mkApprox(word_ko, syl_ko),
    str    : {
      "cap.warn"                  : "무료 플랜에서 {0}개 더 가능",
      "cap.hid"                   : "숨김 {0}",
      "cap.lapse.h"               : "플랜이 끝났습니다",
      "cap.lapse.d"               : "무료 플랜으로 돌아갑니다. 사전은 100개까지 보여 줍니다. <b>지워진 것은 없습니다.</b> 전부 그대로 있고 백업에도 있습니다.",
      "cap.lapse.ok"              : "닫기",
      "ch.clear"                  : "글자 없음",
      "ch.for"                    : "“{0}”의 글자",
      "ob.back"                   : "뒤로",
      "kb.title"               : "키보드",
      "kb.key"               : "키",
      "kb.key.del"               : "이 키 삭제",
      "kb.what"               : "눌렀을 때",
      "kb.w"               : "너비",
      "kb.on"               : "누르기",
      "kb.del"               : "지우기",
      "kb.sp"               : "스페이스",
      "kb.lay"               : "층",
      "kb.lay.rm"          : "이 층 삭제",
      "kb.lay.rm.q"        : "이 층을 삭제할까요? 이 층으로 가던 키는 첫 번째 층을 가리킵니다.",
      "kb.lay.add"               : "층 추가",
      "kb.ret"             : "줄바꿈",
      "kb.dir.up"               : "위",
      "kb.dir.right"               : "오른쪽",
      "kb.dir.down"               : "아래",
      "kb.dir.left"               : "왼쪽",
      "kb.empty"               : "없음",
      "kb.row.ins" : "여기에 행 추가",
      "kb.row.up" : "이 행 위에",
      "kb.row.down" : "이 행 아래에",
      "kb.row.sel" : "이 행 선택",
      "kb.col.sel" : "이 열 선택",
      "kb.cell.add" : "여기에 키 추가",
      "kb.key.join" : "옆의 키와 합치기",
      "kb.key.open" : "이 키가 하는 일",
      "kb.col.ins" : "여기에 열 추가",
      "kb.col.l" : "이 열의 왼쪽",
      "kb.col.r" : "이 열의 오른쪽",
      "kb.al.l" : "왼쪽 정렬",
      "kb.al.c" : "가운데 정렬",
      "kb.al.r" : "오른쪽 정렬",
      "kb.cut" : "선택한 항목 삭제",
      "kb.undo" : "실행 취소",
      "kb.redo" : "다시 실행",
      "kb.step1" : "'새로운 키보드 추가' 누르기",
      "kb.step1.d" : "설정 → 일반 → 키보드 → 키보드",
      "kb.step2" : "Lingua 고르기",
      "kb.step3" : "Lingua 설정에서 '키보드' 누르기",
      "kb.step4" : "'전체 접근 허용' 켜기",
      "kb.sys.h"               : "키보드 설정 방법",
      "kb.sys.go" : "설정 열기",
      "kb.sys.no" : "설정을 열 수 없습니다",
      "kb.rom"               : "각 키에 글자 표시",
      "kb.free.no" : "무료 플랜의 키보드는 편집할 수 없습니다.",
      "kb.free.up" : "직접 키보드를 만들려면 업그레이드하세요.",
      "kb.up.go" : "업그레이드하기",
      "kb.reset"               : "처음부터 다시",
      "kb.pat.set" : "배열",
      "kb.pat.q" : "배열을 바꾸면 현재 키보드에 설정한 문자와 키가 삭제됩니다.",
      "kb.pat.qwerty" : "QWERTY",
      "kb.pat.qwerty.d" : "10 / 9 / 7 과 숫자 줄",
      "kb.pat.flick" : "플릭",
      "kb.pat.flick.d" : "열두 개의 키, 각 키에 네 방향",
      "kb.pat.tap" : "탭",
      "kb.pat.tap.d" : "키 하나에 글자 하나, 한 줄에 다섯",
      "kb.pat.chart" : "음표",
      "kb.pat.chart.d" : "세로는 자음, 가로는 모음",
      "kb.pat.abc" : "ABC 순",
      "kb.pat.abc.d" : "이름 순으로 한 줄에 열",
      "kb.apply" : "휴대폰에 적용",
      "kb.new" : "키보드 추가",
      "kb.n" : "키보드 {0}",
      "kb.done" : "완료",
      "kb.lt.ok" : "확인",
      "kb.rm" : "이 키보드 삭제",
      "kb.sel" : "선택",
      "kb.sel.done" : "완료",
      "kb.sel.del" : "삭제",
      "kb.sel.row" : "이 키보드 선택",
      "kb.rm.n" : "키보드 {0}개를 삭제할까요?",
      "kb.rm.q" : "이 키보드를 삭제할까요? 나머지는 그대로입니다.",
      "kb.full" : "키보드는 {0}개까지입니다",
      "kb.reset.ask"               : "이 키보드를 버리고 처음 것으로 되돌릴까요?",
      "kb.reset.done"               : "키보드를 다시 만들었습니다",
      "ipa.b.back"                : "후설",
      "ipa.b.central"             : "중설",
      "ipa.b.front"               : "전설",
      "ipa.d.mine" : "이 언어가 이미 가지고 있는 소리.",
      "ipa.d.vows" : "입을 벌린 채 목소리만으로 내는 소리. 혀의 위치와 입술을 둥글게 하는지가 차이의 전부다.",
      "ipa.d.other" : "위의 어느 줄에도 들어가지 않는 소리: 혀차는 소리, 숨을 들이쉬며 내는 소리 등.",
      "ipa.d.m.plosive" : "숨을 막았다가 한 번에 터뜨린다",
      "ipa.d.m.nasal" : "숨을 코로 내보낸다",
      "ipa.d.m.trill" : "떨리게 한다",
      "ipa.d.m.tap" : "한 번만 튕긴다",
      "ipa.d.m.fricative" : "좁은 틈으로 숨을 밀어낸다",
      "ipa.d.m.latfric" : "혀 양옆으로 숨을 밀어낸다",
      "ipa.d.m.approx" : "닿지 않게 가까이 한다",
      "ipa.d.m.latapprox" : "혀 양옆으로 소리를 내보낸다",
      "ipa.h.close"               : "고모음",
      "ipa.h.closemid"            : "중고모음",
      "ipa.h.mid"                 : "중모음",
      "ipa.h.nearclose"           : "근고모음",
      "ipa.h.nearopen"            : "근저모음",
      "ipa.h.open"                : "저모음",
      "ipa.h.openmid"             : "중저모음",
      "ipa.m.approx"              : "접근음",
      "ipa.m.fricative"           : "마찰음",
      "ipa.m.latapprox"           : "설측접근",
      "ipa.m.latfric"             : "설측마찰",
      "ipa.m.nasal"               : "비음",
      "ipa.m.plosive"             : "파열음",
      "ipa.m.tap"                 : "탄음",
      "ipa.m.trill"               : "전동음",
      "ipa.mine"                  : "이 언어의 소리",
      "ipa.other"                 : "기타",
      "ipa.p.alveolar"            : "치경",
      "ipa.p.bilabial"            : "양순",
      "ipa.p.dental"              : "치",
      "ipa.p.glottal"             : "성문",
      "ipa.p.labiodental"         : "순치",
      "ipa.p.palatal"             : "경구개",
      "ipa.p.pharyngeal"          : "인두",
      "ipa.p.postalveolar"        : "후치경",
      "ipa.p.retroflex"           : "권설",
      "ipa.p.uvular"              : "구개수",
      "ipa.p.velar"               : "연구개",
      "ipa.vows"                  : "모음",
      "set.account"               : "계정",
      "set.account.guest"         : "로그인 안 함",
      "ob.borrow.h"               : "빌린 문자",
      "ob.borrow.sub"             : "　",
      "ob.borrow.take"            : "　",
      "ob.tour.tab" : "제작을 여세요.",
      "ob.tour.build" : "키보드를 눌러 보세요.",
      "ob.tour.kb1" : "방금 그린 글자가 여기 들어갔어요.",
      "ob.tour.sns" : "타임라인.",
      "ob.sns.a.n" : "Ilva",
      "ob.sns.a.h" : "ilva",
      "ob.sns.b.n" : "Toren",
      "ob.sns.b.h" : "toren",
      "ob.sns.c.n" : "Neri",
      "ob.sns.c.h" : "neri",
      "ob.sns.d.n" : "Sela",
      "ob.sns.d.h" : "sela",
      "ob.sns.e.n" : "Kai",
      "ob.sns.e.h" : "kai",
      "ob.sns.1.l" : "kena tolven ashi ra — vetal si mora.",
      "ob.sns.1.m" : "오늘 글자를 다 그렸어요. 스물여덟 개.",
      "ob.sns.2.l" : "sil oran keva, no meli tarun.",
      "ob.sns.2.m" : "잘 먹었다. 이 집은 발견이다.",
      "ob.sns.3.l" : "tamin era sol, kevas no ilta.",
      "ob.sns.3.m" : "집에 가는 전철. 하늘 좀 봐.",
      "ob.sns.4.l" : "arun teva mi kastel, ova neri sa.",
      "ob.sns.4.m" : "하루 종일 사전만 봤는데 아직 모자란다.",
      "ob.sns.5.l" : "nira toka mel evan, sudi la.",
      "ob.sns.5.m" : "고양이가 오후 내내 볕에서 자고 있다.",
      "ob.sns.6.l" : "lasu meri ton kavi, oras te.",
      "ob.sns.6.m" : "아침 산책. 뛰는 걸 너무 좋아한다.",
      "ob.sns.7.l" : "vora seln ki mata, resu ova.",
      "ob.sns.7.m" : "오늘은 손으로 만드는 날로 정했다.",
      "ob.sns.8.l" : "mel korva anta ve losin, hara si.",
      "ob.sns.8.m" : "한 잔만 하기로 했었는데.",
      "ob.tour.row.letters" : "글자를 누르세요.",
      "ob.tour.letters" : "당신의 글자.",
      "ob.coach.draw" : "손가락으로 선을 그어 보세요.",
      "ob.coach.drawn" : "좋아요. 더 그어도 되고, 다음으로 가도 됩니다.",
      "ob.draw.note" : "언제든 다시 그릴 수 있어요",
      "ob.skip" : "바로 로그인",
      "ob.draw.done"              : "완료",
      "ob.draw.empty"             : "먼저 한 획을 그어 주세요",
      "ob.lang.a"                 : "인터페이스 언어",
      "ob.or"                     : "이미 있는 문자 쓰기",
      "ob.name.h"                 : "언어의 이름은 무엇인가요?",
      "ob.name.ph"                : "이름",
      "ob.signin.apple"           : "Apple로 계속하기",
      "ob.signin.google"          : "Google로 계속하기",
      "ob.signin.mail" : "이메일로 계속",
      "ob.mail.h.code" : "메일을 확인하세요",
      "ob.mail.h.forgot" : "비밀번호 재설정",
      "ob.mail.em.ph" : "you@example.com",
      "ob.mail.pw.ph" : "비밀번호",
      "ob.mail.code.ph" : "00000000",
      "ob.mail.code.sub" : "{0} 로 여덟 자리 코드를 보냈습니다.",
      "ob.mail.in" : "로그인",
      "ob.mail.up" : "계정 만들기",
      "ob.mail.verify" : "확인",
      "ob.mail.send" : "보내기",
      "ob.mail.again" : "다시 보내기",
      "ob.mail.sent" : "보냈습니다",
      "ob.mail.taken" : "이 주소는 이미 등록되어 있습니다.",
      "ob.mail.none" : "이 주소의 계정이 없습니다.",
      "ob.mail.h.reset" : "새 비밀번호",
      "ob.mail.h.setpw" : "비밀번호 설정",
      "ob.mail.newpw.ph" : "새 비밀번호",
      "ob.mail.reset" : "설정",
      "ob.mail.wait" : "처리 중…",
      "ob.mail.to.forgot" : "비밀번호를 잊으셨나요?",
      "ob.signin.or" : "또는",
      "ob.bar.up" : "계정 만들기",
      "ob.docs" : "계속하면 아래 내용에 동의하는 것이 됩니다.",
      "ob.bar.in" : "로그인",
      "ob.who.h" : "이름과 ID",
      "ob.who.nm.ph" : "이름",
      "ob.who.hd.ph" : "id",
      "net.needname" : "이름을 입력하세요.",
      "net.badhandle" : "ID는 2~24자입니다: a–z, 0–9, _",
      "net.handle.taken" : "이미 사용 중인 ID입니다.",
      "net.offline" : "연결할 수 없습니다.",
      "net.none" : "통신 오류입니다.<br>신호가 좋은 곳에서 연결해 주세요.",
      "net.failed" : "되지 않았습니다.",
      "net.badlogin" : "주소나 비밀번호가 다릅니다.",
      "net.session" : "다시 로그인해 주세요.",
      "net.taken" : "그 주소에는 이미 계정이 있습니다.",
      "net.weak" : "비밀번호가 너무 짧습니다.",
      "net.toomany" : "시도가 너무 많습니다. 잠시 기다리세요.",
      "net.needmail" : "주소를 입력하세요.",
      "net.needcode" : "메일의 코드를 입력하세요",
      "net.needpass" : "새 비밀번호를 입력하세요",
      "net.nonative" : "이 빌드에서는 사용할 수 없습니다.",
      "set.account.on" : "로그인됨",
      "set.signout" : "로그아웃",
      "set.signout.ask" : "로그아웃할까요?",
      "set.signin.done" : "로그인되었습니다",
      "set.signout.done" : "로그아웃했습니다",
      "ob.tagline"                : "당신의 언어에 새로운 빛깔을.",
      "script.own.ph"             : "글자를 붙여넣거나 입력",
      "script.set"                : "적용",
      "up.cta"                    : "업그레이드",
      "up.need"                   : "Pro는 제한 없이 사용할 수 있습니다.",
      "pop.no"                  : "닫기",
      "pop.yes"                 : "삭제",
      "keep.q"                  : "입력한 내용을 저장할까요?",
      "keep.yes"                : "예",
      "keep.no"                 : "아니오",
      "keep.save"               : "저장",
      "ws.arabic"                 : "아랍 문자",
      "ws.armenian"               : "아르메니아 문자",
      "ws.cyrillic"               : "키릴 문자",
      "ws.devanagari"             : "데바나가리",
      "ws.geez"                   : "그으즈 문자",
      "ws.georgian"               : "조지아 문자",
      "ws.glagolitic"             : "글라골 문자",
      "ws.greek"                  : "그리스 문자",
      "ws.hangul"                 : "한글",
      "ws.hebrew"                 : "히브리 문자",
      "ws.ogham"                  : "오검 문자",
      "ws.phoenician"             : "페니키아 문자",
      "ws.runic"                  : "룬 문자",
      "ws.thai"                   : "타이 문자",
      "ws.tibetan"                : "티베트 문자",
      "wld.title"    : "이 언어는 무엇을 위한 것인가",
      'wld.about'             : "이 언어에 대하여",
      'wld.edit'            : "편집",
      'wld.public'            : "이 언어를 다른 사람에게 보여주기",
      'wld.public.d' : "다른 사람이 당신의 언어 페이지를 열어 읽을 수 있습니다.",
      'wld.dl'       : "내려받기 허용",
      'wld.dl.d'     : "당신의 언어 페이지를 열 수 있는 사람이 문자와 단어를 내려받아 자기 언어에 쓸 수 있습니다.",
      'wld.hidden'            : "비공개",
      'wld.secs'              : "섹션",
      'wld.ov.v.ph'              : "내용",
      'wld.ov.del'              : "이 항목 지우기",
      'wld.overview'              : "개요",
      'wld.art.untitled'              : "제목 없음",
      'wld.art.t.ph'              : "제목",
      'wld.art.b.ph'              : "이 언어와 그 세계에 대해 쓰기.",
      'wld.shown'             : "공개",
      'wld.dl.get'            : "다운로드",
      'wld.dl.can'            : "내려받기 가능",
      'wld.empty'             : "아직 아무것도 없습니다.",
      "wld.where"    : "말해지는 곳",
      "wld.where.ph" : "북쪽 골짜기",
      "wld.who"      : "말하는 사람들",
      "wld.who.ph"   : "강가 사람들",
      "home.name.prompt" : "언어의 이름",
      "toc.words"        : "어휘",
      "sent.nomean"      : "뜻 없음",
      "tab.build"        : "만들기",
      "tab.explore"       : "탐색",
      "tab.notif"       : "알림",
      "tab.me"          : "프로필",
      "me.edit"         : "편집",
      'me.follow'             : "팔로우",
      'me.unfollow'           : "팔로잉",
      'me.follows.you'           : "나를 팔로우합니다",
      "me.name"         : "이름",
      "me.handle"       : "아이디",
      'me.bio' : "자기소개",
      'me.bio.ph' : "자신에 대해 한두 줄",
      'me.link'   : "링크",
      'me.link.ph' : "https://",
      'me.loc'    : "위치",
      'me.loc.ph' : "",
      'me.pic.bad' : "이 이미지를 읽을 수 없습니다",
      'me.pic.pick' : "사진 선택",
      'me.pic.del' : "삭제",
      'me.pic.no' : "취소",
      'notes.sel' : '선택',
      'notes.sel.done' : '완료',
      'notes.sel.del' : '삭제',
      'notes.sel.row' : '이 메모 선택',
      'notes.sel.ask' : '메모 {0}개를 삭제할까요?',
      "post.new"        : "새 글",
      "post.ln.ph"      : "당신의 언어로 한 줄",
      "post.mn"         : "무슨 뜻인지",
      "post.send"       : "올리기",
      "post.none"       : "올릴 것이 없습니다",
      "post.del"        : "삭제",
      "post.del.q"      : "이 글을 삭제할까요?",
      "when.now"        : "방금",
      "when.m"          : "{0}분",
      "when.h"          : "{0}시간",
      "when.d"          : "{0}일",
      "sns.none"        : "아직 아무것도 없습니다",
      "sns.none.fo"     : "팔로우한 사람이 아직 쓴 글이 없습니다",
      "feed.rec"        : "추천",
      "feed.fo"         : "팔로잉",
      "feed.fil"        : "필터",
      "sort.title"      : "정렬",
      "sort.new"        : "최신",
      "sort.buzz"       : "인기",
      "sns.save"        : "이 단어 저장",
      "sns.saved"       : "저장됨",
      "sns.recent"      : "최근 검색",
      "sns.recent.drop" : "삭제",
      'sns.search'            : "찾기 — @ 는 사람",
      'sns.nohit'             : "찾지 못했습니다",
      'notif.like'            : "{0} 님이 좋아합니다",
      'notif.boost'           : "{0} 님이 다시 올렸습니다",
      'notif.reply'           : "{0} 님이 답했습니다",
      'notif.follow'          : "{0} 님이 팔로우했습니다",
      'notif.pick'            : "읽어볼 만합니다",
      'notif.other'           : "{0}",
      'notif.two'           : "{0} 및 {1}",
      'notif.many'           : "{1} 외 {0}명",
      "tab.find"         : "찾기",
      "tab.home"         : "홈",
      "help.q"           : "이게 뭔가요",
      "form.gone"        : "이건 이제 없습니다.",
      "find.ph"          : "검색",
      "find.by.snd"      : "소리로 찾기",
      "find.by.lt"       : "글자로 찾기",
      "find.todo"        : "남은 것",
      "find.todo.mn"     : "뜻 없는 낱말",
      "find.todo.lt"     : "소리 없는 글자",
      "find.todo.sn"     : "글자 없는 소리",
      "find.todo.st"     : "끝나지 않은 단계",
      "find.todo.no"     : "남은 것 없음",
      "find.in"          : "가져오기",
      "find.hit.snd"     : "{0} 이 들어간 낱말",
      "find.hit.lt"      : "{0} 로 쓰는 낱말",
      "find.back"        : "뒤로",
      "snd.drop" : "이 소리 삭제",
      "snd.inuse" : "{0}이(가) 아직 이 소리를 읽습니다",
      "toc.sound"        : "음운",
      "toc.letters"      : "문자",
      "ab.title"         : "모음 작업대",
      "ab.mark"          : "{0} 의 부호",
      "ab.every"         : "{0} 를 얹은 자음 전부",
      "ab.left"          : "왼쪽으로",
      "ab.right"         : "오른쪽으로",
      "ab.up"            : "위로",
      "ab.down"          : "아래로",
      "ab.bigger"        : "크게",
      "ab.smaller"       : "작게",
      "ab.draw"          : "부호 그리기",
      "ab.nomark"        : "아직 부호가 없습니다",
      "ab.nocons"        : "자음이 아직 없습니다.",
      "ab.novow"         : "모음이 아직 없습니다.",
      "ab.notabugida"    : "아부기다에서만",
      "lt.all"           : "알파벳",
      "lt.none"          : "아직 문자가 없습니다",
      "lt.new"           : "새 문자",
      "lt.untitled"      : "이름 없음",
      "lt.reads.none"    : "—",
      'lt.ab.h' : "글자",
      "lt.note" : "메모",
      "lt.fil" : "필터",
      "lt.sort.own" : "배열한 순서",
      "lt.sort.abc" : "이름순",
      "lt.sort.new" : "추가순",
      "lt.fil.all" : "전체",
      "lt.fil.drawn" : "그린 것",
      "lt.fil.blank" : "안 그린 것",
      "lt.fil.nosnd" : "소리 없음",
      "lt.title"     : "글자",
      "lt.reads.ph"     : "k, sh, ng, ka",
      "lt.dup"     : "{0} 은(는) 이미 사용 중",
      "ws.locked"     : "음절 문자·아브자드·아부기다·표어 문자",
      "dir.title"     : "쓰는 방향",
      "dir.ltr"       : "왼쪽에서 오른쪽",
      "dir.rtl"       : "오른쪽에서 왼쪽",
      "dir.ttb-rl"    : "세로쓰기, 오른쪽에서 왼쪽",
      "dir.ttb-lr"    : "세로쓰기, 왼쪽에서 오른쪽",
      "dir.ltr.eg" : "라틴 문자, 키릴 문자",
      "dir.rtl.eg" : "아랍 문자, 히브리 문자",
      "dir.ttb-rl.eg" : "일본어와 중국어의 세로쓰기",
      "dir.ttb-lr.eg" : "몽골 문자",
      "dir.locked"    : "쓰는 방향 고르기",
      "lt.name"          : "이름",
      "lt.loose"         : "아직 아무것도 읽지 않는 문자가 {0}개 있습니다.",
      "lt.loose.1"       : "아직 아무것도 읽지 않는 문자가 1개 있습니다.",
      "num.word"        : "수사",
      "num.h"           : "숫자",
      "num.base"        : "진법",
      "num.wid"         : "홈 화면에서는",
      "num.wid.how"     : "홈 화면 길게 누르기 → 편집 → 위젯 추가 → Lingua",
      "lt.marks"         : "기호",
      "toc.gram"         : "문법",
      /* what the app proposes */
      /* the grammar, in stages */
      "stg.grp.rule"     : "규칙",
      "stg.grp.chap"     : "장",
      "stg.words"        : "이 단계에 필요한 낱말",
      "stg.rules"        : "규칙",
      "stg.rules.ph"     : "　",
      "stg.ex"           : "예문",
      "g2.words"         : "단어",
      "g2.forms"         : "어형",
      "g2.der"           : "조어",
      "stg.ex.lb.ph"     : "",
      "stg.noun.t"       : "복수",
      "stg.noun.d"       : "둘 이상일 때의 형태",
      "stg.verb.t"       : "시제",
      "stg.verb.d"       : "과거·현재·미래",
      "stg.neg.not"      : "아니다",
      "stg.ask.why"      : "왜",
      "stg.ask.how"      : "어떻게",
      "stg.conj.t"       : "접속사",
      "stg.conj.d"       : "문장과 문장을 잇는 말",
      "stg.conj.and"     : "그리고",
      "stg.conj.or"      : "또는",
      "stg.conj.but"     : "그러나",
      "stg.conj.because" : "왜냐하면",
      "stg.conj.if"      : "만약",
      "stg.conj.then"    : "그러면",
      "stg.part.t"       : "조사",
      "stg.part.d"       : "말의 구실을 나타내는 작은 말",
      "stg.part.subj"    : "하는 쪽",
      "stg.part.obj"     : "당하는 쪽",
      "stg.part.rec"     : "받는 쪽",
      "stg.polite.t"     : "높임",
      "stg.polite.d"     : "공손할 때 말이 어떻게 달라지는지",
      "stg.where.t"      : "자리",
      "stg.where.in"     : "안에",
      "stg.where.on"     : "위에",
      "stg.where.under"  : "아래에",
      "stg.where.to"     : "으로",
      "stg.where.from"   : "에서",
      "stg.where.with"   : "와",
      "stg.where.d"      : "어디에 있고 어디로 가는지",
      "stg.when.t"       : "때",
      "stg.when.now"     : "지금",
      "stg.when.before"  : "전",
      "stg.when.after"   : "후",
      "stg.when.today"   : "오늘",
      "stg.when.tomorrow" : "내일",
      "stg.when.yesterday" : "어제",
      "stg.note"         : "메모",
      "stg.note.ph"      : "　",
      "stg.make"         : "지어 보기",
      "stg.own.add.btn"  : "항목 추가",
      "stg.own.h"        : "새 항목",
      "stg.own.title"    : "이름",
      "stg.own.title.ph" : "예: 높임말",
      "stg.own.words"    : "필요한 낱말",
      "stg.own.words.ph" : "한 줄에 하나씩\n비워 두어도 괜찮아요",
      "stg.own.add"      : "추가",
      "stg.own.need"     : "이름을 지어 주세요",
      "stg.own.added"    : "{0} 더했어요",
      "stg.own.untitled" : "이름 없는 단계",
      "stg.own.del"      : "항목 삭제",
      "stg.own.del.ask"  : "이 단계를 지울까요? 안에 있던 낱말은 어휘에 그대로 남아요.",
      /* the stages */
      "stg.greet.t"      : "네, 아니요, 안녕",
      "stg.greet.d"      : "각각 한 낱말",
      "stg.greet.yes"    : "네",
      "stg.greet.no"     : "아니요",
      "stg.greet.hello"  : "안녕하세요",
      "stg.greet.bye"    : "안녕히 가세요",
      "stg.greet.thanks" : "고맙습니다",
      "stg.pron.t"       : "나, 너, 그들",
      "stg.pron.d"       : "주어가 되는 말",
      "stg.pron.i"       : "나",
      "stg.pron.you"     : "너",
      "stg.pron.he"      : "그 / 그녀",
      "stg.pron.we"      : "우리",
      "stg.pron.youpl"   : "너희",
      "stg.pron.they"    : "그들",
      "stg.order.t"      : "어순",
      "stg.order.d"      : "주어·목적어·동사의 차례",
      "stg.num.t"        : "하나보다 많을 때",
      "stg.num.d"        : "여럿이라는 것을 낱말이 나타내는지, 나타낸다면 어떻게 하는지예요.",
      "stg.neg.t"        : "아니라고 하기",
      "stg.ask.t"        : "묻기",
      "stg.ask.d"        : "어떻게 묻는지",
      "stg.ask.what"     : "무엇",
      "stg.ask.who"      : "누구",
      "stg.ask.where"    : "어디",
      "stg.ask.when"     : "언제",
      "stg.desc.t"       : "꾸미는 말",
      "stg.have.t"       : "누구의 것",
      "stg.count.t"      : "수사",
      "stg.count.d"      : "1부터 {0}까지",
      "stg.month.t"      : "달",
      "stg.month.d"      : "한 해를 나눈 {0}개",
      "stg.wday.t"       : "요일",
      "stg.wday.d"       : "한 주의 {0}일",
      /* the kinds of writing */
      "ws.kind"         : "문자의 종류",
      "ws.k.alpha"      : "음소문자",
      "ws.k.alpha.d"    : "한 글자 한 소리",
      "ws.k.alpha.eg"   : "글자 하나에 소리 하나 — 한글이나 로마자처럼",
      "ws.k.syll"       : "음절문자",
      "ws.k.syll.d"     : "한 글자 한 음절",
      "ws.k.syll.eg"    : "글자 하나에 음절 하나 — 일본 가나에서 ‘카’가 글자 하나인 것처럼",
      "ws.k.abjad"      : "아브자드",
      "ws.k.abjad.d"    : "자음만",
      "ws.k.abjad.eg"   : "자음만 — 아랍 문자나 히브리 문자처럼",
      "ws.k.abugida"    : "아부기다",
      "ws.k.abugida.d"  : "자음자와 모음 부호",
      "ws.k.abugida.eg" : "글자에 모음 부호를 붙인 모양 — 데바나가리나 타이 문자처럼",
      "ws.k.logo"       : "표어문자",
      "ws.k.logo.d"     : "한 글자 한 낱말",
      "ws.k.logo.eg"    : "글자 하나에 낱말 하나 — 한자처럼",
      /* onboarding */
      "ob.next"         : "다음",
      "ob.name.sub"     : "　",
      "ob.name.note"    : "나중에 바꿀 수 있습니다",
      "ob.name.later"    : "나중에 정하기",
      "ob.draw.h"      : "당신의 {0} 를 그려 보세요.",
      /* the writing system */
      "script.show"     : "표시",
      "script.show.own"   : "내 글자",
      /* the letter editor */
      "glyph.circle"      : "원",
      "glyph.fill"     : "칠하기",
      "glyph.undo"        : "되돌리기",
      "glyph.redo"        : "다시 실행",
      "glyph.clear"       : "모두 지우기",
      "glyph.save"        : "저장",
      "glyph.help.t" : "글자 그리기",
      "glyph.help.draw" : "네모 안을 손가락으로 그립니다.",
      "glyph.help.zoom" : "두 손가락으로 확대·축소하고, 종이를 옮깁니다.",
      "glyph.undo.d" : "마지막 획을 되돌립니다.",
      "glyph.redo.d" : "되돌린 획을 다시 놓습니다.",
      "glyph.fill.d" : "둘러싼 안쪽이 칠해집니다.",
      "glyph.circle.d" : "방금 그은 획을 곡선으로 바꿉니다. 다시 누르면 곧게 돌아갑니다.",
      "glyph.clear.d" : "네모 안을 모두 지웁니다.",
      "glyph.saved"       : "{0} 저장했습니다",
      "fmr.title"        : "규칙으로 만드는 형태",
      "fmr.add"          : "붙이는 글자",
      "fmr.end"          : "뒤에",
      "fmr.start"        : "앞에",
      "fmr.drop"         : "먼저 떼는 글자",
      "fmr.when"         : "낱말 끝이",
      "fmr.always"       : "무엇이든",
      "fmr.vowel"        : "모음",
      "fmr.ends" : "이것으로 끝날 때",
      "fmr.cons"         : "자음",
      "fmr.del"          : "이 규칙 지우기",
      "fmr.all"           : "{0}개의 단어",
      "fmr.todo"         : "아직 없는 {0}개의 형태 만들기",
      "fmr.made"         : "{0}개의 낱말을 만들었습니다",
      "fmr.off" : "이 형태는 만들지 않기",
      "fmr.with" : "{0}개의 형태와 함께 추가",
      "fmr.with.1" : "형태 하나와 함께 추가",
      "count.words"      : "낱말 {0}개",
      "count.words.1"    : "낱말 1개",
      "home.write"       : "새 단어",
      /* AI に相談する -- www/assist.js builds the link. The sentences below
         are the PROMPT, and they are here for the same reason every other
         string is: the language a prompt is written in decides the language
         the answer comes back in. What is around the material is translated;
         the material itself -- the sounds, the words, the shapes -- is what
         the person made and is never touched. */
      "words.search"     : "검색",
      "words.clear"      : "지우기",
      "words.sort.a"     : "알파벳순",
      "words.sort.pos"   : "품사별",
      "words.sel"        : "선택",
      "words.sel.done"   : "완료",
      "words.sel.row"    : "이 단어 선택",
      "words.sel.del"    : "삭제",
      "confirm.delmany"  : "{0}개 단어를 삭제할까요?",
      "words.sel.gone"   : "{0}개 단어를 삭제했습니다",
      "words.sel.back"   : "{0}개 단어를 되돌렸습니다",
      "words.open"       : "열기",
      "words.nomatch"    : "찾은 게 없어요",
      "words.empty"      : "아직 단어가 없습니다",
      /* notes */
      "toc.notes"        : "메모",
      "count.notes"      : "메모 {0}개",
      "notes.note"       : "　",
      "notes.new"        : "새 메모",
      "notes.edit"       : "메모",
      "notes.t"          : "제목",
      "notes.t.ph"       : "없어도 돼요",
      "notes.b"          : "내용",
      "notes.b.ph"       : "누가 이 말을 쓰는지. 왜 한 낱말이 다른 낱말이기도 한지. 그냥 두면 내일이면 잊어버릴 것들.",
      "notes.save"       : "저장",
      "notes.del"        : "삭제",
      "notes.untitled"   : "제목 없음",
      "notes.empty.t"    : "아직 적어 둔 것이 없어요",
      "notes.empty.s"    : "아직 없습니다",
      "toast.note.kept"  : "메모를 간직했어요",
      "toast.note.gone"  : "메모를 지웠어요",
      "confirm.note.del" : "이 메모를 지울까요?",
      /* the conversation */
      /* grammar — the decisions */
      "gram.role.S"      : "하는 쪽",
      "gram.role.O"      : "당하는 쪽",
      "gram.role.V"      : "하는 일",
      "gram.pos.before.n" : "명사 앞",
      "gram.pos.after.n" : "명사 뒤",
      "gram.pos.before.v" : "동사 앞",
      "gram.pos.after.v" : "동사 뒤",
      "gram.demo.need"   : "단어를 몇 개 더",
      "gram.demo.need.n": "명사가 필요합니다.",
      "gram.demo.need.v": "동사가 필요합니다.",
      "gram.demo.need.nv": "명사와 동사가 필요합니다.",
      "gram.demo.need.adj": "형용사가 필요합니다.",
      "gram.demo.need.nadj": "명사와 형용사가 필요합니다.",
      "gram.pair.phrase" : "묶음",
      "gram.pair.line"   : "줄",
      "words.addmn"      : "뜻 추가",
      "toast.cap"        : "이 요금제는 낱말 {0}개까지입니다. Pro는 제한 없이 사용할 수 있습니다.",
      "set.title"        : "설정",
      "set.look"         : "화면 표시",
      "theme.system"     : "시스템",
      "theme.light"      : "밝게",
      "theme.dark"       : "어둡게",
      "set.display"      : "표시 언어",
      "set.lang"         : "내 언어",
      "set.name"         : "이름",
      "set.count"        : "낱말 수",
      "set.plan"         : "요금제",
      /* ---- the sheet somebody writes on (ch 26) ---- */
      "wr.title"         : "용지",
      "wr.make"          : "내 글꼴 만들기",
      "wr.read"          : "내 글자 업로드하기",
      "wr.help"          : "순서",
      "wr.s1"            : "글자를 입력",
      "wr.s1.d"          : "한 칸에 하나씩, 쉼표로 구분합니다.",
      "wr.s2"            : "용지를 내보내기",
      "wr.s2.d"          : "파일 앱에 들어갑니다.",
      "wr.s3"            : "위에 쓰기",
      "wr.s3.d"          : "한 칸에 한 글자, 기기에서든 종이에든.",
      "wr.s4"            : "가져오기",
      "wr.s4.d"          : "쓴 PDF를 여기로 돌려주세요.",
      "wr.names"         : "이름",
      "wr.ph"            : "7, 2, 25",
      "wr.boxes"         : "{0} 칸",
      "wr.boxes.1"       : "1 칸",
      "wr.pages"         : "{0} 장",
      "wr.pages.1"       : "1 장",
      "wr.out"           : "용지 내보내기",
      "wr.nobridge"      : "앱이 파일 보관함에 닿지 않습니다.",
      "wr.long"          : "이 이름들은 한 장에 들어가지 않습니다.",
      "wr.none"          : "아직 이름이 없습니다",
      "wr.in"            : "PDF 고르기",
      "wr.notpdf"        : "지금은 PDF만 읽을 수 있습니다.",
      "wr.bad"           : "이 파일은 읽을 수 없었습니다.",
      "wr.marks"         : "네 모서리 표시가 사진에 다 들어오지 않았습니다.",
      "wr.strip"         : "이 용지가 무엇인지 읽어낼 수 없습니다.",
      "wr.pdf.drawn"     : "이 PDF 안에는 사진이 없습니다.",
      "wr.pdf.no"        : "이 PDF 안의 그림은 꺼낼 수 없습니다.",
      "wr.drawn"         : "그려짐",
      "wr.empty"         : "빔",
      "wr.take"          : "{0} 자 가져오기",
      "wr.take.1"        : "1 자 가져오기",
      "wr.took"          : "{0} 자",
      "wr.took.1"        : "1 자",
      "wr.empty.all"     : "이 용지에는 아무것도 그려지지 않았습니다.",
      "set.data"         : "데이터",
      "set.terms"         : "이용약관",
      "set.privacy"         : "개인정보처리방침",
      "set.csv.in"       : "CSV에서 가져오기",
      "set.wipe"         : "계정 삭제",
      "set.wipe.langs"   : "이 언어 삭제",
      "lang.untitled" : "이 언어",
      "set.pw"         : "비밀번호 변경",
      "set.pw.old"         : "현재 비밀번호",
      "set.mail"         : "이메일",
      "set.pw.go"         : "변경",
      "set.pw.done"         : "비밀번호를 변경했습니다",
      "net.needpw"         : "둘 다 입력해 주세요.",
      "confirm.wipe"     : "모든 데이터를 삭제할까요? 계정과 서버의 모든 게시물·사진·녹음이 사라지고, 이 기기의 모든 언어·문자·설정도 백업 파일과 함께 사라집니다. 되돌릴 수 없습니다. 구독을 해지한 뒤 계정을 삭제해 주세요.",
      "confirm.wipe.langs": "{0}을(를) 삭제할까요? 여기서 만든 것이 모두 사라집니다 — 단어, 글자, 문자 체계, 키보드, 메모, 소리. 백업 파일도 사라집니다. 계정에서도 지워지므로 다른 기기에서도 돌아오지 않습니다. 다른 언어와 게시물, 계정은 남습니다. 되돌릴 수 없습니다.",
      "langs.title"      : "언어",
      "langs.mine"       : "내 언어",
      "langs.reading"    : "읽는 중",
      "langs.untitled"   : "제목 없음",
      "langs.open"       : "열림",
      "langs.none"       : "아직 없어요",
      "langs.new"       : "새 언어",
      "langs.full"       : "현재 플랜에서는 최대 {0}개입니다.",
      "plans.title"      : "요금제",
      "plan.cur"         : "현재",
      'plan.badge'            : "이름 옆의 배지",
      "plan.free.1"      : "a–z 와 ! ? 와 숫자를 내 글자꼴로",
      "plan.free.2"      : "단어 100개까지",
      "plan.free.3"      : "휴대폰의 키보드: QWERTY 에 내 글자",
      "plan.free.4"      : "타임라인 — 읽기, 올리기, 팔로우",
      "plan.plus.1" : "글자를 더하고, 이름 붙이고, 지우기",
      "plan.plus.2" : "글자의 소리를 직접 고르기",
      "plan.plus.3" : "음절문자, 아브자드, 아부기다, 표어문자",
      "plan.plus.4" : "단어 1000개까지",
      "plan.plus.5" : "직접 짜는 키보드 네 개까지",
      "plan.plus.6" : "내려받은 언어 한 개까지",
      "plan.pro.1" : "Plus의 모든 것에 더해",
      "plan.pro.2" : "단어 수 제한 없음",
      "plan.pro.3" : "키보드 수 제한 없음",
      "plan.pro.4" : "나만의 문법 단계와 쓰는 방향",
      "plan.pro.5" : "목록을 파일로 들여오고 내보내기",
      "plan.pro.6" : "내 언어 세 개까지",
      "plan.pro.7" : "내려받은 언어 세 개까지",
      "plan.price.plus" : "$4.99",
      "plan.price.plus.yr" : "$49.99",
      "plan.off" : "{0}% 할인",
      "plan.buy" : "구독하기",
      "plan.restore" : "구매 복원",
      "plan.already" : "이 계정은 이미 {0}입니다.",
      "plan.now" : "현재 플랜 {0}, {1}까지",
      "plan.now.only" : "현재 플랜 {0}",
      "plan.date" : "{0}. {1}. {2}.",
      "plan.cancel" : "구독 해지",
      "store.none" : "복원할 구매가 없습니다",
      "plan.price.free"  : "$0",
      "plan.price.pro.yr"  : "$99.99",
      "plan.per.yr"  : "／년",
      "plan.per.mo"  : "／월",
      "plan.price.pro"  : "$9.99",
      "store.wait" : "App Store에 문의 중…",
      "store.pending" : "승인을 기다리는 중입니다. 결정되면 알려드립니다.",
      "store.fail" : "App Store에 연결하지 못했습니다",
      "store.nosale" : "아직 판매 중인 항목이 없습니다",
      "toast.plan.free"  : "무료 요금제로 돌아왔어요",
      "toast.plan.other" : "{0} 요금제가 되었어요",
      "add.title"        : "새 단어",
      "f.spelling"       : "철자",
      "f.listen"         : "재생",
      "f.meaning"        : "뜻",
      "f.meaning.ph"     : "별",
      "f.pos"            : "품사",
      "add.btn"          : "담기",
      "toast.hw2"        : "철자는 두 글자 이상이어야 해요",
      "toast.dup"        : "이미 있는 낱말이에요",
      "toast.added.1"    : "{0} 담았어요",
      "voice.none"       : "이 기기에서는 소리를 낼 수 없습니다",
      "word.means"       : "이 낱말의 뜻",
      "word.mn.add"      : "추가",
      "word.mn.del"      : "제거",
      "word.family"      : "관련어",
      "word.root"        : "기본형",
      "word.fm"        : "어형",
      "word.fm.pst"        : "과거형",
      "word.fm.prs"        : "현재형",
      "word.fm.fut"        : "미래형",
      "word.fm.prg"        : "진행형",
      "word.fm.prf"        : "완료형",
      "word.fm.neg"        : "부정형",
      "word.fm.imp"        : "명령형",
      "word.fm.que"        : "의문형",
      "word.fm.cnd"        : "조건형",
      "word.fm.cau"        : "사동형",
      "word.fm.pas"        : "피동형",
      "word.fm.pl"        : "복수형",
      "word.fm.agt"        : "행위자",
      "word.fm.ins"        : "도구",
      "word.fm.loc"        : "장소",
      "word.fm.act"        : "행위",
      "word.fm.qua"        : "성질",
      "word.fm.dim"        : "축소형",
      "word.fm.aug"        : "확대형",
      "word.fm.col"        : "집합",
      "word.fm.opp"        : "반대",
      "word.fm.adj"        : "형용사화",
      "word.fm.vrb"        : "동사화",
      "word.fm.adv"        : "부사화",
      "word.fm.pst.d"        : "이미 일어난 일",
      "word.fm.pst.e"        : "걷다 → 걸었다",
      "word.fm.prs.d"        : "지금 일어나는 일",
      "word.fm.prs.e"        : "걷다 → 걷는다",
      "word.fm.fut.d"        : "아직 일어나지 않은 일",
      "word.fm.fut.e"        : "걷다 → 걸을 것이다",
      "word.fm.prg.d"        : "지금 진행 중",
      "word.fm.prg.e"        : "걷다 → 걷고 있다",
      "word.fm.prf.d"        : "끝났고 지금에 영향이 있음",
      "word.fm.prf.e"        : "걷다 → 걸어 버렸다",
      "word.fm.neg.d"        : "일어나지 않는다고 말하는 꼴",
      "word.fm.neg.e"        : "걷다 → 걷지 않다",
      "word.fm.imp.d"        : "상대에게 시키는 꼴",
      "word.fm.imp.e"        : "걷다 → 걸어라",
      "word.fm.que.d"        : "일어나는지 묻는 꼴",
      "word.fm.que.e"        : "걷다 → 걷느냐",
      "word.fm.cnd.d"        : "다른 일이 있어야 성립",
      "word.fm.cnd.e"        : "걷다 → 걸으면",
      "word.fm.cau.d"        : "남에게 시키는 꼴",
      "word.fm.cau.e"        : "걷다 → 걷게 하다",
      "word.fm.pas.d"        : "당하는 쪽",
      "word.fm.pas.e"        : "보다 → 보이다",
      "word.fm.pl.d"        : "하나보다 많음",
      "word.fm.pl.e"        : "고양이 → 고양이들",
      "word.fm.agt.d"        : "그것을 하는 사람",
      "word.fm.agt.e"        : "가르치다 → 선생",
      "word.fm.ins.d"        : "그것을 하는 도구",
      "word.fm.ins.e"        : "열다 → 따개",
      "word.fm.loc.d"        : "그것을 하는 곳",
      "word.fm.loc.e"        : "빵 → 빵집",
      "word.fm.act.d"        : "그 일 자체",
      "word.fm.act.e"        : "짓다 → 건설",
      "word.fm.qua.d"        : "그러함 자체",
      "word.fm.qua.e"        : "친절하다 → 친절함",
      "word.fm.dim.d"        : "작은 것",
      "word.fm.dim.e"        : "개 → 강아지",
      "word.fm.aug.d"        : "큰 것",
      "word.fm.aug.e"        : "개 → 큰 개",
      "word.fm.col.d"        : "모두 합친 것",
      "word.fm.col.e"        : "나무 → 숲",
      "word.fm.opp.d"        : "반대되는 것",
      "word.fm.opp.e"        : "행복 → 불행",
      "word.fm.adj.d"        : "모양을 나타내는 말로",
      "word.fm.adj.e"        : "금 → 금빛의",
      "word.fm.vrb.d"        : "움직임을 나타내는 말로",
      "word.fm.vrb.e"        : "검다 → 검어지다",
      "word.fm.adv.d"        : "어떻게를 나타내는 말로",
      "word.fm.adv.e"        : "빠르다 → 빠르게",
      "word.fm.inf"        : "활용",
      "word.fm.der"        : "파생",
      "word.none"        : "없음",
      "word.fm.own"        : "자신의 라벨",
      "word.derive"      : "파생어 만들기",
      "word.note"        : "메모",
      "word.sp"          : "읽기",
      "word.sp.none"     : "　",
      "word.sp.del"      : "문자 빼기",
      "word.syn"         : "같은 뜻의 단어",
      "word.syn.none"    : "아직 없습니다",
      "word.syn.add"     : "같은 뜻의 단어 고르기",
      "word.ant"         : "반대 뜻의 단어",
      "word.ant.none"    : "아직 없습니다",
      "word.ant.add"     : "반대 뜻의 단어 고르기",
      "word.ex"          : "예문",
      "word.ex.gl.ph"    : "그 뜻",
      "word.ex.del"      : "삭제",
      "word.ex.need"     : "문장을 먼저 쓰세요",
      "add.title.from"   : "{0}에서 나온 낱말",
      "glyph.borrow"     : "기존 문자에서 고르기",
      "glyph.borrowed"   : "빌린 문자",
      "glyph.del"        : "문자 삭제",
      "glyph.del.ask"    : "이 글자를 삭제할까요?",
      "glyph.deleted"    : "{0}에 이제 글자가 없어요",
      "word.reg"        : "문체",
      "word.reg.sp"        : "구어",
      "word.reg.wr"        : "문어",
      "word.reg.sl"        : "속어",
      "word.reg.po"        : "높임",
      "word.tags"        : "분야",
      "word.ety"        : "어원",
      "word.up"        : "수정 {0}",
      "word.made"        : "생성 {0}",
      "prof.replies"        : "답글",
      "prof.likes"        : "마음에 들어요",
      "prof.none.re"        : "아직 답글이 없습니다.",
      "prof.none.li"        : "아직 마음에 든 글이 없습니다.",
      "me.following"        : "팔로잉",
      "me.followers"        : "팔로워",
      "me.following.none"        : "아직 아무도 팔로우하지 않았습니다.",
      "me.followers.none"        : "아직 팔로워가 없습니다.",
      "prof.posts"        : "게시물",
      "prof.none"        : "아직 올린 글이 없습니다.",
      "kb.more"        : "더보기",
      "post.more"        : "더보기",
      "post.block"        : "차단",
      "post.unblock"        : "차단 해제",
      "post.report"        : "신고",
      "report.spam"        : "스팸",
      "report.abuse"        : "욕설·괴롭힘",
      "report.hate"        : "혐오",
      "report.sexual"        : "성적인 내용",
      "report.other"        : "기타",
      "report.done"        : "보냈습니다",
      "mod.title"          : "신고",
      "mod.again"          : "새로 고침",
      "mod.none"           : "신고가 없습니다",
      "mod.noline"         : "(글자 없는 게시물)",
      "mod.down"           : "공개 중지",
      "mod.up"             : "다시 공개",
      "mod.out"            : "@{0} 정지",
      "mod.in"             : "@{0} 정지 해제",
      "mod.out.sure"       : "이 계정을 정지할까요?",
      "admin.title"        : "관리",
      "admin.pw"           : "비밀번호",
      "admin.go"           : "열기",
      "admin.reports"      : "신고",
      "admin.staff"        : "운영자",
      "admin.staff.ph"     : "@아이디",
      "admin.staff.add"    : "추가",
      "post.out"           : "계정 정지 중",
      "post.down"          : "공개 중지",
      "post.rules"          : "규정 위반으로 삭제되었습니다",
      "who.out"          : "이 계정은 정지되었습니다",
      "out.what"          : "게시, 답글, 좋아요를 할 수 없습니다.",
      "out.appeal"          : "이의 제기",
      "post.pin"        : "이 글을 고정",
      "post.unpin"        : "고정 해제",
      "post.pic"        : "사진",
      "post.pic.drop"        : "사진 빼기",
      "post.mark"            : "글자",
      "post.mark.del"        : "빼기",
      "post.mark.col"        : "색",
      "post.mark.ph"         : "한 줄 쓰기",
      "post.mark.done"       : "완료",
      "post.mark.tool"       : "글자",
      "post.cut"             : "자르기",
      "post.cut.do"          : "자르기",
      "post.cut.all"         : "전체",
      "post.pic.bad"        : "이 이미지는 쓸 수 없었습니다.",
      "post.pic.full"        : "타임라인이 가득 찼습니다. 아무것도 지우지 않았습니다 — 이 글에서 사진을 빼거나, 오래된 글을 직접 지워 주세요.",
      "post.pic.many"        : "사진은 {0}장까지",
      "post.full"        : "타임라인이 가득 차 저장되지 않았습니다. 오래된 글을 지우고 다시 시도해 주세요.",
      'post.cam'              : "카메라",
      'post.pic.no'         : "여기서는 사진을 고를 수 없습니다",
      'post.lib'              : "라이브러리",
      'post.vo'               : "목소리",
      'post.vo.stop'          : "정지",
      'post.vo.play'          : "듣기",
      'post.vo.drop'          : "목소리 지우기",
      'post.vo.no'            : "여기서는 녹음할 수 없습니다",
      'post.vo.deny'          : "마이크가 허용되지 않았습니다",
      'post.vo.bad'           : "녹음을 저장하지 못했습니다",
      'post.vo.gone'          : "그 목소리를 찾을 수 없습니다",
      'post.vo.busy'          : "녹음 중입니다",
      'post.vo.lost'          : "목소리를 저장하지 못했습니다",
      'post.edit'             : "편집",
      'post.back.q'           : "임시 보관함에 저장할까요?",
      'post.back.keep'        : "저장",
      'post.back.drop'        : "삭제",
      'post.back.stay'        : "닫기",
      'post.editplan'         : "글 편집은 Plus 플랜부터입니다",
      'post.save'             : "저장",
      'post.edited'           : "편집됨",
      'post.pv'               : "나만 보기",
      'post.pv.on'            : "나만 볼 수 있습니다",
      'post.pv.off'           : "모두가 볼 수 있습니다",
      'post.draft.save'       : "임시저장",
      'post.draft.kept'       : "임시저장했습니다",
      'post.drafts'           : "임시저장 {0}",
      'post.drafts.t'         : "임시저장",
      'post.draft.none'       : "임시저장이 없습니다",
      'post.draft.empty'      : "(비어 있음)",
      "post.draft.sel"      : "선택",
      "post.draft.sel.done" : "완료",
      "post.draft.sel.del"  : "삭제",
      "post.draft.sel.row"  : "이 초안 선택",
      "post.draft.sel.ask"  : "초안 {0}개를 삭제할까요?",
      'post.gone'             : "이 글은 이제 없습니다",
      'post.thread'           : "스레드",
      'post.re.to'            : "{0}에게 보내는 답글",
      "word.edit"        : "편집",
      "word.del"         : "단어 삭제",
      "confirm.del"      : "{0}, 지울까요?",
      "toast.saved"      : "{0} 고쳤어요",
      "toast.deleted"    : "{0} 지웠어요",
      "save.no"       : "저장되지 않았습니다",
      "card.title"        : "카드",
      "card.save"         : "공유",
      "card.shape"         : "모양",
      "card.nofile"       : "앱이 파일 보관함에 닿지 않습니다.",
      "imp.next"          : "다음",
      "imp.role.hw"       : "철자",
      "imp.role.mn"       : "뜻",
      "imp.role.pos"      : "품사",
      "imp.role.ph"       : "소리",
      "imp.role.ch"       : "문자",
      "imp.role.nm"       : "이름",
      "imp.ltr"           : "글자",
      "imp.into"          : "넣을 곳",
      "imp.role.skip"     : "사용 안 함",
      "imp.new"           : "새로 들어옴",
      "imp.have"          : "이미 있음",
      "imp.coin"          : "새로 만듦",
      "imp.over"          : "덮어쓰기",
      "imp.skip"          : "건너뛰기",
      "imp.file"          : "파일 선택",
      "imp.mute"          : "그중 {0}개는 아직 읽기가 없습니다",
      "imp.done"          : "{0}개 들어왔습니다",
      "imp.donelt"        : "{0}자 알파벳에 들어왔습니다",
      "imp.undo"          : "되돌리기",
      "imp.undone"        : "되돌렸습니다",
      "imp.again"         : "다시 시작",
      "imp.ok"            : "완료",
      "imp.empty"         : "읽을 수 있는 것이 없습니다",
      "csv.title"        : "목록 가져오기",
      "csv.ph"           : "고양이\n물\n걷다\n\nkano, 산, 명사",
      "csv.btn"          : "가져오기",
      "csv.full"        : "{0}개 가져옴, {1}개 만듦 — Free가 가득 찼습니다",
      /* the day's sentence. The sentence itself is not here: it comes
         from the server, one row a day, in every interface language. */
      "day.k"  : "오늘",
      "day.ask"          : "당신의 언어로?",
      /* The world's names for the twelve months and the seven days. What
         the slot is CALLED is the world's; what goes in it is the
         language's. Sunday first -- that is where a calendar's week
         starts, and cal.js draws it that way. */
      "cal.m.1" : "1월",
      "cal.m.2" : "2월",
      "cal.m.3" : "3월",
      "cal.m.4" : "4월",
      "cal.m.5" : "5월",
      "cal.m.6" : "6월",
      "cal.m.7" : "7월",
      "cal.m.8" : "8월",
      "cal.m.9" : "9월",
      "cal.m.10" : "10월",
      "cal.m.11" : "11월",
      "cal.m.12" : "12월",
      "cal.d.1" : "일요일",
      "cal.d.2" : "월요일",
      "cal.d.3" : "화요일",
      "cal.d.4" : "수요일",
      "cal.d.5" : "목요일",
      "cal.d.6" : "금요일",
      "cal.d.7" : "토요일",
      "plan.renew" : "해지할 때까지 자동으로 갱신됩니다."
    }
  };
})());
