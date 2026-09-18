/**
 * Centralized Express error handling middleware.
 * Must be registered LAST in server.js (after all routes).
 *
 * Returns consistent error shape:
 * { success: false, message: "..." }
 *
 * Never exposes stack traces to clients.
 */
const errorMiddleware = (err, req, res, next) => {
  // Log the full error server-side for debugging
  console.error(`[ERROR] ${req.method} ${req.url} —`, err.message);

  // Mongoose validation error (400)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join('; '),
    });
  }

  // Mongoose bad ObjectId (404)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found — invalid ID format',
    });
  }

  // MongoDB duplicate key (409)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // Explicit status set on the error object
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
