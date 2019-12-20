module.exports = {
    db:{
        host: 'localhost',
        port: '3306',
        username: 'root',
        password: 'pWNMof4TZaQUWRt2hsRPpL8a7GyPfy',
        database: 'restapi',
        sock : '/Applications/MAMP/tmp/mysql/mysql.sock'
    },
    appPort: 3333,
    saltRounds: 15,
    jwtString: 'All is encrypted',
    jwtToken:{
        access: {
            type: 'access',
            expiresIn: '10m'
        },
        refresh: {
            type: 'refresh',
            expiresIn: '12m'
        }
    },
    uploadsFolder: './uploads/'
}