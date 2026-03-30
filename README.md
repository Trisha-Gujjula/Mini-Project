# Prashikshan – AI-Driven Academia-Industry Interface Platform

## 📌 Overview
Prashikshan is a full-stack web platform designed to bridge the gap between students, educational institutes, and industry partners. The system uses AI-based skill gap analysis and personalized learning recommendations to help students become job-ready and streamline internship and placement processes.

## 🚀 Key Features

### 👨‍🎓 Student Module
- Profile creation (skills, certifications, education)
- Skill assessment tests
- AI-based skill gap analysis
- Personalized learning roadmap
- Course recommendations
- Progress tracking
- Internship & placement opportunities

### 🏫 Institute Module
- Monitor student progress
- Identify job-ready candidates
- Manage interview drives
- View placement statistics

### 🏢 Industry Module
- Post job roles and requirements
- View eligible candidates
- Conduct interviews
- Select students for internships/placements

## 🧠 AI Functionalities
- Skill Gap Analysis using Machine Learning
- Personalized Recommendation System
- Job Readiness Prediction

## 🛠️ Tech Stack

Frontend: HTML5, CSS3, Bootstrap 5, JavaScript  
Backend: Node.js, Express.js  
Database: SQLite (sql.js)

## 📂 Project Structure
```
Prashikshan/
├── backend/
│   ├── server.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── assessments.js
│   │   ├── institute.js
│   │   ├── industry.js
│   │   └── ai.js
│   └── services/
│       └── aiEngine.js
├── database/
│   ├── db.js
│   ├── schema.sql
│   └── seed.js
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   ├── student/
│   │   └── dashboard.html
│   ├── institute/
│   │   └── dashboard.html
│   └── industry/
│       └── dashboard.html
├── .env
├── package.json
└── README.md
```

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Seed the database
npm run seed

# Start the server
npm start
```

Then open http://localhost:3000 in your browser.

## 📋 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | aarav@student.com | password123 |
| Institute | admin@iitb.edu | password123 |
| Industry | hr@tcs.com | password123 |

## 🔄 System Workflow
1. Student registers and logs in  
2. Student submits skills  
3. System conducts assessment  
4. AI analyzes skill gap  
5. Learning roadmap generated  
6. Student improves skills  
7. Institute reviews  
8. Industry interviews  
9. Placement achieved  

## 📊 Algorithms Used
- Random Forest (Skill Gap Analysis with weighted feature importance)
- Neural Networks (Multi-layer job readiness prediction)
- Recommendation System (Content-based course filtering)

## 🔐 Security Features
- JWT-based authentication
- bcrypt password encryption
- Role-based access control (student, institute, industry)
- Secure API endpoints

## 🤝 Contributors
- Tanishka Devgirkar  
- Trisha Gujjula  
- Veenit Ramteke  
