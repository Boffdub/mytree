import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL')!;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const feedback = payload.record;

    let submitterLabel = feedback.user_id;
    try {
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: profile } = await adminClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', feedback.user_id)
        .single();
      if (profile?.first_name || profile?.last_name) {
        submitterLabel = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
      }
    } catch {
      // Fall back to the raw user_id if the profile lookup fails for any reason.
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyTree Feedback <onboarding@resend.dev>',
        to: NOTIFY_EMAIL,
        subject: `[MyTree] New ${feedback.category} report`,
        html: `
          <p><strong>From:</strong> ${submitterLabel}</p>
          <p><strong>Category:</strong> ${feedback.category}</p>
          <p><strong>Message:</strong></p>
          <p>${feedback.message}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const detail = await emailResponse.text();
      return new Response(JSON.stringify({ error: 'Resend request failed', detail }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
