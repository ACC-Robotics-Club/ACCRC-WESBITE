import { connect } from 'cloudflare:sockets';

/**
 * A minimal SMTP client that sends one message through Gmail.
 *
 * Gmail accepts SMTP on port 465 (implicit TLS) with an App Password, and
 * Cloudflare Workers can open outbound TCP sockets to it, so mail goes out
 * from the club's own Gmail account with no third-party mail service.
 */

export interface GmailCredentials {
  user: string;
  appPassword: string;
  fromName: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64(input: string): string {
  const bytes = encoder.encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Base64 body wrapped at 76 characters, as MIME requires. */
function base64Body(input: string): string {
  return base64(input).replace(/.{1,76}/g, '$&\r\n');
}

/** RFC 2047 encoded-word, so non-ASCII names and subjects survive. */
function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${base64(value)}?=`;
}

function buildMessage(from: GmailCredentials, message: MailMessage): string {
  const boundary = `accrc-${crypto.randomUUID()}`;
  const domain = from.user.split('@')[1] ?? 'gmail.com';
  return [
    `From: ${encodeHeader(from.fromName)} <${from.user}>`,
    `To: <${message.to}>`,
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(message.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export async function sendGmail(credentials: GmailCredentials, message: MailMessage): Promise<void> {
  // Header injection guard: an address must be a single plain line.
  if (/[\r\n<>]/.test(message.to)) throw new Error('Invalid recipient address.');

  const socket = connect({ hostname: 'smtp.gmail.com', port: 465 }, { secureTransport: 'on' });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  let buffer = '';

  /* Reads one (possibly multi-line) reply. The last line of a reply has a
     space after the code ("250 OK"); earlier lines have a dash ("250-SIZE"). */
  async function readReply(): Promise<{ code: number; text: string }> {
    for (;;) {
      const lines = buffer.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3}(?: |$)/.test(lines[i])) {
          const consumed = lines.slice(0, i + 1).join('\r\n') + '\r\n';
          buffer = buffer.slice(consumed.length);
          return { code: Number(lines[i].slice(0, 3)), text: consumed.trim() };
        }
      }
      const { value, done } = await reader.read();
      if (done) throw new Error('Gmail closed the connection unexpectedly.');
      buffer += decoder.decode(value, { stream: true });
    }
  }

  async function expect(codes: number[], line?: string, redacted?: string): Promise<void> {
    if (line !== undefined) await writer.write(encoder.encode(`${line}\r\n`));
    const reply = await readReply();
    if (!codes.includes(reply.code)) {
      throw new Error(`Gmail rejected ${redacted ?? line ?? 'the connection'}: ${reply.text}`);
    }
  }

  const conversation = (async () => {
    await expect([220]);
    await expect([250], 'EHLO accrc.pages.dev');
    await expect(
      [235],
      `AUTH PLAIN ${base64(`\u0000${credentials.user}\u0000${credentials.appPassword}`)}`,
      'AUTH PLAIN (credentials)',
    );
    await expect([250], `MAIL FROM:<${credentials.user}>`);
    await expect([250, 251], `RCPT TO:<${message.to}>`);
    await expect([354], 'DATA');
    // Base64 bodies never start a line with ".", but stuff dots anyway.
    const data = buildMessage(credentials, message).replace(/\r\n\./g, '\r\n..');
    await expect([250], `${data}\r\n.`, 'the message');
    await writer.write(encoder.encode('QUIT\r\n')).catch(() => undefined);
  })();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timed out talking to Gmail.')), 20_000),
  );

  try {
    await Promise.race([conversation, timeout]);
  } finally {
    await socket.close().catch(() => undefined);
  }
}
