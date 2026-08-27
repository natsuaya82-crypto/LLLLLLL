//  LinguaMarkup.swift
//  Apple's own Markup, inside this app, on a sheet this app just wrote.
//
//  A file of its own for the same reason WidgetPoke.swift and LinguaPdf.swift
//  are, and that reason is written out in WidgetPoke: an import added to
//  LinguaShare.swift is how build #84 failed. This one is `import QuickLook`.
//
//  Why it exists. The sheet's road with no printer in it was: write the file
//  out, LEAVE Lingua, find it in Files, open it, press the pen, write, press
//  Done, come back, press upload, find the file again. Eight steps across two
//  apps to write three letters.
//  OWNER 2026-08-27「そのままdlした端末上で書くとか？じゃないと無理じゃね」
//
//  QLPreviewController in .updateContents mode is the same Markup a person
//  gets in Files — the same pen, the same colours, the same zoom — and it
//  writes back into the file it was given. Nothing here draws anything or
//  decides anything: it opens Apple's editor on a file and says when it shut.

import Foundation
import UIKit
import QuickLook

final class LinguaMarkup: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  private let url: URL
  private let done: (Bool) -> Void
  private var answered = false

  /// When the file was last written, taken before the editor opens. Whether
  /// somebody actually wrote anything is asked of the FILE and not of the
  /// delegate callbacks: `didUpdateContentsOf` is the documented signal and it
  /// is one more thing that has to fire, where a modification date either
  /// moved or it did not. Cancelling must do nothing at all — coming back to
  /// a message about an empty sheet is the app telling somebody off for
  /// changing their mind.
  private let was: Date?

  init(_ url: URL, _ done: @escaping (Bool) -> Void) {
    self.url = url
    self.done = done
    self.was = LinguaMarkup.when(url)
  }

  /// When a file was last written, or nothing if it is not there. The one
  /// place, because it is asked before the editor opens and again after it
  /// shuts, and two spellings of the same question is how one of them ends up
  /// answering a slightly different one.
  private static func when(_ url: URL) -> Date? {
    guard let a = try? FileManager.default.attributesOfItem(atPath: url.path) else { return nil }
    return a[.modificationDate] as? Date
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

  func previewController(_ controller: QLPreviewController,
                         previewItemAt index: Int) -> QLPreviewItem {
    url as NSURL
  }

  func previewController(_ controller: QLPreviewController,
                         editingModeFor previewItem: QLPreviewItem) -> QLPreviewItemEditingMode {
    .updateContents
  }

  /// QuickLook writes into the file when it can. When it cannot it hands back
  /// a copy instead, and this is the only place that knows the copy exists —
  /// dropping it would be somebody's writing quietly thrown away.
  ///
  /// Replaced by hand rather than with a plain move, because the sheet that is
  /// there is somebody's own file: the new bytes go beside it first and the
  /// old one is only let go once the new one is in place.
  func previewController(_ controller: QLPreviewController,
                         didSaveEditedCopyOf previewItem: QLPreviewItem,
                         at modifiedContentsURL: URL) {
    let fm = FileManager.default
    guard let bytes = try? Data(contentsOf: modifiedContentsURL), !bytes.isEmpty else { return }
    let tmp = url.deletingLastPathComponent()
      .appendingPathComponent(url.lastPathComponent + ".new")
    do {
      if fm.fileExists(atPath: tmp.path) { try? fm.removeItem(at: tmp) }
      try bytes.write(to: tmp, options: [.atomic,
                                         .completeFileProtectionUntilFirstUserAuthentication])
      _ = try fm.replaceItemAt(url, withItemAt: tmp)
    } catch {
      try? fm.removeItem(at: tmp)
    }
  }

  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    answer()
  }

  /// Once. Dismissed, cancelled and saved all land here, and a call that is
  /// never answered is a button that never comes back — PhotoPicker's own
  /// sentence, and the same reason.
  private func answer() {
    if answered { return }
    answered = true
    let now = LinguaMarkup.when(url)
    let wrote: Bool
    if let a = now, let b = was { wrote = a > b } else { wrote = (now != nil) != (was != nil) }
    done(wrote)
  }

  /// The editor, opened on one file. The caller keeps what comes back: the
  /// data source and the delegate have to outlive the call that made them.
  static func open(_ url: URL, from host: UIViewController,
                   done: @escaping (Bool) -> Void) -> LinguaMarkup {
    let d = LinguaMarkup(url, done)
    let vc = QLPreviewController()
    vc.dataSource = d
    vc.delegate = d
    host.present(vc, animated: true)
    return d
  }
}
