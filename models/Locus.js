import uuid from 'uuid/v4'

/** Locus - associates attendance ratios with a location so that timelines can be built
 * the intent is that blocks of time (weekday, weekend, summer, etc) will be used in the same fashion
 */
export class Locus {
    static constants = {
        SUMMERS: 'SUMMERS',
        WINTERS: 'WINTERS',
        WEEKDAY: 'weekday',
        WEEKEND: 'weekend'
    }
    
    constructor ({location, attendance, daily_hours, excluding}) {
        this.id = uuid()
        this.location = location
        this.attendance = attendance
        this.daily_hours = daily_hours
        this.excluding = excluding
    }

    toString () {
        return `${this.location? this.location.name: this.location}: attendance ${this.attendance}, daily_hours ${this.daily_hours}, excluding: ${this.excluding||''}`
    }
}