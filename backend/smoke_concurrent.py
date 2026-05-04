"""Stress concurrency: 10 simultaneous sessions doing full ML pipeline."""
import requests, threading, time
BASE = 'http://127.0.0.1:8000'

# 10 users — half iris, half iris with different settings (avoiding titanic name-column bug
# which is unrelated to concurrency).
USERS = [
    (f'user-{i:02d}', {
        'sepal length (cm)': 5.0 + (i * 0.1),
        'sepal width (cm)': 3.0 + (i * 0.05),
        'petal length (cm)': 1.0 + (i * 0.4),
        'petal width (cm)': 0.2 + (i * 0.2),
    })
    for i in range(10)
]

results, errors, lock = {}, [], threading.Lock()

def run_user(name, sample_input):
    H = {'X-Session-Id': f'stress-{name}'}
    log = {'name': name}
    t0 = time.time()
    try:
        r = requests.get(f'{BASE}/demo/iris', headers=H, timeout=30); r.raise_for_status()
        log['rows'] = r.json()['analysis']['shape'][0]

        r = requests.post(f'{BASE}/preprocess', headers=H,
                          json={'action': 'duplicates', 'params': {'keep': 'first'}}, timeout=20)
        r.raise_for_status()

        r = requests.get(f'{BASE}/pipeline', headers=H, timeout=10); r.raise_for_status()
        log['pipeline_len'] = len(r.json()['pipeline'])

        r = requests.post(f'{BASE}/train', headers=H, json={
            'target_column': 'species', 'problem_type': 'classification',
            'split_strategy': 'stratified_kfold', 'num_folds': 3, 'shuffle': True,
            'random_seed': 42 + hash(name) % 1000,
            'hidden_nodes': 20, 'activation': 'sigmoid', 'repeats': 1,
        }, timeout=60)
        r.raise_for_status()
        log['cv_acc'] = r.json()['summary']['accuracy']['mean']

        r = requests.post(f'{BASE}/train-finalize', headers=H, json={
            'target_column': 'species', 'problem_type': 'classification',
            'hidden_nodes': 20, 'activation': 'sigmoid', 'random_seed': 42,
        }, timeout=30); r.raise_for_status()

        r = requests.post(f'{BASE}/predict', headers=H, json={'data': sample_input}, timeout=15)
        r.raise_for_status()
        log['prediction'] = r.json()['prediction']

        # Try to access another user's session — must fail
        intruder = {'X-Session-Id': f'INTRUDER-OF-{name}'}
        r_intruder = requests.post(f'{BASE}/predict', headers=intruder, json={'data': sample_input}, timeout=10)
        log['intruder_blocked'] = r_intruder.status_code == 404

        log['elapsed'] = time.time() - t0
        with lock: results[name] = log
    except Exception as e:
        with lock: errors.append((name, str(e)))

print(f'Spawning {len(USERS)} concurrent users...\n')
threads = [threading.Thread(target=run_user, args=u) for u in USERS]
t0 = time.time()
for t in threads: t.start()
for t in threads: t.join()
total = time.time() - t0

print(f'Done in {total:.2f}s. {len(results)}/{len(USERS)} succeeded.\n')

# Verify per-user results
all_ok = True
for name, sample in USERS:
    r = results.get(name)
    if r is None:
        print(f'  [MISSING] {name}'); all_ok = False; continue
    rows_ok = r['rows'] == 150
    pipeline_ok = r['pipeline_len'] == 1
    intruder_ok = r['intruder_blocked'] is True
    pred_ok = r['prediction'] in ('setosa', 'versicolor', 'virginica')
    fold_ok = r['cv_acc'] > 0.85
    line = f'  {name}: rows={r["rows"]:>3} pipeline={r["pipeline_len"]} cv_acc={r["cv_acc"]:.3f} pred={r["prediction"]:>10} intruder=HTTP{"404 ✓" if intruder_ok else "??? ✗"} ({r["elapsed"]:.2f}s)'
    if rows_ok and pipeline_ok and intruder_ok and pred_ok and fold_ok:
        print(f'  [OK] {line}')
    else:
        print(f'  [FAIL] {line}')
        all_ok = False

if errors:
    print('\nErrors:')
    for n, e in errors: print(f'  {n}: {e}')
    all_ok = False

print('\n' + '='*70)
print(' VERDICT:', '[PASS] 10 concurrent sessions all isolated' if all_ok else '[FAIL] CONCURRENCY BROKEN')
print('='*70)
