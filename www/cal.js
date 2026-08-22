/* Lingua — the calendar (chapter 27)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A month is a word.

   The same sentence numbers.js opens with, for the same reason. A month name
   is not a new kind of thing needing its own store, its own list and its own
   way of being made -- it is a word, it goes in the dictionary, and the two
   stages below are word slots exactly as the counting stage is. Nothing is
   added anywhere except two numbers.

   WHAT THIS DOES NOT DO, and the line is deliberate.

   There is no calendar arithmetic of anybody's own: no year of your own
   length, no epoch of your own, no leap rule. The moment a language keeps its
   own year, every date in the app needs a conversion, conversions have edges
   forever, and "today" stops having one answer. What is the language's here
   is the NAMES and the numerals -- the date underneath stays the one the
   phone already knows.

   So the two questions this asks are the two that can be answered without
   any of that:

     how many parts the year divides into    CAL_MONTHS, default twelve
     how many days a week has                CAL_WEEK,   default seven

   and both are the language's, in STG beside the base, because both decide
   how many words there are. A ten-month year and a five-day week are real --
   the French Republican calendar had a ten-day one -- and neither costs a
   conversion.

   Which month a date falls in is the year cut into equal parts, and which
   day of the week it is is a count of days taken modulo the week's length.
   Both are one line and neither has a leap rule to be wrong about: a 366th
   day falls in the last month because there is nowhere else for it to be.

   Neither of those two lines is HERE. Nothing in the app says what today is,
   so a calMonthOf() in this file would be a function nothing calls -- and the
   one place that does need them is the widget, which recomputes them every
   day in Swift and cannot ask this file anything. Two copies of a rule is how
   the two drift; one copy, where it is used. ios/App/LinguaWidget/.
   ========================================================================= */

/* Two, because one part is not a division of anything; twenty-four, because
   the year cut finer than a fortnight stops being a month. Anything off the
   range is the default, so a stored number can never be one the rest of this
   file cannot make slots for -- the same guard NUM_BASES has. */
var CAL_MONTHS={lo:2, hi:24, by:12};
var CAL_WEEK={lo:2, hi:14, by:7};

function calN(v, r){
  var n=(typeof v==='number' && v===Math.floor(v))? v : r.by;
  return (n>=r.lo && n<=r.hi)? n : r.by;
}
function calMonths(){ return calN((typeof STG!=='undefined' && STG)? STG.months : null, CAL_MONTHS); }
function calWeek(){ return calN((typeof STG!=='undefined' && STG)? STG.week : null, CAL_WEEK); }

/* Lowering either one is NOT the deletion the base's is.
   A digit is a letter and lowering the base can take an untouched slot away
   with it (numDropBlank). A month is a WORD, and a word is in the dictionary
   -- it is somebody's, it is used in sentences, and nothing here may remove
   it. Going from twelve months to ten leaves the two words exactly where they
   are; the stage simply stops asking for them. docs/DATA_SAFETY.md. */
function calSetMonths(n){ STG.months=calN(n, CAL_MONTHS); saveStg(); render(); }
function calSetWeek(n){ STG.week=calN(n, CAL_WEEK); saveStg(); render(); }
function calStepMonths(d){
  var n=calMonths()+d;
  if(n<CAL_MONTHS.lo || n>CAL_MONTHS.hi) return;
  calSetMonths(n);
}
function calStepWeek(d){
  var n=calWeek()+d;
  if(n<CAL_WEEK.lo || n>CAL_WEEK.hi) return;
  calSetWeek(n);
}

/* One slot per month, one per day of the week, named by their number the way
   the counting stage names its own. A month called "3" reads oddly on its own
   and is the only honest label: the app does not know what anybody's third
   month is for, and putting "March" there would be this app deciding whose
   calendar it is. */
function calSlots(n){
  var out=[], i;
  for(i=1;i<=n;i++) out.push(numLabel(i));
  return out;
}
function calMonthSlots(){ return calSlots(calMonths()); }
function calWeekSlots(){ return calSlots(calWeek()); }

/* The two numbers, offered where the words are. A stepper each, the shape the
   base already uses, so the three questions that decide how many slots a
   stage has all look the same. */
function calStepper(lab, val, r, fn){
  return '<div class="set numbase">'+
    '<span class="sl">'+esc(lab)+'</span>'+
    '<span class="nbstep">'+
      '<button class="nbb"' + DO(fn, [-1]) + (val<=r.lo? ' disabled':'')+
        ' aria-label="'+esc(numLabel(val-1))+'">'+ICON_MINUS+'</button>'+
      '<span class="nbv">'+esc(numLabel(val))+'</span>'+
      '<button class="nbb"' + DO(fn, [1]) + (val>=r.hi? ' disabled':'')+
        ' aria-label="'+esc(numLabel(val+1))+'">'+ICON_ADD+'</button>'+
    '</span></div>';
}
/* Free does not choose, for the reason free does not choose the base: what
   these decide is how many WORDS there are, and a free dictionary is already
   held at FREE_LIMIT. Offering twelve more slots to a language that cannot
   reach them is the offer numBaseRows() refuses too. */
function calRows(id){
  if(!can('gram')) return '';
  if(id==='month') return calStepper(t('cal.months'), calMonths(), CAL_MONTHS, 'calStepMonths');
  if(id==='wday')  return calStepper(t('cal.week'), calWeek(), CAL_WEEK, 'calStepWeek');
  return '';
}
