import { NextRequest, NextResponse } from 'next/server'
import { encryptToken } from '../../_utils/proxy'

const API_BASE_URL = process.env.SOFTCONNECT_API_URL

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email e password são obrigatórios' },
        { status: 400 }
      )
    }

    if (!API_BASE_URL) {
      console.error('[login] SOFTCONNECT_API_URL not configured')
      return NextResponse.json(
        { error: 'SOFTCONNECT_API_URL not configured' },
        { status: 500 }
      )
    }

    const loginUrl = `${API_BASE_URL}/admin/auth/dashboard/login`
    console.log(`[login] POST ${loginUrl}`)

    const resp = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await resp.json().catch(() => ({}))
    console.log(`[login] status=${resp.status}`, JSON.stringify(data))

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status })
    }

    const rawToken: string = data.access_token ?? data.accessToken
    if (!rawToken) {
      console.error('[login] token ausente na resposta da API', data)
      return NextResponse.json({ error: 'Token não recebido da API' }, { status: 502 })
    }

    const encryptedToken = encryptToken(rawToken)

    const meUrl = `${API_BASE_URL}/admin/auth/dashboard/me`
    console.log(`[login] GET ${meUrl}`)
    const meResp = await fetch(meUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
    })
    const user = await meResp.json().catch(() => null)
    console.log(`[login] me status=${meResp.status}`, JSON.stringify(user))

    return NextResponse.json({
      token: encryptedToken,
      user: meResp.ok ? user : null,
    })
  } catch (err) {
    console.error('[login] erro interno:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
