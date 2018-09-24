import moment from 'moment'
import faker from 'faker'

import { debug } from './debugger'
import { Locus } from './models/Locus'
import { LocationEvent, AppEvent } from './models/events'
import { EventsAgent } from './EventsAgent'

let HOURS = 60*60*1000

export default class EventsGenerator {
    constructor (state) {
        this.state = state
        this.events = []
    }

    /** generate user events on a given date for each user */
    gen (date) {
        debug.trace('gen', date.format('LLL'))

        let users = this.state.users || []

        let userDates = {}
        let userMetrics = {}
        for (let user of users) {
            userDates[user] = date.format('YYYY-MM-DDTHH:mm:ss.SSSZ')
            // generate daily location behaviors
            for (let key in user.locii) {
                switch (key) {
                    case Locus.constants.WEEKDAY:
                        if(moment(userDates[user]).isoWeekday(Number) > 5)
                            break
                        this.processUserEvents(user, user.locii[key], moment.utc(userDates[user]))
                        break
                    case Locus.constants.WEEKEND:
                        if(moment(userDates[user]).isoWeekday(Number) < 5)
                            break
                            this.processUserEvents(user, user.locii[key], moment.utc(userDates[user]))
                            break
                    default:
                        this.processUserEvents(user, user.locii[key], moment.utc(userDates[user]))
                        break
                }
            }
            // generate daily app behaviors
            userMetrics[user] = {}

            for (let app of user.apps) { 
                userMetrics[user][app.app.name] = EventsAgent.getLastMetric(user, app.app, this.events)

                if(app.conf.adherance > Math.random()) {
                    this.processMetricEvent(user, app, moment.utc(userDates[user]), userMetrics)
                } else { // decay
                    userMetrics[user][app.app.name] -= app.conf.progress * (1/userMetrics[user][app.app.name])
                }
            }
        } 
    }

    processMetricEvent (user, app, from, userMetrics) {
        // lets create an offset date for our metric...
        let dateString = `${from.format('YYYY-MM-DD')} ${moment(faker.date.recent()).format('HH:mm:ss')}`
        let date = moment.utc(dateString)

        debug.trace(from, dateString, date.format('LLL'))

        // ...and find the nearest events...
        let events = EventsAgent.thresholdEvents(date, 4*HOURS, this.events, LocationEvent)
        let metric = userMetrics[user][app.app.name]

        //...now lets see how we scored...
        metric += app.conf.progress

        //... taking into account negative and positive influence based on nearby locations...
        let factor = 0
        if(app.conf.hasOwnProperty('negative_locii') && app.conf.negative_locii.length) {
            factor -= events.filter(event => app.conf.negative_locii.includes(event.location.name)).length
        }
        if(app.conf.hasOwnProperty('positive_locii') && app.conf.positive_locii.length) {
            factor += events.filter(event => app.conf.positive_locii.includes(event.location.name)).length                        
        }
        if(factor < 0) {
            metric += --factor * app.conf.progress
        }
        if(factor > 0) {
            metric += ++factor * app.conf.progress
        }

        //... handle edges (we're just fudging stuff, so there's edge cases)...
        metric = Math.clamp(metric, 0, 1)

        //... keep track of our progress...
        userMetrics[user][app.app.name] = metric

        //... create the event with our data...
        let metricEvent = new AppEvent({user, date, app: app.app, metric})

        // ... and keep it
        this.events.push(metricEvent)
    }

    /** handles exlcuding date ranges */
    filterValidEvents(events, date) {
        return events.filter(locus => {
            if (locus.excluding && Array.isArray(locus.excluding)) {
                if(locus.excluding.includes('WINTERS')) {
                    let month = date.month()
                    if (month > 11 || month < 3) {
                        return false
                    }
                }

                if(locus.excluding.includes('SUMMERS')) {
                    let month = date.month()
                    if (month > 5 && month < 9) {
                        return false
                    }
                }    
            }
            return true
        })
    }

    processUserEvents (user, eventTable, from) {
        // We need to start with a list of locations the user might be at today...
        let validEvents = this.filterValidEvents(eventTable, from)

        if(eventTable.length != validEvents.length)
            debug.trace(user.name, from.format('LL'), eventTable.filter(e => !validEvents.includes(e)))

        //... for each location, what are the odds that the location was attended? if we make those odds, that gets added...
        let events = []
        for(let locus of validEvents) {
            let chance = Math.random()
            if(locus.attendance > chance) {
                events.push(locus)
            }
        }

        //... if nothing got added, lets just stay put for the day...
        if(!events.length)
            return

        //... lets "expand" how long we statyed at different places so that it fills the day ...
        let factor = 1/events.reduce((p,c) => p + c.daily_hours, 0) 

        //... great that's it, let's create events from each of these and add them
        events.forEach(event => {
            //... handle edges (we're just fudging stuff, so there's edge cases)
            let time = Math.clamp(24 * event.daily_hours * factor, 0, 24)

            let locationChange = new LocationEvent({
                date: from.clone(),
                user, 
                location: event.location
            })

            //debug.trace(`adding hours at [${user.name}${event.location.name}]:`, 
            //    factor, event.daily_hours, time, from.format('HH:mm:ss'), from.add(time, 'hours'))
            from.add(time, 'hours')

            this.events.push(locationChange)
        })
    }
}
