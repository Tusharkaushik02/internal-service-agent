const Ticket = require('../models/Ticket');

// Priority sort order: urgent > high > medium > low
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/**
 * Generate the next human-readable ticket ID (TCK-1001, TCK-1002, ...)
 * Finds the highest existing ticketId number and increments.
 * @returns {Promise<string>}
 */
const generateTicketId = async () => {
  const last = await Ticket.findOne({}, { ticketId: 1 }).sort({ createdAt: -1 });

  if (!last || !last.ticketId) {
    return 'TCK-1001';
  }

  const num = parseInt(last.ticketId.replace('TCK-', ''), 10);
  return `TCK-${num + 1}`;
};

/**
 * Create a new ticket.
 * @param {Object} data
 * @returns {Promise<Ticket>}
 */
const createTicket = async (data) => {
  const ticketId = await generateTicketId();
  const ticket = new Ticket({ ...data, ticketId });
  return await ticket.save();
};

/**
 * Get all tickets with optional filters.
 * Filters: status, priority, assignedTo
 * Sorted by: priority (urgent first), then createdAt (oldest first = first in queue)
 * @param {Object} filters
 * @returns {Promise<Ticket[]>}
 */
const getAllTickets = async (filters = {}) => {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;

  const tickets = await Ticket.find(query)
    .populate('employeeRequestId', 'employeeName employeeId email department')
    .sort({ createdAt: 1 });

  // Secondary sort by priority weight (in-memory for simplicity)
  tickets.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return tickets;
};

/** Return queued tickets in priority order, with oldest first when tied. */
const getTicketQueue = async () => getAllTickets({ status: 'queued' });

/**
 * Get a single ticket by MongoDB _id or ticketId string (e.g. TCK-1001)
 * @param {string} id
 * @returns {Promise<Ticket|null>}
 */
const getTicketById = async (id) => {
  // Support lookup by ticketId string (TCK-XXXX) OR MongoDB ObjectId
  const isTicketId = id.startsWith('TCK-');
  const query = isTicketId ? { ticketId: id } : { _id: id };
  return await Ticket.findOne(query).populate('employeeRequestId');
};

/**
 * Update ticket fields.
 * Allowed: status, priority, assignedTo, description
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Ticket|null>}
 */
const updateTicket = async (id, updates) => {
  const allowedFields = ['status', 'priority', 'assignedTo', 'description'];
  const safeUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  const isTicketId = typeof id === 'string' && id.startsWith('TCK-');
  const query = isTicketId ? { ticketId: id } : { _id: id };

  return await Ticket.findOneAndUpdate(query, safeUpdates, {
    new: true,
    runValidators: true,
  });
};

/**
 * Assign a ticket to a support agent.
 * Also transitions status to 'assigned' if currently queued/open.
 * @param {string} id
 * @param {string} assignedTo
 * @returns {Promise<Ticket|null>}
 */
const assignTicket = async (id, assignedTo) => {
  const isTicketId = typeof id === 'string' && id.startsWith('TCK-');
  const query = isTicketId ? { ticketId: id } : { _id: id };

  const ticket = await Ticket.findOne(query);
  if (!ticket) return null;

  ticket.assignedTo = assignedTo;
  if (ticket.status === 'open' || ticket.status === 'queued') {
    ticket.status = 'assigned';
  }

  return await ticket.save();
};

/**
 * Update only the status of a ticket.
 * @param {string} id
 * @param {string} status
 * @returns {Promise<Ticket|null>}
 */
const updateTicketStatus = async (id, status) => {
  const isTicketId = typeof id === 'string' && id.startsWith('TCK-');
  const query = isTicketId ? { ticketId: id } : { _id: id };

  return await Ticket.findOneAndUpdate(
    query,
    { status },
    { new: true, runValidators: true }
  );
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
