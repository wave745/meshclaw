import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = 'ws://127.0.0.1:3001';

export function useMeshClient() {
    const [peers, setPeers] = useState<string[]>([]);
    const [memoryKeys, setMemoryKeys] = useState<string[]>([]);
    const [sharedMemory, setSharedMemory] = useState<Record<string, string>>({});
    const [events, setEvents] = useState<string[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const requestIdRef = useRef(1);
    const callbacksRef = useRef(new Map<number, (result: any) => void>());

    const sendRpc = useCallback((method: string, params: any, callback: (result: any) => void) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const id = requestIdRef.current++;
        callbacksRef.current.set(id, callback);

        ws.send(JSON.stringify({
            id,
            method,
            params
        }));
    }, []);

    const refreshMemory = useCallback(() => {
        sendRpc('mesh:keys', {}, (keys) => {
            if (Array.isArray(keys)) {
                setMemoryKeys(keys);
                keys.forEach(key => {
                    sendRpc('mesh:query', { key }, (val) => {
                        setSharedMemory(prev => ({ ...prev, [key]: val }));
                    });
                });
            }
        });
    }, [sendRpc]);

    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        wsRef.current = socket;

        socket.onopen = () => {
            console.log('Connected to Rust core');
            sendRpc('mesh:peers', {}, (result) => {
                if (Array.isArray(result)) setPeers(result);
            });
            refreshMemory();
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.id) {
                    const cb = callbacksRef.current.get(data.id);
                    if (cb) {
                        cb(data.result ?? data);
                        callbacksRef.current.delete(data.id);
                    }
                } else {
                    const payload = data.method === 'mesh:event' ? data.params : data;
                    setEvents((prev) => [...prev.slice(-49), `${new Date().toLocaleTimeString()}: ${JSON.stringify(payload)}`]);

                    if (payload.type === 'discovery') {
                        setPeers((prev) => [...new Set([...prev, payload.nodeId])]);
                    }
                    if (payload.type === 'memory-sync') {
                        refreshMemory();
                    }
                }
            } catch (err) {
                console.error('Failed to parse WS message:', err);
            }
        };

        socket.onerror = (err) => console.error('WS error:', err);
        socket.onclose = () => console.log('WS closed');

        return () => {
            socket.close();
            wsRef.current = null;
        };
    }, [sendRpc, refreshMemory]);

    const setSharedValue = useCallback((key: string, value: string) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({
            type: "knowledge-update",
            key,
            value
        }));
    }, []);

    const delegateTask = useCallback((target: string = 'any', description: string = 'Automated task') => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({
            type: "delegate",
            taskId: 'task-' + Math.random().toString(36).substr(2, 9),
            taskDesc: description,
            requesterId: 'dashboard-ui',
            assigneeId: target,
            payload: {},
            timestamp: Date.now()
        }));
    }, []);

    return { peers, sharedText, events, sendUpdate, delegateTask };
}
