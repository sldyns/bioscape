from pathlib import Path
import urllib.request, concurrent.futures, hashlib, json, re, datetime, subprocess

base = Path(__file__).parent
origin = 'https://sldyns.github.io/bioscape/'
headers = {'User-Agent': 'BioScape-deployment-verification', 'Cache-Control': 'no-cache'}
frozen = Path('/tmp/bioscape-systemwide-20261004-baseline-dist-ae697be')

def request(path):
    with urllib.request.urlopen(urllib.request.Request(origin + path, headers=headers), timeout=45) as response:
        return response.status, response.read(), dict(response.headers)

local = Path('dist/index.html').read_bytes()
status, live, response_headers = request('')
(base / 'live-index.html').write_bytes(live)
expected = sorted(set(re.findall(rb'(?:src|href)="\./(assets/[^\"]+)"', local)))
actual = sorted(set(re.findall(rb'(?:src|href)="\./(assets/[^\"]+)"', live)))
assert actual == expected, 'Live entry asset list is not the final local build'
paths = set(p.decode() for p in expected)
for p in Path('dist/assets').iterdir():
    if p.suffix not in ('.js', '.css'):
        continue
    old = frozen / p.relative_to('dist')
    if not old.exists() or old.read_bytes() != p.read_bytes():
        paths.add(str(p.relative_to('dist')))

def verify(path):
    code, body, response_headers = request(path)
    expected_body = Path('dist', path).read_bytes()
    sha = lambda data: hashlib.sha256(data).hexdigest()
    return {'path': path, 'status': code, 'bytes': len(body), 'localSha256': sha(expected_body), 'liveSha256': sha(body), 'equal': body == expected_body, 'contentType': response_headers.get('Content-Type')}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(verify, sorted(paths)))
result = {'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'url': origin, 'deployedCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(), 'method': 'Exact HTML and every changed or newly named JS/CSS asset versus ae697be; all initial static entry resources included. Unchanged image/model assets are covered by the production build release check.', 'entryStatus': status, 'entryBytesEqual': local == live, 'entryAssetsMatch': expected == actual, 'criticalAssets': len(results), 'allAssetsEqual': all(r['equal'] for r in results), 'assets': results}
(base / 'live-version-check.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'assets'}))
assert result['entryBytesEqual'] and result['allAssetsEqual']
