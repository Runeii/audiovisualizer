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

const setupBeatDetection = async (audioContext: AudioContext) => {
  const SAMPLE_SIZE = 2048;
  const bpm = new BeatDetektor(85, 169);
  const beatDetektorKick = new BeatDetektor.modules.vis.BassKick();

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = SAMPLE_SIZE;

  let data: Iterable<number> = []
  const tick = () => {
    const tempdata = new Uint8Array(SAMPLE_SIZE);
    analyser.getByteFrequencyData(tempdata);
    data = [...data, ...tempdata];

    const time = new Date().getTime();
    bpm.process(time / 1000, Uint8Array.from(data));

    beatDetektorKick.process(bpm);

    const kick = beatDetektorKick.isKick();
    if (kick) {
      console.log('KICK', bpm.current_bpm)
    }
    window.requestAnimationFrame(tick);
  }

  tick();
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

  const audioContext = new AudioContext();

  // Create a MediaStreamSource node from the microphone input stream
  const audioSource = audioContext.createMediaStreamSource(stream);

  const scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);
  scriptProcessor.connect(audioContext.destination);
  audioSource.connect(scriptProcessor);

  const analyser = audioContext.createAnalyser();
  analyser.connect(audioContext.destination);
  analyser.fftSize = 2048;
  audioSource.connect(analyser);

  //audioSource.connect(audioContext.destination);
  console.log(Essentia, EssentiaWASM)
  const essentia = new Essentia(EssentiaWASM.EssentiaWASM);
  setupTempo(scriptProcessor, audioContext);
  setupBeatDetection(audioContext);
  setupFrequency(analyser);
}


window.addEventListener('click', launch, { once: true });
