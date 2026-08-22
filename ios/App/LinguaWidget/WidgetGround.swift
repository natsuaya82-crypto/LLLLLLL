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
