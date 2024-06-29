import Meyda, { MeydaFeaturesObject } from "meyda";
import useStore from "../store";
import ValueTracker from "./ValueTracker";
import { MeydaAnalyzer } from "meyda/dist/esm/meyda-wa";
import { normalizeArray } from "../phobos/utils/utils";

const BUFFER_SIZE = 16384;

const normalize = (value: number, min: number, max: number) => {
  const result = (value - min) / (max - min);

  if (Number.isNaN(result)) {
    return 0;
  }

  return result;
};

const handleExtractors = (features: MeydaFeaturesObject, loudnessTracker: ValueTracker) => {
  /*
  // Normalise zcr
  const maxZcr = (BUFFER_SIZE / 2) - 1;
  const normalisedZcr = normalize(features.zcr, 0, maxZcr);

  // Normalise spectral centroid
  const normalisedSpectralCentroid = normalize(features.spectralCentroid, 0, BUFFER_SIZE);

  // Normalise loudness
  const loudness = features.loudness.total;
  if (loudness === 0) {
    loudnessTracker.clearValues();
  }

  loudnessTracker.addValue(loudness);
  const maxLoudness = loudnessTracker.getHighestValue();
  const minLoudness = loudnessTracker.getLowestValue();
  const normalisedLoudness = normalize(loudness, minLoudness, maxLoudness);

  // Calculate speed factor
  const speedFactor = (0.25 * normalisedZcr) + (0.5 * normalisedSpectralCentroid) + (0.5 * normalisedLoudness);
  console.log(features.loudness)
  */
  useStore.setState({
    loudness: normalizeArray([...features.loudness.specific]),
  });
}

let analyzer: MeydaAnalyzer;
export const start = async (source: MediaStreamAudioSourceNode) => {
  const loudnessTracker = new ValueTracker();

  analyzer = Meyda.createMeydaAnalyzer({
    audioContext: source.context,
    source: source,
    bufferSize: BUFFER_SIZE,
    featureExtractors: ["loudness"],
    callback: (features: MeydaFeaturesObject) => handleExtractors(features, loudnessTracker),
  });

  analyzer.start();
}

export const stop = () => {
  analyzer.stop();
}