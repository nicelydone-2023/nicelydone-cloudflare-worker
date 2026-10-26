// Nicelydone capture Worker — structured logger.
//
// Workers Logs indexes the fields of an object passed to console.log, so each
// event carries its context as queryable fields instead of an interpolated
// string. Emit one event per request per service.
//
// Two levels only: `info` for normal operations and `error` for unexpected
// failures that need attention.

const SERVICE = 'nicelydone-cloudflare-worker'

export function logEvent(name, fields) {
  const event = {service: SERVICE, event: name, ...fields}
  if (event.outcome === 'error') {
    console.error(event)
  } else {
    console.log(event)
  }
}
