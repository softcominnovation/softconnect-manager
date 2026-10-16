import { NextRequest } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/admin/evolutions`, { method: 'GET', sensitive: true })
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, `/admin/evolutions`, { method: 'POST', sensitive: true })
}
