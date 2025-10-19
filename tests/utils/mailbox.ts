import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const mailHost = process.env.E2E_MAIL_HOST;
const mailPort = Number(process.env.E2E_MAIL_PORT ?? '993');
const mailUser = process.env.E2E_MAIL_USER;
const mailPassword = process.env.E2E_MAIL_PASSWORD;
const defaultSubject = process.env.E2E_MAIL_SUBJECT ?? 'Your Magic Link';
const defaultFolder = process.env.E2E_MAIL_FOLDER ?? 'INBOX';
const linkPatternSource = process.env.E2E_MAIL_LINK_REGEX;

export interface MagicLinkOptions {
  subject?: string | RegExp;
  timeoutMs?: number;
  pollIntervalMs?: number;
  since?: Date;
  linkPattern?: RegExp;
}

export interface MagicLinkEmail {
  subject: string;
  link: string;
  textBody: string;
  htmlBody?: string;
}

export function mailEnvironmentReady(): boolean {
  return Boolean(mailHost && mailUser && mailPassword);
}

function matchesSubject(filter: string | RegExp | undefined, actual: string): boolean {
  if (!filter) {
    return true;
  }

  if (filter instanceof RegExp) {
    return filter.test(actual);
  }

  return actual.toLowerCase().includes(filter.toLowerCase());
}

function buildLinkPattern(custom?: RegExp): RegExp {
  if (custom) {
    return custom;
  }

  if (linkPatternSource) {
    return new RegExp(linkPatternSource, 'i');
  }

  return /https?:\/\/[^\s"'<>]+/i;
}

function extractLinkFromBodies(bodies: string[], pattern: RegExp): string | undefined {
  for (const body of bodies) {
    const trimmed = body?.trim();
    if (!trimmed) {
      continue;
    }

    const match = trimmed.match(pattern);
    if (match && match[0]) {
      return match[0];
    }
  }

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForMagicLinkEmail(options: MagicLinkOptions = {}): Promise<MagicLinkEmail> {
  if (!mailEnvironmentReady()) {
    throw new Error('E2E mail environment variables are not fully configured.');
  }

  const {
    subject = defaultSubject,
    timeoutMs = 90_000,
    pollIntervalMs = 5_000,
    since = new Date(),
    linkPattern,
  } = options;

  const client = new ImapFlow({
    host: mailHost!,
    port: mailPort,
    secure: mailPort !== 143,
    auth: {
      user: mailUser!,
      pass: mailPassword!,
    },
    logger: false,
  });

  await client.connect();

  try {
    await client.mailboxOpen(defaultFolder);
    const status = await client.status(defaultFolder, { uidNext: true });
    let nextUid = status.uidNext ?? 1;
    const deadline = Date.now() + timeoutMs;
    const resolvedPattern = buildLinkPattern(linkPattern);

    while (Date.now() < deadline) {
      const range = `${nextUid}:*`;
      let sawMessages = false;

      for await (const message of client.fetch({ uid: range }, { uid: true, envelope: true, source: true })) {
        sawMessages = true;

        if (typeof message.uid === 'number' && message.uid >= nextUid) {
          nextUid = message.uid + 1;
        }

        const envelopeSubject = message.envelope?.subject ?? '';
        if (!matchesSubject(subject, envelopeSubject)) {
          continue;
        }

        const rawSource = message.source;
        if (!rawSource) {
          continue;
        }

        const parsed = await simpleParser(rawSource);
        const messageDate = parsed.date instanceof Date ? parsed.date : undefined;
        if (messageDate && messageDate.getTime() < since.getTime()) {
          continue;
        }

        const textBody = typeof parsed.text === 'string' ? parsed.text : '';
        const htmlBody = typeof parsed.html === 'string' ? parsed.html : undefined;
        const link = extractLinkFromBodies([textBody, htmlBody ?? ''], resolvedPattern);

        if (link) {
          return {
            subject: envelopeSubject,
            link,
            textBody,
            htmlBody,
          };
        }
      }

      if (!sawMessages) {
        await sleep(pollIntervalMs);
      }
    }

    throw new Error(`Magic link email not found within ${timeoutMs}ms.`);
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout errors
    }
  }
}
