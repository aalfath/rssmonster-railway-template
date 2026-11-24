#!/bin/sh
# Railway start script for the RSSMonster crawl worker (fetches feeds on a schedule).
set -eu

export NODE_ENV=production
export DB_DIALECT=mysql
export INFERENCE_AI_ENABLED=false
export SKIP_ARTICLE_CLASSIFICATION_ANALYSIS=true
export SKIP_ARTICLE_EMBEDDINGS=true
export SKIP_SEMANTIC_LABELING=true
export CRAWL_WORKER_HEALTH_FILE="${CRAWL_WORKER_HEALTH_FILE:-/tmp/rssmonster-crawl-worker-health.json}"

if [ -z "${NODE_OPTIONS:-}" ]; then
  limit=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo max)
  if [ "$limit" != "max" ] && [ -n "$limit" ]; then
    heap=$((limit / 1048576 * 60 / 100))
    [ "$heap" -lt 128 ] && heap=128
    [ "$heap" -gt 2048 ] && heap=2048
    export NODE_OPTIONS="--max-old-space-size=$heap"
  fi
fi

# The web service runs the database migrations. Wait until it reports healthy
# (database tables ready) before crawling; give up after 10 minutes so Railway restarts us.
if [ -n "${APP_HEALTH_URL:-}" ]; then
  i=0
  until wget -q -T 5 -O /dev/null "$APP_HEALTH_URL" 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -ge 120 ]; then
      echo "[railway] The web service was not healthy after 10 minutes; exiting." >&2
      exit 1
    fi
    [ $((i % 6)) -eq 1 ] && echo "[railway] Waiting for the web service ($APP_HEALTH_URL)..."
    sleep 5
  done
  echo "[railway] Web service is healthy; starting the crawl worker."
fi

run() {
  # Run Node as a child of this shell so signals reach it, and make any unexpected
  # stop exit non-zero: Railway's ON_FAILURE restart policy only restarts failed exits.
  term=0
  "$@" &
  pid=$!
  trap 'term=1; kill -TERM "$pid" 2>/dev/null' TERM INT
  rc=0
  wait "$pid" || rc=$?
  while kill -0 "$pid" 2>/dev/null; do rc=0; wait "$pid" || rc=$?; done
  if [ "$term" = 0 ] && [ "$rc" = 0 ]; then
    echo "[railway] $1 exited unexpectedly with status 0; exiting 1 so Railway restarts the service." >&2
    rc=1
  fi
  echo "[railway] Process exited with status $rc." >&2
  exit "$rc"
}

run node src/workers/crawlWorker.js
