// Isolated UI fixture. Never forwards requests or reads application .env files.
const http = require('node:http')
const now = () => new Date().toISOString()
const inventory = () => ({
  status: 'ready',
  asOf: now(),
  ageMs: 0,
  revision: 1,
  occupancyRevision: 1,
  fresh: true,
})
const vps = {
  id: 'vps-a',
  label: 'VPS de teste',
  subdomain: 'fixture.invalid',
  ip: '127.0.0.1',
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
}
const products = ['a', 'b'].map((id) => ({
  id: `product-${id}`,
  name: `Produto ${id.toUpperCase()}`,
  slug: `produto-${id}`,
  adapterType: 'evolution',
  origins: [],
  hubRelay: false,
  batchWebhookEnabled: false,
  batchWebhookUrl: null,
  isActive: true,
  vpsProviderId: 'evo-a',
  createdAt: now(),
  updatedAt: now(),
  allocationMode: 'legacy',
  allocationRevision: 1,
}))
const providers = ['a', 'b'].map((id) => ({
  id: `evo-${id}`,
  vpsId: 'vps-a',
  label: `Evolution ${id.toUpperCase()}`,
  providerUrl: `https://evo-${id}.example.invalid`,
  adapterType: 'evolution',
  isActive: true,
  maxInstances: null,
  acceptingNewInstances: true,
  configurationRevision: 1,
  hasProviderCredential: true,
  identityStatus: 'verified',
  callbackReadiness: 'ready',
  health: { isHealthy: true, asOf: now(), fresh: true },
  inventory: inventory(),
}))
const credentials = new Map(
  providers.map((provider) => [provider.id, `fixture-${provider.id}-key`])
)
const legacyView = (provider) => ({ ...provider, providerApiKey: credentials.get(provider.id) })
let links = products.map((product) => ({
  productId: product.id,
  vpsProviderId: 'evo-a',
  allocationPriority: 0,
  acceptingNewInstances: true,
  configurationRevision: 1,
}))
const instances = [
  {
    id: 'hub-a',
    providerInstanceId: 'remote-a',
    instanceName: 'produto_a_teste',
    productId: 'product-a',
    vpsProviderId: 'evo-a',
  },
]
const observed = []
const guided = require('./evolution-changes.cjs')({ products, providers, instances, getLinks: () => links, setLinks: value => { links = value } })
let conflictNext = false,
  stale = false,
  serial = 0
const safe = (value) =>
  JSON.parse(
    JSON.stringify(value, (key, item) =>
      /key|password|token|secret/i.test(key) ? '[redacted]' : item
    )
  )
function occupancy(provider) {
  const current = instances.filter((item) => item.vpsProviderId === provider.id)
  return {
    vpsProviderId: provider.id,
    instances: current.length,
    reservations: 0,
    effective: current.length,
    byProduct: Object.fromEntries(
      products.map((p) => [p.id, current.filter((i) => i.productId === p.id).length])
    ),
    maxInstances: provider.maxInstances,
    limitConfigured: provider.maxInstances !== null,
    available:
      provider.maxInstances === null ? null : Math.max(0, provider.maxInstances - current.length),
    overLimit: false,
    asOf: now(),
    inventory: { ...inventory(), ambiguous: false },
  }
}
function view(provider) {
  return {
    ...provider,
    inventory: { ...provider.inventory, fresh: !stale },
    occupancy: occupancy(provider),
    links: links
      .filter((item) => item.vpsProviderId === provider.id)
      .map((item) => ({ ...item, product: products.find((p) => p.id === item.productId) })),
  }
}
function policy(product) {
  const order = links
    .filter((item) => item.productId === product.id)
    .map((link) => ({
      ...link,
      maxInstances: providers.find((p) => p.id === link.vpsProviderId).maxInstances,
      eligible: link.acceptingNewInstances,
      blockers: link.acceptingNewInstances ? [] : ['link_paused'],
    }))
  return {
    mode: product.allocationMode,
    configurationRevision: product.allocationRevision,
    defaultProviderId: product.vpsProviderId,
    distributionEnabled: true,
    databaseConsolidated: true,
    requiresWriterConfirmation: true,
    capacityFirstAllocationAt: null,
    blockers: [],
    ready: true,
    order,
  }
}
const user = {
  id: 'admin-test',
  email: 'admin@example.invalid',
  name: 'Administrador de teste',
  type: 'super-admin',
  isActive: true,
  createdAt: now(),
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:43119')
  const path = url.pathname.replace(/^\/api\/v1/, '')
  let text = ''
  for await (const chunk of req) text += chunk
  let body
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    res.writeHead(400).end()
    return
  }
  const send = (value, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(status === 204 ? '' : JSON.stringify(value))
  }
  if (path === '/__control' && req.method === 'POST') {
    conflictNext = body.conflictNext ?? conflictNext
    stale = body.stale ?? stale
    guided.control(body)
    return send({ ok: true })
  }
  if (path === '/__observed') return send(observed)
  if (path.endsWith('/auth/dashboard/login')) return send({ access_token: 'fixture-admin-jwt' })
  if (req.headers.authorization !== 'Bearer fixture-admin-jwt')
    return send({ message: 'Fixture auth required' }, 401)
  observed.push({
    method: req.method,
    path,
    query: Object.fromEntries(url.searchParams),
    body: body ? safe(body) : null,
  })
  if (guided.route({ path, method: req.method, body, send })) return
  if (path.endsWith('/auth/dashboard/me')) return send(user)
  if (path === '/admin/health/hub/metrics') return send({ available: false })
  if (path === '/admin/health') return send([])
  if (path === '/admin/products') return send(products)
  if (path === '/admin/vps') return send([{ ...vps, providers: providers.map(view) }])
  if (path === '/admin/vps/vps-a') return send({ ...vps, providers: providers.map(view) })
  if (path === '/admin/vps/vps-a/providers' && req.method === 'GET')
    return send(providers.filter((provider) => provider.isActive).map(legacyView))
  if (
    (path === '/admin/evolutions' || path === '/admin/vps/vps-a/providers') &&
    req.method === 'POST'
  ) {
    const provider = {
      ...providers[0],
      ...body,
      id: `evo-new-${++serial}`,
      maxInstances: null,
      configurationRevision: 1,
    }
    credentials.set(provider.id, provider.providerApiKey)
    delete provider.providerApiKey
    providers.push(provider)
    return send(path.startsWith('/admin/vps/') ? legacyView(provider) : view(provider), 201)
  }
  if (path === '/admin/evolutions')
    return send(
      providers
        .filter(
          (p) =>
            (url.searchParams.get('isActive') === 'false' ? !p.isActive : p.isActive) &&
            (!url.searchParams.get('vpsId') || p.vpsId === url.searchParams.get('vpsId')) &&
            (!url.searchParams.get('productId') ||
              links.some(
                (l) => l.productId === url.searchParams.get('productId') && l.vpsProviderId === p.id
              )) &&
            (!url.searchParams.get('search') ||
              `${p.label} ${p.providerUrl}`
                .toLowerCase()
                .includes(url.searchParams.get('search').toLowerCase()))
        )
        .map(view)
    )
  const providerMatch = path.match(/^\/admin\/(?:evolutions|vps\/vps-a\/providers)\/([^/]+)(.*)$/)
  if (providerMatch) {
    const provider = providers.find((p) => p.id === providerMatch[1])
    if (!provider) return send({ message: 'Provider não encontrado' }, 404)
    const suffix = providerMatch[2]
    if (suffix === '/occupancy') return send(occupancy(provider))
    if (suffix === '/reconcile')
      return send(
        {
          operationId: 'operation-test',
          vpsProviderId: provider.id,
          status: 'pending',
          errorCode: null,
        },
        202
      )
    if (suffix.startsWith('/reconciliations/')) {
      stale = false
      return send({
        operationId: 'operation-test',
        vpsProviderId: provider.id,
        status: 'completed',
        errorCode: null,
      })
    }
    if (req.method === 'GET') return send(view(provider))
    if (conflictNext) {
      conflictNext = false
      provider.configurationRevision++
      return send({ message: 'Revisão desatualizada: teste de concorrência' }, 409)
    }
    const revision = body?.expectedRevision ?? Number(url.searchParams.get('expectedRevision'))
    if (path.startsWith('/admin/evolutions/') && revision !== provider.configurationRevision)
      return send({ message: 'Revisão desatualizada' }, 409)
    if (req.method === 'DELETE') provider.isActive = false
    else
      for (const key of [
        'label',
        'providerUrl',
        'vpsId',
        'maxInstances',
        'acceptingNewInstances',
        'isActive',
      ])
        if (Object.hasOwn(body, key)) provider[key] = body[key]
    if (body?.providerApiKey) credentials.set(provider.id, body.providerApiKey)
    provider.configurationRevision++
    return send(path.startsWith('/admin/vps/') ? legacyView(provider) : view(provider))
  }
  const pm = path.match(/^\/admin\/products\/([^/]+)(.*)$/)
  if (pm) {
    const product = products.find((p) => p.id === pm[1])
    if (!product) return send({ message: 'Produto não encontrado' }, 404)
    const suffix = pm[2]
    if (!suffix) return send(product)
    if (suffix === '/allocation') {
      if (req.method === 'PUT') {
        if (body.expectedRevision !== product.allocationRevision)
          return send({ message: 'Revisão desatualizada' }, 409)
        product.allocationMode = body.mode
        product.allocationRevision++
      }
      return send(policy(product))
    }
    const entries = () =>
      links
        .filter((l) => l.productId === product.id)
        .map((link) => ({
          link,
          evolution: view(providers.find((p) => p.id === link.vpsProviderId)),
          allocationRevision: product.allocationRevision,
        }))
    if (suffix === '/evolutions') return send(entries())
    if (suffix === '/evolutions/attach') {
      if (body.expectedRevision !== product.allocationRevision)
        return send({ message: 'Revisão desatualizada' }, 409)
      links.push({
        productId: product.id,
        vpsProviderId: body.vpsProviderId,
        allocationPriority: 100,
        acceptingNewInstances: false,
        configurationRevision: 1,
      })
      product.allocationRevision++
      return send(entries().find((e) => e.link.vpsProviderId === body.vpsProviderId))
    }
    const lm = suffix.match(/^\/evolutions\/([^/]+)(.*)$/)
    if (lm) {
      const link = links.find((l) => l.productId === product.id && l.vpsProviderId === lm[1])
      if (!link) return send({ message: 'Vínculo não encontrado' }, 404)
      if (lm[2] === '/import-candidates')
        return send({
          items: [
            {
              providerInstanceId: 'remote-import',
              instanceName: 'produto_a_importar',
              status: 'close',
              ownership: 'unassigned',
            },
          ],
          asOf: now(),
          inventoryStatus: stale ? 'stale' : 'ready',
          conflictCount: 0,
        })
      if (req.method === 'DELETE') {
        if (link.vpsProviderId === product.vpsProviderId)
          return send({ message: 'Vínculo em uso; pause novas admissões' }, 409)
        links = links.filter((l) => l !== link)
        product.allocationRevision++
        return send(null, 204)
      }
      if (body.expectedRevision !== link.configurationRevision)
        return send({ message: 'Revisão desatualizada' }, 409)
      Object.assign(link, {
        allocationPriority: body.allocationPriority ?? link.allocationPriority,
        acceptingNewInstances: body.acceptingNewInstances ?? link.acceptingNewInstances,
        configurationRevision: link.configurationRevision + 1,
      })
      product.allocationRevision++
      return send(entries().find((e) => e.link === link))
    }
    const owned = instances.filter((i) => i.productId === product.id)
    if (suffix === '/instances/placements')
      return send(
        owned.map((i) => {
          const p = providers.find((p) => p.id === i.vpsProviderId)
          return {
            instanceId: i.id,
            vpsProviderId: p.id,
            label: p.label,
            providerUrl: p.providerUrl,
            vpsId: p.vpsId,
          }
        })
      )
    if (suffix === '/instances/hub') return send(owned)
    if (suffix === '/instances/import/bulk')
      return send(
        {
          created: 0,
          skipped: 0,
          errors: 1,
          details: [
            {
              instanceName: 'produto_a_importar',
              result: 'error',
              reason: 'Conflito sintético: instância já vinculada',
            },
          ],
        },
        201
      )
    if (suffix === '/instances') {
      if (req.method === 'POST') {
        const i = {
          id: `hub-new-${++serial}`,
          providerInstanceId: `remote-new-${serial}`,
          instanceName: body.instanceName,
          productId: product.id,
          vpsProviderId: product.vpsProviderId,
        }
        instances.push(i)
        return send(
          {
            hubId: i.id,
            instanceId: i.providerInstanceId,
            instanceName: i.instanceName,
            status: 'close',
          },
          201
        )
      }
      return send(
        owned.map((i) => ({
          id: i.id,
          instance: {
            id: i.providerInstanceId,
            instanceName: i.instanceName,
            number: '5511000000000',
            integration: 'WHATSAPP-BAILEYS',
          },
          connectionStatus: 'close',
          createdAt: now(),
          updatedAt: now(),
        }))
      )
    }
    if (suffix.startsWith('/instances/')) return send({ status: 'close' })
    if (suffix.includes('instance-defaults')) return send({ webhook: null, proxy: null })
    if (suffix.includes('webhook-config')) return send({ url: null, secret: null, events: [] })
  }
  return send({ message: `Fixture route unavailable: ${path}` }, 404)
})
server.listen(Number(process.env.FIXTURE_PORT ?? 43119), '127.0.0.1', () =>
  console.log(`Synthetic Manager backend listening on 127.0.0.1:${process.env.FIXTURE_PORT ?? 43119}`)
)
