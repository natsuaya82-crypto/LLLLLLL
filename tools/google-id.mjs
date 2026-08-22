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

const netHas   = (readFileSync(NET,'utf8').match(/var GOOGLE_IOS_ID='([^']*)';/) || [,''])[1];
const plistHas = (readFileSync(PLIST,'utf8')
                  .match(/<string>(com\.googleusercontent\.apps\.[^<]*|__GOOGLE_REVERSED_CLIENT_ID__)<\/string>/) || [,''])[1];

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

const scheme = clear ? '__GOOGLE_REVERSED_CLIENT_ID__'
                     : 'com.googleusercontent.apps.' + ID.slice(0, -TAIL.length);

let net = readFileSync(NET,'utf8');
if(!/var GOOGLE_IOS_ID='[^']*';/.test(net)){
  console.error(`GOOGLE_IOS_ID is not in ${NET} any more. Nothing written.`);
  process.exit(1);
}
net = net.replace(/var GOOGLE_IOS_ID='[^']*';/, `var GOOGLE_IOS_ID='${clear?'':ID}';`);

let pl = readFileSync(PLIST,'utf8');
const slot = /<string>(?:com\.googleusercontent\.apps\.[^<]*|__GOOGLE_REVERSED_CLIENT_ID__)<\/string>/;
if(!slot.test(pl)){
  console.error(`the URL scheme slot is not in ${PLIST} any more. Nothing written.`);
  process.exit(1);
}
pl = pl.replace(slot, `<string>${scheme}</string>`);

writeFileSync(NET, net);
writeFileSync(PLIST, pl);
console.log(clear ? 'cleared, in both files.'
                  : `${NET}   ${ID}\n${PLIST} ${scheme}\n\nBoth written. Supabase still has to be told to accept it -- supabase/setup.md.`);
