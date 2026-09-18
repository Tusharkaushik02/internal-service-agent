const EmployeeRequest = require('../models/EmployeeRequest');

/**
 * Create a new employee request.
 * @param {Object} data - Request body data
 * @returns {Promise<EmployeeRequest>}
 */
const createRequest = async (data) => {
  const request = new EmployeeRequest(data);
  return await request.save();
};

/**
 * Get all employee requests with optional filters.
 * Supported filters: status, priority, department, requestType
 * @param {Object} filters - Query params
 * @returns {Promise<EmployeeRequest[]>}
 */
const getAllRequests = async (filters = {}) => {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.department) query.department = filters.department;
  if (filters.requestType) query.requestType = filters.requestType;

  return await EmployeeRequest.find(query).sort({ createdAt: -1 });
};

/**
 * Get a single employee request by MongoDB _id.
 * @param {string} id
 * @returns {Promise<EmployeeRequest|null>}
 */
const getRequestById = async (id) => {
  return await EmployeeRequest.findById(id);
};

/**
 * Update an employee request by _id.
 * Only allows updating: priority, status, description, subject
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<EmployeeRequest|null>}
 */
const updateRequest = async (id, updates) => {
  const allowedFields = ['priority', 'status', 'description', 'subject'];
  const safeUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  return await EmployeeRequest.findByIdAndUpdate(id, safeUpdates, {
    new: true,
    runValidators: true,
  });
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
};
