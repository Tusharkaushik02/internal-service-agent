const express = require('express');
const router = express.Router();
const {
  createTicket,
  getAllTickets,
  getTicketQueue,
  getTicketById,
  updateTicket,
  assignTicket,
  updateTicketStatus,
} = require('../controllers/ticket.controller');

// POST /api/tickets — Create ticket manually
router.post('/', createTicket);

// GET /api/tickets — List ticket queue (supports ?status, ?priority, ?assignedTo)
router.get('/', getAllTickets);

router.get('/queue', getTicketQueue);

// GET /api/tickets/:id — Get single ticket (by _id or TCK-XXXX)
router.get('/:id', getTicketById);

// PATCH /api/tickets/:id/assign — Assign ticket to agent (must be before /:id)
router.patch('/:id/assign', assignTicket);

// PATCH /api/tickets/:id/status — Update ticket status
router.patch('/:id/status', updateTicketStatus);

// PATCH /api/tickets/:id — General update
router.patch('/:id', updateTicket);

module.exports = router;
