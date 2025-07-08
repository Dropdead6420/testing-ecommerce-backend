const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
const cookieParser = require("cookie-parser");

const app = express();

// 1. Secure HTTP headers : Adds several security-related HTTP headers to your responses.
app.use(helmet());

// 2. Body parser + limit payload size
app.use(express.json({ limit: "30kb" }));
app.use(cookieParser());

// 3. Sanitize request body (NoSQL injection & XSS)
app.use(mongoSanitize());       // Protects MongoDB queries from being manipulated.
app.use(xssClean());            // Sanitizes user input to remove malicious HTML/JS code.
app.use(hpp());                 // Ensures query params are not duplicated maliciously.

// 4. Rate limiter (100 requests per 15 min per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
});
app.use("/api", limiter);       // Apply to all /api routes

// 5. CORS — Allow only specific domains
const allowedOrigins = [
    "https://ecommerce-backend-hexbytes.vercel.app",        // Production backend
    "https://ecommerce-admin-hexbytes.vercel.app",          // Product Admin (Frontend)
    "https://ecommerce-frontend-hexbytes.vercel.app",       // Production Customer (frontend)
    "http://localhost:3000",                                // Development frontend
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

// Health check
app.get("/", (req, res) => {
    return res.status(200).json({ message: "E-Commerce website", Status: true });
})

// 6. Swagger docs (Disable in prod)
if (process.env.NODE_ENV !== 'production') {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

const authRouter = require("./modules/auth/auth.route.js");
app.use("/auth", authRouter);

const adminRouter = require("./modules/admin/admin.route.js");
app.use("/api/admin", adminRouter);

const categoryRouter = require("./modules/category/category.route.js");
app.use("/api/category", categoryRouter);

const roleRouter = require("./modules/role/role.route.js")
app.use('/api/role', roleRouter);

const userRouter = require("./modules/user/user.route.js");
app.use("/api/user", userRouter);

const productRouter = require("./modules/product/product.route.js");
app.use("/api/product", productRouter);

const addressRouter = require("./modules/address/address.route.js");
app.use("/api/address", addressRouter);

const cartRouter = require("./modules/cart/cart.route.js");
app.use("/api/cart", cartRouter);

const orderRouter = require("./modules/order/order.route.js");
app.use("/api/orders", orderRouter);

const adminOrderRouter = require("./modules/order/adminOrder.route.js");
app.use("/api/admin/orders", adminOrderRouter);

const reviewRouter = require("./modules/review/review.route.js");
app.use("/api/reviews", reviewRouter);

const wishlistRouter = require("./modules/wishlist/wishlist.route.js");
app.use("/api/wishlist", wishlistRouter);

const dashboardRouter = require("./modules/dashboard/dashboard.route.js");
app.use("/api/admin/dashboard", dashboardRouter);

// Global Error Handler (must come after all routes)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log only in case of server error
    if (statusCode === 500) {
        console.error("Unhandled Error : ", err);
    }

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Something went wrong on the server. Please try again later."
            : err.message,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

module.exports = app;
