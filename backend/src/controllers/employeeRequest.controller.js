const employeeRequestService = require('../services/employeeRequest.service');
const ticketService = require('../services/ticket.service');
const { searchKnowledgeBase } = require('../services/rag.service');

// Required fields for creating a request
const REQUIRED_FIELDS = [
  'employeeName',
  'employeeId',
  'email',
  'department',
  'requestType',
  'subject',
  'description',
];

/**
 * POST /api/employee-requests
 * Creates an employee request and automatically creates a ticket.
 */
const createRequest = async (req, res, next) => {
  try {
    // Validate required fields
    const missing = REQUIRED_FIELDS.filter((f) => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Create the employee request
    const request = await employeeRequestService.createRequest(req.body);

    // RAG assistance is best-effort and must not block operational persistence.
    const rag = await searchKnowledgeBase(
      `${request.subject}\n${request.description}`
    );

    // Automatically create a linked ticket and add it to the queue
    const ticket = await ticketService.createTicket({
      employeeRequestId: request._id,
      title: request.subject,
      description: request.description,
      category: request.requestType,
      priority: request.priority || 'medium',
      status: 'queued',
      knowledgeReferences: rag.results.map((document) => ({
        documentId: String(document.id),
        title: String(document.title),
        category: String(document.category),
      })),
    });

    return res.status(201).json({
      success: true,
      data: {
        request,
        ticket,
        ragAvailable: rag.available,
        knowledge: rag.results,
      },
    });
  } catch (error) {
    next(error);
  }
};

const assistRequest = async (req, res, next) => {
  try {
    const request = await employeeRequestService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Employee request not found',
      });
    }

    const rag = await searchKnowledgeBase(`${request.subject}\n${request.description}`);
    return res.json({
      success: true,
      request,
      knowledge: rag.results,
      ragAvailable: rag.available,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee-requests
 * Returns all requests with optional ?status, ?priority, ?department, ?requestType filters.
 */
const getAllRequests = async (req, res, next) => {
  try {
    const { status, priority, department, requestType } = req.query;
    const requests = await employeeRequestService.getAllRequests({
      status,
      priority,
      department,
      requestType,
    });

    return res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee-requests/:id
 */
const getRequestById = async (req, res, next) => {
  try {
    const request = await employeeRequestService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Employee request not found',
      });
    }
    return res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/employee-requests/:id
 * Updates priority, status, description, or subject.
 */
const updateRequest = async (req, res, next) => {
  try {
    const updated = await employeeRequestService.updateRequest(
      req.params.id,
      req.body
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Employee request not found',
      });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  assistRequest,
};
