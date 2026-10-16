// Synthetic administrative operations for browser verification only. No external I/O.
module.exports = ({ products, providers, instances, getLinks, setLinks }) => {
  const operations = new Map()
  const controls = { delayMs: 4000, check: '', unsupported: false, applyConflict: false }
  const setup = {
    distributionEnabled: true,
    databaseConsolidated: true,
    requirementsVersion: 'synthetic-ar-01',
    confirmationRequired: true,
    revision: 0,
    confirmation: null,
  }
  let serial = 0
  const now = () => new Date().toISOString()
  const inspect = (op) => {
    if (op.status !== 'queued' && op.status !== 'running') return op
    op.status = 'running'
    if (Date.now() - Date.parse(op.createdAt) < controls.delayMs) return op
    let code = controls.check
    if (setup.confirmationRequired) code = 'writers_unconfirmed'
    const product = products.find((p) => p.id === op.productId)
    const target = op.draft.targetProviderId
    if (
      op.action === 'detach' &&
      (target === product.vpsProviderId ||
        instances.some((i) => i.productId === op.productId && i.vpsProviderId === target))
    )
      code = 'instances_present'
    if (
      op.action === 'restore_legacy' &&
      instances.some((i) => i.productId === op.productId && i.vpsProviderId !== target)
    )
      code = 'instances_outside_target'
    const messages = {
      writers_unconfirmed: 'O responsável deve confirmar a preparação do ambiente uma vez.',
      credential_invalid: 'A Evolution recusou a credencial.',
      no_capacity: 'Nenhum destino selecionado tem vaga disponível.',
      callback_unconfirmed: 'Ainda falta receber um evento autenticado desta Evolution.',
      instances_present:
        'Ainda há instâncias ou referência padrão neste vínculo. Pause novas criações.',
      instances_outside_target:
        'Ainda existem instâncias em outros destinos; use destino único para novas criações.',
      configuration_changed: 'A configuração mudou; prepare novamente.',
    }
    op.status = code ? 'action_required' : 'ready'
    op.stage = op.status
    op.revision++
    op.checks = code
      ? [
          {
            code,
            message: messages[code] ?? 'Revise a configuração antes de continuar.',
            blocking: true,
            providerId: 'evo-a',
            observedAt: now(),
          },
        ]
      : []
    op.requiredActions =
      code === 'writers_unconfirmed'
        ? [{ code, destination: 'environment-setup' }]
        : code === 'callback_unconfirmed'
          ? [
              {
                code: 'confirm_instance_webhook',
                providerId: 'evo-a',
                destination: 'callback',
                instanceIds: ['hub-a'],
              },
              { code: 'use_dedicated_test_product', providerId: 'evo-b', destination: 'callback' },
            ]
          : code
            ? [{ code, providerId: 'evo-a', destination: 'draft-review' }]
            : []
    return op
  }
  const removal = (p) => {
    const own = instances.filter((i) => i.vpsProviderId === p.id)
    const usage = {
      instances: own.length,
      defaults: products.filter((product) => product.vpsProviderId === p.id).length,
      links: getLinks().filter((l) => l.vpsProviderId === p.id).length,
      inventory: own.length,
      callbacks: 0,
      pending: 0,
      reconciliation: 0,
    }
    const blockers = Object.entries(usage)
      .filter(([, count]) => count > 0)
      .map(([key]) => `${key}_present`)
    return {
      providerId: p.id,
      isActive: p.isActive,
      revision: p.configurationRevision,
      inventoryRevision: 1,
      inventoryObservedAt: now(),
      usage,
      instancesByProduct: products
        .map((product) => ({
          productId: product.id,
          _count: { _all: own.filter((i) => i.productId === product.id).length },
        }))
        .filter((p) => p._count._all),
      blockers,
      removable: !blockers.length,
    }
  }
  return {
    control: (body) => {
      Object.assign(controls, body.guided ?? {})
      if (body.setup) Object.assign(setup, body.setup)
      if (body.ready)
        for (const op of operations.values())
          if (op.status === 'queued' || op.status === 'running') op.status = 'ready'
    },
    route: ({ path, method, body, send }) => {
      if (!/evolution-setup|evolution-changes|removal-readiness|retirement/.test(path)) return false
      const reply = (value, status) => {
        send(value, status)
        return true
      }
      if (controls.unsupported) return reply({ message: 'API fixture sem suporte AR-01' }, 404)
      if (path === '/admin/evolution-setup') return reply(setup)
      if (path === '/admin/evolution-setup/confirmation') {
        if (body.expectedRevision !== setup.revision || body.writersCompatible !== true)
          return reply({ message: 'Revisão alterada' }, 409)
        setup.confirmationRequired = false
        setup.revision++
        setup.confirmation = { actor: 'Administrador de teste', confirmedAt: now() }
        return reply(setup)
      }
      const removalMatch = path.match(
        /^\/admin\/evolutions\/([^/]+)\/(removal-readiness|retirement)$/
      )
      if (removalMatch) {
        const p = providers.find((p) => p.id === removalMatch[1])
        if (!p) return reply({ message: 'Não encontrado' }, 404)
        const state = removal(p)
        if (removalMatch[2] === 'retirement') {
          if (
            !state.removable ||
            body.expectedRevision !== state.revision ||
            body.expectedInventoryRevision !== state.inventoryRevision
          )
            return reply({ message: 'Evolution em uso ou revisão alterada' }, 409)
          p.isActive = false
          p.configurationRevision++
        }
        return reply(removal(p))
      }
      const match = path.match(
        /^\/admin\/products\/([^/]+)\/evolution-changes(?:\/([^/]+)(?:\/(apply|cancel|callback-check))?)?$/
      )
      if (!match) return reply({ message: 'Não encontrado' }, 404)
      const product = products.find((p) => p.id === match[1])
      if (!product) return reply({ message: 'Não encontrado' }, 404)
      if (!match[2] && method === 'GET')
        return reply({
          items: Array.from(operations.values())
            .filter((op) => op.productId === product.id)
            .reverse()
            .map(inspect),
        })
      if (!match[2]) {
        const found = Array.from(operations.values()).find(
          (op) => op.productId === product.id && op.draft.requestId === body.requestId
        )
        if (found) return reply(found, 202)
        if (body.expectedRevision !== product.allocationRevision)
          return reply(
            { message: 'Revisão do produto alterada; suas escolhas devem ser revistas.' },
            409
          )
        const op = {
          operationId: `change-${++serial}`,
          productId: product.id,
          action: body.action,
          status: 'queued',
          stage: 'queued',
          revision: 1,
          actor: 'Administrador de teste',
          createdAt: now(),
          updatedAt: now(),
          executionDeadline: new Date(Date.now() + 120000).toISOString(),
          expiresAt: new Date(Date.now() + 1800000).toISOString(),
          affectedProducts: body.providerUpdates?.length ? products.map((p) => p.id) : [product.id],
          checks: [],
          requiredActions: [],
          draft: body,
          callback: null,
          result: null,
        }
        operations.set(op.operationId, op)
        return reply(op, 202)
      }
      const op = operations.get(match[2])
      if (!op || op.productId !== product.id) return reply({ message: 'Não encontrado' }, 404)
      if (!match[3]) return reply(inspect(op))
      if (op.status === 'applied') return reply(op)
      if (body.expectedOperationRevision !== op.revision)
        return reply({ message: 'Revisão da operação alterada' }, 409)
      if (match[3] === 'cancel') {
        op.status = 'cancelled'
        op.revision++
        return reply(op)
      }
      if (match[3] === 'callback-check') {
        if (body.instanceId !== 'hub-a' || body.confirmWebhookUpdate !== true)
          return reply({ message: 'Escolha uma instância própria' }, 409)
        op.callback = { instanceId: 'hub-a', providerId: 'evo-a', state: 'configured' }
        return reply(op)
      }
      if (controls.applyConflict) {
        controls.applyConflict = false
        product.allocationRevision++
        op.status = 'action_required'
        op.checks = [
          {
            code: 'configuration_changed',
            blocking: true,
            message: 'Outro administrador mudou os vínculos. Revise as escolhas.',
          },
        ]
        return reply({ message: 'Revisão alterada entre preparação e aplicação.' }, 409)
      }
      if (op.status !== 'ready')
        return reply({ message: 'A verificação ainda não está pronta' }, 409)
      if (op.action === 'configure_capacity') {
        for (const incoming of op.draft.links ?? []) {
          const existing = getLinks().find(
            (l) => l.productId === product.id && l.vpsProviderId === incoming.vpsProviderId
          )
          if (existing)
            Object.assign(existing, incoming, {
              configurationRevision: existing.configurationRevision + 1,
            })
          else getLinks().push({ productId: product.id, ...incoming, configurationRevision: 1 })
        }
        for (const update of op.draft.providerUpdates ?? []) {
          const p = providers.find((p) => p.id === update.vpsProviderId)
          p.maxInstances = update.maxInstances
          p.configurationRevision++
        }
        product.allocationMode = 'capacity'
      } else if (op.action === 'single_destination') {
        getLinks()
          .filter((l) => l.productId === product.id)
          .forEach((l) => {
            l.acceptingNewInstances = l.vpsProviderId === op.draft.targetProviderId
            l.configurationRevision++
          })
        product.allocationMode = 'capacity'
      } else if (op.action === 'restore_legacy') {
        product.allocationMode = 'legacy'
        product.vpsProviderId = op.draft.targetProviderId
      } else
        setLinks(
          getLinks().filter(
            (l) => l.productId !== product.id || l.vpsProviderId !== op.draft.targetProviderId
          )
        )
      product.allocationRevision++
      op.status = 'applied'
      op.revision++
      return reply(op)
    },
  }
}
