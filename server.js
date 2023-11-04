const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const methodOverride = require('method-override')
const db = require('./db');

const productRoutes = require('./routes/product');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const boxRoutes = require('./routes/box');
const boxcontentRoutes = require('./routes/box_content');
const workerControlRoutes = require('./routes/worker_control');


require('dotenv').config() // 환경변수 라이브러리

app.use(methodOverride('_method')) 
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 에러:', err);
  } else {
    console.log('MySQL 연결 성공');
    app.listen(process.env.PORT, () => {
      console.log('http://localhost:8080 에서 서버 실행중')
    })
  }
});

// passport 라이브러리 셋팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
var MySQLStore = require('express-mysql-session')(session);

app.use(passport.initialize())
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 60 * 60 * 1000}, //세션 1시간 유지
  store : new MySQLStore({ // 세션 db에 저장
    host:'localhost',
    port: 3306,
    user:'root',
    password:process.env.DB_PASSWORD,
    database:'fulfillment'
  })
}))

app.use(passport.session()) 

// Passport 초기화 및 설정
passport.use(new LocalStrategy(async (username, password, done) => {
  // 사용자 인증 및 비밀번호 확인을 수행
  db.query('SELECT * FROM user WHERE login_id = ?', [username], async (err, rows) => {
    if (err) return done(err);

    if (!rows.length) {
      return done(null, false, { message: 'Incorrect ID.' });
    }

    const user = rows[0];

    // bcrypt.compare를 사용하여 비밀번호 확인
    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    } catch (error) {
      return done(error);
    }
  });
}));

passport.serializeUser((user, done) => {
  console.log(user)
  process.nextTick(() => {
    // done(null, { user_id: user._id })
    done(null, user.user_id)

  })
})

passport.deserializeUser(async (user, done) => {
  
  const query = 'SELECT * FROM user WHERE user_id = ?';
  db.query(query, [user], (err, rows) => {
    if (err) return done(err);
    if (rows.length === 0) return done(null, false);
    const user = rows[0];
    delete user.password;
    done(null, user);
  });
})




app.use('/', productRoutes); 
app.use('/', authRoutes); 
app.use('/admin', ordersRoutes); 
app.use('/admin', boxRoutes); 
app.use('/admin', boxcontentRoutes); 
app.use('/admin', workerControlRoutes); 





app.get('/', (req, res) => {
  if (req.user) {
    if(req.user.is_admin === 0){
      res.redirect('/work')
    }
    else if(req.user.is_admin === 1){
      res.redirect('/admin')
    }
    else {
      res.redirect('/default')
    }
  } else {
    res.redirect('/login'); 
  }
})

app.get('/admin', (req, res) => {
  if (req.user) {
    if(req.user.is_admin === 1){
      db.query('SELECT * FROM product', (err, results) => {
        if (err) {
          console.error('상품 데이터 가져오기 오류: ' + err.message);
          res.status(500).send('서버 오류');
        } else {
          res.render('index_admin.ejs', { products: results, user : req.user });
        }
      });
    }
    else if(req.user.is_admin === 0){
      res.status(500).send('관리자로 로그인하세요.');
    }
    else {
      res.redirect('/default')
    }
  } 
  else {
    res.redirect('/login');
  }
})

app.get('/admin/mypage', (req, res) => {
  if (req.user) {
    if(req.user.is_admin === 1){
      res.render('admin_mypage.ejs', {user : req.user})
    }
    else if(req.user.is_admin === 0){
      res.status(500).send('관리자로 로그인하세요.');
    }
    else {
      res.redirect('/default')
    }
  } 
  else {
    res.redirect('/login');
  }
})

app.get('/admin/chart', (req, res) => {
  if (req.user) {
    if(req.user.is_admin === 1){
      res.render('admin_chart.ejs', {user : req.user})
    }
    else if(req.user.is_admin === 0){
      res.status(500).send('관리자로 로그인하세요.');
    }
    else {
      res.redirect('/default')
    }
  } 
  else {
    res.redirect('/login');
  }
})

app.get('/work', (req, res) => {
  if (req.user) {
    if(req.user.is_admin === 0){
      res.render('index_work.ejs', {user : req.user})
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

app.get('/work/mypage', (req, res) => {
  if (req.user) {
    if(req.user.is_admin === 0){
      res.render('work_mypage.ejs', {user : req.user})
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


app.get('/picking1', (req, res) => {
  res.render('picking1.ejs')
})

app.get('/picking2', (req, res) => {
  res.render('picking2.ejs')
})

app.get('/packing1', (req, res) => {
  res.render('packing1.ejs')
})

app.get('/rebin', (req, res) => {
  res.render('rebin.ejs')
})

app.get('/users', (req, res) => {
  const query = 'SELECT * FROM user';
  db.query(query, (err, results) => {
    if (err) {
      console.error('데이터베이스 쿼리 에러:', err);
      res.status(500).json({ error: '데이터베이스 오류' });
    } else {
      res.json(results);
    }
  });
});