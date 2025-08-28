export enum Methods {
  Add = 0,
  Subtract = 1,
}

export interface BroyaleRPCClientToServer {
  add: (a: number, b: number) => Promise<number>;
  subtract: (a: number, b: number) => Promise<number>;
}
