import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function PUT(req: NextRequest, { params }: { params: { productId: string; providerId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/evolutions/${encodeURIComponent(params.providerId)}`, { method: 'PUT', sensitive: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { productId: string; providerId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/evolutions/${encodeURIComponent(params.providerId)}`, { method: 'DELETE', sensitive: true })
}
