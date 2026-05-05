/**
 * Suler EMS - Authentication Module (Mock API)
 */

const AuthAPI = {
  // Mock Database of Users
  users: [
    {
      id: 'usr_001',
      email: 'super@suler.com',
      password: 'password123',
      name: 'Daniel Idonor',
      initials: 'DI',
      roles: [
        { id: 'super_admin', name: 'Super Admin' },
        { id: 'admin', name: 'Admin' },
        { id: 'manager', name: 'Manager' },
        { id: 'employee', name: 'Employee' }
      ]
    },
    {
      id: 'usr_002',
      email: 'admin@suler.com',
      password: 'password123',
      name: 'Sarah Admin',
      initials: 'SA',
      roles: [
        { id: 'admin', name: 'Admin' },
        { id: 'employee', name: 'Employee' }
      ]
    },
    {
      id: 'usr_003',
      email: 'manager@suler.com',
      password: 'password123',
      name: 'Mike Manager',
      initials: 'MM',
      roles: [
        { id: 'manager', name: 'Manager' },
        { id: 'employee', name: 'Employee' }
      ]
    },
    {
      id: 'usr_004',
      email: 'employee@suler.com',
      password: 'password123',
      name: 'John Employee',
      initials: 'JE',
      roles: [
        { id: 'employee', name: 'Employee' }
      ]
    }
  ],

  // Mock POST /auth/login
  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
          // Remove password from returned object
          const { password: _, ...safeUser } = user;
          const mockToken = 'jwt_mock_token_' + Date.now();
          
          // Log login action
          if (typeof API !== 'undefined') {
            API.logAction(safeUser.id, 'User Login', 'Auth', safeUser.id, 'Successful login');
          }
          
          // Default active role to super_admin if user has it, otherwise first role
          const defaultRole = safeUser.roles.find(r => r.id === 'super_admin') 
            ? 'super_admin' 
            : safeUser.roles[0]?.id;
          
          resolve({
            success: true,
            message: "Logged in successfully",
            data: {
              user: safeUser,
              token: mockToken,
              defaultRole
            }
          });
        } else {
          resolve({
            success: false,
            message: "Invalid email or password"
          });
        }
      }, 800); // simulate network delay
    });
  },

  // Mock GET /auth/me
  async me(token) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In reality, we'd validate the token. Here we just trust it for the mock.
        const user = Store.getUser();
        if (user && token) {
          resolve({
            success: true,
            message: "User fetched",
            data: { user }
          });
        } else {
          resolve({
            success: false,
            message: "Unauthorized"
          });
        }
      }, 300);
    });
  }
};
