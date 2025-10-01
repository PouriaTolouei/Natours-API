const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const Review = require('../models/reviewModel');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.setTourIdFilter, reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictToOwnerAnd({ Model: Review, ownerField: 'user' }),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictToOwnerAnd(
      { Model: Review, ownerField: 'user' },
      'admin',
    ),
    reviewController.deleteReview,
  );

module.exports = router;
