const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')

// Run the real editor/progress handlers with synthetic queries, without HTTP or a build.
function harness(status = 'applied') {
  const scopes = new Map(), effects = [], calls = []
  let cells, cursor, changed, tree, failedRead = false
  const react = {
    useState(initial) {
      const i = cursor++
      cells[i] ??= { value: typeof initial === 'function' ? initial() : initial }
      const cell = cells[i]
      return [cell.value, (value) => {
        const next = typeof value === 'function' ? value(cell.value) : value
        if (!Object.is(next, cell.value)) { cell.value = next; changed = true }
      }]
    },
    useRef(initial) {
      const i = cursor++
      cells[i] ??= { current: initial }
      return cells[i]
    },
    useEffect(effect, deps) {
      const i = cursor++, owner = cells, old = cells[i]
      if (!old || deps.some((value, n) => value !== old.deps[n]))
        effects.push(() => {
          old?.cleanup?.()
          owner[i] = { deps, cleanup: effect() }
        })
    },
  }
  const mutation = () => ({ isPending: false, reset() { this.error = undefined } })
  const provider = (id) => ({
    id, label: `Provider ${id}`, adapterType: 'evolution',
    providerUrl: 'https://example.invalid', maxInstances: null, configurationRevision: 1,
    identityStatus: 'verified', acceptingNewInstances: true,
    inventory: { fresh: true, asOf: null }, occupancy: { effective: 1, byProduct: { p1: 1 } },
    links: [{ productId: 'p1', product: { name: 'Test product' } }],
  })
  const a = provider('a'), b = provider('b')
  const link = { productId: 'p1', vpsProviderId: 'a', allocationPriority: 0,
    acceptingNewInstances: true, configurationRevision: 1 }
  const query = (name, data) => ({ data, isFetching: false,
    async refetch() {
      calls.push(`GET ${name}`)
      return { data: this.data, error: failedRead ? Error('Synthetic read failure') : null }
    },
  })
  const links = query('links', [{ evolution: a, link }])
  const allocation = query('allocation', { mode: 'capacity', defaultProviderId: 'a',
    configurationRevision: 1, order: [link] })
  const catalog = query('catalog', [a, b])
  const row = { operationId: 'old-operation', productId: 'p1', action: 'configure_capacity',
    status, revision: 3, draft: { requestId: 'old-request', action: 'configure_capacity',
      links: [link], providerUpdates: [] }, checks: [], requiredActions: [], callback: null,
    affectedProducts: ['p1'], createdAt: new Date().toISOString(),
    executionDeadline: new Date(Date.now() + 60000).toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString() }
  const journey = { operation: query('operation', row), history: query('history', { items: [row] }),
    busy: false, applyUncertain: false, prepare: mutation(), apply: mutation(),
    cancel: mutation(), callback: mutation(), clearConsent() {}, verify: async () => {}, resume() {} }
  journey.prepare.mutateAsync = async (draft) => {
    calls.push('PREPARE')
    journey.operation.data = { ...row, operationId: 'new-operation', status: 'queued', draft }
  }
  const mocks = {
    react, 'next/link': 'Link', 'lucide-react': { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown' },
    sonner: { toast: { info() {}, success() {} } },
    '@/components/ui/button': { Button: 'Button' }, '@/components/ui/input': { Input: 'Input' },
    '@/components/ui/label': { Label: 'Label' }, '@/components/ui/skeleton': { Skeleton: 'Skeleton' },
    '@/components/ui/dialog': Object.fromEntries(['Dialog', 'DialogContent', 'DialogHeader',
      'DialogTitle', 'DialogDescription', 'DialogFooter'].map(n => [n, n])),
    './shared': Object.fromEntries(['Panel', 'Choice', 'Failure', 'Acknowledgement'].map(n => [n, n])),
    '@/hooks/use-products': { useProductList: () => ({ data: [] }) },
    '@/hooks/use-evolutions': { useAllocation: () => allocation, useEvolutionList: () => catalog,
      useEvolutionMutation: mutation, useEvolutionSetup: () => ({ data: {} }),
      useProductEvolutions: () => links, useInstancePlacements: () => ({ data: [] }) },
    '@/hooks/use-evolution-journey': { useEvolutionJourney: () => journey },
    '@/store/auth.store': { useAuthStore: select => select({ token: 'synthetic', user: { id: 'test' } }) },
    '@/lib/evolutions-api': { evolutionsApi: {} },
  }
  const load = loader(mocks)
  const { ProductEvolutions } = load('components/providers/distribution-editor.tsx')
  const wrapper = ProductEvolutions({ productId: 'p1' })
  const editor = nodes(wrapper).find(el => el?.type?.name === 'DistributionEditor')
  function component(name, fn, props) {
    if (!scopes.has(name)) scopes.set(name, [])
    cells = scopes.get(name); cursor = 0
    return fn(props)
  }
  function expand(element) {
    if (Array.isArray(element)) return element.map(expand)
    if (!element || typeof element !== 'object') return element
    if (element.type?.name === 'EvolutionChangeProgress')
      return expand(component('progress', element.type, element.props))
    return { ...element, props: { ...element.props, children: expand(element.props.children) } }
  }
  function render() {
    let passes = 0
    do {
      changed = false
      tree = expand(component('editor', editor.type, editor.props))
      effects.splice(0).forEach(effect => effect())
      assert(++passes < 20, 'Component render should settle')
    } while (changed)
    return tree
  }
  const find = (predicate) => nodes(render()).find(predicate)
  const button = (label) => {
    const found = find(el => el?.type === 'Button' && text(el) === label)
    assert(found, `Missing button: ${label}`)
    assert(!found.props.disabled, `Disabled button: ${label}`)
    return found
  }
  async function click(label) { await button(label).props.onClick(); render() }
  function addProvider() {
    find(el => el?.type === 'Choice' && el.props.label === 'Adicionar Evolution existente ao rascunho')
      .props.onChange({ target: { value: 'b' } })
    button('Adicionar ao rascunho').props.onClick()
    render()
  }
  function editLimit(value) {
    find(el => el?.type === 'Input' && el.props.id === 'draft-limit-a')
      .props.onChange({ target: { value } })
    render()
  }
  return { render, find, click, addProvider, editLimit, journey, calls, links, allocation, catalog,
    text: () => text(render()), failRead: () => { failedRead = true },
    flush: async () => { await new Promise(resolve => setImmediate(resolve)); render() },
    close: () => { for (const scope of scopes.values()) scope.forEach(cell => cell?.cleanup?.()) } }
}
function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  if (typeof tree !== 'object') return [tree]
  if (tree.type === 'Dialog' && !tree.props.open) return []
  return [tree, ...nodes(tree.props?.children)]
}
function text(tree) { return nodes(tree).filter(n => typeof n === 'string' || typeof n === 'number').join('') }

test('a newly edited draft cannot inherit the success message of the previous operation', () => {
  const h = harness()
  try {
    h.addProvider()
    assert.match(h.text(), /alterações ainda não aplicadas/)
    assert.match(h.text(), /Operação selecionada aplicada; há alterações pendentes no rascunho/)
    assert.match(h.text(), /Esse resultado não confirma as alterações/)
    assert.deepEqual(h.calls, [])
  } finally { h.close() }
})

test('ready, applying and uncertain responses never announce saved configuration', () => {
  const h = harness('ready')
  try {
    assert.match(h.text(), /Falta aplicar esta configuração/)
    assert.match(h.text(), /Trocar de aba, reabrir a página ou editar/)
    h.journey.apply.isPending = true
    assert.match(h.text(), /Aplicando configuração; aguarde a confirmação/)
    assert.doesNotMatch(h.text(), /Falta aplicar esta configuração/)
    h.journey.apply.isPending = false
    h.journey.applyUncertain = true
    assert.match(h.text(), /Aplicação ainda não confirmada/)
    assert.doesNotMatch(h.text(), /A aplicação foi confirmada/)
  } finally { h.close() }
})

test('review offers a choice before replacing edits; keeping them refreshes only the reads', async () => {
  const h = harness()
  try {
    h.addProvider(); h.editLimit('7')
    await h.click('Revisar escolhas e preparar novamente')
    assert.match(h.text(), /Qual rascunho deseja revisar/)
    assert.deepEqual(h.calls, [])
    await h.click('Manter meu rascunho')
    assert.match(h.text(), /Provider b/)
    assert.equal(h.find(el => el?.type === 'Input' && el.props.id === 'draft-limit-a').props.value, '7')
    assert.deepEqual(h.calls.sort(), ['GET allocation', 'GET catalog', 'GET links'])
  } finally { h.close() }
})

test('closing review keeps all choices; explicit replacement restores the selected operation', async () => {
  const h = harness()
  try {
    h.addProvider(); h.editLimit('7')
    await h.click('Revisar escolhas e preparar novamente')
    h.find(el => el?.type === 'Dialog' && el.props.open).props.onOpenChange(false)
    assert.match(h.text(), /Provider b/)
    assert.deepEqual(h.calls, [])
    await h.click('Revisar escolhas e preparar novamente')
    await h.click('Substituir pelas escolhas da operação')
    assert(!h.find(el => el?.type === 'Input' && el.props.id === 'draft-limit-b'))
    assert.equal(h.find(el => el?.type === 'Input' && el.props.id === 'draft-limit-a').props.value, '')
    assert.deepEqual(h.calls.sort(), ['GET allocation', 'GET catalog', 'GET links'])
  } finally { h.close() }
})

test('failed refresh preserves the draft and the review choice without writing anything', async () => {
  const h = harness()
  try {
    h.addProvider(); h.editLimit('7'); h.failRead()
    await h.click('Revisar escolhas e preparar novamente')
    await h.click('Substituir pelas escolhas da operação')
    assert.match(h.text(), /Qual rascunho deseja revisar/)
    assert(h.find(el => el?.type === 'Failure' && /rascunho foi mantido/.test(el.props.error?.message)))
    assert(h.find(el => el?.type === 'Input' && el.props.id === 'draft-limit-b'))
    assert.equal(h.find(el => el?.type === 'Input' && el.props.id === 'draft-limit-a').props.value, '7')
    assert(h.calls.every(call => call.startsWith('GET ')))
  } finally { h.close() }
})

test('review with no edits still restores the operation directly and does not prepare or apply', async () => {
  const h = harness()
  try {
    await h.click('Revisar escolhas e preparar novamente'); await h.flush()
    assert.doesNotMatch(h.text(), /Qual rascunho deseja revisar/)
    assert.deepEqual(h.calls.sort(), ['GET allocation', 'GET catalog', 'GET links'])
  } finally { h.close() }
})

test('successful confirmed draft refreshes as applied while edits made later survive the result', async () => {
  for (const editLater of [false, true]) {
    const h = harness()
    try {
      h.addProvider()
      await h.click('Verificar e ativar distribuição')
      await h.click('Confirmar e verificar')
      const prepared = h.journey.operation.data
      assert.equal(prepared.draft.links.length, 2)
      if (editLater) h.editLimit('12')
      h.links.data = prepared.draft.links.map(link => ({ link: { ...link, configurationRevision: 2 },
        evolution: h.catalog.data.find(provider => provider.id === link.vpsProviderId) }))
      h.allocation.data = { ...h.allocation.data, configurationRevision: 2, order: prepared.draft.links }
      h.journey.operation.data = { ...prepared, status: 'applied' }
      h.render()
      if (editLater) {
        assert.equal(h.find(el => el?.type === 'Input' && el.props.id === 'draft-limit-a').props.value, '12')
        assert.match(h.text(), /há alterações pendentes no rascunho/)
      } else {
        assert.match(h.text(), /A aplicação foi confirmada/)
        assert.doesNotMatch(h.text(), /alterações ainda não aplicadas|novo vínculo no rascunho/)
      }
    } finally { h.close() }
  }
})
