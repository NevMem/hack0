let MongoClient = require('mongodb').MongoClient
let db = undefined

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