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

/** Registry of content file name -> schema. Owner tasks register theirs here. */
export const CONTENT_FILES: Record<string, ZodType> = {
  'tactics.json': TacticsFileSchema,
  'cards.json': CardsFileSchema,
  'concepts.json': ConceptsFileSchema,
};

export function parseContent<T>(schema: ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const msg = result.error.issues
    .map((i) => `${file}: ${i.path.map(String).join('.')} ${i.message}`)
    .join('\n');
  throw new ContentError(msg);
}
