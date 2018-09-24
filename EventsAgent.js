import moment from 'moment'

import { debug } from './debugger'
import { AppEvent } from './models/events'

export const EventsAgent = {
    /** appEvents have a metric associated with them. For a given user's app's events, find the most recent metric */
    getLastMetric: (user, app, events) => {
        let matchedEvents = events
            .filter(event => {
                return event.constructor == AppEvent  
                    && event.user === user
                    && event.app === app
            })
            .sort(function (left, right) {
                return moment.utc(left.date).diff(moment.utc(right.date))
            })

        return matchedEvents.length? matchedEvents[matchedEvents.length - 1].metric : 0
    },

    /** given an app Event or a location Event, find the event of the same type nearest in the timeline to this one */
    nearestEvent: (date, events, type) => {
        let min = undefined
        events
            .filter(event => event.constructor == type)
            .forEach(event => {
                if(!min || Math.abs(event.date.diff(date)) < Math.abs(min.date.diff(date))) {
                    min = event
                }
            })
        return min
    },

    /** given an event of a given type, find all events of the same type near to this one  */
    thresholdEvents: (date, threshold, events, type) => {
        return events
            .filter(event => event.constructor == type)
            .filter(event => Math.abs(event.date.diff(date)) <= threshold)
    }
}