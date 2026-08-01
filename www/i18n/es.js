/* Lingua — the interface in Español (es).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- es — Español ------------------------------------------------------ */
defLang('es', (function(){
  /* Lingua — lectura aproximada (Spanish reading approximation)
     Plain ES5. Globals: syl_es(p), word_es(ps). Helpers suffixed _es.
     splitC() is supplied by the host app. */

  /* consonant units that map straight through with the same letter */
  var C1_es = {b:'b', d:'d', f:'f', l:'l', m:'m', n:'n', p:'p', r:'r', s:'s', t:'t', v:'v'};

  /* a rendered letter that would soften c / g / z in Spanish spelling */
  function front_es(ch){ return ch === 'e' || ch === 'i'; }

  /* one consonant unit -> Spanish letters.
     nx    = first rendered letter of whatever follows it inside the syllable
     head  = true when this unit begins a syllable onset
     prev  = the source unit immediately before it (for /gw/) */
  function cons1_es(u, nx, head, prev){
    if (C1_es[u]) return C1_es[u];
    switch (u){
      /* /k/: Spanish writes qu- before e,i and c- everywhere else */
      case 'k': case 'c': case 'q': return front_es(nx) ? 'qu' : 'c';
      /* /g/ must stay hard: gu- before e,i */
      case 'g': return front_es(nx) ? 'gu' : 'g';
      /* /h/: Spanish h is mute, so j (= [x], and [h] in half the dialects) */
      case 'h': return 'j';
      /* /j/ glide: the diphthong letter i (ia, ie, io = [ja je jo] everywhere).
         y before i would give "yi", so fall back to y only there. */
      case 'j': return nx === 'i' ? 'y' : 'i';
      /* /z/ has no Spanish letter: s (and Spanish s IS [z] before voiced C) */
      case 'z': return 's';
      /* /ks/: written cs, because word-initial Spanish x is read [s] */
      case 'x': return 'cs';
      /* /theta/: z before a,o,u and word-finally, c before e,i */
      case 'th': return front_es(nx) ? 'c' : 'z';
      case 'ch': return 'ch';
      /* /sh/ does not exist: ch, the standard Spanish loan substitution */
      case 'sh': return 'ch';
      /* /w/: hu- at the head of a syllable (huevo, huir), u after a consonant,
         ü after g before e,i (güe, güi) */
      case 'w':
        if (head) return 'hu';
        if (prev === 'g' && front_es(nx)) return 'ü';
        return 'u';
      case 'y': return 'i';
    }
    return u;
  }

  /* a whole onset or coda, resolved right-to-left so each unit sees its follower */
  function cons_es(str, nx, isOnset){
    if (!str) return '';
    var u = splitC(str), out = [], i, s;
    for (i = u.length - 1; i >= 0; i--){
      s = cons1_es(u[i], nx, isOnset && i === 0, i > 0 ? u[i - 1] : '');
      out.unshift(s);
      nx = s.charAt(0);
    }
    return out.join('');
  }

  /* nucleus: y -> i, and a doubled vowel collapses (Spanish has no length,
     and "uu" would be read as two syllables) */
  function nuc_es(nu){
    var out = '', prev = '', i, c;
    for (i = 0; i < nu.length; i++){
      c = nu.charAt(i);
      if (c === 'y') c = 'i';
      if (c === prev) continue;
      out += c;
      prev = c;
    }
    return out;
  }

  function syl_es(p){
    var nu = nuc_es(p.nu || '');
    var on = cons_es(p.on || '', nu.charAt(0), true);
    /* g + u + e/i needs the diaeresis or the u goes silent: gue [ge] vs güe [gwe] */
    if (on.charAt(on.length - 1) === 'g' && nu.charAt(0) === 'u' && front_es(nu.charAt(1))){
      nu = 'ü' + nu.slice(1);
    }
    var co = cons_es(p.co || '', '', false);
    /* ll inside one syllable would be read [j]/[sh], not [l]: keep a single l.
       uu / ii at the onset seam (hu+u, i+i) would be read as two syllables. */
    return (on + nu + co).replace(/ll/g, 'l').replace(/uu/g, 'u').replace(/ii/g, 'i');
  }

  function word_es(ps){
    var out = [], i;
    for (i = 0; i < ps.length; i++) out.push(syl_es(ps[i]));
    if (out.length) out[0] = out[0].toUpperCase();
    return out.join('-');
  }

  return {
    label  : "Español",
    rdName : "transcripción figurada",
    all    : "todas",
    pos    : {n:"sustantivo", v:"verbo", adj:"adjetivo", x:"otra"},
    read   : mkApprox(word_es, syl_es),
    str    : {
      "ai.a.home"                 : "Tienes {0} palabras y {1} sonidos. Lo más rápido es crear más palabras: las reglas surgen de ellas.",
      "ai.a.make"                 : "La acuñación sigue los sonidos que ya usas, así que las palabras nuevas sonarán emparentadas. Conserva las que te suenen bien.",
      "ai.a.rules"                : "Han surgido {0} reglas. Sigue escribiendo con los mismos hábitos y se afinarán solas.",
      "ai.a.sent"                 : "Tienes {0} oraciones. Escribe la misma idea de dos formas: en la diferencia vive tu gramática.",
      "ai.a.sound"                : "Usas {0} sonidos: {1}. Un inventario pequeño y coherente suena más real que uno amplio y disperso.",
      "ai.a.words"                : "Tu léxico tiene {0} palabras. Crea palabras para lo que realmente dices; un idioma crece con el uso.",
      "ai.ask"                    : "Consultar al asesor",
      "ai.hint"                   : "El asesor lee tu idioma y responde a partir de él.",
      "ai.left"                   : "Quedan {0} hoy",
      "ai.limit.s"                : "Plus te da consejos ilimitados, cada día.",
      "ai.limit.t"                : "Has usado las consultas de hoy",
      "ai.see"                    : "Ver planes",
      "ai.title"                  : "Asesor lingüístico",
      "ai.unl"                    : "Ilimitado",
      "cap.warn"                  : "Quedan {0} palabras en Gratis",
      "ch.clear"                  : "Sin carácter",
      "ch.for"                    : "Un carácter para «{0}»",
      "count.script"              : "{0} de {1}",
      "home.write"                : "Añadir palabra",
      "lock.ai"                   : "Consejos ilimitados",
      "lock.export"               : "Exportar y respaldo",
      "lock.sync"                 : "Sincronización en la nube",
      "lock.t"                    : "Función de Plus",
      "ob.back"                   : "Atrás",
      "add.ph"                    : "Sus sonidos",
      "add.ph.none"               : "Esta lengua aún no tiene sonidos. Elige algunos y con ellos podrán construirse palabras.",
      "ipa.b.back"                : "posterior",
      "ipa.b.central"             : "central",
      "ipa.b.front"               : "anterior",
      "ipa.cons"                  : "Consonantes",
      "ipa.footer"                : "Un símbolo significa el mismo sonido para cualquiera que lea el cuadro. Cómo lo llames, y con qué lo escribas, es tuyo.",
      "ipa.h.close"               : "cerrada",
      "ipa.h.closemid"            : "semicerrada",
      "ipa.h.mid"                 : "media",
      "ipa.h.nearclose"           : "casi cerrada",
      "ipa.h.nearopen"            : "casi abierta",
      "ipa.h.open"                : "abierta",
      "ipa.h.openmid"             : "semiabierta",
      "ipa.m.approx"              : "aproximante",
      "ipa.m.fricative"           : "fricativa",
      "ipa.m.latapprox"           : "aprox. lat.",
      "ipa.m.latfric"             : "fric. lat.",
      "ipa.m.nasal"               : "nasal",
      "ipa.m.plosive"             : "oclusiva",
      "ipa.m.tap"                 : "vibr. simple",
      "ipa.m.trill"               : "vibr. múlt.",
      "ipa.mine"                  : "Esta lengua usa",
      "ipa.letters"               : "Toca un sonido para dibujar su letra, o para tomar una prestada.",
      "ipa.mine.none"             : "Aún no has elegido ninguno.",
      "ipa.note"                  : "Elige los sonidos de los que está hecha esta lengua. Solo un sonido elegido aquí puede recibir una letra.",
      "ipa.other"                 : "Además",
      "ipa.p.alveolar"            : "alveolar",
      "ipa.p.bilabial"            : "bilabial",
      "ipa.p.dental"              : "dental",
      "ipa.p.glottal"             : "glotal",
      "ipa.p.labiodental"         : "labiodental",
      "ipa.p.palatal"             : "palatal",
      "ipa.p.pharyngeal"          : "faríngea",
      "ipa.p.postalveolar"        : "postalveolar",
      "ipa.p.retroflex"           : "retrofleja",
      "ipa.p.uvular"              : "uvular",
      "ipa.p.velar"               : "velar",
      "ipa.vows"                  : "Vocales",
      "home.new.t"                : "Ya hay una letra.",
      "home.new.s"                : "Unas pocas más y tus palabras podrán escribirse con ellas.",
      "next.sc0"                  : "Dibuja la siguiente letra",
      "set.account"               : "Cuenta",
      "set.account.note"          : "Una cuenta lleva un idioma fuera de este teléfono. Aquí nada la necesita.",
      "set.account.soon"          : "Aún no está conectado.",
      "ob.borrow.h"               : "Elige una escritura para tomar prestada.",
      "ob.borrow.sub"             : "Siempre podrás dibujar la tuya más adelante.",
      "ob.borrow.take"            : "Toca un carácter para tomarlo.",
      "ob.door.h"                 : "La puerta lleva ahora tu letra.",
      "ob.door.note"              : "Sin nombre, sin cuenta. Eso puede esperar.",
      "ob.draw.done"              : "Listo",
      "ob.draw.empty"             : "Dibuja un trazo primero.",
      "ob.draw.h"                 : "Dibuja la primera letra<br>de tu idioma.",
      "ob.draw.sub"               : "Lo que quieras. Es tuya.",
      "ob.lang.a"                 : "Idioma de la interfaz",
      "ob.open"                   : "Abrir la puerta",
      "ob.or"                     : "O empieza por una escritura que ya existe",
      "ob.snd.h"                  : "¿Cómo suena?",
      "ob.snd.note.borrow"        : "Formas prestadas, sonidos tuyos. Nada de esto tiene que significar aquí lo que significa allí donde lo encontraste.",
      "ob.snd.note.draw"          : "La letra entra en tu alfabeto y el sonido entra en tu inventario.",
      "ob.enter"                  : "Comenzar",
      "ob.lang.h"                 : "Elige tu idioma",
      "ob.name.auto"              : "Elige uno por mí",
      "ob.name.h"                 : "¿Cómo se llama<br>tu idioma?",
      "ob.name.mini"              : "Puedes cambiarlo cuando quieras.",
      "ob.name.ph"                : "ej. Aelira",
      "ob.signin.apple"           : "Continuar con Apple",
      "ob.signin.google"          : "Continuar con Google",
      "ob.signin.note"            : "Inicia sesión para empezar.",
      "ob.signin.skip"            : "Continuar sin cuenta",
      "ob.signin.local"           : "Sin ella tu idioma se queda en este teléfono, y la web no puede verlo.",
      "ob.tagline"                : "Dale nuevos colores a tus palabras.",
      "script.add"                : "Añadir caracteres",
      "script.cons"               : "Consonantes",
      "script.dup"                : "Ya tomado",
      "script.empty"              : "Crea algunas palabras primero: de ahí salen los sonidos.",
      "script.h"                  : "Da un carácter a cada sonido",
      "script.mine"               : "Tus caracteres",
      "script.none"               : "Aún no hay caracteres",
      "script.none2"              : "Aún no hay caracteres",
      "script.none2s"             : "Elige una escritura abajo, o escribe un carácter propio.",
      "script.own"                : "O escribe el tuyo",
      "script.own.ph"             : "Pega o escribe un carácter",
      "script.pick"               : "Toca un carácter para tomarlo",
      "script.prev"               : "Vista previa",
      "script.rm"                 : "Quitar",
      "script.set"                : "Usar",
      "script.show"               : "Escribir con tu escritura",
      "script.snd"                : "sonido",
      "script.sub"                : "Estos son los sonidos que tu idioma usa. Un sonido sin carácter conserva sus letras.",
      "script.vow"                : "Vocales",
      "snd.add"                   : "Añadir un sonido",
      "snd.add.s"                 : "Sonidos que tu idioma aún no ha usado.",
      "snd.have"                  : "Ya en tu idioma",
      "sug.ask"                   : "¿No se te ocurre nada?",
      "sug.for"                   : "Formas para «{0}» — toca una para quedártela.",
      "sug.hint"                  : "Creadas con los sonidos que ya usas — toca una para quedártela.",
      "sug.left"                  : "Quedan {0} hoy",
      "sug.more"                  : "Otras ideas",
      "sug.out"                   : "Se acabaron las ideas por hoy. Con Plus siguen llegando.",
      "toc.script"                : "Escritura",
      "up.cta"                    : "Mejorar",
      "ws.arabic"                 : "Árabe",
      "ws.armenian"               : "Armenio",
      "ws.cyrillic"               : "Cirílico",
      "ws.devanagari"             : "Devanagari",
      "ws.geez"                   : "Ge'ez",
      "ws.georgian"               : "Georgiano",
      "ws.glagolitic"             : "Glagolítico",
      "ws.greek"                  : "Griego",
      "ws.hangul"                 : "Hangul",
      "ws.hebrew"                 : "Hebreo",
      "ws.ogham"                  : "Ogham",
      "ws.phoenician"             : "Fenicio",
      "ws.runic"                  : "Rúnico",
      "ws.thai"                   : "Tailandés",
      "ws.tibetan"                : "Tibetano",
      "ob.start"         : "Empezar",
      "seed.star"        : "estrella",
      "seed.water"       : "agua",
      "seed.wind"        : "viento",
      "seed.light"       : "luz",
      "seed.forest"      : "bosque",
      "seed.sky"         : "cielo",
      "seed.love"        : "amar",
      "seed.walk"        : "caminar",
      "lang.default"     : "Mi lengua",
      "nav.contents"     : "Índice",
      "nav.settings"     : "Ajustes",
      "home.kicker"      : "Tu lengua",
      "home.unnamed"     : "Ponle nombre",
      "home.name.prompt" : "Nombre de la lengua",
      'next.t'   : "Siguiente",
      'next.w0'  : "Acuña tu primera palabra",
      'next.w1'  : "Añade más palabras — faltan {0} para ver reglas",
      'next.s0'  : "Escribe tu primera oración",
      'next.mk'  : "Acuña palabras con tus propios sonidos",
      "toc.words"        : "Léxico",
      "toc.sound"        : "Fonología",
      "toc.rules"        : "Gramática",
      "toc.sent"         : "Oraciones",
      "toc.make"         : "Acuñación",
      /* the writing system */
      "toc.script"        : "Letras",
      "script.preview"    : "Tu escritura",
      "script.show"       : "Mostrar las palabras en",
      "script.show.roman" : "Alfabeto latino",
      "script.show.own"   : "Tus letras",
      "script.show.note"  : "Solo cambia lo que se ve. Lo que escribes y lo que se guarda siguen siendo las mismas letras, así que nada queda encerrado en una tipografía.",
      "script.needs"      : "Dibuja una letra y aquí verás tus palabras escritas con ella.",
      "script.letters"    : "El alfabeto",
      "script.empty.t"    : "Todavía no hay letras",
      "script.empty.s"    : "Escribe primero una palabra y sus sonidos aparecerán aquí, esperando a que los dibujes.",
      "script.add"        : "Añadir una letra",
      "script.add.prompt" : "¿Para qué sonido es esta letra? (a, k, sh …)",
      "script.add.bad"    : "De una a tres letras latinas.",
      "script.note"       : "Cada letra se dibuja en el mismo cuadrado y con el mismo grosor de trazo, igual que un teléfono dibuja todas las letras del japonés o del coreano a un solo tamaño. La tipografía se crea en tu dispositivo; no se envía nada a ninguna parte.",
      /* the letter editor */
      "glyph.circle"      : "Curvar",
      "glyph.new"         : "Nuevo",
      "glyph.undo"        : "Deshacer",
      "glyph.clear"       : "Vaciar",
      "glyph.cancel"      : "Cancelar",
      "glyph.save"        : "Guardar",
      "glyph.saved"       : "{0} guardada",
      "count.words"      : "{0} palabras",
      "count.words.1"    : "1 palabra",
      "count.sounds"     : "{0} sonidos",
      "count.sounds.1"   : "1 sonido",
      "count.rules"      : "{0} halladas",
      "count.rules.1"    : "1 hallada",
      "count.lines"      : "{0} frases",
      "count.lines.1"    : "1 frase",
      "home.empty.t"     : "Ni una palabra aún",
      "home.empty.s"     : "Todo empieza con una sola palabra.<br>Escribe la grafía; la lectura viene sola.",
      "home.empty.btn"   : "Escribir la primera palabra",
      "home.recent.line" : "Última frase",
      "home.recent.word" : "Última palabra escrita",
      "home.write"       : "Escribir una palabra",
      "words.search"     : "Buscar grafía, significado, lectura",
      "words.nomatch"    : "Sin resultados",
      "words.empty"      : "Aún no hay palabras",
      "sound.used"       : "Consonantes en uso",
      "sound.unused"     : "Consonantes sin usar",
      "sound.none"       : "Ninguna aún.",
      "sound.allused"    : "Están todas en uso.",
      "sound.note"       : "Los sonidos que una lengua rechaza la definen tanto como los que conserva.<br>La marca pequeña bajo cada letra es el Alfabeto Fonético Internacional: un símbolo para cada sonido, en cualquier lengua del mundo.",
      "sound.vowels"     : "Vocales",
      "sound.together"   : "Dichas juntas",
      "link.yes"         : "la consonante final se enlaza con la palabra siguiente",
      "link.no"          : "cada palabra queda separada",
      "sound.listen"     : "Escuchar",
      "sound.linkhint"   : "Escribe una palabra que empiece por vocal y la consonante anterior se enlazará con ella, hasta volverse un mismo aliento.",
      "sound.footer"     : "Toda esta aritmética ocurre dentro de tu dispositivo. Sin red, sin IA.",
      "rules.intro"      : "Costumbres halladas contando las {0} palabras que escribiste. No decididas: descubiertas.",
      "rules.intro.1"    : "Costumbres halladas contando la única palabra que escribiste. No decididas: descubiertas.",
      "rules.empty.t"    : "Aún no hay reglas",
      "rules.empty.s"    : "Escribe antes unas palabras.",
      "rules.next"       : "Siguiente: {0}",
      "rules.make"       : "Crear más palabras que sigan estas reglas",
      "find.final.t"     : "Los {0}s terminan en <em>-{1}</em>",
      "find.final.d"     : "{1} de {0}. Las palabras nuevas pueden mantener esa forma.",
      "find.cons.t"      : "Consonantes que suenan ahora: <em>{0}</em>",
      "find.cons.d"      : "Tu repertorio de sonidos en {0} palabras. Añade uno que no esté y la lengua entera cambia de color.",
      "find.vow.t"       : "Solo <em>{0}</em>: {1} en total",
      "find.vow.d"       : "Cuantas menos vocales, más suena la lengua de una pieza. Puedes ampliarla cuando quieras.",
      "find.syl.t"       : "Las palabras llegan a <em>{0} sílabas</em>",
      "find.syl.t.1"     : "Las palabras llegan a <em>una sílaba</em>",
      "find.syl.d"       : "{1} de {0} palabras. Las longitudes parejas hacen que una lengua suene hablada y no armada.",
      "find.coda.t"      : "Las palabras solo terminan en <em>{0}</em>",
      "find.coda.d"      : "Cuanto más corta sea esa lista, más limpio será el enlace al decirlas seguidas.",
      "find.unused.t"    : "<em>{0}</em> no aparecen nunca",
      "find.unused.d"    : "Tener sonidos que nunca usas es también una firma.",
      "hint.pos"         : "Escribe {0} {1}s más y saldrá a la luz una regla: cómo termina un {1}.",
      "hint.pos.1"       : "Escribe un {1} más y saldrá a la luz una regla: cómo termina un {1}.",
      "hint.more"        : "Cuantas más palabras haya, más reglas habrá por encontrar.",
      "sent.empty.t"     : "No alcanza para una frase",
      "sent.empty.s"     : "Una frase necesita al menos dos palabras.<br>Escribe antes unas cuantas.",
      "sent.weave"       : "Tejer",
      "sent.prev"        : "Antes",
      "sent.later"       : "Después →",
      "sent.remove"      : "Quitar esta palabra",
      "sent.taphint"     : "Toca una palabra para moverla o quitarla.",
      "sent.palhint"     : "Elige palabras abajo y se irán colocando aquí. Las que quieras, y la misma palabra tantas veces como quieras.",
      "sent.undo"        : "Deshacer una",
      "sent.clear"       : "Vaciar",
      "sent.reads"       : "Leída en voz alta, esta frase suena",
      "sent.say"         : "▶ Decirla",
      "sent.linkhint"    : "Pon en la frase una palabra que empiece por vocal y la consonante anterior se enlazará con ella, hasta volverse un mismo aliento.",
      "sent.keep"        : "Guardar esta frase",
      "sent.need2"       : "Coloca dos palabras o más para oír cómo se enlazan.",
      "sent.choose"      : "Elegir palabras",
      "sent.search"      : "Buscar grafía o significado",
      "sent.nomatch"     : "Sin resultados.",
      "sent.nomean"      : "sin significado",
      "sent.order"       : "Orden de palabras (una regla de esta lengua)",
      "order.SOV.lab"    : "Sujeto → Objeto → Verbo",
      "order.SOV.ex"     : "Aquí están el japonés y el turco. «Yo la estrella veo.»",
      "order.SVO.lab"    : "Sujeto → Verbo → Objeto",
      "order.SVO.ex"     : "Aquí está el inglés. «Yo veo la estrella.»",
      "order.VSO.lab"    : "Verbo → Sujeto → Objeto",
      "order.VSO.ex"     : "Aquí están el árabe y el irlandés. «Veo yo la estrella.»",
      "sent.chk.ok"      : "La frase queda en <b>{0}</b>: justo el orden que elegiste.",
      "sent.chk.ng"      : "La frase queda en <b>{0}</b>, pero el orden que elegiste es <b>{1}</b>.",
      "sent.chk.fix"     : "Ponerla en el orden que elegí",
      "sent.chk.hint"    : "Coloca un sujeto, un objeto y un verbo y Lingua compara el orden con tu regla.<br>Cualquier otra disposición también vale. La regla es una guía, no una valla.",
      "sent.kept"        : "Frases guardadas",
      "sent.listen"      : "Escuchar",
      "sent.reweave"     : "Tejer de nuevo",
      "sent.drop"        : "Eliminar",
      "sent.footer"      : "Las lecturas, y la manera en que las palabras se enlazan, se calculan dentro de este dispositivo.",
      "toast.need2"      : "Coloca al menos dos palabras",
      "toast.kept"       : "Frase guardada",
      "toast.dropped"    : "Eliminada",
      "toast.reordered"  : "Reordenada según el orden que elegiste",
      "make.rule"        : "Se mantiene tu regla actual para los {0}s: terminan en <span style=\"color:var(--gold)\">-{1}</span>.",
      "make.norule"      : "Todavía no hay una regla asentada para los {0}s, así que estas se construyen solo con los sonidos que ya usas.",
      "make.empty.t"     : "No hay de dónde partir",
      "make.empty.s"     : "Escribe antes unas cuantas palabras por tu cuenta.<br>Lingua imita cómo suenan.",
      "make.left"        : "Te quedan {0} palabras en el plan Free.",
      "make.left.1"      : "Te queda una palabra en el plan Free.",
      "make.lock.t"      : "Pedir un lote entero de una vez",
      "make.lock.d"      : "«Treinta palabras sobre el mar»: y llegan",
      "make.reroll"      : "Sacar otras",
      "make.commit"      : "Añadir las que elegí",
      "toast.noselect"   : "No hay nada seleccionado",
      "toast.cap"        : "El plan Free admite {0} palabras",
      "toast.added.n"    : "{0} palabras añadidas. Los significados se escriben desde la lista de palabras",
      "toast.added.n.1"  : "Una palabra añadida. Su significado se escribe desde la lista de palabras",
      "set.title"        : "Ajustes",
      "set.look"         : "Apariencia",
      "theme.system"     : "Sistema",
      "theme.light"      : "Claro",
      "theme.dark"       : "Oscuro",
      "set.theme.note"   : "«Sistema» sigue la configuración de tu dispositivo.",
      "set.reading"      : "Cómo se muestran las lecturas",
      "read.ipa"         : "IPA",
      "read.both"        : "Ambas",
      "set.sample"       : "Muestra",
      "set.ipa.note"     : "El IPA es la manera universal de escribir un sonido para que cualquiera pueda decirlo. Dentro de <b style=\"color:var(--tx);font-weight:500\">/ /</b>, un <b style=\"color:var(--tx);font-weight:500\">.</b> es un corte de sílaba y <b style=\"color:var(--tx);font-weight:500\">ː</b> alarga el sonido. El IPA es lo exacto; {0} es una aproximación para quien lo lee.",
      "set.display"      : "Idioma de la app",
      "set.display.note" : "La pantalla y la lectura de tus palabras siguen esta opción. El IPA no: es el mismo en todos los idiomas. Katakana para el japonés, transcripción figurada al estilo <b style=\"color:var(--tx);font-weight:500\">AY-leen</b> para el inglés, donde las mayúsculas marcan el acento. Por defecto, sigue el de tu dispositivo.",
      "set.voice"        : "Voz",
      "set.voice.cur"    : "Voz en uso",
      "set.voice.none"   : "ninguna",
      "set.voice.pick"   : "Elegir una voz",
      "set.voice.auto"   : "Elegir automáticamente",
      "set.voice.wait"   : "La lista de voces de este dispositivo aún no ha cargado. Pulsa «▶ Escuchar» una vez en cualquier pantalla y aparecerá.",
      "set.voice.try"    : "Probar",
      "set.voice.note"   : "Si no suena nada, mira primero el interruptor de silencio del lateral del teléfono y luego el volumen. Si sigue sin sonar, otra voz de la lista de arriba suele funcionar. Las voces italianas y españolas tienen vocales limpias y parejas, que suelen sentar bien a una lengua inventada.",
      "set.lang"         : "Lengua",
      "set.name"         : "Nombre",
      "set.count"        : "Palabras",
      "set.plan"         : "Plan",
      "set.plan.cur"     : "Plan actual",
      "set.data"         : "Datos",
      "set.csv.out"      : "Exportar como CSV",
      "set.csv.in"       : "Importar desde CSV",
      "set.cloud"        : "Copia en la nube",
      "set.on"           : "Activada",
      "set.lock.csv.t"   : "Importar y exportar CSV",
      "set.lock.csv.d"   : "Vuelca un lote que hayas armado en una hoja de cálculo",
      "set.lock.cloud.t" : "Copia en la nube",
      "set.lock.cloud.d" : "Sobrevive a un teléfono nuevo; un mismo diccionario en todos los dispositivos",
      "set.wipe"         : "Borrar todo y empezar de nuevo",
      "set.footer"       : "Lingua · tus palabras se guardan en este dispositivo.",
      "set.footer.free"  : " El plan Free nunca toca la red.",
      "confirm.wipe"     : "¿Borrar todas las palabras que has hecho y empezar de nuevo?",
      "plans.title"      : "Planes",
      "plans.intro"      : "Crear una lengua es gratis, y seguirá siéndolo.<br>Lo que cuesta dinero es guardar grandes cantidades, y pensar junto a una IA.",
      "plan.cur"         : "actual",
      "plan.tofree"      : "Volver a Free",
      "plan.choose"      : "Elegir este plan",
      "plans.note"       : "El pago aún no está conectado. Por ahora esto solo cambia lo que muestran las pantallas.",
      "plan.free.1"      : "Construir cada palabra a mano, todas ellas",
      "plan.free.2"      : "Las reglas se encuentran solas, las lecturas se deducen solas",
      "plan.free.3"      : "El enlace, mostrado y leído en voz alta",
      "plan.free.4"      : "Producir en serie palabras que sigan tus reglas",
      "plan.free.5"      : "Guardado en el dispositivo · hasta 100 palabras",
      "plan.plus.1"      : "Palabras ilimitadas",
      "plan.plus.2"      : "Copia en la nube (teléfono nuevo, varios dispositivos)",
      "plan.plus.3"      : "Importar y exportar palabras en CSV",
      "plan.plus.4"      : "Todo lo de Free",
      "plan.studio.1"    : "Trabajar con una IA (forma a partir del significado, gramática, ejemplos)",
      "plan.studio.2"    : "Generar un vocabulario entero a partir de un tema",
      "plan.studio.3"    : "Todo lo de Plus",
      "plan.price.free"  : "$0",
      "plan.price.plus"  : "$9 / mes",
      "plan.price.studio": "$19 / mes",
      "toast.plan.free"  : "De vuelta en el plan Free",
      "toast.plan.other" : "(simulado) cambiado a {0}",
      "add.title"        : "Escribir una palabra",
      "add.note"         : "La lectura se calcula a partir de la grafía que escribes.",
      "f.spelling"       : "Grafía",
      "f.reading"        : "Lectura",
      "f.listen"         : "Escuchar",
      "f.meaning"        : "Significado",
      "f.meaning.ph"     : "estrella",
      "f.pos"            : "Categoría",
      "add.btn"          : "Añadir",
      "add.lock.t"       : "Buscar una forma conversando",
      "add.lock.d"       : "«Quiero una palabra que sepa a quietud»",
      "toast.hw2"        : "Una grafía necesita dos letras o más",
      "toast.dup"        : "Esa palabra ya existe",
      "toast.added.1"    : "{0} añadida",
      "word.syl"         : "Cortes de sílaba",
      "word.note"        : "{0} sílabas. La lectura sale de estos cortes.<br>Arriba está el IPA; abajo, la lectura aproximada para hablantes de {1} ({2}).",
      "word.note.1"      : "Una sílaba. La lectura sale de la grafía.<br>Arriba está el IPA; abajo, la lectura aproximada para hablantes de {1} ({2}).",
      "word.edit"        : "Cambiarla",
      "word.mn.ph"       : "aún sin decidir",
      "word.save"        : "Guardar",
      "word.del"         : "Eliminar esta palabra",
      "confirm.del"      : "¿Eliminar {0}?",
      "toast.saved"      : "{0} actualizada",
      "toast.deleted"    : "{0} eliminada",
      "csv.title"        : "Importar desde CSV",
      "csv.note"         : "Una palabra por línea: grafía, significado, categoría. Puede llevar fila de encabezado.",
      "csv.ph"           : "Aelin,estrella,sustantivo&#10;Naeth,agua,sustantivo",
      "csv.btn"          : "Importar",
      "toast.exported"   : "Exportado",
      "toast.exportfail" : "No se pudo exportar",
      "toast.imported"   : "{0} palabras importadas",
      "toast.imported.1" : "Una palabra importada",
      "tts.none"         : "Este dispositivo no puede leer en voz alta",
      "tts.err"          : "No salió sonido. En Ajustes → Voz puedes elegir otra",
      "tts.fail"         : "No se pudo leer en voz alta",
      "read.sep"         : "  "
    }
  };
})());
