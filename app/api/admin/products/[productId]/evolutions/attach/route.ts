import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/evolutions/attach`, { method: 'POST', sensitive: true })
}
