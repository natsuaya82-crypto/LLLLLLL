/* Put the Google client id into the two places that have to agree.

   Run it once, when the client has been made in the Google Cloud console:

     node tools/google-id.mjs 123456-abcdef.apps.googleusercontent.com

   It writes GOOGLE_IOS_ID in www/net.js and the URL scheme in
   ios/App/App/Info.plist, which is the same id with its halves swapped. It
   exists because those two are the only edit in this repository where getting
   one right and the other wrong leaves a button that opens a Google sheet and
   cannot come back -- and where the wrongness shows up on a phone, twenty
   minutes of build later, and not here.

   Running it with no argument prints what the two files hold today. */
import { readFileSync, writeFileSync } from 'node:fs';

const NET  = 'www/net.js';
const PLIST= 'ios/App/App/Info.plist';
const TAIL = '.apps.googleusercontent.com';

const ID = (process.argv[2] || '').trim();

/* An XML comment is not the file's content, and this tool was one release
   away from proving it the hard way. Info.plist carries a comment SHOWING the
   shape of the key -- <string>com.googleusercontent.apps.123-abc</string> as an
   example -- and the slot pattern below matches that line perfectly. With the
   real key absent (it was deleted on purpose after build 86), a run would have
   put the id into www/net.js, rewritten the EXAMPLE INSIDE THE COMMENT, and
   printed "Both written." The one failure this tool exists to prevent, made by
   the tool. So the plist is matched with its comments stripped, and the offsets
   are mapped back onto the real text before anything is written. */
const decomment = (x) => x.replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length));

const netHas   = (readFileSync(NET,'utf8').match(/var GOOGLE_IOS_ID='([^']*)';/) || [,''])[1];
const plistHas = (decomment(readFileSync(PLIST,'utf8'))
                  .match(/<string>(com\.googleusercontent\.apps\.[^<]*)<\/string>/) || [,''])[1];

if(!ID){
  console.log(`${NET}   ${netHas   || '(empty)'}`);
  console.log(`${PLIST} ${plistHas || '(none)'}`);
  console.log('\nTo set one:  node tools/google-id.mjs <id>' + TAIL);
  console.log('To clear:    node tools/google-id.mjs -');
  process.exit(0);
}

/* A dash clears both, which is the only way back out and is worth having:
   a half-removed id is the same broken button as a half-added one. */
const clear = (ID === '-');
if(!clear && !ID.endsWith(TAIL)){
  console.error(`not a Google client id: it has to end ${TAIL}`);
  process.exit(1);
}

const scheme = 'com.googleusercontent.apps.' + (clear ? '' : ID.slice(0, -TAIL.length));

let net = readFileSync(NET,'utf8');
if(!/var GOOGLE_IOS_ID='[^']*';/.test(net)){
  console.error(`GOOGLE_IOS_ID is not in ${NET} any more. Nothing written.`);
  process.exit(1);
}
net = net.replace(/var GOOGLE_IOS_ID='[^']*';/, `var GOOGLE_IOS_ID='${clear?'':ID}';`);

/* Clearing REMOVES the whole CFBundleURLTypes block. It used to write
   __GOOGLE_REVERSED_CLIENT_ID__ back into the slot, and that is not "unset",
   it is MALFORMED: a URL scheme has to begin with a letter, and Apple refused
   the delivery of build 86 over it -- ITMS-90158, by email, an hour after a
   green build. An absent key is the honest shape of "not configured", and it
   is also the only shape Apple accepts. */
let pl = readFileSync(PLIST,'utf8');
const bare = decomment(pl);
const slot = /<string>com\.googleusercontent\.apps\.[^<]*<\/string>/;

/* The block is NESTED -- <array><dict>...<array>...</array></dict></array> --
   so there are three closing tags and a non-greedy match stops at the FIRST.
   Doing that leaves the outer </array></dict> orphaned and Info.plist stops
   parsing at all, which is worse than the placeholder this replaced. Watched
   it happen. Depth is counted instead. */
function urlTypesSpan(x){
  const key = /[ \t]*<key>CFBundleURLTypes<\/key>\s*/;
  const at = x.search(key);
  if(at < 0) return null;
  let i = at + x.match(key)[0].length, depth = 0;
  const tag = /<(\/?)array>/g;
  tag.lastIndex = i;
  let m;
  while((m = tag.exec(x))){
    depth += m[1] ? -1 : 1;
    if(depth === 0){
      let end = m.index + m[0].length;
      while(end < x.length && (x[end] === '\n' || x[end] === '\t' || x[end] === ' ')) end++;
      return [at, end];
    }
  }
  return null;
}

if(clear){
  const span = urlTypesSpan(bare);
  if(!span){
    console.error(`CFBundleURLTypes is not in ${PLIST}. Nothing to clear.`);
    process.exit(1);
  }
  pl = pl.slice(0, span[0]) + pl.slice(span[1]);
} else {
  const at = bare.search(slot);
  if(at < 0){
    console.error(`the URL scheme slot is not in ${PLIST} any more (a slot inside a\n` +
                  `comment does not count). Add the CFBundleURLTypes key by hand, then\n` +
                  `run this again. Nothing written.`);
    process.exit(1);
  }
  const len = bare.match(slot)[0].length;
  pl = pl.slice(0, at) + `<string>${scheme}</string>` + pl.slice(at + len);
}

writeFileSync(NET, net);
writeFileSync(PLIST, pl);
console.log(clear ? `cleared: ${NET} is empty and CFBundleURLTypes is GONE from\n${PLIST}. An absent key is the honest shape; a placeholder is malformed and\nApple refuses the delivery (ITMS-90158).`
                  : `${NET}   ${ID}\n${PLIST} ${scheme}\n\nBoth written. Supabase still has to be told to accept it -- supabase/setup.md.`);
