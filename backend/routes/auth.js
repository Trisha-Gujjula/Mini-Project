const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { name, email, password, role, organization } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required.' });
        }

        if (!['student', 'institute', 'industry'].includes(role)) {
            return res.status(400).json({ error: 'Role must be student, institute, or industry.' });
        }

        // Check if user already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Insert user
        const result = db.prepare(
            'INSERT INTO users (name, email, password, role, organization) VALUES (?, ?, ?, ?, ?)'
        ).run(name, email, hashedPassword, role, organization || '');

        // Create student profile if student role
        if (role === 'student') {
            db.prepare('INSERT INTO student_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);
        }

        // Generate token
        const token = jwt.sign(
            { id: result.lastInsertRowid, email, role, name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: result.lastInsertRowid, name, email, role, organization: organization || '' }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, organization: user.organization }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, organization, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ user });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
