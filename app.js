import express from 'express';
import userRoutes from './routes/user-routes.js';
import eventsRoutes from './routes/events-routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', userRoutes);
app.use('/events', eventsRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Demo REST API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
