# MeshClaw Protocol Specification (v0.1.0)

## Overview

MeshClaw uses a decentralized P2P protocol built on `libp2p` for offline agent collaboration. The protocol focuses on discovery, resilient communication, and shared intelligence.

## Message Types

### 1. Discovery (`discovery`)

Nodes broadcast their presence and capabilities to neighbors.

- **Node ID**: Unique UUID for the node.
- **Name**: Human-readable name (e.g., "Pi-Kitchen").
- **Capabilities**: List of services (e.g., "camera", "llm", "lora-relay").

### 2. Broadcast (`broadcast`)

Encrypted messages sent to a specific channel within the mesh.

- **Channel**: Topic identifier (e.g., "chat", "alerts").
- **Sender**: Node ID of the sender.
- **Content**: Encrypted or cleartext payload.
- **Signature**: Ed25519 signature for authenticity.

### 3. Delegate (`delegate`)

Assigning sub-tasks from one agent to another.

- **Task ID**: Unique identifier for the transaction.
- **Task Description**: Natural language or structured plan.
- **Requester/Assignee**: Peer IDs involved.

### 4. Memory Sync (`memory-sync`)

CRDT-based synchronization of shared vector stores or state.

- **Doc ID**: Identifier for the shared memory space.
- **Delta**: Binary delta (Yjs/Automerge).

## Security

- **Transport**: Noise protocol via `libp2p`.
- **Identity**: Ed25519 key pairs.
- **Trust**: Web-of-trust based pairing (QR codes/Invites).

## Transports

- **LAN**: mDNS + TCP/WebRTC.
- **Bluetooth**: BLE Mesh (Relay nodes).
- **Long-range**: LoRa (Dragino/Meshtastic).
