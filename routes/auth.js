const express = require('express');
const router = express.Router();
const passport = require('passport');
const db = require('../db');
const bcrypt = require('bcrypt')


router.get('/register', (req, res) => {
    res.render('register.ejs')
})

router.post('/register', async (req, res) => {
  console.log(req.body);
  const { userType, realname, username, password, password_confirm } = req.body;

  if (!userType || !realname || !username || !password || !password_confirm) {
    res.status(400).send('모든 필드를 입력해야 합니다.');
    return;
  }

  if (password !== password_confirm) {
    res.status(400).send('비밀번호가 일치하지 않습니다.');
    return;
  }

  let hashpwd = await bcrypt.hash(req.body.password, 10) // 비밀번호 해시

  // 중복된 아이디를 확인
  db.query('SELECT * FROM user WHERE login_id = ?', [username], (err, rows) => {
    if (err) {
      res.status(500).send('회원가입 실패');
    } else if (rows.length > 0) {
      res.status(400).send('이미 존재하는 아이디입니다.');
    } else {
      // 중복되는 아이디가 없을 때 데이터베이스에 삽입 작업 수행
      db.query(
        'INSERT INTO user (name, login_id, password, is_admin) VALUES (?, ?, ?, ?)',
        [realname, username, hashpwd, userType],
        (err, result) => {
          if (err) {
            res.status(500).send('회원가입 실패');
          } else {
            res.redirect('/login')
          }
        }
      );
    }
  });
});

router.get('/login', (req, res) => {
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
      res.render('login.ejs'); 
    }
  });
  
  router.post('/login', async (req, res, next) => {
    passport.authenticate('local', async (error, user, info)=>{
  
      if(error) return res.status(500).json(error)
      if(!user) return res.status(401).json(info.message)
  
      req.logIn(user, (err)=>{
        if(err) return next(err)
          if(user.is_admin === 0){
            res.redirect('/work')
          }
          else if(user.is_admin === 1){
            res.redirect('/admin')
          }
          else {
            res.redirect('/default')
          }
      })
  
    })(req, res, next)
  })
  
  router.get('/logout', (req, res) => {
    req.logout(function(e) {
      if (e) {
        // 로그아웃 중에 오류가 발생했을 때 처리
        console.error(e);
      }
      res.redirect('/login');
    });
  });

  module.exports = router;
