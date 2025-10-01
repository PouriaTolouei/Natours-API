const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// HELPER FUNCTIONS

/**
 *
 * @param obj: object to be filtered
 * @param  allowedFields: fields to keep
 * @returns new object with the allowed fields
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // Loops through the fields
  Object.keys(obj).forEach((el) => {
    // If it's an allowed field, copies it to the new object
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// MIDDLEWARES

/**
 * Prevents the user/admin from updating the password from any route other than /updateMyPassword
 */
exports.preventPasswordUpdate = (req, res, next) => {
  // Creates error if user posts password data
  const { password } = req.body || {};
  if (password) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  next();
};

/**
 * Sets the id parameter automatically logged-in user routes (i.e. /updateMe and /me )
 */
exports.setUserId = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

/**
 * Filters out unwanted field names that are not allowed to be updated
 */
exports.setFilteredBody = (req, res, next) => {
  req.body = filterObj(req.body, 'name', 'email');
  next();
};

// HANDLERS

// Standard handlers

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.updateOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup instead.',
  });
};
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// Special handlers

/**
 * Allows a user to delete their account which in this case means setting it to inactive
 * (note: it will remain in the database)
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  // Finds the logged in user and sets it to inactive
  await User.findByIdAndUpdate(req.user._id, { active: false });

  // Sends response
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
