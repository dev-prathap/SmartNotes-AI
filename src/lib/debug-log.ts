import { NextRequest } from 'next/server';

// 简单的调试日志函数
export function logApiRequest(request: NextRequest, extraInfo?: any) {
  console.log('🔍 [DEBUG] API Request:', {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams),
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'host': request.headers.get('host')
    },
    extraInfo
  });
} 