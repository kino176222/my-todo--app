// このルートは音ゲーアプリでは使用されません
// Supabase認証機能は無効化されています

import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  // 音ゲーアプリではユーザー認証は不要のため、メイン画面にリダイレクト
  redirect("/");
}
