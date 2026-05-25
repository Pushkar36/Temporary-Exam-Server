/* ============================================================
   server.js — ExamCloud Backend with SQLite (sql.js)
   Express + sql.js (pure JS SQLite — no native build needed)
   ============================================================ */

'use strict';

const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── DATABASE SETUP ──────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'examcloud.db');
let db = null;

// Save database to disk periodically
function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000);

// ─── HELPER: Generate 6-digit access code ────────────────────
function generateAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── HELPER: Generate submission ID ──────────────────────────
function generateSubmissionId() {
  return `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

// ─── HELPER: Run query and return all results ────────────────
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// ─── HELPER: Run query and return first result ───────────────
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// ─── HELPER: Run an INSERT/UPDATE/DELETE ─────────────────────
function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

// ─── INIT DATABASE ───────────────────────────────────────────
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Loaded existing database from data/examcloud.db');
  } else {
    db = new SQL.Database();
    console.log('🆕 Created new database');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      password TEXT DEFAULT '123456',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gracefully alter tables to support student passwords
  try {
    db.run("ALTER TABLE students ADD COLUMN password TEXT DEFAULT '123456'");
  } catch (err) {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_name TEXT NOT NULL,
      language TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      max_students INTEGER DEFAULT 50,
      access_code TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gracefully alter tables to support custom instructions and starter code
  try {
    db.run("ALTER TABLE exams ADD COLUMN instructions TEXT");
  } catch (err) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE exams ADD COLUMN starter_code TEXT");
  } catch (err) {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      port INTEGER UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      exam_id INTEGER NOT NULL,
      code TEXT,
      output TEXT,
      exit_code INTEGER DEFAULT 0,
      test_cases_passed INTEGER DEFAULT 0,
      test_cases_total INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id)
    )
  `);

  saveDb();
  console.log('✅ Database tables ready');
}

// ══════════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════════

// ─── STUDENTS ────────────────────────────────────────────────

// GET /api/students — List all students
app.get('/api/students', (req, res) => {
  try {
    const students = queryAll('SELECT * FROM students ORDER BY created_at DESC');
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students — Create a student
app.post('/api/students', (req, res) => {
  try {
    const { student_id, name, email, password } = req.body;

    if (!student_id || !name) {
      return res.status(400).json({ success: false, error: 'student_id and name are required' });
    }

    // Check if student_id already exists
    const existing = queryOne('SELECT id FROM students WHERE student_id = ?', [student_id]);
    if (existing) {
      return res.status(409).json({ success: false, error: `Student ID "${student_id}" already exists` });
    }

    runSql('INSERT INTO students (student_id, name, email, password) VALUES (?, ?, ?, ?)', [student_id, name, email || null, password || '123456']);

    const inserted = queryOne('SELECT * FROM students WHERE student_id = ?', [student_id]);
    res.json({ success: true, data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id — Delete a student
app.delete('/api/students/:id', (req, res) => {
  try {
    const student = queryOne('SELECT id FROM students WHERE id = ?', [Number(req.params.id)]);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    runSql('DELETE FROM students WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── EXAMS ───────────────────────────────────────────────────

// GET /api/exams — List all exams
app.get('/api/exams', (req, res) => {
  try {
    const exams = queryAll('SELECT * FROM exams ORDER BY created_at DESC');
    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exams — Create an exam
app.post('/api/exams', (req, res) => {
  try {
    const { exam_name, language, duration_minutes, max_students, difficulty, instructions, starter_code } = req.body;

    if (!exam_name || !language || !duration_minutes) {
      return res.status(400).json({
        success: false,
        error: 'exam_name, language, and duration_minutes are required'
      });
    }

    const access_code = generateAccessCode();

    runSql(
      'INSERT INTO exams (exam_name, language, duration_minutes, max_students, access_code, difficulty, instructions, starter_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [exam_name, language, Number(duration_minutes), max_students || 50, access_code, difficulty || 'medium', instructions || '', starter_code || '']
    );

    const inserted = queryOne('SELECT * FROM exams ORDER BY id DESC LIMIT 1');

    res.json({ success: true, data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exams/:id — Get a single exam
app.get('/api/exams/:id', (req, res) => {
  try {
    const exam = queryOne('SELECT * FROM exams WHERE id = ?', [Number(req.params.id)]);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }
    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/exams/:id/status — Update exam status
app.patch('/api/exams/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    runSql('UPDATE exams SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── STUDENT LOGIN ───────────────────────────────────────────

// POST /api/login/student — Validate student credentials
app.post('/api/login/student', (req, res) => {
  try {
    const { studentId, examCode, password } = req.body;

    if (!studentId || !examCode || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if student exists
    const student = queryOne('SELECT * FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(401).json({ success: false, error: 'Invalid Student ID. Please contact your instructor.' });
    }

    // Verify student password
    if (student.password && student.password !== password) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    // Check if exam access code is valid
    const exam = queryOne("SELECT * FROM exams WHERE access_code = ? AND status = 'active'", [examCode]);
    if (!exam) {
      return res.status(401).json({ success: false, error: 'Invalid exam access code or exam is not active.' });
    }

    // Check if student already submitted for this exam
    const existing = queryOne('SELECT id FROM submissions WHERE student_id = ? AND exam_id = ?', [studentId, exam.id]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'You have already submitted for this exam.' });
    }

    // Assign / retrieve virtual container dynamically
    let container = queryOne('SELECT * FROM containers WHERE student_id = ?', [studentId]);
    if (!container) {
      const maxPortRow = queryOne('SELECT MAX(port) as max_port FROM containers');
      const nextPort = maxPortRow && maxPortRow.max_port ? maxPortRow.max_port + 1 : 8001;
      const containerId = `ctn-${String(nextPort - 8000).padStart(3, '0')}`;

      runSql(
        'INSERT INTO containers (container_id, student_id, port, status) VALUES (?, ?, ?, ?)',
        [containerId, studentId, nextPort, 'active']
      );
      container = queryOne('SELECT * FROM containers WHERE student_id = ?', [studentId]);
    }

    res.json({
      success: true,
      data: {
        student: { student_id: student.student_id, name: student.name },
        exam: {
          id: exam.id,
          exam_name: exam.exam_name,
          language: exam.language,
          duration_minutes: exam.duration_minutes,
          instructions: exam.instructions,
          starter_code: exam.starter_code
        },
        container: {
          container_id: container.container_id,
          port: container.port,
          status: container.status
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── CONTAINERS ──────────────────────────────────────────────

// GET /api/containers — List all active containers joined with student info
app.get('/api/containers', (req, res) => {
  try {
    const containers = queryAll(`
      SELECT c.*, s.name as student_name
      FROM containers c
      LEFT JOIN students s ON c.student_id = s.student_id
    `);
    res.json({ success: true, data: containers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/containers — Spawn a new container (admin manual override)
app.post('/api/containers', (req, res) => {
  try {
    const { student_id, name, port } = req.body;
    if (!student_id || !name || !port) {
      return res.status(400).json({ success: false, error: 'student_id, name, and port are required' });
    }

    // Register student if not already present
    let student = queryOne('SELECT id FROM students WHERE student_id = ?', [student_id]);
    if (!student) {
      runSql('INSERT INTO students (student_id, name, email) VALUES (?, ?, ?)', [student_id, name, `${student_id.toLowerCase()}@college.edu`]);
    }

    const nextPort = Number(port);
    const containerId = `ctn-${String(nextPort - 8000).padStart(3, '0')}`;

    // Check if container already exists
    const existing = queryOne('SELECT id FROM containers WHERE container_id = ? OR port = ?', [containerId, nextPort]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Container port or ID already allocated' });
    }

    runSql('INSERT INTO containers (container_id, student_id, port, status) VALUES (?, ?, ?, ?)', [containerId, student_id, nextPort, 'active']);

    res.json({ success: true, data: { container_id: containerId, student_id, port: nextPort, status: 'active' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/containers/:containerId — Terminate a container
app.delete('/api/containers/:containerId', (req, res) => {
  try {
    const containerId = req.params.containerId;
    const existing = queryOne('SELECT id FROM containers WHERE container_id = ?', [containerId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Container not found' });
    }

    runSql('DELETE FROM containers WHERE container_id = ?', [containerId]);
    res.json({ success: true, message: `Container ${containerId} terminated` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/containers — Terminate all containers (Kill All)
app.delete('/api/containers', (req, res) => {
  try {
    runSql('DELETE FROM containers');
    res.json({ success: true, message: 'All containers terminated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SUBMISSIONS ─────────────────────────────────────────────

// POST /api/submissions — Save a submission
app.post('/api/submissions', (req, res) => {
  try {
    const { student_id, exam_id, code, output, exit_code, test_cases_passed, test_cases_total, score } = req.body;

    if (!student_id || !exam_id) {
      return res.status(400).json({ success: false, error: 'student_id and exam_id are required' });
    }

    const submission_id = generateSubmissionId();

    runSql(
      'INSERT INTO submissions (student_id, exam_id, code, output, exit_code, test_cases_passed, test_cases_total, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, Number(exam_id), code || '', output || '', exit_code || 0, test_cases_passed || 0, test_cases_total || 0, score || 0]
    );

    res.json({
      success: true,
      data: {
        submission_id,
        student_id,
        exam_id
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/submissions — List all submissions (with optional filters)
app.get('/api/submissions', (req, res) => {
  try {
    const { exam_id, student_id } = req.query;
    let query = `
      SELECT s.*, e.exam_name, e.language
      FROM submissions s
      LEFT JOIN exams e ON s.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (exam_id) {
      query += ' AND s.exam_id = ?';
      params.push(Number(exam_id));
    }
    if (student_id) {
      query += ' AND s.student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY s.submitted_at DESC';

    const submissions = queryAll(query, params);
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/results/:examId — Get results for a specific exam
app.get('/api/results/:examId', (req, res) => {
  try {
    const exam = queryOne('SELECT * FROM exams WHERE id = ?', [Number(req.params.examId)]);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    const submissions = queryAll(`
      SELECT s.*, st.name as student_name, st.email as student_email
      FROM submissions s
      LEFT JOIN students st ON s.student_id = st.student_id
      WHERE s.exam_id = ?
      ORDER BY s.score DESC, s.submitted_at ASC
    `, [Number(req.params.examId)]);

    res.json({
      success: true,
      data: { exam, submissions }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DASHBOARD STATS ─────────────────────────────────────────

// GET /api/stats — Get aggregate stats for the dashboard
app.get('/api/stats', (req, res) => {
  try {
    const totalStudents = queryOne('SELECT COUNT(*) as count FROM students').count;
    const totalExams = queryOne('SELECT COUNT(*) as count FROM exams').count;
    const activeExams = queryOne("SELECT COUNT(*) as count FROM exams WHERE status = 'active'").count;
    const totalSubmissions = queryOne('SELECT COUNT(*) as count FROM submissions').count;
    const avgRow = queryOne('SELECT AVG(score) as avg FROM submissions');
    const avgScore = avgRow && avgRow.avg ? Math.round(avgRow.avg * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalExams,
        activeExams,
        totalSubmissions,
        avgScore
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── FALLBACK: Serve index.html ──────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START SERVER ────────────────────────────────────────────
async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🐳 ExamCloud Server Running               ║
  ║   📡 http://localhost:${PORT}                  ║
  ║   💾 SQLite: data/examcloud.db               ║
  ╚══════════════════════════════════════════════╝
    `);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  saveDb();
  if (db) db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveDb();
  if (db) db.close();
  process.exit(0);
});
