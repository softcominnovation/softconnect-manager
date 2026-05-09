import { NextRequest } from 'next/server'
import { proxyRequest } from '../../../../_utils/proxy'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; providerId: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}/providers/${params.providerId}`, { method: 'PUT' })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; providerId: string } }
) {
  return proxyRequest(request, `/admin/vps/${params.id}/providers/${params.providerId}`, { method: 'DELETE' })
}
