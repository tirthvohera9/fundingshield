import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* Server-side Supabase client (bypasses the browser guard in lib/supabase.ts) */
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  /* Always return 200 — telemetry failures must never propagate to the client */
  try {
    const body = (await req.json()) as {
      eventType?: string;
      data?: Record<string, unknown>;
      sessionId?: string;
      userId?: string | null;
      timestamp?: string;
    };

    const { eventType, data, sessionId, userId } = body;

    if (!eventType) {
      return NextResponse.json({ ok: true }); // silently drop malformed events
    }

    const sb = getServerSupabase();
    if (!sb) {
      // Supabase not configured (local dev without env vars) — drop silently
      return NextResponse.json({ ok: true });
    }

    const { error } = await sb.from('user_events').insert({
      session_id: sessionId ?? null,
      user_id: userId ?? null,
      event_type: eventType,
      event_data: data ?? {},
    });

    if (error) {
      // Log server-side for debugging, but never surface to client
      console.warn('[events] insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[events] route error:', err);
  }

  return NextResponse.json({ ok: true });
}
