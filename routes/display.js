const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/display1', (req, res) => {
  if (req.user) {
    if (req.user.is_admin === 0) {
      if (req.user.work_access == '진열' || req.user.work_access === 'ALL') {
        res.render('work_display1.ejs', { user: req.user })
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

router.get('/productCheck/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM product WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('데이터 검색 오류: ' + err.message);
      res.json({ success: false, message: '데이터 검색 실패' });
    } else {
      if (results.length > 0) {
        if (results[0].stock > 0) {
          res.json({ success: true, message: '진열할 수 있는 재고 수량 확인' });
        } else {
          res.json({ success: false, message: '진열할 재고가 부족합니다.' });
        }
      } else {
        res.json({ success: false, message: '일치하는 상품을 찾을 수 없습니다.' });
      }
    }
  });
});

router.get('/display2', (req, res) => {

  if (req.user) {
    if (req.user.is_admin === 0) {
      if (req.user.work_access == '진열' || req.user.work_access === 'ALL') {
        const productId = req.query.productId;
        console.log(productId)

        db.query('SELECT * FROM product WHERE id = ?', [productId], (error, results) => {
          if (error) {
            console.error(error);
            res.status(500).send('데이터베이스 오류');
          } else {
            if (results.length > 0) {
              console.log(results);
              res.render('work_display2.ejs', { user: req.user, productId: productId, product: results });
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

router.get('/productShelfCheck/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM product_shelf WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('데이터 검색 오류: ' + err.message);
      res.json({ success: false, message: '데이터 검색 실패' });
    } else {
      if (results.length > 0) {
        res.json({ success: true, message: '일치하는 상품진열대 확인' });
      } else {
        res.json({ success: false, message: '입력한 상품 진열대 번호를 찾을 수 없습니다.' });
      }
    }
  });
});

router.get('/display3', (req, res) => {

  if (req.user) {
    if (req.user.is_admin === 0) {
      if (req.user.work_access == '진열' || req.user.work_access === 'ALL') {
        const productId = req.query.productId;
        const productShelfId = req.query.productShelfId;
        console.log(productId)

        db.query('SELECT * FROM product WHERE id = ?', [productId], (error, results) => {
          if (error) {
            console.error(error);
            res.status(500).send('데이터베이스 오류');
          } else {
            if (results.length > 0) {
              res.render('work_display3.ejs', { user: req.user, productId: productId, productShelfId: productShelfId, product: results });
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


router.post('/finish-display', (req, res) => {
  const productId = req.body.productId;
  const productShelfId = req.body.productShelfId;
  const displayQuantity = req.body.displayQuantity;
  console.log(req.body);

  const checkQuery = 'SELECT stock FROM product where id = ?';
  const subtractQuery = 'UPDATE product SET stock = stock - ? WHERE id = ?';
  const plusQuery = 'UPDATE product SET displayed_stock = COALESCE(displayed_stock, 0) + ? WHERE id = ?';
  const locationUpdateQuery = 'UPDATE product SET location = ? WHERE id = ?';

  // 트랜잭션 시작
  db.beginTransaction((err) => {
    if (err) {
      console.error('트랜잭션 시작 오류: ' + err.message);
      res.json({ success: false, message: '트랜잭션 시작 오류' });
      return;
    }

    // 1: (입력된 수량 <= 재고) 확인
    db.query(checkQuery, [productId], (err1, results1) => {
      if (err1) {
        console.error('데이터 오류1: ' + err1.message);
        db.rollback(() => {
          res.json({ success: false, message: '데이터 오류1' });
        });
      } else {
        if (displayQuantity <= results1[0].stock) {
          // 2: 재고 수량 감소
          db.query(subtractQuery, [displayQuantity, productId], (err2, results2) => {
            if (err2) {
              console.error('데이터 오류2:' + err2.message);
              db.rollback(() => {
                res.json({ success: false, message: '데이터 오류2' });
              });
            } else {
              // 3: 진열된 재고 수량 증가
              db.query(plusQuery, [displayQuantity, productId], (err3, results3) => {
                if (err3) {
                  console.error('데이터 오류3:' + err3.message);
                  db.rollback(() => {
                    res.json({ success: false, message: '데이터 오류3' });
                  });
                } else {
                  // 4: 진열위치 업데이트
                  db.query(locationUpdateQuery, [productShelfId, productId], (err4, results4) => {
                    if (err4) {
                      console.error('데이터 오류4:' + err4.message);
                      db.rollback(() => {
                        res.json({ success: false, message: '데이터 오류4' });
                      });
                    } else {
                      // 성공: 커밋
                      db.commit((commitErr) => {
                        if (commitErr) {
                          console.error('트랜잭션 커밋 오류: ' + commitErr.message);
                          res.json({ success: false, message: '트랜잭션 커밋 오류' });
                        } else {
                          res.json({ success: true, message: '진열이 완료되었습니다.' });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        } else if (displayQuantity > results1[0].stock) {
          // 재고 부족
          res.json({ success: false, message: '입력한 값이 재고 수량을 초과하였습니다.' });
        } else {
          // 기타 오류
          console.log('Debug Info:', displayQuantity, results1[0]);
          res.json({ success: false, message: '데이터 오류4' });
        }
      }
    });
  });
});

module.exports = router;
