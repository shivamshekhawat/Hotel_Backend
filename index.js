const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db"); // DB connection file
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ================== Middleware ==================

app.use(cors({
  origin: "*", // your frontend
  credentials: true,               // allow cookies/Authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // include OPTIONS
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'ngrok-skip-browser-warning' // allow ngrok custom header
  ]
}));

// Enable JSON body parsing
app.use(express.json());

// If you send URL-encoded data
app.use(express.urlencoded({ extended: true }));

// ================== Connect to Database ==================
connectDB();

// ================== Routes ==================
const hotelRoutes = require("./routes/hotelRoutes");
app.use("/api/hotels", hotelRoutes);

// const authRoutes = require("./routes/authRoutes");
// app.use("/api/auth", authRoutes);

const roomRoutes = require("./routes/roomRoutes");
app.use("/api/rooms", roomRoutes);
app.use("/api/dashboard", hotelRoutes); // Dashboard route

const guestRoutes = require("./routes/guestRoutes");
app.use("/api/guests", guestRoutes);

const reservationRoutes = require("./routes/reservationRoutes");
app.use("/api/reservations", reservationRoutes);

// Staff management routes
const staffRoutes = require('./routes/staffRoutes');
app.use('/api', staffRoutes);

const roomServiceRoutes = require("./routes/roomServiceRoutes");
app.use("/api/roomservices", roomServiceRoutes);

const technicalIssueRoutes = require("./routes/technicalIssueRoutes");
app.use("/api/technicalissues", technicalIssueRoutes);

const roomControlRoutes = require("./routes/roomControlRoutes");
app.use("/api/roomcontrols", roomControlRoutes);

const roomTemperatureRoutes = require("./routes/roomTemperatureRoutes");
app.use("/api/roomtemperatures", roomTemperatureRoutes);

const dndRoutes = require("./routes/doNotDisturbRoutes");
app.use("/api/do-not-disturb", dndRoutes);

const feedbackRoutes = require("./routes/feedbackRoutes");
app.use("/api/feedback", feedbackRoutes);

const languageRoutes = require("./routes/languageRoutes");
app.use("/api/languages", languageRoutes);
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

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
