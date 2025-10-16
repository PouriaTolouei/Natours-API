const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Redirects the nested path to the review router
router.use('/:tourId/reviews', reviewRouter);

router.get(
  '/monthly-plan/:year',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'), // Only meant to help guides get organized
  tourController.getMonthlyPlan,
);

// Intresting stat queries open to eveyrone
router.get('/tour-stats', tourController.getTourStats);
router.get(
  '/top-5-cheap',
  tourController.aliasTopTours,
  tourController.getAllTours,
);

// Geospatial queries open to eveyrone
router.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  tourController.getToursWithin,
);
router.get('/distances/:latlng/unit/:unit', tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours) // Accessing all tour information open to everyone
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), // Tour creation restricted to admin and lead-guides
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour) // Accessing a single tour information open to everyone
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), // Tour creation restricted to admin and lead-guides
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.deleteOldTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), // Tour deletino restricted to admin and lead-guides
    tourController.deleteTour,
  );

module.exports = router;
