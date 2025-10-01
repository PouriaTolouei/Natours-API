const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// MIDDLEWARES

/**
 * Automatically sets the tour and user fields to create a review on a tour (nested tour route with user logged in)
 */
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

/**
 * Automatically sets a tour id filter to get all reviews on a tour (nested tour route)
 */
exports.setTourIdFilter = (req, res, next) => {
  if (req.params.tourId) req.idFilter = { tour: req.params.tourId };
  next();
};

// HANDLERS

// Standard handlers

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
