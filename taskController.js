const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
} = require('../services/emailService');

// @desc    Get paginated & filtered tasks
// @route   GET /api/tasks
// @access  Private (Admin sees all, Employee sees assigned only)
const getTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      priority,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Role enforcement
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    } else if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search query across title, description, or employee name
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };

      // Find employees matching search
      const matchingEmployees = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const employeeIds = matchingEmployees.map((e) => e._id);

      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { assignedTo: { $in: employeeIds } },
      ];
    }

    // Sort order
    const sort = {};
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
    const field = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sort[field] = sortOrder === 'asc' ? 1 : -1;

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department avatar')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email department avatar')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Role check: Employee can only see tasks assigned to them
    if (
      req.user.role === 'employee' &&
      !task.assignedTo._id.equals(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this task',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;

    if (!title || !description || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and assigned employee are required',
      });
    }

    // Verify assigned employee exists and is active
    const employee = await User.findById(assignedTo);
    if (!employee || !employee.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected employee does not exist or is inactive',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      priority: priority || 'Medium',
      status: status || 'Not Started',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email');

    // Create In-App Notification for employee
    try {
      await Notification.create({
        recipient: employee._id,
        title: 'New Task Assigned',
        message: `You were assigned "${task.title}" by ${req.user.name}`,
        type: 'task_assigned',
        task: task._id,
      });
    } catch (notifErr) {
      console.warn('[TaskFlow] In-app notification error:', notifErr.message);
    }

    // Trigger Email Notification (non-blocking, graceful fallback)
    let emailResult = { success: false, delivered: false, reason: 'Pending' };
    try {
      emailResult = await sendTaskAssignmentEmail({
        employee,
        task: populatedTask,
        admin: req.user,
      });
    } catch (emailErr) {
      emailResult = {
        success: false,
        delivered: false,
        reason: emailErr.message,
      };
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask,
      emailStatus: {
        sent: emailResult.delivered,
        message: emailResult.delivered
          ? 'Notification email sent to employee'
          : `Email notification skipped: ${emailResult.reason}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private/Admin
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const previousAssigneeId = task.assignedTo.toString();

    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    let assigneeChanged = false;
    let newEmployee = null;

    if (assignedTo && assignedTo !== previousAssigneeId) {
      newEmployee = await User.findById(assignedTo);
      if (!newEmployee || !newEmployee.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Selected new employee does not exist or is inactive',
        });
      }
      task.assignedTo = assignedTo;
      assigneeChanged = true;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email');

    // If assignee changed, notify the new assignee
    if (assigneeChanged && newEmployee) {
      try {
        await Notification.create({
          recipient: newEmployee._id,
          title: 'Task Reassigned',
          message: `Task "${task.title}" has been reassigned to you by ${req.user.name}`,
          type: 'task_assigned',
          task: task._id,
        });

        sendTaskAssignmentEmail({
          employee: newEmployee,
          task: updatedTask,
          admin: req.user,
        }).catch((err) => console.warn('[Email Warning]', err.message));
      } catch (err) {
        console.warn('[Notification Warning]', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status (Employee updates own task, Admin can update any)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Employee or Admin)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Not Started', 'Pending', 'In Progress', 'Completed'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Role verification: If Employee, must be assigned to them
    if (
      req.user.role === 'employee' &&
      !task.assignedTo._id.equals(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update tasks assigned to your account',
      });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    // In-app Notification for Admin / Creator
    try {
      const recipientId = task.createdBy?._id || task.createdBy;
      if (recipientId && !recipientId.equals(req.user._id)) {
        await Notification.create({
          recipient: recipientId,
          title: 'Task Status Updated',
          message: `${req.user.name} changed "${task.title}" from ${previousStatus} to ${status}`,
          type: 'status_updated',
          task: task._id,
        });
      }
    } catch (notifErr) {
      console.warn('[TaskFlow Notification Warning]', notifErr.message);
    }

    // Email notification to Admin
    let emailResult = { success: false, delivered: false, reason: 'Pending' };
    try {
      emailResult = await sendTaskStatusUpdateEmail({
        employee: req.user,
        task,
        previousStatus,
        newStatus: status,
      });
    } catch (emailErr) {
      emailResult = {
        success: false,
        delivered: false,
        reason: emailErr.message,
      };
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      task,
      emailStatus: {
        sent: emailResult.delivered,
        message: emailResult.delivered
          ? 'Admin notified via email'
          : `Email notification skipped: ${emailResult.reason}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ task: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      deletedId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};