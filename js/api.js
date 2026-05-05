/**
 * Suler EMS - Mock Core Data API
 * Handles Employees, Attendance, and Leave Modules
 */

const API = {
  // Mock Databases
  db: {
    employees: [
      { id: 'emp_01', name: 'John Employee', department: 'Engineering', role: 'Employee', status: 'Active' },
      { id: 'emp_02', name: 'Mike Manager', department: 'Engineering', role: 'Manager', status: 'Active' },
      { id: 'emp_03', name: 'Sarah Admin', department: 'HR', role: 'Admin', status: 'Active' }
    ],
    attendance: [
      { id: 'att_01', user_id: 'usr_004', date: new Date().toISOString().split('T')[0], status: 'On-Time', checkIn: '08:50 AM', checkOut: null }
    ],
    leaves: [
      { id: 'lv_01', user_id: 'usr_004', type: 'Annual', startDate: '2026-06-01', endDate: '2026-06-05', reason: 'Vacation', status: 'Pending' },
      { id: 'lv_02', user_id: 'usr_004', type: 'Sick', startDate: '2026-03-10', endDate: '2026-03-11', reason: 'Flu', status: 'Approved' }
    ],
    tasks: [
      { id: 'tsk_01', title: 'Complete Q2 Report', assignedTo: 'usr_004', status: 'In Progress', priority: 'High', dueDate: '2026-05-15', progress: 50 },
      { id: 'tsk_02', title: 'Update HR Policies', assignedTo: 'usr_004', status: 'Pending', priority: 'Medium', dueDate: '2026-05-20', progress: 0 }
    ],
    notifications: [
      { id: 'notif_01', targetRole: 'manager', type: 'info', message: 'System update scheduled for tonight.', isRead: false, time: new Date().toISOString() }
    ],
    settings: {
      companyName: 'Suler Enterprise',
      lateThreshold: '09:15',
      workHoursStart: '09:00',
      workHoursEnd: '17:00',
      emailNotifications: true
    },
    permissions: [
      { id: 'view_employees', name: 'View Employees Directory' },
      { id: 'edit_employees', name: 'Edit Employee Records' },
      { id: 'approve_leave', name: 'Approve Leave Requests' },
      { id: 'manage_roles', name: 'Create/Edit System Roles' },
      { id: 'assign_roles', name: 'Assign Roles to Users' },
      { id: 'view_audit_all', name: 'View Global Audit Logs' }
    ],
    role_permissions: [
      { roleId: 'super_admin', permissions: ['view_employees', 'edit_employees', 'approve_leave', 'manage_roles', 'assign_roles', 'view_audit_all'] },
      { roleId: 'admin', permissions: ['view_employees', 'edit_employees', 'approve_leave', 'assign_roles'] },
      { roleId: 'manager', permissions: ['view_employees', 'approve_leave'] }
    ],
    audit_logs: []
  },

  // --- INTERNAL HELPER ---
  async logAction(userId, action, entityType, entityId, details = '') {
    this.db.audit_logs.unshift({
      id: 'log_' + Date.now(),
      user_id: userId,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      timestamp: new Date().toISOString(),
      details: details
    });
  },

  // --- Helper to simulate network delay ---
  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // --- EMPLOYEES ---
  async getEmployees() {
    await this.delay();
    return { success: true, data: this.db.employees };
  },

  async addEmployee(employeeData) {
    await this.delay();
    const newEmp = { ...employeeData, id: 'emp_' + Date.now(), status: 'Active' };
    this.db.employees.push(newEmp);
    return { success: true, message: 'Employee added successfully', data: newEmp };
  },

  // --- ATTENDANCE ---
  async checkIn(userId) {
    await this.delay();
    const today = new Date().toISOString().split('T')[0];
    const existing = this.db.attendance.find(a => a.user_id === userId && a.date === today);
    if (existing) {
      return { success: false, message: 'Already checked in today' };
    }
    
    const newRecord = {
      id: 'att_' + Date.now(),
      user_id: userId,
      date: today,
      status: 'On-Time', // Mock logic: in reality based on time
      checkIn: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      checkOut: null
    };
    this.db.attendance.push(newRecord);
    return { success: true, message: 'Checked in successfully', data: newRecord };
  },

  async getMyAttendance(userId) {
    await this.delay();
    const records = this.db.attendance.filter(a => a.user_id === userId);
    return { success: true, data: records };
  },

  // --- LEAVE ---
  async requestLeave(userId, leaveData) {
    await this.delay();
    const newLeave = {
      id: 'lv_' + Date.now(),
      user_id: userId,
      ...leaveData,
      status: 'Pending'
    };
    this.db.leaves.push(newLeave);
    
    // MOCK EVENT ENGINE: Trigger notification to managers
    this.db.notifications.unshift({
      id: 'notif_' + Date.now(),
      targetRole: 'manager',
      type: 'approval',
      message: `New Leave Request submitted by employee`,
      isRead: false,
      time: new Date().toISOString()
    });
    
    return { success: true, message: 'Leave request submitted successfully', data: newLeave };
  },

  async getMyLeaves(userId) {
    await this.delay();
    const records = this.db.leaves.filter(l => l.user_id === userId);
    return { success: true, data: records };
  },

  async getPendingApprovals() {
    await this.delay();
    // In a real app, this is filtered by the Manager's department or Admin's scope
    const records = this.db.leaves.filter(l => l.status === 'Pending');
    // Hydrate with employee info
    const hydrated = records.map(l => {
      const emp = this.db.employees.find(e => e.id === 'emp_01'); // Hardcoded mapping for mock
      return { ...l, employeeName: emp ? emp.name : 'Unknown' };
    });
    return { success: true, data: hydrated };
  },

  async approveLeave(leaveId, action) { // action = 'Approve' | 'Reject'
    await this.delay();
    const index = this.db.leaves.findIndex(l => l.id === leaveId);
    if (index === -1) return { success: false, message: 'Leave not found' };
    
    const status = action === 'Approve' ? 'Approved' : 'Rejected';
    this.db.leaves[index].status = status;
    return { success: true, message: `Leave request ${status.toLowerCase()}`, data: this.db.leaves[index] };
  },

  // --- TASKS ---
  async getTasks(filters = {}) {
    await this.delay();
    let tasks = [...this.db.tasks];
    if (filters.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filters.assignedTo);
    }
    
    // Hydrate with employee info
    const hydrated = tasks.map(t => {
      const emp = this.db.employees.find(e => e.id === 'emp_01'); // Mock mapping
      return { ...t, assignedName: t.assignedTo === 'usr_004' ? 'John Employee' : 'Unknown' };
    });
    
    return { success: true, data: hydrated };
  },

  async createTask(taskData) {
    await this.delay();
    const newTask = {
      id: 'tsk_' + Date.now(),
      ...taskData,
      status: 'Pending',
      progress: 0
    };
    this.db.tasks.push(newTask);
    return { success: true, message: 'Task assigned successfully', data: newTask };
  },

  async updateTaskStatus(taskId, status, progress) {
    await this.delay();
    const index = this.db.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return { success: false, message: 'Task not found' };
    
    if (status) this.db.tasks[index].status = status;
    if (progress !== undefined) this.db.tasks[index].progress = progress;
    
    return { success: true, message: 'Task updated', data: this.db.tasks[index] };
  },

  // --- NOTIFICATIONS ---
  async getNotifications(roleId) {
    // Return mock notifications that target the specific role (or all roles for demo)
    await this.delay(100);
    const notifications = this.db.notifications.filter(n => n.targetRole === roleId || n.targetRole === 'all');
    return { success: true, data: notifications };
  },

  async markNotificationRead(notifId) {
    await this.delay(50);
    const notif = this.db.notifications.find(n => n.id === notifId);
    if (notif) notif.isRead = true;
    return { success: true };
  },

  // --- SYSTEM & AUDIT ---
  async getSettings() {
    await this.delay(100);
    return { success: true, data: this.db.settings };
  },

  async getRolePermissions() {
    await this.delay(100);
    return { success: true, data: {
      permissions: this.db.permissions,
      roleMappings: this.db.role_permissions
    }};
  },

  async getAuditLogs(activeRole) {
    await this.delay(200);
    let logs = this.db.audit_logs;
    
    // Tiered Access: Admins only see limited logs (e.g., Auth, Leaves). Super Admins see all.
    if (activeRole === 'admin') {
      logs = logs.filter(l => l.entity_type !== 'System' && l.entity_type !== 'RoleManagement');
    }
    
    return { success: true, data: logs };
  }
};
