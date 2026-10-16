const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')
const load = loader()
const { parseOptionalLimit, capacityPatch, availabilityText, bulkRequest } =
  load('lib/evolutions.ts')
const { providerFormSchema, providerChanges } = load('lib/provider-form.ts')
const { buildHubInstanceMap, resolveHubEntry } = load('lib/instance-identity.ts')

test('empty limits stay null; a positive integer is explicit', () => {
  assert.equal(parseOptionalLimit(''), null)
  assert.equal(parseOptionalLimit('  '), null)
  assert.equal(parseOptionalLimit('80'), 80)
  for (const invalid of ['0', '-1', '1.5', '1e3', 'Infinity', '2147483648'])
    assert.throws(() => parseOptionalLimit(invalid))
})
test('limits require persisted environment readiness without sending a new writer confirmation', () => {
  assert.deepEqual(capacityPatch(null, '', 12, false), { expectedRevision: 12 })
  assert.deepEqual(capacityPatch(40, '40', 12, false), { expectedRevision: 12 })
  assert.deepEqual(capacityPatch(40, '', 12, false), { expectedRevision: 12, maxInstances: null })
  assert.throws(() => capacityPatch(null, '40', 12, false))
  assert.deepEqual(capacityPatch(null, '40', 12, true), {
    expectedRevision: 12,
    maxInstances: 40,
  })
})
test('unlimited, unknown availability and zero availability are distinct', () => {
  assert.match(availabilityText({ maxInstances: null, available: null }), /Sem limite/)
  assert.match(availabilityText({ maxInstances: 40, available: null }), /Sem informação/)
  assert.equal(availabilityText({ maxInstances: 40, available: 0 }), '0 vagas disponíveis')
})
test('legacy import keeps original URL and no body; host/IDs are optional', () => {
  assert.deepEqual(bulkRequest('product-a'), {
    url: '/api/admin/products/product-a/instances/import/bulk',
  })
  assert.deepEqual(bulkRequest('product-a', { vpsProviderId: 'evo-b' }), {
    url: '/api/admin/products/product-a/instances/import/bulk?vpsProviderId=evo-b',
  })
  assert.deepEqual(
    bulkRequest('product-a', { vpsProviderId: 'evo-b', instanceIds: ['remote-1'] }),
    {
      url: '/api/admin/products/product-a/instances/import/bulk?vpsProviderId=evo-b',
      body: '{"instanceIds":["remote-1"]}',
    }
  )
  for (const ids of [[], [''], ['  '], ['same', 'same']])
    assert.throws(() => bulkRequest('product-a', { instanceIds: ids }))
})
test('dedicated provider form requires a credential only on creation', () => {
  const values = {
    label: 'Evolution',
    providerUrl: 'https://evo.example.invalid',
    providerApiKey: '',
    adapterType: 'evolution',
    vpsId: 'vps-a',
  }
  assert.equal(providerFormSchema(false).safeParse(values).success, false)
  assert.equal(providerFormSchema(true).safeParse(values).success, true)
  assert.equal(
    providerFormSchema(false).safeParse({ ...values, providerApiKey: 'synthetic-key' }).success,
    true
  )
  assert.equal(
    providerFormSchema(false).safeParse({ ...values, providerApiKey: '   ' }).success,
    false
  )
  assert.equal(
    providerFormSchema(true).safeParse({ ...values, providerUrl: 'ftp://invalid.test' }).success,
    false
  )
})
test('editing a label preserves credential, capacity, admission and product defaults', () => {
  const original = {
    label: 'Evolution',
    providerUrl: 'https://evo.example.invalid',
    adapterType: 'evolution',
    vpsId: 'vps-a',
  }
  assert.deepEqual(
    providerChanges({ ...original, label: 'Renamed', providerApiKey: '' }, original),
    { label: 'Renamed' }
  )
  assert.deepEqual(providerChanges({ ...original, providerApiKey: 'new-secret' }, original), {
    providerApiKey: 'new-secret',
  })
})

test('prefilled key is not resubmitted by the dedicated editor unless changed', () => {
  const original = {
    label: 'Evolution',
    providerUrl: 'https://evo.example.invalid',
    providerApiKey: 'fixture-current-key',
    adapterType: 'evolution',
    vpsId: 'vps-a',
  }
  assert.deepEqual(providerChanges({ ...original, label: 'Renamed' }, original), {
    label: 'Renamed',
  })
  assert.deepEqual(providerChanges({ ...original, providerApiKey: '' }, original), {})
  assert.deepEqual(providerChanges({ ...original, providerApiKey: '   ' }, original), {})
  assert.deepEqual(providerChanges({ ...original, providerApiKey: 'replacement' }, original), {
    providerApiKey: 'replacement',
  })
})

test('dedicated credential query uses existing admin route and selects only the requested active provider', async () => {
  const calls = []
  const hooks = loader({
    '@tanstack/react-query': { useQuery: (options) => options },
    '@/store/auth.store': { useAuthStore: (select) => select({ token: 'encrypted-fixture' }) },
    '@/lib/api': {
      api: {
        getVpsProviders: async (...args) => {
          calls.push(args)
          return [
            { id: 'other', providerApiKey: 'wrong-key' },
            { id: 'evo-a', providerApiKey: 'current-key' },
          ]
        },
      },
    },
    '@/lib/evolutions-api': { evolutionsApi: {} },
  })('hooks/use-evolutions.ts')
  const provider = { id: 'evo-a', vpsId: 'vps-a', isActive: true, configurationRevision: 2 }
  const query = hooks.useEvolutionCredential(provider)
  assert.equal(await query.queryFn(), 'current-key')
  assert.deepEqual(calls, [['encrypted-fixture', 'vps-a']])
  assert.equal(query.gcTime, 0)
  assert.notDeepEqual(
    query.queryKey,
    hooks.useEvolutionCredential({ ...provider, configurationRevision: 3 }).queryKey
  )
  assert.equal(await hooks.useEvolutionCredential({ ...provider, isActive: false }).queryFn(), null)
  assert.equal(await hooks.useEvolutionCredential({ ...provider, id: 'missing' }).queryFn(), null)
  assert.equal(calls.length, 2)
})
test('remote ID collisions do not choose an instance on the wrong host', () => {
  const a = { id: 'hub-a', instanceName: 'product_a', providerInstanceId: 'remote-same' }
  const b = { id: 'hub-b', instanceName: 'product_b', providerInstanceId: 'remote-same' }
  const map = buildHubInstanceMap([a, b])
  assert.equal(map.has('remote-same'), false)
  assert.equal(
    resolveHubEntry(
      { id: 'remote-same', name: 'product_b', providerInstanceId: 'remote-same' },
      map
    ),
    b
  )
  assert.equal(
    resolveHubEntry({ id: 'hub-a', name: 'product_b', providerInstanceId: 'remote-same' }, map),
    a
  )
  assert.equal(
    resolveHubEntry({ id: 'unknown', name: 'unknown', providerInstanceId: 'remote-same' }, map),
    undefined
  )
  assert.equal(buildHubInstanceMap([a]).get('remote-same'), a)
})
