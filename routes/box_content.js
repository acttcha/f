const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/box/:id', (req, res) => {
  const box_id = req.params.id;

  // 조인하는데, 두 테이블의 pk 컬럼명이 'id'로 동일해서 문제 발생. 직접 별칭을 넣어줌으로써 문제 해결.
  const query = 'SELECT box_content.id AS box_content_id, box_content.box_id, box_content.orderdetail_id, box_content.rebin_rack_id, order_detail.product_id, order_detail.quantity, order_detail.orderdetail_id AS orderdetail_id FROM box_content JOIN order_detail ON box_content.orderdetail_id = order_detail.orderdetail_id WHERE box_content.box_id = ?';


  if (req.user && req.user.is_admin === 1) {
    db.query(query, [box_id], (err, results) => {
      if (err) {
        console.error('박스 내용물 가져오기 오류: ' + err.message);
        res.status(500).send('서버 오류');
      } else {
        res.render('admin_box_content.ejs', { box_contents: results, user: req.user, boxId: box_id });
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
  const orderdetail_id = req.body.orderdetail_id; // 클라이언트에서 전달한 orderdetail_id 값
  const boxId = req.body.boxId;

  const deleteQuery = 'DELETE FROM box_content WHERE id = ?';
  const updateQuery = 'UPDATE order_detail SET picking_flag = 0, picking_worker_id = NULL WHERE orderdetail_id = ?';

  const checkQuery = `SELECT COUNT(*) FROM box_content where box_id = ?`
  const initializeQuery = `UPDATE box SET deadline_status = 0, packing_type = NULL WHERE box_id = ?`

  db.beginTransaction((err) => {
    if (err) {
      console.error('트랜잭션 시작 오류: ' + err.message);
      res.json({ success: false, message: '트랜잭션 시작 실패' });
      return;
    }

    db.query(deleteQuery, [boxContentId], (err2, deleteResults) => {
      if (err2) {
        db.rollback(() => {
          console.error('데이터 삭제 오류: ' + err2.message);
          res.json({ success: false, message: '데이터 삭제 실패' });
        });
      } else {
        // 데이터 삭제가 성공하면 order_detail 테이블에서 picking_flag를 0으로, 작업자id는 null로 업데이트
        db.query(updateQuery, [orderdetail_id], (err3, updateResults) => {
          if (err3) {
            db.rollback(() => {
              console.error('picking_flag, worker_id 업데이트 오류: ' + err3.message);
              res.json({ success: false, message: 'picking_flag, worker_id 업데이트 실패' });
            });
          } else {
            db.commit((err4) => {
              if (err4) {
                db.rollback(() => {
                  console.error('트랜잭션 커밋 오류: ' + err4.message);
                  res.json({ success: false, message: '트랜잭션 커밋 실패' });
                });
              } else {
                // 트랜잭션 성공시 박스 콘텐츠가 하나도 남아있지 않다면 마감여부를 0으로 포장유형을 null로 초기화
                db.query(checkQuery, [boxId], (err5, checkResults) => {
                  if (err5) {
                    console.error('체크에러: ' + err5.message);
                    res.json({ success: false, message: '체크에러' });
                  }
                  else {
                    if (checkResults.length > 0) {
                      res.json({ success: true, message: '데이터 삭제 및 picking_flag, worker_id 업데이트 성공' });
                    }
                    else if (checkResults.length === 0) {
                      db.query(initializeQuery, [boxId], (err6, initializeResults) => {
                        if (err6) {
                          res.json({ success: false, message: '초기화는 안됨' });
                        }
                        else {
                          res.json({ success: true, message: '데이터 삭제 및 picking_flag, worker_id 업데이트 성공 + 초기화 성공' });

                        }
                      })
                    }
                    else {
                      res.json({ success: true, message: '데이터 삭제 및 picking_flag, worker_id 업데이트 성공 + 초기화 실패' });
                    }
                  }
                })
              }
            });
          }
        });
      }
    });
  });
});

module.exports = router;
