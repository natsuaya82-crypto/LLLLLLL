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
    pos    : {n:"명사", v:"동사", adj:"형용사", x:"기타"},
    read   : mkApprox(word_ko, syl_ko),
    str    : {
      "ai.a.home"                 : "지금 {0}개의 단어와 {1}개의 소리가 있어요. 가장 빠른 길은 단어를 더 만드는 것 — 규칙은 단어에서 나옵니다.",
      "ai.a.make"                 : "조어는 이미 쓰는 소리를 따르므로 새 단어도 한 갈래로 들려요. 소리가 맞다고 느껴지는 것만 남기세요.",
      "ai.a.rules"                : "지금까지 {0}개의 규칙이 드러났어요. 같은 습관으로 계속 쓰면 저절로 또렷해집니다.",
      "ai.a.sent"                 : "문장이 {0}개예요. 같은 생각을 두 가지로 써보세요 — 그 차이에 당신의 문법이 있습니다.",
      "ai.a.sound"                : "{0}개의 소리를 쓰고 있어요: {1}. 작고 일관된 음운이 넓고 흩어진 것보다 더 진짜 언어처럼 들립니다.",
      "ai.a.words"                : "어휘가 {0}개예요. 실제로 말하는 것을 위한 단어를 만드세요; 언어는 목록이 아니라 쓰임에서 자랍니다.",
      "ai.ask"                    : "자문 받기",
      "ai.hint"                   : "자문은 당신의 언어를 읽고 그것을 바탕으로 답합니다.",
      "ai.left"                   : "오늘 {0}회 남음",
      "ai.limit.s"                : "Plus라면 매일 무제한으로 상담할 수 있어요.",
      "ai.limit.t"                : "오늘의 질문을 모두 사용했어요",
      "ai.see"                    : "요금제 보기",
      "ai.title"                  : "언어 자문",
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
      "add.ph.none"               : "이 언어에는 아직 소리가 없어요. 몇 개 고르면 그 소리로 낱말을 지을 수 있어요.",
      "ipa.b.back"                : "후설",
      "ipa.b.central"             : "중설",
      "ipa.b.front"               : "전설",
      "ipa.cons"                  : "자음",
      "ipa.footer"                : "기호 하나는 이 표를 읽는 누구에게나 같은 소리를 뜻해요. 그것을 뭐라고 부를지, 무엇으로 적을지는 당신의 몫이에요.",
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
      "ipa.mine"                  : "이 언어가 쓰는 소리",
      "ipa.letters"               : "소리를 탭하면 글자를 그리거나 빌려 올 수 있어요.",
      "ipa.mine.none"             : "아직 고른 것이 없어요.",
      "ipa.note"                  : "이 언어를 이루는 소리를 골라요. 여기서 고른 소리에만 글자를 줄 수 있어요.",
      "ipa.other"                 : "그 밖에",
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
      "next.sc0"                  : "다음 글자 그리기",
      "set.account"               : "계정",
      "set.account.note"          : "계정은 언어를 이 기기 밖으로 옮길 때 쓰여요. 여기 있는 것 중에 계정이 있어야 하는 건 없어요.",
      "set.account.soon"          : "아직 연결되어 있지 않아요.",
      "ob.borrow.h"               : "빌려 쓸 문자를 고르세요.",
      "ob.borrow.sub"             : "직접 그리는 건 나중에도 할 수 있어요.",
      "ob.borrow.take"            : "글자를 탭하면 가져옵니다.",
      "ob.door.h"                 : "문에는 이제 당신의 글자가 걸려 있습니다.",
      "ob.door.note"              : "이름도 계정도 없습니다. 그런 것들은 나중에 해도 됩니다.",
      "ob.draw.done"              : "완료",
      "ob.draw.empty"             : "먼저 획을 하나 그어 보세요.",
      "ob.draw.h"                 : "당신 언어의 첫 글자를<br>그려 보세요.",
      "ob.draw.sub"               : "무엇이든 좋아요. 당신의 것이니까요.",
      "ob.lang.a"                 : "인터페이스 언어",
      "ob.open"                   : "문 열기",
      "ob.or"                     : "또는 이미 있는 문자에서 시작하기",
      "ob.snd.h"                  : "어떤 소리인가요?",
      "ob.snd.note.borrow"        : "모양은 빌려 오고, 소리는 당신의 것이에요. 여기서는 어떤 글자도 원래 있던 곳의 뜻을 그대로 지킬 필요가 없어요.",
      "ob.snd.note.draw"          : "글자는 당신의 글자표에, 소리는 당신의 소리 목록에 들어갑니다.",
      "ob.enter"                  : "시작하기",
      "ob.lang.h"                 : "언어를 선택하세요",
      "ob.name.auto"              : "대신 지어주기",
      "ob.name.h"                 : "당신의 언어를<br>뭐라고 부를까요?",
      "ob.name.mini"              : "나중에 언제든 바꿀 수 있어요.",
      "ob.name.ph"                : "예: Aelira",
      "ob.signin.apple"           : "Apple로 계속하기",
      "ob.signin.google"          : "Google로 계속하기",
      "ob.signin.note"            : "시작하려면 로그인하세요.",
      "ob.signin.skip"            : "계정 없이 계속하기",
      "ob.signin.local"           : "계정이 없으면 언어는 이 기기 안에만 남고, 웹에서는 보이지 않아요.",
      "ob.tagline"                : "당신의 언어에 새로운 빛깔을.",
      "script.none2"              : "아직 글자가 없어요",
      "script.none2s"             : "아래에서 문자를 고르거나, 직접 글자를 입력하세요.",
      "script.own.ph"             : "글자를 붙여넣거나 입력",
      "script.set"                : "적용",
      "snd.have"                  : "이미 쓰는 소리",
      "sug.ask"                   : "떠오르지 않나요?",
      "sug.for"                   : "“{0}”에 어울리는 형태 — 탭하면 그대로 들어갑니다.",
      "sug.hint"                  : "이미 쓰는 소리로 만든 후보예요 — 탭하면 그대로 들어갑니다.",
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
      "lang.default"     : "내 언어",
      "nav.contents"     : "차례",
      "nav.settings"     : "설정",
      "home.kicker"      : "당신의 언어",
      "home.unnamed"     : "이름 짓기",
      "home.name.prompt" : "언어의 이름",
      'next.t'   : "다음",
      'next.w0'  : "첫 단어를 만들기",
      'next.w1'  : "단어를 더 추가 — 규칙이 보이기까지 {0}개",
      'next.s0'  : "첫 문장을 써보기",
      'next.mk'  : "내 음운으로 새 단어 만들기",
      "toc.words"        : "어휘",
      "toc.sound"        : "음운",
      "toc.gram"         : "문법",
      "toc.sent"         : "예문",
      "toc.make"         : "조어",
      /* the writing system */
      "script.preview"    : "내 글씨",
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
      "count.lines"      : "문장 {0}개",
      "count.lines.1"    : "문장 1개",
      "home.empty.t"     : "아직 한 낱말도 없어요",
      "home.empty.s"     : "낱말 하나에서 시작해요.<br>철자를 적으면 발음은 저절로 따라와요.",
      "home.empty.btn"   : "첫 낱말 적기",
      "home.recent.line" : "가장 최근 문장",
      "home.recent.word" : "마지막으로 적은 낱말",
      "home.write"       : "낱말 적기",
      "words.search"     : "철자·뜻·발음 검색",
      "words.nomatch"    : "찾은 게 없어요",
      "words.empty"      : "아직 낱말이 없어요",
      "sound.used"       : "쓰고 있는 자음",
      "sound.unused"     : "쓰지 않는 자음",
      "sound.none"       : "아직 없어요.",
      "sound.note"       : "쓰지 않기로 한 소리도 쓰는 소리만큼이나 그 언어의 일부예요.<br>글자 아래 작게 붙은 기호는 국제음성기호(IPA)예요. 세상 어느 언어에서든 한 기호가 한 소리를 가리켜요.",
      "sound.vowels"     : "모음",
      "sound.together"   : "이어서 말할 때",
      "link.yes"         : "끝소리 자음이 다음 낱말로 넘어가요",
      "link.no"          : "낱말마다 따로 떨어져 있어요",
      "sound.listen"     : "들어보기",
      "sound.linkhint"   : "모음으로 시작하는 낱말을 적으면 앞의 자음이 그리로 넘어가면서, 둘이 한 호흡이 돼요.",
      "sound.footer"     : "이 셈은 전부 기기 안에서 이루어져요. 네트워크도, AI도 쓰지 않아요.",
      /* notes */
      "toc.notes"        : "메모",
      "count.notes"      : "메모 {0}개",
      "notes.note"       : "이 언어에 대한 것 가운데 낱말도, 소리도, 정한 것도 아닌 것들이에요. 나머지와 함께 이 기기 안에 남아요.",
      "notes.new"        : "새 메모",
      "notes.edit"       : "이 메모",
      "notes.t"          : "제목",
      "notes.t.ph"       : "없어도 돼요",
      "notes.b"          : "내용",
      "notes.b.ph"       : "누가 이 말을 쓰는지. 왜 한 낱말이 다른 낱말이기도 한지. 그냥 두면 내일이면 잊어버릴 것들.",
      "notes.save"       : "간직하기",
      "notes.del"        : "이 메모 지우기",
      "notes.untitled"   : "제목 없음",
      "notes.empty.t"    : "아직 적어 둔 것이 없어요",
      "notes.empty.s"    : "짓고 있는 언어에 대해 아는 것은 대부분 아직 모양이 없어요. 그런 것들이 여기에 들어와요.",
      "notes.footer"     : "그냥 글이고, 이 기기 안에 담겨 있어요. 여기 적은 것은 앱의 다른 어디에서도 읽지 않아요.",
      "toast.note.kept"  : "메모를 간직했어요",
      "toast.note.gone"  : "메모를 지웠어요",
      "confirm.note.del" : "이 메모를 지울까요?",
      /* the conversation */
      "toc.talk"         : "대화",
      "count.turns"      : "주고받은 말 {0}마디",
      "talk.knows"       : "이 언어를 전부 읽었어요: 낱말 {0}개, 소리 {1}개, 정한 것 {2}개. 다른 말은 할 줄 몰라요.",
      "talk.first"       : "아래에서 낱말을 몇 개 골라 보내 보세요. 당신의 언어로 답해요.",
      "talk.compose"     : "지금 하는 말",
      "talk.send"        : "말하기",
      "talk.wipe"        : "이 대화 비우기",
      "talk.empty.t"     : "대화를 나누기엔 아직 부족해요",
      "talk.empty.s"     : "대화에는 적어도 무언가 하나와 하는 일 하나가 필요해요.<br>명사와 동사를 먼저 하나씩 적어 보세요.",
      "talk.footer"      : "여기 나오는 말은 당신의 낱말로, 당신이 정한 순서로, 당신이 정한 표시를 붙여 지어져요. 전부 이 기기 안의 셈이고, 어디로도 보내지 않아요.",
      "confirm.talk.clear" : "대화를 전부 비울까요?",
      /* grammar — the decisions */
      "gram.note"        : "여기 있는 건 발견한 게 아니라 정하는 거예요. 하나하나가 낱말이 나오는 모양을 바꾸고, 그 바뀜이 귀에 들려요.",
      "gram.order.t"     : "어순",
      "gram.order.d"     : "하는 쪽, 당하는 쪽, 하는 일 가운데 무엇이 먼저 오는지예요.",
      "gram.role.S"      : "하는 쪽",
      "gram.role.O"      : "당하는 쪽",
      "gram.role.V"      : "하는 일",
      "gram.adj.t"       : "꾸미는 말의 자리",
      "gram.adj.d"       : "꾸미는 대상 앞에 오거나, 뒤에 와요.",
      "gram.adj.before"       : "앞에",
      "gram.adj.after"       : "뒤에",
      "gram.num.t"       : "하나보다 많을 때",
      "gram.num.d"       : "여럿이라는 것을 낱말이 어떻게 나타내는지예요 — 아무 표시도 하지 않는 언어도 많아요.",
      "gram.past.t"      : "이미 일어난 일",
      "gram.past.d"      : "하는 일이 이미 끝났을 때 그 낱말이 어떻게 달라지는지예요.",
      "gram.neg.t"       : "아니라고 하기",
      "gram.neg.d"       : "줄에 적힌 말을 이 언어가 어떻게 뒤집는지예요.",
      "gram.q.t"         : "묻기",
      "gram.q.d"         : "말한 것을 묻는 것으로 바꾸는 게 무엇인지예요.",
      "gram.poss.t"      : "누구의 것",
      "gram.poss.d"      : "하나가 다른 것의 것이라고 이 언어가 어떻게 말하는지예요.",
      "gram.how.none"    : "표시 없음",
      "gram.how.suffix"  : "뒤에 붙이기",
      "gram.how.prefix"  : "앞에 붙이기",
      "gram.how.redup"   : "두 번 말하기",
      "gram.how.before"  : "앞에 한 낱말",
      "gram.how.after"   : "뒤에 한 낱말",
      "gram.how.start"   : "줄 맨 앞에",
      "gram.how.end"     : "줄 맨 뒤에",
      "gram.piece"       : "표시를 맡는 소리",
      "gram.piece.none"  : "아직 정하지 않음",
      "gram.piece.h"     : "어떤 소리가 맡을지",
      "gram.piece.d"     : "낱말을 짓는 것과 같은 방식으로, 이 언어가 가진 소리로 지어요. “{0}”에 붙는 표시가 바로 이거예요.",
      "gram.piece.set"   : "이걸로 하기",
      "gram.demo.need"   : "낱말을 몇 개 더 적으면 그 낱말이 바뀌는 모습을 여기에 보여 줘요.",
      "gram.pair.one"    : "하나",
      "gram.pair.many"   : "여럿",
      "gram.pair.now"    : "지금",
      "gram.pair.past"   : "전에",
      "gram.pair.yes"    : "그렇다",
      "gram.pair.no"     : "아니다",
      "gram.pair.say"    : "말하기",
      "gram.pair.ask"    : "묻기",
      "gram.pair.plain"  : "혼자",
      "gram.pair.owned"  : "딸림",
      "gram.pair.phrase" : "묶음",
      "gram.pair.line"   : "줄",
      "gram.seen"        : "당신의 낱말이 이미 하고 있는 것",
      "gram.footer"      : "여기서 정한 것은 무엇도 굳어 있지 않아요. 하나를 바꾸면 이 화면의 예가 모두 따라 바뀌어요.",
      "sent.order.d"     : "문법에서 정한 어순이에요. 여기서는 엮은 줄을 맞춰 보는 데만 써요.",
      "rules.intro"      : "적어 둔 낱말 {0}개를 세어 찾아낸 버릇이에요. 정한 게 아니라, 발견한 거예요.",
      "rules.intro.1"    : "적어 둔 낱말 1개를 세어 찾아낸 버릇이에요. 정한 게 아니라, 발견한 거예요.",
      "rules.empty.t"    : "아직 규칙이 없어요",
      "rules.empty.s"    : "낱말을 몇 개 먼저 적어 보세요.",
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
      "sent.empty.t"     : "문장을 만들기엔 아직 부족해요",
      "sent.empty.s"     : "문장에는 낱말이 적어도 둘은 필요해요.<br>몇 개 먼저 적어 보세요.",
      "sent.weave"       : "엮기",
      "sent.prev"        : "앞으로",
      "sent.later"       : "뒤로",
      "sent.remove"      : "이 낱말 빼기",
      "sent.taphint"     : "낱말을 누르면 자리를 옮기거나 뺄 수 있어요.",
      "sent.palhint"     : "아래에서 낱말을 고르면 여기에 차례로 놓여요. 몇 개든 좋고, 같은 낱말을 몇 번이든 써도 좋아요.",
      "sent.undo"        : "하나 되돌리기",
      "sent.clear"       : "비우기",
      "sent.reads"       : "소리 내어 읽으면",
      "sent.say"         : "말해 보기",
      "sent.linkhint"    : "모음으로 시작하는 낱말을 줄에 넣으면 앞의 자음이 그리로 넘어가면서, 둘이 한 호흡이 돼요.",
      "sent.keep"        : "이 문장 간직하기",
      "sent.need2"       : "낱말을 둘 이상 늘어놓으면 어떻게 이어지는지 들어볼 수 있어요.",
      "sent.choose"      : "낱말 고르기",
      "sent.search"      : "철자나 뜻 검색",
      "sent.nomatch"     : "찾은 게 없어요.",
      "sent.nomean"      : "뜻 없음",
      "sent.order"       : "어순 (이 언어의 규칙)",
      "sent.chk.ok"      : "이 줄은 <b>{0}</b> 순서예요 — 고른 어순 그대로예요.",
      "sent.chk.ng"      : "이 줄은 <b>{0}</b> 순서인데, 고른 어순은 <b>{1}</b> 순서예요.",
      "sent.chk.fix"     : "고른 어순대로 맞추기",
      "sent.chk.hint"    : "주어와 목적어와 동사를 늘어놓으면 Lingua가 그 순서를 규칙과 맞춰 봐요.<br>다른 배열도 괜찮아요. 규칙은 길잡이일 뿐, 울타리가 아니에요.",
      "sent.kept"        : "간직한 문장",
      "sent.listen"      : "들어보기",
      "sent.reweave"     : "다시 엮기",
      "sent.drop"        : "지우기",
      "sent.footer"      : "발음도, 낱말이 이어지는 방식도 모두 이 기기 안에서 헤아려요.",
      "toast.need2"      : "낱말을 적어도 둘은 늘어놓아 주세요",
      "toast.kept"       : "문장을 간직했어요",
      "toast.dropped"    : "지웠어요",
      "toast.reordered"  : "고른 어순으로 되돌렸어요",
      "make.rule"        : "{0} 낱말의 지금 규칙을 지켜서 지어요 — <span style=\"color:var(--gold)\">-{1}</span> 꼴로 끝나요.",
      "make.norule"      : "{0} 낱말에는 아직 자리 잡은 규칙이 없어서, 이미 쓰고 있는 소리만으로 지었어요.",
      "make.empty.t"     : "본뜰 것이 아직 부족해요",
      "make.empty.s"     : "먼저 낱말을 몇 개 직접 적어 보세요.<br>Lingua는 그 소리를 본떠서 지어요.",
      "make.left"        : "무료 요금제에서 {0}개 더 지을 수 있어요.",
      "make.left.1"      : "무료 요금제에서 하나 더 지을 수 있어요.",
      "make.lock.t"      : "한 번에 한 묶음 부탁하기",
      "make.lock.d"      : "“바다에 관한 낱말 서른 개” — 그러면 도착해요",
      "make.reroll"      : "다시 뽑기",
      "make.commit"      : "고른 것 담기",
      "toast.noselect"   : "고른 것이 없어요",
      "toast.cap"        : "무료 요금제는 낱말 {0}개까지 담을 수 있어요",
      "toast.added.n"    : "낱말 {0}개를 담았어요. 뜻은 낱말 목록에서 적을 수 있어요",
      "toast.added.n.1"  : "낱말 하나를 담았어요. 뜻은 낱말 목록에서 적을 수 있어요",
      "set.title"        : "설정",
      "set.look"         : "모양",
      "theme.system"     : "시스템",
      "theme.light"      : "밝게",
      "theme.dark"       : "어둡게",
      "set.theme.note"   : "‘시스템’은 기기 설정을 그대로 따라가요.",
      "set.reading"      : "발음을 보여 주는 방식",
      "read.ipa"         : "IPA",
      "read.both"        : "둘 다",
      "set.sample"       : "예시",
      "set.ipa.note"     : "IPA는 누구나 그 소리를 낼 수 있도록 세계가 함께 쓰는 표기예요. 여기 낱말은 <b style=\"color:var(--tx);font-weight:500\">/ /</b> 안에 그대로 IPA로 적혀 있어요. {0} 쪽은 그것을 어림잡은 것으로, 말하기보다는 읽기 위한 표기예요.",
      "set.display"      : "표시 언어",
      "set.display.note" : "화면도, 낱말의 발음도 이 설정을 따라가요. IPA만은 그렇지 않아요 — 어느 언어에서나 같으니까요. 한국어에는 한글 표기, 일본어에는 가타카나, 영어에는 <b style=\"color:var(--tx);font-weight:500\">AY-leen</b>처럼 대문자로 강세를 나타내는 표기를 써요. 기본값은 기기 설정을 따라가요.",
      "set.voice.try"    : "들어보기",
      "set.voice.note"   : "여기 나오는 소리는 모두 이 기기 안에서 IPA 표 자체로 만들어져요 — 입을 얼마나 벌리는지, 입안 어디에서 내는지, 목청이 울리는지. 휴대폰의 목소리는 쓰지 않아요. 휴대폰 목소리는 어떤 언어를 말할 수 있을 뿐인데, 이건 그런 언어가 아니니까요. 소리가 나지 않으면 먼저 기기 옆면의 무음 스위치를, 그다음 음량을 확인해 보세요.",
      "set.lang"         : "언어",
      "set.name"         : "이름",
      "set.count"        : "낱말 수",
      "set.plan"         : "요금제",
      "set.plan.cur"     : "현재 요금제",
      "set.data"         : "데이터",
      "set.csv.out"      : "CSV로 내보내기",
      "set.csv.in"       : "CSV에서 가져오기",
      "set.cloud"        : "클라우드 백업",
      "set.on"           : "켜짐",
      "set.lock.csv.t"   : "CSV 가져오기와 내보내기",
      "set.lock.csv.d"   : "스프레드시트에서 만들어 둔 묶음을 한꺼번에 부어 넣어요",
      "set.lock.cloud.t" : "클라우드 백업",
      "set.lock.cloud.d" : "새 기기로 옮겨도 남아요. 기기가 여럿이어도 사전은 하나예요",
      "set.wipe"         : "전부 지우고 처음부터 다시",
      "set.footer"       : "Lingua · 낱말은 이 기기 안에 담겨 있어요.",
      "set.footer.free"  : " 무료 요금제는 네트워크에 닿지 않아요.",
      "confirm.wipe"     : "지금까지 지은 낱말을 전부 지우고 처음부터 다시 할까요?",
      "plans.title"      : "요금제",
      "plans.intro"      : "언어를 짓는 일은 무료이고, 앞으로도 무료예요.<br>돈이 드는 쪽은 아주 많이 담아 두는 일과, AI와 나란히 생각하는 일이에요.",
      "plan.cur"         : "현재",
      "plan.tofree"      : "무료로 돌아가기",
      "plan.choose"      : "이 요금제 고르기",
      "plans.note"       : "결제는 아직 연결되어 있지 않아요. 지금은 화면에 보이는 내용만 바뀌어요.",
      "plan.free.1"      : "낱말을 하나하나 손으로 짓기 — 전부",
      "plan.free.2"      : "규칙은 찾아 주고, 발음은 이끌어 내 줘요",
      "plan.free.3"      : "연음을 보여 주고, 소리 내어 읽어 줘요",
      "plan.free.4"      : "규칙을 지키는 낱말을 한꺼번에 짓기",
      "plan.free.5"      : "기기에 저장 · 낱말 100개까지",
      "plan.plus.1"      : "낱말 수 제한 없음",
      "plan.plus.2"      : "클라우드 백업 (새 기기, 여러 기기)",
      "plan.plus.3"      : "낱말을 CSV로 가져오고 내보내기",
      "plan.plus.4"      : "Free의 모든 것",
      "plan.studio.1"    : "AI와 함께 작업 (뜻에서 꼴 찾기, 문법, 예문)",
      "plan.studio.2"    : "주제 하나로 어휘 전체 짓기",
      "plan.studio.3"    : "Plus의 모든 것",
      "plan.price.free"  : "$0",
      "plan.price.plus"  : "월 $9",
      "plan.price.studio": "월 $19",
      "toast.plan.free"  : "무료 요금제로 돌아왔어요",
      "toast.plan.other" : "(가짜) {0} 요금제로 바꿨어요",
      "add.title"        : "낱말 적기",
      "add.note"         : "발음은 적은 철자에서 헤아려 나와요.",
      "f.spelling"       : "철자",
      "f.reading"        : "발음",
      "f.listen"         : "들어보기",
      "f.meaning"        : "뜻",
      "f.meaning.ph"     : "별",
      "f.pos"            : "품사",
      "add.btn"          : "담기",
      "add.lock.t"       : "뜻에 어울리는 꼴을 함께 이야기하기",
      "add.lock.d"       : "“고요함이 느껴지는 낱말이었으면 좋겠어요”",
      "toast.hw2"        : "철자는 두 글자 이상이어야 해요",
      "toast.dup"        : "이미 있는 낱말이에요",
      "toast.added.1"    : "{0} 담았어요",
      "voice.none"       : "이 기기에서는 앱이 소리를 낼 수 없어요.",
      "words.coin"       : "여러 개 짓기",
      "word.sounds"      : "이 낱말을 이루는 소리",
      "word.sounds.d"    : "여기를 고치면 이 낱말이 쓰인 곳마다 함께 바뀌어요.",
      "word.means"       : "이 낱말의 뜻",
      "word.mn.add"      : "추가",
      "word.mn.del"      : "이 뜻 지우기",
      "word.family"      : "어디에서 왔는지",
      "word.from"        : "{0}에서 갈라져 나왔어요",
      "word.derive"      : "이 낱말에서 새 낱말 짓기",
      "add.title.from"   : "{0}에서 나온 낱말",
      "add.note.from"    : "바탕이 된 낱말 그대로 열려요. 거기서 소리를 고쳐 보세요.",
      "glyph.other"      : "이 소리의 글자",
      "glyph.borrow"     : "대신 문자 빌려 쓰기",
      "glyph.borrowed"   : "이 소리에 빌려 쓴 문자",
      "glyph.del"        : "이 소리에서 글자 떼기",
      "glyph.del.ask"    : "이 소리에서 글자를 뗄까요? 소리는 당신의 언어에 그대로 남아요.",
      "glyph.deleted"    : "{0}에 이제 글자가 없어요",
      "word.mn.ph"       : "아직 정하지 않음",
      "word.save"        : "저장",
      "word.del"         : "이 낱말 지우기",
      "confirm.del"      : "{0}, 지울까요?",
      "toast.saved"      : "{0} 고쳤어요",
      "toast.deleted"    : "{0} 지웠어요",
      "csv.title"        : "CSV에서 가져오기",
      "csv.note"         : "한 줄에 낱말 하나: 철자, 뜻, 품사 순서예요. 머리글 줄이 있어도 괜찮아요.",
      "csv.ph"           : "Aelin,별,명사&#10;Naeth,물,명사",
      "csv.btn"          : "가져오기",
      "toast.exported"   : "내보냈어요",
      "toast.exportfail" : "내보내지 못했어요",
      "toast.imported"   : "낱말 {0}개를 가져왔어요",
      "toast.imported.1" : "낱말 하나를 가져왔어요",
      "read.sep"         : "　"
    }
  };
})());
