let express = require('express')
let http = require('http')
let bParser = require('body-parser')
let db = require('./db')
require('colors')
require('dotenv').config()

let app = express()
let server = http.Server(app)
let io = require('socket.io')(server)

let dbUrl = process.env.db_url
    .replace('<dbuser>', process.env.db_user)
    .replace('<dbpassword>', process.env.db_password)

db.connect(dbUrl)
.then(() => {
    app.use((req, res, next) => {
        console.log(`[${req.method}]: ${req.url}`)
        next()
    })

    app.use(bParser.json())
    app.use(bParser.urlencoded({extended: false}))

    app.get('/', (req, res) => {
        res.send('not implemented yet')
    })

    server.listen(process.env.port, (err) => {
        if (err) {
            console.log(('Error ' + err).red)
        } else {
            console.log(('Successfully running on port: ' + process.env.port).green)
        }
    })
})