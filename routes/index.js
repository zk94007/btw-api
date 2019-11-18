const express = require('express');
const router = express.Router();

const v1APIRouter = require('./v1');
const v2APIRouter = require('./v2');

router.use('/v1', v1APIRouter);
router.use('/v2', v2APIRouter);

module.exports = router;
