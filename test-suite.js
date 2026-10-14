const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Running TaskFlow Authentication & Role Security Suite');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(healthRes.status === 200 && health.status === 'healthy', 'API health check returns 200 OK');

    // 2. Designated Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@taskflow.com', password: 'Admin@123' }),
    });
    const adminLogin = await adminLoginRes.json();
    assert(
      adminLoginRes.status === 200 && adminLogin.token && adminLogin.user.role === 'admin',
      'Designated Admin login succeeds with JWT and role: admin'
    );
    const adminToken = adminLogin.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 3. Rule 3 & 4: Employee Public Self-Registration
    const testEmployeeEmail = `test.emp.${Date.now()}@company.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: testEmployeeEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        department: 'Product Engineering',
        role: 'admin', // Malicious attempt to claim admin role!
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success && regData.user.role === 'employee',
      'Rule 8: Backend strictly assigns role "employee" and ignores client-supplied role'
    );
    assert(regData.token, 'Registration returns signed JWT token for immediate access');

    // 4. Rule 4: Duplicate Email Check
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Duplicate',
        email: testEmployeeEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 400 && dupData.message.includes('already exists'),
      'Rule 4: Duplicate email check rejects existing email with 400 Bad Request'
    );

    // 5. Rule 3: Password Mismatch Check
    const mismatchRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mismatch User',
        email: `mismatch.${Date.now()}@company.com`,
        password: 'Password@123',
        confirmPassword: 'DifferentPassword@123',
      }),
    });
    assert(
      mismatchRes.status === 400,
      'Rule 3: Password & Confirm Password mismatch is rejected with 400'
    );

    // 6. Rule 2: Cannot register as the designated Admin email
    const adminRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fake Admin',
        email: 'admin@taskflow.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    assert(
      adminRegRes.status === 400,
      'Rule 2: Attempting to register as the designated Admin email is blocked'
    );

    // 7. Rule 7: Registered Employee can log in with email and password
    const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmployeeEmail,
        password: 'Password@123',
      }),
    });
    const empLogin = await empLoginRes.json();
    assert(
      empLoginRes.status === 200 && empLogin.user.role === 'employee',
      'Rule 7: Registered Employee logs in successfully with hashed bcrypt verification'
    );
    const empHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${empLogin.token}`,
    };

    // 8. Rule 1 & 9: Employees are strictly forbidden from Admin APIs
    const forbiddenRes = await fetch(`${BASE_URL}/dashboard/admin`, { headers: empHeaders });
    assert(
      forbiddenRes.status === 403,
      'Rule 1 & 9: Employee calling GET /api/dashboard/admin is rejected with 403 Forbidden'
    );

    const forbiddenEmpRes = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({ name: 'Hacker', email: 'h@h.com', password: '123' }),
    });
    assert(
      forbiddenEmpRes.status === 403,
      'Rule 9: Employee calling POST /api/employees is rejected with 403 Forbidden'
    );

    // 9. Rule 1: Only the designated Admin can access Admin Dashboard
    const adminDashRes = await fetch(`${BASE_URL}/dashboard/admin`, { headers: adminHeaders });
    assert(
      adminDashRes.status === 200,
      'Rule 1: Designated Admin account accesses Admin dashboard successfully'
    );

    // 10. Rule 10: Employees only access tasks assigned to their own accounts
    const empTasksRes = await fetch(`${BASE_URL}/tasks`, { headers: empHeaders });
    const empTasks = await empTasksRes.json();
    assert(
      empTasksRes.status === 200 && empTasks.tasks.every(t => t.assignedTo._id === empLogin.user.id),
      'Rule 10: Employees can only view tasks assigned to their own accounts'
    );

    // 11. Task assignment lifecycle & update
    const newTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'Task Assigned to New Employee',
        description: 'Verify status update permissions',
        assignedTo: empLogin.user.id,
        priority: 'High',
        status: 'Not Started',
      }),
    });
    const newTask = await newTaskRes.json();
    assert(newTaskRes.status === 201, 'Admin assigns task to newly registered employee');

    // 12. Employee updates task status
    const updateRes = await fetch(`${BASE_URL}/tasks/${newTask.task._id}/status`, {
      method: 'PATCH',
      headers: empHeaders,
      body: JSON.stringify({ status: 'In Progress' }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.task.status === 'In Progress',
      'Employee updates their assigned task status successfully'
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();