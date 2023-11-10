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

// 토트 내용물을 삭제하면 집품 여부도 0으로 변경
router.delete('/deleteBoxContent/:id', (req, res) => {
  const boxContentId = req.params.id;
  const order_id = req.body.order_id; // 클라이언트에서 전달한 order_id 값
  console.log(order_id)

  const deleteQuery = 'DELETE FROM box_content WHERE id = ?';
  db.query(deleteQuery, [boxContentId], (err, deleteResults) => {
      if (err) {
          console.error('데이터 삭제 오류: ' + err.message);
          res.json({ success: false, message: '데이터 삭제 실패' });
      } else {
          // 데이터 삭제가 성공하면 orders 테이블에서 picking_flag를 0으로 업데이트
          const updateQuery = 'UPDATE orders SET picking_flag = 0 WHERE id = ?';
          db.query(updateQuery, [order_id], (err, updateResults) => {
              if (err) {
                  console.error('picking_flag 업데이트 오류: ' + err.message);
                  res.json({ success: false, message: 'picking_flag 업데이트 실패' });
              } else {
                  res.json({ success: true, message: '데이터 삭제 및 picking_flag 업데이트 성공' });
              }
          });
      }
  });
});

module.exports = router;
