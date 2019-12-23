const jwt = require('jsonwebtoken')
const uniqid = require('uuid/v4')
const {jwtString,jwtToken}= require('../config/app')

const {findTokenByUserId,deleteTokenByUserId,insertToken} = require('../controllers/db')


const genAccessToken = (userId)=>{
    const payload = {
        userId,
        type: jwtToken.access.type //add type of token
    }
    const options = {expiresIn: jwtToken.access.expiresIn} // add option to jwt
    return jwt.sign(payload,jwtString,options)
}

const genRefreshToken = ()=>{
    const payload = {
        id: uniqid(), // add unique id to refresh token from finding in DB
        type: jwtToken.refresh.type //add type of token
    }
    const options = {expiresIn: jwtToken.refresh.expiresIn} // add option to jwt
    return jwt.sign(payload,jwtString,options)
}

const refreshDB = async (tokenId,userId)=>{
    const token = await findTokenByUserId(userId) //find token in db by user id
    // console.log('tokenId',tokenId)
    if(token==undefined){ ///checking
        const insertedToken = await insertToken(tokenId,userId) // insert token if not find
        return insertedToken
    }else{
        // refreshing the token
        const deleteToken = await deleteTokenByUserId(userId) //delete in db by user id
        if(deleteToken){
            const insertedToken = await insertToken(tokenId,userId) //insert token
            return insertedToken
        }
    }
}

module.exports = {
    genAccessToken,
    genRefreshToken,
    refreshDB
}