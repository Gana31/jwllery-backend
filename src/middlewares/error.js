import ErrorHandler from "../utils/errorHandler.js";
import { logError } from "../utils/logger.js";

export default (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    const msg = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(msg, 400);
  }

  // mongoose duplicate key error
  if (err.code === 11000) {
    const message = "User with this email already exists!";
    err = new ErrorHandler(message, 400);
  }

  // wrong jwt error
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  // JWT expire error
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is expired, try again`;
    err = new ErrorHandler(message, 400);
  }

  // Log the error with message and stack
  logError(err, {
    method: req.method,
    url: req.url,
    statusCode: err.statusCode || 500,
    userId: req.user?.id || null,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
    },
  });
};
