// The one open question, and nothing else.
//
// The rule for these images: state what is settled once, in words, and draw a
// comparison ONLY for the thing still to be decided. Everything about the square
// cell, the pen and the size is decided and measured, so it is a line of text
// here, not a picture. The single open item is where a letter sits inside its
// cell, so that is the only thing shown twice.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;

const b64 = f => fs.readFileSync(HERE + f).toString('base64');
const FONT_A = b64('font-spike/LS6-center-60.otf');
const FONT_B = b64('font-spike/LS6-asdrawn-60.otf');
const SHOT_L = b64('shot-script-dark.png');
const SHOT_E = b64('shot-glyph-dark.png');

const WORD = 'aiklst';

const page = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(data:font/otf;base64,${FONT_A}) format("opentype")}
@font-face{font-family:B;src:url(data:font/otf;base64,${FONT_B}) format("opentype")}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1620px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans","Noto Sans JP",sans-serif;padding:44px}
.done{font-size:26px;line-height:1.7;color:#c9bda6;margin-bottom:34px}
.done b{color:#e8c979;font-weight:600}
.row{display:flex;gap:34px;align-items:stretch}
.shot{width:300px;border:1px solid #3a3228;border-radius:14px;overflow:hidden;background:#000}
.shot img{width:100%;display:block}
.cap{font-size:20px;color:#8d8375;padding:12px 4px 0;text-align:center}
.pick{flex:1;border:1px solid #3a3228;border-radius:14px;padding:34px 36px;display:flex;flex-direction:column}
.q{font-size:30px;color:#e8c979;font-weight:600;margin-bottom:8px}
.qs{font-size:21px;color:#8d8375;margin-bottom:26px}
.opt{flex:1;display:flex;align-items:center;gap:22px;padding:30px 0;border-top:1px solid #2a241c}
.tag{width:150px;font-size:23px;color:#c9bda6}
.tag i{display:block;font-style:normal;font-size:18px;color:#7d7466;margin-top:4px}
.sam{font-size:76px;letter-spacing:0;position:relative;white-space:nowrap}
.sam.a{font-family:A}.sam.b{font-family:B}
/* one cell is 800/1000 em, so the guides are drawn in em and stay honest at any
   size — they are the font's own grid, not a ruler laid on top of it */
.grid{position:absolute;top:-10px;bottom:-10px;left:0;right:0;pointer-events:none;
  background:repeating-linear-gradient(to right,#e8c97966 0 1px,transparent 1px 0.8em)}
</style><body>
<div class="done">
決まったこと: <b>正方形セル</b>・<b>ペン太さ60固定</b>・<b>本文と同じ17px</b>（実測 1文字 13.6px）。
点を置いて線を描く／頂点の「曲線」ボタン／表示だけをローマ字↔自作文字で切り替え。ここまでは動いています。
</div>
<div class="row">
  <div>
    <div class="shot"><img src="data:image/png;base64,${SHOT_L}"></div>
    <div class="cap">文字一覧</div>
  </div>
  <div>
    <div class="shot"><img src="data:image/png;base64,${SHOT_E}"></div>
    <div class="cap">文字を描く</div>
  </div>
  <div class="pick">
    <div class="q">決めたいこと</div>
    <div class="qs">セルの中で文字をどこに置くか。<br>薄い線がセルの境目です。</div>
    <div class="opt">
      <div class="tag">A 中央<i>今これ</i></div>
      <div class="sam a">${WORD}<div class="grid"></div></div>
    </div>
    <div class="opt">
      <div class="tag">B 描いたまま<i>左に寄る</i></div>
      <div class="sam b">${WORD}<div class="grid"></div></div>
    </div>
  </div>
</div>
</body>`;

const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(page);
}).listen(8197);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1620, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8197/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(300);
await pg.screenshot({ path: HERE + 'script-decide.png', fullPage: true });
await br.close();
srv.close();
console.log('tools/script-decide.png written');
