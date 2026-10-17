"""Cross-validate JS vs Python and sanity-check against closed-form results. Run: python tests/validate.py"""
import json, subprocess, sys, os, math, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python'))
import hydraulics as H
cases = [{}, {'Q': 25, 'bt': 9, 'shape': 'mitra'}, {'Q': 8, 'B': 6, 'bt': 4, 'shape': 'straight', 'HFL': 101.5, 'Qf': 120}]
y = H.normal_depth(10, 5, 0, 0.015, 0.001); A = 5*y; P = 5 + 2*y
assert abs(A*(A/P)**(2/3)*math.sqrt(0.001)/0.015 - 10) < 1e-6, 'Manning check failed'
print('Manning normal-depth check OK')
py = [{'results': H.design(c)['results'], 'best': H.cost_scan(c)[1]} for c in cases]
f = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False); json.dump(cases, f); f.close()
try:
    js = json.loads(subprocess.check_output(['node', os.path.join(os.path.dirname(__file__), 'js_runner.js'), f.name]))
except FileNotFoundError:
    sys.exit('Node.js not found - install it to run the JS side of the cross-check.')
bad = 0
for k, (a, b) in enumerate(zip(py, js)):
    for key, v in a['results'].items():
        w = b['results'][key]
        if (isinstance(v, float) and abs(v - w) > 1e-9*max(1, abs(v))) or (not isinstance(v, float) and v != w):
            bad += 1; print(f'case {k} MISMATCH {key}: py={v} js={w}')
print('PASS: JS and Python agree on all cases' if not bad else f'{bad} mismatches')
sys.exit(bool(bad))
