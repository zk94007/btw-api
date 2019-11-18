const express = require('express');
const router = express.Router();

const { checkJwt } = require('../../middlewares/checkJwt');
const electionController = require('../../controllers/electionController');

router.get('/', checkJwt, electionController.getElectionProfiles);
router.post('/electionProfile', checkJwt, electionController.addElectionProfile);

module.exports = router;
