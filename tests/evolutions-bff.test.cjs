const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { NextRequest } = require('next/server')
const { loader } = require('./load-typescript.cjs')
process.env.SOFTCONNECT_API_URL = 'http://127.0.0.1:43119/api/v1'
process.env.TOKEN_ENCRYPTION_KEY = 'unit-synthetic-only'
const load = loader()
const { encryptToken } = load('app/api/_utils/proxy.ts')
const headers = {
  Authorization: `Bearer ${encryptToken('fake-admin-jwt')}`,
  'Content-Type': 'application/json',
}
let calls, originalFetch, originalLog, logs
beforeEach(() => {
  calls = []
  logs = []
  originalFetch = global.fetch
  originalLog = console.log
  console.log = (...args) => logs.push(args)
  global.fetch = async (url, options) => {
    calls.push({ url, ...options })
    return new Response('{"ok":true}', { status: 200 })
  }
})
afterEach(() => {
  global.fetch = originalFetch
  console.log = originalLog
})

const cases = [
  ['evolution-setup', ['GET'], '/admin/evolution-setup'],
  ['evolution-setup/confirmation', ['PUT'], '/admin/evolution-setup/confirmation'],
  [
    'admin/products/[productId]/evolution-changes',
    ['GET', 'POST'],
    '/admin/products/product-a/evolution-changes',
  ],
  [
    'admin/products/[productId]/evolution-changes/[operationId]',
    ['GET'],
    '/admin/products/product-a/evolution-changes/op-a',
  ],
  ...['apply', 'cancel', 'callback-check'].map((action) => [
    `admin/products/[productId]/evolution-changes/[operationId]/${action}`,
    ['POST'],
    `/admin/products/product-a/evolution-changes/op-a/${action}`,
  ]),
  [
    'evolutions/[providerId]/removal-readiness',
    ['GET'],
    '/admin/evolutions/evo-a/removal-readiness',
  ],
  ['evolutions/[providerId]/retirement', ['POST'], '/admin/evolutions/evo-a/retirement'],
  ['evolutions', ['GET', 'POST'], '/admin/evolutions'],
  ['evolutions/[providerId]', ['GET', 'PUT', 'DELETE'], '/admin/evolutions/evo-a'],
  ['evolutions/[providerId]/maintenance', ['GET', 'PUT'], '/admin/evolutions/evo-a/maintenance'],
  [
    'evolutions/[providerId]/maintenance/observations',
    ['GET'],
    '/admin/evolutions/evo-a/maintenance/observations',
  ],
  [
    'evolutions/[providerId]/maintenance/actions',
    ['GET'],
    '/admin/evolutions/evo-a/maintenance/actions',
  ],
  ['evolutions/[providerId]/occupancy', ['GET'], '/admin/evolutions/evo-a/occupancy'],
  ['evolutions/[providerId]/reconcile', ['POST'], '/admin/evolutions/evo-a/reconcile'],
  [
    'evolutions/[providerId]/reconciliations/[operationId]',
    ['GET'],
    '/admin/evolutions/evo-a/reconciliations/op-a',
  ],
  ['admin/products/[productId]/evolutions', ['GET'], '/admin/products/product-a/evolutions'],
  [
    'admin/products/[productId]/evolutions/attach',
    ['POST'],
    '/admin/products/product-a/evolutions/attach',
  ],
  [
    'admin/products/[productId]/evolutions/[providerId]',
    ['PUT', 'DELETE'],
    '/admin/products/product-a/evolutions/evo-a',
  ],
  [
    'admin/products/[productId]/evolutions/[providerId]/import-candidates',
    ['GET'],
    '/admin/products/product-a/evolutions/evo-a/import-candidates',
  ],
  ['admin/products/[productId]/allocation', ['GET', 'PUT'], '/admin/products/product-a/allocation'],
  [
    'admin/products/[productId]/instances/placements',
    ['GET'],
    '/admin/products/product-a/instances/placements',
  ],
]
for (const [route, methods, endpoint] of cases)
  for (const method of methods) {
    test(`${method} ${route} preserves authenticated method/body/query without logging secrets`, async () => {
      const routeModule = load(`app/api/${route}/route.ts`)
      const body = ['POST', 'PUT'].includes(method)
        ? { expectedRevision: 7, sentinel: 'synthetic-secret' }
        : undefined
      const req = new NextRequest(
        'http://localhost/api/test?expectedRevision=7&search=alpha+beta',
        { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) }
      )
      const res = await routeModule[method](req, {
        params: { providerId: 'evo-a', productId: 'product-a', operationId: 'op-a' },
      })
      assert.equal(res.status, 200)
      assert.equal(calls.length, 1)
      assert.equal(
        calls[0].url,
        `http://127.0.0.1:43119/api/v1${endpoint}?expectedRevision=7&search=alpha+beta`
      )
      assert.equal(calls[0].method, method)
      assert.equal(calls[0].headers.Authorization, 'Bearer fake-admin-jwt')
      assert.equal(calls[0].body, body ? JSON.stringify(body) : undefined)
      assert.deepEqual(logs, [])
    })
  }
test('missing or empty decrypted credential cannot reach Hub', async () => {
  const { POST } = load('app/api/evolutions/route.ts')
  for (const auth of [undefined, `Bearer ${encryptToken('')}`]) {
    const response = await POST(
      new NextRequest('http://localhost/api/evolutions', {
        method: 'POST',
        headers: auth ? { Authorization: auth } : {},
      })
    )
    assert.equal(response.status, 401)
  }
  assert.equal(calls.length, 0)
})

test('existing administrative provider route delivers current keys only with admin auth and no content logs', async () => {
  const { GET } = load('app/api/vps/[id]/providers/route.ts')
  const payload = [{ id: 'evo-a', providerApiKey: 'fixture-current-key' }]
  global.fetch = async (_url, options) => {
    calls.push(options)
    return Response.json(payload)
  }
  const denied = await GET(new NextRequest('http://localhost/api/vps/vps-a/providers'), {
    params: { id: 'vps-a' },
  })
  assert.equal(denied.status, 401)
  assert.equal(calls.length, 0)
  const response = await GET(
    new NextRequest('http://localhost/api/vps/vps-a/providers', { headers }),
    { params: { id: 'vps-a' } }
  )
  assert.deepEqual(await response.json(), payload)
  assert.equal(calls[0].headers.Authorization, 'Bearer fake-admin-jwt')
  assert.deepEqual(logs, [])
})
test('detach returns empty 204, deactivate returns 200, reconciliation returns 202', async () => {
  for (const [route, method, status] of [
    ['admin/products/[productId]/evolutions/[providerId]', 'DELETE', 204],
    ['evolutions/[providerId]', 'DELETE', 200],
    ['evolutions/[providerId]/reconcile', 'POST', 202],
    ['admin/products/[productId]/evolution-changes', 'POST', 202],
    ['admin/products/[productId]/evolution-changes/[operationId]/apply', 'POST', 200],
    ['evolutions/[providerId]/retirement', 'POST', 200],
  ]) {
    global.fetch = async () =>
      new Response(status === 204 ? null : '{"operationId":"op-a"}', { status })
    const response = await load(`app/api/${route}/route.ts`)[method](
      new NextRequest('http://localhost/api/test?expectedRevision=1', { method, headers }),
      { params: { productId: 'product-a', providerId: 'evo-a', operationId: 'op-a' } }
    )
    assert.equal(response.status, status)
    if (status === 204) assert.equal(await response.text(), '')
    else assert.deepEqual(await response.json(), { operationId: 'op-a' })
  }
})
for (const status of [400, 403, 404, 409, 503])
  test(`Hub ${status} error passes unchanged`, async () => {
    global.fetch = async () => new Response('{"message":"Controlled conflict"}', { status })
    const response = await load('app/api/evolutions/[providerId]/route.ts').PUT(
      new NextRequest('http://localhost/api/test', {
        method: 'PUT',
        headers,
        body: '{"expectedRevision":1}',
      }),
      { params: { providerId: 'evo-a' } }
    )
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { message: 'Controlled conflict' })
  })
test('legacy and selected bulk both forward through the existing BFF', async () => {
  const { POST } = load('app/api/admin/products/[productId]/instances/import/bulk/route.ts')
  for (const selected of [false, true]) {
    await POST(
      new NextRequest(`http://localhost/api/bulk${selected ? '?vpsProviderId=evo-b' : ''}`, {
        method: 'POST',
        headers,
        ...(selected ? { body: '{"instanceIds":["remote-b"]}' } : {}),
      }),
      { params: { productId: 'product-a' } }
    )
  }
  assert.equal(calls[0].body, undefined)
  assert.equal(
    calls[0].url,
    'http://127.0.0.1:43119/api/v1/admin/products/product-a/instances/import/bulk'
  )
  assert.equal(calls[1].body, '{"instanceIds":["remote-b"]}')
  assert.match(calls[1].url, /\?vpsProviderId=evo-b$/)
})
test('provider timeout does not retry or turn into success', async () => {
  const timers = []
  const set = global.setTimeout,
    clear = global.clearTimeout
  global.setTimeout = (fn, ms) => {
    assert.equal(ms, 15000)
    timers.push(fn)
    return 1
  }
  global.clearTimeout = () => {}
  let count = 0
  global.fetch = async (_url, { signal }) => {
    count++
    const promise = new Promise((_, reject) =>
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    )
    timers[0]()
    return promise
  }
  try {
    const response = await load('app/api/evolutions/route.ts').POST(
      new NextRequest('http://localhost/api/test', { method: 'POST', headers, body: '{}' })
    )
    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), { error: 'Request timeout' })
    assert.equal(count, 1)
  } finally {
    global.setTimeout = set
    global.clearTimeout = clear
  }
})
