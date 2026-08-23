//  CalendarWidget.swift
//  A month, in somebody's own language.
//
//  This is where the most of a made language stands on a home screen at once:
//  the month's name, the names of the days of the week, and thirty-one
//  numerals. Everything the calendar chapter makes (www/cal.js) shows up here
//  and nowhere else.
//
//  THE STRUCTURE IS THE WORLD'S. Twelve months, seven columns, Sunday first,
//  and the phone's own month -- because that is the calendar every reader of
//  this widget already reads.
//  「言語内で週の概念作ろうが、ウィジェットに表示するなら世界の概念でやるだろ」
//
//  What the language does is NAME them, and write the numbers in its own
//  digits. A month with no word made for it is the phone's name for that
//  month; a day with no word is the phone's name for that day -- Monday, 月 --
//  and not a number, because a number for a weekday is not something anybody
//  says. 「ない分の言葉は monday とかで代用しよう」

import WidgetKit
import SwiftUI

struct MonthEntry: TimelineEntry {
  let date: Date
  let num: Numerals?
}

struct MonthProvider: TimelineProvider {
  func placeholder(in context: Context) -> MonthEntry {
    MonthEntry(date: Date(), num: nil)
  }
  func getSnapshot(in context: Context, completion: @escaping (MonthEntry) -> Void) {
    completion(MonthEntry(date: Date(), num: Numerals.read()))
  }
  /// A week of midnights, the same as the date widget: what changes is which
  /// day is ringed, and that changes once a day.
  func getTimeline(in context: Context, completion: @escaping (Timeline<MonthEntry>) -> Void) {
    let num = Numerals.read()
    let cal = Calendar.current
    let today = cal.startOfDay(for: Date())
    var out: [MonthEntry] = [MonthEntry(date: Date(), num: num)]
    for i in 1...7 {
      if let d = cal.date(byAdding: .day, value: i, to: today) {
        out.append(MonthEntry(date: d, num: num))
      }
    }
    completion(Timeline(entries: out, policy: .atEnd))
  }
}

/// The colour a day of the week is written in.
///
/// A calendar is not just numbers: the week has a red end and a blue one, and
/// leaving them out is what makes a grid of digits look like a spreadsheet.
/// 「日曜🟥土曜🟦 カレンダーって数字だけがあればいいわけじゃねえぞ？」
func dayTint(_ i: Int) -> Color {
  if i == 1 { return Color(red: 0.79, green: 0.37, blue: 0.30) }
  if i == 7 { return Color(red: 0.35, green: 0.55, blue: 0.76) }
  return .primary
}

/// What a column is called.
///
/// The word somebody made, else the phone's own short name for that day.
/// There is always a phone name to fall back to, because the week here is the
/// world's seven and the phone has seven names for it.
/// 「ない分の言葉はmondayとかで代用しよう」
func weekdayHead(_ i: Int, _ num: Numerals?) -> Named? {
  if let n = num?.dayName(i) { return n }
  /* shortWeekdaySymbols and NOT veryShort: very short is one letter, and one
     letter in English is S M T W T F S -- two pairs that say nothing apart
     from each other. A stand-in is there to be READ, so it is Sun and Mon.
     Both lists start at Sunday, and so does the count. */
  let syms = Calendar.current.shortWeekdaySymbols
  guard syms.count == 7, i >= 1, i <= 7 else { return nil }
  return Named(r: syms[i - 1], all: false)
}

struct MonthGrid: View {
  let entry: MonthEntry
  /// systemLarge, which is the same grid with more room: a taller month row,
  /// a taller cell, and more padding around the whole of it. The month's name
  /// is over the grid at both sizes -- a calendar that does not say which
  /// month it is is a page of numbers.
  let big: Bool

  private var num: Numerals? { entry.num }
  private let week = 7

  /// Every day of the phone's month, and which column each falls in.
  private var days: [Int] {
    let cal = Calendar.current
    guard let r = cal.range(of: .day, in: .month, for: entry.date) else { return [] }
    return Array(r)
  }
  private func column(_ day: Int) -> Int {
    let cal = Calendar.current
    var c = cal.dateComponents([.year, .month], from: entry.date)
    c.day = day
    guard let d = cal.date(from: c) else { return (day - 1) % week }
    return cal.component(.weekday, from: d) - 1
  }
  private var today: Int { Calendar.current.component(.day, from: entry.date) }

  var body: some View {
    GeometryReader { geo in
      let cols = week
      let cw = geo.size.width / CGFloat(cols)
      let headH = geo.size.height * (big ? 0.09 : 0.13)
      let monH = geo.size.height * (big ? 0.13 : 0.17)
      let rows = rowCount()
      let ch = max(1, (geo.size.height - headH - monH) / CGFloat(rows))
      VStack(spacing: 0) {
        /* The month over the grid, left-aligned, the way a wall calendar and
           the phone's own both put it. Its name when the calendar chapter has
           made one, its number when it has not. */
        HStack(spacing: 0) {
          Group {
            if let m = num?.monthName(num?.monthOf(entry.date) ?? 1) {
              WordView(word: m, size: monH * 0.72)
            } else {
              NumberView(n: num?.monthOf(entry.date) ?? 1, num: num, em: monH * 0.72)
            }
          }
          Spacer(minLength: 0)
        }
        .frame(height: monH)
        HStack(spacing: 0) {
          ForEach(1...cols, id: \.self) { i in
            Group {
              if let h = weekdayHead(i, num) {
                WordView(word: h, size: headH * 0.62)
              }
            }
            .frame(width: cw, height: headH)
            .foregroundStyle(dayTint(i))
            .opacity(0.75)
          }
        }
        ForEach(0..<rows, id: \.self) { r in
          HStack(spacing: 0) {
            ForEach(0..<cols, id: \.self) { c in
              cell(row: r, col: c, w: cw, h: ch)
            }
          }
        }
      }
    }
    .padding(big ? 14 : 10)
  }

  private func rowCount() -> Int {
    guard let last = days.last else { return 1 }
    var n = 1, col = column(days.first ?? 1)
    for d in days where d > (days.first ?? 1) {
      let c = column(d)
      if c <= col { n += 1 }
      col = c
    }
    _ = last
    return max(n, 1)
  }

  /// Which day sits in this cell, walking the month once. Cheap enough: a
  /// month is thirty-one numbers and this runs when the widget redraws.
  private func dayAt(row: Int, col: Int) -> Int? {
    var r = 0, prev = -1
    for d in days {
      let c = column(d)
      if c <= prev { r += 1 }
      prev = c
      if r == row && c == col { return d }
      if r > row { return nil }
    }
    return nil
  }

  @ViewBuilder
  private func cell(row: Int, col: Int, w: CGFloat, h: CGFloat) -> some View {
    if let d = dayAt(row: row, col: col) {
      let em = min(h * 0.62, w * 0.72)
      let isToday = d == today
      ZStack {
        /* Today is a filled disc with the number knocked out of it, which is
           what every calendar on the phone does and is the only mark that
           reads at this size -- a thin ring around a numeral six points tall
           is a smudge. 「今日がわかるようにして」
           A disc is not a rounded box: the rule is about corners on a
           rectangle, and this has no corners at all. */
        if isToday {
          Circle().fill(Color.primary)
            .frame(width: min(w, h) * 0.88, height: min(w, h) * 0.88)
        }
        NumberView(n: d, num: num, em: em,
                   ink: isToday ? .invert : .tint(dayTint(column(d) + 1)))
      }
      .frame(width: w, height: h)
    } else {
      Color.clear.frame(width: w, height: h)
    }
  }
}

struct CalendarWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LinguaCalendar", provider: MonthProvider()) { entry in
      MonthGrid(entry: entry, big: false).widgetGround()
    }
    .configurationDisplayName("Calendar")
    .description("This month, in your own language.")
    .supportedFamilies([.systemMedium])
    /* Carried across from DateWidget, which this replaced. save added
       widgetRoom() there and to ClockWidget -- iOS 17 puts a margin round a
       widget's content that cannot be padded away, and contentMarginsDisabled()
       is the only thing that gives it back. yoo's widgets were written on the
       other branch and never had it, so a straight merge would have shipped
       two of the four with the margin still on. */
    .widgetRoom()
  }
}

struct CalendarBigWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LinguaCalendarBig", provider: MonthProvider()) { entry in
      MonthGrid(entry: entry, big: true).widgetGround()
    }
    .configurationDisplayName("Calendar, large")
    .description("This month, with room for it, in your own language.")
    .supportedFamilies([.systemLarge])
    .widgetRoom()
  }
}
