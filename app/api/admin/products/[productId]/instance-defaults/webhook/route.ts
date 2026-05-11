import { NextRequest } from 'next/server'
import { proxyRequest } from '../../../../../_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return proxyRequest(request, `/admin/products/${params.productId}/instance-defaults/webhook`, {
    method: 'GET',
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return proxyRequest(request, `/admin/products/${params.productId}/instance-defaults/webhook`, {
    method: 'PUT',
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return proxyRequest(request, `/admin/products/${params.productId}/instance-defaults/webhook`, {
    method: 'DELETE',
  })
}
