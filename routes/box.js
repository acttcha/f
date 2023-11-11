const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/box', (req, res) => {
    if (req.user && req.user.is_admin === 1) {
      db.query('SELECT * FROM box', (err, results) => {
        if (err) {
          console.error('주문 데이터 가져오기 오류: ' + err.message);
          res.status(500).send('서버 오류');
        } else {
          res.render('admin_box.ejs', { boxes: results, user: req.user });
        }
      });
    } else if (req.user && req.user.is_admin === 0) {
      res.status(500).send('관리자로 로그인하세요.');
    } else {
      res.redirect('/login');
    }
  });

router.post('/add-box', (req, res) => {
  const { box_id } = req.body;

  const query = 'INSERT INTO box (box_id, availability, deadline_status) VALUES (?, 1, 0)';
  db.query(query, [box_id], (err, results) => {
    if (err) {
      console.error('데이터 추가 오류: ' + err.message);
      res.json({ success: false, message: '데이터 추가 실패' });
    } else {
      res.json({ success: true, message: '데이터 추가 성공' });
    }
  });
});

router.delete('/delete-box/:id', (req, res) => {
  const boxId = req.params.id;

  const query = 'DELETE FROM box WHERE box_id = ?';
  console.log(boxId)
  db.query(query, [boxId], (err, results) => {
    if (err) {
      console.error('데이터 삭제 오류: ' + err.message);
      res.json({ success: false, message: '데이터 삭제 실패' });
    } else {
      res.json({ success: true, message: '데이터 삭제 성공' });
    }
  });
});

router.put('/avail-box/:id', (req, res) => {
  const boxId = req.params.id;

  const query = 'UPDATE box SET availability = 1 WHERE box_id = ?';
  console.log(boxId)
  db.query(query, [boxId], (err, results) => {
    if (err) {
      console.error('데이터 수정 오류: ' + err.message);
      res.json({ success: false, message: '데이터 수정 실패' });
    } else {
      res.json({ success: true, message: '데이터 수정 성공' });
    }
  });
});

router.put('/unavail-box/:id', (req, res) => {
  const boxId = req.params.id;

  const query = 'UPDATE box SET availability = 0 WHERE box_id = ?';
  console.log(boxId)
  db.query(query, [boxId], (err, results) => {
    if (err) {
      console.error('데이터 수정 오류: ' + err.message);
      res.json({ success: false, message: '데이터 수정 실패' });
    } else {
      res.json({ success: true, message: '데이터 수정 성공' });
    }
  });
});

router.put('/cancel-deadline/:id', (req, res) => {
  const boxId = req.params.id;

  const query = 'UPDATE box SET deadline_status = 0 WHERE box_id = ?';
  console.log(boxId)
  db.query(query, [boxId], (err, results) => {
    if (err) {
      console.error('데이터 수정 오류: ' + err.message);
      res.json({ success: false, message: '데이터 수정 실패' });
    } else {
      res.json({ success: true, message: '데이터 수정 성공' });
    }
  });
});

module.exports = router;
