//  LinguaPdf.swift
//  One page of a PDF, as a picture — WITH what somebody wrote on it.
//
//  A file of its own for the same reason WidgetPoke.swift is one, and that
//  reason is written out there: an import in LinguaShare.swift is how build
//  #84 failed. This one is `import PDFKit`, which brings Quartz with it, and
//  that file also says `import PhotosUI`. Nobody has proved the two collide.
//  Nobody proved WidgetKit did either, until a build was spent finding out.
//
//  PDFKit and not CGContext.drawPDFPage, and this is the whole point of the
//  file rather than a preference:
//
//      drawPDFPage draws the page's CONTENT STREAM. It does not draw
//      annotations.
//
//  iOS Markup — a finger or an Apple Pencil on a PDF in Files, Mail or Quick
//  Look — saves every stroke as a PDF ANNOTATION, an object beside the page
//  with an appearance stream of its own. So a sheet somebody wrote on with a
//  pencil, drawn by drawPDFPage, comes out as the blank sheet it was printed
//  as. Nothing throws: the four corner marks are found, the strip reads, the
//  twenty names come back, and every box is empty. It is the exact shape of
//  failure this app is built to refuse — a right-looking answer with the
//  person's work missing out of it.
//
//  PDFPage.draw(with:to:) draws the page and then its annotations, which is
//  what a person sees when they open the file, and what they wrote is the
//  only reason this road exists.
//  OWNER 2026-08-27「俺たちがアプリで作ったpdfで書いた文字が読み込めれば
//  なに使ってもいいのよ」

import Foundation
import UIKit
import PDFKit

enum LinguaPdf {
  /// The first page, at most `edge` down its long side, on white.
  ///
  /// One page, because that is what the reading side has always done:
  /// www/sheet.js's shPdfJpeg() answers the largest JPEG in a file and
  /// shPage() reads one page. A twenty-first name is a second sheet, not a
  /// second page of this one.
  ///
  /// White behind it. A PDF page is transparent where nothing was drawn and
  /// transparent flattens to black, which is a page of ink and no corner
  /// marks. shLook() does the same on the other side of the wall.
  ///
  /// `.mediaBox` is asked of PDFKit as `.cropBox` when there is one, and
  /// PDFPage.bounds(for:) already falls back on its own — and it carries the
  /// page's rotation, so a scan that is a quarter turn round comes out the way
  /// somebody looks at it. A sheet rendered sideways is four corner marks in
  /// the wrong corners, which does not fail: it reads as something that is not
  /// a sheet.
  static func page(_ data: Data, _ edge: CGFloat) -> UIImage? {
    guard edge > 0,
          let doc = PDFDocument(data: data),
          let page = doc.page(at: 0) else { return nil }
    let box = page.bounds(for: .cropBox)
    guard box.width > 0, box.height > 0 else { return nil }
    let k = edge / max(box.width, box.height)
    let size = CGSize(width: (box.width * k).rounded(),
                      height: (box.height * k).rounded())
    guard size.width >= 1, size.height >= 1 else { return nil }
    return UIGraphicsImageRenderer(size: size).image { c in
      UIColor.white.setFill()
      c.fill(CGRect(origin: .zero, size: size))
      // The flip and the SCALE, and neither is decoration.
      //
      // `page.draw(with:to:)` draws the page at its own size, in POINTS. It
      // places the box and it carries the rotation; it does not fit the page
      // to the context it is handed. So drawing an A4 page straight into a
      // 1556x2200 context put a 595x842 sheet in the corner of it -- and
      // nothing threw, because the picture that came back was a real picture
      // of the sheet, only 2.6 times too small inside a white page.
      //
      // What that costs is the whole feature. www/sheet.js's shScan() sizes
      // the four corner marks off the image it is given -- `want = W / SH_W *
      // SH_MARK`, and it accepts half to twice that. At `edge` the marks are
      // 36.6 pixels; drawn unscaled they are 14, which is under the floor of
      // 18.3, so every one of the four is thrown away and the answer is
      // `fail:'marks'` -- 「四隅の印が四つとも写っていません」 on a sheet that
      // was never touched. Measured both ways in the browser before this was
      // written: 36.6 finds four marks, 14.0 finds none.
      //
      // The flip is the other half. UIGraphicsImageRenderer hands out a
      // context whose y runs DOWN, the way UIKit draws; a PDF's y runs UP. So
      // the scale is negative and the origin starts at the foot of the image.
      // Without it the sheet comes back upside down, which does not fail
      // either: four marks are found, in the wrong corners, and the strip is
      // read from the bottom.
      let g = c.cgContext
      g.translateBy(x: 0, y: size.height)
      g.scaleBy(x: k, y: -k)
      page.draw(with: .cropBox, to: g)
    }
  }
}
