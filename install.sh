#!/usr/bin/env bash
echo "🦞 MeshClaw: Installing Sovereign AI Infrastructure..."

# Check for Cargo
if ! command -v cargo &> /dev/null
then
    echo "Error: Cargo not found. Please install Rust first: https://rustup.rs"
    exit 1
fi

# Install Rust core
echo "🦀 Building Rust core daemon..."
cargo install --path packages/core-rust

echo "✅ MeshClaw core installed! Run 'meshclaw-core' to start the local node."
echo "💡 Recommended: Install Ollama (https://ollama.com) and run 'ollama run llama3' for local inference."
echo "🔗 To start the dashboard UI: cd packages/dashboard && npm install && npm run dev"
