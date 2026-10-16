import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(req: NextRequest, { params }: { params: { providerId: string } }) {
  return proxyRequest(req, `/admin/evolutions/${encodeURIComponent(params.providerId)}/occupancy`, {
    method: 'GET',
    sensitive: true,
  })
}
