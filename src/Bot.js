const WebSocket = require('ws')
const { Reader, Writer } = require('binary')

const config = require('../config')

class Bot {
    constructor(agent) {
        this.agent = agent

        this.isDead = false
        this.socket = null
        this.interval = null
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN
    }
    
    connect(address, origin) {
        this.socket = new WebSocket(address, {
            headers: {
                'Connection': 'Upgrade',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36',
                'Upgrade': 'websocket',
                'Origin': origin,
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        })
        
        this.socket.on('open', this.onOpen.bind(this))
        this.socket.on('message', this.onMessage.bind(this))
        this.socket.on('error', this.onError.bind(this))
        this.socket.on('close', this.onClose.bind(this))
    }

    disconnect() {
        if (this.isConnected()) this.socket.close()
    }

    onOpen() {
        this.spawn()
    }

    onMessage(message) {
        if (message instanceof Buffer) {
            let reader = new Reader(message)
            let packetId = reader.readUInt8()

            switch (packetId) {
                case 6:
                    if (this.isDead) this.spawn()

                    this.isDead = !this.isDead
                    break
            }
        } else {
            let reader = JSON.parse(message)
        }
    }

    onError() {}

    onClose() {
        clearInterval(this.interval)
    }

    spawn() {
        let name = config.names[Math.floor(Math.random() * config.names.length)]
        let skin = config.skins[Math.floor(Math.random() * config.skins.length)]
        let message = JSON.stringify({
            cmd: 'start',
            name,
            skin
        })

        this.send(message)
    }

    move(x, y) {
        let writer = new Writer()

        writer.writeUInt8(1)
        writer.writeFloatLE(100 * x)
        writer.writeFloatLE(100 * y)

        let message = writer.toBuffer()

        this.send(message)
    }

    split() {
        let writer = new Writer()

        writer.writeUInt8(10)

        let message = writer.toBuffer()

        this.send(message)
    }

    send(message) {
        if (this.isConnected()) this.socket.send(message)
    }
}

module.exports = Bot