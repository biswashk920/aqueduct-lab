const V={yaw:-0.7,pitch:0.5,zoom:1,vex:3,go:null,drag:null},VIEWS={top:[0,1.5708],side:[0,0],front:[1.5708,0],iso:[-0.7,0.5]};
const PS={aq:{},sip:{HFL:102},sup:{canalBed:92,drainBed:96,HFL:97.5}};
let faces=[];const cv=document.getElementById('c3d');
function view(n){V.go=VIEWS[n];}
function preset(n){st.inp=Object.assign({},Aq.DEF,PS[n]);document.querySelectorAll('#inputs [data-k]').forEach(e=>e.value=st.inp[e.dataset.k]);update();}
function box(x0,x1,y0,y1,z0,z1,col,a,ns){const c=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
 [[[0,1,2,3],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,1,5,4],[0,-1,0]],[[3,2,6,7],[0,1,0]],[[0,3,7,4],[-1,0,0]],[[1,2,6,5],[1,0,0]]].forEach(([f,n])=>faces.push({p:f.map(k=>c[k]),n,col,a,ns}));}
function build(){faces=[];const r=st.d.results,i=st.d.inputs,p=st.d.profile,Lt=r.Lt,L=r.L,zr=45,C=[165,165,172],W=[40,130,210],S=[140,110,80];
 const yb=Math.min(i.drainBed,i.canalBed)-1.5,sip=r.type==='Siphon aqueduct',hb=i.bt/2+i.tw+0.5;
 st.b3={x1:p[p.length-1].x,y0:yb,y1:Math.max(i.HFL,i.canalBed+r.y1)+1.5};
 box(L-6,L+Lt+6,i.drainBed-0.6,i.drainBed,-zr,zr,S,1);
 if(sip){box(L,L+Lt,i.drainBed,i.HFL,-zr,-hb,W,.3);box(L,L+Lt,i.drainBed,i.HFL,hb,zr,W,.3);box(L,L+Lt,i.drainBed,Math.max(r.soffit,i.drainBed+.3),-hb,hb,[110,110,120],.8);}
 else box(L,L+Lt,i.drainBed,i.HFL,-zr,zr,W,.3);
 for(let k=1;k<p.length;k++){const a=p[k-1],b=p[k],w=(a.width+b.width)/2,bed=Math.min(a.bed,b.bed),h=Math.max(a.wl,b.wl);
  if(b.x<=L+.01||a.x>=L+Lt-.01)box(a.x,b.x,yb,bed-i.tw,-w/2-4,w/2+4,S,1,1);
  box(a.x,b.x,bed-i.tw,bed,-w/2-i.tw,w/2+i.tw,C,1,1);
  [-1,1].forEach(s=>box(a.x,b.x,bed,h+i.fb,s*w/2,s*(w/2+i.tw),C,1,1));
  box(a.x,b.x,bed,(a.wl+b.wl)/2,-w/2,w/2,W,.7);}
 if(!sip&&r.pierH>0)for(let k=0;k<=r.spans;k++){const x0=L+k*r.spEff-i.pw;box(x0,x0+i.pw,i.drainBed,r.soffit,-(i.bt/2+i.tw),i.bt/2+i.tw,[200,200,205],1);}
 if(r.type==='Super-passage')[-1,1].forEach(s=>box(L,L+Lt,yb,i.drainBed-0.6,s*(i.bt/2+i.tw+.3),s*(i.bt/2+i.tw+2),[200,200,205],1));
 st.pc=Array.from({length:90},(_,k)=>({x:Math.random()*st.b3.x1,h:Math.random()}));st.pr=Array.from({length:60},()=>({z:(Math.random()*2-1)*zr,x:L+Math.random()*Lt,h:Math.random()}));}
function draw3d(dt){if(st.sc!==st.d){build();st.sc=st.d;}
 const x=cv.getContext('2d'),Wd=cv.width,H=cv.height,b=st.b3,r=st.d.results,i=st.d.inputs,p=st.d.profile;
 if(V.go){V.yaw+=(V.go[0]-V.yaw)*.15;V.pitch+=(V.go[1]-V.pitch)*.15;}
 const cy=Math.cos(V.yaw),sy=Math.sin(V.yaw),cp=Math.cos(V.pitch),sp=Math.sin(V.pitch),vx=V.vex,mx=b.x1/2,my=(b.y0+b.y1)/2;
 const R=Math.hypot(b.x1,90,(b.y1-b.y0)*vx)/2,sc=Math.min(Wd,H)*.5/R*V.zoom*1.5;
 const T=q=>{const X=q[0]-mx,Y=(q[1]-my)*vx,Z=q[2],a=X*cy-Z*sy,z=X*sy+Z*cy;return[Wd/2+a*sc,H/2-(Y*cp+z*sp)*sc,z*cp-Y*sp];};
 x.fillStyle='#eef3f7';x.fillRect(0,0,Wd,H);
 const fs=faces.map(f=>{const q=f.p.map(T);return{q,d:q.reduce((s,v)=>s+v[2],0)/4,f};}).sort((a,b)=>b.d-a.d);
 fs.forEach(({q,f})=>{const n=f.n,sh=.55+.45*Math.max(0,(-.35*n[0]+.8*n[1]+.45*n[2])/.97);x.fillStyle=`rgba(${f.col.map(c=>Math.round(c*sh))},${f.a})`;x.strokeStyle=f.ns?'rgba(0,0,0,0)':'rgba(0,0,0,.22)';x.beginPath();q.forEach((v,k)=>k?x.lineTo(v[0],v[1]):x.moveTo(v[0],v[1]));x.closePath();x.fill();x.stroke();});
 x.fillStyle='#fff';x.strokeStyle='#17609c';
 st.pc.forEach(o=>{let j=p.findIndex(q=>q.x>=o.x);j=j<0?p.length-1:j;const q=p[j],d=Math.max(q.wl-q.bed,.05);o.x=(o.x+dt*2*st.inp.Q/(q.width*d))%b.x1;const t=T([o.x,q.bed+d*(.15+.7*o.h),(o.h-.5)*q.width*.8]);x.beginPath();x.arc(t[0],t[1],2.2,0,7);x.fill();x.stroke();});
 const dd=i.HFL-i.drainBed;if(r.type!=='Super-passage'||dd>0)st.pr.forEach(o=>{o.z=o.z+dt*2*r.laceyV;if(o.z>45)o.z=-45;if(r.type==='Siphon aqueduct'&&Math.abs(o.z)<i.bt/2+i.tw+.5)return;const t=T([o.x,i.drainBed+dd*(.1+.8*o.h),o.z]);x.beginPath();x.arc(t[0],t[1],2.2,0,7);x.fill();x.stroke();});
 x.fillStyle='#12355b';x.font='bold 14px sans-serif';x.fillText(r.type,12,22);x.font='11px sans-serif';x.fillStyle='#55626f';x.fillText('drag: rotate | wheel: zoom | blue block = drain flood to HFL'+(r.type==='Siphon aqueduct'?' | grey block = barrels (schematic)':''),12,40);}
cv.onpointerdown=e=>{V.drag=[e.clientX,e.clientY];V.go=null;cv.setPointerCapture(e.pointerId);};
cv.onpointermove=e=>{if(!V.drag)return;V.yaw+=(e.clientX-V.drag[0])*.008;V.pitch=Math.max(0,Math.min(1.5708,V.pitch+(e.clientY-V.drag[1])*.008));V.drag=[e.clientX,e.clientY];};
cv.onpointerup=()=>{V.drag=null;};cv.onwheel=e=>{e.preventDefault();V.zoom=Math.max(.3,Math.min(5,V.zoom*(e.deltaY<0?1.1:.9)));};
if(PS[location.hash.slice(1)])preset(location.hash.slice(1));
