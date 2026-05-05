/**
 * Suler EMS - Global Store (State Management)
 * Handles localStorage for Session and Active Role Context
 */

const Store = {
  // Keys
  KEYS: {
    USER: 'suler_user',
    TOKEN: 'suler_token',
    ACTIVE_ROLE: 'suler_active_role',
    IMPERSONATION: 'suler_impersonation'
  },

  // State
  state: {
    user: null,
    token: null,
    activeRole: null,
    impersonation: null
  },

  init() {
    this.state.user = JSON.parse(localStorage.getItem(this.KEYS.USER));
    this.state.token = localStorage.getItem(this.KEYS.TOKEN);
    this.state.activeRole = localStorage.getItem(this.KEYS.ACTIVE_ROLE);
    this.state.impersonation = JSON.parse(localStorage.getItem(this.KEYS.IMPERSONATION));
  },

  isAuthenticated() {
    return !!this.state.token && !!this.state.user;
  },

  getUser() {
    return this.state.user;
  },

  getActiveRole() {
    return this.state.activeRole;
  },

  getImpersonation() {
    return this.state.impersonation;
  },

  setSession(user, token) {
    this.state.user = user;
    this.state.token = token;
    // Default to the first role if none active
    if (!this.state.activeRole && user.roles && user.roles.length > 0) {
      this.state.activeRole = user.roles[0].id;
      localStorage.setItem(this.KEYS.ACTIVE_ROLE, this.state.activeRole);
    }
    
    localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    localStorage.setItem(this.KEYS.TOKEN, token);
  },

  setActiveRole(roleId) {
    // Verify user has this role
    if (this.state.user && this.state.user.roles.some(r => r.id === roleId)) {
      this.state.activeRole = roleId;
      localStorage.setItem(this.KEYS.ACTIVE_ROLE, roleId);
      
      // Log Role Switch
      if (typeof API !== 'undefined') {
        API.logAction(this.state.user.id, 'Role Switched', 'Auth', roleId, `Switched to role: ${roleId}`);
      }
      
      return true;
    }
    return false;
  },

  setImpersonation(targetUser) {
    this.state.impersonation = targetUser;
    localStorage.setItem(this.KEYS.IMPERSONATION, JSON.stringify(targetUser));
  },

  clearImpersonation() {
    this.state.impersonation = null;
    localStorage.removeItem(this.KEYS.IMPERSONATION);
  },

  clearSession() {
    this.state.user = null;
    this.state.token = null;
    this.state.activeRole = null;
    this.state.impersonation = null;
    
    localStorage.removeItem(this.KEYS.USER);
    localStorage.removeItem(this.KEYS.TOKEN);
    localStorage.removeItem(this.KEYS.ACTIVE_ROLE);
    localStorage.removeItem(this.KEYS.IMPERSONATION);
  }
};

// Initialize store on load
Store.init();
