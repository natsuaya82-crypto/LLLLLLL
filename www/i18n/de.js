/* Lingua — the interface in Deutsch (de).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- de — Deutsch ------------------------------------------------------ */
defLang('de', (function(){
  /* ------------------------------------------------------------------
     Lingua — reading approximation for German (de)
     Lautschreibung: the invented word respelled with German spelling
     conventions so a German reader lands on the IPA.
     Plain ES5. Globals suffixed _de / prefixed _de_ to avoid collisions.
     ------------------------------------------------------------------ */

  /* One source consonant unit -> its German letters.
     Deliberate choices, all forced by how German reads letters:
       v -> w   (German <v> is /f/, <w> is /v/)
       w -> w   (German has no /w/; a German says /v/ for it)
       z -> s   (German <z> is /ts/; /z/ is written <s> before a vowel)
       s -> handled separately (needs <ss>, see _de_s below)
       sh -> sch,  ch -> tsch,  th -> t  (no /0/ in German, <th> reads /t/)
       x -> x   (German <x> is already /ks/)                              */
  var DE_C = {
    b:'b', c:'k', ch:'tsch', d:'d', f:'f', g:'g', h:'h', j:'j', k:'k',
    l:'l', m:'m', n:'n', p:'p', q:'k', r:'r', s:'s', sh:'sch', t:'t',
    th:'t', v:'w', w:'w', x:'x', y:'j', z:'s'
  };

  function _de_c(u){ return DE_C.hasOwnProperty(u) ? DE_C[u] : u; }

  /* /s/ is the awkward one. German <s> is /z/ before a vowel, and /S/
     word-initially before t and p. <ss> is unambiguously /s/ everywhere,
     so /s/ is written <ss> whenever it is prevocalic or stands before
     t/p, and plain <s> otherwise (before other consonants and in codas,
     where German <s> is already /s/). */
  function _de_s(nextSpelled){
    if(nextSpelled === '') return 'ss';                      /* prevocalic */
    var f = nextSpelled.charAt(0);
    if(f === 't' || f === 'p') return 'ss';                  /* kills st-/sp- = /St/ /Sp/ */
    return 's';
  }

  function _de_onset(on){
    var u = splitC(on), out = '', i, nx;
    for(i = 0; i < u.length; i++){
      if(u[i] === 's'){
        nx = (i + 1 < u.length) ? _de_c(u[i + 1]) : '';
        out += _de_s(nx);
      } else {
        out += _de_c(u[i]);
      }
    }
    return out;
  }

  /* Codas: German <s> in a coda is already /s/, so no doubling needed.
     German has no geminates, so a doubled coda consonant is collapsed —
     <nn> after a long-vowel spelling would otherwise fight the length. */
  function _de_coda(co){
    var u = splitC(co), out = '', i, sp;
    for(i = 0; i < u.length; i++){
      /* a coda h is silent in German anyway, and <ph> would read /f/ */
      if(u[i] === 'h' && out !== '') continue;
      sp = _de_c(u[i]);
      if(out !== '' && out.charAt(out.length - 1) === sp.charAt(0) && sp.length === 1) continue;
      out += sp;
    }
    return out;
  }

  /* Vowel pairs German reads as a single fixed sound. Any of these turning
     up across a hiatus would hijack both vowels, so a <j> is wedged in. */
  var DE_HIJACK = { ae:1, oe:1, ue:1, ie:1, ei:1, eu:1 };

  /* Nucleus.
       i  alone  -> <ie>   (<i> alone is lax /I/)
       e  always -> <eh>   (<e> is /E/ when closed and /@/ when unstressed;
                            German never reduces <eh>, and it also blocks
                            the <ei> and <eu> digraphs for free)
       a o u     -> plain, + <h> when long (<ah> <oh> <uh>)
       in a hiatus i is written bare <i>, which German reads tense anyway  */
  function _de_nucleus(nu){
    var v = String(nu).replace(/y/g, 'i');
    var units = [], i = 0, ch, n;
    while(i < v.length){
      ch = v.charAt(i); n = 0;
      while(i < v.length && v.charAt(i) === ch){ n++; i++; }
      units.push([ch, n > 1]);
    }
    var solo = units.length === 1, out = '', k, c, lg, sp, pair;
    for(k = 0; k < units.length; k++){
      c = units[k][0]; lg = units[k][1];
      if(c === 'e')      sp = 'eh';
      else if(c === 'i') sp = solo ? 'ie' : (lg ? 'ih' : 'i');
      else               sp = lg ? c + 'h' : c;
      if(out !== ''){
        pair = out.charAt(out.length - 1) + sp.charAt(0);
        if(DE_HIJACK[pair]) sp = 'j' + sp;
      }
      out += sp;
    }
    return out;
  }

  function syl_de(p){
    var on = _de_onset(p.on || '');
    var nu = _de_nucleus(p.nu || '');
    var co = _de_coda(p.co || '');
    /* German reads <ti> + vowel as /tsi̯/ (Nation). <th> is also /t/ and
       is safe there, so a t before a rising i-hiatus is written <th>. */
    if(on.charAt(on.length - 1) === 't' && /^i[aou]/.test(nu)){
      on = on.substring(0, on.length - 1) + 'th';
    }
    return on + nu + co;
  }

  function word_de(ps){
    var out = [], i;
    for(i = 0; i < ps.length; i++) out.push(syl_de(ps[i]));
    if(out.length) out[0] = out[0].toUpperCase();
    var w = out.join('-');
    /* safety net: a bare final <e> is schwa in German. <ie> is exempt —
       there the e is the length mark of /iː/, not a vowel of its own. */
    if(w.charAt(w.length - 1) === 'e' && w.substring(w.length - 2) !== 'ie') w += 'h';
    return w;
  }

  return {
    label  : "Deutsch",
    rdName : "Lautschreibung",
    all    : "alle",
    pos    : {n:"Substantiv", v:"Verb", adj:"Adjektiv", x:"andere"},
    read   : mkApprox(word_de, syl_de),
    str    : {
      "ai.a.home"                 : "Du hast {0} Wörter und {1} Laute. Am schnellsten kommst du mit mehr Wörtern weiter — Regeln entstehen daraus.",
      "ai.a.make"                 : "Die Wortbildung folgt deinen bisherigen Lauten, neue Wörter wirken also verwandt. Behalte, was für dich stimmig klingt.",
      "ai.a.rules"                : "Bisher sind {0} Regeln aufgetaucht. Bleib bei denselben Gewohnheiten, dann schärfen sie sich von selbst.",
      "ai.a.sent"                 : "Du hast {0} Sätze. Schreib denselben Gedanken zweimal — im Unterschied wohnt deine Grammatik.",
      "ai.a.sound"                : "Du nutzt {0} Laute: {1}. Ein kleines, konsequentes Inventar klingt echter als ein großes, beliebiges.",
      "ai.a.words"                : "Dein Lexikon hat {0} Wörter. Präge Wörter für das, worüber du wirklich sprichst; eine Sprache wächst im Gebrauch.",
      "ai.ask"                    : "Berater fragen",
      "ai.hint"                   : "Der Berater liest deine Sprache und antwortet daraus.",
      "ai.left"                   : "Heute noch {0}",
      "ai.limit.s"                : "Plus gibt dir jeden Tag unbegrenzte Beratung.",
      "ai.limit.t"                : "Die Fragen für heute sind aufgebraucht",
      "ai.see"                    : "Tarife ansehen",
      "ai.title"                  : "Sprachberater",
      "ai.unl"                    : "Unbegrenzt",
      "cap.warn"                  : "Noch {0} Wörter in Gratis",
      "ch.clear"                  : "Kein Zeichen",
      "ch.for"                    : "Ein Zeichen für „{0}“",
      "count.script"              : "{0} von {1}",
      "lock.ai"                   : "Unbegrenzte Beratung",
      "lock.export"               : "Export & Sicherung",
      "lock.sync"                 : "Cloud-Sync",
      "lock.t"                    : "Plus-Funktion",
      "ob.back"                   : "Zurück",
      "add.ph"                    : "Laute dieser Sprache",
      "add.ph.none"               : "Diese Sprache hat noch keine Laute. Wähle welche, dann lassen sich Wörter daraus bauen.",
      "ipa.b.back"                : "hinten",
      "ipa.b.central"             : "zentral",
      "ipa.b.front"               : "vorne",
      "ipa.cons"                  : "Konsonanten",
      "ipa.footer"                : "Ein Zeichen bedeutet denselben Laut für jeden, der die Tafel liest. Wie du ihn nennst und womit du ihn schreibst, gehört dir.",
      "ipa.h.close"               : "geschlossen",
      "ipa.h.closemid"            : "halbgeschl.",
      "ipa.h.mid"                 : "mittel",
      "ipa.h.nearclose"           : "fast geschl.",
      "ipa.h.nearopen"            : "fast offen",
      "ipa.h.open"                : "offen",
      "ipa.h.openmid"             : "halboffen",
      "ipa.m.approx"              : "Approximant",
      "ipa.m.fricative"           : "Frikativ",
      "ipa.m.latapprox"           : "lat. Approx.",
      "ipa.m.latfric"             : "lat. Frik.",
      "ipa.m.nasal"               : "Nasal",
      "ipa.m.plosive"             : "Plosiv",
      "ipa.m.tap"                 : "Getippt",
      "ipa.m.trill"               : "Vibrant",
      "ipa.mine"                  : "Diese Sprache nutzt",
      "ipa.letters"               : "Tippe einen Laut an, um seinen Buchstaben zu zeichnen oder einen auszuleihen.",
      "ipa.mine.none"             : "Noch nichts gewählt.",
      "ipa.note"                  : "Wähle die Laute, aus denen diese Sprache besteht. Nur ein hier gewählter Laut kann einen Buchstaben bekommen.",
      "ipa.other"                 : "Außerdem",
      "ipa.p.alveolar"            : "alveolar",
      "ipa.p.bilabial"            : "bilabial",
      "ipa.p.dental"              : "dental",
      "ipa.p.glottal"             : "glottal",
      "ipa.p.labiodental"         : "labiodental",
      "ipa.p.palatal"             : "palatal",
      "ipa.p.pharyngeal"          : "pharyngal",
      "ipa.p.postalveolar"        : "postalveolar",
      "ipa.p.retroflex"           : "retroflex",
      "ipa.p.uvular"              : "uvular",
      "ipa.p.velar"               : "velar",
      "ipa.vows"                  : "Vokale",
      "home.new.t"                : "Der erste Buchstabe steht.",
      "home.new.s"                : "Ein paar mehr und deine Wörter lassen sich damit schreiben.",
      "next.sc0"                  : "Zeichne den nächsten Buchstaben",
      "set.account"               : "Konto",
      "set.account.note"          : "Ein Konto trägt eine Sprache von diesem Telefon fort. Hier braucht es keines.",
      "set.account.soon"          : "Noch nicht angeschlossen.",
      "ob.borrow.h"               : "Wähle eine Schrift zum Ausleihen.",
      "ob.borrow.sub"             : "Du kannst später immer noch einen eigenen zeichnen.",
      "ob.borrow.take"            : "Tippe ein Zeichen an, um es zu nehmen.",
      "ob.door.h"                 : "Die Tür trägt jetzt deinen Buchstaben.",
      "ob.door.note"              : "Kein Name, kein Konto. Das hat Zeit.",
      "ob.draw.done"              : "Fertig",
      "ob.draw.empty"             : "Zeichne zuerst einen Strich.",
      "ob.draw.h"                 : "Zeichne den ersten Buchstaben<br>deiner Sprache.",
      "ob.draw.sub"               : "Was auch immer. Er gehört dir.",
      "ob.lang.a"                 : "Sprache der Oberfläche",
      "ob.open"                   : "Die Tür öffnen",
      "ob.or"                     : "Oder beginne mit einer Schrift, die es schon gibt",
      "ob.snd.h"                  : "Wie klingt dieser Buchstabe?",
      "ob.snd.note.borrow"        : "Geliehene Formen, deine Laute. Nichts hier muss bedeuten, was es dort bedeutet, wo du es gefunden hast.",
      "ob.snd.note.draw"          : "Der Buchstabe kommt in dein Alphabet und der Laut in dein Inventar.",
      "ob.enter"                  : "Los geht's",
      "ob.lang.h"                 : "Wähle deine Sprache",
      "ob.name.auto"              : "Für mich auswählen",
      "ob.name.h"                 : "Wie heißt<br>deine Sprache?",
      "ob.name.mini"              : "Du kannst das jederzeit ändern.",
      "ob.name.ph"                : "z. B. Aelira",
      "ob.signin.apple"           : "Mit Apple fortfahren",
      "ob.signin.google"          : "Mit Google fortfahren",
      "ob.signin.note"            : "Melde dich an, um zu beginnen.",
      "ob.signin.skip"            : "Ohne Konto fortfahren",
      "ob.signin.local"           : "Ohne eines bleibt deine Sprache auf diesem Telefon, und das Web kann sie nicht sehen.",
      "ob.tagline"                : "Verleih deinen Worten neue Farben.",
      "script.none2"              : "Noch keine Zeichen",
      "script.none2s"             : "Wähle unten eine Schrift oder tippe ein eigenes Zeichen.",
      "script.own.ph"             : "Zeichen einfügen oder tippen",
      "script.set"                : "Setzen",
      "snd.have"                  : "Schon in deiner Sprache",
      "sug.ask"                   : "Fällt dir nichts ein?",
      "sug.for"                   : "Formen für „{0}“ — tippe eine an, um sie zu behalten.",
      "sug.hint"                  : "Aus den Lauten gebaut, die du schon nutzt — tippe eines an, um es zu behalten.",
      "sug.left"                  : "Heute noch {0}",
      "sug.more"                  : "Andere Vorschläge",
      "sug.out"                   : "Für heute keine Vorschläge mehr. Mit Plus geht es weiter.",
      "up.cta"                    : "Upgraden",
      "ws.arabic"                 : "Arabisch",
      "ws.armenian"               : "Armenisch",
      "ws.cyrillic"               : "Kyrillisch",
      "ws.devanagari"             : "Devanagari",
      "ws.geez"                   : "Ge’ez",
      "ws.georgian"               : "Georgisch",
      "ws.glagolitic"             : "Glagolitisch",
      "ws.greek"                  : "Griechisch",
      "ws.hangul"                 : "Hangul",
      "ws.hebrew"                 : "Hebräisch",
      "ws.ogham"                  : "Ogham",
      "ws.phoenician"             : "Phönizisch",
      "ws.runic"                  : "Runen",
      "ws.thai"                   : "Thai",
      "ws.tibetan"                : "Tibetisch",
      "ob.start"         : "Beginnen",
      "seed.star"        : "Stern",
      "seed.water"       : "Wasser",
      "seed.wind"        : "Wind",
      "seed.light"       : "Licht",
      "seed.forest"      : "Wald",
      "seed.sky"         : "Himmel",
      "seed.love"        : "lieben",
      "seed.walk"        : "gehen",
      "lang.default"     : "Meine Sprache",
      "nav.contents"     : "Inhalt",
      "nav.settings"     : "Einstellungen",
      "home.kicker"      : "Deine Sprache",
      "home.unnamed"     : "Benennen",
      "home.name.prompt" : "Name der Sprache",
      'next.t'   : "Als Nächstes",
      'next.w0'  : "Präge dein erstes Wort",
      'next.w1'  : "Füge Wörter hinzu — noch {0} bis Regeln erscheinen",
      'next.s0'  : "Schreibe deinen ersten Satz",
      'next.mk'  : "Bilde Wörter aus deinen eigenen Lauten",
      "toc.words"        : "Lexikon",
      "toc.sound"        : "Phonologie",
      "toc.gram"         : "Grammatik",
      "toc.sent"         : "Sätze",
      "toc.make"         : "Wortbildung",
      /* the writing system */
      "script.preview"    : "Deine Schrift",
      "script.show.roman" : "Lateinisch",
      "script.show.own"   : "Deinen Buchstaben",
      /* the letter editor */
      "glyph.circle"      : "Runden",
      "glyph.new"         : "Neu",
      "glyph.undo"        : "Zurück",
      "glyph.clear"       : "Leeren",
      "glyph.cancel"      : "Abbrechen",
      "glyph.save"        : "Sichern",
      "glyph.saved"       : "{0} gesichert",
      "count.words"      : "{0} Wörter",
      "count.words.1"    : "1 Wort",
      "count.sounds"     : "{0} Laute",
      "count.sounds.1"   : "1 Laut",
      "count.gram"       : "{0} entschieden",
      "count.gram.1"     : "1 entschieden",
      "count.lines"      : "{0} Zeilen",
      "count.lines.1"    : "1 Zeile",
      "home.empty.t"     : "Noch kein Wort",
      "home.empty.s"     : "Es beginnt mit einem einzigen Wort.<br>Schreib die Schreibweise; die Aussprache folgt von selbst.",
      "home.empty.btn"   : "Erstes Wort schreiben",
      "home.recent.line" : "Letzter Satz",
      "home.recent.word" : "Zuletzt geschrieben",
      "home.write"       : "Wort schreiben",
      "words.search"     : "Schreibweise, Bedeutung, Aussprache suchen",
      "words.nomatch"    : "Nichts gefunden",
      "words.empty"      : "Noch keine Wörter",
      "sound.used"       : "Konsonanten in Gebrauch",
      "sound.unused"     : "Ungenutzte Konsonanten",
      "sound.none"       : "Noch keine.",
      "sound.note"       : "Die Laute, die eine Sprache verweigert, gehören ebenso zu ihr wie die, die sie behält.<br>Das kleine Zeichen unter jedem Buchstaben ist das Internationale Phonetische Alphabet: ein Zeichen für einen Laut, in jeder Sprache der Erde.",
      "sound.vowels"     : "Vokale",
      "sound.together"   : "Zusammen gesprochen",
      "link.yes"         : "der letzte Konsonant läuft ins nächste Wort",
      "link.no"          : "jedes Wort bleibt für sich",
      "sound.listen"     : "Hören",
      "sound.linkhint"   : "Schreib ein Wort, das mit einem Vokal beginnt, und der Konsonant davor läuft hinüber, sodass die beiden ein Atemzug werden.",
      "sound.footer"     : "Alles davon wird in deinem Gerät gerechnet. Kein Netz, keine KI.",
      /* grammar — the decisions */
      "gram.note"        : "Das sind Entscheidungen, keine Beobachtungen. Jede ändert, wie deine Wörter herauskommen, und du kannst die Änderung hören.",
      "gram.order.t"     : "Wortstellung",
      "gram.order.d"     : "Was zuerst kommt: wer es tut, wen es trifft und das Tun selbst.",
      "gram.role.S"      : "wer tut",
      "gram.role.O"      : "wen es trifft",
      "gram.role.V"      : "das Tun",
      "gram.adj.t"       : "Wo ein Eigenschaftswort steht",
      "gram.adj.d"       : "Vor dem, was es beschreibt, oder dahinter.",
      "gram.num.t"       : "Mehr als eins",
      "gram.num.d"       : "Wie ein Wort sagt, dass es mehr als eins von etwas gibt — oder eben gar nichts sagt, was viele Sprachen so halten.",
      "gram.past.t"      : "Schon geschehen",
      "gram.past.d"      : "Was ein Tuwort tut, wenn das Tun vorbei ist.",
      "gram.neg.t"       : "Nein sagen",
      "gram.neg.d"       : "Wie die Sprache aufhebt, was der Rest der Zeile sagt.",
      "gram.q.t"         : "Fragen",
      "gram.q.d"         : "Was aus etwas Gesagtem etwas Gefragtes macht.",
      "gram.poss.t"      : "Gehören",
      "gram.poss.d"      : "Wie die Sprache sagt, dass eine Sache einer anderen gehört.",
      "gram.how.none"    : "Nicht markiert",
      "gram.how.suffix"  : "Am Ende",
      "gram.how.prefix"  : "Am Anfang",
      "gram.how.redup"   : "Zweimal gesagt",
      "gram.how.before"  : "Wort davor",
      "gram.how.after"   : "Wort danach",
      "gram.how.start"   : "Wort am Anfang",
      "gram.how.end"     : "Wort am Ende",
      "gram.piece"       : "Der Laut, der es trägt",
      "gram.piece.none"  : "nicht gewählt",
      "gram.piece.h"     : "Welcher Laut es trägt",
      "gram.piece.d"     : "Aus den Lauten gebaut, die diese Sprache hat, genau wie ein Wort. Das ist es, was „{0}“ markiert.",
      "gram.piece.set"   : "Diesen nehmen",
      "gram.demo.need"   : "Schreib ein paar Wörter mehr, dann zeigt sich hier, wie sie sich ändern.",
      "gram.pair.one"    : "eins",
      "gram.pair.many"   : "viele",
      "gram.pair.now"    : "jetzt",
      "gram.pair.past"   : "früher",
      "gram.pair.yes"    : "ja",
      "gram.pair.no"     : "nein",
      "gram.pair.say"    : "sagen",
      "gram.pair.ask"    : "fragen",
      "gram.pair.plain"  : "allein",
      "gram.pair.owned"  : "gehört",
      "gram.pair.phrase" : "Wortgruppe",
      "gram.pair.line"   : "Zeile",
      "gram.seen"        : "Was deine Wörter schon tun",
      "gram.footer"      : "Nichts davon liegt fest. Ändere eine Entscheidung, und jedes Beispiel auf diesem Bildschirm ändert sich mit.",
      "sent.order.d"     : "Im Kapitel Grammatik entschieden. Hier wird sie nur genutzt, um zu prüfen, was du gewebt hast.",
      /* the notebook */
      "toc.notes"        : "Notizen",
      "count.notes"      : "{0} Notizen",
      "count.notes.1"    : "1 Notiz",
      "notes.note"       : "Alles an dieser Sprache, was kein Wort, kein Laut und keine Entscheidung ist. Es bleibt mit dem Rest auf diesem Gerät.",
      "notes.new"        : "Neue Notiz",
      "notes.edit"       : "Diese Notiz",
      "notes.t"          : "Überschrift",
      "notes.t.ph"       : "optional",
      "notes.b"          : "Notiz",
      "notes.b.ph"       : "Wer sie spricht. Warum ein Wort auch ein anderes ist. Alles, was du sonst bis morgen vergessen hättest.",
      "notes.save"       : "Behalten",
      "notes.del"        : "Diese Notiz löschen",
      "notes.untitled"   : "Ohne Titel",
      "notes.empty.t"    : "Noch nichts aufgeschrieben",
      "notes.empty.s"    : "Das meiste, was du über eine Sprache im Entstehen weißt, hat noch keine Form. Hierher gehört es.",
      "notes.footer"     : "Reiner Text, auf diesem Gerät verwahrt. Nichts davon wird vom Rest der App gelesen.",
      "toast.note.kept"  : "Notiz behalten",
      "toast.note.gone"  : "Notiz gelöscht",
      "confirm.note.del" : "Diese Notiz löschen?",
      /* the conversation */
      "toc.talk"         : "Gespräch",
      "count.turns"      : "{0} Gesprächszüge",
      "count.turns.1"    : "1 Gesprächszug",
      "talk.knows"       : "Es hat diese ganze Sprache gelesen: {0} Wörter, {1} Laute, {2} Entscheidungen. Es spricht sonst nichts.",
      "talk.first"       : "Wähl unten ein paar deiner Wörter und schick sie ab. Es antwortet in deiner Sprache.",
      "talk.compose"     : "Was du sagst",
      "talk.send"        : "Sagen",
      "talk.wipe"        : "Dieses Gespräch leeren",
      "talk.empty.t"     : "Noch nichts, womit sich reden lässt",
      "talk.empty.s"     : "Ein Gespräch braucht mindestens ein Ding und ein Tun.<br>Schreib zuerst ein Substantiv und ein Verb.",
      "talk.footer"      : "Seine Zeilen sind aus deinen Wörtern gebaut, in deiner Stellung, mit deinen Markierungen daran. Alles davon wird in diesem Gerät gerechnet — nichts wird irgendwohin geschickt.",
      "confirm.talk.clear": "Das ganze Gespräch leeren?",
      /* rules */
      "rules.intro"      : "Gewohnheiten, gefunden durch Zählen der {0} Wörter, die du geschrieben hast. Nicht beschlossen — entdeckt.",
      "rules.intro.1"    : "Gewohnheiten, gefunden durch Zählen des einen Wortes, das du geschrieben hast. Nicht beschlossen — entdeckt.",
      "rules.empty.t"    : "Noch keine Regeln",
      "rules.empty.s"    : "Schreib zuerst ein paar Wörter.",
      "rules.next"       : "Nächstes: {0}",
      "find.final.t"     : "{0}: Endung <em>-{1}</em>",
      "find.final.d"     : "{1} von {0} tun das. Neue Wörter können dieselbe Form halten.",
      "find.cons.t"      : "Konsonanten, die jetzt klingen: <em>{0}</em>",
      "find.cons.d"      : "Dein Lautbestand über {0} Wörter. Nimm einen dazu, der hier fehlt, und die ganze Sprache wechselt die Farbe.",
      "find.vow.t"       : "Nur <em>{0}</em> — {1} insgesamt",
      "find.vow.d"       : "Je weniger Vokale, desto mehr klingt die Sprache aus einem Guss. Du kannst sie jederzeit weiten.",
      "find.syl.t"       : "Wörter laufen auf <em>{0} Silben</em>",
      "find.syl.t.1"     : "Wörter laufen auf <em>eine Silbe</em>",
      "find.syl.d"       : "{1} von {0} Wörtern. Gleichmäßige Längen lassen eine Sprache gesprochen klingen statt zusammengesetzt.",
      "find.coda.t"      : "Wörter enden immer nur auf <em>{0}</em>",
      "find.coda.d"      : "Je enger diese Liste, desto sauberer fügen sich Wörter, wenn du sie hintereinander sprichst.",
      "find.unused.t"    : "<em>{0}</em> kommen nie vor",
      "find.unused.d"    : "Laute zu haben, die du nie benutzt, ist selbst eine Handschrift.",
      "hint.pos"         : "Schreib {0} weitere {1}, und eine Regel — wie ein {1} endet — kommt zum Vorschein.",
      "hint.pos.1"       : "Schreib ein weiteres {1}, und eine Regel — wie ein {1} endet — kommt zum Vorschein.",
      "hint.more"        : "Je mehr Wörter es gibt, desto mehr Regeln gibt es zu finden.",
      "sent.empty.t"     : "Zu wenig für einen Satz",
      "sent.empty.s"     : "Ein Satz braucht mindestens zwei Wörter.<br>Schreib zuerst ein paar.",
      "sent.weave"       : "Weben",
      "sent.prev"        : "Früher",
      "sent.later"       : "Später",
      "sent.remove"      : "Wort herausnehmen",
      "sent.taphint"     : "Tipp ein Wort an, um es zu verschieben oder herauszunehmen.",
      "sent.palhint"     : "Wähl unten Wörter, und sie reihen sich hier auf. Beliebig viele, und dasselbe Wort so oft du magst.",
      "sent.undo"        : "Eines zurück",
      "sent.clear"       : "Leeren",
      "sent.reads"       : "Laut gelesen klingt diese Zeile so",
      "sent.say"         : "Sprechen",
      "sent.linkhint"    : "Setz ein Wort mit Vokal am Anfang in die Zeile, und der Konsonant davor läuft hinüber, sodass sie ein Atemzug werden.",
      "sent.keep"        : "Satz behalten",
      "sent.need2"       : "Reih zwei oder mehr Wörter auf, um zu hören, wie sie sich fügen.",
      "sent.choose"      : "Wörter wählen",
      "sent.search"      : "Schreibweise oder Bedeutung suchen",
      "sent.nomatch"     : "Nichts gefunden.",
      "sent.nomean"      : "ohne Bedeutung",
      "sent.order"       : "Wortstellung (eine Regel dieser Sprache)",
      "sent.chk.ok"      : "Die Zeile lautet <b>{0}</b> — genau die Stellung, die du gewählt hast.",
      "sent.chk.ng"      : "Die Zeile lautet <b>{0}</b>, gewählt hast du aber <b>{1}</b>.",
      "sent.chk.fix"     : "In meine Stellung bringen",
      "sent.chk.hint"    : "Reih Subjekt, Objekt und Verb auf, und Lingua prüft die Stellung gegen deine Regel.<br>Jede andere Anordnung ist ebenso in Ordnung. Die Regel ist ein Leitfaden, kein Zaun.",
      "sent.kept"        : "Behaltene Sätze",
      "sent.listen"      : "Hören",
      "sent.reweave"     : "Neu weben",
      "sent.drop"        : "Löschen",
      "sent.footer"      : "Die Aussprache und die Art, wie Wörter ineinanderlaufen, werden in diesem Gerät errechnet.",
      "toast.need2"      : "Reih mindestens zwei Wörter auf",
      "toast.kept"       : "Satz behalten",
      "toast.dropped"    : "Gelöscht",
      "toast.reordered"  : "In deine gewählte Stellung gebracht",
      "make.rule"        : "Hält deine aktuelle Regel für {0}: Endung <span style=\"color:var(--gold)\">-{1}</span>.",
      "make.norule"      : "Für {0} hat sich noch keine Regel gesetzt, deshalb entstehen diese nur aus den Lauten, die du schon nutzt.",
      "make.empty.t"     : "Zu wenig Grundlage",
      "make.empty.s"     : "Schreib zuerst selbst ein paar Wörter.<br>Lingua ahmt deren Klang nach.",
      "make.left"        : "Noch {0} Wörter im Tarif Free.",
      "make.left.1"      : "Noch ein Wort im Tarif Free.",
      "make.lock.t"      : "Einen ganzen Satz auf einmal erbitten",
      "make.lock.d"      : "„Dreißig Wörter über das Meer“ — und sie kommen",
      "make.reroll"      : "Neu ziehen",
      "make.commit"      : "Ausgewählte hinzufügen",
      "toast.noselect"   : "Nichts ausgewählt",
      "toast.cap"        : "Der Tarif Free fasst {0} Wörter",
      "toast.added.n"    : "{0} Wörter hinzugefügt. Bedeutungen kannst du in der Wortliste schreiben",
      "toast.added.n.1"  : "Ein Wort hinzugefügt. Seine Bedeutung kannst du in der Wortliste schreiben",
      "set.title"        : "Einstellungen",
      "set.look"         : "Darstellung",
      "theme.system"     : "System",
      "theme.light"      : "Hell",
      "theme.dark"       : "Dunkel",
      "set.theme.note"   : "„System“ folgt dem, worauf dein Gerät eingestellt ist.",
      "set.reading"      : "Darstellung der Aussprache",
      "read.ipa"         : "IPA",
      "read.both"        : "Beides",
      "set.sample"       : "Beispiel",
      "set.ipa.note"     : "Das IPA ist die Art, wie die Welt einen Laut schreibt, damit jeder ihn sprechen kann, und ein Wort steht hier genau darin, zwischen <b style=\"color:var(--tx);font-weight:500\">/ /</b>. {0} ist eine grobe Annäherung daran, zum Lesen und nicht zum Sprechen.",
      "set.display"      : "Anzeigesprache",
      "set.display.note" : "Der Bildschirm und die Aussprache deiner Wörter folgen beide dieser Wahl. Das IPA nicht — es ist in jeder Sprache dasselbe. Katakana für Japanisch, für Englisch eine Lautschreibung im Stil von <b style=\"color:var(--tx);font-weight:500\">AY-leen</b>, wo die Großbuchstaben die Betonung markieren. Die Voreinstellung folgt deinem Gerät.",
      "set.voice.try"    : "Ausprobieren",
      "set.voice.note"   : "Jeder Laut hier wird auf diesem Gerät aus der Tafel selbst gebaut — wie weit der Mund offen ist, wo darin der Laut entsteht, ob die Stimme mitläuft. Keine Stimme deines Telefons wird benutzt, denn die Stimme eines Telefons kann nur eine Sprache sprechen, und das hier ist keine. Wenn nichts zu hören ist, prüf zuerst den Stummschalter an der Seite, dann die Lautstärke.",
      "set.lang"         : "Sprache",
      "set.name"         : "Name",
      "set.count"        : "Wörter",
      "set.plan"         : "Tarif",
      "set.plan.cur"     : "Aktueller Tarif",
      "set.data"         : "Daten",
      "set.csv.out"      : "Als CSV exportieren",
      "set.csv.in"       : "Aus CSV importieren",
      "set.cloud"        : "Cloud-Backup",
      "set.on"           : "An",
      "set.lock.csv.t"   : "CSV-Import und -Export",
      "set.lock.csv.d"   : "Kipp einen Stapel hinein, den du in einer Tabelle gebaut hast",
      "set.lock.cloud.t" : "Cloud-Backup",
      "set.lock.cloud.d" : "Übersteht ein neues Telefon; ein Wörterbuch über alle Geräte",
      "set.wipe"         : "Alles löschen und neu beginnen",
      "set.footer"       : "Lingua · deine Wörter liegen auf diesem Gerät.",
      "set.footer.free"  : " Der Tarif Free rührt das Netz nie an.",
      "confirm.wipe"     : "Jedes Wort löschen, das du gemacht hast, und neu beginnen?",
      "plans.title"      : "Tarife",
      "plans.intro"      : "Eine Sprache zu machen ist kostenlos und bleibt es.<br>Geld kostet nur, sehr viel davon aufzubewahren und neben einer KI zu denken.",
      "plan.cur"         : "aktuell",
      "plan.tofree"      : "Zurück zu Free",
      "plan.choose"      : "Diesen Tarif wählen",
      "plans.note"       : "Die Zahlung ist noch nicht angeschlossen. Vorerst wechselt das nur, was die Bildschirme zeigen.",
      "plan.free.1"      : "Jedes Wort von Hand bauen — alles davon",
      "plan.free.2"      : "Regeln werden gefunden, Aussprache wird abgeleitet",
      "plan.free.3"      : "Bindung sichtbar und laut gelesen",
      "plan.free.4"      : "Wörter in Menge, die deine Regeln halten",
      "plan.free.5"      : "Auf dem Gerät gespeichert · bis zu 100 Wörter",
      "plan.plus.1"      : "Unbegrenzt Wörter",
      "plan.plus.2"      : "Cloud-Backup (neues Telefon, mehrere Geräte)",
      "plan.plus.3"      : "Wörter als CSV importieren und exportieren",
      "plan.plus.4"      : "Alles aus Free",
      "plan.studio.1"    : "Mit einer KI arbeiten (Form aus Bedeutung, Grammatik, Beispiele)",
      "plan.studio.2"    : "Einen ganzen Wortschatz aus einem Thema erzeugen",
      "plan.studio.3"    : "Alles aus Plus",
      "plan.price.free"  : "0 $",
      "plan.price.plus"  : "9 $ / Monat",
      "plan.price.studio": "19 $ / Monat",
      "toast.plan.free"  : "Zurück im Tarif Free",
      "toast.plan.other" : "(Test) gewechselt zu {0}",
      "add.title"        : "Wort schreiben",
      "add.note"         : "Die Aussprache wird aus der Schreibweise errechnet, die du schreibst.",
      "f.spelling"       : "Schreibweise",
      "f.reading"        : "Aussprache",
      "f.listen"         : "Hören",
      "f.meaning"        : "Bedeutung",
      "f.meaning.ph"     : "Stern",
      "f.pos"            : "Wortart",
      "add.btn"          : "Hinzufügen",
      "add.lock.t"       : "Eine Form für eine Bedeutung besprechen",
      "add.lock.d"       : "„Ich will ein Wort, das sich wie Stille anfühlt“",
      "toast.hw2"        : "Eine Schreibweise braucht zwei Buchstaben oder mehr",
      "toast.dup"        : "Dieses Wort gibt es schon",
      "toast.added.1"    : "{0} hinzugefügt",
      "word.syl"         : "Silbengrenzen",
      "word.note"        : "{0} Silben. Oben steht das Wort selbst, in den Lauten, die du gewählt hast.<br>Neben jeder Silbe steht die grobe Aussprache für {1}-Sprecher ({2}); der Knopf spricht sie.",
      "word.note.1"      : "Eine Silbe. Oben steht das Wort selbst, in den Lauten, die du gewählt hast.<br>Daneben steht die grobe Aussprache für {1}-Sprecher ({2}); der Knopf spricht sie.",
      "word.edit"        : "Ändern",
      "word.mn.ph"       : "noch nicht entschieden",
      "word.save"        : "Sichern",
      "word.del"         : "Dieses Wort löschen",
      "confirm.del"      : "{0} löschen?",
      "toast.saved"      : "{0} aktualisiert",
      "toast.deleted"    : "{0} gelöscht",
      "csv.title"        : "Aus CSV importieren",
      "csv.note"         : "Ein Wort pro Zeile: Schreibweise, Bedeutung, Wortart. Eine Kopfzeile ist in Ordnung.",
      "csv.ph"           : "Aelin,Stern,Substantiv&#10;Naeth,Wasser,Substantiv",
      "csv.btn"          : "Importieren",
      "toast.exported"   : "Exportiert",
      "toast.exportfail" : "Export nicht möglich",
      "toast.imported"   : "{0} Wörter importiert",
      "toast.imported.1" : "Ein Wort importiert",
      "read.sep"         : "  "
    }
  };
})());
