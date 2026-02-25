import WebSocket from 'ws';

const url = 'ws://127.0.0.1:18795';

async function testRpc() {
    console.log(`Connecting to Gateway at ${url}...`);
    const ws = new WebSocket(url);

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 15000);

        ws.on('open', () => {
            console.log('Connected to Gateway. Sending connect request...');

            // First, authenticate with full ConnectParams
            ws.send(JSON.stringify({
                type: 'req',
                id: 'auth',
                method: 'connect',
                params: {
                    minProtocol: 1,
                    maxProtocol: 1,
                    client: {
                        id: 'test',
                        version: '0.1.0',
                        platform: 'node',
                        mode: 'test'
                    },
                    auth: {
                        token: 'fd60f4631d88d44b074597731937944b2bfa98189329d213'
                    }
                }
            }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            console.log('Received:', JSON.stringify(msg, null, 2));

            // If we receive hello-ok, we are authenticated
            if (msg.event === 'hello-ok' || (msg.id === 'auth' && msg.ok)) {
                console.log('Authenticated successfully. Sending mesh requests...');

                // 1. Test mesh:peers
                ws.send(JSON.stringify({
                    type: 'req',
                    id: 'peers-req',
                    method: 'mesh:peers',
                    params: {}
                }));

                // 2. Test mesh:query
                ws.send(JSON.stringify({
                    type: 'req',
                    id: 'query-req',
                    method: 'mesh:query',
                    params: { key: 'note1' }
                }));
            }

            if (msg.id === 'query-req') {
                console.log('Test complete logic reached.');
                clearTimeout(timeout);
                ws.close();
                resolve(true);
            }
        });

        ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

testRpc().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
