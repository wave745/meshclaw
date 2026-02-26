import WebSocket from 'ws';

const url = 'ws://127.0.0.1:18795';

async function monitorEvents() {
    console.log(`Connecting to Gateway at ${url}...`);
    const ws = new WebSocket(url);

    ws.on('open', () => {
        console.log('Connected to Gateway. Authenticating...');
        ws.send(JSON.stringify({
            type: 'req',
            id: 'auth',
            method: 'connect',
            params: {
                minProtocol: 1,
                maxProtocol: 1,
                client: { id: 'test', version: '0.1.0', platform: 'node', mode: 'test' },
                auth: { token: process.env.GATEWAY_TOKEN || 'YOUR_SECURE_TOKEN' }
            }
        }));
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('Received Message:', JSON.stringify(msg, null, 2));

        if (msg.type === 'event' || msg.method === 'mesh:event') {
            console.log('--> Mesh Event detected');
        } else if (msg.id === 'auth') {
            if (msg.ok) {
                console.log('Authenticated. Waiting for events...');
            } else {
                console.error('Authentication failed:', msg.error);
            }
        }
    });

    ws.on('error', (err) => console.error('WS Error:', err));
}

monitorEvents();
