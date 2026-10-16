import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function POST(req: NextRequest, { params }: { params: { productId: string; operationId: string } }) {
  return proxyRequest(req, `/admin/products/${encodeURIComponent(params.productId)}/evolution-changes/${encodeURIComponent(params.operationId)}/apply`, { method: 'POST', sensitive: true })
}

