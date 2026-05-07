import { NextRequest } from 'next/server'
import { proxyRequest } from '../../_utils/proxy'

export async function GET(request: NextRequest, { params }: { params: { vpsId: string } }) {
  return proxyRequest(request, `/admin/health/${params.vpsId}`)
}
