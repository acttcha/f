const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/trackingNumber', (req, res) => {
    if (req.user && req.user.is_admin === 1) {
      db.query('SELECT * FROM tracking_number', (err, results) => {
        if (err) {
          console.error('주문 데이터 가져오기 오류: ' + err.message);
          res.status(500).send('서버 오류');
        } else {
          res.render('admin_trackingNumber.ejs', { trackingNumbers: results, user: req.user });
        }
      });
    } else if (req.user && req.user.is_admin === 0) {
      res.status(500).send('관리자로 로그인하세요.');
    } else {
      res.redirect('/login');
    }
});

router.get('/trackingNumber/:id', (req, res) => {
    const id = req.params.id;
    console.log(id)
  
    const query = 'SELECT * FROM tracking_orders WHERE tracking_number_id = ?';

    if (req.user && req.user.is_admin === 1) {
      db.query(query, [id], (err, results) => {
      if (err) {
        console.error('박스 내용물 가져오기 오류: ' + err.message);
        res.status(500).send('서버 오류');
      } else {
        console.log(results)
        res.render('admin_trackingNumber_content.ejs', { contents: results, user: req.user });
      }
    });
    } else if (req.user && req.user.is_admin === 0) {
      res.status(500).send('관리자로 로그인하세요.');
    } else {
      res.redirect('/login');
    }
  });

module.exports = router;
