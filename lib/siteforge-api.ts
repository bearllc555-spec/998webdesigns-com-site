type RpcResult = Record<string, unknown>;

function siteforgeConfig() {
  const url = process.env.SITEFORGE_SUPABASE_URL?.trim();
  const anon = process.env.SITEFORGE_SUPABASE_ANON_KEY?.trim();
  const secret = process.env.SITEFORGE_WEBHOOK_SECRET?.trim();
  if (!url || !anon || !secret) {
    throw new Error("SiteForge env not configured (SITEFORGE_SUPABASE_URL / ANON_KEY / WEBHOOK_SECRET)");
  }
  return { url, anon, secret };
}

export async function siteforgeRpc(
  name: string,
  body: Record<string, unknown>
): Promise<RpcResult> {
  const { url, anon, secret } = siteforgeConfig();
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ p_webhook_secret: secret, ...body }),
  });
  const text = await res.text();
  let data: RpcResult;
  try {
    data = JSON.parse(text) as RpcResult;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`SiteForge RPC ${name} failed: ${res.status} ${text}`);
    (err as Error & { data?: unknown }).data = data;
    throw err;
  }
  return data;
}

export type SiteforgeJobBundle = {
  ok: boolean;
  job: {
    id: string;
    status: string;
    slug: string;
    preview_url: string | null;
    stripe_checkout_session_id?: string | null;
    client_feedback?: string | null;
  };
  lead: {
    id: string;
    email: string;
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
  };
};

export async function siteforgeGetJob(jobId: string): Promise<SiteforgeJobBundle> {
  return (await siteforgeRpc("siteforge_get_job", {
    p_job_id: jobId,
  })) as SiteforgeJobBundle;
}

export async function siteforgeApplyDecision(
  jobId: string,
  decision: "approve" | "changes",
  feedback?: string
) {
  return siteforgeRpc("siteforge_apply_decision", {
    p_job_id: jobId,
    p_decision: decision,
    p_feedback: feedback ?? null,
  });
}

export async function siteforgeMarkPaid(jobId: string, stripeSessionId: string) {
  return siteforgeRpc("siteforge_mark_paid", {
    p_job_id: jobId,
    p_stripe_session_id: stripeSessionId,
  });
}
