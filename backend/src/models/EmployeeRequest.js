const mongoose = require('mongoose');

const employeeRequestSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    requestType: {
      type: String,
      required: [true, 'Request type is required'],
      enum: ['IT', 'HR', 'Finance', 'Admin', 'General'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['submitted', 'in_progress', 'resolved', 'closed'],
      default: 'submitted',
    },
  },
  {
    timestamps: true,
    collection: 'employee_requests',
  }
);

module.exports = mongoose.model('EmployeeRequest', employeeRequestSchema);
