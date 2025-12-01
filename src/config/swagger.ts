import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DrinkBrewy API Documentation',
            version: '1.0.0',
            description: 'Complete API documentation for DrinkBrewy backend including Shiprocket catalog sync, webhooks, and checkout integration',
            contact: {
                name: 'DrinkBrewy Support',
                email: 'support@drinkbrewy.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            },
            {
                url: 'https://api.drinkbrewy.com',
                description: 'Production server'
            }
        ],
        tags: [
            {
                name: 'Catalog Sync',
                description: 'Public APIs for Shiprocket catalog synchronization'
            },
            {
                name: 'Webhooks',
                description: 'Webhook endpoints for real-time catalog updates from Shiprocket'
            },
            {
                name: 'Checkout',
                description: 'Checkout and payment integration endpoints'
            },
            {
                name: 'Products',
                description: 'Product management endpoints'
            },
            {
                name: 'Collections',
                description: 'Collection management endpoints'
            },
            {
                name: 'Orders',
                description: 'Order management endpoints'
            },
            {
                name: 'Admin',
                description: 'Admin authentication and management'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for admin authentication'
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Api-Key',
                    description: 'Shiprocket API Key for webhook authentication'
                },
                HMACAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Api-HMAC-SHA256',
                    description: 'HMAC-SHA256 signature for webhook payload verification'
                }
            },
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'prod_grape' },
                        name: { type: 'string', example: 'Grape Brewy' },
                        flavor: { type: 'string', example: 'Grape' },
                        price: { type: 'number', example: 199 },
                        description: { type: 'string', example: 'Juicy grape goodness' },
                        handle: { type: 'string', example: 'grape-brewy' },
                        images: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['/products/grape.jpg']
                        },
                        stock: { type: 'number', example: 100 },
                        availableForSale: { type: 'boolean', example: true },
                        variants: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' },
                                    price: { type: 'number' },
                                    availableForSale: { type: 'boolean' },
                                    sku: { type: 'string' }
                                }
                            }
                        },
                        dimensions: {
                            type: 'object',
                            properties: {
                                length: { type: 'number', example: 10 },
                                breadth: { type: 'number', example: 10 },
                                height: { type: 'number', example: 10 },
                                weight: { type: 'number', example: 0.5 }
                            }
                        }
                    }
                },
                ShiprocketProduct: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'prod_grape' },
                        title: { type: 'string', example: 'Grape Brewy' },
                        body_html: { type: 'string', example: 'Juicy grape goodness' },
                        vendor: { type: 'string', example: 'DrinkBrewy' },
                        product_type: { type: 'string', example: 'Grape' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['active', 'draft'], example: 'active' },
                        variants: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' },
                                    price: { type: 'string', example: '199.00' },
                                    quantity: { type: 'number', example: 100 },
                                    sku: { type: 'string' },
                                    updated_at: { type: 'string', format: 'date-time' },
                                    image: {
                                        type: 'object',
                                        properties: {
                                            src: { type: 'string', example: '/products/grape.jpg' }
                                        }
                                    },
                                    weight: { type: 'number', example: 0.5 }
                                }
                            }
                        },
                        image: {
                            type: 'object',
                            properties: {
                                src: { type: 'string', example: '/products/grape.jpg' }
                            }
                        }
                    }
                },
                Collection: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'coll_citrus' },
                        name: { type: 'string', example: 'Citrus Collection' },
                        handle: { type: 'string', example: 'citrus-collection' },
                        description: { type: 'string', example: 'Refreshing citrus flavors' },
                        productIds: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['prod_lemon_lime', 'prod_orange']
                        },
                        image: { type: 'string', example: '/collections/citrus.jpg' }
                    }
                },
                ShiprocketCollection: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'coll_citrus' },
                        updated_at: { type: 'string', format: 'date-time' },
                        title: { type: 'string', example: 'Citrus Collection' },
                        body_html: { type: 'string', example: 'Refreshing citrus flavors' },
                        image: {
                            type: 'object',
                            properties: {
                                src: { type: 'string', example: '/collections/citrus.jpg' }
                            }
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 100 },
                        total: { type: 'number', example: 250 },
                        totalPages: { type: 'number', example: 3 }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/server.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
