import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:3001');

ws.on('open', () => {
    console.log('Connected to Rust bridge');

    // 1. Send Query
    console.log('Sending query: note1');
    ws.send('query:note1');

    // 2. Send MemorySync
    setTimeout(() => {
        const syncMsg = {
            type: 'memory-sync',
            doc_id: 'note1',
            delta: [72, 101, 108, 108, 111], // "Hello"
            version: Math.floor(Date.now() / 1000)
        };
        console.log('Sending memory sync:', JSON.stringify(syncMsg));
        ws.send(JSON.stringify(syncMsg));
    }, 1000);

    // 3. Send Broadcast
    setTimeout(() => {
        const broadcastMsg = {
            type: 'broadcast',
            channel: 'mesh:broadcast',
            sender: 'gateway-test',
            content: 'Hello Mesh!',
            timestamp: Date.now()
        };
        console.log('Sending broadcast:', JSON.stringify(broadcastMsg));
        ws.send(JSON.stringify(broadcastMsg));
    }, 2000);
});

ws.on('message', (data) => {
    console.log('Received from bridge:', data.toString());
});

ws.on('error', (err) => {
    console.error('WS Error:', err.message);
});

setTimeout(() => {
    console.log('Test finished, closing.');
    ws.close();
    process.exit(0);
}, 5000);
