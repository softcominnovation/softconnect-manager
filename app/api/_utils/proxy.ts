import { NextRequest, NextResponse } from 'next/server'
import { AES, enc } from 'crypto-js'

const PRODUCT_KEY_SEED = 'sc-pk-v1'

function decryptProductApiKey(encryptedKey: string): string {
  const bytes = AES.decrypt(encryptedKey, PRODUCT_KEY_SEED)
  const text = bytes.toString(enc.Utf8)
  if (!text) throw new Error('Invalid product API key')
  return text
}

const API_BASE_URL = process.env.SOFTCONNECT_API_URL
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY

export function encryptToken(token: string): string {
  if (!ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY not configured')
  return AES.encrypt(token, ENCRYPTION_KEY).toString()
}

export function decryptToken(encryptedToken: string): string {
  if (!ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY not configured')
  const bytes = AES.decrypt(encryptedToken, ENCRYPTION_KEY)
  const text = bytes.toString(enc.Utf8)
  if (!text) throw new Error('Invalid encrypted token')
  return text
}

export function buildQueryString(request: NextRequest): string {
  return new URL(request.url).searchParams.toString()
}

export async function proxyRequest(
  request: NextRequest,
  endpoint: string,
  options: {
    method?: string
    body?: unknown
    requireAuth?: boolean
  } = {}
): Promise<NextResponse> {
  const method = options.method ?? request.method

  let body = options.body
  if (!body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await request.json()
    } catch {
      /* sem body */
    }
  }

  const requireAuth = options.requireAuth ?? true

  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'SOFTCONNECT_API_URL not configured' },
      { status: 500 }
    )
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    if (requireAuth) {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Authorization required' },
          { status: 401 }
        )
      }

      const tokenPart = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader

      try {
        const realToken = decryptToken(tokenPart)
        headers['Authorization'] = `Bearer ${realToken}`
      } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    const qs = buildQueryString(request)
    const url = `${API_BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`
    console.log(`[proxy] ${method} ${url}`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeout)
    console.log(`[proxy] ${method} ${url} → ${resp.status}`)

    if (resp.status === 204) {
      return new Response(null, { status: 204 }) as NextResponse
    }

    let data: unknown = null
    try {
      const text = await resp.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }
      }
    } catch {
      /* resposta vazia */
    }

    return NextResponse.json(data, { status: resp.status })
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Request timeout'
        : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function proxyInstanceRequest(
  request: NextRequest,
  endpoint: string,
  options: {
    method?: string
    body?: unknown
  } = {}
): Promise<NextResponse> {
  const method = options.method ?? request.method

  let body = options.body
  if (!body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await request.json()
    } catch {
      /* sem body */
    }
  }

  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'SOFTCONNECT_API_URL not configured' },
      { status: 500 }
    )
  }

  const encryptedApiKey = request.headers.get('x-api-key')
  if (!encryptedApiKey) {
    return NextResponse.json(
      { error: 'x-api-key header required' },
      { status: 401 }
    )
  }

  let plainApiKey: string
  try {
    plainApiKey = decryptProductApiKey(encryptedApiKey)
  } catch {
    return NextResponse.json({ error: 'Invalid x-api-key' }, { status: 401 })
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: plainApiKey,
    }

    const qs = buildQueryString(request)
    const url = `${API_BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`
    console.log(`[proxy-instance] ${method} ${url}`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeout)
    console.log(`[proxy-instance] ${method} ${url} → ${resp.status}`)

    if (resp.status === 204) {
      return new Response(null, { status: 204 }) as NextResponse
    }

    let data: unknown = null
    try {
      const text = await resp.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }
      }
    } catch {
      /* resposta vazia */
    }

    return NextResponse.json(data, { status: resp.status })
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Request timeout'
        : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
