const ticketService = require('../services/ticket.service');

const REQUIRED_FIELDS = [
  'employeeRequestId',
  'title',
  'description',
  'category',
  'priority',
];

/**
 * POST /api/tickets
 * Manually creates a ticket linked to an employee request.
 */
const createTicket = async (req, res, next) => {
  try {
    const missing = REQUIRED_FIELDS.filter((f) => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    const ticket = await ticketService.createTicket(req.body);
    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tickets
 * Returns the ticket queue sorted by priority, then creation time.
 * Supports ?status, ?priority, ?assignedTo filters.
 */
const getAllTickets = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const tickets = await ticketService.getAllTickets({
      status,
      priority,
      assignedTo,
    });

    return res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

const getTicketQueue = async (req, res, next) => {
  try {
    const tickets = await ticketService.getTicketQueue();
    return res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tickets/:id
 * Supports both MongoDB _id and TCK-XXXX ticketId.
 */
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    return res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id
 * General update for status, priority, assignedTo, description.
 */
const updateTicket = async (req, res, next) => {
  try {
    const updated = await ticketService.updateTicket(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/assign
 * Body: { assignedTo: "support_admin_1" }
 */
const assignTicket = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo is required',
      });
    }

    const ticket = await ticketService.assignTicket(req.params.id, assignedTo);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    return res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/status
 * Body: { status: "in_progress" }
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      });
    }

    const ticket = await ticketService.updateTicketStatus(req.params.id, status);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    return res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketQueue,
  getTicketById,
  updateTicket,
  assignTicket,
  updateTicketStatus,
};
