const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/institute/students - View all students with progress
router.get('/students', authenticateToken, requireRole('institute'), (req, res) => {
    try {
        const students = db.prepare(`
            SELECT u.id, u.name, u.email, u.created_at,
                   sp.skills, sp.education, sp.certifications, sp.readiness_score,
                   (SELECT COUNT(*) FROM assessments WHERE student_id = u.id) as total_assessments,
                   (SELECT ROUND(AVG(score * 100.0 / max_score), 1) FROM assessments WHERE student_id = u.id) as avg_score
            FROM users u
            JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.role = 'student'
            ORDER BY sp.readiness_score DESC
        `).all();

        for (const s of students) {
            s.skills = JSON.parse(s.skills || '[]');
            s.certifications = JSON.parse(s.certifications || '[]');
        }

        res.json({ students });
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/institute/job-ready - List job-ready candidates (readiness >= 70)
router.get('/job-ready', authenticateToken, requireRole('institute'), (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 70;
        const students = db.prepare(`
            SELECT u.id, u.name, u.email, 
                   sp.skills, sp.education, sp.readiness_score,
                   (SELECT COUNT(*) FROM assessments WHERE student_id = u.id) as total_assessments
            FROM users u
            JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.role = 'student' AND sp.readiness_score >= ?
            ORDER BY sp.readiness_score DESC
        `).all(threshold);

        for (const s of students) {
            s.skills = JSON.parse(s.skills || '[]');
        }

        res.json({ students, threshold });
    } catch (err) {
        console.error('Get job-ready error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/institute/drives - Get interview drives
router.get('/drives', authenticateToken, requireRole('institute'), (req, res) => {
    try {
        const drives = db.prepare(
            'SELECT * FROM interview_drives WHERE institute_id = ? ORDER BY drive_date ASC'
        ).all(req.user.id);
        res.json({ drives });
    } catch (err) {
        console.error('Get drives error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/institute/drives - Create interview drive
router.post('/drives', authenticateToken, requireRole('institute'), (req, res) => {
    try {
        const { company_name, title, description, drive_date, location, eligibility_criteria } = req.body;

        if (!company_name || !title || !drive_date) {
            return res.status(400).json({ error: 'Company name, title, and drive date are required.' });
        }

        const result = db.prepare(
            'INSERT INTO interview_drives (institute_id, company_name, title, description, drive_date, location, eligibility_criteria) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, company_name, title, description || '', drive_date, location || '', eligibility_criteria || '');

        res.status(201).json({ message: 'Drive created successfully.', driveId: result.lastInsertRowid });
    } catch (err) {
        console.error('Create drive error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/institute/drives/:id - Update drive status
router.put('/drives/:id', authenticateToken, requireRole('institute'), (req, res) => {
    try {
        const { status } = req.body;
        if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        db.prepare('UPDATE interview_drives SET status = ? WHERE id = ? AND institute_id = ?')
            .run(status, req.params.id, req.user.id);

        res.json({ message: 'Drive updated successfully.' });
    } catch (err) {
        console.error('Update drive error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/institute/stats - Placement statistics
router.get('/stats', authenticateToken, requireRole('institute'), (req, res) => {
    try {
        const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
        const jobReady = db.prepare(`
            SELECT COUNT(*) as count FROM student_profiles WHERE readiness_score >= 70
        `).get().count;
        const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
        const selectedStudents = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'selected'").get().count;
        const totalDrives = db.prepare('SELECT COUNT(*) as count FROM interview_drives WHERE institute_id = ?').get(req.user.id).count;
        const avgReadiness = db.prepare('SELECT ROUND(AVG(readiness_score), 1) as avg FROM student_profiles').get().avg || 0;

        const skillDistribution = db.prepare(`
            SELECT skill_name, COUNT(*) as count, ROUND(AVG(current_level), 1) as avg_level 
            FROM skill_gaps 
            GROUP BY skill_name 
            ORDER BY count DESC 
            LIMIT 10
        `).all();

        const recentAssessments = db.prepare(`
            SELECT a.title, a.category, a.score, a.max_score, a.created_at, u.name as student_name
            FROM assessments a JOIN users u ON a.student_id = u.id
            ORDER BY a.created_at DESC LIMIT 10
        `).all();

        res.json({
            stats: {
                totalStudents,
                jobReady,
                totalApplications,
                selectedStudents,
                totalDrives,
                avgReadiness,
                placementRate: totalStudents > 0 ? Math.round((selectedStudents / totalStudents) * 100) : 0,
            },
            skillDistribution,
            recentAssessments,
        });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
