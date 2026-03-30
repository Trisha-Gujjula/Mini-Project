const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const aiEngine = require('../services/aiEngine');

// POST /api/ai/analyze - Run skill gap analysis
router.post('/analyze', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const result = aiEngine.analyzeSkillGaps(req.user.id);
        res.json(result);
    } catch (err) {
        console.error('AI analyze error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/ai/recommend - Generate course recommendations
router.post('/recommend', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const result = aiEngine.generateRecommendations(req.user.id);
        res.json(result);
    } catch (err) {
        console.error('AI recommend error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/ai/readiness/:studentId - Job readiness prediction
router.get('/readiness/:studentId', authenticateToken, (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const result = aiEngine.predictReadiness(studentId);
        res.json(result);
    } catch (err) {
        console.error('AI readiness error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/ai/generate-roadmap - Generate personalized learning roadmap
router.post('/generate-roadmap', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const result = aiEngine.generateRoadmap(req.user.id);
        res.json(result);
    } catch (err) {
        console.error('AI roadmap error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
