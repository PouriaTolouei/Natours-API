const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// MIDDLEWARES

exports.setTourUserIds = (req, res, next) => {
  // Allows nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.setTourIdFilter = (req, res, next) => {
  // Allows nested routes
  if (req.params.tourId) req.idFilter = { tour: req.params.tourId };
  next();
};

// HANDLERS

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
