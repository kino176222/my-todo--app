"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="w-full max-w-4xl">
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              プライバシーポリシー・セキュリティ
            </CardTitle>
            <CardDescription className="text-gray-600">
              最終更新日: 2025年8月20日
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                📱 このアプリについて
              </h2>
              <p className="mb-2">
                「自分の曲で音ゲー」は、お客様のMP3ファイルを使用して音楽ゲームを楽しめるWebアプリケーションです。
                本アプリは完全にブラウザ内で動作し、外部サーバーとの通信を行いません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                🔒 データの取り扱い
              </h2>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">収集しないデータ</h3>
                  <ul className="list-disc list-inside space-y-1 text-green-700">
                    <li>個人情報（氏名、メールアドレス、電話番号など）</li>
                    <li>位置情報</li>
                    <li>デバイス情報</li>
                    <li>使用履歴・プレイデータ</li>
                    <li>アップロードされた音楽ファイル</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">ファイル処理について</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>MP3ファイルはブラウザのメモリ内でのみ処理されます</li>
                    <li>サーバーへのアップロードは一切行いません</li>
                    <li>ファイルサイズは10MBまでに制限されています</li>
                    <li>ブラウザを閉じると全てのデータは自動的に削除されます</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                🛡️ セキュリティ対策
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>完全ローカル処理:</strong> 全ての処理がお客様のデバイス内で完結
                </li>
                <li>
                  <strong>外部通信なし:</strong> インターネット経由でのデータ送信は一切なし
                </li>
                <li>
                  <strong>Cookie不使用:</strong> トラッキングCookieや分析ツールは使用していません
                </li>
                <li>
                  <strong>データベース不使用:</strong> ユーザーデータの保存機能はありません
                </li>
                <li>
                  <strong>HTTPS通信:</strong> アプリ自体はHTTPSで安全に配信されます
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                ⚡ 技術仕様
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>音声処理:</strong> Web Audio API（ブラウザ標準技術）
                  </li>
                  <li>
                    <strong>ファイル処理:</strong> File API（ブラウザ標準技術）
                  </li>
                  <li>
                    <strong>フレームワーク:</strong> Next.js（静的サイト生成）
                  </li>
                  <li>
                    <strong>対応ファイル:</strong> MP3形式のみ（audio/mpeg）
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                👶 お子様の利用について
              </h2>
              <p>
                本アプリは全年齢対象です。個人情報を収集しないため、お子様でも安全にご利用いただけます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                🔄 ポリシーの変更
              </h2>
              <p>
                本ポリシーは予告なく変更される場合があります。
                重要な変更がある場合は、アプリ内でお知らせいたします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                📧 お問い合わせ
              </h2>
              <p>
                セキュリティやプライバシーに関するご質問がございましたら、
                GitHubのIssueページからお問い合わせください。
              </p>
            </section>

            <div className="pt-6 flex justify-center">
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold">
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}