'use strict';
/**
 * Toàn bộ REST API của Vườn Toán.
 * Nguyên tắc: đáp án đúng (correct_answer) KHÔNG BAO GIỜ gửi xuống trình duyệt
 * ở endpoint lấy câu hỏi — việc chấm điểm diễn ra 100% trên server.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { setAuthCookie, clearAuthCookie, requireAuth, requireTeacher } = require('./auth');

const router = express.Router();
const publicUser = u => u && ({ id: u.id, username: u.username, fullName: u.full_name, role: u.role, className: u.class_name, studentCode: u.student_code, totalStars: u.total_stars });

/* ---------------- Xác thực ---------------- */
router.post('/auth/login', (req, res) => {
  const { username = '', password = '', role } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username=? AND is_active=1').get(String(username).trim());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu chưa đúng. Em hỏi lại thầy/cô nhé!' });
  }
  if (role && user.role !== role) {
    return res.status(403).json({ error: user.role === 'teacher'
      ? 'Đây là tài khoản giáo viên, hãy chọn mục Thầy Cô Giáo nhé!' : 'Đây là tài khoản học sinh, hãy chọn mục Học Sinh nhé!' });
  }
  const token = setAuthCookie(res, user);
  res.json({ user: publicUser(user), token });
});

router.post('/auth/logout', (req, res) => { clearAuthCookie(res); res.json({ ok: true }); });
router.get('/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

/* ---------------- Bài học & tiến độ ---------------- */
function lessonsWithProgress(userId) {
  const lessons = db.prepare('SELECT * FROM lessons ORDER BY sort_order').all();
  const prog = Object.fromEntries(db.prepare('SELECT * FROM progress WHERE user_id=?').all(userId).map(p => [p.lesson_id, p]));
  return lessons.map(l => {
    const p = prog[l.id];
    const locked = l.unlock_after ? !(prog[l.unlock_after] && prog[l.unlock_after].completed) : false;
    const sets = db.prepare('SELECT id,title,kind FROM question_sets WHERE lesson_id=? ORDER BY kind').all(l.id);
    return {
      id: l.id, number: l.number, title: l.title, description: l.description, topic: l.topic,
      bestScore: p ? p.best_score : 0, completed: p ? !!p.completed : false, locked, questionSets: sets,
    };
  });
}
router.get('/lessons', requireAuth, (req, res) => res.json({ lessons: lessonsWithProgress(req.user.id) }));
router.get('/me/progress', requireAuth, (req, res) => res.json({ lessons: lessonsWithProgress(req.user.id), totalStars: req.user.total_stars }));

/* ---------------- Mục lục SGK (16 Chủ đề, 81 bài) ---------------- */
const fs = require('fs');
const path = require('path');
let cachedCurriculum = null;
function getCurriculumData() {
  if (!cachedCurriculum) {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'curriculum.json'), 'utf8');
    cachedCurriculum = JSON.parse(raw);
  }
  return cachedCurriculum;
}

router.get('/curriculum', (req, res) => {
  const data = getCurriculumData();
  let progressMap = {};
  if (req.user && req.user.id) {
    try {
      const rows = db.prepare('SELECT * FROM progress WHERE user_id=?').all(req.user.id);
      rows.forEach(r => { progressMap[r.lesson_id] = r; });
    } catch (_) {}
  }
  res.json({ ...data, userProgress: progressMap });
});

/* ---------------- Câu hỏi (không kèm đáp án) ---------------- */
router.get('/question-sets/:setId/questions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id,type,prompt,options_json,points,category FROM questions WHERE set_id=? ORDER BY sort_order').all(req.params.setId);
  if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi.' });
  res.json({ setId: req.params.setId, questions: rows.map(r => ({ ...r, options: r.options_json ? JSON.parse(r.options_json) : undefined, options_json: undefined })) });
});

/* ---------------- Nộp bài & chấm điểm trên server ---------------- */
// Metadata bộ bài lấy từ bảng question_sets (giáo viên tạo bộ mới là nộp/chấm được ngay)
function setMeta(setId) {
  const s = db.prepare('SELECT * FROM question_sets WHERE id=?').get(setId);
  return s ? { kind: s.kind, lessonId: s.lesson_id, starReward: s.star_reward } : null;
}
router.post('/submissions', requireAuth, (req, res) => {
  const { setId, answers = {}, durationSec = 0 } = req.body || {};
  const meta = setMeta(setId);
  if (!meta) return res.status(400).json({ error: 'Bộ bài không hợp lệ.' });
  const questions = db.prepare('SELECT * FROM questions WHERE set_id=? ORDER BY sort_order').all(setId);
  let earned = 0, max = 0, correct = 0;
  const detail = questions.map(q => {
    max += q.points;
    const given = answers[q.id] == null ? '' : String(answers[q.id]).trim().toLowerCase();
    const ok = given === String(q.correct_answer).trim().toLowerCase();
    if (ok) { earned += q.points; correct++; }
    return { questionId: q.id, correct: ok, correctAnswer: q.correct_answer };
  });
  const percent = max ? Math.round((earned / max) * 100) : 0;

  // Sao thưởng chỉ tính trên phần % tiến bộ so với điểm cao nhất cũ (chống "cày" sao bằng cách nộp lại)
  const old = db.prepare('SELECT * FROM progress WHERE user_id=? AND lesson_id=?').get(req.user.id, meta.lessonId);
  const oldBest = old ? old.best_score : 0;
  const starsEarned = Math.round(Math.max(0, percent - oldBest) / 100 * meta.starReward);

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO attempts (user_id,kind,ref_id,score_percent,correct_count,total_count,stars_earned,duration_sec,answers_json)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(req.user.id, meta.kind, setId, percent, correct, questions.length, starsEarned, Number(durationSec) || 0, JSON.stringify(answers));
    db.prepare(`INSERT INTO progress (user_id,lesson_id,best_score,completed,updated_at) VALUES (?,?,?,?,datetime('now','localtime'))
      ON CONFLICT(user_id,lesson_id) DO UPDATE SET best_score=MAX(best_score,excluded.best_score),
        completed=MAX(completed,excluded.completed), updated_at=datetime('now','localtime')`)
      .run(req.user.id, meta.lessonId, percent, percent >= 50 ? 1 : 0);
    if (starsEarned) db.prepare('UPDATE users SET total_stars=total_stars+? WHERE id=?').run(starsEarned, req.user.id);
  });
  tx();
  const me = db.prepare('SELECT total_stars FROM users WHERE id=?').get(req.user.id);
  res.json({ scorePercent: percent, correctCount: correct, totalCount: questions.length, starsEarned, totalStars: me.total_stars, detail });
});

/* ---------------- Bảng xếp hạng (tính từ dữ liệu thật) ---------------- */
router.get('/leaderboard', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT u.id,u.full_name,u.class_name,u.total_stars,
      (SELECT COUNT(*) FROM attempts a WHERE a.user_id=u.id AND a.kind IN ('exercise','exam')) AS attempts_count,
      (SELECT ROUND(AVG(score_percent)) FROM attempts a WHERE a.user_id=u.id AND a.kind IN ('exercise','exam')) AS avg_score
    FROM users u WHERE u.role='student' AND u.is_active=1 ORDER BY u.total_stars DESC, u.full_name`).all();
  res.json({ leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r, isMe: r.id === req.user.id })) });
});

/* ---------------- Giáo viên: quản lý tài khoản học sinh ---------------- */
router.get('/teacher/students', requireTeacher, (req, res) => {
  const rows = db.prepare(`SELECT u.id,u.username,u.full_name,u.class_name,u.student_code,u.total_stars,u.created_at,
      (SELECT ROUND(AVG(score_percent),1) FROM attempts a WHERE a.user_id=u.id AND a.kind IN ('exercise','exam')) AS avg_score,
      (SELECT COUNT(*) FROM attempts a WHERE a.user_id=u.id) AS attempts_count
    FROM users u WHERE u.role='student' AND u.is_active=1 ORDER BY u.class_name, u.full_name`).all();
  res.json({ students: rows });
});

router.post('/teacher/students', requireTeacher, (req, res) => {
  const { username = '', password = '', fullName = '', className = '3A', studentCode = '' } = req.body || {};
  if (!username.trim() || !fullName.trim() || String(password).length < 4) {
    return res.status(400).json({ error: 'Cần điền tên đăng nhập, họ tên và mật khẩu từ 4 ký tự.' });
  }
  if (db.prepare('SELECT id FROM users WHERE username=?').get(username.trim())) {
    return res.status(409).json({ error: 'Tên đăng nhập này đã tồn tại.' });
  }
  const info = db.prepare(`INSERT INTO users (username,password_hash,full_name,role,class_name,student_code)
    VALUES (?,?,?,'student',?,?)`).run(username.trim(), bcrypt.hashSync(String(password), 10), fullName.trim(), className, studentCode.trim());
  res.status(201).json({ student: { id: info.lastInsertRowid, username: username.trim(), fullName: fullName.trim(), className } });
});

router.delete('/teacher/students/:id', requireTeacher, (req, res) => {
  db.prepare("UPDATE users SET is_active=0 WHERE id=? AND role='student'").run(req.params.id);
  res.json({ ok: true });
});

router.post('/teacher/students/:id/reset-password', requireTeacher, (req, res) => {
  const { password = '' } = req.body || {};
  if (String(password).length < 4) return res.status(400).json({ error: 'Mật khẩu mới cần từ 4 ký tự.' });
  db.prepare("UPDATE users SET password_hash=? WHERE id=? AND role='student'").run(bcrypt.hashSync(String(password), 10), req.params.id);
  res.json({ ok: true });
});

router.get('/teacher/overview', requireTeacher, (req, res) => {
  const students = db.prepare("SELECT COUNT(*) c FROM users WHERE role='student' AND is_active=1").get().c;
  const attempts = db.prepare('SELECT COUNT(*) c, ROUND(AVG(score_percent),1) avg FROM attempts').get();
  res.json({ students, attempts: attempts.c, avgScore: attempts.avg || 0 });
});

/* ================= ĐỢT 2 ================= */
/* ---------------- Điểm mini-game ---------------- */
const GAME_IDS = ['game-bong-bay', 'game-dua-xe', 'game-lat-the', 'game-cau-ca'];
router.post('/game-scores', requireAuth, (req, res) => {
  const { gameId, score = 0, durationSec = 0 } = req.body || {};
  if (!GAME_IDS.includes(gameId)) return res.status(400).json({ error: 'Trò chơi không hợp lệ.' });
  const raw = Math.max(0, Math.min(100000, Math.round(Number(score) || 0)));
  const prev = db.prepare('SELECT MAX(score) AS best FROM game_scores WHERE user_id=? AND game_id=?').get(req.user.id, gameId);
  const prevBest = prev && prev.best ? prev.best : 0;
  // Sao chỉ cộng theo phần điểm vượt kỷ lục cũ (mỗi 10 điểm = 1 sao, tối đa 50 sao/lượt phá kỷ lục)
  const starsEarned = Math.min(50, Math.ceil(Math.max(0, raw - prevBest) / 10));
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO game_scores (user_id,game_id,score,stars_earned,duration_sec) VALUES (?,?,?,?,?)')
      .run(req.user.id, gameId, raw, starsEarned, Number(durationSec) || 0);
    db.prepare(`INSERT INTO attempts (user_id,kind,ref_id,score_percent,correct_count,total_count,stars_earned,duration_sec,answers_json)
      VALUES (?, 'game', ?, ?, 0, 0, ?, ?, '{}')`).run(req.user.id, gameId, raw, starsEarned, Number(durationSec) || 0);
    if (starsEarned) db.prepare('UPDATE users SET total_stars=total_stars+? WHERE id=?').run(starsEarned, req.user.id);
  });
  tx();
  const me = db.prepare('SELECT total_stars FROM users WHERE id=?').get(req.user.id);
  res.json({ score: raw, bestScore: Math.max(prevBest, raw), starsEarned, totalStars: me.total_stars });
});
router.get('/me/game-scores', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT game_id, MAX(score) AS best, COUNT(*) AS plays FROM game_scores WHERE user_id=? GROUP BY game_id').all(req.user.id);
  res.json({ games: Object.fromEntries(rows.map(r => [r.game_id, r])) });
});

/* ---------------- Giáo viên: quản lý bài học ---------------- */
router.get('/teacher/lessons', requireTeacher, (req, res) => {
  const rows = db.prepare(`SELECT l.*, (SELECT COUNT(*) FROM question_sets s WHERE s.lesson_id=l.id) AS set_count FROM lessons l ORDER BY sort_order`).all();
  res.json({ lessons: rows });
});
router.post('/teacher/lessons', requireTeacher, (req, res) => {
  const { number, title = '', description = '', topic = '', unlockAfter = null } = req.body || {};
  const num = parseInt(number, 10);
  if (!num || !title.trim()) return res.status(400).json({ error: 'Cần nhập số bài và tên bài học.' });
  const id = `bai-${num}`;
  if (db.prepare('SELECT id FROM lessons WHERE id=?').get(id)) return res.status(409).json({ error: `Bài ${num} đã tồn tại, hãy sửa bài đó.` });
  const maxSort = db.prepare('SELECT MAX(sort_order) AS m FROM lessons').get().m || 0;
  db.prepare('INSERT INTO lessons (id,number,title,description,topic,sort_order,unlock_after) VALUES (?,?,?,?,?,?,?)')
    .run(id, num, title.trim(), description.trim(), topic.trim(), maxSort + 1, unlockAfter || null);
  res.status(201).json({ lesson: { id, number: num, title: title.trim() } });
});
router.put('/teacher/lessons/:id', requireTeacher, (req, res) => {
  const { title = '', description = '', topic = '', unlockAfter = null } = req.body || {};
  if (!title.trim()) return res.status(400).json({ error: 'Tên bài học không được trống.' });
  const info = db.prepare('UPDATE lessons SET title=?,description=?,topic=?,unlock_after=? WHERE id=?')
    .run(title.trim(), String(description).trim(), String(topic).trim(), unlockAfter || null, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Không tìm thấy bài học.' });
  res.json({ ok: true });
});
router.delete('/teacher/lessons/:id', requireTeacher, (req, res) => {
  const used = db.prepare('SELECT (SELECT COUNT(*) FROM progress WHERE lesson_id=?) + (SELECT COUNT(*) FROM question_sets WHERE lesson_id=?) AS c').get(req.params.id, req.params.id).c;
  if (used) return res.status(409).json({ error: 'Bài này đã có học sinh học hoặc có bộ câu hỏi — không xóa được, hãy sửa nội dung thay thế.' });
  db.prepare('DELETE FROM lessons WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- Giáo viên: quản lý bộ câu hỏi & câu hỏi ---------------- */
router.get('/teacher/question-sets', requireTeacher, (req, res) => {
  const rows = db.prepare(`SELECT s.*, l.number AS lesson_number, (SELECT COUNT(*) FROM questions q WHERE q.set_id=s.id) AS question_count
    FROM question_sets s LEFT JOIN lessons l ON l.id=s.lesson_id ORDER BY s.kind, s.title`).all();
  res.json({ questionSets: rows });
});
router.post('/teacher/question-sets', requireTeacher, (req, res) => {
  const { id = '', title = '', kind = 'exercise', lessonId = null, starReward = 40, durationMinutes = 0 } = req.body || {};
  const setId = String(id).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  if (!setId || !title.trim()) return res.status(400).json({ error: 'Cần mã bộ đề (không dấu) và tên bộ đề.' });
  if (db.prepare('SELECT id FROM question_sets WHERE id=?').get(setId)) return res.status(409).json({ error: 'Mã bộ đề đã tồn tại.' });
  db.prepare('INSERT INTO question_sets (id,title,kind,lesson_id,star_reward,duration_minutes) VALUES (?,?,?,?,?,?)')
    .run(setId, title.trim(), kind === 'exam' ? 'exam' : 'exercise', lessonId || null, Number(starReward) || 40, Number(durationMinutes) || 0);
  res.status(201).json({ questionSet: { id: setId, title: title.trim() } });
});
router.delete('/teacher/question-sets/:id', requireTeacher, (req, res) => {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM questions WHERE set_id=?').run(req.params.id);
    db.prepare('DELETE FROM question_sets WHERE id=?').run(req.params.id);
  });
  tx();
  res.json({ ok: true });
});
router.get('/teacher/question-sets/:id/questions', requireTeacher, (req, res) => {
  const rows = db.prepare('SELECT * FROM questions WHERE set_id=? ORDER BY sort_order').all(req.params.id);
  res.json({ questions: rows.map(r => ({ ...r, options: r.options_json ? JSON.parse(r.options_json) : undefined })) });
});
router.post('/teacher/question-sets/:id/questions', requireTeacher, (req, res) => {
  const { type = 'multiple-choice', prompt = '', options, correctAnswer = '', points = 5, category = '' } = req.body || {};
  if (!prompt.trim() || !String(correctAnswer).trim()) return res.status(400).json({ error: 'Cần nội dung câu hỏi và đáp án đúng.' });
  if (type === 'multiple-choice' && (!Array.isArray(options) || options.length < 2)) {
    return res.status(400).json({ error: 'Câu trắc nghiệm cần ít nhất 2 lựa chọn.' });
  }
  const maxSort = db.prepare('SELECT MAX(sort_order) AS m FROM questions WHERE set_id=?').get(req.params.id).m || 0;
  const id = `q-${Date.now().toString(36)}`;
  const set = db.prepare('SELECT lesson_id FROM question_sets WHERE id=?').get(req.params.id);
  if (!set) return res.status(404).json({ error: 'Không tìm thấy bộ đề.' });
  db.prepare('INSERT INTO questions (id,set_id,lesson_id,type,prompt,options_json,correct_answer,points,category,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.params.id, set.lesson_id, type, prompt.trim(), options ? JSON.stringify(options) : null, String(correctAnswer).trim(), Number(points) || 1, String(category).trim(), maxSort + 1);
  res.status(201).json({ question: { id } });
});
router.put('/teacher/questions/:id', requireTeacher, (req, res) => {
  const { prompt = '', options, correctAnswer = '', points = 5, category = '' } = req.body || {};
  if (!prompt.trim() || !String(correctAnswer).trim()) return res.status(400).json({ error: 'Cần nội dung câu hỏi và đáp án đúng.' });
  const info = db.prepare('UPDATE questions SET prompt=?,options_json=?,correct_answer=?,points=?,category=? WHERE id=?')
    .run(prompt.trim(), options ? JSON.stringify(options) : null, String(correctAnswer).trim(), Number(points) || 1, String(category).trim(), req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
  res.json({ ok: true });
});
router.delete('/teacher/questions/:id', requireTeacher, (req, res) => {
  db.prepare('DELETE FROM questions WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- Giáo viên: giao bài tập cho lớp ---------------- */
router.get('/teacher/assignments', requireTeacher, (req, res) => {
  const assignments = db.prepare(`SELECT a.id, a.set_id, s.title AS set_title, a.class_name, a.due_date, a.note, a.created_at,
      (SELECT COUNT(*) FROM users u WHERE u.role='student' AND u.is_active=1 AND u.class_name=a.class_name) AS total_students,
      (SELECT COUNT(DISTINCT u.id) FROM users u JOIN attempts at ON at.user_id=u.id AND at.ref_id=a.set_id
        WHERE u.role='student' AND u.is_active=1 AND u.class_name=a.class_name) AS done_students
    FROM assignments a JOIN question_sets s ON s.id=a.set_id ORDER BY a.created_at DESC`).all();
  res.json({ assignments });
});
router.post('/teacher/assignments', requireTeacher, (req, res) => {
  const { setId = '', className = '', dueDate = null, note = '' } = req.body || {};
  if (!String(className).trim()) return res.status(400).json({ error: 'Cần chọn lớp để giao bài.' });
  const set = db.prepare('SELECT id FROM question_sets WHERE id=?').get(String(setId).trim());
  if (!set) return res.status(404).json({ error: 'Không tìm thấy bộ đề.' });
  db.prepare(`INSERT INTO assignments (set_id,class_name,due_date,note,created_by) VALUES (?,?,?,?,?)
      ON CONFLICT(set_id,class_name) DO UPDATE SET due_date=excluded.due_date, note=excluded.note, created_at=datetime('now','localtime')`)
    .run(set.id, String(className).trim(), dueDate || null, String(note).trim(), req.user.id);
  const assignment = db.prepare('SELECT id FROM assignments WHERE set_id=? AND class_name=?')
    .get(set.id, String(className).trim());
  res.status(201).json({ assignment: { id: assignment.id } });
});
router.delete('/teacher/assignments/:id', requireTeacher, (req, res) => {
  db.prepare('DELETE FROM assignments WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});
router.get('/me/assignments', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT a.set_id, s.title AS set_title, s.kind, s.lesson_id,
      l.number AS lesson_number, l.title AS lesson_title, a.class_name, a.due_date, a.note,
      EXISTS(SELECT 1 FROM attempts at WHERE at.user_id=? AND at.ref_id=a.set_id) AS done,
      (SELECT MAX(score_percent) FROM attempts at WHERE at.user_id=? AND at.ref_id=a.set_id) AS best_score
    FROM assignments a JOIN question_sets s ON s.id=a.set_id LEFT JOIN lessons l ON l.id=s.lesson_id
    WHERE a.class_name=?
    ORDER BY CASE WHEN a.due_date IS NULL THEN 1 ELSE 0 END, a.due_date ASC, a.created_at DESC`).all(req.user.id, req.user.id, req.user.class_name);
  const assignments = rows.map(r => ({
    setId: r.set_id, setTitle: r.set_title, kind: r.kind, lessonId: r.lesson_id,
    lessonNumber: r.lesson_number, lessonTitle: r.lesson_title, className: r.class_name,
    dueDate: r.due_date, note: r.note, done: Boolean(r.done), bestScore: r.best_score,
  }));
  res.json({ assignments });
});

/* ---------------- Giáo viên: xuất báo cáo CSV (mở được bằng Excel) ---------------- */
router.get('/teacher/export.csv', requireTeacher, (req, res) => {
  const rows = db.prepare(`SELECT u.username,u.full_name,u.class_name,u.student_code,u.total_stars,
      (SELECT ROUND(AVG(score_percent),1) FROM attempts a WHERE a.user_id=u.id AND a.kind IN ('exercise','exam')) AS avg_score,
      (SELECT COUNT(*) FROM attempts a WHERE a.user_id=u.id) AS attempts_count
    FROM users u WHERE u.role='student' AND u.is_active=1 ORDER BY u.class_name,u.full_name`).all();
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const csv = ['Tên đăng nhập,Họ tên,Lớp,Mã học sinh,Tổng sao,Điểm TB,Số lượt làm bài',
    ...rows.map(r => [r.username, r.full_name, r.class_name, r.student_code, r.total_stars, r.avg_score == null ? '' : r.avg_score, r.attempts_count].map(esc).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-lop.csv"');
  res.send('\ufeff' + csv);
});

/* ---------------- ĐỢT 3: Thống kê lớp học từ dữ liệu thật ---------------- */
router.get('/teacher/analytics', requireTeacher, (req, res) => {
  const students = db.prepare("SELECT id FROM users WHERE role='student' AND is_active=1").all();
  const studentIds = students.map(s => s.id);
  const lessons = db.prepare('SELECT * FROM lessons ORDER BY sort_order').all();
  const prog = db.prepare('SELECT * FROM progress').all();
  const completedTotal = prog.filter(p => p.completed).length;
  const completionRate = studentIds.length && lessons.length
    ? Math.round(completedTotal / (studentIds.length * lessons.length) * 100) : 0;
  const studentsWithCompleted = new Set(prog.filter(p => p.completed).map(p => p.user_id)).size;

  const attempts = db.prepare("SELECT * FROM attempts WHERE kind IN ('exercise','exam') ORDER BY created_at").all();
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score_percent, 0) / attempts.length * 10) / 10 : 0;

  // Điểm TB từng học sinh -> xuất sắc / cần hỗ trợ
  const byStudent = {};
  attempts.forEach(a => { (byStudent[a.user_id] = byStudent[a.user_id] || []).push(a.score_percent); });
  let excellent = 0, needSupport = 0;
  Object.values(byStudent).forEach(scores => {
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
    if (avg >= 90) excellent++; else if (avg < 60) needSupport++;
  });

  // Hoạt động 7 ngày gần nhất (số lượt làm bài mỗi ngày)
  const last7 = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS c FROM attempts
    WHERE created_at >= datetime('now','localtime','-6 days') GROUP BY day ORDER BY day`).all();

  // Dạng hay sai nhất: đối chiếu từng đáp án đã lưu với đáp án đúng trong DB
  const qmap = Object.fromEntries(db.prepare('SELECT id,category,type,prompt,correct_answer FROM questions').all().map(q => [q.id, q]));
  const wrongBy = {};
  attempts.forEach(a => {
    let answers = {};
    try { answers = JSON.parse(a.answers_json || '{}'); } catch { answers = {}; }
    Object.entries(answers).forEach(([qid, given]) => {
      const q = qmap[qid]; if (!q) return;
      const key = q.category || ({ 'multiple-choice': 'Trắc nghiệm', input: 'Điền số', compare: 'Điền dấu so sánh', paint: 'Tô màu theo kết quả' }[q.type] || q.type);
      wrongBy[key] = wrongBy[key] || { label: key, wrong: 0, total: 0 };
      wrongBy[key].total++;
      if (String(given).trim().toLowerCase() !== String(q.correct_answer).trim().toLowerCase()) wrongBy[key].wrong++;
    });
  });
  const topMistakes = Object.values(wrongBy).filter(x => x.total >= 2)
    .map(x => ({ ...x, wrongRate: Math.round(x.wrong / x.total * 100) }))
    .sort((a, b) => b.wrongRate - a.wrongRate).slice(0, 3);

  // Tiến độ theo từng bài
  const perLesson = lessons.map(l => {
    const ps = prog.filter(p => p.lesson_id === l.id);
    return {
      id: l.id, number: l.number, title: l.title,
      completed: ps.filter(p => p.completed).length,
      avgBest: ps.length ? Math.round(ps.reduce((s, p) => s + p.best_score, 0) / ps.length) : 0,
    };
  });

  res.json({
    students: studentIds.length, lessons: lessons.length, attempts: attempts.length,
    completionRate, studentsWithCompleted, avgScore, excellent, needSupport,
    noDataStudents: studentIds.length - Object.keys(byStudent).length,
    last7, topMistakes, perLesson,
  });
});

/* Kiểm tra nhanh tình trạng server (dùng khi deploy để hosting tự giám sát) */
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

module.exports = router;
