# ABF-GP - Formula 1 Grand Prix Predictions

A web application where users can register and predict the outcomes of Formula 1 races throughout the season.

## Features

- **User Registration & Authentication**: Users can create accounts and login securely
- **Race Predictions**: For each race weekend, users can:
  - Pick 3 drivers they think will finish in the top 3
  - Predict the exact finishing order (1st, 2nd, 3rd place)
- **Points System**: After race results are entered, points are awarded based on:
  - 1 point for each driver selected that finishes in top 3
  - 3 points for each exact position match
  - 5 bonus points for predicting all 3 positions correctly
- **Leaderboard**: View rankings of all users based on their total points
- **Admin Panel**: Administrators can:
  - Create new races
  - Enter race results
  - Delete races
  - View all predictions

## Installation

1. Clone the repository:
```bash
git clone https://github.com/JesperCorba/ABF-GP.git
cd ABF-GP
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Default Admin Account

- **Username**: admin
- **Password**: admin123

**Important**: Change the admin password after first login!

## Usage

### For Users:
1. Register a new account or login
2. View upcoming races on the home page
3. Click "Make Prediction" to submit your predictions for a race
4. View your predictions and points in "My Predictions"
5. Check your ranking in the "Leaderboard"

### For Admins:
1. Login with admin credentials
2. Navigate to the "Admin" panel
3. Create new races with name, location, and date
4. After a race completes, click "Enter Results" to input the top 3 finishers
5. Points are automatically calculated for all users

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Authentication**: JWT with bcryptjs
- **Frontend**: Vanilla JavaScript (SPA)
- **Styling**: Custom CSS inspired by ABF Research theme

## Styling

The application uses a professional color scheme inspired by ABF Research:
- Primary color: #003d5c (Deep blue)
- Secondary color: #00a8e8 (Bright blue)
- Accent color: #ff6b35 (Orange)

## Project Structure

```
ABF-GP/
├── server/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Authentication middleware
│   ├── database.js      # Database setup and initialization
│   └── server.js        # Express server configuration
├── public/
│   ├── css/
│   │   └── style.css    # Application styles
│   ├── js/
│   │   └── app.js       # Frontend application logic
│   └── index.html       # Main HTML file
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Races
- `GET /api/races` - Get all races
- `POST /api/races` - Create race (admin only)
- `DELETE /api/races/:id` - Delete race (admin only)

### Predictions
- `GET /api/predictions/user` - Get user's predictions
- `POST /api/predictions` - Submit prediction

### Results
- `POST /api/results` - Submit race results (admin only)
- `GET /api/results/:race_id` - Get race results

### Leaderboard
- `GET /api/leaderboard` - Get user rankings

## License

ISC

## Security Notes

This is a demonstration application. For production deployment, consider:

1. **Rate Limiting**: Add rate limiting to prevent abuse (e.g., using `express-rate-limit`)
2. **CSRF Protection**: Implement CSRF tokens for cookie-based authentication (e.g., using `csurf`)
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: Add more comprehensive input validation
5. **SQL Injection**: While using parameterized queries, consider an ORM for additional safety
6. **Session Management**: Implement session timeouts and refresh tokens
7. **Logging**: Add comprehensive security logging and monitoring