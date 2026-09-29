# Lingua — Shipaton 2026 submission

Paste each section into the matching Devpost field.

## Project name
Lingua — Conlang Builder

## Tagline
Make your own language — draw its letters, build its words, and write in it with keyboards you design.

## What it is
Lingua is a conlang (constructed language) studio for iPhone. You draw your own alphabet with your finger, and Lingua turns it into a real font on the device. Then you build the language around it — words, sounds, grammar — and write in it with a keyboard made from the letters you drew.

## What you can do
- **Draw your alphabet.** Every language starts with its own a–z, ! and ? and a digit for every number, ready to draw on. Strokes, fills and rounding become a font on the phone, so what you drew is what you type.
- **Design keyboards — free, as many as you like.** Lay out your own keys in a grid editor. A keyboard made of your drawn letters types inside Lingua. A keyboard made of existing characters (IPA, symbols, any script) works as an iOS keyboard in every other app too — so Lingua is also a custom-keyboard app.
- **Build the language.** A dictionary with meanings, readings and example sentences; a phonology chosen from real IPA; a word generator that proposes new words that fit your language's sounds and syllable shapes; a grammar engine that writes sentences in your language's own word order.
- **Share it.** A timeline where every post is written in its author's letters — the shapes travel with the post, so everyone sees your script exactly as you drew it. A daily prompt gives everyone the same sentence to translate. Turn any line into a card image to share outside the app.
- **Learn as you go.** Every chapter has a `?` with a short guide, so the app teaches itself.
- **Ten interface languages**: English, Japanese, Korean, Chinese, Spanish, Portuguese, French, German, Italian, Russian.

## Built with
- Plain HTML/CSS/JavaScript in a Capacitor iOS shell, with an OpenType font writer running on the device.
- A Swift keyboard extension that types the letters you drew.
- Supabase for accounts, the timeline and storing every language on the server.
- **RevenueCat SDK** for the Plus and Pro subscriptions (monthly and yearly).

## Monetization
Free: your own a–z, ! ? and digits, unlimited keyboards, the timeline, posting and editing posts.
Plus: add, rename and delete letters, other writing systems (syllabaries, abugidas, logographies), choose sounds, export your drawn font, take chapters of other people's languages.
Pro: an unlimited dictionary, import from files and CSV export, and the Pro mark.
A plan decides what you can do — never what you keep: everything made on a paid plan stays after it ends.

## Links
- App Store: https://apps.apple.com/us/app/lingua-conlang-builder/id6796378999
- Demo video: <YouTube or Vimeo URL — owner>
- Promo code for judges: <code — owner, App Store Connect>

## Files in this folder
- `icon-1024.png` — 1024 × 1024
- `feed.png`, `letters.png`, `kb.png`, `profile.png`, `about.png` — 1179 × 2556, no device frame
