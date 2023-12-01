const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/rebin1', (req, res) => {
  if (req.user) {
    if (req.user.is_admin === 0) {
      if (req.user.work_access == '리빈' || req.user.work_access === 'ALL') {
        res.render('work_rebin1.ejs', { user: req.user })
      }
      else {
        res.status(500).send('작업 권한이 없습니다.');
      }
    }
    else if (req.user.is_admin === 1) {
      res.status(500).send('작업자로 로그인하세요.');
    }
    else {
      res.redirect('/default')
    }
  }
  else {
    res.redirect('/login');
  }
})

router.get('/workbench-check/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM workbench WHERE id = ?';

  db.query(query, [id], (err, results) => {
      if (err) {
          console.error('데이터 검색 오류: ' + err.message);
          res.json({ success: false, message: '데이터 검색 실패' });
      } else {
          if (results.length > 0) {
              if (results[0].work_category == '리빈' && results[0].status == 1) {
                  res.json({ success: true, message: '작업 가능한 리빈작업대 확인' });
              } else if (results[0].work_category == '리빈' && results[0].status == 0) {
                  res.json({ success: false, message: '현재 작업중인 리빈작업대 입니다.' });
              } else if (results[0].work_category !== '리빈' && results[0].status == 1) {
                  res.json({ success: false, message: '리빈 작업대가 아닙니다.' });
              } else {
                  res.json({ success: false, message: '값이 올바르지 않습니다.' });
              }
          } else {
              res.json({ success: false, message: '일치하는 작업대가 없습니다.' });
          }
      }
  });
});

router.get('/rebin2', (req, res) => {

  if (req.user) {
    if (req.user.is_admin === 0) {
      if (req.user.work_access == '리빈' || req.user.work_access === 'ALL') {
        const workbenchId = req.query.workbenchId;
        res.render('work_rebin2.ejs', { user: req.user, workbenchId: workbenchId });
      }
      else {
        res.status(500).send('작업 권한이 없습니다.');
      }
    }
    else if (req.user.is_admin === 1) {
      res.status(500).send('작업자로 로그인하세요.');
    }
    else {
      res.redirect('/default')
    }
  }
  else {
    res.redirect('/login');
  }
})

module.exports = router;
