const express = require('express');
const router = express.Router();
const db = require('../db');

const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = new S3Client({
  region : 'ap-northeast-2',
  credentials : {
      accessKeyId : process.env.S3_KEY,
      secretAccessKey : process.env.S3_SECRET_KEY
  }
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'fulfillment-s3',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      // cb(null, Date.now().toString())
      cb(null, 'product/' + Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
})

router.get('/admin/product', (req, res) => {
  if (req.user && req.user.is_admin === 1) {
    db.query('SELECT * FROM product', (err, results) => {
      if (err) {
        console.error('상품 데이터 가져오기 오류: ' + err.message);
        res.status(500).send('서버 오류');
      } else {
        res.render('admin_product.ejs', { products: results, user: req.user });
      }
    });
  } else if (req.user && req.user.is_admin === 0) {
    res.status(500).send('관리자로 로그인하세요.');
  } else {
    res.redirect('/login');
  }
});

router.post('/add-data', upload.single('img'), (req, res) => {
  const { id, name, price, stock, location, category} = req.body;
  console.log(req.file);
  const imageUrl = req.file.location;

  const query = 'INSERT INTO product (id, name, price, stock, location, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [id, name, price, stock, location, category, imageUrl], (err, results) => {
    if (err) {
      console.error('데이터 추가 오류: ' + err.message);
      res.json({ success: false, message: '데이터 추가 실패' });
    } else {
      res.json({ success: true, message: '데이터 추가 성공' });
    }
  });
});

router.get('/update-data/:id', (req, res) => {
  db.query('SELECT * FROM product WHERE id = ?', [req.params.id], (err, idvalue) => {
    if (err) {
      console.error('상품 데이터 가져오기 오류: ' + err.message);
      res.status(500).send('서버 오류');
    } else {
      res.send({ idvalue: idvalue });
    }
  });
});

router.put('/update-data/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, stock, location, category } = req.body;

  const query = 'UPDATE product SET name = ?, price = ?, stock = ?, location = ?, category = ? WHERE id = ?';

  db.query(query, [name, price, stock, location, category, id], (err, results) => {
    if (err) {
      console.error('데이터 수정 오류: ' + err.message);
      res.json({ success: false, message: '데이터 수정 실패' });
    } else {
      res.json({ success: true, message: '데이터 수정 성공' });
    }
  });
});

router.delete('/delete-data/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM product WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('데이터 수정 오류: ' + err.message);
      res.json({ success: false, message: '데이터 삭제 실패' });
    } else {
      res.json({ success: true, message: '데이터 삭제 성공' });
    }
  });
});

router.get('/category-data', (req, res) => {
  db.query('SELECT DISTINCT category FROM product', (err, categories) => {
    if (err) {
      console.error('카테고리 데이터 가져오기 오류: ' + err.message);
      res.status(500).send('서버 오류');
    } else {
      db.query('SELECT category, COUNT(*) AS count FROM product GROUP BY category', (err, counts) => {
        if (err) {
          console.error('카테고리 수 가져오기 오류: ' + err.message);
          res.status(500).send('서버 오류');
        } else {
          const categoryData = categories.map((category) => {
            const countData = counts.find((count) => count.category === category.category);
            return { category: category.category, count: countData ? countData.count : 0 };
          });
          res.send({ categories: categoryData });
        }
      });
    }
  });
});

module.exports = router;