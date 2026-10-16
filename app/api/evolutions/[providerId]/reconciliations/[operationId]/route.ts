import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(
  req: NextRequest,
  { params }: { params: { providerId: string; operationId: string } }
) {
  return proxyRequest(
    req,
    `/admin/evolutions/${encodeURIComponent(params.providerId)}/reconciliations/${encodeURIComponent(params.operationId)}`,
    { method: 'GET', sensitive: true }
  )
}
