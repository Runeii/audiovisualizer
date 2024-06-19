import { Color } from "three";

export const int32ToColor = (v: number): Color => new Color(((v >> 24) & 0xff) / 0x80, ((v >> 16) & 0xff) / 0x80, ((v >> 8) & 0xff) / 0x80);

const loadBinary = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer;
};

export const loadBinaries = async (urls) => {
  const entries = await Promise.all(
    Object.entries(urls).map(async ([key, url]) => [key, await loadBinary(url)])
  );
  return Object.fromEntries(entries);
};