const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class AuthManager {
  constructor() {
    this.loggedUsersFilePath = path.join(__dirname, '../../data/private/logged_users.json');
    this.userDatabaseFilePath = path.join(__dirname, '../../data/private/user-database.json');
    this.saltRounds = 12;
    this.ensureFilesExist();
  }

  // Ensure required files exist
  ensureFilesExist() {
    try {
      // Ensure private directory exists
      const privateDir = path.dirname(this.loggedUsersFilePath);
      if (!fs.existsSync(privateDir)) {
        fs.mkdirSync(privateDir, { recursive: true });
      }

      // Create logged_users.json if it doesn't exist
      if (!fs.existsSync(this.loggedUsersFilePath)) {
        fs.writeFileSync(this.loggedUsersFilePath, JSON.stringify({}, null, 2));
      }

      // Create user-database.json if it doesn't exist
      if (!fs.existsSync(this.userDatabaseFilePath)) {
        const initialUsers = {
          admin: {
            uuid: uuidv4(),
            name: 'Administrator',
            username: 'admin',
            password: this.hashPassword(process.env.ADMIN_PASSWORD || 'admin123!456'),
            role: 'admin',
            createdAt: new Date().toISOString()
          }
        };
        fs.writeFileSync(this.userDatabaseFilePath, JSON.stringify(initialUsers, null, 2));
      }
    } catch (error) {
      console.error('Error ensuring auth files exist:', error);
    }
  }

  // Hash password
  hashPassword(password) {
    return bcrypt.hashSync(password, this.saltRounds);
  }

  // Verify password
  verifyPassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword);
  }

  // Load logged users
  loadLoggedUsers() {
    try {
      const data = fs.readFileSync(this.loggedUsersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Save logged users
  saveLoggedUsers(loggedUsers) {
    try {
      fs.writeFileSync(this.loggedUsersFilePath, JSON.stringify(loggedUsers, null, 2));
    } catch (error) {
      console.error('Error saving logged users:', error);
    }
  }

  // Load user database
  loadUserDatabase() {
    try {
      const data = fs.readFileSync(this.userDatabaseFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Save user database
  saveUserDatabase(users) {
    try {
      fs.writeFileSync(this.userDatabaseFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving user database:', error);
    }
  }

  // Authenticate user
  authenticate(username, password) {
    const users = this.loadUserDatabase();
    
    // Check against admin credentials from .env first
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      return {
        success: true,
        user: users.admin || {
          uuid: uuidv4(),
          name: 'Administrator',
          username: 'admin',
          role: 'admin'
        }
      };
    }

    // Special hardcoded check for admin (fallback)
    if (username === 'admin' && password === 'admin123!456') {
      return {
        success: true,
        user: users.admin || {
          uuid: uuidv4(),
          name: 'Administrator',
          username: 'admin',
          role: 'admin'
        }
      };
    }

    // Check against user database
    const user = Object.values(users).find(u => u.username === username);
    if (user && this.verifyPassword(password, user.password)) {
      return {
        success: true,
        user: user
      };
    }

    return {
      success: false,
      message: 'Invalid username or password'
    };
  }

  // Create login session
  createSession(user, rememberMe = false) {
    const sessionId = uuidv4();
    const loggedUsers = this.loadLoggedUsers();
    
    const expiresAt = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for "remember me"
      : null; // No expiration = session cookie (browser manages)

    loggedUsers[sessionId] = {
      userUuid: user.uuid,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      rememberMe: rememberMe
    };

    this.saveLoggedUsers(loggedUsers);
    return sessionId;
  }

  // Validate session
  validateSession(sessionId) {
    if (!sessionId) return null;

    const loggedUsers = this.loadLoggedUsers();
    const session = loggedUsers[sessionId];

    if (!session) return null;

    // Check if session expired (if not permanent)
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      delete loggedUsers[sessionId];
      this.saveLoggedUsers(loggedUsers);
      return null;
    }

    return session;
  }

  // Logout user
  logout(sessionId) {
    if (!sessionId) return;

    const loggedUsers = this.loadLoggedUsers();
    delete loggedUsers[sessionId];
    this.saveLoggedUsers(loggedUsers);
  }

  // Clean expired sessions
  cleanExpiredSessions() {
    const loggedUsers = this.loadLoggedUsers();
    const now = new Date();
    let cleaned = false;

    Object.keys(loggedUsers).forEach(sessionId => {
      const session = loggedUsers[sessionId];
      if (session.expiresAt && new Date(session.expiresAt) < now) {
        delete loggedUsers[sessionId];
        cleaned = true;
      }
    });

    if (cleaned) {
      this.saveLoggedUsers(loggedUsers);
    }
  }

  // Add new user (admin only)
  addUser(name, username, password, adminSessionId) {
    const adminSession = this.validateSession(adminSessionId);
    if (!adminSession || adminSession.role !== 'admin') {
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    const users = this.loadUserDatabase();
    
    // Check if username already exists
    if (Object.values(users).some(u => u.username === username)) {
      return {
        success: false,
        message: 'Username already exists'
      };
    }

    const newUser = {
      uuid: uuidv4(),
      name: name,
      username: username,
      password: this.hashPassword(password),
      role: 'user',
      createdAt: new Date().toISOString(),
      createdBy: adminSession.username
    };

    users[newUser.uuid] = newUser;
    this.saveUserDatabase(users);

    return {
      success: true,
      message: 'User created successfully',
      user: {
        uuid: newUser.uuid,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    };
  }

  // Remove user (admin only)
  removeUser(userUuid, adminSessionId) {
    const adminSession = this.validateSession(adminSessionId);
    if (!adminSession || adminSession.role !== 'admin') {
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    const users = this.loadUserDatabase();
    
    if (!users[userUuid]) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Prevent admin from deleting themselves
    if (users[userUuid].username === 'admin') {
      return {
        success: false,
        message: 'Cannot delete admin user'
      };
    }

    delete users[userUuid];
    this.saveUserDatabase(users);

    // Also remove any active sessions for this user
    const loggedUsers = this.loadLoggedUsers();
    Object.keys(loggedUsers).forEach(sessionId => {
      if (loggedUsers[sessionId].userUuid === userUuid) {
        delete loggedUsers[sessionId];
      }
    });
    this.saveLoggedUsers(loggedUsers);

    return {
      success: true,
      message: 'User removed successfully'
    };
  }

  // Get all users (admin only)
  getAllUsers(adminSessionId) {
    const adminSession = this.validateSession(adminSessionId);
    if (!adminSession || adminSession.role !== 'admin') {
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    const users = this.loadUserDatabase();
    const userList = Object.values(users).map(user => ({
      uuid: user.uuid,
      name: user.name,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      createdBy: user.createdBy
    }));

    return {
      success: true,
      users: userList
    };
  }
}

module.exports = new AuthManager();
