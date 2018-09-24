import uuid from 'uuid/v4'

export class App {
    constructor (name) {
        this.id = uuid()
        this.name = name
    }
}