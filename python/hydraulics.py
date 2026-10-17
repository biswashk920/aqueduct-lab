"""Aqueduct hydraulic design - Python reference implementation (mirrored by web/hydraulics.js)."""
import math, csv, json, sys
g = 9.81
DEF = dict(Q=15, B=10, z=1.5, n=0.025, S=1/5000, bt=7, nt=0.015, St=1/1000, dep=0.3, Ci=0.1, Co=0.2,
           theta=12.5, shape='cubic', fb=0.3, tw=0.3, sp=13.5, pw=1.5, riverW=0, Qf=300, f=1.0, HFL=99, drainBed=96,
           canalBed=101, cc=9000, pc=500000, tc=40000, maxAfflux=0.15, sigAllow=4000, slenderMax=12)

def normal_depth(Q, b, z, n, S):
    lo, hi = 1e-4, 60.0
    for _ in range(200):
        y = (lo + hi) / 2; A = (b + z*y)*y; P = b + 2*y*math.sqrt(1 + z*z)
        if A*(A/P)**(2/3)*math.sqrt(S)/n < Q: lo = y
        else: hi = y
    return (lo + hi) / 2

def width(shape, x, T1, bt, L):
    s = min(max(x/L, 0), 1) if L > 0 else 1
    if shape == 'straight': return T1 - (T1-bt)*s
    if shape == 'mitra': return 1/(1/T1 + (1/bt - 1/T1)*s)
    return T1 - (T1-bt)*(3*s*s - 2*s**3)

def design(inp=None):
    i = {**DEF, **(inp or {})}
    y1 = normal_depth(i['Q'], i['B'], i['z'], i['n'], i['S'])
    A1 = (i['B'] + i['z']*y1)*y1; T1 = i['B'] + 2*i['z']*y1; v1 = i['Q']/A1; hv1 = v1**2/(2*g)
    yt = normal_depth(i['Q'], i['bt'], 0, i['nt'], i['St']); v2 = i['Q']/(i['bt']*yt)
    hv2 = v2**2/(2*g); Fr2 = v2/math.sqrt(g*yt)
    Ec = 1.5*(i['Q']**2/(g*i['bt']**2))**(1/3); dh = hv2 - hv1
    hdIn = (1 + i['Ci'])*dh; hdOut = (1 - i['Co'])*dh
    canalWL = i['canalBed'] + y1; tBed = i['canalBed'] - i['dep']
    reqUp = tBed + yt + hdIn; afflux = max(0, reqUp - canalWL); upWL = canalWL + afflux
    choked = (y1 + hv1 + i['dep']) < Ec
    L = max(0, (T1 - i['bt'])/2/math.tan(math.radians(i['theta'])))
    Pw = 4.75*math.sqrt(i['Qf']); R = 0.473*(i['Qf']/i['f'])**(1/3); vL = (i['Qf']*i['f']**2/140)**(1/6)
    sp = max(i['sp'], i['pw'] + 0.5); Wd = i['riverW'] if i['riverW'] > 0 else Pw
    N = max(1, math.ceil((Wd + i['pw'])/sp)); Lt = N*sp - i['pw']
    blockage = (N-1)*i['pw']/Lt
    tWL = upWL - hdIn; yTr = tWL - tBed
    soffit = tBed - i['tw']; clear = soffit - i['HFL']
    typ = 'Aqueduct' if clear >= 0.6 else ('Super-passage' if upWL <= i['drainBed'] else 'Siphon aqueduct')
    sec = i['bt']*i['tw'] + 2*(yTr + i['fb'])*i['tw']
    wS = 25*sec; wW = g*i['bt']*yTr; w = wS + wW
    M = w*sp**2/8; V = w*sp/2
    pierH = max(soffit - i['drainBed'], 0.0)
    pierSigma = w*sp/(i['pw']*(i['bt'] + 2*i['tw'])); pierSlender = pierH/i['pw']
    pierOK = pierSigma <= i['sigAllow'] and pierSlender <= i['slenderMax']
    cost = i['cc']*sec*Lt + i['tc']*2*L + i['pc']*(N-1)
    feasible = (not choked) and Fr2 <= 0.8 and afflux <= i['maxAfflux']
    EGL0 = upWL + hv1; EGL1 = EGL0 - i['Ci']*dh; EGL2 = EGL1 - i['St']*Lt; EGL3 = EGL2 - i['Co']*dh
    dBed = i['canalBed'] - i['S']*(2*L + Lt); prof = []
    s = lambda w_: (T1 - w_)/(T1 - i['bt']) if T1 > i['bt'] else 1
    def add(x, w_, bed, egl, hv): prof.append(dict(x=x, width=w_, bed=bed, egl=egl, wl=egl-hv))
    for k in range(21):
        w_ = width(i['shape'], L*k/20, T1, i['bt'], L)
        add(L*k/20, w_, i['canalBed'] + (tBed - i['canalBed'])*k/20, EGL0 + (EGL1-EGL0)*k/20, hv1 + dh*s(w_))
    for k in range(1, 11):
        xt = Lt*k/10; add(L + xt, i['bt'], tBed - i['St']*xt, EGL1 + (EGL2-EGL1)*k/10, hv2)
    eb = tBed - i['St']*Lt
    for k in range(1, 21):
        w_ = width(i['shape'], L - L*k/20, T1, i['bt'], L)
        add(L + Lt + L*k/20, w_, eb + (dBed - eb)*k/20, EGL2 + (EGL3-EGL2)*k/20, hv1 + dh*s(w_))
    res = dict(y1=y1, T1=T1, v1=v1, hv1=hv1, yt=yt, v2=v2, hv2=hv2, Fr2=Fr2, Ec=Ec, hdIn=hdIn, hdOut=hdOut,
               afflux=afflux, freeboard=afflux + 0.6, choked=choked, L=L, Lt=Lt, laceyWidth=Pw, laceyR=R, laceyV=vL,
               spans=N, piers=N-1, spEff=sp, clearSpan=sp - i['pw'], blockage=blockage, pierScour=2*R, abutScour=1.27*R, pierFoundRL=i['HFL'] - 2*R - R/3,
               soffit=soffit, clearance=clear, type=typ, wTotal=w, M=M, V=V, cost=cost, feasible=feasible, pierH=pierH, pierSigma=pierSigma, pierSlender=pierSlender, pierOK=pierOK)
    return dict(inputs=i, results=res, profile=prof)

def cost_scan(inp=None, n=30):
    i = {**DEF, **(inp or {})}; out = []
    for k in range(n):
        b = i['B']*(0.3 + 0.7*k/(n-1)); r = design({**i, 'bt': b})['results']
        out.append(dict(bt=b, cost=r['cost'], feasible=r['feasible'], afflux=r['afflux'], Fr=r['Fr2'], L=r['L']))
    ok = [o for o in out if o['feasible']]
    return out, (min(ok, key=lambda o: o['cost']) if ok else None)

def write_csvs(d, prefix='aqueduct'):
    for name, rows in (('profile', d['profile']), ('results', [d['results']]), ('cost', cost_scan(d['inputs'])[0])):
        with open(f'{prefix}_{name}.csv', 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

if __name__ == '__main__':
    inp = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
    d = design(inp); write_csvs(d)
    for k, v in d['results'].items(): print(f'{k:>14}: {v:.4f}' if isinstance(v, float) else f'{k:>14}: {v}')
    print('best feasible trough width:', cost_scan(inp)[1])
