const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db"); // DB connection file
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ================== Middleware ==================
// Enable CORS for all routes
app.use((req, res, next) => {
  // Allow all origins (you might want to restrict this in production)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Enable JSON body parsing
app.use(express.json());

// If you send URL-encoded data
app.use(express.urlencoded({ extended: true }));

// ================== Connect to Database ==================
connectDB();

// ================== Routes ==================
// API Routes
const hotelRoutes = require("./routes/hotelRoutes");
const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const roomRoutes = require("./routes/roomRoutes");
const guestRoutes = require("./routes/guestRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

// Import PynBooking routes
const pynbookingRoutes = require('./routes/pynbookingRoutes');

// Apply Routes
app.use("/api/hotels", hotelRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/pynbooking", pynbookingRoutes);
app.use("/api/dashboard", hotelRoutes); // Dashboard route
// Additional routes
const staffRoutes = require('./routes/staffRoutes');
const roomServiceRoutes = require("./routes/roomServiceRoutes");
const technicalIssueRoutes = require("./routes/technicalIssueRoutes");
const roomControlRoutes = require("./routes/roomControlRoutes");
const roomTemperatureRoutes = require("./routes/roomTemperatureRoutes");
const dndRoutes = require("./routes/doNotDisturbRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const languageRoutes = require("./routes/languageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Apply additional routes
app.use('/api/staff', staffRoutes);
// Apply additional routes with consistent naming
app.use("/api/room-services", roomServiceRoutes);
app.use("/api/technical-issues", technicalIssueRoutes);
app.use("/api/room-controls", roomControlRoutes);
app.use("/api/room-temperatures", roomTemperatureRoutes);
app.use("/api/do-not-disturb", dndRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/notifications", notificationRoutes);

// Admin routes
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ================== Start Weather Scheduler ==================
const { startWeatherScheduler } = require("./controllers/roomController");
startWeatherScheduler();

// ================== Error Handling ==================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ================== Start Server ==================
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});

// Add other routes here...

// ================== Error Handling Middleware ==================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// ================== Start Server ==================
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

module.exports = app; // For testing
