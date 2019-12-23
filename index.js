const config = require('./app/config/app'),
    express = require('express'),
    bodyParser = require('body-parser'),
    db = require('./app/controllers/db'), // db
    app = express(),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    authHelper = require('./app/helpers/authHelpers'),
    multer = require('multer'),
    fileStorage = multer.diskStorage({
        // config to multer plugin
        destination: (req, file, cb) => {
            cb(null, config.uploadsFolder) //folder to upload a file
        },
        filename: (req, file, cb) => {
            cb(null, new Date().toISOString() + file.originalname) // add date to file name
        }
    }),
    upload = multer({storage: fileStorage}), //add config
    fs = require('fs');
app.use(bodyParser.json()); // add middelware to barse a json querys
app.use((req, res, next) => {
    // middelware to add header CROS to all querys
    res.append('Access-Control-Allow-Origin', ['*']); //All site/address allow
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'); // That method we allow
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
const authMiddelware = require('./app/middleware/authHeaders'); // add auth middelware


const reg_tel = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/; // regexp to check the phone
const reg_email = /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/i; //regexp to check the email

const updateToken = (userId) => {
    // funxtion to update the token
    const accessToken = authHelper.genAccessToken(userId) // generate a access token
    const refreshToken = authHelper.genRefreshToken() //generate refresh token
    const payload = jwt.verify(refreshToken, config.jwtString) //verify token and
    const refresh = authHelper.refreshDB(payload.id, userId) //refresh in db
    // console.log('refresh',refresh)
    return {accessToken, refreshToken} //back
}

const refreshToken = async (req, res) => {
    const {refreshToken} = req.body
    let payload;
    try {
        payload = jwt.verify(refreshToken, config.jwtString) // verify token
        console.log('payload', payload)
        if (payload.type !== 'refresh') {
            res.status(400).json({message: 'Invalid token'})
            return
        } else if (payload.type === 'refresh') {
            // if token refresh add new info in db
            const tokens = await db.findTokenByRefreshTokenId(payload.id)
            // console.log('tokens',tokens)
            const upd = updateToken(payload.id)
            // update token and generate and sending to user
            res.status(200).json(upd)
            return
        }
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            // check if token expired time
            res.status(400).json({message: 'Expired time'})
            return
        } else if (e instanceof jwt.JsonWebTokenError) {
            // check if token invalid time
            res.status(400).json({message: 'Token error Invalid token'})
            return
        }
    }
    const tokens = db.findTokenByUserId(payload.id)
    if (tokens) {
        return updateToken(payload.id)
    } else {
        res.status(400).json({message: 'No token found'})
    }
}
app.get('/logout',authMiddelware,async (req,res)=>{
    const {refreshToken} = req.body
    const payload = jwt.verify(refreshToken,config.jwtString)
    // get info by token delete in db
    const info = await db.deleteTokenByRefreshId(payload.id)
    if(info!=undefined){
        // JWT Нельзя отменить у него в приципе нет такого функционала
        // но можно отправить клиенту невалидный JWT
        res.cookie('accessToken','deleted') // set new cookie info by accessToken
        res.cookie('refreshToken','deleted') // set new cookie info by refreshToken
        res.status(200).json({message: 'Logout'}) //send message logout
    }else{
        res.status(500).json({message: 'Problem with server'})
    }
})

app.post('/signin', async (req, res) => {
    const {id, password} = req.body
    if (reg_email.test(id) || reg_tel.test(id)) {
        //check ID info by phone regexp and email
        const user = await db.findUserById(id) //find user in db
        // console.log('user',user)
        if (user) {
            const salt = user.salt //get the salt of password
            const passhash = user.passhash //get password hash
            const hash = bcrypt.hashSync(password, salt);
            if (passhash === hash) { //checking if password valid
                const {accessToken, refreshToken} = updateToken(id) //generate a token
                // console.log('accessToken',accessToken,'refreshToken',refreshToken)
                res.status(200).json({accessToken, refreshToken}) // sendig to user new token and refresh token
            } else {
                res.status(401).json({message: 'Password not correct'}) //message ti password not correct
            }
        } else {
            res.status(401).json({message: 'No ID in DB'}) // If no this user in DB
        }
    } else {
        res.status(401).json({message: 'ID not correct'})  // if email not email and phone not phone check
    }
})
app.post('/signin/new_token', async (req, res) => {
    await refreshToken(req, res) // refresh the token
    // if(refToken){
    //     res.status(200).json({message: 'Token refresh'})
    // }else{
    //     res.status(500).json({message: 'Somthing Wrong'})
    // }
})

app.post('/signup', (req, res) => {

    const {id, password} = req.body // get info
    if (password.length <= 8) { //checking password length
        res.status(400).json({message: 'Password is small'})
    }
    //generate pass hash below
    bcrypt.genSalt(config.saltRounds, (err, salt) => {
        if (err) throw err
        bcrypt.hash(password, salt, async (err, hash) => {
            if (reg_tel.test(id) || reg_email.test(id)) { // checking email like email and phone like phone
                try {
                    const user = await db.findUserById(id) //check user exist
                    if (user === undefined) {
                        // console.log('user',user)
                        const AddedUser = await db.insertUser({userId: id, passhash: hash, salt}) //add USER to DB
                        // console.log('AddedUser',AddedUser)
                        const {accessToken, refreshToken} = updateToken(id) //gererate a token
                        if (AddedUser.insertId != null) {
                            res.status(200).json({message: 'User added! Please login!',accessToken,refreshToken}) //send token and info register
                        }
                    } else {
                        res.status(302).json({message: 'DB have user for this email! Please login'}) //if user exist
                    }
                } catch (e) {
                    res.status(302).json({message: e.message}) //somthing wrong
                }

            } else {
                res.status(400).json({message: 'ID not correct'}) // if email or phone not a like email or phone
            }
        });
    })

})

app.get('/info', authMiddelware, async (req, res) => {
    const {refreshToken} = req.body // refresh token info
    const payload = jwt.verify(refreshToken,config.jwtString) // check verify
    const userId = await db.findTokenByRefreshTokenId(payload.id) // find token on DB and get user ID info
    if(userId!=undefined||userId!=null){
       res.status(200).json({userId: userId.userId}) //send the info
    }else{
        res.status(401).json({message: 'You can`t be here, Login!'})
    }

})

app.post('/file/upload',authMiddelware, upload.single('uploadFile'), async (req, res) => {
    const file = req.file //get file info
    //add file info in db below
    const upFile = await db.fileUpload(file.originalname, file.originalname.split('.').pop(), file.mimetype, file.size, file.destination, file.filename)
    if (upFile) {
        res.status(200).json({message: 'File upload and added to DB'})
    }
})
app.get('/file/list/',authMiddelware,async (req,res)=>{
    let {list_size,page} = req.body // get list size and page
    if(list_size==undefined||list_size==null){list_size = 10} //if list size not found assign a value of 10
    if(page==undefined||page==null){page = 1}//if page not found assign a value of 1
    const data = await db.fileList(list_size,page) //get file list
    if(data!=undefined){
        res.status(200).json(data) //sending file list
    }else{
        res.status(404).json({message: 'Somthing wrong'}) // can't find the data
    }
    // console.log(list_size,page)
})
app.get('/file/:id',authMiddelware, async (req, res) => {
    // get file info by id
    const file = await db.getFileInfoById(req.params.id)
    if (file != undefined) {
        res.status(200).json(file) //sending the info
    } else {
        res.status(404).json({message: 'File not found'}) //if file not found
    }

})
app.delete('/file/delete/:id',authMiddelware, async (req, res) => {
    const fileInfo = await db.getFileInfoById(req.params.id) //get file info
    if (fileInfo != undefined) {
        fs.unlink(fileInfo.destination + fileInfo.filename, async (err) => { //delete file in system
            if (err) res.status(404).json({message: 'File not found'});
            try {
                const dbFile = await db.deleteFileById(fileInfo.id)
                res.status(200).json({message: "File remove"}) // message if file remove
            } catch (e) {
                res.status(500).json({message: "Can`t remove File"}) // message if file can't remove
            }
        });
    } else {
        res.status(404).json({message: 'File not found'}) // message if file can't find
    }

})
app.get('/file/download/:id',authMiddelware, async (req, res) => {
    //get file info
    const fileInfo = await db.getFileInfoById(req.params.id)
    if (fileInfo != undefined) {
        const url = (fileInfo.destination + fileInfo.filename).substr(1)
        res.sendFile(__dirname+url) // sending file to user
    } else {
        res.status(404).json({message: 'File not found'}) // message if file can't find
    }
})
app.put('/file/update/:id',authMiddelware, upload.single('updateFile'), async (req, res) => {
    const file = req.file //get file info
    const fileInfo = await db.getFileInfoById(req.params.id) //get old file id
    if (fileInfo != undefined) {
        // console.log(fileInfo)
        fs.unlink(fileInfo.destination + fileInfo.filename, async (err) => {// delete old file in system
            if (err) res.status(404).json({message: 'File not found'});
            try {
                const dbFile = await db.deleteFileById(fileInfo.id) //delete file in db
                if(dbFile){
                    //add new file info with old id to db
                    const upFile = await db.fileUpdate(file.originalname, file.originalname.split('.').pop(), file.mimetype, file.size, file.destination, file.filename, req.params.id)
                    if (upFile) {
                        res.status(200).json({message: 'File update and added to DB'}) //messeage success add
                    }
                }else{
                    res.status(500).json({message: "Can`t update File"}) //message if can't update a DB
                }
            } catch (e) {
                res.status(500).json({message: "Can`t update File"})//message if can't update a DB
            }
        });
    } else {
        res.status(404).json({message: 'File not found'})//message if can't find a file
    }

})
app.get('/latency',authMiddelware,(req,res)=>{
    // this routes exist in the job but no description
    ////todo Что то дописать сбда так как по даннму заданию тут пусто
})

app.listen(config.appPort, () => { //run the server on port like a config/app.js{appPort} 3333
    console.log(`server start on localhost:${config.appPort} port`)
})