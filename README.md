# nicelydone-cloudflare-worker

Disposable Cloudflare Worker for the Nicelydone capture. Module Worker, Node.js 20.

## Routes
| Path | Behavior |
|---|---|
| `/` (and any unlisted path) | `200` JSON `{ service, status, path }` |
| `/api/health` | `200` JSON `{ status: "ok" }` |
| `/api/files` | `200` JSON listing the 3 permanent R2 object keys |
| `/missing` | `404` |
| `/error` | logs a console error and throws a disposable exception (`500`) |

`/blocked-capture` and `/rate-limit-test` return `200` from the Worker; Cloudflare's
WAF custom rule and rate-limiting rule act on them at the edge.

## Scripts
- `npm run dev` — `wrangler dev`
- `npm run deploy` — `wrangler deploy`
- `npm run generate-traffic -- https://worker.<domain>` — 20-minute traffic run

## Observability
`wrangler.jsonc` enables Workers Logs, invocation logs, and traces with head
sampling rate `1`.

## R2 sample files
`r2-assets/` (gitignored) holds the four public files uploaded to the
`nicelydone-assets` R2 bucket:
- `data/superstore.csv` — public plotly retail dataset (the spec's original
  `plotly/datasets/superstore.csv` URL 404s; substituted `supermarket_Sales.csv`
  under the required name)
- `data/flights.csv`
- `data/2014_usa_states.csv` (deleted during the capture)
- `images/cloudflare.png`

No real secrets are stored in this repository.
