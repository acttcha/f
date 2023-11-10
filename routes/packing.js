const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/packing1', (req, res) => {
    if (req.user) {
      if(req.user.is_admin === 0){
        if(req.user.work_access =='포장' || req.user.work_access =='ALL'){
            res.render('work_packing1.ejs', {user : req.user})
        }
        else {
            res.status(500).send('작업 권한이 없습니다.');
        }
      }
      else if(req.user.is_admin === 1){
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

router.get('/singlePacking1', (req, res) => {
    if (req.user) {
      if(req.user.is_admin === 0){
        if(req.user.work_access =='포장' || req.user.work_access =='ALL'){
            res.render('work_singlePacking1.ejs', {user : req.user})
        }
        else {
            res.status(500).send('작업 권한이 없습니다.');
        }
      }
      else if(req.user.is_admin === 1){
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

router.get('/boxContentCheck/:id', (req, res) => {
    const { id } = req.params;
    const query1 = 'SELECT * FROM box WHERE box_id = ?';
    const query2 = 'SELECT * FROM box_content WHERE box_id = ?';
  
    db.query(query1, [id], (err, results) => {
      if (err) {
        console.error('데이터 검색 오류: ' + err.message);
        res.json({ success: false, message: '데이터 검색 실패' });
      } else {
        if (results.length > 0) {
            if (results[0].deadline_status == 1) {
                res.json({ success: true, message: '포장할 수 있는 토트입니다.' });
            } else if (results[0].deadline_status == 0) {
                res.json({ success: false, message: '토트가 아직 마감되지 않았습니다.' });
            } else {
                res.json({ success: false, message: '마감여부 값이 올바르지 않습니다.' });
            }
        } else {
            res.json({ success: false, message: '일치하는 토트가 없습니다.' });
        }
      }
    });
});

module.exports = router;