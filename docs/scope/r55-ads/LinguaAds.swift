//  LinguaAds.swift
//  A place in the timeline nobody has bought, filled by AdMob.
//
//  「広告の形は、Twitterと同じ。ツイート擬態右上にprとつく。広告枠が売れる形に
//  する。今は売る人いないからadmobを流す。proのみ表示なし。」 OWNER 2026-09-23.
//
//  The timeline is HTML in a WKWebView, and an AdMob native ad -- video
//  included -- has to be drawn by Google's own views (NativeAdView, MediaView):
//  drawing its headline and picture in HTML is against the native ads policy,
//  because the views are what count the impression and the tap. So the place
//  in the timeline is an empty row the height of the ad (www/sns.js, `.padm`),
//  and the ad is laid over it from here.
//
//  WHERE IT IS PUT, and why there, is docs/scope/r55-ads.md § 作り方. Short:
//  the page scrolls the WKWebView's own scrollView (measured), so the ads sit in
//  a box INSIDE that scrollView -- a finger that starts on an ad still scrolls
//  the timeline -- and the box is moved to the visible part on every change of
//  contentOffset, here, natively, with no round trip to JavaScript. What the app
//  keeps fixed over the timeline (the bar, the tab bar, the + button, a toast)
//  is cut out of the box, for drawing AND for touches; anything that covers the
//  whole screen (a sheet's backdrop, a question, the turning mark) hides it.
//
//  This class decides nothing about WHO sees ads. www/core.js's can('noads')
//  does, and every `place` carries its answer: `on:false` takes every ad down
//  before anything is drawn, whatever was asked before. That is the last line,
//  put where the drawing is -- the shape jpel's adsDisabled has.

import Foundation
import UIKit
import Capacitor
import GoogleMobileAds
import AppTrackingTransparency

@objc(LinguaAdsPlugin)
public class LinguaAdsPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "LinguaAdsPlugin"
  public let jsName = "LinguaAds"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "load", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "place", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "drop", returnType: CAPPluginReturnPromise),
  ]

  /// Google's own test unit for native ads. What ships is Info.plist's
  /// `LinguaAdUnit`, which .github/workflows/ios-deploy.yml fills from a
  /// secret -- and fills with THIS until the owner has made a unit, so a build
  /// never carries a placeholder and never serves a real ad by accident.
  static let testUnit = "ca-app-pub-3940256099942544/3986624511"

  private var started = false
  private var ads: [Int: Placed] = [:]
  private var asking: [Int: Asker] = [:]
  private var box: AdBox?
  private var watch: NSKeyValueObservation?
  private var look = Look()

  private var unit: String {
    let u = (Bundle.main.object(forInfoDictionaryKey: "LinguaAdUnit") as? String) ?? ""
    return (u.isEmpty || u.hasPrefix("__")) ? LinguaAdsPlugin.testUnit : u
  }

  // ---- start: the SDK once, and the tracking question once ---------------

  /// Everything served is capped at Teen, the same line jpel draws: the App
  /// Store age rating is what a rating here has to agree with, and an ad above
  /// it is a rejection (jpel build 78, guideline 2.5.18). Then App Tracking
  /// Transparency, asked only while nobody has answered it -- declining still
  /// serves ads, only not ones chosen by tracking.
  @objc func start(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      if !self.started {
        self.started = true
        MobileAds.shared.requestConfiguration.maxAdContentRating = GADMaxAdContentRating.teen
        MobileAds.shared.start(completionHandler: nil)
      }
      self.askTracking { call.resolve([:]) }
    }
  }

  private func askTracking(_ done: @escaping () -> Void) {
    if #available(iOS 14, *) {
      if ATTrackingManager.trackingAuthorizationStatus == .notDetermined {
        ATTrackingManager.requestTrackingAuthorization { _ in
          DispatchQueue.main.async { done() }
        }
        return
      }
    }
    done()
  }

  // ---- load: one ad for one place, laid out at the width it will have ----

  /// `k` is which place (the first, the second...), `w` the width of the row
  /// in points, `look` the colours of the theme the timeline is drawn in, and
  /// `label` the word in the corner, which www/ passes through t().
  /// Resolves with `h`, the height the row has to be. No fill is a rejection,
  /// and the place stays nothing -- never a gap with nothing in it.
  @objc func load(_ call: CAPPluginCall) {
    let k = call.getInt("k") ?? 0
    let w = CGFloat(call.getDouble("w") ?? 0)
    let lk = Look(call.getObject("look"), label: call.getString("label") ?? "PR")
    DispatchQueue.main.async {
      guard w > 0 else { call.reject("no width"); return }
      self.look = lk
      if let p = self.ads[k] {
        if p.width != w || p.look != lk { self.lay(p, w: w) }
        call.resolve(["h": Double(p.height)])
        return
      }
      if self.asking[k] != nil { call.reject("already asking"); return }
      let a = Asker(k: k, width: w, call: call, owner: self)
      self.asking[k] = a
      let video = VideoOptions()
      video.shouldStartMuted = true
      let view = NativeAdViewAdOptions()
      // PR is in the top right corner, so the mark Google adds goes to the
      // bottom right, where nothing of the row is.
      view.preferredAdChoicesPosition = .bottomRightCorner
      let loader = AdLoader(adUnitID: self.unit,
                            rootViewController: self.bridge?.viewController,
                            adTypes: [.native], options: [video, view])
      loader.delegate = a
      a.loader = loader
      loader.load(Request())
    }
  }

  fileprivate func got(_ a: Asker, _ ad: NativeAd) {
    asking[a.k] = nil
    let p = Placed(ad: ad)
    lay(p, w: a.width)
    ads[a.k] = p
    a.call.resolve(["h": Double(p.height)])
  }

  fileprivate func missed(_ a: Asker, _ why: String) {
    asking[a.k] = nil
    a.call.reject(why)
  }

  // ---- place: where each row is, and what stands over the timeline -------

  /// `slots` is [{k, x, y, w}] in the PAGE's coordinates (the document, not the
  /// screen), `holes` is [{x, y, w, h}] in the screen's, and `over` is true
  /// while something covers the whole screen. `on` is can('noads') turned
  /// round, asked by www/ the moment before this call.
  @objc func place(_ call: CAPPluginCall) {
    let on = call.getBool("on") ?? false
    let over = call.getBool("over") ?? false
    var want: [Int: CGRect] = [:]
    for s in call.getArray("slots", JSObject.self) ?? [] {
      let k = (s["k"] as? NSNumber)?.intValue ?? -1
      want[k] = CGRect(x: num(s["x"]), y: num(s["y"]), width: num(s["w"]), height: 0)
    }
    var holes: [CGRect] = []
    for h in call.getArray("holes", JSObject.self) ?? [] {
      holes.append(CGRect(x: num(h["x"]), y: num(h["y"]), width: num(h["w"]), height: num(h["h"])))
    }
    DispatchQueue.main.async {
      guard on else { self.dropAll(); call.resolve([:]); return }
      guard let b = self.install() else { call.resolve([:]); return }
      b.holes = holes
      b.isHidden = over
      for (k, p) in self.ads {
        if let r = want[k] {
          p.at = CGPoint(x: r.minX, y: r.minY)
          if p.width != r.width && r.width > 0 { self.lay(p, w: r.width) }
          if p.view.superview !== b { b.addSubview(p.view) }
        } else {
          p.view.removeFromSuperview()
        }
      }
      self.follow()
      call.resolve([:])
    }
  }

  /// can('noads') became true, or nobody is signed in: every ad goes, and
  /// what was loaded is let go rather than kept for later.
  @objc func drop(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      self.dropAll()
      call.resolve([:])
    }
  }

  private func dropAll() {
    for (_, p) in ads { p.view.removeFromSuperview() }
    ads = [:]
    for (_, a) in asking { a.call.reject("dropped") }
    asking = [:]
    box?.isHidden = true
  }

  // ---- the box, and following the scroll ---------------------------------

  private func install() -> AdBox? {
    if let b = box { return b }
    guard let sv = bridge?.webView?.scrollView else { return nil }
    let b = AdBox()
    b.clipsToBounds = true
    b.backgroundColor = .clear
    sv.addSubview(b)
    box = b
    watch = sv.observe(\.contentOffset, options: [.new]) { [weak self] _, _ in
      self?.follow()
    }
    return b
  }

  /// The box is the visible part of the page, in the scrollView's content
  /// coordinates -- which ARE the page's, at the zoom of 1 this app never
  /// leaves. So an ad at page (x, y) is at (x, y) minus where the box is.
  /// Called on every contentOffset change, from UIKit's own scroll, so the ad
  /// moves in the same frame as the HTML around it.
  private func follow() {
    guard let b = box, let sv = bridge?.webView?.scrollView else { return }
    let ins = sv.adjustedContentInset
    let f = CGRect(x: sv.contentOffset.x + ins.left,
                   y: sv.contentOffset.y + ins.top,
                   width: sv.bounds.width - ins.left - ins.right,
                   height: sv.bounds.height - ins.top - ins.bottom)
    if b.frame != f { b.frame = f; b.cut() }
    sv.bringSubviewToFront(b)
    for (_, p) in ads where p.view.superview === b {
      p.view.frame = CGRect(x: p.at.x - f.minX, y: p.at.y - f.minY,
                            width: p.width, height: p.height)
    }
  }

  // ---- what the row looks like: a post ------------------------------------

  /// The same parts as a post in www/post.js, at the same sizes as
  /// www/index.html's `.post` rules: 12/16 padding, a 40pt face, 12 between the
  /// face and the column; the name bold at .95rem, the one under it at .9rem,
  /// the text at 1rem and 1.5 high; PR in the corner at .8rem. The call to
  /// action is words in the colour everything pressable is, with nothing round
  /// it (CLAUDE.md § NO ROUNDED BOX). The whole row is the ad, so a press
  /// anywhere on it is Google's to count.
  private func lay(_ p: Placed, w: CGFloat) {
    p.look = look
    p.build(look)
    p.width = w
    p.view.frame = CGRect(x: 0, y: 0, width: w, height: 1)
    let s = p.view.systemLayoutSizeFitting(
      CGSize(width: w, height: UIView.layoutFittingCompressedSize.height),
      withHorizontalFittingPriority: .required,
      verticalFittingPriority: .fittingSizeLevel)
    p.height = ceil(s.height)
    p.view.frame = CGRect(x: 0, y: 0, width: w, height: p.height)
  }

  private func num(_ v: Any?) -> CGFloat {
    if let n = v as? NSNumber { return CGFloat(n.doubleValue) }
    return 0
  }
}

/// One ad and the row drawn for it.
private final class Placed {
  let ad: NativeAd
  let view = NativeAdView()
  var width: CGFloat = 0
  var height: CGFloat = 0
  var at = CGPoint.zero
  var look = Look()

  init(ad: NativeAd) { self.ad = ad }

  func build(_ lk: Look) {
    view.subviews.forEach { $0.removeFromSuperview() }
    view.backgroundColor = lk.bg

    let icon = UIImageView()
    icon.contentMode = .scaleAspectFill
    icon.clipsToBounds = true
    icon.layer.cornerRadius = 20
    icon.backgroundColor = lk.line
    icon.image = ad.icon?.image
    icon.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([icon.widthAnchor.constraint(equalToConstant: 40),
                                 icon.heightAnchor.constraint(equalToConstant: 40)])

    let head = label(ad.headline, size: 15.2, weight: .bold, color: lk.fg)
    head.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    let who = label(ad.advertiser, size: 14.4, weight: .regular, color: lk.mute)
    who.setContentCompressionResistancePriority(.defaultLow - 1, for: .horizontal)
    let pr = label(lk.label, size: 12.8, weight: .regular, color: lk.sub)
    pr.setContentHuggingPriority(.required, for: .horizontal)
    pr.setContentCompressionResistancePriority(.required, for: .horizontal)
    let gap = UIView()
    gap.setContentHuggingPriority(.defaultLow - 2, for: .horizontal)
    let top = UIStackView(arrangedSubviews: [head, who, gap, pr])
    top.axis = .horizontal
    top.spacing = 6
    top.alignment = .firstBaseline

    let body = label(ad.body, size: 16, weight: .regular, color: lk.sub)
    body.numberOfLines = 0

    let media = MediaView()
    media.mediaContent = ad.mediaContent
    let ratio = ad.mediaContent.aspectRatio > 0 ? ad.mediaContent.aspectRatio : 16.0 / 9.0
    media.translatesAutoresizingMaskIntoConstraints = false
    media.heightAnchor.constraint(equalTo: media.widthAnchor,
                                  multiplier: 1.0 / ratio).isActive = true

    let cta = label(ad.callToAction, size: 14.4, weight: .semibold, color: lk.acc)

    let col = UIStackView(arrangedSubviews: [top, body, media, cta])
    col.axis = .vertical
    col.spacing = 8
    col.alignment = .fill
    body.isHidden = (ad.body ?? "").isEmpty
    who.isHidden = (ad.advertiser ?? "").isEmpty
    cta.isHidden = (ad.callToAction ?? "").isEmpty

    let row = UIStackView(arrangedSubviews: [icon, col])
    row.axis = .horizontal
    row.spacing = 12
    row.alignment = .top
    row.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(row)
    NSLayoutConstraint.activate([
      row.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
      row.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
      row.topAnchor.constraint(equalTo: view.topAnchor, constant: 12),
      row.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -12),
    ])

    view.iconView = icon
    view.headlineView = head
    view.advertiserView = who
    view.bodyView = body
    view.mediaView = media
    view.callToActionView = cta
    cta.isUserInteractionEnabled = false
    // Last, after every asset is in place: this is what hands the views to
    // the SDK to count.
    view.nativeAd = ad
  }

  private func label(_ s: String?, size: CGFloat, weight: UIFont.Weight,
                     color: UIColor) -> UILabel {
    let l = UILabel()
    l.text = s
    l.font = .systemFont(ofSize: size, weight: weight)
    l.textColor = color
    l.lineBreakMode = .byTruncatingTail
    return l
  }
}

/// The box the ads sit in. What the app keeps fixed over the timeline is cut
/// out of it -- drawn through, and pressed through -- and anywhere with no ad
/// under the finger is the page's, not this view's.
private final class AdBox: UIView {
  var holes: [CGRect] = [] { didSet { cut() } }

  func cut() {
    let path = UIBezierPath(rect: bounds)
    for h in holes { path.append(UIBezierPath(rect: h)) }
    let m = CAShapeLayer()
    m.path = path.cgPath
    m.fillRule = .evenOdd
    layer.mask = m
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    if isHidden { return nil }
    for h in holes where h.contains(point) { return nil }
    let v = super.hitTest(point, with: event)
    return v === self ? nil : v
  }
}

/// The theme the timeline is drawn in, handed over by www/ as the page's own
/// computed colours, so the ad row wears the same two themes as every post.
private struct Look: Equatable {
  var fg = UIColor.label
  var sub = UIColor.secondaryLabel
  var mute = UIColor.tertiaryLabel
  var acc = UIColor.systemBrown
  var bg = UIColor.systemBackground
  var line = UIColor.separator
  var label = "PR"

  init() {}

  init(_ o: JSObject?, label: String) {
    self.label = label
    guard let o = o else { return }
    fg = Look.color(o["fg"]) ?? fg
    sub = Look.color(o["sub"]) ?? sub
    mute = Look.color(o["mute"]) ?? mute
    acc = Look.color(o["acc"]) ?? acc
    bg = Look.color(o["bg"]) ?? bg
    line = Look.color(o["line"]) ?? line
  }

  /// `rgb(r, g, b)` or `rgba(r, g, b, a)`, which is what getComputedStyle
  /// answers for every colour however the stylesheet wrote it.
  static func color(_ v: Any?) -> UIColor? {
    guard let s = v as? String, let open = s.firstIndex(of: "("),
          let close = s.lastIndex(of: ")") else { return nil }
    let parts = s[s.index(after: open)..<close].split(separator: ",").map {
      Double($0.trimmingCharacters(in: .whitespaces)) ?? 0
    }
    guard parts.count >= 3 else { return nil }
    return UIColor(red: parts[0] / 255, green: parts[1] / 255, blue: parts[2] / 255,
                   alpha: parts.count > 3 ? parts[3] : 1)
  }
}

/// One request for one place. NSObject because the SDK's delegates are
/// Objective-C protocols.
private final class Asker: NSObject, NativeAdLoaderDelegate {
  let k: Int
  let width: CGFloat
  let call: CAPPluginCall
  weak var owner: LinguaAdsPlugin?
  var loader: AdLoader?

  init(k: Int, width: CGFloat, call: CAPPluginCall, owner: LinguaAdsPlugin) {
    self.k = k
    self.width = width
    self.call = call
    self.owner = owner
  }

  func adLoader(_ adLoader: AdLoader, didReceive nativeAd: NativeAd) {
    DispatchQueue.main.async { self.owner?.got(self, nativeAd) }
  }

  func adLoader(_ adLoader: AdLoader, didFailToReceiveAdWithError error: Error) {
    let why = error.localizedDescription
    DispatchQueue.main.async { self.owner?.missed(self, why) }
  }
}
