import express from 'express';
import client from 'prom-client';
import mongoose from 'mongoose';


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test')
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err)
        process.exit(1);
    });

// Define a simple schema for a collection
const fileSchema = new mongoose.Schema({
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
});

const FileModel = mongoose.model('File', fileSchema);
const app = express();

// Move counter definition here to ensure it is only created once

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests'
});

client.collectDefaultMetrics({ timeout: 5000 });

async function bootstrap() {
    // Create a Registry and collect default metrics

    // Middleware to count requests
    app.use(express.json());

    app.use((req, res, next) => {
        const now = Date.now();
        res.on('finish', () => {
            httpRequestsTotal.inc();
            console.log(`HTTP ${req.method} ${route} ${res.statusCode} ${Date.now() - now}ms`);
        });
        next();
    });

    // Expose metrics endpoint
    app.get('/metrics', async (req, res) => {
        try {
            res.set('Content-Type', client.register.contentType);
            res.end(await client.register.metrics());
        } catch (err) {
            res.status(500).end(err);
        }
    });

    // Simulate file upload, data processing, and database interaction
    app.post('/', async (req, res) => {
        try {
            const fileData = { filename: `file-${Date.now()}`, size: Date.now() };

            if (!fileData.filename || !fileData.size) {
                throw new Error('Invalid file data');
            }

            const fileDoc = new FileModel({
                filename: fileData.filename,
                size: fileData.size,
            });
            await fileDoc.save();

            const recentFiles = await FileModel.find().sort({ uploadedAt: -1 }).limit(5);

            res.status(200).json({
                message: 'File uploaded successfully',
                fileId: fileDoc._id.toString(),
                recentFiles: recentFiles
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

bootstrap();