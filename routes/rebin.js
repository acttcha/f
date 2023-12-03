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

router.get('/boxcheck-rebin/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM box WHERE box_id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('데이터 검색 오류: ' + err.message);
      res.json({ success: false, message: '데이터 검색 실패' });
    } else {
      if (results.length > 0) {
        if (results[0].packing_type == '다중' && results[0].deadline_status == 1) {
          res.json({ success: true, message: '사용 가능한 토트 확인' });
        } else if (results[0].packing_type == '단일') {
          res.json({ success: false, message: '단일 포장 상품이 들어있는 토트입니다.' });
        } else if (results[0].deadline_status == 0) {
          res.json({ success: false, message: '마감되지 않은 토트입니다.' });
        } else {
          res.json({ success: false, message: '값이 올바르지 않습니다.' });
        }
      } else {
        res.json({ success: false, message: '일치하는 토트가 없습니다.' });
      }
    }
  });
});

router.get('/rebin3', (req, res) => {

  if (req.user) {
    if (req.user.is_admin === 0) {
      if (req.user.work_access == '리빈' || req.user.work_access === 'ALL') {
        const boxId = req.query.boxId;
        const workbenchId = req.query.workbenchId;

        const query = `
        SELECT
          od.orderdetail_id,
          od.order_id,
          od.product_id,
          od.quantity,
          bc.box_id,
          bc.rebin_rack_id,
          p.id AS productId,
          p.image,
          p.name
        FROM
          order_detail od
        JOIN
          box_content bc ON od.orderdetail_id = bc.orderdetail_id
        JOIN
          product p ON od.product_id = p.id
        WHERE
          od.picking_flag = 1 AND od.rebin_flag = 0 AND bc.box_id = ?;
        `
        db.query(query, [boxId], (err, results) => {
          if (err) {
            console.error('데이터 검색 오류' + err.message);
            res.json({ success: false, message: '데이터 검색 실패' });
          }

          else {
            if (results.length === 0) {
              res.redirect(`/work/rebin2?workbenchId=${workbenchId}`)
            }
            else {
              res.render('work_rebin3.ejs', { user: req.user, workbenchId: workbenchId, boxId: boxId, results: results, remainCount: results.length });
            }
          }
        })
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

router.post('/finish-rebin', async (req, res) => {
  const boxId = req.body.boxId;
  const orderDetailId = req.body.orderDetailId;
  const workbenchId = req.body.workbenchId;
  const rebinrackId = req.body.rebinrackId;
  const orderId = req.body.orderId;

  const updateQuery = 'UPDATE order_detail SET rebin_flag = 1, rebin_worker_id = ? WHERE orderdetail_id = ?';
  const insertQuery = 'INSERT INTO rebinrack_detail (rebinrack_id, orderdetail_id) VALUES (?, ?);';
  const deleteQuery = 'DELETE FROM box_content WHERE orderdetail_id = ?';
  const checkRebinFlag = 'SELECT * FROM order_detail WHERE order_id = ?;'
  const finishRackQuery = 'UPDATE rebin_rack SET finish_flag = 1 WHERE id = ?';

  const transaction = await db.beginTransaction();

  try {
    await db.query(updateQuery, [req.user.login_id, orderDetailId]);
    await db.query(insertQuery, [rebinrackId, orderDetailId]);
    await db.query(deleteQuery, [orderDetailId]);

    await db.commit();

    db.query(checkRebinFlag, [orderId], (err, results) => {
      if (err) {
        console.error('Error', err);
        return res.json({ success: false, message: '리빈 성공, 체크 트랜잭션 실패' });
      }

      let allRowsHaveRebinFlagOne = true;

      results.forEach(row => {
        if (row.rebin_flag !== 1) {
          allRowsHaveRebinFlagOne = false;
        }
      });

      if (allRowsHaveRebinFlagOne) {
        db.query(finishRackQuery, [rebinrackId], (err2, results2) => {
          if (err2) {
            return res.json({ success: false, message: '마지막 리빈작업 상품인데 마감 되지 않음.' });
          } else {
            return res.json({ success: true, message: '리빈 성공, 리빈작업대 마감' });
          }
        });
      } else {
        return res.json({ success: true, message: '리빈 성공, 아직 리빈작업대가 완료되지 않음.' });
      }
    });
  } catch (error) {
    await db.rollback();
    console.error('트랜잭션 에러:', error.message);
    return res.json({ success: false, message: '리빈 완료 실패' });
  }
});

module.exports = router;
