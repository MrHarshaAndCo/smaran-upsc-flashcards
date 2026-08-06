#!/bin/sh
# Smaran benchmark harness.
#
# Deterministic, offline workload: installs deps (only when missing), builds
# the app, then runs the review-pipeline benchmark plus production SSR and
# build-size measurements. Prints `METRIC name=value` lines; exit 0 on
# success, non-zero on any failure.
#
# POSIX sh on purpose: this machine routes `bash` to a WSL shim that has no
# distro installed, so the harness must run under plain `sh` (Git Bash).
set -eu
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "[harness] installing dependencies..." >&2
  npm ci --no-audit --no-fund >/dev/null
fi

echo "[harness] building..." >&2
npm run build >/dev/null

echo "[harness] benchmarking..." >&2
node bench/bench.mjs
