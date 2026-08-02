/* Lingua — the interface in Italiano (it).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- it — Italiano ----------------------------------------------------- */
defLang('it', (function(){
  /* ============================================================
     Lingua — lettura italiana (the Italian reading approximation)
     Language code: it.  Entry points: syl_it(p), word_it(ps).

     Principle: the reading is spelled with the twenty-one letters of
     the Italian alphabet only — no j, k, w, x, y. Every consonant is
     chosen by looking at what actually follows it in the finished
     string, because in Italian c, g, sc and s all change value in
     front of a vowel.
     ============================================================ */

  var VOC_IT = 'aeiou';

  function isVoc_it(ch){ return !!ch && VOC_IT.indexOf(ch) >= 0; }

  /* one consonant token or one vowel letter of the source spelling */
  function pushC_it(out, t, i){
    if(t === 'x'){                    /* /ks/ -> c + s, so it can be spelled natively */
      out.push({t:'k', s:i});
      out.push({t:'s', s:i, x:1});    /* x flag: never geminate this s */
    } else {
      out.push({t:t, s:i});
    }
  }

  function units_it(ps){
    var out = [], i, j, u, nu, p;
    for(i = 0; i < ps.length; i++){
      p = ps[i] || {};
      u = splitC(p.on || '');
      for(j = 0; j < u.length; j++) pushC_it(out, u[j], i);
      nu = p.nu || '';
      for(j = 0; j < nu.length; j++) out.push({t:nu.charAt(j), s:i, v:1});
      u = splitC(p.co || '');
      for(j = 0; j < u.length; j++) pushC_it(out, u[j], i);
    }
    return out;
  }

  /* render one unit, knowing the already-rendered tail of the word */
  function ren_it(u, tail, next){
    var t = u.t, f = tail.charAt(0), v;

    if(u.v){                                    /* vowel */
      v = (t === 'y') ? 'i' : t;                /* y is only ever /i/ here */
      if(next && next.v && f === v) return '';  /* aa, uu: no long vowels in Italian spelling */
      return v;
    }

    switch(t){
      /* /k/ — hard before a o u and consonants, needs ch before e i,
         and is written q when a /w/ follows (cu- would also work: qua = cua) */
      case 'k': case 'c': case 'q':
        if(next && next.t === 'w') return 'q';
        return (f === 'e' || f === 'i') ? 'ch' : 'c';

      /* /g/ — same, plus gh to break up gn and gli, which would
         otherwise be read /ɲ/ and /ʎ/ */
      case 'g':
        if(f === 'e' || f === 'i') return 'gh';
        if(next && next.s === u.s){         /* only inside a syllable: a hyphen already splits gn */
          if(f === 'n') return 'gh';
          if(f === 'l' && tail.charAt(1) === 'i') return 'gh';
        }
        return 'g';

      /* /tʃ/ — bare c in front of e i, ci everywhere else (the i is mute) */
      case 'ch':
        return (f === 'e' || f === 'i') ? 'c' : 'ci';

      /* /ʃ/ — sc in front of e i, sci everywhere else */
      case 'sh':
        return (f === 'e' || f === 'i') ? 'sc' : 'sci';

      case 'th': return 't';                    /* no /θ/: Italian says /t/ */
      case 'h':  return 'h';                    /* mute, as it is in every Italian word */
      case 'j':  return (f === 'i') ? '' : 'i'; /* /j/ is written i: ieri, piano */
      case 'w':  return (f === 'u') ? '' : 'u'; /* /w/ is written u: uomo, guado */
      case 'z':  return 's';                    /* z would be the affricate /ts dz/ */
      case 's':  return 's';
      case 'y':  return 'i';
      default:   return t;
    }
  }

  /* ps -> array of syllable strings, lower case, stress not yet marked */
  function render_it(ps){
    var us = units_it(ps), n = us.length, tails = new Array(n),
        tail = '', head = '', out = [], i, k, r;

    for(i = n - 1; i >= 0; i--){
      us[i].r = ren_it(us[i], tail, (i + 1 < n) ? us[i + 1] : null);
      tails[i] = tail;
      tail = us[i].r + tail;
    }

    /* a single s between vowels is read /z/ in Italian, so double the
       ones that must stay voiceless — that is the only way the two
       sibilants can be told apart */
    for(i = 0; i < n; i++){
      if(us[i].t === 's' && !us[i].x && us[i].r === 's' &&
         isVoc_it(head.charAt(head.length - 1)) && isVoc_it(tails[i].charAt(0))){
        us[i].gem = 1;
      }
      head += us[i].r;
    }

    for(i = 0; i < ps.length; i++) out.push('');
    for(i = 0; i < n; i++){
      k = us[i].s;
      r = us[i].r;
      if(us[i].gem){
        /* as-sa, the way Italian divides a double consonant */
        if(out[k] === '' && k > 0) out[k - 1] += 's'; else r = 's' + r;
      }
      out[k] += r;
    }
    return out;
  }

  function syl_it(p){
    return render_it([p])[0] || '';
  }

  function word_it(ps){
    var r = render_it(ps || []), out = [], i;
    for(i = 0; i < r.length; i++) if(r[i] !== '') out.push(r[i]);
    if(!out.length) return '';
    out[0] = out[0].toUpperCase();          /* stress is always the first syllable */
    return out.join('-');
  }

  return {
    label  : "Italiano",
    rdName : "trascrizione figurata",
    all    : "tutte",
    pos    : {n:"sostantivo", v:"verbo", adj:"aggettivo", x:"altro"},
    read   : mkApprox(word_it, syl_it),
    str    : {
      "ai.a.home"                 : "Hai {0} parole e {1} suoni. La via più rapida è creare altre parole: le regole nascono da lì.",
      "ai.a.make"                 : "La coniazione segue i suoni che già usi, così le parole nuove sembreranno imparentate. Tieni quelle che ti suonano giuste.",
      "ai.a.rules"                : "Finora sono emerse {0} regole. Continua con le stesse abitudini e si affineranno da sole.",
      "ai.a.sent"                 : "Hai {0} frasi. Scrivi la stessa idea in due modi: nella differenza vive la tua grammatica.",
      "ai.a.sound"                : "Usi {0} suoni: {1}. Un inventario piccolo e coerente suona più vero di uno ampio e disperso.",
      "ai.a.words"                : "Il tuo lessico ha {0} parole. Conia parole per ciò di cui parli davvero; una lingua cresce con l’uso.",
      "ai.ask"                    : "Consulta",
      "ai.hint"                   : "Il consulente legge la tua lingua e risponde a partire da essa.",
      "ai.left"                   : "Ne restano {0} oggi",
      "ai.limit.s"                : "Con Plus i consigli sono illimitati, ogni giorno.",
      "ai.limit.t"                : "Hai esaurito le domande di oggi",
      "ai.see"                    : "Vedi i piani",
      "ai.title"                  : "Consulente linguistico",
      "ai.unl"                    : "Illimitato",
      "cap.warn"                  : "Restano {0} parole nel piano Gratis",
      "ch.clear"                  : "Nessun carattere",
      "ch.for"                    : "Un carattere per “{0}”",
      "count.script"              : "{0} su {1}",
      "lock.ai"                   : "Consigli illimitati",
      "lock.export"               : "Esportazione e backup",
      "lock.sync"                 : "Sincronizzazione cloud",
      "lock.t"                    : "Funzione Plus",
      "ob.back"                   : "Indietro",
      "add.ph"                    : "I suoni della lingua",
      "add.ph.none"               : "Questa lingua non ha ancora suoni. Scegline alcuni, e con quelli si potranno costruire le parole.",
      "ipa.b.back"                : "posteriore",
      "ipa.b.central"             : "centrale",
      "ipa.b.front"               : "anteriore",
      "ipa.cons"                  : "Consonanti",
      "ipa.footer"                : "Un simbolo vuol dire lo stesso suono per chiunque legga la tavola. Come lo chiami, e con che cosa lo scrivi, è cosa tua.",
      "ipa.h.close"               : "chiusa",
      "ipa.h.closemid"            : "semichiusa",
      "ipa.h.mid"                 : "media",
      "ipa.h.nearclose"           : "quasi chiusa",
      "ipa.h.nearopen"            : "quasi aperta",
      "ipa.h.open"                : "aperta",
      "ipa.h.openmid"             : "semiaperta",
      "ipa.m.approx"              : "approssim.",
      "ipa.m.fricative"           : "fricativa",
      "ipa.m.latapprox"           : "appr. lat.",
      "ipa.m.latfric"             : "fric. lat.",
      "ipa.m.nasal"               : "nasale",
      "ipa.m.plosive"             : "occlusiva",
      "ipa.m.tap"                 : "monovibr.",
      "ipa.m.trill"               : "polivibr.",
      "ipa.mine"                  : "Questa lingua usa",
      "ipa.letters"               : "Tocca un suono per disegnare la sua lettera, o per prenderne una in prestito.",
      "ipa.mine.none"             : "Ancora nulla di scelto.",
      "ipa.note"                  : "Scegli i suoni di cui questa lingua è fatta. Solo un suono scelto qui può ricevere una lettera.",
      "ipa.other"                 : "Inoltre",
      "ipa.p.alveolar"            : "alveolare",
      "ipa.p.bilabial"            : "bilabiale",
      "ipa.p.dental"              : "dentale",
      "ipa.p.glottal"             : "glottidale",
      "ipa.p.labiodental"         : "labiodentale",
      "ipa.p.palatal"             : "palatale",
      "ipa.p.pharyngeal"          : "faringale",
      "ipa.p.postalveolar"        : "postalveol.",
      "ipa.p.retroflex"           : "retroflessa",
      "ipa.p.uvular"              : "uvulare",
      "ipa.p.velar"               : "velare",
      "ipa.vows"                  : "Vocali",
      "home.new.t"                : "La prima lettera c’è.",
      "home.new.s"                : "Ancora qualcuna e le tue parole potranno essere scritte con queste lettere.",
      "next.sc0"                  : "Disegna la lettera successiva",
      "set.account"               : "Account",
      "set.account.note"          : "Un account porta una lingua fuori da questo telefono. Qui non ne serve nessuno.",
      "set.account.soon"          : "Non è ancora collegato.",
      "ob.borrow.h"               : "Scegli una scrittura da cui prendere in prestito.",
      "ob.borrow.sub"             : "Potrai comunque disegnare la tua più avanti.",
      "ob.borrow.take"            : "Tocca un carattere per prenderlo.",
      "ob.door.h"                 : "Ora la porta indossa la tua lettera.",
      "ob.door.note"              : "Nessun nome, nessun account. Possono aspettare.",
      "ob.draw.done"              : "Fatto",
      "ob.draw.empty"             : "Disegna prima un tratto.",
      "ob.draw.sub"               : "Qualsiasi cosa. È tua.",
      "ob.lang.a"                 : "Lingua dell'interfaccia",
      "ob.open"                   : "Apri la porta",
      "ob.or"                     : "Oppure parti da una scrittura che esiste già",
      "ob.enter"                  : "Inizia",
      "ob.name.auto"              : "Scegli tu per me",
      "ob.name.h"                 : "Come si chiama la tua lingua?",
      "ob.name.mini"              : "Puoi cambiarlo quando vuoi.",
      "ob.name.ph"                : "un nome",
      "ob.signin.apple"           : "Continua con Apple",
      "ob.signin.google"          : "Continua con Google",
      "ob.signin.skip"            : "Continua senza account",
      "ob.signin.local"           : "Senza account la tua lingua resta su questo telefono, e il web non può vederla.",
      "ob.tagline"                : "Dai nuovi colori alle tue parole.",
      "script.none2"              : "Ancora nessun carattere",
      "script.none2s"             : "Scegli una scrittura qui sotto, o scrivi un carattere tuo.",
      "script.own.ph"             : "Incolla o scrivi un carattere",
      "script.set"                : "Usa",
      "snd.have"                  : "Già nella tua lingua",
      "sug.ask"                   : "Non ti viene in mente niente?",
      "sug.for"                   : "Forme per “{0}” — tocca per tenerne una.",
      "sug.hint"                  : "Costruite con i suoni che già usi — tocca per tenerne una.",
      "sug.left"                  : "Ne restano {0} oggi",
      "sug.more"                  : "Altre idee",
      "sug.out"                   : "Idee finite per oggi. Con Plus continuano.",
      "up.cta"                    : "Passa a Plus",
      "ws.arabic"                 : "Arabo",
      "ws.armenian"               : "Armeno",
      "ws.cyrillic"               : "Cirillico",
      "ws.devanagari"             : "Devanagari",
      "ws.geez"                   : "Ge'ez",
      "ws.georgian"               : "Georgiano",
      "ws.glagolitic"             : "Glagolitico",
      "ws.greek"                  : "Greco",
      "ws.hangul"                 : "Hangul",
      "ws.hebrew"                 : "Ebraico",
      "ws.ogham"                  : "Ogamico",
      "ws.phoenician"             : "Fenicio",
      "ws.runic"                  : "Runico",
      "ws.thai"                   : "Thai",
      "ws.tibetan"                : "Tibetano",
      "ob.start"         : "Inizia",
      "seed.star"        : "stella",
      "seed.water"       : "acqua",
      "seed.wind"        : "vento",
      "seed.light"       : "luce",
      "seed.forest"      : "foresta",
      "seed.sky"         : "cielo",
      "seed.love"        : "amare",
      "seed.walk"        : "camminare",
      "lang.default"     : "La mia lingua",
      "nav.contents"     : "Indice",
      "nav.settings"     : "Impostazioni",
      "home.kicker"      : "La tua lingua",
      "home.unnamed"     : "Dalle un nome",
      "home.name.prompt" : "Nome della lingua",
      'next.t'   : "Poi",
      'next.w0'  : "Conia la tua prima parola",
      'next.w1'  : "Aggiungi parole — ne mancano {0} per vedere le regole",
      'next.s0'  : "Scrivi la tua prima frase",
      'next.mk'  : "Conia parole dai tuoi suoni",
      "toc.words"        : "Lessico",
      "toc.sound"        : "Fonologia",
      "toc.gram"         : "Grammatica",
      "toc.sent"         : "Frasi",
      "toc.make"         : "Neologia",
      /* what the app proposes */
      "as.soft"         : "Morbido",
      "as.soft.d"       : "Nasali, l e r, vocali pulite. Come il giapponese o l'italiano.",
      "as.hard"         : "Duro",
      "as.hard.d"       : "Occlusive e sibilanti, poche vocali. Come il georgiano o il nahuatl.",
      "as.flowing"      : "Scorrevole",
      "as.flowing.d"    : "Suoni sonori, cinque vocali, quasi niente di tagliente.",
      "as.breathy"      : "Aspirato",
      "as.breathy.d"    : "Fricative e h. Come l'arabo o il gallese.",
      "as.plain"        : "Semplice",
      "as.plain.d"      : "Un insieme piccolo, facile da dire. Come l'hawaiano.",
      "as.hear"         : "Ascoltarli tutti",
      "as.again"        : "Un altro insieme",
      "as.own"          : "Sceglierli io",
      "as.drop"         : "Togliere questo suono",
      "as.more.c"       : "Un'altra consonante",
      "as.more.v"       : "Un'altra vocale",
      "as.more.none"    : "Non ci sono altri suoni da aggiungere.",
      /* the grammar, in stages */
      "stg.list.d"       : "Una grammatica si costruisce a tappe. Ognuna tiene le parole che le servono, le decisioni che porta e una frase che puoi dire quando è finita.",
      "stg.words"        : "Parole che servono a questa tappa",
      "stg.decide"       : "Decidere",
      "stg.note"         : "Note su questa tappa",
      "stg.note.ph"      : "Qualsiasi cosa su questa parte della grammatica.",
      "stg.line"         : "Quello che puoi dire adesso",
      "stg.make"         : "farla",
      "stg.make.d"       : "Tocca i suoni, oppure prendi uno dei suggerimenti.",
      "stg.keep"         : "Tieni questa parola",
      "stg.drop"         : "Elimina questa parola",
      "stg.help"         : "Suggerisci una parola",
      "stg.help.d"       : "Costruita con i suoni che questa lingua ha.",
      "stg.again"        : "Altre",
      "stg.own.add.btn"  : "Aggiungi una tappa tua",
      "stg.own.hint"     : "Forme di cortesia, parentela, direzione — quello che questa lingua finirà per chiedere. Non c'è un limite.",
      "stg.own.h"        : "Una tappa tua",
      "stg.own.d"        : "Dalle un nome ed elenca le parole che le servono — una per riga.",
      "stg.own.title"    : "Nome della tappa",
      "stg.own.title.ph" : "p. es. Forme di cortesia",
      "stg.own.words"    : "Parole che le servono",
      "stg.own.words.ph" : "una per riga\npuoi lasciare vuoto",
      "stg.own.add"      : "Aggiungila",
      "stg.own.need"     : "Dai un nome alla tappa.",
      "stg.own.added"    : "{0} aggiunta",
      "stg.own.untitled" : "Tappa senza nome",
      "stg.own.del"      : "Elimina questa tappa",
      "stg.own.del.ask"  : "Eliminare questa tappa? Le parole che contiene restano nel dizionario.",
      /* the stages */
      "stg.greet.t"      : "Sì, no, ciao",
      "stg.greet.d"      : "Le cose più corte che si possono dire. Una parola ciascuna, e la lingua si può parlare.",
      "stg.greet.yes"    : "sì",
      "stg.greet.no"     : "no",
      "stg.greet.hello"  : "ciao",
      "stg.greet.bye"    : "arrivederci",
      "stg.greet.thanks" : "grazie",
      "stg.pron.t"       : "Io, tu, loro",
      "stg.pron.d"       : "Senza questi non c'è soggetto, e l'ordine delle parole non ha ancora niente da mettere in fila.",
      "stg.pron.i"       : "io",
      "stg.pron.you"     : "tu",
      "stg.pron.he"      : "lui / lei",
      "stg.pron.we"      : "noi",
      "stg.pron.youpl"   : "voi",
      "stg.pron.they"    : "loro",
      "stg.order.t"      : "Ordine delle parole",
      "stg.order.d"      : "Ora che c'è un soggetto, decidi dove va.",
      "stg.num.t"        : "Più di uno",
      "stg.num.d"        : "Se una parola mostra che ce n'è più di uno, e come.",
      "stg.time.t"       : "Già successo",
      "stg.time.d"       : "Che cosa fa una parola d'azione quando il fare è finito.",
      "stg.neg.t"        : "Dire di no",
      "stg.neg.d"        : "Come la lingua dice il contrario di quello che è stato detto.",
      "stg.ask.t"        : "Chiedere",
      "stg.ask.d"        : "Il segno che trasforma una cosa detta in una domanda, e le parole che chiedono una cosa precisa.",
      "stg.ask.what"     : "che cosa",
      "stg.ask.who"      : "chi",
      "stg.ask.where"    : "dove",
      "stg.ask.when"     : "quando",
      "stg.desc.t"       : "Descrivere",
      "stg.desc.d"       : "Dove va una parola che descrive.",
      "stg.have.t"       : "Appartenere",
      "stg.have.d"       : "Come la lingua dice che una cosa è di un'altra.",
      "stg.count.t"      : "Contare",
      "stg.count.d"      : "Da uno a dieci. Quasi tutte le lingue costruiscono il resto da questi.",
      /* the kinds of writing */
      "ws.kind"          : "Che cosa rappresenta una lettera",
      "ws.k.alpha"       : "Alfabeto",
      "ws.k.alpha.d"     : "Una lettera per un suono. Disegni una lettera per ogni suono che la tua lingua ha.",
      "ws.k.alpha.eg"    : "una lettera, un suono — come nell'alfabeto latino o cirillico",
      "ws.k.syll"        : "Sillabario",
      "ws.k.syll.d"      : "Una lettera per un'intera sillaba. Consonante e vocale non si scrivono separate.",
      "ws.k.syll.eg"     : "una lettera, una sillaba — come nei kana, dove ka è una lettera sola",
      "ws.k.abjad"       : "Abjad",
      "ws.k.abjad.d"     : "Si scrivono solo le consonanti. Le vocali si ricavano dalla parola e restano fuori dalla pagina.",
      "ws.k.abjad.eg"    : "solo consonanti — come nell'arabo o nell'ebraico",
      "ws.k.abugida"     : "Abugida",
      "ws.k.abugida.d"   : "Una consonante ha una lettera, una vocale ha un segno. Disegna entrambi e l'app li unisce.",
      "ws.k.abugida.eg"  : "una lettera con sopra un segno vocalico — come nel devanagari",
      "ws.k.logo"        : "Logografia",
      "ws.k.logo.d"      : "Una lettera per un'intera parola. C'è una lettera da disegnare per ogni parola che scrivi.",
      "ws.k.logo.eg"     : "una lettera, una parola — come nei caratteri cinesi",
      "ws.bases"         : "Le consonanti, ognuna con una lettera",
      "ws.marks"         : "Le vocali, ognuna con un segno",
      "ws.made"          : "Che cosa formano insieme",
      /* onboarding */
      "ob.next"          : "Avanti",
      "ob.name.sub"      : "L'unica cosa su cui hai già un'opinione.",
      "ob.name.note"     : "Puoi cambiarlo in qualsiasi momento.",
      "ob.name.later"     : "Decido dopo",
      "ob.ws.h"          : "Come si scrive?",
      "ob.ws.sub"        : "Questo decide che cos'è una lettera, perciò viene prima di disegnarne una.",
      "ob.ws.note"       : "Puoi cambiarlo più avanti, e quello che hai disegnato resta.",
      "ob.snds.h"        : "Di quali suoni è fatta?",
      "ob.snds.sub"      : "Scegline qualcuno. È da questi che nasceranno le tue parole.",
      "ob.snds.n"        : "{0} suoni scelti",
      "ob.snds.n.1"      : "1 suono scelto",
      "ob.snds.note"     : "L'intera tavola — ogni suono usato da qualsiasi lingua — sarà poi a un tocco di distanza.",
      "ob.snds.need"     : "Scegli almeno un suono.",
      "ob.draw.h2"       : "Disegna la lettera per {0}.",
      "ob.draw.later"    : "Disegnala più tardi",
      /* the writing system */
      "script.preview"    : "La tua scrittura",
      "script.show.roman" : "Alfabeto latino",
      "script.show.own"   : "Le tue lettere",
      /* the letter editor */
      "glyph.circle"      : "Curvare",
      "glyph.new"         : "Nuovo",
      "glyph.undo"        : "Indietro",
      "glyph.clear"       : "Svuota",
      "glyph.cancel"      : "Annulla",
      "glyph.save"        : "Salva",
      "glyph.saved"       : "{0} salvata",
      "count.words"      : "{0} parole",
      "count.words.1"    : "1 parola",
      "count.sounds"     : "{0} suoni",
      "count.sounds.1"   : "1 suono",
      "count.gram"       : "{0} decise",
      "count.gram.1"     : "1 decisa",
      "count.lines"      : "{0} righe",
      "count.lines.1"    : "1 riga",
      "home.empty.t"     : "Nemmeno una parola",
      "home.empty.s"     : "Si comincia da una parola sola.<br>Scrivi la grafia; la lettura viene da sé.",
      "home.empty.btn"   : "Scrivi la prima parola",
      "home.recent.line" : "Ultima frase",
      "home.recent.word" : "Ultima parola scritta",
      "home.write"       : "Scrivi una parola",
      "words.search"     : "Cerca grafia, significato, lettura",
      "words.open"       : "Aprire questa parola",
      "words.sayall"     : "Ascoltarle tutte",
      "words.stop"       : "Fermare",
      "words.nomatch"    : "Nessun risultato",
      "words.empty"      : "Ancora nessuna parola",
      "sound.used"       : "Consonanti in uso",
      "sound.unused"     : "Consonanti non usate",
      "sound.none"       : "Ancora nessuna.",
      "sound.note"       : "I suoni che una lingua rifiuta le appartengono quanto quelli che tiene.<br>Il piccolo segno sotto ogni lettera è l'alfabeto fonetico internazionale: un simbolo per un suono, in qualsiasi lingua della terra.",
      "sound.vowels"     : "Vocali",
      "sound.together"   : "Dette insieme",
      "link.yes"         : "la consonante finale scivola nella parola dopo",
      "link.no"          : "ogni parola resta separata",
      "sound.listen"     : "Ascolta",
      "sound.linkhint"   : "Scrivi una parola che comincia per vocale: la consonante che la precede ci scivola sopra e le due diventano un solo respiro.",
      "sound.footer"     : "Tutta questa aritmetica avviene dentro il tuo dispositivo. Nessuna rete, nessuna AI.",
      /* notes */
      "toc.notes"        : "Quaderno",
      "count.notes"      : "{0} note",
      "count.notes.1"    : "1 nota",
      "notes.note"       : "Tutto quello che riguarda questa lingua e non è una parola, un suono o una decisione. Resta su questo dispositivo insieme al resto.",
      "notes.new"        : "Nuova nota",
      "notes.edit"       : "Questa nota",
      "notes.t"          : "Titolo",
      "notes.t.ph"       : "facoltativo",
      "notes.b"          : "Nota",
      "notes.b.ph"       : "Chi la parla. Perché una parola è anche un'altra. Tutto quello che altrimenti domani avresti già dimenticato.",
      "notes.save"       : "Conserva",
      "notes.del"        : "Elimina questa nota",
      "notes.untitled"   : "Senza titolo",
      "notes.empty.t"    : "Ancora niente di scritto",
      "notes.empty.s"    : "Quasi tutto quello che sai di una lingua che stai facendo non ha ancora una forma. È qui che va.",
      "notes.footer"     : "Testo semplice, conservato su questo dispositivo. Niente di quello che c'è qui viene letto dal resto dell'app.",
      "toast.note.kept"  : "Nota conservata",
      "toast.note.gone"  : "Nota eliminata",
      "confirm.note.del" : "Eliminare questa nota?",
      /* the conversation */
      "toc.talk"         : "Conversazione",
      "count.turns"      : "{0} battute",
      "count.turns.1"    : "1 battuta",
      "talk.knows"       : "Ha letto tutta questa lingua: {0} parole, {1} suoni, {2} decisioni. Non ne parla nessun'altra.",
      "talk.first"       : "Scegli qui sotto qualcuna delle tue parole e mandale. Risponderà nella tua lingua.",
      "talk.compose"     : "Quello che stai dicendo",
      "talk.send"        : "Dillo",
      "talk.wipe"        : "Svuota questa conversazione",
      "talk.empty.t"     : "Ancora niente con cui parlare",
      "talk.empty.s"     : "Una conversazione vuole almeno una cosa e un fare.<br>Prima scrivi un sostantivo e un verbo.",
      "talk.footer"      : "Le sue righe sono costruite con le tue parole, nel tuo ordine, con i tuoi segni sopra. È tutta aritmetica dentro questo dispositivo — non viene inviato nulla da nessuna parte.",
      "confirm.talk.clear": "Svuotare tutta la conversazione?",
      /* grammar — the decisions */
      "gram.note"        : "Queste sono decisioni, non osservazioni. Ognuna cambia il modo in cui escono le tue parole, e il cambiamento si sente.",
      "gram.order.t"     : "Ordine delle parole",
      "gram.order.d"     : "Che cosa viene prima: chi fa, chi subisce, e il fare stesso.",
      "gram.role.S"      : "chi fa",
      "gram.role.O"      : "chi subisce",
      "gram.role.V"      : "il fare",
      "gram.adj.t"       : "Dove va una parola che descrive",
      "gram.adj.d"       : "Prima della cosa che descrive, o dopo.",
      "gram.adj.before"       : "Prima",
      "gram.adj.after"       : "Dopo",
      "gram.num.t"       : "Più di uno",
      "gram.num.d"       : "Come una parola dice che di una cosa ce n'è più d'una — o non lo dice affatto, come fanno molte lingue.",
      "gram.past.t"      : "Già successo",
      "gram.past.d"      : "Che cosa fa una parola d'azione quando il fare è finito.",
      "gram.neg.t"       : "Dire di no",
      "gram.neg.d"       : "Come la lingua disfa quello che dice il resto della riga.",
      "gram.q.t"         : "Chiedere",
      "gram.q.d"         : "Che cosa trasforma una cosa detta in una cosa chiesta.",
      "gram.poss.t"      : "Appartenere",
      "gram.poss.d"      : "Come la lingua dice che una cosa è di un'altra.",
      "gram.how.none"    : "Non segnato",
      "gram.how.suffix"  : "In fondo",
      "gram.how.prefix"  : "In testa",
      "gram.how.redup"   : "Detto due volte",
      "gram.how.before"  : "Una parola prima",
      "gram.how.after"   : "Una parola dopo",
      "gram.how.start"   : "Una parola all'inizio",
      "gram.how.end"     : "Una parola alla fine",
      "gram.piece"       : "Il suono che lo porta",
      "gram.piece.none"  : "non scelto",
      "gram.piece.h"     : "Quale suono lo porta",
      "gram.piece.d"     : "Costruito con i suoni che questa lingua ha, come si costruisce una parola. È questo che segna «{0}».",
      "gram.piece.set"   : "Usa questo",
      "gram.demo.need"   : "Scrivi ancora qualche parola e qui le vedrai cambiare.",
      "gram.pair.one"    : "uno",
      "gram.pair.many"   : "molti",
      "gram.pair.now"    : "ora",
      "gram.pair.past"   : "prima",
      "gram.pair.yes"    : "sì",
      "gram.pair.no"     : "no",
      "gram.pair.say"    : "dire",
      "gram.pair.ask"    : "chiedere",
      "gram.pair.plain"  : "solo",
      "gram.pair.owned"  : "posseduto",
      "gram.pair.phrase" : "gruppo",
      "gram.pair.line"   : "riga",
      "gram.seen"        : "Quello che le tue parole già fanno",
      "gram.footer"      : "Niente qui è fissato. Cambia una decisione e ogni esempio di questa schermata cambia con lei.",
      "sent.order.d"     : "Deciso nel capitolo di grammatica. Qui serve solo a controllare quello che hai intrecciato.",
      "rules.intro"      : "Abitudini trovate contando le {0} parole che hai scritto. Non decise: scoperte.",
      "rules.intro.1"    : "Abitudini trovate contando l'unica parola che hai scritto. Non decise: scoperte.",
      "rules.empty.t"    : "Ancora nessuna regola",
      "rules.empty.s"    : "Prima scrivi qualche parola.",
      "rules.next"       : "Poi: {0}",
      "find.final.t"     : "Le parole «{0}» finiscono in <em>-{1}</em>",
      "find.final.d"     : "{1} su {0}. Le nuove parole possono tenere la stessa forma.",
      "find.cons.t"      : "Consonanti che risuonano ora: <em>{0}</em>",
      "find.cons.d"      : "La tua scorta di suoni su {0} parole. Aggiungine uno che qui non c'è e tutta la lingua cambia colore.",
      "find.cons.d.1"    : "La tua scorta di suoni su una parola. Aggiungine uno che qui non c'è e tutta la lingua cambia colore.",
      "find.vow.t"       : "Solo <em>{0}</em> — {1} in tutto",
      "find.vow.d"       : "Meno vocali ci sono, più la lingua suona d'un pezzo. Puoi allargarle quando vuoi.",
      "find.syl.t"       : "Le parole arrivano a <em>{0} sillabe</em>",
      "find.syl.t.1"     : "Le parole arrivano a <em>una sillaba</em>",
      "find.syl.d"       : "{1} parole su {0}. Lunghezze regolari fanno sembrare una lingua parlata, non montata a pezzi.",
      "find.coda.t"      : "Le parole finiscono sempre e solo in <em>{0}</em>",
      "find.coda.d"      : "Più corto è quell'elenco, più pulito è l'incastro delle parole dette una dopo l'altra.",
      "find.unused.t"    : "<em>{0}</em> non compaiono mai",
      "find.unused.d"    : "Avere suoni che non usi mai è già una firma.",
      "hint.pos"         : "Scrivi altre {0} parole «{1}» e affiorerà una regola: come finisce ogni {1}.",
      "hint.pos.1"       : "Scrivi un'altra parola «{1}» e affiorerà una regola: come finisce ogni {1}.",
      "hint.more"        : "Più parole ci sono, più regole ci sono da trovare.",
      "sent.empty.t"     : "Non basta per una frase",
      "sent.empty.s"     : "Una frase vuole almeno due parole.<br>Prima scrivine qualcuna.",
      "sent.weave"       : "Intreccia",
      "sent.prev"        : "Prima",
      "sent.later"       : "Dopo",
      "sent.remove"      : "Togli questa parola",
      "sent.taphint"     : "Tocca una parola per spostarla o toglierla.",
      "sent.palhint"     : "Scegli le parole qui sotto e si allineano qui. Quante vuoi, e la stessa parola tutte le volte che vuoi.",
      "sent.undo"        : "Annulla una",
      "sent.clear"       : "Svuota",
      "sent.reads"       : "Letta ad alta voce, questa riga suona",
      "sent.say"         : "Pronuncia",
      "sent.linkhint"    : "Metti nella riga una parola che comincia per vocale: la consonante che la precede ci scivola sopra e diventano un solo respiro.",
      "sent.keep"        : "Conserva questa frase",
      "sent.need2"       : "Allinea due o più parole per sentire come si legano.",
      "sent.choose"      : "Scegli le parole",
      "sent.search"      : "Cerca grafia o significato",
      "sent.nomatch"     : "Nessun risultato.",
      "sent.nomean"      : "senza significato",
      "sent.order"       : "Ordine delle parole (una regola di questa lingua)",
      "sent.chk.ok"      : "La riga è <b>{0}</b>: esattamente l'ordine che hai scelto.",
      "sent.chk.ng"      : "La riga è <b>{0}</b>, ma l'ordine che hai scelto è <b>{1}</b>.",
      "sent.chk.fix"     : "Rimettila nell'ordine che ho scelto",
      "sent.chk.hint"    : "Allinea un soggetto, un oggetto e un verbo e Lingua confronta l'ordine con la tua regola.<br>Va bene anche qualunque altra disposizione. La regola è una guida, non un recinto.",
      "sent.kept"        : "Frasi conservate",
      "sent.listen"      : "Ascolta",
      "sent.reweave"     : "Intreccia ancora",
      "sent.drop"        : "Elimina",
      "sent.footer"      : "Le letture, e il modo in cui le parole si legano, si calcolano dentro questo dispositivo.",
      "toast.need2"      : "Allinea almeno due parole",
      "toast.kept"       : "Frase conservata",
      "toast.dropped"    : "Eliminata",
      "toast.reordered"  : "Rimessa nell'ordine che hai scelto",
      "make.rule"        : "Qui vale la regola attuale per «{0}»: finiscono in <span style=\"color:var(--gold)\">-{1}</span>.",
      "make.norule"      : "Per «{0}» non si è ancora fissata una regola, quindi queste nascono solo dai suoni che già usi.",
      "make.empty.t"     : "Non c'è abbastanza da cui partire",
      "make.empty.s"     : "Prima scrivi tu qualche parola.<br>Lingua ne imita il suono.",
      "make.left"        : "Restano {0} parole nel piano Free.",
      "make.left.1"      : "Resta una parola nel piano Free.",
      "make.lock.t"      : "Chiedi un intero gruppo in una volta",
      "make.lock.d"      : "«Trenta parole sul mare» — e arrivano",
      "make.reroll"      : "Estrai ancora",
      "make.pick"        : "Scegli questa",
      "make.one"         : "Rigenera questa",
      "make.commit"      : "Aggiungi quelle scelte",
      "toast.noselect"   : "Non hai selezionato nulla",
      "toast.cap"        : "Il piano Free tiene {0} parole",
      "toast.cap.1"      : "Il piano Free tiene una parola",
      "toast.added.n"    : "Aggiunte {0} parole. I significati puoi scriverli dall'elenco delle parole",
      "toast.added.n.1"  : "Aggiunta una parola. Il significato puoi scriverlo dall'elenco delle parole",
      "set.title"        : "Impostazioni",
      "set.look"         : "Aspetto",
      "theme.system"     : "Sistema",
      "theme.light"      : "Chiaro",
      "theme.dark"       : "Scuro",
      "set.theme.note"   : "«Sistema» segue quello che hai impostato sul dispositivo.",
      "set.reading"      : "Come si mostrano le letture",
      "read.ipa"         : "IPA",
      "read.both"        : "Entrambi",
      "set.sample"       : "Esempio",
      "set.ipa.note"     : "L'IPA è il modo in cui il mondo scrive un suono perché chiunque possa dirlo, e qui una parola è scritta esattamente in esso, dentro <b style=\"color:var(--tx);font-weight:500\">/ /</b>. {0} ne è un'approssimazione, per leggere più che per dire.",
      "set.display"      : "Lingua dell'interfaccia",
      "set.display.note" : "Lo schermo e la lettura delle tue parole seguono questa impostazione. L'IPA no: è uguale in ogni lingua. Katakana per il giapponese, pronuncia figurata in stile <b style=\"color:var(--tx);font-weight:500\">AY-leen</b> per l'inglese, dove le maiuscole segnano l'accento. Il valore predefinito segue il dispositivo.",
      "set.voice.try"    : "Prova",
      "set.voice.note"   : "Ogni suono qui viene costruito su questo dispositivo a partire dalla tavola stessa — quanto è aperta la bocca, in che punto si fa il suono, se la voce è accesa. Non si usa nessuna voce del telefono, perché la voce di un telefono sa dire soltanto una lingua, e questa non lo è. Se non si sente nulla, controlla prima l'interruttore del silenzioso sul lato, poi il volume.",
      "set.lang"         : "Lingua",
      "set.name"         : "Nome",
      "set.count"        : "Parole",
      "set.plan"         : "Piano",
      "set.plan.cur"     : "Piano attuale",
      "set.data"         : "Dati",
      "set.csv.out"      : "Esporta in CSV",
      "set.csv.in"       : "Importa da CSV",
      "set.cloud"        : "Backup nel cloud",
      "set.on"           : "Attivo",
      "set.lock.csv.t"   : "Importazione ed esportazione CSV",
      "set.lock.csv.d"   : "Riversa un blocco costruito in un foglio di calcolo",
      "set.lock.cloud.t" : "Backup nel cloud",
      "set.lock.cloud.d" : "Sopravvive a un telefono nuovo; un solo dizionario su più dispositivi",
      "set.wipe"         : "Cancella tutto e ricomincia",
      "set.footer"       : "Lingua · le tue parole restano su questo dispositivo.",
      "set.footer.free"  : " Il piano Free non tocca mai la rete.",
      "confirm.wipe"     : "Cancellare ogni parola che hai fatto e ricominciare?",
      "plans.title"      : "Piani",
      "plans.intro"      : "Fare una lingua è gratis, e resta gratis.<br>Quello che costa è conservarne molta, e pensare insieme a un'AI.",
      "plan.cur"         : "attuale",
      "plan.tofree"      : "Torna a Free",
      "plan.choose"      : "Scegli questo piano",
      "plans.note"       : "Il pagamento non è ancora collegato. Per ora questo cambia solo ciò che mostrano le schermate.",
      "plan.free.1"      : "Costruisci ogni parola a mano — tutte quante",
      "plan.free.2"      : "Regole trovate per te, letture ricavate per te",
      "plan.free.3"      : "Raccordi mostrati e letti ad alta voce",
      "plan.free.4"      : "Produci in serie parole che seguono le tue regole",
      "plan.free.5"      : "Salvate sul dispositivo · fino a 100 parole",
      "plan.plus.1"      : "Parole illimitate",
      "plan.plus.2"      : "Backup nel cloud (telefono nuovo, più dispositivi)",
      "plan.plus.3"      : "Importa ed esporta le parole in CSV",
      "plan.plus.4"      : "Tutto quello che c'è in Free",
      "plan.studio.1"    : "Lavora con un'AI (forma dal significato, grammatica, esempi)",
      "plan.studio.2"    : "Genera un lessico intero a partire da un tema",
      "plan.studio.3"    : "Tutto quello che c'è in Plus",
      "plan.price.free"  : "$0",
      "plan.price.plus"  : "$9 / mese",
      "plan.price.studio": "$19 / mese",
      "toast.plan.free"  : "Di nuovo sul piano Free",
      "toast.plan.other" : "(finto) passato a {0}",
      "add.title"        : "Scrivi una parola",
      "add.note"         : "La lettura si ricava dalla grafia che scrivi.",
      "f.spelling"       : "Grafia",
      "f.reading"        : "Lettura",
      "f.listen"         : "Ascolta",
      "f.meaning"        : "Significato",
      "f.meaning.ph"     : "stella",
      "f.pos"            : "Parte del discorso",
      "add.btn"          : "Aggiungi",
      "add.lock.t"       : "Cerca a parole la forma di un significato",
      "add.lock.d"       : "«Voglio una parola che sappia di quiete»",
      "toast.hw2"        : "Una grafia vuole almeno due lettere",
      "toast.dup"        : "Quella parola esiste già",
      "toast.added.1"    : "{0} aggiunta",
      "voice.none"       : "Questo dispositivo non permette all'app di produrre suoni.",
      "words.coin"       : "Conia più parole",
      "word.sounds"      : "I suoni di cui è fatta",
      "word.sounds.d"    : "Cambiali e la parola cambia, ovunque sia usata.",
      "word.means"       : "Che cosa significa",
      "word.mn.add"      : "Metti",
      "word.mn.del"      : "Togli questo significato",
      "word.family"      : "Da dove viene",
      "word.from"        : "Derivata da {0}",
      "word.derive"      : "Deriva una nuova parola da questa",
      "add.title.from"   : "Una parola da {0}",
      "add.note.from"    : "Si apre come la parola da cui l'hai derivata. Cambia i suoni a partire da lì.",
      "glyph.other"      : "La sua lettera",
      "glyph.borrow"     : "Prendi in prestito un carattere, invece",
      "glyph.borrowed"   : "Preso in prestito per questo suono",
      "glyph.del"        : "Togli la lettera a questo suono",
      "glyph.del.ask"    : "Togliere la lettera a questo suono? Il suono resta nella tua lingua.",
      "glyph.deleted"    : "{0} ora è senza lettera",
      "word.mn.ph"       : "non ancora deciso",
      "word.save"        : "Salva",
      "word.del"         : "Elimina questa parola",
      "confirm.del"      : "Eliminare {0}?",
      "toast.saved"      : "{0} aggiornata",
      "toast.deleted"    : "{0} eliminata",
      "csv.title"        : "Importa da CSV",
      "csv.note"         : "Una parola per riga: grafia, significato, parte del discorso. Una riga di intestazione va bene.",
      "csv.ph"           : "Aelin,stella,sostantivo&#10;Naeth,acqua,sostantivo",
      "csv.btn"          : "Importa",
      "toast.exported"   : "Esportato",
      "toast.exportfail" : "Esportazione non riuscita",
      "toast.imported"   : "Importate {0} parole",
      "toast.imported.1" : "Importata una parola",
      "read.sep"         : "  "
    }
  };
})());
