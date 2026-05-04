"""Comprehensive runtime E2E smoke test — verifies every change."""
import requests, sys
BASE = 'http://127.0.0.1:8000'

passed, failed = [], []

def case(name, fn):
    try:
        result = fn()
        passed.append((name, result))
        print(f'  [OK]   {name:34s} -> {result}')
    except AssertionError as e:
        failed.append((name, f'AssertionError: {e}'))
        print(f'  [FAIL] {name:34s} -> AssertionError: {e}')
    except Exception as e:
        failed.append((name, f'{type(e).__name__}: {e}'))
        print(f'  [FAIL] {name:34s} -> {type(e).__name__}: {e}')


# ── Section A: Forensic pipeline (Module 1) ─────────────────────────────
SID_A = 'rt-A'
H_A = {'X-Session-Id': SID_A}

def t_demo_iris():
    r = requests.get(f'{BASE}/demo/iris', headers=H_A, timeout=20)
    assert r.status_code == 200
    a = r.json()['analysis']
    assert a['shape'] == [150, 5], f'shape={a["shape"]}'
    assert a.get('distribution_stats') and len(a['distribution_stats']) == 4
    assert all(k in a['correlation'] for k in ('values_pearson', 'values_spearman', 'values_kendall'))
    return 'iris 150x5, dist_stats=4, 3 corr methods'

def t_preprocess_dup():
    r = requests.post(f'{BASE}/preprocess', headers=H_A,
                      json={'action': 'duplicates', 'params': {'keep': 'first'}}, timeout=15)
    assert r.status_code == 200
    return f'pipeline now has {len(r.json()["pipeline"])} step'

def t_preprocess_preview():
    r = requests.post(f'{BASE}/preprocess/preview', headers=H_A,
                      json={'action': 'scaling', 'params': {'method': 'standard'}}, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert 'before' in body and 'after' in body
    return 'preview before/after returned'

def t_train_kfold():
    r = requests.post(f'{BASE}/train', headers=H_A, json={
        'target_column': 'species', 'problem_type': 'classification',
        'split_strategy': 'stratified_kfold', 'num_folds': 3, 'shuffle': True,
        'random_seed': 42, 'hidden_nodes': 20, 'activation': 'sigmoid',
    }, timeout=30)
    assert r.status_code == 200
    acc = r.json()['summary']['accuracy']['mean']
    assert acc > 0.85
    return f'k-fold acc={acc:.4f}'

def t_train_holdout_stratified():
    r = requests.post(f'{BASE}/train', headers=H_A, json={
        'target_column': 'species', 'problem_type': 'classification',
        'split_strategy': 'holdout', 'test_size': 0.2, 'shuffle': True,
        'random_seed': 42, 'hidden_nodes': 20, 'activation': 'sigmoid',
        'stratify_holdout': True,
    }, timeout=30)
    assert r.status_code == 200
    return f'holdout-strat acc={r.json()["summary"]["accuracy"]["mean"]:.4f}'

def t_finalize_predict():
    r = requests.post(f'{BASE}/train-finalize', headers=H_A, json={
        'target_column': 'species', 'problem_type': 'classification',
        'hidden_nodes': 20, 'activation': 'sigmoid', 'random_seed': 42,
    }, timeout=20)
    assert r.status_code == 200
    classes = r.json()['classes']
    assert classes == ['setosa', 'versicolor', 'virginica']
    r = requests.post(f'{BASE}/predict', headers=H_A, json={'data': {
        'sepal length (cm)': 5.1, 'sepal width (cm)': 3.5,
        'petal length (cm)': 1.4, 'petal width (cm)': 0.2,
    }}, timeout=10)
    assert r.status_code == 200
    pred = r.json()['prediction']
    assert pred == 'setosa', f'pred={pred}'
    return f'predict={pred}'

def t_export_csv():
    r = requests.get(f'{BASE}/export/dataset/csv', headers=H_A, timeout=15)
    assert r.status_code == 200
    assert b'sepal length' in r.content
    return f'CSV {len(r.content)} bytes'

def t_export_python():
    r = requests.get(f'{BASE}/export/dataset/python', headers=H_A, timeout=15)
    assert r.status_code == 200
    assert b'def preprocess_data' in r.content
    return f'Python {len(r.content)} bytes'

def t_pipeline_endpoint():
    r = requests.get(f'{BASE}/pipeline', headers=H_A, timeout=10)
    assert r.status_code == 200
    return f'len={len(r.json()["pipeline"])}'

def t_undo():
    r = requests.post(f'{BASE}/preprocess', headers=H_A,
                      json={'action': 'duplicates', 'params': {'keep': 'first'}}, timeout=15)
    before = len(r.json()['pipeline'])
    r = requests.post(f'{BASE}/undo', headers=H_A, timeout=10)
    assert r.status_code == 200
    after = len(r.json()['pipeline'])
    assert after == before - 1
    return f'{before} -> {after}'

def t_reset():
    r = requests.post(f'{BASE}/reset', headers=H_A, timeout=10)
    assert r.status_code == 200
    assert len(r.json()['pipeline']) == 0
    return 'pipeline cleared'

# ── Section B: NEW endpoints (P12) ──────────────────────────────────────
SID_B = 'rt-B'
H_B = {'X-Session-Id': SID_B}
requests.get(f'{BASE}/demo/iris', headers=H_B, timeout=15)
requests.post(f'{BASE}/train-finalize', headers=H_B, json={
    'target_column': 'species', 'problem_type': 'classification',
    'hidden_nodes': 20, 'activation': 'sigmoid', 'random_seed': 42,
}, timeout=20)

def t_learning_curve():
    r = requests.post(f'{BASE}/learning-curve', headers=H_B, json={
        'target_column': 'species', 'problem_type': 'classification',
        'hidden_nodes': 20, 'activation': 'sigmoid', 'random_seed': 42,
        'train_fractions': [0.25, 0.5, 0.75, 1.0],
    }, timeout=30)
    assert r.status_code == 200
    pts = r.json()['points']
    assert len(pts) >= 2
    return f'{len(pts)} points'

def t_calibration_blocked():
    r = requests.post(f'{BASE}/calibration', headers=H_B, json={
        'target_column': 'species', 'problem_type': 'classification',
        'hidden_nodes': 20, 'activation': 'sigmoid', 'random_seed': 42,
    }, timeout=15)
    assert r.status_code == 400
    return 'rejects multiclass HTTP 400'

def t_model_export():
    r = requests.get(f'{BASE}/model/export', headers=H_B, timeout=10)
    assert r.status_code == 200
    assert r.headers['content-type'] == 'application/octet-stream'
    assert len(r.content) > 1000
    return f'joblib {len(r.content)} bytes'

# ── Section C: Upload file types (P9) ───────────────────────────────────
def t_upload_csv():
    csv_text = 'a,b\n1,2\n3,4\n'
    r = requests.post(f'{BASE}/upload', headers={'X-Session-Id': 'rt-C-csv'},
                      files={'file': ('demo.csv', csv_text.encode(), 'text/csv')}, timeout=15)
    assert r.status_code == 200
    return f'CSV rows={r.json()["analysis"]["shape"][0]}'

def t_upload_jsonl():
    body = '{"a":1,"b":2}\n{"a":3,"b":4}\n'
    r = requests.post(f'{BASE}/upload', headers={'X-Session-Id': 'rt-C-jsonl'},
                      files={'file': ('demo.jsonl', body.encode(), 'application/json')}, timeout=15)
    assert r.status_code == 200
    return f'JSONL rows={r.json()["analysis"]["shape"][0]}'

def t_upload_tsv():
    body = 'a\tb\n1\t2\n3\t4\n'
    r = requests.post(f'{BASE}/upload', headers={'X-Session-Id': 'rt-C-tsv'},
                      files={'file': ('demo.tsv', body.encode(), 'text/tab-separated-values')}, timeout=15)
    assert r.status_code == 200
    return f'TSV rows={r.json()["analysis"]["shape"][0]}'

def t_upload_unsupported():
    r = requests.post(f'{BASE}/upload',
                      files={'file': ('weird.xyz', b'noop', 'application/octet-stream')}, timeout=10)
    assert r.status_code in (400, 500)
    return f'rejects .xyz HTTP {r.status_code}'

# ── Section D: Tabular stubs (P8) ───────────────────────────────────────
def t_tabular_stubs():
    codes = []
    for prob in ('titanic', 'heart', 'wine'):
        r = requests.post(f'{BASE}/tabular/predict-{prob}', json={'features': {}}, timeout=10)
        codes.append(r.status_code)
    assert codes == [503, 503, 503]
    return f'all 3 -> 503'

# ── Section E: Module 3 stateless ───────────────────────────────────────
def t_imagenet():
    with open('/tmp/dog.jpg', 'rb') as f:
        r = requests.post(f'{BASE}/category3/predict-image',
                          files={'file': ('dog.jpg', f, 'image/jpeg')}, timeout=30)
    assert r.status_code == 200
    pred = r.json()['prediction']
    assert pred
    return f'top-1={pred}'

# ── Section F: Session isolation ────────────────────────────────────────
def t_isolation():
    r = requests.post(f'{BASE}/predict', headers={'X-Session-Id': 'no-such-user'},
                      json={'data': {}}, timeout=10)
    assert r.status_code == 404
    return 'unknown session HTTP 404'

def t_no_session():
    r = requests.get(f'{BASE}/pipeline', timeout=10)
    assert r.status_code == 200
    return f'default bucket OK len={len(r.json()["pipeline"])}'

RUNS = [
    ('A1 demo/iris + EDA stats',  t_demo_iris),
    ('A2 preprocess duplicates',  t_preprocess_dup),
    ('A3 preprocess preview',     t_preprocess_preview),
    ('A4 train k-fold',           t_train_kfold),
    ('A5 train holdout strat',    t_train_holdout_stratified),
    ('A6 finalize + predict',     t_finalize_predict),
    ('A7 export CSV',             t_export_csv),
    ('A8 export Python script',   t_export_python),
    ('A9 GET /pipeline',          t_pipeline_endpoint),
    ('A10 undo',                  t_undo),
    ('A11 reset',                 t_reset),
    ('B1 /learning-curve',        t_learning_curve),
    ('B2 /calibration (block)',   t_calibration_blocked),
    ('B3 /model/export',          t_model_export),
    ('C1 upload .csv',            t_upload_csv),
    ('C2 upload .jsonl',          t_upload_jsonl),
    ('C3 upload .tsv',            t_upload_tsv),
    ('C4 upload .xyz reject',     t_upload_unsupported),
    ('D1 tabular stubs 503',      t_tabular_stubs),
    ('E1 ImageNet stateless',     t_imagenet),
    ('F1 isolation: stranger',    t_isolation),
    ('F2 default bucket exists',  t_no_session),
]

print('=== Runtime E2E ===\n')
for name, fn in RUNS:
    case(name, fn)

print(f'\n{len(passed)}/{len(RUNS)} passed')
if failed:
    print('\nFAILURES:')
    for n, e in failed: print(f'  {n}: {e}')
    sys.exit(1)
