const express = require('express');
const db = require('../database');

const router = express.Router();

// Get leaderboard
router.get('/', (req, res) => {
  db.all(
    `SELECT 
       u.username,
       SUM(p.total_points) as total_points,
       SUM(p.race_points) as race_points,
       SUM(p.quali_points) as quali_points,
       SUM(p.sprint_points) as sprint_points,
       COUNT(DISTINCT p.race_id) as races_predicted
     FROM users u
     LEFT JOIN predictions p ON u.id = p.user_id
     WHERE u.is_admin = 0
     GROUP BY u.id, u.username
     ORDER BY total_points DESC, races_predicted DESC`,
    [],
    (err, leaderboard) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(leaderboard);
    }
  );
});

module.exports = router;
