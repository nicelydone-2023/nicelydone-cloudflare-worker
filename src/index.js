// Nicelydone Cloudflare Worker — disposable capture routes.
// Module Worker (ES module syntax).

import {logEvent} from './logger.js'

// The three PERMANENT R2 object keys (data/2014_usa_states.csv is deleted
// during the capture, so it is intentionally not listed here).
const PERMANENT_FILES = [
  'data/superstore.csv',
  'data/flights.csv',
  'images/cloudflare.png',
]

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname
    const startedAt = Date.now()

    // Wide event: one structured object built as the request is handled and
    // emitted exactly once in the finally block, so every request — including
    // the failure paths — logs a single event with its context.
    const event = {
      request_id: crypto.randomUUID(),
      method: request.method,
      path,
      route: 'unlisted',
      colo: request.cf?.colo ?? null,
    }

    let response
    try {
      // GET /api/health -> 200 { status: 'ok' }
      if (path === '/api/health') {
        event.route = 'health'
        response = Response.json({status: 'ok'}, {status: 200})
      }

      // GET /api/files -> list the three permanent R2 object names
      else if (path === '/api/files') {
        event.route = 'files'
        response = Response.json({files: PERMANENT_FILES}, {status: 200})
      }

      // GET /missing -> 404
      else if (path === '/missing') {
        event.route = 'missing'
        response = Response.json({error: 'Not found', path}, {status: 404})
      }

      // GET /error -> throw a disposable exception (500)
      else if (path === '/error') {
        event.route = 'error'
        const error = new Error('Disposable test exception from /error route')
        event.error = {name: error.name, message: error.message, stack: error.stack}
        throw error
      }

      // "/" and any other path return the service JSON with the request path.
      // (/blocked-capture and /rate-limit-test return 200 here; Cloudflare's
      // WAF custom rule and rate-limiting rule act on them at the edge.)
      else {
        response = Response.json(
          {service: 'nicelydone-cloudflare-worker', status: 'ok', path},
          {status: 200},
        )
      }
    } catch (error) {
      event.outcome = 'error'
      if (!event.error) {
        event.error = {name: error.name, message: error.message, stack: error.stack}
      }
      throw error
    } finally {
      event.outcome = event.outcome ?? 'ok'
      event.status = response ? response.status : 500
      event.duration_ms = Date.now() - startedAt
      logEvent('request', event)
    }

    return response
  },
}
