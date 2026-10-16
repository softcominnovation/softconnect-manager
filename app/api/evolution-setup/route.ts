import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/admin/evolution-setup`, { method: 'GET', sensitive: true })
}

