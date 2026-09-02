/* ---------------------------------------------------------------------------
   tools/pv/store-copy.mjs — the words on the App Store pictures, per country.

   App Store Connect keeps a SEPARATE set of screenshots for every
   localisation on the product page. Somebody in Japan and somebody in France
   see different pictures, from the same build, with no second submission --
   so the pictures are made per language rather than once in English.

   Two things have to move together for that to be true, and they are not the
   same thing:

     - the words on the board (here)
     - the language the app itself is running in (www/i18n/, ten of them)

   `node tools/storeshot.mjs --lang ja` does both. A locale with no table here
   stops the tool rather than quietly making an English board over a Japanese
   phone: half a translation is worse than none, because nobody looking at the
   picture can tell which half was meant.

   THE WORDS ARE THE OWNER'S. What is written here is a first pass, in the
   shape the pictures need (two lines each, always -- one short head in a row
   of six leaves a step where the phones start). Changing the wording is not
   a code change and needs nobody's permission but theirs.
   --------------------------------------------------------------------------- */

/* Latin faces are the app's own two. A locale whose letters neither face has
   is drawn in the one face that does have them -- Cormorant Garamond has no
   kanji, and what it does instead of failing is fall back, per character, to
   whatever the machine happens to carry. */
export const FACES = {
  latin: { kick: "'Cinzel',Georgia,serif", kickTrack: '.34em',
           head: "'Cormorant Garamond',Georgia,serif", headWeight: 300 },
  cjk:   { kick: "'Noto Sans JP',sans-serif", kickTrack: '.22em',
           head: "'Noto Sans JP',sans-serif", headWeight: 300 }
};

export const COPY = {
  en: {
    face: 'latin',
    timeline: { kick: 'The timeline', head: 'Everyone here writes<br>in their own alphabet.' },
    draw:     { kick: 'Your letters', head: 'Every one of them<br>drawn with a <em>finger</em>.' },
    alphabet: { kick: 'The alphabet', head: 'An alphabet<br>nobody else has.' },
    keyboard: { kick: 'The keyboard', head: 'A keyboard made<br>of your own letters.' },
    lexicon:  { kick: 'The lexicon',  head: 'Every word you keep,<br>set in your own hand.' },
    theirs:   { kick: 'Somebody else’s', head: 'Take another person’s<br>language onto your phone.' }
  },
  ja: {
    face: 'cjk',
    timeline: { kick: 'タイムライン', head: 'ここでは誰もが、<br>自分の文字で書く。' },
    draw:     { kick: 'じぶんの文字', head: '一画ずつ、<br><em>指で</em>描く。' },
    alphabet: { kick: 'アルファベット', head: '世界にひとつだけの、<br>文字の一覧。' },
    keyboard: { kick: 'キーボード',   head: '自分の文字で<br>できたキーボード。' },
    lexicon:  { kick: '辞書',         head: '覚えた言葉を、<br>自分の手で綴る。' },
    theirs:   { kick: 'ほかの人の言語', head: '誰かの言語を、<br>この端末に迎える。' }
  }
};

export const LOCALES = Object.keys(COPY);
