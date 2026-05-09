import { NextRequest } from 'next/server'
import { proxyRequest } from '../../../_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}/providers`)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}/providers`, { method: 'POST' })
}
