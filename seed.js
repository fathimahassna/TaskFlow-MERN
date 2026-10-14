const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { connectDB } = require('../config/db');

const seedData = async () => {
  console.log('[TaskFlow Seeder] Starting database seeding...');

  // Ensure DB connected
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // Clear existing collections
  await User.deleteMany({});
  await Task.deleteMany({});
  await Notification.deleteMany({});
  console.log('[TaskFlow Seeder] Existing data cleared.');

  // Create Designated Single Admin Account from Environment or Secure Defaults
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@taskflow.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Alexander Wright';
  const adminDepartment = process.env.ADMIN_DEPARTMENT || 'Executive Leadership';

  const admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    department: adminDepartment,
    isActive: true,
  });

  // Create Initial Sample Employees
  const emp1 = await User.create({
    name: 'Alex Morgan',
    email: 'alex.morgan@taskflow.com',
    password: 'Employee@123',
    role: 'employee',
    department: 'Product Engineering',
    isActive: true,
  });

  const emp2 = await User.create({
    name: 'Sarah Connor',
    email: 'sarah.connor@taskflow.com',
    password: 'Employee@123',
    role: 'employee',
    department: 'Design & UX',
    isActive: true,
  });

  const emp3 = await User.create({
    name: 'David Kim',
    email: 'david.kim@taskflow.com',
    password: 'Employee@123',
    role: 'employee',
    department: 'Quality Assurance',
    isActive: true,
  });

  console.log('[TaskFlow Seeder] Users created (1 Designated Admin, 3 Initial Employees).');

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const tasksData = [
    {
      title: 'Architect Micro-Frontend Authentication Gateway',
      description: 'Implement JWT token exchange, refresh rotation, and role-based route guard verification for the next-gen client portal.',
      assignedTo: emp1._id,
      priority: 'High',
      status: 'In Progress',
      dueDate: new Date(now.getTime() + 2 * day),
      createdBy: admin._id,
    },
    {
      title: 'Revamp Global Design System Tokens & Color Palette',
      description: 'Align color tokens with modern indigo/slate palette. Create reusable Tailwind utility presets and accessible focus rings.',
      assignedTo: emp2._id,
      priority: 'High',
      status: 'Completed',
      dueDate: new Date(now.getTime() - 1 * day),
      createdBy: admin._id,
    },
    {
      title: 'Setup End-to-End Test Suite for Task Status Pipelines',
      description: 'Write Playwright / Cypress integration tests simulating Employee status transitions and verify admin notification dispatch.',
      assignedTo: emp3._id,
      priority: 'Medium',
      status: 'Pending',
      dueDate: new Date(now.getTime() + 4 * day),
      createdBy: admin._id,
    },
    {
      title: 'Optimize MongoDB Aggregation for Dashboard Analytics',
      description: 'Benchmark dashboard pipeline queries, add compound indexes on assignedTo and status fields to minimize query latency.',
      assignedTo: emp1._id,
      priority: 'High',
      status: 'Not Started',
      dueDate: new Date(now.getTime() + 3 * day),
      createdBy: admin._id,
    },
    {
      title: 'Design Mobile-Responsive Slide-over Task Drawer',
      description: 'Create fluid gesture-friendly drawer component with backdrop blur for smooth viewing on tablet and mobile viewports.',
      assignedTo: emp2._id,
      priority: 'Medium',
      status: 'In Progress',
      dueDate: new Date(now.getTime() + 5 * day),
      createdBy: admin._id,
    },
    {
      title: 'Implement SMTP Email Delivery Verification & Test Harness',
      description: 'Build health check route verifying Nodemailer transport configuration with graceful offline fallback.',
      assignedTo: emp3._id,
      priority: 'Medium',
      status: 'Completed',
      dueDate: new Date(now.getTime() - 2 * day),
      createdBy: admin._id,
    },
    {
      title: 'Audit WCAG 2.1 AA Accessibility & Color Contrast',
      description: 'Inspect form labels, ARIA badges, button tab-order, and color contrast on both light and dark themes.',
      assignedTo: emp2._id,
      priority: 'Low',
      status: 'Not Started',
      dueDate: new Date(now.getTime() + 7 * day),
      createdBy: admin._id,
    },
    {
      title: 'Implement Server-Side Pagination & Debounced Search',
      description: 'Enable multi-field keyword search across titles, descriptions, and user names with indexed limit-offset pagination.',
      assignedTo: emp1._id,
      priority: 'High',
      status: 'Completed',
      dueDate: new Date(now.getTime() - 3 * day),
      createdBy: admin._id,
    },
  ];

  const createdTasks = await Task.insertMany(tasksData);
  console.log(`[TaskFlow Seeder] Created ${createdTasks.length} rich tasks.`);

  // Create sample notifications
  await Notification.create([
    {
      recipient: emp1._id,
      title: 'New Task Assigned',
      message: `You were assigned "Architect Micro-Frontend Authentication Gateway" by ${adminName}`,
      type: 'task_assigned',
      task: createdTasks[0]._id,
      read: false,
    },
    {
      recipient: admin._id,
      title: 'Task Status Updated',
      message: 'Sarah Connor marked "Revamp Global Design System Tokens & Color Palette" as Completed',
      type: 'status_updated',
      task: createdTasks[1]._id,
      read: true,
    },
    {
      recipient: emp2._id,
      title: 'New Task Assigned',
      message: `You were assigned "Design Mobile-Responsive Slide-over Task Drawer" by ${adminName}`,
      type: 'task_assigned',
      task: createdTasks[4]._id,
      read: false,
    },
  ]);

  console.log('[TaskFlow Seeder] Sample in-app notifications generated.');
  console.log('----------------------------------------------------');
  console.log('TaskFlow Demo Credentials Ready:');
  console.log(` Designated Admin: ${adminEmail} / ${adminPassword}`);
  console.log(' Employee Demo:    alex.morgan@taskflow.com / Employee@123');
  console.log(' Employee Demo:    sarah.connor@taskflow.com/ Employee@123');
  console.log(' Employee Demo:    david.kim@taskflow.com   / Employee@123');
  console.log('----------------------------------------------------');
};

if (require.main === module) {
  seedData()
    .then(() => {
      console.log('[TaskFlow Seeder] Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[TaskFlow Seeder Error]', err);
      process.exit(1);
    });
}

module.exports = { seedData };