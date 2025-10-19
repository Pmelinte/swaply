import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const loggingEnabled = process.env.AUTH_CALLBACK_LOGGING === '1';
const logDirectory = process.env.AUTH_CALLBACK_LOG_DIR ?? '.logs';
const logFileName = process.env.AUTH_CALLBACK_LOG_FILE ?? 'auth-callback.log';

async function appendLog(entry: unknown) {
  const dir = join(process.cwd(), logDirectory);
  await fs.mkdir(dir, { recursive: true });
  const file = join(dir, logFileName);
  await fs.appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function POST(request: Request) {
  if (!loggingEnabled) {
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 202 });
  }

  try {
    const body = await request.json();
    const entry = {
      ...body,
      receivedAt: new Date().toISOString(),
    };
    await appendLog(entry);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }
}

export async function GET() {
  if (!loggingEnabled) {
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 202 });
  }

  try {
    const dir = join(process.cwd(), logDirectory);
    const file = join(dir, logFileName);
    const content = await fs.readFile(file, 'utf8').catch(() => '');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 });
  }
}
