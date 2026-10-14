const nodemailer = require('nodemailer');

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

const getBaseEmailTemplate = (title, preheader, contentHtml) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 28px; text-align: left; }
    .brand-title { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
    .brand-tagline { color: #e0e7ff; font-size: 13px; margin: 4px 0 0 0; }
    .body-content { padding: 32px 28px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-High { background-color: #fee2e2; color: #b91c1c; }
    .badge-Medium { background-color: #fef3c7; color: #b45309; }
    .badge-Low { background-color: #ecfdf5; color: #047857; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; text-align: center; }
    .footer { padding: 20px 28px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">TaskFlow</h1>
      <p class="brand-tagline">Plan smarter. Work better. Achieve more.</p>
    </div>
    <div class="body-content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TaskFlow SaaS. All rights reserved.</p>
      <p>This is an automated notification. Please log in to your TaskFlow dashboard to view your assignments.</p>
    </div>
  </div>
</body>
</html>
`;
};

const sendTaskAssignmentEmail = async ({ employee, task, admin }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginUrl = `${frontendUrl}/login`;

  if (!isSmtpConfigured()) {
    console.info(`[Email Service Notice] SMTP is not configured. Task assignment email to ${employee.email} was logged instead.`);
    return {
      success: false,
      delivered: false,
      reason: 'SMTP credentials not configured in environment variables',
    };
  }

  const priorityClass = `badge-${task.priority}`;
  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline set';

  const contentHtml = `
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0;">New Task Assigned</h2>
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">
      Hello <strong>${employee.name}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">
      You have been assigned a new task by <strong>${admin?.name || 'Administrator'}</strong>.
    </p>

    <div class="card">
      <div style="font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px;">
        ${task.title}
      </div>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
        ${task.description}
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Priority:</td>
            <td style="padding: 4px 0;"><span class="badge ${priorityClass}">${task.priority}</span></td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Due Date:</td>
            <td style="font-weight: 600; color: #0f172a; padding: 4px 0;">${dueDateStr}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Status:</td>
            <td style="font-weight: 600; color: #0f172a; padding: 4px 0;">${task.status}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${loginUrl}" class="btn">Log In to View Task</a>
    </div>
  `;

  const html = getBaseEmailTemplate(
    `New Task Assigned: ${task.title}`,
    `You have been assigned a new task: ${task.title}`,
    contentHtml
  );

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"TaskFlow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: employee.email,
      subject: `[TaskFlow] New Task Assignment: ${task.title}`,
      html,
    });
    console.log(`[Email Service] Task assignment email sent to ${employee.email} (${info.messageId})`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send assignment email: ${error.message}`);
    return { success: false, delivered: false, reason: error.message };
  }
};

const sendTaskStatusUpdateEmail = async ({ employee, task, previousStatus, newStatus }) => {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const dashboardUrl = `${frontendUrl}/admin/tasks`;

  if (!isSmtpConfigured() || !adminEmail) {
    console.info(`[Email Service Notice] SMTP or Admin email not configured. Status update for "${task.title}" was logged instead.`);
    return {
      success: false,
      delivered: false,
      reason: 'SMTP or Admin notification email not configured',
    };
  }

  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const contentHtml = `
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0;">Task Status Updated</h2>
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">
      Employee <strong>${employee.name}</strong> (${employee.email}) updated the status of a task.
    </p>

    <div class="card">
      <div style="font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px;">
        ${task.title}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Previous Status:</td>
          <td style="font-weight: 600; color: #64748b; padding: 4px 0;">${previousStatus}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">New Status:</td>
          <td style="font-weight: 700; color: #4f46e5; padding: 4px 0;">${newStatus}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Updated At:</td>
          <td style="font-weight: 500; color: #0f172a; padding: 4px 0;">${timestamp}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${dashboardUrl}" class="btn">View in Admin Dashboard</a>
    </div>
  `;

  const html = getBaseEmailTemplate(
    `Task Status Updated: ${task.title}`,
    `${employee.name} updated task "${task.title}" to ${newStatus}`,
    contentHtml
  );

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"TaskFlow Notifications" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[TaskFlow Alert] Status Changed: ${task.title} -> ${newStatus}`,
      html,
    });
    console.log(`[Email Service] Status update email sent to admin (${info.messageId})`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send status update email: ${error.message}`);
    return { success: false, delivered: false, reason: error.message };
  }
};

const verifySmtpConnection = async () => {
  if (!isSmtpConfigured()) {
    return {
      configured: false,
      ok: false,
      message: 'SMTP credentials are not configured in .env',
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return {
      configured: true,
      ok: true,
      message: 'SMTP server connection verified successfully',
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      message: err.message,
    };
  }
};

module.exports = {
  isSmtpConfigured,
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
  verifySmtpConnection,
};