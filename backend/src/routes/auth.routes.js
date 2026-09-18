const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ route: 'auth' });
});

module.exports = router;
