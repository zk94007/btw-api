const express = require('express');
const router = express.Router();

const authController = require('../../controllers/authController');

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.post('/verifyEmail', authController.verifyEmail);
router.post('/changePassword', authController.changePassword);
router.post('/getUser', authController.getUser);
router.post('/removeUser', authController.removeUser);
router.post('/sendVerificationEmail', authController.sendVerificationEmail);

module.exports = router;
