const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./load-typescript.cjs')

function harness() {
  const cells = [],
    effects = [],
    calls = [],
    queries = []
  let cursor = 0,
    current,
    pendingResolve,
    refetchError = false,
    closed = false
  const auth = { token: 'jwt-local', user: { id: 'user' } }
  const doc = new EventTarget()
  doc.visibilityState = 'visible'
  const previousDocument = global.document
  global.document = doc
  const react = {
    useState: (initial) => {
      const i = cursor++
      cells[i] ??= { value: typeof initial === 'function' ? initial() : initial }
      return [
        cells[i].value,
        (value) => {
          cells[i].value = typeof value === 'function' ? value(cells[i].value) : value
        },
      ]
    },
    useRef: (initial) => {
      const i = cursor++
      cells[i] ??= { current: initial }
      return cells[i]
    },
    useEffect: (effect, deps) => {
      const i = cursor++
      const old = cells[i]
      if (!old || deps.some((value, n) => value !== old.deps[n]))
        effects.push(() => {
          old?.cleanup?.()
          cells[i] = { deps, cleanup: effect() }
        })
    },
  }
  const query = {
    data: undefined,
    refetch: async () => ({ data: query.data, error: refetchError ? Error('read failed') : null }),
  }
  const store = (select) => select(auth)
  store.getState = () => auth
  const mutate = (options) => {
    const result = {
      isPending: false,
      reset() {},
      mutate: (input) => {
        void result.mutateAsync(input).catch(() => {})
      },
      mutateAsync: async (input) => {
        const context = await options.onMutate?.(input)
        try {
          const value = await options.mutationFn(input)
          await options.onSuccess?.(value, input, context)
          return value
        } catch (error) {
          result.error = error
          await options.onError?.(error)
          throw error
        }
      },
    }
    return result
  }
  const qc = {
    setQueryData: (_key, value) => {
      query.data = value
    },
    invalidateQueries: async () => {},
  }
  const api = {
    prepareChange: async (...args) => {
      calls.push(['prepare', ...args])
      return new Promise((resolve) => {
        pendingResolve = resolve
      })
    },
    applyChange: async (...args) => {
      calls.push(['apply', ...args])
      if (refetchError) throw Error('lost response')
      return { ...query.data, status: 'applied' }
    },
    cancelChange: async (...args) => {
      calls.push(['cancel', ...args])
      return { ...query.data, status: 'cancelled' }
    },
    callbackCheck: async (...args) => {
      calls.push(['callback', ...args])
      return { ...query.data, status: 'queued' }
    },
  }
  const hooks = loader({
    react,
    '@tanstack/react-query': {
      useMutation: mutate,
      useQueryClient: () => qc,
      useQuery: (options) => {
        queries.push(options)
        return options
      },
    },
    '@/store/auth.store': { useAuthStore: store },
    '@/lib/evolutions-api': { evolutionsApi: api },
    './use-evolutions': {
      evolutionQueryRoots: ['evolution-change'],
      useEvolutionChanges: () => ({ data: { items: [] } }),
      useEvolutionChange: () => query,
    },
  })
  const use = hooks('hooks/use-evolution-journey.ts').useEvolutionJourney
  const render = () => {
    cursor = 0
    current = use('p1', true)
    effects.splice(0).forEach((effect) => effect())
    return current
  }
  const row = () => ({
    operationId: 'op1',
    productId: 'p1',
    status: 'queued',
    revision: 1,
    draft: { action: 'configure_capacity' },
    executionDeadline: new Date(0).toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  })
  return {
    render,
    row,
    calls,
    auth,
    query,
    queries,
    hooks,
    resolve: (value) => pendingResolve(value),
    hide: () => {
      doc.visibilityState = 'hidden'
      doc.dispatchEvent(new Event('visibilitychange'))
      doc.visibilityState = 'visible'
    },
    fail: () => {
      refetchError = true
    },
    restore: () => {
      refetchError = false
    },
    close: () => {
      if (closed) return
      closed = true
      cells.forEach((cell) => cell?.cleanup?.())
      global.document = previousDocument
    },
  }
}
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('confirmed mounted journey automatically applies once; query refresh does not replay mutation', async () => {
  const h = harness()
  try {
    const journey = h.render()
    const sending = journey.prepare.mutateAsync({ action: 'configure_capacity' })
    await tick()
    h.resolve(h.row())
    await sending
    h.query.data.status = 'ready'
    h.render()
    await tick()
    assert.equal(h.calls.filter((c) => c[0] === 'apply').length, 1)
    h.render()
    await tick()
    assert.equal(h.calls.filter((c) => c[0] === 'apply').length, 1)
  } finally {
    h.close()
  }
})
for (const leave of ['hide', 'close', 'edit'])
  test(`leaving during prepare (${leave}) cannot authorize a late automatic apply`, async () => {
    const h = harness()
    try {
      const journey = h.render()
      const sending = journey.prepare.mutateAsync({})
      await tick()
      if (leave === 'edit') journey.clearConsent()
      else h[leave]()
      h.resolve({ ...h.row(), status: 'ready' })
      await sending
      if (leave !== 'close') h.render()
      await tick()
      assert.equal(h.calls.filter((c) => c[0] === 'apply').length, 0)
    } finally {
      h.close()
    }
  })
test('resumed ready operation requires explicit apply and a changed session blocks every mutation', async () => {
  const h = harness()
  try {
    h.query.data = { ...h.row(), status: 'ready' }
    const journey = h.render()
    await tick()
    assert.equal(h.calls.length, 0)
    h.auth.token = 'another-session'
    await assert.rejects(journey.apply.mutateAsync(h.query.data), /sessão mudou/)
    assert.equal(h.calls.length, 0)
  } finally {
    h.close()
  }
})
test('leaving after preparation revokes automatic apply; returning can conclude without preparing again', async () => {
  const h = harness()
  try {
    const sending = h.render().prepare.mutateAsync({ action: 'configure_capacity' })
    await tick()
    h.resolve(h.row())
    await sending
    h.render()
    h.hide()
    h.query.data = { ...h.query.data, status: 'ready', revision: 2 }
    h.render()
    await tick()
    await h.render().verify()
    h.render()
    await tick()
    assert.equal(h.calls.filter(c => c[0] === 'apply').length, 0)
    await h.render().apply.mutateAsync(h.query.data)
    assert.equal(h.query.data.status, 'applied')
    assert.equal(h.calls.filter(c => c[0] === 'prepare').length, 1)
    assert.equal(h.calls.filter(c => c[0] === 'apply').length, 1)
  } finally {
    h.close()
  }
})
test('lost apply response forces a successful operation read before another apply can be offered', async () => {
  const h = harness()
  try {
    h.query.data = { ...h.row(), status: 'ready' }
    const journey = h.render()
    h.fail()
    await assert.rejects(journey.apply.mutateAsync(h.query.data))
    await tick()
    assert.equal(h.render().applyUncertain, true)
    h.restore()
    h.query.data.status = 'applied'
    await h.render().verify()
    assert.equal(h.render().applyUncertain, false)
    assert.equal(h.calls.filter((c) => c[0] === 'apply').length, 1)
  } finally {
    h.close()
  }
})
test('query policy is scoped by user/product, disables retries/background polling and stops on error', () => {
  const h = harness()
  try {
    const options = h.hooks('hooks/use-evolutions.ts').useEvolutionChange('p1', 'op1')
    assert.deepEqual(options.queryKey, ['evolution-change', 'user', 'p1', 'op1'])
    assert.equal(options.retry, false)
    assert.equal(options.refetchIntervalInBackground, false)
    assert.equal(options.refetchOnWindowFocus, false)
    assert.equal(options.gcTime, 0)
    assert.equal(options.refetchInterval({ state: { error: Error(), data: h.row() } }), false)
    assert.equal(h.hooks('hooks/use-evolutions.ts').useEvolutionChange('p1', '').enabled, false)
  } finally {
    h.close()
  }
})
