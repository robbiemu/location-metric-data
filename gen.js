import fs from 'fs'
import {promisify} from 'util'
import Jcf from 'json-config-file'
import moment from 'moment'

import { debug } from './debugger'
import { App } from './models/App'
import { Location } from './models/Location'
import { LocationEvent, AppEvent } from './models/events'
import { Locus } from './models/Locus'
import { User } from './models/User'
import EventsGenerator from './EventsGenerator'

const config = new Jcf('config/index.json')

let constants = {
    id:  {
        app: '45443852-b97d-4950-9329-2b64e3e76592',
    }
}

let state = {}

state.registeredApps =  []
config.data.registered_apps.forEach(name => state.registeredApps.push(new App(name)))

state.users = []
Object.keys(config.data.users).forEach(name => {
    let user = new User(name)
    state.users.push(user)

    Object.keys(config.data.users[name].apps).forEach(appName => {
        let app = state.registeredApps.find(app => app.name === appName)
        if(app) {
            let conf = config.data.users[name].apps[appName]

            if(conf.negative_locii)
                conf.negative_locii.map(locationName => {
                    let location = user.locations.find(x => x.name === locationName)
                    if(!location) {
                        location = new Location(locationName)
                        user.locations.push(location)
                    }
                    return location
                })
            if(conf.positive_locii)    
                conf.positive_locii.map(locationName => {
                    let location = user.locations.find(x => x.name === locationName)
                    if(!location) {
                        location = new Location(locationName)
                        user.locations.push(location)
                    }
                    return location
                })

            user.addApp(app, conf) 
        }
    })

    Object.keys(config.data.users[name].locii).forEach(key => {
        let locus = config.data.users[name].locii[key]
        switch (key) {
            case Locus.constants.WEEKDAY:
            case Locus.constants.WEEKEND:
                locus.forEach(behavior => {
                    let location = user.locations.find(l => l.name === behavior.location)
                    if(!location) {
                        location = new Location(behavior.location)

                        user.locations.push(location)
                    } 

                    let locus = new Locus({
                        location, 
                        attendance: behavior.attendance, 
                        daily_hours: behavior.daily_hours,
                        excluding: behavior.excluding
                    })

                    user.addLocii(key, locus)
                })
                break
            default:

        }
    })
})

debug.config('state is', state)

if(!config.data.time_frame || !config.data.time_frame.from || !config.data.time_frame.to) {
    console.log('no date range to process, exiting')

    process.exit(0)
}

let eg = new EventsGenerator(state)

let dateFormat = 'DD-MM-YYYY'
let cnt = 0

let from = moment.utc(config.data.time_frame.from)
let to = moment.utc(config.data.time_frame.to)
while(from < to && cnt++ < 1000) {
    debug.trace(from.format(dateFormat), to.format(dateFormat))
    eg.gen(from.clone().add(/* nodeJS CLI timing hack for moment*/1, 's'))
    from.add(1, 'days')
}

const sortedEvents = eg.events.sort(function (left, right) {
    return moment.utc(left.date).diff(moment.utc(right.date))
})//.map(e => e.csvPrint())

debug.events('events are', sortedEvents)

const writeFile = promisify(fs.writeFile);
writeFile("./location.data", sortedEvents.filter(e => e instanceof LocationEvent).map(e => e.csvPrint()).join('\n'))
    .catch(err => console.error(err))
writeFile("./app.data", sortedEvents.filter(e => e instanceof AppEvent).map(e => e.csvPrint()).join('\n'))
    .catch(err => console.error(err))
