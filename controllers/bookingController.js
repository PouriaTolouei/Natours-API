const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// HELPER FUNCTIONS

/**
 * Creates a booking using data in the checkout session
 * @param session: Stripe checkout session
 */
const createBookingSession = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

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
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
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
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            ],
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
 * Retrieves checkout session from Stripe's request to the webhook upon successful checkout
 */
exports.webhookCheckout = catchAsync(async (req, res, next) => {
  // Creates event object from Stripe's request and verifies it using a secret
  let event;
  const signature = req.headers['stripe-signature'];
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // If the event is a successful checkout then creates a booking using the extracted session
  if (event.type === 'checkout.session.completed') {
    await createBookingSession(event.data.object);
  }

  res.status(200).json({ recieved: true });
});
