const path = require('path');
const express = require('express');
const morgan = require('morgan');
const qs = require('qs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES

// Serves static files
app.use(express.static(path.join(__dirname, 'public')));

// Sets security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Explicitly tells helmet() NOT to apply its content security policy
  }),
);
// Uses a custom content security policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'child-src': ['blob:'],
      'connect-src': [
        'https://*.mapbox.com',
        'https://*.cloudflare.com',
        'http://127.0.0.1:3000',
        'ws://127.0.0.1:1234/',
        'https://*.stripe.com',
        'https://*.onrender.com',
      ],
      'default-src': ["'self'"],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'script-src': [
        "'self'",
        'https://*.mapbox.com',
        'https://*.cloudflare.com',
        'http://127.0.0.1:3000',
        'ws://127.0.0.1:1234/',
        'https://*.stripe.com',
      ],
      'style-src': ["'self'", "'unsafe-inline'", 'https:'],
      'worker-src': ['blob:'],
      'frame-src': ['*.stripe.com', '*.stripe.network'],
    },
  }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set the 'trust proxy' to the likely number of hops on Render's network
app.set('trust proxy', 3);

// Limits requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.',
});
app.use('/api', limiter);

// Body parser, reads data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Sets a custom query parser using qs
app.set('query parser', (str) => qs.parse(str));

// Makes the req.query writable
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    ...Object.getOwnPropertyDescriptor(req, 'query'),
    value: req.query,
    writable: true,
  });
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevents paramter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Compresses texts sent to the client
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handles unknown routes
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
