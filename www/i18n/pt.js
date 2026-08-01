/* Lingua — the interface in Português (pt).
   Everything this language needs lives in this one closure: what it is
   called, what it calls the parts of speech, how it writes a foreign word,
   and every string a screen shows. It registers itself through defLang(),
   which www/core.js defines and which must therefore load first.
   Adding an eleventh language is adding one file and one <script> tag.
   ES5 only: this runs in an old WKWebView. */

/* --- pt — Português ---------------------------------------------------- */
defLang('pt', (function(){
  /* Lingua — leitura aproximada (Brazilian Portuguese reading approximation)
     Plain ES5. Globals: syl_pt(p), word_pt(ps). Helpers suffixed _pt.
     splitC() is supplied by the host app. */

  /* consonant units whose Portuguese letter is already the right letter */
  var C1_pt = {b:'b', d:'d', f:'f', l:'l', m:'m', n:'n', p:'p', t:'t', v:'v', z:'z'};

  /* a rendered letter that would turn g into [Z] */
  function front_pt(ch){ return ch === 'e' || ch === 'i'; }

  /* one consonant unit -> Portuguese letters.
     nx     = first rendered letter of whatever follows inside the syllable
     interV = this unit sits alone in the onset with a vowel on each side
     pr     = the source unit immediately before it (for /gw/) */
  function cons1_pt(u, nx, interV, pr){
    if (C1_pt[u]) return C1_pt[u];
    switch (u){
      /* /k/: k, not c/qu. c would need qu before e,i and would spell /ku/ as
         "cu", which is obscene in Portuguese. k is in the alphabet and is read
         [k] before every vowel. */
      case 'k': case 'c': case 'q': return 'k';
      /* /g/ must stay hard: gu- before e,i (gue, gui) */
      case 'g': return front_pt(nx) ? 'gu' : 'g';
      /* /h/ has no letter — Portuguese h is mute. But initial r and doubled rr
         ARE [h] in Brazil, so they spell it exactly: r- at the head, rr between
         vowels. */
      case 'h': return interV ? 'rr' : 'r';
      /* /r/ tap: single r between vowels and in clusters is the tap. At the head
         of a word it will be read [h]; nothing can be done about that. */
      case 'r': return 'r';
      /* /s/ voices to [z] between vowels, so double it there */
      case 's': return interV ? 'ss' : 's';
      /* /ks/: x alone is [S] initially and ambiguous elsewhere */
      case 'x': return 'ks';
      /* no /theta/: t, the ordinary Brazilian substitution (Ruth, Beth) */
      case 'th': return 't';
      /* /tS/ is tch (tchau, tchê) — ch alone is [S] in Portuguese */
      case 'ch': return 'tch';
      /* /S/ is ch, the one grapheme that is always [S] */
      case 'sh': return 'ch';
      /* /j/ glide: i, not j — Portuguese j is [Z]. "ioga", "iate" */
      case 'j': case 'y': return 'i';
      /* /w/: u, the Portuguese glide letter (uau, quatro). After g before e,i a
         plain u goes silent (gue = [ge]), so the trema has to come back. */
      case 'w': return (pr === 'g' && front_pt(nx)) ? 'ü' : 'u';
    }
    return u;
  }

  /* a whole onset or coda, resolved right-to-left so each unit sees its follower */
  function cons_pt(str, nx, interV){
    if (!str) return '';
    var u = splitC(str), out = [], i, s;
    for (i = u.length - 1; i >= 0; i--){
      s = cons1_pt(u[i], nx, interV && u.length === 1, i > 0 ? u[i - 1] : '');
      out.unshift(s);
      nx = s.charAt(0);
    }
    return out.join('');
  }

  /* nucleus: y -> i, and a doubled vowel collapses — Portuguese has no length,
     and "uu" would be read as two syllables */
  function nuc_pt(nu){
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

  /* The stressed syllable is the one place an accent is free: it is where
     Portuguese would put one anyway (Ângela, Mônica), so it reinforces the
     capitals instead of fighting them. Spend it only on a bare e/o, where it
     buys the closed [e]/[o] the conlang wants. A nasal coda already fixes the
     quality, so no accent there. */
  function stress_pt(nu, co){
    if (co && (co.charAt(0) === 'm' || co.charAt(0) === 'n')) return nu;
    if (nu === 'e') return 'ê';
    if (nu === 'o') return 'ô';
    return nu;
  }

  /* Portuguese spells no doubled consonant except ss and rr, and those two mean
     something else; every other double must collapse. ii/uu at the onset seam
     would be read as two syllables. */
  function tidy_pt(s){
    var was;
    do {
      was = s;
      s = s.replace(/([bdfgklmnptvz])\1/g, '$1')
           .replace(/ii/g, 'i')
           .replace(/uu/g, 'u');
    } while (s !== was);
    return s;
  }

  function endsVowel_pt(s){ return /[aeiouâêôáéíóúü]$/.test(s); }

  /* pv = the previous syllable ended in a vowel; st = this syllable is stressed */
  function sylp_pt(p, pv, st){
    var nu = nuc_pt(p.nu || '');
    if (!nu) return tidy_pt(cons_pt(p.on || '', '', false) + cons_pt(p.co || '', '', false));
    var co = cons_pt(p.co || '', '', false);
    var on = cons_pt(p.on || '', nu.charAt(0), pv === true);
    /* g + u + e/i: without the trema the u is silent (gue = [ge], not [gwe]) */
    if (on.charAt(on.length - 1) === 'g' && nu.charAt(0) === 'u' && front_pt(nu.charAt(1))){
      nu = 'ü' + nu.slice(1);
    }
    if (st) nu = stress_pt(nu, co);
    return tidy_pt(on + nu + co);
  }

  function syl_pt(p){ return sylp_pt(p, false, false); }

  /* last / first source consonant unit of a string */
  function lastU_pt(str){ var u = str ? splitC(str) : []; return u.length ? u[u.length - 1] : ''; }
  function firstU_pt(str){ var u = str ? splitC(str) : []; return u.length ? u[0] : ''; }

  function word_pt(ps){
    var out = [], i, s, prev;
    for (i = 0; i < ps.length; i++){
      s = sylp_pt(ps[i], i > 0 && endsVowel_pt(out[i - 1]), i === 0);
      /* a tap coda meeting a tap onset would spell rr, which is [h], not two
         taps — write one tap. (An /h/ onset also spells r; leave that one.) */
      if (i > 0 && lastU_pt(ps[i - 1].co) === 'r' && firstU_pt(ps[i].on) === 'r'){
        prev = out[i - 1];
        if (prev.charAt(prev.length - 1) === 'r') out[i - 1] = prev.slice(0, -1);
      }
      out.push(s);
    }
    if (out.length) out[0] = out[0].toUpperCase();
    return out.join('-');
  }

  return {
    label  : "Português",
    rdName : "transcrição figurada",
    all    : "todas",
    pos    : {n:"substantivo", v:"verbo", adj:"adjetivo", x:"outra"},
    read   : mkApprox(word_pt, syl_pt),
    str    : {
      "ai.a.home"                 : "Você tem {0} palavras e {1} sons. O caminho mais rápido é criar mais palavras: as regras surgem delas.",
      "ai.a.make"                 : "A criação segue os sons que você já usa, então as novas palavras parecerão aparentadas. Guarde as que soarem certas.",
      "ai.a.rules"                : "{0} regras surgiram até agora. Continue escrevendo com os mesmos hábitos e elas se firmarão sozinhas.",
      "ai.a.sent"                 : "Você tem {0} frases. Escreva a mesma ideia de dois jeitos — a diferença é onde mora a sua gramática.",
      "ai.a.sound"                : "Você usa {0} sons: {1}. Um inventário pequeno e coerente soa mais real que um amplo e disperso.",
      "ai.a.words"                : "Seu léxico tem {0} palavras. Crie palavras para o que você realmente fala; um idioma cresce pelo uso.",
      "ai.ask"                    : "Consultar",
      "ai.hint"                   : "O consultor lê o seu idioma e responde a partir dele.",
      "ai.left"                   : "Restam {0} hoje",
      "ai.limit.s"                : "O Plus dá conselhos ilimitados, todos os dias.",
      "ai.limit.t"                : "Você usou as consultas de hoje",
      "ai.see"                    : "Ver planos",
      "ai.title"                  : "Consultor linguístico",
      "ai.unl"                    : "Ilimitado",
      "cap.warn"                  : "Restam {0} palavras no Grátis",
      "ch.clear"                  : "Sem caractere",
      "ch.for"                    : "Um caractere para “{0}”",
      "count.script"              : "{0} de {1}",
      "home.write"                : "Adicionar palavra",
      "lock.ai"                   : "Conselhos ilimitados",
      "lock.export"               : "Exportar e backup",
      "lock.sync"                 : "Sincronização na nuvem",
      "lock.t"                    : "Recurso do Plus",
      "ob.back"                   : "Voltar",
      "home.new.t"                : "Já há uma letra.",
      "home.new.s"                : "Mais algumas e as suas palavras poderão ser escritas com elas.",
      "next.sc0"                  : "Desenhe a próxima letra",
      "set.account"               : "Conta",
      "set.account.note"          : "Uma conta leva um idioma para fora deste aparelho. Aqui nada precisa dela.",
      "set.account.soon"          : "Ainda não está ligado.",
      "ob.borrow.h"               : "Escolha uma escrita para pegar emprestada.",
      "ob.borrow.sub"             : "Você ainda pode desenhar a sua depois.",
      "ob.borrow.take"            : "Toque num caractere para pegá-lo.",
      "ob.door.h"                 : "A porta agora veste a sua letra.",
      "ob.door.note"              : "Sem nome, sem conta. Isso pode esperar.",
      "ob.draw.done"              : "Pronto",
      "ob.draw.empty"             : "Desenhe um traço primeiro.",
      "ob.draw.h"                 : "Desenhe a primeira letra<br>do seu idioma.",
      "ob.draw.sub"               : "Qualquer coisa. Ela é sua.",
      "ob.lang.a"                 : "Idioma da interface",
      "ob.open"                   : "Abrir a porta",
      "ob.or"                     : "Ou comece por uma escrita que já existe",
      "ob.snd.h"                  : "Como ela soa?",
      "ob.snd.note.borrow"        : "Formas emprestadas, sons seus. Nada aqui precisa significar o que significa no lugar onde você encontrou.",
      "ob.snd.note.draw"          : "A letra entra no seu alfabeto e o som entra no seu inventário.",
      "ob.enter"                  : "Começar",
      "ob.lang.h"                 : "Escolha o seu idioma",
      "ob.name.auto"              : "Escolha um por mim",
      "ob.name.h"                 : "Como se chama<br>o seu idioma?",
      "ob.name.mini"              : "Você pode mudar isso quando quiser.",
      "ob.name.ph"                : "ex. Aelira",
      "ob.signin.apple"           : "Continuar com a Apple",
      "ob.signin.google"          : "Continuar com o Google",
      "ob.signin.note"            : "Entre para começar.",
      "ob.signin.skip"            : "Continuar sem conta",
      "ob.signin.local"           : "Sem ela o seu idioma fica apenas neste aparelho, e a web não consegue vê-lo.",
      "ob.tagline"                : "Dê novas cores às suas palavras.",
      "script.add"                : "Adicionar caracteres",
      "script.cons"               : "Consoantes",
      "script.dup"                : "Já escolhido",
      "script.empty"              : "Crie algumas palavras primeiro — os sons vêm delas.",
      "script.h"                  : "Dê um caractere a cada som",
      "script.mine"               : "Seus caracteres",
      "script.none"               : "Ainda sem caracteres",
      "script.none2"              : "Ainda sem caracteres",
      "script.none2s"             : "Escolha uma escrita abaixo, ou digite um caractere seu.",
      "script.own"                : "Ou digite o seu",
      "script.own.ph"             : "Cole ou digite um caractere",
      "script.pick"               : "Toque num caractere para pegá-lo",
      "script.prev"               : "Prévia",
      "script.rm"                 : "Remover",
      "script.set"                : "Usar",
      "script.show"               : "Escrever na sua escrita",
      "script.snd"                : "som",
      "script.sub"                : "Estes são os sons que o seu idioma usa. Um som sem caractere mantém as letras.",
      "script.vow"                : "Vogais",
      "snd.add"                   : "Adicionar um som",
      "snd.add.s"                 : "Sons que o seu idioma ainda não usou.",
      "snd.have"                  : "Já no seu idioma",
      "sug.ask"                   : "Não vem nada à cabeça?",
      "sug.for"                   : "Formas para “{0}” — toque para ficar com uma.",
      "sug.hint"                  : "Feitas com os sons que você já usa — toque para ficar com uma.",
      "sug.left"                  : "Restam {0} hoje",
      "sug.more"                  : "Outras ideias",
      "sug.out"                   : "Acabaram as ideias por hoje. Com o Plus elas continuam.",
      "toc.script"                : "Escrita",
      "up.cta"                    : "Fazer upgrade",
      "ws.arabic"                 : "Árabe",
      "ws.armenian"               : "Armênio",
      "ws.cyrillic"               : "Cirílico",
      "ws.devanagari"             : "Devanágari",
      "ws.geez"                   : "Ge'ez",
      "ws.georgian"               : "Georgiano",
      "ws.glagolitic"             : "Glagolítico",
      "ws.greek"                  : "Grego",
      "ws.hangul"                 : "Hangul",
      "ws.hebrew"                 : "Hebraico",
      "ws.ogham"                  : "Ogham",
      "ws.phoenician"             : "Fenício",
      "ws.runic"                  : "Rúnico",
      "ws.thai"                   : "Tailandês",
      "ws.tibetan"                : "Tibetano",
      "ob.start"         : "Começar",
      "seed.star"        : "estrela",
      "seed.water"       : "água",
      "seed.wind"        : "vento",
      "seed.light"       : "luz",
      "seed.forest"      : "floresta",
      "seed.sky"         : "céu",
      "seed.love"        : "amar",
      "seed.walk"        : "caminhar",
      "lang.default"     : "Minha língua",
      "nav.contents"     : "Sumário",
      "nav.settings"     : "Ajustes",
      "home.kicker"      : "Sua língua",
      "home.unnamed"     : "Dar um nome",
      "home.name.prompt" : "Nome da língua",
      'next.t'   : "Próximo",
      'next.w0'  : "Crie a sua primeira palavra",
      'next.w1'  : "Adicione mais palavras — faltam {0} para surgirem regras",
      'next.s0'  : "Escreva a sua primeira frase",
      'next.mk'  : "Crie palavras a partir dos seus sons",
      "toc.words"        : "Léxico",
      "toc.sound"        : "Fonologia",
      "toc.rules"        : "Gramática",
      "toc.sent"         : "Frases",
      "toc.make"         : "Neologia",
      /* the writing system */
      "toc.script"        : "Letras",
      "script.preview"    : "A sua escrita",
      "script.show"       : "Mostrar as palavras em",
      "script.show.roman" : "Alfabeto latino",
      "script.show.own"   : "As suas letras",
      "script.show.note"  : "Muda apenas o que aparece. O que você digita e o que fica guardado continuam sendo as mesmas letras, então nada fica preso dentro de uma fonte.",
      "script.needs"      : "Desenhe uma letra e as suas palavras aparecem aqui escritas com ela.",
      "script.letters"    : "O alfabeto",
      "script.empty.t"    : "Ainda não há letras",
      "script.empty.s"    : "Escreva uma palavra primeiro e os sons dela aparecem aqui, esperando para serem desenhados.",
      "script.add"        : "Adicionar uma letra",
      "script.add.prompt" : "Para que som é esta letra? (a, k, sh …)",
      "script.add.bad"    : "De uma a três letras latinas.",
      "script.note"       : "Cada letra é desenhada no mesmo quadrado e com a mesma espessura de traço, como um telefone desenha todas as letras do japonês ou do coreano num tamanho só. A fonte é criada no seu aparelho; nada é enviado para lugar nenhum.",
      /* the letter editor */
      "glyph.circle"      : "Curvar",
      "glyph.new"         : "Novo",
      "glyph.undo"        : "Desfazer",
      "glyph.clear"       : "Limpar",
      "glyph.cancel"      : "Cancelar",
      "glyph.save"        : "Salvar",
      "glyph.saved"       : "{0} salva",
      "count.words"      : "{0} palavras",
      "count.words.1"    : "1 palavra",
      "count.sounds"     : "{0} sons",
      "count.sounds.1"   : "1 som",
      "count.rules"      : "{0} encontradas",
      "count.rules.1"    : "1 encontrada",
      "count.lines"      : "{0} linhas",
      "count.lines.1"    : "1 linha",
      "home.empty.t"     : "Nenhuma palavra ainda",
      "home.empty.s"     : "Tudo começa com uma palavra só.<br>Escreva a grafia; a leitura vem sozinha.",
      "home.empty.btn"   : "Escrever a primeira palavra",
      "home.recent.line" : "Última frase",
      "home.recent.word" : "Última palavra escrita",
      "home.write"       : "Escrever uma palavra",
      "words.search"     : "Buscar grafia, significado, leitura",
      "words.nomatch"    : "Nada encontrado",
      "words.empty"      : "Nenhuma palavra ainda",
      "sound.used"       : "Consoantes em uso",
      "sound.unused"     : "Consoantes fora de uso",
      "sound.none"       : "Nenhuma ainda.",
      "sound.allused"    : "Todas elas estão em uso.",
      "sound.note"       : "Os sons que uma língua recusa fazem parte dela tanto quanto os que ela guarda.<br>A marca pequena embaixo de cada letra é o alfabeto fonético internacional, o IPA: um símbolo para cada som, em qualquer língua da terra.",
      "sound.vowels"     : "Vogais",
      "sound.together"   : "Ditas juntas",
      "link.yes"         : "a consoante final emenda na palavra seguinte",
      "link.no"          : "cada palavra fica separada",
      "sound.listen"     : "Ouvir",
      "sound.linkhint"   : "Escreva uma palavra que comece com vogal e a consoante anterior atravessa, e as duas viram um só fôlego.",
      "sound.footer"     : "Toda essa aritmética acontece dentro do seu aparelho. Sem rede, sem IA.",
      "rules.intro"      : "Hábitos encontrados contando as {0} palavras que você escreveu. Não foram decididos — foram descobertos.",
      "rules.intro.1"    : "Hábitos encontrados contando a única palavra que você escreveu. Não foram decididos — foram descobertos.",
      "rules.empty.t"    : "Nenhuma regra ainda",
      "rules.empty.s"    : "Escreva algumas palavras primeiro.",
      "rules.next"       : "A seguir: {0}",
      "rules.make"       : "Criar mais palavras que sigam essas regras",
      "find.final.t"     : "{0}s terminam em <em>-{1}</em>",
      "find.final.d"     : "{1} de {0} fazem assim. Palavras novas podem guardar a mesma forma.",
      "find.cons.t"      : "Consoantes soando agora: <em>{0}</em>",
      "find.cons.d"      : "Seu estoque de sons ao longo de {0} palavras. Acrescente uma que não esteja aqui e a língua inteira muda de cor.",
      "find.vow.t"       : "Só <em>{0}</em> — {1} no total",
      "find.vow.d"       : "Quanto menos vogais, mais a língua soa de uma peça só. Você pode ampliar isso quando quiser.",
      "find.syl.t"       : "As palavras chegam a <em>{0} sílabas</em>",
      "find.syl.t.1"     : "As palavras têm <em>uma sílaba</em>",
      "find.syl.d"       : "{1} de {0} palavras. Comprimentos parecidos fazem uma língua soar falada, e não montada.",
      "find.coda.t"      : "As palavras só terminam em <em>{0}</em>",
      "find.coda.d"      : "Quanto mais curta essa lista, mais limpa fica a emenda entre as palavras quando você as diz em sequência.",
      "find.unused.t"    : "<em>{0}</em> nunca aparecem",
      "find.unused.d"    : "Ter sons que você nunca usa já é uma assinatura.",
      "hint.pos"         : "Escreva mais {0} {1}s e uma regra — como um {1} termina — vai aparecer.",
      "hint.pos.1"       : "Escreva mais um {1} e uma regra — como um {1} termina — vai aparecer.",
      "hint.more"        : "Quanto mais palavras houver, mais regras haverá para encontrar.",
      "sent.empty.t"     : "Ainda não dá para uma frase",
      "sent.empty.s"     : "Uma frase precisa de pelo menos duas palavras.<br>Escreva algumas primeiro.",
      "sent.weave"       : "Tecer",
      "sent.prev"        : "Anterior",
      "sent.later"       : "Seguinte →",
      "sent.remove"      : "Tirar esta palavra",
      "sent.taphint"     : "Toque em uma palavra para movê-la ou tirá-la.",
      "sent.palhint"     : "Escolha palavras abaixo e elas se alinham aqui. Quantas você quiser, e a mesma palavra quantas vezes quiser.",
      "sent.undo"        : "Desfazer",
      "sent.clear"       : "Limpar",
      "sent.reads"       : "Lida em voz alta, esta linha fica",
      "sent.say"         : "▶ Dizer",
      "sent.linkhint"    : "Ponha na linha uma palavra que comece com vogal e a consoante anterior atravessa, e as duas viram um só fôlego.",
      "sent.keep"        : "Guardar esta frase",
      "sent.need2"       : "Alinhe duas ou mais palavras para ouvir como elas se juntam.",
      "sent.choose"      : "Escolher palavras",
      "sent.search"      : "Buscar grafia ou significado",
      "sent.nomatch"     : "Nada encontrado.",
      "sent.nomean"      : "sem significado",
      "sent.order"       : "Ordem das palavras (uma regra desta língua)",
      "order.SOV.lab"    : "Sujeito → Objeto → Verbo",
      "order.SOV.ex"     : "Japonês e turco ficam aqui. “Eu a estrela vejo.”",
      "order.SVO.lab"    : "Sujeito → Verbo → Objeto",
      "order.SVO.ex"     : "O português fica aqui. “Eu vejo a estrela.”",
      "order.VSO.lab"    : "Verbo → Sujeito → Objeto",
      "order.VSO.ex"     : "Árabe e irlandês ficam aqui. “Vejo eu a estrela.”",
      "sent.chk.ok"      : "A linha fica <b>{0}</b> — exatamente a ordem que você escolheu.",
      "sent.chk.ng"      : "A linha fica <b>{0}</b>, mas a ordem que você escolheu é <b>{1}</b>.",
      "sent.chk.fix"     : "Pôr na ordem que escolhi",
      "sent.chk.hint"    : "Alinhe um sujeito, um objeto e um verbo e o Lingua confere a ordem contra a sua regra.<br>Qualquer outro arranjo também vale. A regra é um guia, não uma cerca.",
      "sent.kept"        : "Frases guardadas",
      "sent.listen"      : "Ouvir",
      "sent.reweave"     : "Tecer de novo",
      "sent.drop"        : "Apagar",
      "sent.footer"      : "As leituras, e o jeito como as palavras se emendam, são calculados dentro deste aparelho.",
      "toast.need2"      : "Alinhe pelo menos duas palavras",
      "toast.kept"       : "Frase guardada",
      "toast.dropped"    : "Apagada",
      "toast.reordered"  : "De volta à ordem que você escolheu",
      "make.rule"        : "Mantendo sua regra atual para {0}s — eles terminam em <span style=\"color:var(--gold)\">-{1}</span>.",
      "make.norule"      : "Nenhuma regra se firmou para {0}s ainda, então estas vêm só dos sons que você já usa.",
      "make.empty.t"     : "Ainda não há de onde partir",
      "make.empty.s"     : "Escreva algumas palavras você mesmo primeiro.<br>O Lingua copia o jeito como elas soam.",
      "make.left"        : "Restam {0} palavras no plano Free.",
      "make.left.1"      : "Resta uma palavra no plano Free.",
      "make.lock.t"      : "Peça um conjunto inteiro de uma vez",
      "make.lock.d"      : "“Trinta palavras sobre o mar” — e elas chegam",
      "make.reroll"      : "Sortear de novo",
      "make.commit"      : "Adicionar as que escolhi",
      "toast.noselect"   : "Nada selecionado",
      "toast.cap"        : "O plano Free guarda {0} palavras",
      "toast.added.n"    : "{0} palavras adicionadas. Os significados podem ser escritos na lista de palavras",
      "toast.added.n.1"  : "Uma palavra adicionada. O significado pode ser escrito na lista de palavras",
      "set.title"        : "Ajustes",
      "set.look"         : "Aparência",
      "theme.system"     : "Sistema",
      "theme.light"      : "Claro",
      "theme.dark"       : "Escuro",
      "set.theme.note"   : "“Sistema” segue o que estiver definido no seu aparelho.",
      "set.reading"      : "Como as leituras aparecem",
      "read.ipa"         : "IPA",
      "read.both"        : "Ambos",
      "set.sample"       : "Exemplo",
      "set.ipa.note"     : "O IPA é como o mundo escreve um som para que qualquer pessoa consiga dizê-lo. Dentro de <b style=\"color:var(--tx);font-weight:500\">/ /</b>, um <b style=\"color:var(--tx);font-weight:500\">.</b> é uma divisão de sílaba e <b style=\"color:var(--tx);font-weight:500\">ː</b> segura o som por mais tempo. O IPA é o exato; {0} é uma aproximação para quem lê.",
      "set.display"      : "Idioma de exibição",
      "set.display.note" : "A tela e a leitura das suas palavras seguem isto. O IPA não — ele é o mesmo em toda língua. Katakana para o japonês, pronúncia figurada no estilo <b style=\"color:var(--tx);font-weight:500\">AY-leen</b> para o inglês, em que as maiúsculas marcam a tônica. O padrão segue o seu aparelho.",
      "set.voice"        : "Voz",
      "set.voice.cur"    : "Voz em uso",
      "set.voice.none"   : "nenhuma encontrada",
      "set.voice.pick"   : "Escolher uma voz",
      "set.voice.auto"   : "Escolher automaticamente",
      "set.voice.wait"   : "A lista de vozes deste aparelho ainda não carregou. Toque em “▶ Ouvir” uma vez em qualquer lugar e ela aparece.",
      "set.voice.try"    : "Testar",
      "set.voice.note"   : "Se nada tocar, veja primeiro a chave de silencioso na lateral do aparelho, depois o volume. Se ainda assim não tocar, outra voz da lista acima costuma resolver. Vozes italianas e espanholas têm vogais simples e parelhas, o que costuma cair bem numa língua inventada.",
      "set.lang"         : "Língua",
      "set.name"         : "Nome",
      "set.count"        : "Palavras",
      "set.plan"         : "Plano",
      "set.plan.cur"     : "Plano atual",
      "set.data"         : "Dados",
      "set.csv.out"      : "Exportar como CSV",
      "set.csv.in"       : "Importar de CSV",
      "set.cloud"        : "Backup na nuvem",
      "set.on"           : "Ativado",
      "set.lock.csv.t"   : "Importação e exportação CSV",
      "set.lock.csv.d"   : "Despeje um lote que você montou numa planilha",
      "set.lock.cloud.t" : "Backup na nuvem",
      "set.lock.cloud.d" : "Sobrevive a um celular novo; um dicionário em todos os aparelhos",
      "set.wipe"         : "Apagar tudo e começar de novo",
      "set.footer"       : "Lingua · suas palavras ficam guardadas neste aparelho.",
      "set.footer.free"  : " O plano Free nunca toca a rede.",
      "confirm.wipe"     : "Apagar todas as palavras que você fez e começar de novo?",
      "plans.title"      : "Planos",
      "plans.intro"      : "Criar uma língua é de graça, e continua de graça.<br>O que custa dinheiro é guardar muita coisa e pensar ao lado de uma IA.",
      "plan.cur"         : "atual",
      "plan.tofree"      : "Voltar ao Free",
      "plan.choose"      : "Escolher este plano",
      "plans.note"       : "O pagamento ainda não está ligado. Por ora isto só muda o que as telas mostram.",
      "plan.free.1"      : "Construir cada palavra à mão — todas elas",
      "plan.free.2"      : "Regras encontradas para você, leituras derivadas para você",
      "plan.free.3"      : "Ligação mostrada e lida em voz alta",
      "plan.free.4"      : "Produzir palavras em série mantendo suas regras",
      "plan.free.5"      : "Guardado no aparelho · até 100 palavras",
      "plan.plus.1"      : "Palavras ilimitadas",
      "plan.plus.2"      : "Backup na nuvem (celular novo, vários aparelhos)",
      "plan.plus.3"      : "Importar e exportar palavras em CSV",
      "plan.plus.4"      : "Tudo do Free",
      "plan.studio.1"    : "Trabalhar com uma IA (forma a partir do sentido, gramática, exemplos)",
      "plan.studio.2"    : "Gerar um vocabulário inteiro a partir de um tema",
      "plan.studio.3"    : "Tudo do Plus",
      "plan.price.free"  : "$0",
      "plan.price.plus"  : "$9 / mês",
      "plan.price.studio": "$19 / mês",
      "toast.plan.free"  : "De volta ao plano Free",
      "toast.plan.other" : "(simulação) mudou para {0}",
      "add.title"        : "Escrever uma palavra",
      "add.note"         : "A leitura é calculada a partir da grafia que você escrever.",
      "f.spelling"       : "Grafia",
      "f.reading"        : "Leitura",
      "f.listen"         : "Ouvir",
      "f.meaning"        : "Significado",
      "f.meaning.ph"     : "estrela",
      "f.pos"            : "Classe gramatical",
      "add.btn"          : "Adicionar",
      "add.lock.t"       : "Conversar até achar a forma de um sentido",
      "add.lock.d"       : "“Quero uma palavra com cara de quietude”",
      "toast.hw2"        : "Uma grafia precisa de duas letras ou mais",
      "toast.dup"        : "Essa palavra já existe",
      "toast.added.1"    : "{0} adicionada",
      "word.syl"         : "Divisão de sílabas",
      "word.note"        : "{0} sílabas. A leitura cai dessas divisões.<br>Acima está o IPA; abaixo, a pronúncia figurada para quem fala {1} ({2}).",
      "word.note.1"      : "Uma sílaba. A leitura cai da grafia.<br>Acima está o IPA; abaixo, a pronúncia figurada para quem fala {1} ({2}).",
      "word.edit"        : "Alterar",
      "word.mn.ph"       : "ainda não decidido",
      "word.save"        : "Salvar",
      "word.del"         : "Apagar esta palavra",
      "confirm.del"      : "Apagar {0}?",
      "toast.saved"      : "{0} atualizada",
      "toast.deleted"    : "{0} apagada",
      "csv.title"        : "Importar de CSV",
      "csv.note"         : "Uma palavra por linha: grafia, significado, classe gramatical. Uma linha de cabeçalho pode ficar.",
      "csv.ph"           : "Aelin,estrela,substantivo&#10;Naeth,água,substantivo",
      "csv.btn"          : "Importar",
      "toast.exported"   : "Exportado",
      "toast.exportfail" : "Não foi possível exportar",
      "toast.imported"   : "{0} palavras importadas",
      "toast.imported.1" : "Uma palavra importada",
      "tts.none"         : "Este aparelho não consegue ler em voz alta",
      "tts.err"          : "Nenhum som saiu. Em Ajustes → Voz você pode escolher outra",
      "tts.fail"         : "Não foi possível ler isso em voz alta",
      "read.sep"         : "  "
    }
  };
})());
