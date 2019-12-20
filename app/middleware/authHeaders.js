const jwt = require('jsonwebtoken')
const {jwtString} = require('../config/app')

module.exports = (req,res,next)=>{
    const authHeader = req.get('Authorization');
    if(!authHeader){
        res.status(401).json({message: "Token not provided!"})
    }
    const token = authHeader.replace('Bearer ','')
    try{
        jwt.verify(token,jwtString)
    }catch (e) {
        if(e instanceof jwt.JsonWebTokenError){
            res.status(401).json({message: 'Invalid token'})
        }
    }
    next()
}