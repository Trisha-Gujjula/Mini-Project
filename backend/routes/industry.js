const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/industry/jobs - Get company's job postings
router.get('/jobs', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const jobs = db.prepare(`
            SELECT jp.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = jp.id) as applications_count
            FROM job_postings jp 
            WHERE jp.company_id = ? 
            ORDER BY jp.created_at DESC
        `).all(req.user.id);

        for (const j of jobs) {
            j.skills_required = JSON.parse(j.skills_required || '[]');
        }

        res.json({ jobs });
    } catch (err) {
        console.error('Get jobs error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/industry/jobs - Create job posting
router.post('/jobs', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const { title, description, requirements, skills_required, location, job_type, salary_range } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Job title is required.' });
        }

        const result = db.prepare(
            'INSERT INTO job_postings (company_id, title, description, requirements, skills_required, location, job_type, salary_range) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
            req.user.id,
            title,
            description || '',
            requirements || '',
            JSON.stringify(skills_required || []),
            location || '',
            job_type || 'full-time',
            salary_range || ''
        );

        res.status(201).json({ message: 'Job posted successfully.', jobId: result.lastInsertRowid });
    } catch (err) {
        console.error('Create job error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/industry/jobs/:id - Update job posting
router.put('/jobs/:id', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const { title, description, requirements, skills_required, location, job_type, salary_range, status } = req.body;

        db.prepare(`
            UPDATE job_postings 
            SET title = COALESCE(?, title), description = COALESCE(?, description), 
                requirements = COALESCE(?, requirements), skills_required = COALESCE(?, skills_required),
                location = COALESCE(?, location), job_type = COALESCE(?, job_type), 
                salary_range = COALESCE(?, salary_range), status = COALESCE(?, status)
            WHERE id = ? AND company_id = ?
        `).run(
            title, description, requirements,
            skills_required ? JSON.stringify(skills_required) : null,
            location, job_type, salary_range, status,
            req.params.id, req.user.id
        );

        res.json({ message: 'Job updated successfully.' });
    } catch (err) {
        console.error('Update job error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/industry/candidates/:jobId - View eligible candidates for a job
router.get('/candidates/:jobId', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const job = db.prepare('SELECT * FROM job_postings WHERE id = ? AND company_id = ?').get(req.params.jobId, req.user.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        const jobSkills = JSON.parse(job.skills_required || '[]');

        // Get all students with matching skills
        const students = db.prepare(`
            SELECT u.id, u.name, u.email,
                   sp.skills, sp.education, sp.certifications, sp.readiness_score,
                   (SELECT ROUND(AVG(score * 100.0 / max_score), 1) FROM assessments WHERE student_id = u.id) as avg_score
            FROM users u
            JOIN student_profiles sp ON sp.user_id = u.id
            WHERE u.role = 'student'
            ORDER BY sp.readiness_score DESC
        `).all();

        const eligibleCandidates = students.map(s => {
            const studentSkills = JSON.parse(s.skills || '[]');
            const matchedSkills = jobSkills.filter(skill =>
                studentSkills.some(ss => ss.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ss.toLowerCase()))
            );
            const matchScore = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;

            return {
                ...s,
                skills: studentSkills,
                certifications: JSON.parse(s.certifications || '[]'),
                matchedSkills,
                matchScore,
            };
        }).filter(s => s.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

        res.json({ job: { ...job, skills_required: jobSkills }, candidates: eligibleCandidates });
    } catch (err) {
        console.error('Get candidates error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/industry/applications/:jobId - View applications for a job
router.get('/applications/:jobId', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const applications = db.prepare(`
            SELECT a.*, u.name as student_name, u.email as student_email,
                   sp.skills, sp.education, sp.readiness_score
            FROM applications a
            JOIN users u ON a.student_id = u.id
            JOIN student_profiles sp ON sp.user_id = u.id
            WHERE a.job_id = ?
            ORDER BY a.applied_at DESC
        `).all(req.params.jobId);

        for (const app of applications) {
            app.skills = JSON.parse(app.skills || '[]');
        }

        res.json({ applications });
    } catch (err) {
        console.error('Get applications error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/industry/applications/:id - Update application status
router.put('/applications/:id', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const { status } = req.body;
        if (!['applied', 'shortlisted', 'interview', 'selected', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        db.prepare('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(status, req.params.id);

        res.json({ message: `Application ${status} successfully.` });
    } catch (err) {
        console.error('Update application error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/industry/stats - Industry dashboard stats
router.get('/stats', authenticateToken, requireRole('industry'), (req, res) => {
    try {
        const totalJobs = db.prepare("SELECT COUNT(*) as count FROM job_postings WHERE company_id = ?").get(req.user.id).count;
        const activeJobs = db.prepare("SELECT COUNT(*) as count FROM job_postings WHERE company_id = ? AND status = 'active'").get(req.user.id).count;
        const totalApplications = db.prepare(`
            SELECT COUNT(*) as count FROM applications a 
            JOIN job_postings jp ON a.job_id = jp.id 
            WHERE jp.company_id = ?
        `).get(req.user.id).count;
        const selectedCandidates = db.prepare(`
            SELECT COUNT(*) as count FROM applications a 
            JOIN job_postings jp ON a.job_id = jp.id 
            WHERE jp.company_id = ? AND a.status = 'selected'
        `).get(req.user.id).count;

        res.json({
            stats: { totalJobs, activeJobs, totalApplications, selectedCandidates }
        });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
