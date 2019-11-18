const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const oauthRouter = require('./oauth');
const districtsRouter = require('./districts');
const taskRouter = require('./task');
const ruleRouter = require('./rule');
const fileRouter = require('./file');
const guestUserRouter = require('./guestUser');
const statusRouter = require('./status');
const electionProfilesRouter = require('./electionProfiles');
const userRouter= require('./user');

/**
 * v1 master route. All api's must have a pattern and be inserted here
 */

router.use('/auth', authRouter);
router.use('/oauth', oauthRouter);
router.use('/districts', districtsRouter);
router.use('/task', taskRouter);
router.use('/rule', ruleRouter);
router.use('/oauth', oauthRouter);
router.use('/file', fileRouter);
router.use('/guestUser', guestUserRouter);
router.use('/status', statusRouter);
router.use('/electionProfiles', electionProfilesRouter);
router.use('/user', userRouter);

module.exports = router;
