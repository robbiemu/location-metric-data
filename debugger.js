import withDebug from 'debug'

/* the debug object is meant as a replacement for console.log. In order to have common types across multiple files, exaclt
naming conventions must be kept. For this reason, this common interface compiles them. */

export const Debug = {with: withDebug} 

let state = {
    config: Debug.with("config"),
    events: Debug.with("events"),
    trace: Debug.with("trace"),
    default: console.debug
}
export const debug = new Proxy(state, {
    apply(o, p, args) {
        let func = typeof o[p] === 'function' ? o[p]: o['default']
        func(args)
    }
})
Object.freeze(debug)