const express = require('express');
const router = express.Router();

const { checkJwt } = require('../../middlewares/checkJwt');
const authController = require('../../controllers/authController');
const userController = require('../../controllers/userController');
const actionController = require('../../controllers/actionController');

router.post('/addVoters', checkJwt, actionController.addVoters);
router.post('/parseFile', checkJwt, actionController.parseFile);
router.get('/showResultV2', checkJwt, actionController.showResult);
router.post('/changePassword', checkJwt, authController.changeOldPassword);
router.get('/potentialVoters', checkJwt, actionController.searchPotentialVotersByQuery);
router.get('/dashboardLeaderBoard', checkJwt, actionController.dashboardLeaderBoard);
router.get('/leaderBoard', checkJwt, actionController.leaderBoard);
router.post('/resetPassword/sendEmail', authController.sendResetPasswordEmail);
router.get('/resetPassword/check/:resetPasswordToken', authController.checkResetPasswordToken);
router.post('/resetPassword/reset', authController.resetPassword);
router.post('/resendVerificationEmail', authController.sendVerificationEmail);
router.delete('/comment/:commentId', checkJwt, userController.deleteUserComment);
router.patch('/comment/:commentId', checkJwt, userController.updateUserComment);
router.post('/comment', checkJwt, userController.addUserComment);
router.get('/userElectionProfiles', checkJwt, userController.getUserElectionProfiles);
router.post('/userElectionProfile', checkJwt, userController.addUserElectionProfile);
router.patch('/userElectionProfile', checkJwt, userController.updateUserElectionProfile);

module.exports = router;
