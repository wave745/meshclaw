# MeshClaw Security Model

## Zero-Trust Architecture

MeshClaw assumes all neighboring nodes are untrusted until explicitly paired.

### 1. Peer Pairing

- **QR Codes**: Encrypting a temporary pairing secret.
- **Invites**: Short-lived out-of-band tokens.
- **ACLs**: Once paired, nodes are assigned to access groups (e.g., "Family", "Community", "Admin").

### 2. Encryption

- **End-to-End**: All mesh traffic is encrypted using the Noise protocol.
- **Signing**: Messages are signed with the node's private key (Ed25519).

### 3. Data Sovereignty

- **Local Vectors**: LLM memory (LanceDB) stays on the device unless explicitly synced to a trusted peer.
- **Audit Logs**: Every mesh action is logged locally and signed, providing a tamper-proof trail.

### 4. Safety Switches

- **lsolate Mode**: `mesh isolate` disconnects all mesh transports immediately.
- **Kill Switch**: Remote revocation of pairing if a node is compromised.

## Threat Mitigations

- **Sybil Attacks**: Rate-limiting discovery and requiring pairing.
- **Eavesdropping**: Mandatory Noise encryption on all transports.
- **Replay Attacks**: Sequence numbers and timestamps on all signed messages.
