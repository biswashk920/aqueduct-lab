const F=[['Canal',[['Q','Discharge','m3/s',.5],['B','Bed width','m',.5],['z','Side slope (H:V)','',.1],['n','Manning n','',.001],['S','Bed slope','',.00001],['canalBed','Canal bed RL','m',.1]]],
['Trough & transitions',[['bt','Trough width','m',.1],['nt','Trough n','',.001],['St','Trough slope','',.0001],['dep','Bed depression','m',.05],['shape','Transition shape','',0],['theta','Splay angle','deg',.5],['Ci','Inlet loss Ci','',.01],['Co','Outlet loss Co','',.01],['fb','Trough freeboard','m',.05],['tw','Wall/slab thickness','m',.05]]],
['Drainage',[['Qf','Flood discharge','m3/s',10],['f','Lacey silt factor','',.1],['HFL','High flood level RL','m',.1],['drainBed','Drain bed RL','m',.1],['riverW','River / drain width (0 = auto, Lacey)','m',1],['sp','Pier spacing, centre to centre','m',.5],['pw','Pier width (along canal)','m',.1],['sigAllow','Pier allowable stress','kPa',100],['slenderMax','Max pier H/t','',1]]],
['Cost & limits',[['cc','Concrete cost /m3','',500],['pc','Pier cost each','',10000],['tc','Transition cost /m','',1000],['maxAfflux','Max afflux','m',.01]]]];
const OUT=[['Canal depth y1','y1','m'],['Canal top width','T1','m'],['Canal velocity','v1','m/s'],['Trough depth','yt','m'],['Trough velocity','v2','m/s'],['Trough Froude','Fr2',''],['Critical E (choke)','Ec','m'],['Inlet drawdown','hdIn','m'],['Outlet rise','hdOut','m'],['Afflux','afflux','m'],['Bank freeboard','freeboard','m'],['Transition length','L','m'],['Trough length','Lt','m'],['Lacey waterway','laceyWidth','m'],['Spans','spans',''],['Number of piers','piers',''],['Clear span','clearSpan','m'],['Pier blockage','blockage',''],['Lacey scour R','laceyR','m'],['Pier scour (2R)','pierScour','m'],['Abutment scour','abutScour','m'],['Pier founding RL','pierFoundRL','m'],['Soffit RL','soffit','m'],['Clearance over HFL','clearance','m'],['Load w','wTotal','kN/m'],['Moment (simple span)','M','kN.m'],['Shear','V','kN'],['Pier height','pierH','m'],['Pier axial stress','pierSigma','kPa'],['Pier H/t','pierSlender',''],['Construction cost','cost','']];
const st={inp:Object.assign({},Aq.DEF),d:null,scan:null,t:0};
const ip=document.getElementById('inputs');
F.forEach(([h,fs])=>{ip.insertAdjacentHTML('beforeend',`<h2>${h}</h2>`);fs.forEach(([k,l,u,s])=>{ip.insertAdjacentHTML('beforeend',k==='shape'?
`<label><span>${l}</span><select data-k="shape"><option value="cubic">Cubic parabola</option><option value="mitra">Mitra hyperbolic</option><option value="straight">Straight (Hinds)</option></select></label>`:
`<label><span>${l} <small>${u}</small></span><input type="number" data-k="${k}" step="${s}" value="${Aq.DEF[k]}"></label>`)});});
ip.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;st.inp[k]=k==='shape'?e.target.value:parseFloat(e.target.value);if(k==='shape'||!isNaN(st.inp[k]))update();});
const fmt=v=>typeof v==='number'?(Math.abs(v)>=1e5?v.toExponential(3):v.toFixed(3)):String(v);
function update(){st.d=Aq.design(st.inp);st.scan=Aq.costScan(st.inp);const r=st.d.results;
 let h=`<h2>Crossing type</h2><span class="badge">${r.type}</span><div style="margin-top:4px;color:#55626f">Soffit RL ${r.soffit.toFixed(2)} vs HFL RL ${st.inp.HFL}: clearance ${r.clearance.toFixed(2)} m (aqueduct needs &ge; 0.6 m)</div>`;
 if(r.choked)h+='<div class="warn">Trough is choking the flow: widen it or deepen the depression.</div>';
 if(r.Fr2>0.8)h+='<div class="warn">Trough Froude number &gt; 0.8: flow is near critical.</div>';
 if(r.afflux>st.inp.maxAfflux)h+=`<div class="warn">Afflux ${r.afflux.toFixed(3)} m exceeds the allowed ${st.inp.maxAfflux} m.</div>`;
 if(!r.pierOK)h+=`<div class="warn">Pier check failed: axial stress ${r.pierSigma.toFixed(0)} kPa (limit ${st.inp.sigAllow}) or H/t ${r.pierSlender.toFixed(1)} (limit ${st.inp.slenderMax}). Increase pier width or reduce the spacing.</div>`;
 h+='<h2>Results</h2><table>'+OUT.map(([l,k,u])=>`<tr><td>${l}</td><td>${fmt(r[k])} ${u}</td></tr>`).join('')+'</table>';
 const b=st.scan.best;h+='<h2>Cost optimum</h2>'+(b?`<table><tr><td>Best trough width</td><td>${b.bt.toFixed(2)} m</td></tr><tr><td>Cost</td><td>${fmt(b.cost)}</td></tr></table>`:'<div class="warn">No feasible width in scan range.</div>');
 h+='<h2>Downloads</h2><button onclick="dl(\'summary\')">Results CSV</button><button onclick="dl(\'profile\')">Profile CSV</button><button onclick="dl(\'cost\')">Cost scan CSV</button><button onclick="dl(\'inputs\')">Inputs JSON (reload / share)</button><button onclick="png()">Profile plot PNG</button>';
 document.getElementById('outputs').innerHTML=h;drawPlan();drawCost();}
const csv=rows=>{const k=Object.keys(rows[0]);return k.join(',')+'\n'+rows.map(r=>k.map(c=>r[c]).join(',')).join('\n');};
function save(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();}
function dl(w){if(w==='summary')save('aqueduct_results.csv',csv([Object.assign({},st.inp,st.d.results)]),'text/csv');
 if(w==='profile')save('aqueduct_profile.csv',csv(st.d.profile),'text/csv');if(w==='cost')save('aqueduct_cost.csv',csv(st.scan.rows),'text/csv');
 if(w==='inputs')save('aqueduct_inputs.json',JSON.stringify(st.inp,null,2),'application/json');}
function png(){const a=document.createElement('a');a.href=document.getElementById('cProf').toDataURL('image/png');a.download='aqueduct_profile.png';a.click();}
function frame(c,xs,ys,xl,yl){const x=c.getContext('2d'),W=c.width,H=c.height,m={l:55,r:15,t:24,b:32};x.clearRect(0,0,W,H);
 const X=v=>m.l+(v-xs[0])/(xs[1]-xs[0])*(W-m.l-m.r),Y=v=>H-m.b-(v-ys[0])/(ys[1]-ys[0])*(H-m.t-m.b);
 x.strokeStyle='#e3e8ed';x.fillStyle='#55626f';x.font='11px sans-serif';
 for(let k=0;k<=4;k++){const yv=ys[0]+(ys[1]-ys[0])*k/4,xv=xs[0]+(xs[1]-xs[0])*k/4;x.beginPath();x.moveTo(m.l,Y(yv));x.lineTo(W-m.r,Y(yv));x.stroke();x.fillText(yv.toFixed(2),4,Y(yv)+4);x.fillText(xv.toFixed(0),X(xv)-8,H-m.b+14);}
 x.fillText(xl,W/2-20,H-4);x.fillText(yl,4,12);return{x,X,Y,W,H,m};}
function drawProf(){const c=document.getElementById('cProf'),p=st.d.profile,r=st.d.results;const xs=[0,p[p.length-1].x];
 const lo=Math.min(...p.map(q=>q.bed))-0.5,hi=Math.max(...p.map(q=>q.egl))+0.5;const f=frame(c,xs,[lo,hi],'Distance along canal axis (m)','RL (m)'),x=f.x;
 x.fillStyle='#c9b79c';x.beginPath();x.moveTo(f.X(0),f.Y(lo));p.forEach(q=>x.lineTo(f.X(q.x),f.Y(q.bed)));x.lineTo(f.X(xs[1]),f.Y(lo));x.fill();
 x.fillStyle='rgba(60,140,210,.55)';x.beginPath();x.moveTo(f.X(0),f.Y(p[0].bed));p.forEach(q=>x.lineTo(f.X(q.x),f.Y(q.wl)));for(let k=p.length-1;k>=0;k--)x.lineTo(f.X(p[k].x),f.Y(p[k].bed));x.fill();
 x.strokeStyle='#d33';x.setLineDash([6,4]);x.beginPath();p.forEach((q,k)=>k?x.lineTo(f.X(q.x),f.Y(q.egl)):x.moveTo(f.X(q.x),f.Y(q.egl)));x.stroke();x.setLineDash([]);
 x.strokeStyle='#17609c';x.lineWidth=2;x.beginPath();p.forEach((q,k)=>k?x.lineTo(f.X(q.x),f.Y(q.wl)):x.moveTo(f.X(q.x),f.Y(q.wl)));x.stroke();x.lineWidth=1;
 x.fillStyle='#17609c';x.fillText('Water surface',f.m.l+8,f.m.t+8);x.fillStyle='#d33';x.fillText('Energy grade line (dashed)',f.m.l+100,f.m.t+8);x.fillStyle='#8a7550';x.fillText('Bed',f.m.l+260,f.m.t+8);
 x.fillStyle='#fff';st.parts=st.parts||Array.from({length:70},(_,k)=>({p:k/70*xs[1],h:(k*0.37)%1}));
 st.parts.forEach(o=>{let j=p.findIndex(q=>q.x>=o.p);j=j<0?p.length-1:j;const q=p[j],d=Math.max(q.wl-q.bed,.05);o.v=st.inp.Q/(q.width*d);
  x.beginPath();x.arc(f.X(o.p),f.Y(q.bed+d*(.1+.8*o.h)),2,0,7);x.fill();});
 }
function drawPlan(){const c=document.getElementById('cPlan'),i=st.inp,r=st.d.results,T=r.T1,L=r.L;const f=frame(c,[0,Math.max(L,1)],[-T/2*1.1,T/2*1.1],'Distance along transition (m)','Half-width mirror (m)'),x=f.x;
 [['straight','#999'],['mitra','#2a9d4a'],['cubic','#d97b00']].forEach(([s,col])=>{x.strokeStyle=col;x.lineWidth=s===i.shape?3:1.2;[1,-1].forEach(sg=>{x.beginPath();for(let k=0;k<=40;k++){const xx=L*k/40,w=Aq.width(s,xx,T,i.bt,L)/2*sg;k?x.lineTo(f.X(xx),f.Y(w)):x.moveTo(f.X(xx),f.Y(w));}x.stroke();});x.fillStyle=col;x.fillText(s+(s===i.shape?' (selected)':''),f.m.l+8+['straight','mitra','cubic'].indexOf(s)*130,f.m.t+8);});x.lineWidth=1;}
function drawCost(){const c=document.getElementById('cCost'),rows=st.scan.rows,ok=rows.filter(o=>o.feasible);const cs=rows.map(o=>o.cost);
 const f=frame(c,[rows[0].bt,rows[rows.length-1].bt],[Math.min(...cs)*.95,Math.max(...cs)*1.05],'Trough width (m)','Cost'),x=f.x;
 rows.forEach((o,k)=>{x.fillStyle=o.feasible?'#2a9d4a':'#d33';x.beginPath();x.arc(f.X(o.bt),f.Y(o.cost),3.5,0,7);x.fill();});
 x.fillStyle='#2a9d4a';x.fillText('feasible',f.m.l+8,f.m.t+8);x.fillStyle='#d33';x.fillText('infeasible (choke / Fr>0.8 / afflux)',f.m.l+70,f.m.t+8);
 const b=st.scan.best;if(b){x.strokeStyle='#12355b';x.strokeRect(f.X(b.bt)-6,f.Y(b.cost)-6,12,12);}x.strokeStyle='#888';x.setLineDash([3,3]);x.beginPath();x.moveTo(f.X(st.inp.bt),f.m.t);x.lineTo(f.X(st.inp.bt),f.H-f.m.b);x.stroke();x.setLineDash([]);}
st.pos=0;let last=0;
function loop(ts){const dt=(ts-last)/1000;last=ts;const p=st.d.profile,tot=p[p.length-1].x;if(st.parts)st.parts.forEach(o=>{o.p=(o.p+dt*(o.v||1)*2)%tot;});drawProf();if(window.draw3d)draw3d(dt);requestAnimationFrame(loop);}
update();requestAnimationFrame(loop);
