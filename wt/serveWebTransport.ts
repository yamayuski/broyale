export interface WebTransportOptions extends Deno.QuicServerTransportOptions {
  hostname?: string;
  port?: number;
  cert: string;
  key: string;
  alpnProtocols?: "h3"[];
  onQuicError?: (errror: unknown) => void;
  onWebTransportError?: (error: unknown) => void;
}

export type WebTransportSocket = WebTransport & { url: string };

export type WebTransportHandler = (wt: WebTransportSocket) => Promise<WebTransportCloseInfo | void | undefined>;

export async function serveWebTransport(
  options: WebTransportOptions,
  handler: WebTransportHandler,
): Promise<void> {
  const server = new Deno.QuicEndpoint({
    hostname: options.hostname,
    port: options.port,
  });
  const listener = server.listen({
    alpnProtocols: options.alpnProtocols ?? ["h3"],
    cert: options.cert,
    key: options.key,
    congestionControl: options.congestionControl,
    keepAliveInterval: options.keepAliveInterval,
    maxConcurrentBidirectionalStreams: options.maxConcurrentBidirectionalStreams,
    maxConcurrentUnidirectionalStreams: options.maxConcurrentUnidirectionalStreams,
    maxIdleTimeout: options.maxIdleTimeout,
    preferredAddressV4: options.preferredAddressV4,
    preferredAddressV6: options.preferredAddressV6,
  });

  console.info(`WebTransport server listening on https://${options.hostname ?? "127.0.0.1"}:${server.addr.port ?? options.port}`);

  Deno.addSignalListener("SIGINT", () => {
    console.info("Received SIGINT, shutting down...");
    listener.stop();
    server.close({
      closeCode: 1000,
      reason: "Server has received to shutdown",
    });
    Deno.exit(0);
  });

  while (true) {
    try {
      for await (const conn of listener) {
        const remote = `${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`;
        console.debug(`New QUIC connection established "${remote}"`);

        Deno.upgradeWebTransport(conn)
          .then(async (wt) => {
            await wt.ready;
            return wt;
          }).then(handler)
          .then((closeInfo) => {
            const info = closeInfo ?
              `code:${closeInfo.closeCode}, reason:${closeInfo.reason}` :
              `no closeInfo`;
            console.debug(`WebTransport connection "${remote}" was closed info: ${info}`);
          }).catch((error) => {
            console.error("Error handling WebTransport:", error);
            if (options.onWebTransportError) {
              options.onWebTransportError(error);
            }
          });
      }
    } catch (quicError) {
      console.error("Error handling QUIC connection:", quicError);
      if (options.onQuicError) {
        options.onQuicError(quicError);
      }
    }
  }
}
