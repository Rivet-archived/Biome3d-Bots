const Bot = require('./Bot')

const config = require('../config')

class User {
    constructor(socket) {
        this.socket = socket

        this.started = false
        this.bots = []
        this.interval = setInterval(this.update.bind(this), 100);
        this.socket.on('message', this.onMessage.bind(this))
        this.socket.on('error', this.onError.bind(this))
        this.socket.on('close', this.onClose.bind(this))

        for (let index = 0; index < config.maxBots; index++) {
            const bot = new Bot()
            
            this.bots.push(bot)
        }

        console.log('User connected')
    }

    onMessage(message) {
        const reader = JSON.parse(message)
        const action = reader.action

        switch (action) {
            case 'toggle':
                this.toggle(reader)
                break

            case 'move':
                let { x, y } = reader

                this.move(x, y)
                break

            case 'split':
                this.split()
                break
        }
    }

    onError() {}

    onClose() {
        this.stop()
        clearInterval(this.interval)

        console.log('User disconnected')
    }

    toggle(object) {
        this.started = !this.started

        if (this.started) {
            const { address, origin } = object

            this.start(address, origin)
        } else {
            this.stop()
        }
    }

    start(address, origin) {
        this.bots.forEach(bot => {
            bot.connect(address, origin)
        })

        console.log(`Starting bots in ${address}...`)
    }

    stop() {
        this.bots.forEach(bot => {
            bot.disconnect()
        })
    }

    move(x, y) {
        this.bots.forEach(bot => {
            bot.move(x, y)
        })
    }

    split() {
        this.bots.forEach(bot => {
            bot.split()
        })
    }

    update() {
        let bots = 0

        this.bots.forEach(bot => {
            if (bot.isConnected()) bots++
        })

        const object = {
            action: 'update',
            bots: bots,
            maxBots: config.maxBots
        }

        this.send(object)
    }
    
    send(message) {
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            const writer = JSON.stringify(message)

            this.socket.send(writer)
        }
    }
}

module.exports = User