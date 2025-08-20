# 削除対象ファイル・ディレクトリ一覧

以下のファイルとディレクトリは音ゲー機能には不要なため、削除してください：

## ディレクトリ（フォルダごと削除）
- `app/auth/` - 認証関連（不使用）
- `app/protected/` - 保護ページ（不使用）
- `components/tutorial/` - チュートリアル（不使用）
- `lib/supabase/` - Supabaseライブラリ（不使用）

## ファイル（個別削除）
- `components/auth-button.tsx`
- `components/login-form.tsx`
- `components/logout-button.tsx`
- `components/sign-up-form.tsx`
- `components/forgot-password-form.tsx`
- `components/update-password-form.tsx`
- `middleware.ts` - Supabase認証ミドルウェア（不使用）

## 削除コマンド例
```bash
# ディレクトリの削除
rm -rf app/auth
rm -rf app/protected
rm -rf components/tutorial
rm -rf lib/supabase

# ファイルの削除
rm components/auth-button.tsx
rm components/login-form.tsx
rm components/logout-button.tsx
rm components/sign-up-form.tsx
rm components/forgot-password-form.tsx
rm components/update-password-form.tsx
rm middleware.ts
```

注：これらのファイルは音ゲー機能では一切使用されていません。