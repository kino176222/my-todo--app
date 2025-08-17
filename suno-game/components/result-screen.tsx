"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultScreenProps {
  score: number;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

const TARGET_SCORE = 1000; // ゲーム画面と同じ目標スコア

export function ResultScreen({ score, onPlayAgain, onBackToHome }: ResultScreenProps) {
  console.log('🏆 ResultScreen rendered with score:', score);
  console.log('🏆 Score type:', typeof score);
  console.log('🏆 Score value verification:', score);
  
  const getGrade = (score: number): string => {
    if (score >= TARGET_SCORE * 1.5) return "S"; // 1500点以上
    if (score >= TARGET_SCORE * 1.2) return "A"; // 1200点以上
    if (score >= TARGET_SCORE) return "B";       // 1000点以上（クリア）
    if (score >= TARGET_SCORE * 0.7) return "C"; // 700点以上
    return "D"; // 700点未満
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case "S": return "text-yellow-400";
      case "A": return "text-green-400";
      case "B": return "text-blue-400";
      case "C": return "text-orange-400";
      default: return "text-gray-400";
    }
  };

  const grade = getGrade(score);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
            {score >= TARGET_SCORE ? "🎉 ゲームクリア！" : "ゲーム終了"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {score >= TARGET_SCORE ? "目標スコアを達成しました！" : "お疲れさまでした"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">スコア</div>
              <div className="text-4xl font-bold text-gray-800">
                {score.toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">グレード</div>
              <div className={`text-6xl font-bold ${getGradeColor(grade)}`}>
                {grade}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">楽曲完奏結果</div>
              <div className="text-gray-800">
                {score >= TARGET_SCORE ? (
                  <div>
                    <div className="text-green-600 font-bold mb-2">🎊 CLEAR！</div>
                    <div>目標スコア {TARGET_SCORE} を達成して楽曲をクリアしました！</div>
                    <div className="text-sm text-green-500 mt-1">素晴らしい演奏でした！</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-blue-600 font-bold mb-2">🎵 楽曲完奏！</div>
                    <div>最後まで演奏お疲れさまでした</div>
                    <div className="text-sm text-gray-600 mt-1">目標まで残り {TARGET_SCORE - score} ポイント</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3"
            >
              もう一度プレイ
            </Button>
            <Button
              onClick={onBackToHome}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}