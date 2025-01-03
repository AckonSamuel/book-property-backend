"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
// src/config/swagger.ts
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Meeting Scheduler API',
        version: '1.0.0',
        description: 'API documentation for meeting scheduling system',
        contact: {
            name: 'API Support',
            email: 'support@example.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: process.env.API_URL || 'http://localhost:3000/api/v1',
            description: 'Production server'
        },
        {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            Meeting: {
                type: 'object',
                required: ['title', 'date', 'slot_id', 'participant', 'user_id', 'timezone'],
                properties: {
                    id: {
                        type: 'integer',
                        description: 'Meeting ID'
                    },
                    title: {
                        type: 'string',
                        description: 'Meeting title'
                    },
                    date: {
                        type: 'string',
                        format: 'date',
                        description: 'Meeting date'
                    },
                    slot_id: {
                        type: 'integer',
                        description: 'Time slot ID'
                    },
                    participant: {
                        type: 'string',
                        description: 'Participant email or identifier'
                    },
                    user_id: {
                        type: 'string',
                        description: 'Organizer user ID'
                    },
                    timezone: {
                        type: 'string',
                        description: 'Meeting timezone'
                    },
                    description: {
                        type: 'string',
                        description: 'Optional meeting description'
                    }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string'
                    },
                    code: {
                        type: 'string'
                    }
                }
            }
        },
        responses: {
            UnauthorizedError: {
                description: 'Access token is missing or invalid',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Meetings',
            description: 'Meeting management endpoints'
        },
        {
            name: 'Users',
            description: 'User management endpoints'
        }
    ]
};
const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.ts', './src/docs/*.yaml']
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
