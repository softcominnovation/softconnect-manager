import { NextRequest } from 'next/server'
import { proxyInstanceRequest } from '../_utils/proxy'

export async function GET(request: NextRequest) {
  return proxyInstanceRequest(request, '/instance/list')
}

export async function POST(request: NextRequest) {
  return proxyInstanceRequest(request, '/instance/create', { method: 'POST' })
}
