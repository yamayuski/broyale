import { type BroyaleRPCClientToServer, Methods } from "./rpc.ts";
import { decode, encode } from "cbor2";

function validateAddParams(params: unknown): params is [number] {
  return (
    Array.isArray(params) &&
    params.length === 1 &&
    typeof params[0] === "number"
  );
}

function validateDecoded(
  method: Methods,
  paramValidator: (params: unknown) => boolean,
  result: unknown,
): result is { method: Methods; params: number[] } {
  if (typeof result !== "object" || result === null) {
    return false;
  }
  if (!("method" in result) || !("params" in result)) {
    return false;
  }
  if (result.method !== method) {
    return false;
  }
  return paramValidator(result.params);
}

export class ClientRPC implements BroyaleRPCClientToServer {
  public constructor(
    private readonly readable: ReadableStream<Uint8Array>,
    private readonly writable: WritableStream<Uint8Array>,
  ) {}

  async add(a: number, b: number): Promise<number> {
    const payload = encode({
      method: Methods.Add,
      params: [a, b],
    });
    const writer = this.writable.getWriter();
    await writer.ready;
    writer.write(payload);
    await writer.close();
    const reader = this.readable.getReader();
    const { value } = await reader.read();
    reader.releaseLock();
    const result = decode(value!);
    if (validateDecoded(Methods.Add, validateAddParams, result)) {
      return result.params[0];
    }
    throw new Error("Invalid response");
  }
  async subtract(a: number, b: number): Promise<number> {
    return a - b;
  }
}
