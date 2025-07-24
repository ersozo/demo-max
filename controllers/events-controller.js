import eventsModel from '../models/events-model.js';

// Helper function to validate date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Helper function to sanitize text input
const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' '); // Remove extra whitespace
};

// Validation helper functions
const validateEventData = (eventData) => {
  const errors = [];
  const { title, description, address, date } = eventData;

  // Title validation
  if (!title || typeof title !== 'string') {
    errors.push('Title is required and must be a string');
  } else {
    const sanitizedTitle = sanitizeText(title);
    if (sanitizedTitle.length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    if (sanitizedTitle.length > 100) {
      errors.push('Title must not exceed 100 characters');
    }
  }

  // Description validation (optional)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else {
      const sanitizedDescription = sanitizeText(description);
      if (sanitizedDescription.length > 500) {
        errors.push('Description must not exceed 500 characters');
      }
    }
  }

  // Address validation (optional)
  if (address !== undefined && address !== null) {
    if (typeof address !== 'string') {
      errors.push('Address must be a string');
    } else {
      const sanitizedAddress = sanitizeText(address);
      if (sanitizedAddress.length > 200) {
        errors.push('Address must not exceed 200 characters');
      }
    }
  }

  // Date validation
  if (!date) {
    errors.push('Date is required');
  } else {
    if (!isValidDate(date)) {
      errors.push('Please provide a valid date in ISO format (e.g., 2024-12-25T15:00:00Z)');
    } else {
      const eventDate = new Date(date);
      const now = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);

      // Check if date is in the past
      if (eventDate <= now) {
        errors.push('Event date must be in the future');
      }

      // Check if date is too far in the future (optional business rule)
      if (eventDate > oneYearFromNow) {
        errors.push('Event date cannot be more than 1 year in the future');
      }

      // Check if date is reasonable (not before 1900 or after 2100)
      if (eventDate.getFullYear() < 1900 || eventDate.getFullYear() > 2100) {
        errors.push('Event date must be between years 1900 and 2100');
      }
    }
  }

  return errors;
};

const eventsController = {
  // Create new event
  async createEvent(req, res) {
    try {
      const { title, description, address, date } = req.body;
      const userId = req.user.id; // From JWT middleware

      // Comprehensive validation
      const validationErrors = validateEventData({ title, description, address, date });
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Sanitize inputs
      const sanitizedEventData = {
        title: sanitizeText(title),
        description: description ? sanitizeText(description) : null,
        address: address ? sanitizeText(address) : null,
        date: new Date(date).toISOString(), // Normalize date format
        user_id: userId
      };

      // Check for duplicate events (same title, date, and user)
      const existingEvents = eventsModel.findByUserId(userId);
      const duplicateEvent = existingEvents.find(event => 
        event.title.toLowerCase() === sanitizedEventData.title.toLowerCase() &&
        new Date(event.date).getTime() === new Date(sanitizedEventData.date).getTime()
      );

      if (duplicateEvent) {
        return res.status(409).json({
          success: false,
          message: 'You already have an event with the same title at the same date and time'
        });
      }

      // Create new event
      const newEvent = eventsModel.createEvent(sanitizedEventData);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event: newEvent
      });

    } catch (error) {
      console.error('Create event error:', error);
      
      // Handle specific database errors
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user reference'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all events
  async getAllEvents(req, res) {
    try {
      const events = eventsModel.getAllEvents();

      res.status(200).json({
        success: true,
        events: events
      });

    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get event by ID
  async getEventById(req, res) {
    try {
      const eventId = parseInt(req.params.id);

      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

      const event = eventsModel.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      res.status(200).json({
        success: true,
        event: event
      });

    } catch (error) {
      console.error('Get event by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get current user's events
  async getUserEvents(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const events = eventsModel.findByUserId(userId);

      res.status(200).json({
        success: true,
        events: events
      });

    } catch (error) {
      console.error('Get user events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update event
  async updateEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // From JWT middleware
      const { title, description, address, date } = req.body;

      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

             // Validate only provided fields
       const updateData = {};
       const validationErrors = [];

       if (title !== undefined) {
         if (typeof title !== 'string' || sanitizeText(title).length < 3) {
           validationErrors.push('Title must be at least 3 characters long');
         } else if (sanitizeText(title).length > 100) {
           validationErrors.push('Title must not exceed 100 characters');
         } else {
           updateData.title = sanitizeText(title);
         }
       }

       if (description !== undefined) {
         if (description !== null && typeof description !== 'string') {
           validationErrors.push('Description must be a string');
         } else if (description && sanitizeText(description).length > 500) {
           validationErrors.push('Description must not exceed 500 characters');
         } else {
           updateData.description = description ? sanitizeText(description) : null;
         }
       }

       if (address !== undefined) {
         if (address !== null && typeof address !== 'string') {
           validationErrors.push('Address must be a string');
         } else if (address && sanitizeText(address).length > 200) {
           validationErrors.push('Address must not exceed 200 characters');
         } else {
           updateData.address = address ? sanitizeText(address) : null;
         }
       }

       if (date !== undefined) {
         if (!isValidDate(date)) {
           validationErrors.push('Please provide a valid date in ISO format');
         } else {
           const eventDate = new Date(date);
           const now = new Date();
           if (eventDate <= now) {
             validationErrors.push('Event date must be in the future');
           } else {
             updateData.date = eventDate.toISOString();
           }
         }
       }

       if (validationErrors.length > 0) {
         return res.status(400).json({
           success: false,
           message: 'Validation failed',
           errors: validationErrors
         });
       }

       const updatedEvent = eventsModel.updateEvent(eventId, userId, updateData);

      if (!updatedEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or you do not have permission to update it'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        event: updatedEvent
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete event
  async deleteEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id; // From JWT middleware

      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

      const deleted = eventsModel.deleteEvent(eventId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or you do not have permission to delete it'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export default eventsController; 