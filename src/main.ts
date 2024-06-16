import aubio from "aubiojs";
import { Essentia, EssentiaWASM } from 'essentia.js';

const captureMicrophoneStream = async () => {
  try {
    // Check for browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Browser does not support getUserMedia API");
    }

    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // source.connect(audioContext.destination);

    console.log("Microphone input captured successfully");
    return stream;
  } catch (error) {
    console.error("Error capturing microphone input:", error);
    return null;
  }
}

const setupTempo = async (scriptProcessor: ScriptProcessorNode, audioContext: AudioContext) => {
  aubio().then(({ Tempo }) => {
    const tempo = new Tempo(
      scriptProcessor.bufferSize * 4,
      scriptProcessor.bufferSize,
      audioContext.sampleRate
    );

    const output = document.createElement('div');
    document.body.appendChild(output);

    scriptProcessor.addEventListener("audioprocess", function (event) {
      if (tempo.do(event.inputBuffer.getChannelData(0))) {

        output.innerText = `Tempo: ${Number(tempo.getBpm()).toFixed(0)}`;
      }
    });
  });
}

const setupKey = async (essentia: any, scriptProcessor: ScriptProcessorNode) => {
  const output = document.createElement('div');
  document.body.appendChild(output);

  scriptProcessor.addEventListener("audioprocess", function (event) {
    // convert the float32 audio data into std::vector<float> for using with essentia algos
    var vectorSignal = essentia.arrayToVector(event.inputBuffer.getChannelData(0));
    if (!vectorSignal) {
      throw "onRecordingError: empty audio signal input found!";
    }

    const result = essentia.KeyExtractor(vectorSignal);
    output.innerText = `Key: ${result.key}`;
  });
}

const setupLoudness = async (essentia: any, scriptProcessor: ScriptProcessorNode) => {
  const output = document.createElement('div');
  document.body.appendChild(output);

  scriptProcessor.addEventListener("audioprocess", function (event) {
    // convert the float32 audio data into std::vector<float> for using with essentia algos
    var vectorSignal = essentia.arrayToVector(event.inputBuffer.getChannelData(0));
    if (!vectorSignal) {
      throw "onRecordingError: empty audio signal input found!";
    }

    const result = essentia.Loudness(vectorSignal);

    output.innerText = `Loudness: ${result.loudness}`;
  });
}

const setupFrequency = async (analyser: AnalyserNode) => {
  const dataArray = new Float32Array(analyser.fftSize);

  const output = document.createElement('div');
  document.body.appendChild(output);

  const tick = () => {
    window.requestAnimationFrame(tick);

    analyser.getFloatFrequencyData(dataArray);
    output.innerText = `Frequency: ${dataArray.map(v => v * 200.0).reduce((a, b) => a + b) / dataArray.length}`;
  }
  tick();
}

const launch = async () => {
  // Example usage
  const stream = await captureMicrophoneStream();

  if (!stream) {
    return;
  }

  const audioContext = new AudioContext({
    sampleRate: 44100,
  });

  // Create a MediaStreamSource node from the microphone input stream
  const audioSource = audioContext.createMediaStreamSource(stream);

  const scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);
  scriptProcessor.connect(audioContext.destination);
  audioSource.connect(scriptProcessor);

  const analyser = audioContext.createAnalyser();
  analyser.connect(audioContext.destination);
  analyser.fftSize = 1024;
  audioSource.connect(analyser);

  const essentia = new Essentia(EssentiaWASM.EssentiaWASM);

  //audioSource.connect(audioContext.destination);
  setupTempo(scriptProcessor, audioContext);
  setupKey(essentia, scriptProcessor);
  setupLoudness(essentia, scriptProcessor);
  setupFrequency(analyser);
}


window.addEventListener('click', launch, { once: true });
