const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const Review = require('../models/reviewModel');

const router = express.Router({ mergeParams: true });

// Restricts all review queries to logged in users
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.setTourIdFilter, reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'), // Only normal users can post reviews (not guides, lead-guides, and admins)
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictToOwnerAnd({ Model: Review, ownerField: 'user' }), // Only a user who created a review can update it
    reviewController.updateReview,
  )
  .delete(
    authController.restrictToOwnerAnd(
      { Model: Review, ownerField: 'user' },
      'admin', // Only a user who created a review and the admin can delete it
    ),
    reviewController.deleteReview,
  );

module.exports = router;
