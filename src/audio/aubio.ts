import aubioLibrary, { Tempo } from "aubiojs";
import useStore from "../store";

let tempo: Tempo;
let lastHeard = 0;
const handleTempo = async (event: AudioProcessingEvent) => {
  if (tempo.do(event.inputBuffer.getChannelData(0))) {
    lastHeard = Date.now();
    useStore.setState({ tempo: Number(tempo.getBpm().toFixed(0)) });
  } else {
    if (Date.now() - lastHeard > 2000) {
      useStore.setState({ tempo: 0 });
    }
  }
}


export const start = async (scriptProcessor: ScriptProcessorNode) => {
  const { Tempo } = await aubioLibrary()

  tempo = new Tempo(
    scriptProcessor.bufferSize * 4,
    scriptProcessor.bufferSize,
    scriptProcessor.context.sampleRate
  );

  scriptProcessor.addEventListener("audioprocess", handleTempo);
}

export const stop = async (scriptProcessor: ScriptProcessorNode) => {
  console.log('detach')
  scriptProcessor.removeEventListener("audioprocess", handleTempo);
}