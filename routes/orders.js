const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/orders', (req, res) => {
  if (req.user && req.user.is_admin === 1) {
    db.query('SELECT * FROM orders', (err, results) => {
      if (err) {
        console.error('주문 데이터 가져오기 오류: ' + err.message);
        res.status(500).send('서버 오류');
      } else {
        res.render('admin_orders.ejs', { orders: results, user: req.user });
      }
    });
  } else if (req.user && req.user.is_admin === 0) {
    res.status(500).send('관리자로 로그인하세요.');
  } else {
    res.redirect('/login');
  }
});

router.get('/orders/:id', (req, res) => {
  const order_id = req.params.id;

  const query = `
  SELECT
    o.id AS order_id,
    o.shipping_address,
    od.orderdetail_id,
    od.product_id,
    od.quantity,
    od.picking_flag,
    od.picking_worker_id,
    od.rebin_flag,
    od.rebin_worker_id,
    od.packing_flag,
    od.packing_worker_id,
    p.name AS product_name,
    p.price AS product_price,
    p.location
  FROM
    orders o
  JOIN
    order_detail od ON o.id = od.order_id
  JOIN
    product p ON od.product_id = p.id
  WHERE
    order_id = ?;  
`;


  if (req.user && req.user.is_admin === 1) {
    db.query(query, [order_id], (err, results) => {
      if (err) {
        console.error('주문 상세 가져오기 오류: ' + err.message);
        res.status(500).send('서버 오류');
      } else {
        console.log(results)
        res.render('admin_orderdetail.ejs', { orderDetails: results, user: req.user });
      }
    });
  } else if (req.user && req.user.is_admin === 0) {
    res.status(500).send('관리자로 로그인하세요.');
  } else {
    res.redirect('/login');
  }
});

module.exports = router;
