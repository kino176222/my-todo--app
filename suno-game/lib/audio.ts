export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private initializationError: string | null = null;
  
  // 代替のHTML5 Audio
  private htmlAudio: HTMLAudioElement | null = null;
  private useHtmlAudio = false;

  async initializeAudio(file: File): Promise<void> {
    try {
      // AudioContextを作成（suspended状態で開始）
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // AudioContextがsuspendedの場合は何もしない（後でresumeする）
      console.log('AudioContext state:', this.audioContext.state);

      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // アナライザーノードを作成
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.analyserNode.connect(this.audioContext.destination);

      console.log('Audio initialized successfully. Duration:', this.audioBuffer.duration);
      this.initializationError = null;
    } catch (error) {
      console.error('Web Audio API initialization failed, trying HTML5 Audio:', error);
      this.initializationError = error instanceof Error ? error.message : 'Unknown error';
      
      // 代替のHTML5 Audio方式を試す
      try {
        const url = URL.createObjectURL(file);
        this.htmlAudio = new Audio(url);
        this.htmlAudio.preload = 'auto';
        
        await new Promise<void>((resolve, reject) => {
          this.htmlAudio!.addEventListener('loadeddata', () => {
            console.log('HTML5 Audio initialized successfully. Duration:', this.htmlAudio!.duration);
            this.useHtmlAudio = true;
            resolve();
          });
          this.htmlAudio!.addEventListener('error', reject);
        });
        
        this.initializationError = null;
      } catch (htmlError) {
        console.error('HTML5 Audio initialization also failed:', htmlError);
        throw error; // 元のエラーを投げる
      }
    }
  }

  async play(): Promise<void> {
    if (this.useHtmlAudio && this.htmlAudio) {
      // HTML5 Audio方式（シンプル版）
      try {
        this.htmlAudio.currentTime = this.pauseTime;
        await this.htmlAudio.play();
        this.startTime = Date.now() / 1000 - this.pauseTime;
        this.isPlaying = true;
        console.log('HTML5 Audio playback started. Offset:', this.pauseTime);
      } catch (error) {
        console.error('HTML5 Audio playback failed:', error);
        this.isPlaying = false;
      }
      return;
    }

    if (!this.audioContext || !this.audioBuffer) {
      console.error('AudioContext or AudioBuffer not available');
      return;
    }

    try {
      // AudioContextを再開（ユーザーインタラクション後に必要）
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming AudioContext...');
        await this.audioContext.resume();
      }

      this.stop(); // 既存の再生を停止

      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      
      if (this.analyserNode) {
        this.sourceNode.connect(this.analyserNode);
      } else {
        this.sourceNode.connect(this.audioContext.destination);
      }

      const offset = this.pauseTime;
      this.sourceNode.start(0, offset);
      this.startTime = this.audioContext.currentTime - offset;
      this.isPlaying = true;
      
      console.log('Web Audio API playback started. Offset:', offset);
    } catch (error) {
      console.error('Web Audio API playback failed:', error);
    }
  }

  pause(): void {
    if (this.useHtmlAudio && this.htmlAudio) {
      this.htmlAudio.pause();
      this.pauseTime = this.htmlAudio.currentTime;
      this.isPlaying = false;
      return;
    }

    if (this.sourceNode && this.isPlaying) {
      this.pauseTime = this.getCurrentTime();
      this.sourceNode.stop();
      this.isPlaying = false;
    }
  }

  stop(): void {
    try {
      if (this.useHtmlAudio && this.htmlAudio) {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
        this.isPlaying = false;
        this.pauseTime = 0;
        console.log('HTML5 Audio stopped');
        return;
      }

      if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode = null;
      }
      this.isPlaying = false;
      this.pauseTime = 0;
      console.log('Web Audio API stopped');
    } catch (error) {
      console.warn('Error stopping audio:', error);
      this.isPlaying = false;
      this.pauseTime = 0;
    }
  }

  getCurrentTime(): number {
    if (this.useHtmlAudio && this.htmlAudio) {
      return this.htmlAudio.currentTime || 0;
    }

    if (!this.audioContext) return this.pauseTime;
    if (!this.isPlaying) return this.pauseTime;
    
    const time = this.audioContext.currentTime - this.startTime;
    return Math.max(0, time);
  }

  getDuration(): number {
    if (this.useHtmlAudio && this.htmlAudio) {
      return this.htmlAudio.duration || 0;
    }
    return this.audioBuffer?.duration || 0;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // 簡単なビート検出（低周波数帯域の音量ピーク検出）
  detectBeat(): boolean {
    const frequencyData = this.getFrequencyData();
    if (frequencyData.length === 0) return false;

    // 低周波数帯域（ベース音）をチェック
    const bassRange = frequencyData.slice(0, 10);
    const bassLevel = bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length;
    
    // しきい値を超えた場合にビートとして検出
    return bassLevel > 120;
  }

  getPlaying(): boolean {
    if (this.useHtmlAudio && this.htmlAudio) {
      return !this.htmlAudio.paused && !this.htmlAudio.ended;
    }
    return this.isPlaying;
  }

  getDebugInfo(): { 
    audioContextState: string | null; 
    hasAudioBuffer: boolean; 
    bufferDuration: number | null; 
    initError: string | null;
    usingHtmlAudio: boolean;
  } {
    return {
      audioContextState: this.audioContext?.state || null,
      hasAudioBuffer: !!this.audioBuffer || !!this.htmlAudio,
      bufferDuration: this.getDuration() || null,
      initError: this.initializationError,
      usingHtmlAudio: this.useHtmlAudio
    };
  }

  // 簡単なテスト再生メソッド
  async testPlay(): Promise<boolean> {
    try {
      if (!this.audioContext || !this.audioBuffer) {
        console.error('Test play failed: Missing context or buffer');
        return false;
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const testSource = this.audioContext.createBufferSource();
      testSource.buffer = this.audioBuffer;
      testSource.connect(this.audioContext.destination);
      testSource.start(0, 0, 0.1); // 0.1秒だけ再生

      console.log('Test play successful');
      return true;
    } catch (error) {
      console.error('Test play failed:', error);
      return false;
    }
  }
}