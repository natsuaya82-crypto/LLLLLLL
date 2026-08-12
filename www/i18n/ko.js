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
    pos    : {n:"명사", v:"동사", adj:"형용사", adv:"부사", pro:"대명사", num:"수사", part:"조사", conj:"접속사", intj:"감탄사", aff:"접사", nm:"고유명사", x:"기타"},
    read   : mkApprox(word_ko, syl_ko),
    str    : {
      "ai.ask"                    : "자문 받기",
      "ai.hint"                   : "　",
      "ai.left"                   : "오늘 {0}회 남음",
      "ai.limit.s"                : "Plus라면 매일 무제한으로 상담할 수 있어요.",
      "ai.limit.t"                : "오늘의 질문을 모두 사용했어요",
      "ai.see"                    : "요금제 보기",
      "ai.title"                  : "상담",
      "ai.unl"                    : "무제한",
      "cap.warn"                  : "무료 플랜에서 {0}개 더 가능",
      "ch.clear"                  : "글자 없음",
      "ch.for"                    : "“{0}”의 글자",
      "count.script"              : "{1}개 중 {0}개",
      "lock.ai"                   : "무제한 자문",
      "lock.export"               : "내보내기 및 백업",
      "lock.sync"                 : "클라우드 동기화",
      "lock.t"                    : "Plus 기능",
      "ob.back"                   : "뒤로",
      "add.ph"                    : "이 언어의 소리",
      "add.ph.none"               : "아직 소리가 없습니다",
      "kb.title"               : "키보드",
      "kb.locked"               : "무료 요금제의 키보드는 자신의 글자를 올린 QWERTY입니다. Plus에서는 키·행·레이어·플릭까지 직접 짤 수 있습니다.",
      "kb.key"               : "키",
      "kb.key.del"               : "이 키 삭제",
      "kb.what"               : "눌렀을 때",
      "kb.on"               : "누르기",
      "kb.del"               : "지우기",
      "kb.sp"               : "스페이스",
      "kb.lay"               : "층",
      "kb.lay.add"               : "층 추가",
      "kb.w"               : "너비",
      "kb.flick"               : "플릭",
      "kb.dir.up"               : "위",
      "kb.dir.right"               : "오른쪽",
      "kb.dir.down"               : "아래",
      "kb.dir.left"               : "왼쪽",
      "kb.empty"               : "없음",
      "kb.row.add"               : "줄 추가",
      "kb.sys.h"               : "이 키보드는 iPhone에 설치됩니다",
      "kb.sys.1"               : "설정 → 일반 → 키보드 → 키보드 → 새로운 키보드 추가 → Lingua",
      "kb.sys.2"               : "설정 → 일반 → 키보드 → 키보드 → Lingua → 전체 접근 허용",
      "kb.sys.full"               : "전체 접근을 허용하지 않으면 글자를 읽을 수 없습니다.",
      "kb.out.ok"               : "글자를 전달했습니다.",
      "kb.out.none"               : "아직 아무것도 전달하지 않았습니다.",
      "kb.out.no"               : "아무것도 전달하지 못했습니다: 앱이 키보드에 닿지 못합니다. 글자를 더 그려도 소용없습니다.",
      "kb.out.bad"               : "아무것도 전달하지 못했습니다: {0}",
      "kb.reset"               : "처음부터 다시",
      "kb.reset.ask"               : "이 키보드를 버리고 처음 것으로 되돌릴까요?",
      "kb.reset.done"               : "키보드를 다시 만들었습니다",
      "ipa.b.back"                : "후설",
      "ipa.b.central"             : "중설",
      "ipa.b.front"               : "전설",
      "ipa.cons"                  : "자음",
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
      "ipa.mine.none"             : "아직 고른 것이 없어요.",
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
      "home.new.t"                : "글자 하나가 생겼어요.",
      "home.new.s"                : "몇 개만 더 있으면 낱말을 그 글자로 적을 수 있어요.",
      "set.account"               : "계정",
      "set.account.guest"         : "로그인 안 함",
      "set.account.soon"          : "아직 연결되어 있지 않아요.",
      "ob.borrow.h"               : "빌린 문자",
      "ob.borrow.sub"             : "　",
      "ob.borrow.take"            : "　",
      "ob.door.h"                 : "문에는 이제 당신의 글자가 걸려 있습니다.",
      "ob.door.note"              : "이름도 계정도 없습니다. 그런 것들은 나중에 해도 됩니다.",
      "ob.draw.done"              : "완료",
      "ob.draw.empty"             : "먼저 한 획을 그어 주세요",
      "ob.draw.sub"               : "　",
      "ob.lang.a"                 : "인터페이스 언어",
      "ob.open"                   : "문 열기",
      "ob.or"                     : "이미 있는 문자 쓰기",
      "ob.enter"                  : "시작하기",
      "ob.name.auto"              : "대신 지어주기",
      "ob.name.h"                 : "언어의 이름",
      "ob.name.mini"              : "나중에 바꿀 수 있습니다",
      "ob.name.ph"                : "이름",
      "ob.signin.apple"           : "Apple로 계속하기",
      "ob.signin.google"          : "Google로 계속하기",
      "ob.signin.skip"            : "계정 없이 계속하기",
      "ob.signin.mail" : "이메일로 계속",
      "ob.mail.h.code" : "메일을 확인하세요",
      "ob.mail.h.forgot" : "비밀번호 재설정",
      "ob.mail.em.ph" : "you@example.com",
      "ob.mail.pw.ph" : "비밀번호",
      "ob.mail.code.ph" : "000000",
      "ob.mail.code.sub" : "{0} 로 여섯 자리 코드를 보냈습니다.",
      "ob.mail.in" : "로그인",
      "ob.mail.up" : "계정 만들기",
      "ob.mail.verify" : "확인",
      "ob.mail.send" : "보내기",
      "ob.mail.wait" : "처리 중…",
      "ob.mail.to.forgot" : "비밀번호를 잊으셨나요?",
      "ob.signin.or" : "또는",
      "ob.bar.up" : "계정 만들기",
      "ob.bar.in" : "로그인",
      "ob.who.h" : "이름과 ID",
      "ob.who.nm.ph" : "이름",
      "ob.who.hd.ph" : "id",
      "net.needname" : "이름을 입력하세요.",
      "net.badhandle" : "ID는 2~24자입니다: a–z, 0–9, _",
      "net.handle.taken" : "이미 사용 중인 ID입니다.",
      "net.offline" : "연결할 수 없습니다.",
      "net.failed" : "되지 않았습니다.",
      "net.badlogin" : "주소나 비밀번호가 다릅니다.",
      "net.taken" : "그 주소에는 이미 계정이 있습니다.",
      "net.weak" : "비밀번호가 너무 짧습니다.",
      "net.toomany" : "시도가 너무 많습니다. 잠시 기다리세요.",
      "net.needmail" : "주소를 입력하세요.",
      "net.sent" : "보냈습니다.",
      "net.nonative" : "이 빌드에서는 사용할 수 없습니다.",
      "set.account.on" : "로그인됨",
      "set.signout" : "로그아웃",
      "set.signout.done" : "로그아웃했습니다",
      "ob.tagline"                : "당신의 언어에 새로운 빛깔을.",
      "script.none2"              : "아직 글자가 없어요",
      "script.own.ph"             : "글자를 붙여넣거나 입력",
      "script.set"                : "적용",
      "snd.have"                  : "이미 쓰는 소리",
      "sug.ask"                   : "떠오르지 않나요?",
      "sug.for"                   : "「{0}」에 맞는 형",
      "sug.hint"                  : "쓰고 있는 소리로 만든 것",
      "sug.left"                  : "오늘 {0}회 남음",
      "sug.more"                  : "다른 안",
      "sug.out"                   : "오늘의 제안을 다 썼어요. Plus면 계속 받을 수 있어요.",
      "up.cta"                    : "업그레이드",
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
      "ob.start"         : "시작하기",
      "seed.star"        : "별",
      "seed.water"       : "물",
      "seed.wind"        : "바람",
      "seed.light"       : "빛",
      "seed.forest"      : "숲",
      "seed.sky"         : "하늘",
      "seed.love"        : "사랑하다",
      "seed.walk"        : "걷다",
      "nav.contents"     : "차례",
      "nav.settings"     : "설정",
      "home.kicker"      : "당신의 언어",
      "wld.title"    : "이 언어는 무엇을 위한 것인가",
      "wld.ask"      : "이 언어의 쓰임",
      "wld.use"      : "무엇을 위해",
      "wld.story"    : "이야기",
      "wld.story.d"  : "책·영화·게임",
      "wld.people"   : "겨레",
      "wld.people.d" : "이 땅의 사람들이 아닌",
      "wld.place"    : "땅",
      "wld.place.d"  : "골짜기 하나, 섬 하나, 도시 하나",
      "wld.real"     : "실제로 말하기",
      "wld.real.d"   : "정말로 쓰려고",
      "wld.play"     : "알아보기",
      "wld.play.d"   : "어떻게 되는지 보려고",
      "wld.where"    : "말해지는 곳",
      "wld.where.ph" : "북쪽 골짜기",
      "wld.who"      : "말하는 사람들",
      "wld.who.ph"   : "강가 사람들",
      "wld.note"     : "메모",
      "wld.note.ph"  : "이 언어가 사는 곳에 대한 무엇이든.",
      "home.unnamed"     : "이름 짓기",
      "home.name.prompt" : "언어의 이름",
      'next.t'   : "다음",
      "toc.words"        : "어휘",
      "sent.nomean"      : "뜻 없음",
      "sent.clear"       : "비우기",
      "tab.build"        : "만들기",
      "tab.explore"       : "탐색",
      "tab.notif"       : "알림",
      "tab.me"          : "프로필",
      "me.edit"         : "편집",
      "me.name"         : "이름",
      "me.handle"       : "아이디",
      'me.bio' : "자기소개",
      'me.bio.ph' : "자신에 대해 한두 줄",
      'me.pic' : "사진",
      'me.pic.pick' : "사진 선택",
      'me.pic.drop' : "사진 제거",
      'me.pic.bad' : "이 이미지를 읽을 수 없습니다",
      'notes.search' : "메모 검색",
      "post.new"        : "새 글",
      "post.ln.ph"      : "당신의 언어로 한 줄",
      "post.mn"         : "무슨 뜻인지",
      "post.re"         : "{0}에게 답장",
      "post.send"       : "올리기",
      "post.none"       : "올릴 것이 없습니다",
      "post.del"        : "삭제",
      "post.del.q"      : "이 글을 삭제할까요?",
      "when.now"        : "방금",
      "when.m"          : "{0}분",
      "when.h"          : "{0}시간",
      "when.d"          : "{0}일",
      "sns.none"        : "아직 아무것도 없습니다",
      "tab.find"         : "찾기",
      "tab.home"         : "홈",
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
      "toc.sound"        : "음운",
      "toc.letters"      : "문자",
      "ab.title"         : "모음 작업대",
      "ab.mark"          : "{0} 의 부호",
      "ab.every"         : "{0} 를 얹은 자음 전부",
      "ab.cell"          : "눌러서 따로 그릴 수 있습니다",
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
      "lt.use"           : "이미 있는 문자 쓰기",
      "lt.addsnd"        : "읽기",
      "lt.reads.none"    : "—",
      'lt.ab.h' : "글자",
      "lt.snd.h"       : "소리",
      "lt.title"     : "글자",
      "lt.reads.ph"     : "k, sh, ng, ka",
      "lt.reads.no"     : "읽을 수 없습니다",
      "lt.dup"     : "{0} 은(는) 이미 사용 중",
      "ws.kind.note"     : "고르지 않으면 글자에서 판단합니다.",
      "ws.locked"     : "음절 문자·아브자드·아부기다·표어 문자",
      "lt.name"          : "이름",
      "lt.name.ph"       : "예: 에시",
      "lt.loose"         : "아직 아무것도 읽지 않는 문자가 {0}개 있습니다.",
      "lt.loose.1"       : "아직 아무것도 읽지 않는 문자가 1개 있습니다.",
      "num.word"        : "수사",
      "num.h"           : "숫자",
      "num.big"         : "{0}까지",
      "num.base"        : "진법",
      "lt.marks"         : "기호",
      "toc.gram"         : "문법",
      /* what the app proposes */
      "as.soft"         : "부드러운 소리",
      "as.soft.d"       : "비음, l 과 r, 수수한 모음 — 일본어나 이탈리아어처럼",
      "as.hard"         : "단단한 소리",
      "as.hard.d"       : "파열음과 마찰음, 모음은 적게 — 조지아어처럼",
      "as.flowing"      : "흐르는 소리",
      "as.flowing.d"    : "울림소리 중심, 모음 다섯",
      "as.breathy"      : "숨이 섞인 소리",
      "as.breathy.d"    : "마찰음과 h — 아랍어나 웨일스어처럼",
      "as.plain"        : "소박한 소리",
      "as.plain.d"      : "적고 말하기 쉬운 — 하와이어처럼",
      "as.hear"         : "전부 재생",
      "as.again"        : "다른 조합",
      "as.own"          : "직접 고르기",
      "as.drop"         : "제거",
      "as.more.c"       : "자음 추가",
      "as.more.v"       : "모음 추가",
      "as.more.none"    : "더 넣을 소리가 없습니다.",
      /* the grammar, in stages */
      "stg.words"        : "이 단계에 필요한 낱말",
      "stg.rules"        : "규칙",
      "stg.rules.ph"     : "　",
      "stg.ex"           : "예문",
      "stg.ex.lb.ph"     : "",
      "stg.noun.t"       : "명사",
      "stg.noun.d"       : "복수와 명사의 꼴",
      "stg.verb.t"       : "동사",
      "stg.verb.d"       : "시제와 동사의 꼴",
      "stg.neg.not"      : "아니다",
      "stg.ask.why"      : "왜",
      "stg.ask.how"      : "어떻게",
      "stg.conj.t"       : "잇기",
      "stg.conj.d"       : "문장을 잇는 말",
      "stg.conj.and"     : "그리고",
      "stg.conj.or"      : "또는",
      "stg.conj.but"     : "그러나",
      "stg.conj.because" : "왜냐하면",
      "stg.conj.if"      : "만약",
      "stg.conj.then"    : "그러면",
      "stg.part.t"       : "조사",
      "stg.part.d"       : "말의 구실을 나타내는 작은 말",
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
      "stg.when.d"       : "언제 일어나는지",
      "stg.decide"       : "정할 것",
      "stg.note"         : "메모",
      "stg.note.ph"      : "문법의 이 부분에 대해 적어 둘 것.",
      "stg.make"         : "지어 보기",
      "stg.keep"         : "저장",
      "stg.drop"         : "단어 삭제",
      "stg.help"         : "후보",
      "stg.help.d"       : "쓰고 있는 소리로 만든 것",
      "stg.again"        : "다른 제안",
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
      "stg.time.t"       : "이미 일어난 일",
      "stg.time.d"       : "하는 일이 끝났을 때 그 낱말이 어떻게 달라지는지예요.",
      "stg.neg.t"        : "아니라고 하기",
      "stg.neg.d"        : "반대는 어떻게 말하는지",
      "stg.ask.t"        : "묻기",
      "stg.ask.d"        : "어떻게 묻는지",
      "stg.ask.what"     : "무엇",
      "stg.ask.who"      : "누구",
      "stg.ask.where"    : "어디",
      "stg.ask.when"     : "언제",
      "stg.desc.t"       : "꾸미는 말",
      "stg.desc.d"       : "꾸미는 말의 자리",
      "stg.have.t"       : "누구의 것",
      "stg.have.d"       : "소유는 어떻게 말하는지",
      "stg.count.t"      : "세기",
      "stg.count.d"      : "1부터 {0}까지",
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
      "ws.made"         : "둘이 합쳐 만드는 것",
      /* onboarding */
      "ob.next"         : "다음",
      "ob.rom.h"         : "어떤 글자인가요?",
      "ob.name.sub"     : "　",
      "ob.name.note"    : "나중에 바꿀 수 있습니다",
      "ob.name.later"    : "나중에 정하기",
      "ipa.feel"       : "시작할 한 벌",
      "ob.snds.n"       : "소리 {0}개 골랐어요",
      "ob.snds.note"    : "전체 표는 나중에",
      "ob.snds.need"    : "소리를 골라 주세요",
      "ob.draw.h"      : "글자를 하나 그리세요",
      "ob.draw.later"   : "나중에 그리기",
      /* the writing system */
      "script.show"     : "표시",
      "script.show.roman" : "로마자",
      "script.show.own"   : "내 글자",
      /* the letter editor */
      "glyph.circle"      : "원",
      "glyph.new"         : "새 획",
      "glyph.undo"        : "되돌리기",
      "glyph.clear"       : "모두 지우기",
      "glyph.cancel"      : "취소",
      "glyph.save"        : "저장",
      "glyph.saved"       : "{0} 저장했습니다",
      "count.words"      : "낱말 {0}개",
      "count.words.1"    : "낱말 1개",
      "count.sounds"     : "소리 {0}개",
      "count.sounds.1"   : "소리 1개",
      "count.gram"       : "{0}개 정함",
      "count.lines.1"    : "문장 1개",
      "home.empty.t"     : "아직 한 낱말도 없어요",
      "home.empty.s"     : "낱말 하나에서 시작해요.<br>철자를 적으면 발음은 저절로 따라와요.",
      "home.empty.btn"   : "첫 단어",
      "home.recent.line" : "마지막 문장",
      "home.recent.word" : "마지막 단어",
      "home.write"       : "새 단어",
      "words.search"     : "철자·뜻·발음 검색",
      "words.clear"      : "지우기",
      "words.n"          : "{0}개",
      "words.n.1"        : "1개",
      "words.sort.a"     : "소리순",
      "words.sort.new"   : "최근 것부터",
      "words.kids"       : "파생 {0}개",
      "words.kids.1"     : "파생 1개",
      "words.open"       : "열기",
      "words.sayall"     : "전부 재생",
      "words.stop"       : "멈추기",
      "words.nomatch"    : "찾은 게 없어요",
      "words.empty"      : "아직 단어가 없습니다",
      "sound.used"       : "쓰고 있는 자음",
      "sound.unused"     : "쓰지 않는 자음",
      "sound.none"       : "아직 없어요.",
      "sound.vowels"     : "모음",
      "sound.together"   : "이어서 말할 때",
      "link.yes"         : "끝소리 자음이 다음 낱말로 넘어가요",
      "link.no"          : "낱말마다 따로 떨어져 있어요",
      "sound.listen"     : "들어보기",
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
      "toc.talk"         : "대화",
      "count.turns"      : "주고받은 말 {0}마디",
      "talk.compose"     : "당신의 문장",
      "talk.send"        : "보내기",
      "talk.wipe"        : "비우기",
      "talk.empty.t"     : "대화를 나누기엔 아직 부족해요",
      "talk.empty.s"     : "대화에는 적어도 무언가 하나와 하는 일 하나가 필요해요.<br>명사와 동사를 먼저 하나씩 적어 보세요.",
      "confirm.talk.clear" : "대화를 전부 비울까요?",
      /* grammar — the decisions */
      "gram.order.t"     : "어순",
      "gram.role.S"      : "하는 쪽",
      "gram.role.O"      : "당하는 쪽",
      "gram.role.V"      : "하는 일",
      "gram.pos.before.n" : "명사 앞",
      "gram.pos.after.n" : "명사 뒤",
      "gram.pos.before.v" : "동사 앞",
      "gram.pos.after.v" : "동사 뒤",
      "talk.gram"        : "문법 낱말",
      "gram.demo.need"   : "단어를 몇 개 더",
      "gram.pair.phrase" : "묶음",
      "gram.pair.line"   : "줄",
      "gram.seen"        : "단어에서 보이는 경향",
      "rules.empty.t"    : "아직 규칙이 없어요",
      "rules.empty.s"    : "먼저 단어를 몇 개",
      "rules.next"       : "다음: {0}",
      "find.final.t"     : "{0} 낱말은 <em>-{1}</em> 꼴로 끝나요",
      "find.final.d"     : "{0}개 중 {1}개가 그래요. 새로 짓는 낱말도 같은 꼴을 이어갈 수 있어요.",
      "find.cons.t"      : "지금 울리는 자음: <em>{0}</em>",
      "find.cons.d"      : "낱말 {0}개에 걸쳐 쌓인 소리 목록이에요. 여기 없는 소리를 하나 들이면 언어 전체의 빛깔이 달라져요.",
      "find.vow.t"       : "오직 <em>{0}</em>뿐 — 모두 {1}개",
      "find.vow.d"       : "모음이 적을수록 언어가 한 덩어리처럼 들려요. 언제든 더 넓힐 수 있어요.",
      "find.syl.t"       : "낱말이 대개 <em>{0}음절</em>이에요",
      "find.syl.t.1"     : "낱말이 대개 <em>한 음절</em>이에요",
      "find.syl.d"       : "낱말 {0}개 중 {1}개가 그래요. 길이가 고르면 언어가 조립한 것이 아니라 말해 온 것처럼 들려요.",
      "find.coda.t"      : "낱말 끝에는 언제나 <em>{0}</em>만 와요",
      "find.coda.d"      : "그 목록이 좁을수록 낱말을 이어 말할 때 이음새가 깔끔해요.",
      "find.unused.t"    : "한 번도 나오지 않는 소리: <em>{0}</em>",
      "find.unused.d"    : "끝내 쓰지 않는 소리가 있다는 것도 그 언어의 표정이에요.",
      "hint.pos"         : "{1} 낱말을 {0}개 더 적으면 규칙이 — {1} 낱말이 어떻게 끝나는지가 — 드러나요.",
      "hint.pos.1"       : "{1} 낱말을 하나 더 적으면 규칙이 — {1} 낱말이 어떻게 끝나는지가 — 드러나요.",
      "hint.more"        : "낱말이 많아질수록 찾아낼 규칙도 많아져요.",
      "sent.weave"       : "엮기",
      "sent.prev"        : "앞으로",
      "sent.later"       : "뒤로",
      "sent.undo"        : "하나 되돌리기",
      "sent.reads"       : "소리 내어 읽으면",
      "sent.choose"      : "낱말 고르기",
      "sent.search"      : "철자나 뜻 검색",
      "sent.nomatch"     : "찾은 게 없어요.",
      "words.addmn"      : "뜻 추가",
      "sent.chk.fix"     : "고른 어순대로 맞추기",
      "sent.listen"      : "들어보기",
      "sent.reweave"     : "다시 엮기",
      "sent.drop"        : "지우기",
      "toast.kept"       : "문장을 간직했어요",
      "toast.dropped"    : "지웠어요",
      "toast.reordered"  : "고른 어순으로 되돌렸어요",
      "toast.cap"        : "무료 요금제는 낱말 {0}개까지 담을 수 있어요",
      "set.title"        : "설정",
      "set.look"         : "모양",
      "theme.system"     : "시스템",
      "theme.light"      : "밝게",
      "theme.dark"       : "어둡게",
      "set.theme.note"   : "“시스템”은 기기를 따릅니다",
      "set.reading"      : "발음을 보여 주는 방식",
      "read.ipa"         : "IPA",
      "read.both"        : "둘 다",
      "set.sample"       : "예시",
      "set.display"      : "표시 언어",
      "set.voice.try"    : "들어보기",
      "set.lang"         : "내 언어",
      "set.name"         : "이름",
      "set.count"        : "낱말 수",
      "set.plan"         : "요금제",
      "set.plan.cur"     : "현재 요금제",
      "bk.off"           : "앱이 파일 저장소에 접근하지 못했습니다.",
      "bk.bad"           : "기록되지 않음: {0}",
      "bk.h"             : "이 기기 안",
      "bk.none"          : "아직 기록되지 않음",
      "bk.no"            : "저장 {0}",
      "bk.gen"           : "예비 {0}",
      "set.data"         : "데이터",
      "set.csv.out"      : "CSV로 내보내기",
      "set.csv.in"       : "CSV에서 가져오기",
      "set.lock.csv.t"   : "CSV 가져오기와 내보내기",
      "set.lock.csv.d"   : "스프레드시트에서 만들어 둔 묶음을 한꺼번에 부어 넣어요",
      "set.wipe"         : "전부 삭제",
      "confirm.wipe"     : "지금까지 지은 낱말을 전부 지우고 처음부터 다시 할까요?",
      "langs.title"      : "언어",
      "langs.mine"       : "내 언어",
      "langs.reading"    : "읽는 중",
      "langs.untitled"   : "제목 없음",
      "langs.open"       : "열림",
      "langs.more"       : "지금은 모든 요금제에서 언어가 하나예요.",
      "langs.none"       : "아직 없어요",
      "plans.title"      : "요금제",
      "plans.intro"      : "언어를 짓는 일은 무료이고, 앞으로도 무료예요.<br>돈이 드는 쪽은 아주 많이 담아 두는 일과, AI와 나란히 생각하는 일이에요.",
      "plan.cur"         : "현재",
      "plan.tofree"      : "무료로 돌아가기",
      "plan.choose"      : "선택",
      "plans.note"       : "결제는 아직 연결되어 있지 않아요. 지금은 화면에 보이는 내용만 바뀌어요.",
      "plan.free.1"      : "낱말을 하나하나 손으로 짓기 — 전부",
      "plan.free.2"      : "규칙은 찾아 주고, 발음은 이끌어 내 줘요",
      "plan.free.3"      : "연음을 보여 주고, 소리 내어 읽어 줘요",
      "plan.free.4"      : "규칙을 지키는 낱말을 한꺼번에 짓기",
      "plan.free.5"      : "기기에 저장 · 낱말 100개까지",
      "plan.plus.1"      : "낱말 수 제한 없음",
      "plan.plus.2"      : "CSV 일괄 가져오기·내보내기",
      "plan.plus.3"      : "Free의 모든 것",
      "plan.studio.1"    : "AI와 함께 작업 (뜻에서 꼴 찾기, 문법, 예문)",
      "plan.studio.2"    : "주제 하나로 어휘 전체 짓기",
      "plan.studio.3"    : "Plus의 모든 것",
      "plan.price.free"  : "$0",
      "plan.price.plus"  : "월 $9.99",
      "plan.price.studio": "월 $19.99",
      "toast.plan.free"  : "무료 요금제로 돌아왔어요",
      "toast.plan.other" : "(가짜) {0} 요금제로 바꿨어요",
      "add.title"        : "새 단어",
      "f.spelling"       : "철자",
      "f.reading"        : "발음",
      "f.listen"         : "재생",
      "f.meaning"        : "뜻",
      "f.meaning.ph"     : "별",
      "f.pos"            : "품사",
      "add.btn"          : "담기",
      "add.lock.t"       : "철자 제안",
      "add.lock.d"       : "쓰고 있는 소리로 만든 것",
      "toast.hw2"        : "철자는 두 글자 이상이어야 해요",
      "toast.dup"        : "이미 있는 낱말이에요",
      "toast.added.1"    : "{0} 담았어요",
      "voice.none"       : "이 기기에서는 소리를 낼 수 없습니다",
      "word.sounds"      : "소리",
      "word.means"       : "이 낱말의 뜻",
      "word.mn.add"      : "추가",
      "word.mn.del"      : "제거",
      "word.family"      : "어디에서 왔는지",
      "word.from"        : "{0}에서 갈라져 나왔어요",
      "word.derive"      : "파생어 만들기",
      "word.note"        : "메모",
      "word.sp"          : "읽기",
      "word.sp.none"     : "　",
      "word.sp.del"      : "문자 빼기",
      "word.note.ph"     : "이 단어에 대한 아무거나",
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
      "glyph.del.ask"    : "이 소리에서 글자를 뗄까요? 소리는 당신의 언어에 그대로 남아요.",
      "glyph.deleted"    : "{0}에 이제 글자가 없어요",
      "word.mn.ph"       : "뜻 추가",
      "word.reg"        : "문체",
      "word.reg.none"        : "보통",
      "word.reg.sp"        : "구어",
      "word.reg.wr"        : "문어",
      "word.reg.sl"        : "속어",
      "word.reg.po"        : "높임",
      "word.tags"        : "분야",
      "word.tags.ph"        : "요리, 친족",
      "word.ety"        : "어원",
      "word.ety.ph"        : "이 단어가 이렇게 된 까닭",
      "word.up"        : "수정 {0}",
      "word.made"        : "생성 {0}",
      "prof.posts"        : "게시물",
      "prof.none"        : "아직 올린 글이 없습니다.",
      "post.more"        : "더보기",
      "post.pin"        : "이 글을 고정",
      "post.unpin"        : "고정 해제",
      "post.pinned"        : "고정됨",
      "post.pic"        : "사진",
      "post.pic.again"        : "사진 바꾸기",
      "post.pic.drop"        : "사진 빼기",
      "post.pic.bad"        : "이 이미지는 쓸 수 없었습니다.",
      "post.pic.full"        : "타임라인이 가득 찼습니다. 아무것도 지우지 않았습니다 — 이 글에서 사진을 빼거나, 오래된 글을 직접 지워 주세요.",
      "post.full"        : "타임라인이 가득 차 저장되지 않았습니다. 오래된 글을 지우고 다시 시도해 주세요.",
      "tr.go"        : "내 언어로 읽기",
      "tr.left"        : "오늘 {0}회 남음",
      "tr.out"        : "오늘의 3회를 다 썼습니다. Plus는 전부 읽습니다.",
      "word.edit"        : "편집",
      "word.save"        : "저장",
      "word.del"         : "단어 삭제",
      "confirm.del"      : "{0}, 지울까요?",
      "toast.saved"      : "{0} 고쳤어요",
      "toast.deleted"    : "{0} 지웠어요",
      "card.title"        : "카드",
      "card.save"         : "공유",
      "card.saved"        : "저장됨",
      "imp.next"          : "다음",
      "imp.role.hw"       : "철자",
      "imp.role.mn"       : "뜻",
      "imp.role.pos"      : "품사",
      "imp.role.ph"       : "소리",
      "imp.role.ch"       : "문자",
      "imp.role.nm"       : "이름",
      "imp.ltr"           : "글자",
      "imp.role.skip"     : "사용 안 함",
      "imp.new"           : "새로 들어옴",
      "imp.have"          : "이미 있음",
      "imp.coin"          : "새로 만듦",
      "imp.over"          : "덮어쓰기",
      "imp.skip"          : "건너뛰기",
      "imp.file"          : "파일 선택",
      "imp.done"          : "{0}개 들어왔습니다",
      "imp.undo"          : "되돌리기",
      "imp.undone"        : "되돌렸습니다",
      "imp.again"         : "다시 시작",
      "imp.ok"            : "완료",
      "imp.empty"         : "읽을 수 있는 것이 없습니다",
      "csv.title"        : "목록 가져오기",
      "csv.note"         : "한 줄에 하나. 뜻만 쓰면 그 낱말을 만듭니다.",
      "csv.ph"           : "고양이\n물\n걷다\n\nkano, 산, 명사",
      "csv.btn"          : "가져오기",
      "csv.full"        : "{0}개 가져옴, {1}개 만듦 — Free가 가득 찼습니다",
      "csv.done"         : "{0}개 가져오고 {1}개 만들었습니다",
      "toast.exported"   : "내보냈어요",
      "toast.exportfail" : "내보내지 못했어요",
      "toast.imported"   : "낱말 {0}개를 가져왔어요",
      "toast.imported.1" : "낱말 하나를 가져왔어요",
      "read.sep"         : "　"
    }
  };
})());
