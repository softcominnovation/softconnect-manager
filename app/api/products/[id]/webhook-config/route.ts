import { NextRequest } from 'next/server'
import { proxyRequest } from '../../../_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/products/${params.id}/webhook-config`, {
    method: 'GET',
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/products/${params.id}/webhook-config`, {
    method: 'PUT',
  })
}
