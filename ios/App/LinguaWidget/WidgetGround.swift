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
//  spacing", and the faces do: each already has its own padding and keeps it.
//  That padding is not the one to cut -- ClockWidget.swift says why -- so all
//  of the room this wins is room iOS was taking. On 15 and 16 the modifier
//  does not exist and there was never a margin to disable, so those two get
//  the configuration unchanged and look the same as they always did.
//
//  One modifier, beside the other one, so neither widget carries the version
//  check itself.
extension WidgetConfiguration {
  @ViewBuilder
  func widgetRoom() -> some WidgetConfiguration {
    if #available(iOS 17.0, *) {
      self.contentMarginsDisabled()
    } else {
      self
    }
  }
}
