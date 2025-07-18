import db from './database.js';

// Prepared statements for better performance
const getAllUsersStmt = db.prepare('SELECT * FROM users');
const findByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');
const findByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const createUserStmt = db.prepare(`
  INSERT INTO users (email, password, name) 
  VALUES (?, ?, ?)
`);
const updateUserStmt = db.prepare(`
  UPDATE users 
  SET email = COALESCE(?, email), 
      password = COALESCE(?, password), 
      name = COALESCE(?, name) 
  WHERE id = ?
`);
const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');

// User model functions
const userModel = {
  // Get all users
  getAllUsers() {
    try {
      return getAllUsersStmt.all();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  // Find user by email
  findByEmail(email) {
    try {
      return findByEmailStmt.get(email);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  // Find user by ID
  findById(id) {
    try {
      return findByIdStmt.get(id);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  // Create new user
  createUser(userData) {
    try {
      const result = createUserStmt.run(
        userData.email,
        userData.password, // In production, this should be hashed
        userData.name || ''
      );
      
      // Return the created user
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser(id, updateData) {
    try {
      const result = updateUserStmt.run(
        updateData.email || null,
        updateData.password || null,
        updateData.name || null,
        id
      );
      
      if (result.changes === 0) {
        return null; // No user found with that ID
      }
      
      return this.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser(id) {
    try {
      const result = deleteUserStmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Validate user credentials
  validateCredentials(email, password) {
    try {
      const user = this.findByEmail(email);
      if (!user) {
        return null;
      }
      
      // In production, use proper password hashing comparison
      if (user.password === password) {
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      return null;
    } catch (error) {
      console.error('Error validating credentials:', error);
      throw error;
    }
  }
};

export default userModel; 