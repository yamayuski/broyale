import { serveWebTransport } from "@broyale/wt/serveWebTransport";

const cert = Deno.readTextFileSync("../certs/localhost.pem");
const key = Deno.readTextFileSync("../certs/localhost-key.pem");
const hostname = "wt.broyale.localhost";
const port = 4433;

serveWebTransport(
  {
    hostname,
    cert,
    key,
    port,
  },
  async (wt) => {
    for await (const { readable, writable } of wt.incomingBidirectionalStreams) {
      let data = "";
      for await (const value of readable.pipeThrough(new TextDecoderStream())) {
        data += value;
        console.log(`Received: ${value}`);
        if (data.includes("\n")) {
          console.log("process start");
          for (const line of data.split("\n")) {
            if (line.trim().length === 0) {
              console.log("empty line");
              continue;
            }
            const request = JSON.parse(line);
            console.log(request);
            if (request.method === "subtract") {
              const [minuend, subtrahend] = request.params;
              const result = minuend - subtrahend;
              const response = {
                jsonrpc: "2.0",
                result,
                id: request.id,
              };
              const writer = writable.getWriter();
              await writer.ready;
              writer.write(new TextEncoder().encode(`${JSON.stringify(response)}\n`));
              await writer.close();
            }
        }
      }
    }
  }
});
