const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')

function setup(config) {
  const calls = [],
    invalidations = []
  const hooks = loader({
    '@tanstack/react-query': {
      useMutation: (options) => options,
      useQueryClient: () => ({
        invalidateQueries: (options) => invalidations.push(options.queryKey),
      }),
    },
    '@/store/auth.store': { useAuthStore: (select) => select({ token: 'encrypted-fixture' }) },
    '@/store/webhook-configs.store': {
      useWebhookConfigsStore: (select) => select({ getConfig: (id) => config?.[id] }),
    },
    '@/lib/api': {
      api: {
        syncRelay: async (...args) => calls.push({ name: 'syncRelay', args }),
        createInstance: async (...args) => {
          calls.push({ name: 'create', args })
          return { hubId: 'hub-a', instanceId: 'remote-a' }
        },
        importInstancesBulk: async (...args) => {
          calls.push({ name: 'bulk', args })
          return { created: 0, skipped: 0, errors: 0, details: [] }
        },
      },
    },
    sonner: { toast: { success() {}, error() {} } },
  })('hooks/use-instances.ts')
  return { hooks, calls, invalidations }
}

test('create hook retains payload and syncs the Hub ID only for configured product', async () => {
  const { hooks, calls, invalidations } = setup({ 'product-a': { url: 'https://fixture.invalid' } })
  const mutation = hooks.useCreateInstance('product-a')
  const payload = { instanceName: 'fixture', qrcode: false, integration: 'WHATSAPP-BAILEYS' }
  const result = await mutation.mutationFn(payload)
  await mutation.onSuccess(result)
  assert.deepEqual(calls, [
    { name: 'create', args: ['encrypted-fixture', 'product-a', payload] },
    { name: 'syncRelay', args: ['encrypted-fixture', 'product-a', { instanceId: 'hub-a' }] },
  ])
  assert.ok(invalidations.some((key) => key[0] === 'instance-placements'))
})
test('without saved webhook config, create does not add a sync request', async () => {
  const { hooks, calls } = setup({ 'product-b': { url: 'https://fixture.invalid' } })
  await hooks.useCreateInstance('product-a').onSuccess({ hubId: 'hub-a', instanceId: 'remote-a' })
  assert.equal(calls.length, 0)
})
test('bulk hook preserves omitted options and forwards optional host/IDs', async () => {
  const { hooks, calls } = setup()
  const mutation = hooks.useImportInstancesBulk('product-a')
  await mutation.mutationFn(undefined)
  await mutation.mutationFn({ vpsProviderId: 'evo-b', instanceIds: ['remote-a'] })
  assert.deepEqual(calls[0].args, ['encrypted-fixture', 'product-a', undefined])
  assert.deepEqual(calls[1].args, [
    'encrypted-fixture',
    'product-a',
    { vpsProviderId: 'evo-b', instanceIds: ['remote-a'] },
  ])
})
