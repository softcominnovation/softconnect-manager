const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')
const load = loader()
const { evolutionsApi } = load('lib/evolutions-api.ts')
const { api } = load('lib/api.ts')
let original, calls
beforeEach(() => {
  original = global.fetch
  calls = []
  global.fetch = async (url, opts) => {
    calls.push({ url, ...opts })
    return new Response('{"hubId":"hub-a"}', { status: 200 })
  }
})
afterEach(() => {
  global.fetch = original
})
test('revisions stay on their own mutations and capacity requires an explicit field', async () => {
  await evolutionsApi.update('jwt', 'evo-a', { expectedRevision: 11, label: 'Label' })
  await evolutionsApi.attach('jwt', 'product-a', 'evo-a', 22)
  await evolutionsApi.updateLink('jwt', 'product-a', 'evo-a', {
    expectedRevision: 33,
    acceptingNewInstances: false,
  })
  await evolutionsApi.setAllocation('jwt', 'product-a', {
    expectedRevision: 44,
    mode: 'capacity',
    writersCompatible: true,
  })
  assert.deepEqual(
    calls.map((item) => JSON.parse(item.body)),
    [
      { expectedRevision: 11, label: 'Label' },
      { vpsProviderId: 'evo-a', expectedRevision: 22 },
      { expectedRevision: 33, acceptingNewInstances: false },
      { expectedRevision: 44, mode: 'capacity', writersCompatible: true },
    ]
  )
  assert.ok(calls.every((item) => item.headers.Authorization === 'Bearer jwt'))
})
test('creation and legacy bulk retain their existing payloads', async () => {
  const dto = { instanceName: 'product_test', integration: 'WHATSAPP-BAILEYS', qrcode: false }
  const response = await api.createInstance('jwt', 'product-a', dto)
  assert.equal(response.hubId, 'hub-a')
  assert.deepEqual(JSON.parse(calls[0].body), dto)
  await api.importInstancesBulk('jwt', 'product-a')
  assert.equal(calls[1].body, undefined)
  assert.equal(calls[1].url.includes('?'), false)
})
test('a 409 surfaces status/message once so the form can retain its draft', async () => {
  let attempts = 0
  global.fetch = async () => {
    attempts++
    return new Response('{"message":"Revisão desatualizada"}', { status: 409 })
  }
  await assert.rejects(
    evolutionsApi.update('jwt', 'evo-a', { expectedRevision: 2, label: 'Draft' }),
    (error) => error.status === 409 && error.message === 'Revisão desatualizada'
  )
  assert.equal(attempts, 1)
})
test('delete revisions are query parameters and empty 204 is accepted', async () => {
  global.fetch = async (url, opts) => {
    calls.push({ url, ...opts })
    return new Response(null, { status: 204 })
  }
  const result = await evolutionsApi.detach('jwt', 'product-a', 'evo-a', 33)
  assert.equal(result, undefined)
  assert.equal(calls[0].url, '/api/admin/products/product-a/evolutions/evo-a?expectedRevision=33')
  assert.equal(calls[0].body, undefined)
})

test('AR-02 forwards explicit drafts and stable request IDs, independent operation revisions and webhook consent', async () => {
  const draft = {
    requestId: 'retry-same-id',
    expectedRevision: 5,
    action: 'single_destination',
    targetProviderId: 'evo-a',
  }
  await evolutionsApi.prepareChange('jwt', 'product-a', draft)
  await evolutionsApi.prepareChange('jwt', 'product-a', draft)
  assert.equal(calls[0].body, calls[1].body)
  assert.equal(calls[0].method, 'POST')
  await evolutionsApi.applyChange('jwt', 'product-a', 'op/a', 6)
  await evolutionsApi.cancelChange('jwt', 'product-a', 'op/a', 7)
  await evolutionsApi.callbackCheck('jwt', 'product-a', 'op/a', 8, 'own-instance')
  assert.match(calls[2].url, /op%2Fa\/apply$/)
  assert.deepEqual(JSON.parse(calls[2].body), { expectedOperationRevision: 6 })
  assert.deepEqual(JSON.parse(calls[3].body), { expectedOperationRevision: 7 })
  assert.deepEqual(JSON.parse(calls[4].body), {
    expectedOperationRevision: 8,
    instanceId: 'own-instance',
    confirmWebhookUpdate: true,
  })
  await evolutionsApi.removal('jwt', 'evo-a')
  await evolutionsApi.retire('jwt', 'evo-a', 9, 10)
  assert.match(calls[5].url, /removal-readiness$/)
  assert.deepEqual(JSON.parse(calls[6].body), {
    expectedRevision: 9,
    expectedInventoryRevision: 10,
  })
  await evolutionsApi.confirmSetup('jwt', 11)
  assert.deepEqual(JSON.parse(calls[7].body), { expectedRevision: 11, writersCompatible: true })
  assert.ok(calls.every((c) => c.headers.Authorization === 'Bearer jwt'))
})

test('unavailable preparation has no mutation retry or fallback through legacy allocation/attach', async () => {
  global.fetch = async (url, opts) => {
    calls.push({ url, ...opts })
    return Response.json({ message: 'Not found' }, { status: 404 })
  }
  await assert.rejects(
    evolutionsApi.prepareChange('jwt', 'product-a', {
      requestId: 'one',
      action: 'configure_capacity',
      expectedRevision: 1,
    }),
    (e) => e.status === 404
  )
  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /evolution-changes$/)
})
