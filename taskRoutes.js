const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin, requireEmployeeOrAdmin } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(requireAdmin, createTask);

router.route('/:id')
  .get(getTaskById)
  .put(requireAdmin, updateTask)
  .delete(requireAdmin, deleteTask);

router.patch('/:id/status', requireEmployeeOrAdmin, updateTaskStatus);

module.exports = router;