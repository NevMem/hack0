let MongoClient = require('mongodb').MongoClient
let db = undefined

exports.connect = (dbUrl) => {
    return MongoClient.connect(dbUrl, { useNewUrlParser: true })
    .then(data => {
        console.log('Connected'.green)
        console.log(data)
    })
    .catch(err => {
        console.log('Error'.red)
        console.log(err)
    })
}