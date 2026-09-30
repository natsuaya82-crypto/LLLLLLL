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
// says so. Running it twice, or ten times, writes one row -- and asks the
// model once, or up to four times when it answers that it is busy (below).
// What calls it every day is the daily-prompt schedule at the foot of
// supabase/schema.sql.

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

/* WHAT SHAPE TODAY'S SENTENCE TAKES. The rules below used to say 「present or
   past tense」 and the model chose the past every day -- 2026-09-26 to 30
   were all simple past, and a user said so: 「The prompts should include other
   TAM than just simple past」. 「もっと色々たくさん回そうよ。毎日変わるんだし
   色々なことできるんだし、たまに難しいのでもいいし」 OWNER 2026-09-30.
   So the shape is not the model's choice: the day picks it, in order, and
   every fifth day is a hard one. One list, one pick (shapeOf). */
const SHAPES = [
  'simple present, a habit (e.g. "The baker opens the shop every morning.")',
  'present progressive, happening right now',
  'simple past',
  'future (will / going to)',
  'present perfect (has / have done)',
  'past progressive (was doing when something happened)',
  'past perfect (had done before something else)',
  'future perfect or future progressive',
  'an imperative, telling someone to do something',
  'a polite request or offer (Could you... / Would you like...)',
  'a yes/no question',
  'a wh- question (who, what, where, when, why, how)',
  'a negative sentence',
  'a negative question (Did you not... / Is there no...)',
  'ability or possibility (can, could, may, might)',
  'obligation or advice (must, have to, should)',
  'a wish or desire (I want / I wish / I hope)',
  'a real condition (If it rains, ...)',
  'an unreal condition (If I had wings, I would...)',
  'the passive voice (The bread was eaten by...)',
  'a causative (She made him carry... / They let the dog...)',
  'a comparison (bigger than, as ... as)',
  'a superlative (the tallest, the oldest)',
  'a relative clause (the man who..., the tree that...)',
  'reported speech (She said that...)',
  'numbers and counting (three birds, the second day)',
  'possession (my sister\'s house, the dog\'s bone)',
  'a command to a group, or "let us..." (Let us go to the river.)',
  'an exclamation (How cold the water is!)',
  'giving a reason (because / so)',
  'two actions in sequence (first..., then...)',
  'something that almost happened, or did not happen yet (still / not yet / already)',
  'a question about the future (Will you come...?)',
  'describing a place: there is / there are',
  'a sentence about feelings or the senses (I feel / it smells / it sounds)',
];
function shapeOf(day: string): { shape: string; hard: boolean } {
  const n = Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000);
  const hard = n % 5 === 0;
  let shape = SHAPES[((n % SHAPES.length) + SHAPES.length) % SHAPES.length];
  if (hard) shape += ', and make it a HARD day: two clauses, or two of the grammar features above combined in one sentence';
  return { shape, hard };
}

const RULES = `You write one sentence a day for Lingua, an app where people
build their own languages. Everybody in the world sees the same sentence and
translates it into the language they invented, so the sentence has to be
translatable by somebody whose language has a few hundred words.

Write ONE sentence, then give it in all of these languages: ${LANGS.join(', ')}.

Hard rules. Break any of them and the day is wasted:
- ONE sentence. No question mark unless the sentence really is a question.
- Between 3 and {MAX} words in English.
- Everyday, concrete, physical. Something a person could have said out loud
  today.
- TODAY'S GRAMMAR SHAPE, and the sentence must clearly be this: {SHAPE}.
  The translations keep the same shape as far as each language allows.
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
  if (v.length > 180) return 'longer than 180 characters';
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
  const head = { apikey: key, Authorization: `Bearer ${key}`,
                 'Content-Type': 'application/json' };
  const day = pacificDay(new Date());

  /* EVERY ANSWER PAST THE DOOR IS KEPT, in `prompt_run` (supabase/schema.sql).
     On 2026-09-28 the 07:00 and 08:00 runs wrote no sentence and what this
     function had said was gone six hours later with pg_net's own record, so
     nobody could read why. One row per answer: the day, the status, the first
     500 characters of what it said. A row that cannot be written changes nothing about
     the answer -- keeping the reason must not cost the day its sentence. The
     door itself (401 above) is not kept: anybody holding the publishable key
     reaches it, and a table anybody can fill is not a record. */
  const answer = async (status: number, said: string): Promise<Response> => {
    try {
      await fetch(`${url}/rest/v1/prompt_run`, {
        method: 'POST', headers: head,
        body: JSON.stringify({ on_day: day, status, said: said.slice(0, 500) }),
      });
    } catch (_) { /* the answer below still goes */ }
    return new Response(said, { status });
  };
  try { return await ring(); }
  catch (e) { return await answer(500, 'threw: ' + String((e as Error)?.message || e)); }

  async function ring(): Promise<Response> {
    if (!gem) return await answer(500, 'GEMINI_API_KEY is not set');

    /* Already there? Then this run has nothing to do. The unique on on_day
       would refuse the insert anyway; asking first is what keeps a second run
       from spending a model call to be refused. */
    const has = await fetch(`${url}/rest/v1/prompt?on_day=eq.${day}&select=id`,
                            { headers: head });
    if ((await has.json()).length) {
      return await answer(200, JSON.stringify({ day, already: true }));
    }

    /* The last sixty, so the model can be told not to repeat itself. Sixty
       because that is two months and the list still fits in one instruction. */
    const past = await fetch(
      `${url}/rest/v1/prompt?select=text&order=on_day.desc&limit=60`,
      { headers: head });
    const seen = ((await past.json()) || []).map((r: { text: string }) => '- ' + r.text)
                                            .join('\n') || '- (nothing yet)';

    const sh = shapeOf(day);
    const ask = RULES.replace('{DAY}', day).replace('{SEEN}', seen)
                     .replace('{SHAPE}', sh.shape).replace('{MAX}', sh.hard ? '18' : '12');
    /* The model says 503 「high demand」 on some mornings -- 2026-09-27 16:00
       UTC was one, and that day had no sentence. 「毎日同じ時間に変わるように」
       OWNER 2026-09-27. So a busy answer is asked again, three times, a few
       seconds apart, inside the 60 seconds the schedule waits. Anything else is
       an answer and is not asked twice. */
    const ask1 = () => fetch(
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
    let gr = await ask1();
    for (let i = 0; i < 3 && (gr.status === 503 || gr.status === 429); i++) {
      await new Promise((r) => setTimeout(r, 5000 * (i + 1)));
      gr = await ask1();
    }
    if (!gr.ok) {
      return await answer(502, 'the model refused: ' + gr.status + ' ' + (await gr.text()));
    }
    const raw = (await gr.json())?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let says: Record<string, string>;
    try { says = JSON.parse(raw); } catch { return await answer(502, 'not json: ' + raw); }

    /* Every language, or none. A row missing Korean is a Korean speaker seeing
       English tomorrow and nobody finding out. */
    const wrong: string[] = [];
    for (const l of LANGS) {
      const why = bad(says[l]);
      if (why) wrong.push(`${l}: ${why}`);
    }
    if (wrong.length) {
      return await answer(422, 'refused: ' + wrong.join('; '));
    }
    for (const l of LANGS) says[l] = String(says[l]).trim();

    const put = await fetch(`${url}/rest/v1/prompt`, {
      method: 'POST',
      headers: { ...head, Prefer: 'return=representation' },
      body: JSON.stringify({ on_day: day, text: says.en, says }),
    });
    if (!put.ok) {
      return await answer(500, 'could not write it: ' + (await put.text()));
    }
    return await answer(200, JSON.stringify({ day, wrote: says.en }));
  }
});
