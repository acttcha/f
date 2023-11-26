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

module.exports = router;
