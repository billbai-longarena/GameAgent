import { createServer, Server as HttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initWebSocket } from './lib/websocket/server'; // 路径相对于 src

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer: HttpServer = createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the last argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            if (!req.url) {
                // Fallback for undefined req.url, though this should ideally not happen with a valid HTTP request
                console.error('Request URL is undefined. Sending 400.');
                res.statusCode = 400;
                res.end('Bad Request: URL is undefined');
                return;
            }
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // 初始化 WebSocket 服务器
    // initWebSocket 函数期望一个 HttpServer 实例
    initWebSocket(httpServer);

    httpServer
        .once('error', (err) => {
            console.error('HTTP Server Error:', err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> WebSocket server initialized and listening on the same port.`);
        });
});
