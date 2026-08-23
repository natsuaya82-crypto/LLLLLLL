// daily-prompt — the day's sentence, once a day, written by a model and put
// into `prompt` by the service role.
//
// Why this is a function on the server and not something the app does:
//
//   1. The key. The phone talks to Supabase directly and there is no server
//      of ours in front of it, so anything the app holds is public -- SB_KEY
//      in www/net.js says so in its own comment. A model's key cannot live
//      there. It lives in this function's environment and never leaves it.
//   2. Everybody gets the SAME sentence. That is the whole point: a feed of
//      two hundred unreadable scripts becomes two hundred readable ones
//      because everyone already knows what the day's sentence means. Two
//      hundred phones each asking a model would produce two hundred
//      sentences and none of that.
//   3. `prompt` has no insert policy. It cannot be written through the API at
//      all -- schema.sql says why: a prompt table anyone could write to is a
//      second posting surface with no author on it.
//
// It is idempotent per day: if the row is already there it does nothing and
// says so. Running it twice, or ten times, costs one model call at most.

const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ko', 'ja'];

/* The day, in US Pacific, decided by the owner on 2026-08-23:
   「日付はアメリカ時間の0時から」. Pacific rather than Eastern because that
   is the timezone Apple runs the App Store on, so every other date in this
   project's life already means Pacific.

   Done with Intl rather than by hand: this is Deno on the server, not the old
   WKWebView the www/ rules are about, and Intl knows when the clocks move.
   A fixed -08:00 would put the boundary an hour out for eight months a year. */
function pacificDay(now: Date): string {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return f.format(now);            // en-CA gives YYYY-MM-DD
}

/* What the model is allowed to come back with. This is the whole of the
   quality control, because nobody reads the sentence before everybody sees
   it -- so the constraints are in the schema, in the instruction, and in the
   check below, and a run that fails any of them writes nothing rather than
   writing something odd. 「プロンプトガチガチにして」 */
const SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(LANGS.map((l) => [l, { type: 'string' }])),
  required: LANGS,
};

const RULES = `You write one sentence a day for Lingua, an app where people
build their own languages. Everybody in the world sees the same sentence and
translates it into the language they invented, so the sentence has to be
translatable by somebody whose language has a few hundred words.

Write ONE sentence, then give it in all of these languages: ${LANGS.join(', ')}.

Hard rules. Break any of them and the day is wasted:
- ONE sentence. No question mark unless the sentence really is a question.
- Between 3 and 12 words in English.
- Everyday, concrete, physical, present or past tense. Something a person
  could have said out loud today.
- Only words a small invented language would plausibly have: weather, food,
  the body, family, animals, walking, sleeping, water, fire, the sky, tools.
- NO proper nouns. No place names, no brands, no people, no holidays.
- NO idioms, no wordplay, no metaphor, no rhyme. They do not survive
  translation and the whole point is that everybody means the same thing.
- NO politics, religion, war, death, illness, sex, money, or anything a
  parent would not want a child to translate.
- No emoji, no hashtags, no quotation marks, no line breaks, no markdown.
- Each translation must be natural in that language, not word-for-word from
  the English. Same meaning, however that language would say it.

Today is {DAY}. Do not write any of these, which have already been used:
{SEEN}`;

function bad(s: unknown): string | null {
  if (typeof s !== 'string') return 'not a string';
  const v = s.trim();
  if (!v) return 'empty';
  if (v.length > 120) return 'longer than 120 characters';
  if (/[\n\r]/.test(v)) return 'has a line break';
  if (/[#*_`|]/.test(v)) return 'has markup or a hashtag';
  if (/https?:\/\//i.test(v)) return 'has a link';
  return null;
}

Deno.serve(async (req: Request) => {
  /* Not a public button. The schedule knows the word; nobody else does.
     Without this, anybody who found the URL could spend the day's quota. */
  const want = Deno.env.get('CRON_SECRET') || '';
  if (!want || req.headers.get('x-cron-secret') !== want) {
    return new Response('no', { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const gem = Deno.env.get('GEMINI_API_KEY') || '';
  if (!gem) return new Response('GEMINI_API_KEY is not set', { status: 500 });

  const head = { apikey: key, Authorization: `Bearer ${key}`,
                 'Content-Type': 'application/json' };
  const day = pacificDay(new Date());

  /* Already there? Then this run has nothing to do. The unique on on_day
     would refuse the insert anyway; asking first is what keeps a second run
     from spending a model call to be refused. */
  const has = await fetch(`${url}/rest/v1/prompt?on_day=eq.${day}&select=id`,
                          { headers: head });
  if ((await has.json()).length) {
    return new Response(JSON.stringify({ day, already: true }), { status: 200 });
  }

  /* The last sixty, so the model can be told not to repeat itself. Sixty
     because that is two months and the list still fits in one instruction. */
  const past = await fetch(
    `${url}/rest/v1/prompt?select=text&order=on_day.desc&limit=60`,
    { headers: head });
  const seen = ((await past.json()) || []).map((r: { text: string }) => '- ' + r.text)
                                          .join('\n') || '- (nothing yet)';

  const ask = RULES.replace('{DAY}', day).replace('{SEEN}', seen);
  const gr = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + gem,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: ask }] }],
        generationConfig: {
          temperature: 1.0,
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
        },
      }) });
  if (!gr.ok) {
    return new Response('the model refused: ' + (await gr.text()), { status: 502 });
  }
  const raw = (await gr.json())?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let says: Record<string, string>;
  try { says = JSON.parse(raw); } catch { return new Response('not json: ' + raw, { status: 502 }); }

  /* Every language, or none. A row missing Korean is a Korean speaker seeing
     English tomorrow and nobody finding out. */
  const wrong: string[] = [];
  for (const l of LANGS) {
    const why = bad(says[l]);
    if (why) wrong.push(`${l}: ${why}`);
  }
  if (wrong.length) {
    return new Response('refused: ' + wrong.join('; '), { status: 422 });
  }
  for (const l of LANGS) says[l] = String(says[l]).trim();

  const put = await fetch(`${url}/rest/v1/prompt`, {
    method: 'POST',
    headers: { ...head, Prefer: 'return=representation' },
    body: JSON.stringify({ on_day: day, text: says.en, says }),
  });
  if (!put.ok) {
    return new Response('could not write it: ' + (await put.text()), { status: 500 });
  }
  return new Response(JSON.stringify({ day, wrote: says.en }), { status: 200 });
});
