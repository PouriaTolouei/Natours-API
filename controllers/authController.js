const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// HELPER FUNCTIONS

/**
 * Creates a JSON web token to be used for authentication
 * @param id:  user id
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

/**
 * Creates a JSON web token, sets it as a cookie, and
 * sends it in the response alongside the authenticated user.
 * @param user: authenticated user
 * @param statusCode: status code of the response (200 or 201)
 * @param res: response object
 */
const createSendToken = (user, statusCode, req, res) => {
  // Creates the token using the user's ID
  const token = signToken(user._id);

  // Sends the token as a cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // converts to days
    ),
    // Makes sure the cookie cannot be modified
    httpOnly: true,
    // If connection is secure (https), send cookie over that secure connection
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('jwt', token, cookieOptions);

  // Sends the response
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

// MIDDLEWARES

/**
 * Logs out a user by sending a dummy cookie to replace the legitimate cookie.
 */
exports.logout = (req, res, next) => {
  // Sends a cookie with dummy text to overwrite the legitimate cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + 10 * 1000, // expires in 10 seconds
    ),
    // Makes sure the cookie cannot be modified
    httpOnly: true,
  };

  res.cookie('jwt', 'loggedout', cookieOptions);

  res.status(200).json({ status: 'success' });
};

/**
 * Authenticates a user for accessing a protected route using a JSON web token (JWT).
 */
exports.protect = catchAsync(async (req, res, next) => {
  // Gets token and checks if it's there
  let token;
  // Check if the authorization header is set with a bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Or checks if there is a valid cookie with JWT
  else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401),
      401,
    );
  }
  // Verifies the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Checks if user stil exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists.', 404),
    );
  }

  // Checsk if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Your password recently changed. Please log in again.', 401),
    );
  }

  // Grants access to protected route and pass authenticated user to the next middleware
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

/**
 * Checks if a user is logged in or not for all rendered pages
 */
exports.isLoggedIn = async (req, res, next) => {
  try {
    // Gets token and checks if it's there
    let token;
    // Checks if there is a valid cookie with JWT
    if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next();
    }
    // Verifies the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Checks if user stil exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }

    // Checks if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // There is a logged in user, so pass it to the templates
    res.locals.user = currentUser;
    next();
  } catch (err) {
    // If any errors occur, no user is passed  to the templates, so it moves on
    next();
  }
};

/**
 * Authorizes an authenticated user for accessing a protected route based on their role.
 * @param roles: an array of authorized roles (e.g. ['admin', 'lead-guide'])
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // Checks if the user role is an authorized role
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  };

/**
 * Authorizes an authenticated user for accessing a protected route based on their ownership and role.
 * @param Model: model of the protected document (e.g. Review)
 * @param ownerField: document field indicating its owner (e.g. 'user')
 * @param roles: an array of authorized roles (e.g. ['admin', 'lead-guide'])
 */
exports.restrictToOwnerAnd = ({ Model, ownerField }, ...roles) =>
  catchAsync(async (req, res, next) => {
    // Gets the protected document and checks if it exists
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Checks if the user is the owner or has an authorized role
    if (
      !doc[ownerField]._id.equals(req.user._id) &&
      !roles.includes(req.user.role)
    )
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );

    next();
  });

// HANDLERS

/**
 * Signs up a new user using the provided details.
 */
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body || {};

  // Creates a user using predefined fields (any other fields will be ignored)
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  // Sends welcome email
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // Logs the user in, sends JWT
  createSendToken(newUser, 201, req, res);
});

/**
 * Logs an existing user in using their email and password.
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || {};

  // Checks if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  // Checks if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // Logs the user in, sends JWT
  createSendToken(user, 200, req, res);
});

/**
 * Sends a password reset email to an existing user.
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body || {};

  // Gets user based on posted email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // Generate the random reset token
  const resetPasswordToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Sends token to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetPasswordToken}`;
  // Attempts to send the email, if it fails, removes password reset fields.
  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the reset password email. Please try again later.',
        500,
      ),
    );
  }
});

/**
 * Resets an existing user's password using a reset password token.
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Gets user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If the token has not expired, and there is a user, sets the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  const { password, passwordConfirm } = req.body || {};
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Logs the user in, sends JWT
  createSendToken(user, 200, req, res);
});

/**
 * Updates a logged-in user's password.
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Gets user from the collection
  const user = await User.findById(req.user._id).select('+password');

  // Checsk if posted current password is correct
  const { passwordCurrent, password, passwordConfirm } = req.body || {};
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // If so, updates password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // Logs user in, sends JWT
  createSendToken(user, 200, req, res);
});
