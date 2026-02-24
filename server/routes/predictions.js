const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's predictions
router.get('/user', authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, r.name as race_name, r.location, r.race_date, r.is_completed
     FROM predictions p
     JOIN races r ON p.race_id = r.id
     WHERE p.user_id = ?
     ORDER BY r.race_date ASC`,
    [req.user.id],
    (err, predictions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(predictions);
    }
  );
});

// Submit prediction
router.post('/', authenticateToken, (req, res) => {
  const { race_id, driver1, driver2, driver3, position1, position2, position3 } = req.body;

  if (!race_id || !driver1 || !driver2 || !driver3 || !position1 || !position2 || !position3) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if race is already completed
  db.get('SELECT is_completed FROM races WHERE id = ?', [race_id], (err, race) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    if (race.is_completed) {
      return res.status(400).json({ error: 'Cannot submit prediction for completed race' });
    }

    // Insert or update prediction
    db.run(
      `INSERT INTO predictions (user_id, race_id, driver1, driver2, driver3, position1, position2, position3)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, race_id) DO UPDATE SET
         driver1 = excluded.driver1,
         driver2 = excluded.driver2,
         driver3 = excluded.driver3,
         position1 = excluded.position1,
         position2 = excluded.position2,
         position3 = excluded.position3`,
      [req.user.id, race_id, driver1, driver2, driver3, position1, position2, position3],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error saving prediction' });
        }
        res.json({ message: 'Prediction saved successfully' });
      }
    );
  });
});

module.exports = router;
