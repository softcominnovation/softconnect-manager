import { NextRequest } from 'next/server'
import { proxyRequest } from '../_utils/proxy'

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/instance/list')
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/instance/create', { method: 'POST' })
}
