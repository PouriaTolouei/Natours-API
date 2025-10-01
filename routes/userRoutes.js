const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protects all the routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.setUserId, userController.getUser);
router.patch(
  '/updateMe',
  userController.preventPasswordUpdate,
  userController.setUserId,
  userController.setFilteredBody,
  userController.updateUser,
);
router.delete('/deleteMe', userController.deleteMe);

// Restricts all the routes after this middleware to admin
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.preventPasswordUpdate, userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
