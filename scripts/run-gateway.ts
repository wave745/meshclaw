import { startGatewayServer } from '../src/gateway/server.impl.ts';

const port = parseInt(process.env.PORT || '18795', 10);
console.log(`Starting Gateway on port ${port}...`);

try {
    await startGatewayServer(port);
    console.log('Gateway started successfully.');
} catch (err) {
    console.error('Failed to start Gateway:', err);
    process.exit(1);
}
