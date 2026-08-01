/* Lingua — the interface in 中文 (zh).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- zh — 中文 ----------------------------------------------------------- */
defLang('zh', (function(){
  /* ------------------------------------------------------------------
     Lingua — reading approximation for Chinese (zh, 简体)
     汉字音译: the invented word transliterated into characters the way a
     foreign name is, following the shape of the 新华社《世界人名翻译大辞典》
     tables — a grid of consonant rows against vowel columns, one character
     per cell, so the mapping can be corrected cell by cell.

     Mandarin has no consonant clusters and no coda but -n / -ng, so every
     cluster and every other coda becomes a syllable of its own, exactly as
     the standard tables do it: dra -> 德拉, -s -> 斯, -l -> 尔, -k -> 克.
     Chinese marks no stress and puts nothing between the characters of a
     name, so the house style's capitals and hyphens do not apply here.
     Plain ES5. Globals suffixed _zh / prefixed ZH_.
     ------------------------------------------------------------------ */

  /* rows: the source consonant unit.  columns: a e i o u
     The last field is the character used when the consonant carries no
     vowel of its own (a cluster member or a coda).
     /r/ is a tap, so it takes the L row, which is what the standard tables
     do with a foreign R.  /θ/ takes the S row, /v/ the W row.            */
  var ZH_ROW={
    '' :['阿','埃','伊','奥','乌',''  ],
    b  :['巴','贝','比','博','布','布'],
    p  :['帕','佩','皮','波','普','普'],
    m  :['马','梅','米','莫','穆','姆'],
    f  :['法','弗','菲','福','富','夫'],
    v  :['瓦','韦','维','沃','武','夫'],
    w  :['瓦','韦','维','沃','乌','乌'],
    d  :['达','德','迪','多','杜','德'],
    t  :['塔','特','蒂','托','图','特'],
    n  :['纳','内','尼','诺','努','恩'],
    l  :['拉','莱','利','洛','卢','尔'],
    r  :['拉','雷','里','罗','鲁','尔'],
    g  :['加','盖','吉','戈','古','格'],
    k  :['卡','凯','基','科','库','克'],
    c  :['卡','凯','基','科','库','克'],
    q  :['卡','凯','基','科','库','克'],
    h  :['哈','赫','希','霍','胡','赫'],
    s  :['萨','塞','西','索','苏','斯'],
    z  :['扎','泽','齐','佐','祖','兹'],
    th :['萨','塞','西','索','苏','斯'],
    sh :['沙','谢','希','绍','舒','什'],
    ch :['查','切','奇','乔','楚','奇'],
    j  :['亚','耶','伊','约','尤','伊'],
    y  :['亚','耶','伊','约','尤','伊'],
    x  :['克','克','克','克','克','克']   /* /ks/ — the s follows separately */
  };
  /* the same grid for a syllable closed by -n, which Mandarin can carry */
  var ZH_N={
    '' :['安','恩','因','翁','温'],
    b  :['班','本','宾','邦','本'],
    p  :['潘','彭','平','蓬','蓬'],
    m  :['曼','门','明','蒙','蒙'],
    f  :['凡','芬','芬','丰','丰'],
    v  :['万','文','温','翁','温'],
    w  :['万','文','温','翁','温'],
    d  :['丹','登','丁','东','敦'],
    t  :['坦','滕','廷','通','通'],
    n  :['南','嫩','宁','农','农'],
    l  :['兰','伦','林','隆','伦'],
    r  :['兰','伦','林','龙','伦'],
    g  :['甘','根','金','贡','贡'],
    k  :['坎','肯','金','孔','昆'],
    c  :['坎','肯','金','孔','昆'],
    q  :['坎','肯','金','孔','昆'],
    h  :['汉','亨','欣','洪','洪'],
    s  :['桑','森','辛','松','孙'],
    z  :['赞','曾','津','宗','尊'],
    th :['桑','森','辛','松','孙'],
    sh :['尚','申','欣','雄','顺'],
    ch :['昌','陈','钦','琼','春'],
    j  :['扬','延','因','永','云'],
    y  :['扬','延','因','永','云'],
    x  :['肯','肯','肯','肯','肯']
  };
  /* a falling diphthong the tables give a character of its own: a+e / a+i */
  var ZH_AI={'':'艾',b:'拜',d:'戴',g:'盖',h:'海',k:'凯',c:'凯',q:'凯',l:'莱',r:'赖',
             m:'迈',n:'奈',p:'派',s:'赛',th:'赛',t:'泰',v:'外',w:'外',z:'宰',
             ch:'柴',sh:'晒',j:'亚',y:'亚',f:'法',x:'凯'};
  /* a+o / a+u */
  var ZH_AO={'':'奥',b:'保',d:'道',g:'高',h:'豪',k:'考',c:'考',q:'考',l:'劳',r:'劳',
             m:'毛','n':'瑙',p:'保',s:'绍',th:'绍',t:'陶',v:'沃',w:'沃',z:'藻',
             ch:'乔',sh:'绍',j:'尧',y:'尧',f:'福',x:'考'};
  /* a trailing vowel that follows another one inside the same syllable */
  var ZH_TAIL={a:'亚',e:'埃',i:'伊',o:'奥',u:'乌',y:'伊'};
  var ZH_VI={a:0,e:1,i:2,o:3,u:4,y:2};

  function ZH_row(u){ return ZH_ROW[u] || ZH_ROW['']; }
  function ZH_solo(u){ return ZH_row(u)[5] || ZH_row(u)[1]; }

  function syl_zh(p){
    var on=String(p.on||''), nu=String(p.nu||''), co=String(p.co||'');
    var out='', units=splitC(on), i, head='';
    /* every consonant but the last one becomes a syllable of its own */
    for(i=0;i<units.length-1;i++) out+=ZH_solo(units[i]);
    if(units.length) head=units[units.length-1];
    if(head==='x'){ out+='克'; head='s'; }        /* ks: the k stands alone */
    if(nu===''){ return out+(head?ZH_solo(head):''); }

    /* the nucleus. A doubled vowel is one vowel; a pair that falls to i or u
       has its own character; anything else spills into a second syllable. */
    var vs=[], prev='';
    nu.split('').forEach(function(v){ if(v!==prev){ vs.push(v); prev=v; } });
    /* a bare i or u in front of another vowel is a glide, and Mandarin writes
       the glide as the initial: ia -> 亚, ua -> 瓦, not 伊亚 / 乌瓦 */
    if(!units.length && vs.length>1 && (vs[0]==='i'||vs[0]==='y'||vs[0]==='u')){
      head=(vs[0]==='u')?'w':'y'; vs=vs.slice(1);
    }
    var first=vs[0], second=vs[1], nasal=/^n+$/.test(co);
    var body='';
    if(second && first==='a' && (second==='e'||second==='i'||second==='y') && !nasal){
      body=ZH_AI[head]||ZH_AI['']; vs=vs.slice(2);
    } else if(second && first==='a' && (second==='o'||second==='u') && !nasal){
      body=ZH_AO[head]||ZH_AO['']; vs=vs.slice(2);
    } else {
      var col=ZH_VI[first]===undefined?0:ZH_VI[first];
      /* -n lands on the last vowel of the syllable, not the first */
      body = (nasal && vs.length===1) ? ((ZH_N[head]||ZH_N[''])[col]) : ZH_row(head)[col];
      vs=vs.slice(1);
    }
    out+=body;
    vs.forEach(function(v,i){
      var c=ZH_VI[v]===undefined?0:ZH_VI[v];
      out += (nasal && i===vs.length-1) ? ZH_N[''][c] : (ZH_TAIL[v]||'');
    });
    if(nasal && vs.length) nasal=true;

    /* the coda. -n was already folded into the character above. */
    if(co && !nasal){
      var last='';
      splitC(co).forEach(function(c){ if(c!==last){ out+=ZH_solo(c); last=c; } });
    }
    return out;
  }
  function word_zh(ps){
    var out='', i;
    for(i=0;i<ps.length;i++) out+=syl_zh(ps[i]);
    return out;
  }

  return {
    label  : "中文",
    rdName : "汉字音译",
    all    : "全部",
    pos    : {n:"名词", v:"动词", adj:"形容词", x:"其他"},
    read   : mkApprox(word_zh, syl_zh),
    str    : {
      "ai.a.home"                 : "你已有 {0} 个词、{1} 个音。最快的推进方式是继续造词——规则从词中浮现。",
      "ai.a.make"                 : "造词会沿用你已有的音，所以新词会与旧词自然同族。留下你听着顺耳的那些。",
      "ai.a.rules"                : "目前已浮现 {0} 条规则。保持同样的习惯书写，它们会自行清晰起来。",
      "ai.a.sent"                 : "你已有 {0} 个句子。把同一个意思写成两种说法——差异之处正是你的语法。",
      "ai.a.sound"                : "你在使用 {0} 个音：{1}。小而一致的音系，比庞杂零散的更像一门真实语言。",
      "ai.a.words"                : "你的词汇量是 {0} 个词。为你真正会说的事物造词；语言是用出来的，不是列出来的。",
      "ai.ask"                    : "咨询顾问",
      "ai.hint"                   : "顾问会读取你的语言，并据此作答。",
      "ai.left"                   : "今日还剩 {0} 次",
      "ai.limit.s"                : "升级 Plus，每天都能无限咨询。",
      "ai.limit.t"                : "今天的咨询次数已用完",
      "ai.see"                    : "查看方案",
      "ai.title"                  : "语言顾问",
      "ai.unl"                    : "无限制",
      "cap.warn"                  : "免费版还可再添加 {0} 个词",
      "ch.clear"                  : "不配字",
      "ch.for"                    : "给「{0}」配字",
      "count.script"              : "{0} / {1}",
      "home.write"                : "添加词",
      "lock.ai"                   : "无限咨询",
      "lock.export"               : "导出与备份",
      "lock.sync"                 : "云端同步",
      "lock.t"                    : "Plus 功能",
      "ob.back"                   : "返回",
      "home.new.t"                : "第一个字母有了。",
      "home.new.s"                : "再画几个，你的词就能用它们写出来了。",
      "next.sc0"                  : "再画一个字母",
      "set.account"               : "账号",
      "set.account.note"          : "账号能把一门语言带出这台手机。这里没有任何地方需要它。",
      "set.account.soon"          : "还没有接通。",
      "ob.borrow.h"               : "挑一种文字来借用。",
      "ob.borrow.sub"             : "以后仍然可以自己画。",
      "ob.borrow.take"            : "点一个字就取用。",
      "ob.door.h"                 : "门上如今题着你的字母。",
      "ob.door.note"              : "没有名字，也没有账号。这些都可以慢慢来。",
      "ob.draw.done"              : "完成",
      "ob.draw.empty"             : "先画一笔。",
      "ob.draw.h"                 : "画下你这门语言的<br>第一个字母。",
      "ob.draw.sub"               : "画什么都行。它是你的。",
      "ob.lang.a"                 : "界面语言",
      "ob.open"                   : "推开门",
      "ob.or"                     : "或者，从一种已有的文字开始",
      "ob.snd.h"                  : "它发什么音？",
      "ob.snd.note.borrow"        : "借来的字形，你自己的音。在这里，没有一个字非得沿用它原来的意思。",
      "ob.snd.note.draw"          : "这个字母进入你的字母表，这个音进入你的音系。",
      "ob.enter"                  : "开始",
      "ob.lang.h"                 : "选择你的语言",
      "ob.name.auto"              : "帮我取一个",
      "ob.name.h"                 : "给你的语言<br>取个名字。",
      "ob.name.mini"              : "以后随时可以更改。",
      "ob.name.ph"                : "例：Aelira",
      "ob.signin.apple"           : "使用 Apple 继续",
      "ob.signin.google"          : "使用 Google 继续",
      "ob.signin.note"            : "登录以开始。",
      "ob.tagline"                : "为你的语言添上新的色彩。",
      "script.add"                : "添加字",
      "script.cons"               : "辅音",
      "script.dup"                : "已取用",
      "script.empty"              : "先造几个词——音是从词里来的。",
      "script.h"                  : "为每个音配一个字",
      "script.mine"               : "你的字",
      "script.none"               : "还没有字",
      "script.none2"              : "还没有字",
      "script.none2s"             : "从下面选一种文字，或自己输入一个字。",
      "script.own"                : "或自己输入",
      "script.own.ph"             : "粘贴或输入一个字",
      "script.pick"               : "点一个字就取用",
      "script.prev"               : "预览",
      "script.rm"                 : "移除",
      "script.set"                : "使用",
      "script.show"               : "用你的文字书写",
      "script.snd"                : "音",
      "script.sub"                : "这些是你的语言实际使用的音。没有配字的音保持原字母。",
      "script.vow"                : "元音",
      "snd.add"                   : "添加音",
      "snd.add.s"                 : "你的语言还没用过的音。",
      "snd.have"                  : "已在你的语言中",
      "sug.ask"                   : "想不出来？",
      "sug.for"                   : "为「{0}」造的形——点一个就留下。",
      "sug.hint"                  : "用你已有的音造的候选——点一个就留下。",
      "sug.left"                  : "今日还剩 {0} 次",
      "sug.more"                  : "换一批",
      "sug.out"                   : "今天的灵感用完了。升级 Plus 可以继续。",
      "toc.script"                : "文字",
      "up.cta"                    : "升级",
      "ws.arabic"                 : "阿拉伯字母",
      "ws.armenian"               : "亚美尼亚字母",
      "ws.cyrillic"               : "西里尔字母",
      "ws.devanagari"             : "天城文",
      "ws.geez"                   : "吉兹字母",
      "ws.georgian"               : "格鲁吉亚字母",
      "ws.glagolitic"             : "格拉哥里字母",
      "ws.greek"                  : "希腊字母",
      "ws.hangul"                 : "谚文",
      "ws.hebrew"                 : "希伯来字母",
      "ws.ogham"                  : "欧甘文字",
      "ws.phoenician"             : "腓尼基字母",
      "ws.runic"                  : "如尼文字",
      "ws.thai"                   : "泰文",
      "ws.tibetan"                : "藏文",
      "ob.start"         : "开始",
      "seed.star"        : "星",
      "seed.water"       : "水",
      "seed.wind"        : "风",
      "seed.light"       : "光",
      "seed.forest"      : "森林",
      "seed.sky"         : "天空",
      "seed.love"        : "爱",
      "seed.walk"        : "走",
      "lang.default"     : "我的语言",
      "nav.contents"     : "目录",
      "nav.settings"     : "设置",
      "home.kicker"      : "你的语言",
      "home.unnamed"     : "取个名字",
      "home.name.prompt" : "语言的名字",
      'next.t'   : "下一步",
      'next.w0'  : "创造第一个词",
      'next.w1'  : "继续添加词汇 — 还差 {0} 个就能看出规则",
      'next.s0'  : "写下第一个句子",
      'next.mk'  : "用你的音系造新词",
      "toc.words"        : "词汇",
      "toc.sound"        : "音系",
      "toc.rules"        : "语法",
      "toc.sent"         : "例句",
      "toc.make"         : "造词",
      /* the writing system */
      "toc.script"        : "文字",
      "script.preview"    : "你的文字",
      "script.show"       : "词语显示为",
      "script.show.roman" : "拉丁字母",
      "script.show.own"   : "自造文字",
      "script.show.note"  : "改变的只是显示。你输入的和保存下来的仍是同样的字母，不会被锁进一套字体里。",
      "script.needs"      : "画出一个字母，这里就会用它来显示你的词。",
      "script.letters"    : "字母表",
      "script.empty.t"    : "还没有字母",
      "script.empty.s"    : "先写一个词，它的音就会出现在这里，等着你来画。",
      "script.add"        : "添加字母",
      "script.add.prompt" : "这个字母对应哪个音？（a、k、sh …）",
      "script.add.bad"    : "一到三个拉丁字母。",
      "script.note"       : "每个字母都画在同样的方格里、用同样粗细的笔，就像手机把日文或韩文的每个字都画成同一个大小。字体在你的设备上生成，不会发送到任何地方。",
      /* the letter editor */
      "glyph.circle"      : "圆",
      "glyph.new"         : "新笔画",
      "glyph.undo"        : "撤销",
      "glyph.clear"       : "清空",
      "glyph.cancel"      : "取消",
      "glyph.save"        : "保存",
      "glyph.saved"       : "已保存 {0}",
      "count.words"      : "{0} 个词",
      "count.words.1"    : "1 个词",
      "count.sounds"     : "{0} 个音",
      "count.sounds.1"   : "1 个音",
      "count.rules"      : "找到 {0} 条",
      "count.lines"      : "{0} 句",
      "count.lines.1"    : "1 句",
      "home.empty.t"     : "还没有一个词",
      "home.empty.s"     : "一切从一个词开始。<br>写下拼写，读音自己会跟上来。",
      "home.empty.btn"   : "写下第一个词",
      "home.recent.line" : "最近的句子",
      "home.recent.word" : "最后写下的词",
      "home.write"       : "写一个词",
      "words.search"     : "搜索拼写、词义、读音",
      "words.nomatch"    : "没有找到",
      "words.empty"      : "还没有词",
      "sound.used"       : "用到的辅音",
      "sound.unused"     : "没用到的辅音",
      "sound.none"       : "暂时没有。",
      "sound.allused"    : "它们全都用上了。",
      "sound.note"       : "一门语言拒绝的音，和它留下的音一样，都是它的一部分。<br>每个字母下面的小符号是国际音标：一个符号对应一个音，世上任何语言都通用。",
      "sound.vowels"     : "元音",
      "sound.together"   : "连起来念",
      "link.yes"         : "词尾的辅音会连到下一个词",
      "link.no"          : "每个词各自分开",
      "sound.listen"     : "听一听",
      "sound.linkhint"   : "写一个以元音开头的词，它前面的辅音就会连过来，两个词合成一口气。",
      "sound.footer"     : "这些运算都发生在你的设备里。不联网，也没有 AI。",
      "rules.intro"      : "数过你写下的 {0} 个词，才找到这些习惯。不是定下来的，是发现的。",
      "rules.intro.1"    : "数过你写下的那一个词，才找到这些习惯。不是定下来的，是发现的。",
      "rules.empty.t"    : "还没有规律",
      "rules.empty.s"    : "先写几个词。",
      "rules.next"       : "接下来：{0}",
      "rules.make"       : "照这些规律，再造一些词",
      "find.final.t"     : "{0}以 <em>-{1}</em> 结尾",
      "find.final.d"     : "{0} 个里有 {1} 个如此。新的词可以保持同样的形状。",
      "find.cons.t"      : "此刻响着的辅音：<em>{0}</em>",
      "find.cons.d"      : "这是 {0} 个词里积下的音。添一个不在其中的，整门语言的颜色就变了。",
      "find.vow.t"       : "只有 <em>{0}</em>——一共 {1} 个",
      "find.vow.d"       : "元音越少，语言听起来越浑然一体。你随时可以把它放宽。",
      "find.syl.t"       : "词大多是 <em>{0} 个音节</em>",
      "find.syl.t.1"     : "词大多只有 <em>一个音节</em>",
      "find.syl.d"       : "{0} 个词里有 {1} 个。长短齐整，语言才像是被说出来的，而不是拼装出来的。",
      "find.coda.t"      : "词只以 <em>{0}</em> 结尾",
      "find.coda.d"      : "这份清单越窄，连着念的时候，词与词接得越干净。",
      "find.unused.t"    : "<em>{0}</em> 从未出现",
      "find.unused.d"    : "有些音你从不使用，这本身就是一种印记。",
      "hint.pos"         : "再写 {0} 个{1}，一条规律——{1}怎么收尾——就会浮出来。",
      "hint.pos.1"       : "再写一个{1}，一条规律——{1}怎么收尾——就会浮出来。",
      "hint.more"        : "词越多，能找到的规律也越多。",
      "sent.empty.t"     : "还不够组成句子",
      "sent.empty.s"     : "一个句子至少要两个词。<br>先写几个。",
      "sent.weave"       : "编织",
      "sent.prev"        : "前移",
      "sent.later"       : "后移 →",
      "sent.remove"      : "把这个词拿出来",
      "sent.taphint"     : "点一个词，可以挪动它，或把它拿出来。",
      "sent.palhint"     : "在下面选词，它们会排到这里。想放多少个都行，同一个词也可以重复。",
      "sent.undo"        : "撤回一个",
      "sent.clear"       : "清空",
      "sent.reads"       : "念出来，这一句是",
      "sent.say"         : "▶ 念出来",
      "sent.linkhint"    : "在句子里放一个以元音开头的词，它前面的辅音就会连过来，两者合成一口气。",
      "sent.keep"        : "留下这个句子",
      "sent.need2"       : "排上两个以上的词，就能听见它们如何相接。",
      "sent.choose"      : "选词",
      "sent.search"      : "搜索拼写或词义",
      "sent.nomatch"     : "没有找到。",
      "sent.nomean"      : "没有词义",
      "sent.order"       : "语序（这门语言的一条规律）",
      "order.SOV.lab"    : "主语 → 宾语 → 动词",
      "order.SOV.ex"     : "日语和土耳其语在这里。“我 星 看见。”",
      "order.SVO.lab"    : "主语 → 动词 → 宾语",
      "order.SVO.ex"     : "英语在这里。“我 看见 星。”",
      "order.VSO.lab"    : "动词 → 主语 → 宾语",
      "order.VSO.ex"     : "阿拉伯语和爱尔兰语在这里。“看见 我 星。”",
      "sent.chk.ok"      : "这一句念作 <b>{0}</b>——正是你选的语序。",
      "sent.chk.ng"      : "这一句念作 <b>{0}</b>，而你选的语序是 <b>{1}</b>。",
      "sent.chk.fix"     : "按我选的语序排好",
      "sent.chk.hint"    : "排上主语、宾语和动词，Lingua 会拿你的规律来对照。<br>换成别的排法也没关系。规律是指引，不是围栏。",
      "sent.kept"        : "留下的句子",
      "sent.listen"      : "听一听",
      "sent.reweave"     : "重新编织",
      "sent.drop"        : "删除",
      "sent.footer"      : "读音，以及词与词如何连起来，都是在这台设备里算出来的。",
      "toast.need2"      : "至少排上两个词",
      "toast.kept"       : "句子已留下",
      "toast.dropped"    : "已删除",
      "toast.reordered"  : "已按你选的语序排好",
      "make.rule"        : "沿用你目前的{0}规律——它们以 <span style=\"color:var(--gold)\">-{1}</span> 结尾。",
      "make.norule"      : "{0}还没有定下的规律，所以这些词只用你已经在用的音造出来。",
      "make.empty.t"     : "还没有足够的依据",
      "make.empty.s"     : "先自己写几个词。<br>Lingua 会照着它们的声音来仿。",
      "make.left"        : "免费方案还剩 {0} 个词。",
      "make.left.1"      : "免费方案还剩一个词。",
      "make.lock.t"      : "一次要来一整批",
      "make.lock.d"      : "“三十个关于海的词”——它们就来了",
      "make.reroll"      : "再抽一次",
      "make.commit"      : "加入我选的",
      "toast.noselect"   : "还没有选中任何词",
      "toast.cap"        : "免费方案最多存 {0} 个词",
      "toast.added.n"    : "已加入 {0} 个词。词义可以在词表里补写",
      "toast.added.n.1"  : "已加入一个词。词义可以在词表里补写",
      "set.title"        : "设置",
      "set.look"         : "外观",
      "theme.system"     : "系统",
      "theme.light"      : "浅色",
      "theme.dark"       : "深色",
      "set.theme.note"   : "“系统”会跟随你设备上的设定。",
      "set.reading"      : "读音的显示方式",
      "read.ipa"         : "IPA",
      "read.both"        : "两者",
      "set.sample"       : "示例",
      "set.ipa.note"     : "IPA 是全世界共用的记音方式，让任何人都能把一个音念出来。在 <b style=\"color:var(--tx);font-weight:500\">/ /</b> 之间，<b style=\"color:var(--tx);font-weight:500\">.</b> 是音节的分界，<b style=\"color:var(--tx);font-weight:500\">ː</b> 表示把音拖长。IPA 是精确的那一种；{0} 只是给读得懂它的人的近似写法。",
      "set.display"      : "显示语言",
      "set.display.note" : "界面和你的词的读音都跟随这里。IPA 不跟随——它在任何语言里都一样。中文用汉字音译，日语用片假名，英语用 <b style=\"color:var(--tx);font-weight:500\">AY-leen</b> 这样的音译，大写标出重音。默认跟随你的设备。",
      "set.voice"        : "语音",
      "set.voice.cur"    : "正在使用的语音",
      "set.voice.none"   : "未找到",
      "set.voice.pick"   : "选择语音",
      "set.voice.auto"   : "自动选择",
      "set.voice.wait"   : "这台设备上的语音列表还没有载入。在任意一处按一次“▶ 听一听”，它就会出现。",
      "set.voice.try"    : "试一试",
      "set.voice.note"   : "如果没有声音，先看看手机侧面的静音开关，再看看音量。仍然不响的话，换上面列表里的另一个语音，往往就好了。意大利语和西班牙语的语音元音朴素而均匀，通常很适合一门自造的语言。",
      "set.lang"         : "语言",
      "set.name"         : "名字",
      "set.count"        : "词数",
      "set.plan"         : "方案",
      "set.plan.cur"     : "当前方案",
      "set.data"         : "数据",
      "set.csv.out"      : "导出为 CSV",
      "set.csv.in"       : "从 CSV 导入",
      "set.cloud"        : "云端备份",
      "set.on"           : "已开启",
      "set.lock.csv.t"   : "CSV 导入与导出",
      "set.lock.csv.d"   : "把你在表格里做好的一批词倒进来",
      "set.lock.cloud.t" : "云端备份",
      "set.lock.cloud.d" : "换了新手机也还在；多台设备共用一部词典",
      "set.wipe"         : "清除全部，从头开始",
      "set.footer"       : "Lingua · 你的词都存在这台设备上。",
      "set.footer.free"  : " 免费方案从不联网。",
      "confirm.wipe"     : "清除你造过的每一个词，从头开始？",
      "plans.title"      : "方案",
      "plans.intro"      : "造一门语言是免费的，而且会一直免费。<br>要花钱的，是把它存得很多，以及与 AI 一同思考。",
      "plan.cur"         : "当前",
      "plan.tofree"      : "回到免费",
      "plan.choose"      : "选择这个方案",
      "plans.note"       : "付款还没有接通。目前这里只会切换界面显示的内容。",
      "plan.free.1"      : "每一个词都亲手来造——全部",
      "plan.free.2"      : "规律替你找出，读音替你推出",
      "plan.free.3"      : "显示连读，并且念出来",
      "plan.free.4"      : "成批造出守着你规律的词",
      "plan.free.5"      : "存在设备上 · 最多 100 个词",
      "plan.plus.1"      : "词数不限",
      "plan.plus.2"      : "云端备份（换新手机，多台设备）",
      "plan.plus.3"      : "以 CSV 导入与导出词",
      "plan.plus.4"      : "Free 的全部",
      "plan.studio.1"    : "与 AI 一同工作（由词义得形状、语法、例句）",
      "plan.studio.2"    : "由一个主题生出一整套词汇",
      "plan.studio.3"    : "Plus 的全部",
      "plan.price.free"  : "$0",
      "plan.price.plus"  : "$9 / 月",
      "plan.price.studio": "$19 / 月",
      "toast.plan.free"  : "已回到免费方案",
      "toast.plan.other" : "（模拟）已切换到 {0}",
      "add.title"        : "写一个词",
      "add.note"         : "读音是从你写下的拼写推算出来的。",
      "f.spelling"       : "拼写",
      "f.reading"        : "读音",
      "f.listen"         : "听一听",
      "f.meaning"        : "词义",
      "f.meaning.ph"     : "星",
      "f.pos"            : "词性",
      "add.btn"          : "加入",
      "add.lock.t"       : "为一个意思谈出一个形状",
      "add.lock.d"       : "“我想要一个像静止一样的词”",
      "toast.hw2"        : "拼写至少要两个字母",
      "toast.dup"        : "这个词已经有了",
      "toast.added.1"    : "已加入 {0}",
      "word.syl"         : "音节划分",
      "word.note"        : "{0} 个音节。读音就是从这些分界里落出来的。<br>上面是 IPA；下面是给{1}读者看的大致读音（{2}）。",
      "word.note.1"      : "一个音节。读音就是从拼写里落出来的。<br>上面是 IPA；下面是给{1}读者看的大致读音（{2}）。",
      "word.edit"        : "修改",
      "word.mn.ph"       : "还没想好",
      "word.save"        : "保存",
      "word.del"         : "删除这个词",
      "confirm.del"      : "删除 {0}？",
      "toast.saved"      : "{0} 已更新",
      "toast.deleted"    : "{0} 已删除",
      "csv.title"        : "从 CSV 导入",
      "csv.note"         : "每行一个词：拼写、词义、词性。有表头行也可以。",
      "csv.ph"           : "Aelin,星,名词&#10;Naeth,水,名词",
      "csv.btn"          : "导入",
      "toast.exported"   : "已导出",
      "toast.exportfail" : "导出失败",
      "toast.imported"   : "已导入 {0} 个词",
      "toast.imported.1" : "已导入一个词",
      "tts.none"         : "这台设备无法朗读",
      "tts.err"          : "没有声音。可以在“设置 → 语音”里另选一个",
      "tts.fail"         : "无法朗读",
      "read.sep"         : "　"
    }
  };
})());
