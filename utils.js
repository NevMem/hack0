const jwt = require('jsonwebtoken')
require('dotenv').config()

exports.createToken = (login, password) => {
    let token = jwt.sign({login: login}, process.env.jwt_secret)
    console.log(token)
    return token
}