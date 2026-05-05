import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return proxyRequest(request, `/admin/products/${params.productId}/instances/import/bulk`, {
    method: 'POST',
  })
}
