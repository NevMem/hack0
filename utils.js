const jwt = require('jsonwebtoken')
require('dotenv').config()

exports.createToken = (login, password) => {
    let token = jwt.sign({login: login}, process.env.jwt_secret)
    console.log(token)
    return token
}

exports.decodeToken = (token) => {
    let decoded = jwt.verify(token, process.env.jwt_secret)
    return decoded
}