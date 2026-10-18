// Nicelydone Cloudflare Worker — disposable capture routes.
// Module Worker (ES module syntax).

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

    // GET /api/health -> 200 { status: 'ok' }
    if (path === '/api/health') {
      return Response.json({status: 'ok'}, {status: 200})
    }

    // GET /api/files -> list the three permanent R2 object names
    if (path === '/api/files') {
      return Response.json({files: PERMANENT_FILES}, {status: 200})
    }

    // GET /missing -> 404
    if (path === '/missing') {
      return Response.json({error: 'Not found', path}, {status: 404})
    }

    // GET /error -> write a console error and throw a disposable exception
    if (path === '/error') {
      console.error(`[error] disposable test exception for path ${path}`)
      throw new Error('Disposable test exception from /error route')
    }

    // "/" and any other path return the service JSON with the request path.
    // (/blocked-capture and /rate-limit-test return 200 here; Cloudflare's
    // WAF custom rule and rate-limiting rule act on them at the edge.)
    return Response.json(
      {service: 'nicelydone-cloudflare-worker', status: 'ok', path},
      {status: 200},
    )
  },
}
