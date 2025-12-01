import dotenv from "dotenv";
// Load environment variables before other imports
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { connectDatabase } from "./config/database";
import swaggerSpec from "./config/swagger";

// Import routes
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import adminRoutes from "./routes/admin";
import paymentRoutes from "./routes/payment";
import shipmentRoutes from "./routes/shipment";
import fasterCheckoutRoutes from "./routes/faster-checkout";
import checkoutRoutes from "./routes/checkout";
import catalogRoutes from "./routes/catalog";
import shiprocketWebhooksRoutes from "./routes/shiprocket-webhooks";
import collectionRoutes from "./routes/collections";

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true, // Allow all origins in development
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api/", limiter);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect to database
connectDatabase();

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check endpoint
 *     description: Returns server health status and uptime information
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 */

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DrinkBrewy API Documentation'
}));

// API routes
app.use("/api/products", productRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/shipment", shipmentRoutes);
app.use("/api/faster-checkout", fasterCheckoutRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/shiprocket-webhooks", shiprocketWebhooksRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🍹 DrinkBrewy Backend Server                        ║
║                                                       ║
║   Server running on port: ${PORT}                    ║
║   Environment: ${process.env.NODE_ENV || "development"}                   ║
║   MongoDB: ${process.env.MONGODB_URI ? "✅ Connected" : "⚠️  Not configured"}             ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

export default app;
