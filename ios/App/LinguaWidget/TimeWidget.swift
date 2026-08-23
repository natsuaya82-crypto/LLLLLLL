//  TimeWidget.swift
//  The time as it is read: 8:25, in somebody's own digits.
//
//  The other clock is a face with hands. This one is the number, and it is
//  the one most people actually read a phone for -- which makes it the place
//  a made numeral gets looked at most often, and therefore learnt.
//
//  Twelve or twenty-four is the PHONE's answer, not ours. iOS has one switch
//  for it and every clock on the device obeys it; a widget that disagreed
//  with the status bar six inches above it would be a widget nobody trusts.
//  「電話設置に合わせよう」
//
//  Minutes, not seconds, for the reason ClockWidget.swift gives at length:
//  a timeline is entries, iOS budgets the wakes and not the entries, and an
//  hour of minutes costs one wake.

import WidgetKit
import SwiftUI

struct TimeEntry: TimelineEntry {
  let date: Date
  let num: Numerals?
}

struct TimeProvider: TimelineProvider {
  func placeholder(in context: Context) -> TimeEntry {
    TimeEntry(date: Date(), num: nil)
  }
  func getSnapshot(in context: Context, completion: @escaping (TimeEntry) -> Void) {
    completion(TimeEntry(date: Date(), num: Numerals.read()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<TimeEntry>) -> Void) {
    let num = Numerals.read()
    let cal = Calendar.current
    let now = Date()
    let start = cal.date(from: cal.dateComponents([.year, .month, .day, .hour, .minute],
                                                  from: now)) ?? now
    var out: [TimeEntry] = []
    for i in 0..<60 {
      if let t = cal.date(byAdding: .minute, value: i, to: start) {
        out.append(TimeEntry(date: t, num: num))
      }
    }
    completion(Timeline(entries: out, policy: .atEnd))
  }
}

/// Does this phone show twelve hours or twenty-four.
///
/// Asked of the locale's own template rather than of a setting: "j" is the
/// skeleton that means "the hour, however this phone writes it", and what
/// comes back carries an `a` when that is with am/pm. It follows the switch
/// in Settings, which is what a person means by "the phone's".
func uses24Hour() -> Bool {
  let f = DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: Locale.current) ?? ""
  return !f.contains("a")
}

struct TimeFace: View {
  let entry: TimeEntry

  private var hourMinute: (Int, Int) {
    let c = Calendar.current.dateComponents([.hour, .minute], from: entry.date)
    var h = c.hour ?? 0
    if !uses24Hour() {
      h = h % 12
      if h == 0 { h = 12 }
    }
    return (h, c.minute ?? 0)
  }

  /// How wide the whole thing is, in box units, so the em can be chosen once
  /// and every sign of it comes out the same size.
  private func boxWidth(_ n: Int) -> Double {
    guard let num = entry.num else { return Double(decimalPlaces(n).count) * 800 }
    return num.width(n)
  }

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let hm = hourMinute
      /* The minute is always two signs and the hour may be one, so a clock
         whose em was chosen off the hour alone would jump a size at ten
         o'clock. Both, plus the mark between them, decided once. */
      let sepW = 800.0 * 0.42
      let total = boxWidth(hm.0) + sepW + boxWidth(minutePair(hm.1))
      let em = min(side * 0.42, side * 0.92 * 800 / CGFloat(total))
      HStack(spacing: 0) {
        NumberView(n: hm.0, num: entry.num, em: em)
        SepView(sep: entry.num?.sep, em: em)
        /* The minute keeps its leading zero -- 8:05 and not 8:5 -- and the
           zero is the person's own when they drew one. A language with no
           zero has nothing to put there, so it goes out as a roman one, the
           same fallback every other missing sign gets. */
        MinuteView(m: hm.1, num: entry.num, em: em)
      }
      .frame(width: geo.size.width, height: geo.size.height)
    }
    .padding(10)
  }

  /// The minute as one number for width purposes -- 5 is as wide as 05.
  private func minutePair(_ m: Int) -> Int { m < 10 ? m + 10 : m }
}

/// The mark between the hours and the minutes.
struct SepView: View {
  let sep: Named?
  let em: CGFloat

  var body: some View {
    Group {
      if let s = sep, s.all, let f = ScriptFont.at(em) {
        Text(s.r).font(f)
      } else {
        Text(":").font(.system(size: em * 0.62, weight: .medium))
      }
    }
    .frame(width: em * 0.42, height: em)
  }
}

/// Two signs, always, because a minute is written with two.
struct MinuteView: View {
  let m: Int
  let num: Numerals?
  let em: CGFloat

  private var places: [Int] {
    guard let num = num else { return [max(0, m) / 10, max(0, m) % 10] }
    /* In the language's own base, and padded to two of its signs -- base
       twelve writes twenty-five past as 2:1, which is what counting in twelve
       means and not a bug. */
    let p = num.places(max(0, m))
    return p.count >= 2 ? p : [0] + p
  }

  var body: some View {
    HStack(spacing: 0) {
      ForEach(Array(places.enumerated()), id: \.offset) { pair in
        OneSign(value: pair.element, num: num, em: em)
      }
    }
  }
}

/// One sign on its own, with the same line rule NumberView follows.
struct OneSign: View {
  let value: Int
  let num: Numerals?
  let em: CGFloat

  var body: some View {
    let box = num?.box ?? 800
    let f = num?.face(value)
    Group {
      if let f = f, let st = f.st, !st.isEmpty {
        GlyphShape(poly: st, box: box, dx: f.dx ?? 0)
          .fill(Color.primary)
          .frame(width: CGFloat(f.aw ?? box) * (em / CGFloat(box)), height: em)
      } else {
        Text(romanDigit(value)).font(.system(size: em * 0.62, weight: .medium))
          .frame(height: em)
      }
    }
  }
}

struct TimeWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LinguaTime", provider: TimeProvider()) { entry in
      TimeFace(entry: entry).widgetGround()
    }
    .configurationDisplayName("Time")
    .description("The time, in your own numerals.")
    .supportedFamilies([.systemSmall])
    /* Carried across from DateWidget, which this replaced. save added
       widgetRoom() there and to ClockWidget -- iOS 17 puts a margin round a
       widget's content that cannot be padded away, and contentMarginsDisabled()
       is the only thing that gives it back. yoo's widgets were written on the
       other branch and never had it, so a straight merge would have shipped
       two of the four with the margin still on. */
    .widgetRoom()
  }
}
