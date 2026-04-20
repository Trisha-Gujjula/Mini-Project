const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// --- Student Management ---

router.get('/students', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { college, branch, year, status } = req.query;
        let query = `
            SELECT id, name, email, role, organization, status, aspired_job_role, college, branch, passing_year, created_at 
            FROM users 
            WHERE role = 'student'
        `;
        const params = [];

        if (college) { query += ' AND college = ?'; params.push(college); }
        if (branch) { query += ' AND branch = ?'; params.push(branch); }
        if (year) { query += ' AND passing_year = ?'; params.push(year); }
        if (status) { query += ' AND status = ?'; params.push(status); }

        query += ' ORDER BY created_at DESC';
        const students = db.prepare(query).all(...params);
        res.json({ students });
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/students/:id/approve', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        db.prepare('UPDATE users SET status = "approved" WHERE id = ?').run(req.params.id);
        res.json({ message: 'Student approved successfully.' });
    } catch (err) {
        console.error('Approve student error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/students/:id/reject', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { reason } = req.body;
        db.prepare('UPDATE users SET status = "rejected", rejection_reason = ? WHERE id = ?').run(reason || '', req.params.id);
        res.json({ message: 'Student rejected successfully.' });
    } catch (err) {
        console.error('Reject student error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- Achievement Management ---

router.get('/achievements', authenticateToken, (req, res) => {
    try {
        const achievements = db.prepare('SELECT * FROM achievements ORDER BY achievement_date DESC').all();
        res.json({ achievements });
    } catch (err) {
        console.error('Get achievements error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/achievements', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { title, description, source, award_name, students_placed, type, date } = req.body;
        db.prepare(`
            INSERT INTO achievements (title, description, source, award_name, students_placed, type, achievement_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(title, description, source, award_name, students_placed || 0, type || 'institutional', date);
        res.status(201).json({ message: 'Achievement added successfully.' });
    } catch (err) {
        console.error('Add achievement error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- Course & Assessment Management ---

router.post('/courses', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { title, description, skill_area, difficulty, duration, url, provider, category } = req.body;
        db.prepare(`
            INSERT INTO courses (title, description, skill_area, difficulty, duration, url, provider)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(title, description, skill_area, difficulty, duration, url, provider);
        res.status(201).json({ message: 'Course added successfully.' });
    } catch (err) {
        console.error('Add course error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- Query Resolution ---

router.get('/queries', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const queries = db.prepare(`
            SELECT q.*, u.name as student_name, u.branch, u.email as student_email
            FROM queries q
            JOIN users u ON q.student_id = u.id
            ORDER BY q.created_at DESC
        `).all();
        res.json({ queries });
    } catch (err) {
        console.error('Get queries error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/queries/:id/resolve', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { response } = req.body;
        db.prepare('UPDATE queries SET response = ?, status = "resolved", resolved_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(response, req.params.id);
        res.json({ message: 'Query resolved successfully.' });
    } catch (err) {
        console.error('Resolve query error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- Department Change Requests ---

router.get('/dept-changes', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const requests = db.prepare(`
            SELECT dcr.*, u.name as student_name, u.email as student_email
            FROM department_change_requests dcr
            JOIN users u ON dcr.student_id = u.id
            ORDER BY dcr.created_at DESC
        `).all();
        res.json({ requests });
    } catch (err) {
        console.error('Get dept changes error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/dept-changes/:id/approve', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const request = db.prepare('SELECT student_id, new_department FROM department_change_requests WHERE id = ?').get(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found.' });

        // Update user's branch
        db.prepare('UPDATE users SET branch = ? WHERE id = ?').run(request.new_department, request.student_id);
        // Mark request as approved
        db.prepare('UPDATE department_change_requests SET status = "approved" WHERE id = ?').run(req.params.id);

        res.json({ message: 'Department change approved and profile updated.' });
    } catch (err) {
        console.error('Approve dept change error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/dept-changes/:id/reject', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        db.prepare('UPDATE department_change_requests SET status = "rejected" WHERE id = ?').run(req.params.id);
        res.json({ message: 'Department change request rejected.' });
    } catch (err) {
        console.error('Reject dept change error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
