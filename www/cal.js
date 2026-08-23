/* Lingua — the calendar (chapter 27)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A month is a word.

   The same sentence numbers.js opens with, for the same reason. A month name
   is not a new kind of thing needing its own store, its own list and its own
   way of being made -- it is a word, it goes in the dictionary, and the two
   stages that hold them are word slots exactly as the counting stage is.
   Nothing is added anywhere.

   THE STRUCTURE IS THE WORLD'S. The names are the language's.

   This file once let a language say how many months its year had and how many
   days its week had, and the widgets drew the grid from those two numbers --
   five columns for a five-day week, a tenth month with no December. It was
   consistent and it was wrong, and the line it crossed is the one written
   three paragraphs down in its own first draft: the names and the numerals
   are the language's; the date underneath is the one the phone already knows.

   「言語内で週の概念作ろうが、ウィジェットに表示するなら世界の概念でやるだろ」

   So the year has twelve months and the week has seven days, because that is
   the calendar every reader of it already reads. What a language does is NAME
   them -- twelve words and seven words -- and write the numbers in its own
   digits. A month with no word made for it is the phone's own name for that
   month; a day with no word is the phone's name for that day.

   Everything that made this a calendar of somebody's own is therefore gone:
   no year of your own length, no week of your own length, no epoch, no leap
   rule, and no arithmetic at all. Which month it is and which day of the week
   it is are questions the phone answers, and nothing here answers them a
   second time.
   ========================================================================= */

/* Twelve and seven, and neither is a setting.
   They are here as names rather than as bare numbers in five files, so that
   the day one of them is questioned there is one line to read. */
var CAL_MONTHS=12;
var CAL_WEEK=7;
function calMonths(){ return CAL_MONTHS; }
function calWeek(){ return CAL_WEEK; }

/* One slot per month, one per day of the week, and each is called what the
   world calls it: January, Sunday. Day one is SUNDAY, because that is where a
   calendar's week starts.

   It said "1" and "3" before, under a comment arguing that a number was the
   only honest label -- the app does not know what anybody's third month is
   FOR, so writing March there would be this app deciding whose calendar it
   is. That was true of the design where a language set its own week and its
   own year. The head of this file took that design away
   (「言語内で週の概念作ろうが、ウィジェットに表示するなら世界の概念でやるだろ」)
   and the comment was not taken away with it: if the structure is the
   world's, the third month IS March, and a screen listing 1 to 12 with no
   other clue is a screen nobody can answer.
   「1ってなに？1月 januaryとかでしょ」「曜日もサンデーからちゃんと示してよ」

   What the slot is CALLED is the world's; what goes in it is the language's.
   Nothing about the words made here changes -- not how many, not their order,
   not where they are stored. This is the label above the empty space. */
/* Written out twice rather than through one function taking the prefix,
   because a prefix handed in as an argument is a key nobody can find: the
   i18n check reads the source for what a screen asks for, and `t(pre+i)`
   names nothing. It said so about all nineteen of these the moment they were
   written that way, which is the check doing its job. */
function calMonthSlots(){
  var out=[], i;
  for(i=1;i<=CAL_MONTHS;i++) out.push(t('cal.m.'+i));
  return out;
}
function calWeekSlots(){
  var out=[], i;
  for(i=1;i<=CAL_WEEK;i++) out.push(t('cal.d.'+i));
  return out;
}

/* Which month, and which day of the week -- both asked of the phone.
   calMonthOf() used to cut the year into equal parts and calDayOf() used to
   count days from an epoch. Neither exists any more, because neither question
   is this app's to answer: the phone has a calendar and it is the one on the
   lock screen six inches away. */
function calMonthOf(d){ return d.getMonth()+1; }
function calDayOf(d){ return d.getDay()+1; }

/* Which of the week's days is the red one and which the blue one. A calendar
   is not just numbers.
   「日曜🟥土曜🟦 カレンダーって数字だけがあればいいわけじゃねえぞ？」 */
function calRed(i){ return i===1; }
function calBlue(i){ return i===7; }
