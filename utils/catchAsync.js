// Syntactic sugar for passing any unhandled errors to the global error handling middleware

module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
