let MongoClient = require('mongodb').MongoClient
let db = undefined
const utils = require('./utils')

exports.connect = (dbUrl) => {
    return MongoClient.connect(dbUrl, { useNewUrlParser: true })
    .then(data => {
        console.log('Connected'.green)
        db = data.db('hackaton')
    })
    .catch(err => {
        console.log('Error'.red)
    })
}

exports.login = (login, password) => {
    return new Promise((resolve, reject) => {
        db.collection('users').findOne({
            login: login,
            password: password
        }, (err, data) => {
            console.log(err, data)
            if (data == null)
                reject('user not found')
            if (err) reject(err)
            else resolve(data)
        })
    })
}

exports.register = (login, password) => {
    return new Promise((resolve, reject) => {
        db.collection('users').findOne({
            login: login
        }, (err, data) => {
            if (err) {
                reject(err)
                return
            }
            if (data != null) {
                reject('Please change login(it is busy now)')
                return
            }

            db.collection('users').insert({
                login: login,
                password: password
            }, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                if (data.result) {
                    if (data.result.n != 0) {
                        resolve(data)
                    } else {
                        reject('Error occured, we are working on it')
                    }
                } else {
                    reject('Error occured, please try a few years later')
                }
            })
        })
    })
}

function getCountOfRoomsByUser(login) {
    return new Promise((resolve, reject) => {
        db.collection('rooms').find({
            login: login
        }).toArray((err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data.length)
            }
        })
    })
}

exports.init_room = (token, roomName) => {
    return new Promise((resolve, reject) => {
        let decoded = utils.decodeToken(token)
        if (!decoded) {
            reject({
                err: 'Invalid token'
            })
        } else {
            let login = decoded.login
            if (!login) {
                reject({
                    err: 'Login is empty, please relogin'
                })
            } else {
                getCountOfRoomsByUser(login)
                .then(count => {
                    console.log(count)
                    if (!roomName)
                        roomName = 'Room ' + (count + 1)
                    db.collection('rooms')
                    .insertOne({
                        name: roomName,
                        login: login
                    }, (err, data) => {
                        if (err) {
                            reject(err)
                        } else {
                            if (data.insertedCount != 1) {
                                reject('Error occured and room wasn\'t created, we are working on it')
                            } else {
                                resolve('Room was successfully created')
                            }
                        }
                    })
                })
            }
        }
    })
}