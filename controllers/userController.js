const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// HELPER FUNCTIONS

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// MIDDLEWARES

exports.preventPasswordUpdate = (req, res, next) => {
  // Create error if user posts password data
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

exports.setUserId = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.setFilteredBody = (req, res, next) => {
  // Filter out unwanted field names that are not allowed to be updated
  req.body = filterObj(req.body, 'name', 'email');
  next();
};

// HANDLERS

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

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
