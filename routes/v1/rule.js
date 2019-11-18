const express = require('express');
const router = express.Router();

const ruleController = require('../../controllers/ruleController');

router.post('/', ruleController.Rule);
router.get('/:ruleId', ruleController.getRule);
router.get('/', ruleController.getAllRule);
router.delete('/:ruleId', ruleController.removeRule);
router.patch('/:ruleId', ruleController.updateRule);

module.exports = router;
