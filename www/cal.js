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

/* One slot per month, one per day of the week, named by their number the way
   the counting stage names its own. A month called "3" reads oddly on its own
   and is the only honest label: the app does not know what anybody's third
   month is for, and putting "March" there would be this app deciding whose
   calendar it is.

   Day one is SUNDAY, because that is where a calendar's week starts. */
function calSlots(n){
  var out=[], i;
  for(i=1;i<=n;i++) out.push(numLabel(i));
  return out;
}
function calMonthSlots(){ return calSlots(CAL_MONTHS); }
function calWeekSlots(){ return calSlots(CAL_WEEK); }

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
