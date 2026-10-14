const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all employees with task statistics & server-side pagination
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const statusFilter = req.query.status; // 'all', 'active', 'inactive'

    const query = { role: 'employee' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (statusFilter === 'active') {
      query.isActive = true;
    } else if (statusFilter === 'inactive') {
      query.isActive = false;
    }

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch live task counts per employee for the current page
    const employeeIds = employees.map((e) => e._id);
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: { $in: employeeIds } } },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: {
              $cond: [
                { $in: ['$status', ['In Progress', 'Pending']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsMap = {};
    taskStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        totalTasks: stat.totalTasks,
        completedTasks: stat.completedTasks,
        inProgressTasks: stat.inProgressTasks,
      };
    });

    const employeesWithStats = employees.map((emp) => {
      const stats = statsMap[emp._id.toString()] || {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
      };
      return {
        id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        isActive: emp.isActive,
        createdAt: emp.createdAt,
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        inProgressTasks: stats.inProgressTasks,
      };
    });

    res.status(200).json({
      success: true,
      employees: employeesWithStats,
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

// @desc    Get lightweight employee dropdown list (active only)
// @route   GET /api/employees/dropdown
// @access  Private/Admin
const getEmployeeDropdown = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee', isActive: true })
      .select('name email department')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      employees: employees.map((e) => ({
        id: e._id,
        name: e.name,
        email: e.email,
        department: e.department,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee details + their assigned tasks
// @route   GET /api/employees/:id
// @access  Private/Admin
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const tasks = await Task.find({ assignedTo: employee._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress' || t.status === 'Pending').length,
      notStarted: tasks.filter((t) => t.status === 'Not Started').length,
    };

    res.status(200).json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
      },
      stats,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, department, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const employee = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'employee',
      department: department?.trim() || 'General',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, department, role, password } = req.body;
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (email && email.toLowerCase().trim() !== employee.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: employee._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another user',
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    if (name) employee.name = name.trim();
    if (department) employee.department = department.trim();
    if (role && ['admin', 'employee'].includes(role)) employee.role = role;

    if (password && password.trim().length >= 6) {
      employee.password = password.trim();
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle employee active/inactive status
// @route   PATCH /api/employees/:id/status
// @access  Private/Admin
const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (employee._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account',
      });
    }

    const newStatus =
      req.body.isActive !== undefined ? Boolean(req.body.isActive) : !employee.isActive;

    employee.isActive = newStatus;
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee account ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: employee.isActive,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeDropdown,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
};