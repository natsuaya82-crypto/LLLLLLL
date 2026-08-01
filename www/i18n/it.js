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
      "home.write"                : "Aggiungi parola",
      "lock.ai"                   : "Consigli illimitati",
      "lock.export"               : "Esportazione e backup",
      "lock.sync"                 : "Sincronizzazione cloud",
      "lock.t"                    : "Funzione Plus",
      "ob.back"                   : "Indietro",
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
      "ob.draw.h"                 : "Disegna la prima lettera<br>della tua lingua.",
      "ob.draw.sub"               : "Qualsiasi cosa. È tua.",
      "ob.lang.a"                 : "Lingua dell'interfaccia",
      "ob.open"                   : "Apri la porta",
      "ob.or"                     : "Oppure parti da una scrittura che esiste già",
      "ob.snd.h"                  : "Come suona?",
      "ob.snd.note.borrow"        : "Forme prese in prestito, suoni tuoi. Niente qui deve significare ciò che significa dove l'hai trovato.",
      "ob.snd.note.draw"          : "La lettera entra nel tuo alfabeto e il suono nel tuo inventario.",
      "ob.enter"                  : "Inizia",
      "ob.lang.h"                 : "Scegli la tua lingua",
      "ob.name.auto"              : "Scegli tu per me",
      "ob.name.h"                 : "Come si chiama<br>la tua lingua?",
      "ob.name.mini"              : "Puoi cambiarlo quando vuoi.",
      "ob.name.ph"                : "es. Aelira",
      "ob.signin.apple"           : "Continua con Apple",
      "ob.signin.google"          : "Continua con Google",
      "ob.signin.note"            : "Accedi per iniziare.",
      "ob.tagline"                : "Dai nuovi colori alle tue parole.",
      "script.add"                : "Aggiungi caratteri",
      "script.cons"               : "Consonanti",
      "script.dup"                : "Già preso",
      "script.empty"              : "Conia prima qualche parola: i suoni vengono da lì.",
      "script.h"                  : "Dai un carattere a ogni suono",
      "script.mine"               : "I tuoi caratteri",
      "script.none"               : "Ancora nessun carattere",
      "script.none2"              : "Ancora nessun carattere",
      "script.none2s"             : "Scegli una scrittura qui sotto, o scrivi un carattere tuo.",
      "script.own"                : "Oppure scrivi il tuo",
      "script.own.ph"             : "Incolla o scrivi un carattere",
      "script.pick"               : "Tocca un carattere per prenderlo",
      "script.prev"               : "Anteprima",
      "script.rm"                 : "Rimuovi",
      "script.set"                : "Usa",
      "script.show"               : "Scrivere nella tua scrittura",
      "script.snd"                : "suono",
      "script.sub"                : "Questi sono i suoni che la tua lingua usa. Un suono senza carattere resta in lettere.",
      "script.vow"                : "Vocali",
      "snd.add"                   : "Aggiungi un suono",
      "snd.add.s"                 : "Suoni che la tua lingua non ha ancora usato.",
      "snd.have"                  : "Già nella tua lingua",
      "sug.ask"                   : "Non ti viene in mente niente?",
      "sug.for"                   : "Forme per “{0}” — tocca per tenerne una.",
      "sug.hint"                  : "Costruite con i suoni che già usi — tocca per tenerne una.",
      "sug.left"                  : "Ne restano {0} oggi",
      "sug.more"                  : "Altre idee",
      "sug.out"                   : "Idee finite per oggi. Con Plus continuano.",
      "toc.script"                : "Scrittura",
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
      "toc.rules"        : "Grammatica",
      "toc.sent"         : "Frasi",
      "toc.make"         : "Neologia",
      /* the writing system */
      "toc.script"        : "Lettere",
      "script.preview"    : "La tua scrittura",
      "script.show"       : "Mostra le parole in",
      "script.show.roman" : "Alfabeto latino",
      "script.show.own"   : "Le tue lettere",
      "script.show.note"  : "Cambia solo ciò che vedi. Quello che scrivi e quello che viene salvato restano le stesse lettere, quindi niente resta chiuso dentro un carattere.",
      "script.needs"      : "Disegna una lettera e qui vedrai le tue parole scritte con essa.",
      "script.letters"    : "L’alfabeto",
      "script.empty.t"    : "Ancora nessuna lettera",
      "script.empty.s"    : "Scrivi prima una parola: i suoi suoni compaiono qui, in attesa di essere disegnati.",
      "script.add"        : "Aggiungi una lettera",
      "script.add.prompt" : "Per quale suono è questa lettera? (a, k, sh …)",
      "script.add.bad"    : "Da una a tre lettere latine.",
      "script.note"       : "Ogni lettera si disegna nello stesso quadrato e con lo stesso spessore di tratto, come un telefono disegna ogni lettera del giapponese o del coreano in un’unica misura. Il carattere viene creato sul tuo dispositivo; non viene inviato nulla da nessuna parte.",
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
      "count.rules"      : "{0} trovate",
      "count.rules.1"    : "1 trovata",
      "count.lines"      : "{0} righe",
      "count.lines.1"    : "1 riga",
      "home.empty.t"     : "Nemmeno una parola",
      "home.empty.s"     : "Si comincia da una parola sola.<br>Scrivi la grafia; la lettura viene da sé.",
      "home.empty.btn"   : "Scrivi la prima parola",
      "home.recent.line" : "Ultima frase",
      "home.recent.word" : "Ultima parola scritta",
      "home.write"       : "Scrivi una parola",
      "words.search"     : "Cerca grafia, significato, lettura",
      "words.nomatch"    : "Nessun risultato",
      "words.empty"      : "Ancora nessuna parola",
      "sound.used"       : "Consonanti in uso",
      "sound.unused"     : "Consonanti non usate",
      "sound.none"       : "Ancora nessuna.",
      "sound.allused"    : "Sono tutte in uso.",
      "sound.note"       : "I suoni che una lingua rifiuta le appartengono quanto quelli che tiene.<br>Il piccolo segno sotto ogni lettera è l'alfabeto fonetico internazionale: un simbolo per un suono, in qualsiasi lingua della terra.",
      "sound.vowels"     : "Vocali",
      "sound.together"   : "Dette insieme",
      "link.yes"         : "la consonante finale scivola nella parola dopo",
      "link.no"          : "ogni parola resta separata",
      "sound.listen"     : "Ascolta",
      "sound.linkhint"   : "Scrivi una parola che comincia per vocale: la consonante che la precede ci scivola sopra e le due diventano un solo respiro.",
      "sound.footer"     : "Tutta questa aritmetica avviene dentro il tuo dispositivo. Nessuna rete, nessuna AI.",
      "rules.intro"      : "Abitudini trovate contando le {0} parole che hai scritto. Non decise: scoperte.",
      "rules.intro.1"    : "Abitudini trovate contando l'unica parola che hai scritto. Non decise: scoperte.",
      "rules.empty.t"    : "Ancora nessuna regola",
      "rules.empty.s"    : "Prima scrivi qualche parola.",
      "rules.next"       : "Poi: {0}",
      "rules.make"       : "Crea altre parole che seguono queste regole",
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
      "sent.later"       : "Dopo →",
      "sent.remove"      : "Togli questa parola",
      "sent.taphint"     : "Tocca una parola per spostarla o toglierla.",
      "sent.palhint"     : "Scegli le parole qui sotto e si allineano qui. Quante vuoi, e la stessa parola tutte le volte che vuoi.",
      "sent.undo"        : "Annulla una",
      "sent.clear"       : "Svuota",
      "sent.reads"       : "Letta ad alta voce, questa riga suona",
      "sent.say"         : "▶ Pronuncia",
      "sent.linkhint"    : "Metti nella riga una parola che comincia per vocale: la consonante che la precede ci scivola sopra e diventano un solo respiro.",
      "sent.keep"        : "Conserva questa frase",
      "sent.need2"       : "Allinea due o più parole per sentire come si legano.",
      "sent.choose"      : "Scegli le parole",
      "sent.search"      : "Cerca grafia o significato",
      "sent.nomatch"     : "Nessun risultato.",
      "sent.nomean"      : "senza significato",
      "sent.order"       : "Ordine delle parole (una regola di questa lingua)",
      "order.SOV.lab"    : "Soggetto → Oggetto → Verbo",
      "order.SOV.ex"     : "Qui stanno il giapponese e il turco. «Io la stella vedo.»",
      "order.SVO.lab"    : "Soggetto → Verbo → Oggetto",
      "order.SVO.ex"     : "Qui sta l'inglese. «Io vedo la stella.»",
      "order.VSO.lab"    : "Verbo → Soggetto → Oggetto",
      "order.VSO.ex"     : "Qui stanno l'arabo e l'irlandese. «Vedo io la stella.»",
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
      "set.ipa.note"     : "L'IPA è il modo in cui il mondo scrive un suono perché chiunque possa dirlo. Dentro <b style=\"color:var(--tx);font-weight:500\">/ /</b>, un <b style=\"color:var(--tx);font-weight:500\">.</b> segna la divisione tra sillabe e <b style=\"color:var(--tx);font-weight:500\">ː</b> tiene il suono più a lungo. L'IPA è quello esatto; {0} è un'approssimazione per chi la legge.",
      "set.display"      : "Lingua dell'interfaccia",
      "set.display.note" : "Lo schermo e la lettura delle tue parole seguono questa impostazione. L'IPA no: è uguale in ogni lingua. Katakana per il giapponese, pronuncia figurata in stile <b style=\"color:var(--tx);font-weight:500\">AY-leen</b> per l'inglese, dove le maiuscole segnano l'accento. Il valore predefinito segue il dispositivo.",
      "set.voice"        : "Voce",
      "set.voice.cur"    : "Voce in uso",
      "set.voice.none"   : "nessuna trovata",
      "set.voice.pick"   : "Scegli una voce",
      "set.voice.auto"   : "Scegli automaticamente",
      "set.voice.wait"   : "L'elenco delle voci di questo dispositivo non si è ancora caricato. Premi «▶ Ascolta» una volta, ovunque, e comparirà.",
      "set.voice.try"    : "Prova",
      "set.voice.note"   : "Se non si sente nulla, controlla prima l'interruttore del silenzioso sul lato del telefono, poi il volume. Se ancora non parte, spesso funziona un'altra voce dell'elenco qui sopra. Le voci italiane e spagnole hanno vocali piane e regolari, che di solito si adattano bene a una lingua inventata.",
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
      "word.syl"         : "Divisione in sillabe",
      "word.note"        : "{0} sillabe. La lettura nasce da questa divisione.<br>Sopra c'è l'IPA; sotto la lettura approssimata per chi parla {1} ({2}).",
      "word.note.1"      : "Una sillaba. La lettura nasce dalla grafia.<br>Sopra c'è l'IPA; sotto la lettura approssimata per chi parla {1} ({2}).",
      "word.edit"        : "Modifica",
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
      "tts.none"         : "Questo dispositivo non sa leggere ad alta voce",
      "tts.err"          : "Non è uscito alcun suono. In Impostazioni → Voce puoi sceglierne un'altra",
      "tts.fail"         : "Non è stato possibile leggerlo ad alta voce",
      "read.sep"         : "  "
    }
  };
})());
