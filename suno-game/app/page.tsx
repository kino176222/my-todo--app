"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameScreen } from "@/components/game-screen";
import { ResultScreen } from "@/components/result-screen";

type GameState = "home" | "playing" | "result";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>("home");
  const [finalScore, setFinalScore] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "audio/mpeg") {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    } else {
      alert("MP3ファイルを選択してください");
    }
  };

  const startGame = () => {
    if (selectedFile && audioUrl) {
      setGameState("playing");
    }
  };

  const handleGameEnd = (score: number) => {
    console.log('📊 handleGameEnd called with score:', score);
    console.log('📊 Type of score:', typeof score);
    console.log('📊 Setting finalScore to:', score);
    setFinalScore(score);
    console.log('📊 Changing game state to result');
    setGameState("result");
  };

  const handlePlayAgain = () => {
    setGameState("playing");
  };

  const handleBackToHome = () => {
    setGameState("home");
    setSelectedFile(null);
    setAudioUrl(null);
  };

  if (gameState === "playing" && selectedFile) {
    return (
      <GameScreen
        audioFile={selectedFile}
        onGameEnd={handleGameEnd}
        onBack={handleBackToHome}
      />
    );
  }

  if (gameState === "result") {
    return (
      <ResultScreen
        score={finalScore}
        onPlayAgain={handlePlayAgain}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              自分の曲で音ゲー
            </CardTitle>
            <CardDescription className="text-gray-600">
              MP3ファイルをアップロードして音ゲーを楽しもう！
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <label
                htmlFor="music-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">クリックして選択</span>
                  </p>
                  <p className="text-xs text-gray-500">MP3ファイル（最大10MB）</p>
                </div>
                <input
                  id="music-file"
                  type="file"
                  accept="audio/mpeg"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              {selectedFile && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">
                    ファイル選択完了：
                  </p>
                  <p className="text-sm text-green-700 truncate">
                    {selectedFile.name}
                  </p>
                </div>
              )}

              {audioUrl && (
                <div className="space-y-3">
                  <audio
                    controls
                    className="w-full"
                    src={audioUrl}
                  />
                  <Button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg"
                  >
                    ゲーム開始！
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
