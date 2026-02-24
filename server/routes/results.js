const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Submit race results (admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { race_id, position1, position2, position3 } = req.body;

  if (!race_id || !position1 || !position2 || !position3) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Insert or update results
  db.run(
    `INSERT INTO results (race_id, position1, position2, position3)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(race_id) DO UPDATE SET
       position1 = excluded.position1,
       position2 = excluded.position2,
       position3 = excluded.position3`,
    [race_id, position1, position2, position3],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error saving results' });
      }

      // Mark race as completed
      db.run('UPDATE races SET is_completed = 1 WHERE id = ?', [race_id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating race status' });
        }

        // Calculate points for all predictions
        calculatePoints(race_id, position1, position2, position3, () => {
          res.json({ message: 'Results saved and points calculated' });
        });
      });
    }
  );
});

// Get results for a race
router.get('/:race_id', (req, res) => {
  const { race_id } = req.params;

  db.get(
    'SELECT * FROM results WHERE race_id = ?',
    [race_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!result) {
        return res.status(404).json({ error: 'Results not found' });
      }
      res.json(result);
    }
  );
});

// Calculate points for predictions
function calculatePoints(race_id, actualPos1, actualPos2, actualPos3, callback) {
  db.all(
    'SELECT * FROM predictions WHERE race_id = ?',
    [race_id],
    (err, predictions) => {
      if (err || !predictions) {
        console.error('Error fetching predictions for points calculation:', err);
        return callback();
      }

      let updateCount = 0;
      const totalPredictions = predictions.length;

      if (totalPredictions === 0) {
        return callback();
      }

      predictions.forEach((pred) => {
        let points = 0;

        // Points system:
        // - Correct driver in selected 3: 1 point each
        // - Correct position: 3 points each
        // - All 3 positions correct: bonus 5 points

        const selectedDrivers = [pred.driver1, pred.driver2, pred.driver3];
        const actualDrivers = [actualPos1, actualPos2, actualPos3];
        const predictedPositions = [pred.position1, pred.position2, pred.position3];

        // Check if each selected driver finished in top 3
        selectedDrivers.forEach((driver) => {
          if (actualDrivers.includes(driver)) {
            points += 1;
          }
        });

        // Check exact position matches
        let exactMatches = 0;
        if (predictedPositions[0] === actualPos1) {
          points += 3;
          exactMatches++;
        }
        if (predictedPositions[1] === actualPos2) {
          points += 3;
          exactMatches++;
        }
        if (predictedPositions[2] === actualPos3) {
          points += 3;
          exactMatches++;
        }

        // Bonus for all positions correct
        if (exactMatches === 3) {
          points += 5;
        }

        // Update points
        db.run(
          'UPDATE predictions SET points = ? WHERE id = ?',
          [points, pred.id],
          (err) => {
            if (err) {
              console.error(`Error updating points for prediction ${pred.id}:`, err);
            }
            updateCount++;
            if (updateCount === totalPredictions) {
              callback();
            }
          }
        );
      });
    }
  );
}

module.exports = router;
