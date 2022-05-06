// ==UserScript==
// @name         Biome 3D bots
// @namespace    http://biome3d.com/
// @version      1.0.0
// @description  Biome 3D bots
// @author       Rivet
// @match        http://*.biome3d.com/*
// @grant        none
// ==/UserScript==

// Default configuration
const config = {
    toggle: 'x',
    split: 'e',
    address: '127.0.0.1:2345'
}

// Client
class Client {
    constructor() {
        this.socket = null
        this.address = null
        this.origin = location.origin

        this.injectUI()
        this.connect()
    }

    connect() {
        this.socket = new WebSocket(`ws://${config.address}`)

        this.socket.onopen = this.onOpen.bind(this)
        this.socket.onmessage = this.onMessage.bind(this)
        this.socket.onerror = this.onError.bind(this)
        this.socket.onclose = this.onClose.bind(this)
    }

    disconnect() {
        if (this.socket && this.socket.readyState === this.socket.OPEN) this.socket.close()
    }

    onOpen() {
        console.log('Connected to bot server')
    }

    onMessage(message) {
        const reader = JSON.parse(message.data)
        const action = reader.action

        switch (action) {
            case 'update':
                let { bots, maxBots } = reader
                let element = document.getElementById('counter')

                element.innerText = `${bots}/${maxBots}`
                console.log(reader)
                break;
        }
    }

    onError() {
        this.disconnect()
        this.connect()
    }

    onClose() {
        console.log('Disconnected from bot server')
    }

    toggle() {
        if (this.address === null) {
            alert('Please connect to a server!')

            return
        }

        const object = {
            action: 'toggle',
            address: this.address,
            origin: this.origin
        }

        this.send(object)
    }

    split() {
        const object = {
            action: 'split'
        }

        this.send(object)
    }

    move(x, y) {
        const object = {
            action: 'move',
            x,
            y
        }

        this.send(object)
    }

    send(message) {
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            const writer = JSON.stringify(message)

            this.socket.send(writer)
        }
    }

    injectUI() {
        let UI = document.createElement('div')
        let counter = document.createElement('b')

        UI.id = 'menu'
        UI.className = 'panel'
        UI.innerText = 'Bots: '

        counter.id = 'counter'
        counter.innerText = '0/0'

        setTimeout(() => {
            UI.appendChild(counter)
            document.getElementsByClassName('top')[0].appendChild(UI)
        }, 3 * 1000)
    }
}

window.Client = new Client()

// Keydown listener
document.addEventListener('keydown', event => {
    const key = event.key
    const { toggle, split } = config

    switch (key) {
        case toggle:
            window.Client.toggle()
            break
        
        case split:
            window.Client.split()
            break
    }
})

// Packet sniffer
WebSocket.prototype._send = WebSocket.prototype.send
WebSocket.prototype.send = function(data) {
    this._send(data)

    const url = new URL(this.url)
    const isBiome3d = url.hostname.split('.')[1] === 'biome3d'

    if (!isBiome3d) return
    if (data instanceof ArrayBuffer) {
        const reader = new DataView(data)
        const packetId = reader.getUint8(0)

        switch (packetId) {
            case 1:
                let x = reader.getFloat32(1, true) / 100
                let y = reader.getFloat32(5, true) / 100

                window.Client.move(x, y)
                break
        }
    } else {
        const reader = JSON.parse(data)
        const action = reader.cmd

        switch (action) {
            case 'start':
                window.Client.address = this.url
                break
        }
    }
}