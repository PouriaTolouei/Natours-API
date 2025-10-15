const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Restricts all user data related queries to logged in users
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword); // The only correct route for updating password without resetting

router.get('/me', userController.setUserId, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.deleteOldUserPhoto,
  userController.preventPasswordUpdate, // Password should NOT be updated with this route
  userController.setUserId,
  userController.setFilteredBody,
  userController.updateUser,
);
router.delete('/deleteMe', userController.deleteMe);

// Restricts queries for accessing and manipulating all user data to admins only
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.preventPasswordUpdate, userController.updateUser) // Password should NOT be updated with this route
  .delete(userController.deleteUser);

module.exports = router;
