#!/bin/sh
# Railway start script for the RSSMonster web service.
set -eu

export NODE_ENV=production
export PORT="${PORT:-3000}"
export DB_DIALECT=mysql
export INFERENCE_AI_ENABLED=false
export SKIP_ARTICLE_CLASSIFICATION_ANALYSIS=true
export SKIP_ARTICLE_EMBEDDINGS=true
export SKIP_SEMANTIC_LABELING=true
# Railway's edge reaches the app from these ranges; trust them for X-Forwarded-*.
export TRUST_PROXY="${TRUST_PROXY:-loopback, 100.64.0.0/10, 152.233.0.0/16}"

# Size the V8 heap from the service's memory limit (about 60%, 128-2048 MB).
if [ -z "${NODE_OPTIONS:-}" ]; then
  limit=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo max)
  if [ "$limit" != "max" ] && [ -n "$limit" ]; then
    heap=$((limit / 1048576 * 60 / 100))
    [ "$heap" -lt 128 ] && heap=128
    [ "$heap" -gt 2048 ] && heap=2048
    export NODE_OPTIONS="--max-old-space-size=$heap"
  fi
fi

# Wait for MySQL, run migrations under a lock, create the admin. Any failure stops the service.
node railway-prepare.mjs

exec node bootstrap.js
