const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ route: 'service-requests' });
});

module.exports = router;
