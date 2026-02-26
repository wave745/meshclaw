# MeshClaw — The Neighborhood Brain 🦞🔗

Offline-first P2P collective intelligence layer for autonomous AI agents.
Resilient P2P swarms that work anywhere — no internet, no central server.

---

## 🌌 The Vision

Traditional AI agents are tethered to the cloud. **MeshClaw** breaks that tether. 

We are building a "Neighborhood Brain": a mesh of local nodes that share memory via CRDTs, discover each other without configuration via mDNS, and delegate tasks based on local capability. It’s not just an agent platform; it’s a resilient infrastructure for the next generation of distributed AI.

## 🏗️ Technical Architecture

MeshClaw has been re-architected from the ground up to favor **Safety**, **Speed**, and **Sovereignty**.

### 🦀 The Core (Rust)
The engine is a high-performance Rust daemon (`packages/core-rust`) handling the heavy lifting:
- **Networking:** `libp2p` 0.56 stack with TCP/QUIC transports, noise encryption, and yamux multiplexing.
- **Discovery:** Zero-config mDNS for local networks and Kademlia DHT for wider mesh discovery.
- **Synchronization:** `yrs` (Rust Yjs) CRDTs for conflict-free shared memory across peers.
- **Messaging:** `GossipSub` for efficient delta-broadcasting.
- **Storage:** Local vector persistence via `sled` / `lancedb` for RAG-at-the-edge.

### 🖥️ The Interface (TypeScript/Tauri)
A premium dashboard providing:
- **Mesh Topology:** Real-time visualization of peer connections and health.
- **Knowledge Graph:** Visual view of the shared CRDT memory state.
- **Agent Command:** High-level interface to inject goals into the mesh.

---

## ️ Developer Quickstart

To run a MeshClaw node locally from the source:

```bash
# Clone the repository
git clone https://github.com/wave745/meshclaw.git
cd meshclaw

# Run the Rust Core
cd packages/core-rust
cargo run
```

Running multiple instances on the same network will show them automatically discovering each other and synchronizing the "Neighborhood Brain" memory.

## ⚙️ Configuration

MeshClaw uses environment variables for configuration. See `.env.example` for a complete list.

- `MESHCLAW_STATE_DIR`: Directory for local storage (default: `./.meshclaw`)
- `MESHCLAW_BRIDGE_PORT`: WS port for the Rust-to-Gateway bridge (default: `3001`)
- `OPENCLAW_CONFIG_PATH`: Path to gateway configuration file
- `RUST_LOG`: Log level for the Rust core (e.g., `info`, `debug`)

## 🧪 Testing

To test a multi-node mesh locally:

```bash
# Start two Rust nodes and a gateway automatically
./scripts/test-multi-node.sh
```

---

---

## ⚖️ License
MIT - Created by the MeshClaw Collective.
