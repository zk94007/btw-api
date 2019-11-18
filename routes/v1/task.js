const express = require('express');
const router = express.Router();

const { checkJwt } = require('../../middlewares/checkJwt');
const taskController = require('../../controllers/taskController');

router.post('/', checkJwt, taskController.Task);
router.get('/process/', checkJwt, taskController.processTasksForVoterUpdates);
router.get('/:taskId', checkJwt, taskController.getTask);
router.delete('/:taskId', checkJwt, taskController.removeTask);
router.patch('/:taskId', checkJwt, taskController.updateTask);
router.get('/all/:voterId/voter', checkJwt, taskController.getAllTasksByVoterId);
router.get('/all/:userId', checkJwt, taskController.getTaskLists);
router.get('/generate/:userId', checkJwt, taskController.generateTasks);

module.exports = router;
