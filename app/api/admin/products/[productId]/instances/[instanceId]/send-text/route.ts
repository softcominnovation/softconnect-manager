import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string; instanceId: string } }
) {
  return proxyRequest(
    request,
    `/admin/products/${params.productId}/instances/${params.instanceId}/sendText`,
    { method: 'POST' }
  )
}
