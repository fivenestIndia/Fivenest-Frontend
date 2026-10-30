import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import paymentRoutes from "./routes/payment.js";
import licenseRoutes from "./routes/license.js";
import agentRoutes from "./routes/agent.js";
import ordersRoutes from "./routes/orders.js";
import sizesRoutes from "./routes/sizes.js";
import adminRoutes from "./routes/admin.js";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Trust reverse proxy (e.g. Render, Cloudflare)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Let frontend handle CSP
  crossOriginEmbedderPolicy: false,
}));

// Configure CORS - Allow localhost, custom domain, and Vercel domains
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "https://www.fivenest.in",
  "https://fivenest.in",
  "https://jersey-canvas-pro.vercel.app",
  "https://fivenest-design-studio.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        (origin && (origin.endsWith('.fivenest.in') || origin === 'https://fivenest.in')) ||
        (process.env.NODE_ENV !== 'production' && origin && origin.startsWith("http://localhost:"))
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Capture raw body for signature verification (Crucial for Razorpay webhook verification) and allow large image base64 payloads up to 50mb
app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Express urlencoded parser
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Stricter for payment/auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait and try again.' }
});

const agentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI agent rate limit exceeded. Please wait.' }
});

app.use('/api/', apiLimiter);
app.use('/api/payment/', authLimiter);
app.use('/api/agent/', agentLimiter);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Register API Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/sizes", sizesRoutes);

// Custom Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
