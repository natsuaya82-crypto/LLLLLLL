/* Lingua — bringing a list in (chapter 17)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Somebody arriving here has years of work somewhere else: a spreadsheet, a
   dictionary on ConWorkShop, a PolyGlot file, a Toolbox lexicon, a text file
   of "word - meaning" lines. Whether that work can get in decides whether
   they stay, and it used to depend on their spreadsheet having exactly three
   columns in exactly one order.

   Two things were provably wrong before this file existed, and both were in
   the app's OWN export:

     "kano","mountain, hill","n",...   read back as  mn="mountain" pos="hill"
     "ʃaŋ","river","n","ʃaŋ","ʃ a ŋ"   read back with sounds ["a"]

   The first is a comma inside a quoted field; the reader split on every
   comma. The second is a spelling that is not roman: the reader threw away
   the column that held the right answer and guessed from the spelling, and
   the guesser deletes everything outside a-z.

   So this file is in two halves. This one knows nothing about the app: given
   text, it says what shape the text is, cuts it into rows, and guesses what
   each column means. It touches no global and no document, which is why
   tools/import-check.mjs can run it directly over one sample per format --
   the only way "we support every service" can stay true a year from now.

   Four shapes, because there are four in the wild:

     table   anything with a delimiter: CSV, TSV, Excel pasted straight in
             (which arrives tab-separated), semicolon CSV out of a European
             Excel. Quoted fields, embedded commas and newlines, BOM, CRLF.
     mdf     backslash-coded: \lx headword, \ge gloss, \ps part of speech.
             SIL Toolbox, FLEx and Lexique Pro all write this, and it is what
             anyone doing this seriously has.
     json    an array of objects, or the first array of objects inside one.
     lines   "kano - mountain", "kano: mountain", or a bare list of meanings.

   The column names are not hard-coded per service, because a table of "what
   ConWorkShop calls its columns" is a thing that is wrong the day they change
   it and nobody finds out. Instead a column is recognised by its name in any
   of a hundred spellings across ten languages, and where the name says
   nothing, by what is actually in it.
   ========================================================================= */

/* =========================================================================
   17. Bringing a list in
   ========================================================================= */

/* ---- what a file is ---------------------------------------------------- */
/* Asked before anything else, because a Toolbox lexicon and a spreadsheet do
   not become the same thing by being read harder. */
function impShape(src){
  var s=String(src||'').replace(/^﻿/, ''), t=s.replace(/^\s+/, '');
  if(t.charAt(0)==='[' || t.charAt(0)==='{') return 'json';
  if(/(^|\n)\\[a-zA-Z_]{1,6}[ \t]/.test(s)) return 'mdf';
  if(/[\t,;|]/.test(s)) return 'table';
  return 'lines';
}

/* ---- a delimited table ------------------------------------------------- */
/* A tab is the answer whenever there is one: it is what Excel and Sheets put
   on the clipboard, and unlike a comma it effectively never occurs inside a
   cell. Otherwise the candidates are scored by how many rows they cut into
   the same number of columns, because a delimiter that is really a delimiter
   gives a rectangle and one that is punctuation does not. */
function impDelim(src){
  var s=String(src||''), cands=[',', ';', '|'], best=',', bs=-1, i, sc;
  if(s.indexOf('\t')>=0) return '\t';
  for(i=0;i<cands.length;i++){
    sc=impDelimScore(s, cands[i]);
    if(sc>bs){ bs=sc; best=cands[i]; }
  }
  return best;
}
function impDelimScore(src, d){
  var rows=impCells(src, d), i, n, seen={}, top=0, topN=0;
  if(!rows.length) return -1;
  for(i=0;i<rows.length && i<30;i++){
    n=rows[i].length;
    seen[n]=(seen[n]||0)+1;
    if(seen[n]>top || (seen[n]===top && n>topN)){ top=seen[n]; topN=n; }
  }
  if(topN<2) return -1;                 /* one column means it cut nothing */
  return top*100+topN;
}
/* The cut itself, one character at a time, because a quoted field may hold
   the delimiter and may hold a newline, and "" inside quotes is one quote.
   Splitting on a regular expression cannot do any of that, and the app's own
   export writes all three. */
function impCells(src, d){
  var s=String(src||'').replace(/^﻿/, '');
  var rows=[], row=[], cur='', i=0, q=false, c;
  while(i<s.length){
    c=s.charAt(i);
    if(q){
      if(c==='"'){
        if(s.charAt(i+1)==='"'){ cur+='"'; i+=2; continue; }
        q=false; i++; continue;
      }
      cur+=c; i++; continue;
    }
    if(c==='"'){ q=true; i++; continue; }
    if(c===d){ row.push(cur); cur=''; i++; continue; }
    if(c==='\r'){ i++; continue; }
    if(c==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; i++; continue; }
    cur+=c; i++;
  }
  if(cur.length || row.length){ row.push(cur); rows.push(row); }
  return impTidy(rows);
}
/* Trimmed, and without the blank rows a spreadsheet leaves at the bottom. */
function impTidy(rows){
  var out=[], i, j, r, any;
  for(i=0;i<rows.length;i++){
    r=[]; any=false;
    for(j=0;j<rows[i].length;j++){
      r.push(String(rows[i][j]).trim());
      if(r[j]) any=true;
    }
    if(any) out.push(r);
  }
  return out;
}

/* ---- backslash-coded (SIL Toolbox, FLEx, Lexique Pro) ------------------- */
/* A record begins at \lx and runs to the next one. A marker repeated inside
   one record -- two \ge lines, which is how that format writes two senses --
   joins with the same separator the app uses between meanings. */
function impMDF(src){
  var lines=String(src||'').replace(/^﻿/, '').split(/\r?\n/);
  var recs=[], cur=null, order=[], seen={}, i, m, k, v;
  for(i=0;i<lines.length;i++){
    m=/^\\([a-zA-Z_]+)[ \t]*(.*)$/.exec(lines[i]);
    if(!m) continue;
    k=m[1].toLowerCase(); v=String(m[2]).trim();
    if(k==='lx'){ if(cur) recs.push(cur); cur={}; }
    if(!cur) cur={};
    if(!seen[k]){ seen[k]=1; order.push(k); }
    cur[k]=cur[k]? cur[k]+' / '+v : v;
  }
  if(cur) recs.push(cur);
  return {head:order, rows:recs.map(function(r){
    return order.map(function(k){ return r[k]||''; });
  })};
}

/* ---- an array of objects ------------------------------------------------ */
function impJSON(src){
  var d=null, arr, keys=[], seen={}, i, k;
  try{ d=JSON.parse(src); }catch(e){ return null; }
  arr=(d && d.length!==undefined)? d : impFirstArray(d);
  if(!arr || !arr.length) return null;
  for(i=0;i<arr.length;i++){
    if(!arr[i] || typeof arr[i]!=='object' || arr[i].length!==undefined) return null;
    for(k in arr[i]) if(arr[i].hasOwnProperty(k) && !seen[k]){ seen[k]=1; keys.push(k); }
  }
  return {head:keys, rows:arr.map(function(o){
    return keys.map(function(k){ return impFlat(o[k]); });
  })};
}
/* Exports wrap the list in something: {words:[...]}, {lexicon:[...]}. Take
   the first array of objects rather than insisting on the name of it. */
function impFirstArray(d){
  var k, v;
  if(!d || typeof d!=='object') return null;
  for(k in d) if(d.hasOwnProperty(k)){
    v=d[k];
    if(v && v.length!==undefined && v.length && typeof v[0]==='object') return v;
  }
  return null;
}
function impFlat(v){
  if(v===null || v===undefined) return '';
  if(typeof v==='object'){
    if(v.length!==undefined) return v.map(impFlat).join(' / ');
    return '';
  }
  return String(v);
}

/* ---- one thing per line ------------------------------------------------- */
/* "kano - mountain", "kano: mountain", "kano   mountain", or a bare list of
   meanings with no word beside them yet, which is the commonest thing anyone
   actually has: a Swadesh list, the two hundred words a story needs. */
function impLines(src){
  var lines=String(src||'').replace(/^﻿/, '').split(/\r?\n/);
  var rows=[], i, ln, m;
  for(i=0;i<lines.length;i++){
    ln=lines[i].trim();
    if(!ln) continue;
    m=/^(.+?)[ \t]*[-—–=:][ \t]+(.+)$/.exec(ln);
    if(!m) m=/^(\S+)[ \t]{2,}(.+)$/.exec(ln);
    rows.push(m? [m[1].trim(), m[2].trim()] : [ln]);
  }
  return {head:null, rows:rows};
}

/* ---- the one way in ----------------------------------------------------- */
function impRead(src){
  var sh=impShape(src), r, rows, head=null;
  if(sh==='json'){
    r=impJSON(src);
    if(r){ r.shape='json'; return r; }
    sh=/[\t,;|]/.test(String(src||''))? 'table' : 'lines';
  }
  if(sh==='mdf'){ r=impMDF(src); r.shape='mdf'; return r; }
  if(sh==='table'){
    rows=impCells(src, impDelim(src));
    if(rows.length && impIsHead(rows[0])){ head=rows[0]; rows=rows.slice(1); }
    return {shape:'table', head:head, rows:rows};
  }
  r=impLines(src); r.shape='lines'; return r;
}

/* ---- what a column is --------------------------------------------------- */
/* What a column can be. `skip` is a column the app has no use for -- a date,
   an id, an etymology note -- and saying so is a decision the person makes,
   not something guessed away silently.

   `ch` is what makes a row a letter rather than a word. Somebody keeping
   their alphabet in a spreadsheet has a table of character, sound and name,
   and it is the same act of importing as a list of words -- so it is the same
   screen and the same table, and what comes out is decided by what is in the
   file rather than by which button was pressed to open it. */
var IMP_ROLES=['hw', 'mn', 'pos', 'ph', 'ex', 'exg', 'reg', 'tags', 'ety',
               'nt', 'sub', 'ch', 'nm', 'skip'];
/* The ones a column may be more than once. Two meaning columns join, and a
   spreadsheet with 例文1 and 例文2 in it has two examples on the row rather
   than one column too many. Everything else is one to a row: a second
   spelling, a second part of speech, a second etymology are all the same
   mistake, and skipping the later one says so on the screen. */
var IMP_MANY={mn:1, ex:1, exg:1};
/* Names seen in the wild. Not a table of services: a table of words, so that
   a service that renames its columns tomorrow still lands, and one nobody
   here has heard of lands the first time. */
var IMP_NAME={
  hw:  ['word','words','headword','head word','lexeme','lex','entry','term',
        'spelling','conlang','conword','native','local word','form','lx','item',
        'orthography','romanization','romanisation'],
  mn:  ['meaning','meanings','definition','definitions','gloss','glosses',
        'translation','english','sense','senses','def','ge','gl','de','means'],
  pos: ['pos','part of speech','partofspeech','word class','class','type',
        'category','ps','wordtype','grammar'],
  ph:  ['ipa','pronunciation','phonetic','phonetics','phonemic','phonology',
        'sounds','sound','phonemes','transcription','ph','pron','say','value'],
  ex:  ['example','examples','example sentence','example sentences','sentence',
        'sentences','usage','usage example','sample sentence','xv','ex'],
  exg: ['example meaning','example gloss','example translation','xe','xg',
        'sentence meaning','sentence gloss','gloss of example',
        'translation of example'],
  reg: ['register','style','formality','reg','ur','tone'],
  tags:['tag','tags','field','fields','domain','domains','topic','topics',
        'semantic field','semantic domain','keywords','sd'],
  ety: ['etymology','etym','ety','origin','derivation','root','derived from'],
  nt:  ['note','notes','comment','comments','remark','remarks','memo','nt',
        'annotation'],
  sub: ['subclass','sub class','subcategory','sub category','subtype',
        'sub type','subpos','sub'],
  ch:  ['character','char','glyph','letter','letters','symbol','sign','sigil',
        'grapheme','graph','ch','rune','sc'],
  nm:  ['name','letter name','called','nm','label','title']
};
/* WHAT THIS APP ITSELF CALLS EACH OF THEM, in one place, because two things
   need it and they must not drift: the row on the mapping screen is labelled
   with it, and impNames() reads it in all ten languages so that a person
   whose spreadsheet is headed 「つづり」, 「品詞」 or 「例文」 is understood
   without anybody typing those words into this file.

   Most of them are the word the dictionary already uses -- a column called an
   example is what the word sheet calls an example. Four have no home outside
   this screen and keep their own key. */
var IMP_LABEL={hw:'f.spelling', mn:'f.meaning', pos:'f.pos', ph:'imp.role.ph',
               ex:'word.ex', exg:'imp.role.exg', reg:'word.reg',
               tags:'word.tags', ety:'word.ety', nt:'word.note', sub:'f.sub',
               ch:'imp.role.ch', nm:'imp.role.nm', skip:'imp.role.skip'};
/* And the other names the app has for the same thing, where it has two. An
   example's meaning is 「意味」 on the word sheet, where the example is right
   over the box and nothing else on that screen is a meaning; on a list of
   thirteen roles it would be the second 「意味」 in the list, so this screen
   calls it what it is and matches the sheet's word as well. */
var IMP_KEY={mn:['word.means'], exg:['word.ex.gl.ph'],
             ch:['lt.title','toc.letters'], nm:['lt.name']};
function impKeys(role){
  return (IMP_LABEL[role]? [IMP_LABEL[role]] : []).concat(IMP_KEY[role]||[]);
}
function impNames(role){
  var out=IMP_NAME[role].slice(), keys=impKeys(role), i, j, L, v;
  if(typeof LANG==='undefined' || typeof UI_LANGS==='undefined') return out;
  for(i=0;i<UI_LANGS.length;i++){
    L=LANG[UI_LANGS[i]];
    if(!L || !L.str) continue;
    for(j=0;j<keys.length;j++){
      v=L.str[keys[j]];
      if(v) out.push(String(v).toLowerCase());
    }
  }
  return out;
}
/* A header cell's role, or '' when the name says nothing. */
function impRoleOf(name){
  var v=String(name||'').trim().toLowerCase().replace(/[_\-\.]+/g, ' ').replace(/\s+/g, ' ');
  var r, i, list;
  if(!v) return '';
  for(r=0;r<IMP_ROLES.length;r++){
    if(!IMP_NAME[IMP_ROLES[r]]) continue;
    list=impNames(IMP_ROLES[r]);
    for(i=0;i<list.length;i++) if(list[i]===v) return IMP_ROLES[r];
  }
  return '';
}
function impIsHead(row){
  var i;
  for(i=0;i<row.length;i++) if(impRoleOf(row[i])) return true;
  return false;
}

/* ---- what is actually in a column --------------------------------------- */
/* Where the heading says nothing -- and a spreadsheet somebody keeps for
   themselves usually has no heading at all -- the column is read instead. */
function impCol(rows, i, n){
  var out=[], j;
  for(j=0;j<rows.length && out.length<(n||40);j++)
    if(rows[j][i]) out.push(String(rows[j][i]));
  return out;
}
var IMP_POSISH=['n','v','adj','adv','pro','num','part','conj','intj','aff','nm','x',
                'n.','v.','adj.','adv.','noun','verb','adjective','adverb','pronoun',
                'numeral','particle','conjunction','interjection','affix','name',
                'preposition','prep','prep.','determiner','det','vt','vi','vt.','vi.'];
function impLooksPos(col){
  var seen={}, n=0, hits=0, i, v;
  if(!col.length) return false;
  for(i=0;i<col.length;i++){
    v=col[i].trim().toLowerCase();
    if(v.length>16) return false;
    if(!seen[v]){ seen[v]=1; n++; }
    if(IMP_POSISH.indexOf(v)>=0 || impPosLabel(v)) hits++;
  }
  return n<=14 && hits>=col.length*0.6;
}
/* 名詞 and Sustantivo are what this app calls a part of speech in two of its
   ten languages, and it already has both. */
function impPosLabel(v){
  var L, p;
  if(typeof LANG==='undefined') return false;
  for(L in LANG) if(LANG.hasOwnProperty(L) && LANG[L].pos){
    for(p in LANG[L].pos) if(LANG[L].pos.hasOwnProperty(p))
      if(String(LANG[L].pos[p]).toLowerCase()===v) return true;
  }
  return false;
}
/* Slashes, square brackets, or letters that only a phonetic alphabet has. */
function impLooksPh(col){
  var i, v, hits=0;
  if(!col.length) return false;
  for(i=0;i<col.length;i++){
    v=col[i];
    if(/^[\/\[].*[\/\]]$/.test(v.trim())) { hits++; continue; }
    if(/[ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃ]/.test(v)) hits++;
  }
  return hits>=col.length*0.5;
}
/* A character is one or two of them, and mostly not a plain roman letter --
   a column of single a-z would be a spelling, and this has to stay off it. */
function impLooksChar(col){
  var i, odd=0;
  if(!col.length) return false;
  for(i=0;i<col.length;i++){
    if(col[i].length>2) return false;
    if(!/^[A-Za-z0-9]+$/.test(col[i])) odd++;
  }
  return odd>=col.length*0.5;
}
/* A word is short and mostly unbroken; a meaning has spaces in it or is long. */
function impLooksWord(col){
  var i, spaced=0, long=0;
  if(!col.length) return false;
  for(i=0;i<col.length;i++){
    if(/\s/.test(col[i])) spaced++;
    if(col[i].length>24) long++;
  }
  return spaced<=col.length*0.25 && long<=col.length*0.1;
}

/* ---- the guess ---------------------------------------------------------- */
/* Names first, because a heading that says "Pronunciation" is not a guess.
   Then the shape of what is in the column, for the ones left over. One
   spelling, one part of speech, one pronunciation; anything else that reads
   like words is a meaning, and several meaning columns join. */
function impGuess(read){
  var head=read.head, rows=read.rows||[], wide=impWidth(rows);
  var roles=[], taken={}, i, r, col;
  for(i=0;i<wide;i++){
    r=head? impRoleOf(head[i]) : '';
    if(r && !IMP_MANY[r] && taken[r]) r='';
    if(r){ taken[r]=1; }
    roles.push(r);
  }
  for(i=0;i<wide;i++){
    if(roles[i]) continue;
    col=impCol(rows, i);
    if(!taken.pos && impLooksPos(col)){ roles[i]='pos'; taken.pos=1; continue; }
    if(!taken.ch && impLooksChar(col)){ roles[i]='ch'; taken.ch=1; continue; }
    if(!taken.ph && impLooksPh(col)){ roles[i]='ph'; taken.ph=1; continue; }
    /* Once one column is characters the table is an alphabet, and an alphabet
       has no word spellings in it: what sits beside a character is what it
       reads, and after that what it is called. */
    if(taken.ch && !taken.ph){ roles[i]='ph'; taken.ph=1; continue; }
    if(taken.ch && !taken.nm){ roles[i]='nm'; taken.nm=1; continue; }
    if(!taken.hw && impLooksWord(col)){ roles[i]='hw'; taken.hw=1; continue; }
    roles[i]='';
  }
  for(i=0;i<wide;i++){
    if(roles[i]) continue;
    if(taken.mn){ roles[i]='skip'; }
    else { roles[i]='mn'; taken.mn=1; }
  }
  /* One column and nothing called a meaning: it is a list of meanings to coin
     words for, which is the commonest thing anybody has lying around -- a
     Swadesh list, the two hundred words a story needs. */
  if(wide===1 && !taken.mn) roles[0]='mn';
  return roles;
}
function impWidth(rows){
  var w=0, i;
  for(i=0;i<rows.length;i++) if(rows[i].length>w) w=rows[i].length;
  return w;
}

/* ---- rows the app can use ----------------------------------------------- */
/* One record per row: the spelling, the meanings joined, the part of speech
   as this app's own key, and the sounds if the file carried them. */
function impRows(read, roles, snd){
  var rows=read.rows||[], out=[], i, j, rec, r, v;
  for(i=0;i<rows.length;i++){
    rec={hw:'', mn:'', pos:'', ph:[], phRaw:'', ch:'', nm:'',
         ex:[], exg:[], reg:'', tags:[], ety:'', nt:'', sub:''};
    for(j=0;j<roles.length;j++){
      r=roles[j]; v=String(rows[i][j]||'').trim();
      if(!r || r==='skip' || !v) continue;
      if(r==='hw' && !rec.hw) rec.hw=v;
      else if(r==='mn') rec.mn = rec.mn? rec.mn+' / '+v : v;
      else if(r==='pos' && !rec.pos) rec.pos=v;
      else if(r==='ph' && !rec.ph.length){ rec.ph=impPh(v, snd); rec.phRaw=impClean(v); }
      else if(r==='ex') rec.ex.push(v);
      else if(r==='exg') rec.exg.push(v);
      else if(r==='reg' && !rec.reg) rec.reg=v;
      else if(r==='tags') rec.tags=impJoinList(rec.tags, v);
      else if(r==='ety' && !rec.ety) rec.ety=v;
      else if(r==='nt' && !rec.nt) rec.nt=v;
      else if(r==='sub' && !rec.sub) rec.sub=v;
      else if(r==='ch' && !rec.ch) rec.ch=v;
      else if(r==='nm' && !rec.nm) rec.nm=v;
    }
    if(rec.hw || rec.mn || rec.ch) out.push(rec);
  }
  return out;
}
/* Several things in one cell. Fields are written 「料理; 天文」 or with commas
   in a file that is not comma-separated, and a list somebody keeps by hand
   has the same thing twice in it as often as not. */
function impJoinList(have, v){
  var parts=String(v||'').split(/[;,、，]/), out=have.slice(), i, s;
  for(i=0;i<parts.length;i++){
    s=parts[i].trim();
    if(s && out.indexOf(s)<0) out.push(s);
  }
  return out;
}
/* The examples of one row, each with its translation beside it. Two columns
   of examples and two of their meanings pair off in the order they stand in,
   which is how a spreadsheet with 例文1 例文1の意味 例文2 例文2の意味 is
   written. A translation with no sentence over it is not an example and is
   dropped -- an empty line with a meaning under it is nothing anybody can
   read. */
function impExs(rec){
  var out=[], i;
  for(i=0;i<rec.ex.length;i++) out.push({ln:rec.ex[i], gl:rec.exg[i]||''});
  return out;
}
/* Meanings arrive joined, because a file can hold several in one cell and
   several cells can each hold one. The app keeps them apart, and a semicolon
   is what a person writes between two of them. */
function impSenses(mn){
  return String(mn||'').split(/\s*[;\/；]\s*/).filter(function(x){ return !!x.trim(); });
}
/* The sounds a file gives, read as sounds rather than guessed from letters.
   "k a n o" is already cut. "/kaˈno/" is one string and comes apart against
   the sounds there are, longest first. Stress and syllable marks are not
   sounds and go.

   `snd` is the language's own inventory and matters more than the chart:
   tʃ is not one symbol in the phonetic alphabet -- it is two, and it is one
   sound only because somebody's language says so. Without it, "tʃa" is three
   sounds, which is the honest answer for a language that has no tʃ. */
function impPh(v, snd){
  var s=impClean(v);
  if(!s) return [];
  if(/\s/.test(s)) return s.split(/\s+/);
  return impCut(s, snd);
}
/* Slashes, brackets, stress and syllable marks are not sounds. One place,
   because the letter side wants the same string cleaned the same way. */
function impClean(v){
  return String(v||'').trim()
    .replace(/^[\/\[]+/, '').replace(/[\/\]]+$/, '').replace(/[ˈˌ.]/g, '').trim();
}
function impCut(s, snd){
  return longCut(s, (snd||[]).concat((typeof ipaAll==='function')? ipaAll() : []));
}

/* ---- which side of the language a file is -------------------------------
   A file goes into the dictionary or into the alphabet, and the person says
   which. 「文字に入れるか単語に入れるかきめさせたら？」

   It used to be decided per ROW: a row carrying a character was a letter and
   every other row was a word, so one file could quietly be both. That is a
   guess about what somebody's file IS, made from what the columns look like,
   and it is the one guess in this whole reader that cannot be seen being
   wrong -- a dictionary of one- and two-letter words reads as an alphabet,
   and nothing on the screen says the words went somewhere else.

   So the side is chosen first, and the column roles are only the ones that
   side has. Nothing goes into both. The guess still runs and still picks the
   side, but now it picks a thing that is sitting there being switchable.

   It is ABOVE the line with the rest of the guess, because it is part of it:
   what the guess ANSWERS is these roles read as one side, and a check that
   asked impGuess() alone would be asking a question the app never asks.
   Nothing here touches a global or the document; impSetInto(), which does,
   is below. */
var IMP_SIDE={w:['hw','mn','pos','ph','ex','exg','reg','tags','ety','nt','sub','skip'],
              l:['ch','ph','nm','skip']};
function impRolesFor(into){ return IMP_SIDE[into] || IMP_SIDE.w; }
/* Which side the guess landed on: a column called a character means the file
   is an alphabet, because nothing else in a word list is one. */
function impInto(roles){ return roles.indexOf('ch')>=0 ? 'l' : 'w'; }
/* The same guess, read as the other side. A spelling and a character are the
   same column asked a different question, and so are a meaning and a name;
   a part of speech has no answer on the letter side and is dropped rather
   than turned into something it is not. Only `mn` may repeat -- a second
   spelling or a second character is one column too many, so it is skipped. */
function impMove(roles, into){
  var swap = into==='l' ? {hw:'ch', mn:'nm', pos:'skip'} : {ch:'hw', nm:'mn'};
  var ok=impRolesFor(into), out=[], seen={}, i, r;
  for(i=0;i<roles.length;i++){
    r=swap[roles[i]] || roles[i];
    if(ok.indexOf(r)<0) r='skip';
    if(r!=='skip' && !IMP_MANY[r] && seen[r]) r='skip';
    if(r!=='skip') seen[r]=1;
    out.push(r);
  }
  return out;
}

/* ==== below this line the app begins ==== */
/* Everything above touches no global and no document, and must not start:
   tools/import-check.mjs runs that half directly in Node, over one sample per
   format, which is the only thing holding "we can read anybody's file"
   upright. Everything below is the app -- the screen, the plan, the
   dictionary -- and press.mjs walks it like any other screen.
   ========================================================================= */

/* ---- where you are in it ------------------------------------------------
   Cleared by viewReset() in www/shell.js, which is the one place a screen
   forgets, because arriving at somebody else's language holding half of a
   spreadsheet you were reading into your own is the worst kind of bug.

   `step` is which of the four screens you are standing on, and it is the ONE
   thing that decides -- it used to be read off what happened to be filled in
   (`IMP.done` then `IMP.read`), so the screen was a conclusion drawn from the
   state rather than a place, and there was nowhere for a screen that has read
   nothing yet to differ from a screen that is about to. */
var IMP=impBlank();
function impBlank(){ return {step:'get', read:null, roles:[], into:'w', dup:'skip'}; }

/* FOUR SCREENS, ONE THING ON EACH.
   「データの取り込み画面も意味がわからん、特にファイル」 OWNER 2026-09-06.

     get     paste it, or choose a file. Two rows and nothing else.
     paste   the box to paste into -- because choosing is a screen and the
             thing you chose is the screen you arrive at, which is CLAUDE.md's
             third banned shape read the right way round.
     map     the first three rows as they were read, and under them one row
             per column saying what that column is.
     ready   how many words are about to come in, and how many are already
             here. Pressing it imports and puts you on the dictionary. */
/* OPENING IT AND REDRAWING IT ARE TWO ACTS, and one function was both.
   openImport() was the name on the row that opens this (www/home.js
   § fRow(t('set.csv.in'))) AND what every step of it called to draw itself
   again -- so `step` was whatever the last import left behind. Somebody who
   pasted a list once and came back a week later was put straight on the
   paste box, past the screen that asks whether it is a paste or a file.
   「取り込みが貼り付け画面に直行する」

   It is not a condition added to the old function: what it was asked was
   wrong, so what it asks is rewritten. The door starts an import, impPaint()
   draws the one that is running, and no press has to remember which it
   meant.

   FORM_OPEN is how a form is rebuilt when nothing holds it any more -- the
   back button onto a route with no FORM behind it -- so that is an arrival
   too, and it starts one the same way. impStep() and impAgain() go through
   impPaint(), because they ARE the running import. */
function openImport(){ IMP=impBlank(); impPaint(); }
function impPaint(){ openForm('csv:', t('csv.title'), impHTML(), impMount); }
FORM_OPEN.csv=function(){ openImport(); };
function impHTML(){
  if(IMP.step==='ready') return impReadyHTML();
  if(IMP.step==='map') return impMapHTML();
  if(IMP.step==='paste') return impPasteHTML();
  return impGetHTML();
}
/* Rebuilding it rather than patching a piece: choosing what a column is
   changes the counts underneath it and can change the buttons, and a screen
   that redraws two of its three parts is where the third goes stale. */
function impAgain(){ IMP=impBlank(); impPaint(); }
function impStep(v){ IMP.step=v; impPaint(); }

/* ---- 1. getting it in ---------------------------------------------------
   Two rows. It used to be the box, the file button and 「次へ」 all on one
   screen, so the commonest way in -- a file -- was the middle of three things
   under a box most people have nothing to put in. */
function impGetHTML(){
  return '<button class="set"' + DO('impStep', ["paste"]) + '>'+
      '<span class="sl">'+esc(t('imp.paste'))+'</span></button>'+
    impFileHTML();
}
/* And the box, on its own screen, with the one thing to do next under it. */
function impPasteHTML(){
  return '<div class="field"><textarea id="f-csv" placeholder="'+esc(t('csv.ph'))+'"></textarea></div>'+
    '<button class="btn ghost" style="width:100%;margin-top:12px"' + DO('impScan') + '>'+
      esc(t('imp.next'))+'</button>';
}
/* A file rather than a paste. Pasting is fine for forty words and impossible
   for four thousand, which is the size of list this is for -- so this is
   where the paid plan starts, and the free one still gets the paste.

   `.btn.ghost` and not a box. 「これも角丸だし」OWNER 2026-08-27. It was a
   filled panel with a hairline round it and a corner on it -- the shape
   CLAUDE.md's fifth rule is about -- and the comment over `.shfile` in
   index.html has named this button as the one still wearing it since the
   sheet's own file control was moved off it. `.impfile` is the shape of this
   control on BOTH plans -- block, the width of the screen, its words in the
   middle -- and, on the paid one, what lays the native control over those
   words: a file input cannot be styled and a hidden one cannot be pressed.
   Only the second half is the paid face's, which is what `.impfile input`
   says in index.html. */
function impFileHTML(){
  /* THE SAME BUTTON ON EVERY PLAN, WITH THE SAME WORDS ON IT.
     「できないことは、有料と同じ画面に同じ形で出す。押したら有料へ」 OWNER
     2026-09-04. The free plan used to get `up.cta` welded onto the end of the
     button's own words with nothing between them, so 「ファイルを選ぶ」 and
     「アップグレード」 ran together into one unreadable word -- a button whose
     text a person cannot read is worse than one they cannot press. What the
     tail was for is said by the press, and what the press says is the pop:
     「ポップだって。その古いのは消して」 OWNER 2026-09-05. It used to jump to
     the price list -- 「扉は押したら飛ぶ」 (OWNER 2026-09-03) -- and the flight
     is now the "yes" inside upStop() (www/core.js) rather than the press
     itself, which is the same sentence shInFileHTML() in www/sheet.js is
     written under. */
  if(!can('file'))
    return '<button class="set impfile"' + DO('upFile') + '>'+
      '<span class="sl">'+esc(t('imp.file'))+'</span></button>';
  return '<label class="set impfile"><span class="sl">'+esc(t('imp.file'))+'</span>'+
    '<input type="file" id="f-file" accept=".csv,.tsv,.tab,.txt,.json,.db,.dic,.lex"></label>';
}
/* The file input is the one control in the app that cannot go through the
   action tables: they hand a listener the element's value, and a file input's
   value is a made-up path -- what is wanted is the file itself. So it is
   bound here, the way the drawing canvas is, when the screen is built. */
function impMount(){
  var e=document.getElementById('f-file');
  if(!e || e.getAttribute('data-wired')) return;
  e.setAttribute('data-wired', '1');
  e.addEventListener('change', function(){
    var f=e.files && e.files[0];
    if(!f) return;
    var r=new FileReader();
    r.onload=function(){ impTake(String(r.result||'')); };
    r.readAsText(f);
  }, false);
}
function impScan(){
  var e=document.getElementById('f-csv');
  impTake(e? e.value : '');
}
/* Whatever came in -- typed, pasted or read off a file -- goes through the
   same door. */
function impTake(src){
  var r=impRead(src);
  if(!r.rows.length){ toast(t('imp.empty')); return; }
  IMP.read=r; IMP.roles=impGuess(r); IMP.into=impInto(IMP.roles);
  /* The guess may have named a role the chosen side does not have -- it is
     read whole, then read as one side. */
  IMP.roles=impMove(IMP.roles, IMP.into);
  IMP.step='map';
  impPaint();
}

function impSetInto(v){
  if(v!==IMP.into){ IMP.roles=impMove(IMP.roles, v); IMP.into=v; }
  impPaint();
}

/* ---- 2. what each column is --------------------------------------------
   The first three rows exactly as they were read -- enough to recognise your
   own spreadsheet, few enough to fit on a phone -- and under them one ROW per
   column saying what that column is.

   It was one row of dropdowns across the head of that table, which scrolled
   sideways: with six roles the last column was already off the edge of the
   screen, and with thirteen the sheet would have to be dragged twice to reach
   the note. 「横スクロールのチップは禁止（一覧は縦の行）」 A list is a list of
   rows going down, so the columns are a list and the table is a picture of
   the file beside it.

   A column with no heading over it is still a column: it is called by its
   place in the row, which is what a spreadsheet with no headings gives you to
   go on. */
function impMapHTML(){
  var rows=IMP.read.rows, head=IMP.read.head, n=Math.min(3, rows.length);
  var side=impRolesFor(IMP.into), wide=IMP.roles.length, i, j, out='';
  out+='<div class="sec">'+t('imp.into')+'</div>'+
    '<div class="segs" style="margin-bottom:12px">'+
      '<button class="seg'+(IMP.into==='w'? ' on':'')+'"' + DO('impSetInto', ["w"]) + '>'+
        esc(t('toc.words'))+'</button>'+
      '<button class="seg'+(IMP.into==='l'? ' on':'')+'"' + DO('impSetInto', ["l"]) + '>'+
        esc(t('toc.letters'))+'</button></div>';
  out+='<div class="imptab"><table>';
  if(head){
    out+='<tr>';
    for(j=0;j<wide;j++) out+='<th>'+esc(head[j]||'')+'</th>';
    out+='</tr>';
  }
  for(i=0;i<n;i++){
    out+='<tr>';
    for(j=0;j<wide;j++) out+='<td>'+esc(rows[i][j]||'')+'</td>';
    out+='</tr>';
  }
  out+='</table></div>';
  for(j=0;j<wide;j++) out+=impColRow(j, side);
  out+='<button class="btn ghost" style="width:100%;margin-top:14px"' + DO('impStep', ["ready"]) + '>'+
      esc(t('imp.next'))+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('impAgain') + '>'+
      '<span class="sl">'+esc(t('imp.again'))+'</span></button>';
  return out;
}
/* One column, one row. The name on the left is the heading the file gave it,
   or which column it is when the file gave none, and it is the select's
   aria-label as well -- a row whose only words are on the left of it says
   nothing to anybody not looking at the screen. */
function impColRow(j, side){
  var nm=impColName(j);
  return '<div class="set"><span class="sl">'+esc(nm)+'</span>'+
    '<span class="sv"><select' + CH('impSetRole', [j]) + ' aria-label="'+esc(nm)+'">'+
      side.map(function(r){
        return '<option value="'+r+'"'+(IMP.roles[j]===r? ' selected':'')+'>'+
          esc(t(IMP_LABEL[r]))+'</option>';
      }).join('')+'</select></span></div>';
}
function impColName(j){
  var head=IMP.read && IMP.read.head;
  return (head && head[j])? String(head[j]) : t('imp.col', j+1);
}
function impSetRole(j, v){ IMP.roles[j]=v; impPaint(); }
function impSetDup(v){ IMP.dup=v; impPaint(); }

/* ---- 3. what is about to happen ----------------------------------------
   One line saying how many are coming in, and how many of them the language
   already has. Every number here was on the screen AFTER the import and is
   said before it instead, which is the same information asked at the moment
   somebody can still do something about it. */
function impReadyHTML(){
  var p=impPlan(), n=impGoN(p);
  return '<div class="impsum">'+
      (p.add?  '<span><b>'+p.add+'</b>'+esc(t('imp.new'))+'</span>' : '')+
      (p.ltr?  '<span><b>'+p.ltr+'</b>'+esc(t('imp.ltr'))+'</span>' : '')+
      (p.coin? '<span><b>'+p.coin+'</b>'+esc(t('imp.coin'))+'</span>' : '')+
      '</div>'+
    /* The choice only exists when there is something to choose about -- and it
       sits ON the count it is about. Two words floating under a table say
       nothing: 「飛ばすってなんの話？」 They are about the words that are
       already here, so they are beside the number of them. */
    (p.have?
      '<div class="impdup"><span class="impn"><b>'+p.have+'</b>'+esc(t('imp.have'))+'</span>'+
      '<div class="segs">'+
      '<button class="seg'+(IMP.dup==='skip'? ' on':'')+'"' + DO('impSetDup', ["skip"]) + '>'+
        esc(t('imp.skip'))+'</button>'+
      '<button class="seg'+(IMP.dup==='over'? ' on':'')+'"' + DO('impSetDup', ["over"]) + '>'+
        esc(t('imp.over'))+'</button></div></div>' : '')+
    /* How many will come in without a reading. It is not a failure and they
       are not missing -- they will be in the dictionary and can be given a
       reading one at a time. It is said because the alternative was saying
       nothing, and saying nothing is what made a list arrive as nothing at
       all. */
    (p.mute? '<div class="note">'+esc(tn('imp.mute', p.mute))+'</div>' : '')+
    '<button class="btn ghost" style="width:100%;margin-top:14px"' + DO('doImport') + '>'+
      esc(t(IMP.into==='l'? 'imp.golt' : 'imp.go', n))+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('impAgain') + '>'+
      '<span class="sl">'+esc(t('imp.again'))+'</span></button>';
}
/* What pressing it would do, said before it is pressed. It follows the side
   that was chosen and not what the rows look like, which is the whole point
   of choosing: the counts on this screen are what will happen. */
function impPlan(){
  var rows=impRows(IMP.read, IMP.roles, addedSnd());
  var p={add:0, ltr:0, coin:0, have:0, mute:0}, i, r;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    if(IMP.into==='l'){
      if(!r.ch) continue;
      if(impLtrBy(r.ch)) p.have++; else p.ltr++;
    }
    else if(r.hw){
      if(findWord(r.hw)) p.have++;
      else {
        p.add++;
        /* A word arriving with no reading: the file gave none and the
           spelling gives none either, which is every list not written in
           roman. Asked the same way impPut() asks it. */
        if(!r.ph.length && !phGuess(r.hw).length) p.mute++;
      }
    }
    else if(r.mn) p.coin++;
  }
  return p;
}
/* The number on the button, which is what will actually be written: the ones
   already here are among them only if they are to be overwritten. */
function impGoN(p){
  return (IMP.into==='l'? p.ltr : p.add+p.coin) + (IMP.dup==='over'? p.have : 0);
}
/* The letter wearing this character, if there is one. A borrowed character is
   a letter's shape, and two letters cannot wear the same one. */
function impLtrBy(ch){
  var i;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].ch===String(ch)) return LETTERS[i];
  return null;
}
/* What a letter reads, by the same rule the letter screen uses: roman letters
   are a SPELLING of a sound and go through the chart, so "sh" is ʃ and not s
   followed by h; anything else is already the sound. */
function impLtrSnd(r){
  var words=String(r.phRaw||'').split(/\s+/), out=[], i, w, u;
  for(i=0;i<words.length;i++){
    w=impClean(words[i]);
    if(!w) continue;
    if(/^[A-Za-z]+$/.test(w)){ u=ipaFromRoman(w); if(u) out.push(u.join('')); }
    else out.push(w);
  }
  return out;
}
/* A letter that reads a sound the language does not have is a letter for
   nothing, so the sounds come in with it -- the same thing ltSetRoman does
   when somebody types a reading in by hand. */
function impGrow(units){
  var have=addedSnd().slice(), all=ipaAll(), grew=false, i, j, parts;
  for(i=0;i<units.length;i++){
    parts=impCut(units[i], have);
    for(j=0;j<parts.length;j++)
      if(all.indexOf(parts[j])>=0 && have.indexOf(parts[j])<0){ have.push(parts[j]); grew=true; }
  }
  if(grew){ SND=asOrder(have); saveSnd(); }
}

/* ---- doing it ----------------------------------------------------------- */
function doImport(){ impPut(impRows(IMP.read, IMP.roles, addedSnd())); }
/* THE REST OF WHAT A ROW CARRIED, written onto the word. The shape is the
   word sheet's own -- wdPutExtras() in www/wordsheet.js writes exactly these
   keys off wEdit -- because a word that arrives here has to be a word that
   sheet can open, and a key spelled differently on this road would be a
   second answer to what a word is made of.

   Nothing is DELETED: a column the file does not have says nothing about a
   word that is already in the dictionary, and an overwrite that emptied the
   note somebody wrote here would be the file winning over their own work.
   Examples are ADDED beside the ones already there rather than replacing
   them, for the same reason -- they are separate things, not one field.

   One place, for the new word and the overwritten one alike. */
function impPutRow(w, r){
  var ex=impExs(r), reg=impRegKey(r.reg), i;
  if(r.sub) w.sub=String(r.sub).trim();
  if(reg) w.reg=reg;
  if(r.ety) w.ety=String(r.ety).trim();
  if(r.nt) w.nt=String(r.nt).trim();
  if(r.tags.length) w.tags=r.tags.slice();
  for(i=0;i<ex.length;i++){
    if(!w.ex) w.ex=[];
    if(!impHasEx(w.ex, ex[i])) w.ex.push(ex[i]);
  }
}
function impHasEx(list, e){
  var i;
  for(i=0;i<list.length;i++) if(list[i].ln===e.ln) return true;
  return false;
}
/* A register is one of the four the app knows and not free text -- the sheet
   offers those and nothing else can be chosen on it -- so a column saying
   「口語」, "Spoken" or "sp" arrives as `sp`, and one saying anything else
   arrives as nothing rather than as a fifth register nobody can pick again.
   The same shape posKey() has, and for the same reason. */
function impRegKey(v){
  var l=String(v||'').trim().toLowerCase(), k='', i;
  if(!l) return '';
  for(i=0;i<REG.length;i++) if(REG[i]===l) return REG[i];
  Object.keys(LANG).forEach(function(L){
    var str=LANG[L] && LANG[L].str, j;
    if(!str) return;
    for(j=0;j<REG.length;j++)
      if(!k && String(str['word.reg.'+REG[j]]||'').toLowerCase()===l) k=REG[j];
  });
  return k;
}
/* Every row, as a word.

   A row that brought a spelling keeps it, and keeps the sounds the file gave
   it. Only a row with no sounds falls back to guessing them off the letters,
   which is all that can be done and is wrong for anything not written in
   roman -- and it used to be what happened to every row.

   A row that brought only a meaning gets a word coined out of this language's
   own sounds, which is the commonest thing anybody imports: a list of what
   the words are for, with no words yet. */
function impPut(rows){
  var added=0, was=0, lts=0, wasL=0, full=false, i, r, seq, hw, w, l, u, guard, v, d;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    /* A letter, not a word -- because the person said the file is an
       alphabet, not because this row happens to look like one. It costs no
       room on the free plan: the ceiling is on the dictionary, and an
       alphabet is not one. */
    if(IMP.into==='l'){
      if(!r.ch) continue;
      u=impLtrSnd(r);
      /* A ROW WHOSE NAME IS A NUMBER IS A DIGIT, and it was becoming a letter
         called `1` on the alphabet. 「まだ1でここ入るけど？ pdfで取り込んだ時
         もちゃんと分けてくれよ」 OWNER 2026-09-01. The sheet has read it this
         way since 「数字と記号はそれぞれのページあるんだからちゃんと振り分け
         られるようにして」 -- shTakeIn() in www/sheet.js -- and this road, the
         one a file comes in on, never asked. The three answers are the sheet's
         three and for the same reasons: nothing holds that value, so this IS
         that digit; the slot is there with nothing on it, so the picture goes
         onto it; it is already somebody's work, so a SECOND digit of that
         value goes in beside it rather than over it. */
      v=numTyped(r.nm || r.ch);
      if(numInBase(v)){
        d=numByVal(v);
        if(!d){ ltNew({val:v, ch:r.ch, snd:u}); lts++; if(u.length) impGrow(u); continue; }
        if(!inkGeo(d) && !d.ch){
          wasL++;
          d.ch=r.ch;
          if(u.length){ impGrow(u); d.snd=u; d.chose=1; }
          saveLetters();
          continue;
        }
        ltNew({val:v, ch:r.ch, snd:u}); lts++; if(u.length) impGrow(u);
        continue;
      }
      l=impLtrBy(r.ch);
      if(l){
        if(IMP.dup!=='over') continue;
        wasL++;
        if(r.nm) l.nm=r.nm;
        /* The list said what this letter reads, so it is an answer and not
           the app's guess: renaming the letter later leaves it alone. */
        if(u.length){ impGrow(u); l.snd=u; l.chose=1; }
      } else {
        if(u.length) impGrow(u);
        ltNew({ch:r.ch, nm:r.nm, snd:u});
        lts++;
      }
      continue;
    }
    if(!capOK(1)){ full=true; break; }
    hw='';
    if(r.hw){
      hw=String(r.hw);
      w=findWord(hw);
      if(w){
        if(IMP.dup!=='over') continue;
        was++;
        if(r.mn){ w.mns=impSenses(r.mn); w.mn=w.mns[0]||r.mn; }
        if(r.pos) w.pos=posKey(r.pos);
        if(r.ph.length) w.ph=r.ph;
        impPutRow(w, r);
        continue;
      }
      /* A word with no sounds is still a word. phGuess() works from the
         roman spelling -- it throws away everything that is not a-z -- so a
         list written in the person's own letters, in kana, or in anything
         with a mark in it came out empty, and the row was DROPPED. Silently:
         no message, no count, nothing to notice except that the dictionary
         was still empty afterwards. 「単語入ってないけど。全く。」

         Sounds are the app's guess at how a spelling is said. Somebody's list
         of words is the thing they came here with. If the guess comes out
         empty the word goes in without one, and how many that will be is
         counted by impPlan() and said on the screen BEFORE the press, rather
         than the number quietly being smaller than the file. */
      seq = r.ph.length? r.ph : phGuess(hw);
    } else {
      if(!r.mn) continue;
      if(!addedSnd().length) continue;
      /* asWord and not makeWord: makeWord copies the shapes the dictionary
         already uses, and a dictionary of one word has one shape, so a list
         of two hundred meanings would get two words out of it. asWord falls
         back to the plainest shape there is, built from the whole inventory,
         which is the only thing that can be done before there is a pattern
         to imitate. */
      seq=null; guard=0;
      while(guard<40){
        guard++;
        seq=asWord('n');
        if(seq && seq.length && !findWord(seq.join(''))) break;
        seq=null;
      }
      if(!seq) continue;
      hw=seq.join('');
    }
    w={hw:hw, ph:seq, mns:impSenses(r.mn), mn:'',
       pos:r.pos? posKey(r.pos) : 'n', at:Date.now()+i};
    w.mn=w.mns[0]||r.mn||'';
    impPutRow(w, r);
    WORDS.push(w);
    added++;
  }
  save();
  if(lts || wasL){ saveLetters(); installScriptFont(); }
  impLand(added+was, lts+wasL, full);
}
/* AND THEN YOU ARE STANDING ON WHAT ARRIVED. 「押したら取り込んで辞書へ戻る」
   OWNER 2026-09-06. There was a screen after this one saying how many came in;
   what it said is now on the screen BEFORE the press, where somebody can still
   change their mind about it, and what is left to do afterwards is to be in
   front of the words.

   Words and letters land in different rooms, and they are counted apart. They
   were one number once, and a file that carried three letters and no words
   said "3 words in" -- so the letters were in the alphabet, correctly, and the
   one sentence the screen said about them named the wrong room.

   The import screen comes OFF the trail first: an import that has already
   happened is not a screen to be put back down on, which is exactly what
   navDrop() is for and what the word sheet does with a word that has been
   deleted. Without it the back arrow from the dictionary led to a blank
   import screen. Then the dictionary, and a paint -- go() draws when it moves
   and is silent when the trail already ended where it was sent, and either
   way the screen still has the form's body on it. */
function impLand(nw, nl, full){
  var lt=IMP.into==='l';
  IMP=impBlank();
  navDrop('csv:');
  go(lt? 'letters' : 'words');
  render();
  /* The list being full is the one thing that did not go as asked, so it is
     what the screen says; otherwise it says what arrived. */
  toast(full? t('csv.full', nw, 0) : t(lt? 'imp.donelt' : 'imp.done', lt? nl : nw));
}
