import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(req: NextRequest, { params }: { params: { providerId: string } }) {
  return proxyRequest(req, `/admin/evolutions/${encodeURIComponent(params.providerId)}`, {
    method: 'GET',
    sensitive: true,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { providerId: string } }) {
  return proxyRequest(req, `/admin/evolutions/${encodeURIComponent(params.providerId)}`, {
    method: 'PUT',
    sensitive: true,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { providerId: string } }) {
  return proxyRequest(req, `/admin/evolutions/${encodeURIComponent(params.providerId)}`, {
    method: 'DELETE',
    sensitive: true,
  })
}
