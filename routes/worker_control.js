const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/worker_control', (req, res) => {
    if (req.user && req.user.is_admin === 1) {
      db.query('SELECT * FROM user where is_admin = 0', (err, results) => {
        if (err) {
          console.error('주문 데이터 가져오기 오류: ' + err.message);
          res.status(500).send('서버 오류');
        } else {
          res.render('admin_worker_control.ejs', { workers: results, user: req.user });
        }
      });
    } else if (req.user && req.user.is_admin === 0) {
      res.status(500).send('관리자로 로그인하세요.');
    } else {
      res.redirect('/login');
    }
  });

router.put("/updateWorkAccess/:id", (req, res) => {
  const workerId = req.params.id; 
  const workAccess = req.body.workAccess;

  const sql = "UPDATE user SET work_access = ? WHERE user_id = ?";
  db.query(sql, [workAccess, workerId], (err, result) => {
    if (err) {
      res.status(500).json({ error: "work_access 업데이트 실패" });
    } else {
      res.json({ message: "작업 권한 업데이트 성공" });
    }
  });
});

router.put("/updateWorkLine/:id", (req, res) => {
  const workerId = req.params.id; 
  const workLine = req.body.workLine;

  const sql = "UPDATE user SET work_line = ? WHERE user_id = ?";
  db.query(sql, [workLine, workerId], (err, result) => {
    if (err) {
      res.status(500).json({ error: "work_line 업데이트 실패" });
    } else {
      res.json({ message: "작업 구역 설정 성공" });
    }
  });
});

router.delete('/deleteWorker/:id', (req, res) => {
  const workerId = req.params.id;

  const query = 'DELETE FROM user WHERE user_id = ?';

  db.query(query, [workerId], (err, results) => {
    if (err) {
      console.error('데이터 삭제 오류: ' + err.message);
      res.json({ success: false, message: '데이터 삭제 실패' });
    } else {
      res.json({ success: true, message: '데이터 삭제 성공' });
    }
  });
});

module.exports = router;
