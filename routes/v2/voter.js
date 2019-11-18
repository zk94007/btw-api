const express = require('express');
const router = express.Router();

const { checkJwt } = require('../../middlewares/checkJwt');
const voterController = require('../../controllers/voterController');

router.get('/all/:userId', checkJwt, voterController.getVoterLists);
router.patch('/:Id', checkJwt, voterController.updateVoter);
router.delete('/:Id', checkJwt, voterController.removeVoter);
router.patch('/:voterId/comment/:commentId', checkJwt, voterController.updateVoterComment);
router.delete('/:voterId/comment/:commentId', checkJwt, voterController.deleteVoterComment);
router.post('/:voterId/comment', checkJwt, voterController.addVoterComment);
router.get('/history/:voterRegNum', checkJwt, voterController.getVoterHistory);

module.exports = router;
