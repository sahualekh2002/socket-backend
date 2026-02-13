const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Mysql@123",      // your mysql password
  database: "strangerschat",
});

module.exports = db;
