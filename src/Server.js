const WebSocket = require('ws')
const User = require('./User')

class Server {
    constructor(port) {
        this.server = new WebSocket.Server({
            port: port
        })
        
        this.server.on('connection', socket => {
            socket.User = new User(socket)
        })

        console.log(`Bot server started on port ${port}`)
    }
}

module.exports = Server