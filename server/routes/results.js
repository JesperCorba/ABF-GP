const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// F1 Points system
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

// Submit race results (admin only)
router.post('/race', authenticateToken, isAdmin, (req, res) => {
  const { race_id, positions } = req.body;

  if (!race_id || !positions || positions.length !== 10) {
    return res.status(400).json({ error: 'Race ID and top 10 positions are required' });
  }

  // Insert or update results
  db.run(
    `INSERT INTO race_results (race_id, position1, position2, position3, position4, position5, position6, position7, position8, position9, position10)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(race_id) DO UPDATE SET
       position1 = excluded.position1,
       position2 = excluded.position2,
       position3 = excluded.position3,
       position4 = excluded.position4,
       position5 = excluded.position5,
       position6 = excluded.position6,
       position7 = excluded.position7,
       position8 = excluded.position8,
       position9 = excluded.position9,
       position10 = excluded.position10`,
    positions,
    function(err) {
      if (err) {
        console.error('Error saving race results:', err);
        return res.status(500).json({ error: 'Error saving results' });
      }

      // Mark race as completed
      db.run('UPDATE races SET is_completed = 1 WHERE id = ?', [race_id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating race status' });
        }

        // Calculate points for all predictions
        calculateRacePoints(race_id, positions, () => {
          res.json({ message: 'Race results saved and points calculated' });
        });
      });
    }
  );
});

// Submit qualifying results (admin only)
router.post('/qualifying', authenticateToken, isAdmin, (req, res) => {
  const { race_id, position1, position2, position3 } = req.body;

  if (!race_id || !position1 || !position2 || !position3) {
    return res.status(400).json({ error: 'Race ID and top 3 positions are required' });
  }

  // Insert or update qualifying results
  db.run(
    `INSERT INTO quali_results (race_id, position1, position2, position3)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(race_id) DO UPDATE SET
       position1 = excluded.position1,
       position2 = excluded.position2,
       position3 = excluded.position3`,
    [race_id, position1, position2, position3],
    function(err) {
      if (err) {
        console.error('Error saving qualifying results:', err);
        return res.status(500).json({ error: 'Error saving qualifying results' });
      }

      // Mark qualifying as completed
      db.run('UPDATE races SET quali_completed = 1 WHERE id = ?', [race_id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating race status' });
        }

        // Calculate qualifying points
        calculateQualiPoints(race_id, position1, position2, position3, () => {
          res.json({ message: 'Qualifying results saved and points calculated' });
        });
      });
    }
  );
});

// Submit sprint results (admin only)
router.post('/sprint', authenticateToken, isAdmin, (req, res) => {
  const { race_id, positions } = req.body;

  if (!race_id || !positions || positions.length !== 8) {
    return res.status(400).json({ error: 'Race ID and top 8 positions are required' });
  }

  // Insert or update sprint results
  db.run(
    `INSERT INTO sprint_results (race_id, position1, position2, position3, position4, position5, position6, position7, position8)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(race_id) DO UPDATE SET
       position1 = excluded.position1,
       position2 = excluded.position2,
       position3 = excluded.position3,
       position4 = excluded.position4,
       position5 = excluded.position5,
       position6 = excluded.position6,
       position7 = excluded.position7,
       position8 = excluded.position8`,
    positions,
    function(err) {
      if (err) {
        console.error('Error saving sprint results:', err);
        return res.status(500).json({ error: 'Error saving sprint results' });
      }

      // Mark sprint as completed
      db.run('UPDATE races SET sprint_completed = 1 WHERE id = ?', [race_id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating race status' });
        }

        // Calculate sprint points
        calculateSprintPoints(race_id, positions, () => {
          res.json({ message: 'Sprint results saved and points calculated' });
        });
      });
    }
  );
});

// Get race results
router.get('/race/:race_id', (req, res) => {
  const { race_id } = req.params;

  db.get(
    'SELECT * FROM race_results WHERE race_id = ?',
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

// Get qualifying results
router.get('/qualifying/:race_id', (req, res) => {
  const { race_id } = req.params;

  db.get(
    'SELECT * FROM quali_results WHERE race_id = ?',
    [race_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!result) {
        return res.status(404).json({ error: 'Qualifying results not found' });
      }
      res.json(result);
    }
  );
});

// Calculate race points for all predictions
function calculateRacePoints(race_id, racePositions, callback) {
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

        // User's selected team
        const selectedDrivers = [pred.driver1, pred.driver2, pred.driver3, pred.driver4];

        // Calculate points based on F1 system
        // If any of user's drivers finish in top 10, they get those F1 points
        racePositions.forEach((driver, index) => {
          if (selectedDrivers.includes(driver)) {
            points += F1_POINTS[index];
          }
        });

        // Update race points and total
        db.run(
          `UPDATE predictions 
           SET race_points = ?,
               total_points = race_points + quali_points + sprint_points
           WHERE id = ?`,
          [points, pred.id],
          (err) => {
            if (err) {
              console.error(`Error updating race points for prediction ${pred.id}:`, err);
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

// Calculate qualifying points
function calculateQualiPoints(race_id, pos1, pos2, pos3, callback) {
  db.all(
    'SELECT * FROM predictions WHERE race_id = ?',
    [race_id],
    (err, predictions) => {
      if (err || !predictions) {
        console.error('Error fetching predictions for quali points:', err);
        return callback();
      }

      let updateCount = 0;
      const totalPredictions = predictions.length;

      if (totalPredictions === 0) {
        return callback();
      }

      predictions.forEach((pred) => {
        let points = 0;

        // Award points for exact qualifying position matches
        if (pred.quali_pos1 === pos1) points += 3;
        if (pred.quali_pos2 === pos2) points += 2;
        if (pred.quali_pos3 === pos3) points += 1;

        // Update quali points and total
        db.run(
          `UPDATE predictions 
           SET quali_points = ?,
               total_points = race_points + quali_points + sprint_points
           WHERE id = ?`,
          [points, pred.id],
          (err) => {
            if (err) {
              console.error(`Error updating quali points for prediction ${pred.id}:`, err);
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

// Calculate sprint points
function calculateSprintPoints(race_id, sprintPositions, callback) {
  db.all(
    'SELECT * FROM predictions WHERE race_id = ?',
    [race_id],
    (err, predictions) => {
      if (err || !predictions) {
        console.error('Error fetching predictions for sprint points:', err);
        return callback();
      }

      let updateCount = 0;
      const totalPredictions = predictions.length;

      if (totalPredictions === 0) {
        return callback();
      }

      predictions.forEach((pred) => {
        let points = 0;

        // User's selected team
        const selectedDrivers = [pred.driver1, pred.driver2, pred.driver3, pred.driver4];

        // Calculate sprint points
        sprintPositions.forEach((driver, index) => {
          if (selectedDrivers.includes(driver)) {
            points += SPRINT_POINTS[index];
          }
        });

        // Update sprint points and total
        db.run(
          `UPDATE predictions 
           SET sprint_points = ?,
               total_points = race_points + quali_points + sprint_points
           WHERE id = ?`,
          [points, pred.id],
          (err) => {
            if (err) {
              console.error(`Error updating sprint points for prediction ${pred.id}:`, err);
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
