const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/picking1', (req, res) => {
    if (req.user) {
      if(req.user.is_admin === 0){
        if(req.user.work_access =='집품' || req.user.work_access === 'ALL'){
            res.render('picking1.ejs', {user : req.user})
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


router.get('/boxcheck/:id', (req, res) => {
    const { id } = req.params;
  
    const query = 'SELECT * FROM box WHERE box_id = ?';
  
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('데이터 검색 오류: ' + err.message);
        res.json({ success: false, message: '데이터 검색 실패' });
      } else {
        if (results.length > 0) {
            if (results[0].availability == 1 && results[0].deadline_status == 0) {
                res.json({ success: true, message: '사용 가능한 토트 확인' });
            } else if (results[0].availability == 0) {
                res.json({ success: false, message: '토트가 이미 사용 중입니다.' });
            } else if (results[0].deadline_status == 1) {
                res.json({ success: false, message: '마감된 토트입니다.' });
            } else {
                res.json({ success: false, message: '값이 올바르지 않습니다.' });
            }
        } else {
            res.json({ success: false, message: '일치하는 토트가 없습니다.' });
        }
      }
    });
});

router.get('/picking2', (req, res) => {

    if (req.user) {
      if(req.user.is_admin === 0){
        if(req.user.work_access =='집품' || req.user.work_access === 'ALL'){
            const boxId = req.query.boxId;
            console.log(boxId)

            db.query('SELECT orders.id AS orderid, orders.quantity, product.id AS productid, product.name, product.location FROM orders JOIN product ON orders.product_id = product.id WHERE orders.picking_flag = 0 LIMIT 1', (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(500).send('데이터베이스 오류');
                } else {
                    if (results.length > 0) {
                        console.log(results);
                        res.render('picking2.ejs', { user: req.user, boxId: boxId, orders: results });
                    } else {
                        res.send('주문 데이터가 없습니다.');
                    }
                }
            });

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

router.post('/boxinsert', (req, res) => {
    const boxId = req.body.boxId; // boxId를 요청 본문에서 가져옴
    const orders = JSON.parse(req.body.orders);
    const orderId = orders[0].orderid.toString();
  
    const insertQuery = `INSERT INTO box_content (box_id, order_id, rebin_rack_id) VALUES (?, ?, NULL)`;
    const updateQuery = `UPDATE orders SET picking_flag = 1 WHERE id = ?`;

    db.beginTransaction((err) => {
        if (err) {
            console.error(err);
            res.status(500).send('데이터베이스 트랜잭션 오류');
            return;
        }

        db.query(insertQuery, [boxId, orderId], (insertError) => {
            if (insertError) {
                db.rollback(() => {
                    console.error(insertError);
                    res.status(500).send('데이터베이스 오류');
                });
            } else {
                db.query(updateQuery, [orderId], (updateError) => {
                    if (updateError) {
                        db.rollback(() => {
                            console.error(updateError);
                            res.status(500).send('데이터베이스 오류');
                        });
                    } else {
                        db.commit((commitError) => {
                            if (commitError) {
                                db.rollback(() => {
                                    console.error(commitError);
                                    res.status(500).send('데이터베이스 오류');
                                });
                            } else {
                                res.redirect(`/work/picking2?boxId=${boxId}`);
                            }
                        });
                    }
                });
            }
        });
    });
});


router.post('/boxfinish', (req, res) => {
    const boxId = req.body.boxId; // boxId를 요청 본문에서 가져옴
    const checkQuery = 'SELECT * FROM box_content WHERE box_id = ?';
    const updateQuery = 'UPDATE box SET deadline_status = 1 WHERE box_id = ?'

    // box_content 테이블에서 해당 box_id에 대한 데이터가 있는지 확인
    db.query(checkQuery, [boxId], (err1, results1) => {
        if (err1) {
            console.error('오류 ' + err1.message);
            res.json({ success: false, message: '박스 콘텐츠 조회 실패' });
        } else {
            // box_content에 데이터가 하나 이상 존재하면 box 테이블 업데이트
            if (results1.length > 0) {
                db.query(updateQuery, [boxId], (err2, results2) => {
                    if (err2) {
                        console.error('오류 ' + err2.message);
                        res.json({ success: false, message: '마감여부 업데이트 실패' });
                    } else {
                        res.redirect('/work/picking1');
                        // res.json({ success: true, message: '마감여부 1로 변경 성공' });
                    }
                });
            } else {
                res.json({ success: false, message: '상자에 상품을 1개 이상 담아야 마감할 수 있습니다.' });
            }
        }
    });
});


module.exports = router;
