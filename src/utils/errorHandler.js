class ErrorHandler extends Error {
  constructor(message, statusCode, code = 'GENERAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default ErrorHandler;