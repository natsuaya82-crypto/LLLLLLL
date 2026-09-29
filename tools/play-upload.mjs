#!/usr/bin/env node
// Puts one signed AAB on a Google Play track -- .github/workflows/android-release.yml
// runs it, and nothing else does.
//
//   node tools/play-upload.mjs <file.aab> <track> <status>
//
// The service account is GOOGLE_PLAY_SERVICE_ACCOUNT (the JSON key the owner
// downloads from Google Cloud, pasted whole into the secret). It is read from
// the environment and never printed. No dependency: the token is a JWT signed
// here with node:crypto and traded at Google's token endpoint, which is all
// the googleapis package would do.
//
// The calls are the Google Play Developer API's edits, in its order:
// insert an edit, upload the bundle into it, point the track at the bundle's
// versionCode, commit. An edit that is not committed changes nothing on Play.
//
// status is `completed` (testers get it) or `draft` (it waits in Play Console
// for somebody to press roll out). A new app that has never been published
// takes only `draft` -- Google's answer says so, and it is printed whole.

import { readFileSync } from 'node:fs'
import { createSign } from 'node:crypto'

const PKG = 'com.tokinets.lingua'
const [file, track = 'internal', status = 'completed'] = process.argv.slice(2)
if (!file) { console.error('usage: play-upload.mjs <file.aab> [track] [status]'); process.exit(2) }

const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT || ''
let sa
try { sa = JSON.parse(raw) } catch (e) {
  console.error('GOOGLE_PLAY_SERVICE_ACCOUNT is not JSON. Paste the whole of the key file Google Cloud gave you (it starts with {).')
  process.exit(1)
}
if (!sa.client_email || !sa.private_key) {
  console.error('GOOGLE_PLAY_SERVICE_ACCOUNT has no client_email / private_key. It has to be a service account KEY (JSON), not the account itself.')
  process.exit(1)
}

const b64u = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

async function token() {
  const now = Math.floor(Date.now() / 1000)
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const body = b64u(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))
  const sig = createSign('RSA-SHA256').update(head + '.' + body).sign(sa.private_key)
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: head + '.' + body + '.' + b64u(sig),
    }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error('token: ' + r.status + ' ' + JSON.stringify(j))
  return j.access_token
}

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' + PKG
const UP = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/' + PKG

async function call(tok, what, url, init) {
  const r = await fetch(url, { ...init, headers: { authorization: 'Bearer ' + tok, ...(init && init.headers) } })
  const text = await r.text()
  if (!r.ok) {
    console.error(what + ' refused: HTTP ' + r.status)
    console.error(text)
    process.exit(1)
  }
  return text ? JSON.parse(text) : {}
}

const tok = await token()
const edit = await call(tok, 'edits.insert', API + '/edits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
console.log('edit ' + edit.id)
const bundle = await call(tok, 'edits.bundles.upload', UP + '/edits/' + edit.id + '/bundles?uploadType=media', {
  method: 'POST',
  headers: { 'content-type': 'application/octet-stream' },
  body: readFileSync(file),
})
console.log('bundle versionCode ' + bundle.versionCode + ' sha256 ' + bundle.sha256)
await call(tok, 'edits.tracks.update', API + '/edits/' + edit.id + '/tracks/' + track, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ track, releases: [{ versionCodes: [String(bundle.versionCode)], status }] }),
})
await call(tok, 'edits.commit', API + '/edits/' + edit.id + ':commit', { method: 'POST' })
console.log('on ' + track + ' as ' + status + ': versionCode ' + bundle.versionCode)
