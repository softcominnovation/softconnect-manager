import { NextRequest } from 'next/server'
import { proxyInstanceRequest } from '../../../_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  return proxyInstanceRequest(request, `/instance/${params.instanceId}/connect`)
}
