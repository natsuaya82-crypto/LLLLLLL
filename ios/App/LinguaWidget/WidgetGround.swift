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
//  spacing", and it is the modifier that would win this room back.
//
//  IT IS NOT HERE, and build #89 is why. The version that was here read:
//
//      extension WidgetConfiguration {
//        @ViewBuilder
//        func widgetRoom() -> some WidgetConfiguration {
//          if #available(iOS 17.0, *) { self.contentMarginsDisabled() }
//          else { self }
//        }
//      }
//
//  and the compiler refused it:
//
//      error: static method 'buildExpression' requires that
//             'some WidgetConfiguration' conform to 'View'
//
//  @ViewBuilder builds views. A function returning some WidgetConfiguration
//  cannot be built with it, and there is no configuration builder to swap in
//  that exists before iOS 17 -- which is the very version the branch was
//  guarding against.
//
//  It was written on Linux, where no Swift compiler runs, and nothing in
//  `npm test` reads a .swift file. Nineteen checks, all green, and the first
//  thing that ever read this was a build. Whatever replaces it has to be
//  compiled before it is believed.
