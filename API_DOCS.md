# DrinkBrewy API Documentation

## Swagger UI Access

The complete interactive API documentation is now available at:

**🔗 http://localhost:5000/api-docs**

## Documentation Coverage

### 1. Catalog Sync APIs (Public - Shiprocket Integration)
- **GET** `/api/catalog/products` - Fetch all products with pagination
- **GET** `/api/catalog/collections` - Fetch all collections with pagination
- **GET** `/api/catalog/collections/{collection_id}/products` - Fetch products by collection

### 2. Webhook APIs (Shiprocket Integration)
- **POST** `/api/shiprocket-webhooks/product` - Product update webhook (HMAC secured)
- **POST** `/api/shiprocket-webhooks/collection` - Collection update webhook (HMAC secured)

### 3. Checkout APIs
- **POST** `/api/checkout/generate-token` - Generate Shiprocket Checkout access token

### 4. System APIs
- **GET** `/health` - Server health check

## Features

✅ **Interactive Testing**: Try out APIs directly from the browser  
✅ **Complete Schemas**: Full request/response models documented  
✅ **Security Definitions**: HMAC and JWT authentication documented  
✅ **Request Examples**: Pre-filled examples for all endpoints  
✅ **Response Codes**: All possible response codes documented

## Security Schemes

### API Key Authentication (`ApiKeyAuth`)
- Header: `X-Api-Key`
- Used for: Webhook endpoints

### HMAC Authentication (`HMACAuth`)
- Header: `X-Api-HMAC-SHA256`
- Used for: Webhook payload verification

### Bearer Token (`BearerAuth`)
- Header: `Authorization: Bearer <token>`
- Used for: Admin endpoints

## Quick Start

1. Navigate to http://localhost:5000/api-docs
2. Browse available endpoints organized by tags
3. Click on any endpoint to expand its documentation
4. Use "Try it out" to test endpoints directly
5. View request/response schemas and examples

## Deployment

When deploying to production, update the server URL in `src/config/swagger.ts`:

```typescript
servers: [
  {
    url: 'https://api.yourdomain.com',
    description: 'Production server'
  }
]
```

## Screenshots

View the Swagger UI in action:

![Swagger Documentation](file:///C:/Users/varun/.gemini/antigravity/brain/bc8417fd-1bf7-4666-bf9c-af28394631aa/swagger_docs_expanded_1764523990679.png)

## Maintenance

To add new API documentation:

1. Add JSDoc comments above route handlers using `@swagger` annotations
2. Define schemas in `src/config/swagger.ts` if needed
3. Follow the existing format for consistency
4. Restart the server to see changes

## Related Files

- Configuration: `src/config/swagger.ts`
- Route Documentation: `src/routes/*.ts` (JSDoc comments)
- Server Integration: `src/server.ts`
