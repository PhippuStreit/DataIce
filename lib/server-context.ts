// Server-seitiger Request-Kontext: IP, Header, User-Agent-Parsing.

import { UAParser } from 'ua-parser-js';

export type ServerContext = {
  ipAddress: string | null;
  forwardedFor: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
  browserName: string | null;
  browserVersion: string | null;
  engineName: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  isBot: boolean;
};

const BOT_RE = /bot|crawler|spider|crawling|headless|preview|monitor|python-requests|curl|wget/i;

export function readServerContext(request: Request): ServerContext {
  const h = request.headers;
  const forwardedFor = h.get('x-forwarded-for');
  const ipAddress =
    forwardedFor?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    null;

  const userAgent = h.get('user-agent');
  const parsed = new UAParser(userAgent ?? undefined).getResult();

  return {
    ipAddress,
    forwardedFor: forwardedFor ?? null,
    userAgent: userAgent ?? null,
    acceptLanguage: h.get('accept-language'),
    browserName: parsed.browser.name ?? null,
    browserVersion: parsed.browser.version ?? null,
    engineName: parsed.engine.name ?? null,
    osName: parsed.os.name ?? null,
    osVersion: parsed.os.version ?? null,
    deviceType: parsed.device.type ?? 'desktop',
    deviceVendor: parsed.device.vendor ?? null,
    deviceModel: parsed.device.model ?? null,
    isBot: userAgent ? BOT_RE.test(userAgent) : false,
  };
}
