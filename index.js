import express from 'express';
import client from 'prom-client';
import { uploadFiles } from './service.js';
const app = express();


function bootstrap() {
    // Create a Registry and collect default metrics
    const register = new client.Registry();
    client.collectDefaultMetrics({ register });

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

