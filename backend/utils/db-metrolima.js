require('dotenv').config()
const mysql = require('mysql')


const pool = mysql.createPool({
    connectionLimit: 5,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password : process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})


module.exports = pool