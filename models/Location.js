import uuid from 'uuid/v4'
import faker from 'faker'

export class Location {
    constructor (name) {
        this.id = uuid()
        this.name = name
        this.latitude = faker.fake("{{address.latitude}}")
        this.longitude = faker.fake("{{address.longitude}}")
        this.floor = faker.fake("{{random.number}}")
    }

    toString () {
        return `${this.name}: ${this.latitude}, ${this.longitude}, ${this.floor}`
    }

    toJSON () {
        return JSON.stringify({name: this.name, latitude: this.latitude, longitude: this.longitude, floor: this.floor})
    }
}