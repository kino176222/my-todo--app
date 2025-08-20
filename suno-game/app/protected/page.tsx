// このページは音ゲーアプリでは使用されません
// Supabase認証機能は無効化されています

import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  // 音ゲーアプリでは認証不要のため、メイン画面にリダイレクト
  redirect("/");
}
