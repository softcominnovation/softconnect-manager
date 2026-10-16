import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/allocation`, { method: 'GET', sensitive: true })
}

export async function PUT(req: NextRequest, { params }: { params: { productId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/allocation`, { method: 'PUT', sensitive: true })
}
