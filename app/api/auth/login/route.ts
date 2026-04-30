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
      return NextResponse.json(
        { error: 'SOFTCONNECT_API_URL not configured' },
        { status: 500 }
      )
    }

    const resp = await fetch(`${API_BASE_URL}/admin/auth/dashboard/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status })
    }

    const encryptedToken = encryptToken(data.accessToken)

    return NextResponse.json({
      token: encryptedToken,
      user: data.user,
    })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
