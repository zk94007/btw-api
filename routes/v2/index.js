const express = require('express');
const router = express.Router();

const userRouter = require('./user');
const voterRouter = require('./voter');

/**
 * v2 master route. All api's must have a pattern and be inserted here
 */

router.use('/voter', voterRouter);
router.use('/user', userRouter);

module.exports = router;
