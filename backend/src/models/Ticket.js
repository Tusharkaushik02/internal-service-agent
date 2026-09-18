const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      // Auto-generated as TCK-XXXX in the service layer
    },
    employeeRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeRequest',
      required: [true, 'Employee request reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['IT', 'HR', 'Finance', 'Admin', 'General'],
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'queued', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'queued',
    },
    assignedTo: {
      type: String,
      default: null,
    },
    knowledgeReferences: {
      type: [
        {
          documentId: { type: String, required: true },
          title: { type: String, required: true },
          category: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'tickets',
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
