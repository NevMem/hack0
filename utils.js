const jwt = require('jsonwebtoken')
require('dotenv').config()

exports.createToken = (login, password) => {
    let token = jwt.sign({login: login}, process.env.jwt_secret)
    return token
}

exports.decodeToken = (token) => {
    let decoded = jwt.verify(token, process.env.jwt_secret)
    return decoded
}

let sampleSymbol = () => {
    let now = Math.random() * (26 + 10) | 0
    if (now < 10)
        return String.fromCharCode('0'.charCodeAt(0) + now)
    if (now < 36)
        return String.fromCharCode('A'.charCodeAt(0) + now - 10)
    return '$'
}

exports.generateRoomPin = () => {
    let pin = ''
    for (let i = 0; i != process.env.pin_length; ++i) {
        pin += sampleSymbol()
    }
    return pin
}