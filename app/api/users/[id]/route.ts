import { NextRequest } from 'next/server'
import { proxyRequest } from '../../_utils/proxy'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/users/${params.id}`, { method: 'PUT' })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/users/${params.id}`, { method: 'DELETE' })
}
