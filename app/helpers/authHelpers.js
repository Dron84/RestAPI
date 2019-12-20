const jwt = require('jsonwebtoken')
const uniqid = require('uuid/v4')
const {jwtString,jwtToken}= require('../config/app')

const {findTokenByUserId,deleteTokenByUserId,insertToken} = require('../controllers/db')


const genAccessToken = (userId)=>{
    const payload = {
        userId,
        type: jwtToken.access.type
    }
    const options = {expiresIn: jwtToken.access.expiresIn}
    return jwt.sign(payload,jwtString,options)
}

const genRefreshToken = ()=>{
    const payload = {
        id: uniqid(),
        type: jwtToken.refresh.type
    }
    const options = {expiresIn: jwtToken.refresh.expiresIn}
    return jwt.sign(payload,jwtString,options)
}

const refreshDB = async (tokenId,userId)=>{
    const token = await findTokenByUserId(userId)
    // console.log('tokenId',tokenId)
    if(token==undefined){
        const insertedToken = await insertToken(tokenId,userId)
        return insertedToken
    }else{
        const deleteToken = await deleteTokenByUserId(userId)
        if(deleteToken){
            const insertedToken = await insertToken(tokenId,userId)
            return insertedToken
        }
    }
}

module.exports = {
    genAccessToken,
    genRefreshToken,
    refreshDB
}