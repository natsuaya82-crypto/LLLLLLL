# Mail

Six digits, out of a mailbox, into `obAskHTML` in `www/onboard.js`. This file is
how they get there, written down because the next person to need it is whoever
set it up, a year later, with none of it in their head.

Supabase sends confirmation mail itself out of the box. That mailer is for
testing and stops at a few messages an hour — it does not announce a limit, it
simply stops, and the first place anybody notices is a TestFlight build where
half the testers never got a code. So the mail goes out through somebody whose
job it is.

**Nothing here is a secret and nothing here may become one.** The API key, the
SMTP password and the `service_role` key live in the Resend and Supabase
dashboards and nowhere else. If a value below ever needs to be replaced with a
real one, it belongs in a dashboard field, not in this file.

Project ref: `iimwukyyasbybfrirhsf`
Sender: `official@tokinets.com`
Provider: Resend, sending as `tokinets.com`

## Why this does not break the mailboxes

`tokinets.com` receives on Google Workspace. Sending through Resend and
receiving through Google are two different things and they are kept apart on
purpose:

    tokinets.com        MX    Google.        Untouched. This is where mail arrives.
    tokinets.com        TXT   Google's SPF.  Untouched.
    send.tokinets.com   MX    Resend's.      Bounces only. A subdomain nobody reads.
    send.tokinets.com   TXT   Resend's SPF.
    resend._domainkey   TXT   Resend's DKIM.

Every record Resend asks for is on `send.` or on `resend._domainkey`. **Nothing
is added at the root and nothing at the root is edited.** Putting Resend's MX on
the root instead of on `send` deletes every mailbox on the domain — the mail
does not bounce, it goes to Amazon and is dropped. Check the host field before
saving; a form that shows existing records as `send` rather than
`send.tokinets.com` wants the short form for the new one too.

There is one root record, and it is new rather than edited:

    _dmarc.tokinets.com   TXT   v=DMARC1; p=none; rua=mailto:official@tokinets.com

`p=none` reports and refuses nothing. Raise it to `quarantine` once the reports
are quiet, not before — a DMARC policy set on the day it is created rejects your
own mail while the DNS is still propagating.

## The DNS records themselves

They come from `resend.com/domains` → `tokinets.com`, and the exact values are
that screen's, not this file's: the region is in the MX hostname and the DKIM
key is 200-odd characters that must be copied, never retyped. The shape:

| Type | Name               | Value                                        |
|------|--------------------|----------------------------------------------|
| MX   | `send`             | `feedback-smtp.<region>.amazonses.com`, prio 10 |
| TXT  | `send`             | `v=spf1 include:amazonses.com ~all`          |
| TXT  | `resend._domainkey`| `p=…`                                        |

Then **Verify DNS Records** on the same screen. Minutes to an hour. A row that
stays red is a host field written the wrong way, not a wait.

## Supabase

`Authentication → Emails → SMTP Settings`, `Enable Custom SMTP` on:

    Sender email   official@tokinets.com
    Sender name    Lingua
    Host           smtp.resend.com
    Port           465
    Username       resend          <- literally the word. Not an address.
    Password       the re_… key from resend.com/api-keys (Sending access is enough)

`Authentication → Rate Limits` → emails → 30/hour. Custom SMTP does not lift
Supabase's own limit; it is a separate number and it is low by default.

## The templates, which are not optional — and there are TWO

**Confirm signup and Reset Password are two separate templates in the
dashboard, and changing one does nothing to the other.** They are listed one
above the other on the same screen, which is exactly why one of them gets done
and the other does not.

That is not a hypothetical. `supabase/setup.md` § 3 ended at the signup one for
weeks and the reset one lived only in the prose below, and what happened was
what the shape of the list predicted: the signup code arrived as six digits,
the reset arrived as a link, and it kept arriving as a link every time somebody
asked. 「6桁の数字がそもそも届かない。リンクでくるのをやめて欲しい」 OWNER
2026-08-26. **A step that is not in the list people follow is a step nobody
takes.** Both are numbered in setup.md now.

### 1 of 2 — Confirm signup

`Authentication → Emails → Templates → Confirm signup`. Replace
`{{ .ConfirmationURL }}` with `{{ .Token }}`:

```html
<p>Lingua の確認コードです。</p>
<p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
<p>アプリに戻って入力してください。</p>
```

**A link has nowhere to land.** This is a Capacitor app with no web page behind
it, so the default confirmation URL opens a page that does not exist on the
tester's phone and the account is never confirmed. `netVerify` in `www/net.js`
posts a six-digit token to `/auth/v1/verify`; the template is the other half of
that and there is no check that can hold the pair together, because one of them
is on a server nobody here can read.

`Authentication → Providers → Email → Confirm email` on.

### 2 of 2 — Reset Password

**Same wall, same answer.** The link in the default template opens nothing on
the phone, so the app takes six digits and sets the new password itself. It is
two screens now: the digits, and then — once the server has accepted them — the
new password (`obResetGo` and `obNewPwGo` in `www/onboard.js`).

`Authentication → Emails → Templates → Reset Password`. Replace
`{{ .ConfirmationURL }}` with `{{ .Token }}`:

```html
<p>Lingua のパスワード再設定コードです。</p>
<p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
<p>アプリに戻って入力してください。</p>
```

Until this is changed the mail carries a link and the screen behind it has
nothing to be given — `netRecoverCode` in `www/net.js` posts the token to
`/auth/v1/verify` with `type: recovery`, and `netSetPass` changes the password
with the session that comes back. The template is the other half of that pair,
and there is no check that can hold the two together, because one of them is on
a server nobody here can read.

### Which one is which, from the mailbox

There is no check in the gate that can hold either of these, and there never
can be: one half of the pair is on a server nobody here can read, and the API
key that could read it is a secret this repo may not hold. **The mailbox is the
check.** Ask for each from the app and look:

| what arrives | what it means |
|---|---|
| one big number | that template is done |
| a link, and nothing else | that template is still `{{ .ConfirmationURL }}` |

Both, separately. The signup one being right says nothing about the reset one.

## Checking it

`mail-tester.com` gives an address; sign up from the app to it and read the
score. Eight of ten is fine. `resend.com/logs` shows each message and what
happened to it, which is the only way to tell "not sent" from "sent and filed as
spam" — and without SPF and DKIM, iCloud and Gmail file it as spam, which is
most of any TestFlight list.

## Moving off Resend

The free tier is 3,000 a month and 100 a day. Past that it is SES or a paid
plan, and changing it is three fields — Host, Username, Password — in the
Supabase form above. **The app does not know who sends its mail and must not
start knowing.** Nothing under `www/` names a mail provider; `www/net.js` talks
to `/auth/v1/*` and Supabase talks to whoever is in that form.
