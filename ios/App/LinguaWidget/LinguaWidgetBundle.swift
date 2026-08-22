//  LinguaWidgetBundle.swift
//  The extension's one entry point.

import WidgetKit
import SwiftUI

@main
struct LinguaWidgetBundle: WidgetBundle {
  var body: some Widget {
    ClockWidget()
    DateWidget()
  }
}
