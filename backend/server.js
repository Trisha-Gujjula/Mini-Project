require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { setupDb } = require('../database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/institute', require('./routes/institute'));
app.use('/api/industry', require('./routes/industry'));
app.use('/api/ai', require('./routes/ai'));

// API health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'running', 
        platform: 'Prashikshan',
        version: '1.0.0',
        timestamp: new Date().toISOString() 
    });
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

// Initialize database then start server
async function start() {
    try {
        await setupDb();
        console.log('✅ Database initialized');

        app.listen(PORT, () => {
            console.log(`\n🚀 Prashikshan server running at http://localhost:${PORT}`);
            console.log(`📂 Frontend: http://localhost:${PORT}`);
            console.log(`🔌 API Base: http://localhost:${PORT}/api`);
            console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();

module.exports = app;
