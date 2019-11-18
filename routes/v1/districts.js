const express = require('express');
const router = express.Router();

const { checkJwt } = require('../../middlewares/checkJwt');
const districtsController = require('../../controllers/districtsController');

router.get('/', checkJwt, districtsController.getDistrictsByAddress);

module.exports = router;
