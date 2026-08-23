/* 書き込み済みの用紙を撮った写真を、本物が来るまでの替え玉として作る。
     node tools/sheet-spike/fake.mjs [出力.png] [傾き] */
import fs from 'fs';
import { seed } from '/home/user/LLLLLLL/tools/fixture.mjs';
import { chromium, LAUNCH } from '/home/user/LLLLLLL/tools/browser.mjs';
const SRC = fs.readFileSync(new URL('./sheet.js', import.meta.url),'utf8');
const OUT = process.argv[2] || '/tmp/sheet-fake.png';
const DEG = Number(process.argv[3] || 6);
const NAMES = ['7','2','25','人','愛','a','a','a','mountain','水','火','木','金','土','日','月','ka','yo','!','?'];
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:400,height:300} });
await pg.goto('file:///home/user/LLLLLLL/www/index.html');
await pg.waitForSelector('#splash',{state:'detached',timeout:10000});
await pg.evaluate(({src, names, s, DPI, deg})=>{
  eval('('+s+')()'); SET.done=true; eval(src);
  var S=DPI/72, PW=Math.round(SH_W*S), PH=Math.round(SH_H*S);
  var pc=document.createElement('canvas'); pc.width=PW; pc.height=PH;
  var g=pc.getContext('2d'), Y=function(y){ return PH-y*S; };
  g.fillStyle='#fff'; g.fillRect(0,0,PW,PH);
  g.fillStyle='#000';
  shMarks().forEach(function(m){ g.fillRect((m[0]-SH_MARK/2)*S, Y(m[1]+SH_MARK/2), SH_MARK*S, SH_MARK*S); });
  var i,x,y,b,at;
  for(i=0;i<names.length;i++){
    b=shBoxAt(i);
    g.strokeStyle='#d1d1d1'; g.lineWidth=Math.max(1,0.5*S);
    g.strokeRect(b.x*S, Y(b.y+SH_BOX), SH_BOX*S, SH_BOX*S);
    g.fillStyle='rgba(0,0,0,'+(1-SH_DOT_GREY).toFixed(2)+')';
    var lin=SH_LAT_INSET/800*SH_BOX, lst=(SH_BOX-2*lin)/(SH_LAT_N-1), lx, ly;
    for(ly=0;ly<SH_LAT_N;ly++) for(lx=0;lx<SH_LAT_N;lx++)
      g.fillRect((b.x+lin+lx*lst-SH_DOT/2)*S, Y(b.y+lin+ly*lst+SH_DOT/2),
                 Math.max(1,SH_DOT*S), Math.max(1,SH_DOT*S));
    g.fillStyle='#000'; g.textAlign='left'; g.textBaseline='alphabetic';
    g.font='600 '+Math.round(SH_LABEL*0.85*S)+'px system-ui, "Noto Sans JP", sans-serif';
    g.fillText(names[i], b.x*S, Y(b.y+SH_BOX+SH_LABEL_UP));
  }
  var bits=shPack(names); g.fillStyle='#000';
  for(y=0;y<SH_CH;y++) for(x=0;x<SH_CW;x++){ if(!bits[y*SH_CW+x]) continue;
    at=shCellAt(x,y); g.fillRect(at[0]*S, Y(at[1]+SH_CELL), SH_CELL*S, SH_CELL*S); }
  /* 人が書いた分。app の字を「その人の手」の代わりに置く ── 本物のインクの
     滲みもかすれも入っていない、そこが替え玉である所 */
  var KA=[[[175,265],[330,250],[440,275],[470,350],[450,470],[390,570],[300,640],[225,655],[205,610],[240,585]],
          [[300,175],[275,340],[230,500],[175,640],[140,700]],
          [[600,235],[625,330],[615,420]]];
  var YO=[[[300,215],[520,200]],
          [[430,120],[420,300],[410,430],[380,530],[300,600],[240,555],[275,485],[365,500],[455,570],[530,650]]];
  var RING=[[[400,200],[600,400],[400,600],[200,400]]];
  function put(idx, strokes, closed){
    var b2=shBoxAt(idx), sts=strokes.map(function(k){
      var o={pts:k.map(function(q,j){ return (j>0&&j<k.length-1)?[q[0],q[1],'c']:q.slice(); })};
      if(closed){ o.closed=true; o.pts=k.map(function(q){ return [q[0],q[1],'c']; }); }
      return o; });
    var L=LinguaFont.glyphContours({strokes:sts}, GPEN);
    g.fillStyle='#000'; g.beginPath();
    L.forEach(function(ct){ ct.forEach(function(p,k2){
      var ux=(b2.x+p[0]/800*SH_BOX)*S, uy=Y(b2.y+SH_BOX-p[1]/800*SH_BOX);
      if(k2===0) g.moveTo(ux,uy); else g.lineTo(ux,uy); }); g.closePath(); });
    g.fill('nonzero');
  }
  put(0, KA); put(1, YO); put(2, RING, true);
  /* 撮る */
  var rad=Math.abs(deg)*Math.PI/180, warp=deg/200;
  var W=Math.round((PW*Math.cos(rad)+PH*Math.sin(rad))*1.1+PH*warp);
  var H=Math.round((PH*Math.cos(rad)+PW*Math.sin(rad))*1.1+PW*warp);
  var sc=document.createElement('canvas'); sc.width=W; sc.height=H;
  var h=sc.getContext('2d'); h.fillStyle='#fff'; h.fillRect(0,0,W,H);
  h.save(); h.translate(W/2,H/2); h.rotate(rad*(deg<0?-1:1));
  h.transform(1,warp,warp*0.55,1,0,0); h.translate(-PW/2,-PH/2);
  h.filter='blur(1.6px)'; h.drawImage(pc,0,0); h.restore();
  var id=h.getImageData(0,0,W,H), p=id.data, k3;
  for(k3=0;k3<W*H;k3++){
    var ry=(k3/W)|0, rx=k3%W, lit=1-0.28*(rx/W)-0.16*(ry/H);
    var n=Math.sin(k3*7.13)*43758.5453; n=(n-Math.floor(n))*2-1;
    var v=p[k3*4]*lit+n*18; v=v<0?0:(v>255?255:v);
    p[k3*4]=p[k3*4+1]=p[k3*4+2]=v;
  }
  h.putImageData(id,0,0);
  document.body.innerHTML=''; document.body.appendChild(sc); sc.id='S';
}, {src:SRC, names:NAMES, s:seed.toString(), DPI:250, deg:DEG});
await pg.locator('#S').screenshot({ path: OUT });
await br.close();
console.log('替え玉の写真: ' + OUT + '（傾き ' + DEG + '°）');
