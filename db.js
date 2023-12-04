require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  port: "3306",
  user: 'user',
  password: process.env.DB_PASSWORD,
  database: 'fulfillment'
});

module.exports = db; 