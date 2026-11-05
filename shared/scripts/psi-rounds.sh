#!/usr/bin/env bash
# PSI API rounds for one or more URLs, mobile and desktop in parallel, the same URL at least
# GAP seconds apart (PSI returns a cached result for calls close together).
# Prints one line per run: round, page, device, score, FCP, LCP, TBT, CLS, SI. JSON kept in OUT_DIR.
# Usage: psi-rounds.sh <out_dir> <rounds> <url> [url...]      env GAP (default 82)
set -u
OUT="${1:?out_dir}"; N="${2:?rounds}"; shift 2
GAP="${GAP:-82}"; HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
slug() { local s="${1#*://}"; s="${s#*/}"; s="${s%/}"; s="${s//\//-}"; echo "${s:-home}"; }
for i in $(seq 1 "$N"); do
  t0=$(date +%s)
  for u in "$@"; do p=$(slug "$u")
    for d in mobile desktop; do "$HERE/psi-api.sh" "$u" "$OUT/$i-$p-$d.json" "$d" & done
  done
  wait
  for u in "$@"; do p=$(slug "$u")
    for d in mobile desktop; do
      python3 -I - "$OUT/$i-$p-$d.json" "$i" "$p" "$d" <<'EOF'
import json, sys
f, i, p, d = sys.argv[1:5]
try:
    j = json.load(open(f))
except Exception as e:
    print(i, p, d, 'ERR', e); sys.exit()
if 'error' in j:
    print(i, p, d, 'ERR', j['error'].get('message', '')[:120]); sys.exit()
a = j['lighthouseResult']['audits']; s = j['lighthouseResult']['categories']['performance']['score']
v = lambda k: a[k].get('displayValue', '').replace(' ', ' ')
print(i, p, d, round(s * 100), 'fcp', v('first-contentful-paint'), 'lcp', v('largest-contentful-paint'),
      'tbt', v('total-blocking-time'), 'cls', v('cumulative-layout-shift'), 'si', v('speed-index'))
EOF
    done
  done
  el=$(( $(date +%s) - t0 ))
  [ "$i" -lt "$N" ] && [ "$el" -lt "$GAP" ] && sleep $(( GAP - el ))
done
echo DONE
