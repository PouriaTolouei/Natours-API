const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fspromise = require('fs').promises;
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// HELPERS

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
 * Deletes the previous photo of the user
 */
exports.deleteOldUserPhoto = catchAsync(async (req, res, next) => {
  // If there is no new photo file, skip this middleware
  if (!req.file) return next();

  const userPhoto = req.user.photo;

  // Doesn't delete the photo if it's the default photo (since it's a shared file)
  if (userPhoto === 'default.jpg') return next();

  // Deletes user photo
  await fspromise.unlink(
    path.join(__dirname, `../public/img/users/${userPhoto}`),
  );

  next();
});

/**
 * Uploads user's photo
 */
exports.uploadUserPhoto = upload.single('photo');

/**
 * Resizes and saves user photo
 */
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // If there is no file, skip this middleware
  if (!req.file) return next();

  // Builds the image name
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  // Resizes and saves the image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

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
  const filteredBody = filterObj(req.body, 'name', 'email');
  // If a file is provided for the user photo, then it's added to the body
  if (req.file) filteredBody.photo = req.file.filename;
  req.body = filteredBody;
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
