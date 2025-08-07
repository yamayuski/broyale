import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Engine } from "@babylonjs/core/Engines/engine";

export async function createEngineAsync(
  canvas: HTMLCanvasElement,
): Promise<WebGPUEngine | Engine> {
  if (await WebGPUEngine.IsSupportedAsync) {
    const engine = new WebGPUEngine(canvas, {
      adaptToDeviceRatio: true,
      antialias: true,
      audioEngine: true,
    });
    await engine.initAsync();
    return engine;
  }
  const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    antialias: true,
    audioEngine: true,
  }, true);
  return engine;
}
