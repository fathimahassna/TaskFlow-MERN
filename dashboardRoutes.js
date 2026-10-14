const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getEmployeeDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/admin', requireAdmin, getAdminDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;