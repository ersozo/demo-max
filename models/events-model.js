import db from './database.js';

// Prepared statements for better performance
const getAllEventsStmt = db.prepare('SELECT * FROM events ORDER BY date ASC');
const findEventByIdStmt = db.prepare('SELECT * FROM events WHERE id = ?');
const findEventsByUserIdStmt = db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY date ASC');
const createEventStmt = db.prepare(`
  INSERT INTO events (title, description, address, date, user_id) 
  VALUES (?, ?, ?, ?, ?)
`);
const updateEventStmt = db.prepare(`
  UPDATE events 
  SET title = COALESCE(?, title), 
      description = COALESCE(?, description), 
      address = COALESCE(?, address),
      date = COALESCE(?, date)
  WHERE id = ? AND user_id = ?
`);
const deleteEventStmt = db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?');

// Events model functions
const eventsModel = {
  // Get all events
  getAllEvents() {
    try {
      return getAllEventsStmt.all();
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  },

  // Find event by ID
  findById(id) {
    try {
      return findEventByIdStmt.get(id);
    } catch (error) {
      console.error('Error finding event by ID:', error);
      throw error;
    }
  },

  // Find events by user ID
  findByUserId(userId) {
    try {
      return findEventsByUserIdStmt.all(userId);
    } catch (error) {
      console.error('Error finding events by user ID:', error);
      throw error;
    }
  },

  // Create new event
  createEvent(eventData) {
    try {
      const result = createEventStmt.run(
        eventData.title,
        eventData.description || null,
        eventData.address || null,
        eventData.date,
        eventData.user_id
      );
      
      // Return the created event
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update event
  updateEvent(id, userId, updateData) {
    try {
      const result = updateEventStmt.run(
        updateData.title || null,
        updateData.description || null,
        updateData.address || null,
        updateData.date || null,
        id,
        userId
      );
      
      if (result.changes === 0) {
        return null; // No event found with that ID for this user
      }
      
      return this.findById(id);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event
  deleteEvent(id, userId) {
    try {
      const result = deleteEventStmt.run(id, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};

export default eventsModel; 