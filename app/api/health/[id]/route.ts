import { type NextRequest, NextResponse } from 'next/server'
import { proxyRequest } from '@/app/api/_utils/proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return proxyRequest(request, `/admin/health/${params.id}`, { method: 'GET' })
}
