require('dotenv').config();
const mysql = require('mysql2');

// 로컬 db 연결 코드
// const db = mysql.createConnection({
//   host: '127.0.0.1',
//   port: 3306,
//   user: 'user',
//   password: process.env.DB_PASSWORD,
//   database: 'fulfillment'
// });


// gcp db 연결 코드
const db = mysql.createConnection({
  host: '34.22.67.125',
  port: 3306,
  user: 'user',
  password: process.env.DB_PASSWORD,
  database: 'fulfillment'
});

module.exports = db; 

