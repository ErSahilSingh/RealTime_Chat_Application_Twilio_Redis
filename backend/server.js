require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const initializeSocket = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible to routes if needed
app.set('io', io);

// Connect to MongoDB
connectDB();

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Chat Application Server Running      ║
╟───────────────────────────────────────────╢
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Port: ${PORT}
║   HTTP: http://localhost:${PORT}
║   Health: http://localhost:${PORT}/health
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});
