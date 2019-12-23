// this config file from app
module.exports = {
    db:{
        host: 'localhost', // db host name
        port: '3306', //db port number
        username: 'root', // db user name
        password: 'pWNMof4TZaQUWRt2hsRPpL8a7GyPfy', //db password
        database: 'restapi', // db name
        sock : '/Applications/MAMP/tmp/mysql/mysql.sock' // sock file path
    },
    appPort: 3333, // port of rest api server
    saltRounds: 15, // passsword salt lenght
    jwtString: 'All is encrypted', //jwt secret string to encode the jwt
    jwtToken:{
        access: {
            type: 'access', // type of token
            expiresIn: '10m' // time to expires of access token
        },
        refresh: {
            type: 'refresh', // type of token
            expiresIn: '12m' // time to expires of refresh token
        }
    },
    uploadsFolder: './uploads/' //file upload folder
}