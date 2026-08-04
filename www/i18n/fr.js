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
      "ai.a.home"                 : "Vous avez {0} mots et {1} sons. Le plus rapide est de créer d’autres mots : les règles en découlent.",
      "ai.a.make"                 : "La création suit les sons que vous employez déjà : les nouveaux mots sembleront apparentés. Gardez ceux qui sonnent juste.",
      "ai.a.rules"                : "{0} règles sont apparues. Continuez avec les mêmes habitudes et elles se préciseront d’elles-mêmes.",
      "ai.a.sent"                 : "Vous avez {0} phrases. Écrivez la même idée de deux façons — la différence, c’est votre grammaire.",
      "ai.a.sound"                : "Vous utilisez {0} sons : {1}. Un inventaire restreint et cohérent sonne plus vrai qu’un inventaire large et dispersé.",
      "ai.a.words"                : "Votre lexique compte {0} mots. Créez des mots pour ce dont vous parlez vraiment ; une langue grandit par l’usage.",
      "ai.ask"                    : "Consulter",
      "ai.hint"                   : "Le conseiller lit votre langue et répond à partir d’elle.",
      "ai.left"                   : "{0} restantes aujourd’hui",
      "ai.limit.s"                : "Plus offre des conseils illimités, chaque jour.",
      "ai.limit.t"                : "Vous avez utilisé vos questions du jour",
      "ai.see"                    : "Voir les forfaits",
      "ai.title"                  : "Conseiller linguistique",
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
      "add.ph"                    : "Ses sons",
      "add.ph.none"               : "Cette langue n’a pas encore de sons. Choisissez-en, et les mots pourront en être faits.",
      "ipa.b.back"                : "postérieure",
      "ipa.b.central"             : "centrale",
      "ipa.b.front"               : "antérieure",
      "ipa.cons"                  : "Consonnes",
      "ipa.footer"                : "Un symbole veut dire le même son pour quiconque lit le tableau. Le nom que vous lui donnez, et le signe avec lequel vous l’écrivez, sont à vous.",
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
      "ipa.mine"                  : "Cette langue emploie",
      "ipa.letters"               : "Touchez un son pour dessiner sa lettre, ou pour en emprunter une.",
      "ipa.mine.none"             : "Rien de choisi pour l’instant.",
      "ipa.note"                  : "Choisissez les sons dont cette langue est faite. Seul un son choisi ici pourra recevoir une lettre.",
      "ipa.other"                 : "En outre",
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
      "set.account.note"          : "Un compte emporte une langue hors de ce téléphone. Ici, rien n’en a besoin.",
      "set.account.soon"          : "Pas encore branché.",
      "ob.borrow.h"               : "Choisissez une écriture à emprunter.",
      "ob.borrow.sub"             : "Vous pourrez toujours dessiner la vôtre plus tard.",
      "ob.borrow.take"            : "Touchez un caractère pour le prendre.",
      "ob.door.h"                 : "La porte arbore désormais votre lettre.",
      "ob.door.note"              : "Ni nom, ni compte. Cela peut attendre.",
      "ob.draw.done"              : "Terminé",
      "ob.draw.empty"             : "Dessinez d’abord un trait.",
      "ob.draw.sub"               : "N’importe laquelle. Elle est à vous.",
      "ob.lang.a"                 : "Langue de l’interface",
      "ob.open"                   : "Ouvrir la porte",
      "ob.or"                     : "Ou partez d’une écriture qui existe déjà",
      "ob.enter"                  : "Commencer",
      "ob.name.auto"              : "Choisir pour moi",
      "ob.name.h"                 : "Comment s’appelle votre langue ?",
      "ob.name.mini"              : "Vous pourrez le changer à tout moment.",
      "ob.name.ph"                : "un nom",
      "ob.signin.apple"           : "Continuer avec Apple",
      "ob.signin.google"          : "Continuer avec Google",
      "ob.signin.skip"            : "Continuer sans compte",
      "ob.signin.local"           : "Sans lui, votre langue reste sur ce téléphone, et le web ne peut pas la voir.",
      "ob.tagline"                : "Donnez de nouvelles couleurs à vos mots.",
      "script.none2"              : "Pas encore de caractères",
      "script.none2s"             : "Choisissez une écriture ci-dessous, ou saisissez votre propre caractère.",
      "script.own.ph"             : "Collez ou saisissez un caractère",
      "script.set"                : "Choisir",
      "snd.have"                  : "Déjà dans votre langue",
      "sug.ask"                   : "Rien ne vient ?",
      "sug.for"                   : "Des formes pour « {0} » — touchez pour garder.",
      "sug.hint"                  : "Formés à partir des sons que vous employez déjà — touchez pour garder.",
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
      "home.unnamed"     : "Nommez-la",
      "home.name.prompt" : "Nom de la langue",
      'next.t'   : "Ensuite",
      'next.w0'  : "Créez votre premier mot",
      'next.w1'  : "Ajoutez des mots — encore {0} avant de voir des règles",
      'next.s0'  : "Écrivez votre première phrase",
      'next.mk'  : "Créez des mots à partir de vos sons",
      "toc.words"        : "Lexique",
      "tab.build"        : "Créer",
      "tab.find"         : "Chercher",
      "tab.home"         : "Accueil",
      "form.gone"        : "Ce n'est plus là.",
      "find.ph"          : "Chercher dans cette langue",
      "find.mine.h"      : "Tout ce que vous avez fait",
      "find.mine.d"      : "Orthographe, sens ou lecture — depuis n'importe où dans la langue.",
      "find.world.h"     : "Les langues des autres",
      "find.world.d"     : "Pas encore ouvert. Quand ça le sera, ce sera ici.",
      "toc.sound"        : "Phonologie",
      "toc.letters"      : "Lettres",
      "lt.note"          : "Une lettre et un son ne sont pas la même chose. Un son peut s'écrire de deux façons, une lettre peut se lire de deux façons, et une lettre peut exister avant que vous ayez décidé ce qu'elle dit.",
      "lt.all"           : "Toutes les lettres",
      "lt.none"          : "Pas encore de lettres.",
      "lt.new"           : "Une lettre nouvelle",
      "lt.untitled"      : "Sans nom",
      "lt.draw"          : "Dessiner une lettre",
      "lt.use"           : "Employer une lettre qui existe",
      "lt.use.d"         : "Quelles lettres écrivent {0}. Un son peut en avoir plusieurs.",
      "lt.addsnd"        : "Ce qu'elle lit",
      "lt.addsnd.d"      : "Donnez un nom à cette lettre et dites quels sons elle lit. Elle peut n'en lire aucun, ou plusieurs.",
      "lt.reads"         : "lit {0}",
      "lt.reads.none"    : "ne lit encore rien",
      "lt.reads.h"       : "Sons que cette lettre lit",
      "lt.name"          : "Nom",
      "lt.name.ph"       : "p. ex. esh",
      "lt.loose"         : "{0} lettres ne lisent encore rien.",
      "lt.loose.1"       : "Une lettre ne lit encore rien.",
      "toc.gram"         : "Grammaire",
      "toc.sent"         : "Phrases",
      "toc.make"         : "Néologie",
      /* what the app proposes */
      "as.soft"         : "Doux",
      "as.soft.d"       : "Nasales, l et r, voyelles simples. Comme le japonais ou l’italien.",
      "as.hard"         : "Dur",
      "as.hard.d"       : "Occlusives et sifflantes, peu de voyelles. Comme le géorgien ou le nahuatl.",
      "as.flowing"      : "Coulant",
      "as.flowing.d"    : "Sons voisés, cinq voyelles, presque rien de tranchant.",
      "as.breathy"      : "Aspiré",
      "as.breathy.d"    : "Fricatives et h. Comme l’arabe ou le gallois.",
      "as.plain"        : "Simple",
      "as.plain.d"      : "Un petit jeu de sons, facile à dire. Comme l’hawaïen.",
      "as.hear"         : "Tous les entendre",
      "as.again"        : "Un autre jeu",
      "as.own"          : "Les choisir moi-même",
      "as.drop"         : "Retirer ce son",
      "as.more.c"       : "Une consonne de plus",
      "as.more.v"       : "Une voyelle de plus",
      "as.more.none"    : "Plus aucun son à ajouter.",
      /* the grammar, in stages */
      "stg.list.d"       : "Une grammaire se bâtit par étapes. Chacune tient les mots dont elle a besoin, les décisions qu’elle porte, et une phrase que vous pourrez dire une fois qu’elle est finie.",
      "stg.words"        : "Les mots dont cette étape a besoin",
      "stg.decide"       : "Décider",
      "stg.note"         : "Notes sur cette étape",
      "stg.note.ph"      : "Tout ce qui touche à cette partie de la grammaire.",
      "stg.line"         : "Ce que vous pouvez dire maintenant",
      "stg.make"         : "le faire",
      "stg.make.d"       : "Touchez les sons, ou prenez l’une des suggestions.",
      "stg.keep"         : "Garder ce mot",
      "stg.drop"         : "Supprimer ce mot",
      "stg.help"         : "Proposer un mot",
      "stg.help.d"       : "Bâti à partir des sons de cette langue.",
      "stg.again"        : "D’autres",
      "stg.own.add.btn"  : "Ajouter une étape à vous",
      "stg.own.hint"     : "Formules de politesse, parenté, direction — ce dont cette langue finira par avoir besoin. Il n’y a pas de limite.",
      "stg.own.h"        : "Une étape à vous",
      "stg.own.d"        : "Nommez-la, et donnez les mots dont elle a besoin — un par ligne.",
      "stg.own.title"    : "Nom de l’étape",
      "stg.own.title.ph" : "p. ex. Formules de politesse",
      "stg.own.words"    : "Les mots dont elle a besoin",
      "stg.own.words.ph" : "un par ligne\nvous pouvez laisser vide",
      "stg.own.add"      : "L’ajouter",
      "stg.own.need"     : "Donnez un nom à l’étape.",
      "stg.own.added"    : "{0} ajoutée",
      "stg.own.untitled" : "Étape sans nom",
      "stg.own.del"      : "Supprimer cette étape",
      "stg.own.del.ask"  : "Supprimer cette étape ? Les mots qu’elle contient restent dans le dictionnaire.",
      /* the stages */
      "stg.greet.t"      : "Oui, non, bonjour",
      "stg.greet.d"      : "Les choses les plus courtes à dire. Un mot chacune, et la langue se parle.",
      "stg.greet.yes"    : "oui",
      "stg.greet.no"     : "non",
      "stg.greet.hello"  : "bonjour",
      "stg.greet.bye"    : "au revoir",
      "stg.greet.thanks" : "merci",
      "stg.pron.t"       : "Je, tu, ils",
      "stg.pron.d"       : "Sans eux il n’y a pas de sujet, et l’ordre des mots n’a rien à ranger.",
      "stg.pron.i"       : "je",
      "stg.pron.you"     : "tu",
      "stg.pron.he"      : "il / elle",
      "stg.pron.we"      : "nous",
      "stg.pron.youpl"   : "vous",
      "stg.pron.they"    : "ils",
      "stg.order.t"      : "Ordre des mots",
      "stg.order.d"      : "Maintenant qu’il y a un sujet, décidez où il se place.",
      "stg.num.t"        : "Plus d’un",
      "stg.num.d"        : "Si un mot montre qu’il y en a plus d’un, et comment.",
      "stg.time.t"       : "Déjà arrivé",
      "stg.time.d"       : "Ce que devient un mot d’action une fois l’action finie.",
      "stg.neg.t"        : "Dire non",
      "stg.neg.d"        : "Comment la langue dit le contraire de ce qui a été dit.",
      "stg.ask.t"        : "Demander",
      "stg.ask.d"        : "La marque qui change une chose dite en question, et les mots qui demandent une chose précise.",
      "stg.ask.what"     : "quoi",
      "stg.ask.who"      : "qui",
      "stg.ask.where"    : "où",
      "stg.ask.when"     : "quand",
      "stg.desc.t"       : "Décrire",
      "stg.desc.d"       : "Où se place un mot qui décrit.",
      "stg.have.t"       : "Appartenance",
      "stg.have.d"       : "Comment la langue dit qu’une chose est à une autre.",
      "stg.count.t"      : "Compter",
      "stg.count.d"      : "De un à dix. La plupart des langues bâtissent le reste à partir de ceux-là.",
      /* the kinds of writing */
      "ws.kind"           : "Ce dont une lettre est la lettre",
      "ws.k.alpha"        : "Alphabet",
      "ws.k.alpha.d"      : "Une lettre pour un son. Vous dessinez une lettre pour chaque son de votre langue.",
      "ws.k.alpha.eg"     : "une lettre, un son — comme l’alphabet latin ou le cyrillique",
      "ws.k.syll"         : "Syllabaire",
      "ws.k.syll.d"       : "Une lettre pour une syllabe entière. La consonne et la voyelle ne s’écrivent pas séparément.",
      "ws.k.syll.eg"      : "une lettre, une syllabe — comme les kana, où ka est une seule lettre",
      "ws.k.abjad"        : "Abjad",
      "ws.k.abjad.d"      : "Seules les consonnes s’écrivent. Les voyelles se savent d’après le mot et restent hors de la page.",
      "ws.k.abjad.eg"     : "les consonnes seules — comme l’arabe ou l’hébreu",
      "ws.k.abugida"      : "Alphasyllabaire",
      "ws.k.abugida.d"    : "La consonne a une lettre, la voyelle a un signe. Dessinez les deux et l’application les réunit.",
      "ws.k.abugida.eg"   : "une lettre portant un signe de voyelle — comme le dévanagari",
      "ws.k.logo"         : "Logographie",
      "ws.k.logo.d"       : "Une lettre pour un mot entier. Il y a une lettre à dessiner pour chaque mot que vous écrivez.",
      "ws.k.logo.eg"      : "une lettre, un mot — comme les caractères chinois",
      "ws.bases"          : "Les consonnes, chacune avec sa lettre",
      "ws.marks"          : "Les voyelles, chacune avec son signe",
      "ws.made"           : "Ce que les deux forment ensemble",
      /* onboarding */
      "ob.next"           : "Suivant",
      "ob.name.sub"       : "La seule chose sur laquelle vous avez déjà un avis.",
      "ob.name.note"      : "Vous pourrez le changer quand vous voudrez.",
      "ob.name.later"      : "Plus tard",
      "ob.ws.h"           : "Comment s’écrit-elle ?",
      "ob.ws.sub"         : "C’est ce qui décide ce qu’est une lettre ; le choix vient donc avant le dessin.",
      "ob.ws.note"        : "Vous pourrez changer plus tard, et ce que vous avez dessiné sera gardé.",
      "ob.snds.h"         : "De quels sons est-elle faite ?",
      "ob.snds.sub"       : "Choisissez-en quelques-uns. Vos mots seront bâtis à partir de ceux-là.",
      "ob.snds.n"         : "{0} sons choisis",
      "ob.snds.n.1"       : "1 son choisi",
      "ob.snds.note"      : "Le tableau entier — tous les sons qu’emploient les langues — sera ensuite à une touche.",
      "ob.snds.need"      : "Choisissez au moins un son.",
      "ob.draw.h2"        : "Dessinez la lettre pour {0}.",
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
      "count.lines"      : "{0} lignes",
      "count.lines.1"    : "1 ligne",
      "home.empty.t"     : "Pas encore un seul mot",
      "home.empty.s"     : "Tout commence par un mot unique.<br>Écrivez la graphie ; la lecture suit d’elle-même.",
      "home.empty.btn"   : "Écrire le premier mot",
      "home.recent.line" : "Dernière phrase",
      "home.recent.word" : "Dernier mot écrit",
      "home.write"       : "Écrire un mot",
      "words.search"     : "Chercher graphie, sens, lecture",
      "words.clear"      : "Effacer la recherche",
      "words.n"          : "{0} mots",
      "words.n.1"        : "Un mot",
      "words.sort.a"     : "Par le son",
      "words.sort.new"   : "Les plus récents d'abord",
      "words.kids"       : "{0} dérivés",
      "words.kids.1"     : "Un dérivé",
      "words.open"       : "Ouvrir ce mot",
      "words.sayall"     : "Tout écouter",
      "words.stop"       : "Arrêter",
      "words.nomatch"    : "Rien trouvé",
      "words.empty"      : "Aucun mot encore",
      "sound.used"       : "Consonnes employées",
      "sound.unused"     : "Consonnes non employées",
      "sound.none"       : "Aucune pour l’instant.",
      "sound.note"       : "Les sons qu’une langue refuse lui appartiennent autant que ceux qu’elle garde.<br>La petite marque sous chaque lettre est l’alphabet phonétique international : un symbole pour un son, dans toutes les langues de la terre.",
      "sound.vowels"     : "Voyelles",
      "sound.together"   : "Dits ensemble",
      "link.yes"         : "la consonne finale se lie au mot suivant",
      "link.no"          : "chaque mot reste séparé",
      "sound.listen"     : "Écouter",
      "sound.linkhint"   : "Écrivez un mot qui commence par une voyelle : la consonne qui le précède se lie à lui, et les deux ne font plus qu’un souffle.",
      "sound.footer"     : "Tout ce calcul se fait dans votre appareil. Aucun réseau, aucune IA.",
      /* notes */
      "toc.notes"        : "Carnet",
      "count.notes"      : "{0} notes",
      "count.notes.1"    : "1 note",
      "notes.note"       : "Tout ce qui touche à cette langue sans être un mot, un son ou une décision. Cela reste sur cet appareil, avec le reste.",
      "notes.new"        : "Nouvelle note",
      "notes.edit"       : "Cette note",
      "notes.t"          : "Titre",
      "notes.t.ph"       : "facultatif",
      "notes.b"          : "Note",
      "notes.b.ph"       : "Qui la parle. Pourquoi un mot en est aussi un autre. Tout ce que vous oublieriez d’ici demain.",
      "notes.save"       : "La garder",
      "notes.del"        : "Supprimer cette note",
      "notes.untitled"   : "Sans titre",
      "notes.empty.t"    : "Rien de noté pour l’instant",
      "notes.empty.s"    : "L’essentiel de ce que vous savez d’une langue que vous faites n’a pas encore de forme. C’est ici que cela se pose.",
      "notes.footer"     : "Du texte brut, conservé sur cet appareil. Rien ici n’est lu par le reste de l’application.",
      "toast.note.kept"  : "Note gardée",
      "toast.note.gone"  : "Note supprimée",
      "confirm.note.del" : "Supprimer cette note ?",
      /* the conversation */
      "toc.talk"         : "Conversation",
      "count.turns"      : "{0} répliques",
      "count.turns.1"    : "1 réplique",
      "talk.knows"       : "Il a lu toute cette langue : {0} mots, {1} sons, {2} décisions. Il ne parle rien d’autre.",
      "talk.first"       : "Choisissez quelques-uns de vos mots ci-dessous et envoyez-les. Il répondra dans votre langue.",
      "talk.compose"     : "Ce que vous dites",
      "talk.send"        : "La dire",
      "talk.wipe"        : "Effacer cette conversation",
      "talk.empty.t"     : "Pas encore de quoi parler",
      "talk.empty.s"     : "Une conversation demande au moins une chose et une action.<br>Écrivez d’abord un nom et un verbe.",
      "talk.footer"      : "Ses lignes sont bâties à partir de vos mots, dans votre ordre, avec vos marques dessus. Tout cela n’est que du calcul dans cet appareil — rien n’est envoyé nulle part.",
      "confirm.talk.clear": "Effacer toute la conversation ?",
      /* grammar — the decisions */
      "gram.note"        : "Ce sont des décisions, non des observations. Chacune change la forme que prennent vos mots, et ce changement s’entend.",
      "gram.order.t"     : "Ordre des mots",
      "gram.order.d"     : "Qui vient en premier : celui qui fait, celui qui subit, et l’action elle-même.",
      "gram.role.S"      : "qui fait",
      "gram.role.O"      : "qui subit",
      "gram.role.V"      : "l’action",
      "gram.adj.t"       : "Où se place un mot qui décrit",
      "gram.adj.d"       : "Avant la chose qu’il décrit, ou après elle.",
      "gram.adj.before"       : "Avant",
      "gram.adj.after"       : "Après",
      "gram.num.t"       : "Plus d’un",
      "gram.num.d"       : "Comment un mot dit qu’il y en a plus d’un — ou rien du tout, comme le font bien des langues.",
      "gram.past.t"      : "Déjà arrivé",
      "gram.past.d"      : "Ce que devient un mot d’action une fois l’action finie.",
      "gram.neg.t"       : "Dire non",
      "gram.neg.d"       : "Comment la langue défait ce que dit le reste de la ligne.",
      "gram.q.t"         : "Demander",
      "gram.q.d"         : "Ce qui change une chose dite en une chose demandée.",
      "gram.poss.t"      : "Appartenance",
      "gram.poss.d"      : "Comment la langue dit qu’une chose est à une autre.",
      "gram.how.none"    : "Non marqué",
      "gram.how.suffix"  : "À la fin",
      "gram.how.prefix"  : "Au début",
      "gram.how.redup"   : "Dit deux fois",
      "gram.how.before"  : "Un mot avant",
      "gram.how.after"   : "Un mot après",
      "gram.how.start"   : "Un mot au début",
      "gram.how.end"     : "Un mot à la fin",
      "gram.piece"       : "Le son qui le porte",
      "gram.piece.none"  : "non choisi",
      "gram.piece.h"     : "Quel son le porte",
      "gram.piece.d"     : "Bâti à partir des sons de cette langue, comme l’est un mot. C’est lui qui marque « {0} ».",
      "gram.piece.set"   : "Employer celui-ci",
      "gram.demo.need"   : "Écrivez encore quelques mots et vous les verrez changer ici.",
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
      "gram.seen"        : "Ce que vos mots font déjà",
      "gram.footer"      : "Rien ici n’est figé. Changez une décision et tous les exemples de cet écran changent avec elle.",
      "sent.order.d"     : "Décidé dans le chapitre Grammaire. Ici, il ne sert qu’à vérifier ce que vous avez tissé.",
      "rules.intro"      : "Habitudes relevées en comptant les {0} mots que vous avez écrits. Non pas décidées : découvertes.",
      "rules.intro.1"    : "Habitudes relevées en comptant l’unique mot que vous avez écrit. Non pas décidées : découvertes.",
      "rules.empty.t"    : "Aucune règle encore",
      "rules.empty.s"    : "Écrivez d’abord quelques mots.",
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
      "sent.empty.t"     : "Pas assez pour une phrase",
      "sent.empty.s"     : "Une phrase demande au moins deux mots.<br>Écrivez-en d’abord quelques-uns.",
      "sent.weave"       : "Tisser",
      "sent.prev"        : "Avant",
      "sent.later"       : "Après",
      "sent.remove"      : "Retirer ce mot",
      "sent.taphint"     : "Touchez un mot pour le déplacer ou le retirer.",
      "sent.palhint"     : "Choisissez des mots ci-dessous et ils s’alignent ici. Autant que vous voulez, et le même mot aussi souvent qu’il vous plaira.",
      "sent.undo"        : "Annuler un",
      "sent.clear"       : "Effacer",
      "sent.reads"       : "À voix haute, cette ligne donne",
      "sent.say"         : "La dire",
      "sent.linkhint"    : "Mettez dans la ligne un mot qui commence par une voyelle : la consonne qui le précède se lie à lui, et les deux ne font plus qu’un souffle.",
      "sent.keep"        : "Garder cette phrase",
      "sent.need2"       : "Alignez deux mots ou plus pour entendre comment ils se lient.",
      "sent.choose"      : "Choisir des mots",
      "sent.search"      : "Chercher graphie ou sens",
      "sent.nomatch"     : "Rien trouvé.",
      "sent.nomean"      : "sans sens",
      "words.addmn"      : "Ajouter un sens",
      "sent.order"       : "Ordre des mots (une règle de cette langue)",
      "sent.chk.ok"      : "La ligne donne <b>{0}</b> — exactement l’ordre que vous avez choisi.",
      "sent.chk.ng"      : "La ligne donne <b>{0}</b>, mais l’ordre que vous avez choisi est <b>{1}</b>.",
      "sent.chk.fix"     : "Remettre dans l’ordre choisi",
      "sent.chk.hint"    : "Alignez un sujet, un objet et un verbe : Lingua compare l’ordre à votre règle.<br>Tout autre agencement convient aussi. La règle est un repère, pas une barrière.",
      "sent.kept"        : "Phrases gardées",
      "sent.listen"      : "Écouter",
      "sent.reweave"     : "Tisser encore",
      "sent.drop"        : "Supprimer",
      "sent.footer"      : "Les lectures, et la façon dont les mots se lient, se calculent dans cet appareil.",
      "toast.need2"      : "Alignez au moins deux mots",
      "toast.kept"       : "Phrase gardée",
      "toast.dropped"    : "Supprimée",
      "toast.reordered"  : "Remis dans l’ordre que vous aviez choisi",
      "make.rule"        : "En gardant votre règle actuelle pour les {0} : ils finissent en <span style=\"color:var(--gold)\">-{1}</span>.",
      "make.norule"      : "Aucune règle ne s’est encore fixée pour les {0} : ceux-ci sont bâtis seulement à partir des sons que vous employez déjà.",
      "make.empty.t"     : "Pas assez de matière",
      "make.empty.s"     : "Écrivez d’abord vous-même quelques mots.<br>Lingua imite leur sonorité.",
      "make.left"        : "Il reste {0} mots dans la formule Free.",
      "make.left.1"      : "Il reste un mot dans la formule Free.",
      "make.lock.t"      : "Demander tout un lot d’un coup",
      "make.lock.d"      : "« Trente mots autour de la mer » — et ils arrivent",
      "make.reroll"      : "Tirer encore",
      "make.pick"        : "Choisir celui-ci",
      "make.one"         : "Regénérer celui-ci",
      "make.commit"      : "Ajouter ceux que j’ai choisis",
      "toast.noselect"   : "Rien n’est sélectionné",
      "toast.cap"        : "La formule Free contient {0} mots",
      "toast.added.n"    : "{0} mots ajoutés. Les sens s’écrivent depuis la liste des mots",
      "toast.added.n.1"  : "Un mot ajouté. Son sens s’écrit depuis la liste des mots",
      "set.title"        : "Réglages",
      "set.look"         : "Apparence",
      "theme.system"     : "Système",
      "theme.light"      : "Clair",
      "theme.dark"       : "Sombre",
      "set.theme.note"   : "« Système » suit le réglage de votre appareil.",
      "set.reading"      : "Affichage des lectures",
      "read.ipa"         : "IPA",
      "read.both"        : "Les deux",
      "set.sample"       : "Exemple",
      "set.ipa.note"     : "L’IPA est la manière dont le monde entier écrit un son pour que chacun puisse le dire, et un mot est ici écrit exactement ainsi, entre <b style=\"color:var(--tx);font-weight:500\">/ /</b>. {0} n’en est qu’une approximation, faite pour lire plutôt que pour dire.",
      "set.display"      : "Langue d’affichage",
      "set.display.note" : "L’écran et la lecture de vos mots suivent tous deux ce réglage. L’IPA, non : il est le même dans toutes les langues. Katakana pour le japonais, transcription figurée à la <b style=\"color:var(--tx);font-weight:500\">AY-leen</b> pour l’anglais, où les capitales marquent l’accent. Par défaut, celle de votre appareil.",
      "set.voice.try"    : "Essayer",
      "set.voice.note"   : "Chaque son est fabriqué ici, sur cet appareil, à partir du tableau lui-même — l’ouverture de la bouche, l’endroit où le son se fait, la voix mise ou non. Aucune voix de votre téléphone n’est employée, car une voix de téléphone ne sait dire qu’une langue, et celle-ci n’en est pas une. Si rien ne se fait entendre, vérifiez d’abord le bouton silencieux sur le côté, puis le volume.",
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
      "set.wipe"         : "Tout effacer et recommencer",
      "set.footer"       : "Lingua · vos mots sont conservés sur cet appareil.",
      "set.footer.free"  : " La formule Free ne touche jamais au réseau.",
      "confirm.wipe"     : "Effacer tous les mots que vous avez faits et recommencer ?",
      "plans.title"      : "Formules",
      "plans.intro"      : "Faire une langue est gratuit, et le restera.<br>Ce qui coûte, c’est d’en garder beaucoup, et de penser aux côtés d’une IA.",
      "plan.cur"         : "actuelle",
      "plan.tofree"      : "Revenir à Free",
      "plan.choose"      : "Choisir cette formule",
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
      "add.title"        : "Écrire un mot",
      "add.note"         : "La lecture se déduit de la graphie que vous écrivez.",
      "f.spelling"       : "Graphie",
      "f.reading"        : "Lecture",
      "f.listen"         : "Écouter",
      "f.meaning"        : "Sens",
      "f.meaning.ph"     : "étoile",
      "f.pos"            : "Nature du mot",
      "add.btn"          : "Ajouter",
      "add.lock.t"       : "Chercher une forme en parlant",
      "add.lock.d"       : "« Je veux un mot qui ait le goût du calme »",
      "toast.hw2"        : "Une graphie demande au moins deux lettres",
      "toast.dup"        : "Ce mot existe déjà",
      "toast.added.1"    : "{0} ajouté",
      "voice.none"       : "Cet appareil ne laisse pas l’application produire de son.",
      "words.coin"       : "En forger plusieurs",
      "word.sounds"      : "Les sons dont il est fait",
      "word.sounds.d"    : "Changez-les et le mot change, partout où il est employé.",
      "word.means"       : "Ce qu’il veut dire",
      "word.mn.add"      : "Ajouter",
      "word.mn.del"      : "Supprimer ce sens",
      "word.family"      : "D’où il vient",
      "word.from"        : "Dérivé de {0}",
      "word.derive"      : "Dériver un nouveau mot de celui-ci",
      "word.uses"        : "Employé dans",
      "word.uses.none"   : "Ce mot ne figure encore dans aucune phrase.",
      "word.note"        : "Note",
      "word.note.d"      : "Ce que vous voulez retenir de ce mot : d'où il vient, avec quoi il ne doit pas être confondu.",
      "word.note.ph"     : "n'importe quoi sur ce mot",
      "add.title.from"   : "Un mot tiré de {0}",
      "add.note.from"    : "Il s’ouvre comme le mot dont il dérive. Changez les sons à partir de là.",
      "glyph.other"      : "Sa lettre",
      "glyph.borrow"     : "Emprunter plutôt un caractère",
      "glyph.borrowed"   : "Emprunté pour ce son",
      "glyph.del"        : "Retirer la lettre de ce son",
      "glyph.del.ask"    : "Retirer la lettre de ce son ? Le son reste dans votre langue.",
      "glyph.deleted"    : "{0} n’a plus de lettre",
      "word.mn.ph"       : "Ajouter un sens",
      "word.save"        : "Enregistrer",
      "word.del"         : "Supprimer ce mot",
      "confirm.del"      : "Supprimer {0} ?",
      "toast.saved"      : "{0} mis à jour",
      "toast.deleted"    : "{0} supprimé",
      "csv.title"        : "Importer depuis un CSV",
      "csv.note"         : "Un mot par ligne : graphie, sens, nature du mot. Une ligne d’en-tête est acceptée.",
      "csv.ph"           : "Aelin,étoile,nom&#10;Naeth,eau,nom",
      "csv.btn"          : "Importer",
      "toast.exported"   : "Exporté",
      "toast.exportfail" : "Export impossible",
      "toast.imported"   : "{0} mots importés",
      "toast.imported.1" : "Un mot importé",
      "read.sep"         : "  "
    }
  };
})());
