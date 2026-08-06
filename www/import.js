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
/* Five things a column can be. `skip` is a column the app has no use for --
   a date, an id, an etymology note -- and saying so is a decision the person
   makes, not something guessed away silently. */
var IMP_ROLES=['hw', 'mn', 'pos', 'ph', 'skip'];
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
        'sounds','sound','phonemes','transcription','ph','pron','say']
};
/* The app already knows what it calls these, in ten languages, and that is
   where those names live. Reading them off here means a person whose
   spreadsheet is headed 「つづり」 or 「品詞」 is understood without anybody
   typing those words into this file. */
var IMP_KEY={hw:['f.spelling'], mn:['f.meaning','word.means'], pos:['f.pos']};
function impNames(role){
  var out=IMP_NAME[role].slice(), keys=IMP_KEY[role]||[], i, j, L, v;
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
    if(r && r!=='mn' && taken[r]) r='';
    if(r){ taken[r]=1; }
    roles.push(r);
  }
  for(i=0;i<wide;i++){
    if(roles[i]) continue;
    col=impCol(rows, i);
    if(!taken.pos && impLooksPos(col)){ roles[i]='pos'; taken.pos=1; continue; }
    if(!taken.ph && impLooksPh(col)){ roles[i]='ph'; taken.ph=1; continue; }
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
    rec={hw:'', mn:'', pos:'', ph:[]};
    for(j=0;j<roles.length;j++){
      r=roles[j]; v=String(rows[i][j]||'').trim();
      if(!r || r==='skip' || !v) continue;
      if(r==='hw' && !rec.hw) rec.hw=v;
      else if(r==='mn') rec.mn = rec.mn? rec.mn+' / '+v : v;
      else if(r==='pos' && !rec.pos) rec.pos=v;
      else if(r==='ph' && !rec.ph.length) rec.ph=impPh(v, snd);
    }
    if(rec.hw || rec.mn) out.push(rec);
  }
  return out;
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
  var s=String(v||'').trim();
  s=s.replace(/^[\/\[]+/, '').replace(/[\/\]]+$/, '').replace(/[ˈˌ.]/g, '').trim();
  if(!s) return [];
  if(/\s/.test(s)) return s.split(/\s+/);
  return impCut(s, snd);
}
function impCut(s, snd){
  var all=(snd||[]).concat((typeof ipaAll==='function')? ipaAll() : []), out=[], i, hit;
  all.sort(function(a, b){ return b.length-a.length; });
  while(s.length){
    hit=null;
    for(i=0;i<all.length;i++) if(all[i] && s.indexOf(all[i])===0){ hit=all[i]; break; }
    if(!hit){ out.push(s.charAt(0)); s=s.slice(1); }
    else { out.push(hit); s=s.slice(hit.length); }
  }
  return out;
}

/* ==== below this line the app begins ==== */
/* Everything above touches no global and no document, and must not start:
   tools/import-check.mjs runs that half directly in Node, over one sample per
   format, which is the only thing holding "we can read anybody's file"
   upright. Everything below is the app -- the screen, the plan, the
   dictionary -- and is walked by press.mjs like any other screen.

   ---- the screen, and putting them in ------------------------------------ */
function openImport(){
  openForm('csv:', t('csv.title'),
    '<div class="field"><textarea id="f-csv" placeholder="'+esc(t('csv.ph'))+'"></textarea></div>'+
    '<button class="btn" style="width:100%"' + DO('doImport') + '>'+t('csv.btn')+'</button>');
}
FORM_OPEN.csv=function(){ openImport(); };
function doImport(){
  var e=document.getElementById('f-csv');
  if(!e) return;
  var read=impRead(e.value);
  impPut(impRows(read, impGuess(read), addedSnd()));
}
/* Meanings arrive joined, because a file can hold several in one cell and
   several cells can each hold one. The app keeps them apart. */
function impSenses(mn){
  return String(mn||'').split(/\s*\/\s*/).filter(function(x){ return !!x.trim(); });
}
/* Every row, as a word.

   A row that brought a spelling keeps it, and keeps the sounds the file gave
   it. Only a row with no sounds falls back to guessing them off the letters,
   which is all that can be done and is wrong for anything not written in
   roman -- it used to be what happened to every row.

   A row that brought only a meaning gets a word coined out of this language's
   own sounds, which is the commonest thing anybody imports: a list of what
   the words are for, with no words yet. */
function impPut(rows){
  var made=0, took=0, full=false, i, r, seq, hw, guard;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    if(!capOK(1)){ full=true; break; }
    if(r.hw){
      hw=String(r.hw);
      if(findWord(hw)) continue;
      seq = r.ph.length? r.ph : phGuess(hw);
      if(!seq.length) continue;
      WORDS.push({hw:hw, ph:seq, mn:r.mn, mns:impSenses(r.mn),
                  pos:r.pos? posKey(r.pos) : 'n', at:Date.now()+i});
      took++;
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
      WORDS.push({hw:hw, ph:seq, mn:r.mn, mns:impSenses(r.mn),
                  pos:r.pos? posKey(r.pos) : 'n', at:Date.now()+i});
      made++;
    }
  }
  save(); cands=[];
  if(here().r==='form') back(); else render();
  toast(full? t('csv.full', took, made) : t('csv.done', took, made));
}
