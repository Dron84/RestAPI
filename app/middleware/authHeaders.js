const jwt = require('jsonwebtoken')
const {jwtString} = require('../config/app')

module.exports = (req,res,next)=>{
    const authHeader = req.get('Authorization'); // get  auth type
    if(!authHeader){
        res.status(401).json({message: "Token not provided!"}) // show message if type not allow
    }
    const token = authHeader.replace('Bearer ','')
    try{
        jwt.verify(token,jwtString) // check token to valid
    }catch (e) {
        if(e instanceof jwt.JsonWebTokenError){
            res.status(401).json({message: 'Invalid token'}) // message if invalid token
        }
    }
    next()
}