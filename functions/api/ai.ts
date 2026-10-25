/**
 * POST /api/ai  —  Cloudflare Pages Function (server side).
 *
 * Why this exists: a Gemini key must NEVER be inlined into the SPA bundle.
 * Keep it as a Pages secret and call it from the browser:
 *
 *   npx wrangler pages secret put GEMINI_API_KEY --project-name=pwparent
 *
 *   fetch('/api/ai', {
 *     method: 'POST',
 *     headers: {'Content-Type': 'application/json'},
 *     body: JSON.stringify({ prompt: 'Summarise this weekly report' }),
 *   })
 *
 * Uses plain fetch (no SDK) so Functions stay dependency-free.
 * Deleting the whole functions/ directory is safe — the SPA does not need it.
 */

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}

interface FnContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';

function corsHeaders(req: Request, env: Env): HeadersInit {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGIN ?? '';
  const sameSite =
    origin.endsWith('.pages.dev') ||
    origin.endsWith('.pwparent.app') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    (allowed && origin === allowed);
  return {
    'Access-Control-Allow-Origin': sameSite ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', ...extra},
  });
}

export async function onRequestPost(context: FnContext) {
  const {request, env} = context;
  const cors = corsHeaders(request, env);

  if (!env.GEMINI_API_KEY) {
    return json(
      {error: 'GEMINI_API_KEY is not set. Run: npx wrangler pages secret put GEMINI_API_KEY'},
      500, cors,
    );
  }

  type ChatTurn = {role: string; parts: {text: string}[]};
  let payload: {prompt?: string; system?: string; history?: ChatTurn[]} = {};
  try {
    payload = await request.json();
  } catch {
    return json({error: 'Request body must be valid JSON.'}, 400, cors);
  }

  const prompt = (payload.prompt ?? '').trim();
  if (!prompt) return json({error: '`prompt` is required.'}, 400, cors);
  if (prompt.length > 8000) return json({error: '`prompt` is too long (max 8000 chars).'}, 413, cors);

  const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    systemInstruction: payload.system ? {parts: [{text: payload.system}]} : undefined,
    contents: payload.history?.length
      ? [...payload.history, {role: 'user', parts: [{text: prompt}]}]
      : [{role: 'user', parts: [{text: prompt}]}],
    generationConfig: {temperature: 0.4, maxOutputTokens: 1024},
  };

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY},
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      // Never forward the upstream body blindly: it can echo request details.
      return json({error: `Gemini API error ${upstream.status}`, detail: text.slice(0, 400)}, 502, cors);
    }

    const data = JSON.parse(text) as {candidates?: {content?: {parts?: {text?: string}[]}}[]};
    const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return json({ok: true, model, text: answer}, 200, cors);
  } catch (error) {
    return json({error: 'Upstream request failed', detail: String(error)}, 502, cors);
  }
}

export async function onRequestGet(context: FnContext) {
  return json({ok: true, service: 'pwparent-ai', usage: 'POST /api/ai with {"prompt": "..."}'}, 200, corsHeaders(context.request, context.env));
}
