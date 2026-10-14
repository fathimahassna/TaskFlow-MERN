const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeDropdown,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(requireAdmin);

router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.get('/dropdown', getEmployeeDropdown);

router.route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee);

router.patch('/:id/status', toggleEmployeeStatus);

module.exports = router;