let express = require('express')
let http = require('http')
let bParser = require('body-parser')
let db = require('./db')
let utils = require('./utils')
let cp = require('child_process')
require('colors')
require('dotenv').config()

let app = express()
let server = http.Server(app)
let io = require('socket.io')(server)

let dbUrl = process.env.db_url
    .replace('<dbuser>', process.env.db_user)
    .replace('<dbpassword>', process.env.db_password)

let connections = []
let initiateUpdate = () => {
    for (let i = 0; i < connections.length; ++i) {
        connections[i].emit('reload')
    }
}

let createQR = (url, pin) => {
    let child = cp.spawnSync('python', [ 'qr.py', url, pin ])
    let filename = child.stdout.toString()
    return filename
}

db.connect(dbUrl)
.then(() => {
    io.on('connect', (socket) => {
        connections.push(socket)
        console.log('New socket io connection'.magenta)
        socket.on('myposition', (data) => {
            if (!data) {
                socket.emit('error', 'empty data')
                return
            }
            let token = data.token,
                pin = data.pin
            if (!token) {
                socket.emit('error', 'Token is empty')
                return
            }
            if (!pin) {
                socket.emit('error', 'Pin is empty')
                return
            }

            db.getposition(token, pin)
            .then(data => {
                console.log(data)
                socket.emit('updposition', data)
            })
            .catch(err => {
                console.log(err)
                socket.emit('error', err)
            })
        })
        socket.on('login', (data) => {
            let login = data.login,
                password = data.password
            db.login(login, password)
            .then(data => {
                socket.emit('logged_in', {
                    token: utils.createToken(login, password)
                })
            })
            .catch(err => {
                socket.emit('error', {
                    err: err
                })
            })
        })
        socket.on('owned', data => {
            let token = data.token
            if (!token) {
                socket.emit('error', {
                    err: 'Token is empty'
                })
                return
            }
            db.getOwnedRooms(token)
            .then(data => {
                let decoded = utils.decodeToken(token)
                socket.emit('login', {
                    login: decoded.login
                })
                socket.emit('owned', data)
            })
            .catch(err => {
                socket.emit('error', {
                    err: err
                })
            })
        })
        socket.on('remove room', (data) => {
            if (!data) {
                socket.emit('error', 'Request is empty')
                return
            }
            let token = data.token,
                pin = data.pin

            db.remove(token, pin)
            .then(data => {

                db.getOwnedRooms(token)
                .then(data => {
                    let decoded = utils.decodeToken(token)
                    socket.emit('owned', data)
                })
                .catch(err => {
                    socket.emit('error', {
                        err: err
                    })
                })

            })
            .catch(err => {
                res.send({
                    err: err
                })
            })
        })
        socket.on('done one', (data) => {
            if (!data) {
                socket.emit('error', 'Request is empty')
                return
            }
            let token = data.token,
                pin = data.pin

            db.doneOne(token, pin)
            .then(data => {

                db.getOwnedRooms(token)
                .then(data => {
                    let decoded = utils.decodeToken(token)
                    socket.emit('owned', data)
                })
                .catch(err => {
                    socket.emit('error', {
                        err: err
                    })
                })

            })
            .catch(err => {
                res.send({
                    err: err
                })
            })
        })
        socket.on('qr', (data) => {
            console.log(data)
            if (data && data.token && data.pin) {
                let token = data.token, 
                    pin = data.pin
                let decoded = utils.decodeToken(token)
                if (!decoded) {
                    socket.send('error', 'Token is invalid')
                    return
                }
                db.isOwner(token, pin)
                .then(data => {
                    if (data.owner) {
                        let qrImageName = createQR(process.env.url, pin)
                        socket.emit('qr image', {
                            filename: qrImageName
                        })
                    } else {
                        socket.emit('error', 'You are not an owner of room')
                    }
                })
                .catch(err => {
                    socket.emit('error', 'You are not an owner of room')
                })
            } else {
                socket.emit('error', 'Not full data')
            }
        })
    })
    
    app.use(bParser.json())
    app.use(bParser.urlencoded({extended: true}))

    app.use((req, res, next) => {
        console.log(`[${req.method}]: ${req.url} ${req.ip}`.cyan)
        console.log(req.body)
        next()
    })

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    app.use('/tmp', express.static(__dirname + '/tmp'))

    app.get('/', (req, res) => {
        res.send('not implemented yet')
    })

    app.use('/admin', express.static(__dirname + '/admin_front/dist'))

    app.post('/login', (req, res) => {
        let login = req.body.login,
            password = req.body.password

        db.login(login, password)
        .then(data => {
            res.send({
                token: utils.createToken(login, password)
            })
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/register', (req, res) => {
        let login = req.body.login, 
            password = req.body.password
        db.register(login, password)
        .then(data => {
            res.send({
                token: utils.createToken(login, password)
            })
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/initiate_room', (req, res) => {
        let token = req.body.token
        if (!token) {
            res.send({
                err: 'Token not found, please login'
            })
            return
        }
        db.init_room(token)
        .then(data => {
            console.log(data)
            res.send({ pin: data })
        })
        .catch(err => {
            res.send({
                err: 'Invalid token'
            })
        })
    })

    app.post('/owned_rooms', (req, res) => {
        let token = req.body.token
        db.getOwnedRooms(token)
        .then(data => {
            res.send(data)
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/join', (req, res) => {
        let token = req.body.token,
            room_pin = req.body.pin
        db.join(token, room_pin)
        .then(data => {
            res.send({
                token: data.token
            })
            initiateUpdate()
        })
        .catch(err => {
            console.log(err)
            res.send({
                err: err
            })
        })
    })

    app.post('/myposition', (req, res) => {
        let token = req.body.token,
            pin = req.body.pin
        db.getposition(token, pin)
        .then(data => {
            console.log(data)
            res.send(data)
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/leave', (req, res) => {
        let token = req.body.token,
            pin = req.body.pin
        db.leave(token, pin)
        .then(data => {
            res.send({
                message: data
            })
            initiateUpdate()
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/getname', (req, res) => {
        let pin = req.body.pin
        db.getname(pin)
        .then(data => {
            res.send({
                name: data
            })
        })
        .catch(err => {
            console.log(err)
            res.send({
                err: err
            })
        })
    })

    app.post('/rename', (req, res) => {
        let token = req.body.token,
            pin = req.body.pin,
            newname = req.body.name
        db.rename(token, pin, newname)
        .then(data => {
            res.send({
                name: data
            })
            initiateUpdate()
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    app.post('/remove', (req, res) => {
        let token = req.body.token,
            pin = req.body.pin
        db.remove(token, pin)
        .then(data => {
            console.log(data)
            res.send(data)
            initiateUpdate()
        })
        .catch(err => {
            res.send({
                err: err
            })
        })
    })

    server.listen(process.env.port, (err) => {
        if (err) {
            console.log(('Error ' + err).red)
        } else {
            console.log(('Successfully running on port: ' + process.env.port).green)
        }
    })
})