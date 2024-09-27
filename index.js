import express from 'express';
import client from 'prom-client';
import { uploadFiles } from './service.js';

const app = express();

function bootstrap() {
    // Create a Registry and collect default metrics
    const register = new client.Registry();
    client.collectDefaultMetrics({ register });

    // Define the HTTP requests counter
    const httpRequestsTotal = new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'handler', 'status']
    });

    // Middleware to count requests
    app.use((req, res, next) => {
        res.on('finish', () => {
            const route = req.route && req.route.path ? req.route.path : req.path; // Ensure req.path is used as fallback
            httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
        });
        next();
    });

    // Expose metrics endpoint
    app.get('/metrics', async (req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        } catch (err) {
            res.status(500).end(err);
        }
    });

    // File upload endpoint
    app.post('/', async (req, res) => {
        try {
            const id = await uploadFiles(req.body);
            res.status(200).json({ id });
        } catch (err) {
            res.status(500).json({ error: 'Failed to upload file' });
        }
    });

    // Start server
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

bootstrap();
