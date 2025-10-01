const AppError = require('../utils/appError');

// HELPER FUNCTIONS

/**
 * Sends error in a development environment.
 */
const sendErrorDev = (err, res) => {
  // Sends fuill error detail for development
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Sends error in a production environment.
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: sends error details to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: doesn't leak error details
  } else {
    // Logs error
    console.error('ERROR', err);

    // Sends generic message
    res.status(err.statusCode).json({
      status: err.status,
      message: 'Something went wrong!',
    });
  }
};

// CUSTOM ERROR HANDLERS

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateField = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate ${field} field value: ${err.keyValue.name}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401);

// MAIN ERROR HANDLER

module.exports = (err, req, res, next) => {
  // By default internal server error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Sends error diffrently depending on the environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Creates custom errors for common errors
    let error = Object.create(err);
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateField(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
