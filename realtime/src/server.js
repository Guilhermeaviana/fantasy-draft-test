import 'dotenv/config';

import http from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

const host = process.env.REALTIME_HOST ?? '127.0.0.1';
const port = Number(process.env.REALTIME_PORT ?? 8081);
const internalSecret = process.env.REALTIME_INTERNAL_SECRET ?? '';

const subscriptions = new Map();

function sendJson(socket, payload) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
    }
}

function subscribeToPoll(socket, pollId) {
    if (!subscriptions.has(pollId)) {
        subscriptions.set(pollId, new Set());
    }

    subscriptions.get(pollId).add(socket);
    socket.pollSubscriptions.add(pollId);
}

function unsubscribeFromAllPolls(socket) {
    for (const pollId of socket.pollSubscriptions) {
        const sockets = subscriptions.get(pollId);

        if (!sockets) {
            continue;
        }

        sockets.delete(socket);

        if (sockets.size === 0) {
            subscriptions.delete(pollId);
        }
    }

    socket.pollSubscriptions.clear();
}

function broadcastToPoll(pollId, payload) {
    const sockets = subscriptions.get(pollId);

    if (!sockets) {
        return;
    }

    for (const socket of sockets) {
        sendJson(socket, payload);
    }
}

function handleClientMessage(socket, rawMessage) {
    let message;

    try {
        message = JSON.parse(rawMessage.toString());
    } catch {
        sendJson(socket, {
            type: 'error',
            code: 'invalid_json',
        });

        return;
    }

    if (message.type !== 'poll.subscribe') {
        sendJson(socket, {
            type: 'error',
            code: 'unsupported_message',
        });

        return;
    }

    const pollId = Number(message.pollId);

    if (!Number.isInteger(pollId) || pollId <= 0) {
        sendJson(socket, {
            type: 'error',
            code: 'invalid_poll_id',
        });

        return;
    }

    subscribeToPoll(socket, pollId);

    sendJson(socket, {
        type: 'poll.subscribed',
        pollId,
    });
}

function isAuthorizedInternalRequest(request) {
    if (!internalSecret) {
        return true;
    }

    return request.headers['x-internal-secret'] === internalSecret;
}

async function readJsonBody(request) {
    const chunks = [];

    for await (const chunk of request) {
        chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString('utf8');

    return JSON.parse(body);
}

const server = http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
        response.writeHead(200, {
            'Content-Type': 'application/json',
        });

        response.end(JSON.stringify({
            status: 'ok',
        }));

        return;
    }

    const resultMatch = request.url?.match(
        /^\/internal\/polls\/(\d+)\/results-updated$/,
    );

    if (request.method === 'POST' && resultMatch) {
        if (!isAuthorizedInternalRequest(request)) {
            response.writeHead(401, {
                'Content-Type': 'application/json',
            });

            response.end(JSON.stringify({
                message: 'Unauthorized',
            }));

            return;
        }

        try {
            const pollId = Number(resultMatch[1]);
            const results = await readJsonBody(request);

            broadcastToPoll(pollId, {
                type: 'poll.results.updated',
                pollId,
                results,
            });

            response.writeHead(204);
            response.end();
        } catch {
            response.writeHead(400, {
                'Content-Type': 'application/json',
            });

            response.end(JSON.stringify({
                message: 'Invalid JSON payload',
            }));
        }

        return;
    }

    response.writeHead(404, {
        'Content-Type': 'application/json',
    });

    response.end(JSON.stringify({
        message: 'Not found',
    }));
});

const webSocketServer = new WebSocketServer({
    server,
});

webSocketServer.on('connection', (socket) => {
    socket.isAlive = true;
    socket.pollSubscriptions = new Set();

    socket.on('pong', () => {
        socket.isAlive = true;
    });

    socket.on('message', (message) => {
        handleClientMessage(socket, message);
    });

    socket.on('close', () => {
        unsubscribeFromAllPolls(socket);
    });
});

const heartbeat = setInterval(() => {
    for (const socket of webSocketServer.clients) {
        if (!socket.isAlive) {
            socket.terminate();
            continue;
        }

        socket.isAlive = false;
        socket.ping();
    }
}, 30_000);

server.listen(port, host, () => {
    console.log(`Realtime server running at ws://${host}:${port}`);
});

function shutdown() {
    clearInterval(heartbeat);

    for (const socket of webSocketServer.clients) {
        socket.close();
    }

    webSocketServer.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);