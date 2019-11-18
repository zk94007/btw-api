const express = require('express');
const router = express.Router();

const {checkJwt} = require('../../middlewares/checkJwt');
const oauthController = require('../../controllers/oauthController');

router.get('/twitter/get_request_token', checkJwt, oauthController.getTwitterRequestToken);
router.get('/twitter/friends/list', checkJwt, oauthController.getTwitterFriends);
router.get('/google/friends/list', checkJwt, oauthController.importUserFromGoogle);
router.get('/facebook/friends/list', checkJwt, oauthController.importUserFromFacebook);

module.exports = router;
