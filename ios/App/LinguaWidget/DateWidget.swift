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

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let c = Calendar.current.dateComponents([.day, .month], from: entry.date)
      VStack(spacing: side * 0.04) {
        NumberView(n: c.day ?? 1, num: entry.num, em: side * 0.44)
        NumberView(n: c.month ?? 1, num: entry.num, em: side * 0.17)
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
