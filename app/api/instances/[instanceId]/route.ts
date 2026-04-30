import { NextRequest } from 'next/server'
import { proxyRequest } from '../../_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  return proxyRequest(request, `/instance/${params.instanceId}`)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  return proxyRequest(request, `/instance/${params.instanceId}`, {
    method: 'DELETE',
  })
}
