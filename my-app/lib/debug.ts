// デバッグ用ファイル
export const debugSupabase = () => {
  console.log('=== Supabase Debug Info ===');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?.slice(0, 20) + '...');
  console.log('=== End Debug Info ===');
};