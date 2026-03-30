/**
 * Prashikshan AI Engine
 * 
 * Implements:
 * 1. Skill Gap Analysis (simulated Random Forest approach with feature importance)
 * 2. Personalized Recommendation System (content-based filtering)
 * 3. Job Readiness Prediction (multi-factor scoring neural network simulation)
 */

const db = require('../../database/db');

class AIEngine {

    /**
     * Skill Gap Analysis
     * Compares student's current skills and assessment scores against industry requirements.
     * Uses weighted scoring similar to Random Forest feature importance.
     */
    analyzeSkillGaps(studentId) {
        const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
        if (!profile) throw new Error('Student profile not found');

        const studentSkills = JSON.parse(profile.skills || '[]');
        const assessments = db.prepare('SELECT * FROM assessments WHERE student_id = ?').all(studentId);

        // Get all active job requirements to understand market demand
        const jobs = db.prepare("SELECT skills_required FROM job_postings WHERE status = 'active'").all();
        const demandedSkills = {};

        for (const job of jobs) {
            const skills = JSON.parse(job.skills_required || '[]');
            for (const skill of skills) {
                demandedSkills[skill] = (demandedSkills[skill] || 0) + 1;
            }
        }

        // Calculate skill gaps with weighted importance (simulating Random Forest)
        const skillGaps = [];
        const totalJobs = jobs.length || 1;

        // Feature weights (simulating Random Forest feature importance)
        const weights = {
            marketDemand: 0.35,    // How much the market demands this skill
            assessmentScore: 0.30, // Student's assessment performance
            skillPresence: 0.20,   // Whether student has listed this skill
            certifications: 0.15,  // Related certifications
        };

        for (const [skill, demand] of Object.entries(demandedSkills)) {
            const marketDemandScore = Math.min((demand / totalJobs) * 100, 100);

            // Check assessment scores for this skill
            const relatedAssessments = assessments.filter(a =>
                a.category.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(a.category.toLowerCase())
            );
            const assessmentScore = relatedAssessments.length > 0
                ? relatedAssessments.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / relatedAssessments.length
                : 0;

            // Check if student has this skill
            const hasSkill = studentSkills.some(s =>
                s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
            );
            const skillPresenceScore = hasSkill ? 80 : 10;

            // Check certifications
            const certs = JSON.parse(profile.certifications || '[]');
            const hasCert = certs.some(c =>
                c.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(c.toLowerCase())
            );
            const certScore = hasCert ? 90 : 5;

            // Weighted current level
            const currentLevel = Math.round(
                weights.assessmentScore * assessmentScore +
                weights.skillPresence * skillPresenceScore +
                weights.certifications * certScore +
                weights.marketDemand * 20 // baseline from having market awareness
            );

            const requiredLevel = Math.round(50 + marketDemandScore * 0.4);
            const gapScore = Math.max(0, requiredLevel - currentLevel);
            const priority = gapScore > 40 ? 'high' : gapScore > 20 ? 'medium' : 'low';

            skillGaps.push({
                skill_name: skill,
                current_level: Math.min(currentLevel, 100),
                required_level: requiredLevel,
                gap_score: gapScore,
                priority,
                market_demand: Math.round(marketDemandScore),
            });

            // Update database
            const existing = db.prepare('SELECT id FROM skill_gaps WHERE student_id = ? AND skill_name = ?').get(studentId, skill);
            if (existing) {
                db.prepare('UPDATE skill_gaps SET current_level = ?, required_level = ?, gap_score = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(Math.min(currentLevel, 100), requiredLevel, gapScore, priority, existing.id);
            } else {
                db.prepare('INSERT INTO skill_gaps (student_id, skill_name, current_level, required_level, gap_score, priority) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(studentId, skill, Math.min(currentLevel, 100), requiredLevel, gapScore, priority);
            }
        }

        // Sort by gap score descending
        skillGaps.sort((a, b) => b.gap_score - a.gap_score);

        return {
            message: 'Skill gap analysis completed',
            algorithm: 'Weighted Feature Importance (Random Forest Simulation)',
            weights,
            skillGaps,
            totalSkillsAnalyzed: skillGaps.length,
            criticalGaps: skillGaps.filter(g => g.priority === 'high').length,
        };
    }

    /**
     * Personalized Recommendation System
     * Content-based filtering matching student's skill gaps to relevant courses.
     */
    generateRecommendations(studentId) {
        const gaps = db.prepare('SELECT * FROM skill_gaps WHERE student_id = ? ORDER BY gap_score DESC').all(studentId);
        const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
        const allCourses = db.prepare('SELECT * FROM courses ORDER BY rating DESC').all();

        const recommendations = [];
        const addedCourseIds = new Set();

        for (const gap of gaps) {
            // Find courses matching this skill gap
            const matchingCourses = allCourses.filter(course => {
                if (addedCourseIds.has(course.id)) return false;
                return course.skill_area.toLowerCase().includes(gap.skill_name.toLowerCase()) ||
                    gap.skill_name.toLowerCase().includes(course.skill_area.toLowerCase());
            });

            for (const course of matchingCourses) {
                // Calculate relevance score
                const relevanceScore = this._calculateRelevance(course, gap, profile);
                addedCourseIds.add(course.id);

                recommendations.push({
                    course,
                    skill_gap: gap.skill_name,
                    gap_score: gap.gap_score,
                    priority: gap.priority,
                    relevance_score: relevanceScore,
                    reason: `Addresses ${gap.skill_name} skill gap (current: ${gap.current_level}%, required: ${gap.required_level}%)`,
                });
            }
        }

        // Also recommend courses for skills student doesn't have but are in demand
        const studentSkills = JSON.parse(profile?.skills || '[]');
        for (const course of allCourses) {
            if (addedCourseIds.has(course.id)) continue;
            const hasSkill = studentSkills.some(s =>
                s.toLowerCase().includes(course.skill_area.toLowerCase())
            );
            if (!hasSkill) {
                recommendations.push({
                    course,
                    skill_gap: course.skill_area,
                    gap_score: 50,
                    priority: 'medium',
                    relevance_score: 60,
                    reason: `New skill opportunity: ${course.skill_area}`,
                });
                addedCourseIds.add(course.id);
            }
        }

        // Sort by relevance score
        recommendations.sort((a, b) => b.relevance_score - a.relevance_score);

        // Save roadmap
        const topRecs = recommendations.slice(0, 10);
        const milestones = this._generateMilestones(topRecs);

        const existingRoadmap = db.prepare('SELECT id FROM learning_roadmaps WHERE student_id = ?').get(studentId);
        if (existingRoadmap) {
            db.prepare('UPDATE learning_roadmaps SET recommendations = ?, milestones = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(JSON.stringify(topRecs), JSON.stringify(milestones), existingRoadmap.id);
        } else {
            db.prepare('INSERT INTO learning_roadmaps (student_id, recommendations, milestones) VALUES (?, ?, ?)')
                .run(studentId, JSON.stringify(topRecs), JSON.stringify(milestones));
        }

        return {
            message: 'Recommendations generated successfully',
            algorithm: 'Content-Based Filtering',
            totalRecommendations: recommendations.length,
            recommendations: recommendations.slice(0, 15),
            milestones,
        };
    }

    /**
     * Job Readiness Prediction
     * Multi-factor scoring model simulating a neural network approach.
     */
    predictReadiness(studentId) {
        const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
        if (!profile) throw new Error('Student profile not found');

        const assessments = db.prepare('SELECT * FROM assessments WHERE student_id = ?').all(studentId);
        const gaps = db.prepare('SELECT * FROM skill_gaps WHERE student_id = ?').all(studentId);
        const applications = db.prepare('SELECT * FROM applications WHERE student_id = ?').all(studentId);
        const studentSkills = JSON.parse(profile.skills || '[]');
        const certifications = JSON.parse(profile.certifications || '[]');

        // Neural network simulation: input → hidden layers → output
        // Input features
        const features = {
            avgAssessmentScore: assessments.length > 0
                ? assessments.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / assessments.length
                : 0,
            totalAssessments: Math.min(assessments.length * 10, 100),
            skillCount: Math.min(studentSkills.length * 15, 100),
            certificationCount: Math.min(certifications.length * 25, 100),
            avgGapScore: gaps.length > 0
                ? 100 - (gaps.reduce((sum, g) => sum + g.gap_score, 0) / gaps.length)
                : 50,
            applicationExperience: Math.min(applications.length * 20, 100),
            profileCompleteness: this._calculateProfileCompleteness(profile),
        };

        // Hidden layer 1 weights (simulating neural network)
        const hidden1 = {
            technicalAbility: features.avgAssessmentScore * 0.4 + features.skillCount * 0.3 + features.avgGapScore * 0.3,
            credibility: features.certificationCount * 0.5 + features.totalAssessments * 0.3 + features.profileCompleteness * 0.2,
            marketFit: features.avgGapScore * 0.4 + features.applicationExperience * 0.3 + features.skillCount * 0.3,
        };

        // Hidden layer 2 (combining hidden units)
        const hidden2 = {
            overall: hidden1.technicalAbility * 0.45 + hidden1.credibility * 0.25 + hidden1.marketFit * 0.30,
        };

        // Output layer with sigmoid-like activation
        const rawScore = hidden2.overall;
        const readinessScore = Math.round(Math.min(Math.max(rawScore, 0), 100));

        // Determine readiness level
        let readinessLevel, readinessMessage;
        if (readinessScore >= 80) {
            readinessLevel = 'Excellent';
            readinessMessage = 'You are highly job-ready! Consider applying to top-tier positions.';
        } else if (readinessScore >= 65) {
            readinessLevel = 'Good';
            readinessMessage = 'You are job-ready with room for improvement in some areas.';
        } else if (readinessScore >= 45) {
            readinessLevel = 'Developing';
            readinessMessage = 'You are making progress. Focus on closing skill gaps and taking more assessments.';
        } else {
            readinessLevel = 'Needs Improvement';
            readinessMessage = 'Focus on building core skills and completing assessments to improve readiness.';
        }

        // Update profile readiness score
        db.prepare('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?').run(readinessScore, studentId);

        return {
            message: 'Readiness prediction completed',
            algorithm: 'Multi-Layer Perceptron (Neural Network Simulation)',
            readinessScore,
            readinessLevel,
            readinessMessage,
            factors: features,
            hiddenLayers: { layer1: hidden1, layer2: hidden2 },
            recommendations: this._getReadinessRecommendations(features),
        };
    }

    /**
     * Generate Learning Roadmap
     */
    generateRoadmap(studentId) {
        // First run analysis and recommendations
        const analysis = this.analyzeSkillGaps(studentId);
        const recommendations = this.generateRecommendations(studentId);
        const readiness = this.predictReadiness(studentId);

        return {
            message: 'Complete learning roadmap generated',
            readiness,
            analysis: {
                criticalGaps: analysis.skillGaps.filter(g => g.priority === 'high'),
                moderateGaps: analysis.skillGaps.filter(g => g.priority === 'medium'),
                minorGaps: analysis.skillGaps.filter(g => g.priority === 'low'),
            },
            recommendations: recommendations.recommendations.slice(0, 10),
            milestones: recommendations.milestones,
        };
    }

    // Private helpers
    _calculateRelevance(course, gap, profile) {
        let score = 0;

        // Gap severity relevance
        score += (gap.gap_score / 100) * 40;

        // Difficulty matching
        if (gap.current_level < 30 && course.difficulty === 'beginner') score += 25;
        else if (gap.current_level >= 30 && gap.current_level < 60 && course.difficulty === 'intermediate') score += 25;
        else if (gap.current_level >= 60 && course.difficulty === 'advanced') score += 25;
        else score += 10;

        // Course rating factor
        score += (course.rating / 5) * 20;

        // Priority boost
        if (gap.priority === 'high') score += 15;
        else if (gap.priority === 'medium') score += 8;

        return Math.round(Math.min(score, 100));
    }

    _generateMilestones(recommendations) {
        const milestones = [];
        const weeks = [2, 4, 8, 12];

        for (let i = 0; i < Math.min(recommendations.length, 4); i++) {
            milestones.push({
                week: weeks[i],
                title: `Complete ${recommendations[i].course.title}`,
                skill: recommendations[i].skill_gap,
                difficulty: recommendations[i].course.difficulty,
                status: 'pending',
            });
        }

        milestones.push({
            week: 16,
            title: 'Take reassessment to measure progress',
            skill: 'All Skills',
            difficulty: 'assessment',
            status: 'pending',
        });

        return milestones;
    }

    _calculateProfileCompleteness(profile) {
        let score = 0;
        if (profile.education) score += 20;
        if (JSON.parse(profile.skills || '[]').length > 0) score += 25;
        if (JSON.parse(profile.certifications || '[]').length > 0) score += 20;
        if (profile.bio) score += 15;
        if (profile.github_url) score += 10;
        if (profile.linkedin_url) score += 10;
        return score;
    }

    _getReadinessRecommendations(features) {
        const recs = [];
        if (features.avgAssessmentScore < 60) {
            recs.push('Take more skill assessments and aim for higher scores');
        }
        if (features.totalAssessments < 30) {
            recs.push('Complete assessments in more skill areas');
        }
        if (features.certificationCount < 25) {
            recs.push('Earn industry-recognized certifications');
        }
        if (features.profileCompleteness < 80) {
            recs.push('Complete your profile with education, skills, and links');
        }
        if (features.skillCount < 45) {
            recs.push('Expand your skill set with in-demand technologies');
        }
        if (recs.length === 0) {
            recs.push('Keep up the excellent work! Consider mentoring other students.');
        }
        return recs;
    }
}

module.exports = new AIEngine();
