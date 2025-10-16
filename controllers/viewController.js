const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert =
      "Your booking was successful! If your booking doesn't show up immediately, please come back later.";
  }
  next();
};

/**
 * Renders the home page.
 */
exports.getOverview = catchAsync(async (req, res, next) => {
  // Gets tour data from collection
  const tours = await Tour.find();

  // Renders template using tours data
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

/**
 * Renders a tour page.
 */
exports.getTour = catchAsync(async (req, res, next) => {
  // Gets data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('No tour found with that name', 404));
  }

  // Renders templete using requested tour data
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

/**
 * Renders the login page.
 */
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

/**
 * Renders the signup page.
 */
exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign up',
  });
};

/**
 * Renders the account page.
 */
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Account',
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  // Finds all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // Finds tours using the IDs
  const toursIds = bookings.map((el) => el.tour.id);
  const tours = await Tour.find({ _id: { $in: toursIds } });

  // Render the tours similar to the home page
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
