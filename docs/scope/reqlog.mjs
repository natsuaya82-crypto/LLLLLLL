import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium, LAUNCH } from '/home/user/LLLLLLL/tools/browser.mjs';
const ROOT='/home/user/LLLLLLL/www', PORT=8391;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f));});
await new Promise(f=>srv.listen(PORT,f));
const br=await chromium.launch(LAUNCH); const pg=await br.newPage({viewport:{width:390,height:844}});
let log=[], phase='boot';
await pg.route('https://*.supabase.co/**', r=>{const u=r.request().url().replace(/https:\/\/[^/]+/,'');log.push(phase+'\t'+r.request().method()+'\t'+u);
  let body='[]';
  if(/\/auth\/v1\/token/.test(u)) body=JSON.stringify({access_token:'t2',refresh_token:'r2',expires_in:3600,token_type:'bearer',user:{id:'me1',email:'a@b.c'}});
  else if(/\/auth\/v1\/user/.test(u)) body=JSON.stringify({id:'me1',email:'a@b.c'});
  else if(/\/rest\/v1\/language\?/.test(u) && /owner=eq.me1/.test(u)) body=JSON.stringify([{id:'L1',owner:'me1',name:'Kela',created_at:'2026-09-01T00:00:00Z'}]);
  else if(/\/rest\/v1\/profile/.test(u)) body=JSON.stringify([{id:'me1',handle:'aya',name:'Aya'}]);
  r.fulfill({status:200,contentType:'application/json',body});});
await pg.addInitScript(()=>{ if(!localStorage.getItem('lingua.sess')){
  localStorage.setItem('lingua.sess', JSON.stringify({at:'t',rt:'r',uid:'me1',exp:9999999999}));
  localStorage.setItem('lingua.set', JSON.stringify({walked:true,done:true,acct:'me1'}));
  localStorage.setItem('lingua.me', JSON.stringify({uid:'me1',name:'Aya',handle:'aya'}));}});
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(6000);
const shots=[['feed',"route='feed';NAV=[{r:'feed'}];render()"],['profile',"route='profile';NAV=[{r:'profile'}];render()"],['notices',"route='notices';NAV=[{r:'notices'}];render()"],['about-other',"route='about';NAV=[{r:'about',a:'other-lang-1'}];render()"],['words',"route='words';NAV=[{r:'words'}];render()"]];
for(const [n,js] of shots){phase=n; try{await pg.evaluate(js);}catch(e){log.push(n+'\tERR\t'+e.message.slice(0,80));} await pg.waitForTimeout(2500);}
const app=await pg.evaluate(()=>typeof appIs==='function'?appIs():'?');
console.log('appIs:',app); console.log(log.join('\n'));
await br.close(); srv.close();
