"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioManager } from "@/lib/audio";

interface Note {
  id: string;
  lane: number; // 0-3の4レーン
  time: number; // 音楽開始からの時間（秒）
  y: number; // 画面上のY座標
  emoji: string; // 表示する絵文字
  type: 'star' | 'heart'; // ノーツの種類
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'purple'; // ハートの色（heartの場合のみ）
}

interface GameScreenProps {
  audioFile: File;
  onGameEnd: (score: number) => void;
  onBack: () => void;
}

export function GameScreen({ audioFile, onGameEnd, onBack }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // 現在再生中の音楽
  const scoreRef = useRef<number>(0); // スコアをrefでも管理
  const notesRef = useRef<Note[]>([]); // ノーツの現在状態を保持
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [hitEffects, setHitEffects] = useState<{id: string, lane: number, time: number, type: 'hit' | 'miss', score?: number}[]>([]);
  const [songDuration, setSongDuration] = useState<number>(30); // デフォルト30秒、実際の楽曲長で更新
  const [hasCleared, setHasCleared] = useState(false); // クリア状態の管理
  const [lastKeyTime, setLastKeyTime] = useState<{[lane: number]: number}>({0: 0, 1: 0, 2: 0, 3: 0}); // 連続入力防止用
  const [comboCount, setComboCount] = useState(0); // 連打コンボ数
  const [explosionEffects, setExplosionEffects] = useState<{id: string, x: number, y: number, time: number}[]>([]);
  const [heartParticles, setHeartParticles] = useState<{id: string, x: number, y: number, vx: number, vy: number, time: number, emoji: string}[]>([]);
  const [colorCombos, setColorCombos] = useState<{
    red: number;
    green: number;
    blue: number;
    yellow: number;
    purple: number;
  }>({ red: 0, green: 0, blue: 0, yellow: 0, purple: 0 });
  const [flashEffect, setFlashEffect] = useState<{active: boolean, intensity: number, time: number} | null>(null);
  const [laneFlashes, setLaneFlashes] = useState<{[lane: number]: {active: boolean, time: number, intensity: number}}>({});

  const LANE_COUNT = 4;
  const NOTE_SPEED = 100; // ピクセル/秒（遅くして簡単に）
  const JUDGMENT_LINE = typeof window !== 'undefined' ? window.innerHeight - 150 : 700; // 画面下部から150px上に配置
  const TARGET_SCORE = 1000; // クリア目標スコア

  useEffect(() => {
    const initializeGame = async () => {
      try {
        await audioManagerRef.current.initializeAudio(audioFile);
        const duration = audioManagerRef.current.getDuration();
        if (duration > 0) {
          setSongDuration(duration);
          console.log('🎵 Song duration detected:', duration.toFixed(1), 'seconds');
        } else {
          // HTML5 Audioでフォールバックして長さを取得
          const url = URL.createObjectURL(audioFile);
          const audio = new Audio(url);
          audio.addEventListener('loadedmetadata', () => {
            setSongDuration(audio.duration);
            console.log('🎵 Song duration from HTML5 Audio:', audio.duration.toFixed(1), 'seconds');
          });
        }
        console.log('Audio initialized successfully');
      } catch (error) {
        console.log('Audio initialization failed, but game will continue:', error);
      }
    };

    initializeGame();
  }, [audioFile]);

  // generateNotes関数を先に定義
  const generateNotes = useCallback(() => {
    const generatedNotes: Note[] = [];
    const colorHearts = {
      red: '❤️',
      green: '💚', 
      blue: '💙',
      yellow: '💛',
      purple: '💜'
    };
    const colors: ('red' | 'green' | 'blue' | 'yellow' | 'purple')[] = ['red', 'green', 'blue', 'yellow', 'purple'];
    
    // オシャレな音ゲー風ノーツ生成
    const testNotes = true; // オシャレエフェクト版
    if (testNotes) {
      const endTime = Math.max(60, songDuration - 2);
      
      // よりリズミカルで爽快感のあるパターン
      for (let time = 2; time < endTime; time += 0.5) {
        // 基本確率を時間で変化（盛り上がり演出）
        const intensity = Math.sin((time / endTime) * Math.PI * 2) * 0.3 + 0.4; // 0.1-0.7の範囲
        
        // 4分音符のタイミング（0.5秒間隔）
        if (time % 2 === 0) {
          // 強拍：複数レーン同時の可能性
          const simultaneousNotes = Math.random() < 0.3 ? 2 : 1;
          const usedLanes = new Set();
          
          for (let i = 0; i < simultaneousNotes && usedLanes.size < LANE_COUNT; i++) {
            let lane;
            do {
              lane = Math.floor(Math.random() * LANE_COUNT);
            } while (usedLanes.has(lane));
            usedLanes.add(lane);
            
            if (Math.random() < intensity) {
              const isHeart = Math.random() < 0.25; // 25%でハート
              
              if (isHeart) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                generatedNotes.push({
                  id: `stylish-heart-${time}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji: colorHearts[color],
                  type: 'heart',
                  color: color
                });
              } else {
                generatedNotes.push({
                  id: `stylish-star-${time}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji: '⭐',
                  type: 'star'
                });
              }
            }
          }
        } else {
          // 弱拍：単発ノーツ
          if (Math.random() < intensity * 0.6) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const isHeart = Math.random() < 0.2; // 20%でハート
            
            if (isHeart) {
              const color = colors[Math.floor(Math.random() * colors.length)];
              generatedNotes.push({
                id: `stylish-heart-weak-${time}-${lane}`,
                lane,
                time,
                y: -100,
                emoji: colorHearts[color],
                type: 'heart',
                color: color
              });
            } else {
              generatedNotes.push({
                id: `stylish-star-weak-${time}-${lane}`,
                lane,
                time,
                y: -100,
                emoji: '⭐',
                type: 'star'
              });
            }
          }
        }
      }
      
      console.log('🎵 Stylish notes generated:', generatedNotes.length, 'notes');
      console.log('🎵 Notes density:', (generatedNotes.length / endTime).toFixed(2), 'notes/sec');
      
      setNotes(generatedNotes);
      notesRef.current = generatedNotes;
      return;
    }
    
    // 楽曲全体にノーツを配置（楽曲の長さに応じて）
    const endTime = Math.max(30, songDuration - 2);
    console.log('🎵 Generating rhythmic notes for song duration:', songDuration, 'seconds');
    
    // リズミカルなノーツ生成
    const bpm = 120; // 一般的なBPM
    const beatInterval = 60 / bpm; // 0.5秒（4分音符）
    const eightBeatInterval = beatInterval / 2; // 0.25秒（8分音符）
    
    // 楽曲セクション定義
    const songSections = [
      { start: 2, end: endTime * 0.25, name: 'イントロ', density: 0.4, pattern: 'simple' },
      { start: endTime * 0.25, end: endTime * 0.5, name: 'Aメロ', density: 0.6, pattern: 'moderate' },
      { start: endTime * 0.5, end: endTime * 0.75, name: 'Bメロ', density: 0.7, pattern: 'moderate' },
      { start: endTime * 0.75, end: endTime, name: 'サビ', density: 0.9, pattern: 'intense' }
    ];
    
    console.log('🎵 Song sections:', songSections.map(s => `${s.name}: ${s.start.toFixed(1)}-${s.end.toFixed(1)}s`));
    
    songSections.forEach(section => {
      console.log(`🎵 Generating ${section.name} section (${section.start.toFixed(1)}-${section.end.toFixed(1)}s)`);
      
      for (let time = section.start; time < section.end; time += beatInterval) {
        
        if (section.pattern === 'simple') {
          // シンプルパターン：4分音符メイン（連続パターン対応）
          if (Math.random() < section.density) {
            const shouldCreatePattern = Math.random() < 0.4; // 40%で連続パターン
            
            if (shouldCreatePattern) {
              // 気持ちいい連続パターン生成
              const patternType = Math.random() < 0.3 ? 'heart' : 'star'; // 30%ハート、70%星
              const patternLength = 2 + Math.floor(Math.random() * 2); // 2-3個連続
              
              if (patternType === 'heart') {
                // 同色ハート連続パターン
                const chosenColor = colors[Math.floor(Math.random() * colors.length)];
                const startLane = Math.floor(Math.random() * LANE_COUNT);
                
                for (let i = 0; i < patternLength; i++) {
                  const patternTime = time + (i * beatInterval);
                  if (patternTime < section.end) {
                    const lane = (startLane + i) % LANE_COUNT; // レーンを順次移動
                    generatedNotes.push({
                      id: `pattern-heart-${patternTime.toFixed(2)}-${lane}`,
                      lane,
                      time: patternTime,
                      y: -100,
                      emoji: colorHearts[chosenColor],
                      type: 'heart',
                      color: chosenColor
                    });
                  }
                }
              } else {
                // 星連続パターン
                const startLane = Math.floor(Math.random() * LANE_COUNT);
                
                for (let i = 0; i < patternLength; i++) {
                  const patternTime = time + (i * beatInterval);
                  if (patternTime < section.end) {
                    const lane = (startLane + i) % LANE_COUNT; // レーンを順次移動
                    generatedNotes.push({
                      id: `pattern-star-${patternTime.toFixed(2)}-${lane}`,
                      lane,
                      time: patternTime,
                      y: -100,
                      emoji: '⭐',
                      type: 'star'
                    });
                  }
                }
              }
              
              // パターン分の時間をスキップ
              time += (patternLength - 1) * beatInterval;
              
            } else {
              // 通常の単発ノーツ
              const lane = Math.floor(Math.random() * LANE_COUNT);
              const isHeart = Math.random() < 0.3; // 30%でハート、70%で星
              
              if (isHeart) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                generatedNotes.push({
                  id: `note-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji: colorHearts[color],
                  type: 'heart',
                  color: color
                });
              } else {
                generatedNotes.push({
                  id: `note-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji: '⭐',
                  type: 'star'
                });
              }
            }
          }
          
        } else if (section.pattern === 'moderate') {
          // 中程度パターン：4分音符 + 8分音符（連続パターン対応）
          
          // 4分音符
          if (Math.random() < section.density) {
            const shouldCreatePattern = Math.random() < 0.5; // 50%で連続パターン
            
            if (shouldCreatePattern) {
              // moderate用連続パターン
              const patternType = Math.random() < 0.4 ? 'heart' : 'star'; // 40%ハート、60%星
              const patternLength = 2 + Math.floor(Math.random() * 2); // 2-3個連続
              
              if (patternType === 'heart') {
                const chosenColor = colors[Math.floor(Math.random() * colors.length)];
                for (let i = 0; i < patternLength; i++) {
                  const patternTime = time + (i * beatInterval);
                  if (patternTime < section.end) {
                    const lane = Math.floor(Math.random() * LANE_COUNT);
                    generatedNotes.push({
                      id: `mod-heart-${patternTime.toFixed(2)}-${lane}`,
                      lane,
                      time: patternTime,
                      y: -100,
                      emoji: colorHearts[chosenColor],
                      type: 'heart',
                      color: chosenColor
                    });
                  }
                }
              } else {
                for (let i = 0; i < patternLength; i++) {
                  const patternTime = time + (i * beatInterval);
                  if (patternTime < section.end) {
                    const lane = Math.floor(Math.random() * LANE_COUNT);
                    generatedNotes.push({
                      id: `mod-star-${patternTime.toFixed(2)}-${lane}`,
                      lane,
                      time: patternTime,
                      y: -100,
                      emoji: '⭐',
                      type: 'star'
                    });
                  }
                }
              }
              time += (patternLength - 1) * beatInterval;
            } else {
              // 通常の単発ノーツ
              const lane = Math.floor(Math.random() * LANE_COUNT);
              const isHeart = Math.random() < 0.4; // 40%でハート
              
              if (isHeart) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                generatedNotes.push({
                  id: `note-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji: colorHearts[color],
                  type: 'heart',
                  color: color
                });
              } else {
                generatedNotes.push({
                  id: `note-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji: '⭐',
                  type: 'star'
                });
              }
            }
          }
          
          // 8分音符（間の拍）
          const halfBeatTime = time + eightBeatInterval;
          if (halfBeatTime < section.end && Math.random() < section.density * 0.6) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const isHeart = Math.random() < 0.4; // 40%でハート
            
            if (isHeart) {
              const color = colors[Math.floor(Math.random() * colors.length)];
              generatedNotes.push({
                id: `eighth-${halfBeatTime.toFixed(2)}-${lane}`,
                lane,
                time: halfBeatTime,
                y: -100,
                emoji: colorHearts[color],
                type: 'heart',
                color: color
              });
            } else {
              generatedNotes.push({
                id: `eighth-${halfBeatTime.toFixed(2)}-${lane}`,
                lane,
                time: halfBeatTime,
                y: -100,
                emoji: '⭐',
                type: 'star'
              });
            }
          }
          
        } else if (section.pattern === 'intense') {
          // 激しいパターン：高密度 + 同時押し強化
          const heartEmojis = ['❤️', '💖', '💕', '💗', '💓'];
          
          const shouldGenerateChord = Math.random() < 0.5; // 50%で同時押し（増加）
          
          if (shouldGenerateChord) {
            // 爽快感のある同時押しパターン
            const patternType = Math.random();
            
            if (patternType < 0.3) {
              // 全レーン同時押し（超爽快）
              for (let lane = 0; lane < LANE_COUNT; lane++) {
                const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
                generatedNotes.push({
                  id: `allchord-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji,
                  type: 'star'
                });
              }
            } else if (patternType < 0.6) {
              // 対称パターン（左右同時）
              const leftLanes = [0, 1];
              const rightLanes = [2, 3];
              const useLeft = Math.random() < 0.5;
              const selectedLanes = useLeft ? leftLanes : rightLanes;
              
              selectedLanes.forEach(lane => {
                const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
                generatedNotes.push({
                  id: `symchord-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji,
                  type: 'star'
                });
              });
            } else {
              // 通常の2-3個同時押し
              const chordSize = Math.random() < 0.5 ? 2 : 3;
              const usedLanes = new Set();
              
              for (let i = 0; i < chordSize; i++) {
                let lane;
                do {
                  lane = Math.floor(Math.random() * LANE_COUNT);
                } while (usedLanes.has(lane));
                usedLanes.add(lane);
                
                const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
                generatedNotes.push({
                  id: `chord-${time.toFixed(2)}-${lane}`,
                  lane,
                  time,
                  y: -100,
                  emoji,
                  type: 'star'
                });
              }
            }
          } else {
            // 通常の単音
            if (Math.random() < section.density) {
              const lane = Math.floor(Math.random() * LANE_COUNT);
              const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
              generatedNotes.push({
                id: `note-${time.toFixed(2)}-${lane}`,
                lane,
                time,
                y: -100,
                emoji,
                type: 'star'
              });
            }
          }
          
          // 8分音符も高確率で追加（同じタイミングでの爽快感）
          const halfBeatTime = time + eightBeatInterval;
          if (halfBeatTime < section.end && Math.random() < section.density * 0.9) {
            // 8分音符も同時押しの可能性
            if (Math.random() < 0.3) {
              // 2個同時の8分音符
              const usedLanes = new Set();
              for (let i = 0; i < 2; i++) {
                let lane;
                do {
                  lane = Math.floor(Math.random() * LANE_COUNT);
                } while (usedLanes.has(lane));
                usedLanes.add(lane);
                
                const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
                generatedNotes.push({
                  id: `eighth-chord-${halfBeatTime.toFixed(2)}-${lane}`,
                  lane,
                  time: halfBeatTime,
                  y: -100,
                  emoji,
                  type: 'star'
                });
              }
            } else {
              // 通常の8分音符
              const lane = Math.floor(Math.random() * LANE_COUNT);
              const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
              generatedNotes.push({
                id: `note-${halfBeatTime.toFixed(2)}-${lane}`,
                lane,
                time: halfBeatTime,
                y: -100,
                emoji,
                type: 'star'
              });
            }
          }
        }
      }
    });

    // 時間順にソート
    generatedNotes.sort((a, b) => a.time - b.time);

    console.log('🎵 Generated rhythmic notes:', generatedNotes.length, 'for', endTime.toFixed(1), 'seconds');
    console.log('🎵 First 10 notes:', generatedNotes.slice(0, 10).map(n => `t=${n.time.toFixed(2)}s, lane=${n.lane}, emoji=${n.emoji}`));
    console.log('🎵 Notes per section:', songSections.map(s => {
      const sectionNotes = generatedNotes.filter(n => n.time >= s.start && n.time < s.end);
      return `${s.name}: ${sectionNotes.length}`;
    }));
    
    setNotes(generatedNotes);
    notesRef.current = generatedNotes; // refも更新
  }, [songDuration]); // songDurationに依存

  // 楽曲の長さが決まったらノーツを生成
  useEffect(() => {
    if (songDuration > 0) {
      generateNotes();
    }
  }, [songDuration, generateNotes]); // generateNotesも依存関係に含める

  // notesが更新されたらrefも更新
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // キーボードイベントの設定（シンプル版）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 最初にキーイベント自体をログ出力
      console.log('🚨 RAW KEY EVENT:', event.key, 'Game started:', gameStarted);
      
      console.log('🎮 KEY EVENT:', {
        key: event.key,
        gameStarted: gameStarted,
        timestamp: Date.now()
      });
      
      // ゲーム開始チェック
      if (!gameStarted) {
        console.log('🎮 Game not started, key ignored');
        return;
      }

      // キーマッピング（シンプル版）
      let targetLane = -1;
      switch(event.key.toLowerCase()) {
        case 'a':
        case '1':
          targetLane = 0;
          console.log('🔴 A KEY DETECTED - Lane 0');
          break;
        case 's':
        case '2':
          targetLane = 1;
          break;
        case 'd':
        case '3':
          targetLane = 2;
          break;
        case 'f':
        case '4':
          targetLane = 3;
          break;
        default:
          console.log('🎮 Key not mapped:', event.key);
          return;
      }
      
      console.log('🎮 KEY MAPPED to lane:', targetLane);
      event.preventDefault();
      
      // 連続入力防止を緩和（同じレーンで50ms以内の入力は無視）
      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTime[targetLane];
      
      if (targetLane === 0) {
        console.log('🔴 A KEY TIMING CHECK - NO DEBOUNCE:', {
          currentTime,
          lastKeyTime: lastKeyTime[targetLane],
          timeSinceLastKey
        });
      }
      
      // 連続入力防止を完全に削除してテスト
      setLastKeyTime(prev => ({...prev, [targetLane]: currentTime}));
      
      // 直接handleLaneTap関数を呼び出さず、内容をここに移動
      console.log('🎮 Processing lane tap for lane:', targetLane);
      
      // notesRefから現在のノーツを取得（最新の状態）
      const currentNotes = notesRef.current;
      const currentScore = score;
      
      console.log('🎮 Current game state:', {
        notesCount: currentNotes.length,
        currentScore: currentScore,
        targetLane: targetLane
      });
      
      console.log('🎮 Current notes count:', currentNotes.length);
      console.log('🎮 Current score:', currentScore);
      
      // ヒット判定（A列は特別な処理）
      let candidateNotes;
      let hitNote;
      
      if (targetLane === 0) {
        // A列の場合：他の列と同じ判定範囲だが連続入力制限なし
        candidateNotes = currentNotes.filter(note => 
          note.lane === targetLane && 
          Math.abs(note.y - JUDGMENT_LINE) < 80  // 通常の判定範囲
        );
        
        // 最も判定ラインに近いノーツを選択
        hitNote = candidateNotes.length > 0 
          ? candidateNotes.reduce((closest, current) => 
              Math.abs(current.y - JUDGMENT_LINE) < Math.abs(closest.y - JUDGMENT_LINE) 
                ? current : closest
            )
          : null;
          
        console.log('🔴 A LANE NORMAL JUDGMENT:', {
          candidatesFound: candidateNotes.length,
          hit: !!hitNote,
          bestDistance: hitNote ? Math.abs(hitNote.y - JUDGMENT_LINE) : 'none'
        });
      } else {
        // 他の列は通常の判定
        candidateNotes = currentNotes.filter(note => 
          note.lane === targetLane && 
          Math.abs(note.y - JUDGMENT_LINE) < 80
        );
        
        hitNote = candidateNotes.length > 0 
          ? candidateNotes.reduce((closest, current) => 
              Math.abs(current.y - JUDGMENT_LINE) < Math.abs(closest.y - JUDGMENT_LINE) 
                ? current : closest
            )
          : null;
      }
      
      if (targetLane === 0) {
        console.log('🔴 A KEY HIT JUDGMENT:', {
          candidateCount: candidateNotes.length,
          allCandidates: candidateNotes.map(n => ({ y: n.y, distance: Math.abs(n.y - JUDGMENT_LINE) })),
          selectedNote: hitNote ? { emoji: hitNote.emoji, y: hitNote.y, distance: Math.abs(hitNote.y - JUDGMENT_LINE) } : null,
          judgmentLine: JUDGMENT_LINE,
          allNotesInLane0: currentNotes.filter(n => n.lane === 0).map(n => ({ y: n.y, distance: Math.abs(n.y - JUDGMENT_LINE) }))
        });
      }
      
      console.log(`🎮 Lane ${targetLane} judgment:`, {
        candidateCount: candidateNotes.length,
        allCandidates: candidateNotes.map(n => ({ y: n.y, distance: Math.abs(n.y - JUDGMENT_LINE) })),
        selectedNote: hitNote ? { emoji: hitNote.emoji, y: hitNote.y, distance: Math.abs(hitNote.y - JUDGMENT_LINE) } : null,
        judgmentLine: JUDGMENT_LINE
      });
      
      if (hitNote) {
        console.log('🎯 NOTE HIT!', hitNote.emoji, 'Type:', hitNote.type, 'Color:', hitNote.color, 'at lane', targetLane);
        
        // ノーツタイプ別スコア計算
        let baseScore = 100; // 星の基本スコア
        if (hitNote.type === 'heart') {
          baseScore = 150; // ハートは高得点
          
          // 色別コンボ管理
          if (hitNote.color) {
            setColorCombos(prev => ({
              ...prev,
              [hitNote.color!]: prev[hitNote.color!] + 1
            }));
          }
        }
        
        // 通常コンボ数を増加
        const newComboCount = comboCount + 1;
        setComboCount(newComboCount);
        
        // スコア計算（コンボボーナス適用）
        const comboBonus = newComboCount >= 5 ? 1.5 : 1.0;
        const finalScore = Math.floor(baseScore * comboBonus);
        
        setScore(prev => {
          const newScore = prev + finalScore;
          scoreRef.current = newScore; // refも同期
          console.log('🎯 Score:', prev, '+', finalScore, '=', newScore);
          return newScore;
        });
        
        // notesとnotesRefの両方からノーツを削除
        const filteredNotes = currentNotes.filter(note => note.id !== hitNote.id);
        setNotes(filteredNotes);
        notesRef.current = filteredNotes;
        
        // 色別コンボ爆発チェック
        let shouldExplode = false;
        let explosionColor = '';
        
        if (hitNote.type === 'heart' && hitNote.color) {
          const currentColorCombo = colorCombos[hitNote.color] + 1; // 今回のヒット分を加算
          
          if (currentColorCombo === 3) {
            // 3連続でミニ爆発
            shouldExplode = true;
            explosionColor = hitNote.color;
            console.log('💥 MINI EXPLOSION!', hitNote.color, '3 combo!');
          } else if (currentColorCombo === 5) {
            // 5連続でメガ爆発
            shouldExplode = true;
            explosionColor = hitNote.color;
            console.log('💥💥 MEGA EXPLOSION!', hitNote.color, '5 combo!');
          }
        }
        
        // 通常の高コンボ爆発（5コンボ以上）
        const regularExplosion = newComboCount >= 5; // 新しいコンボカウントを使用
        
        if (shouldExplode || regularExplosion) {
          const laneWidth = window.innerWidth / LANE_COUNT;
          const explosionX = targetLane * laneWidth + laneWidth / 2;
          
          // 爆発エフェクト追加
          const explosionId = `explosion-${Date.now()}-${targetLane}`;
          setExplosionEffects(prev => [...prev, {
            id: explosionId,
            x: explosionX,
            y: JUDGMENT_LINE,
            time: Date.now()
          }]);
          
          // 色別・タイプ別パーティクル生成
          const newParticles = [];
          let particleCount = 15; // 基本数
          let particleEmojis = ['💖', '💕', '💗', '💓', '💘', '🌟', '✨', '💫', '⭐', '🎉'];
          
          if (shouldExplode && explosionColor) {
            // 色別爆発の場合
            const currentColorCombo = colorCombos[explosionColor] + 1;
            particleCount = currentColorCombo === 3 ? 10 : 25; // ミニ爆発10個、メガ爆発25個
            
            // 色別パーティクル
            const colorParticles = {
              red: ['❤️', '💖', '💕', '❣️', '💋'],
              green: ['💚', '💛', '🟢', '🌟', '✨'],
              blue: ['💙', '🩵', '🔵', '💎', '✨'],
              yellow: ['💛', '⭐', '🌟', '✨', '☀️'],
              purple: ['💜', '🟣', '💠', '🔮', '✨']
            };
            particleEmojis = colorParticles[explosionColor as keyof typeof colorParticles] || particleEmojis;
            
            // 色別爆発時はボーナススコア
            const colorBonus = currentColorCombo === 3 ? 100 : 300;
            setScore(prev => {
              const newScore = prev + colorBonus;
              scoreRef.current = newScore;
              console.log('🎨 Color bonus:', colorBonus, 'Total:', newScore);
              return newScore;
            });
          } else if (regularExplosion) {
            // 通常の高コンボ爆発
            particleCount = 25 + Math.floor(comboCount / 5) * 5;
            particleEmojis = ['💖', '💕', '💗', '💓', '💘', '🌟', '✨', '💫', '⭐', '🎉'];
          }
          
          for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 100 + Math.random() * 200; // より幅広い速度
            const upwardBias = -50 - Math.random() * 100; // より強い上方向バイアス
            
            newParticles.push({
              id: `particle-${Date.now()}-${i}`,
              x: explosionX + (Math.random() - 0.5) * 40, // 少し位置をばらつかせる
              y: JUDGMENT_LINE + (Math.random() - 0.5) * 20,
              vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 50,
              vy: Math.sin(angle) * speed + upwardBias,
              time: Date.now(),
              emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)]
            });
          }
          
          // 追加の円形パーティクル波（二重爆発効果）
          for (let ring = 0; ring < 2; ring++) {
            const ringDelay = ring * 100; // 0.1秒間隔で2つの輪
            setTimeout(() => {
              const ringParticles = [];
              for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const speed = 180 + ring * 60;
                
                ringParticles.push({
                  id: `ring-${Date.now()}-${ring}-${i}`,
                  x: explosionX,
                  y: JUDGMENT_LINE,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed - 80,
                  time: Date.now(),
                  emoji: ['💝', '💞', '💟', '❣️', '💌'][Math.floor(Math.random() * 5)]
                });
              }
              setHeartParticles(prev => [...prev, ...ringParticles]);
            }, ringDelay);
          }
          
          setHeartParticles(prev => [...prev, ...newParticles]);
          
          // エフェクト削除（少し長めに）
          setTimeout(() => {
            setExplosionEffects(prev => prev.filter(e => e.id !== explosionId));
          }, 1500);
          
          // パーティクル削除（3秒に延長）
          setTimeout(() => {
            setHeartParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
          }, 3000);
          
          console.log('💥 MEGA HEART EXPLOSION! Combo:', comboCount + 1, 'Particles:', particleCount);
        }
        
        // エフェクト追加
        const effectId = `hit-key-${Date.now()}-${targetLane}`;
        setHitEffects(prev => [...prev, {
          id: effectId,
          lane: targetLane,
          time: Date.now(),
          type: 'hit' as const,
          score: 100
        }]);
        
        // エフェクト削除
        setTimeout(() => {
          setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
        }, 1000);
        
        // パチンコレベルのドーパミン放出エフェクト
        try {
          // 1. 豪華な効果音
          playHitSound();
          
          // 2. 画面全体フラッシュエフェクト
          const flashIntensity = Math.min(1.0, 0.3 + (comboCount * 0.1));
          setFlashEffect({
            active: true,
            intensity: flashIntensity,
            time: Date.now()
          });
          
          // フラッシュを短時間で消す
          setTimeout(() => {
            setFlashEffect(null);
          }, 150);
          
          // 2.5. レーン光エフェクト（パチンコ風）
          const laneFlashIntensity = Math.min(1.0, 0.5 + (comboCount * 0.1));
          setLaneFlashes(prev => ({
            ...prev,
            [targetLane]: {
              active: true,
              time: Date.now(),
              intensity: laneFlashIntensity
            }
          }));
          
          // レーン光を600msで消去
          setTimeout(() => {
            setLaneFlashes(prev => {
              const updated = { ...prev };
              delete updated[targetLane];
              return updated;
            });
          }, 600);
          
          // 3. 振動エフェクト（スマホ対応）
          if (navigator.vibrate) {
            const vibratePattern = comboCount >= 5 
              ? [50, 30, 100, 30, 50] // 高コンボ：複雑パターン
              : [80]; // 通常：シンプル
            navigator.vibrate(vibratePattern);
          }
          
          // 4. 連鎖パーティクル爆発
          const chainExplosions = Math.min(3, Math.floor(comboCount / 3) + 1);
          for (let i = 0; i < chainExplosions; i++) {
            setTimeout(() => {
              const laneWidth = window.innerWidth / LANE_COUNT;
              const randomX = targetLane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * 100;
              const randomY = JUDGMENT_LINE + (Math.random() - 0.5) * 50;
              
              // 連鎖爆発エフェクト
              const chainId = `chain-${Date.now()}-${i}`;
              setExplosionEffects(prev => [...prev, {
                id: chainId,
                x: randomX,
                y: randomY,
                time: Date.now()
              }]);
              
              setTimeout(() => {
                setExplosionEffects(prev => prev.filter(e => e.id !== chainId));
              }, 1000);
              
              // 連鎖パーティクル
              const chainParticles = [];
              for (let j = 0; j < 15; j++) {
                const angle = (Math.PI * 2 * j) / 15;
                const speed = 80 + Math.random() * 120;
                
                chainParticles.push({
                  id: `chain-particle-${Date.now()}-${i}-${j}`,
                  x: randomX,
                  y: randomY,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed - 100,
                  time: Date.now(),
                  emoji: ['💫', '✨', '⭐', '🌟', '💥'][Math.floor(Math.random() * 5)]
                });
              }
              
              setHeartParticles(prev => [...prev, ...chainParticles]);
              
              setTimeout(() => {
                setHeartParticles(prev => prev.filter(p => !chainParticles.some(cp => cp.id === p.id)));
              }, 2000);
              
            }, i * 100); // 連鎖の時間差
          }
          
        } catch (error) {
          console.log('🎮 Epic effect failed:', error);
        }
        
      } else {
        console.log('💔 MISS! No note found at lane', targetLane);
        // コンボリセット
        setComboCount(0);
        
        // ミス処理
        setScore(prev => {
          const newScore = Math.max(0, prev - 20);
          scoreRef.current = newScore; // refも同期
          return newScore;
        });
        
        // ミスエフェクト
        const effectId = `miss-key-${Date.now()}-${targetLane}`;
        setHitEffects(prev => [...prev, {
          id: effectId,
          lane: targetLane,
          time: Date.now(),
          type: 'miss' as const,
          score: -20
        }]);
        
        setTimeout(() => {
          setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('🎮 Keyboard listener attached, game started:', gameStarted);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('🎮 Keyboard listener removed');
    };
  }, [gameStarted, notes, score, comboCount, colorCombos, lastKeyTime]); // 完全な依存関係

  const startGame = async () => {
    console.log('Starting game...');
    const startTime = Date.now();
    
    // まずノーツを生成
    console.log('🎵 Generating notes for game start...');
    generateNotes();
    
    // State更新
    setGameStarted(true);
    
    // 少し待ってからゲームループ開始（ノーツ生成の完了を待つ）
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // notesRefに現在のnotesを確実に設定
    notesRef.current = notes;
    
    console.log('Game start time set to:', startTime);
    console.log('About to start game loop with', notes.length, 'notes in state');
    console.log('NotesRef has', notesRef.current.length, 'notes');
    
    // requestAnimationFrameを使用した安定したゲームループ
    let lastTime = 0;
    
    const runGameLoop = (timestamp: number) => {
      // フレームレート制限（16ms = 約60fps）
      if (timestamp - lastTime < 16) {
        animationFrameRef.current = requestAnimationFrame(runGameLoop);
        return;
      }
      lastTime = timestamp;
      
      const currentTime = (Date.now() - startTime) / 1000;
      setGameTime(currentTime);
      
      // 現在のノーツを取得して位置更新
      const currentNotes = notesRef.current;
      const updatedNotes = currentNotes.map(note => {
        const fallTime = currentTime - (note.time - 2);
        const y = -50 + (fallTime * NOTE_SPEED);
        return { ...note, y: y };
      });
      
      // デバッグ：最初の数フレームでノーツの状態を確認
      if (currentTime < 0.5) {
        console.log('🎮 Frame:', currentTime.toFixed(2), 'Notes count:', updatedNotes.length);
        if (updatedNotes.length > 0) {
          console.log('🎮 First note:', updatedNotes[0]);
        }
      }
      
      // 見逃しミス検出（判定ラインを50px以上通過したノーツ）
      const missedNotes = updatedNotes.filter(note => note.y > JUDGMENT_LINE + 50);
      
      if (missedNotes.length > 0) {
        missedNotes.forEach(missedNote => {
          console.log('💔 MISSED NOTE:', missedNote.emoji, 'at lane', missedNote.lane);
          
          // ミスペナルティ
          setScore(prev => {
            const newScore = Math.max(0, prev - 50);
            scoreRef.current = newScore;
            return newScore;
          });
          setComboCount(0);
          
          // ミスエフェクト
          const effectId = `missed-${Date.now()}-${missedNote.lane}`;
          setHitEffects(prev => [...prev, {
            id: effectId,
            lane: missedNote.lane,
            time: Date.now(),
            type: 'miss' as const,
            score: -50
          }]);
          
          setTimeout(() => {
            setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
          }, 1500);
        });
      }
      
      // 画面内のノーツのみ残す（見逃したノーツは除去）
      const visibleNotes = updatedNotes.filter(note => 
        note.y <= JUDGMENT_LINE + 50 // 見逃しラインを超えていない
      );
      
      // 状態を更新（updatedNotesを保持して位置情報を維持）
      notesRef.current = updatedNotes; // 全ての更新されたノーツを保持
      setNotes(visibleNotes); // 画面内のノーツのみstateに設定
      
      // 描画を実行（位置が更新されたノーツを使用）
      drawGameWithNotes(updatedNotes, currentTime);
      
      // 楽曲の長さでゲーム終了
      if (currentTime < songDuration) {
        animationFrameRef.current = requestAnimationFrame(runGameLoop);
      } else {
        console.log('🎵 Game ending - Song finished at', currentTime.toFixed(1), 'seconds');
        endGame();
      }
    };
    
    // ゲームループ開始
    console.log('=== Starting game loop with requestAnimationFrame ===');
    animationFrameRef.current = requestAnimationFrame(runGameLoop);
    
    // シンプルな音楽再生（refに保存して戻るボタンからアクセス可能にする）
    try {
      const audioUrl = URL.createObjectURL(audioFile);
      const audio = new Audio(audioUrl);
      audio.volume = 0.5;
      currentAudioRef.current = audio; // refに保存
      await audio.play();
      console.log('🎵 Simple audio playback started and saved to ref');
    } catch (error) {
      console.log('Audio failed, but game continues:', error);
    }
  };

  // 古いgameLoop関数を削除（新しいものがstartGame内にある）

  const endGame = () => {
    console.log('🎮 Game ending, stopping audio...');
    setGameStarted(false);
    
    // すべての音楽を確実に停止（複数の方法で試行）
    try {
      // 1. AudioManagerを停止
      audioManagerRef.current.stop();
      console.log('🎮 AudioManager stopped');
    } catch (error) {
      console.log('🎮 AudioManager stop failed:', error);
    }
    
    try {
      // 2. すべてのHTML5 Audioを停止
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio, index) => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = ''; // srcをクリアして完全停止
        console.log(`🎮 Audio element ${index} stopped and cleared`);
      });
    } catch (error) {
      console.log('🎮 HTML audio stop failed:', error);
    }
    
    try {
      // 3. 新しく作成された可能性のあるAudioContextも停止
      if (window.AudioContext) {
        // グローバルなAudioContextがあれば停止
        console.log('🎮 Checking for global AudioContext...');
      }
    } catch (error) {
      console.log('🎮 AudioContext check failed:', error);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // 現在のスコアをrefから取得（最新値を確実に取得）
    const finalScore = scoreRef.current;
    console.log('🎮 ===== GAME END DEBUG =====');
    console.log('🎮 Current score state:', score);
    console.log('🎮 Score from ref:', scoreRef.current);
    console.log('🎮 Final score to pass:', finalScore);
    console.log('🎮 Game time:', gameTime);
    console.log('🎮 onGameEnd function:', typeof onGameEnd);
    console.log('🎮 ===========================');
    
    // 即座にスコアを渡す（refから最新値を取得）
    console.log('🎮 Immediate call to onGameEnd with score:', finalScore);
    onGameEnd(finalScore);
  };

  const handleLaneTap = (lane: number) => {
    console.log('🎯【V3.0 TAP】Lane:', lane, 'Game:', gameStarted);
    
    if (!gameStarted) return;

    // notesRefから現在のノーツを取得
    const currentNotes = notesRef.current;
    
    // デバッグ：現在のノーツの状況を表示
    const allNotes = currentNotes.map(n => ({
      lane: n.lane,
      y: n.y,
      emoji: n.emoji,
      type: n.type,
      dist: Math.abs(n.y - JUDGMENT_LINE)
    }));
    console.log('🎯 ALL NOTES:', allNotes);
    
    const lanesNotes = currentNotes.filter(note => note.lane === lane);
    console.log(`🎯 Lane ${lane} notes:`, lanesNotes.length, 'notes');
    lanesNotes.forEach(n => {
      console.log(`  - ${n.emoji} y=${n.y?.toFixed(0) || 'undefined'}, dist=${n.y ? Math.abs(n.y - JUDGMENT_LINE).toFixed(0) : 'N/A'}`);
    });
    console.log(`🎯 Judgment line: ${JUDGMENT_LINE}`);
    
    // 判定ライン付近のノーツを探す（判定範囲を広げる）
    const JUDGMENT_RANGE = 150; // 80から150に拡大
    const candidateNotes = currentNotes.filter(note => {
      const inLane = note.lane === lane;
      const inRange = note.y && Math.abs(note.y - JUDGMENT_LINE) < JUDGMENT_RANGE;
      console.log(`  Check note: lane=${note.lane}, y=${note.y}, inLane=${inLane}, inRange=${inRange}`);
      return inLane && inRange;
    });
    
    // 最も判定ラインに近いノーツを選択
    const hitNote = candidateNotes.length > 0 
      ? candidateNotes.reduce((closest, current) => 
          Math.abs(current.y - JUDGMENT_LINE) < Math.abs(closest.y - JUDGMENT_LINE) 
            ? current : closest
        )
      : null;

    console.log('=== HIT CHECK ===', 'Lane:', lane, 'Found note:', !!hitNote);
    if (hitNote) {
      console.log('=== HIT DETAILS ===', {
        emoji: hitNote.emoji,
        noteY: hitNote.y,
        judgmentLine: JUDGMENT_LINE,
        distance: Math.abs(hitNote.y - JUDGMENT_LINE)
      });
    }

    if (hitNote) {
      // ヒット成功
      console.log('💖 HEART TAP SUCCESS ===', hitNote.emoji, 'in lane', lane);
      
      // コンボ数を増加
      const newComboCount = comboCount + 1;
      setComboCount(newComboCount);
      
      const bonusScore = newComboCount >= 5 ? 200 : 100; // 5コンボ以上でボーナス
      setScore(prev => {
        const newScore = prev + bonusScore;
        scoreRef.current = newScore; // refも同期
        console.log('=== SCORE UPDATE ===', prev, '->', newScore, 'Combo:', comboCount + 1);
        return newScore;
      });
      
      // notesとnotesRefの両方からノーツを削除
      const filteredNotes = currentNotes.filter(note => note.id !== hitNote.id);
      setNotes(filteredNotes);
      notesRef.current = filteredNotes;
      
      // クリア条件チェック（初回のみ）
      if (!hasCleared && score + 100 >= TARGET_SCORE) {
        setHasCleared(true);
        console.log('🎉 CLEAR CONDITION ACHIEVED! Score:', score + 100);
      }
      
      // 超絢爛ヒット成功エフェクトを追加
      const effectId = `hit-${Date.now()}-${lane}`;
      const hitEffect = { id: effectId, lane, time: Date.now(), type: 'hit' as const, score: bonusScore };
      setHitEffects(prev => {
        const updated = [...prev, hitEffect];
        console.log('=== EPIC HIT EFFECT ADDED ===', hitEffect);
        return updated;
      });
      
      // エフェクトを1秒後に削除
      setTimeout(() => {
        setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
      }, 1000);
      
      // 脳汁全開エフェクト群
      try {
        // 1. 超豪華な効果音（コンボ連動）
        playEnhancedHitSound(newComboCount);
        
        // 2. 画面全体フラッシュエフェクト
        const flashIntensity = Math.min(1.0, 0.4 + (newComboCount * 0.08));
        setFlashEffect({
          active: true,
          intensity: flashIntensity,
          time: Date.now()
        });
        
        setTimeout(() => {
          setFlashEffect(null);
        }, 120);
        
        // 2.5. レーン光エフェクト（パチンコ風・強化版）
        const laneFlashIntensity = Math.min(1.0, 0.6 + (newComboCount * 0.12));
        setLaneFlashes(prev => ({
          ...prev,
          [lane]: {
            active: true,
            time: Date.now(),
            intensity: laneFlashIntensity
          }
        }));
        
        // レーン光を700msで消去
        setTimeout(() => {
          setLaneFlashes(prev => {
            const updated = { ...prev };
            delete updated[lane];
            return updated;
          });
        }, 700);
        
        // 3. 振動エフェクト（スマホ対応）
        if (navigator.vibrate) {
          const vibratePattern = newComboCount >= 10 
            ? [30, 20, 80, 20, 120, 20, 30] // 超高コンボ：複雑
            : newComboCount >= 5 
            ? [40, 25, 100, 25, 40] // 高コンボ：中程度
            : [60]; // 通常：シンプル
          navigator.vibrate(vibratePattern);
        }
        
        // 4. 連鎖パーティクル爆発（強化版）
        const laneWidth = window.innerWidth / LANE_COUNT;
        const chainExplosions = Math.min(4, Math.floor(newComboCount / 2) + 1);
        
        for (let i = 0; i < chainExplosions; i++) {
          setTimeout(() => {
            const randomX = lane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * 80;
            const randomY = JUDGMENT_LINE + (Math.random() - 0.5) * 40;
            
            // 連鎖爆発エフェクト
            const chainId = `chain-${Date.now()}-${i}`;
            setExplosionEffects(prev => [...prev, {
              id: chainId,
              x: randomX,
              y: randomY,
              time: Date.now()
            }]);
            
            setTimeout(() => {
              setExplosionEffects(prev => prev.filter(e => e.id !== chainId));
            }, 1200);
            
            // 豪華連鎖パーティクル
            const chainParticles = [];
            const particleCount = 20 + newComboCount * 2; // コンボで増加
            
            for (let j = 0; j < particleCount; j++) {
              const angle = (Math.PI * 2 * j) / particleCount;
              const speed = 100 + Math.random() * 150;
              
              chainParticles.push({
                id: `chain-particle-${Date.now()}-${i}-${j}`,
                x: randomX,
                y: randomY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 120,
                time: Date.now(),
                emoji: ['💫', '✨', '⭐', '🌟', '💥', '💖', '💕'][Math.floor(Math.random() * 7)]
              });
            }
            
            setHeartParticles(prev => [...prev, ...chainParticles]);
            
            setTimeout(() => {
              setHeartParticles(prev => prev.filter(p => !chainParticles.some(cp => cp.id === p.id)));
            }, 2500);
            
          }, i * 80); // 短い間隔で連鎖
        }
        
        // 5. コンボ達成時の特別エフェクト
        const currentCombo = newComboCount || comboCount + 1; // フォールバック
        console.log('🎯 Combo check:', currentCombo, 'mod 5:', currentCombo % 5);
        if (currentCombo > 0 && currentCombo % 5 === 0) {
          // 5コンボ毎に「ズキューン」
          console.log('🎺 COMBO SOUND TRIGGER! Combo:', currentCombo);
          playComboSound(currentCombo);
          
          // 画面端から端への光線エフェクト
          setTimeout(() => {
            const beamEffect = {
              id: `beam-${Date.now()}`,
              x: 0,
              y: JUDGMENT_LINE,
              time: Date.now()
            };
            setExplosionEffects(prev => [...prev, beamEffect]);
            
            setTimeout(() => {
              setExplosionEffects(prev => prev.filter(e => e.id !== beamEffect.id));
            }, 800);
          }, 50);
        }
        
      } catch (error) {
        console.log('🎮 Epic effect failed:', error);
      }
    } else {
      // ミス - スコアペナルティを追加
      console.log('💔 TAP MISS ===', 'Lane:', lane);
      
      // コンボリセット
      setComboCount(0);
      
      setScore(prev => {
        const newScore = Math.max(0, prev - 20); // 20ポイント減点
        scoreRef.current = newScore; // refも同期
        console.log('=== MISS PENALTY ===', prev, '->', newScore, 'Combo reset!');
        return newScore;
      });
      
      const effectId = `miss-${Date.now()}-${lane}`;
      const missEffect = { id: effectId, lane, time: Date.now(), type: 'miss' as const, score: -20 };
      setHitEffects(prev => {
        const updated = [...prev, missEffect];
        console.log('=== MISS EFFECT ADDED ===', missEffect);
        return updated;
      });
      
      // エフェクトを1秒後に削除
      setTimeout(() => {
        setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
      }, 1000);
    }
  };

  const playEnhancedHitSound = (combo: number) => {
    try {
      // パチンコ風「カリン」音＋気持ちいい和音のハイブリッド
      const audioContext = new AudioContext();
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      
      // コンボに応じて音量とエフェクト強化
      const baseVolume = 0.6 + Math.min(0.2, combo * 0.015);
      masterGain.gain.setValueAtTime(baseVolume, audioContext.currentTime);
      
      // パチンコ風「カリン」アタック音（最初の0.05秒）
      const attackOsc = audioContext.createOscillator();
      const attackGain = audioContext.createGain();
      const attackFilter = audioContext.createBiquadFilter();
      
      attackOsc.connect(attackFilter);
      attackFilter.connect(attackGain);
      attackGain.connect(masterGain);
      
      // 「カリン」音のための高周波ノイズ風
      attackOsc.type = 'square';
      attackOsc.frequency.setValueAtTime(2000, audioContext.currentTime);
      attackOsc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.03);
      
      attackFilter.type = 'highpass';
      attackFilter.frequency.setValueAtTime(1500, audioContext.currentTime);
      
      attackGain.gain.setValueAtTime(0.4, audioContext.currentTime);
      attackGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      
      attackOsc.start(audioContext.currentTime);
      attackOsc.stop(audioContext.currentTime + 0.05);
      
      // メイン和音（よりクリアで短く）
      const baseFreqs = [523.25, 659.25, 783.99]; // C-E-G（シンプルに3音）
      const additionalFreqs = combo >= 5 ? [1046.50] : []; // 高コンボで高音域追加
      const frequencies = [...baseFreqs, ...additionalFreqs];
      
      frequencies.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        // クリアな音のための設定
        osc.type = 'sine'; // よりクリアな音
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(freq, audioContext.currentTime);
        filter.Q.setValueAtTime(2, audioContext.currentTime);
        filter.gain.setValueAtTime(6, audioContext.currentTime);
        
        // ピッチベンドを控えめに、より直接的
        const pitchBend = 1 + (combo * 0.005); // より控えめ
        osc.frequency.setValueAtTime(freq * pitchBend, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * pitchBend * 1.05, audioContext.currentTime + 0.02); // 短縮
        
        // 音量エンベロープも短くしてパンチを効かせる
        const volume = 0.25 - index * 0.03;
        gain.gain.setValueAtTime(volume, audioContext.currentTime + 0.05); // アタック後から開始
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3); // 大幅短縮
        
        osc.start(audioContext.currentTime + 0.05); // アタック音の後から
        osc.stop(audioContext.currentTime + 0.3); // 短く
      });
      
      // 2. キラキラ装飾音（高音域・短縮版）
      for (let i = 0; i < 3; i++) { // 5個から3個に減少
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = 'triangle'; // よりクリアな波形
        const freq = 2000 + Math.random() * 800; // より高い周波数でキラキラ感
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + 0.1 + i * 0.03);
        
        gain.gain.setValueAtTime(0.08, audioContext.currentTime + 0.1 + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1 + i * 0.03 + 0.15); // 短縮
        
        osc.start(audioContext.currentTime + 0.1 + i * 0.03);
        osc.stop(audioContext.currentTime + 0.1 + i * 0.03 + 0.15);
      }
      
      // 3. 低音ドン（パチンコ的な重厚感・短縮版）
      const bass = audioContext.createOscillator();
      const bassGain = audioContext.createGain();
      
      bass.connect(bassGain);
      bassGain.connect(masterGain);
      
      bass.type = 'sawtooth'; // よりパンチのある音
      bass.frequency.setValueAtTime(130.81, audioContext.currentTime); // C3
      bass.frequency.exponentialRampToValueAtTime(65.41, audioContext.currentTime + 0.06); // 短縮
      
      bassGain.gain.setValueAtTime(0.25, audioContext.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); // 大幅短縮
      
      bass.start(audioContext.currentTime);
      bass.stop(audioContext.currentTime + 0.2); // 短縮
      
    } catch (error) {
      console.log('Epic hit sound failed:', error);
    }
  };

  const playComboSound = (combo: number) => {
    console.log('🎺 playComboSound called! Combo:', combo);
    try {
      // 「ズキューン」電子音で脳汁放出
      console.log('🎺 Creating AudioContext for combo sound...');
      const audioContext = new AudioContext();
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGain.gain.setValueAtTime(0.6, audioContext.currentTime);
      
      // ディストーションエフェクト
      const distortion = audioContext.createWaveShaper();
      const samples = 44100;
      const curve = new Float32Array(samples);
      const deg = Math.PI / 180;
      
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + combo * 0.5) * x * 20 * deg) / (Math.PI + combo * 0.2 * Math.abs(x));
      }
      distortion.curve = curve;
      distortion.oversample = '4x';
      distortion.connect(masterGain);
      
      // メインズキューン音
      const mainOsc = audioContext.createOscillator();
      const mainGain = audioContext.createGain();
      
      mainOsc.connect(mainGain);
      mainGain.connect(distortion);
      
      // 周波数スウィープ（ズキューン効果）
      const startFreq = 200 + combo * 50;
      const endFreq = 2000 + combo * 200;
      
      mainOsc.frequency.setValueAtTime(startFreq, audioContext.currentTime);
      mainOsc.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + 0.3);
      mainOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, audioContext.currentTime + 0.6);
      
      mainGain.gain.setValueAtTime(0.4, audioContext.currentTime);
      mainGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
      
      mainOsc.start(audioContext.currentTime);
      mainOsc.stop(audioContext.currentTime + 0.8);
      
      // 高音域キラキラ（電子音的）
      for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = 'square'; // 電子音っぽく
        osc.frequency.setValueAtTime(1500 + i * 500 + combo * 100, audioContext.currentTime + i * 0.1);
        
        gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.1 + 0.4);
        
        osc.start(audioContext.currentTime + i * 0.1);
        osc.stop(audioContext.currentTime + i * 0.1 + 0.4);
      }
      
      // 低音ドンドン（コンボ強調）
      const bassOsc = audioContext.createOscillator();
      const bassGain = audioContext.createGain();
      
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      
      bassOsc.frequency.setValueAtTime(80, audioContext.currentTime);
      bassOsc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.2);
      
      bassGain.gain.setValueAtTime(0.5, audioContext.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      bassOsc.start(audioContext.currentTime);
      bassOsc.stop(audioContext.currentTime + 0.5);
      
    } catch (error) {
      console.log('Combo sound failed:', error);
    }
  };

  const playHitSound = () => {
    // 旧関数を新関数で置き換え
    playEnhancedHitSound(0);
  };

  const drawGameWithNotes = (currentNotes: Note[], currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // オシャレなグラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    // 時間に応じて色が変化する動的グラデーション
    const hue1 = (currentTime * 20) % 360;
    const hue2 = (currentTime * 25 + 180) % 360;
    const hue3 = (currentTime * 15 + 90) % 360;
    
    gradient.addColorStop(0, `hsl(${hue1}, 70%, 15%)`);
    gradient.addColorStop(0.5, `hsl(${hue2}, 60%, 10%)`);
    gradient.addColorStop(1, `hsl(${hue3}, 80%, 5%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 背景パーティクル（星空効果）
    for (let i = 0; i < 50; i++) {
      const x = (i * 123.456 * currentTime) % canvas.width;
      const y = (i * 789.012 * currentTime * 0.3) % canvas.height;
      const alpha = Math.sin(currentTime * 2 + i) * 0.3 + 0.4;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.sin(currentTime + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Canvas描画テスト：画面の4隅に白い四角を表示
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 50, 50); // 左上
    ctx.fillRect(canvas.width - 50, 0, 50, 50); // 右上
    ctx.fillRect(0, canvas.height - 50, 50, 50); // 左下
    ctx.fillRect(canvas.width - 50, canvas.height - 50, 50, 50); // 右下
    
    // 描画確認ログ（コメントアウト - パフォーマンス向上）
    // console.log(`Canvas drawing: ${canvas.width}x${canvas.height}, time: ${currentTime.toFixed(1)}s`);

    // レーンの描画
    const laneWidth = canvas.width / LANE_COUNT;
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, 0);
      ctx.lineTo(i * laneWidth, canvas.height);
      ctx.stroke();
    }
    
    // レーン光エフェクト描画（パチンコ風）
    Object.entries(laneFlashes).forEach(([laneStr, flash]) => {
      if (!flash.active) return;
      
      const lane = parseInt(laneStr);
      const elapsed = Date.now() - flash.time;
      const fadeRatio = Math.max(0, 1 - elapsed / 700); // 700msでフェードアウト
      
      if (fadeRatio > 0) {
        const x = lane * laneWidth;
        const alpha = flash.intensity * fadeRatio;
        
        // パチンコ風の金色ライトアップ
        const lightGradient = ctx.createLinearGradient(x, 0, x + laneWidth, 0);
        lightGradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.6})`); // ゴールド
        lightGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.9})`); // 白
        lightGradient.addColorStop(1, `rgba(255, 215, 0, ${alpha * 0.6})`); // ゴールド
        
        ctx.fillStyle = lightGradient;
        ctx.fillRect(x, 0, laneWidth, canvas.height);
        
        // 追加のネオン効果
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 2, 0);
        ctx.lineTo(x + 2, canvas.height);
        ctx.moveTo(x + laneWidth - 2, 0);
        ctx.lineTo(x + laneWidth - 2, canvas.height);
        ctx.stroke();
      }
    });

    // 判定ラインの描画
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, JUDGMENT_LINE);
    ctx.lineTo(canvas.width, JUDGMENT_LINE);
    ctx.stroke();
    
    // 判定範囲を視覚化（デバッグ用）
    ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, JUDGMENT_LINE - 150);
    ctx.lineTo(canvas.width, JUDGMENT_LINE - 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, JUDGMENT_LINE + 150);
    ctx.lineTo(canvas.width, JUDGMENT_LINE + 150);
    ctx.stroke();

    // テスト用ノーツを追加
    if (currentTime < 5) {
      // 4つのレーンに固定位置でテストノーツを表示
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        const x = lane * laneWidth + laneWidth / 2;
        const testY = 100 + (lane * 100); // 各レーンで異なる高さ
        
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // 影効果
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText("🔥", x + 2, testY + 2);
        
        // メイン絵文字
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("🔥", x, testY);
      }
    }
    
    // 動くテストノーツ（常に表示）
    const movingTestY = 50 + (currentTime * 100) % 600; // ゆっくり上下移動
    const testX = laneWidth / 2; // 左端レーン
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText("⭐", testX + 2, movingTestY + 2);
    ctx.fillStyle = "#FFFF00";
    ctx.fillText("⭐", testX, movingTestY);

    // ヒットエフェクトの描画
    if (hitEffects.length > 0) {
      console.log('=== DRAWING HIT EFFECTS ===', hitEffects.length, 'effects');
    }
    hitEffects.forEach(effect => {
      const x = effect.lane * laneWidth + laneWidth / 2;
      const age = (Date.now() - effect.time) / 1000; // エフェクトの経過時間
      const radius = 40 + (age * 60); // より大きく、より速く拡大
      const opacity = Math.max(0, 1 - age); // 時間と共に薄くなる
      
      if (effect.type === 'hit') {
        // 超絢爛ヒットエフェクト
        const pulseSize = Math.sin(age * 20) * 0.3 + 1; // 高速パルス
        
        // 外側の爆発リング（虹色）
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = radius * (1 + ring * 0.5) * pulseSize;
          const ringHue = (age * 360 + ring * 120) % 360;
          
          const ringGradient = ctx.createRadialGradient(x, JUDGMENT_LINE, 0, x, JUDGMENT_LINE, ringRadius);
          ringGradient.addColorStop(0, `hsla(${ringHue}, 100%, 70%, ${opacity * 0.8})`);
          ringGradient.addColorStop(0.5, `hsla(${ringHue + 60}, 100%, 60%, ${opacity * 0.5})`);
          ringGradient.addColorStop(1, `hsla(${ringHue + 120}, 100%, 50%, 0)`);
          
          ctx.fillStyle = ringGradient;
          ctx.beginPath();
          ctx.arc(x, JUDGMENT_LINE, ringRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 中央の白い光
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 20 * opacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        ctx.beginPath();
        ctx.arc(x, JUDGMENT_LINE, radius * 0.3 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 放射状の光線
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 + age * 5;
          const lineLength = radius * 1.5;
          const endX = x + Math.cos(angle) * lineLength;
          const endY = JUDGMENT_LINE + Math.sin(angle) * lineLength;
          
          ctx.strokeStyle = `hsla(${(age * 200 + i * 45) % 360}, 100%, 80%, ${opacity * 0.6})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, JUDGMENT_LINE);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        // スコア表示（グラデーション文字）
        if (effect.score) {
          const scoreGradient = ctx.createLinearGradient(x - 50, JUDGMENT_LINE - 80, x + 50, JUDGMENT_LINE - 40);
          scoreGradient.addColorStop(0, `hsla(${age * 180}, 100%, 80%, ${opacity})`);
          scoreGradient.addColorStop(0.5, `hsla(${age * 180 + 120}, 100%, 90%, ${opacity})`);
          scoreGradient.addColorStop(1, `hsla(${age * 180 + 240}, 100%, 70%, ${opacity})`);
          
          ctx.font = `bold ${32 + Math.sin(age * 15) * 8}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = scoreGradient;
          ctx.shadowColor = "#FFFFFF";
          ctx.shadowBlur = 10 * opacity;
          ctx.fillText(`+${effect.score}`, x, JUDGMENT_LINE - 60 - age * 30);
          ctx.shadowBlur = 0;
        }
      } else if (effect.type === 'miss') {
        // ミスエフェクト（赤い×マーク）
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = 8;
        const size = 30;
        
        // ×マークを描画
        ctx.beginPath();
        ctx.moveTo(x - size, JUDGMENT_LINE - size);
        ctx.lineTo(x + size, JUDGMENT_LINE + size);
        ctx.moveTo(x + size, JUDGMENT_LINE - size);
        ctx.lineTo(x - size, JUDGMENT_LINE + size);
        ctx.stroke();
        
        // "MISS"テキストとペナルティスコア表示
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.fillText("MISS", x, JUDGMENT_LINE - 60);
        
        // ペナルティスコア表示
        if (effect.score) {
          ctx.font = "bold 28px Arial";
          ctx.fillStyle = `rgba(255, 100, 100, ${opacity})`;
          ctx.fillText(`${effect.score}`, x, JUDGMENT_LINE - 90);
        }
      }
    });

    // オシャレなノーツ描画（発光エフェクト付き）
    currentNotes.forEach(note => {
      if (note.y > -50 && note.y < canvas.height + 50) {
        const x = note.lane * laneWidth + laneWidth / 2;
        
        // 判定ラインに近づくほど光る効果
        const distanceToJudgment = Math.abs(note.y - JUDGMENT_LINE);
        const glowIntensity = Math.max(0, 1 - distanceToJudgment / 200);
        
        // コンボ数に応じてサイズを変更
        const baseSize = 48;
        const comboScaling = Math.min(1.5, 1 + (comboCount * 0.1));
        const fontSize = Math.floor(baseSize * comboScaling);
        
        // ノーツの種類別エフェクト
        if (note.type === 'heart') {
          // ハートノーツ：色別グロー
          const heartColors = {
            red: '#FF69B4',
            green: '#00FF88',
            blue: '#00BFFF',
            yellow: '#FFD700',
            purple: '#DA70D6'
          };
          const glowColor = heartColors[note.color || 'red'];
          
          // 外側のグロー（大きく）
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 30 + glowIntensity * 20;
          ctx.fillStyle = glowColor;
          ctx.globalAlpha = 0.3 + glowIntensity * 0.4;
          ctx.font = `${fontSize + 10}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(note.emoji, x, note.y);
          
          // 内側のメイングロー
          ctx.shadowBlur = 15 + glowIntensity * 15;
          ctx.globalAlpha = 0.8 + glowIntensity * 0.2;
          ctx.font = `${fontSize}px Arial`;
          ctx.fillText(note.emoji, x, note.y);
          
        } else {
          // 星ノーツ：虹色グロー
          const starHue = (currentTime * 100 + note.lane * 90) % 360;
          const glowColor = `hsl(${starHue}, 100%, 70%)`;
          
          // 外側のグロー
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 25 + glowIntensity * 25;
          ctx.fillStyle = glowColor;
          ctx.globalAlpha = 0.4 + glowIntensity * 0.3;
          ctx.font = `${fontSize + 8}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(note.emoji, x, note.y);
          
          // メイン星
          ctx.shadowBlur = 12 + glowIntensity * 12;
          ctx.globalAlpha = 0.9 + glowIntensity * 0.1;
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(note.emoji, x, note.y);
        }
        
        // トレイルエフェクト（ノーツの軌跡）
        if (glowIntensity > 0.3) {
          for (let i = 1; i <= 3; i++) {
            const trailY = note.y - i * 15;
            const trailAlpha = (0.3 - i * 0.1) * glowIntensity;
            
            if (trailAlpha > 0) {
              ctx.globalAlpha = trailAlpha;
              ctx.font = `${fontSize - i * 5}px Arial`;
              ctx.fillText(note.emoji, x, trailY);
            }
          }
        }
        
        // リセット
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
    });

    // 爆発エフェクトの描画
    explosionEffects.forEach(explosion => {
      const age = (Date.now() - explosion.time) / 1000; // 経過時間（秒）
      const maxAge = 1.0; // 1秒で消える
      
      if (age < maxAge) {
        const opacity = Math.max(0, 1 - age); // 時間と共に薄くなる
        const radius = 30 + (age * 120); // 半径が拡大
        
        // 爆発の光る円（外側）
        const gradient = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, radius);
        gradient.addColorStop(0, `rgba(255, 100, 150, ${opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 50, 100, ${opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 50, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内側の明るい光
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 爆発テキスト
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText("💥", explosion.x, explosion.y - 40);
      }
    });

    // ハートパーティクルの描画
    heartParticles.forEach(particle => {
      const age = (Date.now() - particle.time) / 1000; // 経過時間（秒）
      const maxAge = 2.0; // 2秒で消える
      
      if (age < maxAge) {
        const opacity = Math.max(0, 1 - age / maxAge);
        
        // パーティクルの位置を計算（物理演算）
        const gravity = 300; // 重力加速度
        const currentX = particle.x + particle.vx * age;
        const currentY = particle.y + particle.vy * age + 0.5 * gravity * age * age;
        
        // 画面内かチェック
        if (currentX >= -50 && currentX <= canvas.width + 50 && 
            currentY >= -50 && currentY <= canvas.height + 50) {
          
          // ハートパーティクルの大きさ（時間と共に小さくなる）
          const scale = Math.max(0.3, 1 - age / maxAge);
          const fontSize = Math.floor(32 * scale);
          
          ctx.font = `${fontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // 影効果
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
          ctx.fillText(particle.emoji, currentX + 1, currentY + 1);
          
          // メインのパーティクル
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillText(particle.emoji, currentX, currentY);
        }
      }
    });
    
    // フラッシュエフェクト（画面全体）
    if (flashEffect && flashEffect.active) {
      const age = (Date.now() - flashEffect.time) / 1000;
      const flashOpacity = Math.max(0, flashEffect.intensity * (1 - age * 10)); // 高速で減衰
      
      if (flashOpacity > 0) {
        // 虹色フラッシュ
        const flashHue = (Date.now() / 10) % 360;
        ctx.fillStyle = `hsla(${flashHue}, 100%, 90%, ${flashOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 中央から広がる光の波
        const waveRadius = age * 1000; // 1000px/秒で拡大
        const waveGradient = ctx.createRadialGradient(
          canvas.width / 2, JUDGMENT_LINE, 0,
          canvas.width / 2, JUDGMENT_LINE, waveRadius
        );
        waveGradient.addColorStop(0, `hsla(${flashHue + 120}, 100%, 95%, ${flashOpacity * 0.8})`);
        waveGradient.addColorStop(0.5, `hsla(${flashHue + 240}, 100%, 85%, ${flashOpacity * 0.4})`);
        waveGradient.addColorStop(1, `hsla(${flashHue}, 100%, 75%, 0)`);
        
        ctx.fillStyle = waveGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // 後方互換性のための関数（useCallbackでメモ化）
  const drawGame = useCallback(() => {
    drawGameWithNotes(notes, gameTime);
  }, [notes, gameTime, comboCount, hitEffects, explosionEffects, heartParticles]); // 描画に必要な全ての依存関係

  // Canvas描画の更新を削除（ゲームループ内で描画するため重複）

  // Canvas初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log(`Canvas initialized: ${canvas.width}x${canvas.height}`);
      
      // 初期化のみ（描画はゲームループで行う）
    }

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(`Canvas resized: ${canvas.width}x${canvas.height}`);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // 初期化時のみ実行

  return (
    <div className="fixed inset-0 bg-black text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ touchAction: "none" }}
      />
        
        {/* UI オーバーレイ */}
        <div className="absolute top-4 left-4 z-30 bg-black bg-opacity-70 p-3 rounded-lg">
          <div className="text-2xl font-bold text-white">スコア: {score}</div>
          <div className="text-lg text-yellow-300">目標: {TARGET_SCORE}</div>
          <div className="text-sm text-white">時間: {gameTime.toFixed(1)}s / {songDuration.toFixed(1)}s</div>
          <div className="text-sm">
            <span className="text-green-400">進捗: </span>
            <span className={hasCleared ? "text-green-400 font-bold" : "text-white"}>
              {Math.min(100, Math.floor((score / TARGET_SCORE) * 100))}%
            </span>
          </div>
          {comboCount > 0 && (
            <div className={`text-lg font-bold ${comboCount >= 5 ? 'text-red-400 animate-pulse' : 'text-pink-400'}`}>
              💖 コンボ: {comboCount} {comboCount >= 5 && '🔥'}
            </div>
          )}
          
          {/* 色別コンボ表示 */}
          <div className="text-xs space-y-1">
            <div className="text-gray-300">色別コンボ:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(colorCombos).map(([color, count]) => {
                if (count === 0) return null;
                const colorEmojis = {
                  red: '❤️',
                  green: '💚',
                  blue: '💙',
                  yellow: '💛',
                  purple: '💜'
                };
                const isHighCombo = count >= 3;
                return (
                  <div 
                    key={color} 
                    className={`flex items-center gap-1 px-1 rounded text-xs ${
                      isHighCombo ? 'bg-yellow-500 text-black font-bold animate-pulse' : 'bg-gray-700 text-white'
                    }`}
                  >
                    <span>{colorEmojis[color as keyof typeof colorEmojis]}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {hasCleared && (
            <div className="text-green-400 font-bold text-lg animate-pulse">
              🎉 クリア！
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 z-10">
          <Button onClick={() => {
            console.log('🔙 Back button clicked - stopping all audio');
            // 音楽を確実に停止
            try {
              audioManagerRef.current.stop();
              console.log('🔙 AudioManager stopped');
            } catch (error) {
              console.log('🔙 AudioManager stop failed:', error);
            }
            
            try {
              // currentAudioRefの音楽も停止
              if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                currentAudioRef.current.src = '';
                currentAudioRef.current = null;
                console.log('🔙 currentAudioRef stopped and cleared');
              }
            } catch (error) {
              console.log('🔙 currentAudioRef stop failed:', error);
            }
            
            try {
              // すべてのHTML5 Audioを停止
              const audioElements = document.querySelectorAll('audio');
              audioElements.forEach((audio, index) => {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                console.log(`🔙 Audio element ${index} stopped and cleared`);
              });
            } catch (error) {
              console.log('🔙 HTML audio stop failed:', error);
            }
            
            // ゲーム状態もリセット
            setGameStarted(false);
            
            // 戻る処理実行
            onBack();
          }} variant="outline" size="sm">
            戻る
          </Button>
        </div>

        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-75">
            <div className="text-center max-w-sm mx-4">
              <h2 className="text-2xl font-bold mb-4">ゲーム準備完了！</h2>
              <p className="mb-4">落ちてくるノーツをタイミングよくタップしよう</p>
              <Button onClick={startGame} size="lg" className="w-full">
                スタート
              </Button>
            </div>
          </div>
        )}

        {/* タップエリア */}
        <div className="absolute bottom-0 left-0 right-0 h-40 flex z-10">
          {Array.from({ length: LANE_COUNT }, (_, i) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
            const colorClasses = ['border-blue-400', 'border-green-400', 'border-yellow-400', 'border-red-400'];
            
            return (
              <button
                key={i}
                className={`flex-1 border-2 ${colorClasses[i]} bg-black bg-opacity-30 active:bg-opacity-60 transition-all duration-150 flex flex-col items-center justify-center`}
                onClick={() => handleLaneTap(i)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleLaneTap(i);
                }}
              >
                <div className={`w-8 h-8 ${colors[i]} rounded-full flex items-center justify-center text-black font-bold text-lg mb-1`}>
                  {i + 1}
                </div>
                <div className="text-white text-xs font-semibold">
                  {i === 0 && "左端"}
                  {i === 1 && "左中央"}
                  {i === 2 && "右中央"}
                  {i === 3 && "右端"}
                </div>
              </button>
            );
          })}
        </div>
    </div>
  );
}