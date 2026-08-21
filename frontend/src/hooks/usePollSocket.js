import { useEffect, useRef, useState } from 'react';

const realtimeUrl =
    import.meta.env.VITE_REALTIME_URL ?? 'ws://127.0.0.1:8081';

export function usePollSocket(pollId, onResultsUpdated, onReconnect) {
    const [status, setStatus] = useState('connecting');

    const resultsCallbackRef = useRef(onResultsUpdated);
    const reconnectCallbackRef = useRef(onReconnect);

    useEffect(() => {
        resultsCallbackRef.current = onResultsUpdated;
    }, [onResultsUpdated]);

    useEffect(() => {
        reconnectCallbackRef.current = onReconnect;
    }, [onReconnect]);

    useEffect(() => {
        if (!pollId) {
            return undefined;
        }

        let socket;
        let reconnectTimeout;
        let disposed = false;

        const connect = () => {
            setStatus('connecting');

            socket = new WebSocket(realtimeUrl);

            socket.addEventListener('open', () => {
                setStatus('connected');

                socket.send(
                    JSON.stringify({
                        type: 'poll.subscribe',
                        pollId,
                    }),
                );
            });

            socket.addEventListener('message', (event) => {
                let message;

                try {
                    message = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (
                    message.type === 'poll.results.updated'
                    && message.pollId === Number(pollId)
                ) {
                    resultsCallbackRef.current?.(message.results);
                }
            });

            socket.addEventListener('close', () => {
                if (disposed) {
                    return;
                }

                setStatus('reconnecting');

                reconnectTimeout = window.setTimeout(async () => {
                    await reconnectCallbackRef.current?.();
                    connect();
                }, 1500);
            });

            socket.addEventListener('error', () => {
                socket.close();
            });
        };

        connect();

        return () => {
            disposed = true;
            window.clearTimeout(reconnectTimeout);
            socket?.close();
        };
    }, [pollId]);

    return status;
}