import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user-routes.js';
import eventsRoutes from './routes/events-routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173', // Vite default port
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    // Add your frontend domain in production
    // 'https://yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization'
  ]
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

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
