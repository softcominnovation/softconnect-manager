import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function POST(req: NextRequest, { params }: { params: { providerId: string } }) {
  return proxyRequest(req, `/admin/evolutions/${encodeURIComponent(params.providerId)}/reconcile`, {
    method: 'POST',
    sensitive: true,
  })
}
