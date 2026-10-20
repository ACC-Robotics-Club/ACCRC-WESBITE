/* The slice of the Workers TCP sockets API the Gmail client uses. The full
   types live in @cloudflare/workers-types, which this Next project doesn't
   otherwise need. */
declare module 'cloudflare:sockets' {
  interface Socket {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    closed: Promise<void>;
    close(): Promise<void>;
  }

  export function connect(
    address: { hostname: string; port: number },
    options?: { secureTransport?: 'off' | 'on' | 'starttls'; allowHalfOpen?: boolean },
  ): Socket;
}
