import uuid from 'uuid/v4'

export class Event {
    constructor({date, user}) {
        this.id = uuid()
        this.date = date
        this.user = user
    }
}

export class LocationEvent extends Event {
    constructor(opts) {
        super(opts)
        this.location = opts.location
    }

    csvPrint () {
        return `${this.user.name}, ${this.date.format('YYYY-MM-DD HH:mm:ss')}, ${this.location.name}`
    }

    prettyPrint () {
        return `${this.user.name} @ ${this.date.format('LLL')}: ${this.location.name}`
    }

    toString() {
        return `{ "user": ${this.user.id}, "${this.date.format('YYYY-MM-DD HH:mm:ss')}": ${this.location.toJSON()}}`
    }
}

export class AppEvent extends Event {
    constructor(opts) {
        super(opts)
        this.app = opts.app
        this.metric = opts.metric
    }

    csvPrint () {
        return `${this.user.name}, ${this.date.format('YYYY-MM-DD HH:mm:ss')}, ${this.app.name}, ${this.metric}`
    }

    prettyPrint () {
        return `${this.user.name} @ ${this.date.format('LLL')}: ${this.app.name} ${this.metric}`
    }

    toString() {
        return `{ "user": ${this.user.id}, "${this.date.format('YYYY-MM-DD HH:mm:ss')}": ${this.app.name} ${this.metric}}`
    }
}