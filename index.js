import express from 'express';
import client from 'prom-client';
import { uploadFiles } from './service.js';
const app = express();
const Counter = client.Counter;

function bootstrap() {
    // Create a Registry and collect default metrics
    const register = new client.Registry();
    client.collectDefaultMetrics({ register });

    const httpRequestsTotal = new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'handler', 'status']
    });

    app.use((req, res, next) => {
        res.on('finish', () => {
            httpRequestsTotal.labels(req.method, req.route ? req.route.path : req.path, res.statusCode).inc();
        });
        next();
    });

    // Expose metrics endpoint
    app.get('/metrics', async (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    });

    app.post('/', async (req, res) => {
        const id = await uploadFiles(req.body)
        res.json({ id }).status(200)
    })

    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
bootstrap()

