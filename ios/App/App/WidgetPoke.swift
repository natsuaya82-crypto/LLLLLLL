//  WidgetPoke.swift
//  The one call that tells the widget what it is holding is out of date.
//
//  It is a file of its own for a reason that has nothing to do with tidiness.
//  `import WidgetKit` brings SwiftUI with it, and in a file that also says
//  `import PhotosUI` the UIKit picker stops being visible -- the Clang module
//  is still built (the log shows its .pcm) and `PHPickerViewController`,
//  `PHPickerResult` and `PHPickerConfiguration` are simply not in scope. That
//  is how build #84 failed: LinguaShare.swift had held the picker since
//  a82a633 and compiled green in #82, and the only thing that changed was
//  this import moving in above it.
//
//  So the two live apart. Nothing here decides anything either.

import Foundation
import WidgetKit

enum WidgetPoke {
  /// A widget does not watch a file. It draws the timeline it was last handed
  /// and asks for another when that one runs out -- an hour for the clock, a
  /// week for the date -- so somebody who draws their own digits would go on
  /// seeing roman ones until then. iOS budgets how often it acts on this,
  /// which is why the caller says it behind a signature that only moves when
  /// the letters do, and not on a timer.
  static func reload() {
    WidgetCenter.shared.reloadAllTimelines()
  }
}
