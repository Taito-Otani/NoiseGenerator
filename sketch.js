let whiteNoise;
let filter;
let filterFreq;
let filterRes;
let waveform;
let particles = [];
let noiseType = 'white';
let noiseDropdown;
let osc;
let isOscillator = false;
let audioStarted = false;
let startButton;
let touchPath = [];
let isRecording = false;
let isPlayingBack = false;
let playbackIndex = 0;
let maxRecordingTime = 2000;  // 最大記録時間 (5秒)
let recordingStartTime = 0;
let playbackInterval = 20;  // 再生間隔 (ミリ秒)
let recordingToggleButton;
let isRecordingEnabled = false;
let clearButton;

function preload() {
  whiteNoise = new p5.Noise(noiseType);
  whiteNoise.amp(0);

  filter = new p5.LowPass();
  whiteNoise.disconnect();
  whiteNoise.connect(filter);

  waveform = new p5.FFT();
  waveform.setInput(filter);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  filterFreq = 1000; // 初期フィルター周波数
  filterRes = 1;     // 初期レゾナンス

  textSize(45); // テキストを大きく設定
  fill(255);
  noStroke();

  noiseDropdown = createSelect();
  noiseDropdown.position(30, 20);  // ドロップダウンボタンの位置を上部に調整
  noiseDropdown.style('height', '80px');  // 高さを少し大きく設定
  noiseDropdown.option('white');
  noiseDropdown.option('pink');
  noiseDropdown.option('brown');
  noiseDropdown.option('sine');
  noiseDropdown.option('square');
  noiseDropdown.selected('white');
  noiseDropdown.changed(changeNoiseType);
  noiseDropdown.addClass('styled-select');
  noiseDropdown.style('font-size', '45px');
  noiseDropdown.style('padding', '10px 20px');

  startButton = createButton('Start Audio');
  startButton.style('font-size', '45px');
  startButton.style('padding', '30px 60px');
  startButton.style('background-color', '#0f0');
  startButton.style('color', '#000');
  startButton.style('border', 'none');
  startButton.style('border-radius', '10px');
  startButton.style('cursor', 'pointer');
  startButton.position(windowWidth / 2 - 150, windowHeight / 2 - 100);  // 中央に配置
  startButton.mousePressed(startAudio);  // ボタンを押すとAudioContextを起動する

  recordingToggleButton = createButton('Rec');
  recordingToggleButton.style('font-size', '45px');
  recordingToggleButton.style('padding', '10px 20px');
  recordingToggleButton.style('background-color', '#ff0000');
  recordingToggleButton.style('color', '#fff');
  recordingToggleButton.style('border', 'none');
  recordingToggleButton.style('border-radius', '5px');
  recordingToggleButton.style('height', '80px');  // ドロップダウンボタンの高さに揃える
  recordingToggleButton.position(windowWidth - 350, 20);  // Recボタンを少し左に配置
  recordingToggleButton.mousePressed(toggleRecording);

  clearButton = createButton('Clear');
  clearButton.style('font-size', '45px');
  clearButton.style('padding', '10px 20px');
  clearButton.style('background-color', '#808080');
  clearButton.style('color', '#fff');
  clearButton.style('border', 'none');
  clearButton.style('border-radius', '5px');
  clearButton.style('height', '80px');
  clearButton.position(windowWidth - 180, 20);  // ClearボタンをRecボタンの右側に配置
  clearButton.mousePressed(clearRecording);
}

function startAudio() {
  getAudioContext().resume().then(() => {
    console.log('Audio Context resumed successfully');
    whiteNoise.start();
    audioStarted = true;
    startButton.hide();  // ボタンを非表示にする
  });
}

function draw() {
  background(30);

  if (!audioStarted) return;  // 音声が開始されるまでは何もしない

  // フィルターの周波数とレゾナンスを設定
  filter.freq(filterFreq);
  filter.res(filterRes);

  if (isOscillator) {
    osc.amp(0.1);
  } else {
    whiteNoise.amp(0.1); // Adjust volume level
  }

  // 波形を取得して描画
  let wave = waveform.waveform();
  stroke(0, 255, 0);
  noFill();
  beginShape();
  for (let i = 0; i < wave.length; i++) {
    let x = map(i, 0, wave.length, 0, width);
    let y = map(wave[i], -1, 1, height, 0);
    vertex(x, y);

    if (random() < 0.02) {
      particles.push(new Particle(x, y));
    }
  }
  endShape();

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();

    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  fill(0, 255, 0);
  ellipse(mouseX, mouseY, width*0.05);

  textSize(45); // テキストサイズを大きく設定
  fill(255);
  text('Filter Frequency: ' + filterFreq.toFixed(2) + ' Hz', 20, height -150);
  text('Filter Resonance: ' + filterRes.toFixed(2), 20, height -200);
  text('©️NINETEEN95 STUDIO', 10, height - 50);

  filterFreq = map(mouseY, height*0.8, height*0.2, 20, 20000);
  filterFreq = constrain(filterFreq, 20, 20000);

  filterRes = map(mouseX, 0, width, 0.5, 20);
  filterRes = constrain(filterRes, 0.5, 20);

  if (isPlayingBack && touchPath.length > 0) {
    if (playbackIndex < touchPath.length) {
      let point = touchPath[playbackIndex];
      filterFreq = point.freq;
      mouseX = point.x;
      mouseY = point.y;

      playbackIndex++;
    } else {
      playbackIndex = 0;  // ループ再生
    }
  }
}

function mouseDragged() {
  if (isRecording) {
    let currentTime = millis() - recordingStartTime;
    if (currentTime < maxRecordingTime) {
      touchPath.push({
        x: mouseX,
        y: mouseY,
        freq: filterFreq,
        res: filterRes
      });
    } else {
      stopRecording();
      startPlayback();  // 録音が終わったら自動で再生を開始
    }
  }
}

function startRecording() {
  touchPath = [];
  isRecording = true;
  isPlayingBack = false;
  recordingStartTime = millis();
  console.log('Recording started');
}

function stopRecording() {
  isRecording = false;
  isRecordingEnabled = false;  // 録音オンオフスイッチを自動でオフにする
  recordingToggleButton.html('Rec');
  recordingToggleButton.style('background-color', '#ff0000');
  console.log('Recording stopped. Recorded ' + touchPath.length + ' points.');
}

function startPlayback() {
  if (touchPath.length > 0) {
    isPlayingBack = true;
    playbackIndex = 0;
    console.log('Playback started');
  }
}

function mousePressed() {
  if (isRecordingEnabled) {
    touchPath = [];  // 既存の録音をクリアして上書きする
    startRecording();
  }
}

function toggleRecording() {
  isRecordingEnabled = !isRecordingEnabled;

  if (isRecordingEnabled) {
    recordingToggleButton.html('Stop');
    recordingToggleButton.style('background-color', '#00ff00');
    startRecording();
  } else {
    recordingToggleButton.html('Rec');
    recordingToggleButton.style('background-color', '#ff0000');
    stopRecording();
  }
}

function clearRecording() {
  touchPath = [];
  isPlayingBack = false;
  playbackIndex = 0;
  console.log('Recording cleared');
}

function changeNoiseType() {
  let newType = noiseDropdown.value();

  if (osc) {
    osc.stop();
    osc.disconnect();
  }
  whiteNoise.stop();

  if (newType === 'sine' || newType === 'square') {
    osc = new p5.Oscillator(newType);
    osc.freq(440);
    osc.start();
    osc.disconnect();
    osc.connect(filter);
    isOscillator = true;
  } else {
    whiteNoise = new p5.Noise(newType);
    whiteNoise.start();
    whiteNoise.amp(0.1);
    whiteNoise.disconnect();
    whiteNoise.connect(filter);
    isOscillator = false;
  }

  noiseType = newType;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  startButton.position(windowWidth / 2 - 150, windowHeight / 2 - 100);  // リサイズ時に中央に配置し直す
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 5));
    this.acc = createVector(0, 0);
    this.lifetime = 255;
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.lifetime -= 3;
  }

  show() {
    noStroke();
    fill(0, 255, 0, this.lifetime);
    ellipse(this.pos.x, this.pos.y, 2);
  }

  isDead() {
    return this.lifetime <= 0;
  }
}
