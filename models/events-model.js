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

// Registration prepared statements
const registerForEventStmt = db.prepare(`
  INSERT INTO event_registrations (event_id, user_id) 
  VALUES (?, ?)
`);
const unregisterFromEventStmt = db.prepare(`
  DELETE FROM event_registrations 
  WHERE event_id = ? AND user_id = ?
`);
const findRegistrationStmt = db.prepare(`
  SELECT * FROM event_registrations 
  WHERE event_id = ? AND user_id = ?
`);
const getEventRegistrationsStmt = db.prepare(`
  SELECT er.*, u.email, u.name 
  FROM event_registrations er
  JOIN users u ON er.user_id = u.id
  WHERE er.event_id = ?
  ORDER BY er.registered_at ASC
`);
const getUserRegistrationsStmt = db.prepare(`
  SELECT e.*, er.registered_at, u.email as owner_email, u.name as owner_name
  FROM event_registrations er
  JOIN events e ON er.event_id = e.id
  JOIN users u ON e.user_id = u.id
  WHERE er.user_id = ?
  ORDER BY e.date ASC
`);
const getRegistrationCountStmt = db.prepare(`
  SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?
`);

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

  // Update event (only by owner)
  updateEvent(id, userId, updateData) {
    try {
      // First check if event exists and belongs to user
      const existingEvent = this.findById(id);
      if (!existingEvent) {
        return { error: 'EVENT_NOT_FOUND', message: 'Event not found' };
      }
      
      if (existingEvent.user_id !== userId) {
        return { error: 'UNAUTHORIZED', message: 'You can only update your own events' };
      }

      const result = updateEventStmt.run(
        updateData.title || null,
        updateData.description || null,
        updateData.address || null,
        updateData.date || null,
        id,
        userId
      );
      
      if (result.changes === 0) {
        return { error: 'UPDATE_FAILED', message: 'Failed to update event' };
      }
      
      return { success: true, event: this.findById(id) };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event (only by owner)
  deleteEvent(id, userId) {
    try {
      // First check if event exists and belongs to user
      const existingEvent = this.findById(id);
      if (!existingEvent) {
        return { error: 'EVENT_NOT_FOUND', message: 'Event not found' };
      }
      
      if (existingEvent.user_id !== userId) {
        return { error: 'UNAUTHORIZED', message: 'You can only delete your own events' };
      }

      const result = deleteEventStmt.run(id, userId);
      
      if (result.changes === 0) {
        return { error: 'DELETE_FAILED', message: 'Failed to delete event' };
      }
      
      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Register for event
  registerForEvent(eventId, userId) {
    try {
      // Check if event exists
      const event = this.findById(eventId);
      if (!event) {
        return { error: 'EVENT_NOT_FOUND', message: 'Event not found' };
      }

      // Check if user is trying to register for their own event
      if (event.user_id === userId) {
        return { error: 'SELF_REGISTRATION', message: 'You cannot register for your own event' };
      }

      // Check if already registered
      const existingRegistration = findRegistrationStmt.get(eventId, userId);
      if (existingRegistration) {
        return { error: 'ALREADY_REGISTERED', message: 'You are already registered for this event' };
      }

      // Check if event date has passed
      const eventDate = new Date(event.date);
      const now = new Date();
      if (eventDate <= now) {
        return { error: 'EVENT_PAST', message: 'Cannot register for past events' };
      }

      // Register for event
      const result = registerForEventStmt.run(eventId, userId);
      
      if (result.changes === 0) {
        return { error: 'REGISTRATION_FAILED', message: 'Failed to register for event' };
      }

      return { 
        success: true, 
        message: 'Successfully registered for event',
        registration: {
          id: result.lastInsertRowid,
          event_id: eventId,
          user_id: userId,
          registered_at: new Date().toISOString()
        }
      };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { error: 'ALREADY_REGISTERED', message: 'You are already registered for this event' };
      }
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Unregister from event
  unregisterFromEvent(eventId, userId) {
    try {
      // Check if event exists
      const event = this.findById(eventId);
      if (!event) {
        return { error: 'EVENT_NOT_FOUND', message: 'Event not found' };
      }

      // Check if user is registered
      const existingRegistration = findRegistrationStmt.get(eventId, userId);
      if (!existingRegistration) {
        return { error: 'NOT_REGISTERED', message: 'You are not registered for this event' };
      }

      // Unregister from event
      const result = unregisterFromEventStmt.run(eventId, userId);
      
      if (result.changes === 0) {
        return { error: 'UNREGISTER_FAILED', message: 'Failed to unregister from event' };
      }

      return { success: true, message: 'Successfully unregistered from event' };
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  },

  // Get event registrations (for event owners)
  getEventRegistrations(eventId) {
    try {
      return getEventRegistrationsStmt.all(eventId);
    } catch (error) {
      console.error('Error getting event registrations:', error);
      throw error;
    }
  },

  // Get user's registered events
  getUserRegistrations(userId) {
    try {
      return getUserRegistrationsStmt.all(userId);
    } catch (error) {
      console.error('Error getting user registrations:', error);
      throw error;
    }
  },

  // Get registration count for an event
  getRegistrationCount(eventId) {
    try {
      const result = getRegistrationCountStmt.get(eventId);
      return result.count;
    } catch (error) {
      console.error('Error getting registration count:', error);
      throw error;
    }
  },

  // Check if user is registered for event
  isUserRegistered(eventId, userId) {
    try {
      const registration = findRegistrationStmt.get(eventId, userId);
      return !!registration;
    } catch (error) {
      console.error('Error checking registration status:', error);
      throw error;
    }
  }
};

export default eventsModel; 