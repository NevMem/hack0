let MongoClient = require('mongodb').MongoClient
let ObjectID = require('mongodb').ObjectID
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
                    if (!roomName)
                        roomName = 'Room ' + (count + 1)
                    let pin = utils.generateRoomPin()
                    db.collection('rooms')
                    .insertOne({
                        name: roomName,
                        login: login,
                        pin: pin
                    }, (err, data) => {
                        if (err) {
                            reject(err)
                        } else {
                            if (data.insertedCount != 1) {
                                reject('Error occured and room wasn\'t created, we are working on it')
                            } else {
                                resolve(pin)
                            }
                        }
                    })
                })
            }
        }
    })
}

exports.getOwnedRooms = (token) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            reject('Token is empty')
        } else {
            let decoded = utils.decodeToken(token)
            if (!decoded) {
                reject('Token is invalid')
            } else {
                let login = decoded.login
                db.collection('rooms').find({
                    login: login
                }, { 
                    projection: {
                        'name': 1,
                        'pin': 1
                    }
                }).toArray((err, data) => {
                    if (err) {
                        console.log(err)
                        reject('Error occured')
                    } else {
                        resolve(data)
                    }
                })
            }
        }
    })
}

exports.join = (token, pin) => {
    return new Promise((resolve, reject) => {
        if (!pin) {
            reject('Room pin is empty')
            return
        }
        if (!token) {
            let guest = utils.createGuest()
            token = utils.createToken(guest.login, guest.password, 'guest')
        }
        let login = utils.decodeToken(token).login
        if (!login) {
            reject('Token is invalid')
            return
        }        
        db.collection('rooms').findOne({
            pin: pin
        }, (err, data) => {
            if (err) {
                console.log(err)
                reject('Error occured, we are working on it')
            } else {
                if (!data) {
                    reject('Room not found')
                } else {
                    db.collection('rooms')
                    .updateOne({ _id: new ObjectID(data._id) },
                    {
                        $addToSet: {
                            queue: [{
                                login: login
                            }]
                        }
                    }, (err, data) => {
                        if (err) {
                            console.log(err)
                            reject('Error occured')
                            return
                        }
                        resolve({
                            token: token
                        })
                    })
                }
            }
        })
    })
}