// One-shot: insert the writing-system strings into all ten language blocks of
// www/index.html, right after each block's 'toc.make' line. Written as a script
// rather than ten hand edits because the ten blocks must stay in lockstep —
// i18n-check fails the moment one of them is missing a key.
import fs from 'fs';
const DST = new URL('../www/index.html', import.meta.url).pathname;

const K = [
  'toc.script', 'script.preview', 'script.show', 'script.show.roman', 'script.show.own',
  'script.show.note', 'script.needs', 'script.letters', 'script.empty.t', 'script.empty.s',
  'script.add', 'script.add.prompt', 'script.add.bad', 'script.note',
  'glyph.circle', 'glyph.new', 'glyph.undo', 'glyph.clear',
  'glyph.cancel', 'glyph.save', 'glyph.saved', 'glyph.hint',
];

const L = {
en: ["Letters","Your writing","Show words in","Roman","Your letters",
"Only the display changes. What you type and what is stored stay the same letters, so nothing is ever locked inside a font.",
"Draw one letter and your words appear in it here.","The alphabet","No letters yet",
"Write a word first and its sounds turn up here, waiting to be drawn.",
"Add a letter","Which sound is this letter for? (a, k, sh …)","One to three roman letters.",
"Every letter is drawn in the same square and with the same pen, the way a phone draws every letter of Japanese or Korean at one size. The font is built on your device; nothing is sent anywhere.",
"Curve","Close","New stroke","Delete point","Undo","Clear","Cancel","Save","{0} saved",
"Tap to place a point, drag to move it. Curve rounds the selected corner; Close joins the last point to the first."],

es: ["Letras","Tu escritura","Mostrar las palabras en","Alfabeto latino","Tus letras",
"Solo cambia lo que se ve. Lo que escribes y lo que se guarda siguen siendo las mismas letras, así que nada queda encerrado en una tipografía.",
"Dibuja una letra y aquí verás tus palabras escritas con ella.","El alfabeto","Todavía no hay letras",
"Escribe primero una palabra y sus sonidos aparecerán aquí, esperando a que los dibujes.",
"Añadir una letra","¿Para qué sonido es esta letra? (a, k, sh …)","De una a tres letras latinas.",
"Cada letra se dibuja en el mismo cuadrado y con el mismo grosor de trazo, igual que un teléfono dibuja todas las letras del japonés o del coreano a un solo tamaño. La tipografía se crea en tu dispositivo; no se envía nada a ninguna parte.",
"Curva","Cerrar","Nuevo trazo","Borrar punto","Deshacer","Vaciar","Cancelar","Guardar","{0} guardada",
"Toca para poner un punto y arrastra para moverlo. Curva redondea la esquina seleccionada; Cerrar une el último punto con el primero."],

pt: ["Letras","A sua escrita","Mostrar as palavras em","Alfabeto latino","As suas letras",
"Muda apenas o que aparece. O que você digita e o que fica guardado continuam sendo as mesmas letras, então nada fica preso dentro de uma fonte.",
"Desenhe uma letra e as suas palavras aparecem aqui escritas com ela.","O alfabeto","Ainda não há letras",
"Escreva uma palavra primeiro e os sons dela aparecem aqui, esperando para serem desenhados.",
"Adicionar uma letra","Para que som é esta letra? (a, k, sh …)","De uma a três letras latinas.",
"Cada letra é desenhada no mesmo quadrado e com a mesma espessura de traço, como um telefone desenha todas as letras do japonês ou do coreano num tamanho só. A fonte é criada no seu aparelho; nada é enviado para lugar nenhum.",
"Curva","Fechar","Novo traço","Apagar ponto","Desfazer","Limpar","Cancelar","Salvar","{0} salva",
"Toque para colocar um ponto e arraste para movê-lo. Curva arredonda o canto selecionado; Fechar une o último ponto ao primeiro."],

fr: ["Lettres","Votre écriture","Afficher les mots en","Alphabet latin","Vos lettres",
"Seul l’affichage change. Ce que vous tapez et ce qui est enregistré restent les mêmes lettres : rien n’est enfermé dans une police.",
"Dessinez une lettre et vos mots s’afficheront ici avec elle.","L’alphabet","Pas encore de lettres",
"Écrivez d’abord un mot : ses sons apparaîtront ici, en attendant d’être dessinés.",
"Ajouter une lettre","À quel son correspond cette lettre ? (a, k, sh …)","Une à trois lettres latines.",
"Chaque lettre se dessine dans le même carré et avec la même épaisseur de trait, comme un téléphone dessine toutes les lettres du japonais ou du coréen à une seule taille. La police est fabriquée sur votre appareil ; rien n’est envoyé nulle part.",
"Courbe","Fermer","Nouveau tracé","Supprimer le point","Annuler","Tout effacer","Abandonner","Enregistrer","{0} enregistrée",
"Touchez pour poser un point, faites-le glisser pour le déplacer. Courbe arrondit l’angle sélectionné ; Fermer relie le dernier point au premier."],

de: ["Buchstaben","Deine Schrift","Wörter anzeigen in","Lateinisch","Deinen Buchstaben",
"Es ändert sich nur die Anzeige. Was du tippst und was gespeichert wird, bleiben dieselben Buchstaben – nichts ist in einer Schriftart eingeschlossen.",
"Zeichne einen Buchstaben, dann erscheinen deine Wörter hier darin.","Das Alphabet","Noch keine Buchstaben",
"Schreib zuerst ein Wort, dann tauchen seine Laute hier auf und warten darauf, gezeichnet zu werden.",
"Buchstaben hinzufügen","Für welchen Laut steht dieser Buchstabe? (a, k, sh …)","Ein bis drei lateinische Buchstaben.",
"Jeder Buchstabe wird im selben Quadrat und mit derselben Strichstärke gezeichnet, so wie ein Telefon jeden japanischen oder koreanischen Buchstaben in einer Größe zeichnet. Die Schriftart entsteht auf deinem Gerät; nichts wird irgendwohin geschickt.",
"Kurve","Schließen","Neuer Strich","Punkt löschen","Zurück","Leeren","Abbrechen","Sichern","{0} gesichert",
"Tippen setzt einen Punkt, Ziehen verschiebt ihn. Kurve rundet die gewählte Ecke; Schließen verbindet den letzten Punkt mit dem ersten."],

it: ["Lettere","La tua scrittura","Mostra le parole in","Alfabeto latino","Le tue lettere",
"Cambia solo ciò che vedi. Quello che scrivi e quello che viene salvato restano le stesse lettere, quindi niente resta chiuso dentro un carattere.",
"Disegna una lettera e qui vedrai le tue parole scritte con essa.","L’alfabeto","Ancora nessuna lettera",
"Scrivi prima una parola: i suoi suoni compaiono qui, in attesa di essere disegnati.",
"Aggiungi una lettera","Per quale suono è questa lettera? (a, k, sh …)","Da una a tre lettere latine.",
"Ogni lettera si disegna nello stesso quadrato e con lo stesso spessore di tratto, come un telefono disegna ogni lettera del giapponese o del coreano in un’unica misura. Il carattere viene creato sul tuo dispositivo; non viene inviato nulla da nessuna parte.",
"Curva","Chiudi","Nuovo tratto","Elimina punto","Indietro","Svuota","Annulla","Salva","{0} salvata",
"Tocca per posare un punto, trascina per spostarlo. Curva arrotonda l’angolo selezionato; Chiudi unisce l’ultimo punto al primo."],

ru: ["Буквы","Ваше письмо","Показывать слова","Латиницей","Своими буквами",
"Меняется только вид. То, что вы набираете и что сохраняется, остаётся теми же буквами — ничто не заперто внутри шрифта.",
"Нарисуйте одну букву, и здесь появятся ваши слова, написанные ею.","Алфавит","Букв пока нет",
"Сначала напишите слово — его звуки появятся здесь и будут ждать, когда вы их нарисуете.",
"Добавить букву","Для какого звука эта буква? (a, k, sh …)","От одной до трёх латинских букв.",
"Каждая буква рисуется в одном и том же квадрате и одной и той же толщиной пера — так телефон рисует любую японскую или корейскую букву одного размера. Шрифт собирается на вашем устройстве; никуда ничего не отправляется.",
"Дуга","Замкнуть","Новая линия","Удалить точку","Назад","Очистить","Отмена","Сохранить","{0} сохранена",
"Коснитесь, чтобы поставить точку, потяните, чтобы её передвинуть. «Дуга» скругляет выбранный угол, «Замкнуть» соединяет последнюю точку с первой."],

zh: ["文字","你的文字","词语显示为","拉丁字母","自造文字",
"改变的只是显示。你输入的和保存下来的仍是同样的字母，不会被锁进一套字体里。",
"画出一个字母，这里就会用它来显示你的词。","字母表","还没有字母",
"先写一个词，它的音就会出现在这里，等着你来画。",
"添加字母","这个字母对应哪个音？（a、k、sh …）","一到三个拉丁字母。",
"每个字母都画在同样的方格里、用同样粗细的笔，就像手机把日文或韩文的每个字都画成同一个大小。字体在你的设备上生成，不会发送到任何地方。",
"曲线","闭合","新笔画","删除点","撤销","清空","取消","保存","已保存 {0}",
"点一下放一个点，拖动可以移动它。「曲线」把选中的角变圆，「闭合」把最后一个点连回第一个点。"],

ko: ["글자","내 글씨","낱말을 이렇게 보이기","로마자","내 글자",
"보이는 것만 바뀝니다. 입력한 것과 저장되는 것은 그대로 같은 글자라서, 무엇도 글꼴 안에 갇히지 않습니다.",
"글자를 하나 그리면 여기에 그 글자로 낱말이 나타납니다.","글자표","아직 글자가 없습니다",
"먼저 낱말을 하나 쓰면 그 소리들이 여기에 나타나 그려지기를 기다립니다.",
"글자 추가","이 글자는 어떤 소리인가요? (a, k, sh …)","로마자 한 글자에서 세 글자까지.",
"모든 글자는 같은 네모 안에서 같은 굵기의 펜으로 그려집니다. 휴대폰이 일본어나 한국어의 모든 글자를 한 크기로 그리는 것과 같습니다. 글꼴은 기기 안에서 만들어지며 어디로도 보내지 않습니다.",
"곡선","닫기","새 획","점 지우기","되돌리기","모두 지우기","취소","저장","{0} 저장했습니다",
"톡 누르면 점이 놓이고, 끌면 옮겨집니다. ‘곡선’은 고른 모서리를 둥글게 하고, ‘닫기’는 마지막 점을 첫 점에 잇습니다."],

ja: ["文字","あなたの文字","ことばの表示","ローマ字","自分の文字",
"変わるのは見た目だけです。打つ字も保存される字もそのまま同じなので、フォントの中に閉じこめられることはありません。",
"一文字でも描けば、ここにその文字でことばが並びます。","文字の一覧","まだ文字がありません",
"まずことばをひとつ書くと、その音がここに並び、描かれるのを待ちます。",
"文字を足す","この文字はどの音ですか？（a、k、sh …）","ローマ字で1〜3文字です。",
"どの文字も同じ正方形の中に、同じ太さのペンで描きます。日本語も韓国語も、スマホでは同じ大きさで並ぶのと同じことです。フォントは端末の中で作られ、どこにも送られません。",
"曲線","閉じる","新しい線","点を消す","ひとつ戻す","全部消す","やめる","保存","{0} を保存しました",
"触れると点が置かれ、そのまま動かせます。「曲線」は選んだ角を丸め、「閉じる」は最後の点を最初の点につなぎます。"],
};

let html = fs.readFileSync(DST, 'utf8');
const lines = html.split('\n');

// where each language block starts, so the right toc.make gets the right strings
const starts = [];
lines.forEach((l, i) => {
  const m = l.match(/^defLang\('([a-z]{2})'/);
  if (m) starts.push({ code: m[1], i });
});
if (starts.length !== Object.keys(L).length) {
  console.error('found ' + starts.length + ' language blocks, have strings for ' + Object.keys(L).length);
  process.exit(2);
}

const out = [];
let done = 0;
for (let i = 0; i < lines.length; i++) {
  out.push(lines[i]);
  if (!/^\s*['"]toc\.make['"]\s*:/.test(lines[i])) continue;
  let code = 'en';
  starts.forEach(s => { if (s.i < i) code = s.code; });
  const v = L[code];
  if (!v) { console.error('no strings for ' + code); process.exit(2); }
  if (v.length !== K.length) { console.error(code + ': ' + v.length + ' strings for ' + K.length + ' keys'); process.exit(2); }
  const q = lines[i].trim()[0];                       // match the block's own quoting
  const ind = lines[i].match(/^\s*/)[0];
  const w = Math.max.apply(null, K.map(k => k.length)) + 2;
  // keys follow the block's own quoting; values are always double-quoted, which
  // every string here allows (none contains a straight double quote).
  const row = (k, s) => ind + (q + k + q).padEnd(w + 1) + ': "' + s + '",';
  out.push(ind + '/* the writing system */');
  K.forEach((k, j) => {
    if (k === 'glyph.circle') out.push(ind + '/* the letter editor */');
    out.push(row(k, v[j]));
  });
  done++;
}
if (done !== starts.length) { console.error('inserted into ' + done + ' blocks, expected ' + starts.length); process.exit(2); }
fs.writeFileSync(DST, out.join('\n'));
console.log('added ' + K.length + ' keys to ' + done + ' languages');
