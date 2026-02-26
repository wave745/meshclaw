#!/usr/bin/env bash
set -e

# Cleanup on exit
trap "kill 0" EXIT

echo "Starting Rust core 1..."
export MESHCLAW_STATE_DIR=./node1-state 
export MESHCLAW_BRIDGE_PORT=3001
cargo run --package meshclaw-core --release &

sleep 5

echo "Starting Rust core 2..."
export MESHCLAW_STATE_DIR=./node2-state 
export MESHCLAW_BRIDGE_PORT=3002
cargo run --package meshclaw-core --release &

sleep 5

echo "Starting gateway..."
export OPENCLAW_CONFIG_PATH=./openclaw.json 
export PORT=18795
npm run gateway &

echo "All nodes running. Use wscat to query ws://localhost:18795"
wait
