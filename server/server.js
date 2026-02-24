const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const racesRoutes = require('./routes/races');
const predictionsRoutes = require('./routes/predictions');
const resultsRoutes = require('./routes/results');
const leaderboardRoutes = require('./routes/leaderboard');

// Initialize database
require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/races', racesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
