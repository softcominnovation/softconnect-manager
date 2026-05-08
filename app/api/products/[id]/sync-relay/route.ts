import { NextRequest } from 'next/server'
import { proxyRequest } from '../../../_utils/proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, `/admin/products/${params.id}/sync-relay`, {
    method: 'POST',
  })
}
