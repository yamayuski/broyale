// see https://gist.github.com/guest271314/c1974f24fff86fe4708f901651be8079

const cert = Deno.readTextFileSync("/certs/localhost.pem");
const key = Deno.readTextFileSync("/certs/localhost-key.pem");

async function createCertHash(cert: string): Promise<string> {
  const base64 = cert.split("\n").slice(1, -2).join("");
  const bytes = await (await fetch(`data:application/octet-stream;base64,${base64}`)).bytes();
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const certHash = await createCertHash(cert);

console.log(`Add VITE_CERT_HASH=${certHash.toString()} to .env`);

const server = new Deno.QuicEndpoint({
  hostname: "wt.broyale.localhost",
  port: 4433,
});
const listener = server.listen({
  alpnProtocols: ["h3"],
  cert: Deno.readTextFileSync("/certs/localhost.pem"),
  key: Deno.readTextFileSync("/certs/localhost-key.pem"),
});

async function handle(wt: WebTransport & { url: string }) {
  try {
    console.log(wt);
    await wt.ready;
    for await (const { readable, writable } of wt.incomingBidirectionalStreams) {
      for await (const value of readable.pipeThrough(new TextDecoderStream())) {
        console.log(`Received: ${value}`);
        await new Response(value.toUpperCase()).body?.pipeTo(writable, { preventClose: true});
      }
      await writable.close();
      console.log("Stream closed");

      wt.close();
      break;
    }
  } catch (error) {
    console.error("Error handling WebTransport:", error);
    if (wt && !wt.closed) {
      wt.close();
      console.log("WebTransport closed due to error");
    }
  }
  return wt.closed;
}

for await (const conn of listener) {
  console.log("New connection established");

  const wt = await Deno.upgradeWebTransport(conn);

  try {
    await handle(wt);
  } catch (error) {
    console.error("Error handling WebTransport:", error);
  }
}

server.close();
