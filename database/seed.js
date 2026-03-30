const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'prashikshan.db');

async function seed() {
    const SQL = await initSqlJs();

    // Remove existing database for fresh seed
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    const db = new SQL.Database();
    db.run('PRAGMA foreign_keys = ON');

    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.run(schema);

    console.log('✅ Tables created successfully');

    // Helper function
    function run(sql, params = []) {
        db.run(sql, params);
        const result = db.exec('SELECT last_insert_rowid() as id');
        return result.length > 0 ? result[0].values[0][0] : 0;
    }

    // Seed Users
    const salt = bcrypt.genSaltSync(10);

    const users = [
        { name: 'Aarav Sharma', email: 'aarav@student.com', password: bcrypt.hashSync('password123', salt), role: 'student', org: '' },
        { name: 'Priya Patel', email: 'priya@student.com', password: bcrypt.hashSync('password123', salt), role: 'student', org: '' },
        { name: 'Rohan Mehta', email: 'rohan@student.com', password: bcrypt.hashSync('password123', salt), role: 'student', org: '' },
        { name: 'Sneha Kulkarni', email: 'sneha@student.com', password: bcrypt.hashSync('password123', salt), role: 'student', org: '' },
        { name: 'Vikram Singh', email: 'vikram@student.com', password: bcrypt.hashSync('password123', salt), role: 'student', org: '' },
        { name: 'IIT Bombay Admin', email: 'admin@iitb.edu', password: bcrypt.hashSync('password123', salt), role: 'institute', org: 'IIT Bombay' },
        { name: 'NIT Nagpur Admin', email: 'admin@nitnag.edu', password: bcrypt.hashSync('password123', salt), role: 'institute', org: 'NIT Nagpur' },
        { name: 'TCS Recruiter', email: 'hr@tcs.com', password: bcrypt.hashSync('password123', salt), role: 'industry', org: 'Tata Consultancy Services' },
        { name: 'Infosys Recruiter', email: 'hr@infosys.com', password: bcrypt.hashSync('password123', salt), role: 'industry', org: 'Infosys' },
        { name: 'Wipro Recruiter', email: 'hr@wipro.com', password: bcrypt.hashSync('password123', salt), role: 'industry', org: 'Wipro Technologies' },
    ];

    const userIds = {};
    for (const u of users) {
        const id = run('INSERT INTO users (name, email, password, role, organization) VALUES (?, ?, ?, ?, ?)',
            [u.name, u.email, u.password, u.role, u.org]);
        userIds[u.email] = id;
    }
    console.log('✅ Users seeded');

    // Seed Student Profiles
    const profiles = [
        { email: 'aarav@student.com', skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'HTML', 'CSS']), education: 'B.Tech Computer Science - IIT Bombay', certifications: JSON.stringify(['AWS Cloud Practitioner', 'React Developer Certificate']), bio: 'Passionate full-stack developer with interest in cloud computing.' },
        { email: 'priya@student.com', skills: JSON.stringify(['Python', 'Machine Learning', 'TensorFlow', 'SQL']), education: 'B.Tech AI & ML - NIT Nagpur', certifications: JSON.stringify(['Google ML Certificate', 'Python Professional']), bio: 'AI/ML enthusiast focused on building intelligent systems.' },
        { email: 'rohan@student.com', skills: JSON.stringify(['Java', 'Spring Boot', 'MySQL', 'Docker']), education: 'B.Tech IT - COEP Pune', certifications: JSON.stringify(['Oracle Java Certified']), bio: 'Backend developer passionate about microservices architecture.' },
        { email: 'sneha@student.com', skills: JSON.stringify(['Python', 'Data Analysis', 'Tableau', 'SQL', 'Excel']), education: 'B.Tech Data Science - IIT Bombay', certifications: JSON.stringify(['Tableau Desktop Specialist']), bio: 'Data analyst with strong visualization and storytelling skills.' },
        { email: 'vikram@student.com', skills: JSON.stringify(['C++', 'Algorithms', 'System Design']), education: 'B.Tech CSE - NIT Nagpur', certifications: JSON.stringify([]), bio: 'Competitive programmer aiming for software engineering roles.' },
    ];

    for (const p of profiles) {
        run('INSERT INTO student_profiles (user_id, skills, education, certifications, bio) VALUES (?, ?, ?, ?, ?)',
            [userIds[p.email], p.skills, p.education, p.certifications, p.bio]);
    }
    console.log('✅ Student profiles seeded');

    // Seed Courses
    const courses = [
        { title: 'Complete React Developer', description: 'Master React with hooks, context API, Redux, and build real-world projects.', skill_area: 'React', difficulty: 'intermediate', duration: '40 hours', url: 'https://example.com/react', provider: 'Udemy', rating: 4.7 },
        { title: 'Node.js – The Complete Guide', description: 'Build REST APIs, GraphQL APIs, and real-time apps with Node.js and Express.', skill_area: 'Node.js', difficulty: 'intermediate', duration: '36 hours', url: 'https://example.com/nodejs', provider: 'Udemy', rating: 4.8 },
        { title: 'Python for Data Science & ML', description: 'Learn NumPy, Pandas, Matplotlib, Scikit-Learn, and TensorFlow for data science.', skill_area: 'Python', difficulty: 'beginner', duration: '44 hours', url: 'https://example.com/python-ds', provider: 'Coursera', rating: 4.6 },
        { title: 'Machine Learning A-Z', description: 'Hands-on machine learning with Python and R including regression, classification, clustering.', skill_area: 'Machine Learning', difficulty: 'intermediate', duration: '44 hours', url: 'https://example.com/ml-az', provider: 'Udemy', rating: 4.5 },
        { title: 'Advanced JavaScript Concepts', description: 'Deep dive into closures, prototypes, async patterns, and JS engine internals.', skill_area: 'JavaScript', difficulty: 'advanced', duration: '25 hours', url: 'https://example.com/adv-js', provider: 'Udemy', rating: 4.7 },
        { title: 'SQL Bootcamp', description: 'Complete SQL and PostgreSQL from beginner to expert with real exercises.', skill_area: 'SQL', difficulty: 'beginner', duration: '22 hours', url: 'https://example.com/sql', provider: 'Udemy', rating: 4.6 },
        { title: 'Docker & Kubernetes Complete Guide', description: 'Master Docker containers and Kubernetes orchestration for production deployments.', skill_area: 'Docker', difficulty: 'intermediate', duration: '30 hours', url: 'https://example.com/docker', provider: 'Coursera', rating: 4.5 },
        { title: 'AWS Solutions Architect', description: 'Prepare for AWS Solutions Architect certification with hands-on labs.', skill_area: 'AWS', difficulty: 'advanced', duration: '50 hours', url: 'https://example.com/aws', provider: 'A Cloud Guru', rating: 4.8 },
        { title: 'Java Spring Boot Masterclass', description: 'Build microservices with Spring Boot, Spring Security, and Spring Data JPA.', skill_area: 'Java', difficulty: 'intermediate', duration: '35 hours', url: 'https://example.com/spring', provider: 'Udemy', rating: 4.6 },
        { title: 'Data Structures & Algorithms', description: 'Master DSA with 200+ coding problems in multiple languages.', skill_area: 'Algorithms', difficulty: 'intermediate', duration: '40 hours', url: 'https://example.com/dsa', provider: 'Coursera', rating: 4.7 },
        { title: 'TensorFlow Developer Certificate', description: 'Build deep learning models with TensorFlow and prepare for certification.', skill_area: 'TensorFlow', difficulty: 'advanced', duration: '38 hours', url: 'https://example.com/tf', provider: 'Coursera', rating: 4.5 },
        { title: 'System Design Interview Prep', description: 'Learn system design concepts for technical interviews at top companies.', skill_area: 'System Design', difficulty: 'advanced', duration: '20 hours', url: 'https://example.com/sysdesign', provider: 'Educative', rating: 4.8 },
        { title: 'HTML & CSS Mastery', description: 'Complete web design course from basics to advanced responsive layouts.', skill_area: 'HTML', difficulty: 'beginner', duration: '28 hours', url: 'https://example.com/htmlcss', provider: 'Udemy', rating: 4.4 },
        { title: 'Tableau for Data Visualization', description: 'Create stunning dashboards and visualizations with Tableau.', skill_area: 'Tableau', difficulty: 'beginner', duration: '18 hours', url: 'https://example.com/tableau', provider: 'Coursera', rating: 4.5 },
        { title: 'C++ Programming Masterclass', description: 'Master C++ from basics to advanced topics including STL and templates.', skill_area: 'C++', difficulty: 'intermediate', duration: '34 hours', url: 'https://example.com/cpp', provider: 'Udemy', rating: 4.6 },
    ];

    for (const c of courses) {
        run('INSERT INTO courses (title, description, skill_area, difficulty, duration, url, provider, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [c.title, c.description, c.skill_area, c.difficulty, c.duration, c.url, c.provider, c.rating]);
    }
    console.log('✅ Courses seeded');

    // Seed Assessments
    const assessments = [
        { email: 'aarav@student.com', title: 'JavaScript Fundamentals', category: 'JavaScript', score: 85, max_score: 100, skills: JSON.stringify(['JavaScript', 'ES6', 'DOM']) },
        { email: 'aarav@student.com', title: 'React Assessment', category: 'React', score: 72, max_score: 100, skills: JSON.stringify(['React', 'Hooks', 'State Management']) },
        { email: 'priya@student.com', title: 'Python Basics', category: 'Python', score: 92, max_score: 100, skills: JSON.stringify(['Python', 'OOP', 'Data Structures']) },
        { email: 'priya@student.com', title: 'ML Fundamentals', category: 'Machine Learning', score: 78, max_score: 100, skills: JSON.stringify(['Machine Learning', 'Supervised Learning', 'Model Evaluation']) },
        { email: 'rohan@student.com', title: 'Java Core', category: 'Java', score: 88, max_score: 100, skills: JSON.stringify(['Java', 'OOP', 'Collections']) },
        { email: 'sneha@student.com', title: 'SQL Assessment', category: 'SQL', score: 90, max_score: 100, skills: JSON.stringify(['SQL', 'Joins', 'Aggregation']) },
    ];

    for (const a of assessments) {
        run('INSERT INTO assessments (student_id, title, category, score, max_score, skills_tested) VALUES (?, ?, ?, ?, ?, ?)',
            [userIds[a.email], a.title, a.category, a.score, a.max_score, a.skills]);
    }
    console.log('✅ Assessments seeded');

    // Seed Skill Gaps
    const skillGaps = [
        { email: 'aarav@student.com', skill: 'TypeScript', current: 20, required: 80, gap: 60, priority: 'high' },
        { email: 'aarav@student.com', skill: 'System Design', current: 30, required: 85, gap: 55, priority: 'high' },
        { email: 'aarav@student.com', skill: 'Testing', current: 40, required: 75, gap: 35, priority: 'medium' },
        { email: 'priya@student.com', skill: 'Deep Learning', current: 45, required: 90, gap: 45, priority: 'high' },
        { email: 'priya@student.com', skill: 'MLOps', current: 15, required: 70, gap: 55, priority: 'high' },
        { email: 'rohan@student.com', skill: 'Kubernetes', current: 20, required: 75, gap: 55, priority: 'high' },
        { email: 'rohan@student.com', skill: 'System Design', current: 35, required: 85, gap: 50, priority: 'high' },
        { email: 'sneha@student.com', skill: 'Machine Learning', current: 25, required: 80, gap: 55, priority: 'high' },
        { email: 'vikram@student.com', skill: 'Web Development', current: 15, required: 70, gap: 55, priority: 'high' },
        { email: 'vikram@student.com', skill: 'Database', current: 30, required: 75, gap: 45, priority: 'medium' },
    ];

    for (const sg of skillGaps) {
        run('INSERT INTO skill_gaps (student_id, skill_name, current_level, required_level, gap_score, priority) VALUES (?, ?, ?, ?, ?, ?)',
            [userIds[sg.email], sg.skill, sg.current, sg.required, sg.gap, sg.priority]);
    }
    console.log('✅ Skill gaps seeded');

    // Seed Job Postings
    const jobs = [
        { email: 'hr@tcs.com', title: 'Full Stack Developer', description: 'Join our digital innovation team to build scalable web applications using modern JavaScript frameworks.', requirements: 'B.Tech in CS/IT, 0-2 years experience', skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'SQL']), location: 'Mumbai, India', type: 'full-time', salary: '₹6-10 LPA', status: 'active' },
        { email: 'hr@tcs.com', title: 'Data Analyst Intern', description: 'Work with our analytics team on real-world business intelligence projects.', requirements: 'Currently pursuing B.Tech, strong analytical skills', skills: JSON.stringify(['Python', 'SQL', 'Data Analysis', 'Tableau']), location: 'Pune, India', type: 'internship', salary: '₹25,000/month', status: 'active' },
        { email: 'hr@infosys.com', title: 'Software Engineer', description: 'Build enterprise applications in our Infosys Digital team.', requirements: 'B.Tech in CS/IT/ECE, strong coding skills', skills: JSON.stringify(['Java', 'Spring Boot', 'MySQL', 'REST APIs']), location: 'Bengaluru, India', type: 'full-time', salary: '₹5.5-9 LPA', status: 'active' },
        { email: 'hr@infosys.com', title: 'ML Engineer Intern', description: 'Research and develop machine learning models for NLP and computer vision applications.', requirements: 'B.Tech/M.Tech in CS/AI, ML project experience', skills: JSON.stringify(['Python', 'Machine Learning', 'TensorFlow', 'Deep Learning']), location: 'Hyderabad, India', type: 'internship', salary: '₹30,000/month', status: 'active' },
        { email: 'hr@wipro.com', title: 'Backend Developer', description: 'Design and develop RESTful microservices for our cloud platform.', requirements: 'B.Tech, knowledge of cloud services', skills: JSON.stringify(['Java', 'Docker', 'Kubernetes', 'AWS']), location: 'Chennai, India', type: 'full-time', salary: '₹7-12 LPA', status: 'active' },
        { email: 'hr@wipro.com', title: 'Frontend Developer', description: 'Create beautiful, responsive web interfaces for enterprise applications.', requirements: 'B.Tech, portfolio of web projects', skills: JSON.stringify(['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript']), location: 'Bengaluru, India', type: 'full-time', salary: '₹6-10 LPA', status: 'active' },
    ];

    for (const j of jobs) {
        run('INSERT INTO job_postings (company_id, title, description, requirements, skills_required, location, job_type, salary_range, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userIds[j.email], j.title, j.description, j.requirements, j.skills, j.location, j.type, j.salary, j.status]);
    }
    console.log('✅ Job postings seeded');

    // Seed Interview Drives
    const drives = [
        { email: 'admin@iitb.edu', company: 'TCS', title: 'TCS Campus Recruitment 2026', description: 'Annual campus recruitment drive for B.Tech final year students.', date: '2026-04-15', location: 'IIT Bombay Campus', eligibility: 'CGPA >= 7.0, No active backlogs', status: 'upcoming' },
        { email: 'admin@iitb.edu', company: 'Infosys', title: 'Infosys InfyTQ Hiring', description: 'Special recruitment through InfyTQ certification program.', date: '2026-04-20', location: 'IIT Bombay Campus', eligibility: 'InfyTQ Certified, CGPA >= 6.5', status: 'upcoming' },
        { email: 'admin@nitnag.edu', company: 'Wipro', title: 'Wipro Elite NTH', description: 'Wipro National Talent Hunt for engineering graduates.', date: '2026-05-05', location: 'NIT Nagpur Campus', eligibility: 'All branches, CGPA >= 6.0', status: 'upcoming' },
    ];

    for (const d of drives) {
        run('INSERT INTO interview_drives (institute_id, company_name, title, description, drive_date, location, eligibility_criteria, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userIds[d.email], d.company, d.title, d.description, d.date, d.location, d.eligibility, d.status]);
    }
    console.log('✅ Interview drives seeded');

    // Seed Applications
    run('INSERT INTO applications (student_id, job_id, status, cover_letter) VALUES (?, ?, ?, ?)',
        [userIds['aarav@student.com'], 1, 'shortlisted', 'I am a passionate full-stack developer with experience in React and Node.js.']);
    run('INSERT INTO applications (student_id, job_id, status, cover_letter) VALUES (?, ?, ?, ?)',
        [userIds['priya@student.com'], 2, 'applied', 'I have strong data analysis skills with proficiency in Python and SQL.']);
    run('INSERT INTO applications (student_id, job_id, status, cover_letter) VALUES (?, ?, ?, ?)',
        [userIds['rohan@student.com'], 3, 'interview', 'Java developer with hands-on experience in Spring Boot and microservices.']);
    run('INSERT INTO applications (student_id, job_id, status, cover_letter) VALUES (?, ?, ?, ?)',
        [userIds['priya@student.com'], 4, 'applied', 'ML enthusiast with TensorFlow project experience.']);
    console.log('✅ Applications seeded');

    // Update readiness scores
    db.run('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?', [78, userIds['aarav@student.com']]);
    db.run('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?', [72, userIds['priya@student.com']]);
    db.run('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?', [68, userIds['rohan@student.com']]);
    db.run('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?', [65, userIds['sneha@student.com']]);
    db.run('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?', [45, userIds['vikram@student.com']]);
    console.log('✅ Readiness scores updated');

    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Students: aarav@student.com / password123');
    console.log('Institute: admin@iitb.edu / password123');
    console.log('Industry: hr@tcs.com / password123');

    db.close();
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
