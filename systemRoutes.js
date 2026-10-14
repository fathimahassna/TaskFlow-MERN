const express = require('express');
const router = express.Router();
const { getDbStatus } = require('../config/db');
const { verifySmtpConnection, isSmtpConfigured } = require('../services/emailService');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.get('/status', protect, requireAdmin, async (req, res) => {
  const db = getDbStatus();
  const smtpConfigured = isSmtpConfigured();
  const smtpTest = await verifySmtpConnection();

  res.status(200).json({
    success: true,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    database: db,
    smtp: {
      configured: smtpConfigured,
      verified: smtpTest.ok,
      host: process.env.SMTP_HOST || 'Not set',
      port: process.env.SMTP_PORT || 'Not set',
      user: process.env.SMTP_USER ? 'Configured' : 'Not set',
      message: smtpTest.message,
    },
  });
});

module.exports = router;