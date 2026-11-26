#!/bin/sh
# Run a command under a hard memory and time cap (macOS ignores ulimit -v, and
# node's --max-old-space-size does not bound happy-dom's native memory).
# Kills the whole process group if total RSS passes MAX_RSS_MB or it runs past MAX_SECONDS.
# Usage: tests/run-capped.sh <command> [args...]
MAX_RSS_MB=${MAX_RSS_MB:-1024}
MAX_SECONDS=${MAX_SECONDS:-60}

set -m                      # job control: the command gets its own process group
"$@" &
pid=$!
start=$(date +%s)

while kill -0 "$pid" 2>/dev/null; do
  rss_kb=$(ps -o rss= -g "$pid" 2>/dev/null | awk '{s+=$1} END {print s+0}')
  elapsed=$(( $(date +%s) - start ))
  if [ "$rss_kb" -gt $((MAX_RSS_MB * 1024)) ]; then
    echo "run-capped: killed, memory ${rss_kb} KB > ${MAX_RSS_MB} MB" >&2
    kill -9 -- "-$pid" 2>/dev/null; wait "$pid" 2>/dev/null; exit 137
  fi
  if [ "$elapsed" -gt "$MAX_SECONDS" ]; then
    echo "run-capped: killed, ran over ${MAX_SECONDS} s" >&2
    kill -9 -- "-$pid" 2>/dev/null; wait "$pid" 2>/dev/null; exit 124
  fi
  sleep 0.1
done
wait "$pid"
