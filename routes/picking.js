const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/picking1', (req, res) => {
    if (req.user) {
        if (req.user.is_admin === 0) {
            if (req.user.work_access == '집품' || req.user.work_access === 'ALL') {
                res.render('picking1.ejs', { user: req.user })
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
        if (req.user.is_admin === 0) {
            if (req.user.work_access == '집품' || req.user.work_access === 'ALL') {
                const boxId = req.query.boxId;
                console.log(boxId)

                const query = `
                SELECT 
                order_detail.orderdetail_id AS orderdetail_id, 
                order_detail.quantity, 
                product.id AS productid, 
                product.name, 
                product.location, 
                product.image 
                FROM order_detail 
                JOIN product ON order_detail.product_id = product.id 
                WHERE order_detail.picking_flag = 0 AND order_detail.packing_type = ? 
                LIMIT 1;
                `

                db.query(query, [req.user.picking_access], (error, results) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send('데이터베이스 오류');
                    } else {
                        if (results.length > 0) {
                            console.log(results);
                            res.render('picking2.ejs', { user: req.user, boxId: boxId, orderDetail: results });
                        } else {
                            performBoxFinish(boxId, res);
                        }
                    }
                });

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

router.post('/boxinsert', (req, res) => {
    const boxId = req.body.boxId; // boxId를 요청 본문에서 가져옴
    const orderDetail = JSON.parse(req.body.orderDetail);
    const orderDetailId = orderDetail[0].orderdetail_id.toString();
    const productId = orderDetail[0].productid.toString();
    const pickingCount = orderDetail[0].quantity.toString();
    const userId = req.user.login_id;

    const insertQuery = `INSERT INTO box_content (box_id, orderdetail_id, rebin_rack_id) VALUES (?, ?, NULL)`;
    const updateQuery = `UPDATE order_detail SET picking_flag = 1, picking_worker_id = ? WHERE orderdetail_id = ?`;
    const updateQuery2 = `UPDATE product SET displayed_stock = displayed_stock - ? WHERE id = ?`
    const updateQuery3 = `UPDATE box SET packing_type = ? WHERE box_id = ?`

    db.beginTransaction((err) => {
        if (err) {
            console.error(err);
            res.status(500).send('데이터베이스 트랜잭션 오류');
            return;
        }
        // 1: 토트 내용물 넣기
        db.query(insertQuery, [boxId, orderDetailId], (insertError) => {
            if (insertError) {
                db.rollback(() => {
                    console.error(insertError);
                    res.status(500).send('데이터베이스 오류');
                });
            } else {
                // 2: 집품 여부 1로 업데이트, user id 받아와서 picking_worker_id에 업데이트
                db.query(updateQuery, [userId, orderDetailId], (updateError) => {
                    if (updateError) {
                        db.rollback(() => {
                            console.error(updateError);
                            res.status(500).send('데이터베이스 오류');
                        });

                    } else {
                        // 3: 상품 진열 수량 - 집품 수량
                        db.query(updateQuery2, [pickingCount, productId], (updateError2) => {
                            if (updateError2) {
                                db.rollback(() => {
                                    console.error(updateError2);
                                    res.status(500).send('데이터베이스 오류');
                                });
                            } else {
                                // 4: 박스 유형을 유저 packing_access에 맞게 업데이트
                                db.query(updateQuery3, [req.user.picking_access, boxId], (updateError3) => {
                                    if (updateError3) {
                                        db.rollback(() => {
                                            console.error(updateError3);
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
                                })

                            }
                        })
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
                res.redirect('/work/picking1?success=false&message=상자에 상품을 1개 이상 담아야 마감할 수 있습니다.');
            }
        }
    });
});

// picking2에서 주문 데이터가 없을 때 토트마감처리를 위한 함수
function performBoxFinish(boxId, res) {
    const checkQuery = 'SELECT * FROM box_content WHERE box_id = ?';
    const updateQuery = 'UPDATE box SET deadline_status = 1 WHERE box_id = ?';

    db.query(checkQuery, [boxId], (err1, results1) => {
        if (err1) {
            console.error('오류 ' + err1.message);
            res.json({ success: false, message: '박스 콘텐츠 조회 실패' });
        } else {
            if (results1.length > 0) {
                db.query(updateQuery, [boxId], (err2, results2) => {
                    if (err2) {
                        console.error('오류 ' + err2.message);
                        res.json({ success: false, message: '마감여부 업데이트 실패' });
                    } else {
                        res.redirect('/work/picking1');
                    }
                });
            } else {
                res.json({ success: false, message: '처리할 주문이 없습니다.' }); // 실제 message: 마감하려면 1개 이상의 주문이 적재되어야 합니다. 유저 고려 변경
            }
        }
    });
}

module.exports = router;
