const express = require('express');
const router = express.Router();

const { checkJwt } = require('../../middlewares/checkJwt');
const userController = require('../../controllers/userController');

router.patch('/', checkJwt, userController.updateUserV2);
router.get('/', checkJwt, userController.getUserV2);

module.exports = router;
