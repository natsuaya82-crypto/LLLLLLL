//  DateWidget.swift
//  Today, in somebody's own digits.
//
//  Its own widget rather than a corner of the clock: the day of the month is
//  one or two signs and nothing else, so it can be drawn large enough to
//  actually read a shape by -- which is the whole reason for putting a made
//  alphabet on a home screen.
//
//  There is no calendar in the app yet -- no month names, no weekday names --
//  so what this can honestly show is numbers: the day, large, and the month
//  under it, small. When the calendar chapter exists the month becomes a word
//  and this is where it goes.

import WidgetKit
import SwiftUI

struct DayEntry: TimelineEntry {
  let date: Date
  let num: Numerals?
}

struct DayProvider: TimelineProvider {
  func placeholder(in context: Context) -> DayEntry {
    DayEntry(date: Date(), num: nil)
  }
  func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
    completion(DayEntry(date: Date(), num: Numerals.read()))
  }
  /// A week of midnights. The date changes once a day, so seven entries is a
  /// week of correctness for one wake -- and if iOS never wakes it again the
  /// widget is right for another six days rather than wrong tomorrow.
  func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
    let num = Numerals.read()
    let cal = Calendar.current
    let today = cal.startOfDay(for: Date())
    var out: [DayEntry] = [DayEntry(date: Date(), num: num)]
    for i in 1...7 {
      if let d = cal.date(byAdding: .day, value: i, to: today) {
        out.append(DayEntry(date: d, num: num))
      }
    }
    completion(Timeline(entries: out, policy: .atEnd))
  }
}

struct DayFace: View {
  let entry: DayEntry

  /// How wide a number is when set as a line, in box units -- its signs'
  /// advances added up. Not their count: a line of letters is each letter's
  /// own width, and "11" is narrow where "88" is not.
  private func boxWidth(_ n: Int) -> Double {
    guard let num = entry.num else { return Double(decimalPlaces(n).count) * 800 }
    return num.width(n)
  }

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let c = Calendar.current.dateComponents([.day, .month], from: entry.date)
      /* Divided by how many signs the number takes, and capped.
         Without it a day of the month is one size whatever base it is written
         in, and 23 in base two is 10111 -- five signs at 0.44 of the widget is
         three times its width, drawn straight off both edges. A picture is the
         only thing that says so; nothing throws. */
      let dv = c.day ?? 1, mv = c.month ?? 1
      let dEm = min(side * 0.44, side * 0.86 * 800 / CGFloat(boxWidth(dv)))
      let mEm = min(side * 0.17, side * 0.50 * 800 / CGFloat(boxWidth(mv)))
      VStack(spacing: side * 0.04) {
        NumberView(n: dv, num: entry.num, em: dEm)
        NumberView(n: mv, num: entry.num, em: mEm)
          .opacity(0.55)
      }
      .frame(width: geo.size.width, height: geo.size.height)
    }
    .padding(10)
  }
}

struct DateWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LinguaDate", provider: DayProvider()) { entry in
      DayFace(entry: entry).widgetGround()
    }
    .configurationDisplayName("Date")
    .description("Today, in your own numerals.")
    .supportedFamilies([.systemSmall])
  }
}
