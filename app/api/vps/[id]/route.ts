import { NextRequest } from 'next/server'
import { proxyRequest } from '../../_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}`)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}`, { method: 'PUT' })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}`, { method: 'DELETE' })
}
