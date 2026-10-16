import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function PUT(req: NextRequest) {
  return proxyRequest(req, `/admin/evolution-setup/confirmation`, { method: 'PUT', sensitive: true })
}

