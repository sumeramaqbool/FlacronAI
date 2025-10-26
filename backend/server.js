// FlacronAI - Main Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Firebase and Gemini
const { initializeFirebase } = require('./config/firebase');
const { initializeGemini } = require('./config/gemini');

// Import routes
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const paymentRouter = require('./routes/payment');
const crmRouter = require('./routes/crm');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - Configure helmet to allow Firebase CDN and external resources
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://www.gstatic.com",
        "https://www.googletagmanager.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "https://ui-avatars.com"],
      connectSrc: [
        "'self'",
        "https://www.gstatic.com",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://*.cloudfunctions.net"
      ]
    }
  }
}));

// CORS configuration - Allow frontend on port 5173
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Serve uploaded files (reports, images) - Only uploads, no static frontend files
app.use('/uploads', express.static('uploads'));

// Root endpoint - Respond to Render health checks
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FlacronAI Backend API is running',
    version: '1.0.0',
    documentation: '/api'
  });
});

// Also handle HEAD requests for health checks
app.head('/', (req, res) => {
  res.status(200).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FlacronAI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'FlacronAI API',
    version: '1.0.0',
    description: 'AI-powered Insurance Inspection Report Generator',
    powered_by: 'Google Gemini AI',
    endpoints: {
      reports: {
        generate: 'POST /api/reports/generate',
        list: 'GET /api/reports',
        get: 'GET /api/reports/:id',
        update: 'PUT /api/reports/:id',
        delete: 'DELETE /api/reports/:id',
        export: 'POST /api/reports/:id/export',
        uploadImages: 'POST /api/reports/:id/images',
        analyzeImages: 'POST /api/reports/analyze-images'
      },
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'POST /api/auth/verify',
        logout: 'POST /api/auth/logout'
      },
      users: {
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
        usage: 'GET /api/users/usage',
        upgrade: 'POST /api/users/upgrade'
      }
    },
    documentation: 'https://flacronai.com/docs'
  });
});

// API Routes
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/crm', crmRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Unmatched route:', req.method, req.url);
  console.log('   Headers:', req.headers);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting FlacronAI Server...');

    // Initialize Firebase
    initializeFirebase();

    // Initialize Gemini AI
    initializeGemini();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║               🔥 FLACRONAI SERVER 🔥                  ║
║                                                       ║
║  AI-powered Insurance Report Generator               ║
║  Powered by Google Gemini AI                         ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Server:    http://localhost:${PORT}                     ║
║  API:       http://localhost:${PORT}/api                 ║
║  Health:    http://localhost:${PORT}/health              ║
║  Domain:    https://flacronai.com                     ║
║                                                       ║
║  Status:    ✅ Running                                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
