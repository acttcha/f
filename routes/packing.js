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
                res.json({ success: false, message: '마감되지 않은 토트입니다.' });
            } else {
                res.json({ success: false, message: '마감여부 값이 올바르지 않습니다.' });
            }
        } else {
            res.json({ success: false, message: '일치하는 토트가 없습니다.' });
        }
      }
    });
});

router.get('/singlePacking2', (req, res) => {

    if (req.user) {
      if(req.user.is_admin === 0){
        if(req.user.work_access =='포장' || req.user.work_access === 'ALL'){
            const boxId = req.query.boxId;
            console.log(boxId)
            // 제약 조건 : 집품 여부1 AND 포장 여부 0 AND 상자 번호 일치하는 주문을 1개만 가져오기
            db.query('SELECT o.id AS orderid, o.quantity, o.shipping_address, p.id AS productid, p.name FROM orders o JOIN product p ON o.product_id = p.id JOIN box_content bc ON o.id = bc.order_id WHERE o.picking_flag = 1 AND o.packing_flag = 0 AND bc.box_id = ? LIMIT 1', [boxId], (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(500).send('데이터베이스 오류');
                } else {
                    if (results.length > 0) {
                        console.log(results);
                        res.render('work_singlePacking2.ejs', { user: req.user, boxId: boxId, orders: results });
                    } else {
                        res.send('포장할 상품이 없습니다.');
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

router.post('/trackingNumber', (req, res) => {
    const boxId = req.body.boxId;
    const orderId = req.body.orderId;

    // 랜덤 알파벳 생성 함수
    function generateRandomAlphaNumeric(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
        return result;
    }

    // 중복을 방지하고 랜덤 알파벳 생성
    function generateUniqueTrackingNumber() {
        const trackingNumber = generateRandomAlphaNumeric(10); // 예시: 10자리 랜덤 알파벳 및 숫자 조합

        // 데이터베이스에서 중복 확인
        const checkQuery = 'SELECT * FROM tracking_number WHERE id = ?';
        db.query(checkQuery, [trackingNumber], (err, results) => {
            if (err) {
                console.error('중복 확인 오류: ' + err.message);
                res.json({ success: false, message: '데이터 체크 실패' });
            } else {
                if (results.length === 0) {
                    // 중복이 없으면 삽입
                    const insertQuery = 'INSERT INTO tracking_number(id) VALUES (?)';
                    const insertQuery2 = 'INSERT INTO tracking_orders(tracking_number_id, order_id) VALUES (?, ?)';
                    db.query(insertQuery, [trackingNumber], (err, results2) => {
                        if (err) {
                            console.error('데이터 추가 오류: ' + err.message);
                            res.json({ success: false, message: '데이터 추가 실패' });
                        } else {
                            db.query(insertQuery2, [trackingNumber, orderId], (err, results3) => {
                                if (err) {
                                    console.error('데이터 추가 오류: ' + err.message);
                                    res.json({ success: false, message: '데이터 추가 실패' });
                                } else {
                                    res.redirect(`/work/singlePacking3?boxId=${boxId}&trackingNumber=${trackingNumber}`);
                                    // res.json({ success: true, message: '데이터 추가 성공' });
                                }
                            });
                        }
                    });
                } else {
                    // 중복이 있으면 다시 생성 시도
                    generateUniqueTrackingNumber();
                }
            }
        });
    }

    // 최초 실행
    generateUniqueTrackingNumber();
});

router.get('/singlePacking3', (req, res) => {

    if (req.user) {
      if(req.user.is_admin === 0){
        if(req.user.work_access =='포장' || req.user.work_access === 'ALL'){
            const boxId = req.query.boxId;
            const trackingNumber = req.query.trackingNumber;
            console.log(boxId)
            // 제약 조건 : 집품 여부1 AND 포장 여부 0 AND 상자 번호 일치하는 주문을 1개만 가져오기
            db.query('SELECT o.id AS orderid, o.quantity, o.shipping_address, p.id AS productid, p.name FROM orders o JOIN product p ON o.product_id = p.id JOIN box_content bc ON o.id = bc.order_id WHERE o.picking_flag = 1 AND o.packing_flag = 0 AND bc.box_id = ? LIMIT 1', [boxId], (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(500).send('데이터베이스 오류');
                } else {
                    if (results.length > 0) {
                        console.log(results);
                        res.render('work_singlePacking3.ejs', { user: req.user, boxId: boxId, orders: results, trackingNumber: trackingNumber});
                    } else {
                        res.send('포장할 상품이 없습니다.');
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

router.post('/finish-packing', (req, res) => {
    const boxId = req.body.boxId
    const orderId = req.body.orderId
  
    const query = 'UPDATE orders SET packing_flag = 1 WHERE id = ?';
    const query2 = 'DELETE FROM box_content WHERE order_id = ?';
    console.log(boxId)
    db.query(query, [orderId], (err, results) => {
      if (err) {
        console.error('데이터 수정 오류: ' + err.message);
        res.json({ success: false, message: '데이터 수정 실패' });
      } else {
        db.query(query2, [orderId], (err, results2) => {
            res.redirect(`/work/singlePacking2?boxId=${boxId}`);
        })
      }
    });
});

module.exports = router;