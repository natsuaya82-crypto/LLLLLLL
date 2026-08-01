/* Lingua — the interface in Русский (ru).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- ru — Русский ------------------------------------------------------ */
defLang('ru', (function(){
  /* Lingua reading layer — Russian (ru).
     Практическая транскрипция: the conlang word rewritten in Cyrillic with the
     spelling conventions Russian uses for foreign proper names, stress marked
     with a combining acute, syllables written solid (no separators).
     Plain ES5. Uses the host-provided splitC(). */

  /* --- consonant units (splitC keeps ch/sh/th together) --------------------- */
  var CON_RU = {
    b:'б', ch:'ч', d:'д', f:'ф', g:'г', h:'х', j:'й', k:'к', l:'л', m:'м',
    n:'н', p:'п', r:'р', s:'с', sh:'ш', t:'т', th:'т', v:'в', w:'у', z:'з',
    c:'к', q:'к', x:'кс', y:'й',
    _v:'в'   /* internal: /w/ retracted to в where у would collide with у */
  };

  /* letter -> vowel phoneme, exactly as the engine hears it (y = /i/) */
  var VPHON_RU = { a:'a', e:'e', i:'i', o:'o', u:'u', y:'i' };

  /* hard series: the consonant in front of these stays hard (except before и) */
  var VHARD_RU = { a:'а', e:'э', i:'и', o:'о', u:'у' };

  /* iotated series, used after ь (consonant + /j/ + vowel) */
  var VSOFT_RU = { a:'я', e:'е', i:'и', o:'ё', u:'ю' };

  /* iotated series at the start of a word or after a vowel */
  var VIOT_RU  = { a:'я', e:'е', i:'йи', o:'ё', u:'ю' };

  var VLET_RU = 'аэиоуяеёюы';

  /* letters after which a following iotated vowel needs a separating sign */
  var HARDC_RU = 'бвгдзклмнпрстфх';
  var HUSH_RU  = 'чш';
  var IOTL_RU  = 'яеёю';

  function cons_ru(units){
    var out = '', i;
    for(i = 0; i < units.length; i++) out += (CON_RU[units[i]] || '');
    return out;
  }

  /* Renders one syllable into three pieces so word_ru can find the stressed
     vowel: h = onset consonants, b = the vowel body, t = coda consonants. */
  function build_ru(p){
    var on = splitC(p.on || '');
    var glide = false, soft = false, i;

    /* an onset that ends in j (or in the y the syllabifier handed back) is a
       /j/ glide onto the vowel, not a letter й */
    while(on.length && (on[on.length - 1] === 'j' || on[on.length - 1] === 'y')){
      glide = true;
      on = on.slice(0, on.length - 1);
    }
    if(glide && on.length) soft = true;   /* consonant + ь + iotated vowel */

    /* the nucleus as phonemes */
    var ph = [], v;
    for(i = 0; i < (p.nu || '').length; i++){
      v = VPHON_RU[p.nu.charAt(i)];
      if(v) ph.push(v);
    }
    /* word-initial /i/ + another vowel is a glide too (Yamosh, Ionra) */
    if(!glide && on.length === 0 && ph.length > 1 && ph[0] === 'i' && ph[1] !== 'i'){
      glide = true;
      ph = ph.slice(1);
    }

    /* /w/ is у, but у immediately before у is unreadable: write в there */
    if(!glide && on.length && on[on.length - 1] === 'w' && ph.length && ph[0] === 'u'){
      on = on.slice(0, on.length - 1);
      on.push('_v');
    }
    var head = cons_ru(on);

    var last = head.charAt(head.length - 1);
    var body = '', c;
    for(i = 0; i < ph.length; i++){
      v = ph[i];
      if(i === 0){
        if(glide){
          body += soft ? ('ь' + VSOFT_RU[v]) : VIOT_RU[v];
        } else {
          c = VHARD_RU[v];
          /* ш and ч never take э in Russian spelling; they are already
             unpaired (ш hard, ч soft), so е there is read [e] anyway */
          if(c === 'э' && (last === 'ш' || last === 'ч')) c = 'е';
          body += c;
        }
      } else if(v === ph[i - 1]){
        body += VHARD_RU[v];        /* doubled letter = long vowel: аа ээ ии оо уу */
      } else if(v === 'i'){
        body += 'й';                /* off-glide: ай эй ой уй */
      } else {
        body += VHARD_RU[v];        /* аэ ао иа оу ... both vowels sounded */
      }
    }
    return { h: head, b: body, t: cons_ru(splitC(p.co || '')) };
  }

  function syl_ru(p){
    var r = build_ru(p);
    return r.h + r.b + r.t;
  }

  function word_ru(ps){
    if(!ps || !ps.length) return '';
    var out = '', i, j, c;
    for(i = 0; i < ps.length; i++) out += syl_ru(ps[i]);
    if(!out.length) return out;

    /* a /j/ that lands on a syllable seam right after a consonant (Anjo) would
       otherwise just palatalise it and lose the glide: separate the two with ъ,
       which keeps the consonant hard and the glide audible (объём) */
    for(j = out.length - 1; j > 0; j--){
      if(IOTL_RU.indexOf(out.charAt(j)) >= 0 &&
         HARDC_RU.indexOf(out.charAt(j - 1)) >= 0){
        out = out.slice(0, j) + 'ъ' + out.slice(j);
      }
    }

    /* stress is always on the first syllable; mark it with a combining acute,
       the way a Russian dictionary of proper names does. No mark when the word
       holds a single vowel letter (nothing to disambiguate), and none on ё,
       which is stressed by definition. */
    var nv = 0;
    for(j = 0; j < out.length; j++) if(VLET_RU.indexOf(out.charAt(j)) >= 0) nv++;
    if(nv > 1){
      var start = build_ru(ps[0]).h.length;
      for(j = start; j < out.length; j++){
        c = out.charAt(j);
        if(VLET_RU.indexOf(c) >= 0){
          if(c !== 'ё') out = out.slice(0, j + 1) + '́' + out.slice(j + 1);
          break;
        }
      }
    }
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  return {
    label  : "Русский",
    rdName : "практическая транскрипция",
    all    : "все",
    pos    : {n:"существительное", v:"глагол", adj:"прилагательное", x:"другое"},
    read   : mkApprox(word_ru, syl_ru),
    str    : {
      "ai.a.home"                 : "У вас {0} слов и {1} звуков. Быстрее всего — добавить слов: правила рождаются из них.",
      "ai.a.make"                 : "Словотворчество опирается на уже используемые звуки, поэтому новые слова покажутся родственными. Оставляйте те, что звучат верно.",
      "ai.a.rules"                : "Пока проступило правил: {0}. Продолжайте в тех же привычках — они закрепятся сами.",
      "ai.a.sent"                 : "У вас {0} предложений. Запишите одну мысль двумя способами — в различии и живёт ваша грамматика.",
      "ai.a.sound"                : "Вы используете {0} звуков: {1}. Небольшой и последовательный набор звучит естественнее большого и разрозненного.",
      "ai.a.words"                : "В вашем словаре {0} слов. Создавайте слова для того, о чём вы правда говорите; язык растёт из употребления.",
      "ai.ask"                    : "Спросить консультанта",
      "ai.hint"                   : "Консультант читает ваш язык и отвечает исходя из него.",
      "ai.left"                   : "Сегодня осталось: {0}",
      "ai.limit.s"                : "В Plus консультации без ограничений, каждый день.",
      "ai.limit.t"                : "Вопросы на сегодня закончились",
      "ai.see"                    : "Посмотреть тарифы",
      "ai.title"                  : "Языковой консультант",
      "ai.unl"                    : "Без ограничений",
      "cap.warn"                  : "На бесплатном тарифе осталось слов: {0}",
      "ch.clear"                  : "Без знака",
      "ch.for"                    : "Знак для «{0}»",
      "count.script"              : "{0} из {1}",
      "home.write"                : "Добавить слово",
      "lock.ai"                   : "Безлимитные консультации",
      "lock.export"               : "Экспорт и резервная копия",
      "lock.sync"                 : "Облачная синхронизация",
      "lock.t"                    : "Возможность Plus",
      "ob.back"                   : "Назад",
      "add.ph"                    : "Звуки языка",
      "add.ph.none"               : "У этого языка пока нет звуков. Выберите несколько, и из них можно будет строить слова.",
      "ipa.b.back"                : "задний",
      "ipa.b.central"             : "средний",
      "ipa.b.front"               : "передний",
      "ipa.cons"                  : "Согласные",
      "ipa.footer"                : "Символ означает один и тот же звук для всякого, кто читает таблицу. Как вы его назовёте и чем запишете — дело ваше.",
      "ipa.h.close"               : "закрытый",
      "ipa.h.closemid"            : "полузакрытый",
      "ipa.h.mid"                 : "средний",
      "ipa.h.nearclose"           : "почти закрытый",
      "ipa.h.nearopen"            : "почти открытый",
      "ipa.h.open"                : "открытый",
      "ipa.h.openmid"             : "полуоткрытый",
      "ipa.m.approx"              : "аппроксимант",
      "ipa.m.fricative"           : "щелевой",
      "ipa.m.latapprox"           : "лат. аппр.",
      "ipa.m.latfric"             : "лат. щелевой",
      "ipa.m.nasal"               : "носовой",
      "ipa.m.plosive"             : "взрывной",
      "ipa.m.tap"                 : "одноударный",
      "ipa.m.trill"               : "дрожащий",
      "ipa.mine"                  : "Этот язык берёт",
      "ipa.mine.none"             : "Пока ничего не выбрано.",
      "ipa.note"                  : "Выберите звуки, из которых состоит этот язык. Букву можно дать только тому звуку, который выбран здесь.",
      "ipa.other"                 : "Кроме того",
      "ipa.p.alveolar"            : "альвеолярный",
      "ipa.p.bilabial"            : "губно-губной",
      "ipa.p.dental"              : "зубной",
      "ipa.p.glottal"             : "глоттальный",
      "ipa.p.labiodental"         : "губно-зубной",
      "ipa.p.palatal"             : "палатальный",
      "ipa.p.pharyngeal"          : "фарингальный",
      "ipa.p.postalveolar"        : "постальвеол.",
      "ipa.p.retroflex"           : "ретрофлекс.",
      "ipa.p.uvular"              : "увулярный",
      "ipa.p.velar"               : "велярный",
      "ipa.vows"                  : "Гласные",
      "home.new.t"                : "Одна буква есть.",
      "home.new.s"                : "Ещё несколько — и ваши слова можно будет записать ими.",
      "next.sc0"                  : "Нарисуйте следующую букву",
      "set.account"               : "Учётная запись",
      "set.account.note"          : "Учётная запись уносит язык за пределы этого телефона. Здесь она ни для чего не нужна.",
      "set.account.soon"          : "Пока не подключено.",
      "ob.borrow.h"               : "Выберите письмо, из которого возьмёте знак.",
      "ob.borrow.sub"             : "Свою букву вы всё равно сможете нарисовать позже.",
      "ob.borrow.take"            : "Коснитесь знака, чтобы взять его.",
      "ob.door.h"                 : "Теперь на двери — ваша буква.",
      "ob.door.note"              : "Ни имени, ни учётной записи. Это подождёт.",
      "ob.draw.done"              : "Готово",
      "ob.draw.empty"             : "Сначала нарисуйте штрих.",
      "ob.draw.h"                 : "Нарисуйте первую букву<br>вашего языка.",
      "ob.draw.sub"               : "Любую. Она ваша.",
      "ob.lang.a"                 : "Язык интерфейса",
      "ob.open"                   : "Открыть дверь",
      "ob.or"                     : "Или начните с письма, которое уже существует",
      "ob.snd.h"                  : "Как она звучит?",
      "ob.snd.note.borrow"        : "Формы заимствованы, звуки ваши. Ничто здесь не обязано значить то, что оно значит там, где вы это нашли.",
      "ob.snd.note.draw"          : "Буква входит в ваш алфавит, а звук — в ваш набор звуков.",
      "ob.enter"                  : "Начать",
      "ob.lang.h"                 : "Выберите язык",
      "ob.name.auto"              : "Выбрать за меня",
      "ob.name.h"                 : "Как называется<br>ваш язык?",
      "ob.name.mini"              : "Это можно изменить в любой момент.",
      "ob.name.ph"                : "напр. Aelira",
      "ob.signin.apple"           : "Продолжить с Apple",
      "ob.signin.google"          : "Продолжить с Google",
      "ob.signin.note"            : "Войдите, чтобы начать.",
      "ob.signin.skip"            : "Продолжить без учётной записи",
      "ob.signin.local"           : "Без неё ваш язык останется на этом телефоне, и веб его не увидит.",
      "ob.tagline"                : "Придайте новые краски вашим словам.",
      "script.add"                : "Добавить знаки",
      "script.cons"               : "Согласные",
      "script.dup"                : "Уже взят",
      "script.empty"              : "Сначала создайте несколько слов — звуки берутся из них.",
      "script.h"                  : "Дайте каждому звуку знак",
      "script.mine"               : "Ваши знаки",
      "script.none"               : "Знаков пока нет",
      "script.none2"              : "Знаков пока нет",
      "script.none2s"             : "Выберите письмо ниже или введите собственный знак.",
      "script.own"                : "Или введите свой",
      "script.own.ph"             : "Вставьте или введите знак",
      "script.pick"               : "Коснитесь знака, чтобы взять его",
      "script.prev"               : "Предпросмотр",
      "script.rm"                 : "Убрать",
      "script.set"                : "Взять",
      "script.show"               : "Писать своим письмом",
      "script.snd"                : "звук",
      "script.sub"                : "Это звуки, которые ваш язык действительно использует. Звук без знака остаётся буквами.",
      "script.vow"                : "Гласные",
      "snd.add"                   : "Добавить звук",
      "snd.add.s"                 : "Звуки, которых ваш язык ещё не использовал.",
      "snd.have"                  : "Уже в вашем языке",
      "sug.ask"                   : "Ничего не приходит в голову?",
      "sug.for"                   : "Формы для «{0}» — коснитесь, чтобы оставить.",
      "sug.hint"                  : "Собраны из звуков, которые вы уже используете — коснитесь, чтобы оставить.",
      "sug.left"                  : "Сегодня осталось: {0}",
      "sug.more"                  : "Другие варианты",
      "sug.out"                   : "На сегодня варианты закончились. С Plus они не кончаются.",
      "toc.script"                : "Письмо",
      "up.cta"                    : "Перейти на Plus",
      "ws.arabic"                 : "Арабское",
      "ws.armenian"               : "Армянское",
      "ws.cyrillic"               : "Кириллица",
      "ws.devanagari"             : "Деванагари",
      "ws.geez"                   : "Геэз",
      "ws.georgian"               : "Грузинское",
      "ws.glagolitic"             : "Глаголица",
      "ws.greek"                  : "Греческое",
      "ws.hangul"                 : "Хангыль",
      "ws.hebrew"                 : "Иврит",
      "ws.ogham"                  : "Огам",
      "ws.phoenician"             : "Финикийское",
      "ws.runic"                  : "Руны",
      "ws.thai"                   : "Тайское",
      "ws.tibetan"                : "Тибетское",
      "ob.start"          : "Начать",
      "seed.star"         : "звезда",
      "seed.water"        : "вода",
      "seed.wind"         : "ветер",
      "seed.light"        : "свет",
      "seed.forest"       : "лес",
      "seed.sky"          : "небо",
      "seed.love"         : "любить",
      "seed.walk"         : "ходить",
      "lang.default"      : "Мой язык",
      "nav.contents"      : "Оглавление",
      "nav.settings"      : "Настройки",
      "home.kicker"       : "Ваш язык",
      "home.unnamed"      : "Дать имя",
      "home.name.prompt"  : "Название языка",
      'next.t'   : "Дальше",
      'next.w0'  : "Создайте первое слово",
      'next.w1'  : "Добавьте слова — ещё {0} до появления правил",
      'next.s0'  : "Напишите первое предложение",
      'next.mk'  : "Создавайте слова из своих звуков",
      "toc.words"         : "Лексика",
      "toc.sound"         : "Фонология",
      "toc.rules"         : "Грамматика",
      "toc.sent"          : "Предложения",
      "toc.make"          : "Словотворчество",
      /* the writing system */
      "toc.script"        : "Буквы",
      "script.preview"    : "Ваше письмо",
      "script.show"       : "Показывать слова",
      "script.show.roman" : "Латиницей",
      "script.show.own"   : "Своими буквами",
      "script.show.note"  : "Меняется только вид. То, что вы набираете и что сохраняется, остаётся теми же буквами — ничто не заперто внутри шрифта.",
      "script.needs"      : "Нарисуйте одну букву, и здесь появятся ваши слова, написанные ею.",
      "script.letters"    : "Алфавит",
      "script.empty.t"    : "Букв пока нет",
      "script.empty.s"    : "Сначала напишите слово — его звуки появятся здесь и будут ждать, когда вы их нарисуете.",
      "script.add"        : "Добавить букву",
      "script.add.prompt" : "Для какого звука эта буква? (a, k, sh …)",
      "script.add.bad"    : "От одной до трёх латинских букв.",
      "script.note"       : "Каждая буква рисуется в одном и том же квадрате и одной и той же толщиной пера — так телефон рисует любую японскую или корейскую букву одного размера. Шрифт собирается на вашем устройстве; никуда ничего не отправляется.",
      /* the letter editor */
      "glyph.circle"      : "Дуга",
      "glyph.new"         : "Новая",
      "glyph.undo"        : "Назад",
      "glyph.clear"       : "Очистить",
      "glyph.cancel"      : "Отмена",
      "glyph.save"        : "Сохранить",
      "glyph.saved"       : "{0} сохранена",
      "count.words"       : "{0} слов",
      "count.words.1"     : "1 слово",
      "count.words.few"   : "{0} слова",
      "count.sounds"      : "{0} звуков",
      "count.sounds.1"    : "1 звук",
      "count.sounds.few"  : "{0} звука",
      "count.rules"       : "{0} правил",
      "count.rules.1"     : "1 правило",
      "count.rules.few"   : "{0} правила",
      "count.lines"       : "{0} строк",
      "count.lines.1"     : "1 строка",
      "count.lines.few"   : "{0} строки",
      "home.empty.t"      : "Ни одного слова",
      "home.empty.s"      : "Всё начинается с одного слова.<br>Напишите написание — чтение появится само.",
      "home.empty.btn"    : "Написать первое слово",
      "home.recent.line"  : "Последнее предложение",
      "home.recent.word"  : "Последнее слово",
      "home.write"        : "Написать слово",
      "words.search"      : "Поиск: написание, значение, чтение",
      "words.nomatch"     : "Ничего не найдено",
      "words.empty"       : "Слов пока нет",
      "sound.used"        : "Согласные в ходу",
      "sound.unused"      : "Согласные не в ходу",
      "sound.none"        : "Пока ни одного.",
      "sound.allused"     : "В ходу все до одной.",
      "sound.note"        : "Звуки, от которых язык отказался, — такая же его часть, как и те, что он держит.<br>Мелкий знак под каждой буквой — Международный фонетический алфавит, IPA: один символ на один звук, в любом языке на земле.",
      "sound.vowels"      : "Гласные",
      "sound.together"    : "Слитно",
      "link.yes"          : "конечный согласный перетекает в следующее слово",
      "link.no"           : "каждое слово стоит отдельно",
      "sound.listen"      : "Послушать",
      "sound.linkhint"    : "Напишите слово, которое начинается с гласного, — и согласный перед ним перетечёт через границу, так что два слова станут одним дыханием.",
      "sound.footer"      : "Вся эта арифметика считается внутри вашего устройства. Без сети, без ИИ.",
      "rules.intro"       : "Вы написали {0} слов — привычки нашлись простым подсчётом. Не назначены, а обнаружены.",
      "rules.intro.1"     : "Вы написали одно слово — привычки нашлись простым подсчётом. Не назначены, а обнаружены.",
      "rules.intro.few"   : "Вы написали {0} слова — привычки нашлись простым подсчётом. Не назначены, а обнаружены.",
      "rules.empty.t"     : "Правил пока нет",
      "rules.empty.s"     : "Сначала напишите несколько слов.",
      "rules.next"        : "Дальше: {0}",
      "rules.make"        : "Создать слова по этим правилам",
      "find.final.t"      : "Окончание для «{0}»: <em>-{1}</em>",
      "find.final.d"      : "Так делают {1} из {0}. Новые слова могут держать ту же форму.",
      "find.final.d.1"    : "Так делает единственное слово. Новые слова могут держать ту же форму.",
      "find.final.d.few"  : "Так делают {1} из {0}. Новые слова могут держать ту же форму.",
      "find.cons.t"       : "Сейчас звучат согласные: <em>{0}</em>",
      "find.cons.d"       : "Ваш запас звуков на {0} слов. Добавьте тот, которого здесь нет, — и язык сменит цвет.",
      "find.cons.d.1"     : "Ваш запас звуков на одно слово. Добавьте тот, которого здесь нет, — и язык сменит цвет.",
      "find.cons.d.few"   : "Ваш запас звуков на {0} слова. Добавьте тот, которого здесь нет, — и язык сменит цвет.",
      "find.vow.t"        : "Только <em>{0}</em> — всего {1} гласных звуков",
      "find.vow.t.1"      : "Только <em>{0}</em> — всего один гласный звук",
      "find.vow.t.few"    : "Только <em>{0}</em> — всего {1} гласных звука",
      "find.vow.d"        : "Чем меньше гласных, тем цельнее звучит язык. Расширить набор можно когда угодно.",
      "find.syl.t"        : "Слова укладываются в <em>{0} слогов</em>",
      "find.syl.t.1"      : "Слова укладываются в <em>один слог</em>",
      "find.syl.t.few"    : "Слова укладываются в <em>{0} слога</em>",
      "find.syl.d"        : "{1} из {0} слов. Ровная длина делает язык похожим на речь, а не на сборку.",
      "find.syl.d.1"      : "Единственное написанное слово. Ровная длина делает язык похожим на речь, а не на сборку.",
      "find.syl.d.few"    : "{1} из {0} слов. Ровная длина делает язык похожим на речь, а не на сборку.",
      "find.coda.t"       : "Слова оканчиваются только на <em>{0}</em>",
      "find.coda.d"       : "Чем короче этот список, тем чище слова стыкуются, когда вы говорите их подряд.",
      "find.unused.t"     : "<em>{0}</em> не встречаются ни разу",
      "find.unused.d"     : "Звуки, которыми вы не пользуетесь, — тоже примета языка.",
      "hint.pos"          : "Напишите ещё {0} слов «{1}» — и проступит правило: чем оканчивается «{1}».",
      "hint.pos.1"        : "Напишите ещё одно слово «{1}» — и проступит правило: чем оканчивается «{1}».",
      "hint.pos.few"      : "Напишите ещё {0} слова «{1}» — и проступит правило: чем оканчивается «{1}».",
      "hint.more"         : "Чем больше слов, тем больше правил можно найти.",
      "sent.empty.t"      : "Для предложения мало слов",
      "sent.empty.s"      : "Предложению нужны хотя бы два слова.<br>Сначала напишите несколько.",
      "sent.weave"        : "Сплести",
      "sent.prev"         : "Раньше",
      "sent.later"        : "Позже →",
      "sent.remove"       : "Убрать это слово",
      "sent.taphint"      : "Коснитесь слова, чтобы передвинуть его или убрать.",
      "sent.palhint"      : "Выбирайте слова внизу — они выстроятся здесь. Сколько угодно и одно и то же слово сколько угодно раз.",
      "sent.undo"         : "Шаг назад",
      "sent.clear"        : "Очистить",
      "sent.reads"        : "Вслух эта строка звучит так",
      "sent.say"          : "▶ Сказать",
      "sent.linkhint"     : "Поставьте в строку слово, начинающееся с гласного, — согласный перед ним перетечёт через границу, и они станут одним дыханием.",
      "sent.keep"         : "Сохранить предложение",
      "sent.need2"        : "Выстройте два слова или больше, чтобы услышать, как они стыкуются.",
      "sent.choose"       : "Выбрать слова",
      "sent.search"       : "Поиск: написание или значение",
      "sent.nomatch"      : "Ничего не найдено.",
      "sent.nomean"       : "без значения",
      "sent.order"        : "Порядок слов (правило этого языка)",
      "order.SOV.lab"     : "Подлежащее → Дополнение → Сказуемое",
      "order.SOV.ex"      : "Здесь японский и турецкий. «Я звезду вижу.»",
      "order.SVO.lab"     : "Подлежащее → Сказуемое → Дополнение",
      "order.SVO.ex"      : "Здесь английский. «Я вижу звезду.»",
      "order.VSO.lab"     : "Сказуемое → Подлежащее → Дополнение",
      "order.VSO.ex"      : "Здесь арабский и ирландский. «Вижу я звезду.»",
      "sent.chk.ok"       : "Строка идёт как <b>{0}</b> — ровно тот порядок, который вы выбрали.",
      "sent.chk.ng"       : "Строка идёт как <b>{0}</b>, а вы выбрали <b>{1}</b>.",
      "sent.chk.fix"      : "Переставить по правилу",
      "sent.chk.hint"     : "Выстройте подлежащее, дополнение и сказуемое — и Lingua сверит порядок с вашим правилом.<br>Любая другая расстановка тоже годится. Правило — ориентир, а не забор.",
      "sent.kept"         : "Сохранённые предложения",
      "sent.listen"       : "Послушать",
      "sent.reweave"      : "Сплести заново",
      "sent.drop"         : "Удалить",
      "sent.footer"       : "Чтения и то, как слова перетекают друг в друга, считаются внутри этого устройства.",
      "toast.need2"       : "Нужно хотя бы два слова",
      "toast.kept"        : "Предложение сохранено",
      "toast.dropped"     : "Удалено",
      "toast.reordered"   : "Переставлено по вашему порядку",
      "make.rule"         : "Держим ваше правило для «{0}»: слова оканчиваются на <span style=\"color:var(--gold)\">-{1}</span>.",
      "make.norule"       : "Для «{0}» правило ещё не сложилось, поэтому эти слова собраны только из звуков, которые вы уже используете.",
      "make.empty.t"      : "Не от чего оттолкнуться",
      "make.empty.s"      : "Сначала напишите несколько слов сами.<br>Lingua повторит их звучание.",
      "make.left"         : "На бесплатном тарифе осталось {0} слов.",
      "make.left.1"       : "На бесплатном тарифе осталось одно слово.",
      "make.left.few"     : "На бесплатном тарифе осталось {0} слова.",
      "make.lock.t"       : "Заказать сразу целый набор",
      "make.lock.d"       : "«Тридцать слов о море» — и они приходят",
      "make.reroll"       : "Ещё раз",
      "make.commit"       : "Добавить выбранные",
      "toast.noselect"    : "Ничего не выбрано",
      "toast.cap"         : "Бесплатный тариф вмещает {0} слов",
      "toast.cap.1"       : "Бесплатный тариф вмещает одно слово",
      "toast.cap.few"     : "Бесплатный тариф вмещает {0} слова",
      "toast.added.n"     : "Добавлено {0} слов. Значения можно вписать из списка слов",
      "toast.added.n.1"   : "Добавлено одно слово. Значение можно вписать из списка слов",
      "toast.added.n.few" : "Добавлено {0} слова. Значения можно вписать из списка слов",
      "set.title"         : "Настройки",
      "set.look"          : "Вид",
      "theme.system"      : "Системная",
      "theme.light"       : "Светлая",
      "theme.dark"        : "Тёмная",
      "set.theme.note"    : "«Системная» повторяет настройку устройства.",
      "set.reading"       : "Как показывать чтение",
      "read.ipa"          : "IPA",
      "read.both"         : "Оба",
      "set.sample"        : "Пример",
      "set.ipa.note"      : "IPA — это то, как мир записывает звук, чтобы его мог произнести кто угодно. Внутри <b style=\"color:var(--tx);font-weight:500\">/ /</b> знак <b style=\"color:var(--tx);font-weight:500\">.</b> — граница слога, а <b style=\"color:var(--tx);font-weight:500\">ː</b> тянет звук дольше. IPA — запись точная; {0} — приближение для тех, кто её читает.",
      "set.display"       : "Язык интерфейса",
      "set.display.note"  : "От него зависят и экран, и чтение ваших слов. IPA — нет: он один для всех языков. Для японского — катакана, для английского — практическая транскрипция вида <b style=\"color:var(--tx);font-weight:500\">AY-leen</b>, где прописные буквы отмечают ударение. По умолчанию — как на устройстве.",
      "set.voice"         : "Голос",
      "set.voice.cur"     : "Текущий голос",
      "set.voice.none"    : "не найден",
      "set.voice.pick"    : "Выбрать голос",
      "set.voice.auto"    : "Выбирать автоматически",
      "set.voice.wait"    : "Список голосов этого устройства ещё не загрузился. Нажмите где-нибудь «▶ Послушать» — и он появится.",
      "set.voice.try"     : "Проверить",
      "set.voice.note"    : "Если ничего не звучит, проверьте сначала переключатель беззвучного режима на боковой грани телефона, потом громкость. Если и это не помогло, часто выручает другой голос из списка выше. У итальянских и испанских голосов гласные ровные и простые — обычно это идёт выдуманному языку.",
      "set.lang"          : "Язык",
      "set.name"          : "Название",
      "set.count"         : "Слова",
      "set.plan"          : "Тариф",
      "set.plan.cur"      : "Текущий тариф",
      "set.data"          : "Данные",
      "set.csv.out"       : "Экспорт в CSV",
      "set.csv.in"        : "Импорт из CSV",
      "set.cloud"         : "Копия в облаке",
      "set.on"            : "Включено",
      "set.lock.csv.t"    : "Импорт и экспорт CSV",
      "set.lock.csv.d"    : "Влейте партию, собранную в таблице",
      "set.lock.cloud.t"  : "Копия в облаке",
      "set.lock.cloud.d"  : "Переживёт новый телефон; один словарь на все устройства",
      "set.wipe"          : "Стереть всё и начать заново",
      "set.footer"        : "Lingua · ваши слова хранятся на этом устройстве.",
      "set.footer.free"   : " Бесплатный тариф не выходит в сеть.",
      "confirm.wipe"      : "Стереть все слова, которые вы сделали, и начать заново?",
      "plans.title"       : "Тарифы",
      "plans.intro"       : "Делать язык — бесплатно и останется бесплатным.<br>Платить приходится за другое: за большой объём и за работу вместе с ИИ.",
      "plan.cur"          : "текущий",
      "plan.tofree"       : "Вернуться на Free",
      "plan.choose"       : "Выбрать этот тариф",
      "plans.note"        : "Оплата ещё не подключена. Пока это только переключает то, что показывают экраны.",
      "plan.free.1"       : "Собирать слова руками — сколько угодно",
      "plan.free.2"       : "Правила находятся сами, чтения выводятся сами",
      "plan.free.3"       : "Связывание видно и звучит вслух",
      "plan.free.4"       : "Слова партиями, по вашим правилам",
      "plan.free.5"       : "Хранение на устройстве · до 100 слов",
      "plan.plus.1"       : "Слова без ограничений",
      "plan.plus.2"       : "Копия в облаке (новый телефон, несколько устройств)",
      "plan.plus.3"       : "Импорт и экспорт слов в CSV",
      "plan.plus.4"       : "Всё из Free",
      "plan.studio.1"     : "Работа с ИИ (форма из значения, грамматика, примеры)",
      "plan.studio.2"     : "Целый словарь по одной теме",
      "plan.studio.3"     : "Всё из Plus",
      "plan.price.free"   : "$0",
      "plan.price.plus"   : "$9 / месяц",
      "plan.price.studio" : "$19 / месяц",
      "toast.plan.free"   : "Снова на бесплатном тарифе",
      "toast.plan.other"  : "(тест) переключено на {0}",
      "add.title"         : "Написать слово",
      "add.note"          : "Чтение выводится из написания, которое вы задали.",
      "f.spelling"        : "Написание",
      "f.reading"         : "Чтение",
      "f.listen"          : "Послушать",
      "f.meaning"         : "Значение",
      "f.meaning.ph"      : "звезда",
      "f.pos"             : "Часть речи",
      "add.btn"           : "Добавить",
      "add.lock.t"        : "Обсудить форму для значения",
      "add.lock.d"        : "«Хочу слово, в котором слышится тишина»",
      "toast.hw2"         : "В написании нужно хотя бы две буквы",
      "toast.dup"         : "Такое слово уже есть",
      "toast.added.1"     : "{0} добавлено",
      "word.syl"          : "Границы слогов",
      "word.note"         : "{0} слогов. Чтение вырастает из этих границ.<br>Сверху — IPA, снизу — приблизительное чтение для «{1}» ({2}).",
      "word.note.1"       : "Один слог. Чтение вырастает из написания.<br>Сверху — IPA, снизу — приблизительное чтение для «{1}» ({2}).",
      "word.note.few"     : "{0} слога. Чтение вырастает из этих границ.<br>Сверху — IPA, снизу — приблизительное чтение для «{1}» ({2}).",
      "word.edit"         : "Изменить",
      "word.mn.ph"        : "ещё не решено",
      "word.save"         : "Сохранить",
      "word.del"          : "Удалить слово",
      "confirm.del"       : "Удалить {0}?",
      "toast.saved"       : "{0} обновлено",
      "toast.deleted"     : "{0} удалено",
      "csv.title"         : "Импорт из CSV",
      "csv.note"          : "По слову в строке: написание, значение, часть речи. Строка заголовка не помешает.",
      "csv.ph"            : "Aelin,звезда,существительное&#10;Naeth,вода,существительное",
      "csv.btn"           : "Импортировать",
      "toast.exported"    : "Экспортировано",
      "toast.exportfail"  : "Не удалось экспортировать",
      "toast.imported"    : "Импортировано {0} слов",
      "toast.imported.1"  : "Импортировано одно слово",
      "toast.imported.few": "Импортировано {0} слова",
      "tts.none"          : "Это устройство не умеет читать вслух",
      "tts.err"           : "Звука не было. В «Настройки → Голос» можно выбрать другой",
      "tts.fail"          : "Не удалось прочитать вслух",
      "read.sep"          : "  "
    }
  };
})());
