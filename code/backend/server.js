require("dotenv").config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
const promClient = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middlewares/errorHandler');
const ApiError = require('./src/utils/ApiError')
const { metricsMiddleware } = require('./src/middlewares/metrics');
const ensureAdmin = require('./src/bootstrap/ensureAdmin');
const scheduleHardDelete = require('./src/cron/hard.delete.cron');

const app = express();
promClient.collectDefaultMetrics();

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

console.log('Configuration Loaded:');
console.log('Allowed Origins:', allowedOrigins); // <-- ดูว่าอ่านค่า .env ได้จริงไหม

const corsOptions = {
    origin: (origin, callback) => {
        console.log('Request form Origin:', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`Blocked by CORS! Origin: ${origin}`);
            console.log('Blocked by CORS!'); // <-- ดูว่าติดตรงนี้หรือเปล่า
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// 3. เพิ่มตัวดักจับทุก Request (วางไว้บนสุด ก่อน app.use(cors...))
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // เปิดรับ preflight สำหรับทุก route

app.use(express.json());

//Rate Limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
// });
// app.use(limiter);

//Metrics Middleware
app.use(metricsMiddleware);

// --- Routes ---
// Health Check Route
app.get('/health', async (req, res) => {
    try {
        const prisma = require('./src/utils/prisma');
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(503).json({ status: 'error', detail: err.message });
    }
});

// Prometheus Metrics Route
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// Swagger Documentation Route
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Main API Routes
app.use('/api', routes);

app.use((req, res, next) => {
    next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

// --- Error Handling Middleware ---
app.use(errorHandler);

// --- Start Cron Jobs ---
scheduleHardDelete();

// --- Start Server ---
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        await ensureAdmin();
    } catch (e) {
        console.error('Admin bootstrap failed:', e);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
})();
// Graceful Shutdown
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    process.exit(1);
});
