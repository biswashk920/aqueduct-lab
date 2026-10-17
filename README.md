# Aqueduct Lab

**[Open the live app](https://biswashk920.github.io/aqueduct-lab/)**

Interactive design tool for a canal-over-drainage crossing: **aqueduct, siphon aqueduct and super-passage**, with a rotatable 3D view,
top / side / front presets, live design checks and CSV export. The Python reference code is cross-validated against the browser code.

---

## 1. Repository contents

| Path | What it is |
|---|---|
| `docs/` | The web app (static, no build step). Deep links `#aq`, `#sip`, `#sup` load the three example crossings. |
| `python/hydraulics.py` | Reference implementation. `python python/hydraulics.py [inputs.json]` prints results and writes CSVs. |
| `tests/validate.py` | `python tests/validate.py` compares Python and JS on several cases (needs Node.js). |

**Publishing:** repo Settings > Pages > Deploy from branch `main`, folder `/docs`.

---

## 2. How to use the app (30-second version)

1. Press one of the three **Load example** buttons (Aqueduct / Siphon aqueduct / Super-passage).
2. Rotate the 3D view with the mouse, zoom with the wheel, or use Top / Side / Front.
3. Change inputs on the left. Results, warnings and the crossing-type badge update on the right.
4. Red boxes on the right are design warnings (choking, high Froude number, afflux, weak piers).
5. Download CSVs / inputs JSON / PNG from the right panel.

---

## 3. Input reference

> **Important about the "typical range" columns:** these are typical textbook and agency practice values (Indian practice /
> Garg / Punmia / Hinds / Lacey, USBR, Chow's open-channel tables). They are guidance for choosing sensible values, **not code
> requirements**. Always check the standard that governs your project.
>
> Units: metres, seconds, m3/s, kPa. "RL" = reduced level (elevation on your survey datum). Slopes are dimensionless
> (0.0002 = 1 in 5000). Costs have no currency; use one currency consistently.

### 3.1 Canal (the upstream and downstream channel)

| Input | Unit | App default | Typical range | What it is |
|---|---|---|---|---|
| **Discharge (Q)** | m3/s | 15 | Distributaries 1-30; branch/main canals 30-300+ | Full-supply design discharge carried by the canal and the trough. |
| **Bed width (B)** | m | 10 | From your canal design table | Bottom width of the trapezoidal canal. |
| **Side slope (z)** | H:V | 1.5 | Lined 1.0-1.5; unlined firm soil 1.5-2.0; sandy soil 2-3 | Horizontal run per 1 vertical of canal bank. |
| **Manning n** | - | 0.025 | Concrete-lined 0.014-0.018; clean earth 0.018-0.025; some weeds/stones 0.025-0.035 | Roughness of the canal. |
| **Bed slope (S)** | - | 0.0002 | 0.0001-0.0003 (1 in 10000 to 1 in 3300) | Longitudinal slope of the canal bed. |
| **Canal bed RL** | m | 101 | Your survey datum | Elevation of the canal bed at the crossing. |

**What they do:** Q, B, z, n and S together fix the canal's **normal depth y1**, velocity v1 and top width T1. T1 sets the transition
length (T1 minus trough width). Canal bed RL positions the whole structure vertically (trough bed, soffit) and therefore decides the
crossing type against the drain levels.

**How to choose:** Take B, z, n and S from the actual canal design. A canal velocity of about 0.6-1.0 m/s (unlined) or up to about
2 m/s (lined) is normal. If your velocity is far outside that, revisit the canal design before the crossing.

### 3.2 Trough and transitions

| Input | Unit | App default | Typical range | What it is |
|---|---|---|---|---|
| **Trough width (bt)** | m | 7 | About 0.4-0.8 x canal bed width, set by the cost optimiser | Clear width of the rectangular trough. |
| **Trough n** | - | 0.015 | Smooth concrete 0.014-0.018 | Roughness of the trough. |
| **Trough slope** | - | 0.001 | 0.0005-0.002 (1 in 2000 to 1 in 500) | Bed slope of the trough; steeper than the canal to carry the water at higher velocity. |
| **Bed depression** | m | 0.3 | 0-0.5 | How far the trough bed is set below the canal bed. |
| **Transition shape** | - | Cubic parabola | Straight / Mitra / Cubic | Plan shape of the funnel from canal to trough. |
| **Splay angle** | deg | 12.5 | 10-22.5 (Hinds: 12.5) | Side angle of the transition; sets its length. |
| **Inlet loss Ci** | - | 0.1 | About 0.1 (smooth/warped) to 0.3 (abrupt) | Head-loss coefficient at the inlet transition. |
| **Outlet loss Co** | - | 0.2 | About 0.2 (smooth/warped) to 0.5 (abrupt) | Head-loss coefficient at the outlet transition. |
| **Trough freeboard** | m | 0.3 | 0.3-0.6 | Wall height above the water surface in the trough. |
| **Wall / slab thickness (tw)** | m | 0.3 | RCC troughs about 0.2-0.5 | One thickness used for trough floor and walls. |

**What they do, and what happens when you increase them:**

- **Trough width**: narrower means a deeper, faster trough, so a higher Froude number, more inlet drawdown, a longer transition and a higher risk of
  choking, but less concrete per metre. Wider is the reverse. The **cost scan** plot shows where cost is lowest while the checks still pass.
- **Trough n and slope**: together set the **trough normal depth yt**. Higher n or lower slope gives a deeper, slower trough (lower Froude,
  more concrete, more water load). Lower n or steeper slope gives shallower, faster flow (higher Froude).
- **Bed depression**: absorbs the water-surface drawdown at the inlet. More depression reduces **afflux** and helps avoid choking
  (the choke check uses y1 + hv1 + depression against the critical energy of the trough), but it lowers the trough and its soffit,
  which **reduces clearance above the flood level** and may change the crossing type.
- **Transition shape**: changes the plan outline of the wing walls, the 3D walls and the velocity-head blend in the profile plot. **It does
  not change the transition length or the head loss in the calculation** (those come from the splay angle and Ci/Co).
- **Splay angle**: transition length L = (T1 - bt) / (2 tan angle). A smaller angle gives a longer, smoother, costlier transition. A larger
  angle is shorter but should be paired with higher Ci/Co (more turbulence).
- **Ci and Co**: inlet drawdown = (1 + Ci) x change in velocity head; outlet rise = (1 - Co) x change in velocity head. Larger Ci increases
  inlet drawdown and afflux. Larger Co means less water-surface recovery at the outlet.
- **Freeboard and thickness**: control the wall height (water depth + freeboard) and the concrete volume, hence self weight, load,
  cost and the trough soffit level (soffit = trough bed minus thickness).

**How to choose:** Start with the trough width from the cost scan, keep Froude below about 0.8, adjust the bed depression until
afflux is roughly zero, and use the standard Hinds values (12.5 deg, Ci 0.1, Co 0.2) for smooth warped transitions.
Use larger loss coefficients for straight or abrupt transitions.

> **Watch out:** the trough is concrete, so n should be around 0.014-0.018. A value like 0.035 describes a very rough or
> vegetated channel; it will make the trough noticeably deeper and slower than a real concrete trough.

### 3.3 Drainage (the river / natural drain)

| Input | Unit | App default | Typical range | What it is |
|---|---|---|---|---|
| **Flood discharge (Qf)** | m3/s | 300 | From hydrology: design flood of the catchment | Design flood of the drain. |
| **Lacey silt factor (f)** | - | 1.0 | 0.4-4 (see table below) | Bed-material factor, f = 1.76 x sqrt(d in mm). |
| **High flood level (HFL) RL** | m | 99 | From flood analysis / survey | Water level at the design flood. |
| **Drain bed RL** | m | 96 | From survey | Elevation of the drain bed. |
| **River / drain width** | m | 0 (auto) | At least the Lacey width | Waterway length along the canal. 0 means use the Lacey width. |
| **Pier spacing, centre to centre (sp)** | m | 13.5 | 6-20 for RCC troughs | Distance between pier centrelines. |
| **Pier width (pw)** | m | 1.5 | 1.0-2.5 | Pier dimension along the canal axis. |
| **Pier allowable stress** | kPa | 4000 | M20 about 4000-5000; M25 about 6000; masonry 500-1500 | Limit for the pier axial-stress check. |
| **Max pier H/t** | - | 12 | 8-12 | Limit for pier height / pier width. |

Lacey silt factor examples (f = 1.76 sqrt(d)): d = 0.1 mm gives f about 0.56 (fine silt); d = 0.5 mm gives 1.24 (medium sand);
d = 1 mm gives 1.76 (coarse sand); d = 5 mm gives 3.9 (fine gravel).

**What they do, and what happens when you increase them:**

- **Flood discharge**: sets the Lacey regime width (4.75 sqrt(Qf)), Lacey velocity and scour depth R = 0.473 (Qf/f)^(1/3).
  Bigger flood means a wider waterway (when width is auto), deeper scour, deeper pier foundations.
- **Silt factor f**: larger f (coarser bed) means a smaller scour depth R. Smaller f means deeper scour and deeper foundations.
- **HFL and drain bed RL**: HFL decides the **crossing type** (see section 4) and how far the flood rises against the structure. The drain bed
  with the trough soffit gives the **pier height**, and HFL minus 2R minus R/3 gives the **pier founding level**.
- **River / drain width**: increases the trough length and the **number of spans and piers**. Wider river means more piers, a longer
  trough and higher cost. Leave it at 0 to use the Lacey width; type your own value if you have a surveyed waterway width.
  The tool rounds up to a whole number of spans, so the actual trough length is slightly longer than the width you enter.
  Do not choose a waterway much narrower than the Lacey width; that raises scour and flood afflux (the tool reports blockage, not river afflux).
- **Pier spacing (c/c)**: clear span = spacing minus pier width. A larger spacing means fewer piers but a heavier trough design:
  bending moment M = w x sp^2 / 8 and shear V = w x sp / 2 rise quickly with span, and each pier carries more load. A smaller spacing means
  more piers and a lighter trough. Choose the span where pier cost and trough cost balance (typically 8-15 m for RCC troughs).
  The minimum allowed spacing is pier width plus 0.5 m.
- **Pier width**: wider piers lower pier stress and H/t, but reduce the clear waterway (higher blockage) and increase trough length.
- **Pier allowable stress and max H/t**: set the thresholds for the pier warning. Pier axial stress = (w x sp) / (pw x (bt + 2 tw)),
  where w is the total load per metre (self weight + water). The check fails, and a red warning appears, if stress or H/t exceeds the limit.

**How to choose:** Take Qf from hydrology (the design flood per your code, often a 50-100 year event for major structures),
get f from the bed-material grain size, and take HFL and drain bed from the survey. Pick the pier spacing from an economic span study
(try several values and watch cost and pier warnings), and increase pier width if the pier warning shows.
The stress and H/t limits are **screening limits**, not structural design.

### 3.4 Cost and limits

| Input | Unit | App default | Typical range | What it is |
|---|---|---|---|---|
| **Concrete cost per m3** | currency | 9000 | Local rate | Unit cost of trough concrete. |
| **Pier cost each** | currency | 500000 | Local estimate | Cost per pier (applies to intermediate piers only). |
| **Transition cost per m** | currency | 40000 | Local estimate | Cost per metre of one transition (inlet and outlet are both counted). |
| **Max afflux** | m | 0.15 | Must be below your canal freeboard; 0.05-0.15 is a conservative target | Largest acceptable rise in upstream water level. |

**What they do:** Total cost = concrete cost x trough concrete volume + transition cost x 2 x transition length + pier cost x number of
piers. The cost scan varies trough width from 30 percent to 100 percent of the canal bed width and plots the cost for each. A width is
marked **feasible** only if it does not choke, has Froude number at most 0.8, and has afflux at most the **Max afflux** limit.
The optimum is the cheapest feasible point.

**How to choose:** Use local unit rates in one currency. Relative costs matter more than absolute values: if piers are expensive relative to
concrete, the optimiser will favour larger spans.

---

## 4. How the crossing type is decided

1. Trough soffit RL = (canal bed RL minus bed depression) minus wall/slab thickness.
2. Clearance = soffit RL minus HFL.
3. If clearance is at least 0.6 m, the type is **Aqueduct** (the flood passes freely under the trough).
4. Otherwise, if the canal water level is at or below the drain bed, the type is **Super-passage** (the drain passes over the canal).
5. Otherwise the type is **Siphon aqueduct** (the flood rises above the canal bed, so the drain must pass through barrels).

Try it: from the Aqueduct example, raise **HFL** until the badge changes. Lower **Canal bed RL** below the drain bed for a super-passage.

---

## 5. Warnings and what they mean

| Warning | Meaning | Typical fix |
|---|---|---|
| Trough is choking | The trough is too narrow for the available energy; water would back up. | Widen the trough, or increase bed depression. |
| Froude number above 0.8 | Trough flow is close to critical and unstable. | Widen the trough, flatten its slope, or reduce roughness change. |
| Afflux exceeds limit | Upstream water level rises by more than allowed. | Increase bed depression, reduce Ci, or widen the trough. |
| Pier check failed | Pier axial stress or H/t exceeds the limit. | Increase pier width, reduce spacing, or raise the allowable stress (if justified by the concrete grade). |

---

## 6. Method (summary)

- Manning normal depth for the canal (trapezoid) and the trough (rectangle).
- Critical specific energy for the choke check: Ec = 1.5 (Q^2 / (g bt^2))^(1/3).
- Hinds transition losses: inlet drawdown (1 + Ci) x change in velocity head; outlet rise (1 - Co) x the same change.
- Afflux from the inlet energy balance; bank freeboard = afflux + 0.6 m.
- Lacey regime width P = 4.75 sqrt(Qf); scour R = 0.473 (Qf/f)^(1/3); pier scour 2R; abutment scour 1.27R; pier founding RL = HFL - 2R - R/3.
- Spans N = ceil((river width + pier width) / spacing); trough length = N x spacing - pier width.
- Trough loading: concrete 25 kN/m3 plus water; simple-span M = w sp^2 / 8, V = w sp / 2.
- Pier screening: axial stress and H/t against the limits above.
- Cost scan over trough width.

---

## 7. Limits (read before relying on results)

- Siphon barrels are drawn schematically; their pressure-flow hydraulics, head loss and uplift are **not computed**.
- The energy-grade-line profile blends velocity head linearly across the transitions; it is not a gradually-varied-flow solution.
- The pier check is a screening check with editable limits, not structural design.
- Trough structural design is simple-span only (one thickness for floor and walls).
- River-side afflux and local pier scour amplification are not modelled beyond the Lacey scour factors.
- Verify against your governing design code and textbook worked examples before using results for a real design.

## 8. Testing

`python tests/validate.py` checks the Manning solver against its closed form and compares every result between Python and JS to
1e-9 on several cases. Add a textbook worked example to that script to extend the checks.