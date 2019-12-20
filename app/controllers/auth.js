const config = require('../config/app')
const mysql = require('mysql')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const con = mysql.createConnection({
    host: config.db.host,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
    socketPath: config.db.sock
});
const signIn = (req,res)=>{


}



module.exports = {
    signIn,

}