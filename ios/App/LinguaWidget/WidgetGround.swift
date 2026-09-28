//  WidgetGround.swift
//  The background, which is two different requirements on two iOS versions.
//
//  iOS 17 REQUIRES containerBackground: a widget without one is drawn with no
//  ground at all in the places iOS 17 puts widgets that never existed before
//  -- StandBy, the Mac, the iPad lock screen. iOS 15 and 16 do not have the
//  modifier at all, and this app's deployment target is 15.0.
//
//  One modifier, so neither widget carries the version check itself.

import SwiftUI
import WidgetKit

extension View {
  @ViewBuilder
  func widgetGround() -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(for: .widget) { Color(.systemBackground) }
    } else {
      self
    }
  }
}

//  And the room the widget is drawn in.
//
//  iOS 17 puts a margin inside every widget and does it whether or not
//  anybody asked -- about 16 points on each side of a small widget, which is
//  a small widget being roughly 158 across. That is a fifth of the width
//  given away before a single line is drawn, and it is why the clock looked
//  like a clock sitting in a box rather than a clock.
//  「ウェジット小さくない？もっとウェジットないに広く使って欲しい」
//

//  contentMarginsDisabled() is iOS 17's own way of saying "I will do my own
//  spacing", and it is on each widget's configuration, NOT wrapped in
//  `if #available`: the modifier is available from iOS 15, which is this
//  target, and a wrapped version would not compile (@ViewBuilder builds
//  views, not a WidgetConfiguration -- build #89). Swift is compiled only by
//  a build; nothing in `npm test` reads a .swift file.
