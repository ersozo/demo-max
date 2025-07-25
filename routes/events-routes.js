import express from 'express';
import eventsController from '../controllers/events-controller.js';
import { authenticateToken } from '../util/auth.js';

const router = express.Router();

// All event routes require authentication
router.use(authenticateToken);

// POST /events - Create new event
router.post('/', eventsController.createEvent);

// GET /events - Get all events
router.get('/', eventsController.getAllEvents);

// GET /events/my - Get current user's events
router.get('/my', eventsController.getUserEvents);

// GET /events/:id - Get event by ID
router.get('/:id', eventsController.getEventById);

// PUT /events/:id - Update event
router.put('/:id', eventsController.updateEvent);

// DELETE /events/:id - Delete event
router.delete('/:id', eventsController.deleteEvent);

// Event registration routes
// POST /events/:id/register - Register for an event
router.post('/:id/register', eventsController.registerForEvent);

// DELETE /events/:id/unregister - Unregister from an event  
router.delete('/:id/unregister', eventsController.unregisterFromEvent);

// GET /events/:id/registrations - Get event registrations (only for event owner)
router.get('/:id/registrations', eventsController.getEventRegistrations);

// GET /events/registrations/my - Get current user's registered events
router.get('/registrations/my', eventsController.getUserRegistrations);

export default router; 