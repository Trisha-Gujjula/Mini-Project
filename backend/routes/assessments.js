const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Assessment questions bank
const questionBank = {
    'JavaScript': [
        { id: 1, question: 'What is the output of typeof null in JavaScript?', options: ['null', 'undefined', 'object', 'string'], correct: 2 },
        { id: 2, question: 'Which method is used to add elements to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correct: 0 },
        { id: 3, question: 'What does "===" operator check?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correct: 2 },
        { id: 4, question: 'What is a closure in JavaScript?', options: ['A function with no parameters', 'A function that has access to outer scope variables', 'A loop construct', 'An error handler'], correct: 1 },
        { id: 5, question: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'function', 'global'], correct: 1 },
        { id: 6, question: 'What does Promise.all() do?', options: ['Resolves with the first promise', 'Rejects all promises', 'Resolves when all promises resolve', 'Runs promises sequentially'], correct: 2 },
        { id: 7, question: 'What is event delegation?', options: ['Adding events to every child', 'Handling events at a parent level', 'Removing all events', 'Async event handling'], correct: 1 },
        { id: 8, question: 'What is the purpose of async/await?', options: ['To handle CSS animations', 'To write asynchronous code in a synchronous style', 'To create web workers', 'To handle DOM events'], correct: 1 },
        { id: 9, question: 'What does Array.prototype.map() return?', options: ['undefined', 'A boolean', 'A new array', 'The original array'], correct: 2 },
        { id: 10, question: 'What is hoisting?', options: ['Moving elements in DOM', 'Moving declarations to scope top', 'CSS positioning', 'Server elevation'], correct: 1 },
    ],
    'Python': [
        { id: 1, question: 'Which of these is immutable in Python?', options: ['List', 'Dictionary', 'Tuple', 'Set'], correct: 2 },
        { id: 2, question: 'What does len() function do?', options: ['Returns type', 'Returns length', 'Returns max value', 'Returns ID'], correct: 1 },
        { id: 3, question: 'What is a list comprehension?', options: ['A list method', 'Compact way to create lists', 'A sorting algorithm', 'A type of loop'], correct: 1 },
        { id: 4, question: 'What keyword is used for inheritance?', options: ['extends', 'inherits', 'class with parentheses', 'super'], correct: 2 },
        { id: 5, question: 'What is a decorator in Python?', options: ['A CSS concept', 'A function that modifies another function', 'A type of variable', 'A loop structure'], correct: 1 },
        { id: 6, question: 'What does pip install do?', options: ['Compiles Python', 'Installs packages', 'Creates virtual env', 'Runs tests'], correct: 1 },
        { id: 7, question: 'What is the difference between "is" and "=="?', options: ['No difference', '"is" checks identity, "==" checks equality', '"is" is faster', '"==" checks identity'], correct: 1 },
        { id: 8, question: 'What is a generator in Python?', options: ['A class constructor', 'A function that yields values lazily', 'A module importer', 'A file handler'], correct: 1 },
        { id: 9, question: 'What does __init__ method do?', options: ['Destroys object', 'Initializes object', 'Imports modules', 'Defines static method'], correct: 1 },
        { id: 10, question: 'Which library is used for data manipulation?', options: ['NumPy', 'Pandas', 'Flask', 'Django'], correct: 1 },
    ],
    'Java': [
        { id: 1, question: 'What is the entry point of a Java program?', options: ['start()', 'run()', 'main()', 'init()'], correct: 2 },
        { id: 2, question: 'Which keyword prevents inheritance?', options: ['static', 'abstract', 'final', 'private'], correct: 2 },
        { id: 3, question: 'What is JVM?', options: ['Java Visual Machine', 'Java Virtual Machine', 'Java Variable Manager', 'Java Version Manager'], correct: 1 },
        { id: 4, question: 'What is polymorphism?', options: ['Single form', 'Many forms of same method', 'Data hiding', 'Code reuse'], correct: 1 },
        { id: 5, question: 'What does "implements" keyword do?', options: ['Extends a class', 'Implements an interface', 'Creates an object', 'Imports a package'], correct: 1 },
        { id: 6, question: 'What is an ArrayList?', options: ['Fixed size array', 'Dynamic array', 'Linked list', 'Tree structure'], correct: 1 },
        { id: 7, question: 'What is the purpose of try-catch?', options: ['Looping', 'Exception handling', 'Variable declaration', 'Method overloading'], correct: 1 },
        { id: 8, question: 'What is Spring Boot?', options: ['A database', 'A Java framework for microservices', 'A testing tool', 'An IDE'], correct: 1 },
        { id: 9, question: 'What does garbage collection do?', options: ['Deletes files', 'Frees unused memory', 'Compiles code', 'Optimizes algorithms'], correct: 1 },
        { id: 10, question: 'What is an interface in Java?', options: ['A class with all methods', 'A contract with abstract methods', 'A type of variable', 'A package'], correct: 1 },
    ],
    'SQL': [
        { id: 1, question: 'What does SELECT DISTINCT do?', options: ['Selects all rows', 'Selects unique values', 'Selects first row', 'Selects last row'], correct: 1 },
        { id: 2, question: 'Which JOIN returns all rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correct: 3 },
        { id: 3, question: 'What does GROUP BY do?', options: ['Sorts data', 'Groups rows with same values', 'Filters data', 'Joins tables'], correct: 1 },
        { id: 4, question: 'What is a primary key?', options: ['Any column', 'Unique identifier for rows', 'A foreign key', 'An index'], correct: 1 },
        { id: 5, question: 'What does WHERE clause do?', options: ['Sorts results', 'Filters rows', 'Groups data', 'Joins tables'], correct: 1 },
        { id: 6, question: 'What is normalization?', options: ['Adding duplicates', 'Organizing data to reduce redundancy', 'Deleting data', 'Creating indexes'], correct: 1 },
        { id: 7, question: 'What does COUNT() function return?', options: ['Sum of values', 'Number of rows', 'Average value', 'Maximum value'], correct: 1 },
        { id: 8, question: 'What is a foreign key?', options: ['Primary key copy', 'Reference to another table primary key', 'Unique column', 'Auto-increment column'], correct: 1 },
        { id: 9, question: 'What does ORDER BY do?', options: ['Filters data', 'Groups data', 'Sorts results', 'Limits results'], correct: 2 },
        { id: 10, question: 'What is an index in SQL?', options: ['A table type', 'Data structure for faster queries', 'A column type', 'A constraint'], correct: 1 },
    ],
    'Data Science': [
        { id: 1, question: 'What is the purpose of EDA?', options: ['Building models', 'Understanding data patterns', 'Deploying apps', 'Writing reports'], correct: 1 },
        { id: 2, question: 'What does a histogram show?', options: ['Trend over time', 'Distribution of data', 'Correlation', 'Categories'], correct: 1 },
        { id: 3, question: 'What is overfitting?', options: ['Model too simple', 'Model memorizes training data', 'Model cannot learn', 'Model is fast'], correct: 1 },
        { id: 4, question: 'What is cross-validation?', options: ['Single train-test split', 'Multiple train-test splits', 'No validation', 'Manual testing'], correct: 1 },
        { id: 5, question: 'What does correlation measure?', options: ['Causation', 'Linear relationship between variables', 'Data accuracy', 'Model performance'], correct: 1 },
        { id: 6, question: 'What library is used for plotting in Python?', options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'], correct: 2 },
        { id: 7, question: 'What is feature engineering?', options: ['Removing features', 'Creating new features from existing data', 'Feature selection', 'Data cleaning'], correct: 1 },
        { id: 8, question: 'What is a confusion matrix?', options: ['A complex algorithm', 'Table showing prediction results', 'A data structure', 'A neural network'], correct: 1 },
        { id: 9, question: 'What does RMSE stand for?', options: ['Root Mean Square Error', 'Random Model Selection Error', 'Recursive Mean Standard Error', 'Real-time Model Scoring Engine'], correct: 0 },
        { id: 10, question: 'What is dimensionality reduction?', options: ['Adding features', 'Reducing number of features', 'Increasing data size', 'Sorting data'], correct: 1 },
    ],
    'Machine Learning': [
        { id: 1, question: 'What is supervised learning?', options: ['No labels needed', 'Learning with labeled data', 'Learning by reward', 'Unsupervised clustering'], correct: 1 },
        { id: 2, question: 'What is a decision tree?', options: ['A neural network', 'Tree-based classification/regression model', 'A clustering algorithm', 'A data structure'], correct: 1 },
        { id: 3, question: 'What does Random Forest do?', options: ['Single tree', 'Ensemble of decision trees', 'Neural network', 'Linear regression'], correct: 1 },
        { id: 4, question: 'What is gradient descent?', options: ['A sorting algorithm', 'Optimization algorithm to minimize loss', 'A data structure', 'A sampling technique'], correct: 1 },
        { id: 5, question: 'What is regularization?', options: ['Making model complex', 'Preventing overfitting', 'Increasing learning rate', 'Data augmentation'], correct: 1 },
        { id: 6, question: 'What is K-means?', options: ['Classification', 'Clustering algorithm', 'Regression', 'Dimensionality reduction'], correct: 1 },
        { id: 7, question: 'What is the bias-variance tradeoff?', options: ['Speed vs accuracy', 'Underfitting vs overfitting balance', 'Training vs testing', 'CPU vs memory'], correct: 1 },
        { id: 8, question: 'What metric is used for classification?', options: ['RMSE', 'R-squared', 'Accuracy/F1-score', 'MSE'], correct: 2 },
        { id: 9, question: 'What is a neural network?', options: ['A database', 'A model inspired by brain neurons', 'A web framework', 'A search algorithm'], correct: 1 },
        { id: 10, question: 'What is transfer learning?', options: ['Moving data between databases', 'Using pre-trained model for new tasks', 'Data transformation', 'Feature engineering'], correct: 1 },
    ],
};

// GET /api/assessments/categories
router.get('/categories', authenticateToken, (req, res) => {
    const categories = Object.keys(questionBank);
    res.json({ categories });
});

// GET /api/assessments/questions?category=JavaScript
router.get('/questions', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { category } = req.query;

        if (!category || !questionBank[category]) {
            return res.status(400).json({ error: 'Valid category is required.', categories: Object.keys(questionBank) });
        }

        // Return questions without correct answers
        const questions = questionBank[category].map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
        }));

        res.json({ category, questions, totalQuestions: questions.length });
    } catch (err) {
        console.error('Get questions error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/assessments/submit
router.post('/submit', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { category, answers } = req.body;

        if (!category || !answers || !questionBank[category]) {
            return res.status(400).json({ error: 'Category and answers are required.' });
        }

        const questions = questionBank[category];
        let score = 0;
        const results = [];

        for (const q of questions) {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct;
            if (isCorrect) score += 10;
            results.push({
                questionId: q.id,
                question: q.question,
                userAnswer,
                correctAnswer: q.correct,
                isCorrect,
            });
        }

        const maxScore = questions.length * 10;
        const skillsTested = JSON.stringify([category]);

        // Save assessment
        const result = db.prepare(
            'INSERT INTO assessments (student_id, title, category, score, max_score, skills_tested, answers) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, `${category} Assessment`, category, score, maxScore, skillsTested, JSON.stringify(results));

        // Update skill gaps based on assessment
        updateSkillGaps(req.user.id, category, score, maxScore);

        // Update readiness score
        updateReadinessScore(req.user.id);

        res.json({
            message: 'Assessment submitted successfully.',
            assessmentId: result.lastInsertRowid,
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
            results,
        });
    } catch (err) {
        console.error('Submit assessment error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/assessments/history
router.get('/history', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const assessments = db.prepare(
            'SELECT id, title, category, score, max_score, created_at FROM assessments WHERE student_id = ? ORDER BY created_at DESC'
        ).all(req.user.id);
        res.json({ assessments });
    } catch (err) {
        console.error('Get history error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Helper: Update skill gaps after assessment
function updateSkillGaps(studentId, skillName, score, maxScore) {
    const currentLevel = Math.round((score / maxScore) * 100);
    const requiredLevel = 80;
    const gapScore = Math.max(0, requiredLevel - currentLevel);
    const priority = gapScore > 40 ? 'high' : gapScore > 20 ? 'medium' : 'low';

    const existing = db.prepare('SELECT id FROM skill_gaps WHERE student_id = ? AND skill_name = ?').get(studentId, skillName);
    
    if (existing) {
        db.prepare('UPDATE skill_gaps SET current_level = ?, gap_score = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(currentLevel, gapScore, priority, existing.id);
    } else {
        db.prepare('INSERT INTO skill_gaps (student_id, skill_name, current_level, required_level, gap_score, priority) VALUES (?, ?, ?, ?, ?, ?)')
            .run(studentId, skillName, currentLevel, requiredLevel, gapScore, priority);
    }
}

// Helper: Update readiness score
function updateReadinessScore(studentId) {
    const assessments = db.prepare('SELECT score, max_score FROM assessments WHERE student_id = ?').all(studentId);
    
    if (assessments.length === 0) return;

    const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
    const totalMax = assessments.reduce((sum, a) => sum + a.max_score, 0);
    const readiness = Math.round((totalScore / totalMax) * 100);

    db.prepare('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?').run(readiness, studentId);
}

module.exports = router;
