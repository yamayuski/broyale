globalThis.addEventListener("load", () => {
  main().then((info) => {
    console.log("Main function completed:", info);
  }, (reason) => {
    console.error("Main function failed:", reason);
  });
});

let JSONRPCID = 1;

async function main() {
  const url = import.meta.env.VITE_API_URL;
  console.log(`API URL: ${url}`);
  const wt = new WebTransport(url);
  await wt.ready;
  console.log("WebTransport connection established");

  const { readable, writable } = await wt.createBidirectionalStream();

  const writer = writable.getWriter();
  await writer.ready;
  const rpc = {
    jsonrpc: "2.0",
    method: "subtract",
    params: [42, 23],
    id: JSONRPCID++,
  };
  console.log("Write JSON-RPC 2.0");
  writer.write(new TextEncoder().encode(`${JSON.stringify(rpc)}\n`));
  await writer.close();
  console.log("Writer closed");

  const reader = readable.getReader();
  let data = "";
  const decoder = new TextDecoder();
  while (true) {
    const response = await reader.read();
    data += decoder.decode(response.value);
    console.log("got data", response, data);
    if (response.done) {
      break;
    }
  }
  reader.releaseLock();

  for (const line of data.split("\n")) {
    if (line.trim().length === 0) {
      continue;
    }
    const msg = JSON.parse(line);
    console.log("Received message:", msg);
  }
  wt.close({
    closeCode: 0,
    reason: "done",
  });

  return wt.closed;
}
