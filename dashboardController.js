const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get Admin live dashboard analytics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalTasks = await Task.countDocuments();
    const notStartedTasks = await Task.countDocuments({ status: 'Not Started' });
    const inProgressTasks = await Task.countDocuments({
      status: { $in: ['In Progress', 'Pending'] },
    });
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const highPriorityTasks = await Task.countDocuments({ priority: 'High' });
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({
      role: 'employee',
      isActive: true,
    });

    // Status distribution for Recharts Donut / Pie
    const statusCounts = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      'Not Started': 0,
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0,
    };
    statusCounts.forEach((s) => {
      if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count;
    });

    const statusDistribution = [
      { name: 'Not Started', value: statusMap['Not Started'], color: '#94a3b8' },
      { name: 'Pending', value: statusMap['Pending'], color: '#f59e0b' },
      { name: 'In Progress', value: statusMap['In Progress'], color: '#3b82f6' },
      { name: 'Completed', value: statusMap['Completed'], color: '#10b981' },
    ];

    // Priority distribution for Recharts Bar Chart
    const priorityCounts = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityMap = { High: 0, Medium: 0, Low: 0 };
    priorityCounts.forEach((p) => {
      if (priorityMap[p._id] !== undefined) priorityMap[p._id] = p.count;
    });

    const priorityDistribution = [
      { priority: 'High', count: priorityMap['High'], fill: '#ef4444' },
      { priority: 'Medium', count: priorityMap['Medium'], fill: '#f59e0b' },
      { priority: 'Low', count: priorityMap['Low'], fill: '#10b981' },
    ];

    // Employee workload & completion breakdown for Recharts
    const employeeWorkloads = await Task.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
          inProgress: {
            $sum: {
              $cond: [{ $in: ['$status', ['In Progress', 'Pending']] }, 1, 0],
            },
          },
        },
      },
      { $limit: 8 },
    ]);

    // Populate employee names for chart
    const populatedWorkloads = await Promise.all(
      employeeWorkloads.map(async (ew) => {
        const emp = await User.findById(ew._id).select('name department');
        return {
          name: emp ? emp.name.split(' ')[0] : 'Unknown',
          fullName: emp ? emp.name : 'Unknown',
          total: ew.total,
          completed: ew.completed,
          inProgress: ew.inProgress,
        };
      })
    );

    // Recent 5 tasks
    const recentTasks = await Task.find()
      .populate('assignedTo', 'name email department avatar')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        notStarted: notStartedTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        highPriority: highPriorityTasks,
        totalEmployees,
        activeEmployees,
      },
      charts: {
        statusDistribution,
        priorityDistribution,
        employeeWorkloads: populatedWorkloads,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Employee personalized dashboard
// @route   GET /api/dashboard/employee
// @access  Private/Employee
const getEmployeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const totalAssigned = await Task.countDocuments({ assignedTo: userId });
    const notStarted = await Task.countDocuments({
      assignedTo: userId,
      status: 'Not Started',
    });
    const pendingInProgress = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ['In Progress', 'Pending'] },
    });
    const completed = await Task.countDocuments({
      assignedTo: userId,
      status: 'Completed',
    });
    const overdue = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $lt: now },
      status: { $ne: 'Completed' },
    });

    const completionRate =
      totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

    // Upcoming deadlines (next 5 not completed tasks with due dates)
    const upcomingDeadlines = await Task.find({
      assignedTo: userId,
      status: { $ne: 'Completed' },
      dueDate: { $ne: null },
    })
      .sort({ dueDate: 1 })
      .limit(5);

    // Recent assigned tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        notStarted,
        pendingInProgress,
        completed,
        overdue,
        completionRate,
      },
      upcomingDeadlines,
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminDashboard, getEmployeeDashboard };