const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/box/:id', (req, res) => {
  const box_id = req.params.id;
  console.log(box_id)

  // 조인하는데, 두 테이블의 pk 컬럼명이 'id'로 동일해서 문제 발생. 직접 별칭을 넣어줌으로써 문제 해결.
  const query = 'SELECT box_content.id AS box_content_id, box_content.box_id, box_content.order_id, box_content.rebin_rack_id, orders.product_id, orders.quantity, orders.id AS order_id FROM box_content JOIN orders ON box_content.order_id = orders.id WHERE box_content.box_id = ?';
  

  if (req.user && req.user.is_admin === 1) {
    db.query(query, [box_id], (err, results) => {
    if (err) {
      console.error('박스 내용물 가져오기 오류: ' + err.message);
      res.status(500).send('서버 오류');
    } else {
      console.log(results)
      res.render('admin_box_content.ejs', { box_contents: results, user: req.user });
    }
  });
  } else if (req.user && req.user.is_admin === 0) {
    res.status(500).send('관리자로 로그인하세요.');
  } else {
    res.redirect('/login');
  }
});

router.delete('/deleteBoxContent/:id', (req, res) => {
  const boxContentId = req.params.id;

  const query = 'DELETE FROM box_content WHERE id = ?';
  console.log(boxContentId)
  db.query(query, [boxContentId], (err, results) => {
    if (err) {
      console.error('데이터 삭제 오류: ' + err.message);
      res.json({ success: false, message: '데이터 삭제 실패' });
    } else {
      res.json({ success: true, message: '데이터 삭제 성공' });
    }
  });
});


module.exports = router;
