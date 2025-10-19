declare module 'mailparser' {
  export interface ParsedMail {
    subject?: string;
    date?: Date;
    html?: string | false;
    text?: string | false;
    attachments?: Array<{ filename?: string; contentType?: string; contentDisposition?: string; content: Buffer }>;
  }

  export interface SimpleParserOptions {
    skipHtmlToText?: boolean;
    skipImageLinks?: boolean;
    formatDate?: boolean;
  }

  export function simpleParser(source: string | Buffer, options?: SimpleParserOptions): Promise<ParsedMail>;
}
