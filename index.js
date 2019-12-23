const config = require('./app/config/app'),
    express = require('express'),
    bodyParser = require('body-parser'),
    db = require('./app/controllers/db'),
    app = express(),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    mysql = require('mysql'),
    authHelper = require('./app/helpers/authHelpers'),
    multer = require('multer'),
    fileStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, config.uploadsFolder)
        },
        filename: (req, file, cb) => {
            cb(null, new Date().toISOString() + file.originalname)
        }
    }),
    upload = multer({storage: fileStorage}),
    fs = require('fs');
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
const authMiddelware = require('./app/middleware/authHeaders');


const reg_tel = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/;
const reg_email = /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/i;

const updateToken = (userId) => {
    const accessToken = authHelper.genAccessToken(userId)
    const refreshToken = authHelper.genRefreshToken()
    const payload = jwt.verify(refreshToken, config.jwtString)
    const refresh = authHelper.refreshDB(payload.id, userId)
    // console.log('refresh',refresh)
    return {accessToken, refreshToken}
}

const refreshToken = async (req, res) => {
    const {refreshToken} = req.body
    // console.log('refreshToken',refreshToken)
    let payload;
    try {
        payload = jwt.verify(refreshToken, config.jwtString)
        console.log('payload', payload)
        if (payload.type !== 'refresh') {
            res.status(400).json({message: 'Invalid token'})
            return
        } else if (payload.type === 'refresh') {
            const tokens = await db.findTokenByRefreshTokenId(payload.id)
            // console.log('tokens',tokens)
            const upd = updateToken(payload.id)
            res.status(200).json(upd)
            return
        }
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            res.status(400).json({message: 'Expired time'})
            return
        } else if (e instanceof jwt.JsonWebTokenError) {
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

    const info = await db.deleteTokenByRefreshId(payload.id)
    if(info!=undefined){
        // JWT Нельзя отменить у него в приципе нет такого функционала
        // но можно отправить клиенту невалидный JWT
        res.cookie('accessToken','deleted')
        res.cookie('refreshToken','deleted')
        res.status(200).json({message: 'Logout'})
    }else{
        res.status(500).json({message: 'Problem with server'})
    }
})

app.post('/signin', async (req, res) => {
    const {id, password} = req.body
    if (reg_email.test(id) || reg_tel.test(id)) {
        const user = await db.findUserById(id)
        // console.log('user',user)
        if (user) {
            const salt = user.salt
            const passhash = user.passhash
            const hash = bcrypt.hashSync(password, salt);
            if (passhash === hash) {
                const {accessToken, refreshToken} = updateToken(id)
                // console.log('accessToken',accessToken,'refreshToken',refreshToken)
                res.status(200).json({accessToken, refreshToken})
            } else {
                res.status(401).json({message: 'Password not correct'})
            }
        } else {
            res.status(401).json({message: 'No ID in DB'})
        }
    } else {
        res.status(401).json({message: 'ID not correct'})
    }
})
app.post('/signin/new_token', async (req, res) => {
    await refreshToken(req, res)
    // if(refToken){
    //     res.status(200).json({message: 'Token refresh'})
    // }else{
    //     res.status(500).json({message: 'Somthing Wrong'})
    // }
})

app.post('/signup', (req, res) => {

    const {id, password} = req.body
    if (password.length <= 8) {
        res.status(400).json({message: 'Password is small'})
    }
    bcrypt.genSalt(config.saltRounds, (err, salt) => {
        if (err) throw err
        bcrypt.hash(password, salt, async (err, hash) => {
            if (reg_tel.test(id) || reg_email.test(id)) {
                try {
                    const user = await db.findUserById(id)
                    if (user === undefined) {
                        // console.log('user',user)
                        const AddedUser = await db.insertUser({userId: id, passhash: hash, salt})
                        // console.log('AddedUser',AddedUser)
                        const {accessToken, refreshToken} = updateToken(id)
                        if (AddedUser.insertId != null) {
                            res.status(200).json({message: 'User added! Please login!',accessToken,refreshToken})
                        }
                    } else {
                        res.status(302).json({message: 'DB have user for this email! Please login'})
                    }
                } catch (e) {
                    res.status(302).json({message: 'DB down!!!'})
                }

            } else {
                res.status(400).json({message: 'ID not correct'})
            }
        });
    })

})

app.get('/info', authMiddelware, async (req, res) => {
    const {refreshToken} = req.body
    const payload = jwt.verify(refreshToken,config.jwtString)
    const userId = await db.findTokenByRefreshTokenId(payload.id)
    if(userId!=undefined||userId!=null){
       res.status(200).json({userId: userId.userId})
    }else{
        res.status(401).json({message: 'You can`t be here or Login!'})
    }

})

app.post('/file/upload',authMiddelware, upload.single('uploadFile'), async (req, res) => {
    const file = req.file
    const upFile = await db.fileUpload(file.originalname, file.originalname.split('.').pop(), file.mimetype, file.size, file.destination, file.filename)
    if (upFile) {
        res.status(200).json({message: 'File upload and added to DB'})
    }
})
app.get('/file/list/',authMiddelware,async (req,res)=>{
    let {list_size,page} = req.body
    if(list_size==undefined||list_size==null){list_size = 10}
    if(page==undefined||page==null){page = 1}
    const data = await db.fileList(list_size,page)
    if(data!=undefined){
        res.status(200).json(data)
    }else{
        res.status(404).json({message: 'Somthing wrong'})
    }
    console.log(list_size,page)
})
app.get('/file/:id',authMiddelware, async (req, res) => {
    const file = await db.getFileInfoById(req.params.id)
    if (file != undefined) {
        res.status(200).json(file)
    } else {
        res.status(404).json({message: 'File not found'})
    }

})
app.delete('/file/delete/:id',authMiddelware, async (req, res) => {
    const fileInfo = await db.getFileInfoById(req.params.id)
    if (fileInfo != undefined) {
        fs.unlink(fileInfo.destination + fileInfo.filename, async (err) => {
            if (err) res.status(404).json({message: 'File not found'});
            try {
                const dbFile = await db.deleteFileById(fileInfo.id)
                res.status(200).json({message: "File remove"})
            } catch (e) {
                res.status(500).json({message: "Can`t remove File"})
            }
        });
    } else {
        res.status(404).json({message: 'File not found'})
    }

})
app.get('/file/download/:id',authMiddelware, async (req, res) => {
    const fileInfo = await db.getFileInfoById(req.params.id)
    if (fileInfo != undefined) {
        const url = (fileInfo.destination + fileInfo.filename).substr(1)
        res.sendFile(__dirname+url)
    } else {
        res.status(404).json({message: 'File not found'})
    }
})
app.put('/file/update/:id',authMiddelware, upload.single('updateFile'), async (req, res) => {
    const file = req.file
    const fileInfo = await db.getFileInfoById(req.params.id)
    if (fileInfo != undefined) {
        console.log(fileInfo)
        fs.unlink(fileInfo.destination + fileInfo.filename, async (err) => {
            if (err) res.status(404).json({message: 'File not found'});
            try {
                const dbFile = await db.deleteFileById(fileInfo.id)
                if(dbFile){
                    const upFile = await db.fileUpdate(file.originalname, file.originalname.split('.').pop(), file.mimetype, file.size, file.destination, file.filename, req.params.id)
                    if (upFile) {
                        res.status(200).json({message: 'File update and added to DB'})
                    }
                }else{
                    res.status(500).json({message: "Can`t update File"})
                }
            } catch (e) {
                res.status(500).json({message: "Can`t update File"})
            }
        });
    } else {
        res.status(404).json({message: 'File not found'})
    }

})
app.get('/latency',authMiddelware,(req,res)=>{
    ////todo Что то дописать сбда так как по даннму заданию тут пусто
})

app.listen(config.appPort, () => {
    console.log(`server start on localhost:${config.appPort} port`)
})