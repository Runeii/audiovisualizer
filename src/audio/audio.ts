import { Essentia, EssentiaWASM } from 'essentia.js';
import useStore from "../store";
import * as AubioHandler from "./aubio";
import * as MeydaHandler from "./meyda";

const setupKey = async (essentia: any, scriptProcessor: ScriptProcessorNode) => {
  scriptProcessor.addEventListener("audioprocess", function (event) {
    const vectorSignal = essentia.arrayToVector(event.inputBuffer.getChannelData(0));

    if (!vectorSignal) {
      throw "onRecordingError: empty audio signal input found!";
    }

    const result = essentia.KeyExtractor(vectorSignal);
    useStore.setState({ key: result.key });
  });
}

const setupFrequency = async (analyser: AnalyserNode) => {
  const dataArray = new Float32Array(analyser.fftSize);

  const tick = () => {
    window.requestAnimationFrame(tick);

    analyser.getFloatFrequencyData(dataArray);
    //    output.innerText = `Frequency: ${dataArray.map(v => v * 200.0).reduce((a, b) => a + b) / dataArray.length}`;
  }
  tick();
}

let hasLaunched = false;
export const launchAudioProcessing = async () => {
  const essentia = new Essentia(EssentiaWASM.EssentiaWASM);

  //audioSource.connect(audioContext.destination);
  //setupTempo(scriptProcessor, audioContext);
  //setupKey(essentia, scriptProcessor);
  //startMeyda(audioContext, audioSource);
  //setupFrequency(analyser);
}

const captureMicrophoneStream = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Browser does not support getUserMedia API");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    console.log("Microphone input captured successfully");
    return stream;
  } catch (error) {
    console.error("Error capturing microphone input:", error);
    return null;
  }
}

let audioSource: MediaStreamAudioSourceNode;
let scriptProcessor: ScriptProcessorNode;
export const setupAudioProcessing = async () => {
  const stream = await captureMicrophoneStream();

  if (!stream) {
    return;
  }

  const audioContext = new AudioContext({
    sampleRate: 44100,
  });

  // Create a MediaStreamSource node from the microphone input stream
  audioSource = audioContext.createMediaStreamSource(stream);

  scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);
  scriptProcessor.connect(audioContext.destination);
  audioSource.connect(scriptProcessor);

  const analyser = audioContext.createAnalyser();
  //analyser.connect(audioContext.destination);
  analyser.fftSize = 1024;
  audioSource.connect(analyser);
}

export const startAudioProcessing = async () => {
  if (!audioSource) {
    await setupAudioProcessing();
  }
  MeydaHandler.start(audioSource);
  AubioHandler.start(scriptProcessor);
}

export const stopAudioProcessing = async () => {
  MeydaHandler.stop();
  AubioHandler.stop(scriptProcessor);
}