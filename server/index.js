import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import paymentRoutes from "./routes/payment.js";
import licenseRoutes from "./routes/license.js";
import agentRoutes from "./routes/agent.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Configure CORS - Allow localhost, custom domain, and Vercel domains
const allowedOrigins = [
  "http://localhost:5173", // default vite port
  "http://localhost:8080", // vite production preview port
  "http://localhost:3000",
  "https://www.fivenest.in",
  "https://fivenest.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app")
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

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Register API Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/agent", agentRoutes);

// Custom Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
