const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// HANDLERS

// Standard handlers

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// Special handlers

/**
 * Creates a Stripe checkout session for a given tour and returns it as a response
 */
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Gets currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // Creates Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // Adds query parameters to the success url for creating a booking later (temporary)
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,

    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  // Returns session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

/**
 * Creates and stores a booking document from the successful checkout session
 */
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // Gets the booking fields from the query parameters of the success url
  // (temporary workaround before deployment)
  const { tour, user, price } = req.query;

  // Ignores this middleware if any of the booking fields are missing
  if (!tour || !user || !price) return next();

  // Creates a booking
  await Booking.create({ tour, user, price });

  // Redirects the user to the success url but without the query paramters
  // (temporary workaround before deployment)
  res.redirect(req.originalUrl.split('?')[0]);
});
