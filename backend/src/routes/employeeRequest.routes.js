const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  assistRequest,
} = require('../controllers/employeeRequest.controller');

// POST /api/employee-requests — Create request + auto-create ticket
router.post('/', createRequest);

// GET /api/employee-requests — List all requests (supports ?status, ?priority, ?department, ?requestType)
router.get('/', getAllRequests);

router.post('/:id/assist', assistRequest);

// GET /api/employee-requests/:id — Get single request
router.get('/:id', getRequestById);

// PATCH /api/employee-requests/:id — Update request
router.patch('/:id', updateRequest);

module.exports = router;
