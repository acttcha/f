const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/viewbox', (req, res) => {
    if (req.user) {
      if(req.user.is_admin === 0){
        res.render('work_viewbox.ejs', {user : req.user})
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

router.get('/viewboxcheck/:id', (req, res) => {
    const { id } = req.params;
  
    const query = 'SELECT * FROM box WHERE box_id = ?';
  
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('데이터 검색 오류: ' + err.message);
        res.json({ success: false, message: '데이터 검색 실패' });
      } else {
        if (results.length > 0) {
            res.json({ success: true, message: '사용 가능한 토트 확인' });
        } else {
            res.json({ success: false, message: '일치하는 토트가 없습니다.' });
        }
      }
    });
});

router.get('/viewbox2', (req, res) => {

    if (req.user) {
      if(req.user.is_admin === 0){
            const boxId = req.query.boxId;
            console.log(boxId)

            const query = 'SELECT box_content.id AS box_content_id, box_content.box_id, box_content.orderdetail_id, box_content.rebin_rack_id, order_detail.product_id, order_detail.quantity, order_detail.orderdetail_id AS orderdetail_id FROM box_content JOIN order_detail ON box_content.orderdetail_id = order_detail.orderdetail_id WHERE box_content.box_id = ?';


            db.query(query, [boxId], (error, results) => {
                if (error) {
                    console.error('박스 내용물 가져오기 오류: ' + err.message);
                    res.status(500).send('서버 오류');
                  } else {
                    console.log(results)
                    res.render('work_viewbox2.ejs', { box_contents: results, user: req.user });
                  }
            });
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

module.exports = router;
