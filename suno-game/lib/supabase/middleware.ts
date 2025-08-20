// このファイルは音ゲーアプリでは使用されません
// Supabase機能は無効化されています

import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Simply pass through all requests without authentication
  return NextResponse.next({
    request,
  });
}
