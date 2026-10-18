// Nicelydone Cloudflare Worker — traffic generator.
// Usage: node scripts/generate-traffic.mjs https://worker.<supplied-domain>
//
// Over ~20 minutes it sends:
//   600 requests to / and /api/health   (300 each)
//    60 requests to /api/files
//    30 requests to /missing
//    10 requests to /error
//    10 requests to /blocked-capture
//    10 requests to /rate-limit-test     (burst within one minute)
// Prints the URL, status code, and a running count only.
// Never prints headers, tokens, cookies, or secrets.

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: node scripts/generate-traffic.mjs <worker-url>')
  process.exit(1)
}
const BASE = arg.replace(/\/+$/, '')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let count = 0
async function hit(path) {
  const url = `${BASE}${path}`
  let status
  try {
    const res = await fetch(url, {redirect: 'manual'})
    status = String(res.status)
  } catch (err) {
    status = `ERR ${err.message}`
  }
  count += 1
  console.log(`[${count}] ${status} ${url}`)
  return status
}

function buildMainQueue() {
  const list = []
  const push = (path, n) => {
    for (let i = 0; i < n; i += 1) list.push(path)
  }
  push('/', 300)
  push('/api/health', 300)
  push('/api/files', 60)
  push('/missing', 30)
  push('/error', 10)
  push('/blocked-capture', 10)
  // Fisher-Yates shuffle so the request mix is interleaved.
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list // 710 requests
}

async function main() {
  console.log(`Target: ${BASE}`)
  const TOTAL_MS = 20 * 60 * 1000 // 20 minutes

  // 1) Rate-limit burst: 10 x /rate-limit-test well within one minute.
  //    (The rule allows 5/min, so the later ones should be rate-limited.)
  console.log('-- rate-limit burst: 10 x /rate-limit-test in < 1 min --')
  const burstGap = 2000
  for (let i = 0; i < 10; i += 1) {
    await hit('/rate-limit-test')
    await sleep(burstGap)
  }

  // 2) Main traffic, spread evenly across the remaining time.
  const queue = buildMainQueue()
  const remainingMs = Math.max(0, TOTAL_MS - 10 * burstGap)
  const gap = Math.max(0, Math.floor(remainingMs / queue.length))
  console.log(`-- main traffic: ${queue.length} requests, ~${gap}ms apart --`)
  for (const path of queue) {
    await hit(path)
    await sleep(gap)
  }

  console.log(`\nDone. Total requests sent: ${count}`)
}

main().catch((err) => {
  console.error('Traffic generator failed:', err.message)
  process.exit(1)
})
