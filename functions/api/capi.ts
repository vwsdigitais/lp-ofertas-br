/**
 * functions/api/capi.ts — Cloudflare Pages Function
 * Recebe eventos do krobt.js e encaminha para a Meta Conversions API v19.0.
 * Usa waitUntil() para retornar 204 imediatamente (não bloqueia beacons).
 */

interface Env {
  PUBLIC_META_PIXEL_ID: string;
  META_CAPI_TOKEN: string;
  CAPI_SHARED_SECRET?: string;
  META_TEST_EVENT_CODE?: string;
}

interface EventContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

interface IncomingPayload {
  event_name?: unknown;
  event_id?: unknown;
  event_time?: unknown;
  event_source_url?: unknown;
  user_data?: unknown;
  custom_data?: unknown;
}

const ALLOWED_EVENTS = new Set(['ViewContent', 'Lead', 'PageView']);

async function sha256hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim();
    const val = part.slice(eqIndex + 1).trim();
    if (key) cookies[key] = decodeURIComponent(val);
  }
  return cookies;
}

async function sendToCapi(
  payload: IncomingPayload,
  request: Request,
  env: Env
): Promise<void> {
  const {
    event_name,
    event_id,
    event_time,
    event_source_url,
    custom_data,
  } = payload;

  const clientIp = request.headers.get('CF-Connecting-IP') ?? '';
  const userAgent = request.headers.get('User-Agent') ?? '';
  const cookies = parseCookies(request.headers.get('Cookie'));

  const fbp = cookies['_fbp'] ?? '';
  const fbc = cookies['_fbc'] ?? '';
  const krobEid = cookies['_krob_eid'] ?? '';

  const externalIdHash = krobEid ? await sha256hex(krobEid) : undefined;

  const userData: Record<string, unknown> = {
    client_ip_address: clientIp,
    client_user_agent: userAgent,
  };
  if (fbp) userData['fbp'] = fbp;
  if (fbc) userData['fbc'] = fbc;
  if (externalIdHash) userData['external_id'] = [externalIdHash];

  const eventEntry: Record<string, unknown> = {
    event_name: event_name,
    event_time: typeof event_time === 'number' ? event_time : Math.floor(Date.now() / 1000),
    event_id: event_id,
    action_source: 'website',
    event_source_url: event_source_url,
    user_data: userData,
  };

  if (
    custom_data !== null &&
    custom_data !== undefined &&
    typeof custom_data === 'object' &&
    Object.keys(custom_data as object).length > 0
  ) {
    eventEntry['custom_data'] = custom_data;
  }

  const capiPayload: Record<string, unknown> = {
    data: [eventEntry],
    access_token: env.META_CAPI_TOKEN,
  };

  // Só inclui test_event_code se a variável existir (ambiente de teste)
  if (env.META_TEST_EVENT_CODE) {
    capiPayload['test_event_code'] = env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v19.0/${env.PUBLIC_META_PIXEL_ID}/events`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(capiPayload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('[capi] Meta CAPI error:', resp.status, errText);
  }
}

export async function onRequestPost(context: EventContext): Promise<Response> {
  let payload: IncomingPayload;

  try {
    const text = await context.request.text();
    payload = JSON.parse(text) as IncomingPayload;
  } catch {
    return new Response(null, { status: 400 });
  }

  const eventName = payload.event_name;

  if (typeof eventName !== 'string' || !ALLOWED_EVENTS.has(eventName)) {
    return new Response(null, { status: 400 });
  }

  context.waitUntil(sendToCapi(payload, context.request, context.env));

  return new Response(null, { status: 204 });
}
