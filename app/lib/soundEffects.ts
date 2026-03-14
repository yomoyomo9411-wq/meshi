// lib/soundEffects.ts

export const playStarSound = () => {
  // ファイルを読み込む
  const audio = new Audio("/star.wav");
  
  // 音量を調整（0.0 〜 1.0）
  audio.volume = 0.1; 
  
  // 再生
  audio.play().catch((e) => {
    // ブラウザの制限で、ユーザーが一度も画面を触っていないとエラーになることがあります
    console.warn("音声再生に失敗しました（ユーザー操作待ち）:", e);
  });
};

// lib/soundEffects.ts

// （既存の playStarSound などがあるはず）

export const playPaperSound = () => {
  const audio = new Audio("/paper.wav");
  audio.volume = 0; // 音量はお好みで
  audio.play().catch((e) => console.warn("Audio play failed:", e));
};