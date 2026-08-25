import fs from 'fs';
import { chromium, LAUNCH } from '/home/user/LLLLLLL/tools/browser.mjs';
const SRC = fs.readFileSync(new URL('../../www/sheet.js', import.meta.url),'utf8');
const NAMES = ['7','2','25','人','愛','a','a','a','mountain','水','火','木','金','土','日','月','ka','yo','!','?'];
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:400,height:300} });
const out = await pg.evaluate(({src, names, DPI})=>{
  eval(src);
  var S = DPI/72, PW = Math.round(SH_W*S), PH = Math.round(SH_H*S);
  /* 刷った紙。PDF と同じ shMarks/shBoxAt/shCellAt から描く */
  var pc=document.createElement('canvas'); pc.width=PW; pc.height=PH;
  var g=pc.getContext('2d');
  var Y=function(y){ return PH - y*S; };            /* PDF の y は上向き */
  g.fillStyle='#fff'; g.fillRect(0,0,PW,PH);
  g.fillStyle='#000';
  shMarks().forEach(function(m){
    g.fillRect((m[0]-SH_MARK/2)*S, Y(m[1]+SH_MARK/2), SH_MARK*S, SH_MARK*S);
  });
  var i,x,y,b,at;
  for(i=0;i<names.length;i++){
    b=shBoxAt(i);
    g.strokeStyle='#d1d1d1'; g.lineWidth=Math.max(1,0.5*S);
    g.strokeRect(b.x*S, Y(b.y+SH_BOX), SH_BOX*S, SH_BOX*S);
    /* 格子。アプリの canvas と同じ 21x21。中に名前は刷らない ── 刷ると、自分の
       字を作りに来た人が日本語の 水 をなぞってしまう */
    g.fillStyle='rgba(0,0,0,'+(1-SH_DOT_GREY).toFixed(2)+')';
    var lin=SH_LAT_INSET/800*SH_BOX, lst=(SH_BOX-2*lin)/(SH_LAT_N-1), lx, ly;
    for(ly=0;ly<SH_LAT_N;ly++) for(lx=0;lx<SH_LAT_N;lx++)
      g.fillRect((b.x+lin+lx*lst-SH_DOT/2)*S, Y(b.y+lin+ly*lst+SH_DOT/2),
                 Math.max(1,SH_DOT*S), Math.max(1,SH_DOT*S));
    /* 枠の名前 */
    g.fillStyle='#000'; g.textAlign='left'; g.textBaseline='alphabetic';
    g.font='600 '+Math.round(SH_LABEL*0.85*S)+'px system-ui, "Noto Sans JP", sans-serif';
    g.fillText(names[i], b.x*S, Y(b.y+SH_BOX+SH_LABEL_UP));
  }
  var bits=shPack(names);
  g.fillStyle='#000';
  for(y=0;y<SH_CH;y++) for(x=0;x<SH_CW;x++){
    if(!bits[y*SH_CW+x]) continue;
    at=shCellAt(x,y);
    g.fillRect(at[0]*S, Y(at[1]+SH_CELL), SH_CELL*S, SH_CELL*S);
  }
  /* 撮る */
  function shoot(deg, warp, blur, noise){
    var rad=Math.abs(deg)*Math.PI/180;
    var W=Math.round((PW*Math.cos(rad)+PH*Math.sin(rad))*1.12+PH*warp);
    var H=Math.round((PH*Math.cos(rad)+PW*Math.sin(rad))*1.12+PW*warp);
    var s=document.createElement('canvas'); s.width=W; s.height=H;
    var h=s.getContext('2d'); h.fillStyle='#fff'; h.fillRect(0,0,W,H);
    h.save(); h.translate(W/2,H/2); h.rotate(deg*Math.PI/180);
    h.transform(1,warp,warp*0.55,1,0,0); h.translate(-PW/2,-PH/2);
    h.filter='blur('+blur+'px)'; h.drawImage(pc,0,0); h.restore();
    var id=h.getImageData(0,0,W,H), p=id.data, k;
    var gray=new Uint8Array(W*H);
    for(k=0;k<W*H;k++){
      var ry=(k/W)|0, rx=k%W, lit=1-0.30*(rx/W)-0.18*(ry/H);
      var n=Math.sin(k*7.13)*43758.5453; n=(n-Math.floor(n))*2-1;
      var v=p[k*4]*lit+n*noise; gray[k]= v<0?0:(v>255?255:v);
    }
    var R=Math.round(W/14), SM=Math.max(1,Math.round(SH_CELL*S/3));
    var ii=new Float64Array((W+1)*(H+1)), yy, xx;
    for(yy=0;yy<H;yy++){ var run=0;
      for(xx=0;xx<W;xx++){ run+=gray[yy*W+xx];
        ii[(yy+1)*(W+1)+(xx+1)]=ii[yy*(W+1)+(xx+1)]+run; } }
    function mean(cx,cy,r){
      var a=Math.max(0,cx-r), b2=Math.max(0,cy-r);
      var c2=Math.min(W-1,cx+r), d2=Math.min(H-1,cy+r);
      return (ii[(d2+1)*(W+1)+(c2+1)]-ii[b2*(W+1)+(c2+1)]-ii[(d2+1)*(W+1)+a]+ii[b2*(W+1)+a])
             /((c2-a+1)*(d2-b2+1));
    }
    var m=new Uint8Array(W*H);
    for(k=0;k<W*H;k++){ var ry2=(k/W)|0, rx2=k%W;
      m[k]= mean(rx2,ry2,SM) < mean(rx2,ry2,R)*0.85 ? 1 : 0; }
    var lab=new Int32Array(W*H).fill(-1), blobs=[], q=new Int32Array(W*H);
    for(yy=0;yy<H;yy++) for(xx=0;xx<W;xx++){
      if(!m[yy*W+xx]||lab[yy*W+xx]>=0) continue;
      var id2=blobs.length, hd=0, tl=0, sx=0, sy=0, n2=0, ax=xx,bx=xx,ay=yy,by=yy;
      q[tl++]=yy*W+xx; lab[yy*W+xx]=id2;
      while(hd<tl){ var pp=q[hd++], py=(pp/W)|0, pxx=pp%W;
        sx+=pxx; sy+=py; n2++;
        if(pxx<ax)ax=pxx; if(pxx>bx)bx=pxx; if(py<ay)ay=py; if(py>by)by=py;
        var dd=[[1,0],[-1,0],[0,1],[0,-1]], k3;
        for(k3=0;k3<4;k3++){ var nx=pxx+dd[k3][0], ny=py+dd[k3][1];
          if(nx<0||ny<0||nx>=W||ny>=H) continue;
          if(m[ny*W+nx]&&lab[ny*W+nx]<0){ lab[ny*W+nx]=id2; q[tl++]=ny*W+nx; } }
      }
      blobs.push({cx:sx/n2,cy:sy/n2,n:n2,w:bx-ax+1,h:by-ay+1});
    }
    var want=SH_MARK*S;
    var cand=blobs.filter(function(u){
      return u.w>want*0.5 && u.w<want*2 && u.h>want*0.5 && u.h<want*2 &&
             Math.abs(u.w-u.h)<want*0.5 && u.n>want*want*0.5;
    });
    var corners=[[0,0],[W,0],[W,H],[0,H]], found=[], c4;
    for(c4=0;c4<4;c4++){
      var best=null, bd=1e18, j;
      for(j=0;j<cand.length;j++){
        var dx=cand[j].cx-corners[c4][0], dy=cand[j].cy-corners[c4][1], D=dx*dx+dy*dy;
        if(D<bd){ bd=D; best=cand[j]; }
      }
      if(!best) return {fail:'印が見つからない（候補 '+cand.length+'）'};
      found.push([best.cx,best.cy]);
    }
    var wf=shWarp(found);
    if(!wf) return {fail:'変換が作れない'};
    var mm=m, WW=W, HH=H;
    var dk2=function(px,py){ var xi=Math.round(px), yi=Math.round(py);
      return xi>=0 && yi>=0 && xi<WW && yi<HH && mm[yi*WW+xi]===1; };
    var dk=function(px,py){
      var xi=Math.round(px), yi=Math.round(py);
      return xi>=0 && yi>=0 && xi<W && yi<H && m[yi*W+xi]===1;
    };
    /* 何升まちがえたか。断ったときに「読めない」のか「ずれている」のかを分ける */
    var got=[], x2,y2,k2,n5,d5=SH_CELL/4;
    var off=[[0,0],[-d5,0],[d5,0],[0,-d5],[0,d5]];
    for(y2=0;y2<SH_CH;y2++) for(x2=0;x2<SH_CW;x2++){
      var a2=shCellAt(x2,y2); n5=0;
      for(k2=0;k2<off.length;k2++){
        var q2=wf(a2[0]+SH_CELL/2+off[k2][0], a2[1]+SH_CELL/2+off[k2][1]);
        if(dk(q2[0],q2[1])) n5++;
      }
      got.push(n5>=3?1:0);
    }
    var bad=0; for(k2=0;k2<bits.length;k2++) if(got[k2]!==bits[k2]) bad++;
    /* 印の位置が本当のところからどれだけずれたか */
    var mk=shMarks(), err=0;
    for(k2=0;k2<4;k2++){
      var t5=wf(mk[k2][0],mk[k2][1]);
      err=Math.max(err, Math.hypot(t5[0]-found[k2][0], t5[1]-found[k2][1]));
    }
    return {read: shReadStrip(wf, dk), bad:bad, err:Math.round(err*10)/10, W:W, H:H, wf:wf, dk:dk2};
  }
  var res=[];
  [[0.8,0.006,1,10,'スキャナ'],[4,0.03,1.5,20,'手で撮った'],
   [10,0.08,2,26,'雑に撮った'],[18,0.16,2.5,32,'かなり斜め']].forEach(function(a){
    var r=shoot(a[0],a[1],a[2],a[3]); r.how=a[4]; r.deg=a[0]; res.push(r);
  });
  return {res:res, pw:PW, ph:PH, cell:Math.round(SH_CELL*S), mark:Math.round(SH_MARK*S),
          sane:(SH_LABEL + SH_LABEL_UP < SH_GAPY) && (shCellAt(0,0)[1] + SH_CELL < shBoxAt(shPerPage()-1).y), dots:(function(){
            /* 点がインクとして拾われていないか。字を一つも描いていない枠から
               出てくるものは、掃除のあとゼロでなければならない */
            var r=shoot(4,0.03,1.5,20);
            if(r.fail) return null;
            var RES=128, mask=shBoxInk(r.wf, r.dk, 0, RES), raw=0, k;
            for(k=0;k<mask.length;k++) raw+=mask[k];
            var cl=shClean(mask, RES, Math.round(RES*RES*0.0015), 3);
            return {raw:raw, kept:cl.kept, dropped:cl.dropped, of:RES*RES};
          })()};
}, {src:SRC, names:NAMES, DPI:260});
await br.close();
console.log('  紙 ' + out.pw + 'x' + out.ph + ' 画素（260dpi）  升 ' + out.cell + 'px  印 ' + out.mark + 'px');
console.log('  名前が上の箱に届いていないか: ' + (out.sane ? 'よし' : 'だめ'));
if (out.dots) console.log('  空の枠（格子だけ）: 生 ' + out.dots.raw + ' / ' + out.dots.of +
  ' 画素、掃除して残った ' + out.dots.kept + '  ← 0 なら点は字に化けていない');
out.res.forEach(r=>{
  if(r.fail){ console.log('  '+r.how.padEnd(10)+String(r.deg).padStart(5)+'°  '+r.fail); return; }
  const ok = JSON.stringify(r.read)===JSON.stringify(NAMES);
  console.log('  '+r.how.padEnd(10)+String(r.deg).padStart(5)+'°  '+
    (r.read===null ? '断った' : ok ? '20 個ぜんぶ一致' : '違う') +
    '   升の誤り '+r.bad+'/'+(96*22)+'   印のずれ '+r.err+'px  台 '+r.W+'x'+r.H);
});
