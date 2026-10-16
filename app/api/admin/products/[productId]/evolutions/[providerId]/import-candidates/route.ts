import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(req: NextRequest, { params }: { params: { productId: string; providerId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/evolutions/${encodeURIComponent(params.providerId)}/import-candidates`, { method: 'GET', sensitive: true })
}
