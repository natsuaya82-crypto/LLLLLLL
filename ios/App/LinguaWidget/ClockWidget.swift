//  ClockWidget.swift
//  The time, on a face made of somebody's own digits.
//
//  Why a widget at all: a made alphabet is read by nobody, including the
//  person who made it, because there is nothing to read. A clock is looked at
//  forty times a day for a reason that has nothing to do with learning, and
//  that makes reading your own numerals a thing that happens rather than a
//  thing you sit down to do.
//
//  What a widget cannot do, and it decides the design: seconds. WidgetKit
//  shows entries off a timeline, so the hand can only move as often as there
//  are entries. A minute is affordable -- sixty entries covers the next hour
//  in one reload -- and a second is not, by three orders of magnitude. So
//  there is no second hand and the minute hand steps.

import WidgetKit
import SwiftUI

struct ClockEntry: TimelineEntry {
  let date: Date
  let num: Numerals?
}

struct ClockProvider: TimelineProvider {
  func placeholder(in context: Context) -> ClockEntry {
    ClockEntry(date: Date(), num: nil)
  }
  func getSnapshot(in context: Context, completion: @escaping (ClockEntry) -> Void) {
    completion(ClockEntry(date: Date(), num: Numerals.read()))
  }
  /// An hour of minutes in one go.
  ///
  /// iOS budgets how often it will WAKE an extension, and it does not budget
  /// how many entries a timeline holds. Asking to be woken every minute
  /// spends the budget by lunchtime and the clock stops; handing over sixty
  /// entries costs one wake and covers the hour.
  func getTimeline(in context: Context, completion: @escaping (Timeline<ClockEntry>) -> Void) {
    let num = Numerals.read()
    let cal = Calendar.current
    /* Truncated to the minute, not "the next time the second is zero":
       date(bySetting:) SEARCHES FORWARD, so it would hand back the top of the
       NEXT minute and the first entry would be a minute in the future --
       leaving the widget showing the previous timeline's last frame until it
       caught up. */
    let now = Date()
    let start = cal.date(from: cal.dateComponents([.year, .month, .day, .hour, .minute],
                                                  from: now)) ?? now
    var out: [ClockEntry] = []
    for i in 0..<60 {
      if let t = cal.date(byAdding: .minute, value: i, to: start) {
        out.append(ClockEntry(date: t, num: num))
      }
    }
    completion(Timeline(entries: out, policy: .atEnd))
  }
}

struct ClockFace: View {
  let entry: ClockEntry

  /// Which hours wear a numeral.
  ///
  /// Twelve of them, unless the base makes them too wide to be twelve. A
  /// language counting in two writes 12 as "1100" -- four signs -- and twelve
  /// four-sign numerals around a face 155 points across is a smudge. Above
  /// two signs it falls back to the quarters, which is the ordinary minimal
  /// watch face and survives any base.
  private var hours: [Int] {
    /* Two signs, and two signs' worth of room. BOTH, because either alone
       lets the wrong face through: counting in two makes 12 into "1100",
       four signs of which two are a bare stroke, so it slips under a width
       test and comes out as twelve unreadable smudges. Many signs is
       unreadable however narrow they are. */
    let most = (1...12).map { places($0).count }.max() ?? 1
    let widest = (1...12).map { boxWidth($0) }.max() ?? 800
    return (most <= 2 && widest <= 1700) ? Array(1...12) : [12, 3, 6, 9]
  }

  private func places(_ n: Int) -> [Int] {
    guard let num = entry.num else { return decimalPlaces(n) }
    return num.places(n)
  }
  /// How wide this number is when set as a line, in box units. With no file
  /// every sign is a roman one and a roman one takes a square.
  private func boxWidth(_ n: Int) -> Double {
    guard let num = entry.num else { return Double(decimalPlaces(n).count) * 800 }
    return num.width(n)
  }

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let r = side / 2
      let centre = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
      /* How big one sign is, and it is decided by the WIDEST numeral on the
         face rather than by how many numerals there are.
         The first version of this scaled by the count alone -- twelve small,
         four large -- and it was wrong in a way only a picture showed: in base
         two the face falls back to four numerals and every one of them is
         still four signs long, so "1100" was drawn 108 points wide on a face
         142 points across. Fewer numerals is not narrower numerals.
         And it is the numeral's WIDTH in box units, not its number of signs:
         a line of letters is each letter's own advance, so "11" of two narrow
         strokes is nowhere near as wide as "88" of two full ones. Asking
         width() is asking the app's inkAdv(), through the file.
         So: work out how much room one numeral has on the ring, divide by the
         widest numeral's width, and cap it so a face of narrow signs does not
         grow silly. Every numeral is then the same size as every
         other, which is what a clock face is.
         The ring is estimated at 0.78r for the spacing sum and then set
         properly below -- em and ring each want the other, and this is the
         cheaper way round. */
      let n = hours.count
      let widest = hours.map { boxWidth($0) }.max() ?? 800
      let room = 2 * (r * 0.78) * sin(.pi / Double(n))
      let em = min(side * 0.19, room * 0.82 * 800 / CGFloat(widest))
      let ring = r - em * 0.85

      ZStack {
        ForEach(hours, id: \.self) { h in
          NumberView(n: h, num: entry.num, em: em)
            .position(onRing(centre: centre, r: ring, hour: Double(h)))
        }
        /* The ticks nobody wears a numeral on, so the face is still a face
           when it has fallen back to four. */
        ForEach(0..<12, id: \.self) { i in
          if !hours.contains(i == 0 ? 12 : i) {
            Circle()
              .fill(Color.primary.opacity(0.28))
              .frame(width: side * 0.016, height: side * 0.016)
              .position(onRing(centre: centre, r: ring, hour: Double(i == 0 ? 12 : i)))
          }
        }
        /* The hands reach for the numerals rather than stopping well short of
           them. They are the only thing on the face with no neighbour to
           collide with, so this is the one measurement here that can simply
           be bigger. */
        Hand(centre: centre, angle: hourAngle, length: r * 0.54, width: side * 0.035)
        Hand(centre: centre, angle: minuteAngle, length: r * 0.80, width: side * 0.022)
        Circle()
          .fill(Color.primary)
          .frame(width: side * 0.05, height: side * 0.05)
          .position(centre)
      }
    }
    /* Eight, and it stays eight. Taking it to two was tried and put back:
       a numeral is drawn CENTRED on the ring and is as wide as it is long, so
       a four-sign one in base two already reaches past the circle -- its left
       edge sits at r + 1.15em from the middle, not r. The eight was what kept
       that inside the widget, and without it the nine o'clock numeral is cut
       off by the edge. The room this change wins comes from iOS's own margin
       instead -- widgetRoom() -- which is the one that was actually eating
       the widget.

       The overflow itself is real and is not fixed here: ring could take the
       numeral's half-WIDTH into account rather than its height alone, which
       would pull wide numerals in far enough to drop this padding. That is a
       change to how the face is laid out and it wants a phone. */
    .padding(8)
  }

  private func onRing(centre: CGPoint, r: CGFloat, hour: Double) -> CGPoint {
    /* Twelve o'clock is straight up, and a screen's y runs down, so the
       angle starts at -90 degrees and goes clockwise. */
    let a = (hour / 12) * 2 * .pi - .pi / 2
    return CGPoint(x: centre.x + r * cos(a), y: centre.y + r * sin(a))
  }

  private var hourAngle: Double {
    let c = Calendar.current.dateComponents([.hour, .minute], from: entry.date)
    let h = Double((c.hour ?? 0) % 12) + Double(c.minute ?? 0) / 60
    return (h / 12) * 2 * .pi - .pi / 2
  }
  private var minuteAngle: Double {
    let m = Double(Calendar.current.component(.minute, from: entry.date))
    return (m / 60) * 2 * .pi - .pi / 2
  }
}

/// One hand, drawn from the middle outwards.
struct Hand: View {
  let centre: CGPoint
  let angle: Double
  let length: CGFloat
  let width: CGFloat

  var body: some View {
    Path { p in
      p.move(to: centre)
      p.addLine(to: CGPoint(x: centre.x + length * cos(angle),
                            y: centre.y + length * sin(angle)))
    }
    .stroke(Color.primary, style: StrokeStyle(lineWidth: width, lineCap: .butt))
  }
}

struct ClockWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LinguaClock", provider: ClockProvider()) { entry in
      ClockFace(entry: entry).widgetGround()
    }
    .configurationDisplayName("Clock")
    .description("The time, in your own numerals.")
    .supportedFamilies([.systemSmall])
    .widgetRoom()
  }
}
