const express = require('express');
const router = express.Router();

const guestUserController = require('../../controllers/guestUserController');

router.post('/', guestUserController.addNewGuestUser);
router.post('/subscribe', guestUserController.subscribeToNewsletter);

module.exports = router;
