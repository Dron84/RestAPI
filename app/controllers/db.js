const config = require('../config/app').db
const mysql = require('mysql')

const con = mysql.createConnection({
    host: config.host,
    user: config.username,
    password: config.password,
    database: config.database,
    socketPath: config.sock
});
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to DB!");
    // create a all tables if not exist below
    //create table from users
    con.query('CREATE TABLE IF NOT EXISTS `users` (\n' +
        '  `userId` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  `passhash` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  `salt` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  `index` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
        '  PRIMARY KEY (`index`)\n' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8;', function (err, result) {
        if (err) throw err;
        console.log("Check whether there is a table users if not then create");
    });
    //create table from tokens
    con.query('CREATE TABLE IF NOT EXISTS `tokens` (\n' +
        '  `tokenId` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  `userId` varchar(255) NOT NULL,\n' +
        '  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
        '  PRIMARY KEY (`id`)\n' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8;', function (err, result) {
        if (err) throw err;
        console.log("Check whether there is a table tokens if not then create");
    })
   //create table from files
    con.query('CREATE TABLE IF NOT EXISTS `files` (\n' +
        '  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n' +
        '  `name` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  `ext` varchar(10) NOT NULL DEFAULT \'\',\n' +
        '  `mime` varchar(40) NOT NULL DEFAULT \'\',\n' +
        '  `size` int(11) NOT NULL,\n' +
        '  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
        '  `destination` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  `filename` varchar(255) NOT NULL DEFAULT \'\',\n' +
        '  PRIMARY KEY (`id`)\n' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8;', function (err, result) {
        if (err) throw err;
        console.log("Check whether there is a table files if not then create")
    })

});

const findAllUsers = ()=> new Promise(resolve => {
    // find all user in DB
    con.query('SELECT userId FROM users', (err,res)=>{
        if(err) throw err
        resolve(res)
    })
})
const findUserById = (userId)=> new Promise(resolve => {
    //find user by id
    con.query(`SELECT * FROM users WHERE userId='${userId}'`, (err,res)=>{
        if(err) throw err
        resolve(res[0])
    })
})
const deleteUserById = (userId)=> new Promise(resolve => {
    //delete user by id
    con.query(`DELETE FROM users WHERE userId='${userId}'`, (err,res)=>{
        if(err) throw err
        resolve(res)
    })
})
const insertUser = (AllField)=> new Promise(resolve => {
    // add new user
    con.query(`INSERT INTO users (userId,passhash,salt) VALUES ('${AllField.userId}','${AllField.passhash}','${AllField.salt}')`,(err,res)=>{
        if(err) throw err
        resolve(res)
    })
})
const findTokenByUserId = (userId)=> new Promise(resolve => {
    //find token by user id
    con.query(`SELECT * FROM tokens WHERE userId='${userId}'`,(err,res)=>{
        if(err) throw err
        resolve(res[0])
    })
})
const findTokenByRefreshTokenId = (refreshTokenId)=> new Promise(resolve => {
    //find token by refresh token id
    con.query(`SELECT * FROM tokens WHERE tokenId='${refreshTokenId}'`,(err,res)=>{
        if(err) throw err
        resolve(res[0])
    })
})
const deleteTokenByUserId = (userId) => new Promise(resolve => {
    //delete token
    con.query(`DELETE FROM tokens WHERE userId='${userId}'`,(err,res)=>{
        if (err) throw err
        resolve(res)
    })
})
const insertToken = (tokenId,userId) => new Promise(resolve => {
    //insert token
    con.query(`INSERT INTO tokens (tokenId,userId) VALUES ("${tokenId}","${userId}")`,(err,res)=> {
        if (err) throw err
        resolve(res)
    })
})
const deleteTokenByRefreshId = (refreshId) => new Promise(resolve => {
    //delet token by refresh id
    con.query(`DELETE FROM tokens WHERE tokenId = '${refreshId}'`,(err,res)=>{
        if(err) throw err;
        resolve(res)
    })
})
const fileUpload = (name,ext,mime,size,destination,filename) => new Promise(resolve => {
    //insert file info in db
    con.query(`INSERT INTO files (name,ext,mime,size,destination,filename) VALUES ('${name}','${ext}','${mime}','${size}','${destination}','${filename}')`, (err,res)=>{
        if (err) throw err
        resolve(res)
    } )
})
const fileUpdate = (name,ext,mime,size,destination,filename,id) => new Promise(resolve => {
    /// insert file info in DB with id to update the info data
    con.query(`INSERT INTO files (name,ext,mime,size,destination,filename,id) VALUES ('${name}','${ext}','${mime}','${size}','${destination}','${filename}','${id}')`, (err,res)=>{
        if (err) throw err
        resolve(res)
    } )
})
const getFileInfoById = (id) => new Promise(resolve => {
    //get file info by file id
    con.query(`SELECT * FROM files WHERE id='${id}'`,(err,res)=>{
        if (err) throw err
        resolve(res[0])
    })
})
const deleteFileById = (id) => new Promise(resolve => {
    //delete file from db
    con.query(`DELETE FROM files WHERE id='${id}'`,(err,res)=>{
        if (err) throw err
        resolve(res)
    })
})
const fileList = (listSize,page)=>new Promise(resolve => {
    // get all file list with iteration
    const offset = ((page-1) * listSize)
    con.query(`SELECT * FROM files LIMIT ${listSize} OFFSET ${offset}`,(err,res)=>{
        if (err) throw err
        resolve(res)
    })
})


module.exports = {
    findAllUsers, // not use but need in real world
    findUserById,
    deleteUserById, // not use but need in real world
    insertUser,
    findTokenByUserId,
    deleteTokenByUserId,
    insertToken,
    findTokenByRefreshTokenId,
    fileUpload,
    getFileInfoById,
    deleteFileById,
    deleteTokenByRefreshId,
    fileUpdate,
    fileList
}