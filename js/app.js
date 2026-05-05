/**
 * Suler EMS - Main Application Logic
 * Handles View Switching, UI Rendering, and Event Listeners
 */

const App = {
  // DOM Elements
  els: {
    loader: document.getElementById('global-loader'),
    loginView: document.getElementById('login-view'),
    appShell: document.getElementById('app-shell'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    
    // Shell Elements
    sidebar: document.getElementById('sidebar'),
    sidebarNav: document.getElementById('sidebar-nav'),
    appContent: document.getElementById('app-content'),
    
    // Topbar
    userName: document.getElementById('user-name-display'),
    userAvatar: document.getElementById('user-avatar'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Role Switcher
    roleSwitcherContainer: document.getElementById('role-switcher-container'),
    roleSwitcherBtn: document.getElementById('role-switcher-btn'),
    activeRoleLabel: document.getElementById('active-role-label'),
    roleSwitcherMenu: document.getElementById('role-switcher-menu'),
    
    // Impersonation
    impersonationBanner: document.getElementById('impersonation-banner'),
    impersonatedUserName: document.getElementById('impersonated-user-name'),
    exitImpersonationBtn: document.getElementById('exit-impersonation-btn'),
    
    // Notifications
    notificationsContainer: document.getElementById('notifications-container'),
    notificationsBtn: document.getElementById('notifications-btn'),
    notificationsPanel: document.getElementById('notifications-panel'),
    notificationsBadge: document.getElementById('notifications-badge'),
    notificationList: document.getElementById('notification-list'),
    markAllReadBtn: document.getElementById('mark-all-read-btn'),
    
    // Mobile
    mobileMenuBtn: document.getElementById('mobile-menu-btn')
  },

  // Navigation Maps based on active role
  navigationConfig: {
    'employee': [
      { id: 'emp_dash',       label: 'Dashboard',   icon: 'home',         section: 'main' },
      { id: 'emp_attendance', label: 'Attendance',   icon: 'clock',        section: 'main' },
      { id: 'emp_leave',      label: 'Leave',        icon: 'calendar',     section: 'main' },
      { id: 'emp_paystubs',   label: 'My Paystubs',  icon: 'folder',       section: 'main' },
      { id: 'emp_profile',    label: 'My Profile',   icon: 'user',         section: 'profile' }
    ],
    'manager': [
      { id: 'mgr_dash',      label: 'Dashboard',       icon: 'home',          section: 'main' },
      { id: 'mgr_team',      label: 'Team Overview',   icon: 'users',         section: 'main' },
      { id: 'mgr_approvals', label: 'Leave Approvals', icon: 'check-circle',  section: 'management' },
      { id: 'mgr_reports',   label: 'Performance',     icon: 'bar-chart',     section: 'management' },
      { id: 'mgr_tasks',     label: 'Tasks',           icon: 'check-square',  section: 'management' }
    ],
    'admin': [
      { id: 'adm_dash',       label: 'Dashboard',       icon: 'home',         section: 'main' },
      { id: 'adm_employees',  label: 'Employees',       icon: 'users',        section: 'main' },
      { id: 'adm_attendance', label: 'Attendance',      icon: 'clock',        section: 'main' },
      { id: 'adm_leave',      label: 'Leave Management',icon: 'calendar',     section: 'main' },
      { id: 'adm_payroll',    label: 'Payroll',         icon: 'folder',       section: 'finance' },
      { id: 'adm_roles',      label: 'Role Assignments',icon: 'shield',       section: 'settings' },
      { id: 'adm_audit',      label: 'Audit Logs',      icon: 'activity',     section: 'settings' }
    ],
    'super_admin': [
      // OVERVIEW
      { id: 'sup_dash',          label: 'System Overview',    icon: 'home',         section: 'overview' },
      // EMPLOYEE MANAGEMENT
      { id: 'sup_employees',     label: 'All Employees',      icon: 'users',        section: 'employees' },
      { id: 'sup_payroll',       label: 'Payroll Processing', icon: 'folder',       section: 'employees' },
      { id: 'sup_salary',        label: 'Salary Structures',  icon: 'pie-chart',    section: 'employees' },
      // WORKFORCE
      { id: 'sup_attendance',    label: 'Attendance & Leave', icon: 'clock',        section: 'workforce' },
      { id: 'sup_leave',         label: 'Leave Management',   icon: 'calendar',     section: 'workforce' },
      { id: 'sup_performance',   label: 'Performance',        icon: 'bar-chart',    section: 'workforce' },
      // ORGANIZATION
      { id: 'sup_org',           label: 'Org Analytics',      icon: 'pie-chart',    section: 'organization' },
      { id: 'sup_roles',         label: 'Role Management',    icon: 'shield',       section: 'organization' },
      { id: 'sup_audit',         label: 'Audit Logs',         icon: 'activity',     section: 'organization' },
      // SYSTEM
      { id: 'sup_settings',      label: 'System Settings',    icon: 'settings',     section: 'system' },
      { id: 'sup_notifications', label: 'Notifications',      icon: 'bell',         section: 'system' },
      { id: 'sup_impersonate',   label: 'Impersonation',      icon: 'user-x',       section: 'system' }
    ]
  },

  // Super Admin accordion section config
  superAdminSections: [
    {
      key: 'overview',
      label: 'OVERVIEW',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      defaultOpen: true
    },
    {
      key: 'employees',
      label: 'EMPLOYEE MANAGEMENT',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      defaultOpen: false
    },
    {
      key: 'workforce',
      label: 'WORKFORCE',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      defaultOpen: false
    },
    {
      key: 'organization',
      label: 'ORGANIZATION',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
      defaultOpen: false
    },
    {
      key: 'system',
      label: 'SYSTEM',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      defaultOpen: false
    }
  ],

  init() {
    this.bindEvents();
    this.checkSession();
  },

  bindEvents() {
    // Login form submit
    this.els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      this.handleLogin(email, password);
    });

    // Logout
    this.els.logoutBtn.addEventListener('click', () => {
      this.handleLogout();
    });

    // Role Switcher Toggle
    this.els.roleSwitcherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = this.els.roleSwitcherMenu;
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!this.els.roleSwitcherContainer.contains(e.target)) {
        this.els.roleSwitcherMenu.style.display = 'none';
      }
      if (this.els.notificationsContainer && !this.els.notificationsContainer.contains(e.target)) {
        this.els.notificationsPanel.style.display = 'none';
      }

      // Handle closing sleek-dropdowns
      if (!e.target.closest('.filter-chip')) {
        document.querySelectorAll('.sleek-dropdown.open').forEach(dropdown => {
          dropdown.classList.remove('open');
        });
      }

      // Handle sleek-dropdown-item selection
      const dropdownItem = e.target.closest('.sleek-dropdown-item');
      if (dropdownItem) {
        const dropdown = dropdownItem.closest('.sleek-dropdown');
        if (dropdown) {
          dropdown.querySelectorAll('.sleek-dropdown-item').forEach(item => item.classList.remove('selected'));
          dropdownItem.classList.add('selected');
          
          // Optional: Update the chip label text if needed
          const filterChip = dropdown.previousElementSibling;
          if (filterChip && filterChip.classList.contains('filter-chip')) {
            const prefixLabel = filterChip.querySelector('span');
            const newText = dropdownItem.textContent.replace('▸', '').trim();
            if (prefixLabel) {
              filterChip.innerHTML = '';
              filterChip.appendChild(prefixLabel);
              filterChip.appendChild(document.createTextNode(' ' + newText));
            }
          }
        }
      }
    });

    // Exit Impersonation
    this.els.exitImpersonationBtn.addEventListener('click', () => {
      Store.clearImpersonation();
      this.renderAppShell();
    });

    // Notifications Toggle
    if (this.els.notificationsBtn) {
      this.els.notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = this.els.notificationsPanel;
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      });
      
      this.els.markAllReadBtn.addEventListener('click', () => {
        this.els.notificationsBadge.style.display = 'none';
        document.querySelectorAll('.notification-item').forEach(el => el.classList.remove('unread'));
      });
    }

    // Mobile Menu Toggle
    if (this.els.mobileMenuBtn) {
      this.els.mobileMenuBtn.addEventListener('click', () => {
        this.els.sidebar.classList.toggle('mobile-open');
      });
    }
  },

  showLoader(show) {
    if (show) this.els.loader.classList.remove('hidden');
    else this.els.loader.classList.add('hidden');
  },

  async checkSession() {
    this.showLoader(true);
    
    if (Store.isAuthenticated()) {
      // Validate session with mock API
      const res = await AuthAPI.me(Store.state.token);
      if (res.success) {
        this.showAppShell();
      } else {
        this.handleLogout();
      }
    } else {
      this.showLoginView();
    }
    
    this.showLoader(false);
  },

  async handleLogin(email, password) {
    this.showLoader(true);
    this.els.loginError.classList.add('hidden');
    
    try {
      const res = await AuthAPI.login(email, password);
      
      if (res.success) {
        // Set default role: prefer super_admin, else first available
        const defaultRole = res.data.defaultRole || res.data.user.roles[0]?.id;
        Store.setSession(res.data.user, res.data.token);
        if (defaultRole) Store.setActiveRole(defaultRole);
        this.showAppShell();
      } else {
        this.els.loginError.textContent = res.message;
        this.els.loginError.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      this.els.loginError.textContent = "An error occurred during login.";
      this.els.loginError.classList.remove('hidden');
    }
    
    this.showLoader(false);
  },

  handleLogout() {
    Store.clearSession();
    this.showLoginView();
  },

  showLoginView() {
    this.els.appShell.classList.add('hidden');
    this.els.loginView.classList.remove('hidden');
  },

  showAppShell() {
    this.els.loginView.classList.add('hidden');
    this.els.appShell.classList.remove('hidden');
    this.renderAppShell();
    this.pollNotifications();
  },

  renderAppShell() {
    const user = Store.getUser();
    const activeRole = Store.getActiveRole();
    const impersonatedUser = Store.getImpersonation();
    
    const effectiveUser = impersonatedUser || user;
    const effectiveActiveRole = impersonatedUser ? Store.getActiveRole() : activeRole;

    // Update sidebar user info
    this.els.userName.textContent = effectiveUser.name;
    this.els.userAvatar.textContent = effectiveUser.initials;
    
    // Update role label under avatar
    const roleDisplay = document.getElementById('user-role-display');
    if (roleDisplay) {
      const activeRoleObj = (effectiveUser.roles || []).find(r => r.id === effectiveActiveRole);
      roleDisplay.textContent = activeRoleObj ? activeRoleObj.name : effectiveActiveRole;
    }

    // Update sidebar portal label
    const sidebarPortalLabels = {
      'super_admin': 'Super Admin Portal',
      'admin':       'Admin Portal',
      'manager':     'Manager Portal',
      'employee':    'Employee Self-Service'
    };
    const sidebarLabel = document.getElementById('sidebar-role-label');
    if (sidebarLabel) sidebarLabel.textContent = sidebarPortalLabels[effectiveActiveRole] || 'System Portal';

    // Impersonation Banner
    if (impersonatedUser) {
      this.els.impersonatedUserName.textContent = impersonatedUser.name;
      this.els.impersonationBanner.classList.remove('hidden');
    } else {
      this.els.impersonationBanner.classList.add('hidden');
    }

    this.renderRoleSwitcher(effectiveUser, effectiveActiveRole);
    this.renderSidebar(effectiveActiveRole);

    const defaultViews = {
      'employee':    'emp_dash',
      'manager':     'mgr_dash',
      'admin':       'adm_dash',
      'super_admin': 'sup_dash'
    };
    this.routeView(defaultViews[effectiveActiveRole] || 'emp_dash', effectiveActiveRole);
  },

  renderRoleSwitcher(user, activeRole) {
    const roles = user.roles || [];
    
    if (roles.length <= 1) {
      this.els.roleSwitcherContainer.style.display = 'none';
      return;
    }
    
    this.els.roleSwitcherContainer.style.display = '';
    
    const activeRoleObj = roles.find(r => r.id === activeRole);
    if (activeRoleObj && this.els.activeRoleLabel) {
      this.els.activeRoleLabel.textContent = activeRoleObj.name;
    }

    this.els.roleSwitcherMenu.innerHTML = '';
    roles.forEach(role => {
      const btn = document.createElement('button');
      btn.className = `role-option ${role.id === activeRole ? 'active' : ''}`;
      btn.innerHTML = `<span class="role-dot"></span>${role.name}`;
      btn.addEventListener('click', () => {
        Store.setActiveRole(role.id);
        this.els.roleSwitcherMenu.style.display = 'none';
        this.renderAppShell();
      });
      this.els.roleSwitcherMenu.appendChild(btn);
    });
  },

  renderSidebar(activeRole) {
    const navItems = this.navigationConfig[activeRole] || [];
    this.els.sidebarNav.innerHTML = '';

    // Chevron SVG for accordion
    const chevronSVG = `<svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;

    // SVG icon map matching item.icon names
    const icons = {
      'home':        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      'check-square':`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      'clock':       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      'calendar':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      'user':        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      'users':       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      'check-circle':`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      'bar-chart':   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
      'shield':      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      'activity':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      'settings':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      'user-x':      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>`,
      'pie-chart':   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
      'bell':        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      'folder':      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    };

    // ---- Helper: create a nav item element ----
    const makeNavItem = (item, isActive) => {
      const a = document.createElement('a');
      a.href = '#';
      a.className = `nav-item${isActive ? ' active' : ''}`;
      a.dataset.viewId = item.id;
      a.innerHTML = `<span class="nav-item-icon">${icons[item.icon] || ''}</span>${item.label}`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        a.classList.add('active');
        this.routeView(item.id, activeRole);
        if (window.innerWidth <= 768 && this.els.sidebar) {
          this.els.sidebar.classList.remove('mobile-open');
        }
      });
      return a;
    };

    // ---- SUPER ADMIN: accordion sections ----
    if (activeRole === 'super_admin') {
      const navById = {};
      navItems.forEach(item => { navById[item.id] = item; });
      let isFirst = true;

      this.superAdminSections.forEach(section => {
        const sectionItems = navItems.filter(item => item.section === section.key);
        if (!sectionItems.length) return;

        // Section header button
        const headerBtn = document.createElement('button');
        headerBtn.className = `nav-section-header${section.defaultOpen ? ' open' : ''}`;
        headerBtn.innerHTML = `
          <span style="display:flex;align-items:center;gap:6px;">
            <span class="nav-section-icon">${section.icon}</span>
            ${section.label}
          </span>
          ${chevronSVG}
        `;

        // Items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = `nav-section-items${section.defaultOpen ? ' open' : ''}`;

        sectionItems.forEach(item => {
          const a = makeNavItem(item, isFirst);
          if (isFirst) isFirst = false;
          itemsContainer.appendChild(a);
        });

        // Toggle accordion
        headerBtn.addEventListener('click', () => {
          const isOpen = itemsContainer.classList.contains('open');
          itemsContainer.classList.toggle('open', !isOpen);
          headerBtn.classList.toggle('open', !isOpen);
        });

        this.els.sidebarNav.appendChild(headerBtn);
        this.els.sidebarNav.appendChild(itemsContainer);
      });

    } else {
      // ---- OTHER ROLES: flat labeled sections ----
      const sectionLabels = {
        main: null,  // no label for primary section
        management: 'Management',
        finance: 'Finance',
        settings: 'Settings',
        profile: 'Account'
      };
      const sectionsOrder = ['main', 'management', 'finance', 'settings', 'profile'];
      const grouped = {};
      navItems.forEach(item => {
        const s = item.section || 'main';
        if (!grouped[s]) grouped[s] = [];
        grouped[s].push(item);
      });

      let isFirst = true;
      sectionsOrder.forEach(sectionKey => {
        const sectionItems = grouped[sectionKey];
        if (!sectionItems || !sectionItems.length) return;

        // Add label (if not main)
        if (sectionLabels[sectionKey]) {
          const labelEl = document.createElement('div');
          labelEl.className = 'nav-section-label';
          labelEl.textContent = sectionLabels[sectionKey];
          this.els.sidebarNav.appendChild(labelEl);
        }

        sectionItems.forEach(item => {
          const a = makeNavItem(item, isFirst);
          if (isFirst) isFirst = false;
          this.els.sidebarNav.appendChild(a);
        });
      });
    }
  },

  async pollNotifications() {
    const activeRole = Store.getActiveRole();
    if(!activeRole) return;
    
    const res = await API.getNotifications(activeRole);
    if(res.success && this.els.notificationList) {
      const notifs = res.data;
      const unreadCount = notifs.filter(n => !n.isRead).length;
      
      if(unreadCount > 0) {
        this.els.notificationsBadge.textContent = unreadCount;
        this.els.notificationsBadge.classList.remove('hidden');
      } else {
        this.els.notificationsBadge.classList.add('hidden');
      }
      
      if(notifs.length === 0) {
        this.els.notificationList.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary)">No notifications.</div>';
      } else {
        this.els.notificationList.innerHTML = notifs.map(n => `
          <div class="notification-item ${!n.isRead ? 'unread' : ''}" onclick="App.handleReadNotification('${n.id}')">
            <div>${n.message}</div>
            <div class="notification-item-time">Just now</div>
          </div>
        `).join('');
      }
    }
  },

  async handleReadNotification(id) {
    await API.markNotificationRead(id);
    this.pollNotifications();
  },

  async routeView(viewId, activeRole) {
    this.showLoader(true);
    
    // Clear content
    this.els.appContent.innerHTML = '';
    
    // Map existing viewIds to the new HTML view files
    const viewMap = {
      // ── Super Admin ─────────────────────────────
      'sup_dash':          'system_overview',
      // employees section
      'sup_employees':     'employee_management',
      'sup_payroll':       'payroll_processing',
      'sup_salary':        'salary_structures',
      // workforce section
      'sup_attendance':    'attendance_leave_reports',
      'sup_leave':         'leave_management',
      'sup_performance':   'performance_insights',
      // organization section
      'sup_org':           'organization_analytics',
      'sup_roles':         'role_management',
      'sup_audit':         'audit_logs',
      // system section
      'sup_settings':      'system_settings',
      'sup_notifications': 'notifications',
      'sup_impersonate':   'system_settings',   // fallback

      // ── Admin ────────────────────────────────────
      'adm_dash':          'organization_analytics',
      'adm_employees':     'employee_management',
      'adm_attendance':    'attendance_leave_reports',
      'adm_leave':         'leave_management',
      'adm_payroll':       'payroll_processing',
      'adm_roles':         'role_management',
      'adm_audit':         'audit_logs',

      // ── Manager ──────────────────────────────────
      'mgr_dash':          'manager_dashboard',
      'mgr_team':          'employee_management',
      'mgr_approvals':     'leave_management',
      'mgr_reports':       'performance_insights',
      'mgr_tasks':         'attendance_leave_reports',   // fallback

      // ── Employee ─────────────────────────────────
      'emp_dash':          'employee_dashboard',
      'emp_attendance':    'attendance_tracker',
      'emp_leave':         'leave_management',
      'emp_paystubs':      'payroll_reports',
      'emp_profile':       'user_profile'
    };

    try {
      if (viewMap[viewId]) {
        // Try fetching the new HTML fragment
        const res = await fetch(`views/${viewMap[viewId]}.html`);
        if (res.ok) {
          const html = await res.text();
          this.els.appContent.innerHTML = html;
          
          // Dynamic Page Shell Injection
          const globalTitle = document.getElementById('global-page-title');
          const globalActions = document.getElementById('global-page-actions');
          
          const titleTemplate = this.els.appContent.querySelector('#page-title-template');
          const actionsTemplate = this.els.appContent.querySelector('#page-actions-template');
          const fabTemplate = this.els.appContent.querySelector('#page-fab-template');
          
          if (globalTitle) {
            const activeRole = Store.getActiveRole();
            const navConfig = activeRole ? this.navigationConfig[activeRole] : null;
            const viewInfo = navConfig ? navConfig.find(i => i.id === viewId) : null;
            globalTitle.innerHTML = titleTemplate ? titleTemplate.innerHTML : (viewInfo?.label || 'Dashboard');
          }
          
          if (globalActions) {
            globalActions.innerHTML = actionsTemplate ? actionsTemplate.innerHTML : '';
          }
          
          if (fabTemplate) {
            // Append FAB directly to appContent
            this.els.appContent.insertAdjacentHTML('beforeend', fabTemplate.innerHTML);
          }
          
          // Remove templates from DOM to clean up
          if (titleTemplate) titleTemplate.remove();
          if (actionsTemplate) actionsTemplate.remove();
          if (fabTemplate) fabTemplate.remove();
          
          this.showLoader(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch view, falling back to JS render", e);
    }
    
    // Simple router fallback for unmigrated views
    switch(viewId) {
      case 'emp_dash':
        this.renderEmployeeDashboardView();
        break;
      case 'adm_dash':
        this.renderAdminDashboardView();
        break;
      case 'sup_dash':
        this.renderSuperAdminDashboardView();
        break;
      case 'mgr_dash':
        this.renderManagerDashboardView();
        break;
      case 'mgr_tasks':
        this.renderManagerTasksView();
        break;
      case 'emp_tasks':
        this.renderEmployeeTasksView();
        break;
      case 'adm_employees':
        this.renderEmployeesView();
        break;
      case 'emp_attendance':
      case 'adm_attendance':
        this.renderAttendanceView(activeRole);
        break;
      case 'emp_leave':
        this.renderLeaveRequestView();
        break;
      case 'adm_leave':
      case 'mgr_approvals':
        this.renderLeaveApprovalsView();
        break;
      case 'sup_settings':
        this.renderSystemSettingsView();
        break;
      case 'adm_roles':
      case 'sup_roles':
        this.renderRoleManagementView(activeRole);
        break;
      case 'adm_audit':
      case 'sup_audit':
        this.renderAuditLogView(activeRole);
        break;
      default:
        this.renderDashboardView(activeRole, viewId);
    }
    
    this.showLoader(false);
  },

  renderDashboardView(activeRole, viewId = null) {
    // If called as the initial load (no viewId), route to the role-specific dashboard
    if (!viewId || viewId === 'Dashboard') {
      switch (activeRole) {
        case 'employee':    return this.renderEmployeeDashboardView();
        case 'manager':     return this.renderManagerDashboardView();
        case 'admin':       return this.renderAdminDashboardView();
        case 'super_admin': return this.renderSuperAdminDashboardView();
      }
    }
    // Fallback for genuinely unbuilt modules
    this.els.appContent.innerHTML = `
      <div class="card" style="text-align:center;padding:4rem;">
        <div style="font-size:3rem;opacity:0.2;margin-bottom:1rem;">🚧</div>
        <h2>Coming Soon</h2>
        <p style="margin-top:var(--space-sm);">The <strong>${viewId}</strong> module is under development.</p>
      </div>
    `;
  },


  // --- PHASE 3 & UI REVAMP: DASHBOARDS ---

  async renderEmployeeDashboardView() {
    const user = Store.getUser();
    const tasksRes = await API.getTasks({ assignedTo: user.id });
    const leavesRes = await API.getMyLeaves(user.id);
    const tasks = tasksRes.success ? tasksRes.data : [];
    const pendingTasks = tasks.filter(t => t.status !== 'Completed');
    const pendingLeaves = (leavesRes.success ? leavesRes.data : []).filter(l => l.status === 'Pending');
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const checkInTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const priorityTasks = pendingTasks.filter(t => t.priority === 'High');

    const statusBadge = s => `<span class="badge ${s==='Completed'?'badge-success':s==='In Progress'?'badge-info':'badge-warning'}">${s}</span>`;

    const activityFeed = [
      { icon: '📄', iconClass: 'icon-info',    title: 'Project Proposal.pdf',      desc: 'Updated 2h ago' },
      { icon: '📋', iconClass: 'icon-warning',  title: 'HR Policy Update',          desc: 'Posted 5h ago' },
      { icon: '📅', iconClass: 'icon-neutral',  title: 'Monthly Sync',              desc: 'Scheduled for tomorrow' },
      { icon: '✅', iconClass: 'icon-success',  title: 'Task Completed',            desc: 'You finished Security Training' },
    ];

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>Hello, ${user.name.split(' ')[0]} 👋</h2>
          <p>Here is what's happening with your workflow today.</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:6px;background:var(--color-success-bg);color:var(--color-success);padding:6px 14px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--font-bold);">
            ✔ Checked in at ${checkInTime}
          </div>
          <button class="btn btn-secondary" onclick="App.routeView('emp_leave','employee')">Request Leave</button>
          <button class="btn btn-primary"   onclick="App.routeView('emp_attendance','employee')">Clock In / Out</button>
        </div>
      </div>

      <div class="dashboard-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="dashboard-card dashboard-card-accent">
          <span class="dashboard-card-label">My Tasks</span>
          <span class="dashboard-card-value">${String(pendingTasks.length).padStart(2,'0')}</span>
          <span class="dashboard-card-sub">${priorityTasks.length} Priority items</span>
        </div>
        <div class="dashboard-card dashboard-card-accent accent-success">
          <span class="dashboard-card-label">Leave Balance</span>
          <span class="dashboard-card-value">12 <span style="font-size:var(--text-md);font-weight:normal;">Days</span></span>
          <span class="dashboard-card-sub">Remaining this year</span>
        </div>
        <div class="dashboard-card dashboard-card-accent ${pendingLeaves.length > 0 ? 'accent-warning' : 'accent-success'}">
          <span class="dashboard-card-label">Leave Requests</span>
          <span class="dashboard-card-value">${pendingLeaves.length}</span>
          <span class="dashboard-card-sub">${pendingLeaves.length > 0 ? 'Awaiting approval' : 'None pending'}</span>
        </div>
      </div>

      <div class="dashboard-main-grid">
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:var(--space-md);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-border);">
            <h3 style="font-size:var(--text-md);">My Tasks</h3>
            <button class="btn btn-sm btn-secondary" onclick="App.routeView('emp_tasks','employee')">View All</button>
          </div>
          ${tasks.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">✅</div><h3>All clear!</h3><p>No tasks assigned.</p></div>`
            : `<div class="activity-feed">
              ${tasks.slice(0,5).map(t => `
                <div class="activity-item">
                  <div class="activity-icon ${t.status==='Completed'?'icon-success':t.status==='In Progress'?'icon-info':'icon-warning'}">
                    ${t.status==='Completed'?'✓':t.status==='In Progress'?'↻':'○'}
                  </div>
                  <div class="activity-body">
                    <div class="activity-title">${t.title}</div>
                    <div class="activity-desc">${t.description || 'Due ' + t.dueDate}</div>
                  </div>
                  <div>${statusBadge(t.status)}</div>
                </div>`).join('')}
            </div>`}
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--grid-gap);">
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Task Progress</h3>
            ${['Completed','In Progress','Pending'].map(status => {
              const count = tasks.filter(t => t.status === status).length;
              const pct   = tasks.length > 0 ? Math.round((count/tasks.length)*100) : 0;
              const color = status==='Completed'?'var(--color-success)':status==='In Progress'?'var(--color-info)':'var(--color-warning)';
              return `<div style="margin-bottom:var(--space-sm);">
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:4px;">
                  <span>${status}</span><span class="text-muted">${count} / ${tasks.length}</span>
                </div>
                <div class="progress-wrapper"><div class="progress-bar" style="width:${pct}%;background:${color};"></div></div>
              </div>`;
            }).join('')}
          </div>
          </div>

          <div class="card" style="padding:0;overflow:hidden;">
            <div style="padding:var(--space-md);border-bottom:1px solid var(--color-border);">
              <h3 style="font-size:var(--text-md);">Team Activity</h3>
            </div>
            <div class="activity-feed">
              ${[
                { icon: '📄', iconClass: 'icon-info',    title: 'Project Proposal.pdf',  desc: 'Updated 2h ago' },
                { icon: '📋', iconClass: 'icon-warning',  title: 'HR Policy Update',      desc: 'Posted 5h ago' },
                { icon: '📅', iconClass: 'icon-neutral',  title: 'Monthly Sync',          desc: 'Scheduled for tomorrow' },
                { icon: '✅', iconClass: 'icon-success',  title: 'Task Completed',        desc: 'You finished Security Training' },
              ].map(a => `
                <div class="activity-item">
                  <div class="activity-icon ${a.iconClass}">${a.icon}</div>
                  <div class="activity-body">
                    <div class="activity-title">${a.title}</div>
                    <div class="activity-desc">${a.desc}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async renderAdminDashboardView() {
    const empRes = await API.getEmployees();
    const leavesRes = await API.getPendingApprovals();
    const employees = empRes.success ? empRes.data : [];
    const pendingLeaves = leavesRes.success ? leavesRes.data : [];

    const metricCard = (label, value, sub, color = '') => `
      <div class="dashboard-card">
        <span class="dashboard-card-label">${label}</span>
        <span class="dashboard-card-value"${color ? ` style="color:${color};"` : ''}>${value}</span>
        ${sub ? `<span class="dashboard-card-sub">${sub}</span>` : ''}
      </div>`;

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>HR & Administration</h2>
          <p>Manage people, process leave, and oversee operations.</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn btn-secondary" onclick="App.routeView('adm_leave','admin')">Leave Approvals</button>
          <button class="btn btn-primary" onclick="App.routeView('adm_employees','admin')">Add Employee</button>
        </div>
      </div>

      <!-- 1. METRIC CARDS -->
      <div class="dashboard-grid">
        ${metricCard('Total Employees', employees.length, 'Company-wide')}
        ${metricCard('Leave Requests', pendingLeaves.length, 'Pending approval', pendingLeaves.length > 0 ? 'var(--color-warning)' : 'var(--color-success)')}
        ${metricCard('Attendance Rate', '94%', 'Present today', 'var(--color-success)')}
        ${metricCard('Documents Pending', '3', 'Require review', 'var(--color-warning)')}
      </div>

      <!-- 2. MAIN CONTENT -->
      <div class="dashboard-main-grid">

        <!-- Data Card: Employee Directory -->
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:var(--space-md);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-border);">
            <h3 style="font-size:var(--text-md);">Employee Directory</h3>
            <button class="btn btn-sm btn-secondary" onclick="App.routeView('adm_employees','admin')">View All</button>
          </div>
          <table class="data-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Status</th></tr></thead>
            <tbody>
              ${employees.slice(0,5).map(e => `
                <tr>
                  <td>
                    <div class="cell-with-avatar">
                      <div class="cell-avatar">${e.name.split(' ').map(n=>n[0]).join('')}</div>
                      <div><div class="cell-name">${e.name}</div><div class="cell-sub">${e.jobTitle || e.role}</div></div>
                    </div>
                  </td>
                  <td>${e.department}</td>
                  <td><span class="badge ${e.status === 'Active' ? 'badge-success' : 'badge-warning'}">${e.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Right: Leave Approvals + Quick Actions -->
        <div style="display:flex;flex-direction:column;gap:var(--grid-gap);">

          <!-- Pending Leave Approvals -->
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Pending Approvals</h3>
            ${pendingLeaves.length === 0 ? `<p class="text-muted" style="text-align:center;padding:var(--space-lg) 0;">No pending approvals.</p>` :
              pendingLeaves.slice(0,3).map(l => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border);">
                <div><div class="font-medium" style="font-size:var(--text-sm);">${l.employeeName}</div><div class="text-muted">${l.type}</div></div>
                <div style="display:flex;gap:4px;">
                  <button class="btn btn-sm" style="background:var(--color-success-bg);color:var(--color-success);" onclick="App.handleApproveLeave('${l.id}','Approve')">✓</button>
                  <button class="btn btn-sm" style="background:var(--color-danger-bg);color:var(--color-danger);" onclick="App.handleApproveLeave('${l.id}','Reject')">✕</button>
                </div>
              </div>`).join('')
            }
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Quick Actions</h3>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
              <button class="btn btn-primary btn-block" onclick="App.routeView('adm_employees','admin')">Manage Employees</button>
              <button class="btn btn-secondary btn-block" onclick="App.routeView('adm_leave','admin')">Review Leave Requests</button>
              <button class="btn btn-secondary btn-block" onclick="App.routeView('adm_audit','admin')">View Audit Logs</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },


  async renderSuperAdminDashboardView() {
    const leavesRes = await API.getPendingApprovals();
    const tasksRes = await API.getTasks();
    const logsRes = await API.getAuditLogs('super_admin');
    const tasks = tasksRes.success ? tasksRes.data : [];
    const pendingApprovals = leavesRes.success ? leavesRes.data.length : 0;
    const todayLogs = (logsRes.success ? logsRes.data : []).slice(0, 5);

    const metricCard = (label, value, sub, color = '') => `
      <div class="dashboard-card">
        <span class="dashboard-card-label">${label}</span>
        <span class="dashboard-card-value"${color ? ` style="color:${color};"` : ''}>${value}</span>
        ${sub ? `<span class="dashboard-card-sub">${sub}</span>` : ''}
      </div>`;

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>Command Center</h2>
          <p>Full system visibility and control.</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn btn-secondary" onclick="App.routeView('sup_audit','super_admin')">Audit Logs</button>
          <button class="btn btn-primary" onclick="App.routeView('sup_roles','super_admin')">Manage Roles</button>
        </div>
      </div>

      <!-- 1. METRIC CARDS -->
      <div class="dashboard-grid">
        ${metricCard('Total Employees', '142', 'Company-wide headcount')}
        ${metricCard('Active Tasks', tasks.length, tasks.length > 10 ? 'High volume' : 'Normal volume')}
        ${metricCard('Pending Approvals', pendingApprovals, 'Awaiting manager action', pendingApprovals > 0 ? 'var(--color-warning)' : 'var(--color-success)')}
        ${metricCard('System Health', '99.9%', 'All systems operational', 'var(--color-success)')}
      </div>

      <!-- 2. MAIN CONTENT + SIDE PANEL -->
      <div class="dashboard-main-grid">

        <!-- Data Card: System Activity Feed -->
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:var(--space-md);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-border);">
            <h3 style="font-size:var(--text-md);">System Activity</h3>
            <button class="btn btn-sm btn-secondary" onclick="App.routeView('sup_audit','super_admin')">View All</button>
          </div>
          ${todayLogs.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">📜</div><h3>No Activity Yet</h3><p>Actions will appear here as they happen.</p></div>` : `
          <table class="data-table">
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              ${todayLogs.map(l => `
                <tr>
                  <td class="text-muted">${new Date(l.timestamp).toLocaleTimeString()}</td>
                  <td class="font-medium">${l.user_id}</td>
                  <td><span class="badge badge-info">${l.action}</span></td>
                  <td class="text-muted">${l.details}</td>
                </tr>`).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- Right: Insights + Quick Actions -->
        <div style="display:flex;flex-direction:column;gap:var(--grid-gap);">

          <!-- Insight: System Stats -->
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">System Insights</h3>
            ${[
              { label: 'DB Load', pct: 12, color: 'var(--color-info)' },
              { label: 'Active Sessions', pct: 60, color: 'var(--color-primary)' },
              { label: 'Cache Hit Rate', pct: 94, color: 'var(--color-success)' },
            ].map(s => `<div style="margin-bottom:var(--space-sm);">
              <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:4px;">
                <span>${s.label}</span><span class="text-muted">${s.pct}%</span>
              </div>
              <div class="progress-wrapper"><div class="progress-bar" style="width:${s.pct}%;background:${s.color};"></div></div>
            </div>`).join('')}
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Quick Actions</h3>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
              <button class="btn btn-primary btn-block" onclick="App.routeView('sup_roles','super_admin')">Roles & Permissions</button>
              <button class="btn btn-secondary btn-block" onclick="App.routeView('sup_settings','super_admin')">System Settings</button>
              <button class="btn btn-secondary btn-block" onclick="App.routeView('sup_impersonate','super_admin')">Impersonate User</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async renderManagerDashboardView() {
    const user = Store.getUser();
    const leavesRes = await API.getPendingApprovals();
    const tasksRes = await API.getTasks();
    const tasks = tasksRes.success ? tasksRes.data : [];
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingLeaves = leavesRes.success ? leavesRes.data : [];
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const firstName = user ? user.name.split(' ')[0] : 'Manager';

    const metricCard = (label, value, sub, accentClass = '', trend = '') => `
      <div class="dashboard-card dashboard-card-accent ${accentClass}">
        <span class="dashboard-card-label">${label}</span>
        <span class="dashboard-card-value">${value}</span>
        ${sub ? `<span class="dashboard-card-sub">${sub}</span>` : ''}
        ${trend ? `<span class="dashboard-card-trend ${trend.startsWith('+') ? 'trend-up' : 'trend-down'}">${trend.startsWith('+') ? '↑' : '↓'} ${trend}</span>` : ''}
      </div>`;

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>Morning, ${firstName} ☀️</h2>
          <p>Here's what's happening with your team today.</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn btn-secondary" onclick="App.routeView('mgr_approvals','manager')">Leave Approvals</button>
          <button class="btn btn-primary"   onclick="App.routeView('mgr_tasks','manager')">Assign Task</button>
        </div>
      </div>

      <!-- 1. METRIC CARDS -->
      <div class="dashboard-grid">
        ${metricCard('Total Team', '24 Members', '3 departments', '', '+2 this month')}
        ${metricCard('Active Today', '22 Active', '2 on leave', 'accent-success', '')}
        ${metricCard('Task Completion', completionRate + '%', `${completedTasks} of ${tasks.length} tasks`, completionRate >= 70 ? 'accent-success' : 'accent-warning', '+12.4% vs last month')}
        ${metricCard('Pending Approvals', pendingLeaves.length, pendingLeaves.length > 0 ? 'Require action' : 'All clear', pendingLeaves.length > 0 ? 'accent-warning' : 'accent-success', '')}
      </div>

      <!-- 2. MAIN + SIDE PANEL -->
      <div class="dashboard-main-grid">

        <!-- LEFT: Team Velocity + Task Table -->
        <div style="display:flex;flex-direction:column;gap:var(--grid-gap);">

          <!-- Team Velocity card (Stitch style) -->
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-md);">
              <div>
                <h3 style="font-size:var(--text-md);">Team Velocity</h3>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">Your team completed 12% more tasks this week compared to last month. Keep up the momentum!</p>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
              <div class="stat-block">
                <div class="stat-block-icon" style="background:var(--color-success-bg);color:var(--color-success);">⚡</div>
                <div class="stat-block-body">
                  <div class="stat-block-value">+12.4%</div>
                  <div class="stat-block-label">Efficiency Rate</div>
                </div>
              </div>
              <div class="stat-block">
                <div class="stat-block-icon" style="background:var(--color-info-bg);color:var(--color-info);">⏱</div>
                <div class="stat-block-body">
                  <div class="stat-block-value">3.2 Days</div>
                  <div class="stat-block-label">Avg. Cycle Time</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Task Progress table -->
          <div class="card" style="padding:0;overflow:hidden;">
            <div style="padding:var(--space-md);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-border);">
              <h3 style="font-size:var(--text-md);">Task Progress</h3>
              <button class="btn btn-sm btn-secondary" onclick="App.routeView('mgr_tasks','manager')">View All</button>
            </div>
            <table class="data-table">
              <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                ${tasks.slice(0,5).map(t => {
                  const pClass = t.priority === 'High' ? 'badge-high' : t.priority === 'Medium' ? 'badge-medium' : 'badge-low';
                  const sClass = t.status === 'Completed' ? 'badge-success' : t.status === 'In Progress' ? 'badge-info' : 'badge-warning';
                  return `<tr>
                    <td class="font-medium">${t.title}</td>
                    <td><span class="badge ${pClass}">${t.priority}</span></td>
                    <td><span class="badge ${sClass}">${t.status}</span></td>
                    <td style="min-width:120px;">
                      <div class="progress-wrapper"><div class="progress-bar" style="width:${t.progress||0}%;"></div></div>
                      <span class="text-muted" style="font-size:var(--text-xs);">${t.progress||0}%</span>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- RIGHT: Approvals + Top Performers -->
        <div style="display:flex;flex-direction:column;gap:var(--grid-gap);">

          <!-- Pending Approvals (Stitch approval-card style) -->
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);">
              <h3 style="font-size:var(--text-md);">Pending Approvals</h3>
              ${pendingLeaves.length > 0 ? `<span class="badge badge-warning">${pendingLeaves.length} pending</span>` : ''}
            </div>
            ${pendingLeaves.length === 0
              ? `<div class="empty-state" style="padding:var(--space-lg) 0;"><div class="empty-state-icon">🌴</div><h3>All clear!</h3><p>No pending approvals.</p></div>`
              : pendingLeaves.slice(0,3).map(l => `
              <div class="approval-card">
                <div class="approval-card-header">
                  <div>
                    <div class="font-medium" style="font-size:var(--text-sm);">${l.employeeName}</div>
                    <div class="text-muted" style="font-size:var(--text-xs);">${l.type} Leave · ${l.days || 3} Days</div>
                  </div>
                  <span class="badge badge-warning">Pending</span>
                </div>
                <div class="approval-card-quote">"${l.reason || 'No reason provided.'}"</div>
                <div class="approval-card-actions">
                  <button class="btn btn-sm btn-secondary" onclick="App.handleApproveLeave('${l.id}','Approve')" style="background:var(--color-success-bg);color:var(--color-success);border:none;">✓ Approve</button>
                  <button class="btn btn-sm btn-secondary" onclick="App.handleApproveLeave('${l.id}','Reject')" style="background:var(--color-danger-bg);color:var(--color-danger);border:none;">✕ Decline</button>
                </div>
              </div>`).join('')
            }
          </div>

          <!-- Monthly Top Performers -->
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Monthly Top Performers</h3>
            ${[
              { initials: 'SJ', name: 'Sarah Jenkins', dept: 'UX Design', score: 98 },
              { initials: 'DM', name: 'David Miller', dept: 'Engineering', score: 95 },
              { initials: 'MT', name: 'Marcus Thompson', dept: 'Product', score: 91 },
              { initials: 'ER', name: 'Elena Rodriguez', dept: 'Marketing', score: 88 },
            ].map((p, i) => `
              <div class="performer-row">
                <div style="font-size:var(--text-xs);font-weight:var(--font-bold);color:var(--color-text-muted);width:18px;">#${i+1}</div>
                <div class="performer-avatar" style="background:${['#EFF6FF','#F0FDF4','#FFF7ED','#FDF2F8'][i]};color:${['var(--color-primary)','var(--color-success)','var(--color-warning)','#9333ea'][i]};">${p.initials}</div>
                <div class="performer-info">
                  <div class="performer-name">${p.name}</div>
                  <div class="performer-dept">${p.dept}</div>
                </div>
                <div style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--color-success);">${p.score}%</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async renderManagerTasksView() {
    const res = await API.getTasks();
    if (!res.success) return;
    
    let html = `
      <div class="module-header">
        <h2>Team Tasks</h2>
        <button class="btn btn-primary" onclick="alert('Create Task Modal trigger')">Create Task</button>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    if(res.data.length === 0) {
      html += `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">No tasks found for the team.</td></tr>`;
    }
    
    res.data.forEach(tsk => {
      let badgeClass = tsk.status === 'Completed' ? 'badge-success' : (tsk.status === 'In Progress' ? 'badge-info' : 'badge-pending');
      let priorityClass = tsk.priority === 'High' ? 'badge-high' : (tsk.priority === 'Medium' ? 'badge-medium' : 'badge-low');
      
      html += `
        <tr>
          <td><strong>${tsk.title}</strong></td>
          <td>${tsk.assignedName}</td>
          <td><span class="badge ${priorityClass}">${tsk.priority}</span></td>
          <td><span class="badge ${badgeClass}">${tsk.status}</span></td>
          <td>
            <div style="font-size: 0.75rem; text-align: right; margin-bottom: 2px;">${tsk.progress}%</div>
            <div class="progress-wrapper" style="margin-top: 0;"><div class="progress-bar ${tsk.progress === 100 ? 'progress-success' : ''}" style="width: ${tsk.progress}%"></div></div>
          </td>
          <td>${tsk.dueDate}</td>
        </tr>
      `;
    });
    
    html += `</tbody></table></div>`;
    this.els.appContent.innerHTML = html;
  },

  async renderEmployeeTasksView() {
    const user = Store.getUser();
    const res = await API.getTasks({ assignedTo: user.id });
    if (!res.success) return;
    
    let html = `
      <div class="module-header">
        <h2>My Tasks</h2>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    if(res.data.length === 0) {
      html += `
        <tr>
          <td colspan="6" style="text-align: center; padding: 4rem 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <h3 style="margin-bottom: 0.5rem">You're all caught up!</h3>
            <p class="text-secondary">No tasks assigned to you right now.</p>
          </td>
        </tr>
      `;
    }
    
    res.data.forEach(tsk => {
      let badgeClass = tsk.status === 'Completed' ? 'badge-success' : (tsk.status === 'In Progress' ? 'badge-info' : 'badge-pending');
      let priorityClass = tsk.priority === 'High' ? 'badge-high' : (tsk.priority === 'Medium' ? 'badge-medium' : 'badge-low');
      
      html += `
        <tr>
          <td><strong>${tsk.title}</strong></td>
          <td><span class="badge ${priorityClass}">${tsk.priority}</span></td>
          <td><span class="badge ${badgeClass}">${tsk.status}</span></td>
          <td>
            <div style="font-size: 0.75rem; text-align: right; margin-bottom: 2px;">${tsk.progress}%</div>
            <div class="progress-wrapper" style="margin-top: 0;"><div class="progress-bar ${tsk.progress === 100 ? 'progress-success' : ''}" style="width: ${tsk.progress}%"></div></div>
          </td>
          <td>${tsk.dueDate}</td>
          <td>
            <button class="btn btn-sm btn-ghost" onclick="App.handleUpdateTaskProgress('${tsk.id}')">Update</button>
          </td>
        </tr>
      `;
    });
    
    html += `</tbody></table></div>`;
    this.els.appContent.innerHTML = html;
  },

  async handleUpdateTaskProgress(taskId) {
    const progressStr = prompt("Enter new progress percentage (0-100):");
    if (progressStr === null) return;
    
    const progress = parseInt(progressStr);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      alert("Invalid progress value");
      return;
    }
    
    let status = "In Progress";
    if (progress === 100) status = "Completed";
    if (progress === 0) status = "Pending";
    
    this.showLoader(true);
    await API.updateTaskStatus(taskId, status, progress);
    this.showLoader(false);
    this.routeView('emp_tasks', Store.getActiveRole()); // Refresh view
  },

  // --- MODULE RENDERING ---

  async renderEmployeesView() {
    const res = await API.getEmployees();
    if (!res.success) return;
    
    let html = `
      <div class="module-header">
        <h2>Employees</h2>
        <button class="btn btn-primary" onclick="alert('Add Employee Modal trigger')">Add Employee</button>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    res.data.forEach(emp => {
      html += `
        <tr>
          <td><strong>${emp.name}</strong></td>
          <td>${emp.department}</td>
          <td>${emp.role}</td>
          <td><span class="badge badge-success">${emp.status}</span></td>
          <td>
            <button class="btn btn-sm btn-ghost">Edit</button>
          </td>
        </tr>
      `;
    });
    
    html += `</tbody></table></div></div>`;
    this.els.appContent.innerHTML = html;
  },

  async renderAttendanceView(activeRole) {
    const user = Store.getUser();
    const res = await API.getMyAttendance(user.id);
    const records = (res.success ? res.data : []);
    const presentDays = records.filter(r => r.status === 'On-Time' || r.status === 'Present').length;
    const totalHours = presentDays * 8;

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>Attendance Tracker</h2>
          <p>Good morning, ${user.name.split(' ')[0]}. Ready to check in?</p>
        </div>
        ${activeRole === 'employee' ? `
        <button class="btn btn-primary" id="check-in-btn">Clock In Now</button>` : ''}
      </div>

      <!-- Compliance Banner -->
      <div class="card" style="background:linear-gradient(135deg,var(--color-primary) 0%,#1d4ed8 100%);color:#fff;margin-bottom:var(--space-lg);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-md);">
        <div>
          <div style="font-size:var(--text-xs);opacity:0.8;margin-bottom:4px;">POLICY COMPLIANCE</div>
          <div style="font-size:var(--text-2xl);font-weight:var(--font-bold);">Perfect Attendance</div>
          <div style="opacity:0.85;font-size:var(--text-sm);">Last 30 Days</div>
        </div>
        <div style="font-size:56px;font-weight:var(--font-bold);opacity:0.9;">100%</div>
      </div>

      <!-- 3 Stat Blocks -->
      <div class="att-stat-bar">
        <div class="dashboard-card dashboard-card-accent">
          <span class="dashboard-card-label">Total Hours This Week</span>
          <span class="dashboard-card-value">${totalHours}<span style="font-size:var(--text-md);font-weight:normal;">h</span></span>
          <span class="dashboard-card-sub">Across ${presentDays} days</span>
        </div>
        <div class="dashboard-card dashboard-card-accent accent-success">
          <span class="dashboard-card-label">Avg. Check-in Time</span>
          <span class="dashboard-card-value">08:52</span>
          <span class="dashboard-card-sub">✔ 8 mins earlier than target</span>
        </div>
        <div class="dashboard-card dashboard-card-accent accent-info">
          <span class="dashboard-card-label">Days Present</span>
          <span class="dashboard-card-value">${presentDays}</span>
          <span class="dashboard-card-sub">Out of ${records.length} recorded</span>
        </div>
      </div>

      <!-- Attendance History Table -->
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:var(--space-md);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-border);">
          <h3 style="font-size:var(--text-md);">Attendance History</h3>
          <span class="text-muted" style="font-size:var(--text-xs);">Showing ${Math.min(records.length,10)} of ${records.length} entries</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              ${records.length === 0
                ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📅</div><h3>No records</h3><p>No attendance records found.</p></div></td></tr>`
                : records.slice(0,10).map(r => `
                  <tr>
                    <td class="font-medium">${r.date}</td>
                    <td>${r.checkIn || '—'}</td>
                    <td>${r.checkOut || '—'}</td>
                    <td>${r.checkIn && r.checkOut ? '8h 00m' : '—'}</td>
                    <td><span class="badge ${r.status === 'On-Time' || r.status === 'Present' ? 'badge-success' : 'badge-warning'}">${r.status}</span></td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (activeRole === 'employee') {
      document.getElementById('check-in-btn').addEventListener('click', async () => {
        App.showLoader(true);
        const ciRes = await API.checkIn(user.id);
        App.showLoader(false);
        if (ciRes.success) {
          alert('Checked in successfully!');
          App.routeView('emp_attendance', 'employee');
        } else {
          alert(ciRes.message);
        }
      });
    }
  },

  async renderLeaveRequestView() {
    const user = Store.getUser();
    const res = await API.getMyLeaves(user.id);
    
    let html = `
      <div class="module-header">
        <h2>Leave Requests</h2>
      </div>
      <div class="form-grid">
        <div class="card">
          <h3 style="margin-bottom: 1rem;">Request Time Off</h3>
          <form id="leave-form">
            <div class="form-group">
              <label>Leave Type</label>
              <select id="leave-type" required>
                <option value="Annual">Annual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="leave-start" required>
              </div>
              <div class="form-group">
                <label>End Date</label>
                <input type="date" id="leave-end" required>
              </div>
            </div>
            <div class="form-group">
              <label>Reason</label>
              <textarea id="leave-reason" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit Request</button>
          </form>
        </div>
        
        <div class="card" style="padding: 0; overflow: hidden; height: fit-content;">
          <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
            <h3>My Leave History</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table" style="margin-top: 0;">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
    `;
    
    if(res.data.length === 0) {
      html += `<tr><td colspan="3" style="text-align: center; padding: 3rem; color: var(--text-secondary);">No leave history.</td></tr>`;
    }
    
    res.data.forEach(lv => {
      let badgeClass = lv.status === 'Approved' ? 'badge-success' : (lv.status === 'Pending' ? 'badge-pending' : 'badge-critical');
      html += `
        <tr>
          <td>${lv.type}</td>
          <td>${lv.startDate} to ${lv.endDate}</td>
          <td>
            <span class="badge ${badgeClass}" style="margin-bottom: 0.5rem">${lv.status}</span>
            <div class="timeline">
              <div class="timeline-step completed">
                <div class="timeline-marker"></div>
                <div class="timeline-title">Submitted</div>
                <div class="timeline-desc">Request sent</div>
              </div>
              <div class="timeline-step ${lv.status === 'Approved' ? 'completed' : (lv.status === 'Rejected' ? 'rejected' : 'active')}">
                <div class="timeline-marker"></div>
                <div class="timeline-title">Manager Review</div>
                <div class="timeline-desc">${lv.status === 'Pending' ? 'Awaiting action' : 'Action taken'}</div>
              </div>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += `</tbody></table></div></div></div>`;
    this.els.appContent.innerHTML = html;
    
    document.getElementById('leave-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      App.showLoader(true);
      const data = {
        type: document.getElementById('leave-type').value,
        startDate: document.getElementById('leave-start').value,
        endDate: document.getElementById('leave-end').value,
        reason: document.getElementById('leave-reason').value
      };
      await API.requestLeave(user.id, data);
      App.showLoader(false);
      App.routeView('emp_leave', 'employee'); // refresh view
      
      // Simulate polling a moment later to show the manager notification pop-up
      setTimeout(() => App.pollNotifications(), 500);
    });
  },

  async renderLeaveApprovalsView() {
    const res = await API.getPendingApprovals();
    
    let html = `
      <div class="module-header">
        <h2>Leave Approvals</h2>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    if (res.data.length === 0) {
      html += `
        <tr>
          <td colspan="5" style="text-align: center; padding: 4rem 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🌴</div>
            <h3 style="margin-bottom: 0.5rem">No Approvals Needed</h3>
            <p class="text-secondary">Your team has no pending leave requests.</p>
          </td>
        </tr>
      `;
    } else {
      res.data.forEach(lv => {
        html += `
          <tr>
            <td><strong>${lv.employeeName}</strong></td>
            <td>${lv.type}</td>
            <td>${lv.startDate} to ${lv.endDate}</td>
            <td><span class="badge badge-pending">${lv.status}</span></td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="App.handleApproveLeave('${lv.id}', 'Approve')">Approve</button>
              <button class="btn btn-sm btn-ghost" onclick="App.handleApproveLeave('${lv.id}', 'Reject')" style="color: var(--critical)">Reject</button>
            </td>
          </tr>
        `;
      });
    }
    
    html += `</tbody></table></div></div>`;
    this.els.appContent.innerHTML = html;
  },

  async handleApproveLeave(leaveId, action) {
    this.showLoader(true);
    await API.approveLeave(leaveId, action);
    this.showLoader(false);
    this.routeView('mgr_approvals', Store.getActiveRole()); // Refresh view
  },

  // --- PHASE 6: SYSTEM ADMIN & SECURITY ---

  async renderSystemSettingsView() {
    const res = await API.getSettings();
    if (!res.success) return;
    const s = res.data;

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>System Preferences</h2>
          <p>Manage your organization's global configurations and employee compliance rules.</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <div style="font-size:var(--text-xs);color:var(--color-success);background:var(--color-success-bg);padding:6px 12px;border-radius:var(--radius-full);display:flex;align-items:center;gap:4px;">☁ Cloud Sync Active</div>
          <button class="btn btn-primary" onclick="alert('Settings saved successfully!')">Save All Changes</button>
        </div>
      </div>

      <div class="tabs" id="settings-tabs">
        <button class="tab-btn active" onclick="App.switchSettingsTab(0)">Organization</button>
        <button class="tab-btn" onclick="App.switchSettingsTab(1)">Attendance Rules</button>
        <button class="tab-btn" onclick="App.switchSettingsTab(2)">Leave Policies</button>
        <button class="tab-btn" onclick="App.switchSettingsTab(3)">Notifications</button>
      </div>

      <div id="settings-panel-0">
        <div class="settings-section">
          <div class="settings-section-title">Organization Identity</div>
          <div class="settings-section-desc">Update your public profile and brand assets.</div>
          <div class="settings-field">
            <label class="settings-label">Company Name</label>
            <input class="settings-input" type="text" value="${s.companyName || 'Suler Corp'}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="settings-field">
              <label class="settings-label">Industry</label>
              <input class="settings-input" type="text" value="Technology">
            </div>
            <div class="settings-field">
              <label class="settings-label">Timezone</label>
              <select class="settings-input"><option>UTC+1 (Lagos)</option><option>UTC+0</option></select>
            </div>
          </div>
          <div class="settings-field">
            <label class="settings-label">Company Logo</label>
            <div style="border:2px dashed var(--color-border);border-radius:var(--radius-md);padding:var(--space-lg);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
              📁 Upload new logo — PNG, JPG, or SVG. Max 800K.
            </div>
          </div>
        </div>
      </div>

      <div id="settings-panel-1" style="display:none;">
        <div class="settings-section">
          <div class="settings-section-title">Attendance Rules</div>
          <div class="settings-section-desc">Configure check-in windows, late thresholds, and overtime policy.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="settings-field">
              <label class="settings-label">Work Hours Start</label>
              <input class="settings-input" type="time" value="${s.workHoursStart || '09:00'}">
            </div>
            <div class="settings-field">
              <label class="settings-label">Work Hours End</label>
              <input class="settings-input" type="time" value="${s.workHoursEnd || '17:00'}">
            </div>
            <div class="settings-field">
              <label class="settings-label">Late Threshold</label>
              <input class="settings-input" type="time" value="${s.lateThreshold || '09:15'}">
            </div>
            <div class="settings-field">
              <label class="settings-label">Overtime After (hrs)</label>
              <input class="settings-input" type="number" value="8" min="1">
            </div>
          </div>
        </div>
      </div>

      <div id="settings-panel-2" style="display:none;">
        <div class="settings-section">
          <div class="settings-section-title">Leave Policies</div>
          <div class="settings-section-desc">Define annual entitlements and rollover behavior.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="settings-field">
              <label class="settings-label">Annual Leave Days</label>
              <input class="settings-input" type="number" value="21">
            </div>
            <div class="settings-field">
              <label class="settings-label">Sick Leave Days</label>
              <input class="settings-input" type="number" value="10">
            </div>
            <div class="settings-field">
              <label class="settings-label">Max Rollover Days</label>
              <input class="settings-input" type="number" value="5">
            </div>
            <div class="settings-field">
              <label class="settings-label">Min Notice (days)</label>
              <input class="settings-input" type="number" value="3">
            </div>
          </div>
        </div>
      </div>

      <div id="settings-panel-3" style="display:none;">
        <div class="settings-section">
          <div class="settings-section-title">Notification Channels</div>
          <div class="settings-section-desc">Control how and when the system alerts administrators.</div>
          ${[
            { label: 'Email Notifications',   desc: 'Send alerts via email for all key events',    on: s.emailNotifications },
            { label: 'Leave Request Alerts',   desc: 'Notify managers when leave is submitted',     on: true },
            { label: 'Attendance Anomalies',   desc: 'Flag unusual check-in patterns',              on: true },
            { label: 'Weekly Digest',          desc: 'Summary report every Monday morning',         on: false },
            { label: 'Push / In-App Alerts',   desc: 'Show real-time banners inside the dashboard', on: true },
          ].map(t => `
            <div class="settings-toggle-row">
              <div class="settings-toggle-info">
                <div class="settings-toggle-title">${t.label}</div>
                <div class="settings-toggle-desc">${t.desc}</div>
              </div>
              <div class="toggle-switch ${t.on ? 'on' : ''}" onclick="this.classList.toggle('on')"></div>
            </div>`).join('')}
        </div>
      </div>
    `;
  },

  switchSettingsTab(idx) {
    document.querySelectorAll('#settings-tabs .tab-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
    [0,1,2,3].forEach(i => {
      const p = document.getElementById(`settings-panel-${i}`);
      if (p) p.style.display = i === idx ? '' : 'none';
    });
  },

  async renderRoleManagementView(activeRole) {
    const res = await API.getRolePermissions();
    if (!res.success) return;
    const { permissions, roleMappings } = res.data;
    const isSuperAdmin = activeRole === 'super_admin';

    const roleCards = [
      { emoji: '🛡', name: 'Super Admin', count: 4,   desc: 'Full System Access',  bg: '#EFF6FF', color: 'var(--color-primary)' },
      { emoji: '⚙',  name: 'Admin',       count: 12,  desc: 'HR & Operations',     bg: '#F0FDF4', color: 'var(--color-success)' },
      { emoji: '👥', name: 'Manager',      count: 48,  desc: 'Team Leadership',     bg: '#FFF7ED', color: 'var(--color-warning)' },
      { emoji: '👤', name: 'Employee',     count: 512, desc: 'Standard Access',     bg: '#FDF2F8', color: '#9333ea' },
    ];

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>Role Management</h2>
          <p>Configure system access and assign roles to users.</p>
        </div>
        ${isSuperAdmin
          ? `<button class="btn btn-primary" onclick="alert('Create Role Modal')">Create New Role</button>`
          : `<span class="badge badge-warning">Read-Only Mode</span>`}
      </div>

      <div class="role-card-grid">
        ${roleCards.map(r => `
          <div class="role-card">
            <div class="role-card-badge" style="background:${r.bg};color:${r.color};">${r.emoji}</div>
            <div class="role-card-count">${r.count.toString().padStart(2,'0')}</div>
            <div class="role-card-name">${r.name}</div>
            <div class="role-card-desc">${r.desc}</div>
          </div>`).join('')}
      </div>

      <div class="card" style="padding:0;overflow:hidden;margin-bottom:var(--space-md);">
        <div style="padding:var(--space-md);border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h3 style="font-size:var(--text-md);">Permission Matrix</h3>
            <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">Configure feature-level access for each organizational role.</p>
          </div>
          ${isSuperAdmin ? `<button class="btn btn-sm btn-secondary" onclick="alert('Save permissions')">Save Matrix</button>` : ''}
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Permission</th>
                ${roleMappings.map(rm => `<th style="text-align:center;">${rm.roleId.replace('_',' ').toUpperCase()}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${permissions.map(perm => `
                <tr>
                  <td>
                    <div class="font-medium" style="font-size:var(--text-sm);">${perm.name}</div>
                    <div class="text-muted" style="font-size:var(--text-xs);">${perm.id}</div>
                  </td>
                  ${roleMappings.map(rm => {
                    const has = rm.permissions.includes(perm.id);
                    return `<td style="text-align:center;">
                      <input type="checkbox" ${has?'checked':''} ${isSuperAdmin?'':'disabled'}
                        style="width:16px;height:16px;accent-color:var(--color-primary);cursor:${isSuperAdmin?'pointer':'not-allowed'};">
                    </td>`;
                  }).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:var(--text-md);margin-bottom:var(--space-xs);">Direct Role Assignment</h3>
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-md);">Map individual employees to specific organizational roles.</p>
        <table class="data-table">
          <thead><tr><th>Employee</th><th>Email</th><th>Current Role</th><th>Action</th></tr></thead>
          <tbody>
            ${[
              { name: 'Sarah Chen',   email: 'sarah.c@enterprise.com', role: 'Admin' },
              { name: 'Michael Ross', email: 'm.ross@enterprise.com',   role: 'Manager' },
              { name: 'David Kim',    email: 'd.kim@enterprise.com',    role: 'Employee' },
            ].map(e => `
              <tr>
                <td><div class="cell-with-avatar"><div class="cell-avatar">${e.name.split(' ').map(n=>n[0]).join('')}</div><div class="cell-name">${e.name}</div></div></td>
                <td class="text-muted">${e.email}</td>
                <td><span class="badge badge-info">${e.role}</span></td>
                <td><button class="btn btn-sm btn-secondary" ${isSuperAdmin?'':'disabled'}>Change Role</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="text-muted" style="font-size:var(--text-xs);padding-top:var(--space-sm);">Showing 1 to 3 of 576 employees</div>
      </div>
    `;
  },

  async renderAuditLogView(activeRole) {
    const res = await API.getAuditLogs(activeRole);
    if (!res.success) return;
    const logs = res.data;

    this.els.appContent.innerHTML = `
      <div class="module-header">
        <div>
          <h2>System Audit Logs</h2>
          <p>A comprehensive record of all system activities and administrative changes.</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <input type="text" placeholder="Filter logs..." class="settings-input" style="width:220px;">
          <button class="btn btn-secondary">Export CSV</button>
        </div>
      </div>

      <div class="dashboard-main-grid">
        <!-- Main log table -->
        <div class="card" style="padding:0;overflow:hidden;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>Date / Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th></tr>
              </thead>
              <tbody>
                ${logs.length === 0
                  ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📜</div><h3>No Logs</h3><p>System activity will appear here.</p></div></td></tr>`
                  : logs.map(log => {
                      const dt = new Date(log.timestamp);
                      const dateStr = dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
                      const timeStr = dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) + ' UTC';
                      const severity = log.action?.toLowerCase().includes('fail') || log.action?.toLowerCase().includes('error') ? 'high'
                        : log.action?.toLowerCase().includes('update') || log.action?.toLowerCase().includes('change') ? 'medium' : 'low';
                      return `<tr>
                        <td>
                          <div class="font-medium" style="font-size:var(--text-xs);">${dateStr}</div>
                          <div class="text-muted" style="font-size:var(--text-xs);">${timeStr}</div>
                        </td>
                        <td>
                          <div class="font-medium" style="font-size:var(--text-sm);">${log.user_id || 'System'}</div>
                        </td>
                        <td><span class="text-muted" style="font-size:var(--text-xs);">${log.role || 'Automated Task'}</span></td>
                        <td><span class="badge badge-info">${log.action}</span></td>
                        <td>
                          <div style="font-size:var(--text-xs);">${log.entity_type}</div>
                          <div class="text-muted" style="font-size:var(--text-xs);">${log.details || ''}</div>
                        </td>
                      </tr>`;
                    }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sidebar stats -->
        <div style="display:flex;flex-direction:column;gap:var(--grid-gap);">
          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Log Insights</h3>
            <div class="stat-block">
              <div class="stat-block-icon" style="background:var(--color-success-bg);color:var(--color-success);">📈</div>
              <div class="stat-block-body">
                <div class="stat-block-value">+12%</div>
                <div class="stat-block-label">Activity Velocity vs last week</div>
              </div>
            </div>
            <div class="stat-block">
              <div class="stat-block-icon" style="background:var(--color-warning-bg);color:var(--color-warning);">⚠</div>
              <div class="stat-block-body">
                <div class="stat-block-value">2</div>
                <div class="stat-block-label">Login anomalies flagged today</div>
              </div>
            </div>
            <div class="stat-block">
              <div class="stat-block-icon" style="background:var(--color-info-bg);color:var(--color-info);">🔒</div>
              <div class="stat-block-body">
                <div class="stat-block-value">✓ Synced</div>
                <div class="stat-block-label">Database integrity check</div>
              </div>
            </div>
            <div class="stat-block">
              <div class="stat-block-icon" style="background:var(--color-primary-subtle);color:var(--color-primary);">📋</div>
              <div class="stat-block-body">
                <div class="stat-block-value">${logs.length}</div>
                <div class="stat-block-label">Total log entries</div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size:var(--text-md);margin-bottom:var(--space-md);">Severity Breakdown</h3>
            ${['high','medium','low'].map(sev => {
              const count = logs.filter(l => {
                const a = l.action?.toLowerCase() || '';
                return sev==='high' ? (a.includes('fail')||a.includes('error'))
                  : sev==='medium' ? (a.includes('update')||a.includes('change'))
                  : true;
              }).length;
              const pct = logs.length > 0 ? Math.round((count/logs.length)*100) : 0;
              return `<div style="margin-bottom:var(--space-sm);">
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:4px;">
                  <span class="audit-severity ${sev}">${sev.charAt(0).toUpperCase()+sev.slice(1)}</span>
                  <span class="text-muted">${count}</span>
                </div>
                <div class="progress-wrapper">
                  <div class="progress-bar" style="width:${pct}%;background:${sev==='high'?'var(--color-danger)':sev==='medium'?'var(--color-warning)':'var(--color-info)'};"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }   // end renderAuditLogView
};    // end App

// Start App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
