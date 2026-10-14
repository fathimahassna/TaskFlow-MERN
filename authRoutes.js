const express = require('express');
const router = express.Router();
const {
  loginUser,
  registerEmployee,
  getMe,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', loginLimiter, registerEmployee);
router.post('/login', loginLimiter, loginUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;