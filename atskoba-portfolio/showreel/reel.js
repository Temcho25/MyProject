// Frame-accurate 1920x1080@60 render of the site with a controlled clock.
const {chromium}=require('playwright');const fs=require('fs');
const FPS=60, DUR=+process.argv[2]||30, N=Math.round(FPS*DUR), ONLY=process.argv[3]; // ONLY="a-b" renders a frame range for probes
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await ctx.addInitScript(()=>{
  let T=0; const q=new Map(); let id=0;
  window.requestAnimationFrame=(cb)=>{q.set(++id,cb);return id;};
  window.cancelAnimationFrame=(i)=>q.delete(i);
  performance.now=()=>T; const base=1.7e12; Date.now=()=>base+T;
  window.__step=(dt)=>{T+=dt;const list=[...q.values()];q.clear();for(const cb of list){try{cb(T)}catch(e){console.error(e)}}};
  window.__T=()=>T;
});
const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://127.0.0.1:5173/?lang=en',{waitUntil:'load'});
await p.evaluate(()=>document.fonts.ready);
// let real-time promises (fonts / small timeouts) settle while stepping
const cdp=await ctx.newCDPSession(p);
// Layout keys (measured once, scroll positions in px)
const measure=()=>p.evaluate(()=>{const top=(s)=>{const e=document.querySelector(s);return e.getBoundingClientRect().top+scrollY};
  const cases=[...document.querySelectorAll('.case')].map(c=>c.getBoundingClientRect().top+scrollY);
  const svc=document.querySelector('.svc3d');const mir=document.querySelector('.mirror');const app=document.querySelector('.approach');
  return {cases,svcTop:top('.svc3d'),svcH:svc.offsetHeight,app:top('.approach'),appH:app.offsetHeight,contact:top('#contact'),mT:mir.getBoundingClientRect().top+scrollY,mH:mir.offsetHeight,H:document.documentElement.scrollHeight,vh:innerHeight};});
let L=await measure();
let Y,K;
function build(){
const vh=L.vh, sv=L.svcTop, sr=L.svcH-vh;
// Keyframes [time s, scrollY]; repeated values = intended holds.
K=[[0,0],[4.6,0],[6.0,L.mT-vh*0.3],[8.0,L.mT+vh*0.3],[9.0,L.mT+(L.mH-vh)*0.95],
  [10.2,L.cases[0]-120],[11.6,L.cases[0]+260],[13.0,L.cases[1]-60],[14.4,L.cases[1]+260],[15.8,L.cases[2]-60],
  [17.0,sv],[17.6,sv+sr*0.05],[18.8,sv+sr*0.3],[19.4,sv+sr*0.31],[20.6,sv+sr*0.56],[21.2,sv+sr*0.57],[22.4,sv+sr*0.82],[23.0,sv+sr*0.84],[24.0,sv+sr],
  [25.2,L.app-20],[26.6,L.app+L.appH-vh*0.9],[28.4,Math.min(L.H-vh,L.contact+vh*0.3)],[31,Math.min(L.H-vh,L.contact+vh*0.3)]];
// Monotone cubic interpolation (no overshoot, continuous velocity between holds)
const xs=K.map(k=>k[0]),ys=K.map(k=>k[1]),n=K.length,d=[],m=[];
for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
m.push(d[0]);for(let i=1;i<n-1;i++)m.push(d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2);m.push(d[n-2]);
for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=0;m[i+1]=0;continue}const a=m[i]/d[i],c=m[i+1]/d[i],s=a*a+c*c;if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*c*d[i];}}
Y=(t)=>{if(t<=xs[0])return ys[0];if(t>=xs[n-1])return ys[n-1];let i=0;while(t>xs[i+1])i++;const h=xs[i+1]-xs[i],u=(t-xs[i])/h,u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*ys[i]+(u3-2*u2+u)*h*m[i]+(-2*u3+3*u2)*ys[i+1]+(u3-u2)*h*m[i+1];};
}
build();
// Pointer path: gentle drift so the mark and tilt react
const MX=(t)=>960+Math.sin(t*0.5)*420, MY=(t)=>540+Math.cos(t*0.37)*180;
const [fa,fb]=ONLY?ONLY.split('-').map(Number):[0,N-1];
const log=[];const t0=Date.now();
for(let f=0;f<=fb;f++){
  const t=f/FPS;
  if(f===260){L=await measure();build();} // re-measure once fonts/lines settled (still at scroll 0)
  await p.evaluate(([y])=>window.scrollTo(0,y),[Math.round(Y(t))]);
  if(f%2===0) await p.mouse.move(MX(t),MY(t));
  await p.evaluate(()=>window.__step(1000/60));
  if(f<fa) continue;
  const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:94});
  fs.writeFileSync(`/tmp/claude-0/reel/frames6/f${String(f).padStart(5,'0')}.jpg`,Buffer.from(r.data,'base64'));
  const chap=await p.evaluate(()=>[...document.querySelectorAll('#chapters .chap')].findIndex(c=>c.classList.contains('is-on')));
  const lchap=await p.evaluate(()=>[...document.querySelectorAll('#labChapters .chap')].findIndex(c=>c.classList.contains('is-on')));
  log.push({f,y:Math.round(Y(t)),chap,lchap});
  if(f%60===0){console.log('frame',f,'/',fb,((Date.now()-t0)/1000|0)+'s');fs.writeFileSync('/tmp/claude-0/reel/log.json',JSON.stringify({L,K,log}));}
}
fs.writeFileSync('/tmp/claude-0/reel/log.json',JSON.stringify({L,K,log}));
console.log('done',((Date.now()-t0)/1000|0)+'s');await b.close();})();
