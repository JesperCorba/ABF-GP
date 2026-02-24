const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all races
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM races ORDER BY race_date ASC',
    [],
    (err, races) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(races);
    }
  );
});

// Create race (admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { name, location, race_date } = req.body;

  if (!name || !location || !race_date) {
    return res.status(400).json({ error: 'Name, location, and race_date are required' });
  }

  db.run(
    'INSERT INTO races (name, location, race_date) VALUES (?, ?, ?)',
    [name, location, race_date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating race' });
      }
      res.json({ id: this.lastID, message: 'Race created successfully' });
    }
  );
});

// Delete race (admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM races WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting race' });
    }
    res.json({ message: 'Race deleted successfully' });
  });
});

module.exports = router;
