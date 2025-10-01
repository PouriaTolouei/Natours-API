const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// SCHEMA

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      validator: function (el) {
        // This only works on CREATE and SAVE
        return el === this.password;
      },
      message: 'Passwords are not the same.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// INSTANCE METHODS

/**
 * Checks if the password entered by the user matches the stored password
 * @param candidatePassword: the password user has entered
 * @param userPassword: the password user has on record
 * @returns whether these two password are the same
 */
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // Since the stored password is encrypted, a special comparison is needed
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Checks for password change after the JSON web token was issued
 * @param  JWTTimestamp: time of issue for a JSON web token
 * @returns whether the user's password was changed after the JSON web token was issues
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // Checks if the password change field exists
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000; // converts to seconds
    // True when password changed after SON web token was issues
    return JWTTimestamp < changedTimestamp;
  }

  // Not existing means no password change occured ever
  return false;
};

/**
 * Creates a temporary token to be used to securely reset password  when password is forgotten
 * @returns the unencrypted reset password token
 */
userSchema.methods.createPasswordResetToken = function () {
  // Creates the token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Stores the encrypted version of the token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Stores the expiry time for the token (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Returns unencrypted token to be emailed to the user
  return resetToken;
};

// QUERY MIDDLEWARE

/**
 * Hides inactive users from queries
 */
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// DOCUMENT MIDDLEWARE

/**
 * Encrypts a password everytime before it is stored (after creation and updates)
 */
userSchema.pre('save', async function (next) {
  // Only runs this function if password field was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hashes the password with a cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Deletes passwordConfirmField
  this.passwordConfirm = undefined;
  next();
});

/**
 * Sets the password change field date everytime password is changed before saving it
 */
userSchema.pre('save', function (next) {
  // Only runs this function if password field was actually modified but not when it's newly created
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  // Sets the current time with some negative offset to make it doesn't end up after JSON web token time of issue
  // Since it can take some additional time to save a document to the database
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
