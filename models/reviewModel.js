const mongoose = require('mongoose');
const Tour = require('./tourModel');

// SCHEMA

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty.'],
    },
    rating: {
      type: Number,
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// INDEXES

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// STATIC METHODS

/**
 * Calculates number and average of ratings across all reviews for a tour.
 * @param tourId: Id of the tour to calculate average ratings for
 */
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      // Only select reviews that belong to the tour
      $match: { tour: tourId },
    },
    {
      // Group by tour and calculates number and average of ratings
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // Updates the tour rating fields on the tours with the calculated values
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
    // If there are no reviews (and therefore no stats), set the tour rating fields to 0
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

// QUERY MIDDLEWARE

/**
 * Populates user field automatically everytime a review is retrieved.
 */
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

/**
 * Calculates and updates tour rating fields everytime a review is updated or deleted
 */
reviewSchema.post(/^findOneAnd/, async (doc) => {
  await doc.constructor.calcAverageRatings(doc.tour);
});

// DOCUMENT MIDDLEWARE

/**
 * Calculates and updates tour rating fields everytime a review is saved
 */
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
