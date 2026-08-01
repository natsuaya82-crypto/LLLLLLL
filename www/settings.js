/* Lingua — settings, plans, and the sheet for writing one word (with CSV)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   11. Settings
   ========================================================================= */
function vSettings(){
  var p=PLANS.filter(function(x){return x.id===plan();})[0];
  var sample=WORDS.length?WORDS[0].hw:'Aelin';
  return '<div class="view"><div class="chead">'+
    '<button class="back nb" onclick="go(\'home\')">'+ICON_BACK+t('nav.contents')+'</button>'+
    '<div class="chap"><span class="ct">'+t('set.title')+'</span></div></div>'+
    '<div class="body">'+
    '<div class="sec">'+t('set.look')+'</div>'+
    '<div class="pick">'+
      ['system','light','dark'].map(function(th){
        return '<button class="'+(SET.theme===th?'on':'')+'" onclick="setTheme(\''+th+'\')">'+t('theme.'+th)+'</button>';
      }).join('')+
    '</div>'+
    '<div class="note">'+t('set.theme.note')+'</div>'+

    '<div class="sec">'+t('set.reading')+'</div>'+
    '<div class="pick">'+
      [['ipa',t('read.ipa')],['kana',capFirst(langDef().rdName)],['both',t('read.both')]].map(function(m){
        return '<button class="'+(readMode()===m[0]?'on':'')+'" onclick="setRead(\''+m[0]+'\')">'+esc(m[1])+'</button>';
      }).join('')+
    '</div>'+
    '<div class="pvbox" style="margin-top:10px"><span class="pvn">'+t('set.sample')+'</span>'+
      '<span class="pvk">'+esc(readOut(sample))+'</span></div>'+
    '<div class="note">'+t('set.ipa.note', esc(langDef().rdName))+'</div>'+

    /* One control for the whole interface: the screen and the reading
       of every word follow it. The IPA never does. */
    '<div class="sec">'+t('set.display')+'</div>'+
    /* One row per language, each carrying the reading it would give the
       first word in the dictionary — so the choice is made by looking at
       the result, not by trusting the name of a script. */
    UI_LANGS.map(function(k){
      return '<button class="set lrow'+(uiLang()===k?' on':'')+'" onclick="setUi(\''+k+'\')">'+
        '<span class="sl">'+esc(LANG[k].label)+'</span>'+
        '<span class="pvk lsam">'+esc(LANG[k].read.word(sample))+'</span>'+
        '<span class="lchk">'+(uiLang()===k?'✓':'')+'</span></button>';
    }).join('')+
    '<div class="note">'+t('set.display.note')+'</div>'+

    '<div class="sec">'+t('set.voice')+'</div>'+
    '<button class="set"><span class="sl">'+t('set.voice.cur')+'</span><span class="sv">'+esc(voiceLabel())+'</span></button>'+
    (VOICES.length
      ? '<div class="field" style="margin-top:12px"><label>'+t('set.voice.pick')+'</label>'+
        '<select onchange="setVoice(this.value)">'+
        '<option value=""'+(SET.voice?'':' selected')+'>'+esc(t('set.voice.auto'))+'</option>'+
        VOICES.map(function(v){
          return '<option value="'+esc(v.voiceURI)+'"'+(SET.voice===v.voiceURI?' selected':'')+'>'+
            esc(v.name)+' ('+esc(v.lang)+')</option>';
        }).join('')+'</select></div>'
      : '<div class="note">'+t('set.voice.wait')+'</div>')+
    '<div class="pvbox" style="margin-top:10px"><span class="pvn">'+t('set.voice.try')+'</span>'+
      '<span class="pvk">'+esc(sample)+'</span>'+
      '<button onclick="speak(\''+esc(sample)+'\')">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="note">'+t('set.voice.note')+'</div>'+

    '<div class="sec">'+t('set.lang')+'</div>'+
    '<button class="set" onclick="editName()"><span class="sl">'+t('set.name')+'</span><span class="sv">'+esc(langName||'—')+' ›</span></button>'+
    '<button class="set" onclick="go(\'words\')"><span class="sl">'+t('set.count')+'</span><span class="sv">'+WORDS.length+(has('plus')?'':' / '+FREE_LIMIT)+' ›</span></button>'+

    /* Signing in used to be the second thing the app asked for, before a
       single letter existed. It is here now, where it has a reason: an
       account is what carries a language off this one phone. Nothing above
       this line needs it. */
    '<div class="sec">'+t('set.account')+'</div>'+
    '<button class="set signin google" onclick="obSignIn()"><span class="sl">'+MARK_GOOGLE+
      '<span>'+t('ob.signin.google')+'</span></span><span class="sv">\u203A</span></button>'+
    '<button class="set signin apple" onclick="obSignIn()"><span class="sl">'+MARK_APPLE+
      '<span>'+t('ob.signin.apple')+'</span></span><span class="sv">\u203A</span></button>'+
    '<div class="note">'+t('set.account.note')+'</div>'+

    '<div class="sec">'+t('set.plan')+'</div>'+
    '<button class="set" onclick="go(\'plans\')"><span class="sl">'+t('set.plan.cur')+'</span><span class="sv">'+esc(p?p.name:'Free')+' ›</span></button>'+

    '<div class="sec">'+t('set.data')+'</div>'+
    (has('plus')
      ? '<button class="set" onclick="exportCSV()"><span class="sl">'+t('set.csv.out')+'</span><span class="sv">›</span></button>'+
        '<button class="set" onclick="openImport()"><span class="sl">'+t('set.csv.in')+'</span><span class="sv">›</span></button>'+
        '<button class="set"><span class="sl">'+t('set.cloud')+'</span><span class="sv">'+t('set.on')+'</span></button>'
      : '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.csv.t')+'</span><br><span class="ld">'+t('set.lock.csv.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>'+
        '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.cloud.t')+'</span><br><span class="ld">'+t('set.lock.cloud.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>')+
    '<button class="set" style="margin-top:18px" onclick="wipe()"><span class="sl" style="color:#c9553f">'+t('set.wipe')+'</span></button>'+
    '<div class="note" style="margin-top:26px">'+t('set.footer')+(has('plus')?'':t('set.footer.free'))+'</div>'+
    '</div></div>';
}
function setTheme(v){ SET.theme=v; save(); applyTheme(); render(); }
function setRead(m){ SET.read=m; save(); render(); }
function setUi(l){ SET.ui=l; save(); render(); }
function setVoice(v){ SET.voice=v; save(); render(); var s=WORDS.length?WORDS[0].hw:'Aelin'; speak(s); }
function wipe(){
  if(!confirm(t('confirm.wipe'))) return;
  WORDS=[]; LINES=[]; langName=''; SET.done=false; comp=[]; compSel=-1; save();
  ob={step:0,name:'',mn:'',hw:''}; render();
}

/* =========================================================================
   12. Plans
   ========================================================================= */
function vPlans(){
  return '<div class="view"><div class="chead">'+
    '<button class="back nb" onclick="go(\'settings\')">'+ICON_BACK+t('nav.settings')+'</button>'+
    '<div class="chap"><span class="ct">'+t('plans.title')+'</span></div></div>'+
    '<div class="body">'+
    '<div class="note" style="margin-bottom:16px">'+t('plans.intro')+'</div>'+
    PLANS.map(function(p){
      var cur = p.id===plan();
      return '<div class="plan'+(cur?' cur':'')+'">'+
        '<div class="ph2"><span class="pn">'+p.name+'</span>'+
        (cur?'<span class="badge">'+t('plan.cur')+'</span>':'')+
        '<span class="pp">'+t(p.price)+'</span></div>'+
        '<div class="pl">'+p.lines.map(function(l){return '· '+t(l);}).join('<br>')+'</div>'+
        (cur?'':'<button onclick="choose(\''+p.id+'\')">'+(p.id==='free'? t('plan.tofree') : t('plan.choose'))+'</button>')+
        '</div>';
    }).join('')+
    '<div class="note" style="margin-top:14px">'+t('plans.note')+'</div>'+
    '</div></div>';
}
function choose(id){
  SET.plan=id; save(); render();
  toast(id==='free'? t('toast.plan.free') : t('toast.plan.other', id));
}

/* =========================================================================
   13. The sheet for writing a word, and CSV
   ========================================================================= */
var addPos='n';

/* Suggestions are drawn with the same generator the coinage screen uses, so
   what it offers already obeys the language's own sounds and shape. */
var SUG=[], sugMn='';
/* Studio is the tier that advertises this, so Studio is what lifts the ceiling. */
function sugUnl(){ return has('studio'); }
function sugLeft(){ return sugUnl() ? Infinity : Math.max(0, AI_FREE_DAILY-aiUsed()); }
function sugMean(){ var e=document.getElementById('f-mn'); return e? String(e.value||'').trim() : ''; }
function sugBuild(){
  var A=analyze(), tk=taken(); SUG=[];
  for(var i=0;i<3;i++){ var w=makeWord(addPos||POS[0], A, tk); if(w){ SUG.push(w); tk[w.toLowerCase()]=1; } }
}
function sugHTML(){
  var left=sugLeft(), unl=(left===Infinity);
  if(!SUG.length){
    if(!unl && left<=0) return '<button class="sugout" onclick="closeSheet();go(\'plans\')">'+t('sug.out')+' <b>'+t('up.cta')+' \u203A</b></button>';
    return '<button class="sugask" onclick="sugGo()">'+
      '<span class="sual"><span class="sut">'+t('add.lock.t')+'</span><span class="sud">'+t('add.lock.d')+'</span></span>'+
      (unl?'':'<span class="sugn">'+t('sug.left', left)+'</span>')+'</button>';
  }
  return '<div class="sugbox"><div class="sugchips">'+
    SUG.map(function(w){ return '<button class="sugchip" onclick="sugPick(\''+esc(w)+'\')"><span class="sw">'+esc(w)+'</span><span class="sr">'+esc(readOut(w))+'</span></button>'; }).join('')+
    '</div><div class="sugfoot"><span class="sughint">'+(sugMn? t('sug.for', esc(sugMn)) : t('sug.hint'))+'</span>'+
    ((unl||left>0)?'<button class="sugmore" onclick="sugGo()">'+t('sug.more')+'</button>':'')+
    '</div>'+
    ((!unl&&left<=0)?'<button class="sugout" style="margin:9px 0 0" onclick="closeSheet();go(\'plans\')">'+t('sug.out')+' <b>'+t('up.cta')+' \u203A</b></button>':'')+
    '</div>';
}
function sugPaint(){ var e=document.getElementById('sugwrap'); if(e) e.innerHTML=sugHTML(); }
function sugGo(){
  if(sugLeft()<=0){ closeSheet(); go('plans'); toast(t('sug.out')); return; }
  if(!sugUnl()) aiSpend();
  sugMn=sugMean(); sugBuild(); sugPaint();
}
function sugPick(w){
  var f=document.getElementById('f-hw');
  if(f){ f.value=w; pv(); f.focus(); }
  SUG=[]; sugPaint();
}

/* A word is built from the sounds this language has, not typed and then
   guessed at. The keys are the language's own inventory: what is not in it
   cannot go in a word, which is the whole point of having chosen it. */
var addSeq=[];
function addPh(sym){ addSeq.push(sym); addPaint(); }
function addBack(){ addSeq.pop(); addPaint(); }
function addPaint(){
  var w=document.getElementById('f-seq'), r=document.getElementById('f-pv'),
      b=document.getElementById('f-back');
  if(w) w.textContent = addSeq.join('');
  if(r) r.textContent = addSeq.length? phIpa(addSeq) : '';
  if(b) b.disabled = !addSeq.length;
}
function addKeys(){
  var mine=addedSnd();
  if(!mine.length){
    return '<div class="note">'+t('add.ph.none')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:8px" onclick="closeSheet({target:{id:\'sbg\'}});go(\'sound\')">'+
      esc(t('toc.sound'))+'</button>';
  }
  return '<div class="phkeys">'+mine.map(function(x){
    return '<button class="phk" onclick="addPh(\''+x+'\')">'+esc(x)+'</button>';
  }).join('')+'</div>';
}
function openAdd(){
  SUG=[]; sugMn=''; addSeq=[];
  if(!capOK(1)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
  document.getElementById('sheet').innerHTML=
    '<div class="grip"></div><h3>'+t('add.title')+'</h3>'+
    '<div class="note" style="margin-bottom:12px">'+t('add.note')+'</div>'+
    '<div class="seqbox"><span class="seq" id="f-seq"></span>'+
      '<button class="seqdel" id="f-back" onclick="addBack()" disabled aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    '<div class="sec">'+t('add.ph')+'</div>'+
    addKeys()+
    '<div class="pvbox"><span class="pvn">'+t('f.reading')+'</span><span class="pvk" id="f-pv"></span>'+
    '<button onclick="sayField()">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="row2"><div class="field"><label>'+t('f.meaning')+'</label><input id="f-mn" placeholder="'+esc(t('f.meaning.ph'))+'"></div>'+
    '<div class="field"><label>'+t('f.pos')+'</label><select id="f-pos">'+
    POS.map(function(p){return '<option value="'+p+'"'+(p===addPos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div></div>'+
    '<div id="sugwrap">'+sugHTML()+'</div>'+
    '<button class="btn" style="width:100%;margin-top:6px" onclick="addOne()">'+t('add.btn')+'</button>'+
    '';
  document.getElementById('sbg').classList.add('on');
  document.getElementById('sheet').classList.add('on');
  addPaint();
}
function closeSheet(e){
  if(e && e.target && e.target.id!=='sbg') return;
  document.getElementById('sbg').classList.remove('on');
  document.getElementById('sheet').classList.remove('on');
}
function pv(){ addPaint(); }
function sayField(){ if(addSeq.length) speak(addSeq.join('')); }
function addOne(){
  var hw=addSeq.join('');
  var mn=document.getElementById('f-mn').value.trim();
  var pos=document.getElementById('f-pos').value;
  if(addSeq.length<2){ toast(t('toast.hw2')); return; }
  if(!capOK(1)){ closeSheet(); go('plans'); return; }
  if(WORDS.some(function(w){return String(w.hw).toLowerCase()===hw.toLowerCase();})){ toast(t('toast.dup')); return; }
  addPos=pos;
  WORDS.push({hw:hw, ph:addSeq.slice(), mn:mn, pos:pos, at:Date.now()});
  save(); closeSheet(); cands=[]; addSeq=[];
  toast(t('toast.added.1', hw));
  render();
}
/* One word, opened: reading, syllable breaks, meaning, part of speech.
   Everything here can be changed or deleted. */
var openHw='';
function findWord(hw){
  for(var i=0;i<WORDS.length;i++){ if(String(WORDS[i].hw).toLowerCase()===String(hw).toLowerCase()) return WORDS[i]; }
  return null;
}
/* The syllables, from the sounds. What used to sit here was the respelling
   -- the word written out in the reader's own script -- and a word made of
   IPA symbols gives it nothing to work from. */
function wordSyl(w){
  var seq=wPh(w), out=[], cur=[], i, v=false;
  for(i=0;i<seq.length;i++){
    if(ipaIsVowel(seq[i])){ cur.push(seq[i]); v=true; }
    else { if(v){ out.push(cur.join('')); cur=[]; v=false; } cur.push(seq[i]); }
  }
  if(cur.length) out.push(cur.join(''));
  return out.join('\u00b7');
}

function openWord(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw;
  var sy=syl(w.hw);
  document.getElementById('sheet').innerHTML=
    '<div class="grip"></div>'+
    '<div class="whd"><span class="whw">'+esc(wOut(w.hw))+'</span>'+
      '<button class="play" style="margin:0 0 0 auto" onclick="speak(\''+esc(w.hw)+'\')">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="wsub">'+esc(phIpa(wPh(w)))+'</div>'+
    '<div class="wsub2">'+esc(wordSyl(w))+'</div>'+
    '<div class="sec" style="margin:18px 0 8px">'+t('word.syl')+'</div>'+
    '<div class="sylrow">'+sy.map(function(s,i){
      var d=i===0? s.charAt(0).toUpperCase()+s.slice(1) : s;
      return '<span class="sy"><span class="sya">'+esc(d)+'</span>'+
        '<span class="syi">'+esc(ipaSyl(s))+'</span>'+
        '<span class="syk">'+esc(rdSyl(s))+'</span></span>';
    }).join('<span class="sysep">·</span>')+'</div>'+
    '<div class="note" style="margin-top:8px">'+tn('word.note', sy.length, esc(langDef().label), esc(langDef().rdName))+'</div>'+
    '<div class="sec" style="margin:20px 0 8px">'+t('word.edit')+'</div>'+
    '<div class="row2"><div class="field"><label>'+t('f.meaning')+'</label><input id="w-mn" value="'+esc(w.mn||'')+'" placeholder="'+esc(t('word.mn.ph'))+'"></div>'+
    '<div class="field"><label>'+t('f.pos')+'</label><select id="w-pos">'+
    POS.map(function(p){return '<option value="'+p+'"'+(p===w.pos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div></div>'+
    '<button class="btn" style="width:100%;margin-top:4px" onclick="saveWord()">'+t('word.save')+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none" onclick="delWord()">'+
      '<span class="sl" style="color:#c9553f">'+t('word.del')+'</span></button>';
  document.getElementById('sbg').classList.add('on');
  document.getElementById('sheet').classList.add('on');
}
function saveWord(){
  var w=findWord(openHw); if(!w) return;
  w.mn=document.getElementById('w-mn').value.trim();
  w.pos=document.getElementById('w-pos').value;
  save(); closeSheet(); cands=[]; render(); toast(t('toast.saved', w.hw));
}
function delWord(){
  var w=findWord(openHw); if(!w) return;
  if(!confirm(t('confirm.del', w.hw))) return;
  WORDS=WORDS.filter(function(x){return x!==w;});
  save(); closeSheet(); cands=[]; render(); toast(t('toast.deleted', w.hw));
}

/* The CSV header stays English in every locale, so a file written on one
   device imports cleanly on another. The part of speech comes back through
   posKey(), which accepts a key or a label in any supported language. */
function exportCSV(){
  var csv='spelling,meaning,pos,ipa,reading\n'+WORDS.map(function(w){
    return [w.hw,w.mn,w.pos,phIpa(wPh(w)),wPh(w).join(' ')].map(function(x){return '"'+String(x||'').replace(/"/g,'""')+'"';}).join(',');
  }).join('\n');
  try{
    var b=new Blob([csv],{type:'text/csv'}), u=URL.createObjectURL(b), a=document.createElement('a');
    a.href=u; a.download=(langName||'lingua')+'.csv'; a.click(); URL.revokeObjectURL(u);
    toast(t('toast.exported'));
  }catch(e){ toast(t('toast.exportfail')); }
}
function openImport(){
  document.getElementById('sheet').innerHTML=
    '<div class="grip"></div><h3>'+t('csv.title')+'</h3>'+
    '<div class="note" style="margin-bottom:10px">'+t('csv.note')+'</div>'+
    '<div class="field"><textarea id="f-csv" placeholder="'+t('csv.ph')+'"></textarea></div>'+
    '<button class="btn" style="width:100%" onclick="doImport()">'+t('csv.btn')+'</button>';
  document.getElementById('sbg').classList.add('on');
  document.getElementById('sheet').classList.add('on');
}
function doImport(){
  var src=document.getElementById('f-csv').value, n=0;
  src.split(/\r?\n/).forEach(function(line){
    if(!line.trim()) return;
    var c=line.split(',').map(function(x){return x.trim().replace(/^"|"$/g,'');});
    var hw=String(c[0]||'').replace(/[^A-Za-z]/g,'');
    if(hw.length<2) return;
    if(/^spelling$/i.test(c[0])) return;
    hw=hw.charAt(0).toUpperCase()+hw.slice(1).toLowerCase();
    if(WORDS.some(function(w){return String(w.hw).toLowerCase()===hw.toLowerCase();})) return;
    WORDS.push({hw:hw, mn:c[1]||'', pos:posKey(c[2]), at:Date.now()});
    n++;
  });
  save(); closeSheet(); cands=[]; render();
  toast(tn('toast.imported', n));
}

