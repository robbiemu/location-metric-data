import uuid from 'uuid/v4'

export class User {
    constructor (name) {
        this.id = uuid()
        this.name = name
        this.locations = []
        this.apps = []
        this.locii = {}
    }

    addApp(app, conf) {
        let replace = this.apps.findIndex(record => record.app.id === app.id)
        if(replace === -1) {
            this.apps.push({app, conf})
        } else {
            this.apps[replace] = {app, conf}
        }
    }

    addLocii(key, locus) {
        if(!this.locii.hasOwnProperty(key))
            this.locii[key] = []
        let replace = this.locii[key].findIndex(record => record.id === locus.id)
        if(replace === -1) {
            this.locii[key].push(locus)
        } else {
            this.locii[key][replace] = locus
        }
    }
}