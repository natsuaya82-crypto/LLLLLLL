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
var IMP_ROLES=['hw', 'mn', 'pos', 'ph', 'ch', 'nm', 'skip'];
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
  ch:  ['character','char','glyph','letter','letters','symbol','sign','sigil',
        'grapheme','graph','ch','rune','sc'],
  nm:  ['name','letter name','called','nm','label','title']
};
/* The app already knows what it calls these, in ten languages, and that is
   where those names live. Reading them off here means a person whose
   spreadsheet is headed 「つづり」 or 「品詞」 is understood without anybody
   typing those words into this file. */
var IMP_KEY={hw:['f.spelling'], mn:['f.meaning','word.means'], pos:['f.pos'],
             ch:['lt.title','toc.letters'], nm:['lt.name']};
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
    if(r && r!=='mn' && taken[r]) r='';
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
    rec={hw:'', mn:'', pos:'', ph:[], phRaw:'', ch:'', nm:''};
    for(j=0;j<roles.length;j++){
      r=roles[j]; v=String(rows[i][j]||'').trim();
      if(!r || r==='skip' || !v) continue;
      if(r==='hw' && !rec.hw) rec.hw=v;
      else if(r==='mn') rec.mn = rec.mn? rec.mn+' / '+v : v;
      else if(r==='pos' && !rec.pos) rec.pos=v;
      else if(r==='ph' && !rec.ph.length){ rec.ph=impPh(v, snd); rec.phRaw=impClean(v); }
      else if(r==='ch' && !rec.ch) rec.ch=v;
      else if(r==='nm' && !rec.nm) rec.nm=v;
    }
    if(rec.hw || rec.mn || rec.ch) out.push(rec);
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
   dictionary -- and press.mjs walks it like any other screen.
   ========================================================================= */

/* ---- where you are in it ------------------------------------------------
   Cleared by viewReset() in www/shell.js, which is the one place a screen
   forgets, because arriving at somebody else's language holding half of a
   spreadsheet you were reading into your own is the worst kind of bug. */
var IMP=impBlank();
function impBlank(){ return {read:null, roles:[], dup:'skip', done:null}; }

/* Three faces, and which one you see is what has happened so far: nothing
   yet, a file read and waiting to be understood, or a dictionary that just
   grew by two thousand words and can be put back. */
function openImport(){ openForm('csv:', t('csv.title'), impHTML(), impMount); }
FORM_OPEN.csv=function(){ openImport(); };
function impHTML(){
  if(IMP.done) return impDoneHTML();
  if(IMP.read) return impMapHTML();
  return impGetHTML();
}
/* Rebuilding it rather than patching a piece: choosing what a column is
   changes the counts underneath it and can change the buttons, and a screen
   that redraws two of its three parts is where the third goes stale. */
function impAgain(){ IMP=impBlank(); openImport(); }

/* ---- 1. getting it in --------------------------------------------------- */
function impGetHTML(){
  return '<div class="field"><textarea id="f-csv" placeholder="'+esc(t('csv.ph'))+'"></textarea></div>'+
    impFileHTML()+
    '<button class="btn" style="width:100%;margin-top:12px"' + DO('impScan') + '>'+
      esc(t('imp.next'))+'</button>';
}
/* A file rather than a paste. Pasting is fine for forty words and impossible
   for four thousand, which is the size of list this is for -- so this is
   where the paid plan starts, and the free one still gets the paste. */
function impFileHTML(){
  if(!has('plus'))
    return '<button class="impfile"' + DO('go', ["plans"]) + '>'+esc(t('imp.file'))+
      '<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>';
  return '<label class="impfile">'+esc(t('imp.file'))+
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
  IMP.read=r; IMP.roles=impGuess(r); IMP.done=null;
  openImport();
}

/* ---- 2. what each column is --------------------------------------------- */
/* The guess is already made and already chosen; this is where it gets
   corrected. Three rows are enough to recognise your own spreadsheet and
   few enough to fit on a phone. */
function impMapHTML(){
  var rows=IMP.read.rows, head=IMP.read.head, n=Math.min(3, rows.length);
  var p=impPlan(), i, j, out='';
  out+='<div class="imptab"><table><tr>';
  for(j=0;j<IMP.roles.length;j++){
    out+='<th><select' + CH('impSetRole', [j]) + '>'+
      IMP_ROLES.map(function(r){
        return '<option value="'+r+'"'+(IMP.roles[j]===r? ' selected':'')+'>'+
          esc(t('imp.role.'+r))+'</option>';
      }).join('')+'</select>'+
      (head? '<div class="impcap">'+esc(head[j]||'')+'</div>' : '')+'</th>';
  }
  out+='</tr>';
  for(i=0;i<n;i++){
    out+='<tr>';
    for(j=0;j<IMP.roles.length;j++) out+='<td>'+esc(rows[i][j]||'')+'</td>';
    out+='</tr>';
  }
  out+='</table></div>';
  out+='<div class="impsum">'+
    (p.add?  '<span><b>'+p.add+'</b>'+esc(t('imp.new'))+'</span>' : '')+
    (p.ltr?  '<span><b>'+p.ltr+'</b>'+esc(t('imp.ltr'))+'</span>' : '')+
    (p.coin? '<span><b>'+p.coin+'</b>'+esc(t('imp.coin'))+'</span>' : '')+
    '</div>';
  /* The choice only exists when there is something to choose about -- and it
     sits ON the count it is about. Two words floating under a table say
     nothing: 「飛ばすってなんの話？」 They are about the words that are
     already here, so they are beside the number of them. */
  if(p.have)
    out+='<div class="impdup"><span class="impn"><b>'+p.have+'</b>'+esc(t('imp.have'))+'</span>'+
      '<div class="segs">'+
      '<button class="seg'+(IMP.dup==='skip'? ' on':'')+'"' + DO('impSetDup', ["skip"]) + '>'+
        esc(t('imp.skip'))+'</button>'+
      '<button class="seg'+(IMP.dup==='over'? ' on':'')+'"' + DO('impSetDup', ["over"]) + '>'+
        esc(t('imp.over'))+'</button></div></div>';
  out+='<button class="btn" style="width:100%;margin-top:14px"' + DO('doImport') + '>'+
    esc(t('csv.btn'))+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('impAgain') + '>'+
      '<span class="sl">'+esc(t('imp.again'))+'</span></button>';
  return out;
}
function impSetRole(j, v){ IMP.roles[j]=v; openImport(); }
function impSetDup(v){ IMP.dup=v; openImport(); }
/* What pressing it would do, said before it is pressed. A row carrying a
   character is a letter and everything else is a word, so one file can be
   both and the counts say which. */
function impPlan(){
  var rows=impRows(IMP.read, IMP.roles, addedSnd());
  var p={add:0, ltr:0, coin:0, have:0}, i, r;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    if(r.ch){ if(impLtrBy(r.ch)) p.have++; else p.ltr++; }
    else if(r.hw){ if(findWord(r.hw)) p.have++; else p.add++; }
    else if(r.mn) p.coin++;
  }
  return p;
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

/* ---- 3. what happened, and putting it back ------------------------------ */
function impDoneHTML(){
  var d=IMP.done;
  return '<div class="impbig">'+esc(t('imp.done', d.n))+'</div>'+
    (d.full? '<div class="note">'+esc(t('csv.full', d.n, 0))+'</div>' : '')+
    '<button class="btn" style="width:100%;margin-top:16px"' + DO('back') + '>'+
      esc(t('imp.ok'))+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('impUndo') + '>'+
      '<span class="sl bad">'+esc(t('imp.undo'))+'</span></button>';
}
/* Putting two thousand words into the only copy of something somebody spent
   years on is not a thing anybody should have to be brave about. Every word
   this added is remembered by its spelling, and every word it overwrote is
   remembered whole, so one press is enough to make it not have happened. */
function impUndo(){
  var d=IMP.done, i, k;
  if(!d) return;
  for(i=0;i<d.hws.length;i++){
    k=impAt(d.hws[i]);
    if(k>=0) WORDS.splice(k, 1);
  }
  for(i=0;i<d.was.length;i++){
    k=impAt(d.was[i].hw);
    if(k>=0) WORDS[k]=d.was[i].w;
  }
  for(i=0;i<d.lts.length;i++) ltDel(d.lts[i]);
  for(i=0;i<d.wasL.length;i++){
    k=impLtrAt(d.wasL[i].id);
    if(k>=0) LETTERS[k]=d.wasL[i].l;
  }
  save(); saveLetters(); installScriptFont(); cands=[];
  IMP=impBlank(); openImport();
  toast(t('imp.undone'));
}
function impLtrAt(id){
  var i;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].id===id) return i;
  return -1;
}
function impAt(hw){
  var i;
  for(i=0;i<WORDS.length;i++) if(WORDS[i].hw===hw) return i;
  return -1;
}

/* ---- doing it ----------------------------------------------------------- */
function doImport(){ impPut(impRows(IMP.read, IMP.roles, addedSnd())); }
/* Meanings arrive joined, because a file can hold several in one cell and
   several cells can each hold one. The app keeps them apart. */
function impSenses(mn){
  return String(mn||'').split(/\s*\/\s*/).filter(function(x){ return !!x.trim(); });
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
  var added=[], was=[], lts=[], wasL=[], full=false, i, r, seq, hw, w, l, u, guard;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    /* A letter, not a word. It costs no room on the free plan: the ceiling is
       on the dictionary, and an alphabet is not one. */
    if(r.ch){
      u=impLtrSnd(r);
      l=impLtrBy(r.ch);
      if(l){
        if(IMP.dup!=='over') continue;
        wasL.push({id:l.id, l:JSON.parse(JSON.stringify(l))});
        if(r.nm) l.nm=r.nm;
        /* The list said what this letter reads, so it is an answer and not
           the app's guess: renaming the letter later leaves it alone. */
        if(u.length){ impGrow(u); l.snd=u; l.chose=1; }
      } else {
        if(u.length) impGrow(u);
        l=ltNew({ch:r.ch, nm:r.nm, snd:u});
        lts.push(l.id);
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
        was.push({hw:hw, w:JSON.parse(JSON.stringify(w))});
        if(r.mn){ w.mn=r.mn; w.mns=impSenses(r.mn); }
        if(r.pos) w.pos=posKey(r.pos);
        if(r.ph.length) w.ph=r.ph;
        continue;
      }
      seq = r.ph.length? r.ph : phGuess(hw);
      if(!seq.length) continue;
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
    WORDS.push({hw:hw, ph:seq, mn:r.mn, mns:impSenses(r.mn),
                pos:r.pos? posKey(r.pos) : 'n', at:Date.now()+i});
    added.push(hw);
  }
  save();
  if(lts.length || wasL.length){ saveLetters(); installScriptFont(); }
  cands=[];
  IMP.done={n:added.length+was.length+lts.length+wasL.length,
            hws:added, was:was, lts:lts, wasL:wasL, full:full};
  openImport();
}
