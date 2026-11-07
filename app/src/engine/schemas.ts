import { z, type ZodType } from 'zod';
import { CONCEPTS, TACTICS } from './types';

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
  }
}

export const LocalizedSchema = z.object({ ms: z.string().min(1), en: z.string().optional() });
export type Localized = z.infer<typeof LocalizedSchema>;

export const TacticSchema = z.enum(TACTICS);

export const TacticInfoSchema = z.object({
  code: TacticSchema,
  name: LocalizedSchema,
  does: LocalizedSchema,
  cue: LocalizedSchema,
  tip: LocalizedSchema,
});
export type TacticInfo = z.infer<typeof TacticInfoSchema>;
export const TacticsFileSchema = z.array(TacticInfoSchema);

export const SwipeCardSchema = z
  .object({
    id: z.string().min(1),
    channel: z.enum(['sms', 'chat', 'email']),
    sender: z.string().min(1),
    text: LocalizedSchema,
    answer: z.enum(['scam', 'legit']),
    tactics: z.array(TacticSchema),
    why: LocalizedSchema,
  })
  .superRefine((card, ctx) => {
    if (card.answer === 'legit' && card.tactics.length !== 0) {
      ctx.addIssue({ code: 'custom', path: ['tactics'], message: 'legit card must have no tactics' });
    }
    if (card.answer === 'scam' && card.tactics.length < 1) {
      ctx.addIssue({ code: 'custom', path: ['tactics'], message: 'scam card needs at least one tactic' });
    }
  });
export type SwipeCard = z.infer<typeof SwipeCardSchema>;
export const CardsFileSchema = z.array(SwipeCardSchema);

export const ConceptSchema = z.enum(CONCEPTS);

/**
 * Money card (D25, SDS 4.3): a true/false statement or a pick of two options. Any rate in the text says "contoh";
 * a card never recommends a product, and names no real scheme (those live only in concepts.json, D27).
 */
const moneyHead = {
  id: z.string().min(1), concept: ConceptSchema, text: LocalizedSchema, why: LocalizedSchema,
  /** Set on a card that states a rate or % figure (CLAUDE.md rule 11). */
  verify: z.literal('TODO-VERIFY').optional(),
};
export const MoneyCardSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...moneyHead, kind: z.literal('truefalse'), answer: z.boolean() }),
  z.strictObject({
    ...moneyHead,
    kind: z.literal('pick'),
    options: z.tuple([LocalizedSchema, LocalizedSchema]),
    better: z.union([z.literal(0), z.literal(1)]),
  }),
]);
export type MoneyCard = z.infer<typeof MoneyCardSchema>;
export const MoneyCardsFileSchema = z.array(MoneyCardSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((c, i) => {
    if (seen.has(c.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `duplicate money card id "${c.id}"` });
    seen.add(c.id);
  });
});

/**
 * Kad Ilmu text that may carry a figure. Any object with a % figure or a `rate` needs `verify: "TODO-VERIFY"`
 * or a `source` (checked by the content checker, CLAUDE.md rule 11); `year` names the year of the figure.
 */
export const FigureTextSchema = LocalizedSchema.extend({
  verify: z.literal('TODO-VERIFY').optional(),
  source: z.string().min(1).optional(),
  year: z.number().int().optional(),
});

/** One Kad Ilmu per finance concept (D23, UI-SPEC S21). Real scheme names are allowed only in this file (D27). */
export const ConceptInfoSchema = z.object({
  code: ConceptSchema,
  name: LocalizedSchema,
  /** "Apa itu": two sentences. */
  apa: FigureTextSchema,
  /** "Contoh": one worked example with numbers, labelled "contoh". */
  contoh: FigureTextSchema,
  /** "Di dunia sebenar": real product types and scheme names, never a recommendation. */
  duniaSebenar: FigureTextSchema,
  /** "Cara semak": where to check, text only. */
  caraSemak: FigureTextSchema,
});
export type ConceptInfo = z.infer<typeof ConceptInfoSchema>;
export const ConceptsFileSchema = z.array(ConceptInfoSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((c, i) => {
    if (seen.has(c.code)) ctx.addIssue({ code: 'custom', path: [i, 'code'], message: `duplicate concept "${c.code}"` });
    seen.add(c.code);
  });
  for (const code of CONCEPTS) {
    if (!seen.has(code)) ctx.addIssue({ code: 'custom', path: [], message: `missing Kad Ilmu for concept "${code}"` });
  }
});

/** One semester week (D20, SDS 5.3). `scenario` ids are not checked against existing scenarios here. */
export const WeekDefSchema = z.object({
  week: z.number().int().min(1).max(12),
  scenario: z.string().min(1).nullable(),
  context: LocalizedSchema,
  costs: z.array(z.object({ label: LocalizedSchema, amount: z.number().nonnegative() })),
});
export type WeekDef = z.infer<typeof WeekDefSchema>;
export const SemesterFileSchema = z.object({ weeks: z.array(WeekDefSchema).length(12) }).superRefine((f, ctx) => {
  f.weeks.forEach((w, i) => {
    if (w.week !== i + 1) ctx.addIssue({ code: 'custom', path: ['weeks', i, 'week'], message: `expected week ${i + 1}` });
  });
});

/**
 * A fake in-game web page (S06 `ui:link`, Task 15), keyed by its `.test` host. Fields are pre-filled fake data
 * shown read-only (CLAUDE.md rule 2); `asksTac` makes the page's button lead to the BankKu TAC screen.
 */
export const FakePageSchema = z.object({
  title: LocalizedSchema,
  body: LocalizedSchema,
  fields: z.array(z.object({ label: LocalizedSchema, value: z.string().min(1) })),
  button: LocalizedSchema,
  asksTac: z.boolean(),
});
export type FakePageDef = z.infer<typeof FakePageSchema>;
/** In-game hosts only: lowercase labels ending in `.test`, no scheme or path. */
export const PAGE_HOST_RE = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.test$/;
export const PagesFileSchema = z.record(z.string(), FakePageSchema).superRefine((pages, ctx) => {
  for (const host of Object.keys(pages)) {
    if (!PAGE_HOST_RE.test(host)) ctx.addIssue({ code: 'custom', path: [host], message: `page host "${host}" must be a bare <name>.test host` });
  }
});

/**
 * Kalkulator presets (D21, Task 18): numbers a scenario's `# ui:calc:<tab>:<id>` pre-fills. Rates are percents as
 * typed in the app (18 = 18%); `flat` and `fee` are mutually exclusive.
 */
const PRESET_ID_RE = /^[a-z0-9_-]+$/;
const nonNeg = z.number().nonnegative().max(1_000_000_000);
const MasaInputsSchema = z.strictObject({ monthly: nonNeg, rate: nonNeg, startAge: z.number().int().min(0).max(100), endAge: z.number().int().min(0).max(100) });
const PulanganInputsSchema = z.strictObject({ promised: nonNeg, period: z.enum(['hari', 'minggu', 'bulan', 'tahun']) });
const KosInputsSchema = z
  .strictObject({ amount: nonNeg, months: z.number().int().min(1).max(120), flat: nonNeg.optional(), fee: nonNeg.optional() })
  .refine((i) => (i.flat === undefined) !== (i.fee === undefined), { message: 'give exactly one of flat or fee' });
const presetHead = { id: z.string().regex(PRESET_ID_RE), label: LocalizedSchema };
export const CalcPresetSchema = z.discriminatedUnion('tab', [
  z.strictObject({ ...presetHead, tab: z.literal('masa'), inputs: MasaInputsSchema }),
  z.strictObject({ ...presetHead, tab: z.literal('pulangan'), inputs: PulanganInputsSchema }),
  z.strictObject({ ...presetHead, tab: z.literal('kos'), inputs: KosInputsSchema }),
]);
export type CalcPreset = z.infer<typeof CalcPresetSchema>;
export const CalcPresetsFileSchema = z.array(CalcPresetSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((p, i) => {
    if (seen.has(p.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `duplicate preset id "${p.id}"` });
    seen.add(p.id);
  });
});

/**
 * Latihan Tindakan (Task 27, UI-SPEC S16). `semak.accounts` are in-game fictional numbers only ("0000-0000-0NNN").
 * Real names allowed in the copy: NSRC, 997, Semak Mule (the correct actions); anything else stays banned.
 */
export const FICTIONAL_ACCOUNT_RE = /^0000-0000-0\d{3}$/;
export const DrillsFileSchema = z.strictObject({
  call997: z.strictObject({
    steps: z.array(LocalizedSchema).min(1),
    checklist: z.array(LocalizedSchema).min(1),
    why: LocalizedSchema,
  }),
  semak: z.strictObject({
    accounts: z.array(z.strictObject({
      number: z.string().regex(FICTIONAL_ACCOUNT_RE, 'must be a fictional 0000-0000-0NNN account'),
      reports: z.number().int().min(0),
    })).min(1),
    hint: LocalizedSchema,
  }),
  actions: z.array(z.strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: LocalizedSchema,
    stars: z.number().int().min(1),
  })).min(1),
}).superRefine((f, ctx) => {
  const seen = new Set<string>();
  f.actions.forEach((a, i) => {
    if (seen.has(a.id)) ctx.addIssue({ code: 'custom', path: ['actions', i, 'id'], message: `duplicate action id "${a.id}"` });
    seen.add(a.id);
  });
  const nums = new Set<string>();
  f.semak.accounts.forEach((a, i) => {
    if (nums.has(a.number)) ctx.addIssue({ code: 'custom', path: ['semak', 'accounts', i, 'number'], message: `duplicate account "${a.number}"` });
    nums.add(a.number);
  });
});
export type DrillsFile = z.infer<typeof DrillsFileSchema>;

/** Registry of content file name -> schema. Owner tasks register theirs here. */
export const CONTENT_FILES: Record<string, ZodType> = {
  'tactics.json': TacticsFileSchema,
  'cards.json': CardsFileSchema,
  'money-cards.json': MoneyCardsFileSchema,
  'concepts.json': ConceptsFileSchema,
  'semester.json': SemesterFileSchema,
  'pages.json': PagesFileSchema,
  'calc-presets.json': CalcPresetsFileSchema,
  'drills.json': DrillsFileSchema,
};

export function parseContent<T>(schema: ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const msg = result.error.issues
    .map((i) => `${file}: ${i.path.map(String).join('.')} ${i.message}`)
    .join('\n');
  throw new ContentError(msg);
}
