import { NextRequest } from 'next/server'
import { proxyRequest } from '../_utils/proxy'

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/admin/vps')
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/admin/vps', { method: 'POST' })
}
