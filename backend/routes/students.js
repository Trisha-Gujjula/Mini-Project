const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/students/profile
router.get('/profile', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const profile = db.prepare(`
            SELECT sp.*, u.name, u.email, u.created_at 
            FROM student_profiles sp 
            JOIN users u ON sp.user_id = u.id 
            WHERE sp.user_id = ?
        `).get(req.user.id);

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        profile.skills = JSON.parse(profile.skills || '[]');
        profile.certifications = JSON.parse(profile.certifications || '[]');
        res.json({ profile });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/students/profile
router.put('/profile', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { skills, education, certifications, bio, experience, github_url, linkedin_url } = req.body;

        db.prepare(`
            UPDATE student_profiles 
            SET skills = ?, education = ?, certifications = ?, bio = ?, experience = ?, github_url = ?, linkedin_url = ?
            WHERE user_id = ?
        `).run(
            JSON.stringify(skills || []),
            education || '',
            JSON.stringify(certifications || []),
            bio || '',
            experience || '',
            github_url || '',
            linkedin_url || '',
            req.user.id
        );

        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/students/skill-gaps
router.get('/skill-gaps', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const gaps = db.prepare('SELECT * FROM skill_gaps WHERE student_id = ? ORDER BY gap_score DESC').all(req.user.id);
        res.json({ skillGaps: gaps });
    } catch (err) {
        console.error('Get skill gaps error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/students/roadmap
router.get('/roadmap', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const roadmap = db.prepare('SELECT * FROM learning_roadmaps WHERE student_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
        
        if (roadmap) {
            roadmap.recommendations = JSON.parse(roadmap.recommendations || '[]');
            roadmap.milestones = JSON.parse(roadmap.milestones || '[]');
        }

        // Also get skill gaps for roadmap context
        const gaps = db.prepare('SELECT * FROM skill_gaps WHERE student_id = ? ORDER BY gap_score DESC').all(req.user.id);

        // Get recommended courses based on skill gaps
        const courses = [];
        for (const gap of gaps) {
            const matchedCourses = db.prepare('SELECT * FROM courses WHERE skill_area = ?').all(gap.skill_name);
            courses.push(...matchedCourses);
        }

        res.json({ roadmap, skillGaps: gaps, recommendedCourses: courses });
    } catch (err) {
        console.error('Get roadmap error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/students/courses
router.get('/courses', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { skill, difficulty } = req.query;
        let query = 'SELECT * FROM courses';
        const params = [];

        if (skill) {
            query += ' WHERE skill_area = ?';
            params.push(skill);
            if (difficulty) {
                query += ' AND difficulty = ?';
                params.push(difficulty);
            }
        } else if (difficulty) {
            query += ' WHERE difficulty = ?';
            params.push(difficulty);
        }

        query += ' ORDER BY rating DESC';
        const courses = db.prepare(query).all(...params);
        res.json({ courses });
    } catch (err) {
        console.error('Get courses error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/students/applications
router.get('/applications', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const applications = db.prepare(`
            SELECT a.*, jp.title as job_title, jp.location, jp.job_type, jp.salary_range, 
                   u.name as company_name, u.organization
            FROM applications a
            JOIN job_postings jp ON a.job_id = jp.id
            JOIN users u ON jp.company_id = u.id
            WHERE a.student_id = ?
            ORDER BY a.applied_at DESC
        `).all(req.user.id);
        res.json({ applications });
    } catch (err) {
        console.error('Get applications error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/students/applications
router.post('/applications', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { job_id, cover_letter } = req.body;

        if (!job_id) {
            return res.status(400).json({ error: 'Job ID is required.' });
        }

        // Check if already applied
        const existing = db.prepare('SELECT id FROM applications WHERE student_id = ? AND job_id = ?').get(req.user.id, job_id);
        if (existing) {
            return res.status(400).json({ error: 'Already applied for this job.' });
        }

        // Check if job exists and is active
        const job = db.prepare('SELECT id FROM job_postings WHERE id = ? AND status = ?').get(job_id, 'active');
        if (!job) {
            return res.status(404).json({ error: 'Job not found or no longer active.' });
        }

        db.prepare('INSERT INTO applications (student_id, job_id, cover_letter) VALUES (?, ?, ?)').run(req.user.id, job_id, cover_letter || '');

        res.status(201).json({ message: 'Application submitted successfully.' });
    } catch (err) {
        console.error('Submit application error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/students/jobs - Get all active job postings
router.get('/jobs', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const jobs = db.prepare(`
            SELECT jp.*, u.name as company_name, u.organization
            FROM job_postings jp
            JOIN users u ON jp.company_id = u.id
            WHERE jp.status = 'active'
            ORDER BY jp.created_at DESC
        `).all();

        for (const job of jobs) {
            job.skills_required = JSON.parse(job.skills_required || '[]');
        }

        res.json({ jobs });
    } catch (err) {
        console.error('Get jobs error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
