/* ---------------------------------------------------------------------------
   tools/icon.mjs — the app icon, drawn rather than kept as a picture nobody
   can edit.

   Run it:   node tools/icon.mjs
             (writes icon-same.png and icon-big.png into the scratch dir set
              below; copy the one you want over
              ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png)

   The numbers are not invented. They were MEASURED off the icon that was
   there before, which carried the wordmark under the mark:

     star      an eight-vertex polygon, outer radius 300, inner radius 86,
               centred at (512, 471) -- above centre, because the word took
               the bottom of the circle
     circle    radius 512, so it touches all four edges
     colours   #0a0a0e in the corners, #16101a inside the circle,
               #c9a86a for the star, which is the app's own --gold

   What changed on 2026-08-23: the word came off 「Linguaって下ないマークだけの
   バージョンに変えてよ」, the star moved to the true centre, and it grew from
   300 to 340 so the circle does not read as empty without the word in it.

   No alpha. The PNG comes out colour type 2 (RGB), which is what Apple
   requires of an app icon -- an alpha channel is refused by email, hours
   after a green build.
   --------------------------------------------------------------------------- */
import fs from 'fs'; import path from 'path';
import { createRequire } from 'module'; import { execSync } from 'child_process';
const req=createRequire(import.meta.url);
let chromium; try{chromium=req('playwright').chromium}
catch{chromium=req(path.join(execSync('npm root -g',{encoding:'utf8'}).trim(),'playwright')).chromium}
const SP='/tmp/claude-0/-home-user-LLLLLLL/e1eda8b8-f3bd-5859-b474-c77130c9a9f4/scratchpad';
const CH='/opt/pw-browsers/chromium';
/* 元のアイコンから測った値: 星は外半径 300 / 内半径 86 の八角形、
   円は一辺いっぱい(半径 512)、色は角 #0a0a0e / 円 #16101a / 星 #c9a86a */
const star=(cx,cy,R,r)=>{
  const p=[];
  for(let i=0;i<8;i++){
    const a=-Math.PI/2 + i*Math.PI/4;
    const rad=(i%2===0)? R : r;
    p.push((cx+Math.cos(a)*rad).toFixed(2)+','+(cy+Math.sin(a)*rad).toFixed(2));
  }
  return p.join(' ');
};
const svg=(R)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0a0a0e"/>
  <circle cx="512" cy="512" r="512" fill="#16101a"/>
  <polygon points="${star(512,512,R,Math.round(R*86/300))}" fill="#c9a86a"/>
</svg>`;
const br=await chromium.launch(fs.existsSync(CH)?{executablePath:CH}:{});
for(const [name,R] of [['same',300],['big',340]]){
  const pg=await br.newPage({viewport:{width:1024,height:1024}});
  await pg.setContent('<style>html,body{margin:0;padding:0}</style>'+svg(R));
  await pg.screenshot({path:SP+'/icon-'+name+'.png', omitBackground:false});
  console.log('icon-'+name+'.png  外半径 '+R);
  await pg.close();
}
await br.close();
