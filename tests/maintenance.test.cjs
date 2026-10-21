const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')
const {
  actionStateLabel,
  draftFromPolicy,
  maintenancePayload,
  needsHubConfirmation,
  parseAge,
  situationLabel,
} = loader()('lib/maintenance.ts')

const fingerprint = 'a'.repeat(64)
const view = {
  providerId: 'provider-1',
  revision: 2,
  providerRevision: 4,
  scopeFingerprint: fingerprint,
  policy: { enabled: false, mode: 'observe', action: 'disconnect', connectingMaxAgeMinutes: null },
  effective: {
    enabled: false,
    mode: 'observe',
    connectingMaxAgeMinutes: 480,
    intervalMs: 60000,
    maxObservationGapMs: 180000,
  },
  affectedProducts: [{ id: 'product-1', name: 'Loja' }],
  worker: { status: 'unknown', lastSeenAt: null, configurationMatches: false },
  monitoring: {
    lastAttemptAt: null,
    lastSuccessAt: null,
    nextCheckAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
  },
  counts: { observedConnecting: 0, eligible: 0, pendingConfirmation: 1 },
  blockers: [
    { code: 'master_disabled', message: 'Manutenção global desabilitada na API.' },
    { code: 'global_dry_run', message: 'Simulação global ativa: nenhuma instância será alterada.' },
  ],
}

test('empty age stays null and never becomes zero', () => {
  assert.equal(parseAge(''), null)
  assert.equal(parseAge('   '), null)
  assert.equal(draftFromPolicy(view).ageText, '')
  assert.throws(() => parseAge('0'), /1 e 525600/)
})

test('first observation enable confirms shared scope without deletion acknowledgement', () => {
  const draft = { enabled: true, mode: 'observe', action: 'disconnect', ageText: '' }
  assert.equal(needsHubConfirmation(view, { ...draft, connectingMaxAgeMinutes: null }), true)
  const body = maintenancePayload(view, draft)
  assert.equal(body.connectingMaxAgeMinutes, null)
  assert.deepEqual(body.confirmation, {
    action: 'disconnect',
    acknowledgeSharedScope: true,
  })
  assert.equal(body.expectedRevision, 2)
  assert.equal(body.expectedScopeFingerprint, fingerprint)
})

test('execute delete requires permanent acknowledgement and widening the age does not', () => {
  const enabled = {
    ...view,
    policy: { ...view.policy, enabled: true, mode: 'execute', action: 'disconnect' },
    blockers: [],
    worker: { status: 'online', lastSeenAt: '2026-10-21T12:00:00.000Z', configurationMatches: true },
  }
  const deletion = maintenancePayload(enabled, {
    enabled: true,
    mode: 'execute',
    action: 'delete',
    ageText: '10',
  })
  assert.equal(deletion.confirmation.acknowledgePermanentDeletion, true)
  const wider = {
    ...enabled,
    policy: { ...enabled.policy, connectingMaxAgeMinutes: 10 },
  }
  const body = maintenancePayload(wider, {
    enabled: true,
    mode: 'execute',
    action: 'disconnect',
    ageText: '30',
  })
  assert.equal(body.confirmation, undefined)
  assert.equal(body.connectingMaxAgeMinutes, 30)
})

test('status labels distinguish global block, stale worker and uncertain results', () => {
  assert.equal(situationLabel(view), 'Bloqueado por configuração global')
  assert.equal(
    situationLabel({ ...view, blockers: [], worker: { ...view.worker, status: 'stale' } }),
    'Worker sem confirmação'
  )
  assert.equal(
    actionStateLabel('delete', 'uncertain'),
    'Sem confirmação da Evolution; nenhuma nova tentativa automática'
  )
  assert.equal(
    actionStateLabel('delete', 'local_cleanup_pending'),
    'Exclusão remota confirmada; finalização no Hub pendente'
  )
  assert.equal(actionStateLabel('delete', 'succeeded'), 'Exclusão confirmada')
  assert.equal(actionStateLabel('disconnect', 'simulated'), 'Simulação')
})
