/* Lingua — the interface in Français (fr).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- fr — Français ----------------------------------------------------- */
defLang('fr', (function(){
  /* ---- Approximate reading for French speakers (transcription figurée) -----
     Same job as the English respelling and the Japanese katakana: show someone
     who cannot read the IPA roughly what the word sounds like, using French
     spelling conventions only.

     The whole difficulty is that French orthography is built to hide things
     this conlang wants heard, so every entry below is a defence:
       u  is /y/          -> /u/ has to be written  ou
       e  is mute or /e/  -> /e/ has to be written  é
       n m nasalise the vowel in front of them -> every coda nasal is doubled
       a final consonant is silent -> a mute e is added to make it sound
       ch is /ʃ/          -> /tʃ/ is  tch  and /ʃ/ is  ch
       j  is /ʒ/          -> /j/ is written  y  (yeux, yaourt)
       s  between vowels voices to /z/ -> it is doubled there
       h  is never pronounced, so /h/ simply disappears, as it does in every
          name French borrows (Hambourg, hall)
     Two vowels that French would read as one digraph are prised apart with a
     diaeresis, exactly as in naïf and coïncidence. */

  var VFR_ = {a:'a', e:'é', i:'i', o:'o', u:'ou', y:'i'};

  var CFR_ = {b:'b', d:'d', f:'f', g:'g', k:'k', l:'l', m:'m', n:'n', p:'p',
              r:'r', s:'s', t:'t', v:'v', z:'z',
              c:'k', q:'k', x:'ks',
              h:'h',            /* silent in French; kept only for the eye     */
              j:'y', y:'y',     /* /j/ — j itself would be read /ʒ/            */
              w:'ou',           /* /w/ — oui, ouest, ouate                     */
              ch:'tch', sh:'ch',
              th:'s'};          /* no /θ/ in French; /s/ is what a French
                                   mouth actually produces (Smith -> Smisse)   */

  var VFRSET_ = 'aeéèiouï';

  /* A vowel run. Length is never written (French has no long vowels), and a
     junction that French would swallow as a digraph gets a diaeresis. */
  function nuFr_(nu){
    var out = '', prev = '', i, base, last, nxt;
    for(i = 0; i < nu.length; i++){
      base = VFR_[nu.charAt(i)];
      if(base === undefined) base = nu.charAt(i);
      /* a leading y onto another vowel is the glide /j/, and French writes that
         y (yeux, yoga, yaourt) — a bare i there would be given its own syllable */
      if(i === 0 && nu.charAt(0) === 'y' && nu.length > 1){
        nxt = VFR_[nu.charAt(1)];
        if(nxt !== undefined && nxt !== 'i'){ out = 'y'; prev = 'y'; continue; }
      }
      if(base === prev) continue;                 /* aa, uu, iy -> held, unwritten */
      prev = base;
      last = out.charAt(out.length - 1);
      /* ai = /ɛ/ and oi = /wa/, so an i after a or o must be broken open */
      if(base === 'i' && (last === 'a' || last === 'o')) base = 'ï';
      /* o + ou cannot take a diaeresis (ü would be read /y/), so the hiatus is
         marked the other French way, with a mute h: cahier, envahir, trahison */
      if(base === 'ou' && last === 'o') base = 'hou';
      out += base;
    }
    return out;
  }

  /* The onset. prevV says the syllable before ended in a vowel, which is the
     only place an s would voice. */
  function onFr_(on, nuOut, prevV){
    var u = splitC(on), out = '', i, c, m, alone, head;
    alone = (u.length === 1);
    for(i = 0; i < u.length; i++){
      c = u[i];
      m = CFR_[c];
      if(m === undefined) m = c;
      if(c === 'h' && i > 0) m = '';              /* ph, th, sh would be read wrong */
      if(alone && prevV && (c === 's' || c === 'th')) m = 'ss';
      if(m === 'g' && i === u.length - 1){
        head = nuOut.charAt(0);
        if(head === 'i' || head === 'é' || head === 'è' || head === 'e') m = 'gu';
      }
      out += dedupFr_(out, m);
    }
    return out;
  }

  /* French writes no geminate that it does not pronounce: t + tch is tch. */
  function dedupFr_(sofar, m){
    if(m.length > 1 && sofar.charAt(sofar.length - 1) === m.charAt(0)) return m.substr(1);
    return m;
  }

  /* The coda. A coda n or m nasalises the vowel in front of it, so it is
     always doubled: canne, année, Corinne, homme. */
  function coFr_(co){
    var u = splitC(co), out = '', i, c, m, seen = '';
    for(i = 0; i < u.length; i++){
      c = u[i];
      if(c === seen) continue;                    /* nn in the source is still one n */
      seen = c;
      m = CFR_[c];
      if(m === undefined) m = c;
      if(c === 'h') m = '';
      if(c === 'n' || c === 'm') m = m + m;
      out += dedupFr_(out, m);
    }
    return out;
  }

  /* A word-final consonant is mute in French unless a mute e follows it. */
  function finFr_(s){
    var lastc, before;
    if(s === '') return s;
    lastc = s.charAt(s.length - 1);
    if(VFRSET_.indexOf(lastc) >= 0) return s;     /* already open */
    if(lastc === 'g') return s.substr(0, s.length - 1) + 'gue';  /* ge would be /ʒ/ */
    if(lastc === 's'){
      before = s.charAt(s.length - 2);
      if(VFRSET_.indexOf(before) >= 0) return s + 'se';          /* -sse, or it voices */
      return s + 'e';
    }
    return s + 'e';
  }

  /* One syllable. The two trailing arguments are context supplied by word_fr;
     called with none, the syllable is treated as a whole little word. */
  function syl_fr(p, prevV, isLast){
    var nu, on, co, s;
    if(prevV === undefined) prevV = false;
    if(isLast === undefined) isLast = true;
    nu = nuFr_(p.nu);
    if(nu === ''){                                /* a bare consonant tail */
      s = onFr_(p.on, '', prevV) + coFr_(p.co);
      return isLast ? finFr_(s) : s;
    }
    co = coFr_(p.co);
    /* loi de position: a lone /e/ shut in by a consonant is è to a French eye
       (père, sel, bel) — é there would look, and read, like an open syllable */
    if(nu === 'é' && co !== '') nu = 'è';
    on = onFr_(p.on, nu, prevV);
    s = on + nu + co;
    if(isLast && co !== '') s = finFr_(s);
    return s;
  }

  /* The whole word. Stress is always on the first syllable and is shown in
     capitals, accents kept, the way French typography keeps them (ÉCOLE). */
  function word_fr(ps){
    var out = [], i, prevV, s, prev, tail;
    for(i = 0; i < ps.length; i++){
      prevV = false;
      if(i > 0){
        tail = out[i - 1].charAt(out[i - 1].length - 1);
        prevV = VFRSET_.indexOf(tail) >= 0;
      }
      out.push(syl_fr(ps[i], prevV, i === ps.length - 1));
    }
    for(i = 1; i < out.length; i++){
      prev = out[i - 1];
      s = out[i];
      tail = prev.charAt(prev.length - 1);
      /* French splits a double s across the break: as-sez, not a-ssez */
      if(s.substr(0, 2) === 'ss' && VFRSET_.indexOf(tail) >= 0){
        out[i - 1] = prev + 's';
        out[i] = s.substr(1);
        continue;
      }
      /* the doubling that blocked nasalisation is undone if the next syllable
         supplies the second nasal itself: AN-na, not ANN-na */
      if((tail === 'n' || tail === 'm') && s.charAt(0) === tail &&
         prev.charAt(prev.length - 2) === tail){
        out[i - 1] = prev.substr(0, prev.length - 1);
        continue;
      }
      /* g + n would be read /ɲ/; gh keeps it hard, as in spaghetti */
      if(tail === 'g' && s.charAt(0) === 'n'){ out[i - 1] = prev + 'h'; continue; }
      /* a silent h that would glue onto the syllable before it is dropped */
      if(s.charAt(0) === 'h' && 'ptscg'.indexOf(tail) >= 0) out[i] = s.substr(1);
    }
    /* a word-initial ss- has nothing to lean on, so it is written single */
    if(out.length && out[0].substr(0, 2) === 'ss') out[0] = out[0].substr(1);
    for(i = 0; i < out.length; i++){
      if(i === 0) out[i] = out[i].toUpperCase();
    }
    return out.join('-');
  }

  return {
    label  : "Français",
    rdName : "transcription figurée",
    all    : "tous",
    pos    : {n:"nom", v:"verbe", adj:"adjectif", adv:"adverbe", pro:"pronom", num:"numéral", part:"particule", conj:"conjonction", intj:"interjection", aff:"affixe", nm:"nom propre", x:"autre"},
    read   : mkApprox(word_fr, syl_fr),
    str    : {
      "ai.ask"                    : "Consulter",
      "ai.hint"                   : "　",
      "ai.left"                   : "{0} restantes aujourd’hui",
      "ai.limit.s"                : "Plus offre des conseils illimités, chaque jour.",
      "ai.limit.t"                : "Vous avez utilisé vos questions du jour",
      "ai.see"                    : "Voir les forfaits",
      "ai.title"                  : "Conseil",
      "ai.unl"                    : "Illimité",
      "cap.warn"                  : "{0} mots restants en Gratuit",
      "ch.clear"                  : "Aucun caractère",
      "ch.for"                    : "Un caractère pour « {0} »",
      "count.script"              : "{0} sur {1}",
      "lock.ai"                   : "Conseils illimités",
      "lock.export"               : "Export et sauvegarde",
      "lock.sync"                 : "Synchronisation cloud",
      "lock.t"                    : "Fonction Plus",
      "ob.back"                   : "Retour",
      "add.ph"                    : "Sons de cette langue",
      "add.ph.none"               : "Pas encore de sons",
      "ipa.b.back"                : "postérieure",
      "ipa.b.central"             : "centrale",
      "ipa.b.front"               : "antérieure",
      "ipa.cons"                  : "Consonnes",
      "ipa.h.close"               : "fermée",
      "ipa.h.closemid"            : "mi-fermée",
      "ipa.h.mid"                 : "moyenne",
      "ipa.h.nearclose"           : "pré-fermée",
      "ipa.h.nearopen"            : "pré-ouverte",
      "ipa.h.open"                : "ouverte",
      "ipa.h.openmid"             : "mi-ouverte",
      "ipa.m.approx"              : "approximante",
      "ipa.m.fricative"           : "fricative",
      "ipa.m.latapprox"           : "appr. lat.",
      "ipa.m.latfric"             : "fric. lat.",
      "ipa.m.nasal"               : "nasale",
      "ipa.m.plosive"             : "occlusive",
      "ipa.m.tap"                 : "battue",
      "ipa.m.trill"               : "roulée",
      "ipa.mine"                  : "Sons de cette langue",
      "ipa.mine.none"             : "Rien de choisi pour l’instant.",
      "ipa.other"                 : "Autres",
      "ipa.p.alveolar"            : "alvéolaire",
      "ipa.p.bilabial"            : "bilabiale",
      "ipa.p.dental"              : "dentale",
      "ipa.p.glottal"             : "glottale",
      "ipa.p.labiodental"         : "labiodentale",
      "ipa.p.palatal"             : "palatale",
      "ipa.p.pharyngeal"          : "pharyngale",
      "ipa.p.postalveolar"        : "post-alvéol.",
      "ipa.p.retroflex"           : "rétroflexe",
      "ipa.p.uvular"              : "uvulaire",
      "ipa.p.velar"               : "vélaire",
      "ipa.vows"                  : "Voyelles",
      "home.new.t"                : "Une première lettre est tracée.",
      "home.new.s"                : "Encore quelques-unes et vos mots pourront s’écrire avec elles.",
      "next.sc0"                  : "Dessinez la lettre suivante",
      "set.account"               : "Compte",
      "set.account.guest"         : "Non connecté",
      "set.account.soon"          : "Pas encore branché.",
      "ob.borrow.h"               : "Lettre empruntée",
      "ob.borrow.sub"             : "　",
      "ob.borrow.take"            : "　",
      "ob.door.h"                 : "La porte arbore désormais votre lettre.",
      "ob.door.note"              : "Ni nom, ni compte. Cela peut attendre.",
      "ob.draw.done"              : "Terminé",
      "ob.draw.empty"             : "Dessinez d'abord un trait",
      "ob.draw.sub"               : "　",
      "ob.lang.a"                 : "Langue de l’interface",
      "ob.open"                   : "Ouvrir la porte",
      "ob.or"                     : "Employer une écriture existante",
      "ob.enter"                  : "Commencer",
      "ob.name.auto"              : "Choisir pour moi",
      "ob.name.h"                 : "Nom de la langue",
      "ob.name.mini"              : "Modifiable plus tard",
      "ob.name.ph"                : "un nom",
      "ob.signin.apple"           : "Continuer avec Apple",
      "ob.signin.google"          : "Continuer avec Google",
      "ob.signin.skip"            : "Continuer sans compte",
      "ob.signin.local"           : "Uniquement sur cet appareil",
      "ob.tagline"                : "Donnez de nouvelles couleurs à vos mots.",
      "script.none2"              : "Pas encore de caractères",
      "script.own.ph"             : "Collez ou saisissez un caractère",
      "script.set"                : "Choisir",
      "snd.have"                  : "Déjà dans votre langue",
      "sug.ask"                   : "Rien ne vient ?",
      "sug.for"                   : "Formes pour « {0} »",
      "sug.hint"                  : "Fait avec les sons que vous employez",
      "sug.left"                  : "{0} restantes aujourd’hui",
      "sug.more"                  : "D’autres idées",
      "sug.out"                   : "Plus d’idées pour aujourd’hui. Avec Plus, elles continuent.",
      "up.cta"                    : "Passer à Plus",
      "ws.arabic"                 : "Arabe",
      "ws.armenian"               : "Arménien",
      "ws.cyrillic"               : "Cyrillique",
      "ws.devanagari"             : "Dévanagari",
      "ws.geez"                   : "Guèze",
      "ws.georgian"               : "Géorgien",
      "ws.glagolitic"             : "Glagolitique",
      "ws.greek"                  : "Grec",
      "ws.hangul"                 : "Hangeul",
      "ws.hebrew"                 : "Hébreu",
      "ws.ogham"                  : "Ogam",
      "ws.phoenician"             : "Phénicien",
      "ws.runic"                  : "Runique",
      "ws.thai"                   : "Thaï",
      "ws.tibetan"                : "Tibétain",
      "ob.start"         : "Commencer",
      "seed.star"        : "étoile",
      "seed.water"       : "eau",
      "seed.wind"        : "vent",
      "seed.light"       : "lumière",
      "seed.forest"      : "forêt",
      "seed.sky"         : "ciel",
      "seed.love"        : "aimer",
      "seed.walk"        : "marcher",
      "lang.default"     : "Ma langue",
      "nav.contents"     : "Sommaire",
      "nav.settings"     : "Réglages",
      "home.kicker"      : "Votre langue",
      "wld.title"    : "À quoi sert cette langue",
      "wld.ask"      : "À quoi sert cette langue",
      "wld.use"      : "À quoi elle sert",
      "wld.story"    : "Une histoire",
      "wld.story.d"  : "Un livre, un film, un jeu",
      "wld.people"   : "Un peuple",
      "wld.people.d" : "Un peuple qui n'est pas d'ici",
      "wld.place"    : "Un lieu",
      "wld.place.d"  : "Une vallée, une île, une ville",
      "wld.real"     : "Pour être parlée",
      "wld.real.d"   : "Pour s'en servir vraiment",
      "wld.play"     : "Pour voir",
      "wld.play.d"   : "Pour voir ce que ça donne",
      "wld.where"    : "Où on la parle",
      "wld.where.ph" : "les vallées du nord",
      "wld.who"      : "Qui la parle",
      "wld.who.ph"   : "les gens du fleuve",
      "wld.note"     : "Notes",
      "wld.note.ph"  : "N'importe quoi sur l'endroit où vit cette langue.",
      "home.unnamed"     : "Nommez-la",
      "home.name.prompt" : "Nom de la langue",
      'next.t'   : "Ensuite",
      'next.w0'  : "Créez votre premier mot",
      'next.w1'  : "Ajoutez des mots — encore {0} avant de voir des règles",
      'next.mk'  : "Créez des mots à partir de vos sons",
      "toc.words"        : "Lexique",
      "sent.nomean"      : "sans sens",
      "sent.say"         : "Écouter",
      "sent.clear"       : "Effacer",
      "tab.build"        : "Créer",
      "tab.find"         : "Chercher",
      "tab.home"         : "Accueil",
      "form.gone"        : "Ce n'est plus là.",
      "find.ph"          : "Chercher",
      "find.mine.h"      : "Tout ce que vous avez fait",
      "find.world.h"     : "Les langues des autres",
      "find.world.d"     : "Pas encore ouvert. Quand ça le sera, ce sera ici.",
      "toc.sound"        : "Phonologie",
      "toc.letters"      : "Lettres",
      "ab.title"         : "L'établi des voyelles",
      "ab.mark"          : "La marque de {0}",
      "ab.every"         : "Toutes les consonnes avec {0}",
      "ab.cell"          : "Touchez-en une pour la dessiner à part",
      "ab.left"          : "Vers la gauche",
      "ab.right"         : "Vers la droite",
      "ab.up"            : "Vers le haut",
      "ab.down"          : "Vers le bas",
      "ab.bigger"        : "Plus grande",
      "ab.smaller"       : "Plus petite",
      "ab.draw"          : "Dessiner la marque",
      "ab.nomark"        : "Pas encore de marque",
      "ab.nocons"        : "Pas encore de consonnes.",
      "ab.novow"         : "Pas encore de voyelles.",
      "ab.notabugida"    : "Seulement pour une abugida",
      "lt.all"           : "Toutes les lettres",
      "lt.none"          : "Pas encore de lettres",
      "lt.new"           : "Nouvelle lettre",
      "lt.untitled"      : "Sans nom",
      "lt.draw"          : "Dessiner",
      "lt.use"           : "Employer une lettre existante",
      "lt.addsnd"        : "Lecture",
      "lt.reads"         : "lit {0}",
      "lt.reads.none"    : "ne lit encore rien",
      "lt.reads.h"       : "Lit",
      "lt.name"          : "Nom",
      "lt.name.ph"       : "p. ex. esh",
      "lt.loose"         : "{0} lettres ne lisent encore rien.",
      "lt.loose.1"       : "Une lettre ne lit encore rien.",
      "toc.gram"         : "Grammaire",
      "toc.make"         : "En forger plusieurs",
      /* what the app proposes */
      "as.soft"         : "Doux",
      "as.soft.d"       : "Nasales, l et r, voyelles simples — comme le japonais ou l'italien",
      "as.hard"         : "Dur",
      "as.hard.d"       : "Occlusives et sifflantes, peu de voyelles — comme le géorgien",
      "as.flowing"      : "Coulant",
      "as.flowing.d"    : "Sons voisés, cinq voyelles",
      "as.breathy"      : "Aspiré",
      "as.breathy.d"    : "Fricatives et h — comme l'arabe ou le gallois",
      "as.plain"        : "Simple",
      "as.plain.d"      : "Un petit jeu, facile — comme l'hawaïen",
      "as.hear"         : "Tout écouter",
      "as.again"        : "Un autre jeu",
      "as.own"          : "Choisir moi-même",
      "as.drop"         : "Retirer",
      "as.more.c"       : "Ajouter une consonne",
      "as.more.v"       : "Ajouter une voyelle",
      "as.more.none"    : "Plus aucun son à ajouter.",
      /* the grammar, in stages */
      "stg.words"        : "Les mots dont cette étape a besoin",
      "stg.rules"        : "La règle",
      "stg.rules.ph"     : "　",
      "stg.ex"           : "Phrases",
      "stg.ex.lb.ph"     : "",
      "stg.noun.t"       : "Noms",
      "stg.noun.d"       : "Le pluriel et les formes du nom",
      "stg.verb.t"       : "Verbes",
      "stg.verb.d"       : "Le temps et les formes du verbe",
      "stg.neg.not"      : "ne pas",
      "stg.ask.why"      : "pourquoi",
      "stg.ask.how"      : "comment",
      "stg.conj.t"       : "Relier",
      "stg.conj.d"       : "Les mots qui relient les propositions",
      "stg.conj.and"     : "et",
      "stg.conj.or"      : "ou",
      "stg.conj.but"     : "mais",
      "stg.conj.because" : "parce que",
      "stg.conj.if"      : "si",
      "stg.conj.then"    : "alors",
      "stg.part.t"       : "Particules",
      "stg.part.d"       : "Petits mots qui marquent la fonction",
      "stg.polite.t"     : "Politesse",
      "stg.polite.d"     : "Comment la langue change en politesse",
      "stg.where.t"      : "Lieu",
      "stg.where.in"     : "dans",
      "stg.where.on"     : "sur",
      "stg.where.under"  : "sous",
      "stg.where.to"     : "vers",
      "stg.where.from"   : "de",
      "stg.where.with"   : "avec",
      "stg.where.d"      : "Où c'est et où ça va",
      "stg.when.t"       : "Temps",
      "stg.when.now"     : "maintenant",
      "stg.when.before"  : "avant",
      "stg.when.after"   : "après",
      "stg.when.today"   : "aujourd'hui",
      "stg.when.tomorrow" : "demain",
      "stg.when.yesterday" : "hier",
      "stg.when.d"       : "Quand ça arrive",
      "stg.decide"       : "Décider",
      "stg.note"         : "Notes",
      "stg.note.ph"      : "Tout ce qui touche à cette partie de la grammaire.",
      "stg.make"         : "le faire",
      "stg.keep"         : "Enregistrer",
      "stg.drop"         : "Supprimer le mot",
      "stg.help"         : "Propositions",
      "stg.help.d"       : "Fait avec les sons que vous employez",
      "stg.again"        : "D’autres",
      "stg.own.add.btn"  : "Ajouter une section",
      "stg.own.h"        : "Nouvelle section",
      "stg.own.title"    : "Nom",
      "stg.own.title.ph" : "p. ex. Formules de politesse",
      "stg.own.words"    : "Les mots dont elle a besoin",
      "stg.own.words.ph" : "un par ligne\nvous pouvez laisser vide",
      "stg.own.add"      : "Ajouter",
      "stg.own.need"     : "Donnez-lui un nom",
      "stg.own.added"    : "{0} ajoutée",
      "stg.own.untitled" : "Étape sans nom",
      "stg.own.del"      : "Supprimer la section",
      "stg.own.del.ask"  : "Supprimer cette étape ? Les mots qu’elle contient restent dans le dictionnaire.",
      /* the stages */
      "stg.greet.t"      : "Oui, non, bonjour",
      "stg.greet.d"      : "Un mot chacun",
      "stg.greet.yes"    : "oui",
      "stg.greet.no"     : "non",
      "stg.greet.hello"  : "bonjour",
      "stg.greet.bye"    : "au revoir",
      "stg.greet.thanks" : "merci",
      "stg.pron.t"       : "Je, tu, ils",
      "stg.pron.d"       : "Les mots qui peuvent être sujet",
      "stg.pron.i"       : "je",
      "stg.pron.you"     : "tu",
      "stg.pron.he"      : "il / elle",
      "stg.pron.we"      : "nous",
      "stg.pron.youpl"   : "vous",
      "stg.pron.they"    : "ils",
      "stg.order.t"      : "Ordre des mots",
      "stg.order.d"      : "Où vont sujet, objet et verbe",
      "stg.num.t"        : "Plus d’un",
      "stg.num.d"        : "Si un mot montre qu’il y en a plus d’un, et comment.",
      "stg.time.t"       : "Déjà arrivé",
      "stg.time.d"       : "Ce que devient un mot d’action une fois l’action finie.",
      "stg.neg.t"        : "Dire non",
      "stg.neg.d"        : "Comment on dit le contraire",
      "stg.ask.t"        : "Demander",
      "stg.ask.d"        : "Comment on pose une question",
      "stg.ask.what"     : "quoi",
      "stg.ask.who"      : "qui",
      "stg.ask.where"    : "où",
      "stg.ask.when"     : "quand",
      "stg.desc.t"       : "Décrire",
      "stg.desc.d"       : "Où se place l'adjectif",
      "stg.have.t"       : "Appartenance",
      "stg.have.d"       : "Comment on dit l'appartenance",
      "stg.count.t"      : "Compter",
      "stg.count.d"      : "De un à dix",
      /* the kinds of writing */
      "ws.kind"           : "Type d'écriture",
      "ws.k.alpha"        : "Alphabet",
      "ws.k.alpha.d"      : "Une lettre, un son",
      "ws.k.alpha.eg"     : "une lettre, un son — comme l’alphabet latin ou le cyrillique",
      "ws.k.syll"         : "Syllabaire",
      "ws.k.syll.d"       : "Une lettre, une syllabe",
      "ws.k.syll.eg"      : "une lettre, une syllabe — comme les kana, où ka est une seule lettre",
      "ws.k.abjad"        : "Abjad",
      "ws.k.abjad.d"      : "Consonnes seules",
      "ws.k.abjad.eg"     : "les consonnes seules — comme l’arabe ou l’hébreu",
      "ws.k.abugida"      : "Alphasyllabaire",
      "ws.k.abugida.d"    : "Lettre consonne, marque vocalique",
      "ws.k.abugida.eg"   : "une lettre portant un signe de voyelle — comme le dévanagari",
      "ws.k.logo"         : "Logographie",
      "ws.k.logo.d"       : "Une lettre, un mot",
      "ws.k.logo.eg"      : "une lettre, un mot — comme les caractères chinois",
      "ws.made"           : "Ce que les deux forment ensemble",
      /* onboarding */
      "ob.next"           : "Suivant",
      "ob.name.sub"       : "　",
      "ob.name.note"      : "Modifiable plus tard",
      "ob.name.later"      : "Plus tard",
      "ob.ws.h"           : "Type d'écriture",
      "ob.ws.sub"         : "　",
      "ob.ws.note"        : "Modifiable plus tard",
      "ob.snds.h"         : "Sons de cette langue",
      "ob.snds.sub"       : "　",
      "ob.snds.n"         : "{0} sons choisis",
      "ob.snds.n.1"       : "1 son choisi",
      "ob.snds.note"      : "Le tableau entier vient après",
      "ob.snds.need"      : "Choisissez un son",
      "ob.draw.h2"        : "La lettre de {0}",
      "ob.draw.later"     : "La dessiner plus tard",
      /* the writing system */
      "script.preview"    : "Votre écriture",
      "script.show.roman" : "Alphabet latin",
      "script.show.own"   : "Vos lettres",
      /* the letter editor */
      "glyph.circle"      : "Arrondir",
      "glyph.new"         : "Nouveau",
      "glyph.undo"        : "Annuler",
      "glyph.clear"       : "Tout effacer",
      "glyph.cancel"      : "Abandonner",
      "glyph.save"        : "Enregistrer",
      "glyph.saved"       : "{0} enregistrée",
      "count.words"      : "{0} mots",
      "count.words.1"    : "1 mot",
      "count.sounds"     : "{0} sons",
      "count.sounds.1"   : "1 son",
      "count.gram"       : "{0} décidées",
      "count.gram.1"     : "1 décidée",
      "count.lines.1"    : "1 ligne",
      "home.empty.t"     : "Pas encore un seul mot",
      "home.empty.s"     : "Tout commence par un mot unique.<br>Écrivez la graphie ; la lecture suit d’elle-même.",
      "home.empty.btn"   : "Premier mot",
      "home.recent.line" : "Dernière phrase",
      "home.recent.word" : "Dernier mot",
      "home.write"       : "Nouveau mot",
      "words.search"     : "Chercher graphie, sens, lecture",
      "words.clear"      : "Effacer",
      "words.n"          : "{0} mots",
      "words.n.1"        : "Un mot",
      "words.sort.a"     : "Par le son",
      "words.sort.new"   : "Les plus récents d'abord",
      "words.kids"       : "{0} dérivés",
      "words.kids.1"     : "Un dérivé",
      "words.open"       : "Ouvrir",
      "words.sayall"     : "Tout écouter",
      "words.stop"       : "Arrêter",
      "words.nomatch"    : "Rien trouvé",
      "words.empty"      : "Pas encore de mots",
      "sound.used"       : "Consonnes employées",
      "sound.unused"     : "Consonnes non employées",
      "sound.none"       : "Aucune pour l’instant.",
      "sound.vowels"     : "Voyelles",
      "sound.together"   : "Dits ensemble",
      "link.yes"         : "la consonne finale se lie au mot suivant",
      "link.no"          : "chaque mot reste séparé",
      "sound.listen"     : "Écouter",
      /* notes */
      "toc.notes"        : "Carnet",
      "count.notes"      : "{0} notes",
      "count.notes.1"    : "1 note",
      "notes.note"       : "　",
      "notes.new"        : "Nouvelle note",
      "notes.edit"       : "Note",
      "notes.t"          : "Titre",
      "notes.t.ph"       : "facultatif",
      "notes.b"          : "Note",
      "notes.b.ph"       : "Qui la parle. Pourquoi un mot en est aussi un autre. Tout ce que vous oublieriez d’ici demain.",
      "notes.save"       : "Enregistrer",
      "notes.del"        : "Supprimer",
      "notes.untitled"   : "Sans titre",
      "notes.empty.t"    : "Rien de noté pour l’instant",
      "notes.empty.s"    : "Aucune",
      "toast.note.kept"  : "Note gardée",
      "toast.note.gone"  : "Note supprimée",
      "confirm.note.del" : "Supprimer cette note ?",
      /* the conversation */
      "toc.talk"         : "Conversation",
      "count.turns"      : "{0} répliques",
      "count.turns.1"    : "1 réplique",
      "talk.compose"     : "Votre phrase",
      "talk.send"        : "Envoyer",
      "talk.wipe"        : "Vider",
      "talk.empty.t"     : "Pas encore de quoi parler",
      "talk.empty.s"     : "Une conversation demande au moins une chose et une action.<br>Écrivez d’abord un nom et un verbe.",
      "confirm.talk.clear": "Effacer toute la conversation ?",
      /* grammar — the decisions */
      "gram.order.t"     : "Ordre des mots",
      "gram.role.S"      : "qui fait",
      "gram.role.O"      : "qui subit",
      "gram.role.V"      : "l’action",
      "gram.adj.t"       : "Où se place un mot qui décrit",
      "gram.adj.before"       : "Avant",
      "gram.adj.after"       : "Après",
      "gram.num.t"       : "Plus d’un",
      "gram.past.t"      : "Déjà arrivé",
      "gram.neg.t"       : "Dire non",
      "gram.q.t"         : "Demander",
      "gram.poss.t"      : "Appartenance",
      "gram.how.none"    : "Non marqué",
      "gram.how.suffix"  : "À la fin",
      "gram.how.prefix"  : "Au début",
      "gram.how.redup"   : "Dit deux fois",
      "gram.how.before"  : "Un mot avant",
      "gram.how.after"   : "Un mot après",
      "gram.how.start"   : "Un mot au début",
      "gram.how.end"     : "Un mot à la fin",
      "gram.demo.need"   : "Écrivez quelques mots de plus",
      "gram.pair.one"    : "un",
      "gram.pair.many"   : "plusieurs",
      "gram.pair.now"    : "maintenant",
      "gram.pair.past"   : "avant",
      "gram.pair.yes"    : "oui",
      "gram.pair.no"     : "non",
      "gram.pair.say"    : "dire",
      "gram.pair.ask"    : "demander",
      "gram.pair.plain"  : "seul",
      "gram.pair.owned"  : "à lui",
      "gram.pair.phrase" : "groupe",
      "gram.pair.line"   : "ligne",
      "gram.seen"        : "Ce que montrent vos mots",
      "rules.empty.t"    : "Aucune règle encore",
      "rules.empty.s"    : "Écrivez d'abord quelques mots",
      "rules.next"       : "Ensuite : {0}",
      "find.final.t"     : "Les {0} finissent en <em>-{1}</em>",
      "find.final.d"     : "{1} sur {0} le font. Les nouveaux mots peuvent garder cette forme.",
      "find.cons.t"      : "Consonnes qui sonnent : <em>{0}</em>",
      "find.cons.d"      : "Votre réserve de sons sur {0} mots. Ajoutez-en un qui manque et toute la langue change de couleur.",
      "find.vow.t"       : "Seulement <em>{0}</em> — {1} en tout",
      "find.vow.d"       : "Moins il y a de voyelles, plus la langue sonne d’un seul tenant. Vous pourrez l’élargir quand il vous plaira.",
      "find.syl.t"       : "Les mots font <em>{0} syllabes</em>",
      "find.syl.t.1"     : "Les mots font <em>une syllabe</em>",
      "find.syl.d"       : "{1} mots sur {0}. Des longueurs égales font une langue parlée plutôt qu’assemblée.",
      "find.coda.t"      : "Les mots ne finissent jamais que par <em>{0}</em>",
      "find.coda.d"      : "Plus cette liste est étroite, plus les mots s’enchaînent proprement quand on les dit à la suite.",
      "find.unused.t"    : "<em>{0}</em> n’apparaissent jamais",
      "find.unused.d"    : "Avoir des sons dont on ne se sert jamais est aussi une signature.",
      "hint.pos"         : "Écrivez {0} {1} de plus et une règle apparaîtra : la façon dont finit un {1}.",
      "hint.pos.1"       : "Écrivez un {1} de plus et une règle apparaîtra : la façon dont finit un {1}.",
      "hint.more"        : "Plus il y a de mots, plus il y a de règles à trouver.",
      "sent.weave"       : "Tisser",
      "sent.prev"        : "Avant",
      "sent.later"       : "Après",
      "sent.undo"        : "Annuler un",
      "sent.reads"       : "À voix haute, cette ligne donne",
      "sent.choose"      : "Choisir des mots",
      "sent.search"      : "Chercher graphie ou sens",
      "sent.nomatch"     : "Rien trouvé.",
      "words.addmn"      : "Ajouter un sens",
      "sent.chk.fix"     : "Remettre dans l’ordre choisi",
      "sent.listen"      : "Écouter",
      "sent.reweave"     : "Tisser encore",
      "sent.drop"        : "Supprimer",
      "toast.kept"       : "Phrase gardée",
      "toast.dropped"    : "Supprimée",
      "toast.reordered"  : "Remis dans l’ordre que vous aviez choisi",
      "make.empty.t"     : "Pas assez de matière",
      "make.empty.s"     : "Écrivez d’abord vous-même quelques mots.<br>Lingua imite leur sonorité.",
      "make.left"        : "Il reste {0} mots dans la formule Free.",
      "make.left.1"      : "Il reste un mot dans la formule Free.",
      "make.lock.t"      : "Demander tout un lot d’un coup",
      "make.lock.d"      : "« Trente mots autour de la mer » — et ils arrivent",
      "make.reroll"      : "D'autres propositions",
      "make.pick"        : "Choisir",
      "make.one"         : "Regénérer",
      "make.commit"      : "Ajouter la sélection",
      "toast.noselect"   : "Rien n’est sélectionné",
      "toast.cap"        : "La formule Free contient {0} mots",
      "toast.added.n"    : "{0} mots ajoutés. Les sens s’écrivent depuis la liste des mots",
      "toast.added.n.1"  : "Un mot ajouté. Son sens s’écrit depuis la liste des mots",
      "set.title"        : "Réglages",
      "set.look"         : "Apparence",
      "theme.system"     : "Système",
      "theme.light"      : "Clair",
      "theme.dark"       : "Sombre",
      "set.theme.note"   : "« Système » suit l'appareil",
      "set.reading"      : "Affichage des lectures",
      "read.ipa"         : "IPA",
      "read.both"        : "Les deux",
      "set.sample"       : "Exemple",
      "set.display"      : "Langue d’affichage",
      "set.voice.try"    : "Essayer",
      "set.lang"         : "Langue",
      "set.name"         : "Nom",
      "set.count"        : "Mots",
      "set.plan"         : "Formule",
      "set.plan.cur"     : "Formule actuelle",
      "set.data"         : "Données",
      "set.csv.out"      : "Exporter en CSV",
      "set.csv.in"       : "Importer depuis un CSV",
      "set.cloud"        : "Sauvegarde en ligne",
      "set.on"           : "Activée",
      "set.lock.csv.t"   : "Import et export CSV",
      "set.lock.csv.d"   : "Versez d’un coup un lot préparé dans un tableur",
      "set.lock.cloud.t" : "Sauvegarde en ligne",
      "set.lock.cloud.d" : "Survit à un nouveau téléphone ; un seul dictionnaire sur tous vos appareils",
      "set.wipe"         : "Tout effacer",
      "confirm.wipe"     : "Effacer tous les mots que vous avez faits et recommencer ?",
      "plans.title"      : "Formules",
      "plans.intro"      : "Faire une langue est gratuit, et le restera.<br>Ce qui coûte, c’est d’en garder beaucoup, et de penser aux côtés d’une IA.",
      "plan.cur"         : "actuelle",
      "plan.tofree"      : "Revenir à Free",
      "plan.choose"      : "Choisir",
      "plans.note"       : "Le paiement n’est pas encore branché. Pour l’instant, cela ne change que ce qu’affichent les écrans.",
      "plan.free.1"      : "Bâtir chaque mot à la main, du premier au dernier",
      "plan.free.2"      : "Règles trouvées pour vous, lectures déduites pour vous",
      "plan.free.3"      : "Liaisons montrées, et lues à voix haute",
      "plan.free.4"      : "Produire en série des mots qui suivent vos règles",
      "plan.free.5"      : "Conservé sur l’appareil · jusqu’à 100 mots",
      "plan.plus.1"      : "Mots sans limite",
      "plan.plus.2"      : "Sauvegarde en ligne (nouveau téléphone, plusieurs appareils)",
      "plan.plus.3"      : "Importer et exporter les mots en CSV",
      "plan.plus.4"      : "Tout ce que contient Free",
      "plan.studio.1"    : "Travailler avec une IA (forme à partir du sens, grammaire, exemples)",
      "plan.studio.2"    : "Engendrer tout un vocabulaire à partir d’un thème",
      "plan.studio.3"    : "Tout ce que contient Plus",
      "plan.price.free"  : "0 $",
      "plan.price.plus"  : "9 $ / mois",
      "plan.price.studio": "19 $ / mois",
      "toast.plan.free"  : "Retour à la formule Free",
      "toast.plan.other" : "(simulation) passé à {0}",
      "add.title"        : "Nouveau mot",
      "f.spelling"       : "Graphie",
      "f.reading"        : "Lecture",
      "f.listen"         : "Écouter",
      "f.meaning"        : "Sens",
      "f.meaning.ph"     : "étoile",
      "f.pos"            : "Nature du mot",
      "add.btn"          : "Ajouter",
      "add.lock.t"       : "Proposer une forme",
      "add.lock.d"       : "Fait avec les sons que vous employez",
      "toast.hw2"        : "Une graphie demande au moins deux lettres",
      "toast.dup"        : "Ce mot existe déjà",
      "toast.added.1"    : "{0} ajouté",
      "voice.none"       : "Cet appareil ne peut pas jouer de son",
      "words.coin"       : "En forger plusieurs",
      "word.sounds"      : "Sons",
      "word.means"       : "Ce qu’il veut dire",
      "word.mn.add"      : "Ajouter",
      "word.mn.del"      : "Retirer",
      "word.family"      : "D’où il vient",
      "word.from"        : "Dérivé de {0}",
      "word.derive"      : "Dériver un mot",
      "word.note"        : "Notes",
      "word.sp"          : "Lecture",
      "word.sp.none"     : "　",
      "word.sp.del"      : "Retirer la lettre",
      "word.note.ph"     : "n'importe quoi sur ce mot",
      "word.syn"         : "Mots qui veulent dire la même chose",
      "word.syn.none"    : "Aucun",
      "word.syn.add"     : "Choisir des mots qui veulent dire la même chose",
      "word.ant"         : "Mots qui veulent dire le contraire",
      "word.ant.none"    : "Aucun",
      "word.ant.add"     : "Choisir des mots qui veulent dire le contraire",
      "word.ex"          : "Exemples",
      "word.ex.gl.ph"    : "ce que ça veut dire",
      "word.ex.del"      : "Supprimer",
      "word.ex.need"     : "Écrivez d'abord la phrase",
      "add.title.from"   : "Un mot tiré de {0}",
      "glyph.other"      : "Lettre",
      "glyph.borrow"     : "Emprunter plutôt un caractère",
      "glyph.borrowed"   : "Lettre empruntée",
      "glyph.del"        : "Supprimer la lettre",
      "glyph.del.ask"    : "Retirer la lettre de ce son ? Le son reste dans votre langue.",
      "glyph.deleted"    : "{0} n’a plus de lettre",
      "word.mn.ph"       : "Ajouter un sens",
      "word.save"        : "Enregistrer",
      "word.del"         : "Supprimer le mot",
      "confirm.del"      : "Supprimer {0} ?",
      "toast.saved"      : "{0} mis à jour",
      "toast.deleted"    : "{0} supprimé",
      "csv.title"        : "Importer une liste",
      "csv.note"         : "Un par ligne. Un sens seul devient un mot nouveau.",
      "csv.ph"           : "chat\neau\nmarcher\n\nkano, montagne, nom",
      "csv.btn"          : "Importer",
      "csv.done"         : "{0} reprises, {1} forgées",
      "toast.exported"   : "Exporté",
      "toast.exportfail" : "Export impossible",
      "toast.imported"   : "{0} mots importés",
      "toast.imported.1" : "Un mot importé",
      "read.sep"         : "  "
    }
  };
})());
