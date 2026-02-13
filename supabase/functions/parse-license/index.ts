// Supabase Edge Function: Parse driver's license via Azure Document Intelligence
// Set secrets: supabase secrets set AZURE_DI_ENDPOINT=... AZURE_DI_KEY=...
// Create a Document Intelligence resource in Azure Portal, use prebuilt-idDocument model

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LicenseParseResult = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
};

function parseDateOfBirth(content: string | undefined): string | undefined {
  if (!content) return undefined;
  // Azure returns formats like "01 15 1990" or "1990-01-15" - try to parse
  const cleaned = content.replace(/\s/g, '-').replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$1-$2');
  const match = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/) || content.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    if (match[1].length === 4) {
      const [, y, m, d] = match;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const endpoint = Deno.env.get('AZURE_DI_ENDPOINT');
    const key = Deno.env.get('AZURE_DI_KEY');

    if (!endpoint || !key) {
      return new Response(
        JSON.stringify({ error: 'Azure Document Intelligence not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, mimeType = 'image/jpeg' } = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const baseUrl = endpoint.replace(/\/$/, '');
    // Try formrecognizer path (Form Recognizer / Document Intelligence resources)
    const analyzeUrl = `${baseUrl}/formrecognizer/documentModels/prebuilt-idDocument:analyze?api-version=2023-07-31`;

    const analyzeRes = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': mimeType,
      },
      body: binary,
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      console.error('Azure analyze error:', errText);
      return new Response(
        JSON.stringify({ error: 'License analysis failed', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const opLocation = analyzeRes.headers.get('Operation-Location');
    if (!opLocation) {
      return new Response(
        JSON.stringify({ error: 'No Operation-Location in response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: unknown = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await fetch(opLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': key },
      });
      const statusJson = (await statusRes.json()) as {
        status?: string;
        result?: unknown;
        analyzeResult?: unknown;
      };
      if (statusJson.status === 'succeeded') {
        result = statusJson.result ?? statusJson.analyzeResult;
        break;
      }
      if (statusJson.status === 'failed') {
        return new Response(
          JSON.stringify({ error: 'License analysis failed' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!result || typeof result !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Analysis timed out' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = result as {
      documents?: Array<{
        fields?: Record<string, { content?: string; valueString?: string; valueDate?: string }>;
      }>;
    };
    const doc = res.documents?.[0];
    const fields = doc?.fields ?? {};

    const getContent = (name: string) => {
      const f = fields[name];
      return f?.content ?? f?.valueString ?? (f?.valueDate ? String(f.valueDate) : undefined);
    };

    const parsed: LicenseParseResult = {};
    const fn = getContent('FirstName');
    const ln = getContent('LastName');
    if (fn) parsed.firstName = fn;
    if (ln) parsed.lastName = ln;

    const dobContent = getContent('DateOfBirth');
    if (dobContent) {
      parsed.dateOfBirth = parseDateOfBirth(dobContent);
    }

    const addr = getContent('Address') ?? getContent('DocumentAddress') ?? getContent('AddressStreet');
    const addrCity = getContent('AddressCity');
    if (addr) parsed.address = addr;
    if (addrCity) parsed.city = addrCity;

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
