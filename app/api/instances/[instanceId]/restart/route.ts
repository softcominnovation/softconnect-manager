import { NextRequest } from 'next/server'
import { proxyInstanceRequest } from '../../../_utils/proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  return proxyInstanceRequest(request, `/instance/${params.instanceId}/restart`, {
    method: 'POST',
  })
}
