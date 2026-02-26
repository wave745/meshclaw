import { useState } from 'react';
import { useMeshClient } from './lib/meshClient';

function App() {
  const { peers, memoryKeys, sharedMemory, events, setSharedValue, delegateTask } = useMeshClient();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  return (
    <div style={{
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#38bdf8', fontWeight: 800, letterSpacing: '-0.025em' }}>MeshClaw 🦞</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Neighborhood Brain — Sovereign P2P Intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', border: '1px solid #334155', color: '#38bdf8' }}>
            ● {peers.length} Nodes Online
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 350px', gap: '24px', alignItems: 'start' }}>
        {/* LEFT COLUMN: PEERS & DISCOVERY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginTop: 1, marginBottom: '16px' }}>
              Swarm Nodes
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {peers.length === 0 ? (
                <li style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Scanning for proximal agents...</li>
              ) : (
                peers.map((p) => (
                  <li key={p} style={{
                    fontSize: '12px',
                    padding: '10px 0',
                    borderBottom: '1px solid #334155',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    {p.substring(0, 16)}...
                  </li>
                ))
              )}
            </ul>
          </section>

          <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginTop: 0, marginBottom: '16px' }}>
              Task Routing
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => delegateTask('any', 'General task for any neighbor')}
                style={{ width: '100%', padding: '12px', backgroundColor: '#0ea5e9', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                Gossip Broadcast
              </button>

              <button
                onClick={() => delegateTask('cap:llm:llama3', 'Summarize collective notes')}
                style={{ width: '100%', padding: '12px', backgroundColor: '#8b5cf6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                DHT Route: Llama3
              </button>

              <button
                onClick={() => delegateTask('cap:tool:websearch', 'Find external knowledge')}
                style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                DHT Route: Search
              </button>
            </div>
          </section>
        </div>

        {/* CENTER COLUMN: KNOWLEDGE BASE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', marginTop: 0, marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              Collective Brain (Shared Memory)
              <span style={{ fontSize: '11px', color: '#64748b' }}>Yrs CRDT Sync</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {memoryKeys.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#64748b', border: '2px dashed #334155', borderRadius: '8px' }}>
                  Knowledge base empty. Inject a thought to begin.
                </div>
              ) : (
                memoryKeys.map(key => (
                  <div key={key} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px', fontFamily: 'monospace' }}>{key}</div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {sharedMemory[key] || 'Synchronizing...'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Memory Key (e.g. goal_1)"
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Infect the mesh with intelligence..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '13px', minHeight: '100px', marginBottom: '16px', resize: 'vertical', outline: 'none', lineHeight: '1.5' }}
              />
              <button
                onClick={() => { if (newKey && newValue) { setSharedValue(newKey, newValue); setNewKey(''); setNewValue(''); } }}
                style={{ width: '100%', padding: '14px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#334155'}
              >
                Commit to Collective Brain
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: EVENTS */}
        <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', height: 'fit-content' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginTop: 0, marginBottom: '16px' }}>
            Intelligence Feed
          </h2>
          <div style={{ maxHeight: '700px', overflowY: 'auto', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
            {events.length === 0 ? (
              <div style={{ fontStyle: 'italic', padding: '12px' }}>Waiting for mesh signals...</div>
            ) : (
              events.map((e, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #334155', wordBreak: 'break-all', lineHeight: '1.4' }}>
                  <span style={{ color: '#38bdf8' }}>[{new Date().toLocaleTimeString()}]</span> {e}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
