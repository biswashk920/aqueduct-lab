/* Aqueduct hydraulic design - JS port of python/hydraulics.py */
(function (root) {
const g = 9.81;
const DEF = {Q:15,B:10,z:1.5,n:0.025,S:1/5000,bt:7,nt:0.015,St:1/1000,dep:0.3,Ci:0.1,Co:0.2,theta:12.5,shape:'cubic',fb:0.3,tw:0.3,sp:13.5,pw:1.5,riverW:0,Qf:300,f:1,HFL:99,drainBed:96,canalBed:101,cc:9000,pc:500000,tc:40000,maxAfflux:0.15,sigAllow:4000,slenderMax:12};
function normalDepth(Q,b,z,n,S){let lo=1e-4,hi=60;for(let k=0;k<200;k++){const y=(lo+hi)/2,A=(b+z*y)*y,P=b+2*y*Math.sqrt(1+z*z);if(A*Math.pow(A/P,2/3)*Math.sqrt(S)/n<Q)lo=y;else hi=y;}return(lo+hi)/2;}
function width(shape,x,T1,bt,L){const s=L>0?Math.min(Math.max(x/L,0),1):1;if(shape==='straight')return T1-(T1-bt)*s;if(shape==='mitra')return 1/(1/T1+(1/bt-1/T1)*s);return T1-(T1-bt)*(3*s*s-2*s*s*s);}
function design(inp){
 const i=Object.assign({},DEF,inp||{});
 const y1=normalDepth(i.Q,i.B,i.z,i.n,i.S),A1=(i.B+i.z*y1)*y1,T1=i.B+2*i.z*y1,v1=i.Q/A1,hv1=v1*v1/(2*g);
 const yt=normalDepth(i.Q,i.bt,0,i.nt,i.St),v2=i.Q/(i.bt*yt),hv2=v2*v2/(2*g),Fr2=v2/Math.sqrt(g*yt);
 const Ec=1.5*Math.cbrt(i.Q*i.Q/(g*i.bt*i.bt)),dh=hv2-hv1,hdIn=(1+i.Ci)*dh,hdOut=(1-i.Co)*dh;
 const canalWL=i.canalBed+y1,tBed=i.canalBed-i.dep,reqUp=tBed+yt+hdIn,afflux=Math.max(0,reqUp-canalWL),upWL=canalWL+afflux;
 const choked=(y1+hv1+i.dep)<Ec;
 const L=Math.max(0,(T1-i.bt)/2/Math.tan(i.theta*Math.PI/180));
 const Pw=4.75*Math.sqrt(i.Qf),R=0.473*Math.cbrt(i.Qf/i.f),vL=Math.pow(i.Qf*i.f*i.f/140,1/6);
 const sp=Math.max(i.sp,i.pw+0.5),Wd=i.riverW>0?i.riverW:Pw,N=Math.max(1,Math.ceil((Wd+i.pw)/sp)),Lt=N*sp-i.pw,blockage=(N-1)*i.pw/Lt;
 const tWL=upWL-hdIn,yTr=tWL-tBed,soffit=tBed-i.tw,clear=soffit-i.HFL;
 const type=clear>=0.6?'Aqueduct':(upWL<=i.drainBed?'Super-passage':'Siphon aqueduct');
 const sec=i.bt*i.tw+2*(yTr+i.fb)*i.tw,wS=25*sec,wW=g*i.bt*yTr,w=wS+wW,M=w*sp*sp/8,V=w*sp/2;
 const pierH=Math.max(soffit-i.drainBed,0),pierSigma=w*sp/(i.pw*(i.bt+2*i.tw)),pierSlender=pierH/i.pw,pierOK=pierSigma<=i.sigAllow&&pierSlender<=i.slenderMax;
 const cost=i.cc*sec*Lt+i.tc*2*L+i.pc*(N-1);
 const feasible=!choked&&Fr2<=0.8&&afflux<=i.maxAfflux;
 const EGL0=upWL+hv1,EGL1=EGL0-i.Ci*dh,EGL2=EGL1-i.St*Lt,EGL3=EGL2-i.Co*dh,dBed=i.canalBed-i.S*(2*L+Lt),prof=[];
 const s=w_=>T1>i.bt?(T1-w_)/(T1-i.bt):1;
 const add=(x,w_,bed,egl,hv)=>prof.push({x,width:w_,bed,egl,wl:egl-hv});
 for(let k=0;k<=20;k++){const w_=width(i.shape,L*k/20,T1,i.bt,L);add(L*k/20,w_,i.canalBed+(tBed-i.canalBed)*k/20,EGL0+(EGL1-EGL0)*k/20,hv1+dh*s(w_));}
 for(let k=1;k<=10;k++){const xt=Lt*k/10;add(L+xt,i.bt,tBed-i.St*xt,EGL1+(EGL2-EGL1)*k/10,hv2);}
 const eb=tBed-i.St*Lt;
 for(let k=1;k<=20;k++){const w_=width(i.shape,L-L*k/20,T1,i.bt,L);add(L+Lt+L*k/20,w_,eb+(dBed-eb)*k/20,EGL2+(EGL3-EGL2)*k/20,hv1+dh*s(w_));}
 const results={y1,T1,v1,hv1,yt,v2,hv2,Fr2,Ec,hdIn,hdOut,afflux,freeboard:afflux+0.6,choked,L,Lt,laceyWidth:Pw,laceyR:R,laceyV:vL,spans:N,piers:N-1,spEff:sp,clearSpan:sp-i.pw,blockage,pierScour:2*R,abutScour:1.27*R,pierFoundRL:i.HFL-2*R-R/3,soffit,clearance:clear,type,wTotal:w,M,V,cost,feasible,pierH,pierSigma,pierSlender,pierOK};
 return {inputs:i,results,profile:prof};
}
function costScan(inp,n){n=n||30;const i=Object.assign({},DEF,inp||{}),out=[];
 for(let k=0;k<n;k++){const b=i.B*(0.3+0.7*k/(n-1)),r=design(Object.assign({},i,{bt:b})).results;out.push({bt:b,cost:r.cost,feasible:r.feasible,afflux:r.afflux,Fr:r.Fr2,L:r.L});}
 const ok=out.filter(o=>o.feasible);return{rows:out,best:ok.length?ok.reduce((a,b)=>b.cost<a.cost?b:a):null};}
root.Aq={DEF,design,costScan,width,normalDepth};
})(typeof module!=='undefined'?module.exports:window);
