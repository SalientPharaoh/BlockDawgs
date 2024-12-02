import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is now just a pass-through since auth is handled by AuthProvider
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: []
};
