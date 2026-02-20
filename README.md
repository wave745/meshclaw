# MeshClaw 🦞🔗

Offline-first, community-scale AI agent mesh. Forked/extended from OpenClaw to enable resilient P2P swarms that work without internet.

## Status
- Phase 1 (Neighbors Mode): libp2p + mDNS + GossipSub + basic UI dashboard ✓
- Next: Distributed memory sync + agent delegation

## Getting Started
1. Install dependencies: `pnpm install`
2. Run gateway: `pnpm gateway:watch`
3. Join the mesh: Use the Mesh tab in the Control UI.

## Security & Protocol
See [mesh-protocol.md](docs/mesh-protocol.md) and [security.md](docs/security.md) for details.
