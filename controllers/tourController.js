const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fspromise = require('fs').promises;
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// HELPERS

// Sets the image to only be saved to memory
const multerStorage = multer.memoryStorage();

// Restricts file upload to only images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please only upload images', 500), false);
  }
};

// Handles image uploads
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// MIDDLEWARES

/**
 * Deletes the previous images of the tour
 */
exports.deleteOldTourImages = catchAsync(async (req, res, next) => {
  // If there are no new cover image or tour images, skip this middleware
  if (!req.files.imageCover || !req.files.images) return next();

  const tour = await Tour.findById(req.params.id);

  // Deletes old cover image if one exists
  if (tour.imageCover)
    await fspromise.unlink(
      path.join(__dirname, `../public/img/tours/${tour.imageCover}`),
    );

  // Deletes old tour images if they exist
  if (tour.images) {
    await Promise.all(
      tour.images.map(async (file) => {
        await fspromise.unlink(
          path.join(__dirname, `../public/img/tours/${file}`),
        );
      }),
    );
  }

  next();
});

/**
 * Uploads tour images
 */
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

/**
 * Resizes and saves tour images
 */
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // If there are no cover image or tour images, skip this middleware
  if (!req.files.imageCover || !req.files.images) return next();

  // Builds cover image na,e
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // Resizes and saves the cover image
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Resizes and saves the tour images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const imageFilename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageFilename}`);

      // Adds the filename to the body, so it can be added to the tour object in the updateOne middleware
      req.body.images.push(imageFilename);
    }),
  );

  next();
});

/**
 * Sets query filters to filter for top 5 tours (highest average rating, lowest price)
 */
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// HANDLERS

// Standard handlers

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // Populates the reviews only when getting a single tour
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Special handlers

/**
 * Calculates stats across all tours categorized by difficulty.
 */
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      // Groups by difficulty  and calculates stats
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // Sorts by average price ascending
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  // Sends response
  res.status(200).json({
    status: 'sucesss',
    data: {
      stats,
    },
  });
});

/**
 * Given a year, shows tour names and count for each month
 */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      // Creates a new document for evert start date
      $unwind: '$startDates',
    },
    {
      // Only selects the tours in the given year
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // Groups by month, calculates number of tours and gets an array of tour names
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      // Adds month as a field
      $addFields: { month: '$_id' },
    },
    {
      // Hides the id field
      $project: { _id: 0 },
    },
    {
      // Sorts by number of tours descending (busiest months first)
      $sort: { numTourStarts: -1 },
    },
  ]);

  // Sends response
  res.status(200).json({
    status: 'sucesss',
    data: { plan },
  });
});

/**
 * Gets all tours within the given distance (km or miles) from the given point location.
 */
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // Extracts parameters
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Calculates distance proportional to radius of Earth depending on the unit
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Check if a point location is provided
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  // Finds all tours within the given distance from the given point location
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // Sends response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

/**
 * Gets all the tours' distances from a given point location.
 */
exports.getDistances = catchAsync(async (req, res, next) => {
  // Extracts parameters
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Calculates multiplier to convert from meters depending on the unit
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // Check if a point location is provided
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // Specifies distance calculation from a point
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        // stories the distance between the starting location of each tour and the given point in the distance field
        distanceField: 'distance',
        // Converts from meters to km or mi
        distanceMultiplier: multiplier,
      },
    },
    {
      // Only selects the name and distance for each tour
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  // Sends response
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
