const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/workline_assign', (req, res) => {
    if (req.user && req.user.is_admin === 1) {
      db.query('SELECT * FROM user where is_admin = 0', (err, results) => {
        if (err) {
          console.error('주문 데이터 가져오기 오류: ' + err.message);
          res.status(500).send('서버 오류');
        } else {
          res.render('admin_workline_assign.ejs', { workers: results, user: req.user });
        }
      });
    } else if (req.user && req.user.is_admin === 0) {
      res.status(500).send('관리자로 로그인하세요.');
    } else {
      res.redirect('/login');
    }
  });

module.exports = router;
