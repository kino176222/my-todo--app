"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="w-full max-w-4xl">
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              利用規約
            </CardTitle>
            <CardDescription className="text-gray-600">
              最終更新日: 2025年8月20日
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                💰 完全無料サービス
              </h2>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800 mb-2">
                  このアプリは完全無料です
                </p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>利用料金は一切かかりません</li>
                  <li>隠れた課金や追加料金はありません</li>
                  <li>全ての機能を無料でご利用いただけます</li>
                  <li>広告表示もありません</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                📋 サービス概要
              </h2>
              <p className="mb-3">
                「自分の曲で音ゲー」（以下「本サービス」）は、ユーザーがアップロードしたMP3ファイルを使用して音楽ゲームを楽しめるWebアプリケーションです。
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>MP3ファイルのアップロード機能</li>
                <li>リズムゲーム機能</li>
                <li>スコア表示機能</li>
                <li>完全ブラウザ内動作（データ保存なし）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                ✅ 利用条件
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>著作権を侵害する楽曲のアップロードは禁止します</li>
                <li>自分が権利を持つ楽曲、または使用許可のある楽曲のみご利用ください</li>
                <li>他のユーザーに迷惑をかける行為は禁止します</li>
                <li>技術的な制約により、一部のファイル形式では正常に動作しない場合があります</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                ⚖️ 免責事項
              </h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">重要な免責事項</h3>
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  <li>
                    <strong>動作保証なし:</strong> 本サービスの動作について一切の保証を行いません
                  </li>
                  <li>
                    <strong>データ損失:</strong> アップロードされたファイルの損失について責任を負いません
                  </li>
                  <li>
                    <strong>サービス中断:</strong> 予告なくサービスを中断・終了する場合があります
                  </li>
                  <li>
                    <strong>損害賠償:</strong> 本サービスの利用により生じた損害について責任を負いません
                  </li>
                  <li>
                    <strong>第三者の権利:</strong> 著作権侵害等の責任はユーザーが負うものとします
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                🔒 プライバシー
              </h2>
              <p>
                本サービスはユーザーの個人情報を一切収集しません。
                アップロードされたファイルはブラウザ内でのみ処理され、サーバーには送信されません。
                詳細は<Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>をご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                📱 動作環境
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>モダンなWebブラウザ（Chrome、Firefox、Safari、Edge等）</li>
                <li>JavaScript有効環境</li>
                <li>Web Audio API対応ブラウザ</li>
                <li>インターネット接続（初回読み込み時のみ）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                🔄 規約の変更
              </h2>
              <p>
                本利用規約は予告なく変更される場合があります。
                重要な変更がある場合は、アプリ内でお知らせいたします。
                継続してご利用いただくことで、変更された規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                📧 お問い合わせ
              </h2>
              <p>
                本利用規約に関するご質問やサービスに関するお問い合わせは、
                GitHubのIssueページからお願いいたします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                ✨ 最後に
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-700">
                  このアプリは音楽を愛する全ての人に、自分だけの音ゲー体験を提供することを目的として作られています。
                  皆様に楽しんでいただけることを心より願っています。
                </p>
              </div>
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