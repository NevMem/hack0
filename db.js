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