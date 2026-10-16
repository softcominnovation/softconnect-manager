const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')
const {
  distributionRows,
  distributionSelection,
  draftFromRows,
  changePollInterval,
  operationExpired,
  ChangeConsent,
  canPrepareCallback,
  apiUnavailable,
} = loader()('lib/evolution-changes.ts')
const entry = (id, priority = 0, identity = 'verified') => ({
  link: {
    productId: 'p1',
    vpsProviderId: id,
    allocationPriority: priority,
    acceptingNewInstances: true,
    configurationRevision: 3,
  },
  evolution: {
    id,
    configurationRevision: 7,
    maxInstances: null,
    identityStatus: identity,
    providerApiKey: 'must-not-leave-catalog',
    links: [{ productId: 'p2' }, { productId: 'p1' }],
  },
})
const options = {
  requestId: 'stable-request',
  reorder: false,
  identities: false,
  sharedLimits: true,
}
const base = { configurationRevision: 4 }
test('draft comparison ignores refreshed evidence but detects destinations, limits, admission and order', () => {
  const rows = distributionRows([entry('a', 0), entry('b', 1)])
  const original = distributionSelection(rows)
  const refreshed = distributionRows([entry('a', 0), entry('b', 1)])
  refreshed[0].provider.configurationRevision++
  refreshed[0].link.configurationRevision++
  refreshed[0].provider.occupancy = { effective: 99 }
  assert.equal(distributionSelection(refreshed), original)
  assert.notEqual(distributionSelection(rows.slice(0, 1)), original)
  assert.notEqual(distributionSelection([...rows].reverse(), true), original)
  assert.notEqual(distributionSelection([{ ...rows[0], admission: false }, rows[1]]), original)
  assert.notEqual(distributionSelection([{ ...rows[0], limit: '7' }, rows[1]]), original)
  assert.notEqual(distributionSelection([{ ...rows[0], limit: 'invalid' }, rows[1]]), original)
  assert.equal(distributionSelection([{ ...rows[0], limit: ' ' }, rows[1]]), original)
})
function operation(status = 'queued') {
  return {
    operationId: 'op',
    status,
    draft: { action: 'configure_capacity' },
    executionDeadline: new Date(5000).toISOString(),
    expiresAt: new Date(15000).toISOString(),
  }
}

test('opening tied links preserves effective order and existing priorities until explicitly reordered', () => {
  const rows = distributionRows([entry('b', 9), entry('a', 9)])
  assert.deepEqual(
    rows.map((r) => r.provider.id),
    ['a', 'b']
  )
  assert.deepEqual(
    draftFromRows('p1', base, rows, options).links.map((l) => l.allocationPriority),
    [9, 9]
  )
  assert.deepEqual(
    draftFromRows('p1', base, rows.reverse(), { ...options, reorder: true }).links.map((l) => [
      l.vpsProviderId,
      l.allocationPriority,
    ]),
    [
      ['b', 0],
      ['a', 1],
    ]
  )
})
test('shared global limit preserves null, exact impact and independent product/provider/link revisions; strips secrets', () => {
  const rows = distributionRows([entry('a')])
  Object.assign(rows[0], { limit: '80', limitEdited: true })
  const draft = draftFromRows('p1', base, rows, options)
  assert.equal(draft.expectedRevision, 4)
  assert.equal(draft.links[0].expectedRevision, 3)
  assert.deepEqual(draft.providerUpdates, [
    { vpsProviderId: 'a', expectedRevision: 7, maxInstances: 80 },
  ])
  assert.deepEqual(draft.confirmations.sharedLimits[0].productIds, ['p1', 'p2'])
  assert.equal(draft.confirmations.sharedLimits[0].expectedRevision, 7)
  assert.doesNotMatch(JSON.stringify(draft), /must-not-leave|providerApiKey|writersCompatible/)
  rows[0].provider.maxInstances = 80
  rows[0].limit = ''
  assert.equal(draftFromRows('p1', base, rows, options).providerUpdates[0].maxInstances, null)
  assert.throws(() => draftFromRows('p1', base, rows, { ...options, sharedLimits: false }))
})
test('new link remains paused unless explicitly selected, unchanged limits are not written', () => {
  const rows = distributionRows([entry('a')])
  const second = distributionRows([entry('b')])[0]
  delete second.link
  second.admission = false
  rows.push(second)
  const draft = draftFromRows('p1', base, rows, options)
  assert.equal(draft.links[1].acceptingNewInstances, false)
  assert.equal('expectedRevision' in draft.links[1], false)
  assert.deepEqual(draft.providerUpdates, [])
  rows[0].admission = false
  assert.throws(() => draftFromRows('p1', base, rows, options))
})
test('pending identity needs explicit confirmation; positive limits on paused installations also need it', () => {
  const rows = distributionRows([entry('a', 0, 'pending')])
  assert.throws(() => draftFromRows('p1', base, rows, options))
  assert.deepEqual(
    draftFromRows('p1', base, rows, { ...options, identities: true }).confirmations.identities,
    [{ vpsProviderId: 'a', expectedRevision: 7, confirmed: true }]
  )
  rows[0].admission = false
  rows[0].limit = '2'
  rows[0].limitEdited = true
  rows.push(distributionRows([entry('b')])[0])
  assert.throws(() => draftFromRows('p1', base, rows, options))
})
test('invalid limits and duplicate installations cannot form a draft', () => {
  for (const limit of ['0', '-1', '1e3', '1.3', '2147483648']) {
    const rows = distributionRows([entry('a')])
    rows[0].limit = limit
    rows[0].limitEdited = true
    assert.throws(() => draftFromRows('p1', base, rows, options))
  }
  assert.throws(() =>
    draftFromRows('p1', base, distributionRows([entry('a'), entry('a')]), options)
  )
})
test('controlled clock: only queued/running poll at 2 seconds, stopping at the execution deadline', () => {
  for (const status of ['queued', 'running']) {
    assert.equal(changePollInterval(operation(status), 4999), 2000)
    assert.equal(changePollInterval(operation(status), 5000), false)
    assert.equal(operationExpired(operation(status), 5000), true)
  }
  for (const status of ['ready', 'action_required', 'applied', 'failed', 'expired', 'cancelled'])
    assert.equal(changePollInterval(operation(status), 0), false)
  assert.equal(changePollInterval(undefined, 0), false)
  assert.equal(operationExpired(operation('ready'), 15000), true)
})
test('transient consent applies exactly the confirmed operation once, with visible same user/product and unchanged draft', () => {
  const c = new ChangeConsent(),
    op = operation('ready')
  c.authorize(op, 'user:product')
  assert.equal(c.claim(op, 'other:product', true, 1000), false)
  assert.equal(c.claim(op, 'user:other', true, 1000), false)
  assert.equal(c.claim(op, 'user:product', false, 1000), false)
  assert.equal(
    c.claim({ ...op, draft: { action: 'restore_legacy' } }, 'user:product', true, 1000),
    false
  )
  assert.equal(c.claim({ ...op, operationId: 'other' }, 'user:product', true, 1000), false)
  assert.equal(c.claim(op, 'user:product', true, 1000), true)
  assert.equal(c.claim(op, 'user:product', true, 1000), false)
})
test('reload, cancellation, draft edits, tab leave during POST and expiry never authorize background apply', () => {
  const c = new ChangeConsent(),
    op = operation('ready')
  assert.equal(c.claim(op, 'scope', true, 1000), false)
  const beforeRequest = c.checkpoint()
  c.clear()
  c.authorize(op, 'scope', beforeRequest)
  assert.equal(c.claim(op, 'scope', true, 1000), false)
  c.authorize(op, 'scope')
  c.clear()
  assert.equal(c.claim(op, 'scope', true, 1000), false)
  c.authorize(op, 'scope')
  assert.equal(c.claim(op, 'scope', true, 15000), false)
})
test('unavailable versions are distinguished from conflict/auth/provider failure', () => {
  for (const status of [404, 405, 501]) assert.equal(apiUnavailable({ status }), true)
  for (const status of [400, 401, 403, 409, 500, 503])
    assert.equal(apiUnavailable({ status }), false)
})

test('webhook preparation is never offered after cancellation, completion or execution deadline', () => {
  assert.equal(canPrepareCallback(operation('action_required'), 4999), true)
  assert.equal(canPrepareCallback(operation('action_required'), 5000), false)
  for (const status of ['queued', 'running', 'ready', 'applied', 'cancelled', 'expired', 'failed'])
    assert.equal(canPrepareCallback(operation(status), 0), false)
})
