const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { connectDB } = require('./db');
const authMiddleware = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');
const { fetchWeatherAndUpdateDB } = require('./routes/User/roomRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use('/Image', express.static('Image'));

// -------------------- DATABASE CONNECTION --------------------
connectDB()
  .then(() => {
    console.log('✅ DB Connected');

    // Start periodic weather updates
    fetchWeatherAndUpdateDB().catch(console.error);
    setInterval(() => fetchWeatherAndUpdateDB().catch(console.error), 15 * 60 * 1000);
  })
  .catch(err => console.error('❌ DB connection failed:', err));

// -------------------- USER ROUTES --------------------
const authRoutes = require('./routes/User/auth');
const roomRoutes = require('./routes/User/roomRoutes');

app.use('/api/auth', authRoutes); // user login/register
app.use('/api/room', authMiddleware, roomRoutes); // all /room/* routes protected
app.use('/api/room/cleanService', authMiddleware, require('./routes/User/cleanServiceRoutes'));
app.use('/api/room/tech-issue', authMiddleware, require('./routes/User/techIssueRoutes'));
app.use('/api/room/feedback', authMiddleware, require('./routes/User/feedbackRoutes'));


// -------------------- ADMIN ROUTES --------------------
app.use('/api/admin/auth', require('./routes/Admin/auth')); // admin login
app.use('/api/admin/dashboard', adminAuth, require('./routes/Admin/dashboard'));
app.use('/api/admin/rooms', adminAuth, require('./routes/Admin/rooms'));
app.use('/api/admin/guests', adminAuth, require('./routes/Admin/guests'));

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something broke!' });
});

// -------------------- SERVER START --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
