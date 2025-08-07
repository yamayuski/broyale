import { Scene } from "@babylonjs/core/scene";
import { createEngineAsync } from "./createEngineAsync.ts";

function hexToArrayBuffer(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even length.");
  }

  const buffer = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  return buffer;
}

async function main() {
  const canvas = document.getElementById("root") as HTMLCanvasElement | null;
  if (!canvas || canvas.tagName !== "CANVAS") {
    console.error("Canvas element not found");
    return;
  }

  const engine = await createEngineAsync(canvas);
  if (!engine) {
    console.error("Failed to create engine");
    return;
  }

  globalThis.addEventListener("resize", () => {
    engine.resize();
  });

  const scene = new Scene(engine);
  engine.runRenderLoop(() => {
    scene.render();
  });

  const wt = new WebTransport("https://127.0.0.1:4433", {
    serverCertificateHashes: [
      {
        algorithm: "sha-256",
        value: hexToArrayBuffer(import.meta.env.VITE_CERT_HASH),
      }
    ]
  });
  await wt.ready;
  console.log("WebTransport ready");
  wt.close();
}

main();
