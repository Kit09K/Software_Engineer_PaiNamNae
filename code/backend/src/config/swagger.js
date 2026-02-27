const swaggerJsdoc = require('swagger-jsdoc');
const packageJson = require('../../package.json');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Painamnae API',
            version: packageJson.version,
            description: 'API for ride sharing (users, drivers, vehicles, routes, bookings) and Admin System Logs for compliance.',
        },
        // เพิ่ม Tags เพื่อจัดหมวดหมู่ API ในหน้า Swagger UI ให้สวยงามและหาง่าย
        tags: [
            {
                name: 'Admin Logs',
                description: 'API endpoints for viewing, filtering, exporting, and managing system logs (Admin only)',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Path to the API docs
    apis: ['./src/routes/*.js', './src/docs/*.js'],
    // apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;